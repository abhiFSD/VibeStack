import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Alert, Spinner, Badge, Form, InputGroup, Modal } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faUsers, faMapMarkerAlt, faSearch, faSync, faEnvelope, faUserTie, faCalendarAlt, faInfoCircle, faTrash, faExclamationTriangle, faCreditCard, faLock, faGift, faPlus } from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { useNavigate } from 'react-router-dom';

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showOrgDetails, setShowOrgDetails] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const [deletingOrgs, setDeletingOrgs] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [orgToGrant, setOrgToGrant] = useState(null);
  const [grantLicenseCount, setGrantLicenseCount] = useState(2);
  const [grantReason, setGrantReason] = useState('');
  const [granting, setGranting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      let allOrganizations = [];
      let nextToken = null;
      
      // First, fetch ALL organizations without any filter to see the total count
      console.log('Fetching ALL organizations without filters...');
      const testResponse = await API.graphql({
        query: queries.listOrganizations,
        variables: {
          limit: 1000 // Try to get as many as possible
        }
      });
      console.log('TOTAL organizations in database (no filters):', testResponse.data.listOrganizations.items.length);
      console.log('Organizations data:', testResponse.data.listOrganizations.items);
      
      // Now fetch with our intended logic - get ALL organizations, including inactive ones
      nextToken = null;
      allOrganizations = [];
      
      do {
        const response = await API.graphql({
          query: queries.listOrganizations,
          variables: {
            // Remove ALL filters to see all organizations
            limit: 100, // Fetch 100 at a time
            nextToken: nextToken
          }
        });

        const organizationsData = response.data.listOrganizations.items;
        allOrganizations = [...allOrganizations, ...organizationsData];
        nextToken = response.data.listOrganizations.nextToken;
        
        console.log(`Fetched ${organizationsData.length} organizations, total so far: ${allOrganizations.length}`);
        console.log('NextToken:', nextToken);
      } while (nextToken); // Continue fetching while there are more pages

      console.log('Total organizations fetched (after pagination):', allOrganizations.length);
      
      // Filter out only truly deleted organizations on the client side
      const validOrganizations = allOrganizations.filter(org => !org._deleted);
      console.log('Valid organizations after filtering _deleted:', validOrganizations.length);
      
      // Log inactive organizations if any
      const inactiveOrgs = validOrganizations.filter(org => org.isActive === false);
      if (inactiveOrgs.length > 0) {
        console.log('Inactive organizations found:', inactiveOrgs.length, inactiveOrgs);
      }

      // Sort alphabetically by organization name (use validOrganizations, not allOrganizations)
      const sortedOrganizations = [...validOrganizations].sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );

      setOrganizations(sortedOrganizations);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrganizations();
    setRefreshing(false);
    setSuccessMessage('Organizations refreshed successfully');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const fetchOwnerInfo = async (ownerSub) => {
    if (!ownerSub) return null;
    
    try {
      // First try to get user from User table using cognitoID index
      const userResponse = await API.graphql({
        query: queries.usersByCognitoID,
        variables: {
          cognitoID: ownerSub,
          limit: 1
        }
      });
      
      const users = userResponse.data.usersByCognitoID.items;
      if (users && users.length > 0) {
        const user = users[0];
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Unknown User';
        
        return {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: fullName,
          profileImageUrl: user.profileImageUrl
        };
      }
      
      // Fallback: Search for the owner in OrganizationMembers
      const response = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            userSub: { eq: ownerSub }
          },
          limit: 1
        }
      });
      
      const members = response.data.listOrganizationMembers.items;
      if (members && members.length > 0 && members[0].email) {
        return {
          email: members[0].email,
          fullName: members[0].email
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching owner info:', error);
      return null;
    }
  };

  const handleViewDetails = async (org) => {
    setSelectedOrg(org);
    setShowOrgDetails(true);
    setOwnerInfo(null);
    setLoadingOwner(true);
    
    // Fetch owner info if owner exists
    if (org.owner) {
      const info = await fetchOwnerInfo(org.owner);
      setOwnerInfo(info);
    }
    setLoadingOwner(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Trial and license status functions
  const isTrialExpired = (organization) => {
    if (!organization) return false;
    if (organization.purchasedLicenses > 0) return false;
    
    const createdAt = new Date(organization.createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    return daysDifference >= 14;
  };

  const getTrialDaysRemaining = (organization) => {
    if (!organization || organization.purchasedLicenses > 0) return null;
    
    const createdAt = new Date(organization.createdAt);
    const now = new Date();
    const daysPassed = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 14 - daysPassed);
  };

  const getStatusBadge = (org) => {
    if (org.purchasedLicenses > 0) {
      // Has licenses - show license info
      const renewalDate = org.subscriptionPeriodEnd ? new Date(org.subscriptionPeriodEnd) : null;
      const billingPeriod = org.billingPeriod || 'MONTHLY';
      
      return (
        <div className="d-flex flex-column gap-1">
          <Badge bg="success" className="d-flex align-items-center">
            <FontAwesomeIcon icon={faCreditCard} className="me-1" />
            {org.purchasedLicenses} License{org.purchasedLicenses !== 1 ? 's' : ''}
          </Badge>
          {renewalDate && (
            <Badge bg="info" className="d-flex align-items-center" style={{ fontSize: '0.7rem' }}>
              <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
              {billingPeriod === 'YEARLY' ? 'Annual' : 'Monthly'} - Renews {formatDate(renewalDate)}
            </Badge>
          )}
        </div>
      );
    } else if (isTrialExpired(org)) {
      // Trial expired
      return (
        <Badge bg="danger" className="d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-1" />
          Trial Expired
        </Badge>
      );
    } else {
      // Active trial
      const daysRemaining = getTrialDaysRemaining(org);
      return (
        <Badge bg="warning" className="d-flex align-items-center">
          <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
          Trial: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
        </Badge>
      );
    }
  };

  const filteredOrganizations = organizations.filter(org => 
    (org.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.contactEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasLocationData = (org) => {
    return Boolean(org.location);
  };

  const getLocationString = (org) => {
    if (org.location) {
      return org.location;
    }
    return 'No location data';
  };

  // Organization deletion function (adapted from main OrganizationManagement)
  const deleteOrganization = async (orgId, orgName) => {
    setDeletingOrgs(prev => new Set(prev).add(orgId));
    try {
      // Fetch organization members first
      const membersResult = await API.graphql({
        query: queries.organizationMembersByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      const members = membersResult.data.organizationMembersByOrganizationID.items.filter(m => !m._deleted);

      // Delete all reports and their associated items
      const reportsResult = await API.graphql({
        query: queries.reportsByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      
      const reports = reportsResult.data.reportsByOrganizationID.items.filter(r => !r._deleted);
      
      for (const report of reports) {
        // Delete action items associated with reports
        const reportActionItemsResult = await API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: {
              reportID: { eq: report.id },
              _deleted: { ne: true }
            },
            limit: 1000
          }
        });
        
        const reportActionItems = reportActionItemsResult.data.listActionItems.items;
        
        for (const item of reportActionItems) {
          await API.graphql({
            query: mutations.deleteActionItems,
            variables: { input: { id: item.id } }
          });
        }
        
        // Delete the report
        await API.graphql({
          query: mutations.deleteReport,
          variables: { input: { id: report.id } }
        });
      }

      // Delete all projects and their associated items
      const projectsResult = await API.graphql({
        query: queries.projectsByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      
      const projects = projectsResult.data.projectsByOrganizationID.items.filter(p => !p._deleted);
      
      for (const project of projects) {
        // Delete action items
        const actionItemsResult = await API.graphql({
          query: queries.actionItemsByProjectID,
          variables: {
            projectID: project.id
          }
        });
        
        const actionItems = actionItemsResult.data.actionItemsByProjectID.items.filter(ai => !ai._deleted);
        
        for (const item of actionItems) {
          await API.graphql({
            query: mutations.deleteActionItems,
            variables: { input: { id: item.id } }
          });
        }
        
        // Delete project members
        const projectMembersResult = await API.graphql({
          query: queries.projectMembersByProjectID,
          variables: {
            projectID: project.id
          }
        });
        
        const projectMembers = projectMembersResult.data.projectMembersByProjectID.items.filter(pm => !pm._deleted);
        
        for (const member of projectMembers) {
          await API.graphql({
            query: mutations.deleteProjectMember,
            variables: { input: { id: member.id } }
          });
        }
        
        // Delete the project
        await API.graphql({
          query: mutations.deleteProject,
          variables: { input: { id: project.id } }
        });
      }

      // Delete all departments
      const departmentsResult = await API.graphql({
        query: queries.departmentsByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      
      const departments = departmentsResult.data.departmentsByOrganizationID.items.filter(d => !d._deleted);
      
      for (const department of departments) {
        await API.graphql({
          query: mutations.deleteDepartment,
          variables: { input: { id: department.id } }
        });
      }

      // Delete all awards and award definitions
      const awardsResult = await API.graphql({
        query: queries.awardsByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      
      const awards = awardsResult.data.awardsByOrganizationID.items.filter(a => !a._deleted);
      
      for (const award of awards) {
        await API.graphql({
          query: mutations.deleteAwards,
          variables: { input: { id: award.id } }
        });
      }

      // Delete award definitions (templates)
      const awardDefinitionsResult = await API.graphql({
        query: queries.awardDefinitionsByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      
      const awardDefinitions = awardDefinitionsResult.data.awardDefinitionsByOrganizationID.items.filter(ad => !ad._deleted);
      
      for (const definition of awardDefinitions) {
        await API.graphql({
          query: mutations.deleteAwardDefinition,
          variables: { input: { id: definition.id } }
        });
      }

      // Delete all shop items and user purchases
      const shopItemsResult = await API.graphql({
        query: queries.shopItemsByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      
      const shopItems = shopItemsResult.data.shopItemsByOrganizationID.items.filter(si => !si._deleted);
      
      for (const item of shopItems) {
        // Delete associated user purchases first
        const purchasesResult = await API.graphql({
          query: queries.userPurchasesByShopItemID,
          variables: {
            shopItemID: item.id
          }
        });
        
        const purchases = purchasesResult.data.userPurchasesByShopItemID.items.filter(p => !p._deleted);
        
        for (const purchase of purchases) {
          await API.graphql({
            query: mutations.deleteUserPurchase,
            variables: { input: { id: purchase.id } }
          });
        }
        
        // Then delete the shop item
        await API.graphql({
          query: mutations.deleteShopItem,
          variables: { input: { id: item.id } }
        });
      }

      // Delete all email templates
      const templatesResult = await API.graphql({
        query: queries.emailTemplatesByOrganizationID,
        variables: {
          organizationID: orgId
        }
      });
      
      const templates = templatesResult.data.emailTemplatesByOrganizationID.items.filter(t => !t._deleted);
      
      for (const template of templates) {
        await API.graphql({
          query: mutations.deleteEmailTemplate,
          variables: { input: { id: template.id } }
        });
      }

      // Delete all members
      for (const member of members) {
        await API.graphql({
          query: mutations.deleteOrganizationMember,
          variables: { input: { id: member.id } }
        });
      }

      // Finally, delete the organization itself
      await API.graphql({
        query: mutations.deleteOrganization,
        variables: { 
          input: { 
            id: orgId
          } 
        }
      });

      setSuccessMessage(`Organization "${orgName}" has been completely deleted`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Refresh the organizations list
      await fetchOrganizations();
      
    } catch (error) {
      console.error('Error deleting organization:', error);
      setError(`Failed to delete organization "${orgName}": ${error.message}`);
      setTimeout(() => setError(null), 10000);
    } finally {
      setDeletingOrgs(prev => {
        const newSet = new Set(prev);
        newSet.delete(orgId);
        return newSet;
      });
      setShowDeleteModal(false);
      setOrgToDelete(null);
    }
  };

  const handleDeleteClick = (org) => {
    setOrgToDelete(org);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (orgToDelete) {
      deleteOrganization(orgToDelete.id, orgToDelete.name);
    }
  };

  const handleGrantLicenses = (org) => {
    setOrgToGrant(org);
    setGrantLicenseCount(2);
    setGrantReason('');
    setShowGrantModal(true);
  };

  const confirmGrantLicenses = async () => {
    if (!orgToGrant || !grantReason.trim()) {
      setError('Please provide a reason for granting licenses');
      return;
    }

    setGranting(true);
    setError(null);

    try {
      // Get current user info for audit trail
      const currentUser = await Auth.currentAuthenticatedUser();
      const userEmail = currentUser.attributes.email;

      // Calculate new license count
      const currentLicenses = orgToGrant.purchasedLicenses || 0;
      const newLicenseCount = currentLicenses + grantLicenseCount;

      // Update organization with granted licenses
      await API.graphql({
        query: mutations.updateOrganization,
        variables: {
          input: {
            id: orgToGrant.id,
            purchasedLicenses: newLicenseCount,
            _version: orgToGrant._version
          }
        }
      });

      console.log('✅ Licenses granted:', {
        organizationId: orgToGrant.id,
        organizationName: orgToGrant.name,
        previousLicenses: currentLicenses,
        grantedLicenses: grantLicenseCount,
        newTotal: newLicenseCount,
        grantedBy: userEmail,
        reason: grantReason,
        timestamp: new Date().toISOString()
      });

      setSuccessMessage(
        `Successfully granted ${grantLicenseCount} license${grantLicenseCount !== 1 ? 's' : ''} to "${orgToGrant.name}". ` +
        `New total: ${newLicenseCount} license${newLicenseCount !== 1 ? 's' : ''}.`
      );

      // Refresh organizations list
      await fetchOrganizations();

      // Close modal and reset
      setShowGrantModal(false);
      setOrgToGrant(null);
      setGrantLicenseCount(2);
      setGrantReason('');
      
      setTimeout(() => setSuccessMessage(null), 8000);

    } catch (error) {
      console.error('Error granting licenses:', error);
      setError(`Failed to grant licenses: ${error.message}`);
    } finally {
      setGranting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <FontAwesomeIcon icon={faBuilding} className="me-2" />
            Organizations Management
          </h4>
          <Button 
            variant="light" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} className="me-1" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <strong>Super Admin Tools:</strong> You can view and manage all organizations registered in the system.
          </Alert>

          {successMessage && (
            <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form className="mb-3">
            <InputGroup>
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search organizations by name, contact email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setSearchTerm('')}
                >
                  Clear
                </Button>
              )}
            </InputGroup>
          </Form>

          {organizations.length === 0 ? (
            <Alert variant="warning">
              No organizations found in the system.
            </Alert>
          ) : (
            <>
              <div className="mb-2">
                <Badge bg="secondary">Total: {organizations.length}</Badge>
                {searchTerm && (
                  <Badge bg="info" className="ms-2">Filtered: {filteredOrganizations.length}</Badge>
                )}
              </div>
              <div className="d-flex flex-column gap-3">
                {filteredOrganizations.map((org, index) => (
                  <Card key={org.id} className="shadow-sm border-0" style={{ backgroundColor: '#f8f9fa' }}>
                    <Card.Body className="p-4">
                      <div className="row align-items-center">
                        {/* Left Section - Organization Info */}
                        <div className="col-12 col-md-8">
                          <div className="d-flex align-items-center mb-3">
                            <Badge bg="secondary" className="rounded-pill me-3" style={{ fontSize: '0.9rem' }}>
                              #{index + 1}
                            </Badge>
                            {org.logo ? (
                              <img 
                                src={org.logo} 
                                alt="Organization Logo" 
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                className="rounded me-3"
                              />
                            ) : (
                              <div 
                                className="bg-primary text-white rounded d-flex align-items-center justify-content-center me-3"
                                style={{ width: '50px', height: '50px', fontSize: '20px', fontWeight: 'bold' }}
                              >
                                {(org.name || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-grow-1">
                              <h5 className="mb-1 text-dark fw-bold">
                                {org.name || 'Unnamed Organization'}
                              </h5>
                              <div className="row">
                                <div className="col-12 col-lg-6">
                                  <div className="d-flex align-items-center mb-2">
                                    <FontAwesomeIcon icon={faUserTie} className="me-2 text-muted" style={{ width: '18px' }} />
                                    <span className="text-muted">
                                      {org.owner ? `Owner: ${org.owner.substring(0, 16)}...` : 'No owner assigned'}
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center mb-2">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-muted" style={{ width: '18px' }} />
                                    <span className={hasLocationData(org) ? 'text-dark' : 'text-muted fst-italic'}>
                                      {hasLocationData(org) ? getLocationString(org) : 'No location data'}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-12 col-lg-6">
                                  <div className="d-flex align-items-center mb-2">
                                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-muted" style={{ width: '18px' }} />
                                    {org.contactEmail ? (
                                      <a 
                                        href={`mailto:${org.contactEmail}`} 
                                        className="text-decoration-none text-primary fw-medium"
                                        title={org.contactEmail}
                                      >
                                        {org.contactEmail}
                                      </a>
                                    ) : (
                                      <span className="text-muted fst-italic">No contact email</span>
                                    )}
                                  </div>
                                  <div className="d-flex align-items-center mb-2">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-muted" style={{ width: '18px' }} />
                                    <span className="text-muted">
                                      Created: {formatDate(org.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Right Section - Status and Actions */}
                        <div className="col-12 col-md-4">
                          <div className="d-flex flex-column align-items-md-end align-items-start">
                            <div className="mb-3">
                              {getStatusBadge(org)}
                            </div>
                            <div className="d-flex gap-2 w-100 justify-content-md-end">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleViewDetails(org)}
                                title="View Details"
                                className="d-flex align-items-center justify-content-center"
                                style={{ fontSize: '0.875rem', minWidth: '90px' }}
                              >
                                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                                Details
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleGrantLicenses(org)}
                                title="Grant Free Licenses"
                                className="d-flex align-items-center justify-content-center"
                                style={{ fontSize: '0.875rem', minWidth: '80px' }}
                              >
                                <FontAwesomeIcon icon={faGift} className="me-1" />
                                Grant
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteClick(org)}
                                disabled={deletingOrgs.has(org.id)}
                                title="Delete Organization"
                                className="d-flex align-items-center justify-content-center"
                                style={{ fontSize: '0.875rem', minWidth: '80px' }}
                              >
                                {deletingOrgs.has(org.id) ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <>
                                    <FontAwesomeIcon icon={faTrash} className="me-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Organization Details Modal */}
      <Modal 
        show={showOrgDetails} 
        onHide={() => {
          setShowOrgDetails(false);
          setOwnerInfo(null);
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
            {selectedOrg?.name || 'Organization Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrg && (
            <div className="org-details">
              <div className="row">
                <div className="col-md-6">
                  <h5>General Information</h5>
                  <Table bordered hover size="sm">
                    <tbody>
                      <tr>
                        <th width="40%">ID</th>
                        <td>{selectedOrg.id}</td>
                      </tr>
                      <tr>
                        <th>Name</th>
                        <td>{selectedOrg.name || 'Unnamed Organization'}</td>
                      </tr>
                      <tr>
                        <th>Owner</th>
                        <td>
                          {loadingOwner ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <>
                              {ownerInfo ? (
                                <div>
                                  <FontAwesomeIcon icon={faUserTie} className="me-1 text-primary" />
                                  <strong>{ownerInfo.fullName}</strong>
                                  <br />
                                  <small className="text-muted">
                                    <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                    {ownerInfo.email}
                                  </small>
                                </div>
                              ) : selectedOrg.owner ? (
                                <span className="text-muted">
                                  Owner ID: {selectedOrg.owner}
                                  <br />
                                  <small>(User profile not found)</small>
                                </span>
                              ) : (
                                <span className="text-muted">No owner assigned</span>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>Created</th>
                        <td>{formatDate(selectedOrg.createdAt)}</td>
                      </tr>
                      <tr>
                        <th>Updated</th>
                        <td>{formatDate(selectedOrg.updatedAt)}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>
                          <Badge bg={selectedOrg.isActive ? "success" : "danger"}>
                            {selectedOrg.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {selectedOrg.isPaid && (
                            <Badge bg="warning" text="dark" className="ms-1">
                              Paid
                            </Badge>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                <div className="col-md-6">
                  <h5>Contact & Location</h5>
                  <Table bordered hover size="sm">
                    <tbody>
                      <tr>
                        <th width="40%">Contact Email</th>
                        <td>{selectedOrg.contactEmail || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <th>Contact Phone</th>
                        <td>{selectedOrg.contactPhone || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <th>Location</th>
                        <td>{selectedOrg.location || 'Not available'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowOrgDetails(false);
            setOwnerInfo(null);
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        show={showDeleteModal} 
        onHide={() => {
          setShowDeleteModal(false);
          setOrgToDelete(null);
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Delete Organization
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orgToDelete && (
            <div>
              <Alert variant="danger">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                <strong>WARNING:</strong> This action will permanently delete ALL organization data and cannot be undone!
              </Alert>
              <p>
                You are about to delete the organization <strong>"{orgToDelete.name}"</strong> and all associated data including:
              </p>
              <ul className="mb-3">
                <li>All reports and action items</li>
                <li>All projects and project members</li>
                <li>All departments and members</li>
                <li>All awards and shop items</li>
                <li>All email templates</li>
                <li>The organization itself</li>
              </ul>
              <p className="text-danger fw-bold">
                This action cannot be undone. Are you absolutely sure you want to proceed?
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowDeleteModal(false);
              setOrgToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={orgToDelete && deletingOrgs.has(orgToDelete.id)}
          >
            {orgToDelete && deletingOrgs.has(orgToDelete.id) ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Delete Organization
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Grant Licenses Modal */}
      <Modal 
        show={showGrantModal} 
        onHide={() => {
          setShowGrantModal(false);
          setOrgToGrant(null);
          setGrantLicenseCount(2);
          setGrantReason('');
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-warning">
            <FontAwesomeIcon icon={faGift} className="me-2" />
            Grant Free Licenses
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {orgToGrant && (
            <div>
              <Alert variant="warning">
                <FontAwesomeIcon icon={faGift} className="me-2" />
                <strong>Super Admin Action:</strong> You are about to grant free licenses without payment processing.
              </Alert>
              
              <div className="mb-3">
                <h6>Organization Details:</h6>
                <ul className="mb-0">
                  <li><strong>Name:</strong> {orgToGrant.name}</li>
                  <li><strong>Current Licenses:</strong> {orgToGrant.purchasedLicenses || 0}</li>
                  <li><strong>ID:</strong> <code>{orgToGrant.id}</code></li>
                </ul>
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Number of Licenses to Grant
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="100"
                    value={grantLicenseCount}
                    onChange={(e) => setGrantLicenseCount(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <Form.Text className="text-muted">
                    These licenses will be added to the current total: {orgToGrant.purchasedLicenses || 0} + {grantLicenseCount} = {(orgToGrant.purchasedLicenses || 0) + grantLicenseCount}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Reason for Granting Licenses <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    placeholder="Enter reason for granting free licenses (e.g., promotional offer, support case, testing, etc.)"
                    required
                  />
                  <Form.Text className="text-muted">
                    This reason will be logged for audit purposes
                  </Form.Text>
                </Form.Group>
              </Form>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowGrantModal(false);
              setOrgToGrant(null);
              setGrantLicenseCount(2);
              setGrantReason('');
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="warning" 
            onClick={confirmGrantLicenses}
            disabled={granting || !grantReason.trim()}
          >
            {granting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Granting Licenses...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faGift} className="me-2" />
                Grant {grantLicenseCount} License{grantLicenseCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OrganizationManagement; 