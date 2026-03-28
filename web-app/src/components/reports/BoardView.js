import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Button, Alert } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faArrowLeft, faEdit } from '@fortawesome/free-solid-svg-icons';
import Draggable from 'react-draggable';
import InputTextDialog from './InputTextDialog';
import EditDialog from './EditDialog';

const BoardView = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [draggables, setDraggables] = useState([]);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingText, setIsAddingText] = useState(false);
  const [error, setError] = useState(null);

  const fixedWidth = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 994 : 1024;
  const fixedHeight = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 590 : 640;
  const boneLength = 250;
  const gap = boneLength * 0.10;

  // Fetch report data
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const reportData = await API.graphql({
          query: queries.getReport,
          variables: { id: reportId }
        });
        setReport(reportData.data.getReport);
      } catch (error) {
        console.error('Error fetching report:', error);
      }
    };
    fetchReport();
  }, [reportId]);

  // Fetch chart data
  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching chart data for report:', reportId);
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
      
      console.log('Total chart data items fetched:', allItems.length, allItems);
      setDraggables(allItems);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError('Failed to load all items. Please refresh the page.');
      setTimeout(() => setError(null), 5000);
    }
  }, [reportId]);

  useEffect(() => {
    if (report) {
      fetchData();
    }
  }, [fetchData, report?.id]);

  const handleExportPDF = () => {
    window.open(`/report/Charts/${reportId}`, '_blank');
  };

  const addText = async ({ text, textColor }) => {
    if (isAddingText) {
      console.log('Add text already in progress, skipping...');
      return;
    }
    
    setIsAddingText(true);
    console.log('Adding text:', text, 'Current draggables count:', draggables.length);
    
    try {
      const posX = 500;
      const posY = 3;
    
      const createChartDataResult = await API.graphql({
        query: mutations.createChartData,
        variables: {
          input: {
            text,
            textColor,
            posX: posX.toString(),
            posY: posY.toString(),
            reportID: reportId,
          }
        }
      });
    
      const newChartData = createChartDataResult.data.createChartData;
      console.log('Created chart data:', newChartData);
      
      // Optimistically update the local state immediately
      setDraggables(prevDraggables => {
        const updated = [...prevDraggables, newChartData];
        console.log('Updated draggables count:', updated.length);
        return updated;
      });
      
      // Don't fetch data immediately after adding - trust the optimistic update
      // This prevents the race condition where the new item disappears
      
    } catch (error) {
      console.error('Error adding text:', error);
      setError('Failed to add text. Please try again.');
      // If creation failed, ensure UI is in sync with server
      fetchData();
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsAddingText(false);
    }
  };

  const handleDrag = async (_, data, id) => {
    try {
      // Fetch the latest version of the item first
      const getChartDataResult = await API.graphql({
        query: queries.getChartData,
        variables: { id }
      });
      
      const original = getChartDataResult.data.getChartData;

      if (!original) {
        console.error('Error: Item not found or may have been deleted');
        // Refresh data to ensure UI is in sync with server
        await fetchData();
        return;
      }

      // Then update with latest version
      const updateResult = await API.graphql({
        query: mutations.updateChartData,
        variables: {
          input: {
            id,
            posX: data.x.toString(),
            posY: data.y.toString(),
            _version: original._version
          }
        }
      });
      
      if (!updateResult.data || !updateResult.data.updateChartData) {
        console.error('Failed to update position');
        setError('Failed to update position. Please refresh the page.');
        await fetchData();
      } else {
        // Optimistically update local state
        setDraggables(prevDraggables => 
          prevDraggables.map(item => 
            item.id === id 
              ? { ...item, posX: data.x.toString(), posY: data.y.toString(), _version: updateResult.data.updateChartData._version }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error updating chart data position:', error);
      
      // Log detailed error information
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => console.error('GraphQL error:', err.message));
      }
      
      setError('Failed to save position. Your change may not be saved.');
      setTimeout(() => setError(null), 5000);
      
      // Refresh data to ensure UI is in sync with server
      await fetchData();
    }
  };

  const DraggableItem = ({ item }) => {
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef(null);

    return (
      <Draggable
        nodeRef={nodeRef}
        defaultPosition={{ x: parseFloat(item.posX), y: parseFloat(item.posY) }}
        onStart={() => setIsDragging(true)}
        onStop={(e, data) => {
          handleDrag(e, data, item.id);
          setTimeout(() => setIsDragging(false), 100);
        }}
      >
        <div
          ref={nodeRef}
          style={{
            position: 'absolute',
            cursor: 'move',
            padding: '16px',
            color: item.textColor,
            backgroundColor: 'transparent',
            userSelect: 'none',
            whiteSpace: 'pre-wrap',
            maxWidth: '350px'
          }}
          onClick={() => {
            if (!isDragging) {
              setEditDialog(true);
              setEditingItem(item);
            }
          }}
        >
          {item.text}
        </div>
      </Draggable>
    );
  };

  const renderStructure = () => {
    if (!report) return null;

    const commonStyles = {
      position: 'absolute',
      backgroundColor: 'black'
    };

    switch (report.type) {
      case 'Fishbone Diagram Report':
        return (
          <>
            {/* Spine */}
            <div style={{
              ...commonStyles,
              top: '50%',
              left: 40 + gap,
              width: fixedWidth - 310 - (2 * gap),
              height: '2px'
            }} />
            
            {/* Arrow */}
            <div style={{
              ...commonStyles,
              left: fixedWidth - 300,
              top: 'calc(50% - 4px)',
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderTop: '5px solid transparent',
              borderLeft: '10px solid black',
              borderBottom: '5px solid transparent'
            }} />

            {/* Vertical line after arrow */}
            <div style={{
              ...commonStyles,
              top: '25%',
              right: '230px',
              width: '2px',
              height: '50%',
              backgroundColor: 'black'
            }} />

            {/* Labels */}
            <div style={{ position: 'absolute', top: '5%', left: '25%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              "Bones" Major Cause Categories
            </div>
            <div style={{ position: 'absolute', top: '5%', right: '10%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Effect
            </div>

            {/* Bones */}
            {[...Array(report.bones/2)].map((_, index) => {
              const boneSpacingMultiplier = ((2 * gap)) / (report.bones/3.5);
              const boneStart = (index * boneSpacingMultiplier + 3) / 100 * (fixedWidth - 300 - (2 * gap));
              
              return (
                <React.Fragment key={index}>
                  {/* Top bone */}
                  <div style={{
                    ...commonStyles,
                    top: '50%',
                    left: boneStart,
                    width: boneLength,
                    height: '2px',
                    transform: 'translateY(-110px) rotate(60deg)'
                  }} />
                  
                  {/* Bottom bone */}
                  <div style={{
                    ...commonStyles,
                    top: '50%',
                    left: boneStart,
                    width: boneLength,
                    height: '2px',
                    transform: 'translateY(110px) rotate(-60deg)'
                  }} />
                </React.Fragment>
              );
            })}
          </>
        );

      case 'Impact Map Report':
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', top: '25%', left: '15%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Implement Immediately
            </div>
            <div style={{ position: 'absolute', top: '25%', right: '20%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Develop Further
            </div>
            <div style={{ position: 'absolute', bottom: '25%', left: '10%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Develop Greater Business Impact
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '12%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Watch For Further Development
            </div>
            <div style={{ position: 'absolute', left: '-31px', top: '10px', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              High
            </div>
            <div style={{ position: 'absolute', left: '-121px', top: '50%', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Impact of Implementation
            </div>
            <div style={{ position: 'absolute', left: '-28px', bottom: '5px', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Low
            </div>
            <div style={{ position: 'absolute', left: '0', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Very Easy
            </div>
            <div style={{ position: 'absolute', left: '40%', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Ease of Implementation
            </div>
            <div style={{ position: 'absolute', right: '0', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Very Difficult
            </div>
          </>
        );

      case 'Stakeholder Analysis Report':
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', left: '-20px', top: '10px', fontWeight: 'bold', color: 'black', fontSize: '28px' }}>
              +
            </div>
            <div style={{ position: 'absolute', left: '-45px', top: '50%', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Attitude
            </div>
            <div style={{ position: 'absolute', left: '-20px', bottom: '5px', fontWeight: 'bold', color: 'black', fontSize: '38px' }}>
              -
            </div>
            <div style={{ position: 'absolute', left: '20px', bottom: '-30px', fontWeight: 'bold', color: 'black', fontSize: '38px' }}>
              -
            </div>
            <div style={{ position: 'absolute', left: '30%', bottom: '-20px', fontSize: '18px' }}>
              <span style={{ fontWeight: 'bold' }}>Influence</span>
              <span> (Note: This is a political map of your key stakeholders.)</span>
            </div>
            <div style={{ position: 'absolute', right: '0', bottom: '-25px', fontWeight: 'bold', color: 'black', fontSize: '28px' }}>
              +
            </div>
          </>
        );

      default: // Brainstorming
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', top: '25%', left: '20%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem
            </div>
            <div style={{ position: 'absolute', top: '25%', right: '21%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem
            </div>
            <div style={{ position: 'absolute', bottom: '25%', left: '17%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem Solution
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '17%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem Solution
            </div>
          </>
        );
    }
  };

  if (!report) return <div>Loading...</div>;

  return (
    <Container fluid className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <Button
            variant="outline-secondary"
            className="me-3"
            onClick={() => navigate(-1)}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back
          </Button>
          <h2>{report.name}</h2>
        </div>
        <div>
          <Button
            variant="primary"
            onClick={() => setShowInputDialog(true)}
          >
            <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
            Add Text
          </Button>
        </div>
      </div>

      <div className="alert alert-info mb-3">
        <FontAwesomeIcon icon={faEdit} className="me-2" />
        <strong>Tip:</strong> Click on any text in the board to edit or delete it. Drag items to reposition them.
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div
        style={{
          position: 'relative',
          width: fixedWidth + 80,
          height: fixedHeight + 80,
          overflow: 'auto'
        }}
      >
        <div
          style={{
            position: 'relative',
            margin: '20px',
            width: fixedWidth,
            height: fixedHeight,
            border: '1px solid black'
          }}
        >
          {renderStructure()}
          {draggables.map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </div>
      </div>

      <InputTextDialog
        isVisible={showInputDialog}
        onDismiss={() => setShowInputDialog(false)}
        onAddText={addText}
      />
      <EditDialog
        visible={editDialog}
        onDismiss={() => {
          setEditDialog(false);
          setEditingItem(null);
        }}
        item={editingItem}
        refreshData={fetchData}
      />
    </Container>
  );
};

export default BoardView; 