import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Container, Card, Button, Table, Modal, Form, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { API, graphqlOperation } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as subscriptions from '../../graphql/subscriptions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faFileExport } from '@fortawesome/free-solid-svg-icons';
import ActionItemsCard from '../shared/ActionItemsCard';
import { SwChart } from '../shared/charts';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import VideoUploadComponent from '../shared/VideoUploadComponent';

const ReportSw = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [text, setText] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [warning, setWarning] = useState("");
  const [xValue, setXValue] = useState("");
  const [yValue, setYValue] = useState("");
  const [date, setDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [timeUnit, setTimeUnit] = useState(null);
  const [totalCycleTime, setTotalCycleTime] = useState(0);
  const [refreshData, setRefreshData] = useState(false);
  const [timeGoal, setTimeGoal] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const types = ['Auto', 'Manual', 'Wait', 'Walk'];

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await fetchReportById();
      await fetchChartData();
      setIsLoading(false);
    };
    
    loadInitialData();
    const cleanup = subscribeToChartDataChanges();
    return () => cleanup();
  }, [reportId]);

  // Separate effect for refreshData changes
  useEffect(() => {
    if (!isLoading) {
      fetchChartData();
    }
  }, [refreshData, isLoading]);

  useEffect(() => {
    // Calculate total cycle time only when data changes
    const total = data.reduce((total, item) => {
      return total + parseFloat(item.value || 0);
    }, 0);
    setTotalCycleTime(total);
  }, [data]);

  const fetchChartData = async () => {
    try {
      console.log("Fetching chart data for reportID:", reportId);
      let allItems = [];
      let nextToken = null;
      
      // Fetch all pages of data
      do {
        const result = await API.graphql({
          query: queries.listChartData,
          variables: {
            filter: { 
              reportID: { eq: reportId },
              _deleted: { ne: true }  // Explicitly filter out deleted items
            },
            limit: 100, // Fetch up to 100 items per page
            nextToken: nextToken
          }
        });
        
        const items = result.data.listChartData.items;
        allItems = [...allItems, ...items];
        nextToken = result.data.listChartData.nextToken;
        
        console.log(`Fetched ${items.length} items, total so far: ${allItems.length}`);
      } while (nextToken);
      
      console.log("Total chart data items fetched:", allItems.length);
      
      // Sort by orderIndex
      const sortedData = [...allItems].sort((a, b) => 
        (a.orderIndex || 0) - (b.orderIndex || 0)
      );
      
      setData(sortedData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const fetchReportById = async () => {
    try {
      const result = await API.graphql({
        query: queries.getReport,
        variables: { id: reportId }
      });
      const fetchedReport = result.data.getReport;
      setReport(fetchedReport);

      // Set the time goal from target
      setTimeGoal(fetchedReport.target || '');

      // Set the time unit based on bones value
      setTimeUnit(
        fetchedReport.bones === 1 ? 'seconds' : 
        fetchedReport.bones === 2 ? 'minutes' : 
        fetchedReport.bones === 3 ? 'hours' : 
        ''
      );
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };

  const subscribeToChartDataChanges = () => {
    let subs = [];

    const createSubscription = API.graphql(graphqlOperation(subscriptions.onCreateChartData))
      .subscribe({
        next: ({ value }) => {
          if (value.data.onCreateChartData.reportID === reportId) {
            // Add new item to existing data instead of refetching all data
            const newItem = value.data.onCreateChartData;
            setData(prevData => {
              const updatedData = [...prevData, newItem];
              return updatedData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            });
          }
        }
      });

    const updateSubscription = API.graphql(graphqlOperation(subscriptions.onUpdateChartData))
      .subscribe({
        next: ({ value }) => {
          const updatedItem = value.data.onUpdateChartData;
          if (updatedItem.reportID === reportId) {
            setData(prevData => {
              // Replace the updated item in the array
              const updatedData = prevData.map(item => 
                item.id === updatedItem.id ? updatedItem : item
              );
              return updatedData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            });
          }
        }
      });

    const deleteSubscription = API.graphql(graphqlOperation(subscriptions.onDeleteChartData))
      .subscribe({
        next: ({ value }) => {
          const deletedItem = value.data.onDeleteChartData;
          if (deletedItem.reportID === reportId) {
            // Remove the deleted item from the array
            setData(prevData => prevData.filter(item => item.id !== deletedItem.id));
          }
        }
      });

    subs = [createSubscription, updateSubscription, deleteSubscription];

    return () => {
      subs.forEach(sub => {
        if (sub) sub.unsubscribe();
      });
    };
  };

  const chartData = data.map((d, index) => ({
    index: index + 1,
    start: parseFloat(d.posX || 0),
    end: parseFloat(d.posY || 0),
    id: d.id,
    Description: d.Description || '',
    text: d.text || '',
    orderIndex: d.orderIndex || 0,
  }));

  const isValidInput = () => {
    if (!text.trim() || !xValue.trim() || !yValue.trim()) {
      setWarning('All fields must be completed.');
      return false;
    }
    return true;
  };

  const computeDifferenceInMinutes = (startTime, endTime) => {
    const start = parseFloat(startTime);
    const end = parseFloat(endTime);
    return end - start;
  };

  const deleteData = async (item) => {
    try {
      // No need to fetch the latest version for deletion
      // Just delete using the id only since the DeleteChartDataInput only accepts 'id'
      const deleteResult = await API.graphql({
        query: mutations.deleteChartData,
        variables: {
          input: {
            id: item.id
            // Do not include _version as it's not in the DeleteChartDataInput schema
          }
        }
      });
      
      if (deleteResult.data && deleteResult.data.deleteChartData) {
        // We'll let the subscription handle removing the item from state
        setShowModal(false);
        setIsEditMode(false);
      } else {
        console.error("Deletion did not return expected data");
        // Still close modal but log the issue
        setShowModal(false);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error deleting chart data:", error);
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => console.error('GraphQL error:', err.message));
      }
      
      // Show an alert to the user
      setWarning(`Failed to delete: ${error.message || 'Unknown error'}`);
    }
  };

  const addOrUpdateData = async () => {
    if (!isValidInput()) {
      return;
    }

    const cycleTime = computeDifferenceInMinutes(xValue, yValue);

    try {
      if (isEditMode) {
        await API.graphql({
          query: mutations.updateChartData,
          variables: {
            input: {
              id: currentItem.id,
              text,
              value: String(cycleTime),
              Description: description,
              posX: String(xValue),
              posY: String(yValue),
              date: String(date),
              _version: currentItem._version
            }
          }
        });
        // We'll let the subscription handle updating the item in state
      } else {
        const result = await API.graphql({
          query: queries.listChartData,
          variables: {
            filter: { 
              reportID: { eq: reportId },
              _deleted: { ne: true }
            }
          }
        });
        const existingItems = result.data.listChartData.items;
        
        let maxOrderIndex = 0;
        if (existingItems.length > 0) {
          maxOrderIndex = Math.max(...existingItems.map(item => item.orderIndex || 0));
        }

        const nextOrderIndex = maxOrderIndex + 1;

        await API.graphql({
          query: mutations.createChartData,
          variables: {
            input: {
              text,
              value: String(cycleTime),
              Description: description,
              reportID: reportId,
              posX: String(xValue),
              posY: String(yValue),
              date: String(date),
              orderIndex: nextOrderIndex
            }
          }
        });
        // We'll let the subscription handle adding the new item to state
      }

      resetForm();
    } catch (error) {
      console.error("Error saving chart data:", error);
    }
  };

  const resetForm = () => {
    setText('');
    setValue('');
    setXValue('');
    setYValue('');
    setDescription('');
    setDate(new Date());
    setShowModal(false);
    setIsEditMode(false);
    setWarning('');
  };

  const handleDragEnd = useCallback(async (result) => {
    if (!result.destination) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    // Optimistically update the UI
    const items = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index,
    }));

    // Update local state immediately
    setData(updatedItems);

    try {
      // Update in database
      for (const updatedItem of updatedItems) {
        if (updatedItem.orderIndex !== data.find(d => d.id === updatedItem.id)?.orderIndex) {
          await API.graphql({
            query: mutations.updateChartData,
            variables: {
              input: {
                id: updatedItem.id,
                orderIndex: updatedItem.orderIndex,
                _version: updatedItem._version
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to update order in database:', error);
      // Revert on error
      setData(data);
    }
  }, [data]);

  const colorMap = {
    'Manual': '#efcc00',
    'Wait': '#FF0000',
    'Auto': '#008000',
    'Walk': '#800080',
  };

  const handleVideoUpload = async (videoKey) => {
    try {
      if (!report) return;

      const result = await API.graphql({
        query: queries.getReport,
        variables: { id: reportId }
      });
      
      const original = result.data.getReport;
      
      await API.graphql({
        query: mutations.updateReport,
        variables: {
          input: {
            id: reportId,
            media: videoKey,
            _version: original._version
          }
        }
      });

      setRefreshData(!refreshData);
      await fetchReportById();
    } catch (error) {
      console.error('Error updating report with video:', error);
    }
  };

  const handleSaveTimeSettings = async () => {
    try {
      if (!report) return;

      const input = {
        id: report.id,
        bones: timeUnit === 'seconds' ? 1 : timeUnit === 'minutes' ? 2 : timeUnit === 'hours' ? 3 : null,
        target: timeGoal ? String(timeGoal) : null,
        _version: report._version
      };

      const result = await API.graphql(
        graphqlOperation(mutations.updateReport, { input })
      );

      setReport(result.data.updateReport);
      setRefreshData(prev => !prev);
    } catch (error) {
      console.error('Error updating time settings:', error);
      console.log('Error details:', error.errors?.[0]?.message);
    }
  };

  if (!report) return <div>Loading...</div>;

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{report.name}</h2>
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={() => window.open(`/report_Chart/${reportId}`, '_blank')}
          >
            <FontAwesomeIcon icon={faFileExport} className="me-2" />
            Export PDF
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add Data/Operation
          </Button>
        </div>
      </div>

      <ActionItemsCard reportId={reportId} />

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Time Settings</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Time Goal (Takt Time)</Form.Label>
                <Form.Control
                  type="number"
                  value={timeGoal}
                  onChange={(e) => setTimeGoal(e.target.value)}
                  placeholder="Enter time goal"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Time Unit</Form.Label>
                <Form.Select
                  value={timeUnit}
                  onChange={(e) => setTimeUnit(e.target.value)}
                >
                  <option value="">Select unit</option>
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                className="mb-3 w-100"
                onClick={handleSaveTimeSettings}
              >
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Save Time Settings
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <VideoUploadComponent
        reportId={reportId}
        onVideoUpload={handleVideoUpload}
        initialVideo={report?.media}
        onSuccessfulSave={() => setRefreshData(prev => !prev)}
      />

      {chartData.length >= 3 ? (
        <>
          <Card className="mb-4">
            <Card.Body>
              <SwChart 
                data={chartData} 
                timeUnit={timeUnit}
                taktTime={parseFloat(timeGoal)}
                onBarPress={(item) => {
                  setCurrentItem(data.find(d => d.id === item.id));
                  setText(item.text);
                  setValue(item.value);
                  setXValue(item.posX);
                  setYValue(item.posY);
                  setDescription(item.Description);
                  setIsEditMode(true);
                  setShowModal(true);
                }}
              />
            </Card.Body>
          </Card>
          <div className="text-center mb-3">
            <p>Time format is set to {timeUnit}</p>
          </div>
        </>
      ) : (
        <Card className="mb-4">
          <Card.Body className="text-center">
            <p>Awesome! You have successfully generated the {report.type}.</p>
            <p>To add data simply click on the "+" button at the top of this page.</p>
            <p>Please add at least 3 data points to load the chart.</p>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body>
          {!isLoading && data.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="droppable" type="droppable-item">
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {data.map((item, index) => (
                      <Draggable 
                        key={`item-${item.id}`} 
                        draggableId={`drag-${item.id}`} 
                        index={index}
                        disableInteractiveElementBlocking>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="p-2 mb-2"
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: '#E3EEEC',
                          }}
                        >
                          <div className="mb-2">{item.Description}</div>
                          <div className="d-flex">
                            <div className="me-2 p-2 text-white" style={{ backgroundColor: '#0FB8B6', borderRadius: '5px' }}>
                              Start: {item.posX}
                            </div>
                            <div className="me-2 p-2 text-white" style={{ backgroundColor: '#FF0000', borderRadius: '5px' }}>
                              Stop: {item.posY}
                            </div>
                            <div className="me-2 p-2 text-white" style={{ backgroundColor: '#808080', borderRadius: '5px' }}>
                              <strong>Cycle Time: {item.value}</strong>
                            </div>
                            <div className="p-2 text-white" style={{ backgroundColor: colorMap[item.text], borderRadius: '5px' }}>
                              {item.text}
                            </div>
                            <Button
                              variant="link"
                              className="ms-auto"
                              onClick={() => {
                                setCurrentItem(item);
                                setText(item.text);
                                setValue(item.value);
                                setXValue(item.posX);
                                setYValue(item.posY);
                                setDescription(item.Description);
                                setIsEditMode(true);
                                setShowModal(true);
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          ) : (
            <div className="text-center text-muted">
              {isLoading ? "Loading data..." : "No data to display"}
            </div>
          )}

          {data.length > 0 && (
            <div className="mt-3">
              <strong>Total Cycle Time for all statements: {totalCycleTime}</strong>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={resetForm} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? "Edit Data" : "Add Data"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Start time in {timeUnit}</Form.Label>
              <Form.Control
                type="number"
                value={xValue}
                onChange={(e) => setXValue(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Stop/End Time in {timeUnit}</Form.Label>
              <Form.Control
                type="number"
                value={yValue}
                onChange={(e) => setYValue(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Select Type</Form.Label>
              <div className="d-flex gap-3">
                {types.map((type) => (
                  <Form.Check
                    key={type}
                    type="radio"
                    id={`type-${type}`}
                    label={type}
                    checked={text === type}
                    onChange={() => setText(type)}
                  />
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Total Cycle Time (generated on add)</Form.Label>
              <Form.Control
                type="text"
                value={value}
                disabled
              />
              <Form.Text className="text-muted">
                Total Cycle Time will appear at the bottom of all descriptions!
              </Form.Text>
            </Form.Group>
          </Form>

          {warning && (
            <div className="alert alert-danger">
              {warning}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isEditMode && (
            <Button
              variant="danger"
              onClick={() => deleteData(currentItem)}
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={resetForm}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addOrUpdateData}>
            {isEditMode ? "Update" : "Add"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReportSw; 