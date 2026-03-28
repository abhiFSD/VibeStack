import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { Auth, API } from 'aws-amplify';
import * as mutations from '../../graphql/mutations';
import { useOrganization } from '../../contexts/OrganizationContext';
import { addAward } from '../../utils/awards';
import { sendEmailNotification } from '../../utils/emailNotifications';

const FeedbackModal = ({ show, onHide }) => {
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { activeOrganization } = useOrganization();



  const handleSendFeedback = async () => {
    if (!content.trim()) {
      setError('Please enter your feedback before sending');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const user = await Auth.currentAuthenticatedUser();
      const email = user.attributes.email;



      // Send feedback email using CUSTOM_NOTIFICATION template
      await sendEmailNotification({
        type: 'CUSTOM_NOTIFICATION',
        to: ['hello@vibestack.example', email],
        data: {
          subject: 'New User Feedback Received',
          title: 'New Feedback Received',
          message: `
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p><strong>Feedback from:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <p style="margin-top: 10px;">${content}</p>
            </div>
          `,
          actionURL: `${window.location.origin}/feedback-management`,
          actionText: 'View All Feedback'
        },
        organizationID: activeOrganization.id
      });

      // Save feedback to database
      await API.graphql({
        query: mutations.createFeedback,
        variables: {
          input: {
            content: content,
            user_sub: user.attributes.sub,
            ratting: "1", // Using ratting instead of rating to match schema
          }
        }
      });

      // Grant feedback award
      if (activeOrganization?.id) {
        await addAward('FEEDBACK_PROVIDED', activeOrganization.id);
      }
      
      setSuccess(true);
      setContent('');
      
      // Close modal after delay
      setTimeout(() => {
        onHide();
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending feedback:', error);
      setError('Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Feedback</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {success ? (
          <Alert variant="success">
            Thank you for your valuable feedback!
          </Alert>
        ) : (
          <Form>
            <Form.Group className="mb-3">
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Enter your feedback here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </Form.Group>

          </Form>
        )}
      </Modal.Body>
      {!success && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSendFeedback}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Feedback'}
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default FeedbackModal; 