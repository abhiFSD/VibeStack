import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, ProgressBar, Tooltip, OverlayTrigger, Alert, Tabs, Tab } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import Calendar from 'react-calendar';
import { format, subDays } from 'date-fns';
import { DateTime } from 'luxon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faUser, faClipboardCheck, faStickyNote, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Line, Radar, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';
import * as queries from '../../graphql/queries';
import { useOrganization } from '../../contexts/OrganizationContext';
import ActionItemModal from '../shared/ActionItemModal';
import LocationWarning from '../shared/LocationWarning';
import '../../styles/Home.css';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../contexts/AdminContext';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import useMousePosition from '@react-hook/mouse-position';
import OrganizationAnalytics from '../analytics/OrganizationAnalytics';
import { Link } from 'react-router-dom';
import ToolsCarousel from '../shared/ToolsCarousel';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  BarElement,
  Filler
);

const styles = {
  metricCard: {
    transition: 'all 0.3s ease',
    cursor: 'default',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    }
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  metricLabel: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
    marginBottom: 0
  },
  sectionTitle: {
    color: '#2c3e50',
    fontSize: '1.2rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #e9ecef'
  },
  categoryBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '50px',
    fontSize: '0.8rem',
    fontWeight: '500'
  },
  infoIcon: {
    color: '#6c757d',
    fontSize: '0.9rem',
    cursor: 'help'
  },
  trendIcon: {
    fontSize: '1.2rem',
    marginLeft: '0.5rem'
  },
  hierarchyLine: {
    borderLeft: '2px dashed #e9ecef',
    paddingLeft: '1rem',
    marginLeft: '1rem'
  },
  insightCard: {
    backgroundColor: '#f8f9fa',
    borderLeft: '4px solid #007bff',
    marginBottom: '1rem'
  }
};

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

// Add getInsightIcon function
const getInsightIcon = (key) => {
  const iconMap = {
    actionItems: 'tasks',
    projects: 'project-diagram',
    kpis: 'chart-line',
    learning: 'graduation-cap'
  };
  return iconMap[key] || 'info-circle';
};

// Add InfoIcon component
const InfoIcon = ({ tooltip }) => (
  <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip">{tooltip}</Tooltip>}>
    <FontAwesomeIcon 
      icon={faInfoCircle} 
      className="ms-2 text-primary" 
      style={{ cursor: 'help', fontSize: '0.9rem' }}
    />
  </OverlayTrigger>
);

