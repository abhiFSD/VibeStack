import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import { Container, Form, Button, Alert } from 'react-bootstrap';

const DeleteAccount = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      "WARNING: This will permanently delete your account and all associated data across all LF 21 applications. This action cannot be undone. Are you sure you want to proceed?"
    );

    if (!isConfirmed) {
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // First, sign in the user with their credentials
      const user = await Auth.signIn(email, password);
      
      if (user) {
        // Delete the user's account
        const currentUser = await Auth.currentAuthenticatedUser();
        await currentUser.deleteUser((error, result) => {
          if (error) {
            setError('Failed to delete account. Please try again.');
            console.error('Error deleting user:', error);
          } else {
            setMessage('Account successfully deleted.');
            setEmail('');
            setPassword('');
            // Sign out after successful deletion
            Auth.signOut();
          }
        });
      }
    } catch (err) {
      console.error('Error:', err);
      if (err.code === 'UserNotFoundException') {
        setError('No account found with this email address.');
      } else if (err.code === 'NotAuthorizedException') {
        setError('Incorrect email or password.');
      } else {
        setError('An error occurred while processing your request. Please try again later.');
      }
    }
    
    setLoading(false);
  };

  return (
    <Container className="mt-5 pt-5">
      <h2 className="text-danger">Delete Account & Data</h2>
      <div className="alert alert-warning">
        <h4 className="alert-heading">⚠️ Important Information</h4>
        <p>By deleting your account:</p>
        <ul>
          <li>Your account will be permanently deleted from all LF 21 applications</li>
          <li>All your data, progress, and history will be permanently erased</li>
          <li>This action cannot be reversed</li>
          <li>You will need to create a new account if you wish to use our services again</li>
        </ul>
        <hr />
        <p className="mb-0">Please ensure you want to proceed before entering your credentials.</p>
      </div>
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Email address</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </Form.Group>

        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        <Button 
          variant="danger" 
          type="submit" 
          disabled={loading}
          className="mt-3"
        >
          {loading ? 'Processing...' : 'Permanently Delete Account'}
        </Button>
      </Form>

      <div className="mt-4 text-muted">
        <small>
          Need help? Contact our support team at support@lf21.com
        </small>
      </div>
    </Container>
  );
};

export default DeleteAccount; 