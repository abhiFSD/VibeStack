import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { API } from 'aws-amplify';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as subscriptionQueries from '../../graphql/subscriptions';
import RadarChart from '../shared/charts/RadarChart';
import CategoryList from './CategoryList';
import ActionItemsCard from '../shared/ActionItemsCard';

const Report5s = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [noCategoriesFound, setNoCategoriesFound] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibleInfo, setVisibleInfo] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [currentHighlightId, setCurrentHighlightId] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [email, setEmail] = useState([]);
  const emailRef = useRef('');
  const [inputKey, setInputKey] = useState(0);
  const [refreshEmailKey, setRefreshEmailKey] = useState(0);
  const [dialogKey, setDialogKey] = useState(0);
  const [rearrangeModalVisible, setRearrangeModalVisible] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState({});
  const refreshInProgress = useRef(false);
  const subscriptions = useRef([]);

  const infoData = {
    // ... your info data object here
  };

  const getChartData = useCallback(async (options = {}) => {
    if (refreshInProgress.current || options.preventRefresh) return;
    refreshInProgress.current = true;
    setRefreshing(true);

    try {
      if (!reportId) {
        console.error('No reportId provided');
        return;
      }

      const categoriesResult = await API.graphql({
        query: queries.listCategories,
        variables: {
          filter: { 
            reportID: { eq: reportId },
            _deleted: { ne: true }
          },
          limit: 1000
        }
      });

      if (!categoriesResult?.data?.listCategories?.items) {
        console.error('Invalid categories response');
        setChartData([]);
        return;
      }

      const categories = categoriesResult.data.listCategories.items
        .filter(item => item && !item._deleted)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

      setCategories(categories);
      setNoCategoriesFound(!categories || categories.length === 0);

      const chartData = await Promise.all(
        categories.map(async (category) => {
          if (!category?.id) return null;

          try {
            const statementsResult = await API.graphql({
              query: queries.listStatements,
              variables: {
                filter: { 
                  categoriesID: { eq: category.id },
                  _deleted: { ne: true },
                  default: { ne: true }
                },
                limit: 1000
              }
            });

            if (!statementsResult?.data?.listStatements?.items) {
              return {
                id: category.id,
                name: category.name || 'Unnamed Category',
                avgValue: 1
              };
            }

            const statements = statementsResult.data.listStatements.items
              .filter(item => item && !item._deleted);

            if (!statements.length) {
              return { 
                id: category.id, 
                name: category.name || 'Unnamed Category', 
                avgValue: 1 
              };
            }

            let count = 0;
            const sumValues = statements.reduce((total, statement) => {
              if (statement && typeof statement.value === 'number') {
                count++;
                return total + statement.value;
              }
              return total;
            }, 0);

            return {
              id: category.id,
              name: category.name || 'Unnamed Category',
              avgValue: count > 0 ? sumValues / count : 1
            };
          } catch (error) {
            console.error(`Error fetching statements for category ${category.id}:`, error);
            return {
              id: category.id,
              name: category.name || 'Unnamed Category',
              avgValue: 1
            };
          }
        })
      );

      const validChartData = chartData.filter(Boolean);
      console.log('Updated chart data:', validChartData);
      setChartData(validChartData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
      setCategories([]);
    } finally {
      refreshInProgress.current = false;
      setRefreshing(false);
    }
  }, [reportId]);

  // Effect for initial report fetch
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await API.graphql({
          query: queries.getReport,
          variables: { id: reportId }
        });
        setReport(result.data.getReport);
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  // Effect for subscriptions
  useEffect(() => {
    const setupSubscription = (query, filter) => {
      const debounceTimeout = setTimeout(() => {
        getChartData();
      }, 500);

      const subscription = API.graphql({
        query,
        variables: { filter }
      }).subscribe({
        next: () => {
           console.log(`Subscription triggered for ${query.split(' ')[1]}`);
           clearTimeout(subscription.debounceTimeout);
           subscription.debounceTimeout = setTimeout(() => getChartData(), 500);
        },
        error: error => console.warn('Subscription error:', error)
      });

      subscription.clearInitialTimeout = () => clearTimeout(debounceTimeout);

      return subscription;
    };

    const reportFilter = {
        reportID: { eq: reportId }
    };

    const statementCreateFilter = {
        ...reportFilter,
        _deleted: { ne: true },
        default: { ne: true }
    };

    const categoryCreateFilter = {
        ...reportFilter,
        _deleted: { ne: true }
    };

    const subs = [
      setupSubscription(subscriptionQueries.onCreateStatements, statementCreateFilter),
      setupSubscription(subscriptionQueries.onDeleteStatements, reportFilter),
      setupSubscription(subscriptionQueries.onCreateCategories, categoryCreateFilter),
      setupSubscription(subscriptionQueries.onDeleteCategories, reportFilter)
    ];

    subscriptions.current = subs;

    return () => {
      subscriptions.current.forEach(subscription => {
        try {
          subscription.clearInitialTimeout();
          clearTimeout(subscription.debounceTimeout);
          subscription.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing:', error);
        }
      });
    };
  }, [reportId, getChartData]);

  const onViewDetails = (highlightTitle) => {
    const matchingInfo = infoData[highlightTitle];
    if (matchingInfo) {
      const formattedContent = matchingInfo.split('\n').join('\n');
      setDialogContent(formattedContent);
      setVisibleInfo(true);
    }
  };

  const handleStarPress = (statement) => {
    setSelectedStatement(statement);
    setVisible(true);
  };

  const handleDialogDismiss = () => {
    setVisible(false);
    setSelectedStatement(null);
  };

  const handleDialogConfirm = async () => {
    if (selectedStatement) {
      try {
        const statementResult = await API.graphql({
          query: queries.getStatements,
          variables: { id: selectedStatement.id }
        });
        
        const statementFromStore = statementResult.data.getStatements;
        
        if (statementFromStore && typeof statementFromStore.value !== 'undefined') {
          await API.graphql({
            query: mutations.updateStatements,
            variables: {
              input: {
                id: selectedStatement.id,
                value: statementFromStore.value === 0 ? 1 : 0,
                _version: statementFromStore._version
              }
            }
          });
        }
      } catch (error) {
        console.error('Error updating statement:', error);
      }
    }
    setRefreshKey(prevKey => prevKey + 1);
    handleDialogDismiss();
  };

  const renderChart = () => {
    if (!chartData || chartData.length < 3) {
      return <div className="text-center my-4">Please add at least 3 categories to view the chart</div>;
    } else {
      return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <RadarChart
            key={chartData.map(category => category.id)}
            labels={chartData.map(category => category.name)}
            data={chartData.map(category => isNaN(category.avgValue) ? 0 : category.avgValue)}
            height={250}
          />
        </div>
      );
    }
  };

  const handleExportPDF = () => {
    navigate(`/report_pdf/${reportId}`);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container>
        <Card className="mt-4">
          <Card.Body>
            <Card.Text className="text-center">Report not found</Card.Text>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Breadcrumb Navigation */}
      <Row className="mb-2">
        <Col>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Button 
                  variant="link" 
                  className="p-0 text-decoration-none"
                  onClick={() => navigate('/reports')}
                >
                  All Reports
                </Button>
              </li>
              <li className="breadcrumb-item">
                <Button 
                  variant="link" 
                  className="p-0 text-decoration-none"
                  onClick={() => navigate(`/reports?type=${encodeURIComponent(report.type)}`)}
                >
                  {report.type}
                </Button>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {report.name}
              </li>
            </ol>
          </nav>
        </Col>
      </Row>

      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="mb-0">{report.name}</h2>
        </Col>
        <Col xs="auto">
          <Button 
            variant="outline-primary"
            onClick={handleExportPDF}
            className="d-flex align-items-center gap-2"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            Export PDF
          </Button>
        </Col>
      </Row>

      {report.type !== "A3 Project Report" && report.type !== "Leadership Report" && <ActionItemsCard reportId={reportId} />}

      {report.type !== "A3 Project Report" && report.type !== "DMAIC Report" && 
       report.type !== "PDCA Report" && report.type !== "Waste Walk Report" && 
       noCategoriesFound && (
        <Card className="mb-4">
          <Card.Body className="text-center">
            <Card.Text>
              {`Awesome! You have successfully generated the ${report.type}. To categorize this report, simply click on the "+" button located at the bottom of this page.`}
            </Card.Text>
          </Card.Body>
        </Card>
      )}
      
      {report.type !== 'Gemba Walk Report' && 
       report.type !== 'Kaizen Project Report' && 
       report.type !== '5 Whys Report' && 
       report.type !== 'Leadership Report' && 
       report.type !== 'A3 Project Report' && 
       report.type !== 'DMAIC Report' && 
       report.type !== 'PDCA Report' && 
       report.type !== 'Waste Walk Report' && renderChart()}

      <Row>
        <Col>
          <CategoryList
            reportId={reportId}
            categories={categories}
            onChartDataNeedsRefresh={(options) => getChartData(options)}
            addVisible={addVisible}
            setAddVisible={setAddVisible}
            handleStarPress={handleStarPress}
            refreshKey={refreshKey}
            onViewDetails={onViewDetails}
            handleShowEmailDialog={(id) => setCurrentHighlightId(id)}
            onRefreshEmail={refreshEmailKey}
            onRearrangePress={() => setRearrangeModalVisible(true)}
            reportType={report.type}
          />
        </Col>
      </Row>

      <Modal show={visible} onHide={handleDialogDismiss}>
        <Modal.Header closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStatement && selectedStatement.value === 0 ? (
            <p>Unmark as root cause?</p>
          ) : (
            <p>Mark as root cause?</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleDialogDismiss}>No</Button>
          <Button variant="primary" onClick={handleDialogConfirm}>Yes</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={visibleInfo} onHide={() => setVisibleInfo(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Lean Thinking Statements</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {dialogContent.split('\n').map((item, index) => (
            <p key={index}>• {item}</p>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setVisibleInfo(false)}>Done</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Report5s; 