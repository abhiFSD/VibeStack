import { useState, useEffect } from 'react';
import { API, Auth } from 'aws-amplify';
import * as queries from '../graphql/queries';
import { useOrganization } from '../contexts/OrganizationContext';

const useUpcomingActionItems = () => {
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { activeOrganization } = useOrganization();

  useEffect(() => {
    if (activeOrganization?.id) {
      fetchUpcomingActionItems();
    }
  }, [activeOrganization]);

  const fetchUpcomingActionItems = async () => {
    if (!activeOrganization?.id) return;
    
    setLoading(true);
    try {
      const user = await Auth.currentAuthenticatedUser();
      const userSub = user.attributes.sub;

      // Fetch reports for the current user in the active organization
      const reportsResult = await API.graphql({
        query: queries.listReports,
        variables: {
          filter: {
            user_sub: { eq: userSub },
            _deleted: { ne: true }
          }
        }
      });

      // Fetch projects for the current organization
      const projectsResult = await API.graphql({
        query: queries.listProjects,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }
      });

      const reports = reportsResult.data.listReports.items || [];
      const projects = projectsResult.data.listProjects.items || [];

      // Fetch action items linked to reports - both created by user and assigned to user
      const reportActionItemPromises = reports.flatMap((report) => [
        // Items created by the user
        API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: { 
              reportID: { eq: report.id },
              user_sub: { eq: userSub },
              _deleted: { ne: true },
              note: { ne: true } // Exclude notes
            }
          }
        }).then(result => result.data.listActionItems.items),
        // Items assigned to the user
        API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: { 
              reportID: { eq: report.id },
              assignees: { contains: userSub },
              _deleted: { ne: true },
              note: { ne: true } // Exclude notes
            }
          }
        }).then(result => result.data.listActionItems.items)
      ]);

      // Fetch action items linked to projects - both created by user and assigned to user
      const projectActionItemPromises = projects.flatMap((project) => [
        // Items created by the user
        API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: { 
              projectID: { eq: project.id },
              user_sub: { eq: userSub },
              _deleted: { ne: true },
              note: { ne: true } // Exclude notes
            }
          }
        }).then(result => result.data.listActionItems.items),
        // Items assigned to the user
        API.graphql({
          query: queries.listActionItems,
          variables: {
            filter: { 
              projectID: { eq: project.id },
              assignees: { contains: userSub },
              _deleted: { ne: true },
              note: { ne: true } // Exclude notes
            }
          }
        }).then(result => result.data.listActionItems.items)
      ]);

      // Wait for both report and project action items
      const allPromises = [...reportActionItemPromises, ...projectActionItemPromises];
      const allResults = await Promise.all(allPromises);

      // Combine and deduplicate action items
      const allActionItems = allResults.flat();
      const uniqueActionItems = [...new Map(allActionItems.map(item => [item.id, item])).values()];

      // Filter for upcoming action items (due today or in the future, not completed)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to midnight for accurate day comparison

      const upcomingItems = uniqueActionItems.filter(item => {
        if (!item.duedate || item.status === 3) return false; // Skip items without due date or completed items
        
        const dueDate = new Date(item.duedate);
        dueDate.setHours(0, 0, 0, 0); // Reset to midnight for accurate day comparison
        
        return dueDate >= today; // Due today or in the future
      });

      setUpcomingCount(upcomingItems.length);
    } catch (error) {
      console.error('Error fetching upcoming action items:', error);
      setUpcomingCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Function to manually refresh the count
  const refreshCount = () => {
    fetchUpcomingActionItems();
  };

  return {
    upcomingCount,
    loading,
    refreshCount
  };
};

export default useUpcomingActionItems;