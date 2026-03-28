import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Spinner, Alert, Toast } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faUsers, faCalendarAlt, faDollarSign, faHistory } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import TransactionModal from './TransactionModal';
import PaymentModal from './PaymentModal';
import { loadStripe } from '@stripe/stripe-js';

const SubscriptionCard = ({ organization, onSubscribe, memberCount }) => {
  const [loading, setLoading] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  useEffect(() => {
    if (memberCount !== undefined) {
      setLoading(false);
    }
  }, [memberCount]);

  useEffect(() => {
    // Initialize Stripe
    const initStripe = async () => {
      try {
        const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
          throw new Error('Stripe publishable key is not configured');
        }
        console.log('Initializing Stripe with key:', publishableKey.substring(0, 8) + '...');
        const stripe = await loadStripe(publishableKey);
        if (!stripe) {
          throw new Error('Failed to initialize Stripe');
        }
        console.log('Stripe initialized successfully');
        setStripePromise(stripe);
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        showAlert('Failed to initialize payment system: ' + error.message, 'danger');
      }
    };

    initStripe();
  }, []);

  const showAlert = (message, variant = 'danger') => {
    setToast({ show: true, message, variant });
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const result = await API.graphql({
        query: queries.listSubscriptionInvoices,
        variables: {
          filter: {
            organizationId: { eq: organization.id }
          }
        }
      });

      const sortedInvoices = result.data.listSubscriptionInvoices.items
        .filter(invoice => !invoice._deleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setInvoices(sortedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleShowTransactions = () => {
    fetchInvoices();
    setShowTransactions(true);
  };

  const handleQuantityUpdate = async (newQuantity) => {
    try {
      const currentLicenses = organization?.purchasedLicenses || 0;
      const isIncompleteStatus = organization?.subscriptionStatus === 'INCOMPLETE';
      
      // Validate license count - allow same count for INCOMPLETE status to complete payment
      if (!isIncompleteStatus && newQuantity <= currentLicenses) {
        showAlert('New license count must be greater than current count', 'warning');
        return;
      }
      
      // For INCOMPLETE status, allow same count to complete the payment
      if (isIncompleteStatus && newQuantity < currentLicenses) {
        showAlert('License count cannot be less than current count', 'warning');
        return;
      }

      const result = await API.graphql({
        query: mutations.updateSubscriptionQuantity,
        variables: {
          organizationId: organization.id,
          newQuantity: newQuantity
        }
      });

      const response = result.data?.updateSubscriptionQuantity || {};
      const additionalLicenses = response.additionalLicenses || newQuantity - currentLicenses;
      const proratedAmount = response.proratedAmount || 0;

      setPaymentClientSecret(response.clientSecret);
      setShowPaymentModal(true);

      showAlert(
        `Adding ${additionalLicenses} licenses. ${proratedAmount ? 
          `Prorated charge: $${proratedAmount.toFixed(2)}` : 
          'No proration applied'
        }`,
        'info'
      );

    } catch (error) {
      console.error('Error updating quantity:', error);
      showAlert(error.message || 'Failed to update subscription quantity', 'danger');
    }
  };

  const renderLicenseWarning = () => {
    if (memberCount > (organization?.purchasedLicenses || 0)) {
      const additionalUsers = memberCount - (organization?.purchasedLicenses || 0);
      const billingPeriod = organization?.billingPeriod?.toLowerCase() || 'monthly';
      const pricePerUser = billingPeriod === 'monthly' ? 2.98 : 32;
      
      // Calculate prorated amount
      const currentDate = new Date();
      const periodEnd = organization?.subscriptionPeriodEnd ? new Date(organization.subscriptionPeriodEnd) : null;
      let proratedEstimate = 0;
      
      if (periodEnd) {
        const daysLeft = Math.ceil((periodEnd - currentDate) / (1000 * 60 * 60 * 24));
        const totalDays = billingPeriod === 'monthly' ? 30 : 365;
        proratedEstimate = (pricePerUser * additionalUsers * daysLeft) / totalDays;
      }
      
      return (
        <Alert variant="warning" className="mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Additional Users Detected</strong>
              <p className="mb-0">
                You have {additionalUsers} more active user{additionalUsers > 1 ? 's' : ''} than your purchased licenses ({organization?.purchasedLicenses || 0}).
              </p>
              <small className="text-muted">
                Estimated prorated charge: ${proratedEstimate.toFixed(2)} for the remaining {billingPeriod === 'monthly' ? 'month' : 'year'}.
                <br />
                The full {billingPeriod} rate of ${pricePerUser}/user will apply in your next billing cycle.
              </small>
            </div>
            <Button
              variant="warning"
              size="sm"
              onClick={() => handleQuantityUpdate(memberCount)}
              disabled={loading}
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <>Purchase Additional Licenses</>
              )}
            </Button>
          </div>
        </Alert>
      );
    }
    return null;
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAST_DUE':
        return 'warning';
      case 'CANCELED':
        return 'danger';
      case 'INCOMPLETE':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPricePerUser = (billingPeriod) => {
    return billingPeriod === 'MONTHLY' ? 2.98 : 32; // $2.98/month or $32/year
  };

  const calculateSavings = () => {
    return 10; // Fixed 10% savings for yearly plan
  };

  const calculateTotalPrice = (pricePerUser, period) => {
    // For yearly, pricePerUser is already the annual price
    // For monthly, multiply by memberCount only
    if (period === 'YEARLY') {
      return (pricePerUser * memberCount).toFixed(2);
    } else {
      return (pricePerUser * memberCount).toFixed(2);
    }
  };

  if (loading) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        delay={3000}
        autohide
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999
        }}
      >
        <Toast.Header>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body className={`bg-${toast.variant} text-white`}>
          {toast.message}
        </Toast.Body>
      </Toast>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faCreditCard} className="text-primary me-2" />
              <h5 className="mb-0">Subscription</h5>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleShowTransactions}
              disabled={loadingInvoices}
              style={{ whiteSpace: 'nowrap', width: 'auto' }}
            >
              <FontAwesomeIcon icon={faHistory} className="me-2" />
              {loadingInvoices ? 'Loading...' : 'Transaction History'}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">Status</span>
              <Badge bg={getStatusBadgeVariant(organization?.subscriptionStatus)}>
                {organization?.subscriptionStatus || 'NONE'}
              </Badge>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Active Users
              </span>
              <span>{memberCount}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Purchased Licenses
              </span>
              <span>{organization?.purchasedLicenses || 0}</span>
            </div>

            {organization?.billingPeriod && (
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Current Plan</span>
                <span>{organization.billingPeriod.toLowerCase()}</span>
              </div>
            )}

            {organization?.subscriptionPeriodEnd && (
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Next Billing Date
                </span>
                <span>{formatDate(organization.subscriptionPeriodEnd)}</span>
              </div>
            )}
          </div>

          <div className="border-top pt-3">
            <h6 className="mb-3">Available Plans</h6>
            
            <div className="d-grid gap-2">
              {(!organization?.subscriptionStatus || organization?.billingPeriod !== 'MONTHLY') && (
                <Button
                  variant="outline-primary"
                  onClick={() => onSubscribe('MONTHLY')}
                  className="text-start p-3"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>
                        {organization?.subscriptionStatus === 'ACTIVE' ? 'Switch to Monthly Plan' : 'Monthly Plan'}
                      </strong>
                      <div className="small text-muted">$2.98/user/month</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">
                        <FontAwesomeIcon icon={faDollarSign} />
                        {calculateTotalPrice(2.98, 'MONTHLY')}
                      </div>
                      <small className="text-muted">Total/month</small>
                    </div>
                  </div>
                </Button>
              )}
              
              {(!organization?.subscriptionStatus || organization?.billingPeriod !== 'YEARLY') && (
                <Button
                  variant="outline-primary"
                  onClick={() => onSubscribe('YEARLY')}
                  className="text-start p-3"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>
                        {organization?.subscriptionStatus === 'ACTIVE' ? 'Switch to Annual Plan' : 'Annual Plan'}
                      </strong>
                      <div className="small text-muted">$32/user/year ($2.67/user/month)</div>
                      <div className="small text-success">Save {calculateSavings()}%</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold">
                        <FontAwesomeIcon icon={faDollarSign} />
                        {calculateTotalPrice(32, 'YEARLY')}
                      </div>
                      <small className="text-muted">Total/year</small>
                    </div>
                  </div>
                </Button>
              )}
            </div>

            {!organization?.subscriptionStatus && (
              <div className="mt-3 small text-muted">
                <FontAwesomeIcon icon={faUsers} className="me-1" />
                Price based on {memberCount} active user{memberCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {renderLicenseWarning()}

          {/* Additional License Purchase for INCOMPLETE Status */}
          {organization?.subscriptionStatus === 'INCOMPLETE' && (
            <div className="mt-4 p-3 border border-warning rounded">
              <h6 className="text-warning mb-3">
                <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                Complete Your Subscription
              </h6>
              <Alert variant="info" className="mb-3">
                <div>
                  <strong>Payment Incomplete</strong>
                  <p className="mb-0">
                    Your subscription payment needs to be completed. Please purchase the required licenses to activate your subscription.
                  </p>
                </div>
              </Alert>
              
              <div className="d-grid gap-2">
                <Button
                  variant="warning"
                  onClick={() => handleQuantityUpdate(organization?.purchasedLicenses || memberCount)}
                  className="text-start p-3"
                  disabled={loading}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Complete License Purchase</strong>
                      <div className="small text-muted">
                        {organization?.purchasedLicenses || memberCount} license{(organization?.purchasedLicenses || memberCount) !== 1 ? 's' : ''} - 
                        {organization?.billingPeriod === 'YEARLY' ? ` $${32}/user/year` : ` $${2.98}/user/month`}
                      </div>
                    </div>
                    <div className="text-end">
                      {loading ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <>
                          <div className="fw-bold">
                            <FontAwesomeIcon icon={faDollarSign} />
                            {organization?.billingPeriod === 'YEARLY' 
                              ? (32 * (organization?.purchasedLicenses || memberCount)).toFixed(2)
                              : (2.98 * (organization?.purchasedLicenses || memberCount)).toFixed(2)
                            }
                          </div>
                          <small className="text-muted">
                            Total/{organization?.billingPeriod === 'YEARLY' ? 'year' : 'month'}
                          </small>
                        </>
                      )}
                    </div>
                  </div>
                </Button>

                {memberCount > (organization?.purchasedLicenses || 0) && (
                  <Button
                    variant="outline-warning"
                    onClick={() => handleQuantityUpdate(memberCount)}
                    className="text-start p-3"
                    disabled={loading}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Purchase Additional Licenses</strong>
                        <div className="small text-muted">
                          Upgrade to {memberCount} license{memberCount !== 1 ? 's' : ''} to cover all active users
                        </div>
                      </div>
                      <div className="text-end">
                        {loading ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <>
                            <div className="fw-bold">
                              <FontAwesomeIcon icon={faDollarSign} />
                              {organization?.billingPeriod === 'YEARLY' 
                                ? (32 * memberCount).toFixed(2)
                                : (2.98 * memberCount).toFixed(2)
                              }
                            </div>
                            <small className="text-muted">
                              Total/{organization?.billingPeriod === 'YEARLY' ? 'year' : 'month'}
                            </small>
                          </>
                        )}
                      </div>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <PaymentModal
        show={showPaymentModal}
        onHide={() => setShowPaymentModal(false)}
        clientSecret={paymentClientSecret}
        stripePromise={stripePromise}
      />

      <TransactionModal
        show={showTransactions}
        onHide={() => setShowTransactions(false)}
        invoices={invoices}
      />
    </>
  );
};

export default SubscriptionCard; 