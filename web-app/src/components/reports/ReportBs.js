import React, { useState, useEffect } from 'react';
import { Container, Card, Button, ListGroup, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import ActionItemsCard from '../shared/ActionItemsCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFileExport } from '@fortawesome/free-solid-svg-icons';
import ReportChartView from '../ReportChartView';

const ReportBs = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [draggables, setDraggables] = useState([]);
  const [loading, setLoading] = useState(true);

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
      let allItems = [];
      let nextToken = null;
      
      // Fetch all pages of data
      do {
        const chartDataResult = await API.graphql({
          query: queries.listChartData,
          variables: {
            filter: { reportID: { eq: reportId } },
            limit: 100, // Fetch up to 100 items per page
            nextToken: nextToken
          }
        });
        
        const items = chartDataResult.data.listChartData.items.filter(item => !item._deleted);
        allItems = [...allItems, ...items];
        nextToken = chartDataResult.data.listChartData.nextToken;
        
        console.log(`Fetched ${items.length} items, total so far: ${allItems.length}`);
      } while (nextToken);
      
      console.log('Total chart data items fetched:', allItems.length);
      setDraggables(allItems);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setLoading(false);
    }
  };

  const openBoardView = () => {
    navigate(`/report/board/${reportId}`);
  };

  const exportPDF = () => {
    window.open(`/report/Charts/${reportId}`, '_blank');
  };

  const getCardContent = () => {
    if (!report) return null;

    switch (report.type) {
      case 'Fishbone Diagram Report':
        return {
          title: 'Dive Into Root Causes 🐟📊',
          description: [
            'Visualize and analyze the origins of your challenges using our comprehensive Fishbone Diagram Board 📋.',
            '📍 Identify and understand underlying issues at a glance! To dig deeper into causes or streamline your analyses, head over to the Diagram View. →'
          ]
        };
      case 'Impact Map Report':
        return {
          title: 'Chart Your Path to Impact 🌟🗺️',
          description: [
            'Visualize and strategize your goals with our intuitive Impact Map Board 📋.',
            '📍 Uncover key influences and relationships that drive outcomes! To delve deeper into strategic insights or fine-tune your map, navigate to the Board View. →'
          ]
        };
      case 'Stakeholder Analysis Report':
        return {
          title: 'Engage with Stakeholders 🤝📈',
          description: [
            'Deepen your understanding of stakeholders\' perspectives and interests using our Stakeholder Analysis Board 📋.',
            '📍 Prioritize and engage key stakeholders effectively! To further analyze or build relationships, navigate to the Board View. →'
          ]
        };
      default:
        return {
          title: 'Unleash Your Creativity 🧠💡',
          description: [
            'Manage and organize your innovative ideas with our dynamic Brainstorming Board 📋.',
            '📍 Tap into your full potential and discover new horizons! To contribute more ideas or refine existing ones, simply navigate to the Board View. →'
          ]
        };
    }
  };

  const getEmptyStateMessage = () => {
    if (!report) return '';
    
    switch (report.type) {
      case 'Fishbone Diagram Report':
        return 'Awesome! You have successfully generated the Fishbone Report. To view the board, Please select in this area to add your data for this Report! →';
      case 'Impact Map Report':
        return 'Awesome! You have successfully generated the Impact Map Report. To view the board, Please select in this area to add your data for this Report! →';
      case 'Stakeholder Analysis Report':
        return 'Awesome! You have successfully generated the Stakeholder Analysis Report. To view the board, Please select in this area to add your data for this Report! →';
      default:
        return 'Awesome! You have successfully generated the Brainstorming Report. To view the board, Please select in this area to add your data for this Report! →';
    }
  };

  const getListHeader = () => {
    if (!report) return '';
    
    if (report.type === 'Fishbone Diagram Report') {
      return "Causes You've Identified";
    } else if (report.type === 'Stakeholder Analysis Report' || report.type === 'Impact Map Report') {
      return "Labels You've Added";
    } else {
      return "Ideas You've Added";
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{report?.name}</h2>
        <div>
          <Button 
            variant="outline-primary" 
            onClick={exportPDF}
          >
            <FontAwesomeIcon icon={faFileExport} className="me-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <ActionItemsCard reportId={reportId} />

      <Card className="mb-4" onClick={openBoardView} style={{ cursor: 'pointer' }}>
        {draggables && draggables.length > 0 ? (
          <>
            <div style={{ height: '720px', position: 'relative' }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
                overflow: 'hidden'
              }}>
                <ReportChartView reportId={reportId} preview={true} />
              </div>
              <div 
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  cursor: 'pointer'
                }} 
                onClick={openBoardView}
              />
            </div>
            <Card.Body>
              <Card.Title>{getCardContent()?.title}</Card.Title>
              {getCardContent()?.description.map((text, index) => (
                <Card.Text key={index}>{text}</Card.Text>
              ))}
            </Card.Body>
          </>
        ) : (
          <Card.Body>
            <Card.Text>{getEmptyStateMessage()}</Card.Text>
          </Card.Body>
        )}
      </Card>

      {draggables && draggables.length > 0 && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">{getListHeader()}</h5>
          </Card.Header>
          <ListGroup variant="flush">
            {draggables.map((data, index) => (
              <ListGroup.Item 
                key={index}
                className="d-flex flex-column"
                style={{ backgroundColor: '#f9f9f9' }}
              >
                <div className="d-flex align-items-center">
                  <i className="fas fa-lightbulb me-2" style={{ color: data.textColor }} />
                  <span style={{ color: data.textColor, fontWeight: 'bold' }}>{data.text}</span>
                </div>
                <small className="text-muted mt-1">
                  Created At: {new Date(data.createdAt).toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: 'numeric', 
                    second: 'numeric', 
                    hour12: true 
                  })}
                </small>
                <small className="text-muted">
                  Updated At: {new Date(data.updatedAt || Date.now()).toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: 'numeric', 
                    second: 'numeric', 
                    hour12: true 
                  })}
                </small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card>
      )}
    </Container>
  );
};

export default ReportBs; 