import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

const DynamicFITT = () => {
  const [showModal, setShowModal] = useState(false);
  const dynamicFittStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 1000,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    padding: '12px 18px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const fittContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const fittLogoStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#009688',
    letterSpacing: '2px',
    fontFamily: 'Arial, sans-serif'
  };

  return (
    <>
      <div style={dynamicFittStyle} onClick={() => setShowModal(true)} className="cursor-pointer">
        <div style={fittContainerStyle}>
          <div style={fittLogoStyle}>
            FITT
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-center w-100">
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#009688', letterSpacing: '3px' }}>
              FITT™ Framework
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center px-5 py-4">
          <p className="lead mb-4" style={{ fontSize: '1.1rem', color: '#6c757d' }}>
            From FITTWorks - The Four Core Principles That Drive Organizational Excellence
          </p>
          
          <div className="row g-4 mt-3">
            <div className="col-md-6">
              <div className="p-4" style={{ background: '#f8f9fa', borderRadius: '12px', height: '100%' }}>
                <h3 style={{ color: '#009688', fontWeight: 'bold', fontSize: '1.5rem' }}>Focus</h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>Focus on what matters.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4" style={{ background: '#f8f9fa', borderRadius: '12px', height: '100%' }}>
                <h3 style={{ color: '#009688', fontWeight: 'bold', fontSize: '1.5rem' }}>Involve</h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>Involve everyone.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4" style={{ background: '#f8f9fa', borderRadius: '12px', height: '100%' }}>
                <h3 style={{ color: '#009688', fontWeight: 'bold', fontSize: '1.5rem' }}>Track</h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>Track progress visibly.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-4" style={{ background: '#f8f9fa', borderRadius: '12px', height: '100%' }}>
                <h3 style={{ color: '#009688', fontWeight: 'bold', fontSize: '1.5rem' }}>Transform</h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>Transform continuously.</p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DynamicFITT;