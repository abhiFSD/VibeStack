import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Spinner, Button } from 'react-bootstrap';
import { Storage } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faDownload, faTrash, faExpand } from '@fortawesome/free-solid-svg-icons';
import { compressImage } from '../../utils/imageUtils';

const UnifiedAttachments = ({
  // Core Data
  attachments = [],
  onAttachmentsChange,
  
  // Upload Configuration
  uploadConfig = {
    multiple: true,
    accept: "*/*",
    maxFiles: 10,
    compress: true,
    autoSave: false
  },
  
  // Display Configuration
  displayMode = "grid", // "grid", "list", "preview"
  showFilenames = true,
  showDownload = false,
  showUploadButton = true,
  thumbnailSize = 150,
  allowFullscreen = true,
  
  // State Management
  loading = false,
  disabled = false,
  
  // Callbacks
  onUploadStart,
  onUploadComplete,
  onDelete,
  onError,
  
  // Backend Integration (Optional)
  saveConfig,
  
  // Customization
  emptyMessage = "No attachments yet",
  className = "",
  style = {},
  
  // Legacy support
  setAttachments,
  attachmentURLs = [],
  setAttachmentURLs,
  onDeleteAttachment
}) => {
  // Internal state
  const [internalLoading, setInternalLoading] = useState(false);
  const [attachmentURLsMap, setAttachmentURLsMap] = useState(new Map());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [forceRender, setForceRender] = useState(0);
  const [imageLoading, setImageLoading] = useState({});
  const [loadingURLs, setLoadingURLs] = useState(false);
  const fileInputRef = useRef(null);
  const loadingPromiseRef = useRef(null);
  
  // Determine if we're in legacy mode
  const isLegacyMode = Boolean(setAttachments || onDeleteAttachment);
  const isUploading = loading || internalLoading;
  
  // Normalize attachments to unified format
  const normalizedAttachments = attachments.map((attachment, index) => {
    if (typeof attachment === 'string') {
      return {
        key: attachment,
        url: attachmentURLs[index] || null,
        name: attachment.split('/').pop() || `File ${index + 1}`,
        isLegacy: true
      };
    }
    
    // Debug logging for object attachments
    if (process.env.NODE_ENV === 'development') {
      console.log('UnifiedAttachments - Processing attachment object:', attachment);
    }
    
    return {
      key: attachment.key || attachment,
      url: attachment.url || null,
      name: attachment.name || attachment.key?.split('/').pop() || `File ${index + 1}`,
      isLegacy: false
    };
  });
  
  // Helper functions
  const isPDF = (attachment) => {
    const fileName = attachment.name || attachment.key || '';
    const result = fileName.toLowerCase().endsWith('.pdf');
    
    // Debug logging
    if (process.env.NODE_ENV === 'development' && fileName) {
      console.log('UnifiedAttachments - isPDF check:', { fileName, result });
    }
    
    return result;
  };
  
  const getFileIcon = () => (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0H40L60 20V70C60 75.5228 55.5228 80 50 80H10C4.47715 80 0 75.5228 0 70V10C0 4.47715 4.47715 0 10 0Z" fill="#E74C3C"/>
      <path d="M40 0L60 20H50C44.4772 20 40 15.5228 40 10V0Z" fill="#C0392B"/>
      <text x="30" y="50" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">PDF</text>
    </svg>
  );
  
  // Load URLs for attachments that don't have them
  useEffect(() => {
    const loadMissingURLs = async () => {
      // Prevent multiple simultaneous loads
      if (loadingURLs || loadingPromiseRef.current) {
        return;
      }

      const attachmentsNeedingURLs = normalizedAttachments.filter(
        attachment => !attachment.url && attachment.key && !attachmentURLsMap.has(attachment.key)
      );

      if (attachmentsNeedingURLs.length === 0) {
        return;
      }

      setLoadingURLs(true);
      
      try {
        const loadPromise = Promise.all(
          attachmentsNeedingURLs.map(async (attachment) => {
            try {
              const url = await Storage.get(attachment.key);
              return { key: attachment.key, url };
            } catch (error) {
              console.error('Error loading attachment URL:', error);
              return { key: attachment.key, url: null };
            }
          })
        );

        loadingPromiseRef.current = loadPromise;
        const urls = await loadPromise;
        
        // Only update if this is still the current promise (not superseded)
        if (loadingPromiseRef.current === loadPromise) {
          setAttachmentURLsMap(prevMap => {
            const newMap = new Map(prevMap);
            urls.forEach(({ key, url }) => {
              if (url) newMap.set(key, url);
            });
            return newMap;
          });
          loadingPromiseRef.current = null;
        }
      } catch (error) {
        console.error('Error loading attachment URLs:', error);
        loadingPromiseRef.current = null;
      } finally {
        setLoadingURLs(false);
      }
    };
    
    loadMissingURLs();
  }, [attachments, attachmentURLs, loadingURLs]);

  // Cleanup effect to cancel ongoing requests
  useEffect(() => {
    return () => {
      if (loadingPromiseRef.current) {
        loadingPromiseRef.current = null;
      }
    };
  }, []);
  
  // Handle file upload
  const handleFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    setInternalLoading(true);
    onUploadStart?.(files);
    
    try {
      const uploadedFiles = [];
      
      for (const file of files) {
        // Process file based on type
        const processedFile = file.type.startsWith('image/') && uploadConfig.compress
          ? await compressImage(file)
          : file;
        
        // Upload to S3
        const key = `attachments/${Date.now()}-${file.name}`;
        await Storage.put(key, processedFile, {
          contentType: file.type,
        });
        
        // Get signed URL
        const url = await Storage.get(key);
        
        const uploadedFile = {
          key,
          url,
          name: file.name,
          type: file.type,
          size: file.size
        };
        
        uploadedFiles.push(uploadedFile);
        
        // Update URL map
        setAttachmentURLsMap(prev => new Map(prev.set(key, url)));
      }
      
      // Update attachments
      if (isLegacyMode) {
        // Legacy mode: update separate arrays
        const newKeys = uploadedFiles.map(f => f.key);
        const newURLs = uploadedFiles.map(f => f.url);
        
        if (setAttachments) {
          setAttachments(prev => [...prev, ...newKeys]);
        }
        if (setAttachmentURLs) {
          setAttachmentURLs(prev => [...prev, ...newURLs]);
        }
      } else {
        // New mode: unified change handler
        const newAttachments = [...attachments, ...uploadedFiles];
        onAttachmentsChange?.(newAttachments, 'add', { uploadedFiles });
      }
      
      onUploadComplete?.(uploadedFiles);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      onError?.(error);
    } finally {
      setInternalLoading(false);
    }
  }, [attachments, uploadConfig, isLegacyMode, setAttachments, setAttachmentURLs, onAttachmentsChange, onUploadStart, onUploadComplete, onError]);
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };
  
  // Handle delete
  const handleDelete = async (attachment, index) => {
    try {
      // Call delete callback for confirmation
      const shouldDelete = onDelete ? await onDelete(attachment) : true;
      if (!shouldDelete) return;
      
      // Remove from S3
      await Storage.remove(attachment.key);
      
      if (isLegacyMode) {
        // Legacy mode
        if (onDeleteAttachment) {
          await onDeleteAttachment(attachment.key || index);
        } else {
          setAttachments?.(prev => prev.filter((_, i) => i !== index));
          setAttachmentURLs?.(prev => prev.filter((_, i) => i !== index));
        }
      } else {
        // New mode
        const newAttachments = attachments.filter((_, i) => i !== index);
        onAttachmentsChange?.(newAttachments, 'delete', { deletedAttachment: attachment });
      }
      
      // Update URL map
      setAttachmentURLsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(attachment.key);
        return newMap;
      });
      
      // Update image loading state
      setImageLoading(prev => {
        const newState = { ...prev };
        delete newState[attachment.key];
        return newState;
      });
      
      // Force re-render
      setForceRender(prev => prev + 1);
      
    } catch (error) {
      console.error('Error deleting attachment:', error);
      onError?.(error);
    }
  };
  
  // Handle thumbnail click
  const handleThumbnailClick = (attachment, index) => {
    if (isPDF(attachment)) {
      const url = attachment.url || attachmentURLsMap.get(attachment.key);
      if (url) {
        window.open(url, '_blank');
      }
    } else if (allowFullscreen) {
      setCurrentIndex(index);
      setIsModalVisible(true);
    }
  };
  
  // Render upload button
  const renderUploadButton = () => {
    if (!showUploadButton) return null;
    
    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple={uploadConfig.multiple}
          accept={uploadConfig.accept}
          style={{ display: 'none' }}
        />
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <FontAwesomeIcon icon={faUpload} className="me-1" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </>
    );
  };
  
  // Render attachment item
  const renderAttachmentItem = (attachment, index) => {
    const url = attachment.url || attachmentURLsMap.get(attachment.key);
    const isLoadingImage = imageLoading[attachment.key];
    
    if (displayMode === "list") {
      return (
        <div key={`${attachment.key}-${forceRender}`} className="list-item">
          <div className="d-flex justify-content-between align-items-center py-2">
            <div className="d-flex align-items-center">
              {isPDF(attachment) ? (
                <div className="pdf-icon-small me-2">
                  <svg width="20" height="24" viewBox="0 0 60 80" fill="none">
                    <path d="M10 0H40L60 20V70C60 75.5228 55.5228 80 50 80H10C4.47715 80 0 75.5228 0 70V10C0 4.47715 4.47715 0 10 0Z" fill="#E74C3C"/>
                    <path d="M40 0L60 20H50C44.4772 20 40 15.5228 40 10V0Z" fill="#C0392B"/>
                  </svg>
                </div>
              ) : (
                <div className="image-icon-small me-2">📄</div>
              )}
              <span>{attachment.name}</span>
            </div>
            <div className="d-flex gap-2">
              {showDownload && url && (
                <Button
                  variant="link"
                  size="sm"
                  href={url}
                  target="_blank"
                  download
                  className="p-0"
                >
                  <FontAwesomeIcon icon={faDownload} />
                </Button>
              )}
              {allowFullscreen && !isPDF(attachment) && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleThumbnailClick(attachment, index)}
                  className="p-0"
                >
                  <FontAwesomeIcon icon={faExpand} />
                </Button>
              )}
              <Button
                variant="link"
                size="sm"
                onClick={() => handleDelete(attachment, index)}
                className="p-0 text-danger"
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Grid mode
    return (
      <div 
        key={`${attachment.key}-${forceRender}`} 
        className="attachment-item"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5'
        }}
      >
        <div
          className="thumbnail-container"
          onClick={() => handleThumbnailClick(attachment, index)}
          style={{ 
            cursor: url ? 'pointer' : 'default',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          {isLoadingImage && (
            <div className="spinner-overlay">
              <Spinner animation="border" size="sm" />
            </div>
          )}
          
          {isPDF(attachment) ? (
            <div className="pdf-preview">
              {getFileIcon()}
              {showFilenames && (
                <div className="filename">{attachment.name}</div>
              )}
            </div>
          ) : url ? (
            <img
              src={url}
              alt={attachment.name}
              className="thumbnail-image"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onLoad={() => setImageLoading(prev => ({ ...prev, [attachment.key]: false }))}
              onError={() => setImageLoading(prev => ({ ...prev, [attachment.key]: false }))}
            />
          ) : (
            <div className="loading-placeholder">
              <Spinner animation="border" size="sm" />
            </div>
          )}
        </div>
        
        <button
          className="delete-btn"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#dc3545',
            fontSize: '18px',
            lineHeight: '1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(attachment, index);
          }}
          disabled={disabled}
        >
          ×
        </button>
      </div>
    );
  };
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('UnifiedAttachments - Render state:', {
      attachments: attachments,
      normalizedAttachments: normalizedAttachments,
      showUploadButton: showUploadButton,
      isLegacyMode: isLegacyMode
    });
  }
  
  // Early return if no attachments and no upload button
  if (normalizedAttachments.length === 0 && !showUploadButton) {
    return null;
  }
  
  return (
    <div className={`unified-attachments ${className}`} style={style}>
      {/* Upload Button */}
      {renderUploadButton()}
      
      {/* Attachments Display */}
      {normalizedAttachments.length > 0 ? (
        <div 
          className={`attachments-container ${displayMode}-mode`}
          style={displayMode === 'grid' ? {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))`,
            gap: '16px',
            marginTop: '16px'
          } : {}}
        >
          {normalizedAttachments.map((attachment, index) => 
            renderAttachmentItem(attachment, index)
          )}
        </div>
      ) : (
        <div className="empty-message">{emptyMessage}</div>
      )}
      
      {/* Fullscreen Modal */}
      {allowFullscreen && (
        <Modal
          show={isModalVisible}
          onHide={() => setIsModalVisible(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton />
          <Modal.Body className="text-center p-0">
            {normalizedAttachments[currentIndex] && !isPDF(normalizedAttachments[currentIndex]) && (
              <img
                src={normalizedAttachments[currentIndex].url || attachmentURLsMap.get(normalizedAttachments[currentIndex].key)}
                alt={normalizedAttachments[currentIndex].name}
                style={{ maxWidth: '100%', maxHeight: '80vh' }}
              />
            )}
          </Modal.Body>
        </Modal>
      )}
      
      {/* Styles */}
      <style jsx>{`
        .unified-attachments {
          margin-top: 0.5rem;
        }
        
        .attachments-container.grid-mode {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(${thumbnailSize}px, ${thumbnailSize}px));
          gap: 1rem;
          margin-top: 0.5rem;
          max-width: 100%;
          overflow-x: auto;
        }
        
        .attachments-container.list-mode {
          margin-top: 0.5rem;
        }
        
        .attachment-item {
          position: relative;
        }
        
        .thumbnail-container {
          position: relative;
          height: ${thumbnailSize}px;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .thumbnail-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .pdf-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        
        .filename {
          margin-top: 8px;
          font-size: 10px;
          text-align: center;
          word-break: break-all;
          max-width: 100%;
        }
        
        .spinner-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }
        
        .loading-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        
        .delete-btn {
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
          font-size: 16px;
          line-height: 1;
          z-index: 2;
        }
        
        .delete-btn:hover {
          background: darkred;
        }
        
        .empty-message {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 2rem;
        }
        
        .list-item {
          border-bottom: 1px solid #dee2e6;
        }
        
        .list-item:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};

export default UnifiedAttachments;