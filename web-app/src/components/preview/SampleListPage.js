import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Badge, Button, Alert, Tab, Tabs, Modal } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import { useOrganization } from '../../contexts/OrganizationContext';
import * as queries from '../../graphql/queries';
import toolsData from '../../json/tools.json';
import iconMappings from '../../utils/iconMappings';
import LFlogo from '../../assets/VibeStack_pro.png';

// Import available sample data
import sampleReport1 from './sample_data/5s_report_1.json';
import sampleReport2 from './sample_data/5s_report_2.json';
import sampleReport3 from './sample_data/5s_report_3.json';
import leanAssessment1 from './sample_data/lean_assessment_report_1.json';
import leanAssessment2 from './sample_data/lean_assessment_report_2.json';
import leanAssessment3 from './sample_data/lean_assessment_report_3.json';
import mistakeProofing1 from './sample_data/mistake_proofing_report_1.json';
import mistakeProofing2 from './sample_data/mistake_proofing_report_2.json';
import mistakeProofing3 from './sample_data/mistake_proofing_report_3.json';
import leadership1 from './sample_data/leadership_report_1.json';
import leadership2 from './sample_data/leadership_report_2.json';
import leadership3 from './sample_data/leadership_report_3.json';
import kaizen1 from './sample_data/kaizen_report_1.json';
import kaizen2 from './sample_data/kaizen_report_2.json';
import kaizen3 from './sample_data/kaizen_report_3.json';
import a3Report1 from './sample_data/a3_report_1.json';
import a3Report2 from './sample_data/a3_report_2.json';
import a3Report3 from './sample_data/a3_report_3.json';
import pdcaReport1 from './sample_data/pdca_report_1.json';
import pdcaReport2 from './sample_data/pdca_report_2.json';
import pdcaReport3 from './sample_data/pdca_report_3.json';
import gembaWalkReport1 from './sample_data/gemba_walk_report_1.json';
import gembaWalkReport2 from './sample_data/gemba_walk_report_2.json';
import gembaWalkReport3 from './sample_data/gemba_walk_report_3.json';
import wasteWalkReport1 from './sample_data/waste_walk_report_1.json';
import wasteWalkReport2 from './sample_data/waste_walk_report_2.json';
import wasteWalkReport3 from './sample_data/waste_walk_report_3.json';
import vsmReport1 from './sample_data/vsm_report_1.json';
import vsmReport2 from './sample_data/vsm_report_2.json';
import vsmReport3 from './sample_data/vsm_report_3.json';
import fiveWhysReport1 from './sample_data/5whys_report_1.json';
import fiveWhysReport2 from './sample_data/5whys_report_2.json';
import fiveWhysReport3 from './sample_data/5whys_report_3.json';
import fishboneReport1 from './sample_data/fishbone_report_1.json';
import fishboneReport2 from './sample_data/fishbone_report_2.json';
import fishboneReport3 from './sample_data/fishbone_report_3.json';
import brainstormingReport1 from './sample_data/brainstorming_report_1.json';
import brainstormingReport2 from './sample_data/brainstorming_report_2.json';
import brainstormingReport3 from './sample_data/brainstorming_report_3.json';
import histogramReport1 from './sample_data/histogram_report_1.json';
import histogramReport2 from './sample_data/histogram_report_2.json';
import histogramReport3 from './sample_data/histogram_report_3.json';
import paretoChartReport1 from './sample_data/pareto_chart_report_1.json';
import paretoChartReport2 from './sample_data/pareto_chart_report_2.json';
import paretoChartReport3 from './sample_data/pareto_chart_report_3.json';
import runChartReport1 from './sample_data/run_chart_report_1.json';
import runChartReport2 from './sample_data/run_chart_report_2.json';
import runChartReport3 from './sample_data/run_chart_report_3.json';
import scatterPlotReport1 from './sample_data/scatter_plot_report_1.json';
import scatterPlotReport2 from './sample_data/scatter_plot_report_2.json';
import scatterPlotReport3 from './sample_data/scatter_plot_report_3.json';
import dmaicReport1 from './sample_data/dmaic_report_1.json';
import dmaicReport2 from './sample_data/dmaic_report_2.json';
import dmaicReport3 from './sample_data/dmaic_report_3.json';
import standardWorkReport1 from './sample_data/standard_work_report_1.json';
import standardWorkReport2 from './sample_data/standard_work_report_2.json';
import standardWorkReport3 from './sample_data/standard_work_report_3.json';
import impactMapReport1 from './sample_data/impact_map_report_1.json';
import impactMapReport2 from './sample_data/impact_map_report_2.json';
import impactMapReport3 from './sample_data/impact_map_report_3.json';
import stakeholderAnalysisReport1 from './sample_data/stakeholder_analysis_report_1.json';
import stakeholderAnalysisReport2 from './sample_data/stakeholder_analysis_report_2.json';
import stakeholderAnalysisReport3 from './sample_data/stakeholder_analysis_report_3.json';

const SampleListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize tab from URL parameter, default to 'lean-tools'
    return searchParams.get('tab') || 'lean-tools';
  });
  const [learnings, setLearnings] = useState({});
  const [loading, setLoading] = useState(true);
  const { activeOrganization } = useOrganization();
  const [showStudyMaterialWarning, setShowStudyMaterialWarning] = useState(false);
  const [selectedLearning, setSelectedLearning] = useState(null);

  // Scroll to top and fetch learning materials
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    fetchLearnings();
  }, [activeOrganization?.id]);

  const fetchLearnings = async () => {
    try {
      let learningItems = [];
      
      // Fetch both organization-specific and default learnings
      const [orgLearningsResponse, defaultLearningsResponse] = await Promise.all([
        activeOrganization?.id ? API.graphql({
          query: queries.listLearnings,
          variables: {
            filter: {
              organizationID: { eq: activeOrganization.id },
              _deleted: { ne: true }
            }
          }
        }) : Promise.resolve({ data: { listLearnings: { items: [] } } }),
        
        API.graphql({
          query: queries.listLearnings,
          variables: {
            filter: {
              isDefault: { eq: true },
              _deleted: { ne: true }
            }
          }
        })
      ]);

      const orgLearnings = orgLearningsResponse.data.listLearnings.items;
      const defaultLearnings = defaultLearningsResponse.data.listLearnings.items;

      // Create a set of cloned learning IDs
      const clonedLearningIds = new Set(
        orgLearnings.map(learning => learning.clonedFromID).filter(Boolean)
      );

      // Combine org learnings with uncloned default learnings
      learningItems = [
        ...orgLearnings,
        ...defaultLearnings.filter(learning => !clonedLearningIds.has(learning.id))
      ];

      // Create a map of tool name to learning for easy lookup
      const learningMap = {};
      learningItems.forEach(learning => {
        // Try to match learning title with tool names
        const matchingTool = toolsData.find(tool => 
          tool.name.toLowerCase() === learning.title.toLowerCase() ||
          learning.title.toLowerCase().includes(tool.name.toLowerCase()) ||
          tool.subtitle.toLowerCase().includes(learning.title.toLowerCase())
        );
        
        if (matchingTool) {
          learningMap[matchingTool.subtitle] = learning;
        }
      });

      setLearnings(learningMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching learnings:', error);
      setLoading(false);
    }
  };

  // Define which reports have sample data available
  const availableSamples = {
    '5S Report': [
      { 
        id: 1, 
        name: 'Production Floor Audit', 
        description: 'Mixed performance across categories',
        data: sampleReport1,
        status: 'available',
        performance: 'mixed'
      },
      { 
        id: 2, 
        name: 'Warehouse Assessment', 
        description: 'High performance, completed audit',
        data: sampleReport2,
        status: 'available',
        performance: 'high'
      },
      { 
        id: 3, 
        name: 'Quality Lab Audit', 
        description: 'Areas needing improvement identified',
        data: sampleReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Lean Assessment Report': [
      {
        id: 4,
        name: 'Corporate Headquarters Assessment',
        description: 'Comprehensive lean maturity assessment with strong leadership',
        data: leanAssessment1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 5,
        name: 'Manufacturing Division Assessment', 
        description: 'Manufacturing operations lean assessment with improvement areas',
        data: leanAssessment2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 6,
        name: 'Regional Office Assessment',
        description: 'Initial lean readiness assessment requiring significant development',
        data: leanAssessment3,
        status: 'available', 
        performance: 'low'
      }
    ],
    'Mistake Proofing Report': [
      {
        id: 7,
        name: 'Assembly Line Station 3 Assessment',
        description: 'Advanced mistake-proofing implementation with low risk profile',
        data: mistakeProofing1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 8,
        name: 'Packaging Department Assessment',
        description: 'Mixed performance with moderate risk levels requiring improvement',
        data: mistakeProofing2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 9,
        name: 'Receiving Dock Area Assessment',
        description: 'High-risk area needing comprehensive mistake-proofing implementation',
        data: mistakeProofing3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Leadership Report': [
      {
        id: 10,
        name: 'Executive Leadership Team Assessment',
        description: 'Exemplary leadership performance with outstanding capabilities',
        data: leadership1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 11,
        name: 'Mid-Level Management Team Assessment',
        description: 'Mixed performance requiring targeted development areas',
        data: leadership2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 12,
        name: 'Emerging Leaders Program Assessment',
        description: 'Initial assessment identifying significant development opportunities',
        data: leadership3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Kaizen Project Report': [
      {
        id: 13,
        name: 'Assembly Line Efficiency Improvement',
        description: 'Exemplary Kaizen execution with outstanding PDCA implementation',
        data: kaizen1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 14,
        name: 'Inventory Management Process',
        description: 'Mixed performance requiring enhanced planning and execution',
        data: kaizen2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 15,
        name: 'Customer Service Process Initial Attempt',
        description: 'First Kaizen attempt needing fundamental methodology training',
        data: kaizen3,
        status: 'available',
        performance: 'low'
      }
    ],
    'A3 Project Report': [
      {
        id: 16,
        name: 'Production Line Cycle Time Reduction',
        description: 'Exemplary A3 problem-solving with 20% cycle time improvement',
        data: a3Report1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 17,
        name: 'Quality Control Process Improvement',
        description: 'Mixed performance A3 with 45% improvement but target gaps',
        data: a3Report2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 18,
        name: 'Office Supply Inventory Management',
        description: 'Basic A3 attempt needing fundamental methodology training',
        data: a3Report3,
        status: 'available',
        performance: 'low'
      }
    ],
    'PDCA Report': [
      {
        id: 19,
        name: 'Equipment Maintenance Process Improvement',
        description: 'Exemplary PDCA implementation with 60% downtime reduction',
        data: pdcaReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 20,
        name: 'Customer Service Response Time Improvement',
        description: 'Mixed performance PDCA with partial target achievement',
        data: pdcaReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 21,
        name: 'Office Space Organization Initial Attempt',
        description: 'Basic PDCA attempt needing methodology training and systematic approach',
        data: pdcaReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Gemba Walk Report': [
      {
        id: 22,
        name: 'Manufacturing Excellence Gemba Walk',
        description: 'Exemplary gemba walk demonstrating mature lean culture and outstanding practices',
        data: gembaWalkReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 23,
        name: 'Operations Assessment Gemba Walk',
        description: 'Mixed performance observation with improvement opportunities identified',
        data: gembaWalkReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 24,
        name: 'Initial Assessment Gemba Walk',
        description: 'Basic gemba walk revealing significant development opportunities',
        data: gembaWalkReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Waste Walk Report': [
      {
        id: 25,
        name: 'Manufacturing Excellence Waste Walk',
        description: 'World-class waste elimination with systematic approach to all waste types',
        data: wasteWalkReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 26,
        name: 'Distribution Center Assessment',
        description: 'Mixed performance with significant waste opportunities identified',
        data: wasteWalkReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 27,
        name: 'Small Manufacturing Initial Assessment',
        description: 'Extensive waste in all categories requiring fundamental lean implementation',
        data: wasteWalkReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Value Stream Mapping Report': [
      {
        id: 28,
        name: 'Customer Order Processing - Current State VSM',
        description: 'Comprehensive value stream analysis with 20% efficiency revealing significant improvement opportunities',
        data: vsmReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 29,
        name: 'Product Development Workflow - Mixed Performance Analysis',
        description: 'Above-average 63% efficiency for product development with targeted improvement areas',
        data: vsmReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 30,
        name: 'Customer Support Ticket Resolution - Critical Issues',
        description: 'Critical 11% efficiency requiring immediate systematic intervention and technology upgrades',
        data: vsmReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    '5 Whys Report': [
      {
        id: 31,
        name: 'Customer Complaint Resolution - Product Quality Defects',
        description: 'Exemplary 5 Whys analysis reaching true organizational root cause with comprehensive corrective actions',
        data: fiveWhysReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 32,
        name: 'Equipment Downtime Analysis - Production Line Delays',
        description: 'Mixed performance analysis with good structure but needing deeper evidence collection and root cause development',
        data: fiveWhysReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 33,
        name: 'Customer Service Response Time Issues',
        description: 'Basic analysis attempt requiring fundamental 5 Whys methodology training and systematic approach',
        data: fiveWhysReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Fishbone Diagram Report': [
      {
        id: 34,
        name: 'Customer Complaint Analysis - Product Quality Defects',
        description: 'Exemplary fishbone analysis with comprehensive 6M investigation and evidence-based cause identification',
        data: fishboneReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 35,
        name: 'Production Efficiency Analysis - Output Variations',
        description: 'Mixed performance fishbone with good structure but needing deeper evidence collection and investigation',
        data: fishboneReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 36,
        name: 'Equipment Breakdown Investigation - Initial Analysis',
        description: 'Basic fishbone attempt requiring fundamental methodology training and systematic investigation approach',
        data: fishboneReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Brainstorming Report': [
      {
        id: 39,
        name: 'Product Innovation Brainstorming Session - Marketing Team',
        description: 'Exemplary brainstorming with 14 innovative ideas spanning technology, sustainability, and customer experience',
        data: brainstormingReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 40,
        name: 'Process Improvement Ideas - Operations Team',
        description: 'Mixed performance brainstorming with 9 operational improvement concepts requiring validation and prioritization',
        data: brainstormingReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 41,
        name: 'Cost Reduction Initiative - Finance Department',
        description: 'Basic brainstorming attempt with limited ideas needing systematic ideation methodology and creative facilitation',
        data: brainstormingReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Histogram Report': [
      {
        id: 42,
        name: 'Part Dimension Variability Analysis - Bearing Housing',
        description: 'Exemplary process capability study with normal distribution analysis and statistical control implementation',
        data: histogramReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 43,
        name: 'Assembly Cycle Time Distribution Analysis - Engine Block Line',
        description: 'Mixed performance analysis with variation reduction opportunities and takt time compliance challenges',
        data: histogramReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 44,
        name: 'Customer Response Time Distribution - Service Call Resolution',
        description: 'Service process analysis requiring SLA improvement and queue optimization for enhanced customer satisfaction',
        data: histogramReport3,
        status: 'available',
        performance: 'mixed'
      }
    ],
    'Pareto Chart Report': [
      {
        id: 45,
        name: 'Customer Complaint Analysis - Product Defects Root Causes',
        description: 'Exemplary Pareto analysis revealing vital few defect categories driving 81.2% of quality issues with $2.3M improvement opportunity',
        data: paretoChartReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 46,
        name: 'Warehouse Inefficiency Analysis - Time Loss Categories',
        description: 'Mixed performance analysis with incomplete data set showing layout and technology improvement opportunities',
        data: paretoChartReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 47,
        name: 'IT Help Desk Tickets - Problem Category Analysis',
        description: 'Poor categorization example with 39.9% "Other" category demonstrating need for proper data collection methodology',
        data: paretoChartReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Run Chart Report': [
      {
        id: 48,
        name: 'Customer Satisfaction Score Trend Analysis - Monthly Performance',
        description: 'Exemplary improvement trend showing 41% satisfaction increase from 3.2 to 4.5+ over 12 months with statistical significance',
        data: runChartReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 49,
        name: 'Production Output Efficiency - Weekly Performance Tracking',
        description: 'Mixed performance with concerning variation patterns requiring systematic process control improvements',
        data: runChartReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 50,
        name: 'Employee Turnover Rate - Monthly Tracking Analysis',
        description: 'Critical upward trend from 12% to 21% turnover with unstable process requiring organizational intervention',
        data: runChartReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Scatter Plot Report': [
      {
        id: 51,
        name: 'Training Hours vs Quality Performance Correlation Analysis',
        description: 'Exemplary correlation analysis demonstrating strong R² = 0.94 relationship between training investment and quality outcomes',
        data: scatterPlotReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 52,
        name: 'Equipment Age vs Maintenance Cost Correlation Analysis',
        description: 'Mixed performance analysis with moderate R² = 0.58 correlation showing maintenance strategy impact on age-cost relationships',
        data: scatterPlotReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 53,
        name: 'Marketing Spend vs Sales Revenue Correlation Analysis',
        description: 'Weak correlation example with R² = 0.12 demonstrating need for comprehensive marketing strategy overhaul and attribution tracking',
        data: scatterPlotReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'DMAIC Report': [
      {
        id: 54,
        name: 'Customer Order Processing Defect Reduction - DMAIC Project',
        description: 'Exemplary Six Sigma DMAIC execution achieving 67% defect reduction with Black Belt methodology and 4.8 sigma performance',
        data: dmaicReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 55,
        name: 'Inventory Turnover Improvement - DMAIC Project',
        description: 'Mixed performance Green Belt project with 15% improvement but lacking statistical rigor and comprehensive methodology',
        data: dmaicReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 56,
        name: 'Office Paper Usage Reduction - DMAIC Attempt',
        description: 'Basic DMAIC attempt requiring fundamental methodology training and systematic approach development',
        data: dmaicReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Standard Work Report': [
      {
        id: 57,
        name: 'Assembly Line Standard Work Excellence - Station 12 Cell Operations',
        description: 'Exemplary standard work implementation with comprehensive documentation, training, and continuous improvement systems',
        data: standardWorkReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 58,
        name: 'Packaging Department Standard Work Development - Mixed Performance Assessment',
        description: 'Mixed performance standardization effort requiring enhanced documentation, training, and control systems',
        data: standardWorkReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 59,
        name: 'Customer Service Standard Work Initiative - Initial Assessment',
        description: 'Basic standard work attempt requiring fundamental methodology training and systematic development',
        data: standardWorkReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Impact Map Report': [
      {
        id: 60,
        name: 'Digital Transformation Initiative - Strategic Impact Mapping Excellence',
        description: 'Exemplary strategic impact mapping with quantified business value across 8 digital transformation initiatives',
        data: impactMapReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 61,
        name: 'Operational Improvement Initiative - Mixed Impact Analysis Assessment',
        description: 'Mixed performance impact analysis with partial implementation and integration challenges',
        data: impactMapReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 62,
        name: 'Basic Process Improvement Attempt - Initial Impact Assessment',
        description: 'Basic impact assessment requiring fundamental methodology training and systematic approach development',
        data: impactMapReport3,
        status: 'available',
        performance: 'low'
      }
    ],
    'Stakeholder Analysis Report': [
      {
        id: 63,
        name: 'Digital Transformation Program - Comprehensive Stakeholder Analysis Excellence',
        description: 'Exemplary stakeholder management with comprehensive mapping and strategic engagement across all organizational levels',
        data: stakeholderAnalysisReport1,
        status: 'available',
        performance: 'high'
      },
      {
        id: 64,
        name: 'Process Improvement Initiative - Mixed Stakeholder Engagement Assessment',
        description: 'Mixed stakeholder engagement with moderate support and communication challenges requiring enhancement',
        data: stakeholderAnalysisReport2,
        status: 'available',
        performance: 'mixed'
      },
      {
        id: 65,
        name: 'Basic Office Reorganization - Initial Stakeholder Identification Attempt',
        description: 'Basic stakeholder identification requiring systematic analysis training and comprehensive engagement planning',
        data: stakeholderAnalysisReport3,
        status: 'available',
        performance: 'low'
      }
    ]
  };

  // Get performance badge color
  const getPerformanceBadge = (performance) => {
    switch (performance) {
      case 'high': return { bg: 'success', text: 'High Performance' };
      case 'mixed': return { bg: 'warning', text: 'Mixed Performance' };
      case 'low': return { bg: 'danger', text: 'Needs Improvement' };
      default: return { bg: 'secondary', text: 'Unknown' };
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available': return { bg: 'success', text: 'Available' };
      case 'pending': return { bg: 'warning', text: 'Pending' };
      case 'in-progress': return { bg: 'info', text: 'In Progress' };
      default: return { bg: 'secondary', text: 'Unknown' };
    }
  };

  // Handle tab change and update URL
  const handleTabChange = (selectedTab) => {
    setActiveTab(selectedTab);
    setSearchParams({ tab: selectedTab });
  };

  // Group tools by type (exclude the first VibeStack PRO entry)
  const leanTools = toolsData.filter(tool => tool.type === 'Lean Tools' && tool.id !== 0);
  const qualityTools = toolsData.filter(tool => tool.type === 'Quality');

  const renderReportCard = (tool) => {
    const samples = availableSamples[tool.subtitle] || [];
    const hasData = samples.length > 0;
    const learning = learnings[tool.subtitle];
    const hasLearning = !!learning;
    const isOrgLearning = learning?.organizationID === activeOrganization?.id;
    const iconSource = iconMappings[tool.subtitle] || LFlogo;

    return (
      <Col md={6} lg={4} key={tool.id} className="mb-4">
        <Card className="h-100" style={{ border: '2px solid #00897b', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 137, 123, 0.1)' }}>
          <Card.Header className="d-flex justify-content-between align-items-center" style={{ backgroundColor: '#f0f8f6', borderBottom: '1px solid #00897b' }}>
            <div className="d-flex align-items-center">
              <div 
                style={{ 
                  width: '50px', 
                  height: '50px', 
                  backgroundColor: '#00897b',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  padding: '8px'
                }}
              >
                <img 
                  src={iconSource} 
                  alt={tool.subtitle}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    filter: 'brightness(0) invert(1)'
                  }}
                />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">{tool.name}</h5>
                <small className="text-muted">{tool.subtitle}</small>
              </div>
            </div>
            <div className="d-flex flex-column align-items-end">
              <Badge bg={hasData ? 'success' : 'secondary'} className="mb-1">
                {hasData ? `${samples.length} samples` : 'Coming Soon'}
              </Badge>
              {hasLearning && (
                <Badge bg={isOrgLearning ? 'primary' : 'info'} className="small">
                  {isOrgLearning ? 'Org Learning' : 'Global Learning'}
                </Badge>
              )}
            </div>
          </Card.Header>
          
          <Card.Body>
            {hasData ? (
              <div className="mb-3">
                {samples.map((sample, index) => {
                  const perfBadge = getPerformanceBadge(sample.performance);
                  const statusBadge = getStatusBadge(sample.status);
                  
                  return (
                    <div key={sample.id} className="mb-2 p-2 border rounded">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <strong className="small">{sample.name}</strong>
                        <div>
                          <Badge bg={perfBadge.bg} className="me-1 small">
                            {perfBadge.text}
                          </Badge>
                        </div>
                      </div>
                      <p className="small text-muted mb-2">{sample.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg={statusBadge.bg} className="small">
                          {statusBadge.text}
                        </Badge>
                        <small className="text-muted">
                          {sample.data?.categories?.length || sample.data?.chartData?.length || 0} {sample.data?.categories ? 'categories' : 'data points'}
                          {sample.data?.aiAnalysis && (
                            <Badge bg="info" size="sm" className="ms-2">
                              <i className="fas fa-robot me-1"></i>
                              AI
                            </Badge>
                          )}
                        </small>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-3">
                <i className="fas fa-clock text-muted fa-2x mb-2"></i>
                <p className="text-muted small mb-0">Sample data coming soon</p>
              </div>
            )}
          </Card.Body>
          
          <Card.Footer className="border-top-0 bg-transparent">
            <div className="d-grid gap-2">
              {hasData && (
                <Button 
                  as={Link} 
                  to={`/preview/samples?type=${encodeURIComponent(tool.subtitle)}`}
                  variant="primary" 
                  size="sm"
                >
                  <i className="fas fa-eye me-1"></i>
                  Preview Samples
                </Button>
              )}
              
              {hasLearning && (
                <Button 
                  onClick={() => {
                    setSelectedLearning(learning);
                    setShowStudyMaterialWarning(true);
                  }}
                  variant="success" 
                  size="sm"
                >
                  <i className="fas fa-book me-1"></i>
                  Study Material
                </Button>
              )}
              
              {tool.tutorialLink && (
                <Button 
                  href={tool.tutorialLink} 
                  target="_blank" 
                  variant="outline-info" 
                  size="sm"
                >
                  <i className="fas fa-play me-1"></i>
                  Video Tutorial
                </Button>
              )}
              
              {!hasData && !hasLearning && !tool.tutorialLink && (
                <Button variant="outline-secondary" size="sm" disabled>
                  <i className="fas fa-hourglass-half me-1"></i>
                  In Development
                </Button>
              )}
            </div>
          </Card.Footer>
        </Card>
      </Col>
    );
  };


  return (
    <Container fluid className="py-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">
                    <i className="fas fa-list-alt me-2"></i>
                    VibeStack™ Pro Sample Reports
                  </h4>
                  <small>Browse sample data, learning materials, and tutorials for all lean methodology tools</small>
                </div>
                <Button 
                  as={Link} 
                  to="/reports" 
                  variant="outline-light" 
                  size="sm"
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back to Your Reports
                </Button>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      {/* Disclaimer Message */}
      <Row className="mb-4">
        <Col>
          <Alert variant="info" className="mb-0">
            <div className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1" style={{ fontSize: '1.1rem' }}></i>
              <div>
                <strong>Important Notice:</strong> These are AI-generated preview reports. The final exported PDF may appear slightly different in layout. The content shown here is primarily for display purposes—text and formatting will be properly aligned upon PDF export.
              </div>
            </div>
          </Alert>
        </Col>
      </Row>

      {/* Report Tabs */}
      <Row>
        <Col>
          <Card>
            <Card.Body className="p-0">
              <Tabs 
                activeKey={activeTab} 
                onSelect={handleTabChange}
                className="border-bottom"
                fill
              >
                <Tab 
                  eventKey="lean-tools" 
                  title={
                    <span>
                      <i className="fas fa-tools me-2"></i>
                      Lean Tools ({leanTools.length})
                    </span>
                  }
                >
                  <div className="p-4">
                    <Row>
                      {leanTools.map(renderReportCard)}
                    </Row>
                  </div>
                </Tab>
                
                <Tab 
                  eventKey="quality-tools" 
                  title={
                    <span>
                      <i className="fas fa-chart-line me-2"></i>
                      Quality Tools ({qualityTools.length})
                    </span>
                  }
                >
                  <div className="p-4">
                    <Row>
                      {qualityTools.map(renderReportCard)}
                    </Row>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Footer Info */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Body>
              <h6>About Sample Reports</h6>
              <Row>
                <Col md={4}>
                  <div className="mb-3">
                    <Badge bg="success" className="me-2">High Performance</Badge>
                    <small>Showcase best practices and optimal results</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-3">
                    <Badge bg="warning" className="me-2">Mixed Performance</Badge>
                    <small>Typical real-world assessments with varied results</small>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-3">
                    <Badge bg="danger" className="me-2">Needs Improvement</Badge>
                    <small>Areas requiring attention and development</small>
                  </div>
                </Col>
              </Row>
              <hr />
              <p className="small text-muted mb-0">
                Each tool includes 3 sample reports representing different performance scenarios. 
                Use these samples to understand report structures, test layouts, and validate the PDF generation system 
                before creating your own data.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Study Material Warning Modal */}
      <Modal 
        show={showStudyMaterialWarning} 
        onHide={() => setShowStudyMaterialWarning(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
            Important Notice
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            <i className="fas fa-mobile-alt me-2"></i>
            <strong>This page is intended for web users only.</strong>
          </Alert>
          <p>
            Study materials require user authentication to access. If you're trying to view this from a mobile device, you will be redirected to the login page.
          </p>
          <div className="mb-3">
            <strong>Recommended Options:</strong>
            <ul className="mt-2">
              <li>Access study materials from a desktop or laptop computer where you're already logged in</li>
              <li>Use the <strong>VibeStack™ Pro mobile app</strong> to access Learnings directly from your mobile device</li>
            </ul>
          </div>
          <Alert variant="info" className="mb-0">
            <i className="fas fa-mobile me-2"></i>
            <strong>Mobile Users:</strong> Download the VibeStack™ Pro app from your app store for seamless access to all study materials and learnings.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowStudyMaterialWarning(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowStudyMaterialWarning(false);
              if (selectedLearning) {
                sessionStorage.setItem('learning-navigation', 'true');
                navigate(`/learning/${selectedLearning.id}/view`);
              }
            }}
          >
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default SampleListPage;