import React, { useState, useEffect, useRef, } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Badge, Button, Alert, Col, Container } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import RadarChart from '../shared/charts/RadarChart'
import AttachmentImage from '../shared/AttachmentImage';
import fiveS from '../../assets/lean-tools/light/5s.png';
import gembaWalk from '../../assets/lean-tools/light/gemba_walk.png';
import kaizenProject from '../../assets/lean-tools/light/kaizen_project.png';
import fiveWhys from '../../assets/lean-tools/light/5_whys.png';
import leanOverview from '../../assets/lean-tools/light/lean_overview_and_assessment.png';
import leadership from '../../assets/lean-tools/light/leadership.png';
import a3ProjectReport from '../../assets/lean-tools/light/a3_project_report.png';
import dmaic from '../../assets/lean-tools/light/dmaic.png';
import pdca from '../../assets/lean-tools/light/pdca.png';
import wasteWalk from '../../assets/lean-tools/light/waste_walk.png';
import mistakeProofing from '../../assets/lean-tools/light/mistake_proofing.png';
import Highlights from '../shared/Highlights';

import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { graphqlOperation } from 'aws-amplify';
import * as subscriptionQueries from '../../graphql/subscriptions';

// Import report components
import AssessmentReport from '../reports_pdf/AssessmentReport';
import ProcessAnalysisReport from '../reports_pdf/ProcessAnalysisReport';
import ObservationReport from '../reports_pdf/ObservationReport';
import ProblemSolvingReport from '../reports_pdf/ProblemSolvingReport';
import LeadershipReport from '../reports_pdf/LeadershipReport';

const customContent = {
  fontSize: "15px", 
  lineHeight: 1,
};