const Home = () => {
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredActionItems, setFilteredActionItems] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { activeOrganization, loading: orgLoading } = useOrganization();
  const [showModal, setShowModal] = useState(false);
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  const [learnings, setLearnings] = useState([]);
  const [quizResults, setQuizResults] = useState({});
  const [quizzesByLearning, setQuizzesByLearning] = useState({});
  const [allKpis, setAllKpis] = useState([]);
  const navigate = useNavigate();
  const { isSuperAdmin } = useAdmin();
  const [isOwner, setIsOwner] = useState(false);
  const [metrics, setMetrics] = useState({
    actionItems: {
      open: 0,
      closed: 0,
      dueToday: 0,
      dueTomorrow: 0,
      avgCompletionTime: 0
    },
    projects: {
      open: 0,
      closed: 0,
      byCategory: {
        all: 0,
        safety: 0,
        people: 0,
        quality: 0
      }
    },
    reports: {
      outstanding: 0,
      closed: 0
    },
    kpis: {
      active: 0,
      goalAttained: 0,
      byCategory: {
        all: 0,
        safety: 0,
        people: 0,
        quality: 0
      }
    },
    savings: 0,
    quizzes: {
      completed: 0,
      total: 0,
      averageScore: 0
    },
    awards: {
      attained: 0
    },
    learnings: {
      accessed: 0,
      total: 0,
      averageScore: 0
    }
  });
  const [insights, setInsights] = useState({
    actionItems: '',
    projects: '',
    kpis: '',
    learning: ''
  });
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [aggregateOrganizationData, setAggregateOrganizationData] = useState({});
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (!orgLoading && activeOrganization) {
      fetchAllData();
    }
  }, [orgLoading, activeOrganization]);

  useEffect(() => {
    if (actionItems.length > 0) {
      const filtered = filterActionItemsByDate(actionItems, selectedDate.toISOString());
      setFilteredActionItems(filtered);
    }
  }, [selectedDate, actionItems]);

  useEffect(() => {
    fetchAllOrganizations();
  }, []);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        const user = await Auth.currentAuthenticatedUser();
        setIsOwner(user.attributes.sub === activeOrganization?.owner);
      } catch (error) {
        console.error('Error checking ownership:', error);
      }
    };

    if (activeOrganization) {
      checkOwnership();
    }
  }, [activeOrganization]);

  const orderLearnings = (learningItems) => {
    if (!Array.isArray(learningItems) || learningItems.length === 0) {
      return [];
    }

    // Group learnings by type
    const orgLearnings = [];
    const globalLearnings = [];

    learningItems.forEach(learning => {
      if (!learning || !learning.title) return;

      // Determine if it's an organizational learning
      const isOrgLearning = learning.organizationID === activeOrganization?.id;
      
      if (isOrgLearning) {
        orgLearnings.push(learning);
      } else {
        globalLearnings.push(learning);
      }
    });

    // Sort each group by orderIndex
    const sortByOrderIndex = (a, b) => {
      const orderA = a?.orderIndex || 0;
      const orderB = b?.orderIndex || 0;
      return orderA - orderB;
    };

    orgLearnings.sort(sortByOrderIndex);
    globalLearnings.sort(sortByOrderIndex);

    // Return organization learnings first, then global learnings
    return [...orgLearnings, ...globalLearnings];
  };

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await Auth.currentAuthenticatedUser();
      const userSub = user.attributes.sub;

      // Initialize base promises with better error handling
      const fetchWithErrorHandling = async (queryName, query, variables) => {
        try {
          const result = await API.graphql({
            query,
            variables
          });
          return result;
        } catch (err) {
          console.error(`Error fetching ${queryName}:`, err);
          throw new Error(`Failed to fetch ${queryName}: ${err.errors?.[0]?.message || err.message}`);
        }
      };

      // Function to fetch all pages for a given filter
      const fetchAllPages = async (query, filter) => {
        let items = [];
        let nextToken = null;
        do {
          const result = await fetchWithErrorHandling('paginatedQuery', query, {
            filter,
            limit: 1000,
            nextToken
          });
          const resultKey = Object.keys(result.data)[0];
          items = [...items, ...result.data[resultKey].items];
          nextToken = result.data[resultKey].nextToken;
        } while (nextToken);
        return items;
      };

      // Fetch projects where user is the owner
      const ownedProjects = await fetchAllPages(queries.listProjects, {
        owner: { eq: userSub },
        organizationID: { eq: activeOrganization?.id },
        _deleted: { ne: true }
      });

      // Fetch projects where user is a member (via ProjectMember table)
      const memberResult = await fetchWithErrorHandling('projectMembers', queries.listProjectMembers, {
        filter: {
          userSub: { eq: userSub },
          _deleted: { ne: true }
        },
        limit: 1000
      });

      // Get project details for member projects
      const memberProjectPromises = memberResult.data.listProjectMembers.items.map(async (member) => {
        try {
          const projectResult = await fetchWithErrorHandling('memberProject', queries.getProject, {
            id: member.projectID
          });
          return projectResult.data.getProject;
        } catch (error) {
          console.error('Error fetching member project:', error);
          return null;
        }
      });

      const memberProjects = (await Promise.all(memberProjectPromises))
        .filter(project => project && 
                           project.organizationID === activeOrganization?.id && 
                           !project._deleted);

      // Combine owned and member projects, removing duplicates
      const allProjectsList = [...ownedProjects, ...memberProjects];
      const uniqueProjects = Array.from(new Map(allProjectsList.map(project => [project.id, project])).values());
      
      const fetchedProjects = uniqueProjects.filter(item => !item._deleted);
      setProjects(fetchedProjects);

      // Fetch KPIs for each project with their data points
      const kpiPromises = fetchedProjects.map(async project => {
        const kpisResponse = await fetchWithErrorHandling('KPIs', queries.kPISByProjectID, {
          projectID: project.id,
          filter: {
            _deleted: { ne: true }
          }
        });
        
        const projectKpis = kpisResponse.data.kPISByProjectID.items;
        
        // Fetch KPI data points for each KPI
        const kpiDataPromises = projectKpis.map(kpi => 
          fetchWithErrorHandling('KPIData', queries.kPIDataByKpiID, {
            kpiID: kpi.id,
            filter: {
              _deleted: { ne: true }
            }
          })
        );
        
        const kpiDataResults = await Promise.all(kpiDataPromises);
        
        // Attach data points to each KPI
        return projectKpis.map((kpi, index) => ({
          ...kpi,
          project,
          dataPoints: kpiDataResults[index].data.kPIDataByKpiID.items
        }));
      });

      const kpiResults = await Promise.allSettled(kpiPromises);
      const fetchedKpis = kpiResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat()
        .filter(kpi => !kpi._deleted);
      
      setAllKpis(fetchedKpis);

      // Calculate KPI metrics
      const kpiMetrics = {
        active: fetchedKpis.filter(kpi => {
          const endDate = new Date(kpi.endDate);
          return endDate >= new Date();
        }).length,
        goalAttained: fetchedKpis.filter(kpi => {
          // Check if KPI has target and data points
          if (!kpi.target || !kpi.dataPoints || kpi.dataPoints.length === 0) return false;

          // Get the latest data point
          const latestDataPoint = kpi.dataPoints
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

          // Check if target is reached based on trend
          return kpi.trend 
            ? latestDataPoint.yAxisvalue >= kpi.target  // Higher is better
            : latestDataPoint.yAxisvalue <= kpi.target; // Lower is better
        }).length,
        byCategory: {
          all: fetchedKpis.length,
          safety: 0, // Projects don't have category field
          people: 0, // Projects don't have category field
          quality: 0 // Projects don't have category field
        }
      };

      // Fetch owned and assigned reports in parallel
      const [ownedReportsResult, assignedReportsResult, awardsResult, orgLearningsResult, defaultLearningsResult] = await Promise.all([
        fetchWithErrorHandling('ownedReports', queries.listReports, {
          filter: {
            user_sub: { eq: userSub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }),
        fetchWithErrorHandling('assignedReports', queries.listReports, {
          filter: {
            assignedMembers: { contains: userSub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }),
        fetchWithErrorHandling('awards', queries.listAwards, {
          filter: {
            user_sub: { eq: userSub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }),
        // Fetch organization-specific learnings
        activeOrganization?.id ? fetchWithErrorHandling('orgLearnings', queries.listLearnings, {
          filter: {
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }) : Promise.resolve({ data: { listLearnings: { items: [] } } }),
        
        // Fetch default learnings
        fetchWithErrorHandling('defaultLearnings', queries.listLearnings, {
          filter: {
            isDefault: { eq: true },
            _deleted: { ne: true }
          }
        })
      ]);

      // Process reports - combine owned and assigned reports
      const ownedReports = ownedReportsResult.data.listReports.items.filter(item => !item._deleted);
      const assignedReports = assignedReportsResult.data.listReports.items.filter(item => !item._deleted);
      
      // Combine and deduplicate reports
      const allReports = [...ownedReports, ...assignedReports];
      const uniqueReports = Array.from(new Map(allReports.map(report => [report.id, report])).values());
      
      const fetchedReports = uniqueReports
        .filter(item => !item._deleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReports(fetchedReports);

      // Process awards - filter out any awards with null organizationID
      const awards = awardsResult.data.listAwards.items
        .filter(award => award.organizationID && !award._deleted);

      // Process learnings and quizzes - combine org and default learnings properly
      const orgLearnings = orgLearningsResult.data.listLearnings.items.filter(l => !l._deleted);
      const defaultLearnings = defaultLearningsResult.data.listLearnings.items.filter(l => !l._deleted);

      // Create a set of cloned learning IDs to avoid duplicates
      const clonedLearningIds = new Set(
        orgLearnings.map(learning => learning.clonedFromID).filter(Boolean)
      );

      // Combine org learnings with uncloned default learnings
      const fetchedLearnings = [
        ...orgLearnings,
        ...defaultLearnings.filter(learning => !clonedLearningIds.has(learning.id))
      ];

      console.log('Home - Org learnings:', orgLearnings.length);
      console.log('Home - Default learnings:', defaultLearnings.length);
      console.log('Home - Cloned learning IDs:', clonedLearningIds);
      console.log('Home - Final fetched learnings:', fetchedLearnings.length);

      // Fetch quizzes for each learning
      const quizPromises = fetchedLearnings.map(learning => 
        fetchWithErrorHandling('quizzes', queries.quizzesByLearningId, {
          learningId: learning.id,
          filter: {
            _deleted: { ne: true }
          }
        })
      );

      const quizzesResponse = await Promise.allSettled(quizPromises);
      const allQuizzes = quizzesResponse
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.data.quizzesByLearningId.items)
        .flat()
        .filter(quiz => !quiz._deleted);

      const totalQuizzes = allQuizzes.length;

      // Fetch quiz results for the user
      const quizResultsResponse = await fetchWithErrorHandling('quizResults', queries.listQuizzesResults, {
        filter: {
          user_sub: { eq: userSub },
          _deleted: { ne: true }
        }
      });

      // Process quiz results
      const userQuizResults = {};
      const completedQuizzes = [];
      quizResultsResponse.data.listQuizzesResults.items.forEach(result => {
        if (!result._deleted) {
          const quizId = result.tool_id;
          if (!userQuizResults[quizId] || new Date(result.createdAt) > new Date(userQuizResults[quizId].createdAt)) {
            userQuizResults[quizId] = result;
            completedQuizzes.push({
              quizId,
              percentage: parseFloat(result.percentage)
            });
          }
        }
      });
      setQuizResults(userQuizResults);

      // Group quizzes by learning for progress tracking
      const quizzesByLearning = {};
      allQuizzes.forEach(quiz => {
        if (!quizzesByLearning[quiz.learningId]) {
          quizzesByLearning[quiz.learningId] = [];
        }
        quizzesByLearning[quiz.learningId].push(quiz);
      });
      setQuizzesByLearning(quizzesByLearning);

      // Calculate average score from completed quizzes
      const averageScore = completedQuizzes.length > 0
        ? completedQuizzes.reduce((acc, quiz) => acc + quiz.percentage, 0) / completedQuizzes.length
        : 0;

      // Calculate learning progress and ensure no duplicates
      const learningsWithProgress = fetchedLearnings
        .filter((learning, index, self) => 
          index === self.findIndex(l => l.id === learning.id)
        )
        .map(learning => ({
          ...learning,
          progress: calculateLearningProgress(
            learning.id,
            quizzesByLearning[learning.id] || [],
            userQuizResults
          )
        }));

      // Order learnings same as in LearningList component
      const orderedLearnings = orderLearnings(learningsWithProgress);

      setLearnings(orderedLearnings);

      // Update metrics with accurate quiz data
      setMetrics(prev => ({
        ...prev,
        projects: {
          open: fetchedProjects.filter(p => p.status === 'ACTIVE').length,
          closed: fetchedProjects.filter(p => p.status === 'COMPLETED').length,
          byCategory: {
            all: fetchedProjects.length,
            safety: 0, // Projects don't have category field
            people: 0, // Projects don't have category field
            quality: 0 // Projects don't have category field
          }
        },
        kpis: kpiMetrics,
        reports: {
          outstanding: fetchedReports.filter(r => !r.completed).length,
          closed: fetchedReports.filter(r => r.completed).length
        },
        awards: {
          attained: awards.length
        },
        quizzes: {
          completed: completedQuizzes.length,
          total: totalQuizzes,
          averageScore: averageScore
        },
        learnings: {
          accessed: learningsWithProgress.filter(l => l.progress.hasQuizTaken).length,
          total: fetchedLearnings.length
        }
      }));

      // Fetch action items
      await fetchActionItems(fetchedReports, fetchedProjects);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateLearningProgress = (learningId, quizzes, results) => {
    let totalProgress = 0;
    let completedQuizzes = 0;

    quizzes.forEach(quiz => {
      const result = results[quiz.id];
      if (result) {
        totalProgress += parseInt(result.percentage);
        completedQuizzes++;
      }
    });

    return {
      score: completedQuizzes > 0 ? Math.round(totalProgress / completedQuizzes) : 0,
      hasQuizTaken: completedQuizzes > 0,
      completedQuizzes,
      totalQuizzes: quizzes.length
    };
  };

  const fetchActionItems = async (reports, projects) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const userSub = user.attributes.sub;
      
      const fetchAllPages = async (filter) => {
        let items = [];
        let nextToken = null;
        do {
          const result = await API.graphql({
            query: queries.listActionItems,
            variables: {
              filter,
              limit: 1000,
              nextToken
            }
          });
          items = [...items, ...result.data.listActionItems.items];
          nextToken = result.data.listActionItems.nextToken;
        } while (nextToken);
        return items;
      };

      // Get report and project IDs
      const reportIds = reports.map(r => r.id);
      const projectIds = projects.map(p => p.id);

      // Fetch action items linked to user's reports and projects
      const fetchPromises = [];

      // Report-based action items (owned and assigned)
      reportIds.forEach(reportId => {
        fetchPromises.push(
          fetchAllPages({
            reportID: { eq: reportId },
            user_sub: { eq: userSub },
            _deleted: { ne: true }
          }),
          fetchAllPages({
            reportID: { eq: reportId },
            assignees: { contains: userSub },
            _deleted: { ne: true }
          })
        );
      });

      // Project-based action items (owned and assigned)
      projectIds.forEach(projectId => {
        fetchPromises.push(
          fetchAllPages({
            projectID: { eq: projectId },
            user_sub: { eq: userSub },
            _deleted: { ne: true }
          }),
          fetchAllPages({
            projectID: { eq: projectId },
            assignees: { contains: userSub },
            _deleted: { ne: true }
          })
        );
      });

      // Execute all fetches in parallel
      const allResults = await Promise.all(fetchPromises);
      const allItems = allResults.flat();

      // Remove duplicates
      const uniqueActionItems = Array.from(
        new Map(allItems.map(item => [item.id, item])).values()
      );
      
      // Debug logging
      console.log('Dashboard fetchActionItems debug:');
      console.log('Report IDs:', reportIds.length);
      console.log('Project IDs:', projectIds.length);
      console.log('Total fetched items:', allItems.length);
      console.log('Total after dedup:', uniqueActionItems.length);
      console.log('Action items breakdown:', {
        actionItems: uniqueActionItems.filter(item => !item.note).length,
        notes: uniqueActionItems.filter(item => item.note === true).length
      });
      
      setActionItems(uniqueActionItems);

      const dates = uniqueActionItems.reduce((acc, item) => {
        if (item.duedate) {
          const date = new Date(item.duedate);
          const currentDate = new Date();
          const formattedDate = format(date, 'yyyy-MM-dd');
          const isOverdue = date < currentDate;
          acc[formattedDate] = { 
            className: isOverdue ? 'action-item-date-overdue' : 'action-item-date-ontime' 
          };
        }
        return acc;
      }, {});
      
      setMarkedDates(dates);
    } catch (error) {
      console.error('Error fetching action items:', error);
    }
  };

  const filterActionItemsByDate = (items, selectedDate) => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const selectedDateObj = DateTime.fromISO(selectedDate, { zone: timeZone });
    
    return items.filter(item => {
      if (!item.duedate) return false;
      const itemDate = DateTime.fromJSDate(new Date(item.duedate)).setZone(timeZone);
      return itemDate.hasSame(selectedDateObj, 'day');
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'To Do';
      case 1:
        return 'In Progress';
      case 2:
        return 'In Review';
      case 3:
        return 'Done';
      default:
        return 'Unknown';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 0:
        return 'success';
      case 1:
        return 'warning';
      case 2:
        return 'info';
      case 3:
        return 'secondary';
      default:
        return 'dark';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const actionItemsByStatus = (status) => {
    return actionItems.filter((item) => item.status === status && !item.note).length;
  };

  const handleShowModal = (actionItemId = null) => {
    setSelectedActionItemId(actionItemId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedActionItemId(null);
    setShowModal(false);
  };

  const handleActionItemSave = () => {
    fetchAllData();
  };

  // Update the empty state button click handler
  const emptyStateButton = (
    <Button variant="primary" onClick={() => navigate('/action-items')}>
      Create Action Item
    </Button>
  );

  // Update the ListGroup.Item to be clickable
  const actionItemsList = (
    <ListGroup className="action-items-list">
      {filteredActionItems.map((item) => (
        <ListGroup.Item
          key={item.id}
          className="d-flex align-items-center"
          action
          onClick={() => navigate('/action-items', { state: { selectedActionItemId: item.id } })}
          style={{ cursor: 'pointer' }}
        >
          <div className={`me-3 p-2 rounded-circle ${item.note ? 'bg-info' : 'bg-success'}`}>
            <FontAwesomeIcon 
              icon={item.note ? faStickyNote : faClipboardCheck} 
              className="text-white"
            />
          </div>
          <div className="flex-grow-1">
            <h6 className="mb-1 text-truncate" style={{ maxWidth: '250px' }}>{item.title}</h6>
            <small className="d-flex align-items-center">
              {!item.note && (
                <>
                  {(() => {
                    const currentDate = new Date();
                    const dueDate = new Date(item.duedate);
                    const isOverdue = dueDate < currentDate;
                    const colorClass = isOverdue ? 'text-danger' : 'text-success';
                    
                    return (
                      <>
                        <i className={`far fa-calendar-alt me-1 ${colorClass}`}></i>
                        <span className={`me-2 ${colorClass}`}>{formatDate(item.duedate)}</span>
                      </>
                    );
                  })()}
                </>
              )}
              <i className="far fa-clock me-1 text-muted"></i>
              <span className="text-muted">Created: {formatDate(item.updatedAt)}</span>
            </small>
          </div>
          <div className="d-flex align-items-center">
            {!item.note && (
              <Badge 
                bg={getStatusBadgeColor(item.status)}
                className="me-2 px-3 py-2"
                pill
              >
                {getStatusText(item.status)}
              </Badge>
            )}
            {item.attachments?.length > 0 && (
              <div className="me-2 d-flex align-items-center rounded-pill bg-light px-2 py-1">
                <FontAwesomeIcon icon={faPaperclip} className="me-1 text-secondary" />
                <span className="text-secondary">{item.attachments.length}</span>
              </div>
            )}
            {item.assignees?.length > 0 && (
              <div className="d-flex align-items-center rounded-pill bg-light px-2 py-1">
                <FontAwesomeIcon icon={faUser} className="me-1 text-secondary" />
                <span className="text-secondary">{item.assignees.length}</span>
              </div>
            )}
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );

  const calculateMetrics = () => {
    // Action Items Metrics
    const openActionItems = actionItems.filter(item => [0, 1, 2].includes(item.status));
    const closedActionItems = actionItems.filter(item => item.status === 3);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueToday = actionItems.filter(item => {
      const dueDate = new Date(item.duedate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });

    const dueTomorrow = actionItems.filter(item => {
      const dueDate = new Date(item.duedate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === tomorrow.getTime();
    });

    // Calculate average completion time
    const completedItems = actionItems.filter(item => item.status === 3 && item.completedAt);
    const avgTime = completedItems.reduce((acc, item) => {
      const completionTime = new Date(item.completedAt) - new Date(item.createdAt);
      return acc + completionTime;
    }, 0) / (completedItems.length || 1);

    setMetrics(prev => ({
      ...prev,
      actionItems: {
        open: openActionItems.length,
        closed: closedActionItems.length,
        dueToday: dueToday.length,
        dueTomorrow: dueTomorrow.length,
        avgCompletionTime: Math.round(avgTime / (1000 * 60 * 60 * 24)) // Convert to days
      },
      quizzes: {
        completed: Object.keys(quizResults).length
      },
      learnings: {
        accessed: learnings.length
      }
    }));
  };

  useEffect(() => {
    calculateMetrics();
  }, [actionItems, reports, learnings, quizResults]);

  const renderTooltip = (content) => (
    <Tooltip id="tooltip">{content}</Tooltip>
  );

  const generateInsights = () => {
    const calculateCompletionRate = () => {
      const total = (metrics.projects.open || 0) + (metrics.projects.closed || 0);
      if (total === 0) return '0.0';
      return ((metrics.projects.closed || 0) / total * 100).toFixed(1);
    };

    // Calculate total quizzes and completed quizzes from learning progress
    const quizTotals = learnings.reduce((acc, learning) => {
      const progress = learning.progress || {};
      return {
        completed: acc.completed + (progress.completedQuizzes || 0),
        total: acc.total + (progress.totalQuizzes || 0),
        totalScore: acc.totalScore + ((progress.score || 0) * (progress.completedQuizzes || 0))
      };
    }, { completed: 0, total: 0, totalScore: 0 });

    const averageScore = quizTotals.completed > 0
      ? (quizTotals.totalScore / quizTotals.completed).toFixed(1)
      : '0.0';

    setInsights({
      actionItems: `${metrics.actionItems.open || 0} items need attention, with ${metrics.actionItems.dueToday || 0} due today`,
      projects: `${calculateCompletionRate()}% completion rate`,
      kpis: `${metrics.kpis.goalAttained || 0} KPIs have reached their targets`,
      learning: `Completed ${quizTotals.completed} out of ${quizTotals.total} quizzes with ${averageScore}% avg score`
    });
  };

  useEffect(() => {
    if (metrics && learnings.length > 0) {
      generateInsights();
    }
  }, [metrics, learnings]);

  // Chart Configurations and Data
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#2c3e50',
        bodyColor: '#2c3e50',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        boxPadding: 5,
        usePointStyle: true
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 3
      }
    }
  };

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
          color: '#596575'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12
          },
          color: '#2c3e50'
        }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.03)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#596575'
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#596575'
        }
      }
    },
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Learning Progress (All Modules)',
        font: {
          size: 14,
          weight: 'bold'
        },
        color: '#2c3e50',
        padding: {
          top: 10,
          bottom: 20
        }
      }
    }
  };

  const prepareActionItemTrendData = () => {
    const days = 7;
    const labels = Array.from({ length: days }, (_, i) => 
      format(subDays(new Date(), days - 1 - i), 'MMM dd')
    );

    const completedByDay = labels.map(day => 
      actionItems.filter(item => 
        item.status === 3 && 
        item.completedAt && 
        !isNaN(new Date(item.completedAt).getTime()) && 
        format(new Date(item.completedAt), 'MMM dd') === day
      ).length
    );

    const createdByDay = labels.map(day =>
      actionItems.filter(item =>
        item.createdAt && 
        !isNaN(new Date(item.createdAt).getTime()) && 
        format(new Date(item.createdAt), 'MMM dd') === day
      ).length
    );

    return {
      labels,
      datasets: [
        {
          label: 'Completed Items',
          data: completedByDay,
          borderColor: '#2ecc71',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#2ecc71',
          pointBorderWidth: 2
        },
        {
          label: 'New Items',
          data: createdByDay,
          borderColor: '#3a86ff',
          backgroundColor: 'rgba(58, 134, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#3a86ff',
          pointBorderWidth: 2
        }
      ]
    };
  };

  const prepareKPIRadarData = () => {
    const categories = ['Safety', 'People', 'Quality'];
    return {
      labels: categories,
      datasets: [
        {
          label: 'Goal Attainment (%)',
          data: categories.map(category => {
            const categoryKPIs = metrics.kpis.byCategory[category.toLowerCase()] || 0;
            const attained = allKpis?.filter(kpi => 
              kpi.project?.category === category.toUpperCase() && 
              kpi.dataPoints?.length > 0 &&
              kpi.dataPoints[kpi.dataPoints.length - 1].yAxisvalue >= kpi.target
            ).length || 0;
            return categoryKPIs > 0 ? (attained / categoryKPIs) * 100 : 0;
          }),
          backgroundColor: 'rgba(58, 134, 255, 0.2)',
          borderColor: '#3a86ff',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#3a86ff',
          pointHoverBackgroundColor: '#3a86ff',
          pointHoverBorderColor: '#ffffff',
          borderWidth: 2,
          pointBorderWidth: 2
        }
      ]
    };
  };

  const prepareProjectDistributionData = () => {
    const categories = ['Safety', 'People', 'Quality'];
    return {
      labels: categories,
      datasets: [{
        data: categories.map(category => 
          metrics.projects.byCategory[category.toLowerCase()] || 0
        ),
        backgroundColor: [
          'rgba(231, 76, 60, 0.8)',
          'rgba(58, 134, 255, 0.8)',
          'rgba(46, 204, 113, 0.8)'
        ],
        borderColor: [
          'rgba(231, 76, 60, 1)',
          'rgba(58, 134, 255, 1)',
          'rgba(46, 204, 113, 1)'
        ],
        borderWidth: 2
      }]
    };
  };

  const prepareLearningProgressData = () => {
    // Learnings are already ordered and deduplicated from the orderLearnings function
    return {
      labels: learnings.map(l => l.title),
      datasets: [
        {
          label: 'Quiz Score',
          data: learnings.map(l => l.progress?.score || 0),
          backgroundColor: 'rgba(58, 134, 255, 0.8)',
          borderRadius: 6,
          maxBarThickness: 25
        },
        {
          label: 'Completion Rate',
          data: learnings.map(l => {
            const totalQuizzes = l.progress?.totalQuizzes || 0;
            const completedQuizzes = l.progress?.completedQuizzes || 0;
            return totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 100 : 0;
          }),
          backgroundColor: 'rgba(46, 204, 113, 0.8)',
          borderRadius: 6,
          maxBarThickness: 25
        }
      ]
    };
  };

  const fetchAllOrganizations = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const userSub = user.attributes.sub;

      // Get organizations where user is a member
      const memberOrgsResponse = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            userSub: { eq: userSub },
            _deleted: { ne: true }
          }
        }
      });

      // Get organizations owned by user
      const ownedOrgsResponse = await API.graphql({
        query: queries.listOrganizations,
        variables: {
          filter: {
            owner: { eq: userSub },
            _deleted: { ne: true }
          }
        }
      });

      // Fetch full organization details for member organizations
      const memberOrgs = await Promise.all(
        memberOrgsResponse.data.listOrganizationMembers.items
          .filter(member => !member._deleted)
          .map(async (member) => {
            if (member.organizationID) {
              const orgResponse = await API.graphql({
                query: queries.getOrganization,
                variables: { id: member.organizationID }
              });
              return {
                ...orgResponse.data.getOrganization,
                role: member.role,
                membershipStatus: member.status
              };
            }
            return null;
          })
      );

      const validMemberOrgs = memberOrgs.filter(org => org !== null && !org._deleted);
      const ownedOrgs = ownedOrgsResponse.data.listOrganizations.items
        .filter(org => !org._deleted)
        .map(org => ({
          ...org,
          role: 'OWNER',
          membershipStatus: 'ACTIVE'
        }));

      // Combine and deduplicate organizations
      const allOrgs = [...validMemberOrgs, ...ownedOrgs]
        .reduce((acc, org) => {
          if (!acc.find(o => o.id === org.id)) {
            acc.push(org);
          }
          return acc;
        }, [])
        .map(org => ({
          ...org,
          coordinates: extractCoordinates(org.location)
        }));

      setAllOrganizations(allOrgs);

      // Update aggregated data
      const aggregatedData = allOrgs.reduce((acc, org) => {
        const region = org.location?.split(',')[1]?.trim() || 'Unknown';
        if (!acc[region]) {
          acc[region] = {
            count: 0,
            totalProjects: 0,
            totalKPIs: 0,
            completionRate: 0,
            organizations: []
          };
        }
        
        acc[region].count++;
        acc[region].organizations.push(org);
        
        return acc;
      }, {});

      // Update state with the aggregated data
      setAggregateOrganizationData(aggregatedData);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to load organization data');
    }
  };

  const extractCoordinates = (location) => {
    // This is a simple mapping of locations to coordinates
    // In a real application, you would use a geocoding service
    const coordinatesMap = {
      'New York': [-74.006, 40.7128],
      'London': [-0.1276, 51.5074],
      'Tokyo': [139.6917, 35.6895],
      'Sydney': [151.2093, -33.8688],
      // Add more mappings as needed
    };
    return coordinatesMap[location] || [0, 0];
  };

  const prepareRegionalData = () => {
    const regions = Object.keys(aggregateOrganizationData);
    return {
      labels: regions,
      datasets: [
        {
          label: 'Organizations',
          data: regions.map(region => aggregateOrganizationData[region].count),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Average Completion Rate (%)',
          data: regions.map(region => 
            aggregateOrganizationData[region].completionRate / 
            aggregateOrganizationData[region].count || 0
          ),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };
  };

  return (
    <Container fluid className="py-4">
      {/* Location Warning - Moved to top */}
      <LocationWarning />
      
      {isLoading ? (
        <Card className="glass-card mb-4">
          <Card.Body className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading data...</p>
          </Card.Body>
        </Card>
      ) : error ? (
        <Card className="glass-card mb-4">
          <Card.Body>
            <p className="text-danger">{error}</p>
            <Button variant="primary" onClick={fetchAllData}>
              Retry
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="personal" title="Personal Dashboard">
              {/* Calendar & Action Items Section - Moved to top */}
              <section className="mb-5">
                <h4 className="section-title">
                  <i className="fas fa-calendar me-2"></i>
                  Schedule & Tasks
                </h4>
                <p className="section-description">
                  Manage your daily tasks, track due dates, and stay on top of action items.
                </p>
                <Row className="g-4">
                  <Col md={8}>
                    <Card className="glass-card mb-4">
                      <Card.Header className="theme-header">
                        <h6 className="mb-0">Summary</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col sm={6} lg={2} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{reports.length}</div>
                              <p className="metric-label">Total Reports</p>
                            </div>
                          </Col>
                          <Col sm={6} lg={2} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{reports.filter(r => r.completed).length}</div>
                              <p className="metric-label">Completed Reports</p>
                            </div>
                          </Col>
                          <Col sm={6} lg={2} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{projects.length}</div>
                              <p className="metric-label">Total Projects</p>
                            </div>
                          </Col>
                          <Col sm={6} lg={2} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{actionItems.length}</div>
                              <p className="metric-label">Total Action Items / Notes</p>
                            </div>
                          </Col>
                          <Col sm={6} lg={1} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{actionItemsByStatus(0)}</div>
                              <p className="metric-label">To Do</p>
                            </div>
                          </Col>
                          <Col sm={6} lg={1} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{actionItemsByStatus(1)}</div>
                              <p className="metric-label">In Progress</p>
                            </div>
                          </Col>
                          <Col sm={6} lg={2} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{actionItemsByStatus(2)}</div>
                              <p className="metric-label">In Review</p>
                            </div>
                          </Col>
                          <Col sm={6} lg={2} className="mb-3">
                            <div className="text-center">
                              <div className="metric-value">{actionItemsByStatus(3)}</div>
                              <p className="metric-label">Completed</p>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="glass-card mb-4">
                      <Card.Header className="theme-header">
                        <h6 className="mb-0">Organization</h6>
                      </Card.Header>
                      <Card.Body>
                        <p className="mb-1"><strong>Name:</strong> {activeOrganization?.name}</p>
                        <p className="mb-1"><strong>Email:</strong> {activeOrganization?.contactEmail}</p>
                        {activeOrganization?.location && (
                          <p className="mb-1"><strong>Location:</strong> {activeOrganization.location}</p>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <Row className="g-4">
                  <Col md={6}>
                    <Card className="glass-card">
                      <Card.Header className="theme-header">
                        <h6 className="mb-0">Action Items Due Dates (Includes all items due before today, even if marked as Done.)</h6>
                      </Card.Header>
                      <Card.Body className="calendar-wrapper">
                        <Calendar
                          className="calendar"
                          value={selectedDate}
                          onChange={setSelectedDate}
                          tileClassName={({ date }) => {
                            const formattedDate = format(date, 'yyyy-MM-dd');
                            return markedDates[formattedDate]?.className;
                          }}
                          nextLabel="›"
                          prevLabel="‹"
                          next2Label="»"
                          prev2Label="«"
                          navigationLabel={({ date }) => format(date, 'MMMM yyyy')}
                        />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="glass-card">
                      <Card.Header className="theme-header">
                        <div className="d-flex justify-content-between align-items-center w-100">
                          <h6 className="mb-0">Action Items for {formatDate(selectedDate)}</h6>
                          <Button 
                            variant="light" 
                            size="sm" 
                            className="rounded-pill py-1 px-3" 
                            onClick={() => navigate('/action-items')}
                          >
                            Open Board View
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <Alert variant="secondary" className="mb-3">
                          ⚠️ Notes Do not appear on Board Views
                        </Alert>
                        {filteredActionItems.length === 0 ? (
                          <div className="empty-state">
                            <p>There is no action item found</p>
                            <Button variant="primary" className="rounded-pill" onClick={() => navigate('/action-items')}>
                              + Create Action Item in Board View
                            </Button>
                          </div>
                        ) : actionItemsList}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>
              
              {/* Learning & Development Section - Moved after calendar section */}
              <section className="mb-5">
                <h4 className="section-title">
                  <i className="fas fa-graduation-cap me-2"></i>
                  Your Learning & Progress
                  <small className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                    (Personal progress within {activeOrganization?.name})
                  </small>
                </h4>
                <p className="section-description">
                  Track your personal educational achievements, quiz completions, and learning progress.
                </p>
                <Row className="g-4">
                  <Col md={7}>
                    <Card className="glass-card h-100">
                      <Card.Header className="theme-header">
                        <h6 className="mb-0">Your Learning Progress Overview</h6>
                      </Card.Header>
                      <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        <div style={{ minHeight: '400px' }}>
                          <Bar data={prepareLearningProgressData()} options={barOptions} />
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={5}>
                    <Card className="glass-card h-100">
                      <Card.Header className="theme-header">
                        <h6 className="mb-0">Your Quiz Performance</h6>
                      </Card.Header>
                      <Card.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {learnings.length > 0 ? (
                          <ListGroup variant="flush">
                            {learnings.map(learning => (
                              <ListGroup.Item 
                                key={learning.id} 
                                action 
                                onClick={() => navigate('/quizzes')}
                                style={{ cursor: 'pointer', border: 'none', borderRadius: '8px', marginBottom: '6px' }}
                              >
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="mb-0 text-truncate" style={{ maxWidth: '70%' }}>{learning.title}</h6>
                                  <Badge bg="info" pill>
                                    {learning.progress?.completedQuizzes || 0} / {learning.progress?.totalQuizzes || 0}
                                  </Badge>
                                </div>
                                <ProgressBar
                                  now={learning.progress?.score || 0}
                                  label={`${learning.progress?.score || 0}%`}
                                  variant={(learning.progress?.score || 0) >= 70 ? 'success' : 'warning'}
                                  style={{ height: '10px', borderRadius: '5px' }}
                                />
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        ) : (
                          <div className="text-center text-muted">
                            <p>No quiz results yet</p>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => navigate('/quizzes')}
                              className="rounded-pill"
                            >
                              Take a Quiz
                            </Button>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* Tools & Resources Section */}
              <section className="mb-5">
                <h4 className="section-title">
                  <i className="fas fa-tools me-2"></i>
                  Tools & Resources
                </h4>
                <p className="section-description">
                  Access our comprehensive suite of lean management tools designed to optimize your workflow.
                </p>
                <Row className="g-4">
                  <Col md={12}>
                    <Card className="glass-card">
                      <Card.Header className="theme-header">
                        <h5 className="mb-0 d-flex align-items-center">
                          <i className="fas fa-tools me-2"></i>
                          VibeStack Tools
                          <span className="ms-2" style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            Explore our suite of lean management tools
                          </span>
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <ToolsCarousel />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>

              {/* Customize Your Experience Section */}
              <section className="mb-5">
                <h4 className="section-title">
                  <i className="fas fa-cog me-2"></i>
                  Customize Your Experience
                </h4>
                <p className="section-description">
                  Tailor the application to match your organization's unique needs.
                </p>
                <Row>
                  <Col md={12}>
                    <Card className="glass-card">
                      <Card.Header className="theme-header">
                        <div className="text-center w-100">
                          <h5 className="mb-0">CUSTOMIZE THIS APP</h5>
                          <p className="mb-0 mt-1" style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            For Your Organization
                          </p>
                        </div>
                      </Card.Header>
                      <Card.Body style={{ borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
                        <p className="text-center mb-0">
                          This app can be customized with your organizational logo, case studies, images, etc. 
                          Please contact our sales team at hello@vibestack.example.
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>
            </Tab>

            <Tab eventKey="organization" title="Organization Analytics">
              {/* Organization Analytics Section */}
              <section className="mb-5">
                <h4 className="section-title">
                  <i className="fas fa-chart-bar me-2"></i>
                  Organization Analytics
                </h4>
                <p className="section-description">
                  Interactive map-based analytics with powerful filtering capabilities. Filter organizations by location or user 
                  to analyze regional performance and distribution.
                </p>
                <Row>
                  <Col md={12}>
                    <Card className="analytics-card border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <OrganizationAnalytics />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </section>
            </Tab>
          </Tabs>

          {/* Action Item Modal */}
          <ActionItemModal
            show={showModal}
            handleClose={handleCloseModal}
            actionItemId={selectedActionItemId}
            onSave={handleActionItemSave}
          />
        </>
      )}
    </Container>
  );
};

export default Home;