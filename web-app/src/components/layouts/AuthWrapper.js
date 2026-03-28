import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import Navigation from './Navigation';
import OrganizationSelector from '../shared/OrganizationSelector';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import { ActionItemsProvider, useActionItems } from '../../contexts/ActionItemsContext';
import usePageTitle from '../../hooks/usePageTitle';
import TermsAndConditions from '../TermsAndConditions';

// Inner component that uses the ActionItems context
const AuthenticatedContent = ({ authUser }) => {
  const { upcomingCount, loading: actionItemsLoading } = useActionItems();
  usePageTitle(upcomingCount, actionItemsLoading);

  return (
    <>
      <Navigation user={authUser} />
      <div className="d-flex justify-content-center py-2 bg-light border-bottom">
        <OrganizationSelector />
      </div>
      <Outlet />
    </>
  );
};

const AuthWrapper = () => {
  const { authStatus, user: authUser } = useAuthenticator((context) => [context.authStatus]);
  const { activeOrganization, isLoading: orgLoading } = useOrganization();
  const { user, fetchUser, dbUser, termsAccepted } = useUser();
  const location = useLocation();
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (authStatus === 'authenticated' && !user) {
      console.log('AuthWrapper: User authenticated, fetching user data...');
      fetchUser();
    }
  }, [authStatus, user, fetchUser]);

  // Check if user needs to accept terms
  useEffect(() => {
    console.log('AuthWrapper user check:', {
      userExists: !!user,
      dbUserExists: !!dbUser,
      termsAcceptedFromContext: termsAccepted,
      termsAcceptedFromDbUser: dbUser?.termsAccepted,
      showTerms
    });
    
    // Check terms acceptance from the context state (most reliable)
    if (user && termsAccepted === false) {
      setShowTerms(true);
    } else if (user && termsAccepted === true) {
      setShowTerms(false);
    }
  }, [user, dbUser, termsAccepted]);

  if (authStatus === 'configuring' || authStatus === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (authStatus !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (orgLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Wait for user sync to complete before showing organization selector
  if (authStatus === 'authenticated' && !user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Synchronizing user data...</span>
        </div>
      </div>
    );
  }

  if (!activeOrganization) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <h2 className="mb-4">Welcome to VibeStack™ Pro</h2>
          <OrganizationSelector />
        </div>
      </div>
    );
  }

  return (
    <ActionItemsProvider>
      <AuthenticatedContent authUser={authUser} />
      {showTerms && (
        <TermsAndConditions 
          onAccept={() => {
            console.log('Terms accepted, hiding modal');
            setShowTerms(false);
          }}
          onClose={() => {
            console.log('Terms modal closed');
            setShowTerms(false);
          }}
          requireCheckbox={false}
        />
      )}
    </ActionItemsProvider>
  );
};

export default AuthWrapper; 