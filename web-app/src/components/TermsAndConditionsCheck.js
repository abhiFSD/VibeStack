import React, { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { API, graphqlOperation } from 'aws-amplify';
import * as queries from '../graphql/queries';
import TermsAndConditions from './TermsAndConditions';

const TermsAndConditionsCheck = ({ children }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const { authStatus, user } = useAuthenticator((context) => [context.authStatus, context.user]);

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      checkTermsAcceptance();
    } else {
      setLoading(false);
    }
  }, [authStatus, user]);

  const checkTermsAcceptance = async () => {
    try {
      setLoading(true);
      
      // Find the user in our database using Cognito ID
      const userResult = await API.graphql(graphqlOperation(
        queries.listUsers, {
          filter: {
            cognitoID: { eq: user.attributes.sub }
          }
        }
      ));
      
      const userItems = userResult.data.listUsers.items;
      const dbUser = userItems.find(u => !u._deleted);
      
      // Check if terms have been accepted
      if (dbUser && dbUser.termsAccepted) {
        setShowTerms(false);
      } else {
        setShowTerms(true);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking terms acceptance:', error);
      setLoading(false);
    }
  };

  const handleTermsAccept = () => {
    setShowTerms(false);
  };

  // Show loading spinner while checking
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If not authenticated or terms accepted, just render children
  if (authStatus !== 'authenticated' || !showTerms) {
    return <>{children}</>;
  }

  // Show terms and conditions modal
  return (
    <>
      {children}
      <TermsAndConditions 
        onAccept={handleTermsAccept} 
        onClose={() => {}} // We don't allow closing without accepting
      />
    </>
  );
};

export default TermsAndConditionsCheck; 