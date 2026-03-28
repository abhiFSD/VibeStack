import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Row,
  Col,
  Alert,
  Spinner
} from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faPlus,
  faCoins,
  faTrophy,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';
import { DEFAULT_AWARD_DEFINITIONS } from '../../utils/awardDefinitions';

// Define AwardType enum to match GraphQL schema
const AwardType = {
  QUIZ_PERFECT: 'QUIZ_PERFECT',
  QUIZ_MASTERY: 'QUIZ_MASTERY',
  REPORT_COMPLETE: 'REPORT_COMPLETE',
  PROJECT_COMPLETE: 'PROJECT_COMPLETE',
  ACTION_ITEM_COMPLETE: 'ACTION_ITEM_COMPLETE',
  HIGHLIGHT_ADDED: 'HIGHLIGHT_ADDED',
  VSM_COMPLETE: 'VSM_COMPLETE',
  CATEGORY_COMPLETE: 'CATEGORY_COMPLETE',
  STATEMENT_COMPLETE: 'STATEMENT_COMPLETE',
  FEEDBACK_PROVIDED: 'FEEDBACK_PROVIDED',
  TEAM_COLLABORATION: 'TEAM_COLLABORATION',
  FIRST_LOGIN: 'FIRST_LOGIN',
  PROFILE_COMPLETE: 'PROFILE_COMPLETE',
  WEEKLY_GOALS_MET: 'WEEKLY_GOALS_MET',
  MONTHLY_GOALS_MET: 'MONTHLY_GOALS_MET',
  CUSTOM_ACHIEVEMENT: 'CUSTOM_ACHIEVEMENT',
  KPI_GOAL_ACHIEVED: 'KPI_GOAL_ACHIEVED',
  LEARNING_TIME_MILESTONE: 'LEARNING_TIME_MILESTONE'
};

