import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Image, Form, Row, Col, ListGroup, Alert } from 'react-bootstrap';
import { Auth, Storage } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUserCircle, 
  faFolder, 
  faShare, 
  faCommentAlt, 
  faList, 
  faSignOutAlt, 
  faMinusCircle,
  faCamera,
  faChevronDown,
  faChevronUp,
  faUserShield,
  faBug
} from '@fortawesome/free-solid-svg-icons';
import { useUser } from '../../contexts/UserContext';
import Resources from '../shared/Resources';
import FeedbackModal from '../shared/FeedbackModal';
import { useAdmin } from '../../contexts/AdminContext';
import { compressImage } from '../../utils/imageUtils';
import { updateUserProfileImage } from '../../utils/userSync';

const Profile = () => {
  const navigate = useNavigate();
  const { user, avatarUrl, updateUserAvatar, fetchUser, dbUser } = useUser();
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const { isSuperAdmin } = useAdmin();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setFormData({
        firstName: user.attributes['custom:first_name'] || '',
        lastName: user.attributes['custom:last_name'] || '',
        email: user.attributes.email || ''
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    }
  };

  const handleSignOut = async () => {
    try {
      await updateUserAvatar(null);
      await Auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleFileInput = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      // Profile images need higher quality for good display - use 0.5 quality instead of default 0.2
      const compressedFile = await compressImage(file, { quality: 0.5, maxWidth: 800, maxHeight: 800 });
      
      // Use the centralized function that updates both Cognito and our database
      const newAvatarUrl = await updateUserProfileImage(compressedFile);
      
      // Refresh avatar in context
      await updateUserAvatar();
      
      // Also refresh the entire user data to ensure consistency
      await fetchUser();
    } catch (error) {
      console.error('Error uploading file:', error);
    }
    setUploading(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmInput.toLowerCase() !== 'confirm') {
      setError('Please type "confirm" to delete your account.');
      return;
    }
  
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.deleteUser(user);
      await handleSignOut();
    } catch (error) {
      console.error('Error deleting user account:', error);
      setError('Failed to delete account. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, {
        'custom:first_name': formData.firstName,
        'custom:last_name': formData.lastName,
        email: formData.email,
      });
      
      // Refresh user data in context - this will also sync with our database
      await fetchUser();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container className="py-4 pt-5">
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    roundedCircle
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div 
                    className="bg-secondary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '120px', height: '120px' }}
                  >
                    <FontAwesomeIcon icon={faUserCircle} size="4x" color="white" />
                  </div>
                )}
                <div className="position-absolute bottom-0 start-0">
                  <label 
                    className={`btn ${uploading ? 'btn-secondary' : 'btn-primary'} upload-btn`} 
                    style={{
                      width: '35px',
                      height: '35px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: uploading ? '0.7' : '1',
                      cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {uploading ? (
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      <FontAwesomeIcon icon={faCamera} style={{ fontSize: '1rem' }} />
                    )}
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileInput}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              <h4 className="mb-0">
                {user && `${user.attributes['custom:first_name']} ${user.attributes['custom:last_name']}`}
              </h4>
              <p className="text-muted mb-0">{user?.attributes?.email}</p>
            </Card.Body>
          </Card>

          <Card>
            <ListGroup variant="flush">
              <ListGroup.Item 
                action 
                onClick={() => setShowResources(!showResources)}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <FontAwesomeIcon icon={faFolder} className="me-2" /> Additional Resources
                </div>
                <FontAwesomeIcon icon={showResources ? faChevronUp : faChevronDown} />
              </ListGroup.Item>
              {isSuperAdmin && (
                <ListGroup.Item action onClick={() => navigate('/super-admin')}>
                  <FontAwesomeIcon icon={faUserShield} className="me-2" /> Super Admin Console
                </ListGroup.Item>
              )}
              <ListGroup.Item action onClick={() => setShowFeedbackModal(true)}>
                <FontAwesomeIcon icon={faCommentAlt} className="me-2" /> Feedback
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => navigate('/issue-reporting')}>
                <FontAwesomeIcon icon={faBug} className="me-2" /> Report Issues (Bugs)
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => navigate('/tools')}>
                <FontAwesomeIcon icon={faList} className="me-2" /> View All Reports
              </ListGroup.Item>
              <ListGroup.Item action onClick={handleSignOut}>
                <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Sign Out
              </ListGroup.Item>
              <ListGroup.Item action onClick={() => setShowDeleteDialog(true)}>
                <FontAwesomeIcon icon={faMinusCircle} className="me-2" /> Delete Account
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>

        <Col md={8}>
          {showResources ? (
            <Card className="mb-4">
              <Card.Body>
                <Resources />
              </Card.Body>
            </Card>
          ) : (
            <>
              <Card className="mb-4">
                <Card.Body>
                  <Card.Title className="mb-4">Edit Profile</Card.Title>
                  
                  {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                      {error}
                    </Alert>
                  )}
                  
                  {showSuccess && (
                    <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible>
                      Profile updated successfully!
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                      />
                      <Form.Text className="text-muted">
                        Email cannot be changed
                      </Form.Text>
                    </Form.Group>

                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Save Changes'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>

              {showDeleteDialog && (
                <Card className="mb-4">
                  <Card.Body>
                    <Card.Title>Delete Account</Card.Title>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <p>
                      Please enter the word "confirm" and click "Delete" to permanently delete your account. 
                      Please note that by doing so, all data you have created within this app will be deleted.
                    </p>
                    <Form.Group className="mb-3">
                      <Form.Control
                        type="text"
                        placeholder="Type 'confirm' here"
                        value={confirmInput}
                        onChange={(e) => setConfirmInput(e.target.value)}
                      />
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Button variant="danger" onClick={handleDeleteAccount}>
                        Delete
                      </Button>
                      <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              <Card>
                <Card.Body>
                  <Card.Title>Contact Information</Card.Title>
                  <p className="mb-2">
                    If you have any difficulties, contact us at:
                  </p>
                  <p className="mb-2" style={{ fontSize: '1.2rem' }}>
                    <strong>hello@vibestack.example</strong>
                  </p>
                  <hr />
                  <p className="text-center mb-2">
                    <a 
                      href="https://www.abhishekpaul.dev/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      {'< Developer Website / >'}
                    </a>
                  </p>
                  <p className="text-center text-muted small mb-0">
                    VibeStack™ PRO Version: 1.0.0
                  </p>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>

      <FeedbackModal 
        show={showFeedbackModal}
        onHide={() => setShowFeedbackModal(false)}
      />

      {isSuperAdmin && (
        <div className="alert alert-info mt-4">
          You have Super Administrator privileges. Access the <a href="#" onClick={(e) => { e.preventDefault(); navigate('/super-admin'); }}>Super Admin Console</a> to manage system-wide settings.
        </div>
      )}
    </Container>
  );
};

export default Profile; 