import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Row, Col, Button, Badge, Modal, Form, Spinner, Image, InputGroup, OverlayTrigger, Tooltip, Alert } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as subscriptions from '../../graphql/subscriptions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faPlus, faPencil, faTrash, faCopy, faPlay, faCheck, faVideo, faEnvelope, faLock, faListCheck, faChartSimple, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useToolContext } from '../../contexts/ToolContext';
import { useAward } from '../../contexts/AwardContext';
import iconMappings from '../../utils/iconMappings';
import LFlogo from '../../assets/VibeStack_pro.png';
import { handleReportCompletionAward, handleReportCompleteAward } from '../../utils/awards';
import {
  sendReportCreatedNotification,
  sendReportCompletedNotification,
  sendReportCreatedNotificationWithTemplate,
  sendReportCompletedNotificationWithTemplate,
  sendReportMemberAddedNotification,
  sendEmailNotification
} from '../../utils/emailNotifications';
import ReportModal from '../modals/ReportModal';
import { getUserAvatarByEmail } from '../../utils/userAvatarService';
import UserAvatar from '../shared/UserAvatar';

const Reports = () => {
  console.log('Reports component mounting/re-rendering');
  const { activeOrganization } = useOrganization();
  const { tools, TOOL_ID } = useToolContext();
  const { showAward } = useAward();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Add state to track which report is being completed
  const [completingReportId, setCompletingReportId] = useState(null);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  
  // Delete dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  
  // Copy dialog states
  const [copyDialogVisible, setCopyDialogVisible] = useState(false);
  const [fullReport, setFullReport] = useState(null);
  const [copyReportName, setCopyReportName] = useState("");
  const [checkedCategories, setCheckedCategories] = useState([]);
  const [checkedActionItems, setCheckedActionItems] = useState([]);
  const [checkedChartItems, setCheckedChartItems] = useState([]);
  const [isLoadingReportDetails, setIsLoadingReportDetails] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  
  // User state
  const [userSub, setUserSub] = useState('');
  
  // Organization and project states
  const [organizationID, setOrganizationID] = useState('');
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProjectID, setSelectedProjectID] = useState(null);
  const [projectMenuVisible, setProjectMenuVisible] = useState(false);

  // Add new filter states
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);

  // Add new states for organization members
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [assignedUserDetails, setAssignedUserDetails] = useState({});

  const [ownedReports, setOwnedReports] = useState([]);
  const [assignedReports, setAssignedReports] = useState([]);

  // Initialize filter from URL parameters
  useEffect(() => {
    const typeFilter = searchParams.get('type');
    if (typeFilter) {
      setSelectedTypeFilter(typeFilter);
    }
  }, [searchParams]);


  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userSub && organizationID) {
      fetchReports(userSub);
      fetchProjects();
      fetchOrganizationMembers();
    }
  }, [userSub, organizationID]);

  // Add new filter effect
  useEffect(() => {
    if (!reports) return;
    
    console.log('Updating filtered reports based on reports state change');
    
    // Log count of reports by user_sub
    const userReportCount = reports.filter(report => report.user_sub === userSub).length;
    console.log(`Found ${userReportCount} reports with user_sub matching ${userSub}`);
    
    let filtered = [...reports];
    
    if (selectedTypeFilter) {
      filtered = filtered.filter(report => report.type === selectedTypeFilter);
    }
    
    if (selectedProjectFilter) {
      filtered = filtered.filter(report => report.projectID === selectedProjectFilter);
    }
    
    setFilteredReports(filtered);
  }, [reports, selectedTypeFilter, selectedProjectFilter, userSub]);

  const fetchUserData = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setUserSub(user.attributes.sub);
      if (activeOrganization?.id) {
        setOrganizationID(activeOrganization.id);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchReports = async (userSub) => {
    try {
      console.log('fetchReports called with userSub:', userSub, 'organizationID:', organizationID);
      
      if (!organizationID) {
        console.log('No active organization, skipping report fetch');
        setOwnedReports([]);
        setAssignedReports([]);
        setLoading(false);
        return;
      }

      console.log('Fetching reports for organization:', organizationID);
      
      // Function to fetch all pages of reports using pagination
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
      
      // Fetch both owned and assigned reports with pagination
      const [ownedList, assignedList] = await Promise.all([
        fetchAllReports(queries.listReports, {
          filter: {
            user_sub: { eq: userSub },
            organizationID: { eq: organizationID },
            _deleted: { ne: true }
          },
          limit: 100 // Fetch up to 100 items per page
        }),
        fetchAllReports(queries.listReports, {
          filter: {
            assignedMembers: { contains: userSub },
            organizationID: { eq: organizationID },
            _deleted: { ne: true }
          },
          limit: 100 // Fetch up to 100 items per page
        })
      ]);
      
      // Filter out reports that the user owns from the assigned list
      const filteredAssignedList = assignedList.filter(item => item.user_sub !== userSub);
      
      // Debug: Log what reports we're fetching
      console.log('Owned reports fetched:', ownedList.map(r => ({
        id: r.id,
        name: r.name,
        user_sub: r.user_sub,
        ownerEmail: r.ownerEmail
      })));
      
      console.log('Assigned reports fetched:', filteredAssignedList.map(r => ({
        id: r.id,
        name: r.name,
        user_sub: r.user_sub,
        ownerEmail: r.ownerEmail
      })));
      
      // Fetch project details for each report
      const processReportList = async (reportsList) => {
        return await Promise.all(
          reportsList.map(async (report) => {
            if (report.projectID) {
              try {
                const projectResult = await API.graphql({
                  query: queries.getProject,
                  variables: { id: report.projectID }
                });
                return {
                  ...report,
                  project: projectResult.data.getProject
                };
              } catch (error) {
                console.error('Error fetching project for report:', error);
                return report;
              }
            }
            return report;
          })
        );
      };

      const ownedReportsWithProjects = await processReportList(ownedList);
      const assignedReportsWithProjects = await processReportList(filteredAssignedList);

      // Sort reports by creation date
      const sortByDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
      
      setOwnedReports(ownedReportsWithProjects.sort(sortByDate));
      setAssignedReports(assignedReportsWithProjects.sort(sortByDate));
      
      // Update filtered reports
      const allReports = [...ownedReportsWithProjects, ...assignedReportsWithProjects];
      setFilteredReports(allReports);
      setReports(allReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setOwnedReports([]);
      setAssignedReports([]);
      setReports([]);
      setFilteredReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Function to fetch all pages for a given filter
      const fetchAllPages = async (filter) => {
        let items = [];
        let nextToken = null;
        do {
          const result = await API.graphql({
            query: queries.listProjects,
            variables: {
              filter,
              limit: 1000,
              nextToken
            }
          });
          items = [...items, ...result.data.listProjects.items];
          nextToken = result.data.listProjects.nextToken;
        } while (nextToken);
        return items;
      };
      
      // Fetch projects where user is the owner
      const ownedProjects = await fetchAllPages({
        owner: { eq: user.attributes.sub },
        organizationID: { eq: organizationID },
        _deleted: { ne: true },
        status: { ne: 'CANCELLED' }
      });

      // Fetch projects where user is a member (via ProjectMember table)
      const memberResult = await API.graphql({
        query: queries.listProjectMembers,
        variables: {
          filter: {
            userSub: { eq: user.attributes.sub },
            _deleted: { ne: true }
          },
          limit: 1000
        }
      });

      // Get project details for member projects
      const memberProjectPromises = memberResult.data.listProjectMembers.items.map(async (member) => {
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
                           project.organizationID === organizationID && 
                           !project._deleted && 
                           project.status !== 'CANCELLED');

      // Combine owned and member projects, removing duplicates
      const allProjects = [...ownedProjects, ...memberProjects];
      const uniqueProjects = Array.from(new Map(allProjects.map(project => [project.id, project])).values());
      
      const projects = uniqueProjects.filter(item => !item._deleted);
      setAvailableProjects(projects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchOrganizationMembers = async () => {
    try {
      console.log('Fetching organization members for org:', organizationID);
      setLoadingMembers(true);
      const result = await API.graphql({
        query: queries.organizationMembersByOrganizationID,
        variables: {
          organizationID: organizationID,
          filter: {
            status: { eq: "ACTIVE" }
          }
        }
      });
      
      const members = result.data.organizationMembersByOrganizationID.items.filter(item => !item._deleted);
      console.log(`Fetched ${members.length} organization members:`, members.map(m => ({ 
        userSub: m.userSub, 
        email: m.email 
      })));
      
      setOrganizationMembers(members);
      return members; // Return members for immediate use if needed
    } catch (error) {
      console.error('Error fetching organization members:', error);
      return []; // Return empty array on error
    } finally {
      setLoadingMembers(false);
    }
  };

  const deleteReport = async () => {
    try {
      if (!currentReport) return;

      // If VSM report, delete associated VSM first
      if (currentReport.type === "Value Stream Mapping Report") {
        const vsmResult = await API.graphql({
          query: queries.listVsms,
          variables: {
            filter: { reportID: { eq: currentReport.id } }
          }
        });
        
        const associatedVsm = vsmResult.data.listVsms.items;
        
        if (associatedVsm.length > 0) {
          await API.graphql({
            query: mutations.deleteVsm,
            variables: { 
              input: {
                id: associatedVsm[0].id
              }
            }
          });
        }
      }

      // Delete associated action items
      const actionItemsResult = await API.graphql({
        query: queries.listActionItems,
        variables: {
          filter: { reportID: { eq: currentReport.id } }
        }
      });

      const associatedActionItems = actionItemsResult.data.listActionItems.items;

      for (const item of associatedActionItems) {
        await API.graphql({
          query: mutations.deleteActionItems,
          variables: { 
            input: {
              id: item.id
            }
          }
        });
      }
      
      // Delete the report
      await API.graphql({
        query: mutations.deleteReport,
        variables: { 
          input: {
            id: currentReport.id
          }
        }
      });
      
      await fetchReports(userSub);
      setDeleteDialogVisible(false);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const completeReport = async (reportId) => {
    try {
      console.log('Completing report:', reportId);
      
      // Get report data first
      const reportQuery = await API.graphql({
        query: queries.getReport,
        variables: { id: reportId }
      });
      
      const reportData = reportQuery.data.getReport;
      console.log('Fetched report data:', {
        id: reportData.id,
        name: reportData.name,
        type: reportData.type,
        assignedMembers: reportData.assignedMembers || [],
        user_sub: reportData.user_sub
      });
      
      // Update the report status
      const updateResult = await API.graphql({
        query: mutations.updateReport,
        variables: { 
          input: { 
            id: reportId,
            completed: true,
            _version: reportData._version
          } 
        }
      });
      
      const completedReport = updateResult.data.updateReport;
      console.log('Report completed:', completedReport);
      
      // Handle awards for report completion
      try {
        const user = await Auth.currentAuthenticatedUser();
        const userEmail = user.attributes.email;
        console.log('Current user email for awards:', userEmail, 'userSub:', userSub);
        
        // Get all recipients: assigned members and report creator
        const assignedMembers = completedReport.assignedMembers || [];
        console.log('Assigned members from report:', assignedMembers);
        
        if (assignedMembers.length === 0) {
          console.log('No assigned members found in the report');
        }
        
        // Get member details directly from local state if available
        const memberDetails = [];
        for (const memberSub of assignedMembers) {
          const member = organizationMembers.find(m => m.userSub === memberSub);
          if (member) {
            memberDetails.push({
              userSub: memberSub,
              email: member.email
            });
          } else {
            console.log(`Member with userSub ${memberSub} not found in local state`);
          }
        }
        
        console.log('Member details from local state:', memberDetails);
        
        // Get creator email (from current user)
        console.log('Report creator email:', userEmail);
        
        // Create a list of all users who should receive awards (report owner + assignees)
        // First add the report owner (current user)
        const awardRecipients = [{ userSub, email: userEmail }];
        
        // Add assigned members (avoiding duplicates if the owner is also an assignee)
        memberDetails.forEach(member => {
          if (member.userSub !== userSub) {
            awardRecipients.push(member);
          }
        });
        
        console.log('Award recipients:', awardRecipients);
        
        // Determine the award type and coins to give
        let awardType = completedReport.type; // specific report type
        let useGenericAward = false;
        let awardCoins = 0;
        
        // Process awards for each recipient
        let currentUserAwardCoins = 0; // Track coins for current user's award
        for (const recipient of awardRecipients) {
          console.log(`Processing award for recipient: ${recipient.userSub}`);
          
          // First try to use the specific report type award
          console.log('Calling handleReportCompleteAward with organizationID:', organizationID, 'reportType:', completedReport.type);
          let awardResult = await handleReportCompleteAward(organizationID, completedReport.type, recipient.userSub);
          
          if (awardResult) {
            console.log(`Report type-specific award processed successfully for ${recipient.userSub}`);
            // If this is the current user, track their coins
            if (recipient.userSub === userSub) {
              currentUserAwardCoins = 20; // Most type-specific awards give 20 coins
            }
          } else {
            console.log('No type-specific award found, trying generic report completion award');
            // Fallback to generic report completion award
            awardResult = await handleReportCompletionAward(recipient.userSub, organizationID);
            
            if (awardResult) {
              console.log(`Generic report completion award processed successfully for ${recipient.userSub}`);
              // If this is the current user, track their coins
              if (recipient.userSub === userSub) {
                currentUserAwardCoins = 10; // Generic report completion awards give 10 coins
              }
            } else {
              console.warn(`Failed to process any report completion awards for ${recipient.userSub}`);
            }
          }
        }
        
        // Show award animation only once for the current user if they received coins
        if (currentUserAwardCoins > 0) {
          console.log('Showing award animation for', currentUserAwardCoins, 'coins');
          showAward(currentUserAwardCoins);
        }
        
        // Prepare the direct list of emails for notifications
        const directEmails = awardRecipients.map(r => r.email).filter(email => email);
        
        // Remove duplicates
        const uniqueEmails = [...new Set(directEmails)];
        console.log('Unique emails to notify:', uniqueEmails);
        
        if (uniqueEmails.length === 0) {
          console.log('No valid emails found for notification, falling back to standard method');
          // Send notification using the standard method
          const result = await sendReportCompletedNotification(completedReport, organizationID);
          if (result) {
            console.log('Report completion notifications sent successfully via standard method');
          } else {
            console.warn('Failed to send report completion notifications via standard method');
          }
        } else {
          // Send notification directly using email list
          console.log('Sending report completion notification directly to emails:', uniqueEmails);
          
          // Prepare notification data
          const notificationData = {
            reportName: completedReport.name,
            reportURL: `${window.location.origin}/report/${completedReport.id}`,
            reportType: completedReport.type
          };
          
          // Try to send the email notification directly using prepared email list
          const result = await sendEmailNotification({
            type: 'REPORT_COMPLETED',
            to: uniqueEmails,
            data: notificationData,
            organizationID
          });
          
          if (result) {
            console.log('Report completion notifications sent successfully via direct method');
          } else {
            console.warn('Failed to send report completion notifications via direct method');
          }
        }
      } catch (error) {
        console.error('Error processing report completion rewards or sending notifications:', error);
      }
      
      // Update the local state
      setReports(prevReports => {
        return prevReports.map(report => {
          if (report.id === reportId) {
            return { ...report, completed: true };
          }
          return report;
        });
      });
      
      setOwnedReports(prevReports => {
        return prevReports.map(report => {
          if (report.id === reportId) {
            return { ...report, completed: true };
          }
          return report;
        });
      });
      
      setAssignedReports(prevReports => {
        return prevReports.map(report => {
          if (report.id === reportId) {
            return { ...report, completed: true };
          }
          return report;
        });
      });
      
    } catch (error) {
      console.error('Error completing report:', error);
    } finally {
      // Always reset the completing state, whether successful or not
      setCompletingReportId(null);
    }
  };

  const getReportTypeColor = (type) => {
    const typeColors = {
      '5S': 'primary',
      'VSM': 'success',
      'Histogram': 'warning',
      'Pareto': 'info',
      'Standard Work': 'secondary'
    };
    return typeColors[type] || 'light';
  };

  const openModal = (report) => {
    setCurrentReport(report);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentReport(null);
  };


  const fetchFullReport = async (reportId) => {
    setIsLoadingReportDetails(true);
    try {
      const reportResult = await API.graphql({
        query: queries.getReport,
        variables: { id: reportId }
      });
      
      const reportData = reportResult.data.getReport;
      if (!reportData) {
        console.error('Report not found');
        return null;
      }

      // Get all categories for this report
      const categoriesResult = await API.graphql({
        query: queries.listCategories,
        variables: {
          filter: { reportID: { eq: reportId } }
        }
      });
      const categories = categoriesResult.data.listCategories.items;

      // Fetch statements for each category
      for (let category of categories) {
        const statementsResult = await API.graphql({
          query: queries.listStatements,
          variables: {
            filter: { categoriesID: { eq: category.id } }
          }
        });
        category.Statements = statementsResult.data.listStatements.items;
      }

      // Get all action items for this report
      const actionItemsResult = await API.graphql({
        query: queries.listActionItems,
        variables: {
          filter: { reportID: { eq: reportId } }
        }
      });
      const actionItems = actionItemsResult.data.listActionItems.items;

      // Get chart data if applicable
      let chartData = null;
      if (reportData.type === 'Brainstorming Report' || reportData.type === 'Fishbone Diagram Report' ||
          reportData.type === 'Impact Map Report' || reportData.type === 'Stakeholder Analysis Report' ||
          reportData.type === 'Histogram Report' || reportData.type === 'Pareto Chart Report' ||
          reportData.type === 'Run Chart Report' || reportData.type === 'Scatter Plot Report' ||
          reportData.type === 'Standard Work Report') {
        const chartDataResult = await API.graphql({
          query: queries.listChartData,
          variables: {
            filter: { reportID: { eq: reportId } }
          }
        });
        chartData = chartDataResult.data.listChartData.items;
      }

      const fullReportData = {
        ...reportData,
        Categories: categories,
        ActionItems: actionItems,
        ChartData: chartData,
      };

      setFullReport(fullReportData);
      setCopyReportName(fullReportData.name);
      setCheckedCategories(categories.map(category => category.id));
      setCheckedActionItems(actionItems.map(actionItem => actionItem.id));
      if (chartData) {
        setCheckedChartItems(chartData.map(item => item.id));
      }
    } catch (error) {
      console.error('Error fetching full report:', error);
    } finally {
      setIsLoadingReportDetails(false);
    }
  };

  const copyReport = async () => {
    setIsCopying(true);
    try {
      if (!organizationID) {
        console.error('No active organization found');
        return;
      }

      // Get current user's email
      const currentUser = await Auth.currentAuthenticatedUser();
      const ownerEmail = currentUser.attributes.email;

      const copiedName = `Copy of ${copyReportName}`;
      const newReportResult = await API.graphql({
        query: mutations.createReport,
        variables: {
          input: {
            name: copiedName,
            type: fullReport.type,
            user_sub: userSub,
            ownerEmail: ownerEmail,
            ai_id: fullReport.ai_id || 'Lorem ipsum dolor sit amet',
            bones: fullReport.bones || null,
            media: fullReport.media || '',
            target: fullReport.target || '',
            xaxis: fullReport.xaxis || '',
            yaxis: fullReport.yaxis || '',
            trend: fullReport.trend || null,
            organizationID: organizationID,
            completed: false,
            projectID: fullReport.projectID || null,
          }
        }
      });

      const copiedReport = newReportResult.data.createReport;

      // Copy selected categories and their statements
      await Promise.all(
        checkedCategories.map(async (categoryId) => {
          const category = fullReport.Categories.find(c => c.id === categoryId);
          if (!category) return;

          const newCategoryResult = await API.graphql({
            query: mutations.createCategories,
            variables: {
              input: {
                name: category.name,
                reportID: copiedReport.id,
                orderIndex: category.orderIndex,
                assignees: category.assignees || [],
                attachments: category.attachments || [],
                description: category.description || '',
              }
            }
          });

          const copiedCategory = newCategoryResult.data.createCategories;

          // Copy statements
          if (category.Statements) {
            await Promise.all(
              category.Statements.map(statement =>
                API.graphql({
                  query: mutations.createStatements,
                  variables: {
                    input: {
                      name: statement.name,
                      value: statement.value,
                      default: statement.default,
                      owner: statement.owner,
                      categoriesID: copiedCategory.id,
                    }
                  }
                })
              )
            );
          }
        })
      );

      // Copy selected action items
      if (checkedActionItems.length > 0) {
        await Promise.all(
          checkedActionItems.map(async (actionItemId) => {
            const actionItem = fullReport.ActionItems.find(ai => ai.id === actionItemId);
            if (!actionItem) return;

            return API.graphql({
              query: mutations.createActionItems,
              variables: {
                input: {
                  note: actionItem.note || false,
                  description: actionItem.description || '',
                  title: actionItem.title,
                  duedate: actionItem.duedate,
                  status: actionItem.status,
                  assignor: actionItem.assignor,
                  assignees: actionItem.assignees || [],
                  attachments: actionItem.attachments || [],
                  reportID: copiedReport.id,
                  user_sub: actionItem.user_sub,
                }
              }
            });
          })
        );
      }

      // Copy selected chart data
      if (checkedChartItems.length > 0) {
        await Promise.all(
          checkedChartItems.map(async (chartItemId) => {
            const chartItem = fullReport.ChartData.find(cd => cd.id === chartItemId);
            if (!chartItem) return;

            return API.graphql({
              query: mutations.createChartData,
              variables: {
                input: {
                  text: chartItem.text || '',
                  textColor: chartItem.textColor || '',
                  posX: chartItem.posX || '',
                  posY: chartItem.posY || '',
                  reportID: copiedReport.id,
                  value: chartItem.value || '',
                  date: chartItem.date || '',
                  Description: chartItem.Description || '',
                  orderIndex: chartItem.orderIndex || 0,
                }
              }
            });
          })
        );
      }

      setCopyDialogVisible(false);
      
      // Immediately add the copied report to the state for a faster UI update
      const copiedReportWithProject = copiedReport.projectID
        ? { ...copiedReport, project: availableProjects.find(p => p.id === copiedReport.projectID) }
        : copiedReport;
        
      // Add to owned reports
      setOwnedReports(prevReports => {
        const updatedReports = [copiedReportWithProject, ...prevReports];
        return updatedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      
      // Update all reports list
      setReports(prevReports => {
        const updatedReports = [copiedReportWithProject, ...prevReports];
        return updatedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
      
      // Still fetch to ensure consistency
      await fetchReports(userSub);
    } catch (error) {
      console.error('Error copying report:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const handleReportClick = (report) => {
    switch (report.type) {
      case 'Brainstorming Report':
      case 'Fishbone Diagram Report':
      case 'Impact Map Report':
      case 'Stakeholder Analysis Report':
        navigate(`/report/bs/${report.id}`);
        break;
      case 'Histogram Report':
      case 'Pareto Chart Report':
      case 'Run Chart Report':
      case 'Scatter Plot Report':
        navigate(`/report/hg/${report.id}`);
        break;
      case 'Standard Work Report':
        navigate(`/report/sw/${report.id}`);
        break;
      case 'Value Stream Mapping Report':
        navigate(`/report/vsm/${report.id}`);
        break;
      default:
        navigate(`/report/${report.id}`);
        break;
    }
  };

  const renderReportCard = (report) => {
    const iconSource = iconMappings[report.type] || LFlogo;
    const projectName = report.project?.name || availableProjects.find(p => p.id === report.projectID)?.name;
    
    // Get member details from organizationMembers
    const assignedMemberDetails = report.assignedMembers?.map(userSub => {
      const member = organizationMembers.find(m => m.userSub === userSub);
      return {
        userSub,
        email: member?.email || 'Unknown Email',
        profileImage: member?.profileImage,
        firstName: member?.firstName || '',
        lastName: member?.lastName || ''
      };
    }) || [];
    
    // Find the corresponding tool and tutorial link
    const tool = tools?.find(t => t.subtitle === report.type);
    const tutorialLink = tool?.tutorialLink;
    
    return (
      <Card className="mb-3 report-card">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <div 
              className="p-3 rounded me-3" 
              style={{ backgroundColor: '#00897b', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img 
                src={iconSource} 
                alt={report.type}
                style={{ width: '30px', height: '30px', objectFit: 'contain' }}
              />
            </div>
            <div className="flex-grow-1">
              <h5 className="mb-1 report-title">
                {truncateText(report.name || 'Untitled Report', 15)}
              </h5>
              <div className="d-flex flex-wrap gap-2">
                <Badge bg="danger" className="text-white">
                  {report.type}
                </Badge>
                {projectName && (
                  <Badge style={{ backgroundColor: '#00897b' }} className="text-white">
                    {truncateText(projectName, 15)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <small className="text-muted d-block mb-3">
            Created on: {new Date(report.updatedAt || Date.now()).toLocaleString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: 'numeric', 
              second: 'numeric', 
              hour12: true 
            })}
          </small>

          {/* Team section - Owner and Assigned Members */}
          <div className="mb-3">
            {/* Owner display */}
            {report.ownerEmail && (
              <div className="d-flex align-items-center mb-2">
                <small className="text-muted me-2" style={{ width: '85px' }}>Owner:</small>
                <div className="d-flex align-items-center">
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <UserAvatar
                      email={report.ownerEmail}
                      size={32}
                      customColor="#007a6c"
                      isOwner={true}
                      tooltipLabel={report.ownerEmail}
                    />
                  </div>
                  <small className="text-muted ms-2" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {report.ownerEmail}
                  </small>
                </div>
              </div>
            )}

            {/* Assigned members */}
            {assignedMemberDetails.length > 0 && (
              <div className="d-flex align-items-center">
                <small className="text-muted me-2" style={{ width: '85px' }}>Members:</small>
                <div className="d-flex align-items-center">
                  {assignedMemberDetails.slice(0, 3).map(({ userSub, email }, index) => (
                    <div 
                      key={userSub}
                      style={{
                        marginLeft: index > 0 ? '-8px' : '0',
                        position: 'relative',
                        zIndex: assignedMemberDetails.length - index
                      }}
                    >
                      <UserAvatar
                        email={email}
                        userSub={userSub}
                        size={32}
                        tooltipLabel={email}
                      />
                    </div>
                  ))}
                  {assignedMemberDetails.length > 3 && (
                    <div
                      style={{
                        marginLeft: '-8px',
                        position: 'relative',
                        zIndex: 0
                      }}
                    >
                      <UserAvatar
                        email={`+${assignedMemberDetails.length - 3}`}
                        size={32}
                        tooltipLabel={`${assignedMemberDetails.length - 3} more members`}
                      />
                    </div>
                  )}
                  <small className="text-muted ms-2">
                    {assignedMemberDetails.length} {assignedMemberDetails.length === 1 ? 'member' : 'members'}
                  </small>
                </div>
              </div>
            )}
          </div>

          {report.completed && (
            <div className="mb-3 p-2 bg-warning bg-opacity-25 rounded">
              <p className="mb-0 text-center">Congrats on completing the report! 🎉</p>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center border-top pt-3">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleReportClick(report)}
              style={{ borderColor: '#00897b', color: '#00897b', padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: '70px' }}
            >
              <FontAwesomeIcon icon={faPlay} className="me-1" /> Open
            </Button>
            <div className="report-actions">
              {tutorialLink && (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Watch Tutorial Video</Tooltip>}
                >
                  <Button
                    as="a"
                    variant="link"
                    className="p-1 me-2"
                    href={tutorialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#00897b' }}
                  >
                    <FontAwesomeIcon icon={faVideo} />
                  </Button>
                </OverlayTrigger>
              )}
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Edit Report</Tooltip>}
              >
                <Button
                  variant="link"
                  className="p-1 me-2"
                  onClick={() => openModal(report)}
                  style={{ color: '#00897b' }}
                >
                  <FontAwesomeIcon icon={faPencil} />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Copy Report</Tooltip>}
              >
                <Button
                  variant="link"
                  className="p-1 me-2"
                  onClick={() => {
                    setCopyDialogVisible(true);
                    fetchFullReport(report.id);
                  }}
                  style={{ color: '#00897b' }}
                >
                  <FontAwesomeIcon icon={faCopy} />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Mark as Complete</Tooltip>}
              >
                <Button
                  variant="link"
                  className="p-1 me-2"
                  onClick={() => {
                    setCompletingReportId(report.id);
                    completeReport(report.id);
                  }}
                  style={{ color: '#00897b' }}
                  disabled={completingReportId === report.id}
                >
                  {completingReportId === report.id ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} />
                  )}
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Delete Report</Tooltip>}
              >
                <Button
                  variant="link"
                  className="p-1"
                  onClick={() => {
                    setCurrentReport(report);
                    setDeleteDialogVisible(true);
                  }}
                  style={{ color: '#dc3545' }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </OverlayTrigger>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderDeleteDialog = () => (
    <Modal show={deleteDialogVisible} onHide={() => setDeleteDialogVisible(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Delete Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this report?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setDeleteDialogVisible(false)}>
          Cancel
        </Button>
        <Button variant="danger" onClick={deleteReport}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const renderCopyDialog = () => (
    <Modal show={copyDialogVisible} onHide={() => setCopyDialogVisible(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Copy Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoadingReportDetails ? (
          <div className="text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading report details...</p>
          </div>
        ) : (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Report Name</Form.Label>
              <Form.Control
                type="text"
                value={copyReportName}
                onChange={(e) => setCopyReportName(e.target.value)}
                disabled
              />
            </Form.Group>

            {fullReport?.Categories?.length > 0 && (
              <div className="mb-3">
                <h6>Categories</h6>
                {fullReport.Categories.map(category => (
                  <Form.Check
                    key={category.id}
                    type="checkbox"
                    label={category.name}
                    checked={checkedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCheckedCategories([...checkedCategories, category.id]);
                      } else {
                        setCheckedCategories(checkedCategories.filter(id => id !== category.id));
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {fullReport?.ActionItems?.length > 0 && (
              <div className="mb-3">
                <h6>Action Items</h6>
                {fullReport.ActionItems.map(item => (
                  <Form.Check
                    key={item.id}
                    type="checkbox"
                    label={item.title}
                    checked={checkedActionItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCheckedActionItems([...checkedActionItems, item.id]);
                      } else {
                        setCheckedActionItems(checkedActionItems.filter(id => id !== item.id));
                      }
                    }}
                  />
                ))}
              </div>
            )}

            {fullReport?.ChartData?.length > 0 && (
              <div className="mb-3">
                <h6>Chart Data</h6>
                {fullReport.ChartData.map((item, index) => (
                  <Form.Check
                    key={item.id}
                    type="checkbox"
                    label={`Data Point ${index + 1}`}
                    checked={checkedChartItems.includes(item.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCheckedChartItems([...checkedChartItems, item.id]);
                      } else {
                        setCheckedChartItems(checkedChartItems.filter(id => id !== item.id));
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setCopyDialogVisible(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={copyReport}
          disabled={isLoadingReportDetails || isCopying}
        >
          {isCopying ? 'Copying...' : 'Copy Report'}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  const truncateText = (text, maxLength) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const renderFilters = () => {
    const reportTypes = tools?.filter(tool => 
      tool.type === "Lean Tools" || tool.type === "Quality"
    ) || [];

    return (
      <Row className="mb-4 pt-3">
        <Col md={6} className="mb-3 mb-md-0">
          <Form.Group>
            <Form.Label>Filter by Report Type</Form.Label>
            <Form.Select
              value={selectedTypeFilter}
              onChange={(e) => {
                const newType = e.target.value;
                setSelectedTypeFilter(newType);
                // Update URL parameters
                if (newType) {
                  setSearchParams({ type: newType });
                } else {
                  setSearchParams({});
                }
              }}
            >
              <option value="">All Report Types</option>
              <optgroup label="Lean Tools">
                {tools?.filter(tool => 
                  tool.type === "Lean Tools" && tool.id !== 0
                ).map((tool) => (
                  <option key={tool.id} value={tool.subtitle}>
                    {tool.subtitle}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Quality Improvement Tools">
                {tools?.filter(tool => 
                  tool.type === "Quality"
                ).map((tool) => (
                  <option key={tool.id} value={tool.subtitle}>
                    {tool.subtitle}
                  </option>
                ))}
              </optgroup>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Filter by Project</Form.Label>
            <Form.Select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {availableProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    );
  };

  // Add new function to fetch user details
  const fetchUserDetails = async (userSub) => {
    try {
      // First check if we already have the details
      if (assignedUserDetails[userSub]) {
        return assignedUserDetails[userSub];
      }

      // Use API to get organization member details
      const memberDetails = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            userSub: { eq: userSub },
            _deleted: { ne: true }
          }
        }
      });

      const member = memberDetails?.data?.listOrganizationMembers?.items?.[0];
      
      if (member) {
        const details = {
          email: member.email,
          picture: null // Organization members don't store pictures, so defaulting to null
        };

        setAssignedUserDetails(prev => ({
          ...prev,
          [userSub]: details
        }));

        return details;
      }

      return null;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  // Add effect to fetch user details when reports change
  useEffect(() => {
    const fetchAllUserDetails = async () => {
      const allUserSubs = new Set();
      reports.forEach(report => {
        if (report.assignedMembers) {
          report.assignedMembers.forEach(userSub => allUserSubs.add(userSub));
        }
      });

      // Fetch details for all users
      await Promise.all(
        Array.from(allUserSubs).map(userSub => fetchUserDetails(userSub))
      );
    };

    if (reports.length > 0) {
      fetchAllUserDetails();
    }
  }, [reports]);

  return (
    <Container fluid className="p-4">
      {/* Preview Reports Banner */}
      <Row className="mb-4">
        <Col>
          <div 
            className="preview-banner"
            onClick={() => navigate('/preview/list')}
            style={{
              background: 'linear-gradient(135deg, #00897b 0%, #00695c 100%)',
              borderRadius: '12px',
              padding: '20px 30px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 137, 123, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 137, 123, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 137, 123, 0.3)';
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h3 className="text-white mb-2">
                  <FontAwesomeIcon icon={faChartSimple} className="me-3" />
                  Preview & Analytics Center
                </h3>
                <p className="text-white mb-0" style={{ opacity: 0.95, fontSize: '1.1rem' }}>
                  Access comprehensive report previews, analytics dashboards, and data visualizations
                </p>
              </div>
              <div className="text-white" style={{ fontSize: '2.5rem', opacity: 0.8 }}>
                <FontAwesomeIcon icon={faListCheck} />
              </div>
            </div>
            {/* Decorative element */}
            <div 
              style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <h2>Reports</h2>
        </Col>
      </Row>

      {/* Active Filter Indicator */}
      {selectedTypeFilter && (
        <Row className="mb-3">
          <Col>
            <Alert variant="success" className="mb-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="fas fa-filter me-2"></i>
                  <strong>Filtered by:</strong> {selectedTypeFilter}
                </div>
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => {
                    setSelectedTypeFilter('');
                    setSearchParams({});
                  }}
                >
                  <i className="fas fa-times me-1"></i>
                  Show All Reports
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (ownedReports.length === 0 && assignedReports.length === 0) ? (
        <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <div className="text-center mb-4">
            <div className="mb-4">
              <img 
                src={LFlogo}
                alt="No Reports"
                style={{ width: '200px', height: '200px', objectFit: 'contain' }}
              />
            </div>
            <h4 className="mt-3">There is no Report found</h4>
          </div>
          <Button 
            variant="primary"
            className="btn-create-report-empty"
            onClick={() => openModal(null)}
            style={{ backgroundColor: '#00897b', borderColor: '#00897b' }}
          >
            Create Report
          </Button>
        </div>
      ) : (
        <div className="reports-section">
          <div className="filter-section">
            {renderFilters()}
          </div>
          
          {/* My Reports */}
          <div className="mb-5 my-reports-section">
            <h4 className="mb-3">My Reports</h4>
            {console.log('Filtered reports for display:', filteredReports.filter(report => report.user_sub === userSub).map(r => ({
              id: r.id, 
              name: r.name, 
              user_sub: r.user_sub,
              userSubMatch: r.user_sub === userSub, // Debugging: check if user_sub matches
              ownerEmail: r.ownerEmail
            })))}
            {/* Ongoing Reports */}
            <h5 className="mb-3">Ongoing</h5>
            <Row xs={1} md={2} lg={3} className="g-4 mb-4">
              {filteredReports
                .filter(report => !report.completed && report.user_sub === userSub)
                .map(report => (
                  <Col key={report.id}>
                    {renderReportCard(report)}
                  </Col>
              ))}
              {!filteredReports.some(report => !report.completed && report.user_sub === userSub) && (
                <Col>
                  <Card className="mb-3">
                    <Card.Body className="text-center py-4">
                      No ongoing reports available.
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>

            {/* Completed Reports */}
            <h5 className="mb-3">Completed</h5>
            <Row xs={1} md={2} lg={3} className="g-4 mb-5">
              {filteredReports
                .filter(report => report.completed && report.user_sub === userSub)
                .map(report => (
                  <Col key={report.id}>
                    {renderReportCard(report)}
                  </Col>
              ))}
              {!filteredReports.some(report => report.completed && report.user_sub === userSub) && (
                <Col>
                  <Card className="mb-3">
                    <Card.Body className="text-center py-4">
                      No completed reports available.
                    </Card.Body>
                  </Card>
                </Col>
              )}
            </Row>
          </div>

          {/* Assigned Reports */}
          {assignedReports.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-3">Reports Assigned to Me</h4>
              {/* Ongoing Assigned Reports */}
              <h5 className="mb-3">Ongoing</h5>
              <Row xs={1} md={2} lg={3} className="g-4 mb-4">
                {filteredReports
                  .filter(report => !report.completed && report.user_sub !== userSub)
                  .map(report => (
                    <Col key={report.id}>
                      {renderReportCard(report)}
                    </Col>
                ))}
                {!filteredReports.some(report => !report.completed && report.user_sub !== userSub) && (
                  <Col>
                    <Card className="mb-3">
                      <Card.Body className="text-center py-4">
                        No ongoing assigned reports available.
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>

              {/* Completed Assigned Reports */}
              <h5 className="mb-3">Completed</h5>
              <Row xs={1} md={2} lg={3} className="g-4">
                {filteredReports
                  .filter(report => report.completed && report.user_sub !== userSub)
                  .map(report => (
                    <Col key={report.id}>
                      {renderReportCard(report)}
                    </Col>
                ))}
                {!filteredReports.some(report => report.completed && report.user_sub !== userSub) && (
                  <Col>
                    <Card className="mb-3">
                      <Card.Body className="text-center py-4">
                        No completed assigned reports available.
                      </Card.Body>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          )}

          <div style={{ marginBottom: '70px' }} />
          <Button
            variant="primary"
            className="position-fixed fab-create-report"
            style={{
              right: '20px',
              bottom: '20px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#00897b',
              borderColor: '#00897b',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => openModal(null)}
          >
            <FontAwesomeIcon icon={faPlus} size="lg" />
          </Button>
        </div>
      )}
      <ReportModal 
        show={modalVisible}
        onHide={closeModal}
        currentReport={currentReport}
        organizationID={organizationID}
        organizationMembers={organizationMembers}
        availableProjects={availableProjects}
        onSuccess={(reportData) => {
          console.log('ReportModal onSuccess called with:', reportData);
          closeModal();
          
          if (reportData) {
            // Add project data if available
            let reportWithProject = reportData;
            if (reportData.projectID) {
              const project = availableProjects.find(p => p.id === reportData.projectID);
              if (project) {
                reportWithProject = {
                  ...reportData,
                  project
                };
              }
            }
            
            if (currentReport) {
              // Handle REPORT UPDATE - update existing report in state
              console.log('Updating existing report in state:', reportWithProject);
              console.log('Updated report assignedMembers in onSuccess:', reportWithProject.assignedMembers);
              
              const updateReportInArray = (prevReports) => 
                prevReports.map(report => 
                  report.id === reportWithProject.id ? reportWithProject : report
                );
              
              setOwnedReports(updateReportInArray);
              setAssignedReports(updateReportInArray);
              setReports(updateReportInArray);
            } else {
              // Handle REPORT CREATION - add new report to state
              console.log('Adding newly created report to state:', reportWithProject);
              
              // Add to owned reports list
              setOwnedReports(prevReports => {
                const updatedReports = [reportWithProject, ...prevReports];
                return updatedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              });
              
              // Update all reports list
              setReports(prevReports => {
                const updatedReports = [reportWithProject, ...prevReports];
                return updatedReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              });
            }
          }
          
          // Still fetch all reports to ensure consistency
          fetchReports(userSub);
        }}
        loadingMembers={loadingMembers}
      />
      {renderDeleteDialog()}
      {renderCopyDialog()}
      
      
      <style jsx>{`
        .position-relative {
          position: relative !important;
        }
        .dropdown {
          position: relative !important;
        }
        .dropdown-toggle::after {
          display: none;
        }
        .dropdown-menu {
          z-index: 1050;
          position: absolute !important;
          transform: none !important;
          right: 0 !important;
          left: auto !important;
          top: 100% !important;
        }
      `}</style>
    </Container>
  );
};

export default Reports; 