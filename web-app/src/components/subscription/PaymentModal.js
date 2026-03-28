import React, { useState, useEffect } from 'react';
import { Modal, Alert, Button, Spinner } from 'react-bootstrap';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API } from 'aws-amplify';
import { useOrganization } from '../../contexts/OrganizationContext';

const CheckoutForm = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { activeOrganization } = useOrganization();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Stripe or Elements not initialized');
      setErrorMessage('Payment system not initialized properly');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      console.log('Starting payment confirmation...');
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/organization-management',
        },
        redirect: 'if_required'
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        setErrorMessage(error.message || 'An error occurred while processing your payment');
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('An unexpected error occurred.');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        
        // Sync payment status to ensure organization status is updated
        if (activeOrganization?.id) {
          try {
            console.log('Syncing payment status...');
            const syncResult = await API.graphql({
              query: `
                mutation SyncPaymentStatus($organizationId: ID!) {
                  syncPaymentStatus(organizationId: $organizationId) {
                    success
                    organizationId
                    message
                    error
                  }
                }
              `,
              variables: {
                organizationId: activeOrganization.id
              }
            });
            
            if (syncResult.data.syncPaymentStatus.success) {
              console.log('Payment status synced successfully:', syncResult.data.syncPaymentStatus.message);
            } else {
              console.error('Payment sync failed:', syncResult.data.syncPaymentStatus.error);
            }
          } catch (syncError) {
            console.error('Error syncing payment status:', syncError);
          }
        }
        
        onSuccess();
        setTimeout(() => {
          window.location.reload();
        }, 1500); // Give sync time to complete
      } else {
        console.log('Payment status:', paymentIntent?.status);
        setErrorMessage('Payment status unclear. Please check your transaction history.');
      }
    } catch (err) {
      console.error('Payment processing error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred');
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

const PaymentModal = ({ show, onHide, clientSecret, stripePromise }) => {
  const [initError, setInitError] = useState('');

  useEffect(() => {
    if (show) {
      // Validate required props when modal is shown
      if (!clientSecret) {
        console.error('Missing client secret');
        setInitError('Payment initialization failed: Missing client secret');
      }
      if (!stripePromise) {
        console.error('Missing Stripe promise');
        setInitError('Payment initialization failed: Payment system not initialized');
      }
    }
  }, [show, clientSecret, stripePromise]);

  if (!clientSecret || !stripePromise) {
    return (
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title>Payment Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            {initError || 'Unable to initialize payment system. Please try again later.'}
          </Alert>
        </Modal.Body>
      </Modal>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      }
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

export default PaymentModal; 