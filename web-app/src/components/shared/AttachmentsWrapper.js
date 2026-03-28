import React from 'react';
import UnifiedAttachments from './UnifiedAttachments';

/**
 * Wrapper component that provides backward compatibility for existing attachment implementations
 * while allowing gradual migration to the unified component.
 */
const AttachmentsWrapper = ({
  // Legacy props (for backward compatibility)
  attachments = [],
  setAttachments,
  attachmentURLs = [],
  setAttachmentURLs,
  onDeleteAttachment,
  
  // New unified props
  onAttachmentsChange,
  uploadConfig,
  displayMode,
  showFilenames,
  showDownload,
  showUploadButton,
  thumbnailSize,
  allowFullscreen,
  loading,
  disabled,
  onUploadStart,
  onUploadComplete,
  onDelete,
  onError,
  saveConfig,
  emptyMessage,
  className,
  style,
  
  // Migration control
  useLegacyMode = false
}) => {
  // If explicitly using legacy mode or legacy props are provided, use legacy compatibility
  const isLegacyMode = useLegacyMode || Boolean(setAttachments || onDeleteAttachment);
  
  if (isLegacyMode) {
    // Legacy mode: convert to unified component props
    const handleUnifiedChange = (newAttachments, changeType, metadata) => {
      if (changeType === 'add' && metadata?.uploadedFiles) {
        // Handle new uploads
        const newKeys = metadata.uploadedFiles.map(f => f.key);
        const newURLs = metadata.uploadedFiles.map(f => f.url);
        
        setAttachments?.(prev => [...prev, ...newKeys]);
        setAttachmentURLs?.(prev => [...prev, ...newURLs]);
      } else if (changeType === 'delete') {
        // Handle deletions - find index of deleted attachment
        const deletedKey = metadata?.deletedAttachment?.key;
        const index = attachments.findIndex(att => 
          typeof att === 'string' ? att === deletedKey : att.key === deletedKey
        );
        
        if (index !== -1) {
          setAttachments?.(prev => prev.filter((_, i) => i !== index));
          setAttachmentURLs?.(prev => prev.filter((_, i) => i !== index));
        }
      }
      
      // Call the original callback if provided
      onAttachmentsChange?.(newAttachments, changeType, metadata);
    };
    
    const handleLegacyDelete = async (attachment) => {
      if (onDelete) {
        return await onDelete(attachment);
      }
      
      // Default confirmation
      return window.confirm('Are you sure you want to delete this attachment?');
    };
    
    return (
      <UnifiedAttachments
        attachments={attachments}
        onAttachmentsChange={handleUnifiedChange}
        setAttachments={setAttachments}
        attachmentURLs={attachmentURLs}
        setAttachmentURLs={setAttachmentURLs}
        onDeleteAttachment={onDeleteAttachment}
        uploadConfig={uploadConfig}
        displayMode={displayMode}
        showFilenames={showFilenames}
        showDownload={showDownload}
        showUploadButton={showUploadButton}
        thumbnailSize={thumbnailSize}
        allowFullscreen={allowFullscreen}
        loading={loading}
        disabled={disabled}
        onUploadStart={onUploadStart}
        onUploadComplete={onUploadComplete}
        onDelete={handleLegacyDelete}
        onError={onError}
        saveConfig={saveConfig}
        emptyMessage={emptyMessage}
        className={className}
        style={style}
      />
    );
  }
  
  // New mode: pass through props directly
  return (
    <UnifiedAttachments
      attachments={attachments}
      onAttachmentsChange={onAttachmentsChange}
      uploadConfig={uploadConfig}
      displayMode={displayMode}
      showFilenames={showFilenames}
      showDownload={showDownload}
      showUploadButton={showUploadButton}
      thumbnailSize={thumbnailSize}
      allowFullscreen={allowFullscreen}
      loading={loading}
      disabled={disabled}
      onUploadStart={onUploadStart}
      onUploadComplete={onUploadComplete}
      onDelete={onDelete}
      onError={onError}
      saveConfig={saveConfig}
      emptyMessage={emptyMessage}
      className={className}
      style={style}
    />
  );
};

export default AttachmentsWrapper;