const AwardManagement = ({ organizationId }) => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAward, setEditingAward] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    coins: 0,
    title: '',
    description: '',
    isEnabled: true,
    customType: ''
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAwards();
  }, [organizationId]);

  const fetchAwards = async () => {
    try {
      // Use pagination to ensure we get all awards
      let allAwards = [];
      let nextToken = null;
      setLoading(true);
      
      do {
        console.log(`Fetching award definitions batch with nextToken: ${nextToken}`);
        
        const result = await API.graphql({
          query: queries.listAwardDefinitions,
          variables: {
            filter: {
              organizationID: { eq: organizationId },
              _deleted: { ne: true }
            },
            limit: 100,
            nextToken
          }
        });
        
        const batch = result.data.listAwardDefinitions.items;
        console.log(`Fetched ${batch.length} award definitions in this batch`);
        
        allAwards = [...allAwards, ...batch];
        nextToken = result.data.listAwardDefinitions.nextToken;
      } while (nextToken);
      
      console.log(`Total award definitions fetched: ${allAwards.length}`);
      setAwards(allAwards);
    } catch (error) {
      console.error('Error fetching awards:', error);
      setError('Failed to load awards');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const input = {
        ...formData,
        organizationID: organizationId,
        _version: editingAward?._version
      };

      if (editingAward) {
        // Update existing award
        await API.graphql({
          query: mutations.updateAwardDefinition,
          variables: {
            input: {
              id: editingAward.id,
              ...input
            }
          }
        });
      } else {
        // Create new award
        await API.graphql({
          query: mutations.createAwardDefinition,
          variables: { input }
        });
      }

      setShowModal(false);
      setError(null);
      fetchAwards();
    } catch (error) {
      console.error('Error saving award:', error);
      setError('Failed to save award: ' + (error.errors?.[0]?.message || error.message));
    }
  };

  const handleEdit = (award) => {
    setEditingAward(award);
    setFormData({
      type: award.type,
      coins: award.coins,
      title: award.title,
      description: award.description,
      isEnabled: award.isEnabled,
      customType: award.customType || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (awardId, version) => {
    if (window.confirm('Are you sure you want to delete this award?')) {
      try {
        await API.graphql({
          query: mutations.deleteAwardDefinition,
          variables: {
            input: { 
              id: awardId
            }
          }
        });
        setError(null);
        fetchAwards();
      } catch (error) {
        console.error('Error deleting award:', error);
        setError('Failed to delete award: ' + (error.errors?.[0]?.message || error.message));
      }
    }
  };

  const initializeDefaultAwards = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Starting to initialize ${DEFAULT_AWARD_DEFINITIONS.length} default awards from awardDefinitions.js...`);
      
      // Get existing award definitions to avoid duplicates
      let existingAwardDefs = [];
      let nextToken = null;
      
      do {
        const result = await API.graphql({
          query: queries.listAwardDefinitions,
          variables: {
            filter: {
              organizationID: { eq: organizationId },
              _deleted: { ne: true }
            },
            limit: 100,
            nextToken
          }
        });
        
        existingAwardDefs = [...existingAwardDefs, ...result.data.listAwardDefinitions.items];
        nextToken = result.data.listAwardDefinitions.nextToken;
      } while (nextToken);
      
      // Create a map of existing award definitions by type and customType
      const existingMap = new Map();
      existingAwardDefs.forEach(def => {
        const key = def.type + (def.customType ? `-${def.customType}` : '');
        existingMap.set(key, def);
      });
      
      console.log(`Found ${existingMap.size} existing award definitions`);
      
      // Filter out awards that already exist
      const awardsToCreate = DEFAULT_AWARD_DEFINITIONS.filter(def => {
        const key = def.type + (def.customType ? `-${def.customType}` : '');
        return !existingMap.has(key);
      });
      
      if (awardsToCreate.length === 0) {
        setError('All awards already exist. No new awards were created.');
        setLoading(false);
        return;
      }
      
      console.log(`Creating ${awardsToCreate.length} new award definitions...`);
      
      // Process awards in batches to avoid overwhelming the API
      const batchSize = 20;
      const batches = [];
      
      for (let i = 0; i < awardsToCreate.length; i += batchSize) {
        batches.push(awardsToCreate.slice(i, i + batchSize));
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each batch sequentially
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1} of ${batches.length} (${batch.length} awards)`);
        
        // Create a promise for each award in the batch
        const batchPromises = batch.map(def => 
          API.graphql({
            query: mutations.createAwardDefinition,
            variables: { 
              input: {
                ...def,
                organizationID: organizationId,
                isEnabled: true
              } 
            }
          }).then(result => {
            successCount++;
            return result;
          }).catch(error => {
            console.error(`Error creating award ${def.type}:`, error);
            errorCount++;
            return null; // Continue with other creations even if one fails
          })
        );
        
        // Wait for all operations in this batch to complete
        await Promise.all(batchPromises);
        console.log(`Completed batch ${i + 1}, success: ${successCount}, errors: ${errorCount}`);
      }
      
      console.log(`Award creation complete. Successfully created ${successCount} award definitions with ${errorCount} errors`);
      
      if (errorCount > 0) {
        setError(`Some awards failed to create. Created ${successCount} out of ${awardsToCreate.length} (${errorCount} errors)`);
      } else {
        setError(null);
      }
      
      // Fetch the updated list of awards
      await fetchAwards();
    } catch (error) {
      console.error('Error initializing default awards:', error);
      setError('Failed to initialize default awards: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Function to delete all award definitions for this organization
  const deleteAllAwards = async () => {
    try {
      if (!window.confirm('This will delete ALL existing award definitions AND all awarded instances for this organization. Are you sure?')) {
        return;
      }
      
      setLoading(true);
      setError(null);
      console.log('Deleting all award definitions and awarded instances...');
      console.log('Organization ID:', organizationId);
      
      // Step 1: Get all existing award definitions
      console.log('Fetching award definitions with organization ID:', organizationId);
      let existingDefinitions = [];
      let defNextToken = null;
      
      do {
        const definitionsResult = await API.graphql({
          query: queries.listAwardDefinitions,
          variables: {
            filter: {
              organizationID: { eq: organizationId }
              // Removed _deleted filter to ensure we get all items
            },
            limit: 100,
            nextToken: defNextToken
          }
        });
        
        const defBatch = definitionsResult.data.listAwardDefinitions.items.filter(item => !item._deleted);
        console.log(`Fetched ${defBatch.length} award definitions in this batch`);
        existingDefinitions = [...existingDefinitions, ...defBatch];
        defNextToken = definitionsResult.data.listAwardDefinitions.nextToken;
      } while (defNextToken);
      
      const totalDefinitions = existingDefinitions.length;
      console.log(`Found ${totalDefinitions} existing award definitions to delete`);
      
      // Step 2: Get all awarded instances for this organization
      console.log('Fetching awarded instances with organization ID:', organizationId);
      let allAwards = [];
      let awardNextToken = null;
      
      do {
        const awardsResult = await API.graphql({
          query: queries.listAwards,
          variables: {
            filter: {
              organizationID: { eq: organizationId }
              // Removed _deleted filter to ensure we get all items
            },
            limit: 100,
            nextToken: awardNextToken
          }
        });
        
        const awardBatch = awardsResult.data.listAwards.items.filter(item => !item._deleted);
        console.log(`Fetched ${awardBatch.length} awarded instances in this batch`);
        
        allAwards = [...allAwards, ...awardBatch];
        awardNextToken = awardsResult.data.listAwards.nextToken;
      } while (awardNextToken);
      
      const totalAwards = allAwards.length;
      console.log(`Found ${totalAwards} existing awarded instances to delete`);
      
      if (totalDefinitions === 0 && totalAwards === 0) {
        console.log('No awards to delete - checking if the organization ID is correct');
        console.log('Current organization ID used for queries:', organizationId);
        setError('No awards found to delete. This may be due to incorrect organization ID or the awards being assigned to a different organization.');
        setLoading(false);
        return;
      }

      // Step 3: Process award definitions in batches
      if (totalDefinitions > 0) {
        // Create batches of deletion operations (to avoid overwhelming the API)
        const batchSize = 25;
        const definitionBatches = [];
        
        for (let i = 0; i < totalDefinitions; i += batchSize) {
          const batch = existingDefinitions.slice(i, i + batchSize);
          definitionBatches.push(batch);
        }
        
        console.log(`Created ${definitionBatches.length} batches for award definitions`);
        
        // Delete each batch sequentially to ensure all are properly deleted
        for (let batchIndex = 0; batchIndex < definitionBatches.length; batchIndex++) {
          const batch = definitionBatches[batchIndex];
          console.log(`Processing definition batch ${batchIndex + 1} of ${definitionBatches.length} (${batch.length} awards)`);
          
          // Process all awards in this batch in parallel
          const batchPromises = batch.map(award => 
            API.graphql({
              query: mutations.deleteAwardDefinition,
              variables: {
                input: { id: award.id }
              }
            }).catch(error => {
              console.error(`Error deleting award definition ${award.id}:`, error);
              return null; // Continue with other deletions even if one fails
            })
          );
          
          // Wait for all deletions in this batch to complete
          await Promise.all(batchPromises);
          console.log(`Completed definition batch ${batchIndex + 1}`);
        }
        
        console.log('All award definitions deleted successfully');
      }
      
      // Step 4: Process awarded instances in batches
      if (totalAwards > 0) {
        // Create batches of deletion operations for awarded instances
        const batchSize = 25;
        const awardBatches = [];
        
        for (let i = 0; i < totalAwards; i += batchSize) {
          const batch = allAwards.slice(i, i + batchSize);
          awardBatches.push(batch);
        }
        
        console.log(`Created ${awardBatches.length} batches for awarded instances`);
        
        // Delete each batch sequentially
        for (let batchIndex = 0; batchIndex < awardBatches.length; batchIndex++) {
          const batch = awardBatches[batchIndex];
          console.log(`Processing awarded instances batch ${batchIndex + 1} of ${awardBatches.length} (${batch.length} awards)`);
          
          // Process all awards in this batch in parallel
          const batchPromises = batch.map(award => 
            API.graphql({
              query: mutations.deleteAwards,
              variables: {
                input: { id: award.id }
              }
            }).catch(error => {
              console.error(`Error deleting awarded instance ${award.id}:`, error);
              return null; // Continue with other deletions even if one fails
            })
          );
          
          // Wait for all deletions in this batch to complete
          await Promise.all(batchPromises);
          console.log(`Completed awarded instances batch ${batchIndex + 1}`);
        }
        
        console.log('All awarded instances deleted successfully');
      }
      
      // Refresh the awards list
      await fetchAwards();
      
      // Show success message
      setError(`Successfully deleted ${totalDefinitions} award definitions and ${totalAwards} awarded instances`);
      setTimeout(() => setError(null), 5000);
    } catch (error) {
      console.error('Error deleting awards:', error);
      console.error('Error details:', error.errors || error);
      setError('Failed to delete awards: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchAwards();
    } catch (error) {
      console.error('Error refreshing awards:', error);
      setError('Failed to refresh awards: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setRefreshing(false);
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
              Award Management
            </h4>
            <div className="d-flex">
              <Button
                variant="outline-primary"
                onClick={handleRefresh}
                disabled={refreshing}
                className="me-2"
              >
                <FontAwesomeIcon icon={faSyncAlt} className={refreshing ? "me-2 fa-spin" : "me-2"} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
              
              {awards.length > 0 && (
                <Button
                  variant="outline-danger"
                  onClick={deleteAllAwards}
                >
                  <FontAwesomeIcon icon={faTrash} className="me-2" />
                  Delete All Awards
                </Button>
              )}
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Awards content */}
          {awards.length === 0 ? (
            <div className="text-center">
              <Alert variant="info" className="d-flex align-items-center">
                <FontAwesomeIcon icon={faTrophy} className="text-info me-3 fs-4" />
                <div>
                  <strong>Welcome to Award Management!</strong>
                  <p className="mb-0">To get started, initialize the default awards for your organization. This will create a set of predefined awards that you can later customize.</p>
                </div>
              </Alert>
              <Button
                variant="primary"
                size="lg"
                className="mt-2"
                onClick={initializeDefaultAwards}
              >
                <FontAwesomeIcon icon={faTrophy} className="me-2" />
                Initialize Default Awards
              </Button>
            </div>
          ) : (
            // Self-executing function to help with variable scoping
            (() => {
              // Define hidden award types
              const hiddenAwardTypes = [
                'MONTHLY_GOALS_MET',
                'WEEKLY_GOALS_MET', 
                'PROFILE_COMPLETE',
                'TEAM_COLLABORATION',
                'HIGHLIGHT_ADDED',
                'FIRST_LOGIN',
                'FEEDBACK_PROVIDED',
                'STATEMENT_COMPLETE',
                'CATEGORY_COMPLETE',
                'REPORT_COMPLETE'
              ];
              
              // Filter out hidden awards from all displayed awards
              const visibleAwards = awards.filter(award => 
                !hiddenAwardTypes.includes(award.type)
              );
              
              // Categorize visible awards more specifically
              const reportAwards = visibleAwards.filter(award => 
                award.type === 'VSM_COMPLETE' || 
                (award.type === 'CUSTOM_ACHIEVEMENT' && award.customType && award.customType.includes('COMPLETE'))
              );
              
              const achievementAwards = visibleAwards.filter(award => 
                award.type === 'FIRST_LOGIN' || 
                award.type === 'PROFILE_COMPLETE' ||
                award.type === 'TEAM_COLLABORATION' ||
                award.type === 'HIGHLIGHT_ADDED' ||
                award.type === 'FEEDBACK_PROVIDED'
              );
              
              const goalAwards = visibleAwards.filter(award => 
                award.type === 'WEEKLY_GOALS_MET' || 
                award.type === 'MONTHLY_GOALS_MET' ||
                award.type === 'KPI_GOAL_ACHIEVED'
              );
              
              const quizAwards = visibleAwards.filter(award => 
                award.type === 'QUIZ_PERFECT' || 
                award.type === 'QUIZ_MASTERY'
              );
              
              const projectAwards = visibleAwards.filter(award => 
                award.type === 'PROJECT_COMPLETE' || 
                award.type === 'ACTION_ITEM_COMPLETE'
              );
              
              const learningAwards = visibleAwards.filter(award => 
                award.type === 'LEARNING_TIME_MILESTONE'
              );
              
              // Other awards not in the categories above
              const otherAwards = visibleAwards.filter(award => 
                !reportAwards.includes(award) && 
                !achievementAwards.includes(award) &&
                !goalAwards.includes(award) &&
                !quizAwards.includes(award) &&
                !projectAwards.includes(award) &&
                !learningAwards.includes(award)
              );
              
              // Display a table for each category
              const renderAwardTable = (categoryAwards, title) => {
                if (categoryAwards.length === 0) return null;
                
                return (
                  <div className="mb-5">
                    <h5 className="mb-3">{title}</h5>
                    <Table responsive>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Coins</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryAwards.map((award) => (
                          <tr key={award.id}>
                            <td>{award.title}</td>
                            <td>
                              <div>
                                <strong>{award.type}</strong>
                                {award.type === 'CUSTOM_ACHIEVEMENT' && award.customType && (
                                  <div className="text-muted small">
                                    Custom: {award.customType}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{award.description}</td>
                            <td>
                              <FontAwesomeIcon icon={faCoins} className="text-warning me-1" />
                              {award.coins}
                            </td>
                            <td>
                              <span className={`badge bg-${award.isEnabled ? 'success' : 'secondary'}`}>
                                {award.isEnabled ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="link"
                                className="text-primary p-0 me-3"
                                onClick={() => handleEdit(award)}
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button
                                variant="link"
                                className="text-danger p-0"
                                onClick={() => handleDelete(award.id, award._version)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                );
              };
              
              return (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">Total Award Definitions: {visibleAwards.length}</h6>
                  </div>
                  
                  {renderAwardTable(quizAwards, "Quiz Awards")}
                  {renderAwardTable(projectAwards, "Project Awards")}
                  {renderAwardTable(learningAwards, "Learning Time Awards")}
                  {renderAwardTable(reportAwards, "Report-Specific Awards")}
                  {renderAwardTable(goalAwards, "Goal Awards")}
                  {renderAwardTable(achievementAwards, "Achievement Awards")}
                  {renderAwardTable(otherAwards, "Other Awards")}
                </div>
              );
            })()
          )}

          <div style={{ marginBottom: '70px' }} />
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAward ? 'Edit Award' : 'Add New Award'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Award Type</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    <option value="">Select Type</option>
                    {Object.keys(AwardType).map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Coins</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.coins}
                    onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) })}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>

            {formData.type === 'CUSTOM_ACHIEVEMENT' && (
              <Form.Group className="mb-3">
                <Form.Label>Custom Type Name</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  required
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                label="Enable Award"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingAward ? 'Update' : 'Create'} Award
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AwardManagement; 