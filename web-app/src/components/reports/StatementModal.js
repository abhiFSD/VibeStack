import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Nav, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV, faCheckCircle, faTimes, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { API, Auth } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import staticData from '../../json/StaticData5s.json';
import GWData from '../../json/StaticDataGW.json';
import LOAData from '../../json/StatickDataLOA.json';
import KaizenData from '../../json/StaticDataKaizen.json';
import LeadershipData from '../../json/StaticDataLeadership.json';
import { Formik } from 'formik';
import * as yup from 'yup';

const StatementModal = ({
  categoryId,
  visible,
  onClose,
  onStatementAdded,
  categoryName,
  reportId,
  reportType
}) => {
  const [statements, setStatements] = useState([]);
  const [defaultStatements, setDefaultStatements] = useState([]);
  const [staticStatements, setStaticStatements] = useState([]);
  const [mergedDefaultStatements, setMergedDefaultStatements] = useState([]);
  const [addVisible, setAddVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [currentStatement, setCurrentStatement] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [dialogKey, setDialogKey] = useState(0);
  const [isDefault, setIsDefault] = useState(false);
  const [currentUserSub, setCurrentUserSub] = useState(null);
  const [isInputValid, setIsInputValid] = useState(true);
  const [isAdding, setIsAdding] = useState(null);
  const [addedStatements, setAddedStatements] = useState(new Set());
  const [tab, setTab] = useState('statements');

  const name = reportType === '5 Whys Report' ? 'Whys' : 'Statement';

  const fetchUserDefaultStatements = async () => {
    try {
      // Query for all default statements created by the current user
      const result = await API.graphql({
        query: queries.listStatements,
        variables: {
          filter: {
            default: { eq: true },
            owner: { eq: currentUserSub },
            categoryName: { eq: categoryName },
            _deleted: { ne: true }
          }
        }
      });
      
      const userDefaultStatements = result.data.listStatements.items;
      return userDefaultStatements;
    } catch (error) {
      console.error('Error fetching user default statements:', error);
      return [];
    }
  };

  const statementValidationSchema = yup.object().shape({
    statementName: yup.string().required('Statement name is required')
  });

  useEffect(() => {
    getCurrentUserSub();
  }, []);

  const getCurrentUserSub = async () => {
    const currentUser = await Auth.currentAuthenticatedUser();
    setCurrentUserSub(currentUser.attributes.sub);
  };

  useEffect(() => {
    filterStaticStatements();
  }, [categoryName, reportType]);

  const filterStaticStatements = () => {
    const isGembaWalkReport = reportType === 'Gemba Walk Report';
    const isLeanAssessmentReport = reportType === 'Lean Assessment Report';
    const isKaizenProjectReport = reportType === 'Kaizen Project Report';
    const isLeadershipProjectReport = reportType === 'Leadership Report';
    const dataToFilter = 
      isGembaWalkReport ? GWData : 
      isLeanAssessmentReport ? LOAData : 
      isKaizenProjectReport ? KaizenData : 
      isLeadershipProjectReport ? LeadershipData :
      staticData;

    setStaticStatements(
      isGembaWalkReport || isLeadershipProjectReport
        ? dataToFilter
        : dataToFilter.filter(statement => statement.category_name === categoryName)
    );
  };

  useEffect(() => {
    mergeStatements();
  }, [statements, staticStatements, defaultStatements]);

  useEffect(() => {
    if (visible) {
      fetchStatements();
      filterStaticStatements();
      mergeStatements();
    }
  }, [categoryId, visible, reportType, categoryName]);

  const mergeStatements = async () => {
    // Get database default statements from the statements array
    const dbDefaultStatements = statements.filter(s => s.default === true);
    console.log('Database default statements:', dbDefaultStatements);
    
    // Get user's default statements for this category name across all reports
    const userDefaultStatements = await fetchUserDefaultStatements();
    console.log('User default statements:', userDefaultStatements);
    
    // Get static statements based on report type
    const relevantStaticStatements = reportType === 'Gemba Walk Report' || reportType === 'Leadership Report'
      ? staticStatements
      : staticStatements.filter(statement => statement.category_name === categoryName);
    console.log('Static statements:', relevantStaticStatements);
    
    // Combine all sources, removing duplicates by statement name
    const mergedStatements = [...dbDefaultStatements, ...userDefaultStatements, ...relevantStaticStatements]
      .filter((statement, index, self) => 
        index === self.findIndex(s => s.name === statement.name)
      );
      
    console.log('Merged statements:', mergedStatements);
    setMergedDefaultStatements(mergedStatements);
  };

  const fetchStatements = async () => {
    if (!categoryId) return;
    try {
      const result = await API.graphql({
        query: queries.statementsByCategoriesID,
        variables: {
          categoriesID: categoryId,
          filter: { _deleted: { ne: true } }
        }
      });
      const fetchedStatements = result.data.statementsByCategoriesID.items
        .filter(item => !item._deleted)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by creation time
      console.log('Fetched statements:', fetchedStatements);
      setStatements(fetchedStatements);
      
      // Update addedStatements Set with non-default statements
      const addedStatementsSet = new Set(fetchedStatements.filter(s => !s.default).map(s => s.name));
      setAddedStatements(addedStatementsSet);
    } catch (error) {
      console.error('Error fetching statements:', error);
    }
  };

  const handleAddDefaultToCategory = async (statement, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isAdding === statement.id || addedStatements.has(statement.name)) return;
    setIsAdding(statement.id);
    
    try {
      const input = {
        name: statement.name,
        categoriesID: categoryId,
        categoryName: categoryName,
        reportID: reportId,
        default: false,
        owner: currentUserSub,
        value: 3
      };

      await API.graphql({
        query: mutations.createStatements,
        variables: { input }
      });

      // Update local state first
      setAddedStatements(prev => new Set([...prev, statement.name]));
      
      // Fetch updated statements locally
      await fetchStatements();
      
      // Notify parent with keepOpen flag
      if (onStatementAdded) {
        onStatementAdded({ 
          keepOpen: true, 
          preventRefresh: true,
          statement: input 
        });
      }
    } catch (error) {
      console.error('Error adding statement:', error);
    } finally {
      setIsAdding(null);
    }
  };

  const handleAdd = async (values, { resetForm }) => {
    if (values.statementName.trim() === '') {
      setIsInputValid(false);
      return;
    }

    try {
      const owner = isDefault ? currentUserSub : null;
      let categoryString = categoryName ? categoryName.toString() : '';

      const input = {
        name: values.statementName.trim(),
        value: 3,
        default: false,
        categoriesID: categoryId,
        owner: owner,
        categoryName: categoryString,
        reportID: reportId
      };

      console.log('Creating statement with input:', input);

      const result = await API.graphql({
        query: mutations.createStatements,
        variables: { input }
      });

      console.log('Statement creation result:', result);

      if (isDefault && reportType !== '5 Whys Report') {
        await API.graphql({
          query: mutations.createStatements,
          variables: {
            input: {
              ...input,
              default: true
            }
          }
        });
      }

      setIsInputValid(true);
      setIsDefault(false);
      await fetchStatements();
      resetForm();
      
      if (onStatementAdded) {
        onStatementAdded({ keepOpen: true, preventRefresh: true });
      }
      
      setAddVisible(false);
    } catch (error) {
      console.error('Error adding statement:', error);
      console.error('Error details:', error.errors || error.message || error);
      // Keep the modal open on error
      setIsInputValid(false);
    }
  };

  const handleEdit = async (values) => {
    try {
      await API.graphql({
        query: mutations.updateStatements,
        variables: {
          input: {
            id: currentStatement.id,
            name: values.statementName,
            _version: currentStatement._version
          }
        }
      });
      await fetchStatements();
      setCurrentStatement(null);
      setEditVisible(false);
      if (onStatementAdded) {
        onStatementAdded({ keepOpen: true, preventRefresh: true });
      }
    } catch (error) {
      console.error('Error updating statement:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const getResult = await API.graphql({
        query: queries.getStatements,
        variables: { id: currentStatement.id }
      });
      
      if (!getResult?.data?.getStatements) {
        throw new Error('Statement not found');
      }

      await API.graphql({
        query: mutations.deleteStatements,
        variables: {
          input: {
            id: currentStatement.id,
          }
        }
      });

      await fetchStatements();
      setCurrentStatement(null);
      setDeleteVisible(false);
      if (onStatementAdded) {
        onStatementAdded({ keepOpen: true, preventRefresh: true });
      }
    } catch (error) {
      console.error('Error deleting statement:', error);
      alert('Failed to delete statement. Please try again.');
    }
  };

  const groupDefaultStatements = (statements) => {
    const groups = {};
    statements.forEach(statement => {
      const key = statement.category_name;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(statement);
    });
    return groups;
  };

  const groupedDefaultStatementsArray = reportType === 'Leadership Report'
    ? Object.entries(groupDefaultStatements(mergedDefaultStatements))
        .map(([category_name, statements]) => ({ category_name, statements }))
    : [];

  // Add cleanup effect
  useEffect(() => {
    return () => {
      setStatements([]);
      setAddedStatements(new Set());
      setIsAdding(null);
      setAddVisible(false);
      setCurrentStatement(null);
    };
  }, []);

  return (
    <>
      <Modal 
        show={visible} 
        onHide={onClose} 
        size="lg" 
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header className="bg-primary text-white">
          <Modal.Title>
            Adding {reportType === '5 Whys Report' ? 'Whys' : 'Statements'} to{' '}
            {reportType === 'Gemba Walk Report' || reportType === 'Leadership Report'
              ? 'Department'
              : reportType === 'Kaizen Project Report'
              ? 'Phase'
              : reportType === '5 Whys Report'
              ? 'Problem'
              : 'Category'}: {categoryName}
          </Modal.Title>
          <Button variant="link" className="text-white" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </Modal.Header>

        <Modal.Body>
          {reportType !== '5 Whys Report' && (
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link
                  active={tab === 'statements'}
                  onClick={() => setTab('statements')}
                >
                  Added Statements ({statements.filter(s => s.default !== true).length})
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={tab === 'defaultStatements'}
                  onClick={() => setTab('defaultStatements')}
                >
                  Default Statements ({mergedDefaultStatements.length})
                </Nav.Link>
              </Nav.Item>
            </Nav>
          )}

          {tab === 'statements' && (
            <div className="statements-list">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>
                  {reportType === '5 Whys Report' ? 'Whys' : 'Statements'}: Total{' '}
                  {statements.filter(s => s.default !== true).length}
                </h5>
              </div>
              <ListGroup>
                {statements
                  .filter(s => s.default !== true)
                  .map(statement => (
                    <ListGroup.Item
                      key={statement.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span className="statement-text">{statement.name}</span>
                      <div className="statement-actions">
                        <Button
                          variant="link"
                          onClick={() => {
                            setCurrentStatement(statement);
                            setInputValue(statement.name);
                            setEditVisible(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button
                          variant="link"
                          className="text-danger"
                          onClick={() => {
                            setCurrentStatement(statement);
                            setDeleteVisible(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
              </ListGroup>
            </div>
          )}

          {tab === 'defaultStatements' && (
            <div className="default-statements-list">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Default Statements: Total {mergedDefaultStatements.length}</h5>
              </div>
              <div className="alert alert-info">
                <div>The green checkmark indicates that the statement has been added to this category</div>
                <div>Edit and delete options are available for default statements you created</div>
              </div>
              {reportType === 'Leadership Report' ? (
                groupedDefaultStatementsArray.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-4">
                    <h6 className="mb-3">{group.category_name === 'undefined' ? 'Added By You' : group.category_name}</h6>
                    <ListGroup>
                      {group.statements.map(statement => (
                        <ListGroup.Item
                          key={statement.id || statement.name}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <div className="d-flex flex-column">
                            <span className="statement-text">{statement.name}</span>
                            {statement.owner === currentUserSub && (
                              <small className="text-muted">Created by you</small>
                            )}
                          </div>
                          <div className="statement-actions">
                            {addedStatements.has(statement.name) && (
                              <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                            )}
                            {statement.owner === currentUserSub && (
                              <>
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setCurrentStatement(statement);
                                    setInputValue(statement.name);
                                    setEditVisible(true);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faEdit} />
                                </Button>
                                <Button
                                  variant="link"
                                  className="text-danger"
                                  onClick={() => {
                                    setCurrentStatement(statement);
                                    setDeleteVisible(true);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </Button>
                              </>
                            )}
                            {isAdding === statement.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <Button
                                variant="link"
                                onClick={(e) => handleAddDefaultToCategory(statement, e)}
                                disabled={addedStatements.has(statement.name)}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </Button>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                ))
              ) : (
                <ListGroup>
                  {mergedDefaultStatements.map(statement => (
                    <ListGroup.Item
                      key={statement.id || statement.name}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div className="d-flex flex-column">
                        <span className="statement-text">{statement.name}</span>
                        {statement.owner === currentUserSub && (
                          <small className="text-muted">Created by you</small>
                        )}
                      </div>
                      <div className="statement-actions">
                        {addedStatements.has(statement.name) && (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                        )}
                        {statement.owner === currentUserSub && (
                          <>
                            <Button
                              variant="link"
                              onClick={() => {
                                setCurrentStatement(statement);
                                setInputValue(statement.name);
                                setEditVisible(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button
                              variant="link"
                              className="text-danger"
                              onClick={() => {
                                setCurrentStatement(statement);
                                setDeleteVisible(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </>
                        )}
                        {isAdding === statement.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <Button
                            variant="link"
                            onClick={(e) => handleAddDefaultToCategory(statement, e)}
                            disabled={addedStatements.has(statement.name)}
                          >
                            <FontAwesomeIcon icon={faPlus} />
                          </Button>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          )}

          <div className="mt-3">
            <Button variant="primary" onClick={() => setAddVisible(true)}>
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add {name}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Add Statement Modal */}
      <Modal 
        show={addVisible} 
        onHide={() => {
          setAddVisible(false);
          setIsDefault(false);
        }} 
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add {name}</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{ statementName: '' }}
          validationSchema={statementValidationSchema}
          onSubmit={handleAdd}
          enableReinitialize={true}
        >
          {({ handleSubmit, handleChange, values, touched, errors, resetForm }) => (
            <Form onSubmit={async (e) => {
              e.preventDefault();
              await handleSubmit(e);
              // Don't close the modal after submission
            }}>
              <Modal.Body>
                <Form.Group>
                  <Form.Label>{name} Name</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="statementName"
                    value={values.statementName}
                    onChange={handleChange}
                    isInvalid={touched.statementName && errors.statementName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.statementName}
                  </Form.Control.Feedback>
                </Form.Group>
                {reportType !== '5 Whys Report' && (
                  <Form.Check
                    type="checkbox"
                    label="Set as default"
                    checked={isDefault}
                    onChange={() => setIsDefault(!isDefault)}
                    className="mt-3"
                  />
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => {
                  resetForm();
                  setAddVisible(false);
                  setIsDefault(false);
                }}>
                  Close
                </Button>
                <Button variant="primary" type="submit">
                  Add {name}
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Edit Statement Modal */}
      <Modal 
        show={editVisible} 
        onHide={() => setEditVisible(false)}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit {name}</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{ statementName: inputValue }}
          validationSchema={statementValidationSchema}
          onSubmit={handleEdit}
        >
          {({ handleSubmit, handleChange, values, touched, errors }) => (
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Form.Group>
                  <Form.Label>{name} Name</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="statementName"
                    value={values.statementName}
                    onChange={handleChange}
                    isInvalid={touched.statementName && errors.statementName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.statementName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setEditVisible(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Delete Statement Modal */}
      <Modal 
        show={deleteVisible} 
        onHide={() => setDeleteVisible(false)}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete {name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this {name}?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteVisible(false)}>
            No
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .statement-text {
          flex: 1;
          margin-right: 1rem;
        }
        .statement-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .statements-list,
        .default-statements-list {
          max-height: 60vh;
          overflow-y: auto;
        }
      `}</style>
    </>
  );
};

export default StatementModal; 