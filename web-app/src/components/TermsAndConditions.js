import React, { useState, useEffect } from 'react';
import { Modal, Button, Container, Row, Col, Card, Form, Spinner } from 'react-bootstrap';
import { Auth, API, graphqlOperation } from 'aws-amplify';
import { useUser } from '../contexts/UserContext';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

const TermsAndConditions = ({ onAccept, onClose, requireCheckbox = false, viewOnly = false }) => {
  const [show, setShow] = useState(true);
  const [organizationType, setOrganizationType] = useState('VibeStack'); // or 'leadershipFITT'
  const [accepted, setAccepted] = useState(!requireCheckbox); // Auto-accept if checkbox not required
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchUser, updateTermsAccepted } = useUser();

  const handleAccept = async () => {
    try {
      setIsSubmitting(true);
      console.log('Starting terms acceptance process...');
      
      // Get the current authenticated user
      const cognitoUser = await Auth.currentAuthenticatedUser();
      console.log('Cognito user:', cognitoUser.attributes.sub);
      
      // Find the user in our database
      const userResult = await API.graphql(graphqlOperation(
        queries.listUsers, {
          filter: {
            cognitoID: { eq: cognitoUser.attributes.sub }
          }
        }
      ));
      
      console.log('User query result:', userResult.data.listUsers.items);
      
      const userItems = userResult.data.listUsers.items;
      const user = userItems.find(u => !u._deleted);
      
      if (user) {
        console.log('Found user, updating terms acceptance:', user.id);
        
        // Update user to mark terms as accepted
        const updateResult = await API.graphql(graphqlOperation(
          mutations.updateUser, {
            input: {
              id: user.id,
              termsAccepted: true,
              termsAcceptedDate: new Date().toISOString(),
              _version: user._version
            }
          }
        ));
        
        console.log('Update result:', updateResult);
        
        // Directly update the context to reflect the change immediately
        updateTermsAccepted(true);
        console.log('Terms accepted status updated in context');
        
        // Also refresh from database to ensure consistency
        await fetchUser();
        console.log('User data refreshed');
        
        // Close modal and notify parent
        setShow(false);
        if (onAccept) onAccept();
      } else {
        console.error('No user found in database for cognitoID:', cognitoUser.attributes.sub);
      }
    } catch (error) {
      console.error('Error accepting terms:', error);
      alert('Failed to accept terms. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  const toggleType = () => {
    setOrganizationType(prev => prev === 'VibeStack' ? 'leadershipFITT' : 'VibeStack');
  };

  const VibeStackTerms = () => (
    <>
      <h2 className="text-center mb-4">🚀 VibeStack™ Pro – Smarter, Faster, Collaborative Improvement</h2>
      
      <p className="mb-4">
        VibeStack™ Pro is your modern hub for smarter, faster, and more collaborative process improvement. 
        Whether you're on the frontlines or leading change, this platform delivers AI-powered insights, 
        intuitive Lean and continuous improvement tools, and gamified progress tracking—making improvement 
        part of how your team works, grows, and wins.
      </p>
      
      <p className="mb-4">
        Built for today's workforce, VibeStack™ Pro tackles burnout, disengagement, and slow adoption while 
        empowering every team member to learn, contribute, and thrive. With LF Mentor AI, your team's actions, 
        insights, and outcomes are securely saved and referenced, turning hard-earned lessons into shared 
        organizational knowledge that accelerates progress.
      </p>
      
      <p className="mb-4">
        VibeStack™ Pro reduces waste, fixes broken workflows, and builds a culture where improvement is 
        fun, measurable, and collaborative.
      </p>

      <h5 className="mt-4">🎯 Key Features:</h5>
      <ul>
        <li><strong>AI Coaching & Knowledge Memory:</strong> Personalized guidance that retains organizational insights across teams.</li>
        <li><strong>Gamification & Leaderboards:</strong> Earn Coins, unlock Achievements, climb the Leaderboard, and celebrate wins.</li>
        <li><strong>21 Smart Lean Tools:</strong> High-impact modules covering 5S, DMAIC, A3 Projects, Kaizen, Fishbone, Pareto, and more.</li>
        <li><strong>Interactive Learning Modules & Quizzes:</strong> Real-world scenarios to develop skills anytime, anywhere.</li>
        <li><strong>Dynamic Reports & Savings Tracking:</strong> Visualize ROI, share standardized PDFs, and monitor team performance.</li>
        <li><strong>Kanban Action Board & Feedback Loops:</strong> Track tasks, build transparency, and foster accountability.</li>
        <li><strong>Cross-Device Access & Admin Controls:</strong> Manage users, content, and insights from desktop, tablet, or mobile.</li>
      </ul>

      <h5 className="mt-4">🌟 The FITTWorks™ Ecosystem</h5>
      <div className="mb-3">
        <p className="mb-2"><strong>→ VibeStack™ Pro – Smarter Process Improvement Tools</strong> (VibeStack.com)</p>
        <p className="ms-3 text-muted">Optimize processes, retain knowledge, and improve workflow with AI-powered insights.</p>
        
        <p className="mb-2 mt-3"><strong>→ LeadershipFITT™ – On-Demand AI Coaching and Feedback Engine</strong> (leadershipfitt.com)</p>
        <p className="ms-3 text-muted">Develop people, build trust, and empower teams with real-time AI coaching.</p>
      </div>

      <div className="alert alert-info">
        <strong>🎁 Special Offer:</strong> Unlock the full FITTWorks™ Ecosystem—Invest in 10+ seats of VibeStack™ Pro or 
        LeadershipFITT™, and we'll match with free seats on the other platform—harmony of people and process 
        in the FITTWorks™ ecosystem.
      </div>
      
      <h5 className="mt-4">🔒 Your Privacy Matters</h5>
      <ul>
        <li>Your progress and data are confidential — only you can see your data unless you choose to share it.</li>
        <li>Admins can view Projects, Reports, etc. but not your AI threads.</li>
        <li>All content is for development purposes only — not for evaluations or HR decisions.</li>
      </ul>
      
      <h5 className="mt-4">✅ By continuing, you agree to:</h5>
      <ul>
        <li>Participate honestly and actively in the improvement process.</li>
        <li>Use the tools, feedback, and insights for your learning and team's success.</li>
        <li>Respect the confidentiality and intellectual property of the platform.</li>
      </ul>
    </>
  );
  
  const LeadershipFITTTerms = () => (
    <>
      <h2 className="text-center mb-4">🚀 Welcome to LeadershipFITT™ AI Pro 360</h2>
      <p className="mb-4">Your 360 feedback experience is built to support your personal leadership growth across 14 core areas.</p>
      <p className="fw-bold">Before you begin, here's what you need to know:</p>
      
      <h5 className="mt-4">🔒 Your Privacy Matters</h5>
      <ul>
        <li>Your report is confidential — only you can see it unless you choose to share it.</li>
        <li>Anonymous feedback protects all raters. Comments are only shown when enough feedback is collected.</li>
        <li>Your results are for development only — not for performance reviews or HR decisions.</li>
      </ul>
      
      <h5 className="mt-4">🧑‍💼 What Your Organization Sees</h5>
      <ul>
        <li>Admins can view participation progress and group-level trends (no individual feedback).</li>
        <li>They cannot see your report unless you give explicit permission.</li>
      </ul>
      
      <h5 className="mt-4">✅ By continuing, you agree to:</h5>
      <ul>
        <li>Give honest, respectful feedback if you're rating others.</li>
        <li>Use the feedback you receive for your own learning and growth.</li>
      </ul>
      
      <h5 className="mt-4">💡 You're in control of your data and how you use it.</h5>
    </>
  );

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      backdrop="static" 
      keyboard={false}
      size="lg"
      centered
    >
      <Modal.Header>
        <Modal.Title>Terms and Conditions</Modal.Title>
        <Button 
          variant="link" 
          onClick={toggleType} 
          className="ms-auto me-2"
          disabled={isSubmitting}
        >
          Switch to {organizationType === 'VibeStack' ? 'LeadershipFITT™' : 'VibeStack™'} Terms
        </Button>
      </Modal.Header>
      
      <Modal.Body>
        <Container>
          <Row>
            <Col>
              <Card className="p-4">
                {organizationType === 'VibeStack' ? <VibeStackTerms /> : <LeadershipFITTTerms />}
                
                {requireCheckbox && (
                  <Form.Check 
                    type="checkbox" 
                    id="terms-checkbox" 
                    label="I have read and agree to the terms and conditions" 
                    className="mt-4 mb-3"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    disabled={isSubmitting}
                  />
                )}
                {!requireCheckbox && !viewOnly && (
                  <div className="mt-4 mb-3 text-center">
                    <small className="text-muted">
                      Click "Accept" below to continue using VibeStack™ Pro
                    </small>
                  </div>
                )}
                {viewOnly && (
                  <div className="mt-4 mb-3 text-center">
                    <small className="text-muted">
                      Review the terms and conditions above
                    </small>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Container>
      </Modal.Body>
      
      <Modal.Footer>
        {viewOnly ? (
          <Button 
            variant="secondary" 
            onClick={handleClose}
            className="w-100"
          >
            Close
          </Button>
        ) : (
          <Button 
            variant="primary" 
            onClick={handleAccept}
            disabled={!accepted || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Accepting...
              </>
            ) : 'Accept'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default TermsAndConditions; 