import React, { useState } from 'react';
import { Container, Card, Row, Col, Alert } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import GlobalOrganizationMap from './GlobalOrganizationMap';
import UserManagement from '../admin/UserManagement';
import GlobalLearningManagement from '../admin/GlobalLearningManagement';
import OrganizationManagement from '../admin/OrganizationManagement';
import SuperAdminIssues from './SuperAdminIssues';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faUsers, faGlobe, faCog, faTachometerAlt, faBug } from '@fortawesome/free-solid-svg-icons';

const SuperAdminConsole = () => {
  const { isSuperAdmin, isLoading } = useAdmin();
  const [activeSection, setActiveSection] = useState('overview');

  if (isLoading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  // Redirect non-admin users
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'learnings':
        return <GlobalLearningManagement />;
      case 'organizations':
        return <OrganizationManagement />;
      case 'issues':
        return <SuperAdminIssues />;
      case 'overview':
      default:
        return (
          <>
            {/* Global Organization Map */}
            <Card className="mb-4">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">Organizations Global Map View</h4>
              </Card.Header>
              <Card.Body className="p-0">
                <GlobalOrganizationMap />
              </Card.Body>
            </Card>
          </>
        );
    }
  };

  return (
    <Container className="py-4 pt-5">
      <h2 className="mb-4">Super Admin Console</h2>
      <Alert variant="info" className="mb-4">
        Welcome to the Super Administrator Console. This area is restricted to super administrators only.
      </Alert>

      <Row>
        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>Navigation</Card.Header>
            <Card.Body className="p-0">
              <div 
                className={`p-3 border-bottom cursor-pointer ${activeSection === 'overview' ? 'bg-light' : ''}`}
                onClick={() => setActiveSection('overview')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faTachometerAlt} className="me-2" /> Overview
              </div>
              <div 
                className={`p-3 border-bottom cursor-pointer ${activeSection === 'users' ? 'bg-light' : ''}`}
                onClick={() => setActiveSection('users')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faUsers} className="me-2" /> User Management
              </div>
              <div 
                className={`p-3 border-bottom cursor-pointer ${activeSection === 'learnings' ? 'bg-light' : ''}`}
                onClick={() => setActiveSection('learnings')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faBook} className="me-2" /> Global Learning Management
              </div>
              <div 
                className={`p-3 border-bottom cursor-pointer ${activeSection === 'organizations' ? 'bg-light' : ''}`}
                onClick={() => setActiveSection('organizations')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faGlobe} className="me-2" /> Organization Management
              </div>
              <div 
                className={`p-3 border-bottom cursor-pointer ${activeSection === 'issues' ? 'bg-light' : ''}`}
                onClick={() => setActiveSection('issues')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faBug} className="me-2" /> Report Issues (Bugs)
              </div>
              <div 
                className={`p-3 cursor-pointer ${activeSection === 'settings' ? 'bg-light' : ''}`}
                onClick={() => setActiveSection('settings')}
                style={{ cursor: 'pointer' }}
              >
                <FontAwesomeIcon icon={faCog} className="me-2" /> System Settings
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={9}>
          {renderContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default SuperAdminConsole; 