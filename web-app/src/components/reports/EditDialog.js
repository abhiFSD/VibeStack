import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';

const PREDEFINED_COLORS = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFA500', // Orange
  '#800080', // Purple
  '#FF69B4', // Pink
  '#008080', // Teal
];

const EditDialog = ({ visible, onDismiss, item, refreshData }) => {
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (item) {
      setText(item.text);
      setTextColor(item.textColor);
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() && item) {
      try {
        await API.graphql({
          query: mutations.updateChartData,
          variables: {
            input: {
              id: item.id,
              text: text.trim(),
              textColor,
              _version: item._version
            }
          }
        });
        refreshData();
        handleClose();
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    setIsDeleting(true);
    setError('');
    
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
      
      // Check if the deletion was successful
      if (deleteResult.data && deleteResult.data.deleteChartData) {
        refreshData();
        handleClose();
      } else {
        throw new Error('Deletion failed - no data returned');
      }
    } catch (error) {
      console.error('Error deleting chart data:', error);
      
      // Extract more detailed error information
      let errorMessage = 'Unknown error';
      if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        errorMessage = error.errors[0].message || 'GraphQL error';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(`Failed to delete: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setText('');
    setTextColor('#000000');
    onDismiss();
  };

  return (
    <Modal show={visible} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Text</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Text</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Enter text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
              style={{ resize: 'vertical' }}
            />
            <Form.Text className="text-muted">
              You can add multiple lines of text. Press Enter for a new line.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Text Color</Form.Label>
            <div className="d-flex gap-2 flex-wrap">
              {PREDEFINED_COLORS.map((color) => (
                <Button
                  key={color}
                  variant="outline-secondary"
                  onClick={() => setTextColor(color)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: color,
                    border: textColor === color ? '3px solid #0d6efd' : '1px solid #ced4da'
                  }}
                />
              ))}
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="danger" 
          onClick={handleDelete} 
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditDialog; 