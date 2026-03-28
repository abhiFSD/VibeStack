import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Spinner, Form } from 'react-bootstrap';
import { Storage } from 'aws-amplify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faTrash } from '@fortawesome/free-solid-svg-icons';
import { compressImage } from '../../utils/imageUtils';

const VideoUploadComponent = ({ reportId, onVideoUpload, initialVideo, onSuccessfulSave }) => {
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoKey, setVideoKey] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialVideo) {
      loadVideo(initialVideo);
    }
  }, [initialVideo]);

  const loadVideo = async (videoKey) => {
    try {
      const url = await Storage.get(videoKey, {
        level: 'public',
        expires: 60 * 60 * 24 // 24 hours
      });
      setVideoUrl(url);
      setVideoKey(videoKey);
    } catch (error) {
      console.error('Error loading video:', error);
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      // If it's an image, we can compress it and still upload it
      if (file.type.startsWith('image/')) {
        setUploading(true);
        try {
          const compressedFile = await compressImage(file);
          const key = `videos/${reportId}/${Date.now()}-${file.name}`;
          await Storage.put(key, compressedFile, {
            contentType: file.type,
            level: 'public'
          });

          const url = await Storage.get(key, { level: 'public' });
          setVideoUrl(url);
          setVideoKey(key);
          
          if (onVideoUpload) {
            onVideoUpload(key);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Failed to upload image. Please try again.');
        } finally {
          setUploading(false);
        }
        return;
      } else {
        alert('Please upload a valid video or image file');
        return;
      }
    }

    setUploading(true);
    try {
      const key = `videos/${reportId}/${Date.now()}-${file.name}`;
      await Storage.put(key, file, {
        contentType: file.type,
        level: 'public'
      });

      const url = await Storage.get(key, { level: 'public' });
      setVideoUrl(url);
      setVideoKey(key);
      
      if (onVideoUpload) {
        onVideoUpload(key);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoKey) return;

    try {
      await Storage.remove(videoKey, { level: 'public' });
      setVideoUrl(null);
      setVideoKey(null);
      
      if (onVideoUpload) {
        onVideoUpload(null);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Failed to delete video. Please try again.');
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Process Video</h5>
        <div style={{ minWidth: '200px' }}>
          <Form.Group>
            <Button
              variant="primary"
              className="w-100"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <FontAwesomeIcon icon={faVideo} className="me-2" />
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
            />
          </Form.Group>
        </div>
      </Card.Header>
      <Card.Body>
        {uploading ? (
          <div className="text-center p-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Uploading...</span>
            </Spinner>
            <p className="mt-2">Uploading video...</p>
          </div>
        ) : videoUrl ? (
          <div>
            <video
              controls
              className="w-100"
              style={{ maxHeight: '400px' }}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <Button
              variant="danger"
              className="mt-2"
              onClick={handleDeleteVideo}
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Delete Video
            </Button>
          </div>
        ) : (
          <div className="text-center p-4 text-muted">
            <FontAwesomeIcon icon={faVideo} size="2x" className="mb-2" />
            <p>No video uploaded yet. Click the upload button to add a video.</p>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default VideoUploadComponent;