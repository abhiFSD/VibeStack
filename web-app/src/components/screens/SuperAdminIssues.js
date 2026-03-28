import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Modal, Tab, Tabs, Table, Dropdown } from 'react-bootstrap';
import { API, Storage } from 'aws-amplify';
import { useUser } from '../../contexts/UserContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { listIssues, listIssueResponses, listOrganizations } from '../../graphql/queries';
import { updateIssue, createIssueResponse, deleteIssue, deleteIssueResponse } from '../../graphql/mutations';
import { onCreateIssue, onUpdateIssue, onCreateIssueResponse } from '../../graphql/subscriptions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCommentAlt, 
  faClock, 
  faCheckCircle, 
  faTimesCircle, 
  faExclamationCircle, 
  faUser, 
  faCalendar,
  faPaperclip,
  faEnvelope,
  faBuilding,
  faFilter,
  faEye,
  faEdit,
  faPaperPlane,
  faTrash,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const SuperAdminIssues = () => {
  const { user, dbUser } = useUser();
  const { isSuperAdmin } = useAdmin();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState(null);
  const [issueResponses, setIssueResponses] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    organization: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

  // Form states
  const [responseMessage, setResponseMessage] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');

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
    if (!isSuperAdmin) return;
    
    fetchIssues();
    
    // Subscribe to real-time updates
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
  }, [isSuperAdmin, selectedIssue]);

  const fetchIssues = async () => {
    try {
      const response = await API.graphql({
        query: listIssues
      });

      const fetchedIssues = response.data.listIssues.items.filter(issue => !issue._deleted);
      setIssues(fetchedIssues);
      
      // Extract unique organizations and fetch their details
      const uniqueOrgIds = [...new Set(fetchedIssues.map(issue => issue.organizationID))];
      
      // Fetch organization details
      const orgResponse = await API.graphql({
        query: listOrganizations
      });
      
      const allOrgs = orgResponse.data.listOrganizations.items.filter(org => !org._deleted);
      const relevantOrgs = allOrgs.filter(org => uniqueOrgIds.includes(org.id));
      setOrganizations(relevantOrgs);
    } catch (error) {
      console.error('Error fetching issues:', error);
      showAlert('Error fetching issues', 'danger');
    } finally {
      setLoading(false);
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

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      const issueToUpdate = issues.find(issue => issue.id === issueId);
      if (!issueToUpdate) return;

      await API.graphql({
        query: updateIssue,
        variables: {
          input: {
            id: issueId,
            status: newStatus,
            _version: issueToUpdate._version
          }
        }
      });

      showAlert(`Issue status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating issue:', error);
      showAlert('Error updating issue status', 'danger');
    }
  };

  const handleDeleteIssue = async () => {
    if (!issueToDelete) return;

    try {
      // First delete all responses associated with this issue
      const responses = await API.graphql({
        query: listIssueResponses,
        variables: {
          filter: {
            issueID: { eq: issueToDelete.id }
          }
        }
      });

      const responseItems = responses.data.listIssueResponses.items.filter(resp => !resp._deleted);
      
      // Delete all responses
      for (const response of responseItems) {
        await API.graphql({
          query: deleteIssueResponse,
          variables: {
            input: {
              id: response.id
            }
          }
        });
      }

      // Then delete the issue
      await API.graphql({
        query: deleteIssue,
        variables: {
          input: {
            id: issueToDelete.id
          }
        }
      });

      // Remove from local state
      setIssues(prev => prev.filter(issue => issue.id !== issueToDelete.id));
      
      // Close modals and clear state
      setShowDeleteModal(false);
      setShowDetailModal(false);
      setIssueToDelete(null);
      setSelectedIssue(null);
      setConfirmDelete('');
      
      showAlert('Issue and all associated data deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting issue:', error);
      showAlert('Error deleting issue', 'danger');
    }
  };

  const handleAddAdminResponse = async (e) => {
    e.preventDefault();
    
    try {
      const responseData = {
        message: responseMessage,
        isAdminResponse: true,
        responderEmail: dbUser.email,
        responderName: `${dbUser.firstName} ${dbUser.lastName}`,
        responderID: dbUser.cognitoID,
        issueID: selectedIssue.id,
        attachments: []
      };

      await API.graphql({
        query: createIssueResponse,
        variables: { input: responseData }
      });

      // Update status if provided
      if (statusUpdate) {
        await handleUpdateStatus(selectedIssue.id, statusUpdate);
      }

      setShowResponseModal(false);
      setResponseMessage('');
      setStatusUpdate('');
      // Don't clear selectedIssue here, keep the detail modal open
      await fetchIssueResponses(selectedIssue.id); // Refresh responses
      showAlert('Admin response added successfully!', 'success');
    } catch (error) {
      console.error('Error adding admin response:', error);
      showAlert('Error adding admin response', 'danger');
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const getCategoryInfo = (category) => categories.find(c => c.value === category) || categories[3];
  const getPriorityInfo = (priority) => priorities.find(p => p.value === priority) || priorities[1];
  const getStatusInfo = (status) => statuses.find(s => s.value === status) || statuses[0];

  const filteredIssues = issues.filter(issue => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'open' && issue.status === 'OPEN') ||
      (activeTab === 'in-progress' && issue.status === 'IN_PROGRESS') ||
      (activeTab === 'resolved' && (issue.status === 'RESOLVED' || issue.status === 'CLOSED'));

    const matchesFilters = 
      (!filters.status || issue.status === filters.status) &&
      (!filters.priority || issue.priority === filters.priority) &&
      (!filters.category || issue.category === filters.category) &&
      (!filters.organization || issue.organizationID === filters.organization);

    return matchesTab && matchesFilters;
  });

  if (!isSuperAdmin) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          You don't have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Report Issues (Bugs) - Super Admin</h2>
            <div className="d-flex gap-2">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  <FontAwesomeIcon icon={faFilter} /> Filters
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <div className="p-3" style={{ minWidth: '250px' }}>
                    <Form.Group className="mb-2">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                      >
                        <option value="">All Statuses</option>
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Priority</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.priority}
                        onChange={(e) => setFilters({...filters, priority: e.target.value})}
                      >
                        <option value="">All Priorities</option>
                        {priorities.map(priority => (
                          <option key={priority.value} value={priority.value}>{priority.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                      >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button 
                      size="sm" 
                      variant="outline-primary" 
                      onClick={() => setFilters({ status: '', priority: '', category: '', organization: '' })}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            </div>
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
            <Tab eventKey="all" title={`All Issues (${filteredIssues.length})`}>
              <IssueTable 
                issues={filteredIssues} 
                loading={loading} 
                onViewIssue={handleViewIssue}
                onRespondToIssue={(issue) => {
                  setSelectedIssue(issue);
                  setShowResponseModal(true);
                }}
                onUpdateStatus={handleUpdateStatus}
                onDeleteIssue={(issue) => {
                  setIssueToDelete(issue);
                  setShowDeleteModal(true);
                }}
              />
            </Tab>
            <Tab eventKey="open" title="Open Issues">
              <IssueTable 
                issues={filteredIssues} 
                loading={loading} 
                onViewIssue={handleViewIssue}
                onRespondToIssue={(issue) => {
                  setSelectedIssue(issue);
                  setShowResponseModal(true);
                }}
                onUpdateStatus={handleUpdateStatus}
                onDeleteIssue={(issue) => {
                  setIssueToDelete(issue);
                  setShowDeleteModal(true);
                }}
              />
            </Tab>
            <Tab eventKey="in-progress" title="In Progress">
              <IssueTable 
                issues={filteredIssues} 
                loading={loading} 
                onViewIssue={handleViewIssue}
                onRespondToIssue={(issue) => {
                  setSelectedIssue(issue);
                  setShowResponseModal(true);
                }}
                onUpdateStatus={handleUpdateStatus}
                onDeleteIssue={(issue) => {
                  setIssueToDelete(issue);
                  setShowDeleteModal(true);
                }}
              />
            </Tab>
            <Tab eventKey="resolved" title="Resolved">
              <IssueTable 
                issues={filteredIssues} 
                loading={loading} 
                onViewIssue={handleViewIssue}
                onRespondToIssue={(issue) => {
                  setSelectedIssue(issue);
                  setShowResponseModal(true);
                }}
                onUpdateStatus={handleUpdateStatus}
                onDeleteIssue={(issue) => {
                  setIssueToDelete(issue);
                  setShowDeleteModal(true);
                }}
              />
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Issue Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Issue Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIssue && (
            <div>
              <Row className="mb-3">
                <Col md={8}>
                  <h5>{selectedIssue.title}</h5>
                  <div className="d-flex gap-2 mb-2">
                    <Badge bg={getStatusInfo(selectedIssue.status).color}>
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
                    <FontAwesomeIcon icon={faCalendar} /> {new Date(selectedIssue.createdAt).toLocaleString()}
                  </small>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col>
                  <strong>Description:</strong>
                  <p className="mt-1">{selectedIssue.description}</p>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <strong><FontAwesomeIcon icon={faUser} /> Reporter:</strong>
                  <div>{selectedIssue.reporterName}</div>
                  <div className="text-muted">{selectedIssue.reporterEmail}</div>
                </Col>
                <Col md={6}>
                  <strong><FontAwesomeIcon icon={faBuilding} /> Organization:</strong>
                  <div className="text-muted">
                    <div>Organization ID: {selectedIssue.organizationID}</div>
                    {organizations.find(org => org.id === selectedIssue.organizationID)?.name && (
                      <div>Name: {organizations.find(org => org.id === selectedIssue.organizationID).name}</div>
                    )}
                  </div>
                </Col>
              </Row>

              {selectedIssue.attachments && selectedIssue.attachments.length > 0 && (
                <Row className="mb-3">
                  <Col>
                    <strong><FontAwesomeIcon icon={faPaperclip} /> Attachments:</strong>
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
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="danger" 
            onClick={() => {
              setIssueToDelete(selectedIssue);
              setShowDeleteModal(true);
            }}
          >
            <FontAwesomeIcon icon={faTrash} /> Delete Issue
          </Button>
          <div className="ms-auto d-flex gap-2">
            <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setShowDetailModal(false);
                setShowResponseModal(true);
              }}
            >
              <FontAwesomeIcon icon={faCommentAlt} /> Respond
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Admin Response Modal */}
      <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Admin Response</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAdminResponse}>
          <Modal.Body>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Admin Response *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    required
                    placeholder="Provide your response to the user..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Update Status</Form.Label>
                  <Form.Select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    <option value="">Keep Current Status</option>
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <FontAwesomeIcon icon={faPaperPlane} /> Send Response
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} /> Delete Issue
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {issueToDelete && (
            <div>
              <Alert variant="danger">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                <strong>Warning: This action cannot be undone!</strong>
              </Alert>
              
              <p>You are about to permanently delete the following issue and ALL associated data:</p>
              
              <div className="bg-light p-3 rounded mb-3">
                <h6><strong>Title:</strong> {issueToDelete.title}</h6>
                <p><strong>Description:</strong> {issueToDelete.description}</p>
                <div className="d-flex gap-2 mb-2">
                  <Badge bg={getStatusInfo(issueToDelete.status).color}>
                    {getStatusInfo(issueToDelete.status).label}
                  </Badge>
                  <Badge bg={getPriorityInfo(issueToDelete.priority).color}>
                    {getPriorityInfo(issueToDelete.priority).label}
                  </Badge>
                  <Badge bg={getCategoryInfo(issueToDelete.category).color}>
                    {getCategoryInfo(issueToDelete.category).label}
                  </Badge>
                </div>
                <small className="text-muted">
                  <strong>Reporter:</strong> {issueToDelete.reporterName} ({issueToDelete.reporterEmail})
                  <br />
                  <strong>Organization:</strong> {
                    organizations.find(org => org.id === issueToDelete.organizationID)?.name || 'Unknown'
                  } (ID: {issueToDelete.organizationID})
                  <br />
                  <strong>Created:</strong> {new Date(issueToDelete.createdAt).toLocaleString()}
                </small>
              </div>

              <Alert variant="warning">
                <h6>This will permanently delete:</h6>
                <ul className="mb-0">
                  <li>The issue record</li>
                  <li>All conversation responses</li>
                  <li>All attachments (files will remain in S3 but become inaccessible)</li>
                  <li>All related metadata</li>
                </ul>
              </Alert>

              <p className="mb-0">
                <strong>Type "DELETE" below to confirm:</strong>
              </p>
              <Form.Control
                type="text"
                placeholder="Type DELETE to confirm"
                onChange={(e) => setConfirmDelete(e.target.value)}
                className="mt-2"
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowDeleteModal(false);
            setIssueToDelete(null);
            setConfirmDelete('');
          }}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteIssue}
            disabled={confirmDelete !== 'DELETE'}
          >
            <FontAwesomeIcon icon={faTrash} /> Delete Permanently
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

const IssueTable = ({ issues, loading, onViewIssue, onRespondToIssue, onUpdateStatus, onDeleteIssue }) => {
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
    <div style={{ minHeight: '400px' }}>
      <Table responsive hover className="align-middle">
        <thead>
          <tr>
            <th style={{ width: '25%' }}>Title</th>
            <th style={{ width: '12%' }}>Status</th>
            <th style={{ width: '10%' }}>Priority</th>
            <th style={{ width: '12%' }}>Category</th>
            <th style={{ width: '18%' }}>Reporter</th>
            <th style={{ width: '10%' }}>Created</th>
            <th style={{ width: '13%' }}>Actions</th>
          </tr>
        </thead>
      <tbody>
        {issues.map((issue) => {
          const categoryInfo = getCategoryInfo(issue.category);
          const priorityInfo = getPriorityInfo(issue.priority);
          const statusInfo = getStatusInfo(issue.status);

          return (
            <tr key={issue.id}>
              <td>
                <div>
                  <strong>{issue.title}</strong>
                  {issue.attachments && issue.attachments.length > 0 && (
                    <div>
                      <small className="text-muted">
                        <FontAwesomeIcon icon={faPaperclip} /> {issue.attachments.length} file(s)
                      </small>
                    </div>
                  )}
                </div>
              </td>
              <td>
                <Badge bg={statusInfo.color} className="d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
              </td>
              <td>
                <Badge bg={priorityInfo.color}>{priorityInfo.label}</Badge>
              </td>
              <td>
                <Badge bg={categoryInfo.color}>{categoryInfo.label}</Badge>
              </td>
              <td>
                <div>
                  <div>{issue.reporterName}</div>
                  <small className="text-muted">{issue.reporterEmail}</small>
                </div>
              </td>
              <td>
                <small>{new Date(issue.createdAt).toLocaleDateString()}</small>
              </td>
              <td>
                <div className="d-flex gap-2 flex-nowrap">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => onViewIssue(issue)}
                    title="View Details"
                    style={{ minWidth: '32px' }}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-success"
                    onClick={() => onRespondToIssue(issue)}
                    title="Respond"
                    style={{ minWidth: '32px' }}
                  >
                    <FontAwesomeIcon icon={faCommentAlt} />
                  </Button>
                  <Dropdown drop="start">
                    <Dropdown.Toggle 
                      size="sm" 
                      variant="outline-secondary"
                      title="More Actions"
                      style={{ minWidth: '32px' }}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => onUpdateStatus(issue.id, 'IN_PROGRESS')}>
                        <FontAwesomeIcon icon={faClock} className="me-2" />
                        Mark In Progress
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => onUpdateStatus(issue.id, 'RESOLVED')}>
                        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                        Mark Resolved
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => onUpdateStatus(issue.id, 'CLOSED')}>
                        <FontAwesomeIcon icon={faTimesCircle} className="me-2" />
                        Close Issue
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={() => onUpdateStatus(issue.id, 'OPEN')}>
                        <FontAwesomeIcon icon={faExclamationCircle} className="me-2" />
                        Reopen Issue
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item 
                        onClick={() => onDeleteIssue(issue)}
                        className="text-danger"
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Delete Issue
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
      </Table>
    </div>
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

export default SuperAdminIssues;