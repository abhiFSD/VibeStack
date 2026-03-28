import React from 'react';
import AttachmentsWrapper from '../shared/AttachmentsWrapper';

/**
 * Backwards-compatible 5S AttachmentsList component that uses the unified attachment system.
 * This maintains the list display mode as the original 5S component.
 */
const AttachmentsList = ({ 
  attachments, 
  attachmentURLs, 
  onDeleteAttachment 
}) => {
  return (
    <AttachmentsWrapper
      attachments={attachments}
      attachmentURLs={attachmentURLs}
      onDeleteAttachment={onDeleteAttachment}
      useLegacyMode={true}
      displayMode="list"
      showFilenames={true}
      showDownload={true}
      allowFullscreen={false}
      showUploadButton={false}
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