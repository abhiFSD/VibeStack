import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Row, Col, Button, Badge, Accordion, Modal, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { API, Auth, Storage } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCalendarAlt, faPaperclip, faInfoCircle, faCheck, faUser, faList } from '@fortawesome/free-solid-svg-icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ActionItemModal from '../shared/ActionItemModal';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOrganization } from '../../contexts/OrganizationContext';
import { handleActionItemCompleteAward } from '../../utils/awards';
import { 
  sendActionItemCompletedNotification,
  sendActionItemStatusChangedNotification
} from '../../utils/emailNotifications';
import UserAvatar from '../shared/UserAvatar';

const COLUMNS = {
  'To Do': 0,
  'In Progress': 1,
  'In Review': 2,
  'Done': 3
};

const COLUMN_COLORS = {
  'To Do': {
    header: 'green',
    border: '#00800040',
    background: '#00800010'
  },
  'In Progress': {
    header: 'orange',
    border: '#ffa50040',
    background: '#ffa50010'
  },
  'In Review': {
    header: 'blue',
    border: '#0000ff40',
    background: '#0000ff10'
  },
  'Done': {
    header: 'lightgreen',
    border: '#90ee9040',
    background: '#90ee9010'
  }
};

const COLUMN_INFO = {
  'To Do': {
    name: 'To Do',
    description: [
      'Assignor: Owner/Creator of Action Item.',
      'Assignee: Person(s) assigned to complete the Action Item.',
      'To Do - Action Item created.',
      'The Action Item is created and will reside here until the Assignee receives the Action Item.'
    ].join('\n'),
  },
  'In Progress': {
    name: 'In Progress',
    description: [
      'Assignor: Owner/Creator of Action Item.',
      'Assignee: Person(s) assigned to complete the Action Item.',
      'In Progress - Action Item received by the Assignee.',
      'The Assignee will work on the Action Item and once completed be placed in the In Review bucket to allow the Assignor to ensure it is completed as desired.'
    ].join('\n'),
  },
  'In Review': {
    name: 'In Review',
    description: [
      'Assignor: Owner/Creator of Action Item.',
      'Assignee: Person(s) assigned to complete the Action Item.',
      'In Review - Action Item checked.',
      'The Assignor will ensure the Action Item is completed and move it to Done, or if not completed, make comments and place back to In Progress.'
    ].join('\n'),
  },
  'Done': {
    name: 'Done',
    description: [
      'Assignor: Owner/Creator of Action Item.',
      'Assignee: Person(s) assigned to complete the Action Item.',
      'Done - Action Items completed.',
      'The Assignor moves the Action Items to Done once they are satisfied that it has be completed.'
    ].join('\n'),
  },
};

