import React, { useEffect, useState } from 'react';
import { Container, Card, Alert, Button, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth, API } from 'aws-amplify';
import * as mutations from '../../graphql/mutations';

const InviteVerification = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    verifyInvite();
  }, []);

  const verifyInvite = async () => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');

      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      // Decode the base64 token
      const decodedToken = atob(token);
      const [organizationId, email, timestamp] = decodedToken.split(':');

      // Check if the invite has expired (24 hours)
      const inviteTime = parseInt(timestamp);
      if (Date.now() > inviteTime) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      setInviteData({ organizationId, email });
      setLoading(false);
    } catch (error) {
      console.error('Error verifying invite:', error);
      setError('Invalid invitation link');
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Store invite data in session storage and redirect to signup
    if (inviteData) {
      sessionStorage.setItem('inviteData', JSON.stringify(inviteData));
      navigate('/signup');
    }
  };

  const handleSignIn = () => {
    // Store invite data in session storage and redirect to login
    if (inviteData) {
      sessionStorage.setItem('inviteData', JSON.stringify(inviteData));
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-center">
        <Card className="shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <h4>Organization Invitation</h4>
            </div>

            {error ? (
              <Alert variant="danger">{error}</Alert>
            ) : (
              <>
                <p className="text-center mb-4">
                  You've been invited to join an organization on VibeStack.
                  {inviteData && <><br /><strong>Email: {inviteData.email}</strong></>}
                </p>

                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={handleSignUp}>
                    Create New Account
                  </Button>
                  <Button variant="outline-primary" onClick={handleSignIn}>
                    Sign In to Existing Account
                  </Button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default InviteVerification; 