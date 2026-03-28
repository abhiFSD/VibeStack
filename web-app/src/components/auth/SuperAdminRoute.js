import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { Container, Alert } from 'react-bootstrap';

const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Verifying permissions...</p>
        </div>
      </Container>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>
            You do not have permission to access this page. Super Administrator privileges are required.
          </p>
          <hr />
          <p className="mb-0">
            If you believe this is an error, please contact your system administrator.
          </p>
        </Alert>
      </Container>
    );
  }

  return children;
};

export default SuperAdminRoute;