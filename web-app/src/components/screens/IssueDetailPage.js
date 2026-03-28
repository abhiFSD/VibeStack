import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { API, Storage } from 'aws-amplify';
import { useUser } from '../../contexts/UserContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useParams, useNavigate } from 'react-router-dom';
import { listIssues, listIssueResponses, listOrganizations } from '../../graphql/queries';
import { createIssueResponse, updateIssue } from '../../graphql/mutations';
import { onCreateIssueResponse, onUpdateIssue } from '../../graphql/subscriptions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faCommentAlt, 
  faClock, 
  faCheckCircle, 
  faTimesCircle, 
  faExclamationCircle, 
  faUser, 
  faCalendar,
  faPaperclip,
  faBuilding,
  faPaperPlane,
  faUpload
} from '@fortawesome/free-solid-svg-icons';

const IssueDetailPage = () => {
  const { issueId } = useParams();
  const navigate = useNavigate();
  const { user, dbUser } = useUser();
  const { activeOrganization } = useOrganization();
  const { isSuperAdmin } = useAdmin();
  
  const [issue, setIssue] = useState(null);
  const [responses, setResponses] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAttachments, setResponseAttachments] = useState([]);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

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
    if (issueId) {
      fetchIssueDetails();
      fetchOrganizations();
    }
  }, [issueId]);

  useEffect(() => {
    if (!issue) return;

    // Subscribe to real-time response updates
    const responseSubscription = API.graphql({
      query: onCreateIssueResponse
    }).subscribe({
      next: ({ value }) => {
        const newResponse = value.data.onCreateIssueResponse;
        if (newResponse.issueID === issue.id) {
          setResponses(prev => [...prev, newResponse]);
        }
      }
    });

    // Subscribe to issue status updates
    const issueSubscription = API.graphql({
      query: onUpdateIssue
    }).subscribe({
      next: ({ value }) => {
        const updatedIssue = value.data.onUpdateIssue;
        if (updatedIssue.id === issue.id) {
          setIssue(updatedIssue);
        }
      }
    });

    return () => {
      responseSubscription.unsubscribe();
      issueSubscription.unsubscribe();
    };
  }, [issue]);

  const fetchIssueDetails = async () => {
    try {
      const issuesResponse = await API.graphql({
        query: listIssues,
        variables: {
          filter: { id: { eq: issueId } }
        }
      });

      const foundIssue = issuesResponse.data.listIssues.items.find(i => i.id === issueId && !i._deleted);
      if (!foundIssue) {
        showAlert('Issue not found', 'danger');
        navigate(-1);
        return;
      }

      setIssue(foundIssue);

      // Fetch responses for this issue
      const responsesResponse = await API.graphql({
        query: listIssueResponses,
        variables: {
          filter: { issueID: { eq: issueId } }
        }
      });

      const issueResponses = responsesResponse.data.listIssueResponses.items
        .filter(resp => !resp._deleted)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setResponses(issueResponses);
    } catch (error) {
      console.error('Error fetching issue details:', error);
      showAlert('Error loading issue details', 'danger');
    } finally {
      setLoading(false);
    }
  };


  const fetchOrganizations = async () => {
    try {
      const response = await API.graphql({
        query: listOrganizations
      });
      
      const orgs = response.data.listOrganizations.items.filter(org => !org._deleted);
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
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

  const handleAddResponse = async (e) => {
    e.preventDefault();
    
    if (!responseMessage.trim()) {
      showAlert('Please enter a response message', 'warning');
      return;
    }

    setResponseLoading(true);
    try {
      const responseData = {
        message: responseMessage.trim(),
        isAdminResponse: isSuperAdmin,
        responderEmail: dbUser.email,
        responderName: `${dbUser.firstName} ${dbUser.lastName}`,
        responderID: dbUser.cognitoID,
        issueID: issue.id,
        attachments: responseAttachments
      };

      await API.graphql({
        query: createIssueResponse,
        variables: { input: responseData }
      });

      // Update status if provided (admin only)
      if (statusUpdate && isSuperAdmin) {
        await API.graphql({
          query: updateIssue,
          variables: {
            input: {
              id: issue.id,
              status: statusUpdate,
              _version: issue._version
            }
          }
        });
      }

      setResponseMessage('');
      setResponseAttachments([]);
      setStatusUpdate('');
      showAlert('Response added successfully!', 'success');
    } catch (error) {
      console.error('Error adding response:', error);
      showAlert('Error adding response', 'danger');
    } finally {
      setResponseLoading(false);
    }
  };

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 5000);
  };

  const getCategoryInfo = (category) => categories.find(c => c.value === category) || categories[3];
  const getPriorityInfo = (priority) => priorities.find(p => p.value === priority) || priorities[1];
  const getStatusInfo = (status) => statuses.find(s => s.value === status) || statuses[0];
  const getOrganizationName = (orgId) => organizations.find(org => org.id === orgId)?.name || 'Unknown';

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading issue details...</p>
      </Container>
    );
  }

  if (!issue) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Issue not found or you don't have permission to view it.</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-3">
      <Row>
        {/* Main Content */}
        <Col lg={12}>
          <div className="d-flex align-items-center mb-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate(-1)}
              className="me-3"
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </Button>
            <h2 className="mb-0">Issue Details</h2>
          </div>

          {alert.show && (
            <Alert variant={alert.variant} className="mb-4">
              {alert.message}
            </Alert>
          )}

          {/* Issue Header Card */}
          <Card className="mb-4">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h4 className="mb-2">{issue.title}</h4>
                  <div className="d-flex gap-2 flex-wrap">
                    <Badge bg={getStatusInfo(issue.status).color} className="d-flex align-items-center gap-1">
                      {getStatusInfo(issue.status).icon}
                      {getStatusInfo(issue.status).label}
                    </Badge>
                    <Badge bg={getPriorityInfo(issue.priority).color}>
                      {getPriorityInfo(issue.priority).label}
                    </Badge>
                    <Badge bg={getCategoryInfo(issue.category).color}>
                      {getCategoryInfo(issue.category).label}
                    </Badge>
                  </div>
                </Col>
                <Col xs="auto">
                  <small className="text-muted">
                    <FontAwesomeIcon icon={faCalendar} /> {new Date(issue.createdAt).toLocaleString()}
                  </small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <strong><FontAwesomeIcon icon={faUser} /> Reporter:</strong>
                  <div>{issue.reporterName}</div>
                  <div className="text-muted">{issue.reporterEmail}</div>
                </Col>
                <Col md={6}>
                  <strong><FontAwesomeIcon icon={faBuilding} /> Organization:</strong>
                  <div>{getOrganizationName(issue.organizationID)}</div>
                  <div className="text-muted">ID: {issue.organizationID}</div>
                </Col>
              </Row>

              <div className="mb-3">
                <strong>Description:</strong>
                <p className="mt-2">{issue.description}</p>
              </div>

              {issue.attachments && issue.attachments.length > 0 && (
                <div>
                  <strong><FontAwesomeIcon icon={faPaperclip} /> Attachments:</strong>
                  <div className="mt-2 d-flex flex-column gap-1">
                    {issue.attachments.map((attachment, index) => (
                      <AttachmentDisplay key={index} attachment={attachment} />
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Conversation Thread */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0"><FontAwesomeIcon icon={faCommentAlt} /> Conversation ({responses.length})</h5>
            </Card.Header>
            <Card.Body>
              {responses.length === 0 ? (
                <div className="text-center text-muted py-4">
                  <FontAwesomeIcon icon={faCommentAlt} size="2x" className="mb-2" />
                  <p>No responses yet. Be the first to reply!</p>
                </div>
              ) : (
                responses.map((response) => (
                  <div key={response.id} className={`mb-3 p-3 rounded ${
                    response.isAdminResponse 
                      ? 'bg-light border-start border-primary border-4' 
                      : 'bg-white border border-light'
                  }`}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className={response.isAdminResponse ? 'text-primary' : 'text-dark'}>
                          {response.isAdminResponse ? '👑 ' : ''}{response.responderName}
                          {response.isAdminResponse && <Badge bg="primary" className="ms-2">Admin</Badge>}
                        </strong>
                        <div className="text-muted small">{response.responderEmail}</div>
                      </div>
                      <small className="text-muted">
                        {new Date(response.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <p className="mb-2">{response.message}</p>
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
            </Card.Body>
          </Card>

          {/* Response Form */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Add Response</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddResponse}>
                <Form.Group className="mb-3">
                  <Form.Label>Your Response *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
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

                {isSuperAdmin && (
                  <Form.Group className="mb-3">
                    <Form.Label>Update Status (Admin Only)</Form.Label>
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
                )}
                
                <div className="d-flex justify-content-end">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={!responseMessage.trim() || uploading || responseLoading}
                  >
                    {responseLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} /> Send Response
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
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
            maxWidth: '150px', 
            maxHeight: '150px', 
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
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => window.open(signedUrl, '_blank')}
      >
        <FontAwesomeIcon icon={faPaperclip} /> {fileName}
      </Button>
    </div>
  );
};

export default IssueDetailPage;