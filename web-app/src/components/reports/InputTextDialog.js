import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

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

const InputTextDialog = ({ isVisible, onDismiss, onAddText }) => {
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#000000');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onAddText({ text: text.trim(), textColor });
      setText('');
      setTextColor('#000000');
      onDismiss();
    }
  };

  const handleClose = () => {
    setText('');
    setTextColor('#000000');
    onDismiss();
  };

  return (
    <Modal show={isVisible} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Text</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Add
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InputTextDialog; 