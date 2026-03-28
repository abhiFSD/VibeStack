import React, { useState, useEffect } from 'react';
import { Card, Form, Button, ListGroup, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash, faEllipsisV, faTimes } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';

const TangiblesCard = ({ projectId }) => {
  const [tangibles, setTangibles] = useState([]);
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [totalValue, setTotalValue] = useState(0);
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [editingTangible, setEditingTangible] = useState(null);

  useEffect(() => {
    fetchTangibles();
  }, [projectId]);

  useEffect(() => {
    calculateTotal();
  }, [tangibles]);

  const fetchTangibles = async () => {
    try {
      const result = await API.graphql({
        query: queries.tangiblesByProjectID,
        variables: { projectID: projectId }
      });
      setTangibles(result.data.tangiblesByProjectID.items.filter(item => !item._deleted));
    } catch (error) {
      console.error('Error fetching tangibles:', error);
    }
  };

  const calculateTotal = () => {
    const total = tangibles.reduce((sum, item) => sum + item.value, 0);
    setTotalValue(total);
  };

  const addTangible = async () => {
    if (!label || !value) {
      alert('Please fill in all fields');
      return;
    }

    try {
      if (editingTangible) {
        // Update existing tangible
        await API.graphql({
          query: mutations.updateTangible,
          variables: {
            input: {
              id: editingTangible.id,
              label,
              value: parseFloat(value),
              date: new Date().toISOString(),
              projectID: projectId,
              _version: editingTangible._version
            }
          }
        });
      } else {
        // Create new tangible
        await API.graphql({
          query: mutations.createTangible,
          variables: {
            input: {
              label,
              value: parseFloat(value),
              date: new Date().toISOString(),
              projectID: projectId
            }
          }
        });
      }

      setLabel('');
      setValue('');
      setEditingTangible(null);
      setIsInputVisible(false);
      fetchTangibles();
    } catch (error) {
      console.error('Error saving tangible:', error);
      alert('Failed to save tangible');
    }
  };

  const startEditing = (tangible) => {
    setEditingTangible(tangible);
    setLabel(tangible.label);
    setValue(tangible.value.toString());
    setIsInputVisible(true);
  };

  const cancelEditing = () => {
    setEditingTangible(null);
    setLabel('');
    setValue('');
    setIsInputVisible(false);
  };

  const deleteTangible = async (id) => {
    try {
      await API.graphql({
        query: mutations.deleteTangible,
        variables: { 
          input: {
            id
          }
        }
      });
      fetchTangibles();
    } catch (error) {
      console.error('Error deleting tangible:', error);
      alert('Failed to delete tangible');
    }
  };

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Header className="bg-transparent border-0 pt-4 px-4">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Tangibles</h5>
          <div className="d-flex align-items-center">
            <h6 className="mb-0 me-3">Total: ${totalValue.toFixed(2)}</h6>
            <Button
              variant="link"
              className="p-0 text-primary"
              onClick={() => {
                if (isInputVisible) {
                  cancelEditing();
                } else {
                  setIsInputVisible(true);
                }
              }}
            >
              <FontAwesomeIcon icon={isInputVisible ? faTimes : faPlus} />
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body className="px-4">
        {isInputVisible && (
          <div className="mb-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Label</Form.Label>
                <Form.Control
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Value ($)</Form.Label>
                <Form.Control
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button 
                  variant="primary"
                  onClick={addTangible}
                >
                  {editingTangible ? 'Save' : 'Add'}
                </Button>
                {editingTangible && (
                  <Button 
                    variant="outline-secondary"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Form>
          </div>
        )}
        
        <ListGroup variant="flush">
          {tangibles.map((tangible, index) => (
            <ListGroup.Item 
              key={tangible.id}
              className="px-0 py-3 border-bottom"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-medium">{tangible.label}</div>
                  <small className="text-muted">
                    ${tangible.value.toFixed(2)} - {new Date(tangible.date).toLocaleDateString()}
                  </small>
                </div>
                <Dropdown align="end">
                  <Dropdown.Toggle 
                    variant="link" 
                    className="p-0 text-muted"
                    id={`tangible-dropdown-${tangible.id}`}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => startEditing(tangible)}>
                      <FontAwesomeIcon icon={faPencilAlt} className="me-2" />
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={() => deleteTangible(tangible.id)}
                      className="text-danger"
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </ListGroup.Item>
          ))}
          {tangibles.length === 0 && (
            <div className="text-center py-4 text-muted">
              No tangibles added yet
            </div>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default TangiblesCard; 