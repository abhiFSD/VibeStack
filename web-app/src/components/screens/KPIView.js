import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Badge, Form, Modal, Dropdown } from 'react-bootstrap';
import { API } from 'aws-amplify';
import { useParams, useNavigate } from 'react-router-dom';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCalendarAlt,
  faPlus,
  faPencilAlt,
  faTrash,
  faEllipsisV,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryLabel,
  VictoryScatter,
  VictoryTooltip,
  VictoryContainer
} from 'victory';
import { handleKPIGoalAchievedAward } from '../../utils/awards';

const KPIView = () => {
  const { kpiId } = useParams();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState(null);
  const [project, setProject] = useState(null);
  const [kpiData, setKpiData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [xAxisValue, setXAxisValue] = useState('');
  const [yAxisValue, setYAxisValue] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchKPIAndProjectData();
  }, [kpiId]);

  const fetchKPIAndProjectData = async () => {
    try {
      // Fetch KPI data
      const kpiResult = await API.graphql({
        query: queries.getKPI,
        variables: { id: kpiId }
      });
      
      const kpiData = kpiResult.data.getKPI;
      setKpi(kpiData);

      // Fetch project data
      const projectResult = await API.graphql({
        query: queries.getProject,
        variables: { id: kpiData.projectID }
      });
      
      setProject(projectResult.data.getProject);
      
      // Fetch KPI data points
      await fetchKPIData(kpiData.id);
    } catch (error) {
      console.error('Error fetching KPI and project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKPIData = async (kpiId) => {
    try {
      const response = await API.graphql({
        query: queries.kPIDataByKpiID,
        variables: { kpiID: kpiId }
      });
      const data = response.data.kPIDataByKpiID.items;
      setKpiData(data);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
    }
  };

  const checkAndAwardKPIGoal = async (newDataPoint) => {
    if (!kpi || !kpi.target || !project) return;

    const isGoalAchieved = kpi.trend
      ? parseFloat(newDataPoint.yAxisvalue) >= kpi.target  // Higher is better
      : parseFloat(newDataPoint.yAxisvalue) <= kpi.target; // Lower is better

    if (isGoalAchieved) {
      await handleKPIGoalAchievedAward(
        project.organizationID,
        project.id,
        kpi.title
      );
    }
  };

  const handleAddData = async () => {
    if (!xAxisValue.trim()) {
      alert('Please fill in the X-axis value');
      return;
    }

    const dateExists = kpiData.some(data => 
      new Date(data.date).toDateString() === date.toDateString() && 
      (!editingData || data.id !== editingData.id)
    );

    if (dateExists) {
      alert('A data point already exists for this date');
      return;
    }

    const yValue = yAxisValue.trim() ? parseFloat(yAxisValue) : null;

    try {
      let newData;
      if (editingData) {
        const result = await API.graphql({
          query: mutations.updateKPIData,
          variables: {
            input: {
              id: editingData.id,
              xAxisValue: xAxisValue.trim(),
              yAxisvalue: yValue,
              date: date.toISOString(),
              description: description.trim(),
              _version: editingData._version
            }
          }
        });
        newData = result.data.updateKPIData;
        setKpiData(prevData => 
          prevData.map(item => 
            item.id === newData.id ? newData : item
          )
        );
      } else {
        const result = await API.graphql({
          query: mutations.createKPIData,
          variables: {
            input: {
              kpiID: kpi.id,
              xAxisValue: xAxisValue.trim(),
              yAxisvalue: yValue,
              date: date.toISOString(),
              description: description.trim(),
              orderIndex: kpiData.length
            }
          }
        });
        newData = result.data.createKPIData;
        setKpiData(prevData => [...prevData, newData]);
      }

      // Check if KPI goal is achieved with this data point
      await checkAndAwardKPIGoal(newData);

      setModalVisible(false);
      resetForm();
      alert(`Data point ${editingData ? 'updated' : 'added'} successfully`);
    } catch (error) {
      console.error('Error saving KPI data:', error);
      alert(`Failed to ${editingData ? 'update' : 'add'} data point`);
    }
  };

  const resetForm = () => {
    setXAxisValue('');
    setYAxisValue('');
    setDescription('');
    setDate(new Date());
    setEditingData(null);
  };

  const handleEdit = (data) => {
    setXAxisValue(data.xAxisValue);
    setYAxisValue(data.yAxisvalue.toString());
    setDescription(data.description || '');
    setDate(new Date(data.date));
    setEditingData(data);
    setModalVisible(true);
  };

  const handleDelete = async (data) => {
    try {
      await API.graphql({
        query: mutations.deleteKPIData,
        variables: { 
          input: {
            id: data.id,
          }
        }
      });

      setKpiData(prevData => prevData.filter(item => item.id !== data.id));
      setDeleteDialogVisible(false);
      setItemToDelete(null);
      alert('Data point deleted successfully');
    } catch (error) {
      console.error('Error deleting KPI data:', error);
      alert('Failed to delete data point');
    }
  };

  const renderChart = () => {
    if (loading || !kpi || kpiData.length === 0) {
      return (
        <div className="text-center py-4">
          {loading ? (
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : (
            <p className="text-muted">No data available. Add at least one data point to view the chart.</p>
          )}
        </div>
      );
    }

    const chartData = kpiData.map(data => ({
      x: new Date(data.date),
      y: parseFloat(data.yAxisvalue),
      xAxisValue: data.xAxisValue,
      type: 'data'
    }));

    const importantDates = [
      {
        x: new Date(kpi.startDate),
        y: null,
        xAxisValue: 'KPI Start',
        label: 'KPI Start',
        type: 'milestone'
      },
      {
        x: new Date(kpi.endDate),
        y: null,
        xAxisValue: 'KPI End',
        label: 'KPI End',
        type: 'milestone'
      },
      {
        x: new Date(project.startDate),
        y: null,
        xAxisValue: 'Project Start',
        label: 'Project Start',
        type: 'milestone'
      },
      {
        x: new Date(project.endDate),
        y: null,
        xAxisValue: 'Project End',
        label: 'Project End',
        type: 'milestone'
      }
    ];

    const allDataPoints = [...chartData, ...importantDates]
      .sort((a, b) => a.x - b.x)
      .map((point, index) => ({
        ...point,
        indexPosition: index
      }));

    const POINT_SPACING = 70;
    const MIN_CHART_WIDTH = window.innerWidth - 100;
    const chartWidth = Math.max(
      allDataPoints.length * POINT_SPACING,
      MIN_CHART_WIDTH
    );

    return (
      <div className="chart-container" style={{ overflowX: 'auto' }}>
        <div style={{ width: chartWidth }}>
          <VictoryChart
            height={400}
            width={chartWidth}
            padding={{ top: 50, bottom: 100, left: 50, right: 50 }}
            domainPadding={{ x: 20, y: 20 }}
            scale={{ x: "linear", y: "linear" }}
            domain={{ 
              x: [-0.5, allDataPoints.length - 0.5],
              y: [0, Math.max(...chartData.map(d => d.y), kpi.target || 0) * 1.2]
            }}
            containerComponent={
              <VictoryContainer 
                responsive={false}
                style={{
                  touchAction: "auto"
                }}
              />
            }
          >
            <VictoryAxis
              dependentAxis
              label={kpi.yAxisLabel}
              style={{
                axis: { stroke: "#ccc" },
                grid: { stroke: "#e5e5e5", strokeWidth: 1 },
                axisLabel: { padding: 35, fontSize: 12 },
                tickLabels: { fontSize: 10 }
              }}
              tickFormat={(t) => Number(t).toFixed(1)}
            />
            <VictoryAxis
              label={kpi.xAxisLabel}
              style={{
                axis: { stroke: "#ccc" },
                grid: { stroke: "#e5e5e5", strokeWidth: 1 },
                axisLabel: { padding: 80, fontSize: 12 },
                tickLabels: { fontSize: 10, textAnchor: 'start' }
              }}
              tickValues={allDataPoints.map((_, index) => index)}
              tickFormat={(index) => {
                const point = allDataPoints[index];
                const dateStr = point.x.toLocaleDateString();
                return point.type === 'milestone' 
                  ? `${point.label}\n${dateStr}`
                  : `${point.xAxisValue}\n${dateStr}`;
              }}
              tickLabelComponent={
                <VictoryLabel 
                  dy={0}
                  dx={10}
                  textAnchor="start"
                  verticalAnchor="middle"
                  angle={90}
                />
              }
            />
            <VictoryLine
              data={chartData.map((point, index) => ({
                ...point,
                x: allDataPoints.findIndex(p => p.x.getTime() === point.x.getTime())
              }))}
              style={{
                data: { stroke: kpi.trend ? "#4CAF50" : "#F44336", strokeWidth: 2 }
              }}
            />
            <VictoryScatter
              data={allDataPoints.map((point, index) => ({
                ...point,
                x: index
              }))}
              size={({ datum }) => datum.type === 'milestone' ? 7 : 5}
              style={{
                data: {
                  fill: ({ datum }) => datum.type === 'milestone' ? "#FFA500" : (kpi.trend ? "#4CAF50" : "#F44336")
                }
              }}
              labels={({ datum }) => {
                const dateStr = new Date(datum.x).toLocaleDateString();
                return datum.type === 'milestone'
                  ? `${datum.label}\n${dateStr}`
                  : `${kpi.xAxisLabel}: ${datum.xAxisValue}\n${dateStr}\n${kpi.yAxisLabel}: ${datum.y}`;
              }}
              labelComponent={
                <VictoryTooltip
                  style={{ fontSize: 10 }}
                />
              }
            />
            {kpi.target && (
              <VictoryLine
                y={() => kpi.target}
                style={{
                  data: { stroke: "#4CAF50", strokeWidth: 2, strokeDasharray: "5,5" }
                }}
              />
            )}
          </VictoryChart>
        </div>
      </div>
    );
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

  if (!kpi || !project) {
    return (
      <Container className="py-4">
        <div className="alert alert-danger">KPI not found</div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-transparent border-0 pt-4 px-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h4 className="mb-1">{kpi.title}</h4>
              <div className="d-flex gap-2 align-items-center">
                <Badge bg={kpi.trend ? 'success' : 'danger'}>
                  {kpi.trend ? 'Positive' : 'Negative'} Trend
                </Badge>
                {kpi.target && (
                  <Badge bg="info">Target: {kpi.target}</Badge>
                )}
              </div>
            </div>
            <div className="d-flex gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  resetForm();
                  setModalVisible(true);
                }}
                style={{ minWidth: '140px' }}
              >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add Data Point
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  const baseURL = window.location.origin;
                  const kpiURL = `${baseURL}/kpi_pdf/${kpi.id}`;
                  window.open(kpiURL, '_blank', 'noopener,noreferrer');
                }}
                style={{ minWidth: '120px' }}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="px-4">
          {renderChart()}
        </Card.Body>
      </Card>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0 pt-4 px-4">
          <h5 className="mb-0">Data Points</h5>
        </Card.Header>
        <Card.Body className="px-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>{kpi.xAxisLabel}</th>
                  <th>{kpi.yAxisLabel}</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {kpiData.sort((a, b) => new Date(b.date) - new Date(a.date)).map((data) => (
                  <tr key={data.id}>
                    <td>{new Date(data.date).toLocaleDateString()}</td>
                    <td>{data.xAxisValue}</td>
                    <td>{data.yAxisvalue}</td>
                    <td>{data.description || '-'}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          variant="link"
                          className="p-0 text-primary"
                          onClick={() => handleEdit(data)}
                        >
                          <FontAwesomeIcon icon={faPencilAlt} />
                        </Button>
                        <Button
                          variant="link"
                          className="p-0 text-danger"
                          onClick={() => {
                            setItemToDelete(data);
                            setDeleteDialogVisible(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {kpiData.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No data points available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      {/* Add/Edit Data Point Modal */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingData ? 'Edit Data Point' : 'Add Data Point'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{kpi.xAxisLabel}</Form.Label>
              <Form.Control
                type="text"
                value={xAxisValue}
                onChange={(e) => setXAxisValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{kpi.yAxisLabel}</Form.Label>
              <Form.Control
                type="number"
                value={yAxisValue}
                onChange={(e) => setYAxisValue(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={date.toISOString().split('T')[0]}
                onChange={(e) => setDate(new Date(e.target.value))}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddData}>
            {editingData ? 'Update' : 'Add'} Data Point
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteDialogVisible} onHide={() => setDeleteDialogVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this data point? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteDialogVisible(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDelete(itemToDelete)}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .chart-container {
          min-height: 400px;
          margin-bottom: 2rem;
        }
      `}</style>
    </Container>
  );
};

export default KPIView; 