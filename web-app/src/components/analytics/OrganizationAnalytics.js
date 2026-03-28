import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Badge, Spinner, OverlayTrigger, Tooltip, Button, Table } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBuilding, 
  faProjectDiagram, 
  faClipboardCheck, 
  faTrophy,
  faFilter,
  faUser,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as customQueries from '../../graphql/custom-queries';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Loader } from '@googlemaps/js-api-loader';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

const OrganizationAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userData, setUserData] = useState(new Map());
  const [aggregatedData, setAggregatedData] = useState({
    projects: new Map(),
    reports: new Map(),
    actionItems: new Map(),
    awards: new Map(),
    byOrganization: new Map()
  });
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalReports: 0,
    completedReports: 0,
    totalActionItems: 0,
    todoItems: 0,
    inProgressItems: 0,
    inReviewItems: 0,
    completedItems: 0,
    totalAwards: 0
  });

  // Function to fetch data for all organizations
  const fetchCombinedOrganizationData = async (organizations) => {
    try {
      setLoading(true);

      // Fetch data for all organizations in parallel
      const orgDataPromises = organizations.map(async (org) => {
        // Get all departments for the organization
        const deptResponse = await API.graphql({
          query: queries.listDepartments,
          variables: {
            filter: {
              organizationID: { eq: org.id },
              _deleted: { ne: true }
            }
          }
        });

        // Get all projects for the organization
        const projectsResponse = await API.graphql({
          query: queries.projectsByOrganizationID,
          variables: {
            organizationID: org.id,
            filter: {
              _deleted: { ne: true }
            }
          }
        });

        const projects = projectsResponse.data.projectsByOrganizationID.items;

        // Get all members for the organization
        const membersResponse = await API.graphql({
          query: queries.listOrganizationMembers,
          variables: {
            filter: {
              organizationID: { eq: org.id },
              status: { eq: "ACTIVE" },
              _deleted: { ne: true }
            }
          }
        });

        const members = membersResponse.data.listOrganizationMembers.items;
        
        // Fetch data for all members in parallel
        const memberDataPromises = members.map(member => 
          fetchUserData(member.userSub, org.id)
        );

        const membersData = await Promise.all(memberDataPromises);

        return {
          organizationId: org.id,
          organizationName: org.name,
          departments: deptResponse.data.listDepartments.items,
          projects: projects,
          members: members,
          membersData: membersData.filter(Boolean) // Remove any null results
        };
      });

      const allOrganizationsData = await Promise.all(orgDataPromises);

      // Aggregate all data
      const combinedData = aggregateCombinedData(allOrganizationsData);
      
      // Update state with combined data
      setAggregatedData(combinedData);
      setMetrics(calculateMetrics(combinedData));

    } catch (error) {
      console.error('Error fetching combined organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Modified fetchUserData to accept organizationId
  const fetchUserData = async (userSub, organizationId) => {
    try {
      const [
        projectMemberships,
        reports,
        assignedReports,
        actionItems,
        assignedActionItems,
        awards
      ] = await Promise.all([
        // Get projects where user is a member
        API.graphql({
          query: queries.listProjectMembers,
          variables: {
            filter: {
              userSub: { eq: userSub },
              _deleted: { ne: true }
            }
          }
        }),
        // Get reports created by user
        API.graphql({
          query: queries.listReports,
          variables: {
            filter: {
              user_sub: { eq: userSub },
              organizationID: { eq: organizationId },
              _deleted: { ne: true }
            }
          }
        }),
        // Get reports assigned to user
        API.graphql({
          query: queries.listReports,
          variables: {
            filter: {
              assignedMembers: { contains: userSub },
              organizationID: { eq: organizationId },
              _deleted: { ne: true }
            }
          }
        }),
        // Get action items created by user
        API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: {
              user_sub: { eq: userSub },
              _deleted: { ne: true }
            }
          }
        }),
        // Get action items assigned to user
        API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: {
              assignees: { contains: userSub },
              _deleted: { ne: true }
            }
          }
        }),
        // Get user's awards
        API.graphql({
          query: queries.listAwards,
          variables: {
            filter: {
              user_sub: { eq: userSub },
              organizationID: { eq: organizationId },
              _deleted: { ne: true }
            }
          }
        })
      ]);

      return {
        userSub,
        organizationId,
        data: {
          projects: projectMemberships.data.listProjectMembers.items,
          reports: [...reports.data.listReports.items, ...assignedReports.data.listReports.items],
          actionItems: [...actionItems.data.listActionItems.items, ...assignedActionItems.data.listActionItems.items],
          awards: awards.data.listAwards.items
        }
      };
    } catch (error) {
      console.error(`Error fetching data for user ${userSub}:`, error);
      return null;
    }
  };

  // New function to aggregate combined data
  const aggregateCombinedData = (allOrganizationsData) => {
    const combined = {
      projects: new Map(),
      reports: new Map(),
      actionItems: new Map(),
      awards: new Map(),
      byOrganization: new Map()
    };

    allOrganizationsData.forEach(orgData => {
      const orgMetrics = {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalReports: 0,
        completedReports: 0,
        totalActionItems: 0,
        todoItems: 0,
        inProgressItems: 0,
        inReviewItems: 0,
        completedItems: 0,
        totalAwards: 0
      };

      // First add all projects for the organization
      if (orgData.projects) {
        orgData.projects.forEach(project => {
          if (!combined.projects.has(project.id) && !project._deleted) {
            combined.projects.set(project.id, project);
            orgMetrics.totalProjects++;
            if (project.status === 'ACTIVE') orgMetrics.activeProjects++;
            if (project.status === 'COMPLETED') orgMetrics.completedProjects++;
            if (project.status === 'ON_HOLD') orgMetrics.onHoldProjects++;
          }
        });
      }

      // Then process user data
      orgData.membersData.forEach(memberData => {
        if (!memberData) return;

        // We skip aggregating user projects since we've already added all projects
        // directly from the organization

        // Aggregate reports
        memberData.data.reports.forEach(report => {
          if (!combined.reports.has(report.id)) {
            combined.reports.set(report.id, report);
            orgMetrics.totalReports++;
            if (report.completed) orgMetrics.completedReports++;
          }
        });

        // Aggregate action items
        memberData.data.actionItems.forEach(item => {
          if (!combined.actionItems.has(item.id)) {
            combined.actionItems.set(item.id, item);
            orgMetrics.totalActionItems++;
            if (item.status === 0) orgMetrics.todoItems++;
            if (item.status === 1) orgMetrics.inProgressItems++;
            if (item.status === 2) orgMetrics.inReviewItems++;
            if (item.status === 3) orgMetrics.completedItems++;
          }
        });

        // Aggregate awards
        memberData.data.awards.forEach(award => {
          if (!combined.awards.has(award.id)) {
            combined.awards.set(award.id, award);
            orgMetrics.totalAwards++;
          }
        });
      });

      // Store organization-specific metrics
      combined.byOrganization.set(orgData.organizationId, {
        name: orgData.organizationName,
        metrics: orgMetrics
      });
    });

    return combined;
  };

  // Calculate metrics from aggregated data
  const calculateMetrics = (aggregatedData) => {
    const projects = Array.from(aggregatedData.projects.values());
    const reports = Array.from(aggregatedData.reports.values());
    const actionItems = Array.from(aggregatedData.actionItems.values());
    const awards = Array.from(aggregatedData.awards.values());

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
      completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
      onHoldProjects: projects.filter(p => p.status === 'ON_HOLD').length,
      
      totalReports: reports.length,
      completedReports: reports.filter(r => r.completed).length,
      
      totalActionItems: actionItems.length,
      todoItems: actionItems.filter(item => item.status === 0).length,
      inProgressItems: actionItems.filter(item => item.status === 1).length,
      inReviewItems: actionItems.filter(item => item.status === 2).length,
      completedItems: actionItems.filter(item => item.status === 3).length,
      
      totalAwards: awards.length
    };
  };

  // Modify the initial data fetch to remove address enrichment
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        const userSub = user.attributes.sub;
        console.log('Current user:', user.attributes);

        // Get ALL organizations (both owned and member of) in parallel
        const [ownedOrgsResponse, memberOrgsResponse] = await Promise.all([
          // Get owned organizations
          API.graphql({
            query: queries.listOrganizations,
            variables: {
              filter: {
                owner: { eq: userSub },
                _deleted: { ne: true }
              }
            }
          }),
          // Get member organizations
          API.graphql({
            query: queries.listOrganizationMembers,
            variables: {
              filter: {
                userSub: { eq: userSub },
                status: { eq: "ACTIVE" },
                _deleted: { ne: true }
              }
            }
          })
        ]);

        // Get organizations where user is a member
        const memberOrgs = await Promise.all(
          memberOrgsResponse.data.listOrganizationMembers.items
            .filter(member => !member._deleted)
            .map(async (member) => {
              try {
                const orgResponse = await API.graphql({
                  query: queries.getOrganization,
                  variables: { id: member.organizationID }
                });
                return orgResponse.data.getOrganization;
              } catch (error) {
                console.error('Error fetching organization:', error);
                return null;
              }
            })
        );

        // Combine and deduplicate organizations
        const ownedOrgs = ownedOrgsResponse.data.listOrganizations.items
          .filter(org => !org._deleted);
        
        const orgMap = new Map();
        [...ownedOrgs, ...memberOrgs].forEach(org => {
          if (org && !org._deleted) {
            orgMap.set(org.id, org);
          }
        });

        const allOrgs = Array.from(orgMap.values());
        setOrganizations(allOrgs);
        
        // Automatically fetch combined data when all organizations are selected
        if (selectedOrganization === 'all') {
          await fetchCombinedOrganizationData(allOrgs);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedOrganization]);

  // Modify organization selection handler
  useEffect(() => {
    const fetchOrgData = async () => {
      if (selectedOrganization === 'all') {
        setSelectedDepartment('all');
        setDepartments([]);
        // Fetch combined data for all organizations
        await fetchCombinedOrganizationData(organizations);
        return;
      }

      try {
        // Fetch departments for selected organization
        const deptResponse = await API.graphql({
          query: queries.listDepartments,
          variables: {
            filter: {
              organizationID: { eq: selectedOrganization },
              _deleted: { ne: true }
            }
          }
        });
        setDepartments(deptResponse.data.listDepartments.items);

        // Fetch organization members
        const membersResponse = await API.graphql({
          query: customQueries.getOrganizationMembers,
          variables: { organizationID: selectedOrganization }
        });

        const members = membersResponse.data.listOrganizationMembers.items
          .filter(member => member.status === 'ACTIVE');
        
        setAvailableUsers(members);
        setSelectedUsers(new Set(members.map(m => m.userSub)));
      } catch (error) {
        console.error('Error fetching organization data:', error);
      }
    };

    fetchOrgData();
  }, [selectedOrganization, organizations]);

  // Fetch data when selected users change
  useEffect(() => {
    const fetchSelectedUsersData = async () => {
      setLoading(true);
      try {
        // First fetch all projects for the organization
        const projectsResponse = await API.graphql({
          query: queries.projectsByOrganizationID,
          variables: {
            organizationID: selectedOrganization,
            filter: {
              _deleted: { ne: true }
            }
          }
        });

        const allOrgProjects = projectsResponse.data.projectsByOrganizationID.items;

        // Then fetch user data
        const userDataPromises = Array.from(selectedUsers).map(userSub => 
          fetchUserData(userSub, selectedOrganization)
        );
        const usersData = await Promise.all(userDataPromises);
        
        // Store individual user data
        const userDataMap = new Map();
        usersData.forEach(data => {
          if (data) {
            userDataMap.set(data.userSub, data);
          }
        });
        setUserData(userDataMap);
        
        // Process user projects from the user data
        const userProjects = new Map();
        usersData.forEach(userData => {
          if (!userData) return;
          
          // Get user's project memberships
          userData.data.projects.forEach(membership => {
            userProjects.set(membership.projectID, membership);
          });
          
          // Also check projects where user is the owner
          allOrgProjects.forEach(project => {
            if (project.owner === userData.userSub) {
              userProjects.set(project.id, project);
            }
          });
        });
        
        // Get full project details for each user project
        const userProjectsArray = Array.from(userProjects.keys()).map(projectId => {
          return allOrgProjects.find(p => p.id === projectId);
        }).filter(Boolean);
        
        // Aggregate data using the aggregateCombinedData function
        const aggregated = aggregateCombinedData([{
          organizationId: selectedOrganization,
          organizationName: organizations.find(org => org.id === selectedOrganization)?.name || 'Unknown',
          projects: selectedUsers.size === availableUsers.length ? allOrgProjects : userProjectsArray,
          membersData: usersData
        }]);
        
        setAggregatedData(aggregated);
        setMetrics(calculateMetrics(aggregated));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedUsers.size > 0) {
      fetchSelectedUsersData();
    } else {
      setUserData(new Map());
      setAggregatedData({
        projects: new Map(),
        reports: new Map(),
        actionItems: new Map(),
        awards: new Map(),
        byOrganization: new Map()
      });
      setMetrics({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        onHoldProjects: 0,
        totalReports: 0,
        completedReports: 0,
        totalActionItems: 0,
        todoItems: 0,
        inProgressItems: 0,
        inReviewItems: 0,
        completedItems: 0,
        totalAwards: 0
      });
    }
  }, [selectedUsers, selectedOrganization, organizations, availableUsers.length]);

  const getChartData = () => {
    // Project status distribution
    const projectStatusData = {
      labels: ['Active', 'Completed', 'On Hold'],
      datasets: [{
        data: [
          metrics.activeProjects,
          metrics.completedProjects,
          metrics.onHoldProjects
        ],
        backgroundColor: ['#28a745', '#007bff', '#ffc107'],
        borderColor: ['#28a745', '#007bff', '#ffc107'],
        borderWidth: 1
      }]
    };

    // Action items completion rate
    const actionItemsData = {
      labels: ['Done', 'In Review', 'In Progress', 'To Do'],
      datasets: [{
        data: [
          metrics.completedItems,
          metrics.inReviewItems,
          metrics.inProgressItems,
          metrics.todoItems
        ],
        backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#6c757d'],
        borderColor: ['#28a745', '#17a2b8', '#ffc107', '#6c757d'],
        borderWidth: 1
      }]
    };

    return { projectStatusData, actionItemsData };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center glass-card p-5" style={{ height: '300px' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted mb-0">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const { projectStatusData, actionItemsData } = getChartData();

  return (
    <Container className="p-0">
      {/* Filters Card */}
      <Card className="glass-card mb-4">
        <Card.Header className="theme-header">
          <h5 className="mb-0 d-flex align-items-center">
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Analytics Filters
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                {/* Updated organization filter */}
                <Form.Label className="mb-2 fw-semibold text-primary">Organization</Form.Label>
                <Form.Select
                  value={selectedOrganization}
                  onChange={(e) => {
                    setSelectedOrganization(e.target.value);
                    setSelectedDepartment('all');
                    setSelectedUsers(new Set());
                  }}
                  className="mb-3 rounded-pill"
                >
                  <option value="all">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.location ? `(${org.location})` : ''}
                    </option>
                  ))}
                </Form.Select>

                {/* Only show department and user filters when specific organization is selected */}
                {selectedOrganization !== 'all' && (
                  <>
                    {/* Department Filter */}
                    <Form.Label className="mb-2 fw-semibold text-primary">Department</Form.Label>
                    <Form.Select
                      value={selectedDepartment}
                      onChange={(e) => {
                        setSelectedDepartment(e.target.value);
                        setSelectedUsers(new Set());
                      }}
                      className="mb-3 rounded-pill"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </Form.Select>

                    {/* User Selection */}
                    <Form.Label className="mb-2 fw-semibold text-primary d-flex align-items-center">
                      <FontAwesomeIcon icon={faUser} className="me-2" />
                      Select Users
                    </Form.Label>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <Button
                        variant="primary"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => {
                          const allUserSubs = availableUsers.map(user => user.userSub);
                          setSelectedUsers(new Set(allUserSubs));
                        }}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="rounded-pill"
                        onClick={() => {
                          setSelectedUsers(new Set());
                        }}
                      >
                        Deselect All
                      </Button>
                    </div>
                    <div className="user-selection-container p-3 bg-light rounded mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {availableUsers.map((user) => (
                        <Form.Check
                          key={user.userSub}
                          type="checkbox"
                          id={`user-${user.userSub}`}
                          label={`${user.email} (${user.role})`}
                          checked={selectedUsers.has(user.userSub)}
                          className="mb-2"
                          onChange={(e) => {
                            const newSelectedUsers = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelectedUsers.add(user.userSub);
                            } else {
                              newSelectedUsers.delete(user.userSub);
                            }
                            setSelectedUsers(newSelectedUsers);
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Clear Filters */}
                {selectedOrganization !== 'all' && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="rounded-pill mt-2"
                    onClick={() => {
                      setSelectedOrganization('all');
                      setSelectedDepartment('all');
                      setSelectedUsers(new Set());
                    }}
                  >
                    <i className="fas fa-times-circle me-1"></i>
                    Clear All Filters
                  </Button>
                )}
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Summary Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3} sm={6}>
          <Card className="glass-card h-100 border-0 hover-lift">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3 rounded-circle p-3" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}>
                  <FontAwesomeIcon icon={faProjectDiagram} className="text-white fa-lg" />
                </div>
                <div>
                  <h6 className="mb-0 text-secondary">Projects</h6>
                  <div className="metric-value">{metrics.totalProjects}</div>
                  <div className="d-flex align-items-center mt-1">
                    <Badge bg="success" pill className="me-1">{metrics.activeProjects} Active</Badge>
                    <Badge bg="secondary" pill>{metrics.completedProjects} Done</Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="glass-card h-100 border-0 hover-lift">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3 rounded-circle p-3" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}>
                  <FontAwesomeIcon icon={faClipboardCheck} className="text-white fa-lg" />
                </div>
                <div>
                  <h6 className="mb-0 text-secondary">Action Items</h6>
                  <div className="metric-value">{metrics.totalActionItems}</div>
                  <div className="d-flex align-items-center mt-1">
                    <Badge bg="success" pill className="me-1">{metrics.completedItems} Done</Badge>
                    <Badge bg="warning" pill>{metrics.inProgressItems + metrics.todoItems} Pending</Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="glass-card h-100 border-0 hover-lift">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3 rounded-circle p-3" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}>
                  <FontAwesomeIcon icon={faBuilding} className="text-white fa-lg" />
                </div>
                <div>
                  <h6 className="mb-0 text-secondary">Reports</h6>
                  <div className="metric-value">{metrics.totalReports}</div>
                  <div className="d-flex align-items-center mt-1">
                    <Badge bg="success" pill className="me-1">{metrics.completedReports} Completed</Badge>
                    <Badge bg="warning" pill>{metrics.totalReports - metrics.completedReports} Pending</Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="glass-card h-100 border-0 hover-lift">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="me-3 rounded-circle p-3" style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' }}>
                  <FontAwesomeIcon icon={faTrophy} className="text-white fa-lg" />
                </div>
                <div>
                  <h6 className="mb-0 text-secondary">Awards</h6>
                  <div className="metric-value">{metrics.totalAwards}</div>
                  <div className="d-flex align-items-center mt-1">
                    <Badge bg="info" pill>Total Across Users</Badge>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <Card className="glass-card h-100">
            <Card.Header className="theme-header">
              <h6 className="mb-0">Projects Status Distribution</h6>
            </Card.Header>
            <Card.Body className="d-flex justify-content-center align-items-center flex-column">
              <div style={{ height: '250px', width: '100%', maxWidth: '400px' }}>
                <Doughnut 
                  data={projectStatusData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        },
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#2c3e50',
                        bodyColor: '#2c3e50',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        boxPadding: 5,
                        usePointStyle: true
                      }
                    }
                  }}
                />
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                <Badge bg="success" className="py-2 px-3 fs-6">
                  Active: {metrics.activeProjects} 
                  {metrics.totalProjects > 0 && 
                    <span className="ms-1">({Math.round((metrics.activeProjects / metrics.totalProjects) * 100)}%)</span>
                  }
                </Badge>
                <Badge bg="primary" className="py-2 px-3 fs-6">
                  Completed: {metrics.completedProjects}
                  {metrics.totalProjects > 0 && 
                    <span className="ms-1">({Math.round((metrics.completedProjects / metrics.totalProjects) * 100)}%)</span>
                  }
                </Badge>
                <Badge bg="warning" className="py-2 px-3 fs-6">
                  On Hold: {metrics.onHoldProjects}
                  {metrics.totalProjects > 0 && 
                    <span className="ms-1">({Math.round((metrics.onHoldProjects / metrics.totalProjects) * 100)}%)</span>
                  }
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="glass-card h-100">
            <Card.Header className="theme-header">
              <h6 className="mb-0">Action Items Status</h6>
            </Card.Header>
            <Card.Body className="d-flex justify-content-center align-items-center flex-column">
              <div style={{ height: '250px', width: '100%', maxWidth: '400px' }}>
                <Doughnut 
                  data={actionItemsData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          usePointStyle: true,
                          padding: 20,
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        },
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#2c3e50',
                        bodyColor: '#2c3e50',
                        borderColor: 'rgba(0, 0, 0, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        boxPadding: 5,
                        usePointStyle: true
                      }
                    }
                  }}
                />
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                <Badge bg="success" className="py-2 px-3 fs-6">
                  Done: {metrics.completedItems}
                  {metrics.totalActionItems > 0 && 
                    <span className="ms-1">({Math.round((metrics.completedItems / metrics.totalActionItems) * 100)}%)</span>
                  }
                </Badge>
                <Badge bg="info" className="py-2 px-3 fs-6">
                  In Review: {metrics.inReviewItems}
                  {metrics.totalActionItems > 0 && 
                    <span className="ms-1">({Math.round((metrics.inReviewItems / metrics.totalActionItems) * 100)}%)</span>
                  }
                </Badge>
                <Badge bg="warning" className="py-2 px-3 fs-6">
                  In Progress: {metrics.inProgressItems}
                  {metrics.totalActionItems > 0 && 
                    <span className="ms-1">({Math.round((metrics.inProgressItems / metrics.totalActionItems) * 100)}%)</span>
                  }
                </Badge>
                <Badge bg="secondary" className="py-2 px-3 fs-6">
                  To Do: {metrics.todoItems}
                  {metrics.totalActionItems > 0 && 
                    <span className="ms-1">({Math.round((metrics.todoItems / metrics.totalActionItems) * 100)}%)</span>
                  }
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Organizations Performance Table */}
      {aggregatedData.byOrganization.size > 1 && (
        <Card className="glass-card mb-4">
          <Card.Header className="theme-header">
            <h6 className="mb-0">Organization Performance Comparison</h6>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Projects</th>
                    <th>Action Items</th>
                    <th>Completion Rate</th>
                    <th>Reports</th>
                    <th>Awards</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(aggregatedData.byOrganization.entries()).map(([orgId, data]) => {
                    const completionRate = data.metrics.totalActionItems > 0
                      ? Math.round((data.metrics.completedItems / data.metrics.totalActionItems) * 100)
                      : 0;
                    
                    return (
                      <tr key={orgId}>
                        <td className="fw-medium">{data.name}</td>
                        <td>{data.metrics.totalProjects}</td>
                        <td>{data.metrics.totalActionItems}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1 me-2" style={{ maxWidth: '100px' }}>
                              <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                                <div 
                                  className="progress-bar" 
                                  role="progressbar"
                                  style={{ 
                                    width: `${completionRate}%`,
                                    backgroundColor: completionRate > 70 ? 'var(--success-color)' : 'var(--warning-color)'
                                  }} 
                                  aria-valuenow={completionRate} 
                                  aria-valuemin="0" 
                                  aria-valuemax="100"
                                />
                              </div>
                            </div>
                            <span>{completionRate}%</span>
                          </div>
                        </td>
                        <td>{data.metrics.totalReports}</td>
                        <td>{data.metrics.totalAwards}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OrganizationAnalytics; 