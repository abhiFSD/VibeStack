import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge, Form, Modal, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash, faFileUpload, faUserPlus, faChevronDown, faChevronUp, faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Storage, API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as subscriptions from '../../graphql/subscriptions';
import staticData from '../../json/StaticData5s.json';
import GWData from '../../json/StaticDataGW.json';
import LOAData from '../../json/StatickDataLOA.json';
import KaizenData from '../../json/StaticDataKaizen.json';
import LeadershipData from '../../json/StaticDataLeadership.json';
import UnifiedAttachments from '../shared/UnifiedAttachments';

const CategoryCard = ({
  category,
  onAddStatement,
  onEditCategory,
  onDeleteCategory,
  handleStarPress,
  refreshKey,
  onChartDataNeedsRefresh,
  reportType,
  reportId
}) => {
  const [description, setDescription] = useState(category.description || '');
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [assigneesModalVisible, setAssigneesModalVisible] = useState(false);
  const [assignees, setAssignees] = useState(category.assignees || []);
  const [newAssignee, setNewAssignee] = useState('');
  const [attachments, setAttachments] = useState(category.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [statements, setStatements] = useState([]);
  const [valueModalVisible, setValueModalVisible] = useState(false);
  const [currentStatement, setCurrentStatement] = useState(null);
  const [selectedValue, setSelectedValue] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  // Update statements when refreshKey or category.id changes
  useEffect(() => {
    fetchStatements();
  }, [category.id, refreshKey]);

  // Calculate scores whenever statements change
  useEffect(() => {
    if (statements.length > 0 && (reportType === 'Lean Assessment Report' || reportType === 'Mistake Proofing Report' || reportType === '5S Report')) {
      // Filter out statements with no value or value === 0 (like root causes)
      const validStatements = statements.filter(s => s.value && s.value > 0);
      
      if (validStatements.length > 0) {
        const total = validStatements.reduce((sum, statement) => sum + statement.value, 0);
        const avg = total / validStatements.length;
        
        setTotalScore(total);
        setAverageScore(Math.round(avg * 100) / 100); // Round to 2 decimal places
      } else {
        setTotalScore(0);
        setAverageScore(0);
      }
    }
  }, [statements, reportType]);

  // Fetch statements for this category
  const fetchStatements = async () => {
    try {
      setIsLoading(true);
      const filter = {
        categoryID: { eq: category.id }
      };
      
      const result = await API.graphql({
        query: queries.listStatements,
        variables: { filter, limit: 1000 }
      });
      
      if (result.data?.listStatements?.items) {
        const sortedStatements = result.data.listStatements.items
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by creation time
        setStatements(sortedStatements);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
      setError('Failed to load statements');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unified attachments change
  const handleAttachmentsChange = async (newAttachments, changeType, metadata) => {
    try {
      setUploading(true);
      
      // Extract attachment keys from the new attachments
      const attachmentKeys = newAttachments.map(att => att.key || att);
      
      // Update local state
      setAttachments(attachmentKeys);
      
      // Update in database
      const result = await API.graphql({
        query: queries.getCategories,
        variables: { id: category.id }
      });
      
      if (!result?.data?.getCategories) {
        throw new Error('Category not found');
      }

      const original = result.data.getCategories;

      await API.graphql({
        query: mutations.updateCategories,
        variables: {
          input: {
            id: category.id,
            attachments: attachmentKeys,
            _version: original._version
          }
        }
      });

      // Update the category attachments in the UI immediately
      category.attachments = attachmentKeys;
      
      if (onChartDataNeedsRefresh) onChartDataNeedsRefresh({ preventRefresh: false });
    } catch (error) {
      console.error('Error updating attachments:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle upload start
  const handleUploadStart = (files) => {
    setUploading(true);
  };

  // Handle upload complete
  const handleUploadComplete = (uploadedFiles) => {
    setUploading(false);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async (attachment) => {
    return window.confirm('Are you sure you want to delete this attachment? This action cannot be undone.');
  };

  // Handle errors
  const handleError = (error) => {
    console.error('Attachment error:', error);
    setUploading(false);
    // Could show toast notification here
  };

  // Other existing functions would remain the same...
  const handleDescriptionSave = async () => {
    try {
      const result = await API.graphql({
        query: queries.getCategories,
        variables: { id: category.id }
      });
      
      if (!result?.data?.getCategories) {
        throw new Error('Category not found');
      }

      const original = result.data.getCategories;

      await API.graphql({
        query: mutations.updateCategories,
        variables: {
          input: {
            id: category.id,
            description: description,
            _version: original._version
          }
        }
      });

      // Update the category description in the UI immediately
      category.description = description;
      
      setDescriptionModalVisible(false);
      if (onChartDataNeedsRefresh) onChartDataNeedsRefresh({ preventRefresh: false });
    } catch (error) {
      console.error('Error saving description:', error);
    }
  };

  const handleAssigneeSave = async () => {
    if (newAssignee.trim()) {
      const newAssignees = [...assignees, ...newAssignee.split(',').map(name => name.trim())];
      setAssignees(newAssignees);
      setNewAssignee('');

      try {
        const result = await API.graphql({
          query: queries.getCategories,
          variables: { id: category.id }
        });
        
        if (!result?.data?.getCategories) {
          throw new Error('Category not found');
        }

        const original = result.data.getCategories;

        await API.graphql({
          query: mutations.updateCategories,
          variables: {
            input: {
              id: category.id,
              assignees: newAssignees,
              _version: original._version
            }
          }
        });

        // Update the category assignees in the UI immediately
        category.assignees = newAssignees;
        
        setAssigneesModalVisible(false);
        if (onChartDataNeedsRefresh) onChartDataNeedsRefresh({ preventRefresh: false });
      } catch (error) {
        console.error('Error saving assignees:', error);
      }
    }
  };

  const handleRemoveAssignee = async (index) => {
    const newAssignees = assignees.filter((_, i) => i !== index);
    setAssignees(newAssignees);

    try {
      const result = await API.graphql({
        query: queries.getCategories,
        variables: { id: category.id }
      });
      
      if (!result?.data?.getCategories) {
        throw new Error('Category not found');
      }

      const original = result.data.getCategories;

      await API.graphql({
        query: mutations.updateCategories,
        variables: {
          input: {
            id: category.id,
            assignees: newAssignees,
            _version: original._version
          }
        }
      });

      if (onChartDataNeedsRefresh) onChartDataNeedsRefresh({ preventRefresh: false });
    } catch (error) {
      console.error('Error removing assignee:', error);
    }
  };

  // Existing statement rendering functions would remain the same...
  const valueToName = (value) => {
    const names = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
    return names[value - 1] || 'Unknown';
  };

  const PotenScore = (value) => {
    const names = ['Low', 'Medium', 'High'];
    return names[value - 1] || 'Unknown';
  };

  const ConseScore = (value) => {
    const names = ['Low', 'Medium', 'High'];
    return names[value - 1] || 'Unknown';
  };

  const renderStatements = () => {
    if (isLoading) {
      return (
        <div className="text-center text-muted py-3">
          Loading statements...
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-danger py-3">
          {error}
        </div>
      );
    }

    if (statements.length === 0) {
      return (
        <div className="text-center text-muted py-3">
          No statements found
        </div>
      );
    }

    return statements.map(statement => (
      <div key={statement.id} className="statement-item">
        <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded mb-2">
          <span className="statement-text">
            {statement.name}
          </span>
          {reportType !== 'Gemba Walk Report' && 
           reportType !== 'Kaizen Project Report' && 
           reportType !== '5 Whys Report' && 
           reportType !== 'Leadership Report' ? (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                setCurrentStatement(statement);
                setSelectedValue(statement.value);
                setValueModalVisible(true);
              }}
            >
              {statement.name === "Potential Score" && reportType === "Mistake Proofing Report"
                ? PotenScore(statement.value)
                : statement.name === "Consequences Score" && reportType === "Mistake Proofing Report"
                ? ConseScore(statement.value)
                : valueToName(statement.value)}
            </Button>
          ) : reportType === '5 Whys Report' ? (
            <Button
              variant="link"
              className="p-0"
              onClick={() => handleStarPress(statement)}
            >
              <FontAwesomeIcon 
                icon={statement.value === 0 ? faStar : faStarRegular}
                className={statement.value === 0 ? 'text-success' : 'text-secondary'}
              />
            </Button>
          ) : null}
        </div>
        {statement.value === 0 && reportType === '5 Whys Report' && (
          <div className="text-success mb-2">
            <FontAwesomeIcon icon={faStar} className="me-2" />
            This is the root cause.
          </div>
        )}
      </div>
    ));
  };

  return (
    <>
      <Card className="mb-3">
        <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#00897b', color: 'white' }}>
          <div className="d-flex align-items-center">
            <h6 className="mb-0">{category.name}</h6>
            {(reportType === 'Lean Assessment Report' || reportType === 'Mistake Proofing Report' || reportType === '5S Report') && statements.length > 0 && (
              <div className="ms-3">
                <Badge bg="light" text="dark" className="me-2">
                  Total: {totalScore}
                </Badge>
                <Badge bg="light" text="dark">
                  Avg: {averageScore}
                </Badge>
              </div>
            )}
          </div>
          <div>
            {reportType !== "Mistake Proofing Report" && (
              <Button
                variant="link"
                className="p-0 me-2 text-white"
                onClick={() => onAddStatement(category)}
                title="Add Statement"
              >
                <FontAwesomeIcon icon={faPlus} />
              </Button>
            )}
            <Button
              variant="link"
              className="p-0 me-2 text-white"
              onClick={() => onEditCategory(category)}
              title="Edit Category"
            >
              <FontAwesomeIcon icon={faPencilAlt} />
            </Button>
            <Button
              variant="link"
              className="p-0 text-white"
              onClick={() => onDeleteCategory(category)}
              title="Delete Category"
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {renderStatements()}

          <div className="additional-details mt-3 p-3 bg-light rounded">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">Additional Details</h6>
              <div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => setDescriptionModalVisible(true)}
                >
                  <FontAwesomeIcon icon={faPencilAlt} className="me-1" />
                  Description
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setAssigneesModalVisible(true)}
                >
                  <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                  Assignees
                </Button>
              </div>
            </div>

            {category.description && (
              <div className="mb-3">
                <strong>Description:</strong>
                <div dangerouslySetInnerHTML={{ __html: category.description }} />
              </div>
            )}

            {assignees.length > 0 && (
              <div className="mb-3">
                <strong>Assignees:</strong>
                <div>{assignees.join(', ')}</div>
              </div>
            )}

            {/* Unified Attachments Component */}
            <div>
              <strong>Attachments:</strong>
              <UnifiedAttachments
                attachments={attachments}
                onAttachmentsChange={handleAttachmentsChange}
                uploadConfig={{
                  multiple: true,
                  accept: "*/*",
                  compress: true
                }}
                displayMode="grid"
                showFilenames={true}
                allowFullscreen={true}
                loading={uploading}
                onUploadStart={handleUploadStart}
                onUploadComplete={handleUploadComplete}
                onDelete={handleDeleteConfirm}
                onError={handleError}
                emptyMessage="No attachments yet. Click Upload to add files."
              />
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Description Modal */}
      <Modal show={descriptionModalVisible} onHide={() => setDescriptionModalVisible(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Description</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ReactQuill
            value={description}
            onChange={setDescription}
            style={{ height: '300px', marginBottom: '50px' }}
            modules={{
              toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                ['blockquote'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
              ]
            }}
            formats={[
              'header',
              'bold', 'italic', 'underline', 'strike', 'blockquote',
              'list', 'bullet',
              'link'
            ]}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDescriptionModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDescriptionSave}>
            Save Description
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Assignees Modal */}
      <Modal show={assigneesModalVisible} onHide={() => setAssigneesModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Manage Assignees</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Add Assignees (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              placeholder="Enter names separated by commas"
            />
          </Form.Group>
          
          {assignees.length > 0 && (
            <div>
              <h6>Current Assignees:</h6>
              <ListGroup>
                {assignees.map((assignee, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    {assignee}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveAssignee(index)}
                    >
                      Remove
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAssigneesModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAssigneeSave}>
            Save Assignees
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CategoryCard;