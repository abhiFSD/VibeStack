import React from 'react';
import AttachmentsWrapper from '../shared/AttachmentsWrapper';

/**
 * Backwards-compatible AttachmentsList component that uses the unified attachment system.
 * This maintains the exact same API as the original component for easy migration.
 */
const AttachmentsList = ({ 
  attachments, 
  setAttachments, 
  attachmentURLs, 
  setAttachmentURLs, 
  onDeleteAttachment 
}) => {
  return (
    <AttachmentsWrapper
      attachments={attachments}
      setAttachments={setAttachments}
      attachmentURLs={attachmentURLs}
      setAttachmentURLs={setAttachmentURLs}
      onDeleteAttachment={onDeleteAttachment}
      useLegacyMode={true}
      displayMode="grid"
      showFilenames={true}
      allowFullscreen={true}
      uploadConfig={{
        multiple: true,
        accept: "*/*",
        compress: true
      }}
      emptyMessage="No attachments yet"
    />
  );
};

export default AttachmentsList;