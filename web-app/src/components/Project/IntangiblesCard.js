import React, { useState, useEffect } from 'react';
import { Card, Form, Button, ListGroup, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash, faEllipsisV, faTimes } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';

const IntangiblesCard = ({ projectId }) => {
  const [intangibles, setIntangibles] = useState([]);
  const [text, setText] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [editingIntangible, setEditingIntangible] = useState(null);

  useEffect(() => {
    fetchIntangibles();
  }, [projectId]);

  const fetchIntangibles = async () => {
    try {
      const result = await API.graphql({
        query: queries.intangiblesByProjectID,
        variables: { projectID: projectId }
      });
      setIntangibles(result.data.intangiblesByProjectID.items.filter(item => !item._deleted));
    } catch (error) {
      console.error('Error fetching intangibles:', error);
    }
  };

  const addIntangible = async () => {
    if (!text) {
      alert('Please enter text');
      return;
    }

    try {
      if (editingIntangible) {
        // Update existing intangible
        await API.graphql({
          query: mutations.updateIntangible,
          variables: {
            input: {
              id: editingIntangible.id,
              text,
              projectID: projectId,
              _version: editingIntangible._version
            }
          }
        });
      } else {
        // Create new intangible
        await API.graphql({
          query: mutations.createIntangible,
          variables: {
            input: {
              text,
              projectID: projectId
            }
          }
        });
      }

      setText('');
      setEditingIntangible(null);
      setIsInputVisible(false);
      fetchIntangibles();
    } catch (error) {
      console.error('Error saving intangible:', error);
      alert('Failed to save intangible');
    }
  };

  const startEditing = (intangible) => {
    setEditingIntangible(intangible);
    setText(intangible.text);
    setIsInputVisible(true);
  };

  const cancelEditing = () => {
    setEditingIntangible(null);
    setText('');
    setIsInputVisible(false);
  };

  const deleteIntangible = async (id) => {
    try {
      await API.graphql({
        query: mutations.deleteIntangible,
        variables: { 
          input: {
            id
          }
        }
      });
      fetchIntangibles();
    } catch (error) {
      console.error('Error deleting intangible:', error);
      alert('Failed to delete intangible');
    }
  };

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Header className="bg-transparent border-0 pt-4 px-4">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Intangibles</h5>
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
      </Card.Header>
      <Card.Body className="px-4">
        {isInputVisible && (
          <div className="mb-4">
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Intangible Benefit</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button 
                  variant="primary"
                  onClick={addIntangible}
                >
                  {editingIntangible ? 'Save' : 'Add'}
                </Button>
                {editingIntangible && (
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
          {intangibles.map((intangible, index) => (
            <ListGroup.Item 
              key={intangible.id}
              className="px-0 py-3 border-bottom"
            >
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <div className="fw-medium mb-1">{intangible.text}</div>
                  <small className="text-muted">
                    Added on {new Date(intangible.createdAt).toLocaleDateString()}
                  </small>
                </div>
                <Dropdown align="end">
                  <Dropdown.Toggle 
                    variant="link" 
                    className="p-0 text-muted"
                    id={`intangible-dropdown-${intangible.id}`}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => startEditing(intangible)}>
                      <FontAwesomeIcon icon={faPencilAlt} className="me-2" />
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item 
                      onClick={() => deleteIntangible(intangible.id)}
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
          {intangibles.length === 0 && (
            <div className="text-center py-4 text-muted">
              No intangibles added yet
            </div>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default IntangiblesCard; 