import React, { createContext, useState, useContext, useEffect } from 'react';
import { API, Auth } from 'aws-amplify';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

const OrganizationContext = createContext(null);

export const OrganizationProvider = ({ children }) => {
  const [activeOrganization, setActiveOrganization] = useState(() => {
    // Try to get the active organization from localStorage on initial load
    const storedOrg = localStorage.getItem('activeOrganization');
    return storedOrg ? JSON.parse(storedOrg) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update localStorage whenever activeOrganization changes
  useEffect(() => {
    if (activeOrganization) {
      localStorage.setItem('activeOrganization', JSON.stringify(activeOrganization));
    } else {
      localStorage.removeItem('activeOrganization');
    }
  }, [activeOrganization]);

  const fetchUserOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await Auth.currentAuthenticatedUser();
      const userSub = user.attributes.sub;

      // Get organizations where user is a member
      const memberOrgsResponse = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            userSub: { eq: userSub }
          }
        }
      });

      // Get organizations owned by user
      const ownedOrgsResponse = await API.graphql({
        query: queries.listOrganizations,
        variables: {
          filter: {
            owner: { eq: userSub }
          }
        }
      });

      const memberOrgs = await Promise.all(
        memberOrgsResponse.data.listOrganizationMembers.items
          .filter(member => !member._deleted)
          .map(async (member) => {
            if (member.organizationID) {
              const orgResponse = await API.graphql({
                query: `
                  query GetOrganization($id: ID!) {
                    getOrganization(id: $id) {
                      id
                      name
                      owner
                      additionalOwners
                      contactEmail
                      contactPhone
                      location
                      coordinates
                      logo
                      isActive
                      leaderboardEnabled
                      learningCoinsPerInterval
                      learningCoinInterval
                      learningMaxCoinsPerSession
                      learningCoinsEnabled
                      stripeCustomerId
                      stripeSubscriptionId
                      stripeSubscriptionItemId
                      subscriptionStatus
                      subscriptionPeriodEnd
                      billingPeriod
                      activeUserCount
                      purchasedLicenses
                      aiDisabledUsers
                      createdAt
                      updatedAt
                      _version
                      _deleted
                      _lastChangedAt
                    }
                  }
                `,
                variables: { id: member.organizationID }
              });
              return orgResponse.data.getOrganization;
            }
            return null;
          })
      );

      const validMemberOrgs = memberOrgs.filter(org => org !== null && !org._deleted);
      const ownedOrgs = ownedOrgsResponse.data.listOrganizations.items.filter(org => !org._deleted);
      
      const allOrgs = [...validMemberOrgs, ...ownedOrgs];
      
      // If there's a stored organization in localStorage, verify it's still valid
      const storedOrg = localStorage.getItem('activeOrganization');
      if (storedOrg) {
        const parsedStoredOrg = JSON.parse(storedOrg);
        const isStoredOrgValid = allOrgs.some(org => org.id === parsedStoredOrg.id);
        if (isStoredOrgValid) {
          // Update the stored org with latest data
          const updatedOrg = allOrgs.find(org => org.id === parsedStoredOrg.id);
          setActiveOrganization(updatedOrg);
          return;
        } else {
          // Remove invalid stored org
          localStorage.removeItem('activeOrganization');
        }
      }
      
      // First try to find an active organization
      const activeOrg = allOrgs.find(org => org.isActive);
      
      // If there's an active org, set it as active
      if (activeOrg) {
        setActiveOrganization(activeOrg);
      }
      // If no active org but there are organizations, set the first one as active
      else if (allOrgs.length > 0 && !activeOrganization) {
        const firstOrg = allOrgs[0];
        await setOrganizationAsActive(firstOrg.id);
        setActiveOrganization(firstOrg);
      }
      
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setOrganizationAsActive = async (organizationId) => {
    try {
      // First, deactivate the currently active organization if exists
      if (activeOrganization?.id) {
        await API.graphql({
          query: mutations.updateOrganization,
          variables: {
            input: {
              id: activeOrganization.id,
              isActive: false,
              _version: activeOrganization._version
            }
          }
        });
      }

      // Then activate the new organization
      const result = await API.graphql({
        query: mutations.updateOrganization,
        variables: {
          input: {
            id: organizationId,
            isActive: true
          }
        }
      });

      return result.data.updateOrganization;
    } catch (error) {
      console.error('Error setting organization as active:', error);
      throw error;
    }
  };

  const updateActiveOrganization = async (organizationId) => {
    setIsLoading(true);
    try {
      const updatedOrg = await setOrganizationAsActive(organizationId);
      const result = await API.graphql({
        query: `
          query GetOrganization($id: ID!) {
            getOrganization(id: $id) {
              id
              name
              owner
              additionalOwners
              contactEmail
              contactPhone
              location
              coordinates
              logo
              isActive
              leaderboardEnabled
              learningCoinsPerInterval
              learningCoinInterval
              learningMaxCoinsPerSession
              learningCoinsEnabled
              stripeCustomerId
              stripeSubscriptionId
              stripeSubscriptionItemId
              subscriptionStatus
              subscriptionPeriodEnd
              billingPeriod
              activeUserCount
              purchasedLicenses
              aiDisabledUsers
              createdAt
              updatedAt
              _version
              _deleted
              _lastChangedAt
            }
          }
        `,
        variables: { id: organizationId }
      });
      const org = result.data.getOrganization;
      setActiveOrganization(org);
    } catch (error) {
      console.error('Error updating active organization:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganization = async () => {
    if (activeOrganization?.id) {
      await updateActiveOrganization(activeOrganization.id);
    }
  };

  // Check if organization trial has expired (14 days with no licenses)
  const isTrialExpired = (organization) => {
    if (!organization) return false;
    
    // If organization has purchased licenses, trial is not expired
    if (organization.purchasedLicenses > 0) return false;
    
    // Calculate days since creation
    const createdAt = new Date(organization.createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    // Trial expires after 14 days with no licenses
    return daysDifference >= 14;
  };

  // Check if organization needs to be redirected to management page
  const needsLicenseManagement = (organization) => {
    return isTrialExpired(organization);
  };

  // Fetch organizations when the component mounts
  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider 
      value={{ 
        activeOrganization, 
        setActiveOrganization,
        updateActiveOrganization,
        refreshOrganization,
        isLoading,
        error,
        fetchUserOrganizations,
        isTrialExpired,
        needsLicenseManagement
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export default OrganizationContext; 