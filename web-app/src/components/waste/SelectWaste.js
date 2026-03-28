import React, { useState } from 'react';
import { Card, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as mutations from '../../graphql/mutations';
import StaticWasteData from '../../json/StaticWasteData.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const SelectWaste = ({ 
  reportId, 
  selectedWaste, 
  setSelectedWaste, 
  addHighlight, 
  highlightCounts,
  setHighlightCounts 
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedWasteInfo, setSelectedWasteInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWaste || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await API.graphql({
        query: mutations.createHighlights,
        variables: {
          input: {
            title: selectedWaste.title,
            description: description.trim(),
            waste_type: selectedWaste.title,
            reportID: reportId
          }
        }
      });

      const newHighlight = result.data.createHighlights;
      addHighlight(newHighlight);
      
      // Update counts
      setHighlightCounts(prev => ({
        ...prev,
        [selectedWaste.title]: (prev[selectedWaste.title] || 0) + 1
      }));
      
      setDescription('');
    } catch (error) {
      console.error('Error creating highlight:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInfoClick = (waste, e) => {
    e.stopPropagation(); // Prevent waste selection when clicking info button
    setSelectedWasteInfo(waste);
    setShowInfoModal(true);
  };

  return (
    <Card>
      <Card.Body>
        <Row className="mb-4">
          <Col>
            <div className="d-flex flex-wrap gap-2">
              {StaticWasteData.map((waste) => (
                <div key={waste.title} className="d-flex align-items-center">
                  <Button
                    variant={selectedWaste?.title === waste.title ? 'primary' : 'outline-primary'}
                    onClick={() => setSelectedWaste(waste)}
                    className="d-flex align-items-center position-relative"
                  >
                    {waste.title}
                    {highlightCounts[waste.title] > 0 && (
                      <Badge bg="secondary" className="ms-2">
                        {highlightCounts[waste.title]}
                      </Badge>
                    )}
                    <FontAwesomeIcon 
                      icon={faInfoCircle} 
                      className="ms-2"
                      onClick={(e) => handleInfoClick(waste, e)}
                      style={{ 
                        cursor: 'pointer',
                        color: selectedWaste?.title === waste.title ? 'white' : '#0d6efd'
                      }}
                    />
                  </Button>
                </div>
              ))}
            </div>
          </Col>
        </Row>

        {selectedWaste && (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting ? 'Adding...' : 'Add Waste'}
              </Button>
            </div>
          </Form>
        )}

        {/* Info Modal */}
        <Modal 
          show={showInfoModal} 
          onHide={() => setShowInfoModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>{selectedWasteInfo?.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedWasteInfo && (
              <>
                <h5>Definition</h5>
                <p>{selectedWasteInfo.definition}</p>

                {selectedWasteInfo.to_detect?.ask && (
                  <>
                    <h5 className="mt-4">Questions to Ask</h5>
                    <ul>
                      {selectedWasteInfo.to_detect.ask.map((question, index) => (
                        <li key={index}>{question}</li>
                      ))}
                    </ul>
                  </>
                )}

                {selectedWasteInfo.examples && (
                  <>
                    <h5 className="mt-4">Examples</h5>
                    <ul>
                      {selectedWasteInfo.examples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </>
                )}

                {selectedWasteInfo.to_eliminate && (
                  <>
                    <h5 className="mt-4">How to Eliminate</h5>
                    <ul>
                      {selectedWasteInfo.to_eliminate.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInfoModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
};

export default SelectWaste; 