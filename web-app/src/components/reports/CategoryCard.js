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
import AttachmentsWrapper from '../shared/AttachmentsWrapper';
import { compressImage } from '../../utils/imageUtils';

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
  const [attachmentURLs, setAttachmentURLs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
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

  // Add new useEffect for loading attachment URLs
  useEffect(() => {
    const loadAttachmentURLs = async () => {
      if (attachments && attachments.length > 0) {
        try {
          const urls = await Promise.all(
            attachments.map(async (key) => {
              try {
                return await Storage.get(key);
              } catch (error) {
                console.error('Error loading attachment:', key, error);
                return null;
              }
            })
          );
          setAttachmentURLs(urls.filter(url => url !== null));
        } catch (error) {
          console.error('Error loading attachments:', error);
        }
      }
    };

    loadAttachmentURLs();
  }, [attachments]);

  useEffect(() => {
    let subscriptions = [];

    if (category.id) {
      // Subscribe to statement creations
      const createSub = API.graphql({
        query: `
          subscription OnCreateStatements($filter: ModelSubscriptionStatementsFilterInput) {
            onCreateStatements(filter: $filter) {
              id
              name
              value
              default
              owner
              categoriesID
              categoryName
              reportID
              _version
              _deleted
              _lastChangedAt
              createdAt
              updatedAt
            }
          }
        `,
        variables: { 
          filter: { 
            categoriesID: { eq: category.id },
            _deleted: { ne: true },
            default: { ne: true }
          }
        }
      }).subscribe({
        next: ({ provider, value }) => {
          const newStatement = value.data.onCreateStatements;
          console.log('New statement created:', newStatement);
          if (newStatement && !newStatement._deleted) {
            setStatements(prev => [...prev, newStatement]);
            // Call refresh only if a new non-default statement is added
            if (!newStatement.default && onChartDataNeedsRefresh) {
              onChartDataNeedsRefresh({ preventRefresh: false });
            }
          }
        },
        error: error => console.warn('Create subscription error:', error)
      });

      // Subscribe to statement updates
      const updateSub = API.graphql({
        query: `
          subscription OnUpdateStatements($filter: ModelSubscriptionStatementsFilterInput) {
            onUpdateStatements(filter: $filter) {
              id
              name
              value
              default
              owner
              categoriesID
              categoryName
              reportID
              _version
              _deleted
              _lastChangedAt
              createdAt
              updatedAt
            }
          }
        `,
        variables: { 
          filter: { 
            categoriesID: { eq: category.id },
            _deleted: { ne: true },
            default: { ne: true }
          }
        }
      }).subscribe({
        next: ({ provider, value }) => {
          const updatedStatement = value.data.onUpdateStatements;
          console.log('Statement updated:', updatedStatement);
          if (updatedStatement && !updatedStatement._deleted) {
            let valueChanged = false;
            setStatements(prev =>
              prev.map(s => {
                if (s.id === updatedStatement.id) {
                  // Check if the value actually changed
                  if (s.value !== updatedStatement.value) {
                    valueChanged = true;
                  }
                  return updatedStatement;
                }
                return s;
              })
            );
            // Call refresh only if the value changed for a non-default statement
            if (valueChanged && !updatedStatement.default && onChartDataNeedsRefresh) {
              onChartDataNeedsRefresh({ preventRefresh: false });
            }
          }
        },
        error: error => console.warn('Update subscription error:', error)
      });

      // Subscribe to statement deletions
      const deleteSub = API.graphql({
        query: `
          subscription OnDeleteStatements($filter: ModelSubscriptionStatementsFilterInput) {
            onDeleteStatements(filter: $filter) {
              id
              name
              value
              default
              owner
              categoriesID
              categoryName
              reportID
              _version
              _deleted
              _lastChangedAt
              createdAt
              updatedAt
            }
          }
        `,
        variables: { 
          filter: { 
            categoriesID: { eq: category.id },
            _deleted: { ne: true },
            default: { ne: true }
          }
        }
      }).subscribe({
        next: ({ provider, value }) => {
          const deletedStatement = value.data.onDeleteStatements;
          console.log('Statement deleted:', deletedStatement);
          if (deletedStatement) {
            let statementExisted = false;
            setStatements(prev => {
                const filtered = prev.filter(s => s.id !== deletedStatement.id);
                statementExisted = filtered.length < prev.length;
                return filtered;
            });
            // Call refresh only if a statement was actually removed
            if (statementExisted && onChartDataNeedsRefresh) {
               onChartDataNeedsRefresh({ preventRefresh: false });
            }
          }
        },
        error: error => console.warn('Delete subscription error:', error)
      });

      subscriptions.push(createSub, updateSub, deleteSub);
    }

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing:', error);
        }
      });
    };
  }, [category.id, onChartDataNeedsRefresh]);

  const fetchStatements = async () => {
    if (!category.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await API.graphql({
        query: queries.statementsByCategoriesID,
        variables: {
          categoriesID: category.id,
          filter: { 
            _deleted: { ne: true },
            default: { ne: true }
          }
        }
      });
      const fetchedStatements = result.data.statementsByCategoriesID.items
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by creation time
      console.log('Fetched statements:', fetchedStatements);
      setStatements(fetchedStatements);
    } catch (error) {
      console.error('Error fetching statements:', error);
      setError('Failed to load statements');
    } finally {
      setIsLoading(false);
    }
  };

  const valueToName = (value) => {
    // If value is undefined or null, return "Select Value"
    if (value === undefined || value === null) {
      return "Select Value";
    }
    
    switch (value) {
      case 5: return "Strongly Agree";
      case 4: return "Agree";
      case 3: return "Neutral";
      case 2: return "Disagree";
      case 1: return "Strongly Disagree";
      default: return "Select Value";
    }
  };

  const PotenScore = (value) => {
    // If value is undefined or null, return "Select Value"
    if (value === undefined || value === null) {
      return "Select Value";
    }
    
    switch (value) {
      case 5: return "Excellent Chance";
      case 4: return "Good Chance";
      case 3: return "50 / 50";
      case 2: return "Rarely";
      case 1: return "Very Unlikely";
      default: return "Select Value";
    }
  };

  const ConseScore = (value) => {
    // If value is undefined or null, return "Select Value"
    if (value === undefined || value === null) {
      return "Select Value";
    }
    
    switch (value) {
      case 5: return "Most Severe";
      case 4: return "Severe";
      case 3: return "Moderate";
      case 2: return "Some Risk";
      case 1: return "Little Risk";
      default: return "Select Value";
    }
  };

  const handleValueChange = async () => {
    if (!currentStatement) return;
    try {
       const statementResult = await API.graphql({
         query: queries.getStatements,
         variables: { id: currentStatement.id }
       });

      const statementFromStore = statementResult.data.getStatements;
      if (!statementFromStore) throw new Error("Statement not found");

      const oldValue = statementFromStore.value;
      const newValue = selectedValue;

      await API.graphql({
        query: mutations.updateStatements,
        variables: {
          input: {
            id: currentStatement.id,
            value: newValue,
            _version: statementFromStore._version
          }
        }
      });

      setStatements(prev =>
        prev.map(s =>
          s.id === currentStatement.id ? { ...s, value: newValue } : s
        )
      );
      // Call refresh only if value actually changed
      if (oldValue !== newValue && onChartDataNeedsRefresh) {
        onChartDataNeedsRefresh({ preventRefresh: false });
      }
      setValueModalVisible(false);
      setCurrentStatement(null);
    } catch (error) {
      console.error('Error updating statement value:', error);
      // Handle error appropriately
    }
  };

  const renderStatements = () => {
    if (isLoading) {
      return (
        <div className="text-center py-3">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger" role="alert">
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
            {statement.name === "Potential Score" && reportType === "Mistake Proofing Report" && (
              <div className="text-muted small mt-1">
                How likely is it that this failure will happen?
              </div>
            )}
            {statement.name === "Consequences Score" && reportType === "Mistake Proofing Report" && (
              <div className="text-muted small mt-1">
                How severe would the impact be if this failure occurred?
              </div>
            )}
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

        if (onChartDataNeedsRefresh) onChartDataNeedsRefresh({ preventRefresh: false });
      } catch (error) {
        console.error('Error saving assignees:', error);
      }
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newAttachmentKeys = [];
      const newAttachmentURLs = [];

      for (const file of files) {
        // Compress the image if it's an image file, otherwise use the original
        const processedFile = file.type.startsWith('image/') 
          ? await compressImage(file) 
          : file;
          
        const key = `attachments/${Date.now()}-${file.name}`;
        await Storage.put(key, processedFile);
        
        const url = await Storage.get(key);
        newAttachmentURLs.push(url);
        newAttachmentKeys.push(key);
      }
      
      setAttachmentURLs(prev => [...prev, ...newAttachmentURLs]);
      const updatedAttachments = [...attachments, ...newAttachmentKeys];
      setAttachments(updatedAttachments);

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
            attachments: updatedAttachments,
            _version: original._version
          }
        }
      });

      if (onChartDataNeedsRefresh) onChartDataNeedsRefresh({ preventRefresh: false });
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (keyOrIndex) => {
    try {
      // Handle both key (string) and index (number) parameters
      let actualIndex;
      let keyToRemove;
      
      if (typeof keyOrIndex === 'number') {
        // If it's a number, use it as index
        actualIndex = keyOrIndex;
        keyToRemove = attachments[actualIndex];
      } else {
        // If it's a string (key), find the index
        actualIndex = attachments.findIndex(att => att === keyOrIndex);
        if (actualIndex === -1) {
          console.error('Attachment not found:', keyOrIndex);
          return;
        }
        keyToRemove = keyOrIndex;
      }
      
      // Note: Storage.remove is already called in UnifiedAttachments, so we don't need to call it again
      
      const newAttachments = attachments.filter((_, i) => i !== actualIndex);
      setAttachments(newAttachments);
      setAttachmentURLs(prev => prev.filter((_, i) => i !== actualIndex));

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
            attachments: newAttachments,
            _version: original._version
          }
        }
      });

      if (onChartDataNeedsRefresh) onChartDataNeedsRefresh({ preventRefresh: false });
    } catch (error) {
      console.error('Error deleting attachment:', error);
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <FontAwesomeIcon icon={faFileUpload} className="me-1" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
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

            {attachments.length > 0 && (
              <div>
                <strong>Attachments:</strong>
                <AttachmentsWrapper
                  attachments={attachments}
                  setAttachments={setAttachments}
                  attachmentURLs={attachmentURLs}
                  setAttachmentURLs={setAttachmentURLs}
                  onDeleteAttachment={handleDeleteAttachment}
                  useLegacyMode={true}
                  displayMode="grid"
                  showFilenames={true}
                  allowFullscreen={true}
                  thumbnailSize={120}
                  uploadConfig={{
                    multiple: true,
                    accept: "*/*",
                    compress: true
                  }}
                  emptyMessage="No attachments yet"
                />
              </div>
            )}
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
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDescriptionModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDescriptionSave}>
            Save
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
            <Form.Label>Add Assignees (separate by comma)</Form.Label>
            <Form.Control
              type="text"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              placeholder="Enter names..."
            />
          </Form.Group>
          <ListGroup>
            {assignees.map((assignee, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                {assignee}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRemoveAssignee(index)}
                >
                  Remove
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAssigneesModalVisible(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAssigneeSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Value Selection Modal */}
      <Modal show={valueModalVisible} onHide={() => setValueModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Value</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Value</Form.Label>
              {currentStatement?.name === "Potential Score" && (
                <div className="text-muted small mb-2">
                  How likely is it that this failure will happen?
                </div>
              )}
              {currentStatement?.name === "Consequences Score" && (
                <div className="text-muted small mb-2">
                  How severe would the impact be if this failure occurred?
                </div>
              )}
              <Form.Select
                value={selectedValue}
                onChange={(e) => setSelectedValue(Number(e.target.value))}
              >
                {currentStatement?.name === "Potential Score" ? (
                  <>
                    <option value={5}>Excellent Chance</option>
                    <option value={4}>Good Chance</option>
                    <option value={3}>50 / 50</option>
                    <option value={2}>Rarely</option>
                    <option value={1}>Very Unlikely</option>
                  </>
                ) : currentStatement?.name === "Consequences Score" ? (
                  <>
                    <option value={5}>Most Severe</option>
                    <option value={4}>Severe</option>
                    <option value={3}>Moderate</option>
                    <option value={2}>Some Risk</option>
                    <option value={1}>Little Risk</option>
                  </>
                ) : (
                  <>
                    <option value={5}>Strongly Agree</option>
                    <option value={4}>Agree</option>
                    <option value={3}>Neutral</option>
                    <option value={2}>Disagree</option>
                    <option value={1}>Strongly Disagree</option>
                  </>
                )}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setValueModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleValueChange}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .statement-text {
          flex: 1;
          margin-right: 1rem;
        }
        .statement-item {
          margin-bottom: 0.5rem;
        }
        .statement-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .attachment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .attachment-item {
          position: relative;
        }
        .attachment-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .delete-attachment-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: red;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
        }
        .delete-attachment-btn:hover {
          background: darkred;
        }
      `}</style>
    </>
  );
};

export default CategoryCard; 