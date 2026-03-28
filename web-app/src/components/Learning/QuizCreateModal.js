import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as mutations from '../../graphql/mutations';

const QuizCreateModal = ({ show, handleClose, learningId, onQuizCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const newQuiz = await API.graphql({
        query: mutations.createQuiz,
        variables: {
          input: {
            title,
            description,
            learningId
          }
        }
      });

      // Reset form
      setTitle('');
      setDescription('');
      
      // Notify parent and close modal
      onQuizCreated(newQuiz.data.createQuiz);
      handleClose();
    } catch (err) {
      console.error('Error creating quiz:', err);
      setError('Failed to create quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Quiz</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create Quiz'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default QuizCreateModal; 