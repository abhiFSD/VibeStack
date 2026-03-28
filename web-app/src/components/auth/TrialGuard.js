import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAdmin } from '../../contexts/AdminContext';

const TrialGuard = ({ children }) => {
  const { activeOrganization, needsLicenseManagement, isLoading } = useOrganization();
  const { isSuperAdmin, isLoading: adminLoading } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't check if still loading or no active organization
    if (isLoading || adminLoading || !activeOrganization) return;

    // Allow access to organization-management page even if trial expired
    if (location.pathname === '/organization-management') return;

    // Allow access to login/logout and other auth pages
    if (location.pathname === '/login' || location.pathname === '/logout' || location.pathname === '/') return;

    // Allow Super Admins full access to all pages, even if trial expired
    if (isSuperAdmin) {
      console.log('Super Admin detected - allowing full access despite trial status');
      return;
    }

    // Check if organization needs license management (trial expired)
    if (needsLicenseManagement(activeOrganization)) {
      console.log('Trial expired for organization:', activeOrganization.name, 'redirecting to license management');
      navigate('/organization-management', { 
        replace: true,
        state: { 
          message: 'Your 14-day trial has expired. Please purchase licenses to continue using the platform.',
          variant: 'warning'
        }
      });
    }
  }, [activeOrganization, needsLicenseManagement, location.pathname, navigate, isLoading, isSuperAdmin, adminLoading]);

  // Show children (the protected routes) normally
  return children;
};

export default TrialGuard;