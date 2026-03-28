import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, ProgressBar, Alert, Table, Form, Modal, Dropdown, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { useParams, useNavigate } from 'react-router-dom';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileExport, 
  faUsers, 
  faChartLine, 
  faClipboardList, 
  faCalendarAlt,
  faInfoCircle,
  faTasks,
  faPlus,
  faPencilAlt,
  faTrash,
  faCheck,
  faTimes,
  faEdit,
  faUserPlus,
  faBuilding,
  faProjectDiagram,
  faFlag,
  faEllipsisV,
  faDownload,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import TangiblesCard from '../Project/TangiblesCard';
import IntangiblesCard from '../Project/IntangiblesCard';
import ProjectAttachmentsCard from '../Project/ProjectAttachmentsCard';
import ReportOperations from '../reports/ReportOperations';
import { useToolContext } from '../../contexts/ToolContext';
import LFlogo from '../../assets/VibeStack_pro.png';
import iconMappings from '../../utils/iconMappings';
import AttachmentsList from '../5s/AttachmentsList';
import { handleReportCompleteAward, handleProjectCompleteAward } from '../../utils/awards';
import ProjectActionItemsCard from '../Project/ProjectActionItemsCard';
import ReportModal from '../modals/ReportModal';
import { 
  sendProjectMemberAddedNotification 
} from '../../utils/emailNotifications';
import { getUserAvatarByEmail } from '../../utils/userAvatarService';
import UserAvatar from '../shared/UserAvatar';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [userSub, setUserSub] = useState('');
  const [organizationID, setOrganizationID] = useState('');
  const [members, setMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: ''
  });
  const [kpis, setKpis] = useState([]);
  const [kpiModalVisible, setKpiModalVisible] = useState(false);
  const [kpiData, setKpiData] = useState({
    title: '',
    xAxisLabel: '',
    yAxisLabel: '',
    trend: true,
    target: '',
    startDate: new Date(),
    endDate: new Date()
  });
  const [editingKPI, setEditingKPI] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const { tools } = useToolContext();
  const [reportModalConfig, setReportModalConfig] = useState({
    show: false,
    mode: 'create',
    report: null
  });
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  // Copy dialog states
  const [copyDialogVisible, setCopyDialogVisible] = useState(false);
  const [fullReport, setFullReport] = useState(null);
  const [copyReportName, setCopyReportName] = useState("");
  const [checkedCategories, setCheckedCategories] = useState([]);
  const [checkedActionItems, setCheckedActionItems] = useState([]);
  const [checkedChartItems, setCheckedChartItems] = useState([]);
  const [isLoadingReportDetails, setIsLoadingReportDetails] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Create Report Modal state
  const [createReportModalVisible, setCreateReportModalVisible] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userSub) {
      fetchProjectData();
    }
  }, [projectId, userSub]);

  const fetchUserData = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      setUserSub(user.attributes.sub);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProjectData = async () => {
    try {
      const projectResult = await API.graphql({
        query: queries.getProject,
        variables: { id: projectId }
      });
      
      if (projectResult.data.getProject) {
        const projectData = projectResult.data.getProject;
        setProject(projectData);
        setOrganizationID(projectData.organizationID);
        setEditData({
          name: projectData.name,
          description: projectData.description || '',
          startDate: projectData.startDate.split('T')[0],
          endDate: projectData.endDate ? projectData.endDate.split('T')[0] : '',
          status: projectData.status
        });

        // Fetch project members
        const membersResult = await API.graphql({
          query: queries.projectMembersByProjectID,
          variables: { projectID: projectId }
        });
        setMembers(membersResult.data.projectMembersByProjectID.items);

        // Fetch organization members for the add member modal
        const orgMembersResult = await API.graphql({
          query: queries.organizationMembersByOrganizationID,
          variables: {
            organizationID: projectData.organizationID
          }
        });
        
        // Filter out members who are already in the project
        const existingMemberEmails = membersResult.data.projectMembersByProjectID.items.map(m => m.email);
        const availableMembers = orgMembersResult.data.organizationMembersByOrganizationID.items.filter(member => 
          member.status === 'ACTIVE' && 
          !existingMemberEmails.includes(member.email)
        );
        
        setOrganizationMembers(availableMembers);

        // Fetch project reports
        const reportsResult = await API.graphql({
          query: queries.reportsByProjectID,
          variables: { 
            projectID: projectId,
            limit: 100 // Ensure we get all reports
          }
        });
        
        // Process the reports to get additional data if needed
        const reportItems = reportsResult.data.reportsByProjectID.items.filter(r => !r._deleted);
        console.log('Fetched reports for project:', reportItems.map(r => ({
          id: r.id,
          name: r.name,
          ownerEmail: r.ownerEmail,
          user_sub: r.user_sub,
          assignedMembers: r.assignedMembers?.length || 0
        })));
        
        const sortedReports = sortReports(reportItems);
        setReports(sortedReports);

        // Fetch KPIs
        const kpisResult = await API.graphql({
          query: queries.kPISByProjectID,
          variables: { projectID: projectId }
        });
        setKpis(kpisResult.data.kPISByProjectID.items);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortReports = (reports) => {
    return [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Function to find a member's email from their userSub
  const findMemberEmail = (userSub) => {
    // First check project members
    const projectMember = members.find(m => m.userSub === userSub);
    if (projectMember) {
      return projectMember.email;
    }
    
    // Then check organization members
    const orgMember = organizationMembers.find(m => m.userSub === userSub);
    if (orgMember) {
      return orgMember.email;
    }
    
    // Return a shortened version of the userSub if no email found
    return userSub ? userSub.substring(0, 8) + '...' : 'Unknown';
  };

  const handleEditProject = async () => {
    try {
      // Get current user details
      const user = await Auth.currentAuthenticatedUser();
      const userEmail = user.attributes.email;
      const userSubId = user.attributes.sub;

      const updateInput = {
        id: project.id,
        name: editData.name,
        description: editData.description,
        startDate: new Date(editData.startDate).toISOString(),
        endDate: editData.endDate ? new Date(editData.endDate).toISOString() : null,
        status: editData.status,
        owner: userSubId,
        ownerEmail: userEmail,
        _version: project._version
      };

      const updated = await API.graphql({
        query: mutations.updateProject,
        variables: { input: updateInput }
      });

      // Grant award if project is being marked as completed
      if (editData.status === 'COMPLETED' && project.status !== 'COMPLETED') {
        await handleProjectCompleteAward(project?.organizationID, project?.id);
      }

      setProject(updated.data.updateProject);
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    }
  };

  const addProjectMembers = async () => {
    if (!project || selectedMembers.length === 0) {
      console.warn('No project or no members selected.');
      return;
    }
    setIsAddingMembers(true);
    const addedMemberSubs = [];
    try {
      for (const member of selectedMembers) {
        if (member && member.userSub) {
          await API.graphql({
            query: mutations.createProjectMember,
            variables: {
              input: {
                projectID: project.id,
                userSub: member.userSub,
                role: 'MEMBER',
                email: member.email,
              }
            }
          });
          addedMemberSubs.push(member.userSub);
        } else {
          console.warn('Skipping invalid member object:', member);
        }
      }
      
      if (addedMemberSubs.length > 0) {
        try {
          console.log(`Attempting to send PROJECT_MEMBER_ADDED notification for project ${project.id} to subs:`, addedMemberSubs);
          await sendProjectMemberAddedNotification(project, addedMemberSubs, project.organizationID);
          console.log('Project member added notification triggered successfully.');
        } catch (notificationError) {
          console.error('Error triggering project member added notification:', notificationError);
        }
      }
      
      await fetchProjectData();
      setMemberModalVisible(false);
      setSelectedMembers([]);
    } catch (error) {
      console.error('Error adding project members:', error);
      alert('Failed to add members. Please check the console for details.');
    } finally {
      setIsAddingMembers(false);
    }
  };

  const removeProjectMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await API.graphql({
          query: mutations.deleteProjectMember,
          variables: { 
            input: {
              id: memberId
            }
          }
        });
        await fetchProjectData();
      } catch (error) {
        console.error('Error removing project member:', error);
        alert('Failed to remove member');
      }
    }
  };

  const handleKPISubmit = async () => {
    try {
      const kpiInput = {
        title: kpiData.title,
        xAxisLabel: kpiData.xAxisLabel,
        yAxisLabel: kpiData.yAxisLabel,
        trend: kpiData.trend,
        target: kpiData.target ? parseFloat(kpiData.target) : null,
        startDate: new Date(kpiData.startDate).toISOString(),
        endDate: new Date(kpiData.endDate).toISOString(),
        projectID: project.id,
      };

      if (editingKPI) {
        const result = await API.graphql({
          query: queries.getKPI,
          variables: { id: editingKPI.id }
        });
        
        const currentKPI = result.data.getKPI;
        
        await API.graphql({
          query: mutations.updateKPI,
          variables: {
            input: {
              id: editingKPI.id,
              ...kpiInput,
              _version: currentKPI._version
            }
          }
        });
      } else {
        await API.graphql({
          query: mutations.createKPI,
          variables: { input: kpiInput }
        });
      }
      
      setKpiModalVisible(false);
      setEditingKPI(null);
      setKpiData({
        title: '',
        xAxisLabel: '',
        yAxisLabel: '',
        trend: true,
        target: '',
        startDate: new Date(),
        endDate: new Date()
      });
      await fetchProjectData();
    } catch (error) {
      console.error('Error saving KPI:', error);
    }
  };

  const handleDeleteItem = async () => {
    try {
      if (!itemToDelete) return;

      if (deleteType === 'project') {
        // Show loading state
        setLoading(true);

        // 1. Delete all project members
        const membersResult = await API.graphql({
          query: queries.projectMembersByProjectID,
          variables: { projectID: itemToDelete.id }
        });
        
        await Promise.all(membersResult.data.projectMembersByProjectID.items.map(member =>
          API.graphql({
            query: mutations.deleteProjectMember,
            variables: { input: { id: member.id } }
          })
        ));

        // 2. Delete all reports
        const reportsResult = await API.graphql({
          query: queries.reportsByProjectID,
          variables: { projectID: itemToDelete.id }
        });
        
        await Promise.all(reportsResult.data.reportsByProjectID.items.map(report =>
          API.graphql({
            query: mutations.deleteReport,
            variables: { input: { id: report.id } }
          })
        ));

        // 3. Delete all KPIs and their data
        const kpisResult = await API.graphql({
          query: queries.kPISByProjectID,
          variables: { projectID: itemToDelete.id }
        });
        
        for (const kpi of kpisResult.data.kPISByProjectID.items) {
          // Delete KPI data first
          const kpiDataResult = await API.graphql({
            query: queries.kPIDataByKpiID,
            variables: { kpiID: kpi.id }
          });
          
          await Promise.all(kpiDataResult.data.kPIDataByKpiID.items.map(data =>
            API.graphql({
              query: mutations.deleteKPIData,
              variables: { input: { id: data.id } }
            })
          ));
          
          // Then delete the KPI
          await API.graphql({
            query: mutations.deleteKPI,
            variables: { input: { id: kpi.id } }
          });
        }

        // 4. Delete all action items
        const actionItemsResult = await API.graphql({
          query: queries.actionItemsByProjectID,
          variables: { projectID: itemToDelete.id }
        });
        
        await Promise.all(actionItemsResult.data.actionItemsByProjectID.items.map(item =>
          API.graphql({
            query: mutations.deleteActionItems,
            variables: { input: { id: item.id } }
          })
        ));

        // 5. Delete all tangibles
        const tangiblesResult = await API.graphql({
          query: queries.tangiblesByProjectID,
          variables: { projectID: itemToDelete.id }
        });
        
        await Promise.all(tangiblesResult.data.tangiblesByProjectID.items.map(item =>
          API.graphql({
            query: mutations.deleteTangible,
            variables: { input: { id: item.id } }
          })
        ));

        // 6. Delete all intangibles
        const intangiblesResult = await API.graphql({
          query: queries.intangiblesByProjectID,
          variables: { projectID: itemToDelete.id }
        });
        
        await Promise.all(intangiblesResult.data.intangiblesByProjectID.items.map(item =>
          API.graphql({
            query: mutations.deleteIntangible,
            variables: { input: { id: item.id } }
          })
        ));

        // 7. Finally delete the project
        await API.graphql({
          query: mutations.deleteProject,
          variables: { 
            input: {
              id: itemToDelete.id,
            }
          }
        });

        // Navigate back to projects list
        navigate('/projects');
      } else if (deleteType === 'kpi') {
        // First, delete all associated KPIData
        const kpiDataResult = await API.graphql({
          query: queries.kPIDataByKpiID,
          variables: {
            kpiID: itemToDelete.id
          }
        });

        const associatedKPIData = kpiDataResult.data.kPIDataByKpiID.items;
        for (const dataPoint of associatedKPIData) {
          await API.graphql({
            query: mutations.deleteKPIData,
            variables: { 
              input: {
                id: dataPoint.id,
              }
            }
          });
        }

        // Then delete the KPI
        await API.graphql({
          query: mutations.deleteKPI,
          variables: { 
            input: {
              id: itemToDelete.id,
            }
          }
        });
      } else if (deleteType === 'report') {
        await API.graphql({
          query: mutations.deleteReport,
          variables: {
            input: {
              id: itemToDelete.id,
            }
          }
        });
      }

      setDeleteDialogVisible(false);
      setItemToDelete(null);
      setDeleteType(null);
      await fetchProjectData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'ACTIVE': 'success',
      'COMPLETED': 'primary',
      'ON_HOLD': 'warning',
      'CANCELLED': 'danger'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status}</Badge>;
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

      const copiedName = `Copy of ${copyReportName}`;
      const newReportResult = await API.graphql({
        query: mutations.createReport,
        variables: {
          input: {
            name: copiedName,
            type: fullReport.type,
            user_sub: userSub,
            ai_id: fullReport.ai_id || 'Lorem ipsum dolor sit amet',
            bones: fullReport.bones || null,
            media: fullReport.media || '',
            target: fullReport.target || '',
            xaxis: fullReport.xaxis || '',
            yaxis: fullReport.yaxis || '',
            trend: fullReport.trend || null,
            organizationID: organizationID,
            completed: false,
            projectID: project.id,
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
      await fetchProjectData();
    } catch (error) {
      console.error('Error copying report:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const openReportModal = (report) => {
    setCurrentReport(report);
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setCurrentReport(null);
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
      case 'Value Stream Mapping Report':
        navigate(`/vsm/${report.id}`);
        break;
      case 'Standard Work Report':
        navigate(`/report/sw/${report.id}`);
        break;
      default:
        navigate(`/report/${report.id}`);
        break;
    }
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!project) {
    return (
      <Container className="py-4">
        <Alert variant="danger">Project not found</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4 mt-5">
      {/* Project Header */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center mb-2">
                <h2 className="mb-0 me-3">{project.name}</h2>
                {getStatusBadge(project.status)}
              </div>
              <p className="text-muted mb-3">{project.description}</p>
              <div className="d-flex gap-4">
                <div>
                  <small className="text-muted d-block">Organization</small>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faBuilding} className="me-2 text-primary" />
                    {project.organization?.name || project.organizationID}
                  </div>
                </div>
                <div>
                  <small className="text-muted d-block">Created</small>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <small className="text-muted d-block">Last Updated</small>
                  <div className="d-flex align-items-center">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2 text-primary" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <small className="text-muted d-block">Project Owner</small>
                  <div className="d-flex align-items-center">
                    <UserAvatar 
                      email={project.ownerEmail} 
                      userSub={project.owner}
                      organizationID={project.organizationID}
                      size={24} 
                      isOwner={true}
                      style={{ marginRight: '8px' }}
                    />
                    <span>{project.ownerEmail || project.owner}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-primary"
                onClick={() => setEditModalVisible(true)}
              >
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Edit Project
              </Button>
              <Button 
                variant="outline-primary"
                onClick={() => navigate(`/project_details/${project.id}`)}
              >
                <FontAwesomeIcon icon={faFileExport} className="me-2" />
                Export Reports
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Project Progress and Timeline */}
        <Col lg={8}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pt-4 px-4">
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faProjectDiagram} className="me-2 text-primary" />
                Project Overview
              </h5>
            </Card.Header>
            <Card.Body className="px-4">
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0">Progress</h6>
                  <small className="text-muted">70%</small>
                </div>
                <ProgressBar 
                  now={70} 
                  className="progress-lg"
                  style={{ height: '10px' }}
                />
              </div>
              <Row className="g-4">
                <Col md={6}>
                  <Card className="border h-100">
                    <Card.Body>
                      <h6 className="mb-3">Timeline</h6>
                      <div className="d-flex flex-column gap-2">
                        <div>
                          <small className="text-muted d-block">Start Date</small>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faFlag} className="me-2 text-success" />
                            {new Date(project.startDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <small className="text-muted d-block">End Date</small>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faFlag} className="me-2 text-danger" />
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border h-100">
                    <Card.Body>
                      <h6 className="mb-3">Quick Stats</h6>
                      <div className="d-flex flex-column gap-2">
                        <div>
                          <small className="text-muted d-block">Team Members</small>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                            {members.length} members
                          </div>
                        </div>
                        <div>
                          <small className="text-muted d-block">Reports</small>
                          <div className="d-flex align-items-center">
                            <FontAwesomeIcon icon={faClipboardList} className="me-2 text-primary" />
                            {reports.length} reports
                          </div>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Team Members */}
        <Col lg={4}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-transparent border-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                  Team Members
                </h5>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setMemberModalVisible(true)}
                >
                  <FontAwesomeIcon icon={faUserPlus} className="me-2" />
                  Add Member
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="px-4">
              <div className="member-list">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="d-flex align-items-center justify-content-between py-2 border-bottom"
                  >
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <UserAvatar
                          email={member.email}
                          userSub={member.userSub}
                          size={36}
                          organizationID={organizationID}
                          tooltipLabel={member.email}
                        />
                      </div>
                      <div>
                        <div className="fw-medium">{member.email}</div>
                        <small className="text-muted">{member.role}</small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={member.userSub ? 'success' : 'warning'}>
                        {member.userSub ? 'Active' : 'Invited'}
                      </Badge>
                      <Button
                        variant="link"
                        className="p-0 text-danger"
                        onClick={() => removeProjectMember(member.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="text-center py-4 text-muted">
                    No team members yet
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Tangibles and Intangibles */}
        <Row className="g-4">
          <Col lg={6}>
            <TangiblesCard projectId={project?.id} />
          </Col>
          <Col lg={6}>
            <IntangiblesCard projectId={project?.id} />
          </Col>
        </Row>

        {/* Action Items Card */}
        <Col xs={12}>
          <ProjectActionItemsCard projectId={project?.id} project={project} />
        </Col>

        {/* Reports, KPIs, and Attachments Section */}
        <Row className="g-4">
          {/* Reports - Left Side (8 columns) */}
          <Col lg={8} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-transparent border-0 pt-4 px-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faClipboardList} className="me-2 text-primary" />
                    Project Reports
                  </h5>
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => setCreateReportModalVisible(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Create Report
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="px-4">
                <Row className="g-4">
                  {/* Ongoing Reports */}
                  <Col xs={12}>
                    <Card className="border h-100 reports-card">
                      <Card.Header className="bg-transparent">
                        <h6 className="mb-0">Ongoing Reports</h6>
                      </Card.Header>
                      <Card.Body className="reports-scroll-container p-0">
                        {reports.filter(report => !report.completed).length > 0 ? (
                          <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                              <thead className="sticky-top bg-white">
                                <tr>
                                  <th>Name</th>
                                  <th>Owner</th>
                                  <th>Assigned</th>
                                  <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody style={{ position: 'relative' }}>
                                {reports.filter(report => !report.completed).map((report) => {
                                  const iconSource = iconMappings[report.type] || LFlogo;
                                  return (
                                    <tr key={report.id}>
                                      <td>
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip id={`tooltip-type-${report.id}`}>Type: {report.type}</Tooltip>}
                                        >
                                          <div className="d-flex align-items-center">
                                            <div 
                                              className="p-2 rounded me-3" 
                                              style={{ 
                                                backgroundColor: '#00897b', 
                                                width: '40px', 
                                                height: '40px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center' 
                                              }}
                                            >
                                              <img 
                                                src={iconSource} 
                                                alt={report.type}
                                                style={{ 
                                                  width: '20px', 
                                                  height: '20px', 
                                                  objectFit: 'contain' 
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <div className="fw-medium">{report.name}</div>
                                              <small className="text-muted">{report.description}</small>
                                            </div>
                                          </div>
                                        </OverlayTrigger>
                                      </td>
                                      <td>
                                        {report.ownerEmail ? (
                                          <UserAvatar 
                                            email={report.ownerEmail}
                                            size={30}
                                            customColor="#007a6c"
                                            isOwner={true}
                                            organizationID={organizationID}
                                          />
                                        ) : (
                                          <UserAvatar 
                                            email={findMemberEmail(report.user_sub)}
                                            size={30}
                                            customColor="#007a6c"
                                            isOwner={true}
                                            organizationID={organizationID}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        {report.assignedMembers && report.assignedMembers.length > 0 ? (
                                          <div className="d-flex align-items-center">
                                            {report.assignedMembers.slice(0, 3).map((memberSub, index) => (
                                              <div 
                                                key={memberSub}
                                                style={{
                                                  marginLeft: index > 0 ? '-8px' : '0',
                                                  position: 'relative',
                                                  zIndex: 3 - index
                                                }}
                                              >
                                                <UserAvatar 
                                                  email={findMemberEmail(memberSub)}
                                                  size={30}
                                                  organizationID={organizationID}
                                                />
                                              </div>
                                            ))}
                                            {report.assignedMembers.length > 3 && (
                                              <div
                                                style={{
                                                  marginLeft: '-8px',
                                                  position: 'relative',
                                                  zIndex: 0
                                                }}
                                              >
                                                <UserAvatar 
                                                  email={`+${report.assignedMembers.length - 3}`}
                                                  size={30}
                                                  organizationID={organizationID}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <small className="text-muted">None</small>
                                        )}
                                      </td>
                                      <td className="text-end position-relative">
                                        <div className="dropdown-container">
                                          <Dropdown align="end">
                                            <Dropdown.Toggle variant="link" className="p-0 text-muted" id={`report-dropdown-${report.id}`}>
                                              <FontAwesomeIcon icon={faEllipsisV} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-right">
                                              <Dropdown.Item
                                                onClick={() => handleReportClick(report)}
                                              >
                                                <FontAwesomeIcon icon={faEdit} className="me-2" />
                                                View
                                              </Dropdown.Item>
                                              <Dropdown.Item onClick={() => openReportModal(report)}>
                                                <FontAwesomeIcon icon={faPencilAlt} className="me-2" />
                                                Edit
                                              </Dropdown.Item>
                                              <Dropdown.Item
                                                onClick={() => {
                                                  setCopyDialogVisible(true);
                                                  fetchFullReport(report.id);
                                                }}
                                              >
                                                <FontAwesomeIcon icon={faCopy} className="me-2" />
                                                Copy
                                              </Dropdown.Item>
                                              <Dropdown.Divider />
                                              <Dropdown.Item
                                                className="text-danger"
                                                onClick={() => {
                                                  setItemToDelete(report);
                                                  setDeleteType('report');
                                                  setDeleteDialogVisible(true);
                                                }}
                                              >
                                                <FontAwesomeIcon icon={faTrash} className="me-2" />
                                                Delete
                                              </Dropdown.Item>
                                            </Dropdown.Menu>
                                          </Dropdown>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="mb-3">No ongoing reports available.</p>
                            <Button 
                              variant="primary"
                              size="sm"
                              onClick={() => setCreateReportModalVisible(true)}
                              style={{ backgroundColor: '#00897b', borderColor: '#00897b' }}
                            >
                              <FontAwesomeIcon icon={faPlus} className="me-2" />
                              Create Report
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Completed Reports */}
                  <Col xs={12}>
                    <Card className="border h-100 reports-card">
                      <Card.Header className="bg-transparent">
                        <h6 className="mb-0">Completed Reports</h6>
                      </Card.Header>
                      <Card.Body className="reports-scroll-container p-0">
                        {reports.filter(report => report.completed).length > 0 ? (
                          <div className="table-responsive">
                            <Table hover className="align-middle mb-0">
                              <thead className="sticky-top bg-white">
                                <tr>
                                  <th>Name</th>
                                  <th>Owner</th>
                                  <th>Assigned</th>
                                  <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody style={{ position: 'relative' }}>
                                {reports.filter(report => report.completed).map((report) => {
                                  const iconSource = iconMappings[report.type] || LFlogo;
                                  return (
                                    <tr key={report.id}>
                                      <td>
                                        <OverlayTrigger
                                          placement="top"
                                          overlay={<Tooltip id={`tooltip-type-${report.id}`}>Type: {report.type}</Tooltip>}
                                        >
                                          <div className="d-flex align-items-center">
                                            <div 
                                              className="p-2 rounded me-3" 
                                              style={{ 
                                                backgroundColor: '#00897b', 
                                                width: '40px', 
                                                height: '40px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center' 
                                              }}
                                            >
                                              <img 
                                                src={iconSource} 
                                                alt={report.type}
                                                style={{ 
                                                  width: '20px', 
                                                  height: '20px', 
                                                  objectFit: 'contain' 
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <div className="fw-medium">{report.name}</div>
                                              <small className="text-muted">{report.description}</small>
                                            </div>
                                          </div>
                                        </OverlayTrigger>
                                      </td>
                                      <td>
                                        {report.ownerEmail ? (
                                          <UserAvatar 
                                            email={report.ownerEmail}
                                            size={30}
                                            customColor="#007a6c"
                                            isOwner={true}
                                            organizationID={organizationID}
                                          />
                                        ) : (
                                          <UserAvatar 
                                            email={findMemberEmail(report.user_sub)}
                                            size={30}
                                            customColor="#007a6c"
                                            isOwner={true}
                                            organizationID={organizationID}
                                          />
                                        )}
                                      </td>
                                      <td>
                                        {report.assignedMembers && report.assignedMembers.length > 0 ? (
                                          <div className="d-flex align-items-center">
                                            {report.assignedMembers.slice(0, 3).map((memberSub, index) => (
                                              <div 
                                                key={memberSub}
                                                style={{
                                                  marginLeft: index > 0 ? '-8px' : '0',
                                                  position: 'relative',
                                                  zIndex: 3 - index
                                                }}
                                              >
                                                <UserAvatar 
                                                  email={findMemberEmail(memberSub)}
                                                  size={30}
                                                  organizationID={organizationID}
                                                />
                                              </div>
                                            ))}
                                            {report.assignedMembers.length > 3 && (
                                              <div
                                                style={{
                                                  marginLeft: '-8px',
                                                  position: 'relative',
                                                  zIndex: 0
                                                }}
                                              >
                                                <UserAvatar 
                                                  email={`+${report.assignedMembers.length - 3}`}
                                                  size={30}
                                                  organizationID={organizationID}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <small className="text-muted">None</small>
                                        )}
                                      </td>
                                      <td className="text-end position-relative">
                                        <div className="dropdown-container">
                                          <Dropdown align="end">
                                            <Dropdown.Toggle variant="link" className="p-0 text-muted" id={`report-dropdown-${report.id}`}>
                                              <FontAwesomeIcon icon={faEllipsisV} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="dropdown-menu-right">
                                              <Dropdown.Item
                                                onClick={() => handleReportClick(report)}
                                              >
                                                <FontAwesomeIcon icon={faEdit} className="me-2" />
                                                View
                                              </Dropdown.Item>
                                              <Dropdown.Item onClick={() => openReportModal(report)}>
                                                <FontAwesomeIcon icon={faPencilAlt} className="me-2" />
                                                Edit
                                              </Dropdown.Item>
                                              <Dropdown.Item
                                                onClick={() => {
                                                  setCopyDialogVisible(true);
                                                  fetchFullReport(report.id);
                                                }}
                                              >
                                                <FontAwesomeIcon icon={faCopy} className="me-2" />
                                                Copy
                                              </Dropdown.Item>
                                              <Dropdown.Divider />
                                              <Dropdown.Item
                                                className="text-danger"
                                                onClick={() => {
                                                  setItemToDelete(report);
                                                  setDeleteType('report');
                                                  setDeleteDialogVisible(true);
                                                }}
                                              >
                                                <FontAwesomeIcon icon={faTrash} className="me-2" />
                                                Delete
                                              </Dropdown.Item>
                                            </Dropdown.Menu>
                                          </Dropdown>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="mb-0">No completed reports yet.</p>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* KPIs and Attachments - Right Side (4 columns) */}
          <Col lg={4} className="mb-4">
            <div className="d-flex flex-column gap-4">
              {/* KPIs Card */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-transparent border-0 pt-4 px-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <FontAwesomeIcon icon={faChartLine} className="me-2 text-primary" />
                      KPIs
                    </h5>
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditingKPI(null);
                        setKpiModalVisible(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2" />
                      Add KPI
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="px-4">
                  <div className="d-flex flex-column gap-3">
                    {kpis.map((kpi) => (
                      <Card 
                        key={kpi.id} 
                        className="border"
                      >
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <h6 className="mb-1">{kpi.title}</h6>
                              <small className="text-muted">
                                {kpi.xAxisLabel} vs {kpi.yAxisLabel}
                              </small>
                            </div>
                            <Dropdown>
                              <Dropdown.Toggle 
                                as="div" 
                                className="cursor-pointer"
                              >
                                <FontAwesomeIcon icon={faEllipsisV} className="text-muted" />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  onClick={() => navigate(`/kpi/${kpi.id}`)}
                                >
                                  <FontAwesomeIcon icon={faEdit} className="me-2" />
                                  Open
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => {
                                    setEditingKPI(kpi);
                                    setKpiData({
                                      title: kpi.title,
                                      xAxisLabel: kpi.xAxisLabel,
                                      yAxisLabel: kpi.yAxisLabel,
                                      trend: kpi.trend,
                                      target: kpi.target?.toString() || '',
                                      startDate: new Date(kpi.startDate),
                                      endDate: new Date(kpi.endDate)
                                    });
                                    setKpiModalVisible(true);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPencilAlt} className="me-2" />
                                  Edit
                                </Dropdown.Item>
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => {
                                    setItemToDelete(kpi);
                                    setDeleteType('kpi');
                                    setDeleteDialogVisible(true);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTrash} className="me-2" />
                                  Delete
                                </Dropdown.Item>
                              </Dropdown.Menu>
                            </Dropdown>
                          </div>
                          <div className="d-flex gap-2 mb-2">
                            <Badge bg={kpi.trend ? 'success' : 'danger'}>
                              {kpi.trend ? 'Positive' : 'Negative'} Trend
                            </Badge>
                            {kpi.target && (
                              <Badge bg="info">Target: {kpi.target}</Badge>
                            )}
                          </div>
                          <div className="small text-muted mb-2">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                            {new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}
                          </div>
                          <div className="d-flex justify-content-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/kpi/${kpi.id}`)}
                              style={{ minWidth: '120px' }}
                            >
                              <FontAwesomeIcon icon={faEdit} className="me-2" />
                              Open KPI
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                    {kpis.length === 0 && (
                      <div className="text-center py-3 text-muted">
                        No KPIs added yet
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>

              {/* Attachments Card */}
              <ProjectAttachmentsCard projectId={project?.id} project={project} />
            </div>
          </Col>
        </Row>
      </Row>

      {/* Edit Project Modal */}
      <Modal show={editModalVisible} onHide={() => setEditModalVisible(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={editData.status}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button 
            variant="danger" 
            onClick={() => {
              setEditModalVisible(false);
              setItemToDelete(project);
              setDeleteType('project');
              setDeleteDialogVisible(true);
            }}
          >
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Delete Project
          </Button>
          <div>
            <Button variant="secondary" onClick={() => setEditModalVisible(false)} className="me-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditProject}>
              Save Changes
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Add Members Modal */}
      <Modal show={memberModalVisible} onHide={() => setMemberModalVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Team Members</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {organizationMembers.map((member) => (
            <div 
              key={member.id} 
              className="d-flex justify-content-between align-items-center p-2 border-bottom"
            >
              <div>
                <div>{member.email}</div>
                <small className="text-muted">Role: {member.role}</small>
              </div>
              <Form.Check
                type="checkbox"
                checked={selectedMembers.some(m => m.id === member.id)}
                onChange={() => {
                  const isSelected = selectedMembers.some(m => m.id === member.id);
                  if (isSelected) {
                    setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
                  } else {
                    setSelectedMembers([...selectedMembers, member]);
                  }
                }}
              />
            </div>
          ))}
          {organizationMembers.length === 0 && (
            <div className="text-center p-3">
              No available members to add
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMemberModalVisible(false)} disabled={isAddingMembers}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={addProjectMembers}
            disabled={isAddingMembers || selectedMembers.length === 0}
          >
            {isAddingMembers ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Adding...</>
            ) : (
              'Add Selected Members'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* KPI Modal */}
      <Modal show={kpiModalVisible} onHide={() => setKpiModalVisible(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingKPI ? 'Edit KPI' : 'Add New KPI'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>KPI Title</Form.Label>
              <Form.Control
                type="text"
                value={kpiData.title}
                onChange={(e) => setKpiData(prev => ({ ...prev, title: e.target.value }))}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>X-Axis Label</Form.Label>
                  <Form.Control
                    type="text"
                    value={kpiData.xAxisLabel}
                    onChange={(e) => setKpiData(prev => ({ ...prev, xAxisLabel: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Y-Axis Label</Form.Label>
                  <Form.Control
                    type="text"
                    value={kpiData.yAxisLabel}
                    onChange={(e) => setKpiData(prev => ({ ...prev, yAxisLabel: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target (optional)</Form.Label>
                  <Form.Control
                    type="number"
                    value={kpiData.target}
                    onChange={(e) => setKpiData(prev => ({ ...prev, target: e.target.value }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trend</Form.Label>
                  <div>
                    <Form.Check
                      type="radio"
                      label="Positive (+)"
                      name="trend"
                      checked={kpiData.trend}
                      onChange={() => setKpiData(prev => ({ ...prev, trend: true }))}
                      inline
                    />
                    <Form.Check
                      type="radio"
                      label="Negative (-)"
                      name="trend"
                      checked={!kpiData.trend}
                      onChange={() => setKpiData(prev => ({ ...prev, trend: false }))}
                      inline
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={kpiData.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setKpiData(prev => ({ ...prev, startDate: new Date(e.target.value) }))}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={kpiData.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setKpiData(prev => ({ ...prev, endDate: new Date(e.target.value) }))}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setKpiModalVisible(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleKPISubmit}>
            {editingKPI ? 'Update' : 'Create'} KPI
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal show={deleteDialogVisible} onHide={() => setDeleteDialogVisible(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteType === 'project' ? (
            <>
              <div className="alert alert-danger">
                <h6 className="alert-heading">Warning: This action cannot be undone!</h6>
                <p className="mb-0">Deleting this project will also delete:</p>
                <ul className="mb-0">
                  <li>All project members</li>
                  <li>All reports</li>
                  <li>All KPIs and their data</li>
                  <li>All action items</li>
                  <li>All tangibles and intangibles</li>
                  <li>All project attachments</li>
                </ul>
              </div>
              <p>Are you sure you want to delete the project "{itemToDelete?.name}"?</p>
            </>
          ) : (
            <p>Are you sure you want to delete this {deleteType}? This action cannot be undone.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteDialogVisible(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteItem}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {reportModalConfig.show && (
        <ReportOperations
          report={reportModalConfig.report}
          mode={reportModalConfig.mode}
          onSuccess={() => {
            setReportModalConfig({ show: false, mode: 'create', report: null });
            fetchProjectData();
          }}
          onCancel={() => setReportModalConfig({ show: false, mode: 'create', report: null })}
          userSub={project.user_sub}
          organizationID={project.organizationID}
          projectID={project.id}
          tools={tools}
        />
      )}

      {/* Replace the old Report Edit Modal with ReportModal component */}
      <ReportModal 
        show={reportModalVisible}
        onHide={closeReportModal}
        currentReport={currentReport}
        organizationID={organizationID}
        organizationMembers={organizationMembers}
        availableProjects={project ? [project] : []}
        onSuccess={() => {
          closeReportModal();
          fetchProjectData();
        }}
        loadingMembers={false}
        projectID={project?.id}
      />

      {/* Copy Report Dialog */}
      <Modal show={copyDialogVisible} onHide={() => setCopyDialogVisible(false)} size="lg">
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

      {/* Create Report Modal */}
      <ReportModal 
        show={createReportModalVisible}
        onHide={() => setCreateReportModalVisible(false)}
        organizationID={organizationID}
        organizationMembers={organizationMembers}
        availableProjects={project ? [project] : []}
        onSuccess={() => {
          setCreateReportModalVisible(false);
          fetchProjectData();
        }}
        loadingMembers={false}
        projectID={project?.id}
      />

      <style jsx>{`
        .progress-lg {
          border-radius: 8px;
        }
        .member-list {
          max-height: 400px;
          overflow-y: auto;
        }
        .reports-scroll-container {
          max-height: 300px;
          overflow-y: auto;
          overflow-x: visible !important;
        }
        .sticky-top {
          position: sticky;
          top: 0;
          z-index: 1;
          background-color: white;
        }
        .dropdown-menu-right {
          left: auto !important;
          right: 0 !important;
          position: absolute !important;
        }
        .table-responsive {
          min-width: 500px;
          width: 100%;
          overflow-x: visible !important;
          position: relative;
        }
        .position-relative {
          position: relative !important;
        }
        th:last-child, td:last-child {
          min-width: 120px;
          position: relative;
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
        .dropdown-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        table {
          width: 100%;
          table-layout: fixed;
        }
        table td:first-child {
          width: 45%;
        }
        table td:nth-child(2) {
          width: 40%;
        }
        table td:last-child {
          width: 15%;
        }
        /* Reports tables need fixed width */
        .reports-scroll-container .card-body {
          min-width: 700px;
          overflow: visible !important;
        }
        .reports-scroll-container .card {
          min-width: 700px;
          overflow: visible !important;
        }
        /* Make KPI and attachment cards responsive */
        @media (max-width: 992px) {
          .card {
            min-width: auto !important;
            width: 100% !important;
            overflow-x: auto !important;
          }
          .card-body {
            min-width: auto !important;
            width: 100% !important;
          }
          .reports-card {
            overflow-x: auto !important;
          }
          .table-responsive {
            min-width: 100%;
            overflow-x: auto !important;
          }
        }
      `}</style>
    </Container>
  );
};

export default ProjectView; 