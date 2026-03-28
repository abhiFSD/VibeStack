import React, { useState, useEffect } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge, ProgressBar, Modal } from 'react-bootstrap';
import { learningProgressesByOrganizationID, learningSessionsByOrganizationIDAndStartTime, listLearnings, listOrganizationMembers, listSectionInteractions, departmentsByOrganizationID } from '../../graphql/queries';
import { deleteLearningSession, deleteLearningProgress, deleteSectionInteraction } from '../../graphql/mutations';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import UserAvatar from '../shared/UserAvatar';
import { FaDownload, FaUsers, FaClock, FaChartLine, FaBook, FaEye, FaPlay, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const LearningAnalytics = () => {
  const { activeOrganization: currentOrganization } = useOrganization();
  const { user: currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalLearnings: 0,
    learningsStarted: 0,
    avgTimeSpent: 0,
    completionRate: 0
  });
  const [learningProgress, setLearningProgress] = useState([]);
  const [learningSessions, setLearningSessions] = useState([]);
  const [learnings, setLearnings] = useState({});
  const [userStats, setUserStats] = useState([]);
  const [organizationMembers, setOrganizationMembers] = useState({});
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateRange, setDateRange] = useState(30); // Last 30 days
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailProgress, setUserDetailProgress] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [modalDataCounts, setModalDataCounts] = useState({ sessions: 0, progress: 0, interactions: 0 });

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchDepartments();
      fetchAnalytics();
    }
  }, [currentOrganization, dateRange, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      console.log('🏢 Fetching departments for organization:', currentOrganization.id);
      
      const departmentsResponse = await API.graphql(
        graphqlOperation(departmentsByOrganizationID, {
          organizationID: currentOrganization.id,
          filter: {
            _deleted: { ne: true }
          }
        })
      );
      
      console.log('🏢 Raw departments response:', departmentsResponse);
      
      const departmentsData = departmentsResponse.data.departmentsByOrganizationID.items;
      console.log('🏢 Departments data:', departmentsData);
      console.log('🏢 Departments count:', departmentsData.length);
      
      setDepartments(departmentsData);
      
      if (departmentsData.length === 0) {
        console.warn('⚠️ No departments found for organization:', currentOrganization.id);
        console.log('⚠️ Current organization object:', currentOrganization);
      }
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (dateRange * 24 * 60 * 60 * 1000));

      // Fetch learning progress data
      const progressResponse = await API.graphql(
        graphqlOperation(learningProgressesByOrganizationID, {
          organizationID: currentOrganization.id,
          filter: {
            lastAccessedAt: { ge: startDate.toISOString() },
            _deleted: { ne: true }
          }
        })
      );

      let progressData = progressResponse.data.learningProgressesByOrganizationID.items;
      console.log('Raw progress data from GraphQL:', progressData);
      console.log('Progress data details:', progressData.map(p => ({
        id: p.id,
        userSub: p.userSub,
        learningID: p.learningID,
        totalTimeSpent: p.totalTimeSpent,
        lastAccessedAt: p.lastAccessedAt,
        _deleted: p._deleted
      })));
      
      // Deduplicate progress data by userSub + learningID, keeping most recent
      const progressByUserLearning = {};
      progressData.forEach(progress => {
        const key = `${progress.userSub}-${progress.learningID}`;
        if (!progressByUserLearning[key]) {
          progressByUserLearning[key] = progress;
        } else {
          // Keep the most recent one
          if (new Date(progress.lastAccessedAt) > new Date(progressByUserLearning[key].lastAccessedAt)) {
            console.log(`Duplicate progress found for ${key}, keeping more recent record`);
            progressByUserLearning[key] = progress;
          } else {
            console.log(`Duplicate progress found for ${key}, keeping existing record`);
          }
        }
      });
      
      // Convert back to array
      progressData = Object.values(progressByUserLearning);
      console.log('Deduplicated progress data:', progressData.length, 'records');
      setLearningProgress(progressData);

      // Fetch learning sessions for the date range
      const sessionsResponse = await API.graphql(
        graphqlOperation(learningSessionsByOrganizationIDAndStartTime, {
          organizationID: currentOrganization.id,
          startTime: { ge: startDate.toISOString() },
          filter: {
            _deleted: { ne: true }
          }
        })
      );

      const sessionsData = sessionsResponse.data.learningSessionsByOrganizationIDAndStartTime.items;
      console.log('All sessions data:', sessionsData);
      console.log('Sample session:', sessionsData[0]);
      setLearningSessions(sessionsData);

      // Fetch all learnings to get names (both organization and default learnings)
      const learningsResponse = await API.graphql(
        graphqlOperation(listLearnings, {
          filter: {
            or: [
              { organizationID: { eq: currentOrganization.id } },
              { isDefault: { eq: true } }
            ],
            _deleted: { ne: true }
          }
        })
      );

      const learningsData = learningsResponse.data.listLearnings.items;
      const learningsMap = {};
      learningsData.forEach(learning => {
        learningsMap[learning.id] = learning;
      });
      
      console.log('Loaded learnings:', {
        count: learningsData.length,
        learningIds: Object.keys(learningsMap),
        learningsMap
      });
      
      setLearnings(learningsMap);

      // Fetch organization members for user details
      const membersResponse = await API.graphql(
        graphqlOperation(listOrganizationMembers, {
          filter: {
            organizationID: { eq: currentOrganization.id },
            _deleted: { ne: true }
          },
          limit: 1000
        })
      );

      const membersData = membersResponse.data.listOrganizationMembers.items;
      console.log('👥 Organization members raw data:', membersData);
      console.log('👥 Members with departments:', membersData.filter(m => m.departmentID));
      
      const membersMap = {};
      membersData.forEach(member => {
        membersMap[member.userSub] = {
          email: member.email,
          userSub: member.userSub,
          role: member.role,
          status: member.status,
          departmentID: member.departmentID,
          department: member.department
        };
        
        // Debug department info for each member
        if (member.departmentID) {
          console.log(`👤 Member ${member.email} - DeptID: ${member.departmentID}, Dept:`, member.department);
        }
      });
      setOrganizationMembers(membersMap);
      
      console.log('👥 Final members map:', membersMap);

      // Filter users by department if a specific department is selected
      let filteredUserSubs = null;
      if (selectedDepartment !== 'all') {
        filteredUserSubs = new Set(
          membersData
            .filter(member => member.departmentID === selectedDepartment)
            .map(member => member.userSub)
        );
        console.log('Filtering by department:', selectedDepartment, 'Users:', Array.from(filteredUserSubs));
      }

      // Note: Section interactions are fetched separately when needed for deletion
      // Skipping display-time fetch to improve performance

      // Apply department filter to progress data
      let filteredProgressData = progressData;
      if (filteredUserSubs) {
        filteredProgressData = progressData.filter(p => filteredUserSubs.has(p.userSub));
        console.log('Filtered progress data by department:', filteredProgressData.length, 'records');
      }

      // Calculate analytics
      const uniqueUsers = new Set(filteredProgressData.map(p => p.userSub)).size;
      const activeUsers = new Set(
        filteredProgressData.filter(p => new Date(p.lastAccessedAt) >= startDate).map(p => p.userSub)
      ).size;

      // Calculate total time from progress records (authoritative source)
      const totalTimeSpent = filteredProgressData.reduce((sum, p) => sum + (p.totalTimeSpent || 0), 0);
      const avgTimeSpent = uniqueUsers > 0 ? Math.floor(totalTimeSpent / uniqueUsers / 60) : 0; // in minutes
      
      console.log('Time calculation:', {
        totalProgressRecords: filteredProgressData.length,
        progressTimeSpent: filteredProgressData.map(p => ({ userSub: p.userSub, learningID: p.learningID, time: p.totalTimeSpent })),
        totalTimeSpent,
        avgTimeSpent,
        departmentFilter: selectedDepartment
      });

      const completedLearnings = filteredProgressData.filter(p => (p.completionPercentage || 0) >= 80).length;
      const completionRate = filteredProgressData.length > 0 ? Math.round((completedLearnings / filteredProgressData.length) * 100) : 0;

      // Apply department filter to sessions data
      let filteredSessionsData = sessionsData;
      if (filteredUserSubs) {
        filteredSessionsData = sessionsData.filter(s => filteredUserSubs.has(s.userSub));
      }

      // Count unique learning sessions (not progress records)
      const uniqueLearningsSessions = new Set(
        filteredSessionsData.map(s => `${s.userSub}-${s.learningID}`)
      ).size;
      
      console.log('Analytics calculation:', {
        totalSessions: sessionsData.length,
        filteredSessions: filteredSessionsData.length,
        uniqueLearningsSessions,
        dateRange,
        startDate: startDate.toISOString(),
        departmentFilter: selectedDepartment
      });

      setAnalytics({
        totalUsers: uniqueUsers,
        activeUsers: activeUsers,
        totalLearnings: learningsData.length,
        learningsStarted: uniqueLearningsSessions, // Fixed: Count actual sessions, not progress records
        avgTimeSpent: avgTimeSpent,
        completionRate: completionRate
      });

      // Prepare user stats
      const userStatsMap = {};
      filteredProgressData.forEach(progress => {
        if (!userStatsMap[progress.userSub]) {
          userStatsMap[progress.userSub] = {
            userSub: progress.userSub,
            learningsStarted: 0,
            learningsCompleted: 0,
            totalTimeSpent: 0,
            lastAccessed: null,
            avgProgress: 0
          };
        }

        const userStat = userStatsMap[progress.userSub];
        userStat.learningsStarted += 1;
        if ((progress.completionPercentage || 0) >= 80) {
          userStat.learningsCompleted += 1;
        }
        
        // Use the progress record's totalTimeSpent which is the authoritative source
        // Sessions are used for debugging but progress record is accumulated correctly
        const progressTime = progress.totalTimeSpent || 0;
        userStat.totalTimeSpent += progressTime;
        
        // Also log session data for debugging
        const userLearningSession = filteredSessionsData.filter(s => 
          s.userSub === progress.userSub && s.learningID === progress.learningID
        );
        const sessionTime = userLearningSession.reduce((total, session) => total + (session.duration || 0), 0);
        console.log(`User ${progress.userSub} Learning ${progress.learningID}: Progress time=${progressTime}s, Session time=${sessionTime}s`);
        
        if (!userStat.lastAccessed || new Date(progress.lastAccessedAt) > new Date(userStat.lastAccessed)) {
          userStat.lastAccessed = progress.lastAccessedAt;
        }
      });

      // Calculate average progress for each user
      Object.values(userStatsMap).forEach(userStat => {
        const userProgress = filteredProgressData.filter(p => p.userSub === userStat.userSub);
        const totalProgress = userProgress.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
        userStat.avgProgress = userProgress.length > 0 ? Math.round(totalProgress / userProgress.length) : 0;
      });

      setUserStats(Object.values(userStatsMap));
      setLoading(false);

    } catch (error) {
      console.error('Error fetching learning analytics:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const fetchUserDetailProgress = async (userSub) => {
    try {
      // Fetch fresh progress data for this specific user to avoid showing cached duplicates
      const userProgressResponse = await API.graphql(
        graphqlOperation(learningProgressesByOrganizationID, {
          organizationID: currentOrganization.id,
          filter: {
            userSub: { eq: userSub },
            _deleted: { ne: true }
          }
        })
      );
      
      let userProgressData = userProgressResponse.data.learningProgressesByOrganizationID.items;
      console.log('Fresh user progress data:', userProgressData);
      
      // Handle duplicates by grouping by learningID and keeping the most recent
      const progressByLearning = {};
      userProgressData.forEach(progress => {
        const learningID = progress.learningID;
        if (!progressByLearning[learningID]) {
          progressByLearning[learningID] = progress;
        } else {
          // Keep the most recent one
          if (new Date(progress.lastAccessedAt) > new Date(progressByLearning[learningID].lastAccessedAt)) {
            console.log(`Duplicate found for learning ${learningID}, keeping more recent record`);
            progressByLearning[learningID] = progress;
          } else {
            console.log(`Duplicate found for learning ${learningID}, keeping existing record`);
          }
        }
      });
      
      // Convert back to array
      userProgressData = Object.values(progressByLearning);
      console.log('Deduplicated user progress data:', userProgressData);
      
      // Enrich with learning names and detailed info
      const enrichedProgress = userProgressData.map(progress => {
        const learning = learnings[progress.learningID];
        console.log(`Looking up learning ${progress.learningID}:`, learning);
        
        // Get sessions for this user and learning
        const userSessions = learningSessions.filter(s => s.userSub === userSub && s.learningID === progress.learningID);
        
        // Use progress record's totalTimeSpent as authoritative source
        const progressTime = progress.totalTimeSpent || 0;
        
        // Calculate total time from sessions for comparison/debugging
        const totalTimeFromSessions = userSessions.reduce((total, session) => {
          console.log(`Session ${session.id}: duration = ${session.duration}`);
          return total + (session.duration || 0);
        }, 0);
        
        console.log(`Learning ${progress.learningID} - Sessions: ${userSessions.length}, Progress time: ${progressTime}s, Session time: ${totalTimeFromSessions}s`);
        console.log('User sessions:', userSessions);
        
        return {
          ...progress,
          learningTitle: learning?.title || `Learning ${progress.learningID}`,
          learningDescription: learning?.description || '',
          sessions: userSessions,
          totalTimeSpent: progressTime, // Use progress record time as authoritative
          sessionTimeSpent: totalTimeFromSessions // Keep session time for debugging
        };
      });
      
      console.log('Enriched progress (deduplicated):', enrichedProgress);
      setUserDetailProgress(enrichedProgress);
    } catch (error) {
      console.error('Error fetching user detail progress:', error);
    }
  };

  const showUserDetails = (user) => {
    setSelectedUser(user);
    fetchUserDetailProgress(user.userSub);
    setShowDetailModal(true);
  };

  // Check if current user is organization owner
  const isOrganizationOwner = () => {
    if (!currentUser?.attributes?.sub || !currentOrganization) return false;
    return currentOrganization.owner === currentUser.attributes.sub || 
           currentOrganization.additionalOwners?.includes(currentUser.attributes.sub);
  };

  const refreshModalCounts = async () => {
    try {
      console.log('Refreshing modal counts...');
      
      // Get fresh counts for the modal
      const [sessionsResp, progressResp, interactionsResp] = await Promise.all([
        API.graphql(
          graphqlOperation(learningSessionsByOrganizationIDAndStartTime, {
            organizationID: currentOrganization.id,
            filter: {
              _deleted: { ne: true }
            }
          })
        ),
        API.graphql(
          graphqlOperation(learningProgressesByOrganizationID, {
            organizationID: currentOrganization.id,
            filter: {
              _deleted: { ne: true }
            }
          })
        ),
        API.graphql(
          graphqlOperation(listSectionInteractions, {
            filter: {
              organizationID: { eq: currentOrganization.id },
              _deleted: { ne: true }
            },
            limit: 5000
          })
        )
      ]);
      
      const freshCounts = {
        sessions: sessionsResp.data.learningSessionsByOrganizationIDAndStartTime.items.length,
        progress: progressResp.data.learningProgressesByOrganizationID.items.length,
        interactions: interactionsResp.data.listSectionInteractions.items.length
      };
      
      console.log('Fresh modal counts:', freshCounts);
      setModalDataCounts(freshCounts);
      
    } catch (error) {
      console.error('Error refreshing modal counts:', error);
      setModalDataCounts({ sessions: 0, progress: 0, interactions: 0 });
    }
  };

  const resetAllAnalytics = async () => {
    if (resetConfirmText !== 'RESET ALL DATA') {
      alert('Please type "RESET ALL DATA" to confirm deletion.');
      return;
    }

    try {
      setResetLoading(true);
      
      // Clear all local storage for learning analytics
      console.log('Clearing local storage for learning analytics...');
      
      // Clear all learning-related localStorage entries for all users in the organization
      const storageKeys = Object.keys(localStorage);
      const learningKeys = storageKeys.filter(key => 
        key.startsWith('learning_') && 
        (key.includes('_sessionId') || key.includes('_progressId') || key.includes('_isTracking'))
      );
      
      learningKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      });
      
      // Fetch ALL learning sessions for this organization (not just recent ones)
      console.log('Fetching ALL learning sessions for deletion...');
      const allSessionsResponse = await API.graphql(
        graphqlOperation(learningSessionsByOrganizationIDAndStartTime, {
          organizationID: currentOrganization.id,
          filter: {
            _deleted: { ne: true }
          }
          // Remove date filter to get ALL sessions
        })
      );
      
      const allSessionsData = allSessionsResponse.data.learningSessionsByOrganizationIDAndStartTime.items;
      console.log(`Found ${allSessionsData.length} total sessions for organization`);
      
      // Delete all learning sessions for this organization
      const sessionsToDelete = allSessionsData.filter(session => 
        session.organizationID === currentOrganization.id
      );
      
      console.log(`Deleting ${sessionsToDelete.length} learning sessions...`);
      let sessionsDeleted = 0;
      let sessionsFailed = 0;
      
      // Batch delete learning sessions
      const batchSize = 10;
      for (let i = 0; i < sessionsToDelete.length; i += batchSize) {
        const batch = sessionsToDelete.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (session) => {
          try {
            // Use the standard GraphQL delete but with force flag if available
            const result = await API.graphql({
              query: `
                mutation DeleteLearningSession($id: ID!) {
                  deleteLearningSession(input: { id: $id }) {
                    id
                    _deleted
                  }
                }
              `,
              variables: { id: session.id }
            });
            
            sessionsDeleted++;
            console.log(`Deleted session ${session.id}`, result);
            
          } catch (error) {
            console.error(`Failed to delete session ${session.id}:`, error);
            sessionsFailed++;
          }
        }));
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < sessionsToDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Sessions: ${sessionsDeleted} deleted, ${sessionsFailed} failed`);
      
      // Fetch ALL learning progress for this organization (not just recent ones)
      console.log('Fetching ALL learning progress for deletion...');
      const allProgressResponse = await API.graphql(
        graphqlOperation(learningProgressesByOrganizationID, {
          organizationID: currentOrganization.id,
          filter: {
            _deleted: { ne: true }
          }
          // Remove date filter to get ALL progress records
        })
      );
      
      const allProgressData = allProgressResponse.data.learningProgressesByOrganizationID.items;
      console.log(`Found ${allProgressData.length} total progress records for organization`);
      
      // Delete all learning progress for this organization
      const progressToDelete = allProgressData.filter(progress => 
        progress.organizationID === currentOrganization.id
      );
      
      console.log(`Deleting ${progressToDelete.length} learning progress records...`);
      let progressDeleted = 0;
      let progressFailed = 0;
      
      // Batch delete learning progress
      for (let i = 0; i < progressToDelete.length; i += batchSize) {
        const batch = progressToDelete.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (progress) => {
          try {
            const result = await API.graphql({
              query: `
                mutation DeleteLearningProgress($id: ID!) {
                  deleteLearningProgress(input: { id: $id }) {
                    id
                    _deleted
                  }
                }
              `,
              variables: { id: progress.id }
            });
            
            progressDeleted++;
            console.log(`Deleted progress ${progress.id}`, result);
            
          } catch (error) {
            console.error(`Failed to delete progress ${progress.id}:`, error);
            progressFailed++;
          }
        }));
        
        if (i + batchSize < progressToDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Progress: ${progressDeleted} deleted, ${progressFailed} failed`);
      
      // Fetch ALL section interactions for this organization (not just recent ones)
      console.log('Fetching ALL section interactions for deletion...');
      const allInteractionsResponse = await API.graphql(
        graphqlOperation(listSectionInteractions, {
          filter: {
            organizationID: { eq: currentOrganization.id },
            _deleted: { ne: true }
            // Remove date filter to get ALL interactions
          },
          limit: 5000
        })
      );
      
      const allInteractionsData = allInteractionsResponse.data.listSectionInteractions.items;
      console.log(`Found ${allInteractionsData.length} total section interactions for organization`);
      
      // Delete all section interactions for this organization
      const interactionsToDelete = allInteractionsData.filter(interaction => 
        interaction.organizationID === currentOrganization.id
      );
      
      console.log(`Deleting ${interactionsToDelete.length} section interactions...`);
      let interactionsDeleted = 0;
      let interactionsFailed = 0;
      
      // Batch delete section interactions
      for (let i = 0; i < interactionsToDelete.length; i += batchSize) {
        const batch = interactionsToDelete.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (interaction) => {
          try {
            const result = await API.graphql({
              query: `
                mutation DeleteSectionInteraction($id: ID!) {
                  deleteSectionInteraction(input: { id: $id }) {
                    id
                    _deleted
                  }
                }
              `,
              variables: { id: interaction.id }
            });
            
            interactionsDeleted++;
            console.log(`Deleted interaction ${interaction.id}`, result);
            
          } catch (error) {
            console.error(`Failed to delete interaction ${interaction.id}:`, error);
            interactionsFailed++;
          }
        }));
        
        if (i + batchSize < interactionsToDelete.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Interactions: ${interactionsDeleted} deleted, ${interactionsFailed} failed`);
      
      const totalFailed = sessionsFailed + progressFailed + interactionsFailed;
      
      if (totalFailed === 0) {
        alert(`All learning analytics data has been successfully deleted.\n\n` +
              `✅ ${sessionsDeleted} sessions deleted\n` +
              `✅ ${progressDeleted} progress records deleted\n` +
              `✅ ${interactionsDeleted} section interactions deleted\n` +
              `✅ ${learningKeys.length} local storage entries cleared`);
      } else {
        alert(`Learning analytics deletion completed with some issues:\n\n` +
              `✅ ${sessionsDeleted}/${allSessionsData.length} sessions deleted\n` +
              `✅ ${progressDeleted}/${allProgressData.length} progress records deleted\n` +
              `✅ ${interactionsDeleted}/${allInteractionsData.length} section interactions deleted\n` +
              `✅ ${learningKeys.length} local storage entries cleared\n\n` +
              `Failed: ${sessionsFailed} sessions, ${progressFailed} progress, ${interactionsFailed} interactions\n\n` +
              `Check console for detailed error logs.`);
      }
      
      // Clear the current data immediately to reflect changes
      setLearningSessions([]);
      setLearningProgress([]);
      setUserStats([]);
      setAnalytics({
        totalUsers: 0,
        activeUsers: 0,
        totalLearnings: analytics.totalLearnings, // Keep learning modules count
        learningsStarted: 0,
        avgTimeSpent: 0,
        completionRate: 0
      });
      
      // Clear GraphQL cache to force fresh data
      try {
        if (API.graphql.cache) {
          API.graphql.cache.clear();
          console.log('Cleared GraphQL cache');
        }
      } catch (cacheError) {
        console.warn('Could not clear GraphQL cache:', cacheError);
      }
      
      // Add delay to allow DynamoDB eventual consistency
      console.log('Waiting for database consistency...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh the data from server
      console.log('Refreshing analytics data...');
      await fetchAnalytics();
      
      // Add delay and refresh modal counts for next time
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshModalCounts();
      
      // Close modal and reset form
      setShowResetModal(false);
      setResetConfirmText('');
      
    } catch (error) {
      console.error('Error resetting analytics data:', error);
      alert('Error occurred while deleting data. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };


  const getUserDisplayInfo = (userSub) => {
    const member = organizationMembers[userSub];
    const department = member?.department;
    
    // Fallback: If department object is not populated, try to find it by ID
    let departmentName = department?.name;
    if (!departmentName && member?.departmentID) {
      const foundDepartment = departments.find(dept => dept.id === member.departmentID);
      departmentName = foundDepartment?.name;
      console.log(`🔧 Fallback lookup for ${userSub}: deptID ${member.departmentID} -> ${departmentName}`);
    }
    
    // Debug department info for this user
    console.log(`🔍 getUserDisplayInfo for ${userSub}:`, {
      member,
      departmentID: member?.departmentID,
      department: member?.department,
      departmentName,
      fallbackUsed: !department?.name && !!departmentName
    });
    
    return {
      email: member?.email || 'Unknown User',
      userSub: userSub,
      displayName: member?.email || userSub,
      departmentID: member?.departmentID,
      departmentName: departmentName || 'No Department'
    };
  };

  const exportCSV = () => {
    const headers = ['User Email', 'User ID', 'Department', 'Learnings Started', 'Learnings Completed', 'Total Time (minutes)', 'Avg Progress (%)', 'Last Accessed'];
    const csvData = userStats.map(user => {
      const userInfo = getUserDisplayInfo(user.userSub);
      return [
        userInfo.email,
        user.userSub,
        userInfo.departmentName,
        user.learningsStarted,
        user.learningsCompleted,
        Math.floor(user.totalTimeSpent / 60),
        user.avgProgress,
        formatDate(user.lastAccessed)
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `learning-analytics-${currentOrganization.name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading analytics...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Error loading analytics: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Learning Analytics</h2>
          {selectedDepartment !== 'all' && departments.length > 0 && (
            <small className="text-muted">
              Filtered by department: {departments.find(d => d.id === selectedDepartment)?.name || 'Unknown'}
            </small>
          )}
        </div>
        <div className="d-flex gap-2">
          {console.log('🔍 Render check - departments.length:', departments.length, 'departments:', departments)}
          {departments.length > 0 ? (
            <select 
              className="form-select" 
              style={{ width: 'auto', minWidth: '180px' }}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ fontSize: '12px', color: '#666', padding: '6px 12px' }}>
              No departments found (Debug: {departments.length})
            </div>
          )}
          <select 
            className="form-select" 
            style={{ width: 'auto' }}
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <Button variant="outline-primary" onClick={exportCSV}>
            <FaDownload className="me-2" />
            Export CSV
          </Button>
          {isOrganizationOwner() && (
            <Button 
              variant="outline-danger" 
              onClick={() => {
                refreshModalCounts();
                setShowResetModal(true);
              }}
              title="Reset all learning analytics data (Organization Owner only)"
            >
              <FaTrash className="me-2" />
              Reset All Data
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <Row className="mb-4">
        <Col lg={4} md={6} sm={12}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaUsers className="text-primary mb-2" size={32} />
              <h3 className="mb-1">{analytics.totalUsers}</h3>
              <p className="text-muted mb-0">Total Users</p>
              <small className="text-success">{analytics.activeUsers} active</small>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} md={6} sm={12}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaPlay className="text-warning mb-2" size={32} />
              <h3 className="mb-1">{analytics.learningsStarted}</h3>
              <p className="text-muted mb-0">Learnings Started</p>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} md={6} sm={12}>
          <Card className="h-100">
            <Card.Body className="text-center">
              <FaClock className="text-secondary mb-2" size={32} />
              <h3 className="mb-1">{analytics.avgTimeSpent}m</h3>
              <p className="text-muted mb-0">Avg Time/User</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Progress Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">User Progress Details</h5>
        </Card.Header>
        <Card.Body>
          {userStats.length === 0 ? (
            <Alert variant="info">
              No learning activity found for the selected date range.
            </Alert>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Department</th>
                  <th>Learnings Started</th>
                  <th>Learnings Completed</th>
                  <th>Total Time</th>
                  <th>Last Accessed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {userStats
                  .sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))
                  .map((user) => {
                    const userInfo = getUserDisplayInfo(user.userSub);
                    return (
                    <tr key={user.userSub}>
                      <td>
                        <div className="d-flex align-items-center">
                          <UserAvatar 
                            userSub={user.userSub}
                            email={userInfo.email}
                            organizationID={currentOrganization?.id}
                            size={32}
                            className="me-2"
                          />
                          <div>
                            <div className="fw-medium">{userInfo.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg={userInfo.departmentID ? "secondary" : "light"} text={userInfo.departmentID ? "white" : "dark"}>
                          {userInfo.departmentName}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="primary">{user.learningsStarted}</Badge>
                      </td>
                      <td>
                        <Badge bg="success">{user.learningsCompleted}</Badge>
                      </td>
                      <td>{formatTime(user.totalTimeSpent)}</td>
                      <td>{formatDate(user.lastAccessed)}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => showUserDetails(user)}
                          style={{ minWidth: '120px' }}
                        >
                          <FaEye className="me-1" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                  })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* User Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              {selectedUser && (
                <UserAvatar 
                  userSub={selectedUser.userSub}
                  email={getUserDisplayInfo(selectedUser.userSub).email}
                  organizationID={currentOrganization?.id}
                  size={32}
                  className="me-2"
                />
              )}
              Learning Progress Details - {selectedUser ? getUserDisplayInfo(selectedUser.userSub).email : 'User'}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div>
              <div className="mb-4">
                <h6>Summary</h6>
                <Row>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h4>{selectedUser.learningsStarted}</h4>
                        <small>Started</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h4>{selectedUser.learningsCompleted}</h4>
                        <small>Completed</small>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h4>{formatTime(selectedUser.totalTimeSpent)}</h4>
                        <small>Total Time</small>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              <h6>Individual Learning Progress</h6>
              {userDetailProgress.length === 0 ? (
                <Alert variant="info">No learning progress found for this user.</Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Learning</th>
                      <th>Time Spent</th>
                      <th>Sessions</th>
                      <th>First Accessed</th>
                      <th>Last Accessed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetailProgress.map((progress) => (
                      <tr key={progress.id}>
                        <td>
                          <div>
                            <strong>{progress.learningTitle}</strong>
                            {progress.learningDescription && (
                              <div>
                                <small className="text-muted">{progress.learningDescription}</small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{formatTime(progress.totalTimeSpent || 0)}</td>
                        <td>
                          <Badge bg="primary">{progress.sessions?.length || 0}</Badge>
                        </td>
                        <td>{progress.firstAccessedAt ? formatDate(progress.firstAccessedAt) : 'N/A'}</td>
                        <td>{progress.lastAccessedAt ? formatDate(progress.lastAccessedAt) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Analytics Modal */}
      <Modal show={showResetModal} onHide={() => !resetLoading && setShowResetModal(false)} centered>
        {resetLoading && (
          <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center" style={{backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 1000, borderRadius: '0.375rem'}}>
            <div className="text-center">
              <div className="spinner-border text-danger mb-2" role="status"></div>
              <div><strong>Deleting analytics data...</strong></div>
              <small className="text-muted">Please wait, this may take a moment</small>
            </div>
          </div>
        )}
        <Modal.Header closeButton={!resetLoading}>
          <Modal.Title className="text-danger">
            <FaExclamationTriangle className="me-2" />
            Reset All Learning Analytics Data
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <Alert.Heading>⚠️ WARNING: This action cannot be undone!</Alert.Heading>
            <p>
              This will permanently delete ALL learning analytics data for your organization, including:
            </p>
            <ul>
              <li>All user learning sessions ({modalDataCounts.sessions} total sessions found)</li>
              <li>All user learning progress records ({modalDataCounts.progress} total records found)</li>
              <li>All section interactions ({modalDataCounts.interactions} total interactions found)</li>
              <li>All time tracking data and local storage</li>
            </ul>
            {(modalDataCounts.sessions > 0 || modalDataCounts.progress > 0 || modalDataCounts.interactions > 0) ? (
              <Alert variant="danger" className="mt-2">
                <small>
                  <strong>⚠️ Warning:</strong> This will permanently delete {modalDataCounts.sessions + modalDataCounts.progress + modalDataCounts.interactions} total records from your database.
                </small>
              </Alert>
            ) : (
              <Alert variant="info" className="mt-2">
                <small>
                  <strong>ℹ️ Info:</strong> No analytics data found to delete. Your organization already has clean analytics.
                </small>
              </Alert>
            )}
            <hr />
            <p className="mb-0">
              <strong>This will NOT delete:</strong> Learning content, quizzes, or user accounts
            </p>
          </Alert>
          
          <div className="mt-3">
            <label htmlFor="confirmText" className="form-label">
              <strong>Type "RESET ALL DATA" to confirm deletion:</strong>
            </label>
            <input
              id="confirmText"
              type="text"
              className="form-control"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESET ALL DATA"
              disabled={resetLoading}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowResetModal(false);
              setResetConfirmText('');
              setModalDataCounts({ sessions: 0, progress: 0, interactions: 0 });
            }}
            disabled={resetLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={resetAllAnalytics}
            disabled={resetLoading || resetConfirmText !== 'RESET ALL DATA' || (modalDataCounts.sessions === 0 && modalDataCounts.progress === 0 && modalDataCounts.interactions === 0)}
          >
            {resetLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Deleting...
              </>
            ) : (
              <>
                <FaTrash className="me-2" />
                Reset All Data
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LearningAnalytics;