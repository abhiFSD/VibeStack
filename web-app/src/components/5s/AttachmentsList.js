import React from 'react';
import { ListGroup, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';

const AttachmentsList = ({ 
  attachments, 
  attachmentURLs, 
  onDeleteAttachment 
}) => {
  const getFileNameFromKey = (key) => {
    return key.split('/').pop();
  };

  return (
    <ListGroup variant="flush">
      {attachments.map((attachment, index) => (
        <ListGroup.Item 
          key={index}
          className="d-flex justify-content-between align-items-center px-0 py-2"
        >
          <div className="text-break">
            {getFileNameFromKey(attachment)}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="link"
              className="p-0 text-primary"
              href={attachmentURLs[index]}
              target="_blank"
              download
            >
              <FontAwesomeIcon icon={faDownload} />
            </Button>
            <Button
              variant="link"
              className="p-0 text-danger"
              onClick={() => onDeleteAttachment(index)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </div>
        </ListGroup.Item>
      ))}
      {attachments.length === 0 && (
        <div className="text-center py-3 text-muted">
          No attachments yet
        </div>
      )}
    </ListGroup>
  );
};

export default AttachmentsList; 