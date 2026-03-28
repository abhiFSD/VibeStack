import React, { useState, useRef } from 'react';
import { Container, Card, Alert, Button } from 'react-bootstrap';
import { Storage } from 'aws-amplify';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { compressImage } from '../../utils/imageUtils';

// Custom Image Upload Handler for Quill
const ImageUpload = () => {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect className="ql-stroke" height="10" width="12" x="3" y="4"/>
      <circle className="ql-fill" cx="6" cy="7" r="1"/>
      <polyline className="ql-stroke" points="5,12 5,11 7,9 8,10 11,7 13,9 13,12 5,12"/>
    </svg>
  );
};

// Register the custom image icon
const icons = Quill.import('ui/icons');
icons['image'] = ImageUpload();

const ImageUploadDemo = () => {
  const [content, setContent] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState(null);
  const quillRef = useRef(null);

  // Custom image upload handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      try {
        setImageUploading(true);
        setError(null);
        
        console.log(`Original file size: ${(file.size / 1024).toFixed(2)}KB`);
        
        // Compress the image before uploading
        const compressedFile = await compressImage(file, {
          quality: 0.7, // Better quality for learning content
          maxWidth: 1200,
          maxHeight: 1200
        });

        console.log(`Compressed file size: ${(compressedFile.size / 1024).toFixed(2)}KB`);

        // Upload to S3
        const key = `learning-images/demo/${Date.now()}-${file.name}`;
        await Storage.put(key, compressedFile, {
          contentType: compressedFile.type,
        });

        // Get the URL
        const imageUrl = await Storage.get(key);
        
        // Insert image into editor
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const index = range ? range.index : quill.getLength();
        
        quill.insertEmbed(index, 'image', imageUrl);
        quill.setSelection(index + 1);

        console.log('Image uploaded successfully:', { key, imageUrl });
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Failed to upload image. Please try again.');
      } finally {
        setImageUploading(false);
      }
    };
  };

  // Enhanced Quill editor modules with custom image handler
  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        ['blockquote'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'], // Image button included
        [{ 'align': [] }],
        ['clean']
      ],
      handlers: {
        image: imageHandler // Custom image handler
      }
    }
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">🖼️ Image Upload Demo for VibeStack™ Learning Editor</h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            This demo shows the new image upload functionality. Click the image button in the toolbar below to upload and insert images.
          </p>
          
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {imageUploading && (
            <Alert variant="info" className="d-flex align-items-center">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Uploading and compressing image...
            </Alert>
          )}

          <ReactQuill
            ref={quillRef}
            value={content}
            onChange={setContent}
            modules={quillModules}
            formats={quillFormats}
            style={{ height: '400px', marginBottom: '50px' }}
            placeholder="Start typing your content here. Use the image button (📷) in the toolbar to upload images..."
          />

          <div className="mt-4">
            <h6>Features:</h6>
            <ul className="small">
              <li>✅ Click the image button in the toolbar to upload</li>
              <li>✅ Automatic image compression (typically 50-80% size reduction)</li>
              <li>✅ Images stored in organized S3 folders</li>
              <li>✅ Real-time upload feedback with loading indicators</li>
              <li>✅ Professional image styling with hover effects</li>
              <li>✅ Support for all common image formats</li>
            </ul>
          </div>

          <div className="mt-3">
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => {
                setContent('');
                setError(null);
              }}
            >
              Clear Content
            </Button>
          </div>
        </Card.Body>
      </Card>

      <style>{`
        /* Enhanced Image Styles */
        .ql-editor img {
          max-width: 100%;
          height: auto;
          margin: 1rem auto;
          display: block;
          cursor: pointer;
          transition: transform 0.2s ease;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .ql-editor img:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* Image upload button styling */
        .ql-toolbar .ql-image {
          position: relative;
        }

        .ql-toolbar .ql-image:hover {
          background-color: #f0f0f0;
        }

        /* Loading state for image upload */
        .image-uploading {
          opacity: 0.7;
          pointer-events: none;
        }

        /* Enhanced editor styling */
        .ql-editor {
          min-height: 300px;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        /* Center aligned text */
        .ql-editor .ql-align-center {
          text-align: center !important;
        }

        /* Right aligned text */
        .ql-editor .ql-align-right {
          text-align: right !important;
        }

        /* Justify aligned text */
        .ql-editor .ql-align-justify {
          text-align: justify !important;
        }
      `}</style>
    </Container>
  );
};

export default ImageUploadDemo;