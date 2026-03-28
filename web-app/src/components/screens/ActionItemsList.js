import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Row, Col, Button, Badge, Form, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCalendarAlt, faPaperclip, faUser, faEye, faList, faFilter, faStickyNote } from '@fortawesome/free-solid-svg-icons';
import ActionItemModal from '../shared/ActionItemModal';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../../contexts/OrganizationContext';
import UserAvatar from '../shared/UserAvatar';

const COLUMNS = {
  'To Do': 0,
  'In Progress': 1,
  'In Review': 2,
  'Done': 3
};

const STATUS_COLORS = {
  0: 'secondary',
  1: 'warning', 
  2: 'info',
  3: 'success'
};

const ActionItemsList = () => {
  const [allActionItems, setAllActionItems] = useState([]); // Store all fetched items
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();
  const [assigneeNames, setAssigneeNames] = useState({});
  const [creatorNames, setCreatorNames] = useState({});

  useEffect(() => {
    if (activeOrganization?.id) {
      // Run all initial data fetching in parallel for better performance
      Promise.all([
        fetchReports(),
        fetchProjects(),
        fetchAllActionItems()
      ]).catch(error => {
        console.error('Error in initial data fetch:', error);
      });
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    if (reports.length > 0) {
      // Initially select all reports
      setSelectedReportIds(reports.map(report => report.id));
    }
  }, [reports.length]);

  useEffect(() => {
    if (projects.length > 0) {
      // Initially select all projects
      setSelectedProjectIds(projects.map(project => project.id));
    }
  }, [projects.length]);

  // Memoize filtered items for better performance
  const filteredItems = useMemo(() => {
    let filtered = [...allActionItems];

    console.log('Filtering debug:', {
      totalItems: allActionItems.length,
      selectedReports: selectedReportIds.length,
      selectedProjects: selectedProjectIds.length
    });

    // First apply report/project filters
    if (selectedReportIds.length > 0 || selectedProjectIds.length > 0) {
      filtered = filtered.filter(item => {
        // Check if item belongs to a selected report
        const belongsToSelectedReport = selectedReportIds.length > 0 && 
          item.reportID && selectedReportIds.includes(item.reportID);
        
        // Check if item belongs to a selected project
        const belongsToSelectedProject = selectedProjectIds.length > 0 && 
          item.projectID && selectedProjectIds.includes(item.projectID);
        
        // Item should match at least one selected report OR project
        // But only check the filters that have selections
        if (selectedReportIds.length > 0 && selectedProjectIds.length > 0) {
          // Both filters active - item must match either
          return belongsToSelectedReport || belongsToSelectedProject;
        } else if (selectedReportIds.length > 0) {
          // Only report filter active
          return belongsToSelectedReport;
        } else if (selectedProjectIds.length > 0) {
          // Only project filter active
          return belongsToSelectedProject;
        }
        
        return false;
      });
    } else {
      // If no reports or projects are selected, show no items
      filtered = [];
    }

    console.log('After report/project filter:', filtered.length);

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'notes') {
        filtered = filtered.filter(item => item.note === true);
      } else if (typeFilter === 'action-items') {
        filtered = filtered.filter(item => item.note === false);
      }
    }

    // Status filter (only apply to action items, not notes)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.note === true || item.status === parseInt(statusFilter));
    }

    // Due date filter
    if (dueDateFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(item => {
        if (!item.duedate) return dueDateFilter === 'no-date';
        
        const dueDate = new Date(item.duedate);
        dueDate.setHours(0, 0, 0, 0);
        
        switch (dueDateFilter) {
          case 'overdue':
            return dueDate < today;
          case 'today':
            return dueDate.getTime() === today.getTime();
          case 'this-week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);
            return dueDate >= today && dueDate <= weekFromNow;
          case 'future':
            return dueDate > today;
          case 'no-date':
            return false; // Already handled above
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort by due date only once, at the end
    return filtered.sort((a, b) => {
      if (a.duedate && b.duedate) {
        return new Date(a.duedate) - new Date(b.duedate);
      }
      return 0;
    });
  }, [allActionItems, selectedReportIds, selectedProjectIds, statusFilter, dueDateFilter, typeFilter, searchTerm]);


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
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
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

      const allReports = [...ownedReports, ...assignedReports];
      const uniqueReports = Array.from(new Map(allReports.map(report => [report.id, report])).values());
      const fetchedReports = uniqueReports.filter(item => !item._deleted);
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchAssigneeNames = async (items) => {
    if (!items || !items.length) return;
    
    const uniqueAssigneeSubs = [...new Set(
      items.flatMap(item => item.assignees || [])
    )].filter(Boolean);
    
    const uniqueCreatorSubs = [...new Set(
      items.map(item => item.user_sub)
    )].filter(Boolean);
    
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
      
      setAssigneeNames(namesMap);
      setCreatorNames(namesMap);
    } catch (error) {
      console.error('Error fetching user names:', error);
    }
  };

  const fetchAllActionItems = async () => {
    if (loading) return; // Prevent duplicate calls
    
    setLoading(true);
    try {
      const user = await Auth.currentAuthenticatedUser();
      
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

      // Run queries for both action items AND notes in parallel for better performance
      const [ownedActionItems, assignedActionItems, ownedNotes, assignedNotes] = await Promise.all([
        fetchAllPages({
          user_sub: { eq: user.attributes.sub },
          note: { eq: false },
          _deleted: { ne: true }
        }),
        fetchAllPages({
          assignees: { contains: user.attributes.sub },
          note: { eq: false },
          _deleted: { ne: true }
        }),
        fetchAllPages({
          user_sub: { eq: user.attributes.sub },
          note: { eq: true },
          _deleted: { ne: true }
        }),
        fetchAllPages({
          assignees: { contains: user.attributes.sub },
          note: { eq: true },
          _deleted: { ne: true }
        })
      ]);
      
      // Combine and deduplicate all items (action items and notes)
      const allItems = [...ownedActionItems, ...assignedActionItems, ...ownedNotes, ...assignedNotes];
      const uniqueItems = Array.from(
        new Map(allItems.map(item => [item.id, item])).values()
      );
      
      // Debug logging
      console.log('ActionItemsList fetchAllActionItems debug:');
      console.log('Owned action items:', ownedActionItems.length);
      console.log('Assigned action items:', assignedActionItems.length);
      console.log('Owned notes:', ownedNotes.length);
      console.log('Assigned notes:', assignedNotes.length);
      console.log('Total before dedup:', allItems.length);
      console.log('Total after dedup:', uniqueItems.length);
      console.log('Action items IDs:', uniqueItems.map(item => ({ id: item.id, note: item.note, title: item.title?.substring(0, 20) })));
      
      setAllActionItems(uniqueItems);
      setLoading(false);
      
      // Defer user name fetching to avoid blocking the UI
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

  const handleSelectAllReports = () => {
    const allReportIds = reports.map(r => r.id);
    setSelectedReportIds(allReportIds);
  };

  const handleDeselectAllReports = () => {
    setSelectedReportIds([]);
  };

  const handleSelectAllProjects = () => {
    const allProjectIds = projects.map(p => p.id);
    setSelectedProjectIds(allProjectIds);
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIds([]);
  };

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
      if (!allActionItems.find(item => item.id === savedItem.id)) {
        setAllActionItems(prev => [...prev, savedItem]);
      } else {
        setAllActionItems(prev => 
          prev.map(item => 
            item.id === savedItem.id ? savedItem : item
          )
        );
      }
    }
    // No need to refetch - the useEffect will handle filtering the updated data
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: 'To Do',
      1: 'In Progress', 
      2: 'In Review',
      3: 'Done'
    };
    return statusMap[status] || 'Unknown';
  };

  const formatDueDate = (duedate) => {
    if (!duedate) return 'No due date';
    
    const date = new Date(duedate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const isOverdue = date < today;
    const formatted = date.toLocaleDateString();
    
    return { formatted, isOverdue };
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading action items...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 pt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <h2 className="me-3">Action Items List</h2>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => navigate('/action-items')}
          >
            <FontAwesomeIcon icon={faList} className="me-2" />
            Board View
          </Button>
        </div>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create Action Item
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Filters
          </h5>
        </Card.Header>
        <Card.Body>
          {/* Reports Filter */}
          <Row className="mb-3">
            <Col xs={12}>
              <div className="d-flex align-items-center mb-2 justify-content-between">
                <div className="d-flex align-items-center">
                  <h6 className="mb-0 me-2">Reports Filter</h6>
                  <small className="text-muted">({reports.length} reports)</small>
                </div>
                <div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleSelectAllReports}
                    className="me-2"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleDeselectAllReports}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {reports.map((report) => (
                  <Badge
                    key={report.id}
                    bg={selectedReportIds.includes(report.id) ? "primary" : "light"}
                    text={selectedReportIds.includes(report.id) ? "light" : "dark"}
                    style={{ cursor: 'pointer', padding: '8px 12px' }}
                    onClick={() => handleReportToggle(report.id)}
                  >
                    {report.name}
                  </Badge>
                ))}
              </div>
            </Col>
          </Row>

          {/* Projects Filter */}
          <Row className="mb-3">
            <Col xs={12}>
              <div className="d-flex align-items-center mb-2 justify-content-between">
                <div className="d-flex align-items-center">
                  <h6 className="mb-0 me-2">Projects Filter</h6>
                  <small className="text-muted">({projects.length} projects)</small>
                </div>
                <div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleSelectAllProjects}
                    className="me-2"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleDeselectAllProjects}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {projects.map((project) => (
                  <Badge
                    key={project.id}
                    bg={selectedProjectIds.includes(project.id) ? "primary" : "light"}
                    text={selectedProjectIds.includes(project.id) ? "light" : "dark"}
                    style={{ cursor: 'pointer', padding: '8px 12px' }}
                    onClick={() => handleProjectToggle(project.id)}
                  >
                    {project.name}
                  </Badge>
                ))}
              </div>
            </Col>
          </Row>

          {/* Additional Filters */}
          <Row>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="action-items">Action Items</option>
                  <option value="notes">Notes</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="0">To Do</option>
                  <option value="1">In Progress</option>
                  <option value="2">In Review</option>
                  <option value="3">Done</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Due Date</Form.Label>
                <Form.Select value={dueDateFilter} onChange={(e) => setDueDateFilter(e.target.value)}>
                  <option value="all">All Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Due Today</option>
                  <option value="this-week">Due This Week</option>
                  <option value="future">Future</option>
                  <option value="no-date">No Due Date</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results Summary */}
      <div className="mb-3">
        <h6>Showing {filteredItems.length} of {allActionItems.length} items</h6>
      </div>

      {/* Action Items and Notes Table */}
      <Card>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Owner</th>
                <th>Assignees</th>
                <th>Report/Project</th>
                <th>Attachments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    No items match the current filters
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const dueDateInfo = formatDueDate(item.duedate);
                  const relatedReport = reports.find(r => r.id === item.reportID);
                  const relatedProject = projects.find(p => p.id === item.projectID);
                  
                  return (
                    <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => handleShowModal(item.id)}>
                      <td>
                        {item.note ? (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>This is a note</Tooltip>}
                          >
                            <Badge bg="warning" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                              <FontAwesomeIcon icon={faStickyNote} className="me-1" />
                              Note
                            </Badge>
                          </OverlayTrigger>
                        ) : (
                          <Badge bg="primary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                            Action Item
                          </Badge>
                        )}
                      </td>
                      <td>
                        <div>
                          <strong>{item.title}</strong>
                          {item.description && (
                            <div className="text-muted small">
                              {item.description.length > 100 
                                ? `${item.description.substring(0, 100)}...` 
                                : item.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.note ? (
                          <span className="text-muted">N/A</span>
                        ) : (
                          <Badge bg={STATUS_COLORS[item.status]}>
                            {getStatusText(item.status)}
                          </Badge>
                        )}
                      </td>
                      <td>
                        {item.note ? (
                          <span className="text-muted">N/A</span>
                        ) : (
                          <span className={dueDateInfo.isOverdue ? 'text-danger' : 'text-success'}>
                            {dueDateInfo.formatted}
                          </span>
                        )}
                      </td>
                      <td>
                        {item.user_sub && creatorNames[item.user_sub] && (
                          <div className="d-flex align-items-center">
                            <UserAvatar
                              userSub={item.user_sub}
                              size={24}
                              organizationID={activeOrganization?.id}
                              style={{ marginRight: '8px' }}
                            />
                            <small>{creatorNames[item.user_sub]}</small>
                          </div>
                        )}
                      </td>
                      <td>
                        {item.assignees?.length > 0 ? (
                          <div className="d-flex">
                            {item.assignees.slice(0, 2).map((assignee, idx) => (
                              <UserAvatar
                                key={idx}
                                userSub={assignee}
                                size={20}
                                organizationID={activeOrganization?.id}
                                tooltipLabel={assigneeNames[assignee] || 'Assignee'}
                                style={{ 
                                  marginLeft: idx > 0 ? '-4px' : '0',
                                  border: '1px solid white'
                                }}
                              />
                            ))}
                            {item.assignees.length > 2 && (
                              <span className="ms-1 small text-muted">
                                +{item.assignees.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {relatedReport && (
                          <Badge bg="info" className="me-1">
                            {relatedReport.name}
                          </Badge>
                        )}
                        {relatedProject && (
                          <Badge bg="success">
                            {relatedProject.name}
                          </Badge>
                        )}
                      </td>
                      <td>
                        {item.attachments?.length > 0 && (
                          <Badge bg="secondary" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                            <FontAwesomeIcon icon={faPaperclip} className="me-1" />
                            {item.attachments.length}
                          </Badge>
                        )}
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowModal(item.id);
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

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

export default ActionItemsList;