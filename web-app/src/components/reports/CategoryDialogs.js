import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

const CategoryDialogs = ({
  reportType,
  editVisible,
  setEditVisible,
  inputValue,
  setInputValue,
  handleEdit,
  addVisible,
  setAddVisible,
  handleAdd,
  isInputValid,
  setIsInputValid,
  renderDefaultCategories,
  dialogKey,
  deleteVisible,
  setDeleteVisible,
  handleDelete,
}) => {
  const [isInputFocused, setIsInputFocused] = useState(false);

  const name = reportType === 'Gemba Walk Report' || reportType === 'Leadership Report' 
             ? 'Department' 
             : reportType === 'Kaizen Project Report' 
             ? 'Phase' 
             : reportType === '5 Whys Report' 
             ? 'Problem' 
             : reportType === 'Mistake Proofing Report' 
             ? 'Potential Failure' 
             : 'Category';

  const namePlural = reportType === 'Gemba Walk Report' || reportType === 'Leadership Report' 
                    ? 'Departments' 
                    : reportType === 'Kaizen Project Report' 
                    ? 'Phases' 
                    : 'Categories';

  return (
    <>
      {/* Edit Dialog */}
      <Modal 
        key={`edit-${dialogKey}`}
        show={editVisible} 
        onHide={() => setEditVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit {name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>{name} Name</Form.Label>
            <Form.Control
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Dialog */}
      <Modal 
        key={`add-${dialogKey}`}
        show={addVisible} 
        onHide={() => setAddVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Add {name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>{name} Name</Form.Label>
            <Form.Control
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              isInvalid={!isInputValid}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
            />
            <Form.Control.Feedback type="invalid">
              This field is required
            </Form.Control.Feedback>
          </Form.Group>

          {!isInputFocused && reportType !== '5 Whys Report' && reportType !== 'Mistake Proofing Report' && (
            <div className="mt-4">
              <h6 className="mb-3">Default {namePlural}:</h6>
              <div className="default-categories">
                {renderDefaultCategories()}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => { 
              setAddVisible(false); 
              setIsInputFocused(false); 
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => { 
              handleAdd(); 
              setIsInputFocused(false); 
            }}
          >
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Dialog */}
      <Modal 
        key={`delete-${dialogKey}`}
        show={deleteVisible} 
        onHide={() => setDeleteVisible(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete {name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this {name.toLowerCase()}?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteVisible(false)}>
            No
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .default-categories {
          max-height: 300px;
          overflow-y: auto;
        }
      `}</style>
    </>
  );
};

export default CategoryDialogs; 