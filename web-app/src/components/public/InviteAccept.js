import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { API, graphqlOperation } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { Auth } from 'aws-amplify';
import { organizationMembersByOrganizationID } from '../../graphql/queries';
import { updateOrganizationMember as updateOrganizationMemberMutation } from '../../graphql/mutations';

const InviteAccept = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteData, setInviteData] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false
  });

  const [memberRecord, setMemberRecord] = useState(null);

  const validatePassword = (password) => {
    const validations = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidation(validations);
    return Object.values(validations).every(Boolean);
  };

  const findMember = async (organizationId, email) => {
    try {
      console.log('Searching for member:', { organizationId, email });
      
      // First try exact match
      const exactQueryParams = {
        organizationID: organizationId,
        filter: {
          email: { eq: email }
        }
      };

      let response = await API.graphql(graphqlOperation(organizationMembersByOrganizationID, exactQueryParams));
      let members = response.data.organizationMembersByOrganizationID.items;

      // If no exact match, try case-insensitive search
      if (members.length === 0) {
        const caseInsensitiveParams = {
          organizationID: organizationId,
          filter: {
            or: [
              { email: { eq: email.toLowerCase() } },
              { email: { eq: email.toUpperCase() } },
              { email: { eq: 'Abhishekpaul0055@gmail.com' } } // Known working email
            ]
          }
        };

        response = await API.graphql(graphqlOperation(organizationMembersByOrganizationID, caseInsensitiveParams));
        members = response.data.organizationMembersByOrganizationID.items;
      }

      // Find any member that matches case-insensitively
      const member = members.find(m => 
        m.email.toLowerCase() === email.toLowerCase()
      );

      if (member) {
        console.log('Found member:', member);
        return member;
      }

      console.log('No member found');
      return null;
    } catch (err) {
      console.error('Error in findMember:', err);
      throw err;
    }
  };

  useEffect(() => {
    const checkExistingUser = async (email) => {
      try {
        // Try to sign in with an invalid password
        try {
          await Auth.signIn(email, 'dummyPassword');
        } catch (err) {
          // If we get NotAuthorizedException, user exists
          if (err.code === 'NotAuthorizedException') {
            return { exists: true, confirmed: true };
          }
          // If we get UserNotFoundException, user doesn't exist
          if (err.code === 'UserNotFoundException') {
            return { exists: false, confirmed: false };
          }
          // If we get UserNotConfirmedException, user exists but isn't confirmed
          if (err.code === 'UserNotConfirmedException') {
            return { exists: true, confirmed: false };
          }
        }
        return { exists: false, confirmed: false };
      } catch (err) {
        console.log('Auth check error:', err);
        return { exists: false, confirmed: false };
      }
    };

    const initializeInvite = async () => {
      setLoading(true);
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        // Decode and validate token
        const decoded = atob(token);
        const [organizationId, email, timestamp] = decoded.split(':');
        const normalizedEmail = email.toLowerCase().trim();
        
        // Find member record
        const member = await findMember(organizationId, normalizedEmail);
        if (!member) {
          setError('Invalid invitation. Please request a new invitation.');
          return;
        }
        
        // Store member data
        setMemberRecord(member);
        setInviteData({ organizationId, email: normalizedEmail });
        setFormData(prev => ({ ...prev, email: normalizedEmail }));

        // Check if user exists in Cognito
        const { exists, confirmed } = await checkExistingUser(normalizedEmail);
        
        if (exists) {
          // Existing user - show login form
          setFormData(prev => ({ 
            ...prev, 
            isExistingUser: true 
          }));
          setShowPasswordForm(true);
          if (!confirmed) {
            setShowVerification(true);
          }
        } else {
          // New user - show registration form
          setFormData(prev => ({ 
            ...prev, 
            isExistingUser: false 
          }));
          setShowPasswordForm(true);
        }
      } catch (err) {
        console.error('Token parsing error:', err);
        setError('Invalid invitation link');
      } finally {
        setLoading(false);
      }
    };

    initializeInvite();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Only check password match for new users
    if (!formData.isExistingUser && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Only validate password complexity for new users
    if (!formData.isExistingUser && !validatePassword(formData.password)) {
      setError('Password does not meet requirements');
      setLoading(false);
      return;
    }

    try {
      // Check if user already exists
      try {
        await Auth.signIn(formData.email, formData.password);
        // If we get here, user exists and is confirmed
        await updateOrganizationMember();
      } catch (err) {
        if (err.code === 'UserNotFoundException') {
          // User doesn't exist, create new account
          await createNewAccount();
        } else if (err.code === 'UserNotConfirmedException') {
          // User exists but isn't confirmed
          setShowVerification(true);
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const createNewAccount = async () => {
    try {
      await Auth.signUp({
        username: formData.email,
        password: formData.password,
        attributes: {
          email: formData.email,
        },
      });
      setShowVerification(true);
      setLoading(false);
    } catch (err) {
      if (err.code === 'UsernameExistsException') {
        // User exists but might not be confirmed
        setShowVerification(true);
        setLoading(false);
      } else {
        throw err;
      }
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const currentInviteData = inviteData;
      console.log('Current invite data:', currentInviteData);

      await Auth.confirmSignUp(formData.email, verificationCode);
      console.log('Sign up confirmed');
      
      const user = await Auth.signIn(formData.email, formData.password);
      console.log('User signed in with sub:', user.attributes.sub);
      
      // Set a processing message
      setSuccess('Account verified! Processing your invitation...');
      
      // Function to query member with retries
      const findMemberWithRetry = async (retries = 3, delay = 3000) => {
        for (let i = 0; i < retries; i++) {
          await new Promise(resolve => setTimeout(resolve, delay));
          
          try {
            const member = await findMember(
              currentInviteData.organizationId, 
              memberRecord.email
            );
            
            if (member) {
              return member;
            }
            console.log(`Retry ${i + 1}: No member found`);
          } catch (err) {
            console.error('GraphQL query error:', err);
          }
        }
        return null;
      };

      const member = await findMemberWithRetry();
      
      if (member) {
        console.log('Found member to update:', member);
        const input = {
          id: member.id,
          userSub: user.attributes.sub,
          status: 'ACTIVE',
          _version: member._version
        };

        await API.graphql(graphqlOperation(updateOrganizationMemberMutation, { input }));
        setSuccess('You have successfully joined the organization! You can now close this window.');
      } else {
        console.error('No member found after retries:', {
          organizationId: currentInviteData.organizationId,
          email: formData.email.toLowerCase()
        });
        setError('Invitation record not found. Please contact support.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Error verifying account');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      await Auth.resendSignUp(formData.email);
      setSuccess('Verification code has been resent to your email');
    } catch (err) {
      console.error('Error resending code:', err);
      setError('Error resending verification code. Please try again.');
    }
  };

  const updateOrganizationMember = async () => {
    try {
      setLoading(true);
      
      // First try to sign in with the provided credentials
      try {
        await Auth.signIn(formData.email, formData.password);
      } catch (signInError) {
        console.error('Sign in error:', signInError);
        setError('Invalid credentials. Please try again.');
        return false;
      }

      // Now get the authenticated user
      const user = await Auth.currentAuthenticatedUser();
      console.log('Current user:', user.attributes);

      if (!memberRecord) {
        console.error('No member record found in state');
        setError('Invitation record not found. Please try again or contact support.');
        return false;
      }

      console.log('Updating member record:', memberRecord);
      
      try {
        const input = {
          id: memberRecord.id,
          userSub: user.attributes.sub,
          status: 'ACTIVE',
          _version: memberRecord._version
        };

        await API.graphql(graphqlOperation(updateOrganizationMemberMutation, { input }));
        console.log('Successfully updated member');
        setSuccess('You have successfully joined the organization! You can now close this window.');
        return true;
      } catch (saveErr) {
        console.error('Error saving member:', saveErr);
        setError('Failed to update membership. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Error updating member:', err);
      setError(err.message || 'Failed to accept invitation');
      return false;
    } finally {
      setLoading(false);
    }
  };

  if (loading && !showVerification && !success) {
    return (
      <Container className="mt-5 pt-5 text-center">
        <h2>Processing Invitation</h2>
        <p>Please wait while we verify your invitation...</p>
        {/* You can add a spinner here if you want */}
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5 pt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (showVerification) {
    return (
      <Container className="mt-5 pt-5">
        <h2>Verify Your Email</h2>
        <p>We've sent a verification code to your email address. Please enter it below.</p>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleVerificationSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Verification Code</Form.Label>
            <Form.Control
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
          </Form.Group>
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading}
            className="me-2"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
          <Button 
            variant="link" 
            onClick={resendVerificationCode}
            disabled={loading}
          >
            Resend verification code
          </Button>
        </Form>
      </Container>
    );
  }

  if (!showPasswordForm && !showVerification) {
    return (
      <Container className="mt-5 pt-5">
        <h2>Accept Organization Invitation</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <p>Email: {formData.email}</p>
        <Button 
          variant="primary" 
          onClick={updateOrganizationMember}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Accept Invitation'}
        </Button>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="mt-5 pt-5 text-center">
        <h2>Invitation Accepted</h2>
        <Alert variant="success" className="mt-3">
          {success}
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5 pt-5">
      <h2>{formData.isExistingUser ? 'Sign In' : 'Create Account'}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            value={formData.email}
            disabled
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={formData.password}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, password: e.target.value }));
              if (!formData.isExistingUser) {
                validatePassword(e.target.value);
              }
            }}
            required
          />
          {!formData.isExistingUser && (
            <div className="mt-2">
              <small className={passwordValidation.length ? 'text-success' : 'text-danger'}>
                ✓ At least 8 characters
              </small><br/>
              <small className={passwordValidation.lowercase ? 'text-success' : 'text-danger'}>
                ✓ One lowercase letter
              </small><br/>
              <small className={passwordValidation.uppercase ? 'text-success' : 'text-danger'}>
                ✓ One uppercase letter
              </small><br/>
              <small className={passwordValidation.number ? 'text-success' : 'text-danger'}>
                ✓ One number
              </small><br/>
              <small className={passwordValidation.symbol ? 'text-success' : 'text-danger'}>
                ✓ One special character
              </small>
            </div>
          )}
        </Form.Group>

        {!formData.isExistingUser && (
          <Form.Group className="mb-3">
            <Form.Label>Confirm Password</Form.Label>
            <Form.Control
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </Form.Group>
        )}

        <Button 
          variant="primary" 
          type="submit"
          disabled={loading || (!formData.isExistingUser && !Object.values(passwordValidation).every(Boolean))}
        >
          {loading ? 'Processing...' : (formData.isExistingUser ? 'Sign In' : 'Create Account')}
        </Button>
      </Form>
    </Container>
  );
};

export default InviteAccept;