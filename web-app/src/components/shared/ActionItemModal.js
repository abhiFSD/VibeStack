import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Row, Col, Button, Badge, Spinner } from 'react-bootstrap';
import { API, Auth, Storage } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faUser } from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import AttachmentsWrapper from './AttachmentsWrapper';
import Select from 'react-select';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useActionItems } from '../../contexts/ActionItemsContext';
import { sendEmailNotification, fetchEmailsByUserSubs } from '../../utils/emailNotifications';
import { compressImage } from '../../utils/imageUtils';
import { handleActionItemCompleteAward } from '../../utils/awards';

// Map status codes to readable names
const statusMap = {
  0: 'To Do',
  1: 'In Progress',
  2: 'In Review',
  3: 'Done'
};

const ActionItemModal = ({ 
  show, 
  handleClose, 
  actionItemId, 
  reports = [], 
  projects = [], 
  onSave,
  defaultProjectId = null 
}) => {
  const [actionItem, setActionItem] = useState({
    title: '',
    description: '',
    duedate: new Date(),
    status: 0,
    assignor: '',
  });
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedProject, setSelectedProject] = useState(defaultProjectId ? projects.find(p => p.id === defaultProjectId) : null);
  const [isNote, setIsNote] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [attachmentURLs, setAttachmentURLs] = useState([]);
  const fileInputRef = useRef(null);
  const { activeOrganization } = useOrganization();
  const { refreshCount } = useActionItems();
  const [originalActionItem, setOriginalActionItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [reportMembers, setReportMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Determine the context we are in
  const isReportContext = reports.length === 1 && projects.length === 0;
  const isProjectContext = projects.length === 1 && defaultProjectId !== null;
  const isActionItemsPageContext = !isReportContext && !isProjectContext;

  useEffect(() => {
    if (activeOrganization?.id) {
      fetchOrganizationMembers();
    }
  }, [activeOrganization]);

  useEffect(() => {
    if (actionItemId) {
      loadActionItem();
    } else {
      resetForm();
      // Only set initial values once when the modal opens
      if (show) {
        if (isReportContext && reports.length === 1) {
          setSelectedReport(reports[0]);
        } else if (isProjectContext && projects.length === 1) {
          setSelectedProject(projects[0]);
        }
      }
    }
  }, [actionItemId, show]); // Only depend on actionItemId and show, remove other dependencies

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!selectedProject?.id) {
        setProjectMembers([]);
        return;
      }

      setLoadingMembers(true);
      try {
        const membersResult = await API.graphql({
          query: queries.projectMembersByProjectID,
          variables: { projectID: selectedProject.id }
        });
        
        const members = membersResult.data.projectMembersByProjectID.items
          .filter(m => !m._deleted)
          .map(m => ({
            value: m.userSub,
            label: m.email,
            role: m.role
          }));
        
        setProjectMembers(members);
      } catch (error) {
        console.error('Error fetching project members:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchProjectMembers();
  }, [selectedProject]);

  useEffect(() => {
    const fetchReportMembers = async () => {
      if (!selectedReport?.id) {
        setReportMembers([]);
        return;
      }

      setLoadingMembers(true);
      try {
        const reportResult = await API.graphql({
          query: queries.getReport,
          variables: { id: selectedReport.id }
        });
        
        const report = reportResult.data.getReport;
        if (!report || !report.assignedMembers) {
          setReportMembers([]);
          return;
        }

        // Convert assigned members to the format needed for the Select component
        const members = report.assignedMembers
          .map(userSub => {
            const orgMember = organizationMembers.find(m => m.value === userSub);
            return orgMember;
          })
          .filter(Boolean); // Remove any undefined values
        
        setReportMembers(members);
      } catch (error) {
        console.error('Error fetching report members:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchReportMembers();
  }, [selectedReport, organizationMembers]);

  const fetchOrganizationMembers = async () => {
    setLoading(true);
    try {
      const response = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            status: { eq: "ACTIVE" },
            _deleted: { ne: true }
          }
        }
      });
      
      const members = response.data.listOrganizationMembers.items
        .filter(member => !member._deleted)
        .map(member => ({
          value: member.userSub,
          label: member.email,
          role: member.role
        }));
      
      setOrganizationMembers(members);
    } catch (error) {
      console.error('Error fetching organization members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActionItem = async () => {
    if (!actionItemId) return;
    setLoading(true);
    try {
      const response = await API.graphql({
        query: queries.getActionItems,
        variables: { id: actionItemId }
      });
      const item = response.data.getActionItems;

      if (!item || item._deleted) {
        console.error('Action item not found or deleted');
        alert('Action item not found or has been deleted.');
        handleClose(); 
        return;
      }
      
      setOriginalActionItem(item); 

      setActionItem({
        title: item.title || '',
        description: item.description || '',
        duedate: item.duedate ? new Date(item.duedate) : new Date(),
        status: item.status ?? 0, 
      });

      const assigneeOptions = item.assignees?.map(userSub => 
        organizationMembers.find(member => member.value === userSub)
      ).filter(Boolean) || [];
      setSelectedAssignees(assigneeOptions);
      
      setIsNote(item.note);
      
      // Load attachments without URLs initially - let UnifiedAttachments handle URL loading
      const attachmentsWithoutUrls = (item.attachments || [])
        .filter(key => key != null) // Filter out null or undefined keys
        .map((key) => {
          // Extract filename from key - handle both timestamp and direct filename formats
          let name = 'attachment';
          if (key && typeof key === 'string') {
            // Handle format: attachments/timestamp-filename.ext
            if (key.includes('/')) {
              const filename = key.split('/').pop();
              if (filename.includes('-')) {
                // Remove timestamp prefix (e.g., "1234567890-document.pdf" -> "document.pdf")
                name = filename.substring(filename.indexOf('-') + 1);
              } else {
                name = filename;
              }
            } else {
              name = key;
            }
          }
          return { key, url: null, name };
        });
      setAttachments(attachmentsWithoutUrls);

      // Set selected report/project
      if (item.reportID) {
        setSelectedReport(reports.find(r => r.id === item.reportID));
      }
      if (item.projectID) {
        setSelectedProject(projects.find(p => p.id === item.projectID));
      }

    } catch (error) {
      console.error('Error loading action item:', error);
      alert('Failed to load action item details.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActionItem({
      title: '',
      description: '',
      duedate: new Date(),
      status: 0,
      assignor: ''
    });
    setSelectedAssignees([]);
    setOriginalActionItem(null);
    setIsNote(false);
    setAttachments([]);
    setSelectedReport(null);
    setSelectedProject(null);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Track if we're in edit mode (attachments are objects with keys)
    const isEditMode = attachments.length > 0 && typeof attachments[0] === 'object';
    
    for (const file of files) {
      try {
        // Compress the image if it's an image file, otherwise use the original
        const processedFile = file.type.startsWith('image/') 
          ? await compressImage(file) 
          : file;
            
        const key = `attachments/${Date.now()}-${file.name}`;
        await Storage.put(key, processedFile);
        
        const url = await Storage.get(key);
        
        if (isEditMode) {
          // In edit mode, add objects to maintain consistency
          setAttachments(prev => [...prev, { 
            key, 
            url, 
            name: file.name 
          }]);
        } else {
          // In create mode, add keys directly
          setAttachments(prev => [...prev, key]);
          setAttachmentURLs(prev => [...prev, url]);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  // Handle attachments change for unified component
  const handleAttachmentsChange = (newAttachments, changeType, metadata) => {
    console.log('ActionItemModal - handleAttachmentsChange:', { newAttachments, changeType, metadata });
    setAttachments(newAttachments);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Safely extract attachment keys, handling both object and string formats
      const attachmentKeys = attachments
        .filter(att => att != null)
        .map(att => {
          if (typeof att === 'object' && att.key) {
            return att.key;
          }
          if (typeof att === 'string') {
            return att;
          }
          return null;
        })
        .filter(key => key !== null);
      
      const input = {
        title: actionItem.title,
        description: actionItem.description,
        duedate: actionItem.duedate.toISOString(),
        status: actionItem.status,
        assignor: originalActionItem?.assignor || user.attributes.sub,
        note: isNote,
        assignees: selectedAssignees.map(assignee => assignee.value),
        attachments: attachmentKeys,
        user_sub: originalActionItem?.user_sub || user.attributes.sub,
        reportID: selectedReport?.id || null,
        projectID: selectedProject?.id || defaultProjectId || null,
      };
      
      // Validation
      if (!input.title) {
        alert('Title is required.');
        setIsSubmitting(false);
        return;
      }
      if (!input.reportID && !input.projectID && !isProjectContext && !isReportContext) {
        alert('Please select either a report or a project');
        setIsSubmitting(false);
        return;
      }

      const orgId = activeOrganization.id;
      let response;

      if (actionItemId && originalActionItem) {
        // --- UPDATE LOGIC --- 
        const oldStatus = originalActionItem.status;
        response = await API.graphql({
          query: mutations.updateActionItems,
          variables: { 
            input: {
              ...input, 
              id: actionItemId,
              _version: originalActionItem._version 
            }
          }
        });

        if (response.data?.updateActionItems) {
          const updatedActionItem = response.data.updateActionItems;

          // Handle status change to Done (3)
          if (input.status === 3 && oldStatus !== 3) {
            try {
              // Grant award for completion
              console.log('Attempting to grant award for action item completion');
              const awardResult = await handleActionItemCompleteAward(orgId, updatedActionItem);
              if (awardResult) {
                console.log('Successfully granted award for action item completion');
              }

              // Send completion notification
              const recipientsSubs = [...new Set([updatedActionItem.assignor, ...updatedActionItem.assignees])].filter(Boolean);
              const recipientEmails = await fetchEmailsByUserSubs(recipientsSubs, orgId);

              if (recipientEmails.length > 0) {
                const notificationData = {
                  actionItemTitle: updatedActionItem.title,
                  actionItemDescription: updatedActionItem.description || 'No description',
                  actionItemDueDate: updatedActionItem.duedate ? new Date(updatedActionItem.duedate).toLocaleDateString() : 'N/A',
                  actionItemURL: `${window.location.origin}${updatedActionItem.reportID ? '/report/' + updatedActionItem.reportID : (updatedActionItem.projectID ? '/project/' + updatedActionItem.projectID : '/action-items')}`,
                  actionItemsURL: `${window.location.origin}/action-items`
                };

                await sendEmailNotification({
                  type: 'ACTION_ITEM_COMPLETED',
                  to: recipientEmails,
                  data: notificationData,
                  organizationID: orgId
                });
                console.log('Completion notification sent successfully');
              }
            } catch (error) {
              console.error('Error handling action item completion:', error);
            }
          }
          // Handle other status changes
          else if (input.status !== oldStatus) {
            try {
              const recipientsSubs = [...new Set([updatedActionItem.assignor, ...updatedActionItem.assignees])].filter(Boolean);
              const recipientEmails = await fetchEmailsByUserSubs(recipientsSubs, orgId);

              if (recipientEmails.length > 0) {
                const notificationData = {
                  actionItemTitle: updatedActionItem.title,
                  actionItemDescription: updatedActionItem.description || 'No description',
                  actionItemDueDate: updatedActionItem.duedate ? new Date(updatedActionItem.duedate).toLocaleDateString() : 'N/A',
                  actionItemURL: `${window.location.origin}${updatedActionItem.reportID ? '/report/' + updatedActionItem.reportID : (updatedActionItem.projectID ? '/project/' + updatedActionItem.projectID : '/action-items')}`,
                  status: statusMap[input.status] || `Status ${input.status}`
                };

                await sendEmailNotification({
                  type: 'ACTION_ITEM_STATUS_CHANGED',
                  to: recipientEmails,
                  data: notificationData,
                  organizationID: orgId
                });
                console.log('Status change notification sent successfully');
              }
            } catch (error) {
              console.error('Error sending status change notification:', error);
            }
          }
        }
      } else {
        // --- CREATE LOGIC --- 
        input.assignor = user.attributes.sub;
        input.user_sub = user.attributes.sub;
        response = await API.graphql({
          query: mutations.createActionItems,
          variables: { input }
        });
        
        if (response.data?.createActionItems) {
           const createdActionItem = response.data.createActionItems;
           const creatorSub = createdActionItem.assignor; 
           const assigneeSubs = createdActionItem.assignees || [];
           
           // Send notifications
           try {
             // Creator notification
             if (creatorSub) {
               const creatorEmails = await fetchEmailsByUserSubs([creatorSub], orgId);
               if (creatorEmails.length > 0) {
                 const notificationData = {
                   actionItemTitle: createdActionItem.title,
                   actionItemDescription: createdActionItem.description || 'No description',
                   actionItemDueDate: createdActionItem.duedate ? new Date(createdActionItem.duedate).toLocaleDateString() : 'N/A',
                   actionItemURL: `${window.location.origin}${createdActionItem.reportID ? '/report/' + createdActionItem.reportID : (createdActionItem.projectID ? '/project/' + createdActionItem.projectID : '/action-items')}`,
                   actionItemsURL: `${window.location.origin}/action-items`
                 };
                 await sendEmailNotification({
                   type: 'ACTION_ITEM_CREATED',
                   to: creatorEmails[0],
                   data: notificationData,
                   organizationID: orgId
                 });
               }
             }

             // Assignee notifications
             if (assigneeSubs.length > 0) {
               const assigneeEmails = await fetchEmailsByUserSubs(assigneeSubs, orgId);
               if (assigneeEmails.length > 0) {
                 const notificationData = {
                   actionItemTitle: createdActionItem.title,
                   actionItemDescription: createdActionItem.description || 'No description',
                   actionItemDueDate: createdActionItem.duedate ? new Date(createdActionItem.duedate).toLocaleDateString() : 'N/A',
                   actionItemURL: `${window.location.origin}${createdActionItem.reportID ? '/report/' + createdActionItem.reportID : (createdActionItem.projectID ? '/project/' + createdActionItem.projectID : '/action-items')}`,
                   actionItemsURL: `${window.location.origin}/action-items`
                 };
                 await sendEmailNotification({
                   type: 'ACTION_ITEM_ASSIGNED',
                   to: assigneeEmails,
                   data: notificationData,
                   organizationID: orgId
                 });
               }
             }
           } catch (error) {
             console.error('Error sending notifications:', error);
           }
        }
      }

      if (!response.data) {
        throw new Error('No data returned from mutation');
      }

      // Pass the created/updated item back to parent
      onSave(response.data.createActionItems || response.data.updateActionItems);
      
      // Refresh the action items count for the browser tab
      refreshCount();
      
      handleClose();
      resetForm();
    } catch (error) {
      console.error('Error saving action item:', error);
      alert('Error saving action item: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!actionItemId || !window.confirm('Are you sure you want to delete this action item?')) {
      return;
    }

    try {
      await API.graphql({
        query: mutations.deleteActionItems,
        variables: {
          input: {
            id: actionItemId,
            _version: actionItem._version
          }
        }
      });

      onSave();
      
      // Refresh the action items count for the browser tab
      refreshCount();
      
      handleClose();
      resetForm();
    } catch (error) {
      console.error('Error deleting action item:', error);
    }
  };

  if (loading) {
    return (
      <Modal show={show} onHide={handleClose}>
        <Modal.Body className="text-center p-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{actionItemId ? 'Edit' : 'Create'} {isNote ? 'Note' : 'Action Item'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={9}>
              <Form.Group>
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  value={actionItem.title}
                  onChange={(e) => setActionItem({ ...actionItem, title: e.target.value })}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-center">
              <Form.Check
                type="switch"
                label="Is Note"
                checked={isNote}
                onChange={(e) => setIsNote(e.target.checked)}
              />
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={actionItem.description}
              onChange={(e) => setActionItem({ ...actionItem, description: e.target.value })}
            />
          </Form.Group>

          {!isNote && (
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={(() => {
                      // Format date in local timezone for display
                      const date = actionItem.duedate;
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })()}
                    onChange={(e) => {
                      // Create date in local timezone to avoid timezone conversion issues
                      const [year, month, day] = e.target.value.split('-');
                      const localDate = new Date(year, month - 1, day);
                      setActionItem({ ...actionItem, duedate: localDate });
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={actionItem.status}
                    onChange={(e) => setActionItem({ ...actionItem, status: parseInt(e.target.value) })}
                  >
                    <option value={0}>To Do</option>
                    <option value={1}>In Progress</option>
                    <option value={2}>In Review</option>
                    {actionItemId && ( // Only show Done option when editing
                      <option value={3}>Done</option>
                    )}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row className="mb-3">
            {(!isProjectContext || (isActionItemsPageContext && !selectedProject)) && (
              <Col md={isReportContext ? 12 : 6}>
                <Form.Group>
                  <Form.Label>Report {reports.length === 0 && '(No reports available)'}</Form.Label>
                  {isReportContext ? (
                    <div className="form-control bg-light">{reports[0]?.name || 'N/A'}</div>
                  ) : (
                    <Form.Select
                      value={selectedReport?.id || ''}
                      onChange={(e) => {
                        const report = reports.find(r => r.id === e.target.value);
                        setSelectedReport(report);
                        if (report) {
                          setSelectedProject(null); // Clear project selection when report is selected
                        }
                      }}
                      disabled={reports.length === 0 || isReportContext || defaultProjectId !== null}
                    >
                      <option value="">Select a report</option>
                      {reports?.map(report => (
                        <option key={report.id} value={report.id}>{report.name}</option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            )}
            {(!isReportContext || (isActionItemsPageContext && !selectedReport)) && (
              <Col md={isProjectContext ? 12 : 6}>
                <Form.Group>
                  <Form.Label>Project {projects.length === 0 && '(No projects available)'}</Form.Label>
                  {isProjectContext ? (
                    <div className="form-control bg-light">{projects.find(p => p.id === defaultProjectId)?.name || 'N/A'}</div>
                  ) : (
                    <Form.Select
                      value={selectedProject?.id || defaultProjectId || ''}
                      onChange={(e) => {
                        const project = projects.find(p => p.id === e.target.value);
                        setSelectedProject(project);
                        if (project) {
                          setSelectedReport(null); // Clear report selection when project is selected
                        }
                      }}
                      disabled={defaultProjectId !== null || projects.length === 0 || isProjectContext}
                    >
                      <option value="">Select a project</option>
                      {projects?.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </Form.Select>
                  )}
                </Form.Group>
              </Col>
            )}
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Assignees - Team Member(s)/Collaborator(s)</Form.Label>
            <Select
              isMulti
              value={selectedAssignees}
              onChange={setSelectedAssignees}
              options={
                selectedProject?.id ? projectMembers :
                selectedReport?.id ? reportMembers :
                organizationMembers
              }
              getOptionLabel={option => `${option.label} (${option.role})`}
              getOptionValue={option => option.value}
              placeholder={loadingMembers ? "Loading members..." : "Select assignees..."}
              className="basic-multi-select"
              classNamePrefix="select"
              isLoading={loadingMembers}
            />
            {selectedProject?.id && projectMembers.length === 0 && !loadingMembers && (
              <small className="text-muted">
                No members available in this project. Please add members to the project first.
              </small>
            )}
            {selectedReport?.id && reportMembers.length === 0 && !loadingMembers && (
              <small className="text-muted">
                No members assigned to this report. Please assign members to the report first.
              </small>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Attachments</Form.Label>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                style={{ display: 'none' }}
              />
              <Button
                variant="outline-secondary"
                onClick={() => fileInputRef.current.click()}
              >
                <FontAwesomeIcon icon={faPaperclip} className="me-2" />
                Add Attachment
              </Button>
            </div>
            <div className="mt-3">
              <AttachmentsWrapper
                attachments={attachments}
                onAttachmentsChange={handleAttachmentsChange}
                useLegacyMode={false}
                displayMode="grid"
                showFilenames={true}
                allowFullscreen={true}
                showUploadButton={false}
                uploadConfig={{
                  multiple: true,
                  accept: "*/*",
                  compress: true
                }}
                emptyMessage="No attachments yet"
                onDelete={async (attachment) => {
                  const shouldDelete = window.confirm('Are you sure you want to delete this attachment?');
                  
                  if (shouldDelete && actionItemId && originalActionItem) {
                    try {
                      // Get the current list of attachment keys excluding the one being deleted
                      const attachmentKeys = attachments
                        .filter(att => {
                          const attachmentKey = typeof att === 'object' ? att.key : att;
                          const deletedKey = typeof attachment === 'object' ? attachment.key : attachment;
                          return attachmentKey !== deletedKey;
                        })
                        .map(att => (typeof att === 'object' ? att.key : att))
                        .filter(key => key !== null);
                        
                      // Update the action item with the new attachments list
                      const response = await API.graphql({
                        query: mutations.updateActionItems,
                        variables: { 
                          input: {
                            id: actionItemId,
                            _version: originalActionItem._version,
                            attachments: attachmentKeys
                          }
                        }
                      });
                      
                      if (response.data?.updateActionItems) {
                        // Update our originalActionItem reference with the new version
                        setOriginalActionItem(response.data.updateActionItems);
                        
                        // Notify parent component that the action item has been updated
                        if (onSave) {
                          onSave();
                        }
                      }
                    } catch (error) {
                      console.error('Error updating action item after attachment deletion:', error);
                    }
                  }
                  
                  return shouldDelete;
                }}
              />
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          {actionItemId && (
            <Button variant="danger" onClick={handleDelete} disabled={isSubmitting}>
              Delete
            </Button>
          )}
          {!actionItemId && <div />}
          <div>
            <Button variant="secondary" onClick={handleClose} className="me-2" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Saving...
                </>
              ) : (
                actionItemId ? 'Update' : 'Create'
              )}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ActionItemModal; 