import React, { useState, useEffect } from 'react';
import { Dropdown, Button, Modal, Form, Alert, Spinner, Badge, Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faPlus, faCrown, faUserShield, faUsers, faCog, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { Auth, API, Storage } from 'aws-amplify';
import { useOrganization } from '../../contexts/OrganizationContext';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createDefaultEmailTemplates } from '../../utils/emailTemplates';
import { syncUserWithDatabase } from '../../utils/userSync';
import { ensureUserReadyForOrganization, waitForPropagation } from '../../utils/userSyncCheckpoint';

// Add custom styles to hide default dropdown arrow
const dropdownStyles = `
  .custom-dropdown-toggle::after {
    display: none !important;
  }
`;

const OrganizationSelector = () => {
  const navigate = useNavigate();
  const { activeOrganization, setActiveOrganization } = useOrganization();
  const [organizations, setOrganizations] = useState({
    owned: [],
    coOwned: [],
    member: []
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [user, setUser] = useState(null);
  const [logoUrls, setLogoUrls] = useState({});
  const [activeOrgLogo, setActiveOrgLogo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [creatingOrganization, setCreatingOrganization] = useState(false);
  const [syncingUser, setSyncingUser] = useState(false);

  const hasNoOrganizations = () => {
    return (
      !loading &&
      organizations.owned.length === 0 &&
      organizations.coOwned.length === 0 &&
      organizations.member.length === 0
    );
  };

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const currentUser = await Auth.currentAuthenticatedUser();
        setUser(currentUser);
        setUserEmail(currentUser.attributes.email);
      } catch (error) {
        console.error('Error getting current user:', error);
        setLoading(false);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchOrganizations();
    }
  }, [userEmail]);

  useEffect(() => {
    const handleFirstTimeUser = async () => {
      if (hasNoOrganizations() && !syncingUser && !showCreateModal) {
        console.log('🔍 First time user detected, running organization readiness checkpoint...');
        setSyncingUser(true);
        
        try {
          // Use comprehensive checkpoint system to ensure user is ready
          const readinessResult = await ensureUserReadyForOrganization(5, 2000);
          
          if (!readinessResult.success) {
            console.error('🚨 User not ready for organization creation:', readinessResult.message);
            console.log('⚠️ Proceeding anyway, but this may cause issues...');
          } else {
            console.log('✅ User checkpoint passed - ready for organization creation');
            console.log('User details:', {
              id: readinessResult.user.id,
              email: readinessResult.user.email,
              cognitoID: readinessResult.user.cognitoID,
              checkpointAttempts: readinessResult.attempt
            });
          }
          
          // Wait for GraphQL propagation
          await waitForPropagation(1000);
          
          // Now safe to show the create modal
          setShowCreateModal(true);
        } catch (error) {
          console.error('❌ Error in organization readiness checkpoint:', error);
          // Still show the modal, but there might be issues
          setShowCreateModal(true);
        } finally {
          setSyncingUser(false);
        }
      }
    };
    
    handleFirstTimeUser();
  }, [loading, organizations, syncingUser, showCreateModal]);

  useEffect(() => {
    if (activeOrganization?.logo) {
      fetchLogoUrl(activeOrganization.logo)
        .then(url => setActiveOrgLogo(url))
        .catch(err => console.error('Error fetching active org logo:', err));
    } else {
      setActiveOrgLogo(null);
    }
  }, [activeOrganization]);

  useEffect(() => {
    // Fetch logos for all organizations
    const fetchAllLogos = async () => {
      const allOrgs = [...organizations.owned, ...organizations.coOwned, ...organizations.member];
      const logos = {};
      
      for (const org of allOrgs) {
        if (org.logo) {
          try {
            const url = await fetchLogoUrl(org.logo);
            logos[org.id] = url;
          } catch (error) {
            console.error(`Error fetching logo for org ${org.id}:`, error);
          }
        }
      }
      
      setLogoUrls(logos);
    };
    
    if (!loading) {
      fetchAllLogos();
    }
  }, [organizations, loading]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      const userSub = user.attributes.sub;
      
      console.log('Current user:', { 
        email: userEmail,
        sub: userSub
      });

      // Get ALL organizations first
      const { data: allOrgsData } = await API.graphql({
        query: queries.listOrganizations
      });

      // Get member organizations
      const memberOrgsResponse = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            email: { eq: userEmail }
          }
        }
      });

      const memberOrgIds = memberOrgsResponse.data.listOrganizationMembers.items
        .filter(member => !member._deleted && member.status === 'ACTIVE')
        .map(member => member.organizationID);

      // Filter organizations
      const allOrgs = allOrgsData.listOrganizations.items.filter(org => !org._deleted);
      
      console.log('Processing organizations:', allOrgs.map(org => ({
        name: org.name,
        owner: org.owner,
        additionalOwners: org.additionalOwners,
        isOwner: org.owner === userSub,
        isCoOwner: Array.isArray(org.additionalOwners) && org.additionalOwners.includes(userEmail),
        isMember: memberOrgIds.includes(org.id)
      })));

      // First identify owned and co-owned
      const owned = [];
      const coOwned = [];
      const member = [];

      allOrgs.forEach(org => {
        if (org.owner === userSub) {
          owned.push(org);
        } else if (Array.isArray(org.additionalOwners) && org.additionalOwners.includes(userEmail)) {
          coOwned.push(org);
        } else if (memberOrgIds.includes(org.id)) {
          member.push(org);
        }
      });

      console.log('Final categorization:', {
        owned: owned.map(o => o.name),
        coOwned: coOwned.map(o => o.name),
        member: member.map(o => o.name)
      });

      setOrganizations({ owned, coOwned, member });
      
      // Check for newly created organization ID in localStorage
      const newOrgId = localStorage.getItem('newlyCreatedOrgId');
      if (newOrgId) {
        // Find the organization in any category
        const newOrg = [...owned, ...coOwned, ...member].find(org => org.id === newOrgId);
        if (newOrg) {
          setActiveOrganization(newOrg);
          // Clear the stored ID after setting it
          localStorage.removeItem('newlyCreatedOrgId');
          return;
        }
      }
      
      // If no newly created org or it wasn't found, set default active org
      if (!activeOrganization && (owned.length > 0 || coOwned.length > 0 || member.length > 0)) {
        const firstOrg = owned[0] || coOwned[0] || member[0];
        setActiveOrganization(firstOrg);
      }

    } catch (error) {
      console.error('Error fetching organizations:', error);
      if (error.errors) {
        console.error('GraphQL Errors:', error.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLogoUrl = async (logoKey) => {
    try {
      if (!logoKey) return null;
      
      const url = await Storage.get(logoKey, {
        level: 'public',
        expires: 60 * 60 * 24 // 24 hours
      });
      return url;
    } catch (error) {
      console.error('Error fetching logo URL:', error);
      return null;
    }
  };

  const createOrganization = async (e) => {
    e.preventDefault();
    setError(null);
    setCreatingOrganization(true);
    
    try {
      if (!formData.name.trim()) {
        setError('Organization name is required');
        setCreatingOrganization(false);
        return;
      }

      if (!formData.contactEmail.trim()) {
        setError('Contact email is required');
        setCreatingOrganization(false);
        return;
      }

      if (!formData.contactPhone.trim()) {
        setError('Contact phone number is required');
        setCreatingOrganization(false);
        return;
      }

      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      
      console.log('📍 Step 0: Running final checkpoint before organization creation...');
      
      // Use checkpoint system to absolutely ensure user is ready
      const readinessResult = await ensureUserReadyForOrganization(3, 1500);
      
      if (!readinessResult.success) {
        console.error('🚨 Final checkpoint failed:', readinessResult.message);
        setError('User account not ready for organization creation. Please refresh and try again.');
        setCreatingOrganization(false);
        return;
      }
      
      const dbUser = readinessResult.user;
      console.log('✅ Final checkpoint passed - User verified:', {
        id: dbUser.id,
        email: dbUser.email,
        cognitoID: dbUser.cognitoID
      });
      
      // Wait for propagation before proceeding
      await waitForPropagation(500);
      console.log('Step 1: Creating organization...');
      
      // Create organization
      const createOrgInput = {
        name: formData.name,
        owner: user.attributes.sub,  // Still use Cognito ID as that's what the schema expects
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
      };

      console.log('Creating organization with input:', createOrgInput);

      const newOrg = await API.graphql({
        query: mutations.createOrganization,
        variables: { input: createOrgInput }
      });

      const organizationId = newOrg.data.createOrganization.id;
      console.log('✅ Organization created successfully with ID:', organizationId);

      console.log('Step 2: Creating organization member...');
      
      // Create member record for owner
      const createMemberInput = {
        organizationID: organizationId,
        email: userEmail,
        userSub: user.attributes.sub,
        status: 'ACTIVE',
        role: 'ADMIN'
      };

      await API.graphql({
        query: mutations.createOrganizationMember,
        variables: { input: createMemberInput }
      });

      console.log('✅ Organization member created successfully');

      console.log('Step 3: Setting up award definitions and email templates...');
      
      // Call the Lambda function to set up default templates
      let lambdaSuccess = false;
      try {
        console.log('Calling Lambda function at endpoint: /awardEmailMutation');
        const lambdaResponse = await API.post('apifetchdata', '/awardEmailMutation', {
          body: {
            organizationId: organizationId
          }
        });
        
        console.log('✅ Lambda function response:', lambdaResponse);
        
        if (lambdaResponse && lambdaResponse.success) {
          console.log(`✅ Successfully created ${lambdaResponse.awardDefinitionsCreated} award definitions and ${lambdaResponse.emailTemplatesCreated} email templates`);
          lambdaSuccess = true;
        } else {
          console.warn('⚠️ Lambda function completed but returned unexpected response:', lambdaResponse);
        }
      } catch (lambdaError) {
        console.error('❌ Error calling Lambda function for template setup:', lambdaError);
        console.error('Full error object:', JSON.stringify(lambdaError, null, 2));
        
        if (lambdaError.response) {
          console.error('Error response status:', lambdaError.response.status);
          console.error('Error response data:', lambdaError.response.data);
        }
        
        console.error('Organization created successfully, but template setup failed. Templates will need to be set up manually.');
      }

      // Store the new organization ID in localStorage
      localStorage.setItem('newlyCreatedOrgId', organizationId);

      setShowCreateModal(false);
      setFormData({
        name: '',
        contactEmail: '',
        contactPhone: '',
      });
      
      console.log('✅ Organization creation process completed successfully!');
      console.log('Lambda function success:', lambdaSuccess);
      
      if (lambdaSuccess) {
        console.log('✅ All templates created successfully! Reloading page...');
        
        // Close modal and reset state
        setShowCreateModal(false);
        setFormData({
          name: '',
          contactEmail: '',
          contactPhone: '',
        });
        setCreatingOrganization(false);
        
        // Reload after successful template creation
        setTimeout(() => {
          window.location.reload();
        }, 1000); // Short delay to ensure state updates are processed
        
      } else {
        // Don't reload if templates failed - let user see the error
        setCreatingOrganization(false);
        setError('⚠️ Organization created successfully, but template setup failed. Check console logs for details. You may need to set up templates manually.');
      }

    } catch (error) {
      console.error('❌ Error creating organization:', error);
      setError('Failed to create organization');
      setCreatingOrganization(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOrganizationSelect = (org) => {
    setActiveOrganization(org);
    navigate('/dashboard'); // Navigate to dashboard after selection
  };

  const hasManagementAccess = (organization) => {
    if (!organization || !user?.attributes?.sub || !user?.attributes?.email) return false;
    return (
      organization.owner === user.attributes.sub || 
      (Array.isArray(organization.additionalOwners) && organization.additionalOwners.includes(user.attributes.email))
    );
  };

  if (loading) {
    return (
      <div className="text-center p-3">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // Show loading state when syncing user for first-time users
  if (syncingUser) {
    return (
      <div className="text-center p-3">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Verifying account setup...</span>
        </Spinner>
        <div className="mt-2 text-muted">
          <small>Verifying account setup is complete...</small>
        </div>
        <div className="mt-1 text-muted">
          <small className="text-info">This ensures a smooth setup experience.</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{dropdownStyles}</style>
      <Dropdown>
        <Dropdown.Toggle 
          variant="light" 
          className="d-flex align-items-center custom-dropdown-toggle" 
          style={{ 
            backgroundColor: '#00897b', 
            color: 'white',
            borderColor: '#00897b'
          }}>
          {activeOrganization ? (
            <>
              {activeOrgLogo ? (
                <Image 
                  src={activeOrgLogo} 
                  alt={activeOrganization.name}
                  className="me-2" 
                  width="24" 
                  height="24" 
                  roundedCircle 
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <FontAwesomeIcon icon={faBuilding} className="me-2" />
              )}
              <span className="me-2">{activeOrganization.name}</span>
              {activeOrganization.owner === user?.attributes?.sub && (
                <Badge bg="warning" className="me-2" style={{ fontSize: '0.7em' }}>Owner</Badge>
              )}
              {activeOrganization.additionalOwners?.includes(user?.attributes?.email) && (
                <Badge bg="info" className="me-2" style={{ fontSize: '0.7em' }}>Co-Owner</Badge>
              )}
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faBuilding} className="me-2" />
              <span className="me-2">Select Organization</span>
            </>
          )}
          <FontAwesomeIcon icon={faChevronDown} />
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ minWidth: '300px', padding: '0.5rem' }}>
          {organizations.owned.length > 0 && (
            <div className="mb-2">
              <Dropdown.Header className="d-flex align-items-center bg-warning bg-opacity-10 rounded py-2 px-2">
                <FontAwesomeIcon icon={faCrown} className="me-2 text-warning" />
                <span className="fw-bold">Organizations You Own</span>
              </Dropdown.Header>
              {organizations.owned.map(org => (
                <Dropdown.Item
                  key={org.id}
                  active={activeOrganization?.id === org.id}
                  onClick={() => handleOrganizationSelect(org)}
                  className="rounded mt-1"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {logoUrls[org.id] ? (
                        <Image 
                          src={logoUrls[org.id]} 
                          alt={org.name}
                          className="me-2" 
                          width="24" 
                          height="24" 
                          roundedCircle 
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      )}
                      <span>{org.name}</span>
                    </div>
                    <Badge bg="warning" className="ms-2" style={{ fontSize: '0.7em' }}>Owner</Badge>
                  </div>
                </Dropdown.Item>
              ))}
            </div>
          )}

          {organizations.coOwned.length > 0 && (
            <div className="mb-2">
              <Dropdown.Header className="d-flex align-items-center bg-info bg-opacity-10 rounded py-2 px-2">
                <FontAwesomeIcon icon={faUserShield} className="me-2 text-info" />
                <span className="fw-bold">Organizations You Co-Own</span>
              </Dropdown.Header>
              {organizations.coOwned.map(org => (
                <Dropdown.Item
                  key={org.id}
                  active={activeOrganization?.id === org.id}
                  onClick={() => handleOrganizationSelect(org)}
                  className="rounded mt-1"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {logoUrls[org.id] ? (
                        <Image 
                          src={logoUrls[org.id]} 
                          alt={org.name}
                          className="me-2" 
                          width="24" 
                          height="24" 
                          roundedCircle 
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      )}
                      <span>{org.name}</span>
                    </div>
                    <Badge bg="info" className="ms-2" style={{ fontSize: '0.7em' }}>Co-Owner</Badge>
                  </div>
                </Dropdown.Item>
              ))}
            </div>
          )}

          {organizations.member.length > 0 && (
            <div className="mb-2">
              <Dropdown.Header className="d-flex align-items-center bg-secondary bg-opacity-10 rounded py-2 px-2">
                <FontAwesomeIcon icon={faUsers} className="me-2 text-secondary" />
                <span className="fw-bold">Organizations You're A Member Of</span>
              </Dropdown.Header>
              {organizations.member.map(org => (
                <Dropdown.Item
                  key={org.id}
                  active={activeOrganization?.id === org.id}
                  onClick={() => handleOrganizationSelect(org)}
                  className="rounded mt-1"
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      {logoUrls[org.id] ? (
                        <Image 
                          src={logoUrls[org.id]} 
                          alt={org.name}
                          className="me-2" 
                          width="24" 
                          height="24" 
                          roundedCircle 
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <FontAwesomeIcon icon={faBuilding} className="me-2" />
                      )}
                      <span>{org.name}</span>
                    </div>
                    <Badge bg="secondary" className="ms-2" style={{ fontSize: '0.7em' }}>Member</Badge>
                  </div>
                </Dropdown.Item>
              ))}
            </div>
          )}

          <Dropdown.Divider />
          {activeOrganization && hasManagementAccess(activeOrganization) && (
            <>
              <Dropdown.Item 
                as={Link} 
                to="/organization-management"
                className="rounded"
              >
                <FontAwesomeIcon icon={faCog} className="me-2" />
                Manage Organization
              </Dropdown.Item>
              <Dropdown.Divider />
            </>
          )}
          <Dropdown.Item 
            onClick={() => setShowCreateModal(true)} 
            className="text-primary rounded"
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Create New Organization
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <Modal 
        show={showCreateModal} 
        onHide={() => !hasNoOrganizations() && setShowCreateModal(false)}
      >
        <Modal.Header closeButton={!hasNoOrganizations()}>
          <Modal.Title>
            {hasNoOrganizations() ? 'Create Your First Organization' : 'Create New Organization'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={createOrganization}>
            <Form.Group className="mb-3">
              <Form.Label>Organization Name *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact Email *</Form.Label>
              <Form.Control
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact Phone *</Form.Label>
              <Form.Control
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              {!hasNoOrganizations() && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowCreateModal(false)}
                  disabled={creatingOrganization}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={creatingOrganization}>
                {creatingOrganization ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Setting up organization...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OrganizationSelector; 