const ReportPdf = ({ reportId: propReportId, fromProject = false }) => {
    const { reportId: urlReportId } = useParams();
    const effectiveReportId = propReportId || urlReportId;
    const [reportData, setReportData] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [error, setError] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [loadingChartData, setLoadingChartData] = useState(false);
    const [isLoadingReport, setLoadingReport] = useState(true);
    const [isGembaWalkReport, setisGembaWalkReport] = useState(false);
    const [isKaizenReport, setisKaizenReport] = useState(false);
    const [is5WhysReport, setis5WhysReport] = useState(false);
    const [isLARReport, setisLARReport] = useState(false);
    const [isLeadership, setisLeadership] = useState(false);
    const [isA3, setisA3] = useState(false);
    const [isDMAIC, setisDMAIC] = useState(false);
    const [isPDCA, setisPDCA] = useState(false);
    const [isWaste, setisWaste] = useState(false);
    const [isMp, setisMp] = useState(false);
    const [isLean5s, setisLean5s] = useState(false);
    const [highlightsData, setHighlightsData] = useState(null);
    const [actionItemsData, setActionItemsData] = useState([]);
    const [allImagesLoaded, setAllImagesLoaded] = useState(true);
    const subscriptions = useRef([]);

    console.log(reportData);
    
    useEffect(() => {
      const fetchData = async () => {
        if (!effectiveReportId) {
          console.error('No report ID provided');
          setError('No report ID provided');
          return;
        }
        await fetchReportData();
        await getHighlightsByReportId();
      };

      fetchData();
    }, [effectiveReportId]);

    const setReportTypeFlags = (reportType) => {
      setisGembaWalkReport(reportType === "Gemba Walk Report");
      setisKaizenReport(reportType === "Kaizen Project Report");
      setis5WhysReport(reportType === "5 Whys Report");
      setisLARReport(reportType === "Lean Assessment Report");
      setisLeadership(reportType === "Leadership Report");
      setisA3(reportType === "A3 Project Report");
      setisDMAIC(reportType === "DMAIC Report");
      setisPDCA(reportType === "PDCA Report");
      setisWaste(reportType === "Waste Walk Report");
      setisMp(reportType === "Mistake Proofing Report");
      setisLean5s(reportType === "5S Report");
    };

    const fetchReportData = async () => {
      try {
        setLoadingReport(true);
        console.log("Fetching report with ID:", effectiveReportId);

        // Fetch report data
        const reportResult = await API.graphql({
          query: queries.getReport,
          variables: { id: effectiveReportId }
        });

        console.log("Raw report response:", reportResult);
        
        if (!reportResult.data?.getReport) {
          throw new Error('Report not found');
        }

        const fetchedReport = reportResult.data.getReport;
        setReportTypeFlags(fetchedReport.type);

        // Fetch categories
        const categoriesResponse = await API.graphql({
          query: queries.listCategories,
          variables: {
            filter: { 
              reportID: { eq: effectiveReportId },
              _deleted: { ne: true }
            },
            limit: 1000
          }
        });
        
        const categories = categoriesResponse.data.listCategories.items
          .filter(item => item && !item._deleted)
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

        // Process categories and their statements
        const categoriesWithStatements = await Promise.all(categories.map(async category => {
          // Fetch statements for this category
          const statementsResponse = await API.graphql({
            query: queries.statementsByCategoriesID,
            variables: {
              categoriesID: category.id,
              filter: { 
                _deleted: { ne: true },
                default: { ne: true }
              },
              limit: 1000
            }
          });

          let categoryStatements = statementsResponse.data.statementsByCategoriesID.items
            .filter(item => item && !item._deleted && !item.default)
            .sort((a, b) => {
              // For 5 Whys Report, sort by creation time to maintain entry order
              if (fetchedReport.type === "5 Whys Report") {
                return new Date(a.createdAt) - new Date(b.createdAt);
              }
              // For other reports, use orderIndex if available, otherwise createdAt
              return (a.orderIndex || 0) - (b.orderIndex || 0) || new Date(a.createdAt) - new Date(b.createdAt);
            });

          // Special handling for Mistake Proofing Report
          if (fetchedReport.type === "Mistake Proofing Report") {
            // Check if required statements exist
            const hasPS = categoryStatements.some(s => s.name === "Potential Score");
            const hasCS = categoryStatements.some(s => s.name === "Consequences Score");

            // Add missing statements if needed
            if (!hasPS) {
              console.warn(`Adding missing Potential Score for category ${category.name}`);
              const newPS = {
                id: `tmp-ps-${category.id}`,
                name: "Potential Score",
                value: 3,
                categoriesID: category.id
              };
              categoryStatements.push(newPS);
            }

            if (!hasCS) {
              console.warn(`Adding missing Consequences Score for category ${category.name}`);
              const newCS = {
                id: `tmp-cs-${category.id}`,
                name: "Consequences Score",
                value: 3,
                categoriesID: category.id
              };
              categoryStatements.push(newCS);
            }

            // Map the values properly
            categoryStatements = categoryStatements.map(statement => {
              if (statement.name === "Potential Score") {
                return {
                  ...statement,
                  potentialScore: statement.value,
                  value: statement.value
                };
              } else if (statement.name === "Consequences Score") {
                return {
                  ...statement,
                  consequencesScore: statement.value,
                  value: statement.value
                };
              }
              return statement;
            });
          }

          return {
            ...category,
            Statements: {
              items: categoryStatements
            }
          };
        }));

        // Fetch action items
        let allActionItems = [];
        let nextToken = null;
        
        do {
          const actionItemsResponse = await API.graphql({
            query: queries.listActionItems,
            variables: {
              filter: { 
                reportID: { eq: effectiveReportId },
                _deleted: { ne: true }
              },
              limit: 1000,
              nextToken
            }
          });
          
          const items = actionItemsResponse.data.listActionItems.items
            .filter(item => item && !item._deleted);
          
          allActionItems = [...allActionItems, ...items];
          nextToken = actionItemsResponse.data.listActionItems.nextToken;
        } while (nextToken);

        // Sort all action items
        allActionItems.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        
        console.log(`Fetched ${allActionItems.length} action items for report ${effectiveReportId}`);

        // Construct the final report object
        const report = {
          ...fetchedReport,
          Categories: { items: categoriesWithStatements },
          ActionItems: { items: allActionItems }
        };

        console.log("Processed report data:", report);
        setReportData(report);
        setActionItemsData(allActionItems);

        // Trigger chart data update
        await getChartData();

      } catch (error) {
        // Check if this is an authentication error (byteLength issues)
        if (error.message && error.message.includes('byteLength')) {
          console.log('Authentication required for full report data - silencing error');
          // Set minimal data to prevent crashes but don't show error to user
          setReportData({ reportType: 'Report', title: 'Report Preview', organizationName: 'Organization' });
          return;
        }
        
        console.error('Error fetching report data:', error);
        if (error.errors) {
          console.error('GraphQL Errors:', error.errors);
        }
        setError(error.message || 'Error fetching report data');
      } finally {
        setLoadingReport(false);
      }
    };

    const getHighlightsByReportId = async () => {
      try {
        const highlightsResponse = await API.graphql({
          query: queries.highlightsByReportIDAndCreatedAt,
          variables: {
            reportID: effectiveReportId,
            sortDirection: 'DESC',
            limit: 100
          }
        });
        
        let fetchedHighlights = highlightsResponse.data.highlightsByReportIDAndCreatedAt.items
          .filter(item => !item._deleted);

        // Filter out highlights where title is "Action Items"
        fetchedHighlights = fetchedHighlights.filter(highlight => highlight.title !== "Action Items");

        setHighlightsData(fetchedHighlights);
      } catch (error) {
        // Silently handle auth errors for public access
        if (error.message && error.message.includes('byteLength')) {
          console.log('Authentication required for highlights - silencing error');
          return;
        }
        console.error("Error fetching highlights:", error);
      }
    };

  useEffect(() => {
    let titleOrder = [];

    if (isA3) {
      titleOrder = [
        'Problem Statement',
        'Current State',
        'Improvement Opportunity',
        'Problem Analysis',
        'Future State',
        'Implementation Plan',
        'Verify Results',
        'Follow-Up'
      ];
    } else if (isDMAIC) {
      titleOrder = [
        'Prepare',
        'Define',
        'Measure',
        'Analyze',
        'Improve',
        'Control'
      ];
    } else if (isPDCA) {
      titleOrder = [
        'Plan',
        'Do',
        'Check',
        'Act'
      ];
    } else if (isLeadership) {
      titleOrder = [
        'Accomplishments and significant events',
        'Improvement PDCAs',
        'Special recognitions',
        'Upcoming issues and events',
        'Resource and support needs',
        'Action Items'
      ];
    }

    if (highlightsData && titleOrder.length > 0) {
      highlightsData.sort((a, b) => titleOrder.indexOf(a.title) - titleOrder.indexOf(b.title));
    } else if (highlightsData) {
      highlightsData.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Set the sorted highlights back to state
    setHighlightsData(highlightsData);
  }, [highlightsData, isA3, isDMAIC, isPDCA, isLeadership]);

const getChartData = async () => {
  if (isGembaWalkReport || is5WhysReport || isKaizenReport || isLeadership || isA3 || isDMAIC || isPDCA || isWaste) {
    return;
  }
  
  try {
    // Fetch categories with statements
    const categoriesResponse = await API.graphql({
      query: queries.listCategories,
      variables: {
        filter: { 
          reportID: { eq: effectiveReportId },
          _deleted: { ne: true }
        },
        limit: 1000
      }
    });
    
    if (!categoriesResponse?.data?.listCategories?.items) {
      console.error('Invalid categories response');
      setChartData([]);
      return;
    }

    const categories = categoriesResponse.data.listCategories.items
      .filter(item => item && !item._deleted)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    const chartData = await Promise.all(
      categories.map(async (category) => {
        if (!category?.id) return null;

        try {
          const statementsResponse = await API.graphql({
            query: queries.listStatements,
            variables: {
              filter: { 
                categoriesID: { eq: category.id },
                _deleted: { ne: true },
                default: { ne: true }
              },
              limit: 1000
            }
          });

          if (!statementsResponse?.data?.listStatements?.items) {
            return null;
          }

          const statements = statementsResponse.data.listStatements.items
            .filter(item => item && !item._deleted);

          if (!statements.length) {
            return { 
              id: category.id, 
              name: category.name || 'Unnamed Category', 
              avgValue: 1 
            };
          }

          let count = 0;
          const sumValues = statements.reduce((total, statement) => {
            if (statement && typeof statement.value === 'number') {
              count++;
              return total + statement.value;
            }
            return total;
          }, 0);

          return { 
            id: category.id, 
            name: category.name || 'Unnamed Category', 
            avgValue: count > 0 ? sumValues / count : 0 
          };
        } catch (error) {
          console.error(`Error fetching statements for category ${category.id}:`, error);
          return null;
        }
      })
    );

    const validChartData = chartData.filter(Boolean);
    console.log('Updated chart data:', validChartData);
    setChartData(validChartData);
  } catch (error) {
    // Silently handle auth errors for public access
    if (error.message && error.message.includes('byteLength')) {
      console.log('Authentication required for chart data - silencing error');
      setChartData([]);
      return;
    }
    console.error('Error fetching chart data:', error);
    setChartData([]);
  } finally {
    setLoadingChartData(false);
  }
};

  // Separate useEffect for subscriptions
  useEffect(() => {
    if (!reportData) return; // Only set up subscriptions after we have report data

    const setupSubscription = (query, filter) => {
      return API.graphql({
        query,
        variables: { filter }
      }).subscribe({
        next: () => getChartData(),
        error: error => console.warn('Subscription error:', error)
      });
    };

    // Set up subscriptions for statements and categories
    const subs = [
      // Statement subscriptions
      setupSubscription(subscriptionQueries.onCreateStatements, {
        reportID: { eq: effectiveReportId },
        _deleted: { ne: true }
      }),
      setupSubscription(subscriptionQueries.onUpdateStatements, {
        reportID: { eq: effectiveReportId },
        _deleted: { ne: true }
      }),
      setupSubscription(subscriptionQueries.onDeleteStatements, {
        reportID: { eq: effectiveReportId }
      }),

      // Category subscriptions
      setupSubscription(subscriptionQueries.onCreateCategories, {
        reportID: { eq: effectiveReportId },
        _deleted: { ne: true }
      }),
      setupSubscription(subscriptionQueries.onUpdateCategories, {
        reportID: { eq: effectiveReportId },
        _deleted: { ne: true }
      }),
      setupSubscription(subscriptionQueries.onDeleteCategories, {
        reportID: { eq: effectiveReportId }
      })
    ];

    subscriptions.current = subs;

    // Cleanup subscriptions
    return () => {
      if (subscriptions.current.length > 0) {
        subscriptions.current.forEach(subscription => {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.warn('Error unsubscribing:', error);
          }
        });
      }
    };
  }, [effectiveReportId, reportData, getChartData]);

  if (!reportData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spinner animation="border" role="status" style={{ width: '4rem', height: '4rem' }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  const renderReport = () => {
    const commonProps = {
      reportData,
      fromProject,
      isGeneratingPDF,
      allImagesLoaded
    };

    switch (reportData.type) {
      case "5S Report":
      case "Lean Assessment Report":
      case "Mistake Proofing Report":
        return (
          <AssessmentReport
            {...commonProps}
            chartData={chartData}
          />
        );

      case "A3 Project Report":
      case "DMAIC Report":
      case "PDCA Report":
        return (
          <ProcessAnalysisReport
            {...commonProps}
            highlightsData={highlightsData}
            actionItemsData={actionItemsData}
          />
        );

      case "Gemba Walk Report":
      case "Waste Walk Report":
        return (
          <ObservationReport
            {...commonProps}
            highlightsData={highlightsData}
            actionItemsData={actionItemsData}
          />
        );

      case "5 Whys Report":
      case "Kaizen Project Report":
        return (
          <ProblemSolvingReport
            {...commonProps}
            highlightsData={highlightsData}
            actionItemsData={actionItemsData}
          />
        );

      case "Leadership Report":
        return (
          <LeadershipReport
            {...commonProps}
            highlightsData={highlightsData}
            actionItemsData={actionItemsData}
          />
        );

      default:
        return <Alert variant="warning">Unknown report type: {reportData.type}</Alert>;
    }
  };

  return renderReport();
};

export default ReportPdf;