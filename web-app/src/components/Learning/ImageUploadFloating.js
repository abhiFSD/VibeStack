import React, { useState, useRef } from 'react';
import { Button, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Storage } from 'aws-amplify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { compressImage } from '../../utils/imageUtils';

/**
 * Alternative Image Upload Solution: Floating Action Button
 * 
 * This component provides an alternative approach to image uploads
 * using a floating action button positioned near the editor.
 * 
 * Use this if you prefer a more prominent upload button
 * or want to maintain the original ReactQuill toolbar.
 */

const ImageUploadFloating = ({ 
  content, 
  onChange, 
  placeholder = "Start typing your content here...",
  style = { height: '400px', marginBottom: '50px' }
}) => {
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const quillRef = useRef(null);

  // Standard Quill modules without custom image handler
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      ['blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      [{ 'align': [] }],
      ['clean']
    ]
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

  // Floating button image upload handler
  const handleImageUpload = () => {
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
        setUploadSuccess(false);
        
        console.log(`Original file size: ${(file.size / 1024).toFixed(2)}KB`);
        
        // Compress the image before uploading
        const compressedFile = await compressImage(file, {
          quality: 0.7,
          maxWidth: 1200,
          maxHeight: 1200
        });

        console.log(`Compressed file size: ${(compressedFile.size / 1024).toFixed(2)}KB`);

        // Upload to S3
        const key = `learning-images/${Date.now()}-${file.name}`;
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

        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);

        console.log('Image uploaded successfully:', { key, imageUrl });
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Failed to upload image. Please try again.');
      } finally {
        setImageUploading(false);
      }
    };
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          {error}
        </Alert>
      )}

      {/* Upload Progress Alert */}
      {imageUploading && (
        <Alert variant="info" className="d-flex align-items-center mb-3">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          Uploading and compressing image...
        </Alert>
      )}

      {/* Success Alert */}
      {uploadSuccess && (
        <Alert variant="success" className="mb-3">
          ✅ Image uploaded successfully!
        </Alert>
      )}

      {/* ReactQuill Editor */}
      <ReactQuill
        ref={quillRef}
        value={content}
        onChange={onChange}
        modules={quillModules}
        formats={quillFormats}
        style={style}
        placeholder={placeholder}
      />

      {/* Floating Image Upload Button */}
      <OverlayTrigger
        placement="left"
        overlay={
          <Tooltip id="image-upload-tooltip">
            Upload Image
          </Tooltip>
        }
      >
        <Button
          variant="primary"
          size="lg"
          onClick={handleImageUpload}
          disabled={imageUploading}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
        >
          {imageUploading ? (
            <div className="spinner-border spinner-border-sm text-white" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          ) : (
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          )}
        </Button>
      </OverlayTrigger>

      {/* Additional Upload Options (Optional) */}
      <div style={{
        position: 'absolute',
        bottom: '90px',
        right: '25px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: imageUploading ? 0.5 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        {/* Quick Insert Buttons */}
        <OverlayTrigger
          placement="left"
          overlay={<Tooltip>Insert Divider</Tooltip>}
        >
          <Button
            variant="outline-secondary"
            size="sm"
            style={{
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection();
              const index = range ? range.index : quill.getLength();
              quill.insertText(index, '\n---\n');
              quill.setSelection(index + 5);
            }}
          >
            ━
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="left"
          overlay={<Tooltip>Insert Line Break</Tooltip>}
        >
          <Button
            variant="outline-secondary"
            size="sm"
            style={{
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => {
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection();
              const index = range ? range.index : quill.getLength();
              quill.insertText(index, '\n\n');
              quill.setSelection(index + 2);
            }}
          >
            ↵
          </Button>
        </OverlayTrigger>
      </div>

      <style>{`
        /* Enhanced Image Styles for Floating Button Implementation */
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

        /* Enhanced editor styling */
        .ql-editor {
          min-height: 300px;
          font-size: 1.1rem;
          line-height: 1.6;
        }

        /* Alignment styles */
        .ql-editor .ql-align-center {
          text-align: center !important;
        }

        .ql-editor .ql-align-right {
          text-align: right !important;
        }

        .ql-editor .ql-align-justify {
          text-align: justify !important;
        }

        /* Floating button hover effects */
        .floating-upload-btn:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2) !important;
        }
      `}</style>
    </div>
  );
};

export default ImageUploadFloating;