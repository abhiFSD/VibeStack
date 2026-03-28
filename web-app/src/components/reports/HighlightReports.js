import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Modal, Button, Alert } from 'react-bootstrap';
import { API } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import HighlightCard from './HighlightCard';
import SelectWaste from '../waste/SelectWaste';
import StaticWasteData from '../../json/StaticWasteData.json';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ActionItemsCard from '../shared/ActionItemsCard';

const HighlightReports = ({ reportId, onViewDetails, handleShowEmailDialog, onRefreshEmail, reportType }) => {
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState([]);
  const [highlightCounts, setHighlightCounts] = useState({});
  const [selectedWaste, setSelectedWaste] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentHighlight, setCurrentHighlight] = useState(null);
  const [description, setDescription] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [showWasteTypeModal, setShowWasteTypeModal] = useState(false);

  useEffect(() => {
    fetchHighlights();
  }, [reportId, selectedWaste]);

  useEffect(() => {
    fetchHighlights();
  }, [reportId, selectedWaste, onRefreshEmail]);

  const handleAddHighlight = async (newHighlight) => {
    setHighlights(oldHighlights => [newHighlight, ...oldHighlights]);
    await fetchHighlights();
  };

  const fetchHighlights = async () => {
    try {
      const result = await API.graphql({
        query: queries.highlightsByReportIDAndCreatedAt,
        variables: {
          reportID: reportId,
          sortDirection: 'DESC',
          limit: 100
        }
      });
      
      let fetchedHighlights = result.data.highlightsByReportIDAndCreatedAt.items.filter(item => !item._deleted);
    
      // Calculate counts for all wastes
      let fetchedCounts = {};
      for (let waste of StaticWasteData) {
        fetchedCounts[waste.title] = fetchedHighlights.filter(highlight => highlight.waste_type === waste.title).length;
      }
      setHighlightCounts(fetchedCounts);
    
      // Filter highlights for the selected waste
      if (reportType === 'Waste Walk Report' && selectedWaste) {
        fetchedHighlights = fetchedHighlights.filter(highlight => highlight.waste_type === selectedWaste.title);
      }

      // Filter out highlights where title is "Action Items"
      fetchedHighlights = fetchedHighlights.filter(highlight => highlight.title !== "Action Items");
    
      setHighlights(fetchedHighlights);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    }
  };

  const handleDeleteHighlight = async (highlightId) => {
    try {
      const getResult = await API.graphql({
        query: queries.getHighlights,
        variables: { id: highlightId }
      });
      
      const highlight = getResult.data.getHighlights;
      
      await API.graphql({
        query: mutations.deleteHighlights,
        variables: { 
          input: {
            id: highlightId,
            _version: highlight._version
          }
        }
      });
      
      await fetchHighlights();
      console.log('Highlight deleted');
    } catch (error) {
      console.error('Error deleting highlight:', error);
    }
  };

  const handleEditHighlight = async (highlightId) => {
    try {
      const result = await API.graphql({
        query: queries.getHighlights,
        variables: { id: highlightId }
      });
      const highlight = result.data.getHighlights;
      setCurrentHighlight(highlight);
      setDescription(highlight.description || '');
      setWasteType(highlight.waste_type || '');
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching highlight:', error);
    }
  };

  const handleSaveHighlight = async () => {
    try {
      if (!currentHighlight) return;

      const updateInput = {
        id: currentHighlight.id,
        description: description,
        waste_type: wasteType,
        reportID: currentHighlight.reportID,
        title: reportType === 'Waste Walk Report' ? wasteType : currentHighlight.title,
        images: currentHighlight.images || [],
        assignees: currentHighlight.assignees || [],
        _version: currentHighlight._version
      };

      await API.graphql({
        query: mutations.updateHighlights,
        variables: { input: updateInput }
      });

      setShowEditModal(false);
      fetchHighlights();
    } catch (error) {
      console.error('Error updating highlight:', error);
    }
  };

  let sortedHighlights;
  let titleOrder;

  if (reportType === 'A3 Project Report') {
    titleOrder = [
      'Problem Statement',
      'Current State',
      'Improvement Opportunity',
      'Problem Analysis',
      'Future State',
      'Implementation Plan',
      'Verify Results',
      'Follow-Up'
    ];
  } else if (reportType === 'DMAIC Report') {
    titleOrder = [
      'Prepare',
      'Define',
      'Measure',
      'Analyze',
      'Improve',
      'Control'
    ];
  } else if (reportType === 'PDCA Report') {
    titleOrder = [
      'Plan',
      'Do',
      'Check',
      'Act'
    ];
  } else if (reportType === 'Leadership Report') {
    titleOrder = [
      'Accomplishments and significant events',
      'Improvement PDCAs',
      'Special recognitions',
      'Upcoming issues and events',
      'Resource and support needs',
      'Action Items'
    ];
  } else {
    sortedHighlights = [...highlights].sort((a, b) => a.title.localeCompare(b.title));
  }

  if (titleOrder) {
    sortedHighlights = [...highlights].sort((a, b) => {
      const indexA = titleOrder.indexOf(a.title);
      const indexB = titleOrder.indexOf(b.title);
      if (indexA === -1 || indexB === -1) {
        return a.title.localeCompare(b.title);
      }
      return indexA - indexB;
    });
  }

  const getGridLayout = () => {
    const baseStyles = {
      display: 'grid',
      gap: '1rem',
      padding: '1rem',
      height: '100%'
    };

    switch (reportType) {
      case 'A3 Project Report':
        return {
          ...baseStyles,
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          alignItems: 'start'
        };
      case 'PDCA Report':
        return {
          ...baseStyles,
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          alignItems: 'start'
        };
      case 'DMAIC Report':
      case 'Leadership Report':
        return {
          ...baseStyles,
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          alignItems: 'start'
        };
      default:
        return {
          ...baseStyles,
          gridTemplateColumns: 'repeat(2, 1fr)',
          alignItems: 'start'
        };
    }
  };

  return (
    <Container fluid className="p-0">
      {reportType === 'Waste Walk Report' && (
        <Row className="mb-4">
          <Col>
            <SelectWaste 
              reportId={reportId} 
              selectedWaste={selectedWaste} 
              setSelectedWaste={setSelectedWaste} 
              addHighlight={handleAddHighlight} 
              highlightCounts={highlightCounts}
              setHighlightCounts={setHighlightCounts} 
            />
          </Col>
        </Row>
      )}
      
      <div style={getGridLayout()}>
        {sortedHighlights.map((highlight) => (
          <div key={highlight.id} style={{ minWidth: 0 }}>
            <HighlightCard
              highlight={highlight}
              onViewDetails={onViewDetails}
              handleShowEmailDialog={handleShowEmailDialog}
              reportId={reportId}
              reportType={reportType}
              onDeleteHighlight={handleDeleteHighlight}
              onEditHighlight={handleEditHighlight}
            />
          </div>
        ))}
        {reportType === 'Leadership Report' && (
          <div style={{ minWidth: 0 }}>
            <Card style={{ height: '100%', backgroundColor: '#ffffff', border: '1px solid #dee2e6', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#00897b', borderBottom: '1px solid #dee2e6', padding: '0.75rem 1rem', color: 'white' }}>
                <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Action Items</h5>
              </div>
              <div style={{ padding: '1rem' }}>
                <ActionItemsCard reportId={reportId} />
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Highlight Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Edit {currentHighlight?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {wasteType && (
            <div className="mb-4">
              <h5>Waste Type: {wasteType}</h5>
              <Button 
                variant="primary" 
                onClick={() => setShowWasteTypeModal(true)}
                className="mb-3"
              >
                Change Waste Type
              </Button>
            </div>
          )}

          <Alert variant="info" className="mb-4">
            <h5 className="mb-3">NOTE</h5>
            <ol>
              <li className="mb-2">
                Please be advised if text is copied/pasted into the Report, the font size will vary according to that browsers page!
              </li>
              <li className="mb-2">
                Text editor bullets and numbering will not appear if aligned to the right of any images! (This occurs only in the A3, DMAIC, PDCA, and Leadership Reports/Apps.)
              </li>
              <li className="mb-2">
                To ensure paragraph separation and/or one sentence continuity, please use an extra Return {'<CR>'}.
              </li>
            </ol>
          </Alert>

          <ReactQuill
            theme="snow"
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
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveHighlight}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Waste Type Selection Modal */}
      <Modal 
        show={showWasteTypeModal} 
        onHide={() => setShowWasteTypeModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Select Waste Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {StaticWasteData.map((waste, index) => (
            <Button
              key={index}
              variant="primary"
              className="w-100 mb-2"
              onClick={() => {
                setWasteType(waste.title);
                setShowWasteTypeModal(false);
              }}
            >
              {waste.title}
            </Button>
          ))}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default HighlightReports; 