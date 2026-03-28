import React, { useState, useEffect } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import { Storage } from 'aws-amplify';

const AttachmentsList = ({ attachments, setAttachments, attachmentURLs, setAttachmentURLs, onDeleteAttachment }) => {
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(attachmentURLs?.map(() => true) || []);
  const [isDeletingModal, setIsDeletingModal] = useState(false);
  const [forceRender, setForceRender] = useState(0); // Add a force render key to trigger re-renders
  
  // Helper function to check if file is PDF
  const isPDF = (attachment) => {
    const fileName = typeof attachment === 'string' ? attachment : (attachment.key || attachment.name || '');
    return fileName.toLowerCase().endsWith('.pdf');
  };
  
  // Helper to get file extension icon
  const getFileIcon = () => (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0H40L60 20V70C60 75.5228 55.5228 80 50 80H10C4.47715 80 0 75.5228 0 70V10C0 4.47715 4.47715 0 10 0Z" fill="#E74C3C"/>
      <path d="M40 0L60 20H50C44.4772 20 40 15.5228 40 10V0Z" fill="#C0392B"/>
      <text x="30" y="50" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">PDF</text>
    </svg>
  )
  
  // Update imageLoading when attachmentURLs change
  useEffect(() => {
    setImageLoading(attachmentURLs?.map(() => true) || []);
  }, [attachmentURLs?.length]);

  // Check if we're in edit mode (attachments are objects)
  const isEditMode = Array.isArray(attachments) && attachments.length > 0 && typeof attachments[0] === 'object';

  // Only render if we have valid attachments
  if (!attachments?.length) {
    return null;
  }

  // In edit mode, attachments already contain URLs
  if (isEditMode) {
    // Filter out any invalid attachments
    const validAttachments = attachments.filter(att => 
      att && typeof att === 'object' && att.key && att.url
    );
    
    // If no valid attachments after filtering, return null
    if (validAttachments.length === 0) {
      return null;
    }
    
    const handleDelete = async (attachment) => {
      if (!attachment || !attachment.key) {
        console.error("Invalid attachment:", attachment);
        return;
      }

      try {
        // If deleting from modal, set the state
        if (isImageViewVisible && validAttachments[currentImageIndex]?.key === attachment.key) {
          setIsDeletingModal(true);
        }
        
        // Call the parent component's delete handler BEFORE manipulating local state
        if (typeof onDeleteAttachment === 'function') {
          await onDeleteAttachment(attachment);
        }
        
        // Remove the attachment from local state
        setAttachments(prev => prev.filter(item => item.key !== attachment.key));
        
        // If we deleted the current image in the modal
        if (isImageViewVisible) {
          if (validAttachments.length <= 1) {
            setIsImageViewVisible(false);
          } else if (currentImageIndex === validAttachments.length - 1) {
            setCurrentImageIndex(currentImageIndex - 1);
          }
        }
        
        // Force re-render to update the UI
        setForceRender(prev => prev + 1);
      } catch (error) {
        console.error("Error deleting attachment:", error);
      } finally {
        setIsDeletingModal(false);
      }
    };

    return (
      <>
        <div className="attachment-grid" key={`grid-${forceRender}`}>
          {validAttachments.map((attachment, index) => (
            <div key={`${attachment.key || index}-${forceRender}`} className="attachment-item">
              <div 
                className="image-container"
                onClick={() => {
                  if (isPDF(attachment)) {
                    // Open PDF in new tab
                    window.open(attachment.url, '_blank');
                  } else {
                    setCurrentImageIndex(index);
                    setIsImageViewVisible(true);
                  }
                }}
              >
                {isPDF(attachment) ? (
                  <div className="pdf-preview">
                    {getFileIcon()}
                    <div className="pdf-filename">{attachment.name || attachment.key?.split('/').pop() || 'PDF Document'}</div>
                  </div>
                ) : (
                  <>
                    {imageLoading[index] && (
                      <div className="spinner-container">
                        <Spinner animation="border" size="sm" />
                      </div>
                    )}
                    <img 
                      src={attachment.url} 
                      alt={attachment.name || `Attachment ${index + 1}`} 
                      className="img-thumbnail" 
                      onLoad={() => {
                        const newArr = [...imageLoading];
                        newArr[index] = false;
                        setImageLoading(newArr);
                      }}
                      onError={() => {
                        // Handle image loading errors (like deleted images)
                        console.warn(`Image failed to load: ${attachment.key}`);
                        // Remove failed attachments from the list
                        setAttachments(prev => prev.filter((_, i) => i !== index));
                        // Force re-render
                        setForceRender(prev => prev + 1);
                      }}
                    />
                  </>
                )}
              </div>
              <button
                className="delete-attachment-btn"
                onClick={() => handleDelete(attachment)}
                title="Delete attachment"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <Modal 
          show={isImageViewVisible} 
          onHide={() => setIsImageViewVisible(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton />
          <Modal.Body className="text-center p-0 position-relative">
            {validAttachments[currentImageIndex] && (
              <>
                <button
                  className="modal-delete-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
                      handleDelete(validAttachments[currentImageIndex]);
                    }
                  }}
                  title="Delete this image"
                  disabled={isDeletingModal}
                >
                  {isDeletingModal ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Deleting...</span>
                    </div>
                  ) : (
                    '×'
                  )}
                </button>
                <img 
                  src={validAttachments[currentImageIndex].url} 
                  alt={validAttachments[currentImageIndex].name || `Full size ${currentImageIndex + 1}`}
                  style={{ maxWidth: '100%', maxHeight: '80vh' }}
                />
              </>
            )}
          </Modal.Body>
        </Modal>

        <style jsx>{`
          .attachment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 0.5rem;
          }
          .attachment-item {
            position: relative;
          }
          .image-container {
            position: relative;
            cursor: pointer;
            height: 150px;
          }
          .spinner-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
          }
          .attachment-item img {
            width: 100%;
            height: 150px;
            object-fit: cover;
          }
          .delete-attachment-btn, .modal-delete-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background: red;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            line-height: 1;
            z-index: 2;
          }
          .delete-attachment-btn:hover, .modal-delete-btn:hover {
            background: darkred;
          }
          .modal-delete-btn {
            width: 32px;
            height: 32px;
            font-size: 22px;
          }
        `}</style>
      </>
    );
  }

  // Handle attachments in create mode (strings with separate URLs array)
  // Only render if we have valid attachments and URLs
  if (!attachmentURLs?.length || !attachmentURLs.some(u => u)) {
    return null;
  }
  
  const handleDelete = async (keyToRemove) => {
    if (!keyToRemove) {
      console.error("Invalid key to remove");
      return;
    }
    
    try {
      // If deleting from modal, set the state
      if (isImageViewVisible && attachments[currentImageIndex] === keyToRemove) {
        setIsDeletingModal(true);
      }
      
      // Find the index of the item to delete
      const index = attachments.indexOf(keyToRemove);
      if (index === -1) {
        console.warn("Attachment key not found in local state:", keyToRemove);
        return;
      }
      
      // Call parent's delete handler first with the key directly
      if (typeof onDeleteAttachment === 'function') {
        await onDeleteAttachment(keyToRemove);
      }
      
      // Update local state
      setAttachments((prevAttachments) => prevAttachments.filter(key => key !== keyToRemove));
      setAttachmentURLs((prevAttachmentURLs) => {
        const newUrls = [...prevAttachmentURLs];
        newUrls.splice(index, 1);
        return newUrls;
      });
      setImageLoading((prevImageLoading) => {
        const updatedImageLoading = [...prevImageLoading];
        updatedImageLoading.splice(index, 1);
        return updatedImageLoading;
      });
      
      // If we deleted the current image in the modal
      if (isImageViewVisible && attachments[currentImageIndex] === keyToRemove) {
        if (attachments.length <= 1) {
          setIsImageViewVisible(false);
        } else if (currentImageIndex === attachments.length - 1) {
          setCurrentImageIndex(currentImageIndex - 1);
        }
      }
      
      // Force re-render to update the UI
      setForceRender(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting attachment:", error);
    } finally {
      setIsDeletingModal(false);
    }
  };

  return (
    <>
      <div className="attachment-grid" key={`grid-${forceRender}`}>
        {attachmentURLs.map((url, index) => (
          url && attachments[index] && (
            <div key={`${index}-${forceRender}`} className="attachment-item">
              <div 
                className="image-container"
                onClick={() => {
                  if (isPDF(attachments[index])) {
                    // Open PDF in new tab
                    window.open(url, '_blank');
                  } else {
                    setCurrentImageIndex(index);
                    setIsImageViewVisible(true);
                  }
                }}
              >
                {isPDF(attachments[index]) ? (
                  <div className="pdf-preview">
                    {getFileIcon()}
                    <div className="pdf-filename">{attachments[index]?.split('/').pop() || 'PDF Document'}</div>
                  </div>
                ) : (
                  <>
                    {imageLoading[index] && (
                      <div className="spinner-container">
                        <Spinner animation="border" size="sm" />
                      </div>
                    )}
                    <img 
                      src={url} 
                      alt={`Attachment ${index + 1}`} 
                      className="img-thumbnail" 
                      onLoad={() => {
                        const newArr = [...imageLoading];
                        newArr[index] = false;
                        setImageLoading(newArr);
                      }}
                    />
                  </>
                )}
              </div>
              <button
                className="delete-attachment-btn"
                onClick={() => handleDelete(attachments[index])}
                title="Delete attachment"
              >
                ×
              </button>
            </div>
          )
        ))}
      </div>
      
      <Modal 
        show={isImageViewVisible} 
        onHide={() => setIsImageViewVisible(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton />
        <Modal.Body className="text-center p-0 position-relative">
          {attachmentURLs[currentImageIndex] && (
            <>
              <button
                className="modal-delete-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
                    handleDelete(attachments[currentImageIndex]);
                  }
                }}
                title="Delete this image"
                disabled={isDeletingModal}
              >
                {isDeletingModal ? (
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Deleting...</span>
                  </div>
                ) : (
                  '×'
                )}
              </button>
              <img 
                src={attachmentURLs[currentImageIndex]} 
                alt={`Full size ${currentImageIndex + 1}`}
                style={{ maxWidth: '100%', maxHeight: '80vh' }}
              />
            </>
          )}
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .attachment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .attachment-item {
          position: relative;
        }
        .image-container {
          position: relative;
          cursor: pointer;
          height: 150px;
        }
        .spinner-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }
        .attachment-item img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .delete-attachment-btn, .modal-delete-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          background: red;
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          line-height: 1;
          z-index: 2;
        }
        .delete-attachment-btn:hover, .modal-delete-btn:hover {
          background: darkred;
        }
        .modal-delete-btn {
          width: 32px;
          height: 32px;
          font-size: 22px;
        }
        .pdf-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 4px;
        }
        .pdf-filename {
          margin-top: 8px;
          font-size: 12px;
          text-align: center;
          word-break: break-all;
          max-width: 100%;
        }
        .pdf-preview:hover {
          background: #e9ecef;
        }
      `}</style>
    </>
  );
};

export default AttachmentsList; 