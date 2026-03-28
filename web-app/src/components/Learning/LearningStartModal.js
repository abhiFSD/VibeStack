import React, { useState, useEffect } from 'react';
import { Modal, Button, ProgressBar, Alert, Row, Col } from 'react-bootstrap';
import { FaPlay, FaStop, FaClock, FaBook, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const LearningStartModal = ({ 
  show, 
  learningTitle, 
  learningId,
  isTracking, 
  sessionElapsedTime, 
  activeTime, 
  totalTimeSpent,
  isUserActive,
  isTabVisible,
  onStartTracking, 
  onStopTracking,
  onClose,
  trackingBarRef,
  progressId // Add progressId prop from parent
}) => {
  const navigate = useNavigate();
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handleStart = () => {
    console.log('🚀 Modal handleStart called with progressId:', progressId);
    
    // Check if progressId is available before proceeding
    if (!progressId) {
      console.error('❌ Cannot start tracking - no progressId available in modal');
      return;
    }
    
    // Trigger the tracking bar to start tracking with the progressId from parent
    if (trackingBarRef?.current?.startTracking) {
      console.log('🎯 Calling startTracking on tracking bar with progressId:', progressId);
      trackingBarRef.current.startTracking(progressId);
    } else {
      console.error('❌ trackingBarRef.current.startTracking not available');
    }
    
    onStartTracking();
    onClose();
  };

  const handleStop = () => {
    setShowConfirmEnd(true);
  };

  const confirmStop = () => {
    // Trigger the tracking bar to stop tracking
    if (trackingBarRef?.current?.stopTracking) {
      trackingBarRef.current.stopTracking();
    }
    onStopTracking();
    setShowConfirmEnd(false);
    // Redirect to learning list after stopping
    navigate('/learnings');
  };

  const cancelStop = () => {
    setShowConfirmEnd(false);
  };

  const goBackToList = () => {
    navigate('/learnings');
  };

  // If user is tracking, don't show any modal since progress is visible in the tracking bar
  if (isTracking) {
    return null;
  }

  // Initial start modal
  return (
    <Modal show={show} onHide={() => {}} backdrop="static" keyboard={false} centered size="lg">
      <Modal.Header className="bg-primary text-white">
        <Modal.Title>
          <FaBook className="me-2" />
          Start Learning Session
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <h4>{learningTitle}</h4>
          <p className="text-muted">Ready to begin your learning journey?</p>
        </div>

        <Alert variant="info" className="mb-4">
          <h6><FaClock className="me-2" />Time Tracking Information</h6>
          <p className="mb-2">Your learning progress will be automatically tracked:</p>
          <ul className="mb-0">
            <li><strong>Session Time:</strong> Total time since you started</li>
            <li><strong>Active Time:</strong> Only counts when you're actively engaged</li>
            <li><strong>Total Time:</strong> Cumulative time across all sessions</li>
          </ul>
        </Alert>

        {totalTimeSpent > 0 && (
          <Alert variant="success" className="mb-4">
            <h6>Previous Progress</h6>
            <p className="mb-0">
              <strong>Total time spent:</strong> {formatTime(totalTimeSpent)}
            </p>
          </Alert>
        )}

        <Row className="text-center">
          <Col>
            <Button 
              variant="outline-secondary" 
              size="lg" 
              onClick={goBackToList}
              className="me-3"
            >
              <FaArrowLeft className="me-2" />
              Back to List
            </Button>
            <Button 
              variant="success" 
              size="lg" 
              onClick={handleStart}
            >
              <FaPlay className="me-2" />
              Start Learning
            </Button>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default LearningStartModal;