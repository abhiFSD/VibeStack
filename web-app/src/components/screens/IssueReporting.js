import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal, Tab, Tabs } from 'react-bootstrap';
import { API, Storage } from 'aws-amplify';
import { useUser } from '../../contexts/UserContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { listIssues, listIssueResponses } from '../../graphql/queries';
import { createIssue, createIssueResponse } from '../../graphql/mutations';
import { onCreateIssue, onUpdateIssue, onCreateIssueResponse } from '../../graphql/subscriptions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, 
  faCommentAlt, 
  faClock, 
  faCheckCircle, 
  faTimesCircle, 
  faExclamationCircle,
  faPaperclip
} from '@fortawesome/free-solid-svg-icons';

const IssueReporting = () => {
  const { user, dbUser } = useUser();
  const { activeOrganization } = useOrganization();
  const { isSuperAdmin } = useAdmin();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueResponses, setIssueResponses] = useState([]);
  const [activeTab, setActiveTab] = useState('my-issues');
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL_INQUIRY',
    priority: 'MEDIUM',
    attachments: []
  });
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAttachments, setResponseAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 'BUG', label: 'Bug Report', color: 'danger' },
    { value: 'FEATURE_REQUEST', label: 'Feature Request', color: 'info' },
    { value: 'TECHNICAL_SUPPORT', label: 'Technical Support', color: 'warning' },
    { value: 'GENERAL_INQUIRY', label: 'General Inquiry', color: 'secondary' },
    { value: 'FEEDBACK', label: 'Feedback', color: 'success' },
    { value: 'OTHER', label: 'Other', color: 'dark' }
  ];

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'success' },
    { value: 'MEDIUM', label: 'Medium', color: 'warning' },
    { value: 'HIGH', label: 'High', color: 'danger' },
    { value: 'CRITICAL', label: 'Critical', color: 'dark' }
  ];

  const statuses = [
    { value: 'OPEN', label: 'Open', color: 'primary', icon: <FontAwesomeIcon icon={faExclamationCircle} /> },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'warning', icon: <FontAwesomeIcon icon={faClock} /> },
    { value: 'RESOLVED', label: 'Resolved', color: 'success', icon: <FontAwesomeIcon icon={faCheckCircle} /> },
    { value: 'CLOSED', label: 'Closed', color: 'secondary', icon: <FontAwesomeIcon icon={faTimesCircle} /> }
  ];

  useEffect(() => {
    fetchIssues();
    
    // Subscribe to real-time updates for all issues across all organizations
    const createSubscription = API.graphql({
      query: onCreateIssue
    }).subscribe({
      next: ({ value }) => {
        const newIssue = value.data.onCreateIssue;
        setIssues(prev => [newIssue, ...prev]);
      }
    });

    const updateSubscription = API.graphql({
      query: onUpdateIssue
    }).subscribe({
      next: ({ value }) => {
        const updatedIssue = value.data.onUpdateIssue;
        setIssues(prev => prev.map(issue => 
          issue.id === updatedIssue.id ? updatedIssue : issue
        ));
      }
    });

    const responseSubscription = API.graphql({
      query: onCreateIssueResponse
    }).subscribe({
      next: ({ value }) => {
        const newResponse = value.data.onCreateIssueResponse;
        if (selectedIssue && newResponse.issueID === selectedIssue.id) {
          setIssueResponses(prev => [...prev, newResponse]);
        }
      }
    });

    return () => {
      createSubscription.unsubscribe();
      updateSubscription.unsubscribe();
      responseSubscription.unsubscribe();
    };
  }, [activeOrganization, selectedIssue]);

  const fetchIssues = async () => {
    try {
      const response = await API.graphql({
        query: listIssues
        // Removed organizationID filter to show all issues from all organizations
      });

      const fetchedIssues = response.data.listIssues.items.filter(issue => !issue._deleted);
      console.log('DEBUG: All fetched issues:', fetchedIssues.map(issue => ({
        id: issue.id,
        title: issue.title,
        reporterName: issue.reporterName,
        reporterID: issue.reporterID,
        organizationID: issue.organizationID
      })));
      setIssues(fetchedIssues);
    } catch (error) {
      console.error('Error fetching issues:', error);
      showAlert('Error fetching issues', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileKey = `issue-attachments/${Date.now()}-${file.name}`;
        await Storage.put(fileKey, file, {
          contentType: file.type,
          level: 'public'
        });
        return fileKey;
      });

      const uploadedKeys = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedKeys]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      showAlert('Error uploading files', 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleResponseFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileKey = `issue-response-attachments/${Date.now()}-${file.name}`;
        await Storage.put(fileKey, file, {
          contentType: file.type,
          level: 'public'
        });
        return fileKey;
      });

      const uploadedKeys = await Promise.all(uploadPromises);
      setResponseAttachments(prev => [...prev, ...uploadedKeys]);
    } catch (error) {
      console.error('Error uploading files:', error);
      showAlert('Error uploading files', 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    
    if (!activeOrganization) {
      showAlert('Please select an organization first', 'danger');
      return;
    }

    // Validate required fields
    if (!formData.title || !formData.description) {
      showAlert('Please fill in all required fields', 'danger');
      return;
    }

    if (!dbUser?.email || !dbUser?.firstName || !dbUser?.lastName || !dbUser?.cognitoID) {
      showAlert('User information is incomplete', 'danger');
      return;
    }
    
    try {
      const issueData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        status: 'OPEN',
        attachments: formData.attachments || [],
        reporterEmail: dbUser.email,
        reporterName: `${dbUser.firstName} ${dbUser.lastName}`,
        reporterID: dbUser.cognitoID,
        organizationID: activeOrganization.id
      };

      console.log('Submitting issue data:', issueData);

      await API.graphql({
        query: createIssue,
        variables: { input: issueData }
      });

      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'GENERAL_INQUIRY',
        priority: 'MEDIUM',
        attachments: []
      });
      showAlert('Issue submitted successfully!', 'success');
    } catch (error) {
      console.error('Error creating issue:', error);
      showAlert('Error submitting issue', 'danger');
    }
  };

  const handleAddResponse = async (e) => {
    e.preventDefault();
    
    try {
      const responseData = {
        message: responseMessage,
        isAdminResponse: false,
        responderEmail: dbUser.email,
        responderName: `${dbUser.firstName} ${dbUser.lastName}`,
        responderID: dbUser.cognitoID,
        issueID: selectedIssue.id,
        attachments: responseAttachments
      };

      await API.graphql({
        query: createIssueResponse,
        variables: { input: responseData }
      });

      setShowResponseModal(false);
      setResponseMessage('');
      setResponseAttachments([]);
      // Don't clear selectedIssue here, keep the detail modal open
      await fetchIssueResponses(selectedIssue.id); // Refresh responses
      showAlert('Response added successfully!', 'success');
    } catch (error) {
      console.error('Error adding response:', error);
      showAlert('Error adding response', 'danger');
    }
  };

  const fetchIssueResponses = async (issueId) => {
    try {
      const response = await API.graphql({
        query: listIssueResponses,
        variables: {
          filter: {
            issueID: { eq: issueId }
          }
        }
      });

      const responses = response.data.listIssueResponses.items
        .filter(resp => !resp._deleted)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setIssueResponses(responses);
    } catch (error) {
      console.error('Error fetching issue responses:', error);
      showAlert('Error loading conversation', 'danger');
    }
  };

  const handleViewIssue = (issue) => {
    navigate(`/issue/${issue.id}`);
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const getCategoryInfo = (category) => categories.find(c => c.value === category) || categories[3];
  const getPriorityInfo = (priority) => priorities.find(p => p.value === priority) || priorities[1];
  const getStatusInfo = (status) => statuses.find(s => s.value === status) || statuses[0];

  // Check if user is organization admin (owner or co-owner)
  const isOwner = activeOrganization?.owner === user?.attributes?.sub;
  const isCoOwner = activeOrganization?.additionalOwners?.includes(user?.attributes?.email);
  const isOrgAdmin = isOwner || isCoOwner;
  const canViewAllIssues = isSuperAdmin || isOrgAdmin;

  const filteredIssues = issues.filter(issue => {
    switch (activeTab) {
      case 'my-issues':
        return issue.reporterID === dbUser?.cognitoID;
      case 'all-issues':
        return true; // All users can see all issues
      case 'open':
        return issue.status === 'OPEN';
      case 'resolved':
        return (issue.status === 'RESOLVED' || issue.status === 'CLOSED');
      default:
        return true; // Show all by default
    }
  });

  console.log('DEBUG: Active tab:', activeTab);
  console.log('DEBUG: Total issues:', issues.length);
  console.log('DEBUG: Filtered issues:', filteredIssues.length);
  console.log('DEBUG: Current user ID:', dbUser?.cognitoID);

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Report Issues (Bugs)</h2>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              className="d-flex align-items-center gap-2"
            >
              <FontAwesomeIcon icon={faCommentAlt} />
              Report New Issue
            </Button>
          </div>

          {alert.show && (
            <Alert variant={alert.variant} className="mb-3">
              {alert.message}
            </Alert>
          )}

          <Tabs
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="mb-3"
          >
            <Tab eventKey="my-issues" title="My Issues">
              <IssueList issues={filteredIssues} loading={loading} onViewIssue={handleViewIssue} />
            </Tab>
            <Tab eventKey="all-issues" title="All Issues">
              <IssueList issues={filteredIssues} loading={loading} onViewIssue={handleViewIssue} />
            </Tab>
            <Tab eventKey="open" title="Open Issues">
              <IssueList issues={filteredIssues} loading={loading} onViewIssue={handleViewIssue} />
            </Tab>
            <Tab eventKey="resolved" title="Resolved Issues">
              <IssueList issues={filteredIssues} loading={loading} onViewIssue={handleViewIssue} />
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Create Issue Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Report New Issue</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitIssue}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="Brief description of the issue"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    placeholder="Detailed description of the issue..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Attachments</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    disabled={uploading}
                  />
                  {uploading && <small className="text-muted">Uploading...</small>}
                  {formData.attachments.length > 0 && (
                    <small className="text-success">
                      {formData.attachments.length} file(s) uploaded
                    </small>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              Submit Issue
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Add Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Response</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddResponse}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Your Response</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                required
                placeholder="Add your response or update..."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add Response
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Issue Detail Modal with Conversation Thread */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Issue Details & Conversation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIssue && (
            <div>
              {/* Issue Header */}
              <Row className="mb-3">
                <Col md={8}>
                  <h5>{selectedIssue.title}</h5>
                  <div className="d-flex gap-2 mb-2">
                    <Badge bg={getStatusInfo(selectedIssue.status).color}>
                      {getStatusInfo(selectedIssue.status).icon}
                      {getStatusInfo(selectedIssue.status).label}
                    </Badge>
                    <Badge bg={getPriorityInfo(selectedIssue.priority).color}>
                      {getPriorityInfo(selectedIssue.priority).label}
                    </Badge>
                    <Badge bg={getCategoryInfo(selectedIssue.category).color}>
                      {getCategoryInfo(selectedIssue.category).label}
                    </Badge>
                  </div>
                </Col>
                <Col md={4}>
                  <small className="text-muted">
                    Created: {new Date(selectedIssue.createdAt).toLocaleString()}
                  </small>
                </Col>
              </Row>
              
              {/* Issue Description */}
              <Row className="mb-3">
                <Col>
                  <strong>Description:</strong>
                  <p className="mt-1">{selectedIssue.description}</p>
                </Col>
              </Row>

              {/* Attachments */}
              {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                <Row className="mb-3">
                  <Col>
                    <strong>Attachments:</strong>
                    <div className="mt-2 d-flex flex-column gap-1">
                      {selectedIssue.attachments.map((attachment, index) => (
                        <AttachmentDisplay key={index} attachment={attachment} />
                      ))}
                    </div>
                  </Col>
                </Row>
              )}

              <hr />

              {/* Conversation Thread */}
              <div className="mb-3">
                <h6>Conversation</h6>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }} className="border rounded p-2">
                  {issueResponses.length === 0 ? (
                    <div className="text-center text-muted py-3">
                      No responses yet. Be the first to reply!
                    </div>
                  ) : (
                    issueResponses.map((response) => (
                      <div key={response.id} className={`mb-3 p-2 rounded ${response.isAdminResponse ? 'bg-light border-start border-primary border-3' : 'bg-white border'}`}>
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <strong className={response.isAdminResponse ? 'text-primary' : 'text-dark'}>
                            {response.isAdminResponse ? '👑 ' : ''}{response.responderName}
                            {response.isAdminResponse && <Badge bg="primary" className="ms-1">Admin</Badge>}
                          </strong>
                          <small className="text-muted">
                            {new Date(response.createdAt).toLocaleString()}
                          </small>
                        </div>
                        <p className="mb-0">{response.message}</p>
                        {response.attachments && response.attachments.length > 0 && (
                          <div className="mt-2">
                            <small className="text-muted d-block mb-1">Attachments:</small>
                            <div className="d-flex flex-column gap-1">
                              {response.attachments.map((attachment, index) => (
                                <AttachmentDisplay key={index} attachment={attachment} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Reply Form */}
              <Form onSubmit={handleAddResponse}>
                <Form.Group className="mb-3">
                  <Form.Label>Add Response</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response here..."
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Attachments (optional)</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleResponseFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    disabled={uploading}
                  />
                  {uploading && <small className="text-muted">Uploading...</small>}
                  {responseAttachments.length > 0 && (
                    <div className="mt-2">
                      <small className="text-success">
                        <FontAwesomeIcon icon={faPaperclip} /> {responseAttachments.length} file(s) uploaded
                      </small>
                      <div className="mt-1">
                        {responseAttachments.map((attachment, index) => (
                          <Badge key={index} bg="secondary" className="me-1">
                            {attachment.split('/').pop()}
                            <Button
                              variant="link"
                              size="sm"
                              className="text-white p-0 ms-1"
                              onClick={() => setResponseAttachments(prev => prev.filter((_, i) => i !== index))}
                              style={{ fontSize: '0.7rem' }}
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Form.Group>
                
                <div className="d-flex justify-content-end">
                  <Button variant="primary" type="submit" disabled={!responseMessage.trim() || uploading}>
                    <FontAwesomeIcon icon={faCommentAlt} /> Send Reply
                  </Button>
                </div>
              </Form>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

const IssueList = ({ issues, loading, onViewIssue }) => {
  const getCategoryInfo = (category) => {
    const categories = [
      { value: 'BUG', label: 'Bug Report', color: 'danger' },
      { value: 'FEATURE_REQUEST', label: 'Feature Request', color: 'info' },
      { value: 'TECHNICAL_SUPPORT', label: 'Technical Support', color: 'warning' },
      { value: 'GENERAL_INQUIRY', label: 'General Inquiry', color: 'secondary' },
      { value: 'FEEDBACK', label: 'Feedback', color: 'success' },
      { value: 'OTHER', label: 'Other', color: 'dark' }
    ];
    return categories.find(c => c.value === category) || categories[3];
  };

  const getPriorityInfo = (priority) => {
    const priorities = [
      { value: 'LOW', label: 'Low', color: 'success' },
      { value: 'MEDIUM', label: 'Medium', color: 'warning' },
      { value: 'HIGH', label: 'High', color: 'danger' },
      { value: 'CRITICAL', label: 'Critical', color: 'dark' }
    ];
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const getStatusInfo = (status) => {
    const statuses = [
      { value: 'OPEN', label: 'Open', color: 'primary', icon: <FontAwesomeIcon icon={faExclamationCircle} /> },
      { value: 'IN_PROGRESS', label: 'In Progress', color: 'warning', icon: <FontAwesomeIcon icon={faClock} /> },
      { value: 'RESOLVED', label: 'Resolved', color: 'success', icon: <FontAwesomeIcon icon={faCheckCircle} /> },
      { value: 'CLOSED', label: 'Closed', color: 'secondary', icon: <FontAwesomeIcon icon={faTimesCircle} /> }
    ];
    return statuses.find(s => s.value === status) || statuses[0];
  };

  if (loading) {
    return <div className="text-center py-4">Loading issues...</div>;
  }

  if (issues.length === 0) {
    return (
      <Card className="text-center py-4">
        <Card.Body>
          <h5>No issues found</h5>
          <p className="text-muted">No issues match the current filter criteria.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Row>
      {issues.map((issue) => {
        const categoryInfo = getCategoryInfo(issue.category);
        const priorityInfo = getPriorityInfo(issue.priority);
        const statusInfo = getStatusInfo(issue.status);

        return (
          <Col md={6} lg={4} key={issue.id} className="mb-3">
            <Card className="h-100" style={{ cursor: 'pointer' }} onClick={() => onViewIssue(issue)}>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <Badge bg={statusInfo.color} className="d-flex align-items-center gap-1">
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
                <Badge bg={priorityInfo.color}>{priorityInfo.label}</Badge>
              </Card.Header>
              <Card.Body>
                <Card.Title className="mb-2">{issue.title}</Card.Title>
                <Card.Text className="text-muted small mb-2">
                  {issue.description.length > 100 
                    ? `${issue.description.substring(0, 100)}...` 
                    : issue.description
                  }
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                  <Badge bg={categoryInfo.color}>{categoryInfo.label}</Badge>
                  <small className="text-muted">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </small>
                </div>
                {issue.attachments && issue.attachments.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faUpload} /> {issue.attachments.length} attachment(s)
                    </small>
                  </div>
                )}
              </Card.Body>
              <Card.Footer>
                <small className="text-muted">
                  Reported by: {issue.reporterName || 'Unknown User'}
                </small>
              </Card.Footer>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

const AttachmentDisplay = ({ attachment }) => {
  const [signedUrl, setSignedUrl] = useState(null);
  const fileName = attachment.split('/').pop();
  const fileExtension = fileName.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension);
  const isPdf = fileExtension === 'pdf';

  useEffect(() => {
    const getSignedUrl = async () => {
      try {
        const url = await Storage.get(attachment, { level: 'public' });
        setSignedUrl(url);
      } catch (error) {
        console.error('Error getting signed URL:', error);
      }
    };

    getSignedUrl();
  }, [attachment]);

  if (!signedUrl) {
    return (
      <Badge bg="secondary" className="me-1">
        <FontAwesomeIcon icon={faPaperclip} /> Loading...
      </Badge>
    );
  }

  if (isImage) {
    return (
      <div className="d-inline-block me-2 mb-1">
        <img
          src={signedUrl}
          alt={fileName}
          style={{ 
            maxWidth: '100px', 
            maxHeight: '100px', 
            objectFit: 'cover',
            cursor: 'pointer',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
          onClick={() => window.open(signedUrl, '_blank')}
          title={`Click to view ${fileName}`}
        />
        <div>
          <small className="text-muted">{fileName}</small>
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="d-block mb-2" style={{ width: 'fit-content' }}>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => window.open(signedUrl, '_blank')}
          className="text-start d-flex align-items-center"
          style={{ 
            minWidth: '200px', 
            maxWidth: '300px',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          <FontAwesomeIcon icon={faPaperclip} className="me-2 flex-shrink-0" />
          <span 
            className="text-truncate"
            style={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0
            }}
          >
            {fileName}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="d-inline-block me-2 mb-1">
      <a
        href={signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-outline-secondary btn-sm"
      >
        <FontAwesomeIcon icon={faPaperclip} /> {fileName}
      </a>
    </div>
  );
};

export default IssueReporting;