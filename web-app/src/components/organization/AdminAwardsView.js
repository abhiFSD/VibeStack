import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Table, Badge, Spinner, Alert, Button, Tabs, Tab } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCoins, faSearch, faUser, faSitemap, faSyncAlt, faFilter, faList, faTrash } from '@fortawesome/free-solid-svg-icons';

const AdminAwardsView = ({ organizationId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [awards, setAwards] = useState([]);
  const [members, setMembers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    userSub: '',
    departmentId: '',
    searchTerm: '',
    awardType: ''
  });
  const [refreshing, setRefreshing] = useState(false);
  const [awardTypes, setAwardTypes] = useState([]);
  const [activeView, setActiveView] = useState('list');
  const [stats, setStats] = useState({
    totalAwards: 0,
    totalUsers: 0,
    totalCoins: 0
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchInitialData();
    }
  }, [organizationId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchMembers(),
        fetchDepartments(),
        fetchAwards(),
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    const result = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          organizationID: { eq: organizationId },
          _deleted: { ne: true }
        },
        limit: 1000
      }
    });
    setMembers(result.data.listOrganizationMembers.items);
  };

  const fetchDepartments = async () => {
    const result = await API.graphql({
      query: queries.listDepartments,
      variables: {
        filter: {
          organizationID: { eq: organizationId },
          _deleted: { ne: true }
        },
        limit: 1000
      }
    });
    setDepartments(result.data.listDepartments.items);
  };

  const fetchAwards = async () => {
    try {
      let filter = {
        organizationID: { eq: organizationId },
        _deleted: { ne: true }
      };

      if (filters.userSub) {
        filter.user_sub = { eq: filters.userSub };
      }

      if (filters.searchTerm) {
        filter.or = [
          { title: { contains: filters.searchTerm } },
          { description: { contains: filters.searchTerm } }
        ];
      }

      if (filters.awardType) {
        filter.type = { eq: filters.awardType };
      }
      
      // Fetch all awards with pagination
      let allAwards = [];
      let nextToken = null;
      
      do {
        console.log(`Fetching awards batch with nextToken: ${nextToken}`);
        
        const result = await API.graphql({
          query: queries.listAwards,
          variables: { 
            filter,
            limit: 100,  // Increase batch size
            nextToken
          }
        });
        
        const batch = result.data.listAwards.items;
        console.log(`Fetched ${batch.length} awards in this batch`);
        
        allAwards = [...allAwards, ...batch];
        nextToken = result.data.listAwards.nextToken;
      } while (nextToken);
      
      console.log(`Total awards fetched: ${allAwards.length}`);

      // Filter by department if selected
      let filteredAwards = allAwards;
      if (filters.departmentId) {
        const departmentMembers = members.filter(m => m.departmentID === filters.departmentId);
        const departmentUserSubs = departmentMembers.map(m => m.userSub);
        filteredAwards = filteredAwards.filter(award => 
          departmentUserSubs.includes(award.user_sub)
        );
        console.log(`Filtered to ${filteredAwards.length} awards by department`);
      }

      // Sort awards by date (most recent first)
      filteredAwards.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAwards(filteredAwards);
      
      // Extract list of unique award types
      const types = [...new Set(allAwards.map(award => award.type))];
      setAwardTypes(types);
      
      // Calculate statistics
      const stats = {
        totalAwards: filteredAwards.length,
        totalUsers: new Set(filteredAwards.map(a => a.user_sub)).size,
        totalCoins: filteredAwards.reduce((sum, award) => sum + (award.coins || 0), 0)
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching awards:', error);
      setError('Failed to load awards data. Please try again.');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchInitialData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchAwards();
    }
  }, [filters]);

  const getUserName = (userSub) => {
    const member = members.find(m => m.userSub === userSub);
    return member ? member.email : 'Unknown User';
  };

  const getDepartmentName = (userSub) => {
    const member = members.find(m => m.userSub === userSub);
    if (!member || !member.departmentID) return 'No Department';
    
    const department = departments.find(d => d.id === member.departmentID);
    return department ? department.name : 'Unknown Department';
  };
  
  // Group awards by user
  const getAwardsByUser = () => {
    const userMap = new Map();
    
    members.forEach(member => {
      userMap.set(member.userSub, {
        email: member.email,
        awards: [],
        totalCoins: 0,
        department: getDepartmentName(member.userSub)
      });
    });
    
    awards.forEach(award => {
      if (userMap.has(award.user_sub)) {
        const user = userMap.get(award.user_sub);
        user.awards.push(award);
        user.totalCoins += (award.coins || 0);
      }
    });
    
    // Convert map to array and sort by total coins (descending)
    return Array.from(userMap.values())
      .filter(user => user.awards.length > 0)
      .sort((a, b) => b.totalCoins - a.totalCoins);
  };

  // Function to delete all awarded instances for this organization
  const deleteAllAwards = async () => {
    if (!window.confirm('This will delete ALL awarded instances for this organization. This action cannot be undone. Are you sure?')) {
      return;
    }
    
    try {
      setDeleting(true);
      setError(null);
      console.log('Deleting all awarded instances...');
      console.log('Organization ID:', organizationId);
      
      // Get all awarded instances for this organization
      let allAwards = [];
      let nextToken = null;
      
      do {
        console.log(`Fetching awards with nextToken: ${nextToken}`);
        const awardsResult = await API.graphql({
          query: queries.listAwards,
          variables: {
            filter: {
              organizationID: { eq: organizationId }
              // Removed _deleted filter to get all items
            },
            limit: 100,
            nextToken
          }
        });
        
        // Filter deleted items manually
        const batch = awardsResult.data.listAwards.items.filter(item => !item._deleted);
        console.log(`Fetched ${awardsResult.data.listAwards.items.length} awards, ${batch.length} are not deleted`);
        
        allAwards = [...allAwards, ...batch];
        nextToken = awardsResult.data.listAwards.nextToken;
      } while (nextToken);
      
      const totalAwards = allAwards.length;
      console.log(`Found ${totalAwards} existing awarded instances to delete`);
      
      if (totalAwards === 0) {
        console.log('No awards to delete - checking if the organization ID is correct');
        console.log('Current organization ID used for queries:', organizationId);
        setError('No awards found to delete. This may be due to incorrect organization ID or the awards being assigned to a different organization.');
        return;
      }
      
      // Process awarded instances in batches
      const batchSize = 25;
      const awardBatches = [];
      
      for (let i = 0; i < totalAwards; i += batchSize) {
        const batch = allAwards.slice(i, i + batchSize);
        awardBatches.push(batch);
      }
      
      console.log(`Created ${awardBatches.length} batches for award deletion`);
      let successCount = 0;
      
      // Delete each batch sequentially
      for (let batchIndex = 0; batchIndex < awardBatches.length; batchIndex++) {
        const batch = awardBatches[batchIndex];
        console.log(`Processing batch ${batchIndex + 1} of ${awardBatches.length} (${batch.length} awards)`);
        
        // Process all awards in this batch in parallel
        const batchPromises = batch.map(award => 
          API.graphql({
            query: mutations.deleteAwards,
            variables: {
              input: { id: award.id }
            }
          }).then(() => {
            successCount++;
            return true;
          }).catch(error => {
            console.error(`Error deleting award ${award.id}:`, error);
            return null; // Continue with other deletions even if one fails
          })
        );
        
        // Wait for all deletions in this batch to complete
        await Promise.all(batchPromises);
        console.log(`Completed batch ${batchIndex + 1}, success count: ${successCount}`);
      }
      
      console.log(`Deleted ${successCount} of ${totalAwards} awards`);
      setError(`Successfully deleted ${successCount} of ${totalAwards} awards`);
      
      // Refresh the data
      await fetchInitialData();
    } catch (error) {
      console.error('Error deleting awards:', error);
      console.error('Error details:', error.errors || error);
      setError('Failed to delete awards: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid>
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <FontAwesomeIcon icon={faTrophy} className="me-2" />
              Organization Awards
            </h4>
            <div className="d-flex">
              <Button
                style={{width: '150px'}}
                variant={activeView === 'list' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveView('list')}
                className="me-2"
                size="sm"
              >
                <FontAwesomeIcon icon={faList} className="me-1" />
                List View
              </Button>
              <Button
                style={{width: '150px'}}
                variant={activeView === 'users' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveView('users')}
                className="me-2"
                size="sm"
              >
                <FontAwesomeIcon icon={faUser} className="me-1" />
                User View
              </Button>
              <Button 
                style={{width: '150px'}}
                variant="outline-primary"
                onClick={handleRefresh}
                disabled={refreshing}
                className="me-2"
                size="sm"
              >
                <FontAwesomeIcon icon={faSyncAlt} className={refreshing ? "me-2 fa-spin" : "me-2"} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              {awards.length > 0 && (
                <Button
                  style={{width: '150px'}}
                  variant="outline-danger"
                  onClick={deleteAllAwards}
                  disabled={deleting}
                  size="sm"
                >
                  <FontAwesomeIcon icon={faTrash} className="me-1" />
                  {deleting ? "Deleting..." : "Delete All Awards"}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          {/* Statistics */}
          <div className="d-flex mb-4">
            <Card className="flex-grow-1 me-2 shadow-sm border-0 bg-light">
              <Card.Body className="text-center">
                <h6>Total Awards</h6>
                <h3>{stats.totalAwards}</h3>
              </Card.Body>
            </Card>
            <Card className="flex-grow-1 me-2 shadow-sm border-0 bg-light">
              <Card.Body className="text-center">
                <h6>Recipients</h6>
                <h3>{stats.totalUsers}</h3>
              </Card.Body>
            </Card>
            <Card className="flex-grow-1 shadow-sm border-0 bg-light">
              <Card.Body className="text-center">
                <h6>Total Coins</h6>
                <h3>
                  <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
                  {stats.totalCoins}
                </h3>
              </Card.Body>
            </Card>
          </div>

          <Row className="mb-4">
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Filter by User
                </Form.Label>
                <Form.Select
                  value={filters.userSub}
                  onChange={(e) => handleFilterChange('userSub', e.target.value)}
                >
                  <option value="">All Users</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.userSub}>
                      {member.email}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FontAwesomeIcon icon={faSitemap} className="me-2" />
                  Filter by Department
                </Form.Label>
                <Form.Select
                  value={filters.departmentId}
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                >
                  <option value="">All Departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FontAwesomeIcon icon={faFilter} className="me-2" />
                  Filter by Type
                </Form.Label>
                <Form.Select
                  value={filters.awardType}
                  onChange={(e) => handleFilterChange('awardType', e.target.value)}
                >
                  <option value="">All Types</option>
                  {awardTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>
                  <FontAwesomeIcon icon={faSearch} className="me-2" />
                  Search Awards
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by title or description..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {activeView === 'list' ? (
            <Table responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Award</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Coins</th>
                </tr>
              </thead>
              <tbody>
                {awards.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      No awards found matching the current filters
                    </td>
                  </tr>
                ) : (
                  awards.map((award) => (
                    <tr key={award.id}>
                      <td>{new Date(award.date).toLocaleDateString()}</td>
                      <td>{getUserName(award.user_sub)}</td>
                      <td>{getDepartmentName(award.user_sub)}</td>
                      <td>{award.title}</td>
                      <td>
                        <Badge bg="info">
                          {award.type.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>{award.description}</td>
                      <td>
                        <FontAwesomeIcon icon={faCoins} className="text-warning me-1" />
                        {award.coins}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Department</th>
                  <th>Awards</th>
                  <th>Total Coins</th>
                </tr>
              </thead>
              <tbody>
                {getAwardsByUser().length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No awards found matching the current filters
                    </td>
                  </tr>
                ) : (
                  getAwardsByUser().map((user, index) => (
                    <tr key={index}>
                      <td>{user.email}</td>
                      <td>{user.department}</td>
                      <td>{user.awards.length}</td>
                      <td>
                        <FontAwesomeIcon icon={faCoins} className="text-warning me-1" />
                        {user.totalCoins}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminAwardsView; 