import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import { Auth, API } from 'aws-amplify';
import { 
  CognitoIdentityProviderClient, 
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";
import awsmobile from '../../aws-exports';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loadingAction, setLoadingAction] = useState({ userId: null, action: null });
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      // Use the Lambda function to list users
      const response = await API.get('apifetchdata', '/handleUserManagement', {
        headers: {
          Authorization: token  // Send just the token, not "Bearer" prefix
        },
        queryStringParameters: {
          action: 'listUsers'
        }
      });
      
      const { Users } = response;
      
      // Get groups for each user
      const usersWithGroups = await Promise.all(
        Users.map(async (user) => {
          const groups = await getUserGroups(user.Username);
          return {
            ...user,
            groups: groups
          };
        })
      );
      
      setUsers(usersWithGroups);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.data?.debug) {
        console.log('Debug info from Lambda:', err.response.data.debug);
      }
      setError('Failed to fetch users. Please ensure you have Super Admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const getUserGroups = async (username) => {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      // Use the Lambda function to get user groups
      const response = await API.get('apifetchdata', '/handleUserManagement', {
        headers: {
          Authorization: token  // Send just the token, not "Bearer" prefix
        },
        queryStringParameters: {
          action: 'userGroups',
          username: username
        }
      });
      
      return response.Groups ? response.Groups.map(g => g.GroupName) : [];
    } catch (err) {
      console.error('Error getting user groups:', err);
      return [];
    }
  };

  const handleCreateUser = async () => {
    try {
      if (newUser.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      
      // Use the Lambda function to create user
      await API.post('apifetchdata', '/handleUserManagement', {
        headers: {
          Authorization: token  // Send just the token, not "Bearer" prefix
        },
        body: {
          action: 'createUser',
          userData: {
            email: newUser.email,
            password: newUser.password,
            firstName: newUser.name.split(' ')[0] || newUser.name,
            lastName: newUser.name.split(' ').slice(1).join(' ') || '',
            isSuperAdmin: false
          }
        }
      });

      setOpenDialog(false);
      fetchUsers();
      setNewUser({ email: '', password: '', name: '' });
      setError(null);
      setSuccessMessage('User created successfully. The user will receive instructions to set up their account.');
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const toggleAdminRole = async (username, isCurrentlyAdmin) => {
    setLoadingAction({ userId: username, action: 'admin' });
    try {
      const session = await Auth.currentSession();
      const client = new CognitoIdentityProviderClient({
        region: awsmobile.aws_cognito_region,
        credentials: await fromCognitoIdentityPool({
          clientConfig: { region: awsmobile.aws_cognito_region },
          identityPoolId: awsmobile.aws_cognito_identity_pool_id,
          logins: {
            [`cognito-idp.${awsmobile.aws_cognito_region}.amazonaws.com/${awsmobile.aws_user_pools_id}`]: session.getIdToken().getJwtToken()
          }
        })()
      });

      const command = isCurrentlyAdmin
        ? new AdminRemoveUserFromGroupCommand({
            UserPoolId: awsmobile.aws_user_pools_id,
            Username: username,
            GroupName: 'Admin'
          })
        : new AdminAddUserToGroupCommand({
            UserPoolId: awsmobile.aws_user_pools_id,
            Username: username,
            GroupName: 'Admin'
          });

      await client.send(command);
      
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.Username === username
            ? {
                ...user,
                groups: isCurrentlyAdmin
                  ? user.groups.filter(g => g !== 'Admin')
                  : [...user.groups, 'Admin']
              }
            : user
        )
      );
      
      setSuccessMessage(`User ${isCurrentlyAdmin ? 'removed from' : 'added to'} Admin group successfully`);
    } catch (err) {
      console.error('Error toggling admin role:', err);
      setError(`Failed to ${isCurrentlyAdmin ? 'remove' : 'add'} admin role: ${err.message}`);
    } finally {
      setLoadingAction({ userId: null, action: null });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>User Management</h3>
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
          {successMessage}
        </Alert>
      )}

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isAdmin = user.groups.includes('Admin');
                  const isSuperAdmin = user.groups.includes('SuperAdmin');
                  return (
                    <tr key={user.Username}>
                      <td>{user.Attributes.find(attr => attr.Name === 'email')?.Value}</td>
                      <td>
                        {user.UserCreateDate ? new Date(user.UserCreateDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td>
                        <span className={`badge bg-${user.Enabled ? 'success' : 'danger'}`}>
                          {user.UserStatus}
                        </span>
                      </td>
                      <td>
                        {isSuperAdmin && <span className="badge bg-primary me-1">Super Admin</span>}
                        {isAdmin && <span className="badge bg-info me-1">Admin</span>}
                        {!isAdmin && !isSuperAdmin && <span className="badge bg-secondary">User</span>}
                      </td>
                      <td>
                        {!isSuperAdmin && (
                          <Button
                            variant={isAdmin ? "outline-danger" : "outline-success"}
                            size="sm"
                            onClick={() => toggleAdminRole(user.Username, isAdmin)}
                            disabled={loadingAction.userId === user.Username}
                            style={{ minWidth: '120px', whiteSpace: 'nowrap' }}
                          >
                            {loadingAction.userId === user.Username && loadingAction.action === 'admin' ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                            ) : (
                              isAdmin ? 'Remove Admin' : 'Make Admin'
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add User Modal */}
      <Modal show={openDialog} onHide={() => setOpenDialog(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <Form.Text className="text-muted">
                Password must be at least 8 characters long
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreateUser}>
            Create User
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement; 