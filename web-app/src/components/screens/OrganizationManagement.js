import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, ListGroup, Badge, Spinner, Alert, Modal, Nav, Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faSync, 
  faTrash, 
  faPencilAlt, 
  faCheck, 
  faUserPlus, 
  faTimes,
  faBuilding,
  faPhone,
  faMapMarkerAlt,
  faUsers,
  faSitemap,
  faPlus,
  faTrophy,
  faStore,
  faUpload,
  faImage,
  faRankingStar,
  faRobot,
  faCog,
  faCreditCard,
  faHistory,
  faCoins,
  faChartLine,
  faDollarSign,
  faToggleOn,
  faToggleOff,
  faLock,
  faUnlock,
  faInfoCircle,
  faExclamationTriangle,
  faCheckCircle,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { Auth, API, Storage } from 'aws-amplify';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useLocation, useNavigate } from 'react-router-dom';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import GooglePlacesAutocomplete from 'react-google-autocomplete';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import AwardManagement from '../organization/AwardManagement';
import AdminAwardsView from '../organization/AdminAwardsView';
import ShopManagement from '../shop/ShopManagement';
import EmailTemplateManagement from '../organization/EmailTemplateManagement';
import LicensePurchaseModal from '../organization/LicensePurchaseModal';
import LicenseHistoryModal from '../organization/LicenseHistoryModal';
import { compressImage } from '../../utils/imageUtils';
import axios from 'axios';

// Get API configuration from environment variables
const API_BASE_URL = process.env.REACT_APP_CHAT_API_URL || 'https://54.188.183.157/api';
const API_KEY = process.env.REACT_APP_CHAT_API_KEY || 'test-api-key-123';

const locationInputStyles = {
  width: '100%',
  padding: '0.375rem 0.75rem',
  fontSize: '1rem',
  fontWeight: '400',
  lineHeight: '1.5',
  color: '#212529',
  backgroundColor: '#fff',
  backgroundClip: 'padding-box',
  border: '1px solid #ced4da',
  borderRadius: '0.25rem',
  transition: 'border-color .15s ease-in-out,box-shadow .15s ease-in-out'
};

const MemberItem = ({ member, departments, currentUser, organizationOwner, additionalOwners, onRemove, onResendInvite, onUpdateDepartment, onAssignOwner }) => {
  const [isUpdatingDepartment, setIsUpdatingDepartment] = useState(false);

  const handleDepartmentChange = async (e) => {
    setIsUpdatingDepartment(true);
    await onUpdateDepartment(member.id, e.target.value);
    setIsUpdatingDepartment(false);
  };

  const isPrimaryOwner = member.userSub === organizationOwner;
  const isAdditionalOwner = additionalOwners?.includes(member.email);
  const currentUserIsPrimaryOwner = currentUser === organizationOwner;
  const currentUserIsOwner = currentUserIsPrimaryOwner || (Array.isArray(additionalOwners) && additionalOwners.includes(member.email));

  return (
    <ListGroup.Item className="d-flex justify-content-between align-items-center border-0 border-bottom py-3">
      <div>
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faUserPlus} className="me-2 text-primary" />
          <div>
            <div className="fw-bold">{member.email}</div>
            <div className="mt-1">
              <Badge bg={member.status === 'ACTIVE' ? 'success' : 'warning'} className="me-2">
                {member.status}
              </Badge>
              {isPrimaryOwner && (
                <Badge bg="dark" className="me-2">
                  Primary Admin
                </Badge>
              )}
              {isAdditionalOwner && (
                <Badge bg="info" className="me-2">
                  Co-Admin
                </Badge>
              )}
              <Badge bg={member.role === 'ADMIN' ? 'primary' : 'secondary'} className="me-2">
                {member.role}
              </Badge>
              <div style={{ display: 'inline-block', position: 'relative' }}>
                <Form.Select
                  size="sm"
                  style={{ display: 'inline-block', width: 'auto' }}
                  value={member.departmentID || ''}
                  onChange={handleDepartmentChange}
                  disabled={member.status !== 'ACTIVE' || isUpdatingDepartment}
                >
                  <option value="">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </Form.Select>
                {isUpdatingDepartment && (
                  <div style={{ 
                    position: 'absolute', 
                    right: '-25px', 
                    top: '50%', 
                    transform: 'translateY(-50%)'
                  }}>
                    <Spinner animation="border" size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        {member.status === 'PENDING' && (
          <Button
            variant="outline-primary"
            size="sm"
            className="me-2"
            style={{ minWidth: '85px', height: '31px' }}
            onClick={() => onResendInvite(member)}
          >
            <FontAwesomeIcon icon={faSync} className="me-1" />
            Resend
          </Button>
        )}
        {currentUserIsPrimaryOwner && member.status === 'ACTIVE' && !isPrimaryOwner && !isAdditionalOwner && (
          <Button
            variant="outline-dark"
            size="sm"
            className="me-2"
            onClick={() => onAssignOwner(member, 'co-owner')}
          >
            Make Co-Admin
          </Button>
        )}
        {currentUserIsPrimaryOwner && isAdditionalOwner && (
          <Button
            variant="outline-warning"
            size="sm"
            className="me-2"
            onClick={() => onAssignOwner(member, 'remove')}
          >
            Remove Co-Admin
          </Button>
        )}
        {((currentUserIsPrimaryOwner && !isPrimaryOwner) || (currentUserIsOwner && !isPrimaryOwner && !isAdditionalOwner)) && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => onRemove(member.id)}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
      </div>
    </ListGroup.Item>
  );
};

const CheckoutForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/organization-management',
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && (
        <Alert variant="danger" className="mt-3">
          {errorMessage}
        </Alert>
      )}
      <Button 
        type="submit"
        variant="primary" 
        className="w-100 mt-3"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <><Spinner animation="border" size="sm" /> Processing...</>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  );
};

// Token Purchase Checkout Form
const TokenPurchaseForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/organization-management?tab=ai-settings&payment=success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message);
        if (onError) onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful!
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setErrorMessage(err.message);
      if (onError) onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <h5 className="text-center mb-3">Purchase ${amount} in Credits</h5>
        <p className="text-center text-muted">
          You will receive approximately {(amount * 49999).toLocaleString()} credits
        </p>
      </div>
      
      <PaymentElement 
        options={{
          layout: 'tabs'
        }}
      />
      
      {errorMessage && (
        <Alert variant="danger" className="mt-3">
          {errorMessage}
        </Alert>
      )}
      
      <Button 
        type="submit"
        variant="primary" 
        className="w-100 mt-3"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Processing Payment...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faCreditCard} className="me-2" />
            Pay ${amount}
          </>
        )}
      </Button>
    </form>
  );
};

const PaymentModal = ({ show, onHide, clientSecret, stripePromise }) => {
  if (!clientSecret || !stripePromise) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
    },
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Payment Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm onSuccess={onHide} />
        </Elements>
      </Modal.Body>
    </Modal>
  );
};

// Credit Purchase Payment Modal
const CreditPaymentModal = ({ show, onHide, clientSecret, stripePromise, amount, onSuccess }) => {
  if (!clientSecret || !stripePromise) return null;

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '4px',
      },
    },
  };

  const handleSuccess = (paymentIntent) => {
    onSuccess();
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
          Complete Credit Purchase
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Elements stripe={stripePromise} options={options}>
          <TokenPurchaseForm 
            amount={amount} 
            onSuccess={handleSuccess}
            onError={(error) => console.error('Payment error:', error)}
          />
        </Elements>
      </Modal.Body>
    </Modal>
  );
};

