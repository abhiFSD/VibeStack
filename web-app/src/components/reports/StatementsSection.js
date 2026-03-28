import React, { useState, useEffect } from 'react';
import { Button, Form, Nav, ListGroup, Badge, Spinner, Collapse, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV, faCheckCircle, faTimes, faEdit, faTrash, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
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

const StatementsSection = ({
  categoryId,
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

  useEffect(() => {
    fetchStatements();
    filterStaticStatements();
  }, [categoryId, reportType]);

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

  const mergeStatements = () => {
    // Get database default statements from the statements array
    const dbDefaultStatements = statements.filter(s => s.default === true);
    console.log('Database default statements:', dbDefaultStatements);
    
    // Get static statements based on report type
    const relevantStaticStatements = reportType === 'Gemba Walk Report' || reportType === 'Leadership Report'
      ? staticStatements
      : staticStatements.filter(statement => statement.category_name === categoryName);
    console.log('Static statements:', relevantStaticStatements);
    
    // Combine both sources
    const mergedStatements = [...dbDefaultStatements, ...relevantStaticStatements];
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
        // Prevent the parent from triggering a full refresh
        onStatementAdded({ 
          keepOpen: true, 
          preventRefresh: true,
          statement: input // Pass the added statement data
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
      let categoryString = categoryName.toString();

      const input = {
        name: values.statementName,
        value: 3,
        default: false,
        categoriesID: categoryId,
        owner: owner,
        categoryName: categoryString,
        reportID: reportId
      };

      await API.graphql({
        query: mutations.createStatements,
        variables: { input }
      });

      if (isDefault) {
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
      setAddVisible(false);
      
      // Notify parent with keepOpen flag
      if (onStatementAdded) {
        // Prevent the parent from triggering a full refresh
        onStatementAdded({ 
          keepOpen: true, 
          preventRefresh: true,
          statement: input // Pass the added statement data
        });
      }
    } catch (error) {
      console.error('Error adding statement:', error);
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
      setCurrentStatement(null);
      setEditVisible(false);
      await fetchStatements();
      if (onStatementAdded) {
        await onStatementAdded({ keepOpen: true });
      }
    } catch (error) {
      console.error('Error updating statement:', error);
    }
  };

  const handleDelete = async () => {
    try {
      // First get the latest version of the statement
      const getResult = await API.graphql({
        query: queries.getStatements,
        variables: { id: currentStatement.id }
      });
      
      if (!getResult?.data?.getStatements) {
        throw new Error('Statement not found');
      }

      const latestStatement = getResult.data.getStatements;

      // Then delete with all required fields
      await API.graphql({
        query: mutations.deleteStatements,
        variables: {
          input: {
            id: currentStatement.id,
          }
        }
      });

      setCurrentStatement(null);
      setDeleteVisible(false);
      await fetchStatements();
      if (onStatementAdded) {
        await onStatementAdded({ keepOpen: true });
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
    <div className="statements-section mt-3">
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
          {reportType === 'Leadership Report' ? (
            groupedDefaultStatementsArray.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                <h6 className="mb-3">{group.category_name}</h6>
                <ListGroup>
                  {group.statements.map(statement => (
                    <ListGroup.Item
                      key={statement.id || statement.name}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <span className="statement-text">{statement.name}</span>
                      <div className="statement-actions">
                        {addedStatements.has(statement.name) && (
                          <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
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
                  <span className="statement-text">{statement.name}</span>
                  <div className="statement-actions">
                    {addedStatements.has(statement.name) && (
                      <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
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
        <Formik
          initialValues={{ statementName: '' }}
          validationSchema={statementValidationSchema}
          onSubmit={handleAdd}
        >
          {({ handleSubmit, handleChange, values, touched, errors, resetForm }) => (
            <Form onSubmit={handleSubmit} className="add-statement-form">
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder={`Add new ${reportType === '5 Whys Report' ? 'Why' : 'Statement'}...`}
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
                  className="mb-3"
                />
              )}
              <Button variant="primary" type="submit" size="sm">
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Add {reportType === '5 Whys Report' ? 'Why' : 'Statement'}
              </Button>
            </Form>
          )}
        </Formik>
      </div>

      <style jsx>{`
        .statements-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }
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
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 1rem;
        }
        .add-statement-form {
          background: white;
          padding: 1rem;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default StatementsSection; 