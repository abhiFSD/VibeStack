import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, ProgressBar, Modal, Form, Dropdown, Spinner } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChartLine, faPencilAlt, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { useOrganization } from '../../contexts/OrganizationContext';
import { handleProjectCompleteAward } from '../../utils/awards';
import { 
  sendProjectCreatedNotification, 
  sendProjectMemberAddedNotification, 
  sendProjectCompletedNotification 
} from '../../utils/emailNotifications';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userSub, setUserSub] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'ACTIVE'
  });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (activeOrganization) {
      fetchProjects();
    }
  }, [activeOrganization]);

  const fetchUserData = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setUserSub(user.attributes.sub);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Function to fetch all pages for a given filter
      const fetchAllPages = async (filter) => {
        let items = [];
        let nextToken = null;
        do {
          const result = await API.graphql({
            query: queries.listProjects,
            variables: {
              filter,
              limit: 1000, // Increased limit to reduce round trips
              nextToken
            }
          });
          items = [...items, ...result.data.listProjects.items];
          nextToken = result.data.listProjects.nextToken;
        } while (nextToken);
        return items;
      };
      
      // Fetch projects where user is the owner
      const ownedProjects = await fetchAllPages({
        owner: { eq: user.attributes.sub },
        organizationID: { eq: activeOrganization?.id },
        _deleted: { ne: true }
      });

      // Fetch projects where user is a member (via ProjectMember table)
      const memberResult = await API.graphql({
        query: queries.listProjectMembers,
        variables: {
          filter: {
            userSub: { eq: user.attributes.sub },
            _deleted: { ne: true }
          },
          limit: 1000
        }
      });

      // Get project details for member projects
      const memberProjectPromises = memberResult.data.listProjectMembers.items.map(async (member) => {
        try {
          const projectResult = await API.graphql({
            query: queries.getProject,
            variables: { id: member.projectID }
          });
          return projectResult.data.getProject;
        } catch (error) {
          console.error('Error fetching member project:', error);
          return null;
        }
      });

      const memberProjects = (await Promise.all(memberProjectPromises))
        .filter(project => project && 
                           project.organizationID === activeOrganization?.id && 
                           !project._deleted);

      // Combine owned and member projects, removing duplicates
      const allProjects = [...ownedProjects, ...memberProjects];
      const uniqueProjects = Array.from(new Map(allProjects.map(project => [project.id, project])).values());
      
      // Filter out deleted projects
      const projectsList = uniqueProjects.filter(item => !item._deleted);
      setProjects(projectsList);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsCreatingProject(true);
    try {
      // Get current user details
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      const userSubId = user.attributes.sub;

      const projectInput = {
        name: newProject.name,
        description: newProject.description,
        startDate: new Date(newProject.startDate).toISOString(),
        endDate: newProject.endDate ? new Date(newProject.endDate).toISOString() : null,
        status: newProject.status,
        organizationID: activeOrganization.id,
        owner: userSubId,
        ownerEmail: userEmail,
        attachments: []
      };

      const result = await API.graphql({
        query: mutations.createProject,
        variables: { input: projectInput }
      });
      
      const createdProject = result.data.createProject;

      // Send notification for project creation
      try {
        await sendProjectCreatedNotification(createdProject, activeOrganization.id);
        console.log('Project creation notification sent successfully');
      } catch (notificationError) {
        console.error('Error sending project creation notification:', notificationError);
        // Continue execution even if notification fails
      }

      setNewProject({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'ACTIVE'
      });
      setCreateModalVisible(false);
      await fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please check console.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleEditProject = async (e) => {
    e.preventDefault();
    setIsUpdatingProject(true);
    try {
      // Get current user details
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      const userSubId = user.attributes.sub;

      const updateInput = {
        id: currentProject.id,
        name: editData.name,
        description: editData.description,
        startDate: new Date(editData.startDate).toISOString(),
        endDate: editData.endDate ? new Date(editData.endDate).toISOString() : null,
        status: editData.status,
        owner: userSubId,
        ownerEmail: userEmail
      };

      console.log('[handleEditProject] Update input (without version):', updateInput);

      const updateResult = await API.graphql({
        query: mutations.updateProject,
        variables: { input: updateInput }
      });
      
      const updatedProjectBrief = updateResult.data.updateProject;

      if (editData.status === 'COMPLETED' && currentProject.status !== 'COMPLETED') {
        if (activeOrganization?.id) {
          await handleProjectCompleteAward(activeOrganization.id, currentProject.id);
        } else {
          console.warn('Cannot grant award: activeOrganization.id is missing.');
        }
        
        try {
          console.log(`[handleEditProject] Fetching base project details ${currentProject.id}`);
          const baseProjectResult = await API.graphql({ 
            query: queries.getProject,
            variables: { id: currentProject.id } 
          });
          const baseProjectData = baseProjectResult.data.getProject;

          console.log(`[handleEditProject] Fetching members for project ${currentProject.id}`);
          const membersResult = await API.graphql({
            query: queries.projectMembersByProjectID,
            variables: { projectID: currentProject.id }
          });
          const memberItems = membersResult.data.projectMembersByProjectID?.items || [];
          console.log(`[handleEditProject] Fetched ${memberItems.length} members.`);

          if (baseProjectData) {
            const projectDataForNotification = {
              ...baseProjectData,
              members: {
                items: memberItems 
              }
            };

            console.log('[handleEditProject] Combined project data prepared for notification:', projectDataForNotification);
            await sendProjectCompletedNotification(projectDataForNotification, activeOrganization.id);
            console.log('Project completion notification sent successfully');
          } else {
            console.error('[handleEditProject] Failed to fetch base project details for notification.');
          }
        } catch (notificationError) {
          console.error('Error fetching details or sending project completion notification:', notificationError);
        }
      }

      setEditModalVisible(false);
      setCurrentProject(null);
      await fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      if (error.errors) {
        console.error('GraphQL Errors:', JSON.stringify(error.errors, null, 2));
      }
      alert('Failed to update project. Please check console for details.');
    } finally {
      setIsUpdatingProject(false);
    }
  };

  const openEditModal = (project) => {
    setCurrentProject(project);
    setEditData({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate.split('T')[0],
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      status: project.status
    });
    setEditModalVisible(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'ACTIVE': 'success',
      'COMPLETED': 'primary',
      'ON_HOLD': 'warning',
      'CANCELLED': 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
  };

  const getProjectProgress = (startDate, endDate) => {
    if (!endDate) return 0;
    
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const current = new Date().getTime();

    if (current < start) return 0;
    if (current > end) return 100;
    
    const totalDuration = end - start;
    const elapsed = current - start;
    return Math.round((elapsed / totalDuration) * 100);
  };

  const handleAddProjectMembers = async (projectId, newMemberSubs) => {
    try {
      const result = await API.graphql({
        query: queries.getProject,
        variables: { id: projectId }
      });
      
      const project = result.data.getProject;
      const currentMembers = project.members || [];
      
      const updatedMembers = [...new Set([...currentMembers, ...newMemberSubs])];
      
      const updateResult = await API.graphql({
        query: mutations.updateProject,
        variables: { 
          input: {
            id: projectId,
            members: updatedMembers,
          }
        }
      });
      
      const updatedProject = updateResult.data.updateProject;
      
      try {
        await sendProjectMemberAddedNotification(updatedProject, newMemberSubs, activeOrganization.id);
        console.log('Project member added notification sent successfully');
      } catch (notificationError) {
        console.error('Error sending project member added notification:', notificationError);
      }
      
      return updatedProject;
    } catch (error) {
      console.error('Error adding project members:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4 pt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Projects</h2>
        <Button 
          variant="primary"
          onClick={() => setCreateModalVisible(true)}
          style={{ backgroundColor: '#00897b', borderColor: '#00897b' }}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Create Project
        </Button>
      </div>
      
      <Row xs={1} md={2} lg={3} className="g-4">
        {projects.map((project) => (
          <Col key={project.id}>
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <Card.Title>{project.name}</Card.Title>
                    {getStatusBadge(project.status)}
                  </div>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="p-0 text-muted" as="div">
                      <FontAwesomeIcon icon={faEllipsisV} className="cursor-pointer" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => navigate(`/project/${project.id}`)}>
                        View Details
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => openEditModal(project)}>
                        <FontAwesomeIcon icon={faPencilAlt} className="me-2" />
                        Edit
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
                
                <Card.Text>{project.description}</Card.Text>
                
                <div className="mb-3">
                  <small className="text-muted">Progress</small>
                  <ProgressBar 
                    now={getProjectProgress(project.startDate, project.endDate)} 
                    label={`${getProjectProgress(project.startDate, project.endDate)}%`} 
                  />
                </div>
                
                <div className="mb-3">
                  <small className="text-muted">
                    Start: {new Date(project.startDate).toLocaleDateString()}
                    {project.endDate && (
                      <> | End: {new Date(project.endDate).toLocaleDateString()}</>
                    )}
                  </small>
                </div>
                
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  View Details
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
        {projects.length === 0 && (
          <Col xs={12}>
            <Card>
              <Card.Body className="text-center">
                <Card.Text>No projects available. Create your first project!</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Modal show={createModalVisible} onHide={() => setCreateModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateProject}>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={newProject.status}
                onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCreateModalVisible(false)} disabled={isCreatingProject}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateProject}
            disabled={isCreatingProject || !newProject.name || !newProject.startDate}
          >
            {isCreatingProject ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Creating...</>
            ) : (
              'Create Project'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={editModalVisible} onHide={() => setEditModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditProject}>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editData.status}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditModalVisible(false)} disabled={isUpdatingProject}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditProject}
            disabled={isUpdatingProject || !editData.name || !editData.startDate}
          >
            {isUpdatingProject ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Saving...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </Container>
  );
};

export default Projects; 