const DepartmentCard = ({ organization, members, onMemberUpdate, departments, setDepartments }) => {
  const [loading, setLoading] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [departmentAlert, setDepartmentAlert] = useState(null);

  const showDepartmentMessage = (message, type = 'success') => {
    setDepartmentAlert({ message, type });
    setTimeout(() => setDepartmentAlert(null), 5000);
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const result = await API.graphql({
        query: queries.listDepartments,
        variables: {
          filter: { organizationID: { eq: organization.id } }
        }
      });
      setDepartments(result.data.listDepartments.items.filter(dept => !dept._deleted));
    } catch (error) {
      console.error('Error fetching departments:', error);
      showDepartmentMessage('Failed to load departments', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [organization.id]);

  const handleCreateDepartment = async () => {
    try {
      const input = {
        name: newDepartment.name,
        description: newDepartment.description,
        organizationID: organization.id
      };

      await API.graphql({
        query: mutations.createDepartment,
        variables: { input }
      });

      setNewDepartment({ name: '', description: '' });
      showDepartmentMessage('Department created successfully');
      await fetchDepartments();
      if (onMemberUpdate) await onMemberUpdate();
    } catch (error) {
      console.error('Error creating department:', error);
      showDepartmentMessage('Failed to create department', 'danger');
    }
  };

  const handleUpdateDepartment = async () => {
    try {
      const input = {
        id: editingDepartment.id,
        name: editingDepartment.name,
        description: editingDepartment.description
      };

      await API.graphql({
        query: mutations.updateDepartment,
        variables: { input }
      });

      setEditingDepartment(null);
      showDepartmentMessage('Department updated successfully');
      await fetchDepartments();
      if (onMemberUpdate) await onMemberUpdate();
    } catch (error) {
      console.error('Error updating department:', error);
      showDepartmentMessage('Failed to update department', 'danger');
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      await API.graphql({
        query: mutations.deleteDepartment,
        variables: { input: { id: departmentId } }
      });

      showDepartmentMessage('Department deleted successfully');
      await fetchDepartments();
      if (onMemberUpdate) await onMemberUpdate();
    } catch (error) {
      console.error('Error deleting department:', error);
      showDepartmentMessage('Failed to delete department', 'danger');
    }
  };

  const handleAssignDepartment = async (memberId, departmentId) => {
    try {
      const input = {
        id: memberId,
        departmentID: departmentId
      };

      await API.graphql({
        query: mutations.updateOrganizationMember,
        variables: { input }
      });

      showDepartmentMessage('Member department updated successfully');
      if (onMemberUpdate) onMemberUpdate();
    } catch (error) {
      console.error('Error updating member department:', error);
      showDepartmentMessage('Failed to update member department', 'danger');
    }
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-white py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <FontAwesomeIcon icon={faSitemap} className="text-primary me-2" />
            <h5 className="mb-0 d-inline">Departments</h5>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowDepartmentModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> Add Department
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {departmentAlert && (
          <Alert variant={departmentAlert.type} className="mb-3">
            {departmentAlert.message}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <ListGroup variant="flush">
            {departments.map((department) => (
              <ListGroup.Item key={department.id} className="py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{department.name}</h6>
                    <small className="text-muted">{department.description}</small>
                    <div className="mt-2">
                      <Badge bg="info">
                        {members.filter(m => m.departmentID === department.id).length} Members
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => setEditingDepartment(department)}
                    >
                      <FontAwesomeIcon icon={faPencilAlt} />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>

      {/* Department Modal */}
      <Modal show={showDepartmentModal} onHide={() => setShowDepartmentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Department</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter department name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newDepartment.description}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter department description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDepartmentModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCreateDepartment();
              setShowDepartmentModal(false);
            }}
          >
            Create Department
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Department Modal */}
      <Modal show={!!editingDepartment} onHide={() => setEditingDepartment(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Department</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control
                type="text"
                value={editingDepartment?.name || ''}
                onChange={(e) => setEditingDepartment(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter department name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editingDepartment?.description || ''}
                onChange={(e) => setEditingDepartment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter department description"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingDepartment(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleUpdateDepartment();
              setEditingDepartment(null);
            }}
          >
            Update Department
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

// AI Settings Tab Component
const AISettingsTab = ({ 
  organizationData, 
  aiSettings, 
  setAiSettings, 
  loadingAiSettings, 
  setLoadingAiSettings,
  aiSettingsError,
  setAiSettingsError,
  paymentHistory,
  setPaymentHistory,
  tokenUsageHistory,
  setTokenUsageHistory,
  loadingPaymentHistory,
  setLoadingPaymentHistory,
  loadingTokenUsage,
  setLoadingTokenUsage,
  topupAmount,
  setTopupAmount,
  processingPayment,
  setProcessingPayment,
  usageCurrentPage,
  setUsageCurrentPage,
  usageHasNextPage,
  setUsageHasNextPage,
  usageTotalRecords,
  setUsageTotalRecords,
  chatPermissions,
  setChatPermissions,
  savingPermissions,
  setSavingPermissions,
  members,
  showAlert,
  handleCreditPurchase,
  fetchMembers,
  setOrganizationData,
  setActiveOrganization,
  refreshTrigger
}) => {
  const [activeAiTab, setActiveAiTab] = useState('settings');

  // Fetch AI settings on component mount and when refresh is triggered
  useEffect(() => {
    if (organizationData?.id) {
      fetchAiSettings();
      // Also refresh payment history if billing tab is active
      if (activeAiTab === 'billing' && refreshTrigger > 0) {
        fetchPaymentHistory();
      }
    }
  }, [organizationData?.id, refreshTrigger]);

  // Fetch chat permissions when organization data or members change
  useEffect(() => {
    if (organizationData?.id && members.length > 0) {
      fetchChatPermissions();
    }
  }, [organizationData?.id, organizationData?.aiDisabledUsers, members.length]);

  // Load data when tab changes
  useEffect(() => {
    if (activeAiTab === 'billing') {
      fetchPaymentHistory();
    } else if (activeAiTab === 'usage') {
      fetchTokenUsageHistory(1);
    } else if (activeAiTab === 'permissions') {
      fetchChatPermissions();
    }
  }, [activeAiTab]);

  // Fetch AI settings from backend
  const fetchAiSettings = async () => {
    setLoadingAiSettings(true);
    setAiSettingsError(false);
    try {
      // Fetch organization settings including AI model
      const response = await axios.get(`${API_BASE_URL}/organizations/${organizationData.id}`, {
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      // Update AI settings with the fetched data
      const org = response.data.organization;
      const modelPricing = response.data.model_pricing || {};
      
      setAiSettings(prev => ({
        ...prev,
        ai_model_id: org.ai_model_id || 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
        available_balance: org.available_balance || 0,
        stripe_id: org.stripe_id || null,
        model_pricing: modelPricing
      }));
    } catch (error) {
      console.error('Error fetching AI settings:', error);
      setAiSettingsError(true);
      showAlert('Failed to load AI settings', 'danger');
    } finally {
      setLoadingAiSettings(false);
    }
  };

  // Helper function to get display name from model ID
  const getModelDisplayName = (modelId) => {
    const model = aiModels.find(m => m.id === modelId);
    return model ? model.displayName : modelId;
  };

  // Helper function to convert USD balance to tokens
  const convertUsdToTokens = (usdBalance) => {
    // 1 USD = 49,999 tokens
    return Math.floor(usdBalance * 49999);
  };

  // Helper function to estimate messages from tokens
  const estimateMessagesFromTokens = (tokens) => {
    // Average tokens per message conversation (including user input + AI response)
    // Based on actual usage: 999,999 tokens ≈ 99 messages, so ~10,101 tokens per message
    const averageTokensPerMessage = 10101;
    return Math.floor(tokens / averageTokensPerMessage);
  };

  // Update AI model settings
  const updateAiModel = async (modelId) => {
    try {
      await axios.put(`${API_BASE_URL}/organizations/${organizationData.id}`, {
        ai_model_id: modelId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });
      
      setAiSettings(prev => ({ ...prev, ai_model_id: modelId }));
      showAlert('AI model updated successfully');
    } catch (error) {
      console.error('Error updating AI model:', error);
      showAlert('Failed to update AI model', 'danger');
    }
  };



  // Fetch payment history
  const fetchPaymentHistory = async () => {
    setLoadingPaymentHistory(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/payment-history`, {
        params: { organization_id: organizationData.id },
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      showAlert('Failed to load payment history', 'danger');
    } finally {
      setLoadingPaymentHistory(false);
    }
  };

  // Fetch token usage history
  const fetchTokenUsageHistory = async (page = 1) => {
    setLoadingTokenUsage(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/token-usage`, {
        params: { 
          organization_id: organizationData.id,
          page: page
        },
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      setTokenUsageHistory(response.data.usage_history);
      setUsageHasNextPage(response.data.hasNextPage);
      setUsageTotalRecords(response.data.total_records);
      setUsageCurrentPage(page);
    } catch (error) {
      console.error('Error fetching token usage:', error);
      showAlert('Failed to load token usage history', 'danger');
    } finally {
      setLoadingTokenUsage(false);
    }
  };

  // Fetch chat permissions for organization members
  const fetchChatPermissions = async () => {
    try {
      // Get permissions based on aiDisabledUsers array in organization
      const permissions = {};
      const aiDisabledUsers = organizationData.aiDisabledUsers || [];
      
      members.forEach(member => {
        // Check if user is NOT in the disabled list
        permissions[member.id] = !aiDisabledUsers.includes(member.userSub);
      });
      
      setChatPermissions(permissions);
    } catch (error) {
      console.error('Error fetching chat permissions:', error);
    }
  };

  // Simple permission toggle handler
  const handlePermissionToggle = async (memberId, userSub, newPermissionState) => {
    setSavingPermissions(true);
    
    try {
      // Get current disabled users array
      const currentDisabledUsers = organizationData.aiDisabledUsers || [];
      let updatedDisabledUsers;

      if (newPermissionState) {
        // Enable user: remove from disabled list
        updatedDisabledUsers = currentDisabledUsers.filter(sub => sub !== userSub);
      } else {
        // Disable user: add to disabled list
        updatedDisabledUsers = currentDisabledUsers.includes(userSub) 
          ? currentDisabledUsers 
          : [...currentDisabledUsers, userSub];
      }

      // Update organization in database
      const result = await API.graphql({
        query: mutations.updateOrganization,
        variables: {
          input: {
            id: organizationData.id,
            aiDisabledUsers: updatedDisabledUsers,
            _version: organizationData._version
          }
        }
      });

      // Fetch the complete updated organization data (including aiDisabledUsers)
      const refreshResult = await API.graphql({
        query: `
          query GetOrganization($id: ID!) {
            getOrganization(id: $id) {
              id
              name
              owner
              additionalOwners
              aiDisabledUsers
              _version
              _deleted
              _lastChangedAt
            }
          }
        `,
        variables: { id: organizationData.id }
      });

      const updatedOrg = refreshResult.data.getOrganization;
      
      // Update local organization data with the complete org data but keep other fields
      const mergedOrg = { ...organizationData, ...updatedOrg };
      setOrganizationData(mergedOrg);
      
      // Update the organization context
      setActiveOrganization(mergedOrg);
      
      // Update permissions state
      setChatPermissions(prev => ({
        ...prev,
        [memberId]: newPermissionState
      }));
      
      showAlert(`Permission ${newPermissionState ? 'granted' : 'revoked'} successfully`);
      
    } catch (error) {
      console.error('Permission update failed:', error);
      showAlert('Failed to update permission', 'danger');
    } finally {
      setSavingPermissions(false);
    }
  };

  const aiModels = [
    { 
      id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
      displayName: 'Claude 3.7 Sonnet', 
      name: 'Claude 3.7 Sonnet', 
      pricing: '$0.02 / 1K credits',
      description: 'Best-in-class text formatting and summarization',
      pros: [
        'Best-in-class text formatting and summarization',
        'High-quality content generation',
        'Strong at complex reasoning',
        'Great for shareable content and reference PDFs'
      ],
      cons: [
        'Higher cost per 1K credits',
        'May be overkill for simple tasks'
      ]
    },
    { 
      id: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
      displayName: 'Claude 3.5 Haiku',
      name: 'Claude 3.5 Haiku', 
      pricing: '$0.008 / 1K credits',
      description: 'Fast responses with good quality',
      pros: [
        'Fast responses',
        'Good for quick content drafts',
        'Lower cost than Sonnet'
      ],
      cons: [
        'Not as strong for deep analysis',
        'Quality may be lower for complex formatting'
      ]
    },
    { 
      id: 'us.deepseek.r1-v1:0',
      displayName: 'DeepSeek R1',
      name: 'DeepSeek R1', 
      pricing: '$0.01 / 1K credits',
      description: 'Efficient for data analysis and bulk processing',
      pros: [
        'Lowest cost per 1K credits',
        'Efficient for data analysis and bulk processing',
        'Great for extracting structured data'
      ],
      cons: [
        'Basic formatting and content quality',
        'Not ideal for polished or shareable content'
      ]
    }
  ];

  return (
    <>
      {/* Available Balance Header - Always Visible */}
      <Card className="shadow-sm mb-3">
        <Card.Body className="py-3">
          <Row className="align-items-center">
            <Col>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faRobot} className="text-primary me-2" />
                AI Settings
              </h5>
            </Col>
            <Col xs="auto">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faDollarSign} className="text-success me-3" />
                <div className="text-end">
                  {loadingAiSettings ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <div className="fw-bold text-success mb-0 fs-5">
                        ${aiSettings.available_balance.toFixed(2)}
                      </div>
                      <div className="small text-muted mb-0">
                        Current Balance
                      </div>
                      <div className="small text-muted mb-0">
                        {convertUsdToTokens(aiSettings.available_balance).toLocaleString()} credits available
                      </div>
                      <div className="small text-muted mb-0">
                        Approximately {estimateMessagesFromTokens(convertUsdToTokens(aiSettings.available_balance)).toLocaleString()} message(s)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Nav variant="pills" activeKey={activeAiTab} onSelect={setActiveAiTab}>
            <Nav.Item>
              <Nav.Link eventKey="settings">
                <FontAwesomeIcon icon={faCog} className="me-2" />
                AI Configuration
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="billing">
                <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                Billing & Credits
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="usage">
                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                Usage History
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="permissions">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                User Permissions
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* Free Credit Message - Shows when error or zero balance */}
      {(aiSettingsError || aiSettings.available_balance === 0) && (
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center mb-2">
            <FontAwesomeIcon icon={faRobot} className="text-primary me-2" />
            <strong>Get Started with LF Mentor</strong>
          </div>
          <p className="mb-0">
            To begin using our AI features, please visit our <a href="/chatbot" className="text-decoration-none fw-semibold">LF Mentor</a>. 
            Your organization will receive complimentary credits to explore the platform capabilities.
          </p>
        </Alert>
      )}

      {activeAiTab === 'settings' && (
        <Row>
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white py-3">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faRobot} className="text-primary me-2" />
                  <h5 className="mb-0">AI Model Configuration</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">AI Options That Fit Your Needs</Form.Label>
                    <p className="text-muted mb-4">
                      Different AI models serve different purposes—from text formatting and content creation to data analysis and cost efficiency. Choose the model that best matches your workflow and budget.
                    </p>
                    
                    {aiModels.map(model => (
                      <div key={model.id} className="mb-4 border rounded p-3" style={{backgroundColor: aiSettings.ai_model_id === model.id ? '#f8f9fa' : 'transparent'}}>
                        <Form.Check
                          type="radio"
                          id={model.id}
                          name="aiModel"
                          checked={aiSettings.ai_model_id === model.id}
                          onChange={() => updateAiModel(model.id)}
                          label={
                            <div className="w-100">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div className="fw-bold fs-5">{model.name}</div>
                                <div className="badge bg-primary">{model.pricing}</div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="fw-semibold text-success mb-1">Pros:</div>
                                <ul className="mb-2 small">
                                  {model.pros.map((pro, index) => (
                                    <li key={index}>{pro}</li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div>
                                <div className="fw-semibold text-warning mb-1">Cons:</div>
                                <ul className="mb-0 small">
                                  {model.cons.map((con, index) => (
                                    <li key={index}>{con}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          }
                        />
                      </div>
                    ))}
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white py-3">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-info me-2" />
                  <h5 className="mb-0">Balance Details</h5>
                </div>
              </Card.Header>
              <Card.Body className="text-center">
                {loadingAiSettings ? (
                  <Spinner animation="border" />
                ) : (
                  <>
                    <div className="mb-3">
                      <h2 className="text-success mb-1">
                        ${aiSettings.available_balance.toFixed(2)}
                      </h2>
                      <small className="text-muted">Current Balance</small>
                    </div>
                    <hr />
                    <p className="text-muted mb-2 small">
                      <strong>{convertUsdToTokens(aiSettings.available_balance).toLocaleString()}</strong> credits available
                    </p>
                    <p className="text-muted mb-0 small">
                      Approximately <strong>{estimateMessagesFromTokens(convertUsdToTokens(aiSettings.available_balance)).toLocaleString()}</strong> message(s)
                    </p>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeAiTab === 'billing' && (
        <Row>
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white py-3">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faDollarSign} className="text-success me-2" />
                  <h5 className="mb-0">Purchase Credits</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">Top-up Amount (USD)</Form.Label>
                    <Form.Control
                      type="number"
                      value={topupAmount}
                      onChange={(e) => setTopupAmount(Number(e.target.value))}
                      min="1"
                      max="10000"
                      step="1"
                      placeholder="Enter amount in USD"
                    />
                    <Form.Text className="text-muted">
                      You will receive approximately {(topupAmount * 49999).toLocaleString()} credits
                    </Form.Text>
                    <Form.Text className="text-muted d-block">
                      Rate: 1 USD = 49,999 credits
                    </Form.Text>
                  </Form.Group>
                </Form>
                
                <Button 
                  variant="success" 
                  className="w-100"
                  onClick={handleCreditPurchase}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                      Purchase ${topupAmount} in Credits
                    </>
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={faHistory} className="text-info me-2" />
                  <h5 className="mb-0 d-inline">Payment History</h5>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={fetchPaymentHistory}
                  disabled={loadingPaymentHistory}
                >
                  <FontAwesomeIcon icon={faSync} />
                </Button>
              </Card.Header>
              <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {loadingPaymentHistory ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <p className="text-muted text-center">No payment history available</p>
                ) : (
                  <ListGroup variant="flush">
                    {paymentHistory.map((payment, index) => (
                      <ListGroup.Item key={index} className="px-0">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-bold">${payment.amount / 100}</div>
                            <small className="text-muted">
                              {payment.token_assigned.toLocaleString()} credits
                            </small>
                          </div>
                          <small className="text-muted">
                            {new Date(payment.date).toLocaleDateString()}
                          </small>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeAiTab === 'usage' && (
        <Card className="shadow-sm">
          <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
            <div>
              <FontAwesomeIcon icon={faChartLine} className="text-primary me-2" />
              <h5 className="mb-0 d-inline">Credit Usage History</h5>
            </div>
            <div>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => fetchTokenUsageHistory(1)}
                disabled={loadingTokenUsage}
                className="me-2"
              >
                <FontAwesomeIcon icon={faSync} />
              </Button>
              <Badge bg="info">
                {usageTotalRecords} total records
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            {loadingTokenUsage ? (
              <div className="text-center py-4">
                <Spinner animation="border" />
                <p className="mt-2">Loading usage history...</p>
              </div>
            ) : tokenUsageHistory.length === 0 ? (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faChartLine} size="3x" className="text-muted mb-3" />
                <p className="text-muted">No usage history available</p>
                <Button 
                  variant="outline-primary"
                  onClick={() => fetchTokenUsageHistory(1)}
                >
                  Refresh
                </Button>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Model</th>
                        <th>Credits</th>
                        <th>Cost</th>
                        <th>Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokenUsageHistory.map((usage, index) => (
                        <tr key={index}>
                          <td>
                            <small>
                              {new Date(usage.date).toLocaleDateString()}<br />
                              {new Date(usage.date).toLocaleTimeString()}
                            </small>
                          </td>
                          <td>
                            <Badge bg="secondary">{usage.model_name}</Badge>
                          </td>
                          <td>
                            <span className="fw-bold">
                              {usage.token_amount.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span className="text-success">
                              ${usage.amount.toFixed(4)}
                            </span>
                          </td>
                          <td>
                            <Badge bg={usage.type === 'debit' ? 'danger' : 'success'}>
                              {usage.type}
                            </Badge>
                          </td>
                          <td>
                            <small className="text-muted">{usage.description}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {usageHasNextPage && (
                  <div className="text-center mt-3">
                    <Button 
                      variant="outline-primary"
                      onClick={() => fetchTokenUsageHistory(usageCurrentPage + 1)}
                      disabled={loadingTokenUsage}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {activeAiTab === 'permissions' && (
        <div className="permissions-section">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faUsers} className="text-primary me-2" />
                <h5 className="mb-0">AI Chat Permissions</h5>
              </div>
              <p className="text-muted mb-0 mt-2">
                Control which organization members can access the AI chat functionality.
              </p>
            </div>
            <div className="card-body">
              {members.length === 0 ? (
                <p className="text-muted text-center">No members found</p>
              ) : (
                <div className="list-group list-group-flush">
                  {members.filter(m => m.status === 'ACTIVE').map((member) => {
                    const hasPermission = chatPermissions[member.id];
                    const isOwner = member.userSub === organizationData.owner;
                    const isCoOwner = organizationData.additionalOwners?.includes(member.email);
                    
                    return (
                      <div key={member.id} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">{member.email}</div>
                            <div className="d-flex align-items-center mt-1">
                              <span className={`badge ${member.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'} me-2`}>
                                {member.role}
                              </span>
                              {isOwner && (
                                <span className="badge bg-dark me-2">Primary Admin</span>
                              )}
                              {isCoOwner && (
                                <span className="badge bg-info">Co-Admin</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="d-flex align-items-center">
                            <span className="me-3 small text-muted">
                              {hasPermission ? 'Chat Enabled' : 'Chat Disabled'}
                            </span>
                            <button
                              type="button"
                              className={`btn btn-sm ${hasPermission ? 'btn-success' : 'btn-outline-secondary'}`}
                              onClick={() => handlePermissionToggle(member.id, member.userSub, !hasPermission)}
                              disabled={savingPermissions}
                            >
                              <FontAwesomeIcon 
                                icon={hasPermission ? faUnlock : faLock} 
                                className="me-1"
                              />
                              {hasPermission ? 'Enabled' : 'Disabled'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const OrganizationManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeOrganization, setActiveOrganization, refreshOrganization, isTrialExpired, needsLicenseManagement } = useOrganization();
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiSettingsRefreshTrigger, setAiSettingsRefreshTrigger] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [organizationData, setOrganizationData] = useState(activeOrganization);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [editData, setEditData] = useState({
    name: activeOrganization?.name || '',
    contactEmail: activeOrganization?.contactEmail || '',
    contactPhone: activeOrganization?.contactPhone || '',
    location: activeOrganization?.location || '',
    coordinates: activeOrganization?.coordinates || '',
    logo: activeOrganization?.logo || ''
  });
  const [alert, setAlert] = useState(null);
  const [locationDetails, setLocationDetails] = useState({
    coordinates: null,
    formattedAddress: ''
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [isGettingStarted, setIsGettingStarted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'details');
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeAwardsTab, setActiveAwardsTab] = useState('definitions');
  
  // AI Settings states
  const [aiSettings, setAiSettings] = useState({
    ai_model_id: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    available_balance: 0,
    stripe_id: null,
    model_pricing: {}
  });
  const [loadingAiSettings, setLoadingAiSettings] = useState(false);
  const [aiSettingsError, setAiSettingsError] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [tokenUsageHistory, setTokenUsageHistory] = useState([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
  const [loadingTokenUsage, setLoadingTokenUsage] = useState(false);
  const [topupAmount, setTopupAmount] = useState(25);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showLicensePurchaseModal, setShowLicensePurchaseModal] = useState(false);
  const [showLicenseHistoryModal, setShowLicenseHistoryModal] = useState(false);
  const [showCancelSubscriptionModal, setShowCancelSubscriptionModal] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [usageCurrentPage, setUsageCurrentPage] = useState(1);
  const [usageHasNextPage, setUsageHasNextPage] = useState(false);
  
  // Learning Coins settings state
  const [learningCoinsData, setLearningCoinsData] = useState({
    learningCoinsPerInterval: 5,
    learningCoinInterval: 300,
    learningMaxCoinsPerSession: 20,
    learningCoinsEnabled: true
  });
  const [learningCoinsChanged, setLearningCoinsChanged] = useState(false);
  const [savingLearningCoins, setSavingLearningCoins] = useState(false);
  const [usageTotalRecords, setUsageTotalRecords] = useState(0);
  const [chatPermissions, setChatPermissions] = useState({});
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showCreditPaymentModal, setShowCreditPaymentModal] = useState(false);
  const [creditPaymentClientSecret, setCreditPaymentClientSecret] = useState(null);
  const [tokenStripePromise, setTokenStripePromise] = useState(null);

  useEffect(() => {
    // Check if we have a tab to activate from the location state
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
    
    // Check if we have a trial expiration message from TrialGuard redirect
    if (location.state?.message) {
      showAlert(location.state.message, location.state.variant || 'warning');
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
    
    // Check for payment success redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'ai-settings' && urlParams.get('payment') === 'success') {
      setActiveTab('ai-settings');
      showAlert('Payment successful! Your tokens have been added to your account.', 'success');
      // Clean up URL
      window.history.replaceState({}, document.title, '/organization-management');
      // Note: The balance will be refreshed when the AI Settings tab is displayed
    }
    
    // Initialize Stripe on component mount
    const initStripe = async () => {
      const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.trim();
      if (stripePublishableKey) {
        try {
          const stripe = await loadStripe(stripePublishableKey);
          if (!stripePromise) setStripePromise(stripe);
          if (!tokenStripePromise) setTokenStripePromise(stripe);
        } catch (error) {
          console.error('Failed to initialize Stripe:', error);
        }
      }
    };
    initStripe();
  }, [location]);

  useEffect(() => {
    if (activeOrganization?.id) {
      fetchOrganizationData();
      fetchDepartments();
      fetchOwnerEmail();
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    if (organizationData?.location) {
      const coords = organizationData.location.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setLocationDetails({
          coordinates: { lat: coords[0], lng: coords[1] },
          formattedAddress: ''
        });
        reverseGeocode(coords[0], coords[1]);
      }
    }
  }, [organizationData?.location]);

  useEffect(() => {
    if (organizationData?.logo) {
      fetchLogoUrl(organizationData.logo);
    }
  }, [organizationData?.logo]);

  // Initialize learning coins data from organization data
  useEffect(() => {
    if (organizationData) {
      setLearningCoinsData({
        learningCoinsPerInterval: organizationData.learningCoinsPerInterval || 5,
        learningCoinInterval: organizationData.learningCoinInterval || 300,
        learningMaxCoinsPerSession: organizationData.learningMaxCoinsPerSession || 20,
        learningCoinsEnabled: organizationData.learningCoinsEnabled !== false
      });
      setLearningCoinsChanged(false);
    }
  }, [organizationData]);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Handle credit purchase
  const handleCreditPurchase = async () => {
    setProcessingPayment(true);
    try {
      // Ensure Stripe is initialized
      let stripeInstance = tokenStripePromise;
      if (!stripeInstance) {
        const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.trim();
        if (!stripePublishableKey) {
          throw new Error('Stripe publishable key is not configured');
        }
        
        stripeInstance = await loadStripe(stripePublishableKey);
        setTokenStripePromise(stripeInstance);
        
        if (!stripeInstance) {
          throw new Error('Failed to initialize Stripe');
        }
      }
      
      // Create payment intent
      const response = await axios.post(`${API_BASE_URL}/stripe/payment-intent`, {
        amount: topupAmount,
        currency: 'usd',
        organization_id: organizationData.id,
        user_id: organizationData.id
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });

      const { client_secret } = response.data;
      
      if (!client_secret) {
        throw new Error('No client secret received from server');
      }
      
      // Set the client secret and show payment modal
      setCreditPaymentClientSecret(client_secret);
      setShowCreditPaymentModal(true);
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      showAlert(error.message || 'Failed to initialize payment', 'danger');
      setProcessingPayment(false);
    }
  };

  // Helper function to poll for balance updates
  const waitForBalanceUpdate = async (previousBalance, maxAttempts = 20) => {
    let attempts = 0;
    
    const checkBalance = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/organizations/${organizationData.id}`, {
          headers: {
            'X-API-Key': API_KEY
          }
        });
        
        if (response.data && response.data.organization) {
          const newBalance = response.data.organization.available_balance || 0;
          
          // Check if balance has increased
          if (newBalance > previousBalance) {
            return { success: true, newBalance };
          }
        }
      } catch (error) {
        console.error('Balance check failed:', error);
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        return { success: false, error: 'Timeout waiting for balance update' };
      }
      
      // Wait 1.5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 1500));
      return checkBalance();
    };
    
    return checkBalance();
  };

  // Handle successful credit purchase
  const handleCreditPurchaseSuccess = async () => {
    const previousBalance = aiSettings.available_balance || 0;
    
    setShowCreditPaymentModal(false);
    setCreditPaymentClientSecret(null);
    
    showAlert('Payment successful! Updating balance...', 'info');
    
    // Poll for balance update
    const result = await waitForBalanceUpdate(previousBalance);
    
    if (result.success) {
      // Update the AI settings with new balance
      setAiSettings(prev => ({
        ...prev,
        available_balance: result.newBalance
      }));
      
      showAlert(`Balance updated! New balance: $${result.newBalance.toFixed(2)}`, 'success');
      
      // Trigger refresh of AI settings
      setAiSettingsRefreshTrigger(prev => prev + 1);
    } else {
      // Fallback: show success message and let user manually refresh
      showAlert('Payment complete! Balance will update shortly. Please refresh the page if needed.', 'success');
    }
    
    setProcessingPayment(false);
  };

  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      const result = await API.post('apifetchdata', '/cancelSub', {
        body: {
          organizationId: activeOrganization.id
        }
      });

      if (result.success) {
        showAlert('Subscription canceled successfully. All licenses have been removed.', 'success');
        setShowCancelSubscriptionModal(false);
        // Refresh organization data to reflect changes
        await fetchOrganizationData();
        await fetchMembers();
      } else {
        showAlert('Failed to cancel subscription: ' + (result.error || 'Unknown error'), 'danger');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      showAlert('Error canceling subscription: ' + (error.message || 'Unknown error'), 'danger');
    } finally {
      setCancelingSubscription(false);
    }
  };

  const fetchOrganizationData = async (retryCount = 0) => {
    setLoading(true);
    try {
      if (!activeOrganization?.id) {
        console.error('No active organization ID available');
        showAlert('No organization selected', 'danger');
        return;
      }

      console.log('Fetching organization data for ID:', activeOrganization.id);
      
      const result = await API.graphql({
        query: `
          query GetOrganization($id: ID!) {
            getOrganization(id: $id) {
              id
              name
              owner
              additionalOwners
              contactEmail
              contactPhone
              location
              coordinates
              logo
              isActive
              leaderboardEnabled
              learningCoinsPerInterval
              learningCoinInterval
              learningMaxCoinsPerSession
              learningCoinsEnabled
              stripeCustomerId
              stripeSubscriptionId
              stripeSubscriptionItemId
              subscriptionStatus
              subscriptionPeriodEnd
              billingPeriod
              activeUserCount
              purchasedLicenses
              aiDisabledUsers
              createdAt
              updatedAt
              _version
              _deleted
              _lastChangedAt
            }
          }
        `,
        variables: { id: activeOrganization.id }
      });
      
      console.log('Organization query result:', result);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      const org = result.data.getOrganization;
      if (!org) {
        throw new Error('Organization not found');
      }

      console.log('Fetched organization:', org);
      setOrganizationData(org);
      
      // Initialize edit data and location details
      setEditData({
        name: org.name || '',
        contactEmail: org.contactEmail || '',
        contactPhone: org.contactPhone || '',
        location: org.location || '',
        coordinates: org.coordinates || '',
        logo: org.logo || ''
      });

      // Initialize location details if coordinates exist
      if (org.coordinates) {
        const [lat, lng] = org.coordinates.split(',').map(Number);
        setLocationDetails({
          coordinates: { lat, lng },
          formattedAddress: org.location || ''
        });
      }

      await fetchMembers();
      await getCurrentUser();
    } catch (error) {
      console.error('Error fetching organization data:', error);
      
      // Log detailed error information
      if (error.errors) {
        console.error('GraphQL Errors:', error.errors);
        const errorMessage = error.errors[0]?.message || error.message;
        showAlert(`Failed to load organization details: ${errorMessage}`, 'danger');
      } else {
        showAlert(`Failed to load organization details: ${error.message}`, 'danger');
      }

      if (retryCount < 3) {
        setTimeout(() => fetchOrganizationData(retryCount + 1), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setCurrentUser(user.attributes.sub);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const result = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: { 
            organizationID: { eq: activeOrganization.id }
          }
        }
      });
      
      // Get members with their department information
      const membersList = result.data.listOrganizationMembers.items
        .filter(m => !m._deleted)
        .sort((a, b) => {
          if (a.status === b.status) {
            return a.email.localeCompare(b.email);
          }
          return a.status === 'ACTIVE' ? -1 : 1;
        });

      const activeCount = membersList.filter(m => m.status === 'ACTIVE').length;
      
      // Update organization's active user count if it's different
      if (organizationData.activeUserCount !== activeCount) {
        try {
          const updateResult = await API.graphql({
            query: mutations.updateOrganization,
            variables: {
              input: {
                id: activeOrganization.id,
                activeUserCount: activeCount,
                _version: organizationData._version
              }
            }
          });
          const updatedOrg = updateResult.data.updateOrganization;
          setOrganizationData(updatedOrg);
        } catch (error) {
          console.error('Error updating active user count:', error);
          if (error.errors) {
            console.error('GraphQL Errors:', error.errors);
          }
        }
      }

      console.log('All members:', membersList);
      console.log('Active members count:', activeCount);
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      const errorMessage = error.errors?.[0]?.message || error.message;
      showAlert(`Failed to load members: ${errorMessage}`, 'warning');
    }
  };

  const checkLicenseAvailability = () => {
    // Count all invited users (both PENDING and ACTIVE), not just active users
    const totalInvitedUsers = members.filter(m => !m._deleted).length;
    const purchasedLicenses = organizationData?.purchasedLicenses || 0;
    return totalInvitedUsers < purchasedLicenses;
  };

  const isFirstTimeUser = () => {
    const purchasedLicenses = organizationData?.purchasedLicenses || 0;
    const hasStripeCustomer = organizationData?.stripeCustomerId;
    // Show welcome screen only if no licenses AND no Stripe customer
    return purchasedLicenses === 0 && !hasStripeCustomer;
  };

  const handleGetStarted = async () => {
    setIsGettingStarted(true);
    
    try {
      console.log('Creating Stripe customer for organization...');
      const customerResult = await API.graphql({
        query: `
          mutation CreateStripeCustomer($organization: ID!) {
            createStripeCustomer(organization: $organization) {
              success
              customerId
              error
            }
          }
        `,
        variables: {
          organization: organizationData.id
        }
      });

      const customerResponse = customerResult.data?.createStripeCustomer;
      if (!customerResponse?.success) {
        throw new Error(customerResponse?.error || 'Failed to create Stripe customer');
      }
      
      console.log('Stripe customer created successfully:', customerResponse.customerId);
      showAlert('Account setup complete! You can now purchase licenses and invite team members.', 'success');
      
      // Switch to members tab and refresh organization data
      setActiveTab('members');
      await fetchOrganizationData();
      await fetchMembers();
      
    } catch (error) {
      console.error('Error setting up account:', error);
      showAlert(error.message || 'Failed to set up account. Please try again.', 'danger');
    } finally {
      setIsGettingStarted(false);
    }
  };

  const inviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      showAlert('Please enter an email address', 'danger');
      return;
    }

    // Check license availability before proceeding
    if (!checkLicenseAvailability()) {
      // Check if payment was recently completed to avoid reopening modal
      const recentPayment = sessionStorage.getItem('licensePaymentCompleted');
      if (recentPayment && Date.now() - parseInt(recentPayment) < 30000) { // 30 seconds
        showAlert('License payment is being processed. Please wait a moment and try again.', 'info');
        return;
      }
      setShowLicensePurchaseModal(true);
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = inviteEmail.toLowerCase();
      
      const newMemberInput = {
        organizationID: activeOrganization.id,
        email: normalizedEmail,
        status: 'PENDING',
        role: 'MEMBER',
        userSub: '',
      };

      await API.graphql({
        query: mutations.createOrganizationMember,
        variables: { input: newMemberInput }
      });

      await API.post('apifetchdata', '/invite', {
        body: {
          email: normalizedEmail,
          organizationId: activeOrganization.id,
          organizationName: activeOrganization.name
        }
      });

      setInviteEmail('');
      showAlert('Invitation sent successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      showAlert('Failed to send invitation', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await API.graphql({
        query: mutations.deleteOrganizationMember,
        variables: { input: { id: memberId } }
      });
      fetchMembers();
      showAlert('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      showAlert('Failed to remove member', 'danger');
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results[0]) {
        setLocationDetails(prev => ({
          ...prev,
          formattedAddress: data.results[0].formatted_address
        }));
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleLocationSelect = (place) => {
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      
      // Store both formatted address and coordinates
      setLocationDetails({
        coordinates: { lat, lng },
        formattedAddress: place.formatted_address
      });

      // Update the edit data with both location and coordinates
      setEditData(prev => ({
        ...prev,
        location: place.formatted_address,
        coordinates: `${lat},${lng}`
      }));
    }
  };

  const updateOrganizationDetails = async () => {
    try {
      const updateInput = {
        id: activeOrganization.id,
        name: editData.name,
        contactEmail: editData.contactEmail,
        contactPhone: editData.contactPhone,
        location: editData.location,
        coordinates: editData.coordinates,
        logo: editData.logo,
        _version: organizationData._version
      };

      const result = await API.graphql({
        query: mutations.updateOrganization,
        variables: { input: updateInput }
      });

      const updatedOrg = result.data.updateOrganization;
      setOrganizationData(updatedOrg);
      
      // Update location details state to match saved data
      if (updatedOrg.coordinates) {
        const [lat, lng] = updatedOrg.coordinates.split(',').map(Number);
        setLocationDetails({
          coordinates: { lat, lng },
          formattedAddress: updatedOrg.location || ''
        });
      }
      
      await refreshOrganization();
      showAlert('Organization details updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      showAlert('Failed to update organization details', 'danger');
    }
  };

  const handleLearningCoinUpdate = (field, value) => {
    setLearningCoinsData(prev => ({
      ...prev,
      [field]: value
    }));
    setLearningCoinsChanged(true);
  };

  const saveLearningCoinsSettings = async () => {
    try {
      setSavingLearningCoins(true);
      showAlert('Saving learning coin settings...', 'info');
      
      const updateInput = {
        id: organizationData.id,
        learningCoinsPerInterval: learningCoinsData.learningCoinsPerInterval,
        learningCoinInterval: learningCoinsData.learningCoinInterval,
        learningMaxCoinsPerSession: learningCoinsData.learningMaxCoinsPerSession,
        learningCoinsEnabled: learningCoinsData.learningCoinsEnabled,
        _version: organizationData._version
      };

      const updateResult = await API.graphql({
        query: mutations.updateOrganization,
        variables: { input: updateInput }
      });

      const updatedOrg = updateResult.data.updateOrganization;
      setOrganizationData(updatedOrg);
      setLearningCoinsChanged(false);
      
      showAlert('Learning coin settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving learning coin settings:', error);
      const errorDetails = error.errors 
        ? error.errors.map(e => e.message).join(', ') 
        : error.message || 'Unknown error';
      
      showAlert(`Failed to save learning coin settings: ${errorDetails}`, 'danger');
    } finally {
      setSavingLearningCoins(false);
    }
  };

  const resetLearningCoinsSettings = () => {
    setLearningCoinsData({
      learningCoinsPerInterval: organizationData.learningCoinsPerInterval || 5,
      learningCoinInterval: organizationData.learningCoinInterval || 300,
      learningMaxCoinsPerSession: organizationData.learningMaxCoinsPerSession || 20,
      learningCoinsEnabled: organizationData.learningCoinsEnabled !== false
    });
    setLearningCoinsChanged(false);
  };

  const resendInvite = async (member) => {
    try {
      await API.post('apifetchdata', '/invite', {
        body: {
          email: member.email,
          organizationId: activeOrganization.id,
          organizationName: activeOrganization.name
        }
      });

      showAlert('Invitation resent successfully');
    } catch (error) {
      console.error('Error resending invitation:', error);
      showAlert('Failed to resend invitation', 'danger');
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubscribe = async (billingPeriod) => {
    setSubscriptionLoading(true);
    try {
        // Check if we have the Stripe publishable key
        const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY?.trim();
        if (!stripePublishableKey) {
            throw new Error('Stripe publishable key is not configured');
        }

        // Validate key format
        if (!stripePublishableKey.startsWith('pk_test_') && !stripePublishableKey.startsWith('pk_live_')) {
            throw new Error('Invalid Stripe publishable key format');
        }

        // Initialize Stripe
        const stripe = await loadStripe(stripePublishableKey);
        setStripePromise(stripe);
            
        if (!stripe) {
            throw new Error('Failed to initialize Stripe object');
        }

        console.log('Stripe initialized successfully');

        // First, ensure we have a Stripe customer
        if (!organizationData.stripeCustomerId) {
            console.log('Creating Stripe customer...');
            const createCustomerResult = await API.graphql({
                query: mutations.createStripeCustomer,
                variables: { 
                    organization: organizationData.id 
                }
            });

            if (!createCustomerResult.data.createStripeCustomer.success) {
                throw new Error(createCustomerResult.data.createStripeCustomer.error || 'Failed to create Stripe customer');
            }

            await fetchOrganizationData();
        }

        // Create the subscription
        console.log('Creating subscription...');
        const updateSubscriptionResult = await API.graphql({
            query: mutations.updateSubscription,
            variables: {
                organizationId: organizationData.id,
                billingPeriod: billingPeriod
            }
        });

        if (!updateSubscriptionResult.data.updateSubscription.success) {
            throw new Error(updateSubscriptionResult.data.updateSubscription.error || 'Failed to create subscription');
        }

        // Set the client secret and show payment modal
        setPaymentClientSecret(updateSubscriptionResult.data.updateSubscription.clientSecret);
        setShowPaymentModal(true);

    } catch (error) {
        console.error('Error in handleSubscribe:', error);
        showAlert(error.message || 'Failed to process subscription', 'danger');
    } finally {
        setSubscriptionLoading(false);
    }
  };

  const handleUpdateMemberDepartment = async (memberId, departmentId) => {
    try {
      await API.graphql({
        query: mutations.updateOrganizationMember,
        variables: {
          input: {
            id: memberId,
            departmentID: departmentId || null
          }
        }
      });
      fetchMembers();
      showAlert('Member department updated successfully');
    } catch (error) {
      console.error('Error updating member department:', error);
      showAlert('Failed to update member department', 'danger');
    }
  };

  const fetchDepartments = async () => {
    try {
      const result = await API.graphql({
        query: queries.listDepartments,
        variables: {
          filter: { organizationID: { eq: activeOrganization.id } }
        }
      });
      setDepartments(result.data.listDepartments.items.filter(dept => !dept._deleted));
    } catch (error) {
      console.error('Error fetching departments:', error);
      showAlert('Failed to load departments', 'danger');
    }
  };

  const handleAssignOwner = async (member, action) => {
    if (action === 'co-owner') {
      if (!window.confirm(`Are you sure you want to make ${member.email} a co-admin of this organization?`)) {
        return;
      }

      try {
        const currentAdditionalOwners = organizationData.additionalOwners || [];
        const updateInput = {
          id: activeOrganization.id,
          additionalOwners: [...currentAdditionalOwners, member.email],
          _version: organizationData._version
        };

        const updatedResult = await API.graphql({
          query: mutations.updateOrganization,
          variables: { input: updateInput }
        });

        const updatedOrg = updatedResult.data.updateOrganization;
        setOrganizationData(updatedOrg);
        await refreshOrganization();
        await fetchMembers(); // Refresh members list to update badges
        
        showAlert('Co-admin added successfully');
      } catch (error) {
        console.error('Error adding co-admin:', error);
        showAlert('Failed to add co-admin', 'danger');
      }
    } else if (action === 'remove') {
      if (!window.confirm(`Are you sure you want to remove ${member.email} as a co-admin?`)) {
        return;
      }

      try {
        const currentAdditionalOwners = organizationData.additionalOwners || [];
        const updateInput = {
          id: activeOrganization.id,
          additionalOwners: currentAdditionalOwners.filter(email => email !== member.email),
          _version: organizationData._version
        };

        const updatedResult = await API.graphql({
          query: mutations.updateOrganization,
          variables: { input: updateInput }
        });

        const updatedOrg = updatedResult.data.updateOrganization;
        setOrganizationData(updatedOrg);
        await refreshOrganization();
        await fetchMembers(); // Refresh members list to update badges
        
        showAlert('Co-admin removed successfully');
      } catch (error) {
        console.error('Error removing co-admin:', error);
        showAlert('Failed to remove co-admin', 'danger');
      }
    }
  };

  const fetchOwnerEmail = async () => {
    try {
      if (!activeOrganization?.owner) return;

      const memberResponse = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            userSub: { eq: activeOrganization.owner }
          }
        }
      });

      const ownerMember = memberResponse.data.listOrganizationMembers.items
        .find(member => !member._deleted);

      if (ownerMember) {
        setOwnerEmail(ownerMember.email);
      }
    } catch (error) {
      console.error('Error fetching owner email:', error);
    }
  };

  const updateOrganizationLocation = async (locationData) => {
    // Update organization with new location data
    try {
      // ... rest of the function
    } catch (error) {
      // ... error handling
    }
  };

  const clearOrganizationData = async () => {
    setIsClearing(true);
    try {
      // Delete all reports and their associated items
      const reportsResult = await API.graphql({
        query: queries.reportsByOrganizationID,
        variables: {
          organizationID: organizationData.id
        }
      });
      
      const reports = reportsResult.data.reportsByOrganizationID.items.filter(r => !r._deleted);
      
      for (const report of reports) {
        // Delete action items associated with reports
        const reportActionItemsResult = await API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: {
              reportID: { eq: report.id },
              _deleted: { ne: true }
            },
            limit: 1000
          }
        });
        
        const reportActionItems = reportActionItemsResult.data.listActionItems.items;
        
        for (const item of reportActionItems) {
          await API.graphql({
            query: mutations.deleteActionItems,
            variables: { input: { id: item.id } }
          });
        }
        
        // Delete the report
        await API.graphql({
          query: mutations.deleteReport,
          variables: { input: { id: report.id } }
        });
      }

      // Delete all projects and their associated items
      const projectsResult = await API.graphql({
        query: queries.projectsByOrganizationID,
        variables: {
          organizationID: organizationData.id
        }
      });
      
      const projects = projectsResult.data.projectsByOrganizationID.items.filter(p => !p._deleted);
      
      for (const project of projects) {
        // Delete action items
        const actionItemsResult = await API.graphql({
          query: queries.actionItemsByProjectID,
          variables: {
            projectID: project.id
          }
        });
        
        const actionItems = actionItemsResult.data.actionItemsByProjectID.items.filter(ai => !ai._deleted);
        
        for (const item of actionItems) {
          await API.graphql({
            query: mutations.deleteActionItems,
            variables: { input: { id: item.id } }
          });
        }
        
        // Delete project members
        const projectMembersResult = await API.graphql({
          query: queries.projectMembersByProjectID,
          variables: {
            projectID: project.id
          }
        });
        
        const projectMembers = projectMembersResult.data.projectMembersByProjectID.items.filter(pm => !pm._deleted);
        
        for (const member of projectMembers) {
          await API.graphql({
            query: mutations.deleteProjectMember,
            variables: { input: { id: member.id } }
          });
        }
        
        // Delete the project
        await API.graphql({
          query: mutations.deleteProject,
          variables: { input: { id: project.id } }
        });
      }

      // Delete all departments
      const departmentsResult = await API.graphql({
        query: queries.departmentsByOrganizationID,
        variables: {
          organizationID: organizationData.id
        }
      });
      
      const departments = departmentsResult.data.departmentsByOrganizationID.items.filter(d => !d._deleted);
      
      for (const department of departments) {
        await API.graphql({
          query: mutations.deleteDepartment,
          variables: { input: { id: department.id } }
        });
      }

      // Delete all awards and award definitions
      const awardsResult = await API.graphql({
        query: queries.awardsByOrganizationID,
        variables: {
          organizationID: organizationData.id
        }
      });
      
      const awards = awardsResult.data.awardsByOrganizationID.items.filter(a => !a._deleted);
      
      for (const award of awards) {
        await API.graphql({
          query: mutations.deleteAwards,
          variables: { input: { id: award.id } }
        });
      }

      // Delete award definitions (templates)
      const awardDefinitionsResult = await API.graphql({
        query: queries.awardDefinitionsByOrganizationID,
        variables: {
          organizationID: organizationData.id
        }
      });
      
      const awardDefinitions = awardDefinitionsResult.data.awardDefinitionsByOrganizationID.items.filter(ad => !ad._deleted);
      
      for (const definition of awardDefinitions) {
        await API.graphql({
          query: mutations.deleteAwardDefinition,
          variables: { input: { id: definition.id } }
        });
      }

      // Delete all shop items and user purchases
      const shopItemsResult = await API.graphql({
        query: queries.shopItemsByOrganizationID,
        variables: {
          organizationID: organizationData.id
        }
      });
      
      const shopItems = shopItemsResult.data.shopItemsByOrganizationID.items.filter(si => !si._deleted);
      
      for (const item of shopItems) {
        // Delete associated user purchases first
        const purchasesResult = await API.graphql({
          query: queries.userPurchasesByShopItemID,
          variables: {
            shopItemID: item.id
          }
        });
        
        const purchases = purchasesResult.data.userPurchasesByShopItemID.items.filter(p => !p._deleted);
        
        for (const purchase of purchases) {
          await API.graphql({
            query: mutations.deleteUserPurchase,
            variables: { input: { id: purchase.id } }
          });
        }
        
        // Then delete the shop item
        await API.graphql({
          query: mutations.deleteShopItem,
          variables: { input: { id: item.id } }
        });
      }

      // Delete all email templates
      const templatesResult = await API.graphql({
        query: queries.emailTemplatesByOrganizationID,
        variables: {
          organizationID: organizationData.id
        }
      });
      
      const templates = templatesResult.data.emailTemplatesByOrganizationID.items.filter(t => !t._deleted);
      
      for (const template of templates) {
        await API.graphql({
          query: mutations.deleteEmailTemplate,
          variables: { input: { id: template.id } }
        });
      }

      // Delete all members except the primary admin
      const membersToDelete = members.filter(m => m.userSub !== organizationData.owner);
      for (const member of membersToDelete) {
        await API.graphql({
          query: mutations.deleteOrganizationMember,
          variables: { input: { id: member.id } }
        });
      }

      // Delete the primary admin member
      const primaryAdminMember = members.find(m => m.userSub === organizationData.owner);
      if (primaryAdminMember) {
        await API.graphql({
          query: mutations.deleteOrganizationMember,
          variables: { input: { id: primaryAdminMember.id } }
        });
      }

      // Finally, delete the organization itself
      await API.graphql({
        query: mutations.deleteOrganization,
        variables: { 
          input: { 
            id: organizationData.id
          } 
        }
      });

      showAlert('Organization has been completely deleted');
      
      // Reset the organization context
      await refreshOrganization();
      
      // Redirect to organization selection or creation page
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error clearing organization data:', error);
      showAlert('Failed to clear organization data', 'danger');
    } finally {
      setIsClearing(false);
    }
  };

  const fetchLogoUrl = async (logoKey) => {
    try {
      if (!logoKey) return;
      
      const url = await Storage.get(logoKey, {
        level: 'public',
        expires: 60 * 60 * 24 // 24 hours
      });
      setLogoPreview(url);
    } catch (error) {
      console.error('Error fetching logo URL:', error);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert('Please select a valid image file', 'danger');
      return;
    }

    setUploadingLogo(true);
    try {
      // Compress the image - higher quality (0.6) for logo
      const compressedFile = await compressImage(file, { 
        quality: 0.6,
        maxWidth: 600,
        maxHeight: 600
      });
      
      // Create a unique filename
      const key = `organization-logos/${activeOrganization.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      // Upload to S3
      await Storage.put(key, compressedFile, {
        contentType: file.type,
        level: 'public'
      });
      
      // Get the URL for preview
      const logoUrl = await Storage.get(key, { 
        level: 'public',
        expires: 60 * 60 * 24 // 24 hours
      });
      
      // Update the form data with the image key
      setEditData(prev => ({ ...prev, logo: key }));
      setLogoPreview(logoUrl);
      
      showAlert('Logo uploaded successfully. Save changes to apply.', 'success');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showAlert('Failed to upload logo. Please try again.', 'danger');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    // If we have a logo already stored in S3, remove it
    if (editData.logo && editData.logo.startsWith('organization-logos/')) {
      try {
        await Storage.remove(editData.logo, { level: 'public' });
      } catch (error) {
        console.error('Error removing logo from S3:', error);
      }
    }
    
    // Clear the logo field and preview
    setEditData(prev => ({ ...prev, logo: '' }));
    setLogoPreview(null);
    showAlert('Logo removed. Save changes to apply.', 'info');
  };

  if (loading) {
    return (
      <Container className="py-5 mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <>
    <Container className="py-4 pt-5">
      {/* Embedded YouTube Video - Thumbnail with Text */}
      <Alert variant="info" className="mb-4 border-0 shadow-sm" style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        borderLeft: '4px solid #667eea'
      }}>
        <div className="d-flex align-items-center">
          {/* Video Thumbnail */}
          <div style={{ 
            width: '200px', 
            minWidth: '200px',
            marginRight: '20px'
          }}>
            <div className="ratio ratio-16x9" style={{ 
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}>
              <iframe
                src="https://www.youtube.com/embed/zGbgwcZj3-4?rel=0&modestbranding=1&controls=1"
                title="Organization Management Tutorial"
                style={{ border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="flex-grow-1">
            <div className="d-flex align-items-start">
              <FontAwesomeIcon icon={faInfoCircle} className="text-primary me-2 mt-1" size="lg" />
              <div>
                <h5 className="mb-1 text-primary">New to Organization Management?</h5>
                <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
                  Check out this quick tutorial to learn how to effectively manage your organization, invite team members, set up departments, and configure your organization settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Alert>

      {alert && (
        <Alert variant={alert.type} className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Trial Status Indicator */}
      {organizationData && organizationData.purchasedLicenses === 0 && (
        <Alert variant={isTrialExpired(organizationData) ? "danger" : "warning"} className="mb-4">
          <FontAwesomeIcon icon={isTrialExpired(organizationData) ? faExclamationTriangle : faInfoCircle} className="me-2" />
          <strong>
            {isTrialExpired(organizationData) ? "Trial Expired!" : "Trial Period"}
          </strong>
          {" "}
          {isTrialExpired(organizationData) ? (
            "Your 14-day trial has expired. Please purchase licenses to continue using the platform."
          ) : (
            (() => {
              const createdAt = new Date(organizationData.createdAt);
              const now = new Date();
              const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
              const daysRemaining = Math.max(0, 14 - daysPassed);
              return `You have ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining in your free trial. Purchase licenses to continue using the platform after your trial expires.`;
            })()
          )}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Organizational Management</h2>
        <Button 
          variant="outline-info" 
          size="sm"
          onClick={() => navigate('/start-smart')}
          className="d-flex align-items-center"
        >
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          Administrative Info
        </Button>
      </div>

      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="details">
                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                Organization Details
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="members">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Active Users/Members
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="awards">
                <FontAwesomeIcon icon={faTrophy} className="me-2" />
                Awards
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="emails">
                <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                Email Templates
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="ai-settings">
                <FontAwesomeIcon icon={faRobot} className="me-2" />
                AI Settings
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="shop">
                <FontAwesomeIcon icon={faStore} className="me-2" />
                Shop
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
      </Card>

      {activeTab === 'details' && (
        <Row>
          <Col md={8}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-primary me-2" />
                  <h5 className="mb-0">Organization Details</h5>
                </div>
                <Button
                  variant={isEditing ? "success" : "primary"}
                  size="sm"
                  onClick={() => {
                    if (isEditing) {
                      updateOrganizationDetails();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={isEditing ? faCheck : faPencilAlt} className="me-1" />
                  {isEditing ? 'Save Changes' : 'Edit Details'}
                </Button>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label className="text-muted fw-bold">Organization Logo</Form.Label>
                    <div className="d-flex align-items-start">
                      <div className="me-3">
                        {logoPreview ? (
                          <Image 
                            src={logoPreview} 
                            alt="Organization Logo" 
                            style={{ 
                              width: '100px', 
                              height: '100px', 
                              objectFit: 'contain',
                              border: '1px solid #ced4da',
                              borderRadius: '4px',
                              padding: '4px'
                            }} 
                          />
                        ) : (
                          <div 
                            className="d-flex align-items-center justify-content-center bg-light"
                            style={{ 
                              width: '100px', 
                              height: '100px', 
                              border: '1px solid #ced4da',
                              borderRadius: '4px' 
                            }}
                          >
                            <FontAwesomeIcon icon={faImage} size="2x" className="text-muted" />
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="d-flex flex-column">
                          <input
                            id="logo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: 'none' }}
                          />
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="mb-2"
                            onClick={() => document.getElementById('logo-upload').click()}
                            disabled={uploadingLogo}
                            style={{ minWidth: '160px', textAlign: 'center' }}
                          >
                            {uploadingLogo ? (
                              <>
                                <Spinner animation="border" size="sm" className="me-1" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <FontAwesomeIcon icon={faUpload} className="me-1" />
                                Upload Logo
                              </>
                            )}
                          </Button>
                          
                          {logoPreview && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={handleRemoveLogo}
                              style={{ minWidth: '160px', textAlign: 'center' }}
                            >
                              <FontAwesomeIcon icon={faTrash} className="me-1" />
                              Remove Logo
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-muted fw-bold">Organization Name</Form.Label>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        value={editData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="border-primary"
                      />
                    ) : (
                      <p className="form-control-plaintext fs-5">{organizationData.name}</p>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-muted fw-bold">Organization ID</Form.Label>
                    <p className="form-control-plaintext">{organizationData.id}</p>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-muted fw-bold">
                      <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                      Contact Email
                    </Form.Label>
                    {isEditing ? (
                      <Form.Control
                        type="email"
                        value={editData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        className="border-primary"
                      />
                    ) : (
                      <p className="form-control-plaintext">{organizationData.contactEmail || 'Not provided'}</p>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-muted fw-bold">
                      <FontAwesomeIcon icon={faPhone} className="me-2" />
                      Contact Phone
                    </Form.Label>
                    {isEditing ? (
                      <Form.Control
                        type="tel"
                        value={editData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        className="border-primary"
                      />
                    ) : (
                      <p className="form-control-plaintext">{organizationData.contactPhone || 'Not provided'}</p>
                    )}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="text-muted fw-bold">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                      Location
                    </Form.Label>
                    {isEditing ? (
                      <GooglePlacesAutocomplete
                        apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                        style={locationInputStyles}
                        onPlaceSelected={handleLocationSelect}
                        defaultValue={locationDetails.formattedAddress}
                        options={{
                          types: ['(cities)']
                        }}
                      />
                    ) : (
                      <p className="form-control-plaintext">
                        {locationDetails.formattedAddress || 'Not provided'}
                        {locationDetails.coordinates && (
                          <>
                            <br />
                            <small className="text-muted">
                              Coordinates: {locationDetails.coordinates.lat.toFixed(6)}, {locationDetails.coordinates.lng.toFixed(6)}
                            </small>
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${locationDetails.coordinates.lat},${locationDetails.coordinates.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ms-2 text-primary"
                            >
                              <FontAwesomeIcon icon={faMapMarkerAlt} />
                              View on map
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <DepartmentCard
              organization={organizationData}
              members={members}
              onMemberUpdate={fetchMembers}
              departments={departments}
              setDepartments={setDepartments}
            />
            <Card className="shadow-sm border-danger">
              <Card.Header className="bg-white py-3 border-danger">
                <h5 className="mb-0 text-danger">Danger Zone</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted mb-3">
                  This action will permanently delete all organization data including:
                  <ul className="mt-2 mb-3">
                    <li>All reports and their items</li>
                    <li>All projects and action items</li>
                    <li>All departments</li>
                    <li>All awards and award templates</li>
                    <li>All shop items and purchase history</li>
                    <li>All email templates</li>
                    <li>All members (including primary admin)</li>
                    <li>The organization itself</li>
                  </ul>
                  This action cannot be undone. You will be redirected to the home page after deletion.
                </p>
                <Button
                  variant="outline-danger"
                  className="w-100"
                  onClick={() => {
                    if (window.confirm('WARNING: This will permanently delete ALL organization data. This action cannot be undone. Are you sure you want to proceed?')) {
                      clearOrganizationData();
                    }
                  }}
                  disabled={isClearing}
                >
                  <FontAwesomeIcon icon={faTrash} className="me-2" />
                  {isClearing ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Clearing Organization Data...
                    </>
                  ) : (
                    'Clear Organization Data'
                  )}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {activeTab === 'members' && (
        <Card className="shadow-sm">
          <Card.Header className="bg-white py-3">
            <div>
              {/* First Row - Title and Admin/Status Badges */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <FontAwesomeIcon icon={faUsers} className="text-primary me-2" />
                  <h5 className="mb-0 d-inline">Active Users/Members ({members.length})</h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Badge bg="dark">
                    Primary Admin: {ownerEmail || 'Loading...'}
                  </Badge>
                  <Badge bg="success">
                    Active: {organizationData.activeUserCount || members.filter(m => m.status === 'ACTIVE').length}
                  </Badge>
                  <Badge bg="warning">
                    Pending: {members.filter(m => m.status === 'PENDING').length}
                  </Badge>
                </div>
              </div>
              
              {/* Second Row - Subscription Info and History Button */}
              <div className="mt-2">
                <div className="d-flex align-items-center flex-wrap">
                  <Badge bg="primary" className="me-3 mb-1">
                    <FontAwesomeIcon icon={faUsers} className="me-1" />
                    Licenses: {organizationData?.purchasedLicenses || 0}
                  </Badge>
                  
                  {organizationData?.subscriptionStatus === 'ACTIVE' && (
                    <>
                      <Badge bg="success" className="me-3 mb-1">
                        <FontAwesomeIcon icon={faCreditCard} className="me-1" />
                        {(() => {
                          const period = organizationData?.billingPeriod;
                          if (period === 'MONTH' || period === 'MONTHLY') return 'Monthly';
                          if (period === 'YEAR' || period === 'YEARLY') return 'Yearly';
                          return 'Monthly';
                        })()}
                      </Badge>
                      {organizationData?.subscriptionPeriodEnd && (
                        <Badge bg="info" className="me-3 mb-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                          Next: {new Date(organizationData.subscriptionPeriodEnd).toLocaleDateString()}
                        </Badge>
                      )}
                    </>
                  )}
                  
                  {organizationData?.subscriptionStatus === 'ACTIVE' && (
                    <div className="w-100 mt-2">
                      <small className="text-muted">
                        <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                        Need to change billing cycle? Contact us at <strong>hello@vibestack.example</strong>
                      </small>
                    </div>
                  )}
                  
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowLicenseHistoryModal(true)}
                    style={{ minWidth: '150px' }}
                    className="mb-1 me-2"
                  >
                    <FontAwesomeIcon icon={faHistory} className="me-2" />
                    View History
                  </Button>
                  
                  {organizationData?.subscriptionStatus === 'ACTIVE' && organizationData?.stripeSubscriptionId && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setShowCancelSubscriptionModal(true)}
                      style={{ minWidth: '150px' }}
                      className="mb-1"
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-2" />
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {isFirstTimeUser() ? (
              // Get Started Section for First-Time Users
              <div className="text-center">
                <div className="mb-4">
                  <FontAwesomeIcon icon={faTrophy} size="3x" className="text-primary mb-3" />
                  <h4 className="text-primary">Welcome to VibeStack™ Pro!</h4>
                  <p className="text-muted lead">Get started with team collaboration and lean methodology tools</p>
                </div>
                
                <Alert variant="info" className="mb-4">
                  <h5 className="alert-heading">💰 Simple Pricing</h5>
                  <hr />
                  <Row className="text-center">
                    <Col md={6}>
                      <div className="border rounded p-3 mb-2">
                        <h6 className="text-primary">Monthly</h6>
                        <div className="h4 text-success">$2.98</div>
                        <small className="text-muted">per user/month</small>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="border rounded p-3 mb-2 bg-light">
                        <h6 className="text-primary">Yearly <Badge bg="success">Save 10%</Badge></h6>
                        <div className="h4 text-success">$32.00</div>
                        <small className="text-muted">per user/year</small>
                      </div>
                    </Col>
                  </Row>
                  <hr />
                  <ul className="list-unstyled text-start mb-0">
                    <li>✅ Unlimited lean methodology tools (5S, Kaizen, Value Stream Mapping, etc.)</li>
                    <li>✅ Professional PDF reports and documentation</li>
                    <li>✅ Team collaboration and project management</li>
                    <li>✅ Awards system and gamification</li>
                    <li>✅ Email notifications and integrations</li>
                  </ul>
                </Alert>
                
                <div className="mb-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-5"
                    onClick={handleGetStarted}
                    disabled={isGettingStarted}
                  >
                    {isGettingStarted ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Setting up your account...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Get Started
                      </>
                    )}
                  </Button>
                </div>
                
                <small className="text-muted">
                  Click "Get Started" to set up your account and begin purchasing licenses for your team.
                </small>
              </div>
            ) : (
              <>
            {/* License Status Alert */}
            {(() => {
              // Count all invited users (both PENDING and ACTIVE), not just active users
              const totalInvitedUsers = members.filter(m => !m._deleted).length;
              const purchasedLicenses = organizationData?.purchasedLicenses || 0;
              const availableLicenses = purchasedLicenses - totalInvitedUsers;
              
              if (availableLicenses < 0) {
                return (
                  <Alert variant="danger" className="mb-4">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    <strong>License Shortage!</strong> You have {Math.abs(availableLicenses)} more invited users than purchased licenses.
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="ms-3"
                      onClick={() => setShowLicensePurchaseModal(true)}
                    >
                      Purchase Licenses
                    </Button>
                  </Alert>
                );
              } else if (availableLicenses === 0) {
                return (
                  <Alert variant="warning" className="mb-4">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    <strong>No Licenses Available!</strong> {purchasedLicenses === 0 ? 'Please purchase licenses to invite team members.' : `All ${purchasedLicenses} licenses are in use. Purchase more to invite new members.`}
                    <Button 
                      variant="warning" 
                      size="sm" 
                      className="ms-3"
                      onClick={() => setShowLicensePurchaseModal(true)}
                    >
                      Purchase More
                    </Button>
                  </Alert>
                );
              } else {
                return (
                  <Alert variant="success" className="mb-4">
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                    You have <strong>{availableLicenses}</strong> available license{availableLicenses !== 1 ? 's' : ''} remaining.
                  </Alert>
                );
              }
            })()}
            
            <Alert variant="info" className="mb-4">
              <p className="mb-0">
                To add or manage Users/Members, please visit the web version of VibeStack™ at www.VibeStack.com.
              </p>
            </Alert>
            
            <Alert variant="primary" className="mb-4">
              <p className="mb-0">
                <strong>🎯 LeadershipFITT™ Benefit:</strong> When your team is actively using VibeStack™ Pro (10+ users), we give LeadershipFITT™ to all managers—free. Please email services.VibeStack@gmail.com or hello@vibestack.example.
              </p>
            </Alert>
            <Form onSubmit={inviteMember} className="mb-4">
              <Form.Group className="mb-3">
                <Form.Label>Invite New Member</Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="me-2"
                  />
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <><FontAwesomeIcon icon={faUserPlus} className="me-1" /> Invite</>
                    )}
                  </Button>
                </div>
              </Form.Group>
            </Form>

            <div style={{ 
              maxHeight: members.length > 5 ? '375px' : 'auto', 
              overflowY: members.length > 5 ? 'scroll' : 'visible',
              overflowX: 'hidden',
              border: members.length > 5 ? '1px solid #e0e0e0' : 'none',
              borderRadius: members.length > 5 ? '0.25rem' : '0',
              padding: members.length > 5 ? '0.5rem' : '0'
            }}>
              <ListGroup variant="flush">
                {members.map((member) => (
                  <MemberItem
                    key={member.id}
                    member={member}
                    departments={departments}
                    currentUser={currentUser}
                    organizationOwner={organizationData.owner}
                    additionalOwners={organizationData.additionalOwners}
                    onRemove={removeMember}
                    onResendInvite={resendInvite}
                    onUpdateDepartment={handleUpdateMemberDepartment}
                    onAssignOwner={handleAssignOwner}
                  />
                ))}
              </ListGroup>
            </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {activeTab === 'awards' && (
        <>
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Nav variant="pills" activeKey={activeAwardsTab} onSelect={setActiveAwardsTab}>
                <Nav.Item>
                  <Nav.Link eventKey="definitions">
                    <FontAwesomeIcon icon={faTrophy} className="me-2" />
                    Award Definitions
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="view">
                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                    View Awards
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="settings">
                    <FontAwesomeIcon icon={faRankingStar} className="me-2" />
                    Leaderboard Settings
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="learning-coins">
                    <FontAwesomeIcon icon={faCoins} className="me-2" />
                    Learning Coins
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>

          {activeAwardsTab === 'definitions' ? (
            <AwardManagement organizationId={organizationData.id} />
          ) : activeAwardsTab === 'view' ? (
            <AdminAwardsView organizationId={organizationData.id} />
          ) : activeAwardsTab === 'learning-coins' ? (
            <Card className="shadow-sm">
              <Card.Header className="bg-white py-3">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
                  <h5 className="mb-0">Learning Time Rewards</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="alert alert-info mb-4">
                  <div className="d-flex align-items-start">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-info me-2 mt-1" />
                    <div>
                      <strong>How Learning Time Rewards Work:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Users earn coins for <strong>active learning time</strong> (must be engaged and tab visible)</li>
                        <li>Coins are awarded at <strong>time intervals</strong> (e.g., every 5 minutes)</li>
                        <li>Each learning module has a <strong>lifetime coin limit</strong> per user to prevent abuse</li>
                        <li>Users see award modal with animation and sound when they earn coins</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                          Coins per Time Interval
                          <span className="badge bg-primary ms-2">Reward Amount</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={learningCoinsData.learningCoinsPerInterval}
                          onChange={(e) => handleLearningCoinUpdate('learningCoinsPerInterval', parseInt(e.target.value))}
                          min="1"
                          max="100"
                        />
                        <Form.Text className="text-muted">
                          <strong>What this controls:</strong> How many coins users earn each time they complete a time interval.<br/>
                          <strong>Example:</strong> If set to 5, users get 5 coins for every completed time interval.<br/>
                          <strong>Recommended:</strong> 1-10 coins (too high may devalue coins, too low may not motivate)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                          Time Interval (minutes)
                          <span className="badge bg-success ms-2">Time Requirement</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={Math.floor(learningCoinsData.learningCoinInterval / 60)}
                          onChange={(e) => handleLearningCoinUpdate('learningCoinInterval', parseInt(e.target.value) * 60)}
                          min="1"
                          max="60"
                        />
                        <Form.Text className="text-muted">
                          <strong>What this controls:</strong> How many minutes of active learning needed to earn coins.<br/>
                          <strong>Example:</strong> If set to 5, users must learn actively for 5 minutes to earn coins.<br/>
                          <strong>Recommended:</strong> 3-10 minutes (shorter = more frequent rewards, longer = fewer interruptions)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                          Maximum Coins per Learning Module
                          <span className="badge bg-warning ms-2">Abuse Prevention</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={learningCoinsData.learningMaxCoinsPerSession}
                          onChange={(e) => handleLearningCoinUpdate('learningMaxCoinsPerSession', parseInt(e.target.value))}
                          min="0"
                          max="1000"
                        />
                        <Form.Text className="text-muted">
                          <strong>What this controls:</strong> Total coins a user can earn from each individual learning module (lifetime limit).<br/>
                          <strong>Example:</strong> If set to 20, users can earn max 20 coins from "5S Training" but can still earn from other modules.<br/>
                          <strong>Recommended:</strong> 15-50 coins (prevents abuse while allowing meaningful rewards). Set to 0 for unlimited.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Form.Label className="fw-bold">
                              Enable Learning Time Rewards
                              <span className="badge bg-info ms-2">Feature Toggle</span>
                            </Form.Label>
                            <p className="text-muted mb-0">
                              <strong>What this controls:</strong> Turns the entire learning time rewards system on/off.<br/>
                              <strong>When enabled:</strong> Users earn coins for active learning based on settings above.<br/>
                              <strong>When disabled:</strong> No learning time coins are awarded (other award types still work).
                            </p>
                          </div>
                          <Form.Check 
                            type="switch"
                            id="learning-coins-toggle"
                            checked={learningCoinsData.learningCoinsEnabled}
                            onChange={(e) => handleLearningCoinUpdate('learningCoinsEnabled', e.target.checked)}
                            className="ms-3"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                </Form>
                
                <div className="alert alert-light mt-4">
                  <h6 className="fw-bold mb-3">
                    <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
                    Example: How These Settings Work Together
                  </h6>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card bg-success bg-opacity-10 border-success">
                        <div className="card-body p-3">
                          <h6 className="text-success mb-2">Current Settings:</h6>
                          <ul className="mb-0 small">
                            <li><strong>{learningCoinsData.learningCoinsPerInterval} coins</strong> per interval</li>
                            <li><strong>{Math.floor(learningCoinsData.learningCoinInterval / 60)} minutes</strong> per interval</li>
                            <li><strong>{learningCoinsData.learningMaxCoinsPerSession} coins</strong> max per module</li>
                            <li><strong>{learningCoinsData.learningCoinsEnabled ? 'Enabled' : 'Disabled'}</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card bg-info bg-opacity-10 border-info">
                        <div className="card-body p-3">
                          <h6 className="text-info mb-2">User Experience:</h6>
                          <ul className="mb-0 small">
                            <li>Every <strong>{Math.floor(learningCoinsData.learningCoinInterval / 60)} minutes</strong> of active learning = <strong>{learningCoinsData.learningCoinsPerInterval} coins</strong></li>
                            <li>Maximum <strong>{learningCoinsData.learningMaxCoinsPerSession} coins</strong> per learning module</li>
                            <li>Can earn from multiple different modules</li>
                            <li>Gets award modal with sound when earning coins</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save/Cancel buttons - only show if changes were made */}
                {learningCoinsChanged && (
                  <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                    <Button
                      variant="outline-secondary"
                      onClick={resetLearningCoinsSettings}
                      disabled={savingLearningCoins}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={saveLearningCoinsSettings}
                      disabled={savingLearningCoins}
                    >
                      {savingLearningCoins ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-1"
                          />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheck} className="me-1" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <Card.Header className="bg-white py-3">
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faRankingStar} className="text-primary me-2" />
                  <h5 className="mb-0">Leaderboard Settings</h5>
                </div>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Form.Label className="fw-bold mb-1">Enable Leaderboard</Form.Label>
                        <p className="text-muted mb-0">
                          When enabled, users can see how they rank compared to other organization members based on their earned coins.
                        </p>
                      </div>
                      <Form.Check 
                        type="switch"
                        id="leaderboard-toggle"
                        checked={organizationData.leaderboardEnabled === true}
                        onChange={async (e) => {
                          try {
                            // Show a temporary saving indicator in the alert
                            showAlert('Updating leaderboard setting...', 'info');
                            
                            const updateResult = await API.graphql({
                              query: mutations.updateOrganization,
                              variables: {
                                input: {
                                  id: organizationData.id,
                                  leaderboardEnabled: e.target.checked,
                                  _version: organizationData._version
                                }
                              }
                            });
                            
                            // Get the updated organization data from the result
                            const updatedOrg = updateResult.data.updateOrganization;
                            
                            // Update the organization data state with the response from the server
                            setOrganizationData(updatedOrg);
                            
                            // Log the updated value to ensure it changed
                            console.log('Updated leaderboard enabled:', updatedOrg.leaderboardEnabled);
                            
                            showAlert(`Leaderboard ${updatedOrg.leaderboardEnabled ? 'enabled' : 'disabled'} successfully`);
                          } catch (error) {
                            console.error('Error updating leaderboard settings:', error);
                            // Show more detailed error information
                            const errorDetails = error.errors 
                              ? error.errors.map(e => e.message).join(', ') 
                              : error.message || 'Unknown error';
                            
                            showAlert(`Failed to update leaderboard settings: ${errorDetails}`, 'danger');
                          }
                        }}
                      />
                    </div>
                  </Form.Group>
                </Form>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {activeTab === 'emails' && (
        <EmailTemplateManagement organizationId={organizationData.id} />
      )}

      {activeTab === 'ai-settings' && (
        <AISettingsTab 
          organizationData={organizationData}
          aiSettings={aiSettings}
          setAiSettings={setAiSettings}
          loadingAiSettings={loadingAiSettings}
          setLoadingAiSettings={setLoadingAiSettings}
          aiSettingsError={aiSettingsError}
          setAiSettingsError={setAiSettingsError}
          paymentHistory={paymentHistory}
          setPaymentHistory={setPaymentHistory}
          tokenUsageHistory={tokenUsageHistory}
          setTokenUsageHistory={setTokenUsageHistory}
          loadingPaymentHistory={loadingPaymentHistory}
          setLoadingPaymentHistory={setLoadingPaymentHistory}
          loadingTokenUsage={loadingTokenUsage}
          setLoadingTokenUsage={setLoadingTokenUsage}
          topupAmount={topupAmount}
          setTopupAmount={setTopupAmount}
          processingPayment={processingPayment}
          setProcessingPayment={setProcessingPayment}
          usageCurrentPage={usageCurrentPage}
          setUsageCurrentPage={setUsageCurrentPage}
          usageHasNextPage={usageHasNextPage}
          setUsageHasNextPage={setUsageHasNextPage}
          usageTotalRecords={usageTotalRecords}
          setUsageTotalRecords={setUsageTotalRecords}
          chatPermissions={chatPermissions}
          setChatPermissions={setChatPermissions}
          savingPermissions={savingPermissions}
          setSavingPermissions={setSavingPermissions}
          members={members}
          showAlert={showAlert}
          handleCreditPurchase={handleCreditPurchase}
          fetchMembers={fetchMembers}
          setOrganizationData={setOrganizationData}
          setActiveOrganization={setActiveOrganization}
          refreshTrigger={aiSettingsRefreshTrigger}
        />
      )}

      {activeTab === 'shop' && (
        <ShopManagement />
      )}

      <PaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        clientSecret={paymentClientSecret}
        stripePromise={stripePromise}
      />
      
      <CreditPaymentModal
        show={showCreditPaymentModal}
        onHide={() => {
          setShowCreditPaymentModal(false);
          setCreditPaymentClientSecret(null);
          setProcessingPayment(false);
        }}
        clientSecret={creditPaymentClientSecret}
        stripePromise={tokenStripePromise}
        amount={topupAmount}
        onSuccess={handleCreditPurchaseSuccess}
      />

    </Container>
    
    {/* License Purchase Modal */}
    <LicensePurchaseModal
      show={showLicensePurchaseModal}
      onHide={() => setShowLicensePurchaseModal(false)}
      organization={organizationData}
      currentActiveUsers={members.filter(m => !m._deleted).length}
      onPurchaseComplete={() => {
        fetchOrganizationData();
        fetchMembers();
        showAlert('Licenses purchased successfully! You can now invite new members.', 'success');
      }}
      onOrganizationUpdate={() => {
        fetchOrganizationData();
      }}
    />

    {/* License History Modal */}
    <LicenseHistoryModal
      show={showLicenseHistoryModal}
      onHide={() => setShowLicenseHistoryModal(false)}
      organization={organizationData}
    />

    {/* Cancel Subscription Modal */}
    <Modal show={showCancelSubscriptionModal} onHide={() => setShowCancelSubscriptionModal(false)} centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-danger">
          <FontAwesomeIcon icon={faTimes} className="me-2" />
          Cancel Subscription
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="danger">
          <Alert.Heading className="h6">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Warning: This action cannot be undone
          </Alert.Heading>
          <hr />
          <p className="mb-2">Canceling your subscription will immediately:</p>
          <ul className="mb-3">
            <li>Remove all <strong>{organizationData?.purchasedLicenses || 0} licenses</strong></li>
            <li>Stop all future charges to your payment method</li>
            <li>Prevent team members from accessing premium features</li>
            <li>Keep your data and reports intact for future reactivation</li>
          </ul>
          <p className="mb-0 text-muted">
            <small>You can resubscribe at any time to restore full access.</small>
          </p>
        </Alert>
        
        <div className="text-center">
          <p className="lead">Are you sure you want to cancel your subscription?</p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={() => setShowCancelSubscriptionModal(false)}
          disabled={cancelingSubscription}
        >
          Keep Subscription
        </Button>
        <Button 
          variant="danger" 
          onClick={handleCancelSubscription}
          disabled={cancelingSubscription}
        >
          {cancelingSubscription ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Canceling...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faTimes} className="me-2" />
              Yes, Cancel Subscription
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default OrganizationManagement; 