import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowsAltV, faArrowsAlt, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as subscriptionQueries from '../../graphql/subscriptions';
import CategoryCard from './CategoryCard';
import StatementModal from './StatementModal';
import CategoryDialogs from './CategoryDialogs';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import HighlightReports from './HighlightReports';

const CategoryList = ({
  reportId,
  categories,
  onChartDataNeedsRefresh,
  addVisible,
  setAddVisible,
  handleStarPress,
  refreshKey,
  onViewDetails,
  handleShowEmailDialog,
  onRefreshEmail,
  onRearrangePress,
  reportType
}) => {
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [dialogKey, setDialogKey] = useState(0);
  const [statementModalVisible, setStatementModalVisible] = useState(false);
  const [currentStatement, setCurrentStatement] = useState(null);
  const [isInputValid, setIsInputValid] = useState(true);
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [activeTab, setActiveTab] = useState(
    reportType === "A3 Project Report" ||
    reportType === "DMAIC Report" ||
    reportType === "PDCA Report" ||
    reportType === "Waste Walk Report"
      ? "HIGHLIGHTS REPORT"
      : "Departments"
  );
  const [rearrangeModalVisible, setRearrangeModalVisible] = useState(false);

  const defaultCategories = {
    '5S Report': [
      { id: '1', name: 'Sort' },
      { id: '2', name: 'Set In Order' },
      { id: '3', name: 'Shine' },
      { id: '4', name: 'Standardize' },
      { id: '5', name: 'Sustain' },
      { id: '6', name: 'Safety' },
    ],
    'Gemba Walk Report': [
      { id: '1', name: 'Human Resources' },
      { id: '2', name: 'Finance' },
      { id: '3', name: 'Production' },
      { id: '4', name: 'Quality' },
    ],
    'Leadership Report': [
      { id: 'id21', name: 'Continuous Improvement Project' },
      { id: 'id22', name: 'Employee/Staff Meetings' },
      { id: 'id23', name: 'Front Office area' },
      { id: 'id24', name: 'Quality Department' },
      { id: 'id25', name: 'Sales Department' },
      { id: 'id26', name: 'Technical Services' },
      { id: 'id27', name: 'Human Resources Department' },
      { id: 'id28', name: 'Accounting/Finance Department' },
    ],
    'Lean Assessment Report': [
      { id: '1023297ui6720hu', name: 'Leadership' },
      { id: '2weq328d09et52p', name: 'Customer Focus' },
      { id: '3drq8hau671bfge', name: 'Process Management' },
      { id: '2erf3gt8ijdb0oj', name: 'Staff (Employee) Management' },
      { id: '98nf12loj987y3d', name: 'Information/Analysis' },
    ],
    'Kaizen Project Report': [
      { id: '1023297ui6720hu', name: '(Prepare)' },
      { id: '2weq328d09et52p', name: 'Planning' },
      { id: '3drq8hau671bfge', name: 'PDCA - Implementation' },
      { id: '2erf3gt8ijdb0oj', name: 'Follow-Up' },
    ],
  };

  useEffect(() => {
    const storedValue = localStorage.getItem(`isHorizontal_${reportId}`);
    if (storedValue !== null) {
      setIsHorizontal(JSON.parse(storedValue));
    }
  }, [reportId]);

  useEffect(() => {
    localStorage.setItem(`isHorizontal_${reportId}`, JSON.stringify(isHorizontal));
  }, [isHorizontal, reportId]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index
    }));

    try {
      for (const item of updatedItems) {
        await API.graphql({
          query: mutations.updateCategories,
          variables: {
            input: {
              id: item.id,
              orderIndex: item.orderIndex,
              _version: item._version
            }
          }
        });
      }
      onChartDataNeedsRefresh();
    } catch (error) {
      console.error('Error updating category order:', error);
    }
  };

  const handleAdd = async () => {
    if (inputValue.trim() === '') {
      setIsInputValid(false);
      return;
    }

    try {
      const highestOrderIndex = categories.reduce(
        (max, cat) => Math.max(max, cat.orderIndex || 0),
        -1
      );

      const newCategory = {
        name: inputValue.trim(),
        reportID: reportId,
        orderIndex: highestOrderIndex + 1,
        description: '',
        assignees: [],
        attachments: []
      };

      const result = await API.graphql({
        query: mutations.createCategories,
        variables: { input: newCategory }
      });

      if (!result.data?.createCategories) {
        throw new Error('Failed to create category');
      }

      const savedCategory = result.data.createCategories;

      if (reportType === "Mistake Proofing Report") {
        const statementsToAdd = [
          {
            name: "Potential Score",
            value: 3,
            categoriesID: savedCategory.id,
            categoryName: savedCategory.name,
            default: false,
          },
          {
            name: "Consequences Score",
            value: 3,
            categoriesID: savedCategory.id,
            categoryName: savedCategory.name,
            default: false
          },
        ];

        for (const statement of statementsToAdd) {
          await API.graphql({
            query: mutations.createStatements,
            variables: { input: statement }
          });
        }
      }

      setInputValue('');
      setIsInputValid(true);
      setAddVisible(false);
      setDialogKey(prevKey => prevKey + 1);
      onChartDataNeedsRefresh();
    } catch (error) {
      console.error('Error creating category:', error);
      setIsInputValid(false);
    }
  };

  const handleEdit = async () => {
    try {
      await API.graphql({
        query: mutations.updateCategories,
        variables: {
          input: {
            id: currentCategory.id,
            name: inputValue,
            _version: currentCategory._version
          }
        }
      });

      setEditVisible(false);
      setInputValue('');
      onChartDataNeedsRefresh();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await API.graphql({
        query: mutations.deleteCategories,
        variables: {
          input: {
            id: currentCategory.id
          }
        }
      });

      setDeleteVisible(false);
      onChartDataNeedsRefresh();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const onAddStatement = (category) => {
    setCurrentCategory(category);
    setStatementModalVisible(true);
  };

  const onEditCategory = (category) => {
    setCurrentCategory(category);
    setInputValue(category.name);
    setEditVisible(true);
  };

  const onDeleteCategory = (category) => {
    setCurrentCategory(category);
    setDeleteVisible(true);
  };

  const isCategoryAdded = (categoryName) => {
    return categories.some((category) => category.name === categoryName);
  };

  const handleAddDefaultCategory = async (defaultCategory) => {
    if (!isCategoryAdded(defaultCategory.name)) {
      const highestOrderIndex = categories.reduce(
        (max, cat) => Math.max(max, cat.orderIndex || 0),
        -1
      );

      const newCategory = {
        name: defaultCategory.name,
        reportID: reportId,
        orderIndex: highestOrderIndex + 1
      };

      try {
        const result = await API.graphql({
          query: mutations.createCategories,
          variables: { input: newCategory }
        });

        if (!result.data?.createCategories) {
          throw new Error('Failed to create category');
        }

        await onChartDataNeedsRefresh();
      } catch (error) {
        console.error('Error creating default category:', error);
      }
    }
  };

  const renderDefaultCategories = () => {
    const defaultItems = defaultCategories[reportType] || [];
    
    return defaultItems.map((defaultItem) => (
      <div key={defaultItem.id} className="d-flex justify-content-between align-items-center mb-2">
        <span>{defaultItem.name}</span>
        <Button
          variant="link"
          className="p-0"
          disabled={isCategoryAdded(defaultItem.name)}
          onClick={() => handleAddDefaultCategory(defaultItem)}
        >
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
    ));
  };

  const renderCategories = () => (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="categories" direction={isHorizontal ? 'horizontal' : 'vertical'}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={isHorizontal ? 'd-flex flex-row overflow-auto' : ''}
          >
            {categories
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
              .map((category, index) => (
                <Draggable key={category.id} draggableId={category.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{ ...provided.draggableProps.style, margin: isHorizontal ? '0 8px' : '0 0 16px 0' }}
                      className={isHorizontal ? 'category-card-horizontal' : 'mb-3'}
                    >
                      <CategoryCard
                        key={category.id}
                        category={category}
                        onAddStatement={onAddStatement}
                        onEditCategory={onEditCategory}
                        onDeleteCategory={onDeleteCategory}
                        handleStarPress={handleStarPress}
                        refreshKey={refreshKey}
                        onChartDataNeedsRefresh={onChartDataNeedsRefresh}
                        reportType={reportType}
                        reportId={reportId}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );

  const RearrangeModal = ({ 
    show, 
    onHide, 
    categories, 
    onChartDataNeedsRefresh 
  }) => {
    const [localOrder, setLocalOrder] = useState([]);
  
    useEffect(() => {
      if (show) {
        setLocalOrder([...categories].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
      }
    }, [show, categories]);
  
    const moveCategory = (index, direction) => {
      if (!localOrder || localOrder.length === 0) return;
      if ((direction === -1 && index === 0) || (direction === 1 && index === localOrder.length - 1)) {
        return;
      }
  
      const newOrder = [...localOrder];
      const temp = newOrder[index];
      newOrder[index] = newOrder[index + direction];
      newOrder[index + direction] = temp;
      setLocalOrder(newOrder);
    };
  
    const handleSave = async () => {
      if (!localOrder || localOrder.length === 0) return;
      
      try {
        for (let i = 0; i < localOrder.length; i++) {
          const category = localOrder[i];
          await API.graphql({
            query: mutations.updateCategories,
            variables: {
              input: {
                id: category.id,
                orderIndex: i,
                _version: category._version
              }
            }
          });
        }
  
        onHide();
        await onChartDataNeedsRefresh();
      } catch (error) {
        console.error('Error updating category order:', error);
      }
    };
  
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Rearrange Categories</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {localOrder.map((category, index) => (
            <div key={category.id} className="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
              <span className="text-truncate me-2" style={{ maxWidth: '60%' }}>
                {category.name}
              </span>
              <div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => moveCategory(index, -1)}
                  disabled={index === 0}
                >
                  <FontAwesomeIcon icon={faArrowUp} />
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => moveCategory(index, 1)}
                  disabled={index === localOrder.length - 1}
                >
                  <FontAwesomeIcon icon={faArrowDown} />
                </Button>
              </div>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <Container fluid>
      {reportType === "Leadership Report" && (
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link
              active={activeTab === "Departments"}
              onClick={() => setActiveTab("Departments")}
            >
              Departments
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link
              active={activeTab === "HIGHLIGHTS REPORT"}
              onClick={() => setActiveTab("HIGHLIGHTS REPORT")}
            >
              Highlights Report
            </Nav.Link>
          </Nav.Item>
        </Nav>
      )}

      {activeTab === "Departments" && (
        <>
          <div className="list-header mb-4">
            <div className="header-content">
              <h5 className="mb-1">
                Total <span className="text-primary">{categories.length}</span> {' '}
                {reportType === 'Gemba Walk Report' || reportType === 'Leadership Report'
                  ? 'Departments'
                  : reportType === '5 Whys Report'
                    ? 'Problems'
                    : reportType === 'Mistake Proofing Report'
                      ? 'Potential Failure'
                      : reportType === 'Kaizen Project Report'
                        ? 'Phase'
                        : 'Categories'}
              </h5>
              <small className="text-muted d-block">App will remember this preference for all reports. ✨</small>
            </div>
            <div className="view-controls">
              <Button
                variant={isHorizontal ? "outline-primary" : "primary"}
                className="me-2"
                onClick={() => setIsHorizontal(false)}
              >
                <FontAwesomeIcon icon={faArrowsAltV} />
              </Button>
              <Button
                variant={isHorizontal ? "primary" : "outline-primary"}
                onClick={() => setIsHorizontal(true)}
              >
                <FontAwesomeIcon icon={faArrowsAlt} className="rotate-90" />
              </Button>
            </div>
          </div>

          <div className="rearrange-section text-center mb-4">
            <p className="mb-2">👆 Rearrange cards with the button below</p>
            <Button
              variant="primary"
              onClick={() => setRearrangeModalVisible(true)}
              className="rearrange-button"
            >
              <FontAwesomeIcon icon={faArrowsAlt} className="me-2" />
              Rearrange Categories
            </Button>
          </div>

          {renderCategories()}

          <Button
            variant="primary"
            className="position-fixed add-button"
            onClick={() => setAddVisible(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
          </Button>
        </>
      )}

      {activeTab === "HIGHLIGHTS REPORT" && (
        <HighlightReports
          reportId={reportId}
          onViewDetails={onViewDetails}
          handleShowEmailDialog={handleShowEmailDialog}
          onRefreshEmail={onRefreshEmail}
          reportType={reportType}
        />
      )}

      <CategoryDialogs
        reportType={reportType}
        editVisible={editVisible}
        setEditVisible={setEditVisible}
        inputValue={inputValue}
        setInputValue={setInputValue}
        handleEdit={handleEdit}
        addVisible={addVisible}
        setAddVisible={setAddVisible}
        handleAdd={handleAdd}
        isInputValid={isInputValid}
        setIsInputValid={setIsInputValid}
        renderDefaultCategories={renderDefaultCategories}
        dialogKey={dialogKey}
        deleteVisible={deleteVisible}
        setDeleteVisible={setDeleteVisible}
        handleDelete={handleDelete}
      />

      {statementModalVisible && (
        <StatementModal
          categoryId={currentCategory?.id}
          categoryName={currentCategory?.name}
          visible={statementModalVisible}
          onClose={() => setStatementModalVisible(false)}
          onStatementAdded={(options) => {
            if (!options?.keepOpen) {
              setStatementModalVisible(false);
            }
          }}
          reportType={reportType}
          reportId={reportId}
        />
      )}

      <RearrangeModal
        show={rearrangeModalVisible}
        onHide={() => setRearrangeModalVisible(false)}
        categories={categories}
        onChartDataNeedsRefresh={onChartDataNeedsRefresh}
      />

      <style jsx>{`
        .categories-container {
          display: flex;
          flex-direction: ${isHorizontal ? 'row' : 'column'};
          gap: 1rem;
          padding: 1rem;
          overflow-x: ${isHorizontal ? 'auto' : 'visible'};
          min-height: ${isHorizontal ? '0' : '100px'};
        }
        
        .categories-container.horizontal {
          flex-wrap: nowrap;
        }
        
        .category-item {
          flex: ${isHorizontal ? '0 0 350px' : '1'};
          margin-bottom: ${isHorizontal ? '0' : '1rem'};
        }
        
        .category-item.dragging {
          opacity: 0.5;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: #fff;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .header-content {
          flex: 1;
        }

        .view-controls {
          display: flex;
          gap: 0.5rem;
        }

        .rearrange-button {
          background-color: #00897b;
          border-color: #00897b;
        }

        .rearrange-button:hover {
          background-color: #00796b;
          border-color: #00796b;
        }

        .add-button {
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }

        .rotate-90 {
          transform: rotate(90deg);
        }
      `}</style>
    </Container>
  );
};

export default CategoryList;