import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faFileExport } from '@fortawesome/free-solid-svg-icons';
import ActionItemsCard from '../shared/ActionItemsCard';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Import chart components from shared directory
import { BarChart, ParetoChart, ScatterChart, RunChart } from '../shared/charts/index';

const ReportHg = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
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

  useEffect(() => {
    fetchReportData();
    fetchChartData();
  }, [reportId]);

  const fetchReportData = async () => {
    try {
      const reportResult = await API.graphql({
        query: queries.getReport,
        variables: { id: reportId }
      });
      setReport(reportResult.data.getReport);
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const result = await API.graphql({
        query: queries.chartDataByReportID,
        variables: {
          reportID: reportId,
          filter: {
            _deleted: { ne: true }
          }
        }
      });
      const fetchedData = result.data.chartDataByReportID.items;
      
      // Sort data immediately after fetching to match PDF view's sorting behavior
      if (report?.type === 'Pareto Chart Report') {
        fetchedData.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
      } else if (report?.type === 'Standard Work Report') {
        fetchedData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      } else if (report?.type === 'Run Chart Report') {
        fetchedData.sort((a, b) => new Date(a.date) - new Date(b.date));
      } else {
        // For Histogram and other reports - sort by date/createdAt ascending (oldest first) to match PDF
        fetchedData.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
      }
      
      setData(fetchedData);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const isValidInput = () => {
    if (report?.type === 'Scatter Plot Report') {
      if (!xValue.trim() || !yValue.trim()) {
        setWarning('X Value and Y Value cannot be empty for Scatter Plot Report.');
        return false;
      }
      return true;
    }

    if (report?.type === 'Run Chart Report') {
      if (!value.trim() || !date) {
        setWarning('Value and Date cannot be empty for Run Chart Report.');
        return false;
      }
      return true;
    }

    if (!text.trim() || !value.trim()) {
      setWarning('Label and Value cannot be empty.');
      return false;
    }
    return true;
  };

  const deleteData = async (item) => {
    try {
      console.log("Deleting item:", item);
      
      if (!item || !item.id) {
        console.error("Invalid item or missing ID:", item);
        setWarning("Cannot delete: Invalid data item");
        return;
      }
      
      // Create input object with id
      const deleteInput = { id: item.id };
      
      // Add _version only if it exists
      if (item._version) {
        deleteInput._version = item._version;
      }
      
      await API.graphql({
        query: mutations.deleteChartData,
        variables: {
          input: deleteInput
        }
      });
      
      console.log("Item deleted successfully:", item.id);
      const updatedData = data.filter(d => d.id !== item.id);
      setData(updatedData);
      setRefreshKey(prev => prev + 1);
      handleCloseModal();
    } catch (error) {
      console.error("Error deleting chart data:", error);
      setWarning(`Delete failed: ${error.message || "Unknown error"}`);
    }
  };

  const addOrUpdateData = async () => {
    if (!isValidInput()) {
      return;
    }

    try {
      if (isEditMode && currentItem) {
        // Try to get the latest version of the item
        let original = currentItem;
        
        try {
          const getResult = await API.graphql({
            query: queries.getChartData,
            variables: { id: currentItem.id }
          });
          
          if (getResult?.data?.getChartData) {
            original = getResult.data.getChartData;
          }
        } catch (err) {
          console.warn("Could not fetch latest item data for update, using current item:", err);
        }
        
        // Prepare update input with required fields
        const updateInput = {
          id: original.id,
          text: text,
          value: String(value),
          Description: description,
          posX: String(xValue),
          posY: String(yValue),
          date: date.toLocaleDateString()
        };
        
        // Add _version field only if it exists
        if (original._version) {
          updateInput._version = original._version;
        }
        
        const updateResult = await API.graphql({
          query: mutations.updateChartData,
          variables: {
            input: updateInput
          }
        });

        const updatedData = data.map(item =>
          item.id === original.id ? updateResult.data.updateChartData : item
        );
        setData(updatedData);
      } else {
        const createResult = await API.graphql({
          query: mutations.createChartData,
          variables: {
            input: {
              text: text,
              value: String(value),
              Description: description,
              reportID: reportId,
              posX: String(xValue),
              posY: String(yValue),
              date: date.toLocaleDateString()
            }
          }
        });
        setData([createResult.data.createChartData, ...data]);
      }

      resetForm();
      handleCloseModal();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error saving chart data:", error);
      setWarning(`Save failed: ${error.message || "Unknown error"}`);
    }
  };

  const resetForm = () => {
    setText('');
    setValue('');
    setXValue('');
    setYValue('');
    setDescription('');
    setDate(new Date());
    setWarning('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    resetForm();
  };

  const openEditModal = async (item) => {
    try {
      console.log("Opening edit modal for item:", item);
      
      let freshItem = item;
      
      // Try to fetch the latest version, but don't fail if it doesn't work
      try {
        const result = await API.graphql({
          query: queries.getChartData,
          variables: { id: item.id }
        });
        
        if (result?.data?.getChartData) {
          freshItem = result.data.getChartData;
          console.log("Fetched fresh item data:", freshItem);
        }
      } catch (err) {
        console.warn("Could not fetch latest item data, using provided item:", err);
      }
      
      // Set form values from the item data
      setText(freshItem.text || '');
      setValue(freshItem.value || '');
      setXValue(freshItem.posX || '');
      setYValue(freshItem.posY || '');
      setDate(freshItem.date ? new Date(freshItem.date) : new Date());
      setDescription(freshItem.Description || '');
      setCurrentItem(freshItem);
      setIsEditMode(true);
      setShowModal(true);
      setWarning("");
    } catch (error) {
      console.error("Error in openEditModal:", error);
      setWarning(`An error occurred: ${error.message || "Unknown error"}`);
    }
  };

  const handleEditClick = (item) => {
    openEditModal(item).catch(error => {
      console.error("Error in edit click handler:", error);
      setWarning("Failed to open edit modal");
    });
  };

  const calculateCumulativeDataValue = (chartData) => {
    let cumulativeValue = 0;
    const sortedData = [...chartData].sort((a, b) => b.value - a.value);
    const totalSum = sortedData.reduce((total, item) => total + parseFloat(item.value), 0);
    
    return sortedData.map((item) => {
      cumulativeValue += parseFloat(item.value);
      return {
        x: item.text,
        y: (cumulativeValue / totalSum) * 100,
      };
    });
  };

  const renderChart = () => {
    if (!report || data.length < 3) return null;

    const chartData = data.map(d => ({
      text: d.text,
      value: parseFloat(d.value),
      id: d.id,
      description: d.Description,
      xValue: d.posX,
      yValue: d.posY,
      date: d.date
    }));

    switch (report.type) {
      case "Pareto Chart Report":
        return <ParetoChart data={chartData} onBarClick={openEditModal} />;
      case "Scatter Plot Report":
        return <ScatterChart data={chartData} onPointClick={openEditModal} xaxis={report.media} yaxis={report.target} />;
      case "Run Chart Report":
        const sortedData = [...chartData].sort((a, b) => new Date(a.date) - new Date(b.date));
        return (
          <RunChart 
            data={sortedData} 
            onScatterPress={openEditModal}
            target={report.target || 0}
            xaxis={report.xaxis || "Date"}
            yaxis={report.yaxis || "Value"}
          />
        );
      default: // Histogram Report
        // Don't sort by value for histogram report to match PDF view behavior
        return <BarChart data={chartData} onBarClick={openEditModal} />;
    }
  };

  const handleDeleteClick = async () => {
    try {
      if (!currentItem) {
        setWarning("No item selected for deletion");
        return;
      }
      
      const confirmDelete = window.confirm("Are you sure you want to delete this data point?");
      if (!confirmDelete) {
        return;
      }
      
      await deleteData(currentItem);
    } catch (error) {
      console.error("Error in delete handler:", error);
      setWarning("Failed to delete item");
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
            Add Data
          </Button>
        </div>
      </div>

      <ActionItemsCard reportId={reportId} />

      {data.length >= 3 ? (
        <>
          {report.type === "Run Chart Report" && (
            <div className="text-center mb-3">
              <span className={report.trend ? 'text-success' : 'text-danger'}>
                Desired Trend: {report.trend ? "Positive (+)" : "Negative (-)"}
              </span>
            </div>
          )}

          {report.type === "Pareto Chart Report" && (
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p>👈 Left of vertical green line denotes VITAL FEW categories/labels.</p>
                    <p>👉 Right of vertical green line denotes TRIVIAL MANY categories/labels.</p>
                  </div>
                  <Button
                    variant="link"
                    onClick={() => alert("If green vertical line is between bar chart labeled categories, it denotes units from that adjacent bar chart (to the right) are included in the calculation. If visual distinction is not apparent, please consider tools such as 5 Whys, Fishbone, Brainstorming, Mind Mapping, Failure Mode and Effects Analysis (FMEA), etc.")}
                  >
                    <FontAwesomeIcon icon="info-circle" />
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          <div className="mb-4">
            {renderChart()}
          </div>
        </>
      ) : (
        <Card className="mb-4">
          <Card.Body className="text-center">
            <p>Awesome! You have successfully generated the {report.type}.</p>
            <p>To add data simply click on the "+" button at the top of this page.</p>
            <p>Please add at least 3 data points to load the chart.</p>
            {report.type === 'Histogram Report' && (
              <p>For a clear and balanced appearance, try to center the bins around the highest frequency or average value, with lower-frequency values distributed on either side.</p>
            )}
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                {report.type === 'Scatter Plot Report' ? (
                  <>
                    <th>X Value</th>
                    <th>Y Value</th>
                  </>
                ) : (
                  <>
                    {report.type !== "Run Chart Report" && <th>Label</th>}
                    <th>Value</th>
                  </>
                )}
                {report.type === "Run Chart Report" && <th>Date</th>}
                {report.type === "Pareto Chart Report" && <th>Cumulative %</th>}
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(report.type === 'Pareto Chart Report' ? 
                data.sort((a, b) => parseFloat(b.value) - parseFloat(a.value)) : 
                report.type === 'Standard Work Report' ?
                data.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)) :
                report.type === 'Run Chart Report' ? 
                data.sort((a, b) => new Date(a.date) - new Date(b.date)) : 
                data.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
              ).map((item) => (
                <tr key={item.id}>
                  {report.type === 'Scatter Plot Report' ? (
                    <>
                      <td>{item.posX}</td>
                      <td>{item.posY}</td>
                    </>
                  ) : (
                    <>
                      {report.type !== "Run Chart Report" && <td>{item.text}</td>}
                      <td>{item.value}</td>
                    </>
                  )}
                  {report.type === "Run Chart Report" && (
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                  )}
                  {report.type === "Pareto Chart Report" && (
                    <td>
                      {Math.round(calculateCumulativeDataValue(data)
                        .find(d => d.x === item.text)?.y || 0)}%
                    </td>
                  )}
                  <td>{item.Description}</td>
                  <td>
                    <Button
                      variant="link"
                      onClick={() => handleEditClick(item)}
                      className="p-0 me-2"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {report.type === "Pareto Chart Report" && data.length > 0 && (
            <div className="mt-3">
              <p>
                <strong>Total Units/Values:</strong>{' '}
                {data.reduce((total, item) => total + parseFloat(item.value), 0)}
              </p>
              <p className="text-success">
                <strong>Vital Few @ 80%:</strong>{' '}
                {Math.round(data.reduce((total, item) => total + parseFloat(item.value), 0) * 0.8)}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{isEditMode ? "Edit Data" : "Add Data"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {report.type === 'Scatter Plot Report' ? (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>X Value</Form.Label>
                  <Form.Control
                    type="text"
                    value={xValue}
                    onChange={(e) => setXValue(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Y Value</Form.Label>
                  <Form.Control
                    type="text"
                    value={yValue}
                    onChange={(e) => setYValue(e.target.value)}
                  />
                </Form.Group>
              </>
            ) : (
              <>
                {(report.type === 'Pareto Chart Report' || report.type === 'Histogram Report') && (
                  <Form.Group className="mb-3">
                    <Form.Label>Label</Form.Label>
                    <Form.Control
                      type="text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </Form.Group>
                )}
                <Form.Group className="mb-3">
                  <Form.Label>Value</Form.Label>
                  <Form.Control
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </Form.Group>
              </>
            )}

            {report.type === 'Run Chart Report' && (
              <Form.Group className="mb-3">
                <Form.Label>Date</Form.Label>
                <DatePicker
                  selected={date}
                  onChange={(date) => setDate(date)}
                  className="form-control"
                  dateFormat="MM/dd/yyyy"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          </Form>

          {warning && (
            <div className="alert alert-danger">{warning}</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isEditMode && (
            <Button
              variant="danger"
              onClick={handleDeleteClick}
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={handleCloseModal}>
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

export default ReportHg; 