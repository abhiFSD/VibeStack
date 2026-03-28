import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { Container, Button, Modal, Alert, Form } from 'react-bootstrap';
import StaticWasteData from '../../json/StaticWasteData.json';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../../styles/highlight-content.css';

const safeGraphQLOperation = async ({ query, variables }) => {
  if (!query) {
    throw new Error('GraphQL query is undefined');
  }
  return await API.graphql({ query, variables });
};

const AddHighlights = () => {
  const { highlightId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saveRequested, setSaveRequested] = useState(false);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    const fetchHighlight = async () => {
      try {
        const result = await safeGraphQLOperation({
          query: queries.getHighlights,
          variables: { id: highlightId }
        });
        const highlight = result.data.getHighlights;
        if (highlight) {
          setTitle(highlight.title);
          setDescription(highlight.description);
          setWasteType(highlight.waste_type);
          setVersion(highlight._version);
        }
      } catch (error) {
        console.error('Error fetching highlight:', error);
      }
    };
    fetchHighlight();
  }, [highlightId]);

  useEffect(() => {
    if (saveRequested) {
      saveHighlight(description, wasteType);
      setSaveRequested(false);
    }
  }, [saveRequested, description, wasteType]);

  const saveHighlight = async (content, newWasteType) => {
    try {
      const result = await safeGraphQLOperation({
        query: queries.getHighlights,
        variables: { id: highlightId }
      });
      const highlight = result.data.getHighlights;
  
      if (highlight) {
        const updateInput = {
          id: highlightId,
          description: content || '',
          waste_type: newWasteType || '',
          reportID: highlight.reportID,
          title: highlight.title || '',
          images: highlight.images || '',
          assignees: highlight.assignees || [],
          _version: version
        };
  
        await safeGraphQLOperation({
          query: mutations.updateHighlights,
          variables: { input: updateInput }
        });
  
        console.log('Highlight updated successfully');
        navigate(-1); // Go back to previous page
      } else {
        console.error('Highlight not found');
      }
    } catch (error) {
      console.error('Error updating highlight:', error);
    }
  };

  const handleSaveRequest = () => {
    setSaveRequested(true);
  };

  const handleEditorChange = (content) => {
    setDescription(content);
    handleSaveRequest();
  };

  // Simple Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      ['blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <Container className="py-4">
      {wasteType && (
        <div className="mb-4">
          <h5>Waste Type: {wasteType}</h5>
          <Button 
            variant="primary" 
            onClick={() => setShowModal(true)}
            className="mb-3"
          >
            Change Waste Type
          </Button>
        </div>
      )}

      <Alert variant="info">
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

      <div className="mt-4">
        <ReactQuill
          theme="snow"
          value={description}
          onChange={handleEditorChange}
          modules={modules}
          style={{ height: '300px', marginBottom: '50px' }}
          className="highlight-content-editor"
        />
      </div>

      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)}
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
                setShowModal(false);
                handleSaveRequest();
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

export default AddHighlights; 