const ActionItems = () => {
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const { reportId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeOrganization } = useOrganization();
  const [assigneeNames, setAssigneeNames] = useState({});
  const [creatorNames, setCreatorNames] = useState({});

  useEffect(() => {
    if (activeOrganization?.id) {
      // Run all initial fetches in parallel for better performance
      Promise.all([
        initializeEmailTemplatesAndAwards(),
        fetchReports(),
        fetchProjects()
      ]).catch(error => {
        console.error('Error in initial data fetch:', error);
      });
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    if (reports.length > 0) {
      if (reportId) {
        // If reportId is in URL, initially select only that report
        const reportExists = reports.some(report => report.id === reportId);
        if (reportExists) {
          setSelectedReportIds([reportId]);
        } else {
          // If report ID is invalid, redirect to main action items page
          navigate('/action-items');
        }
      } else {
        // If no reportId in URL, select all reports
        setSelectedReportIds(reports.map(report => report.id));
      }
    }
  }, [reports, reportId, navigate]);

  useEffect(() => {
    // Set loading to false if there are no reports and projects
    if (reports.length === 0 && projects.length === 0) {
      setLoading(false);
      return;
    }

    // If there are reports or projects but none selected, fetch all action items
    if ((selectedReportIds.length > 0 || selectedProjectIds.length > 0)) {
      fetchActionItems();
    } else if (reports.length > 0 || projects.length > 0) {
      fetchActionItems();
    }
  }, [selectedReportIds, selectedProjectIds, reports.length, projects.length]);

  // Check for selected action item from navigation state
  useEffect(() => {
    if (location.state?.selectedActionItemId && actionItems.length > 0) {
      const actionItemExists = actionItems.some(item => item.id === location.state.selectedActionItemId);
      if (actionItemExists) {
        setSelectedActionItemId(location.state.selectedActionItemId);
        setShowModal(true);
        // Clear the state to prevent reopening on page refresh
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state, actionItems, navigate, location.pathname]);

  // Check for selected action item from URL query parameters
  useEffect(() => {
    if (actionItems.length > 0) {
      const urlParams = new URLSearchParams(location.search);
      const selectedId = urlParams.get('selected');
      
      if (selectedId) {
        const actionItemExists = actionItems.some(item => item.id === selectedId);
        if (actionItemExists) {
          setSelectedActionItemId(selectedId);
          setShowModal(true);
          // Clear the query parameter to clean up the URL
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('selected');
          navigate(newUrl.pathname, { replace: true });
        }
      }
    }
  }, [actionItems, location.search, navigate]);

  const initializeEmailTemplatesAndAwards = async () => {
    try {
      // First, get existing templates
      const templatesResult = await API.graphql({
        query: queries.listEmailTemplates,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }
      });

      const existingTemplates = templatesResult.data.listEmailTemplates.items;
      const templateTypes = existingTemplates.map(template => template.type);

      // Create ACTION_ITEM_COMPLETED template if it doesn't exist
      if (!templateTypes.includes('ACTION_ITEM_COMPLETED')) {
        await API.graphql({
          query: mutations.createEmailTemplate,
          variables: {
            input: {
              type: 'ACTION_ITEM_COMPLETED',
              subject: 'Action Item Completed: {{actionItemTitle}}',
              htmlTemplate: `
                <h2>Action Item Completed</h2>
                <p>The action item "{{actionItemTitle}}" has been marked as completed.</p>
                <p><strong>Description:</strong> {{actionItemDescription}}</p>
                <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
                <div style="margin: 20px 0;">
                  <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">View Action Item</a>
                </div>
                <p>You can view all your action items <a href="{{actionItemsURL}}">here</a>.</p>
              `,
              organizationID: activeOrganization.id,
              isEnabled: true
            }
          }
        });
      }

      // Create ACTION_ITEM_STATUS_CHANGED template if it doesn't exist
      if (!templateTypes.includes('ACTION_ITEM_STATUS_CHANGED')) {
        await API.graphql({
          query: mutations.createEmailTemplate,
          variables: {
            input: {
              type: 'ACTION_ITEM_STATUS_CHANGED',
              subject: 'Action Item Status Changed: {{actionItemTitle}}',
              htmlTemplate: `
                <h2>Action Item Status Update</h2>
                <p>The status of action item "{{actionItemTitle}}" has been updated to "{{status}}".</p>
                <p><strong>Description:</strong> {{actionItemDescription}}</p>
                <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
                <div style="margin: 20px 0;">
                  <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">View Action Item</a>
                </div>
              `,
              organizationID: activeOrganization.id,
              isEnabled: true
            }
          }
        });
      }

      // Create ACTION_ITEM_ASSIGNED template if it doesn't exist
      if (!templateTypes.includes('ACTION_ITEM_ASSIGNED')) {
        await API.graphql({
          query: mutations.createEmailTemplate,
          variables: {
            input: {
              type: 'ACTION_ITEM_ASSIGNED',
              subject: 'New Action Item Assigned: {{actionItemTitle}}',
              htmlTemplate: `
                <h2>New Action Item Assigned</h2>
                <p>You have been assigned to the action item "{{actionItemTitle}}".</p>
                <p><strong>Description:</strong> {{actionItemDescription}}</p>
                <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
                <div style="margin: 20px 0;">
                  <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">View Action Item</a>
                </div>
              `,
              organizationID: activeOrganization.id,
              isEnabled: true
            }
          }
        });
      }

      // Create ACTION_ITEM_CREATED template if it doesn't exist
      if (!templateTypes.includes('ACTION_ITEM_CREATED')) {
        await API.graphql({
          query: mutations.createEmailTemplate,
          variables: {
            input: {
              type: 'ACTION_ITEM_CREATED',
              subject: 'New Action Item Created: {{actionItemTitle}}',
              htmlTemplate: `
                <h2>New Action Item Created</h2>
                <p>You have created a new action item "{{actionItemTitle}}".</p>
                <p><strong>Description:</strong> {{actionItemDescription}}</p>
                <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
                <div style="margin: 20px 0;">
                  <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">View Action Item</a>
                </div>
              `,
              organizationID: activeOrganization.id,
              isEnabled: true
            }
          }
        });
      }

    } catch (error) {
      console.error('Error initializing email templates and awards:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Function to fetch all pages for a given filter
      const fetchAllPages = async (filter) => {
        let items = [];
        let nextToken = null;
        do {
          const result = await API.graphql({
            query: queries.listProjects,
            variables: {
              filter,
              limit: 1000, // Increased limit to reduce round trips
              nextToken
            }
          });
          items = [...items, ...result.data.listProjects.items];
          nextToken = result.data.listProjects.nextToken;
        } while (nextToken);
        return items;
      };
      
      // Fetch projects where user is the owner
      const ownedProjects = await fetchAllPages({
        owner: { eq: user.attributes.sub },
        organizationID: { eq: activeOrganization?.id },
        _deleted: { ne: true }
      });

      // Fetch projects where user is a member (via ProjectMember table)
      const memberResult = await API.graphql({
        query: queries.listProjectMembers,
        variables: {
          filter: {
            userSub: { eq: user.attributes.sub },
            _deleted: { ne: true }
          },
          limit: 1000
        }
      });

      // Get project details for member projects
      const memberProjectPromises = memberResult.data.listProjectMembers.items.map(async (member) => {
        try {
          const projectResult = await API.graphql({
            query: queries.getProject,
            variables: { id: member.projectID }
          });
          return projectResult.data.getProject;
        } catch (error) {
          console.error('Error fetching member project:', error);
          return null;
        }
      });

      const memberProjects = (await Promise.all(memberProjectPromises))
        .filter(project => project && 
                           project.organizationID === activeOrganization?.id && 
                           !project._deleted);

      // Combine owned and member projects, removing duplicates
      const allProjects = [...ownedProjects, ...memberProjects];
      const uniqueProjects = Array.from(new Map(allProjects.map(project => [project.id, project])).values());
      
      // Filter out deleted projects
      const fetchedProjects = uniqueProjects.filter(item => !item._deleted);
      setProjects(fetchedProjects);
      // Initially select all projects
      setSelectedProjectIds(fetchedProjects.map(project => project.id));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Function to fetch all pages for a given filter
      const fetchAllPages = async (filter) => {
        let items = [];
        let nextToken = null;
        do {
          const result = await API.graphql({
            query: queries.listReports,
            variables: {
              filter,
              limit: 1000, // Increased limit to reduce round trips
              nextToken
            }
          });
          items = [...items, ...result.data.listReports.items];
          nextToken = result.data.listReports.nextToken;
        } while (nextToken);
        return items;
      };
      
      // Fetch both owned reports and assigned reports in parallel
      const [ownedReports, assignedReports] = await Promise.all([
        fetchAllPages({
          user_sub: { eq: user.attributes.sub },
          organizationID: { eq: activeOrganization?.id },
          _deleted: { ne: true }
        }),
        fetchAllPages({
          assignedMembers: { contains: user.attributes.sub },
          organizationID: { eq: activeOrganization?.id },
          _deleted: { ne: true }
        })
      ]);

      // Combine and deduplicate reports
      const allReports = [...ownedReports, ...assignedReports];
      const uniqueReports = Array.from(new Map(allReports.map(report => [report.id, report])).values());
      
      // Filter out deleted reports
      const fetchedReports = uniqueReports.filter(item => !item._deleted);
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchAssigneeNames = async (items) => {
    if (!items || !items.length) return;
    
    // Gather all assignee user_sub values
    const uniqueAssigneeSubs = [...new Set(
      items.flatMap(item => item.assignees || [])
    )].filter(Boolean);
    
    // Gather all creator user_sub values
    const uniqueCreatorSubs = [...new Set(
      items.map(item => item.user_sub)
    )].filter(Boolean);
    
    // Combine all user subs to fetch in one request
    const allUniqueUserSubs = [...new Set([...uniqueAssigneeSubs, ...uniqueCreatorSubs])].filter(Boolean);
    
    if (allUniqueUserSubs.length === 0) return;
    
    try {
      // Batch request all organization members at once
      const result = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization?.id },
            _deleted: { ne: true }
          },
          limit: 1000 // Get all members in one call
        }
      });
      
      const allMembers = result.data.listOrganizationMembers.items;
      const namesMap = {};
      
      // Map user subs to names from the batch result
      allUniqueUserSubs.forEach(sub => {
        const member = allMembers.find(m => m.userSub === sub);
        namesMap[sub] = member ? (member.name || member.email || sub) : sub;
      });
      
      // Set both assignee names and creator names with the same data
      setAssigneeNames(namesMap);
      setCreatorNames(namesMap);
    } catch (error) {
      console.error('Error fetching user names:', error);
    }
  };

  const fetchActionItems = async () => {
    setLoading(true);
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Function to fetch all pages for a given filter
      const fetchAllPages = async (filter) => {
        let items = [];
        let nextToken = null;
        do {
          const result = await API.graphql({
            query: queries.listActionItems,
            variables: {
              filter,
              limit: 1000, // Increased limit to reduce round trips
              nextToken
            }
          });
          items = [...items, ...result.data.listActionItems.items];
          nextToken = result.data.listActionItems.nextToken;
        } while (nextToken);
        return items;
      };

      // If no filters are selected, clear the action items and exit early
      if (selectedReportIds.length === 0 && selectedProjectIds.length === 0) {
        setActionItems([]);
        setLoading(false);
        return;
      }

      // Prepare all fetch promises
      const fetchPromises = [];

      // Create promises for selected reports
      selectedReportIds.forEach(reportId => {
        fetchPromises.push(
          fetchAllPages({
            reportID: { eq: reportId },
            user_sub: { eq: user.attributes.sub },
            note: { eq: false },
            _deleted: { ne: true }
          }),
          fetchAllPages({
            reportID: { eq: reportId },
            assignees: { contains: user.attributes.sub },
            note: { eq: false },
            _deleted: { ne: true }
          })
        );
      });

      // Create promises for selected projects
      selectedProjectIds.forEach(projectId => {
        fetchPromises.push(
          fetchAllPages({
            projectID: { eq: projectId },
            user_sub: { eq: user.attributes.sub },
            note: { eq: false },
            _deleted: { ne: true }
          }),
          fetchAllPages({
            projectID: { eq: projectId },
            assignees: { contains: user.attributes.sub },
            note: { eq: false },
            _deleted: { ne: true }
          })
        );
      });

      // Execute all fetches in parallel
      const allResults = await Promise.all(fetchPromises);
      const allItems = allResults.flat();

      // Remove duplicates based on ID
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.id, item])).values()
      );
      
      setActionItems(uniqueItems);
      setLoading(false);
      
      // Defer assignee names fetching to avoid blocking the UI
      fetchAssigneeNames(uniqueItems);
      
    } catch (error) {
      console.error('Error fetching action items:', error);
      setLoading(false);
    }
  };

  const handleReportToggle = (id) => {
    setSelectedReportIds(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(reportId => reportId !== id)
        : [...prev, id];
      
      return newSelection;
    });
  };

  const handleProjectToggle = (id) => {
    setSelectedProjectIds(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(projectId => projectId !== id)
        : [...prev, id];
      
      return newSelection;
    });
  };

  const updateActionItemStatus = async (itemId, newStatus) => {
    try {
      const item = actionItems.find(item => item.id === itemId);
      const oldStatus = item.status;

      // Only proceed if status has actually changed
      if (oldStatus === newStatus) return;

      // Add item to updating set
      setUpdatingItems(prev => new Set([...prev, itemId]));

      const updateResult = await API.graphql({
        query: mutations.updateActionItems,
        variables: {
          input: {
            id: itemId,
            status: newStatus,
            _version: item._version
          }
        }
      });
      
      const updatedItem = updateResult.data.updateActionItems;

      // If the item is being marked as done (status 3), grant the award
      if (newStatus === 3 && activeOrganization?.id) {
        try {
          // Get the full action item details to ensure we have all fields
          const fullItemResult = await API.graphql({
            query: queries.getActionItems,
            variables: { id: itemId }
          });
          
          const fullItem = fullItemResult.data.getActionItems;
          console.log('Full action item details for award:', fullItem);

          console.log('Attempting to grant awards for action item completion:', fullItem);
          const awardResult = await handleActionItemCompleteAward(activeOrganization.id, fullItem);
          if (!awardResult) {
            console.error('Failed to grant awards for action item completion');
          } else {
            console.log('Successfully granted awards for action item completion');
          }
        } catch (awardError) {
          console.error('Error granting action item completion awards:', awardError);
        }
        
        // Send completed notification (special case)
        try {
          await sendActionItemCompletedNotification(updatedItem, activeOrganization.id);
          console.log('Action item completed notification sent successfully');
        } catch (notificationError) {
          console.error('Error sending action item completed notification:', notificationError);
        }
      } 
      // For other status changes (not to Done), use the status changed notification
      else if (oldStatus !== newStatus) {
        try {
          await sendActionItemStatusChangedNotification(updatedItem, newStatus, activeOrganization.id);
          console.log(`Action item status changed notification sent for status: ${newStatus}`);
        } catch (notificationError) {
          console.error('Error sending action item status changed notification:', notificationError);
        }
      }

      // Remove item from updating set after all operations are complete
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

    } catch (error) {
      console.error('Error updating action item status:', error);
      // Remove item from updating set on error
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      // Revert the optimistic update on error
      setActionItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, status: item.status }
            : item
        )
      );
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceColumn = result.source.droppableId;
    const destinationColumn = result.destination.droppableId;
    const itemId = result.draggableId;

    if (sourceColumn !== destinationColumn) {
      const newStatus = COLUMNS[destinationColumn];
      
      // Optimistically update the UI
      setActionItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, status: newStatus }
            : item
        )
      );

      // Then update the backend
      updateActionItemStatus(itemId, newStatus);
    }
  };

  const getColumnItems = (columnId) => {
    return actionItems.filter(item => item.status === COLUMNS[columnId]);
  };

  const getColumnStyle = (columnId) => ({
    backgroundColor: COLUMN_COLORS[columnId].background,
    border: `1px solid ${COLUMN_COLORS[columnId].border}`,
    borderRadius: '0.375rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  });

  const getColumnHeaderStyle = (columnId) => ({
    backgroundColor: COLUMN_COLORS[columnId].header,
    color: COLUMN_COLORS[columnId].header === 'lightgreen' ? '#333' : 'white',
    padding: '0.75rem 1.25rem',
    borderTopLeftRadius: '0.375rem',
    borderTopRightRadius: '0.375rem',
    marginBottom: 0
  });

  const getCardStyle = (columnId, isDragging, draggableStyle) => ({
    userSelect: 'none',
    padding: '0.5rem',
    margin: '0 0 0.5rem 0',
    minHeight: '50px',
    backgroundColor: isDragging ? COLUMN_COLORS[columnId].background : 'white',
    border: `1px solid ${COLUMN_COLORS[columnId].border}`,
    borderLeft: `5px solid ${COLUMN_COLORS[columnId].header}`,
    borderRadius: '0.375rem',
    ...draggableStyle
  });

  const handleShowModal = (actionItemId = null) => {
    setSelectedActionItemId(actionItemId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedActionItemId(null);
    setShowModal(false);
  };

  const handleActionItemSave = (savedItem) => {
    if (savedItem) {
      // For new items
      if (!actionItems.find(item => item.id === savedItem.id)) {
        setActionItems(prev => [...prev, savedItem]);
      } 
      // For updated items
      else {
        setActionItems(prev => 
          prev.map(item => 
            item.id === savedItem.id ? savedItem : item
          )
        );
      }
    }
    // Fetch all items to ensure we have the latest data
    fetchActionItems();
  };

  const handleCardClick = (itemId) => {
    handleShowModal(itemId);
  };

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  // Add check for no reports and projects
  if (!loading && reports.length === 0 && projects.length === 0) {
    return (
      <Container fluid className="py-4 pt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Action Items</h2>
          <Button variant="primary" disabled>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Create Action Item
          </Button>
        </div>
        <div className="text-center py-5">
          <div className="alert alert-info" role="alert">
            <h4 className="alert-heading mb-3">No Reports or Projects Found</h4>
            <p>Please create at least one report or project before creating action items.</p>
            <hr />
            <div className="mt-3">
              <Button variant="primary" className="me-3" onClick={() => navigate('/reports')}>
                Create Report
              </Button>
              <Button variant="primary" onClick={() => navigate('/projects')}>
                Create Project
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 pt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <h2 className="me-3">Action Items</h2>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => navigate('/action-items-list')}
          >
            <FontAwesomeIcon icon={faList} className="me-2" />
            List View
          </Button>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create Action Item
        </Button>
      </div>

      <Row className="mb-4">
        <Col xs={12}>
          <div className="d-flex align-items-center mb-2 justify-content-between">
            <div className="d-flex align-items-center">
              <h5 className="mb-0 me-2">Reports Filter</h5>
              <small className="text-muted">({reports.length} reports)</small>
            </div>
            <div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedReportIds(reports.map(r => r.id))}
                className="me-2"
              >
                Select All
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedReportIds([])}
              >
                Deselect All
              </Button>
            </div>
          </div>
          <div className="reports-filter-container" style={{ 
            maxHeight: '150px', 
            overflowY: 'auto', 
            padding: '10px',
            border: '1px solid #dee2e6',
            borderRadius: '0.375rem',
            backgroundColor: '#f8f9fa',
            marginBottom: '20px'
          }}>
            <div className="d-flex flex-wrap gap-2">
              {reports.map((report) => (
                <Badge
                  key={report.id}
                  bg={selectedReportIds.includes(report.id) ? "primary" : "light"}
                  text={selectedReportIds.includes(report.id) ? "light" : "dark"}
                  style={{ 
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedReportIds.includes(report.id) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => handleReportToggle(report.id)}
                >
                  {report.name}
                  {selectedReportIds.includes(report.id) && (
                    <FontAwesomeIcon icon={faCheck} className="ms-2" size="xs" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div className="d-flex align-items-center mb-2 justify-content-between">
            <div className="d-flex align-items-center">
              <h5 className="mb-0 me-2">Projects Filter</h5>
              <small className="text-muted">({projects.length} projects)</small>
            </div>
            <div>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedProjectIds(projects.map(p => p.id))}
                className="me-2"
              >
                Select All
              </Button>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSelectedProjectIds([])}
              >
                Deselect All
              </Button>
            </div>
          </div>
          <div className="projects-filter-container" style={{ 
            maxHeight: '150px', 
            overflowY: 'auto', 
            padding: '10px',
            border: '1px solid #dee2e6',
            borderRadius: '0.375rem',
            backgroundColor: '#f8f9fa'
          }}>
            <div className="d-flex flex-wrap gap-2">
              {projects.map((project) => (
                <Badge
                  key={project.id}
                  bg={selectedProjectIds.includes(project.id) ? "primary" : "light"}
                  text={selectedProjectIds.includes(project.id) ? "light" : "dark"}
                  style={{ 
                    cursor: 'pointer',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedProjectIds.includes(project.id) ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => handleProjectToggle(project.id)}
                >
                  {project.name}
                  {selectedProjectIds.includes(project.id) && (
                    <FontAwesomeIcon icon={faCheck} className="ms-2" size="xs" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      <DragDropContext onDragEnd={onDragEnd}>
        <Row className="g-4">
          {Object.keys(COLUMNS).map((columnId) => (
            <Col key={columnId} xs={12} md={6} lg={3}>
              <div style={getColumnStyle(columnId)}>
                <div 
                  style={getColumnHeaderStyle(columnId)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <h5 className="mb-0">{columnId}</h5>
                  <div className="d-flex align-items-center">
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id={`tooltip-${columnId}`}>
                          <div style={{ whiteSpace: 'pre-line' }}>
                            {COLUMN_INFO[columnId].description}
                          </div>
                        </Tooltip>
                      }
                    >
                      <Button
                        variant="link"
                        className="p-0 ms-2 text-light"
                        style={{ color: COLUMN_COLORS[columnId].header === 'lightgreen' ? '#333' : 'white' }}
                      >
                        <FontAwesomeIcon icon={faInfoCircle} />
                      </Button>
                    </OverlayTrigger>
                    <Badge bg="light" text="dark" className="ms-2">
                      {getColumnItems(columnId).length}
                    </Badge>
                  </div>
                </div>
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        padding: '1rem',
                        minHeight: '500px',
                        backgroundColor: snapshot.isDraggingOver 
                          ? COLUMN_COLORS[columnId].background 
                          : 'transparent',
                        transition: 'background-color 0.2s ease',
                        flexGrow: 1
                      }}
                    >
                      {getColumnItems(columnId).map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={getCardStyle(
                                columnId,
                                snapshot.isDragging,
                                provided.draggableProps.style
                              )}
                              onClick={() => handleCardClick(item.id)}
                            >
                              <div className="card-body position-relative">
                                {/* Add loading overlay */}
                                {updatingItems.has(item.id) && (
                                  <div 
                                    style={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                      display: 'flex',
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                      zIndex: 1000,
                                      borderRadius: 'inherit'
                                    }}
                                  >
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                  </div>
                                )}
                                
                                <h6 className="card-title">{item.title}</h6>
                                <p className="card-text small text-muted mb-2">
                                  {item.description && item.description.length > 100 
                                    ? `${item.description.substring(0, 100)}...` 
                                    : item.description}
                                </p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    {item.duedate && (
                                      <div className="mb-2">
                                        {(() => {
                                          const currentDate = new Date();
                                          const dueDate = new Date(item.duedate);
                                          const isOverdue = dueDate < currentDate;
                                          const colorClass = isOverdue ? 'text-danger' : 'text-success';
                                          
                                          return (
                                            <>
                                              <FontAwesomeIcon 
                                                icon={faCalendarAlt} 
                                                className={`me-2 ${colorClass}`} 
                                              />
                                              <small className={colorClass}>
                                                Due: {dueDate.toLocaleDateString()}
                                              </small>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="d-flex align-items-center gap-2">
                                    {item.attachments?.length > 0 && (
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip>{item.attachments.length} {item.attachments.length === 1 ? 'attachment' : 'attachments'}</Tooltip>}
                                      >
                                        <Badge bg="secondary" className="d-flex align-items-center">
                                          <FontAwesomeIcon icon={faPaperclip} className="me-1" />
                                          <span>{item.attachments.length}</span>
                                        </Badge>
                                      </OverlayTrigger>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                  {/* Creator avatar */}
                                  {item.user_sub && creatorNames[item.user_sub] && (
                                    <div className="me-2 d-flex flex-column align-items-center">
                                      <small className="text-muted mb-1">Owner</small>
                                      <UserAvatar
                                        userSub={item.user_sub}
                                        size={28}
                                        organizationID={activeOrganization?.id}
                                        tooltipLabel={`Created by: ${creatorNames[item.user_sub]}`}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Assignee avatars */}
                                  {item.assignees?.length > 0 && (
                                    <div className="d-flex flex-column">
                                      <small className="text-muted mb-1">Assignees</small>
                                      <div className="d-flex assignee-avatars">
                                        {item.assignees.slice(0, 3).map((assignee, idx) => (
                                          <div 
                                            key={idx}
                                            style={{
                                              marginLeft: idx > 0 ? '-8px' : '0',
                                              position: 'relative',
                                              zIndex: item.assignees.length - idx
                                            }}
                                          >
                                            <UserAvatar
                                              userSub={assignee}
                                              size={28}
                                              organizationID={activeOrganization?.id}
                                              tooltipLabel={assigneeNames[assignee] || 'Assignee'}
                                            />
                                          </div>
                                        ))}
                                        {item.assignees.length > 3 && (
                                          <div 
                                            style={{
                                              marginLeft: '-8px',
                                              position: 'relative',
                                              zIndex: 0
                                            }}
                                          >
                                            <UserAvatar
                                              email={`+${item.assignees.length - 3}`}
                                              size={28}
                                              customColor="#495057"
                                              tooltipLabel={item.assignees.slice(3).map(assignee => 
                                                assigneeNames[assignee] || 'Assignee'
                                              ).join(', ')}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </Col>
          ))}
        </Row>
      </DragDropContext>

      <ActionItemModal
        show={showModal}
        handleClose={handleCloseModal}
        actionItemId={selectedActionItemId}
        reports={reports}
        projects={projects}
        onSave={handleActionItemSave}
        defaultProjectId={null}
      />

    </Container>
  );
};

export default ActionItems; 