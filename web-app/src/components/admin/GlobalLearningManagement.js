import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Spinner, Row, Col, Badge, Table, Modal } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faBook, faChartBar, faPlus, faSync, faGlobe, faTrash, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import tools from '../../json/tools.json';
import iconMappings from '../../utils/iconMappings';

const getIconForLearning = (title) => {
  // Find matching tool from tools.json
  const matchingTool = tools.find(tool => 
    tool.name.toLowerCase() === title.toLowerCase() ||
    title.toLowerCase().includes(tool.name.toLowerCase())
  );
  
  // If we found a matching tool, use its subtitle to get the icon
  if (matchingTool) {
    return iconMappings[matchingTool.subtitle] || iconMappings['VibeStack'];
  }
  
  // Directly try to find a matching icon
  const iconKey = Object.keys(iconMappings).find(key => 
    title.toLowerCase().includes(key.toLowerCase().replace(' report', ''))
  );
  
  return iconKey ? iconMappings[iconKey] : iconMappings['VibeStack'];
};

const GlobalLearningManagement = () => {
  const [globalLearnings, setGlobalLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [learningToDelete, setLearningToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGlobalLearnings();
  }, []);

  const fetchGlobalLearnings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch only default/global learnings
      const response = await API.graphql({
        query: queries.listLearnings,
        variables: {
          filter: {
            isDefault: { eq: true },
            _deleted: { ne: true }
          }
        }
      });

      const learningItems = response.data.listLearnings.items;
      console.log('Fetched global learnings:', learningItems);

      if (learningItems && learningItems.length > 0) {
        // Sort learnings by their order index
        const sortedLearnings = [...learningItems].sort((a, b) => {
          const orderA = a?.orderIndex || 0;
          const orderB = b?.orderIndex || 0;
          return orderA - orderB;
        });

        setGlobalLearnings(sortedLearnings);
      } else {
        setGlobalLearnings([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching global learnings:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGlobalLearnings();
    setRefreshing(false);
    setSuccessMessage('Global learning modules refreshed successfully');
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleCreateNewLearning = async () => {
    try {
      // Create a new learning module with default values
      const newLearningInput = {
        title: "New Global Learning Module",
        description: "Description for the new global learning module",
        isDefault: true, // Mark as global/default
        orderIndex: globalLearnings.length // Place at the end of the list
      };
      
      const response = await API.graphql({
        query: mutations.createLearning,
        variables: { input: newLearningInput }
      });
      
      const newLearning = response.data.createLearning;
      
      // Navigate to edit the new learning
      navigate(`/learning/${newLearning.id}/edit`);
    } catch (error) {
      console.error('Error creating new learning module:', error);
      setError('Failed to create new learning module. Please try again.');
    }
  };

  const handleEdit = (learningId) => {
    navigate(`/learning/${learningId}/edit`);
  };

  const handleQuizzes = (learningId) => {
    navigate(`/learning/${learningId}/quizzes`);
  };

  const handleRead = (learningId) => {
    navigate(`/learning/${learningId}/view`);
  };

  const handleDeleteClick = (learning) => {
    setLearningToDelete(learning);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!learningToDelete) return;
    
    setDeleting(true);
    try {
      await API.graphql({
        query: mutations.deleteLearning,
        variables: { input: { id: learningToDelete.id } }
      });
      
      setSuccessMessage(`Global learning module "${learningToDelete.title}" has been deleted successfully.`);
      setShowDeleteModal(false);
      setLearningToDelete(null);
      await fetchGlobalLearnings();
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error deleting learning module:', error);
      setError(`Failed to delete learning module: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setLearningToDelete(null);
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
    <Card>
      <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
        <h4 className="mb-0">
          <FontAwesomeIcon icon={faGlobe} className="me-2" />
          Global Learning Modules Management
        </h4>
        <div>
          <Button 
            variant="light" 
            size="sm" 
            className="me-2" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} className="me-1" />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            variant="success" 
            size="sm" 
            onClick={handleCreateNewLearning}
            disabled
            title="Module creation is currently disabled"
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            New Module
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Alert variant="info">
          <strong>Super Admin Tools:</strong> As a Super Administrator, you can directly edit global learning modules that are available to all organizations.
          Changes made here will affect all organizations using these modules.
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

        {globalLearnings.length === 0 ? (
          <Alert variant="warning">
            No global learning modules found. Click the "New Module" button to create one.
          </Alert>
        ) : (
          <Table responsive striped hover className="mt-3">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '30%' }}>Learning Module</th>
                <th style={{ width: '40%' }}>Description</th>
                <th style={{ width: '25%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {globalLearnings.map((learning, index) => (
                <tr key={learning.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <img 
                        src={getIconForLearning(learning.title)} 
                        alt={learning.title}
                        style={{ height: '30px', width: '30px', marginRight: '10px' }}
                      />
                      <div>
                        <div>{learning.title}</div>
                        <Badge bg="info" pill>
                          <FontAwesomeIcon icon={faGlobe} className="me-1" />
                          Global
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td>{learning.description || 'No description available'}</td>
                  <td>
                    <Button
                      variant="primary"
                      size="sm"
                      className="me-1"
                      onClick={() => handleRead(learning.id)}
                    >
                      <FontAwesomeIcon icon={faBook} className="me-1" /> View
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      className="me-1"
                      onClick={() => handleEdit(learning.id)}
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit
                    </Button>
                    <Button
                      variant="info"
                      size="sm"
                      className="me-1"
                      onClick={() => handleQuizzes(learning.id)}
                    >
                      <FontAwesomeIcon icon={faChartBar} className="me-1" /> Quizzes
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(learning)}
                      title="Delete this global learning module"
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" /> Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Delete Global Learning Module
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="mb-3">
            <strong>⚠️ Warning:</strong> This action cannot be undone!
          </Alert>
          
          <p className="mb-3">
            You are about to permanently delete the global learning module:
          </p>
          
          <div className="bg-light p-3 rounded mb-3">
            <strong>Module:</strong> {learningToDelete?.title}<br/>
            <strong>Description:</strong> {learningToDelete?.description || 'No description available'}
          </div>
          
          <Alert variant="warning">
            <strong>Impact:</strong>
            <ul className="mb-0 mt-2">
              <li>This will permanently remove the global learning module from the system</li>
              <li>All associated chapters, sections, and content will be deleted</li>
              <li>Any quizzes associated with this module will also be deleted</li>
              <li>Organizations that have cloned this module will keep their copies</li>
              <li>This action affects all organizations using this global module</li>
            </ul>
          </Alert>
          
          <p className="text-danger mb-0">
            <strong>Are you absolutely sure you want to proceed?</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm} 
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Deleting...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Yes, Delete Module
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default GlobalLearningManagement; 