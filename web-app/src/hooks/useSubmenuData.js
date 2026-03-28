import { useState, useEffect, useCallback } from 'react';
import { API, Auth } from 'aws-amplify';
import * as queries from '../graphql/queries';
import { useOrganization } from '../contexts/OrganizationContext';

export const useSubmenuData = () => {
  const { activeOrganization } = useOrganization();
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSub, setUserSub] = useState(null);

  useEffect(() => {
    const getUserSub = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setUserSub(user.attributes.sub);
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    getUserSub();
  }, []);

  const fetchSubmenuData = useCallback(async () => {
    if (!activeOrganization?.id || !userSub) {
      return;
    }
    
    if (loading) {
      return; // Prevent duplicate calls if already loading
    }

    try {
      setLoading(true);

      // Fetch reports exactly like Reports.js page with pagination
      const fetchAllReports = async (query, variables) => {
        let allItems = [];
        let nextToken = null;
        
        do {
          const result = await API.graphql({
            query,
            variables: {
              ...variables,
              nextToken
            }
          });
          
          const resultKey = Object.keys(result.data)[0]; // e.g., "listReports"
          const items = result.data[resultKey].items.filter(item => !item._deleted);
          allItems = [...allItems, ...items];
          
          nextToken = result.data[resultKey].nextToken;
        } while (nextToken);
        
        return allItems;
      };
      
      
      // Fetch both owned and assigned reports with pagination (exactly like Reports.js)
      const [ownedList, assignedList] = await Promise.all([
        fetchAllReports(queries.listReports, {
          filter: {
            user_sub: { eq: userSub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          },
          limit: 100 // Match Reports.js limit
        }),
        fetchAllReports(queries.listReports, {
          filter: {
            assignedMembers: { contains: userSub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          },
          limit: 100 // Match Reports.js limit
        })
      ]);
      
      // Filter out reports that the user owns from the assigned list (exactly like Reports.js)
      const filteredAssignedList = assignedList.filter(item => item.user_sub !== userSub);


      // Fetch projects exactly like Projects.js page
      const [ownedProjects, memberProjectsData] = await Promise.all([
        // Owned projects
        API.graphql({
          query: queries.listProjects,
          variables: {
            filter: {
              owner: { eq: userSub },
              organizationID: { eq: activeOrganization.id },
              _deleted: { ne: true }
            },
            limit: 10
          }
        }),
        // Member projects via ProjectMember table
        API.graphql({
          query: queries.listProjectMembers,
          variables: {
            filter: {
              userSub: { eq: userSub },
              _deleted: { ne: true }
            },
            limit: 100
          }
        })
      ]);

      // Get project details for member projects (like Projects.js does)
      const memberProjectPromises = memberProjectsData.data.listProjectMembers.items.map(async (member) => {
        try {
          const projectResult = await API.graphql({
            query: queries.getProject,
            variables: { id: member.projectID }
          });
          return projectResult.data.getProject;
        } catch (error) {
          console.error('Error fetching member project:', error);
          return null;
        }
      });

      const memberProjects = (await Promise.all(memberProjectPromises))
        .filter(project => project && 
                           project.organizationID === activeOrganization.id && 
                           !project._deleted);

      // Process reports exactly like Reports.js page
      const ownedReportsAll = ownedList; // Already filtered by fetchAllReports
      const assignedReportsAll = filteredAssignedList; // Already filtered

      // For submenu display - only ongoing reports (check for completed === true specifically)
      const ownedReportsList = ownedReportsAll.filter(item => item.completed !== true);
      const assignedReportsList = assignedReportsAll.filter(item => item.completed !== true);

      // Combine all ongoing reports and sort by creation date (newest first) like Reports.js
      const allReports = [...ownedReportsList, ...assignedReportsList];
      const sortByDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      const reportsList = allReports.sort(sortByDate).slice(0, 5);


      // Process projects exactly like Projects.js page  
      const ownedProjectsList = ownedProjects.data.listProjects.items.filter(item => !item._deleted);
      
      // Combine owned and member projects, removing duplicates (like Projects.js)
      const allProjects = [...ownedProjectsList, ...memberProjects];
      const uniqueProjects = Array.from(new Map(allProjects.map(project => [project.id, project])).values());
      const projectsList = uniqueProjects
        .filter(item => !item._deleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Add sorting for consistency
        .slice(0, 5);

      // For action items, use ALL reports and projects (including completed) to get comprehensive action items
      const allUserReports = [...ownedReportsAll, ...assignedReportsAll]; // Include completed ones for action items
      const allUserProjects = [...ownedProjectsList, ...memberProjects];
      const orgReportIds = allUserReports.map(r => r.id);
      const orgProjectIds = allUserProjects.map(p => p.id);


      // Build promises for action items from reports and projects
      const actionItemPromises = [];

      // Add report-based action items queries (using individual queries since 'in' filter not supported)
      orgReportIds.slice(0, 10).forEach(reportId => { // Limit to first 10 reports for performance
        // Items created by user
        actionItemPromises.push(
          API.graphql({
            query: queries.listActionItems,
            variables: {
              filter: {
                user_sub: { eq: userSub },
                reportID: { eq: reportId },
                _deleted: { ne: true },
                note: { ne: true }
              }
            }
          }).then(result => result.data.listActionItems.items)
        );

        // Items assigned to user
        actionItemPromises.push(
          API.graphql({
            query: queries.listActionItems,
            variables: {
              filter: {
                assignees: { contains: userSub },
                reportID: { eq: reportId },
                _deleted: { ne: true },
                note: { ne: true }
              }
            }
          }).then(result => result.data.listActionItems.items)
        );
      });

      // Add project-based action items queries (using individual queries since 'in' filter not supported)
      orgProjectIds.slice(0, 10).forEach(projectId => { // Limit to first 10 projects for performance
        // Items created by user
        actionItemPromises.push(
          API.graphql({
            query: queries.listActionItems,
            variables: {
              filter: {
                user_sub: { eq: userSub },
                projectID: { eq: projectId },
                _deleted: { ne: true },
                note: { ne: true }
              }
            }
          }).then(result => result.data.listActionItems.items)
        );

        // Items assigned to user
        actionItemPromises.push(
          API.graphql({
            query: queries.listActionItems,
            variables: {
              filter: {
                assignees: { contains: userSub },
                projectID: { eq: projectId },
                _deleted: { ne: true },
                note: { ne: true }
              }
            }
          }).then(result => result.data.listActionItems.items)
        );
      });

      // Execute all action items queries in parallel with error handling
      let allActionItems = [];
      if (actionItemPromises.length > 0) {
        const actionItemResults = await Promise.allSettled(actionItemPromises);
        allActionItems = actionItemResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value)
          .flat();
      
        // Log any failed queries for debugging
        const failedQueries = actionItemResults.filter(result => result.status === 'rejected');
        if (failedQueries.length > 0) {
          console.warn('Some action items queries failed:', failedQueries.map(f => f.reason));
        }
      }
      
      // Deduplicate action items by ID
      const uniqueActionItems = [...new Map(allActionItems.map(item => [item.id, item])).values()];


      // Filter action items for upcoming items only (due today or in the future)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to midnight for accurate day comparison
      
      const actionItemsList = uniqueActionItems
        .filter(item => {
          // Filter out deleted and completed items
          if (item._deleted || item.status === 3) return false;
          
          // If item has a due date, only include if it's today or in the future
          if (item.duedate) {
            const dueDate = new Date(item.duedate);
            dueDate.setHours(0, 0, 0, 0); // Reset to midnight for accurate day comparison
            
            return dueDate >= today; // Due today or in the future
          }
          
          // Include items without due dates (they're considered "upcoming" since they're not completed)
          return true;
        })
        .sort((a, b) => {
          // Sort by due date (items with due dates first, then by date, items without due dates last)
          if (!a.duedate && !b.duedate) return 0;
          if (!a.duedate) return 1;
          if (!b.duedate) return -1;
          return new Date(a.duedate) - new Date(b.duedate);
        })
        .slice(0, 15);

      // Update state with new data
      setProjects(projectsList);
      setReports(reportsList);
      setActionItems(actionItemsList);

    } catch (error) {
      console.error('Error fetching submenu data:', error);
      // Don't clear existing data on error, just log it
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id, userSub, loading]);

  // Fetch data when organization or user changes (like dashboard components do)
  useEffect(() => {
    if (activeOrganization?.id && userSub) {
      // Clear existing data first (important for organization switching)
      setProjects([]);
      setReports([]);
      setActionItems([]);
      // Fetch fresh data immediately
      fetchSubmenuData();
    }
  }, [activeOrganization?.id, userSub]);

  const refreshData = useCallback(() => {
    if (loading) return; // Prevent refresh if already loading
    setProjects([]);
    setReports([]);
    setActionItems([]);
    fetchSubmenuData();
  }, [fetchSubmenuData, loading]);

  return {
    projects,
    reports,
    actionItems,
    loading,
    refreshData,
    fetchSubmenuData
  };
};

export default useSubmenuData;