import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { API, Storage } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import AttachmentsWrapper from '../shared/AttachmentsWrapper';

const ProjectAttachmentsCard = ({ projectId, project }) => {
  const [attachments, setAttachments] = useState([]);
  const [attachmentURLs, setAttachmentURLs] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (project?.attachments) {
      setAttachments(project.attachments);
      loadAttachmentURLs(project.attachments);
    }
  }, [project]);

  const loadAttachmentURLs = async (attachmentKeys) => {
    try {
      const urls = await Promise.all(
        attachmentKeys.map(async (key) => {
          if (key) {
            return await Storage.get(key);
          }
          return null;
        })
      );
      setAttachmentURLs(urls.filter(url => url !== null));
    } catch (error) {
      console.error('Error loading attachment URLs:', error);
    }
  };

  const handleAttachmentsChange = async (newAttachments, changeType, metadata) => {
    try {
      setUploading(true);
      
      // Extract attachment keys from the new attachments
      const attachmentKeys = newAttachments.map(att => att.key || att);
      
      // Update local state
      setAttachments(attachmentKeys);
      
      // Update in database
      const projectResult = await API.graphql({
        query: queries.getProject,
        variables: { id: projectId }
      });
      
      if (!projectResult?.data?.getProject) {
        throw new Error('Project not found');
      }

      const original = projectResult.data.getProject;

      await API.graphql({
        query: mutations.updateProject,
        variables: {
          input: {
            id: projectId,
            attachments: attachmentKeys,
            _version: original._version
          }
        }
      });

      console.log('Attachments saved successfully');
    } catch (error) {
      console.error('Error saving attachments:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (index, key) => {
    try {
      const projectResult = await API.graphql({
        query: queries.getProject,
        variables: { id: projectId }
      });
      
      if (!projectResult?.data?.getProject) {
        throw new Error('Project not found');
      }

      const original = projectResult.data.getProject;
      const updatedAttachments = original.attachments.filter((_, i) => i !== index);

      await API.graphql({
        query: mutations.updateProject,
        variables: {
          input: {
            id: projectId,
            attachments: updatedAttachments,
            _version: original._version
          }
        }
      });

      // Remove from S3
      await Storage.remove(key);

      setAttachments(updatedAttachments);
      setAttachmentURLs(prev => prev.filter((_, i) => i !== index));
      console.log('Attachment removed successfully');
    } catch (error) {
      console.error('Error removing attachment:', error);
    }
  };

  return (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Header className="bg-transparent border-0 pt-4 px-4">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Attachments</h5>
        </div>
      </Card.Header>
      <Card.Body className="px-4">
        
        <AttachmentsWrapper
          attachments={attachments}
          onAttachmentsChange={handleAttachmentsChange}
          useLegacyMode={false}
          displayMode="grid"
          showFilenames={true}
          allowFullscreen={true}
          showUploadButton={true}
          loading={uploading}
          uploadConfig={{
            multiple: true,
            accept: "*/*",
            compress: true
          }}
          emptyMessage="No attachments yet"
        />
      </Card.Body>
    </Card>
  );
};

export default ProjectAttachmentsCard; 