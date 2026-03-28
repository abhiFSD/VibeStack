import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { sendReportCreatedNotification, sendEmailNotification } from '../../utils/emailNotifications';
import { useToolContext } from '../../contexts/ToolContext';
import { createHighlights } from '../../utils/reportHelpers';
import { getUserAvatarByEmail } from '../../utils/userAvatarService';
import UserAvatar from '../shared/UserAvatar';

const ReportModal = ({ 
  show, 
  onHide, 
  currentReport = null, 
  organizationID, 
  organizationMembers = [], 
  availableProjects = [],
  onSuccess,
  loadingMembers = false,
  projectID = null
}) => {
  const { tools } = useToolContext();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [bones, setBones] = useState(null);
  const [trend, setTrend] = useState(true);
  const [target, setTarget] = useState('');
  const [xaxis, setXaxis] = useState('');
  const [yaxis, setYaxis] = useState('');
  const [media, setMedia] = useState('');
  const [userSub, setUserSub] = useState('');
  const [selectedProjectID, setSelectedProjectID] = useState(null);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [selectedMemberEmails, setSelectedMemberEmails] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingProjectMembers, setLoadingProjectMembers] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUserSub(user.attributes.sub);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);

  useEffect(() => {
    // Set project ID if provided externally
    if (projectID) {
      setSelectedProjectID(projectID);
    }
  }, [projectID]);

  useEffect(() => {
    if (currentReport) {
      setName(currentReport.name || '');
      setType(currentReport.type || '');
      setBones(currentReport.bones || null);
      setTarget(currentReport.target || '');
      setXaxis(currentReport.xaxis || '');
      setYaxis(currentReport.yaxis || '');
      setMedia(currentReport.media || '');
      setTrend(typeof currentReport.trend !== 'undefined' ? currentReport.trend : true);
      setSelectedProjectID(currentReport.projectID || projectID || null);
      
      // Set selected members and fetch their emails
      setSelectedMembers(currentReport.assignedMembers || []);
      setSelectedMemberEmails([]);
      
      // Get emails for selected members if any
      if (currentReport.assignedMembers?.length > 0) {
        const memberEmails = currentReport.assignedMembers.map(memberSub => {
          const member = organizationMembers.find(m => m.userSub === memberSub);
          return member?.email;
        }).filter(email => email); // Remove undefined/null values
        
        setSelectedMemberEmails(memberEmails);
      }
    } else {
      // Reset form for create mode
      resetForm();
    }
  }, [currentReport, organizationMembers, projectID]);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!selectedProjectID) {
        setProjectMembers([]);
        return;
      }

      setLoadingProjectMembers(true);
      try {
        const membersResult = await API.graphql({
          query: queries.projectMembersByProjectID,
          variables: { projectID: selectedProjectID }
        });
        
        const members = membersResult.data.projectMembersByProjectID.items
          .filter(m => !m._deleted)
          .map(m => ({
            userSub: m.userSub,
            email: m.email
          }));
        
        setProjectMembers(members);
        
        // Clear selected members if they're not part of the project
        const validMemberSubs = members.map(m => m.userSub);
        setSelectedMembers(prev => prev.filter(sub => validMemberSubs.includes(sub)));
        setSelectedMemberEmails(prev => {
          const validEmails = members.map(m => m.email);
          return prev.filter(email => validEmails.includes(email));
        });
      } catch (error) {
        console.error('Error fetching project members:', error);
      } finally {
        setLoadingProjectMembers(false);
      }
    };

    fetchProjectMembers();
  }, [selectedProjectID]);

  const resetForm = () => {
    setName('');
    setType('');
    setBones(null);
    setTarget('');
    setXaxis('');
    setYaxis('');
    setMedia('');
    setTrend(true);
    setSelectedProjectID(projectID || null);
    setSelectedMembers([]);
    setSelectedMemberEmails([]);
  };

  const handleClose = () => {
    resetForm();
    onHide();
  };

  const createReport = async () => {
    try {
      if (!organizationID) {
        console.error('No active organization found');
        return;
      }

      // Get current user's email
      const currentUser = await Auth.currentAuthenticatedUser();
      const ownerEmail = currentUser.attributes.email;

      console.log('Creating report with following data:',
        {
          name,
          type,
          assignedMembers: selectedMembers,
          memberEmails: selectedMemberEmails,
          organizationID,
          projectID: selectedProjectID,
          ownerEmail // Log the owner email
        }
      );

      const reportInput = {
        name: name || '',
        type: type || '',
        user_sub: userSub || '',
        ownerEmail: ownerEmail, // Set the owner's email
        organizationID: organizationID,
        projectID: selectedProjectID || null,
        ai_id: 'Lorem ipsum dolor sit amet',
        completed: false,
        bones: type === 'Fishbone Diagram Report' ? (bones || 0) : 
               type === 'Standard Work Report' ? 1 : null,
        media: type === 'Scatter Plot Report' ? media : '',
        target: type === 'Scatter Plot Report' ? target : 
                type === 'Run Chart Report' ? target : '',
        xaxis: type === 'Run Chart Report' ? xaxis : '',
        yaxis: type === 'Run Chart Report' ? yaxis : '',
        trend: type === 'Run Chart Report' ? trend : null,
        assignedMembers: selectedMembers
      };

      console.log('Creating report with input:', reportInput);

      const newReport = await API.graphql({
        query: mutations.createReport,
        variables: { input: reportInput }
      });

      const createdReport = newReport.data.createReport;
      console.log('Report created successfully:', createdReport);
      console.log('Report ID:', createdReport.id);
      console.log('Owner Email:', createdReport.ownerEmail);
      console.log('Assigned members in created report:', createdReport.assignedMembers);

      // Create highlights for specific report types
      if (type === 'Leadership Report' || type === 'A3 Project Report' || 
          type === 'DMAIC Report' || type === 'PDCA Report') {
        await createHighlights(createdReport.id, type);
      }

      if (type === 'Value Stream Mapping Report') {
        const vsmInput = {
          reportID: createdReport.id,
          process: '[]',
          informationFlow: '',
          kaizenProject: '',
          demandData: '{}',
          summaryData: '{}',
          inventory: '[]'
        };

        await API.graphql({
          query: mutations.createVsm,
          variables: { input: vsmInput }
        });
      }
      
      // Send email notification about the new report
      try {
        // Send notification to organization members
        console.log('Sending report creation notification...');
        await sendReportCreatedNotification(createdReport, organizationID);
        
        // Send notification to assigned members
        if (selectedMembers.length > 0 && selectedMemberEmails.length > 0) {
          console.log('Sending notifications to assigned members:', selectedMemberEmails);
          
          // Send notification directly using email addresses instead of looking up by user sub
          const notificationData = {
            reportName: createdReport.name,
            reportURL: `${window.location.origin}/report/${createdReport.id}`,
            reportType: createdReport.type
          };
          
          // Direct notification using email addresses
          await sendEmailNotification({
            type: 'REPORT_MEMBER_ADDED',
            to: selectedMemberEmails,
            data: notificationData,
            organizationID
          });
          
          console.log('Report assignment notifications sent successfully');
        } else {
          console.log('No members assigned to this report, skipping member notifications');
        }
        
        console.log('Report creation notifications sent successfully');
      } catch (emailError) {
        console.error('Error sending report creation notification:', emailError);
        // Continue execution even if email fails
      }

      resetForm();
      // Explicitly call onSuccess to ensure reports are refreshed
      console.log('Calling onSuccess to refresh reports list with newly created report. Report owner info:', {
        id: createdReport.id,
        name: createdReport.name,
        user_sub: createdReport.user_sub,
        ownerEmail: createdReport.ownerEmail
      });
      onSuccess(createdReport);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const updateReport = async () => {
    try {
      console.log('Updating report with following data:',
        {
          reportId: currentReport?.id,
          name,
          type,
          currentMembers: currentReport?.assignedMembers || [],
          selectedMembers,
          selectedMemberEmails,
          organizationID
        }
      );

      // If the report doesn't already have an ownerEmail, add the current user's email
      let ownerEmail = currentReport.ownerEmail;
      if (!ownerEmail) {
        // Get current user's email
        const currentUser = await Auth.currentAuthenticatedUser();
        ownerEmail = currentUser.attributes.email;
      }

      const reportInput = {
        id: currentReport.id,
        name: name || '',
        type: type || '',
        ownerEmail: ownerEmail, // Include owner's email in the update
        bones: type === 'Fishbone Diagram Report' ? (bones || 0) : 
               type === 'Standard Work Report' ? 1 : null,
        media: type === 'Scatter Plot Report' ? media : '',
        target: type === 'Scatter Plot Report' ? target : 
                type === 'Run Chart Report' ? target : '',
        xaxis: type === 'Run Chart Report' ? xaxis : '',
        yaxis: type === 'Run Chart Report' ? yaxis : '',
        trend: type === 'Run Chart Report' ? trend : null,
        projectID: selectedProjectID || null,
        _version: currentReport._version,
      };

      // Check for newly added members to send notifications
      const existingMembers = currentReport.assignedMembers || [];
      const newMembers = selectedMembers.filter(member => !existingMembers.includes(member));
      
      // Get emails for newly added members
      const newMemberEmails = newMembers.map(memberSub => {
        const member = organizationMembers.find(m => m.userSub === memberSub);
        return member?.email;
      }).filter(email => email); // Remove undefined/null values
      
      console.log('Existing members:', existingMembers);
      console.log('Selected members:', selectedMembers);
      console.log('Newly added members:', newMembers);
      console.log('New member emails:', newMemberEmails);
      
      // Always set assignedMembers (empty array if no members selected)
      reportInput.assignedMembers = selectedMembers;

      console.log('Updating report with input:', reportInput);
      console.log('assignedMembers field value:', reportInput.assignedMembers);

      const updatedReport = await API.graphql({
        query: mutations.updateReport,
        variables: { input: reportInput }
      });
      
      const updatedReportData = updatedReport.data.updateReport;
      console.log('Report updated successfully:', updatedReportData);
      console.log('Updated report assignedMembers:', updatedReportData.assignedMembers);
      
      // Send notifications to newly added members
      if (newMemberEmails.length > 0) {
        try {
          console.log('Sending notifications to newly added members:', newMemberEmails);
          
          // Send notification directly using email addresses
          const notificationData = {
            reportName: updatedReportData.name,
            reportURL: `${window.location.origin}/report/${updatedReportData.id}`,
            reportType: updatedReportData.type
          };
          
          await sendEmailNotification({
            type: 'REPORT_MEMBER_ADDED',
            to: newMemberEmails,
            data: notificationData,
            organizationID
          });
          
          console.log('Report member added notifications sent successfully');
        } catch (notificationError) {
          console.error('Error sending report member added notifications:', notificationError);
          // Continue execution even if email fails
        }
      } else {
        console.log('No new members added, skipping member notifications');
      }

      console.log('Calling onSuccess to refresh reports list with updated report. Report owner info:', {
        id: updatedReportData.id,
        name: updatedReportData.name,
        user_sub: updatedReportData.user_sub,
        ownerEmail: updatedReportData.ownerEmail
      });
      onSuccess(updatedReportData);
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentReport) {
        await updateReport();
      } else {
        await createReport();
      }
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectChange = (e) => {
    const newProjectId = e.target.value || null;
    setSelectedProjectID(newProjectId);
    
    // Clear selected members when changing projects
    if (!newProjectId) {
      setSelectedMembers([]);
      setSelectedMemberEmails([]);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton className="modal-header">
        <Modal.Title>{currentReport ? 'Edit Report' : 'Create Report'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter report name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              name="name"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Type
              {currentReport && (
                <small className="text-muted ms-2">
                  (Cannot be changed after creation)
                </small>
              )}
            </Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              name="type"
              required
              disabled={!!currentReport}
            >
              <option value="">Select type</option>
              <optgroup label="Lean Tools">
                {tools?.filter(tool => 
                  tool.type === "Lean Tools" && tool.id !== 0
                ).map((tool) => (
                  <option key={tool.id} value={tool.subtitle}>
                    {tool.subtitle}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Quality Improvement Tools">
                {tools?.filter(tool => 
                  tool.type === "Quality"
                ).map((tool) => (
                  <option key={tool.id} value={tool.subtitle}>
                    {tool.subtitle}
                  </option>
                ))}
              </optgroup>
            </Form.Select>
            {currentReport && (
              <Form.Text className="text-muted">
                To change the report type, please create a new report.
              </Form.Text>
            )}
          </Form.Group>

          {type === 'Fishbone Diagram Report' && (
            <Form.Group className="mb-3">
              <Form.Label>Number of Bones</Form.Label>
              <Form.Select
                value={bones || ''}
                onChange={(e) => setBones(Number(e.target.value))}
              >
                <option value="">Select number of bones</option>
                {[4, 6, 8].map((num) => (
                  <option key={num} value={num}>{num} bones</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {type === 'Run Chart Report' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Desired Trend</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    label="Positive (+)"
                    checked={trend === true}
                    onChange={() => setTrend(true)}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="Negative (-)"
                    checked={trend === false}
                    onChange={() => setTrend(false)}
                  />
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Target</Form.Label>
                <Form.Control
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>X Axis</Form.Label>
                <Form.Control
                  type="text"
                  value={xaxis}
                  onChange={(e) => setXaxis(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Y Axis</Form.Label>
                <Form.Control
                  type="text"
                  value={yaxis}
                  onChange={(e) => setYaxis(e.target.value)}
                />
              </Form.Group>
            </>
          )}

          {type === 'Scatter Plot Report' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>X Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={media}
                  onChange={(e) => setMedia(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Y Axis Label</Form.Label>
                <Form.Control
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </Form.Group>
            </>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Project (Optional)</Form.Label>
            <Form.Select
              value={selectedProjectID || ''}
              onChange={handleProjectChange}
              disabled={projectID !== null}
              name="project"
            >
              <option value="">No Project</option>
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3 assign-members-section">
            <Form.Label>Assign Members</Form.Label>
            {loadingMembers || loadingProjectMembers ? (
              <div className="text-center">
                <Spinner animation="border" size="sm" />
              </div>
            ) : (
              <>
                {selectedProjectID && projectMembers.length === 0 && (
                  <Alert variant="info" className="mb-3">
                    This project doesn't have any members yet. Please add members to the project first.
                  </Alert>
                )}
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {(selectedProjectID ? projectMembers : organizationMembers).map((member) => (
                    <Form.Check
                      key={member.userSub}
                      type="checkbox"
                      label={member.email}
                      checked={selectedMembers.includes(member.userSub)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, member.userSub]);
                          setSelectedMemberEmails([...selectedMemberEmails, member.email]);
                          console.log(`Added member: ${member.userSub}, email: ${member.email}`);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.userSub));
                          setSelectedMemberEmails(selectedMemberEmails.filter(email => email !== member.email));
                          console.log(`Removed member: ${member.userSub}, email: ${member.email}`);
                        }
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="modal-footer">
        <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" className="btn-primary" onClick={handleSubmit} disabled={!name || !type || isSubmitting}>
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
              {currentReport ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            currentReport ? 'Update' : 'Create'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReportModal; 