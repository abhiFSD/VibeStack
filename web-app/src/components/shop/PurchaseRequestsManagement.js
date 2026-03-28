import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Badge,
  Alert,
  Spinner,
  Nav
} from 'react-bootstrap';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  getPurchaseRequests,
  approvePurchaseRequest,
  rejectPurchaseRequest
} from '../../utils/shop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTimes,
  faEye,
  faCoins,
  faTruck,
  faClipboardList,
  faHourglassHalf,
  faCheckCircle,
  faTimesCircle,
  faShippingFast
} from '@fortawesome/free-solid-svg-icons';
import { Auth } from 'aws-amplify';

const PurchaseRequestsManagement = () => {
  const { activeOrganization } = useOrganization();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalType, setModalType] = useState(''); // 'approve', 'reject', 'deliver', 'view'
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (activeOrganization?.id) {
      loadRequests();
      getCurrentUser();
    }
  }, [activeOrganization, activeTab]);

  const getCurrentUser = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadRequests = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? null : activeTab.toUpperCase();
      console.log('Loading requests for tab:', activeTab, 'with status:', status);
      const purchaseRequests = await getPurchaseRequests(activeOrganization.id, status);
      console.log('Received purchase requests:', purchaseRequests.length, purchaseRequests);
      
      // Sort by request date (newest first)
      const sortedRequests = purchaseRequests.sort((a, b) => 
        new Date(b.purchaseDate) - new Date(a.purchaseDate)
      );
      
      console.log('Setting requests to:', sortedRequests.length, 'items');
      setRequests(sortedRequests);
    } catch (error) {
      console.error('Error loading purchase requests:', error);
      showAlert('Error loading purchase requests', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleShowModal = (request, type) => {
    setSelectedRequest(request);
    setModalType(type);
    setDeliveryNotes('');
    setRejectionReason('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !currentUser) return;
    
    try {
      setProcessing(true);
      await approvePurchaseRequest(
        selectedRequest.id, 
        currentUser.attributes.sub, 
        deliveryNotes
      );
      
      showAlert(`Purchase request for ${selectedRequest.shopItem.name} has been approved`, 'success');
      await loadRequests();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving request:', error);
      showAlert(error.message || 'Error approving purchase request', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !currentUser) return;
    
    try {
      setProcessing(true);
      await rejectPurchaseRequest(
        selectedRequest.id, 
        currentUser.attributes.sub, 
        rejectionReason
      );
      
      showAlert(`Purchase request for ${selectedRequest.shopItem.name} has been rejected`, 'warning');
      await loadRequests();
      setShowModal(false);
    } catch (error) {
      console.error('Error rejecting request:', error);
      showAlert(error.message || 'Error rejecting purchase request', 'danger');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge bg="warning"><FontAwesomeIcon icon={faHourglassHalf} className="me-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge bg="danger"><FontAwesomeIcon icon={faTimesCircle} className="me-1" />Rejected</Badge>;
      case 'DELIVERED':
        return <Badge bg="success"><FontAwesomeIcon icon={faShippingFast} className="me-1" />Delivered</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTabCounts = () => {
    const counts = {
      pending: requests.filter(r => r.status === 'PENDING').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length,
      delivered: requests.filter(r => r.status === 'DELIVERED').length,
      all: requests.length
    };
    return counts;
  };

  const filteredRequests = activeTab === 'all' 
    ? requests 
    : requests.filter(r => r.status === activeTab.toUpperCase());

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {alert && (
        <Alert variant={alert.type} className="mb-4">
          {alert.message}
        </Alert>
      )}

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faClipboardList} className="me-2" />
              Purchase Requests Management
            </h5>
            <Button style={{width: '150px'}} variant="outline-primary" size="sm" onClick={loadRequests}>
              <FontAwesomeIcon icon={faEye} className="me-1" />
              Refresh
            </Button>
          </div>
          
                     <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="mt-3">
             <Nav.Item>
               <Nav.Link eventKey="all">
                 All {getTabCounts().all > 0 && <Badge bg="secondary" className="ms-1">{getTabCounts().all}</Badge>}
               </Nav.Link>
             </Nav.Item>
             <Nav.Item>
               <Nav.Link eventKey="pending">
                 Pending {getTabCounts().pending > 0 && <Badge bg="warning" className="ms-1">{getTabCounts().pending}</Badge>}
               </Nav.Link>
             </Nav.Item>
             <Nav.Item>
               <Nav.Link eventKey="delivered">
                 Delivered {getTabCounts().delivered > 0 && <Badge bg="success" className="ms-1">{getTabCounts().delivered}</Badge>}
               </Nav.Link>
             </Nav.Item>
             <Nav.Item>
               <Nav.Link eventKey="rejected">
                 Rejected {getTabCounts().rejected > 0 && <Badge bg="danger" className="ms-1">{getTabCounts().rejected}</Badge>}
               </Nav.Link>
             </Nav.Item>
           </Nav>
        </Card.Header>

        <Card.Body>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-5">
              <FontAwesomeIcon icon={faClipboardList} size="3x" className="text-muted mb-3" />
              <h4>No {activeTab === 'all' ? '' : activeTab.toLowerCase()} purchase requests</h4>
              <p className="text-muted">
                {activeTab === 'pending' 
                  ? 'No pending requests to review at the moment.'
                  : `No ${activeTab.toLowerCase()} purchase requests found.`
                }
              </p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div>
                        <strong>{request.userEmail}</strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{request.shopItem?.name}</strong>
                        {request.shopItem?.description && (
                          <div className="text-muted small">
                            {request.shopItem.description.length > 50 
                              ? `${request.shopItem.description.substring(0, 50)}...`
                              : request.shopItem.description
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <FontAwesomeIcon icon={faCoins} className="text-warning me-1" />
                      {request.shopItem?.price}
                    </td>
                    <td>{formatDate(request.purchaseDate)}</td>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleShowModal(request, 'view')}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleShowModal(request, 'approve')}
                            >
                              <FontAwesomeIcon icon={faCheck} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleShowModal(request, 'reject')}
                            >
                              <FontAwesomeIcon icon={faTimes} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal for various actions */}
      <Modal show={showModal} onHide={() => !processing && setShowModal(false)} size="lg">
        <Modal.Header closeButton={!processing}>
          <Modal.Title>
            {modalType === 'view' && 'Purchase Request Details'}
            {modalType === 'approve' && 'Approve & Deliver Purchase Request'}
            {modalType === 'reject' && 'Reject Purchase Request'}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {selectedRequest && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>User:</strong> {selectedRequest.userEmail}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(selectedRequest.status)}
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Item:</strong> {selectedRequest.shopItem?.name}
                </Col>
                <Col md={6}>
                  <strong>Price:</strong> <FontAwesomeIcon icon={faCoins} className="text-warning me-1" />
                  {selectedRequest.shopItem?.price} coins
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Request Date:</strong> {formatDate(selectedRequest.purchaseDate)}
                </Col>
                {selectedRequest.approvedDate && (
                  <Col md={6}>
                    <strong>Action Date:</strong> {formatDate(selectedRequest.approvedDate)}
                  </Col>
                )}
              </Row>
              
              {selectedRequest.shopItem?.description && (
                <Row className="mb-3">
                  <Col>
                    <strong>Item Description:</strong>
                    <p className="mt-1">{selectedRequest.shopItem.description}</p>
                  </Col>
                </Row>
              )}
              
              {selectedRequest.rejectionReason && (
                <Row className="mb-3">
                  <Col>
                    <strong>Rejection Reason:</strong>
                    <p className="mt-1 text-danger">{selectedRequest.rejectionReason}</p>
                  </Col>
                </Row>
              )}
              
              {selectedRequest.deliveryNotes && (
                <Row className="mb-3">
                  <Col>
                    <strong>Delivery Notes:</strong>
                    <p className="mt-1">{selectedRequest.deliveryNotes}</p>
                  </Col>
                </Row>
              )}

              {modalType === 'approve' && (
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Notes (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Add any notes about delivery or special instructions..."
                  />
                </Form.Group>
              )}

              {modalType === 'reject' && (
                <Form.Group className="mb-3">
                  <Form.Label>Rejection Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this request..."
                    required
                  />
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowModal(false)}
            disabled={processing}
          >
            {modalType === 'view' ? 'Close' : 'Cancel'}
          </Button>
          
          {modalType === 'approve' && (
            <Button 
              variant="success" 
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Approving & Delivering...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  Approve & Deliver
                </>
              )}
            </Button>
          )}
          
          {modalType === 'reject' && (
            <Button 
              variant="danger" 
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Reject Request
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PurchaseRequestsManagement; 