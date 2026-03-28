import React, { useState, useEffect } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';

const LocationWarning = () => {
  const { activeOrganization } = useOrganization();
  const { user } = useUser();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [missingLocation, setMissingLocation] = useState(false);
  const [missingAwards, setMissingAwards] = useState(false);
  const [missingEmails, setMissingEmails] = useState(false);
  const [managementAccess, setManagementAccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    setIsLoadingData(true);
    setMissingLocation(false);
    setMissingAwards(false);
    setMissingEmails(false);
    setManagementAccess(false);
    setFetchError(null);

    console.log("[LocationWarning] Checking setup for org:", activeOrganization);
    console.log("[LocationWarning] User:", user);

    const checkManagementAccess = () => {
      if (!activeOrganization || !user?.attributes?.sub) return false;
      console.log("[LocationWarning] Checking Management Access: Owner=", activeOrganization.owner, " UserSub=", user.attributes.sub, " AddOwners=", activeOrganization.additionalOwners, " UserEmail=", user.attributes.email);
      return (
        activeOrganization.owner === user.attributes.sub || 
        (Array.isArray(activeOrganization.additionalOwners) && 
         user.attributes.email &&
         activeOrganization.additionalOwners.includes(user.attributes.email))
      );
    };

    const hasAccess = checkManagementAccess();
    setManagementAccess(hasAccess);
    console.log("[LocationWarning] Management Access Result:", hasAccess);

    if (!hasAccess || !activeOrganization?.id) {
      console.log("[LocationWarning] No access or Org ID, skipping checks.");
      setIsLoadingData(false);
      return;
    }

    const locationIsMissing = !activeOrganization.location || !activeOrganization.coordinates;
    setMissingLocation(locationIsMissing);
    console.log("[LocationWarning] Location Missing Check:", locationIsMissing, "(Location:", activeOrganization.location, ", Coords:", activeOrganization.coordinates, ")");

    const fetchData = async () => {
      try {
        const filter = { 
          organizationID: { eq: activeOrganization.id },
          _deleted: { ne: true }
        };
        
        console.log("[LocationWarning] Fetching awards and emails with filter:", filter);
        const [awardsResult, emailsResult] = await Promise.all([
          API.graphql({
            query: queries.listAwardDefinitions,
            variables: { 
              filter: filter,
              limit: 1000
            },
            fetchPolicy: 'network-only'
          }),
          API.graphql({
            query: queries.listEmailTemplates,
            variables: { filter: filter },
            fetchPolicy: 'network-only'
          })
        ]);
        
        console.log("[LocationWarning] Awards Result (network-only):", awardsResult.data.listAwardDefinitions);
        console.log("[LocationWarning] Emails Result (network-only):", emailsResult.data.listEmailTemplates);

        const awardsMissing = awardsResult.data.listAwardDefinitions.items.length === 0;
        const emailsMissing = emailsResult.data.listEmailTemplates.items.length === 0;

        setMissingAwards(awardsMissing);
        setMissingEmails(emailsMissing);
        console.log("[LocationWarning] Awards Missing Check:", awardsMissing);
        console.log("[LocationWarning] Emails Missing Check:", emailsMissing);

      } catch (error) {
        console.error("[LocationWarning] Error checking organization defaults:", error);
        setFetchError("Failed to check organization setup. Please try again later.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();

  }, [activeOrganization, user]);

  const missingItems = [];
  if (missingLocation) missingItems.push("Location");
  if (missingAwards) missingItems.push("Default Award Definitions");
  if (missingEmails) missingItems.push("Default Email Templates");

  console.log("[LocationWarning] Final check: ManagementAccess=", managementAccess, "isLoadingData=", isLoadingData, "fetchError=", fetchError, "missingItems=", missingItems);

  if (!managementAccess || isLoadingData || fetchError || missingItems.length === 0) {
    if (fetchError) {
        console.log("[LocationWarning] Suppressing warning due to fetch error.");
        return null; 
    }
    console.log("[LocationWarning] Suppressing warning. Conditions not met.");
    return null;
  }

  const warningTitle = `Organization Setup Incomplete`;
  const warningText = `Your organization's setup is missing: ${missingItems.join(', ')}. Completing the setup (${missingItems.join(' and ')}) will enable full functionality and provide better insights. Please visit Organization Management to update these details.`;
  console.log("[LocationWarning] Rendering warning:", {warningTitle, warningText});

  return (
    <Alert 
      variant="warning" 
      className="mb-4 shadow-sm"
      style={{
        borderLeft: '5px solid #ffc107',
        backgroundColor: '#fff3cd',
        marginTop: '20px'
      }}
    >
      <Alert.Heading className="h5">
        {isLoadingData ? <Spinner animation="border" size="sm" /> : warningTitle}
      </Alert.Heading>
      <>
        <p>{warningText}</p>
        <div className="d-flex justify-content-end">
          <Button
            as={Link}
            to="/organization-management"
            variant="outline-warning"
            className="fw-bold"
          >
            Update Organization Settings
          </Button>
        </div>
      </>
    </Alert>
  );
};

export default LocationWarning; 