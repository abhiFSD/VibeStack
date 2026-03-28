import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner, Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faDollarSign, faCalendarAlt, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PaymentForm = ({ clientSecret, onSuccess, onError, organizationId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required'
      });

      if (error) {
        onError(error.message);
      } else {
        // Payment successful, sync the payment status
        if (organizationId) {
          try {
            await API.graphql({
              query: `
                mutation SyncPaymentStatus($organizationId: ID!) {
                  syncPaymentStatus(organizationId: $organizationId) {
                    success
                    organizationId
                    message
                  }
                }
              `,
              variables: {
                organizationId: organizationId
              }
            });
          } catch (syncError) {
            console.error('Error syncing payment status:', syncError);
          }
        }
        onSuccess();
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <div className="d-grid mt-3">
        <Button 
          type="submit" 
          variant="primary" 
          size="lg"
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
              Complete Purchase
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

const LicensePurchaseModal = ({ 
  show, 
  onHide, 
  organization, 
  currentActiveUsers, // This actually represents total invited users now
  onPurchaseComplete,
  onOrganizationUpdate 
}) => {
  const [licenseQuantity, setLicenseQuantity] = useState(1);
  // Don't initialize with a default - will be set in useEffect based on organization data
  const [billingPeriod, setBillingPeriod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState('selection'); // 'selection' or 'payment'

  // Calculate suggested minimum licenses
  const currentLicenses = organization?.purchasedLicenses || 0;
  const totalInvitedUsers = currentActiveUsers; // Parameter name is misleading but contains total invited users
  const suggestedMinimum = Math.max(1, totalInvitedUsers - currentLicenses + 1);
  
  // Determine minimum allowed licenses based on current licenses
  // If no licenses yet, minimum is 2. Otherwise, minimum is 1.
  const minimumAllowedLicenses = currentLicenses === 0 ? 2 : 1;
  
  // Check if organization has an active subscription
  const hasActiveSubscription = organization?.subscriptionStatus === 'ACTIVE';
  
  // Normalize billing period to handle both old format (MONTH/YEAR) and new format (MONTHLY/YEARLY)
  const normalizeBillingPeriod = (period) => {
    if (!period) return 'MONTHLY';
    if (period === 'MONTH' || period === 'MONTHLY') return 'MONTHLY';
    if (period === 'YEAR' || period === 'YEARLY') return 'YEARLY';
    return 'MONTHLY'; // Default fallback
  };
  
  const currentBillingPeriod = normalizeBillingPeriod(organization?.billingPeriod);
  const nextBillingDate = organization?.subscriptionPeriodEnd;
  

  useEffect(() => {
    // Initialize Stripe
    const initStripe = async () => {
      try {
        const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
          throw new Error('Stripe publishable key is not configured');
        }
        const stripe = await loadStripe(publishableKey);
        setStripePromise(stripe);
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        setError('Failed to initialize payment system');
      }
    };

    if (show) {
      initStripe();
      // Set initial quantity to the greater of suggested minimum or minimum allowed
      setLicenseQuantity(Math.max(suggestedMinimum, minimumAllowedLicenses));
      // Always reset billing period when modal opens
      if (hasActiveSubscription) {
        // Use the normalized billing period we calculated earlier
        setBillingPeriod(currentBillingPeriod);
      } else {
        setBillingPeriod('MONTHLY'); // Default for new subscriptions
      }
      setStep('selection');
      setClientSecret(null);
      setError('');
    }
  }, [show, suggestedMinimum, hasActiveSubscription, currentBillingPeriod]);

  const calculatePrice = () => {
    // Use the actual billing period state, defaulting to MONTHLY if not set yet
    const effectivePeriod = billingPeriod || 'MONTHLY';
    const pricePerUser = effectivePeriod === 'MONTHLY' ? 2.98 : 32.00;
    return (pricePerUser * licenseQuantity).toFixed(2);
  };

  const calculateSavings = () => {
    // Always return exactly 10% savings for yearly billing
    return 10;
  };

  const handlePurchase = async () => {
    // Validate minimum license requirement
    if (currentLicenses === 0 && licenseQuantity < 2) {
      setError('First-time purchase requires a minimum of 2 licenses');
      return;
    }
    
    if (licenseQuantity < minimumAllowedLicenses) {
      setError(`Please select at least ${minimumAllowedLicenses} license${minimumAllowedLicenses > 1 ? 's' : ''}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First, ensure organization has a Stripe customer ID
      if (!organization?.stripeCustomerId) {
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
            organization: organization.id
          }
        });

        const customerResponse = customerResult.data?.createStripeCustomer;
        if (!customerResponse?.success) {
          throw new Error(customerResponse?.error || 'Failed to create Stripe customer');
        }
        console.log('Stripe customer created:', customerResponse.customerId);
        
        // Update the organization object locally
        organization.stripeCustomerId = customerResponse.customerId;
        // Call the update callback if provided
        if (onOrganizationUpdate) {
          onOrganizationUpdate();
        }
      }

      // Now proceed with license purchase
      console.log('Purchasing licenses:', { 
        organizationId: organization.id, 
        quantity: licenseQuantity, 
        billingPeriod: billingPeriod 
      });
      
      const result = await API.graphql({
        query: `
          mutation PurchaseLicenses($organizationId: ID!, $quantity: Int!, $billingPeriod: String!) {
            purchaseLicenses(
              organizationId: $organizationId, 
              quantity: $quantity, 
              billingPeriod: $billingPeriod
            ) {
              success
              clientSecret
              licensesPurchased
              totalAmount
              paymentProcessed
              error
            }
          }
        `,
        variables: {
          organizationId: organization.id,
          quantity: licenseQuantity,
          // Always use the current billing period, defaulting to MONTHLY
          billingPeriod: billingPeriod || 'MONTHLY'
        }
      });

      const response = result.data?.purchaseLicenses;
      
      
      if (response?.success) {
        if (response?.clientSecret) {
          // New subscription or payment needs confirmation
          console.log('License purchase initiated - payment confirmation needed:', {
            licensesPurchased: response.licensesPurchased,
            totalAmount: response.totalAmount
          });
          setClientSecret(response.clientSecret);
          setStep('payment');
        } else if (response?.paymentProcessed) {
          // Subscription update was processed immediately
          console.log('License addition processed immediately:', {
            licensesPurchased: response.licensesPurchased,
            totalAmount: response.totalAmount
          });
          // Directly handle success
          handlePaymentSuccess();
        } else {
          setError('Unexpected response from payment processing');
        }
      } else {
        setError(response?.error || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Error purchasing licenses:', error);
      setError(error.message || 'Failed to purchase licenses');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Show success message
    setStep('selection');
    setClientSecret(null);
    
    // Mark payment as completed to prevent modal from reopening
    sessionStorage.setItem('licensePaymentCompleted', Date.now().toString());
    
    // Wait a moment for webhook to process
    setTimeout(() => {
      onPurchaseComplete?.();
      onHide();
    }, 2000); // Wait 2 seconds for webhook to process
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const renderSelectionStep = () => (
    <>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
          Purchase Additional Licenses
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Alert variant="info" className="mb-4">
          <div>
            <strong>{hasActiveSubscription ? 'Subscription Status' : 'License Status'}</strong>
            <div className="mt-2">
              <div>Total Invited Users: <strong>{totalInvitedUsers}</strong></div>
              <div>Current Purchased Licenses: <strong>{currentLicenses}</strong></div>
              {hasActiveSubscription && (
                <>
                  <div>Billing Period: <strong>{currentBillingPeriod}</strong></div>
                  {nextBillingDate && (
                    <div>Next Billing: <strong>{new Date(nextBillingDate).toLocaleDateString()}</strong></div>
                  )}
                </>
              )}
            </div>
          </div>
        </Alert>

        {/* Add informational message about minimum licenses */}
        <Alert variant="light" className="mb-4 border">
          <FontAwesomeIcon icon={faUsers} className="text-primary me-2" />
          <strong>License Information</strong>
          <div className="mt-2 small">
            A minimum of 2 licenses is required. One license applies to the Admin, and the second can be assigned to another user now or later. This setup ensures your account is ready for collaboration from day one, making it easy to share, test, and grow as a team.
          </div>
        </Alert>

        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Number of Licenses</Form.Label>
                <Form.Control
                  type="number"
                  min={minimumAllowedLicenses}
                  value={licenseQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || minimumAllowedLicenses;
                    // Enforce minimum based on current licenses
                    setLicenseQuantity(Math.max(value, minimumAllowedLicenses));
                  }}
                />
                <Form.Text className="text-muted">
                  {currentLicenses === 0 ? (
                    <>Minimum: 2 licenses required for first purchase</>
                  ) : (
                    <>Suggested minimum: {suggestedMinimum} license{suggestedMinimum !== 1 ? 's' : ''}</>
                  )}
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Billing Period</Form.Label>
                <Form.Select
                  value={billingPeriod || 'MONTHLY'}
                  onChange={(e) => setBillingPeriod(e.target.value)}
                  disabled={hasActiveSubscription}
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly (Save {calculateSavings()}%)</option>
                </Form.Select>
                {hasActiveSubscription && (
                  <Form.Text className="text-muted">
                    Adding to existing {currentBillingPeriod.toLowerCase()} subscription
                    {nextBillingDate && (
                      <span> (Next billing: {new Date(nextBillingDate).toLocaleDateString()})</span>
                    )}
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Card className="border-primary mb-3">
            <Card.Body>
              <Row>
                <Col>
                  <div className="text-center">
                    <h5 className="text-primary mb-1">
                      <FontAwesomeIcon icon={faDollarSign} />{calculatePrice()}
                    </h5>
                    <small className="text-muted">
                      Total Cost ({(billingPeriod || 'MONTHLY').toLowerCase()})
                    </small>
                  </div>
                </Col>
                <Col>
                  <div className="text-center">
                    <h5 className="mb-1">
                      {licenseQuantity} License{licenseQuantity !== 1 ? 's' : ''}
                    </h5>
                    <small className="text-muted">
                      ${(billingPeriod || 'MONTHLY') === 'MONTHLY' ? '2.98' : '32.00'}/user/{(billingPeriod || 'MONTHLY').toLowerCase().slice(0, -2)}
                    </small>
                  </div>
                </Col>
              </Row>
              {(billingPeriod || 'MONTHLY') === 'YEARLY' && (
                <div className="text-center mt-2">
                  <small className="text-success">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                    Save {calculateSavings()}% with yearly billing
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handlePurchase}
          disabled={loading || licenseQuantity < minimumAllowedLicenses}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faCreditCard} className="me-2" />
              Proceed to Payment
            </>
          )}
        </Button>
      </Modal.Footer>
    </>
  );

  const renderPaymentStep = () => (
    <>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faCreditCard} className="me-2 text-primary" />
          Complete Payment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="mb-4 p-3 bg-light rounded">
          <div className="d-flex justify-content-between">
            <span>{licenseQuantity} License{licenseQuantity !== 1 ? 's' : ''}</span>
            <strong>${calculatePrice()}</strong>
          </div>
          <small className="text-muted">
            {(billingPeriod || 'MONTHLY') === 'MONTHLY' ? 'Monthly' : 'Yearly'} billing
          </small>
        </div>

        {stripePromise && clientSecret && (
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: { theme: 'stripe' }
            }}
          >
            <PaymentForm
              clientSecret={clientSecret}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              organizationId={organization?.id}
            />
          </Elements>
        )}
      </Modal.Body>
    </>
  );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      {step === 'selection' ? renderSelectionStep() : renderPaymentStep()}
    </Modal>
  );
};

export default LicensePurchaseModal;