import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Nav, Badge, Button } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';
import AssessmentReport from '../reports_pdf/AssessmentReport';
import iconMappings from '../../utils/iconMappings';
import LFlogo from '../../assets/VibeStack_pro.png';

// Import the sample JSON data files directly
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

// Import all PDF report components
import ProcessAnalysisReport from '../reports_pdf/ProcessAnalysisReport';
import ObservationReport from '../reports_pdf/ObservationReport';
import ProblemSolvingReport from '../reports_pdf/ProblemSolvingReport';
import LeadershipReport from '../reports_pdf/LeadershipReport';
import ReportVsmPdf from '../public/ReportVsmPdf';
import ReportDataChartPdf from '../public/ReportDataChartPdf';
import ReportChartPdf from '../public/ReportChartPdf';

const SampleDataPreview = () => {
  const [searchParams] = useSearchParams();
  const [activeReport, setActiveReport] = useState(0);
  const [reportData, setReportData] = useState(null);
  
  // Get the report type filter from URL parameters
  const typeFilter = searchParams.get('type');
  
  // Determine which tab this report type belongs to
  const isQualityTool = (reportType) => {
    const qualityToolTypes = [
      '5 Whys Report',
      'Brainstorming Report', 
      'Fishbone Diagram Report',
      'Histogram Report',
      'Impact Map Report',
      'Pareto Chart Report',
      'Run Chart Report',
      'Scatter Plot Report',
      'Stakeholder Analysis Report'
    ];
    return qualityToolTypes.includes(reportType);
  };
  
  // Determine the correct back URL with tab parameter
  const getBackUrl = () => {
    if (typeFilter && isQualityTool(typeFilter)) {
      return '/preview/list?tab=quality-tools';
    }
    return '/preview/list?tab=lean-tools';
  };

  // All available sample reports
  const allSampleReports = [
    {
      id: 0,
      name: 'Production Floor Audit',
      file: 'sample_data/5s_report_1.json',
      data: sampleReport1,
      description: 'Main production floor 5S assessment with mixed scores',
      type: '5S Report'
    },
    {
      id: 1,
      name: 'Warehouse Assessment',
      file: 'sample_data/5s_report_2.json',
      data: sampleReport2,
      description: 'Completed warehouse section audit with high performance',
      type: '5S Report'
    },
    {
      id: 2,
      name: 'Quality Lab Audit',
      file: 'sample_data/5s_report_3.json',
      data: sampleReport3,
      description: 'Quality control lab assessment needing improvement',
      type: '5S Report'
    },
    {
      id: 3,
      name: 'Corporate Headquarters Assessment',
      file: 'sample_data/lean_assessment_report_1.json',
      data: leanAssessment1,
      description: 'Comprehensive lean maturity assessment with strong leadership',
      type: 'Lean Assessment Report'
    },
    {
      id: 4,
      name: 'Manufacturing Division Assessment',
      file: 'sample_data/lean_assessment_report_2.json',
      data: leanAssessment2,
      description: 'Manufacturing operations lean assessment with improvement areas',
      type: 'Lean Assessment Report'
    },
    {
      id: 5,
      name: 'Regional Office Assessment',
      file: 'sample_data/lean_assessment_report_3.json',
      data: leanAssessment3,
      description: 'Initial lean readiness assessment requiring significant development',
      type: 'Lean Assessment Report'
    },
    {
      id: 6,
      name: 'Assembly Line Station 3 Assessment',
      file: 'sample_data/mistake_proofing_report_1.json',
      data: mistakeProofing1,
      description: 'Advanced mistake-proofing implementation with low risk profile',
      type: 'Mistake Proofing Report'
    },
    {
      id: 7,
      name: 'Packaging Department Assessment',
      file: 'sample_data/mistake_proofing_report_2.json',
      data: mistakeProofing2,
      description: 'Mixed performance with moderate risk levels requiring improvement',
      type: 'Mistake Proofing Report'
    },
    {
      id: 8,
      name: 'Receiving Dock Area Assessment',
      file: 'sample_data/mistake_proofing_report_3.json',
      data: mistakeProofing3,
      description: 'High-risk area needing comprehensive mistake-proofing implementation',
      type: 'Mistake Proofing Report'
    },
    {
      id: 9,
      name: 'Executive Leadership Team Assessment',
      file: 'sample_data/leadership_report_1.json',
      data: leadership1,
      description: 'Exemplary leadership performance with outstanding capabilities',
      type: 'Leadership Report'
    },
    {
      id: 10,
      name: 'Mid-Level Management Team Assessment',
      file: 'sample_data/leadership_report_2.json',
      data: leadership2,
      description: 'Mixed performance requiring targeted development areas',
      type: 'Leadership Report'
    },
    {
      id: 11,
      name: 'Emerging Leaders Program Assessment',
      file: 'sample_data/leadership_report_3.json',
      data: leadership3,
      description: 'Initial assessment identifying significant development opportunities',
      type: 'Leadership Report'
    },
    {
      id: 12,
      name: 'Assembly Line Efficiency Improvement',
      file: 'sample_data/kaizen_report_1.json',
      data: kaizen1,
      description: 'Exemplary Kaizen execution with outstanding PDCA implementation',
      type: 'Kaizen Project Report'
    },
    {
      id: 13,
      name: 'Inventory Management Process',
      file: 'sample_data/kaizen_report_2.json',
      data: kaizen2,
      description: 'Mixed performance requiring enhanced planning and execution',
      type: 'Kaizen Project Report'
    },
    {
      id: 14,
      name: 'Customer Service Process Initial Attempt',
      file: 'sample_data/kaizen_report_3.json',
      data: kaizen3,
      description: 'First Kaizen attempt needing fundamental methodology training',
      type: 'Kaizen Project Report'
    },
    {
      id: 15,
      name: 'Production Line Cycle Time Reduction',
      file: 'sample_data/a3_report_1.json',
      data: a3Report1,
      description: 'Exemplary A3 problem-solving with 20% cycle time improvement',
      type: 'A3 Project Report'
    },
    {
      id: 16,
      name: 'Quality Control Process Improvement',
      file: 'sample_data/a3_report_2.json',
      data: a3Report2,
      description: 'Mixed performance A3 with 45% improvement but target gaps',
      type: 'A3 Project Report'
    },
    {
      id: 17,
      name: 'Office Supply Inventory Management',
      file: 'sample_data/a3_report_3.json',
      data: a3Report3,
      description: 'Basic A3 attempt needing fundamental methodology training',
      type: 'A3 Project Report'
    },
    {
      id: 18,
      name: 'Equipment Maintenance Process Improvement',
      file: 'sample_data/pdca_report_1.json',
      data: pdcaReport1,
      description: 'Exemplary PDCA implementation with 60% downtime reduction',
      type: 'PDCA Report'
    },
    {
      id: 19,
      name: 'Customer Service Response Time Improvement',
      file: 'sample_data/pdca_report_2.json',
      data: pdcaReport2,
      description: 'Mixed performance PDCA with partial target achievement',
      type: 'PDCA Report'
    },
    {
      id: 20,
      name: 'Office Space Organization Initial Attempt',
      file: 'sample_data/pdca_report_3.json',
      data: pdcaReport3,
      description: 'Basic PDCA attempt needing methodology training and systematic approach',
      type: 'PDCA Report'
    },
    {
      id: 21,
      name: 'Manufacturing Excellence Gemba Walk',
      file: 'sample_data/gemba_walk_report_1.json',
      data: gembaWalkReport1,
      description: 'Exemplary gemba walk demonstrating mature lean culture and outstanding practices',
      type: 'Gemba Walk Report'
    },
    {
      id: 22,
      name: 'Operations Assessment Gemba Walk',
      file: 'sample_data/gemba_walk_report_2.json',
      data: gembaWalkReport2,
      description: 'Mixed performance observation with improvement opportunities identified',
      type: 'Gemba Walk Report'
    },
    {
      id: 23,
      name: 'Initial Assessment Gemba Walk',
      file: 'sample_data/gemba_walk_report_3.json',
      data: gembaWalkReport3,
      description: 'Basic gemba walk revealing significant development opportunities',
      type: 'Gemba Walk Report'
    },
    {
      id: 24,
      name: 'Manufacturing Excellence Waste Walk',
      file: 'sample_data/waste_walk_report_1.json',
      data: wasteWalkReport1,
      description: 'World-class waste elimination with systematic approach to all waste types',
      type: 'Waste Walk Report'
    },
    {
      id: 25,
      name: 'Distribution Center Assessment',
      file: 'sample_data/waste_walk_report_2.json',
      data: wasteWalkReport2,
      description: 'Mixed performance with significant waste opportunities identified',
      type: 'Waste Walk Report'
    },
    {
      id: 26,
      name: 'Small Manufacturing Initial Assessment',
      file: 'sample_data/waste_walk_report_3.json',
      data: wasteWalkReport3,
      description: 'Extensive waste in all categories requiring fundamental lean implementation',
      type: 'Waste Walk Report'
    },
    {
      id: 27,
      name: 'Customer Order Processing - Current State VSM',
      file: 'sample_data/vsm_report_1.json',
      data: vsmReport1,
      description: 'Comprehensive value stream analysis with 20% efficiency revealing significant improvement opportunities',
      type: 'Value Stream Mapping Report'
    },
    {
      id: 28,
      name: 'Product Development Workflow - Mixed Performance Analysis',
      file: 'sample_data/vsm_report_2.json',
      data: vsmReport2,
      description: 'Above-average 63% efficiency for product development with targeted improvement areas',
      type: 'Value Stream Mapping Report'
    },
    {
      id: 29,
      name: 'Customer Support Ticket Resolution - Critical Issues',
      file: 'sample_data/vsm_report_3.json',
      data: vsmReport3,
      description: 'Critical 11% efficiency requiring immediate systematic intervention and technology upgrades',
      type: 'Value Stream Mapping Report'
    },
    {
      id: 30,
      name: 'Customer Complaint Resolution - Product Quality Defects',
      file: 'sample_data/5whys_report_1.json',
      data: fiveWhysReport1,
      description: 'Exemplary 5 Whys analysis reaching true organizational root cause with comprehensive corrective actions',
      type: '5 Whys Report'
    },
    {
      id: 31,
      name: 'Equipment Downtime Analysis - Production Line Delays',
      file: 'sample_data/5whys_report_2.json',
      data: fiveWhysReport2,
      description: 'Mixed performance analysis with good structure but needing deeper evidence collection and root cause development',
      type: '5 Whys Report'
    },
    {
      id: 32,
      name: 'Customer Service Response Time Issues',
      file: 'sample_data/5whys_report_3.json',
      data: fiveWhysReport3,
      description: 'Basic analysis attempt requiring fundamental 5 Whys methodology training and systematic approach',
      type: '5 Whys Report'
    },
    {
      id: 33,
      name: 'Customer Complaint Analysis - Product Quality Defects',
      file: 'sample_data/fishbone_report_1.json',
      data: fishboneReport1,
      description: 'Exemplary fishbone analysis with comprehensive 6M investigation and evidence-based cause identification',
      type: 'Fishbone Diagram Report'
    },
    {
      id: 34,
      name: 'Production Efficiency Analysis - Output Variations',
      file: 'sample_data/fishbone_report_2.json',
      data: fishboneReport2,
      description: 'Mixed performance fishbone with good structure but needing deeper evidence collection and investigation',
      type: 'Fishbone Diagram Report'
    },
    {
      id: 35,
      name: 'Equipment Breakdown Investigation - Initial Analysis',
      file: 'sample_data/fishbone_report_3.json',
      data: fishboneReport3,
      description: 'Basic fishbone attempt requiring fundamental methodology training and systematic investigation approach',
      type: 'Fishbone Diagram Report'
    },
    {
      id: 36,
      name: 'Product Innovation Brainstorming Session - Marketing Team',
      file: 'sample_data/brainstorming_report_1.json',
      data: brainstormingReport1,
      description: 'Exemplary brainstorming with 14 innovative ideas spanning technology, sustainability, and customer experience',
      type: 'Brainstorming Report'
    },
    {
      id: 37,
      name: 'Process Improvement Ideas - Operations Team',
      file: 'sample_data/brainstorming_report_2.json',
      data: brainstormingReport2,
      description: 'Mixed performance brainstorming with 9 operational improvement concepts requiring validation and prioritization',
      type: 'Brainstorming Report'
    },
    {
      id: 38,
      name: 'Cost Reduction Initiative - Finance Department',
      file: 'sample_data/brainstorming_report_3.json',
      data: brainstormingReport3,
      description: 'Basic brainstorming attempt with limited ideas needing systematic ideation methodology and creative facilitation',
      type: 'Brainstorming Report'
    },
    {
      id: 39,
      name: 'Part Dimension Variability Analysis - Bearing Housing',
      file: 'sample_data/histogram_report_1.json',
      data: histogramReport1,
      description: 'Exemplary process capability study with normal distribution analysis and statistical control implementation',
      type: 'Histogram Report'
    },
    {
      id: 40,
      name: 'Assembly Cycle Time Distribution Analysis - Engine Block Line',
      file: 'sample_data/histogram_report_2.json',
      data: histogramReport2,
      description: 'Mixed performance analysis with variation reduction opportunities and takt time compliance challenges',
      type: 'Histogram Report'
    },
    {
      id: 41,
      name: 'Product Weight Variation Analysis - Automotive Components',
      file: 'sample_data/histogram_report_3.json',
      data: histogramReport3,
      description: 'Component weight distribution analysis showing normal variation pattern with process control opportunities',
      type: 'Histogram Report'
    },
    {
      id: 42,
      name: 'Customer Complaint Analysis - Product Defects Root Causes',
      file: 'sample_data/pareto_chart_report_1.json',
      data: paretoChartReport1,
      description: 'Exemplary Pareto analysis revealing vital few defect categories driving 81.2% of quality issues with $2.3M improvement opportunity',
      type: 'Pareto Chart Report'
    },
    {
      id: 43,
      name: 'Warehouse Inefficiency Analysis - Time Loss Categories',
      file: 'sample_data/pareto_chart_report_2.json',
      data: paretoChartReport2,
      description: 'Mixed performance analysis with incomplete data set showing layout and technology improvement opportunities',
      type: 'Pareto Chart Report'
    },
    {
      id: 44,
      name: 'IT Help Desk Tickets - Problem Category Analysis',
      file: 'sample_data/pareto_chart_report_3.json',
      data: paretoChartReport3,
      description: 'Poor categorization example with 39.9% "Other" category demonstrating need for proper data collection methodology',
      type: 'Pareto Chart Report'
    },
    {
      id: 45,
      name: 'Customer Satisfaction Score Trend Analysis - Monthly Performance',
      file: 'sample_data/run_chart_report_1.json',
      data: runChartReport1,
      description: 'Exemplary improvement trend showing 41% satisfaction increase from 3.2 to 4.5+ over 12 months with statistical significance',
      type: 'Run Chart Report'
    },
    {
      id: 46,
      name: 'Production Output Efficiency - Weekly Performance Tracking',
      file: 'sample_data/run_chart_report_2.json',
      data: runChartReport2,
      description: 'Mixed performance with concerning variation patterns requiring systematic process control improvements',
      type: 'Run Chart Report'
    },
    {
      id: 47,
      name: 'Employee Turnover Rate - Monthly Tracking Analysis',
      file: 'sample_data/run_chart_report_3.json',
      data: runChartReport3,
      description: 'Critical upward trend from 12% to 21% turnover with unstable process requiring organizational intervention',
      type: 'Run Chart Report'
    },
    {
      id: 48,
      name: 'Training Hours vs Quality Performance Correlation Analysis',
      file: 'sample_data/scatter_plot_report_1.json',
      data: scatterPlotReport1,
      description: 'Exemplary correlation analysis demonstrating strong R² = 0.94 relationship between training investment and quality outcomes',
      type: 'Scatter Plot Report'
    },
    {
      id: 49,
      name: 'Equipment Age vs Maintenance Cost Correlation Analysis',
      file: 'sample_data/scatter_plot_report_2.json',
      data: scatterPlotReport2,
      description: 'Mixed performance analysis with moderate R² = 0.58 correlation showing maintenance strategy impact on age-cost relationships',
      type: 'Scatter Plot Report'
    },
    {
      id: 50,
      name: 'Marketing Spend vs Sales Revenue Correlation Analysis',
      file: 'sample_data/scatter_plot_report_3.json',
      data: scatterPlotReport3,
      description: 'Weak correlation example with R² = 0.12 demonstrating need for comprehensive marketing strategy overhaul and attribution tracking',
      type: 'Scatter Plot Report'
    },
    {
      id: 51,
      name: 'Customer Order Processing Defect Reduction - DMAIC Project',
      file: 'sample_data/dmaic_report_1.json',
      data: dmaicReport1,
      description: 'Exemplary Six Sigma DMAIC execution achieving 67% defect reduction with Black Belt methodology and 4.8 sigma performance',
      type: 'DMAIC Report'
    },
    {
      id: 52,
      name: 'Inventory Turnover Improvement - DMAIC Project',
      file: 'sample_data/dmaic_report_2.json',
      data: dmaicReport2,
      description: 'Mixed performance Green Belt project with 15% improvement but lacking statistical rigor and comprehensive methodology',
      type: 'DMAIC Report'
    },
    {
      id: 53,
      name: 'Office Paper Usage Reduction - DMAIC Attempt',
      file: 'sample_data/dmaic_report_3.json',
      data: dmaicReport3,
      description: 'Basic DMAIC attempt requiring fundamental methodology training and systematic approach development',
      type: 'DMAIC Report'
    },
    {
      id: 54,
      name: 'Assembly Line Standard Work Excellence - Station 12 Cell Operations',
      file: 'sample_data/standard_work_report_1.json',
      data: standardWorkReport1,
      description: 'Exemplary standard work implementation with comprehensive documentation, training, and continuous improvement systems',
      type: 'Standard Work Report'
    },
    {
      id: 55,
      name: 'Packaging Department Standard Work Development - Mixed Performance Assessment',
      file: 'sample_data/standard_work_report_2.json',
      data: standardWorkReport2,
      description: 'Mixed performance standardization effort requiring enhanced documentation, training, and control systems',
      type: 'Standard Work Report'
    },
    {
      id: 56,
      name: 'Customer Service Standard Work Initiative - Initial Assessment',
      file: 'sample_data/standard_work_report_3.json',
      data: standardWorkReport3,
      description: 'Basic standard work attempt requiring fundamental methodology training and systematic development',
      type: 'Standard Work Report'
    },
    {
      id: 57,
      name: 'Digital Transformation Initiative - Strategic Impact Mapping Excellence',
      file: 'sample_data/impact_map_report_1.json',
      data: impactMapReport1,
      description: 'Exemplary strategic impact mapping with quantified business value across 8 digital transformation initiatives',
      type: 'Impact Map Report'
    },
    {
      id: 58,
      name: 'Operational Improvement Initiative - Mixed Impact Analysis Assessment',
      file: 'sample_data/impact_map_report_2.json',
      data: impactMapReport2,
      description: 'Mixed performance impact analysis with partial implementation and integration challenges',
      type: 'Impact Map Report'
    },
    {
      id: 59,
      name: 'Basic Process Improvement Attempt - Initial Impact Assessment',
      file: 'sample_data/impact_map_report_3.json',
      data: impactMapReport3,
      description: 'Basic impact assessment requiring fundamental methodology training and systematic approach development',
      type: 'Impact Map Report'
    },
    {
      id: 60,
      name: 'Digital Transformation Program - Comprehensive Stakeholder Analysis Excellence',
      file: 'sample_data/stakeholder_analysis_report_1.json',
      data: stakeholderAnalysisReport1,
      description: 'Exemplary stakeholder management with comprehensive mapping and strategic engagement across all organizational levels',
      type: 'Stakeholder Analysis Report'
    },
    {
      id: 61,
      name: 'Process Improvement Initiative - Mixed Stakeholder Engagement Assessment',
      file: 'sample_data/stakeholder_analysis_report_2.json',
      data: stakeholderAnalysisReport2,
      description: 'Mixed stakeholder engagement with moderate support and communication challenges requiring enhancement',
      type: 'Stakeholder Analysis Report'
    },
    {
      id: 62,
      name: 'Basic Office Reorganization - Initial Stakeholder Identification Attempt',
      file: 'sample_data/stakeholder_analysis_report_3.json',
      data: stakeholderAnalysisReport3,
      description: 'Basic stakeholder identification requiring systematic analysis training and comprehensive engagement planning',
      type: 'Stakeholder Analysis Report'
    }
  ];

  // Filter reports based on the type parameter
  const sampleReports = useMemo(() => {
    if (!typeFilter) {
      return allSampleReports;
    }
    
    return allSampleReports.filter(report => report.type === typeFilter);
  }, [typeFilter]);

  // Convert JSON data to GraphQL format expected by PDF components
  const convertToGraphQLFormat = (jsonData) => {
    const mockUserId = "preview-user";
    const mockOrgId = "preview-org";
    
    // Handle VSM reports differently
    if (jsonData.report.type === 'Value Stream Mapping Report') {
      return {
        id: `preview-${Date.now()}`,
        type: jsonData.report.type,
        name: jsonData.report.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completed: jsonData.report.completed,
        ownerEmail: "preview@example.com",
        organizationID: mockOrgId,
        projectID: null,
        assignedMembers: jsonData.report.assignedMembers || [],
        vsmData: jsonData.vsmData || {},
        actionItemsData: jsonData.actionItems || []
      };
    }
    
    // Handle chart-based reports and process analysis reports (Fishbone, Brainstorming, Histogram, DMAIC, Standard Work, etc.)
    if (jsonData.report.type === 'Fishbone Diagram Report' || 
        jsonData.report.type === 'Brainstorming Report' ||
        jsonData.report.type === 'Impact Map Report' ||
        jsonData.report.type === 'Stakeholder Analysis Report' ||
        jsonData.report.type === 'Histogram Report' ||
        jsonData.report.type === 'Pareto Chart Report' ||
        jsonData.report.type === 'Scatter Plot Report' ||
        jsonData.report.type === 'Run Chart Report' ||
        jsonData.report.type === 'DMAIC Report' ||
        jsonData.report.type === 'A3 Project Report' ||
        jsonData.report.type === 'PDCA Report' ||
        jsonData.report.type === 'Standard Work Report') {
      return {
        id: `preview-${Date.now()}`,
        type: jsonData.report.type,
        name: jsonData.report.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completed: jsonData.report.completed,
        ownerEmail: "preview@example.com",
        organizationID: mockOrgId,
        projectID: null,
        assignedMembers: jsonData.report.assignedMembers || [],
        bones: jsonData.report.bones || null,
        chartData: jsonData.chartData || [],
        // Run Chart specific fields
        target: jsonData.report.target || null,
        xaxis: jsonData.report.xaxis || null,
        yaxis: jsonData.report.yaxis || null,
        trend: jsonData.report.trend || null,
        Categories: {
          items: (jsonData.categories || []).map(category => ({
            id: `category-${category.orderIndex}`,
            name: category.name,
            orderIndex: category.orderIndex,
            assignees: category.assignees || [],
            description: category.description || '',
            attachments: category.attachments || [],
            Statements: {
              items: category.statements.map((statement, index) => ({
                id: `statement-${category.orderIndex}-${index}`,
                name: statement.name,
                value: statement.value,
                default: false,
                orderIndex: index,
                categoriesID: `category-${category.orderIndex}`,
                categoryName: category.name,
                owner: mockUserId
              }))
            }
          }))
        },
        ActionItems: { 
          items: (jsonData.actionItems || []).map((actionItem, index) => ({
            id: actionItem.id,
            title: actionItem.title,
            description: actionItem.description,
            duedate: actionItem.duedate || actionItem.dueDate,
            status: actionItem.status,
            assignees: actionItem.assignees || (actionItem.assignee ? [actionItem.assignee] : []),
            attachments: actionItem.attachments || [],
            orderIndex: actionItem.orderIndex || index,
            reportID: `preview-${Date.now()}`,
            category: actionItem.category || '',
            priority: actionItem.priority || 'Medium'
          }))
        },
        highlightsData: jsonData.highlightsData || [],
        actionItemsData: (jsonData.actionItems || []).map((actionItem, index) => ({
          ...actionItem,
          duedate: actionItem.duedate || actionItem.dueDate,
          assignees: actionItem.assignees || (actionItem.assignee ? [actionItem.assignee] : []),
          reportID: `preview-${Date.now()}`,
        })),
        // Standard Work specific fields
        taktTime: jsonData.taktTime || null,
        timeUnit: jsonData.timeUnit || 'seconds'
      };
    }
    
    // Handle other report types
    return {
      id: `preview-${Date.now()}`,
      type: jsonData.report.type,
      name: jsonData.report.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: jsonData.report.completed,
      ownerEmail: "preview@example.com",
      organizationID: mockOrgId,
      projectID: null,
      assignedMembers: jsonData.report.assignedMembers || [],
      Categories: {
        items: (jsonData.categories || []).map(category => ({
          id: `category-${category.orderIndex}`,
          name: category.name,
          orderIndex: category.orderIndex,
          assignees: category.assignees || [],
          description: category.description || '',
          attachments: category.attachments || [],
          Statements: {
            items: category.statements.map((statement, index) => ({
              id: `statement-${category.orderIndex}-${index}`,
              name: statement.name,
              value: statement.value,
              default: false,
              orderIndex: index,
              categoriesID: `category-${category.orderIndex}`,
              categoryName: category.name,
              owner: mockUserId
            }))
          }
        }))
      },
      ActionItems: { 
        items: (jsonData.actionItems || []).map((actionItem, index) => ({
          id: actionItem.id,
          title: actionItem.title,
          description: actionItem.description,
          duedate: actionItem.duedate,
          status: actionItem.status,
          assignees: actionItem.assignees || [],
          attachments: actionItem.attachments || [],
          orderIndex: actionItem.orderIndex || index,
          reportID: `preview-${Date.now()}`,
          category: actionItem.category || '',
          priority: actionItem.priority || 'Medium'
        }))
      },
      highlightsData: jsonData.highlightsData || [],
      actionItemsData: jsonData.actionItems || []
    };
  };

  // Calculate chart data from categories
  const chartData = useMemo(() => {
    if (!reportData || !reportData.Categories) return [];
    
    return reportData.Categories.items.map(category => {
      const statements = category.Statements.items;
      const nonZeroValues = statements.filter(s => s.value > 0);
      const avgValue = nonZeroValues.length > 0 
        ? nonZeroValues.reduce((sum, s) => sum + s.value, 0) / nonZeroValues.length 
        : 0;
      
      return {
        id: category.id,
        name: category.name,
        avgValue: Number(avgValue.toFixed(2))
      };
    });
  }, [reportData]);

  // Reset active report when filter changes
  useEffect(() => {
    setActiveReport(0);
  }, [typeFilter]);

  // Scroll to top when component mounts or typeFilter changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [typeFilter]);

  // Load active report data
  useEffect(() => {
    const currentSample = sampleReports[activeReport];
    if (currentSample && currentSample.data) {
      const convertedData = convertToGraphQLFormat(currentSample.data);
      setReportData(convertedData);
    }
  }, [activeReport, sampleReports]);

  // Calculate summary stats for current report
  const getSummaryStats = (data) => {
    if (!data || !data.Categories) return {};
    
    const categories = data.Categories.items;
    const totalStatements = categories.reduce((sum, cat) => sum + cat.Statements.items.length, 0);
    const allScores = categories.flatMap(cat => 
      cat.Statements.items.filter(s => s.value > 0).map(s => s.value)
    );
    const avgScore = allScores.length > 0 
      ? (allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(2)
      : 0;
    
    return {
      categories: categories.length,
      totalStatements,
      avgScore,
      completed: data.completed,
      assignedMembers: data.assignedMembers?.length || 0
    };
  };

  const currentSample = sampleReports[activeReport];
  const summaryStats = reportData ? getSummaryStats(reportData) : {};

  // Render the appropriate report component based on type
  const renderReportComponent = () => {
    if (!reportData) {
      return (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-spinner fa-spin fa-2x mb-3"></i>
          <p>Loading report data...</p>
        </div>
      );
    }

    const commonProps = {
      reportData,
      fromProject: true, // Hides PDF generation button
      isGeneratingPDF: false,
      allImagesLoaded: true
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

      case "Standard Work Report":
        return (
          <ReportDataChartPdf
            reportId={reportData.id}
            fromProject={true}
            previewMode={true}
            previewData={{
              reportData: reportData,
              chartData: reportData.chartData || [],
              actionItemsData: reportData.actionItemsData || [],
              taktTime: reportData.taktTime || null,
              timeUnit: reportData.timeUnit || 'seconds'
            }}
          />
        );

      case "A3 Project Report":
      case "DMAIC Report":
      case "PDCA Report":
        return (
          <ProcessAnalysisReport
            {...commonProps}
            highlightsData={reportData.highlightsData}
            actionItemsData={reportData.actionItemsData}
          />
        );

      case "Gemba Walk Report":
      case "Waste Walk Report":
        return (
          <ObservationReport
            {...commonProps}
            highlightsData={reportData.highlightsData}
            actionItemsData={reportData.actionItemsData}
          />
        );

      case "5 Whys Report":
      case "Kaizen Project Report":
        return (
          <ProblemSolvingReport
            {...commonProps}
            highlightsData={reportData.highlightsData}
            actionItemsData={reportData.actionItemsData}
          />
        );

      case "Leadership Report":
        return (
          <LeadershipReport
            {...commonProps}
            highlightsData={reportData.highlightsData}
            actionItemsData={reportData.actionItemsData}
          />
        );

      case "Value Stream Mapping Report":
        return (
          <ReportVsmPdf
            {...commonProps}
            // Pass sample data directly to the component
            previewMode={true}
            previewData={{
              reportData: reportData,
              vsmProcess: reportData.vsmData?.process || [],
              vsmInventory: reportData.vsmData?.inventory || [],
              vsmData: reportData.vsmData || {},
              actionItemsData: reportData.actionItemsData || []
            }}
          />
        );

      case "Fishbone Diagram Report":
      case "Brainstorming Report":
      case "Impact Map Report":
      case "Stakeholder Analysis Report":
        return (
          <ReportChartPdf
            reportId={reportData.id}
            fromProject={true}
            previewMode={true}
            previewData={{
              reportData: reportData,
              chartData: reportData.chartData || [],
              actionItemsData: reportData.actionItemsData || []
            }}
          />
        );
      
      case "Histogram Report":
      case "Pareto Chart Report":
      case "Scatter Plot Report":
      case "Run Chart Report":
        return (
          <ReportDataChartPdf
            reportId={reportData.id}
            fromProject={true}
            previewMode={true}
            previewData={{
              reportData: reportData,
              chartData: reportData.chartData || [],
              actionItemsData: reportData.actionItemsData || []
            }}
          />
        );

      default:
        return <div className="alert alert-warning">Unknown report type: {reportData.type}</div>;
    }
  };

  return (
    <Container fluid className="py-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Breadcrumb Navigation */}
      <Row className="mb-3">
        <Col>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to={getBackUrl()} className="text-decoration-none">
                  All Learning Tools
                </Link>
              </li>
              {typeFilter && (
                <li className="breadcrumb-item active" aria-current="page">
                  {typeFilter} Samples
                </li>
              )}
              {!typeFilter && (
                <li className="breadcrumb-item active" aria-current="page">
                  All Samples
                </li>
              )}
            </ol>
          </nav>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  {typeFilter && (
                    <div 
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        padding: '8px'
                      }}
                    >
                      <img 
                        src={iconMappings[typeFilter] || LFlogo} 
                        alt={typeFilter}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'contain',
                          filter: 'brightness(0) invert(1)'
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="mb-0">
                      {typeFilter ? `${typeFilter} Sample Reports Preview` : 'Sample Reports Preview'}
                    </h4>
                    <small>
                      {typeFilter 
                        ? `Preview sample ${typeFilter} data using the same PDF components as the live application`
                        : 'Preview sample data using the same PDF components as the live application'
                      }
                    </small>
                  </div>
                </div>
              </div>
            </Card.Header>
          </Card>
        </Col>
      </Row>


      {sampleReports.length === 0 ? (
        <Row>
          <Col>
            <Card>
              <Card.Body className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No Sample Reports Available</h5>
                <p className="text-muted">
                  {typeFilter 
                    ? `No sample reports are available for "${typeFilter}" yet.`
                    : 'No sample reports are currently available.'
                  }
                </p>
                <Button as={Link} to={getBackUrl()} variant="primary">
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Learning Tools
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <>
          <Row>
          {/* Left Sidebar - Report List */}
          <Col lg={3} className="mb-4">
            <Card>
              <Card.Header>
                <h6 className="mb-0">
                  {typeFilter ? `${typeFilter} Samples` : 'Sample Reports'}
                </h6>
              </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                {sampleReports.map((report, index) => (
                  <Nav.Item key={report.id}>
                    <Nav.Link 
                      active={activeReport === index}
                      onClick={() => setActiveReport(index)}
                      className="d-flex justify-content-between align-items-start rounded-0 border-bottom"
                    >
                      <div>
                        <div className="fw-semibold">{report.name}</div>
                        <small className="text-muted">{report.description}</small>
                        <div className="mt-1">
                          <Badge bg={report.data?.report?.completed ? 'success' : 'warning'} className="me-1">
                            {report.data?.report?.completed ? 'Completed' : 'In Progress'}
                          </Badge>
                          <Badge bg="secondary" className="me-1">
                            {report.data?.categories?.length || 0} categories
                          </Badge>
                          {report.data?.aiAnalysis && (
                            <Badge bg="info">
                              <i className="fas fa-robot me-1"></i>
                              AI Analysis
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Card.Body>
          </Card>


        </Col>

        {/* Main Content - PDF Preview */}
        <Col lg={9}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">PDF Preview</h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ 
                backgroundColor: '#fff',
                minHeight: '800px',
                overflow: 'auto'
              }}>
                {renderReportComponent()}
              </div>
            </Card.Body>
          </Card>
        </Col>
          </Row>

            {/* Chart Data Debug Info - Only show for assessment type reports */}
            {chartData.length > 0 && reportData && !['Leadership Report', 'Kaizen Project Report', 'A3 Project Report', 'PDCA Report', 'DMAIC Report', 'Gemba Walk Report', 'Waste Walk Report', '5 Whys Report', 'Brainstorming Report', 'Fishbone Diagram Report'].includes(reportData.type) && (
            <Row className="mt-4">
              <Col>
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Chart Data</h6>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {chartData.map((item, index) => (
                        <Col md={2} key={index} className="mb-2">
                          <div className="text-center">
                            <div className="fw-semibold">{item.name}</div>
                            <Badge 
                              bg={item.avgValue >= 4 ? 'success' : item.avgValue >= 3 ? 'warning' : 'danger'}
                              className="fs-6"
                            >
                              {item.avgValue}
                            </Badge>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* AI Analysis Section */}
          {currentSample?.data?.aiAnalysis && (
            <Row className="mt-4">
              <Col>
                <Card className="border-info">
                  <Card.Header className="bg-info text-white">
                    <h6 className="mb-0">
                      <i className="fas fa-robot me-2"></i>
                      AI Learning Analysis
                    </h6>
                  </Card.Header>
                  <Card.Body>
                {/* Overall Assessment - Only for assessment-type reports */}
                {currentSample.data.aiAnalysis.overallAssessment && (
                  <div className="mb-4">
                    <h6 className="text-info">Overall Assessment</h6>
                    <div className="row">
                      <div className="col-md-4">
                        <strong>Maturity Level:</strong><br />
                        <Badge bg="primary" className="fs-6">
                          {currentSample.data.aiAnalysis.overallAssessment.maturityLevel}
                        </Badge>
                      </div>
                      {currentSample.data.aiAnalysis.overallAssessment.totalScore && (
                        <div className="col-md-4">
                          <strong>Score:</strong><br />
                          <Badge bg="success" className="fs-6">
                            {currentSample.data.aiAnalysis.overallAssessment.totalScore}
                          </Badge>
                        </div>
                      )}
                      <div className={currentSample.data.aiAnalysis.overallAssessment.totalScore ? "col-md-4" : "col-md-8"}>
                        <strong>Status:</strong><br />
                        <span className="text-muted">
                          {currentSample.data.aiAnalysis.overallAssessment.assessmentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overview - For non-assessment reports like brainstorming */}
                {currentSample.data.aiAnalysis.overview && (
                  <div className="mb-4">
                    <h6 className="text-info">Session Overview</h6>
                    <p className="text-muted">{currentSample.data.aiAnalysis.overview}</p>
                  </div>
                )}

                {/* Key Findings/Strengths */}
                {currentSample.data.aiAnalysis.keyFindings && currentSample.data.aiAnalysis.keyFindings.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-info">Key Findings</h6>
                    <ul className="list-unstyled">
                      {currentSample.data.aiAnalysis.keyFindings.map((finding, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-check-circle text-success me-2"></i>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Strengths - For brainstorming and other creative reports */}
                {currentSample.data.aiAnalysis.keyStrengths && currentSample.data.aiAnalysis.keyStrengths.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-info">Key Strengths</h6>
                    <ul className="list-unstyled">
                      {currentSample.data.aiAnalysis.keyStrengths.map((strength, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-star text-warning me-2"></i>
                          <span dangerouslySetInnerHTML={{ __html: strength }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Highlights Analysis for Leadership Reports */}
                {currentSample.data.aiAnalysis.highlightsAnalysis && (
                  <div className="mb-4">
                    <h6 className="text-info">Highlights Analysis</h6>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <div className="card border-success">
                          <div className="card-header bg-success text-white py-2">
                            <strong>Key Accomplishments</strong>
                          </div>
                          <div className="card-body py-2">
                            <div className="small">
                              {currentSample.data.aiAnalysis.highlightsAnalysis.accomplishments}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="card border-info">
                          <div className="card-header bg-info text-white py-2">
                            <strong>Improvement Initiatives</strong>
                          </div>
                          <div className="card-body py-2">
                            <div className="small">
                              {currentSample.data.aiAnalysis.highlightsAnalysis.improvements}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="card border-warning">
                          <div className="card-header bg-warning text-white py-2">
                            <strong>Recognition & Awards</strong>
                          </div>
                          <div className="card-body py-2">
                            <div className="small">
                              {currentSample.data.aiAnalysis.highlightsAnalysis.recognitions}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-3">
                        <div className="card border-primary">
                          <div className="card-header bg-primary text-white py-2">
                            <strong>Strategic Initiatives</strong>
                          </div>
                          <div className="card-body py-2">
                            <div className="small">
                              {currentSample.data.aiAnalysis.highlightsAnalysis.initiatives}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Learning Points */}
                <div className="mb-4">
                  <h6 className="text-info">What You Can Learn From This Report</h6>
                  <div className="ps-3">
                    {currentSample.data.aiAnalysis.learningPoints.map((point, index) => (
                      <div key={index} className="mb-3 p-3 bg-light rounded">
                        <strong className="text-primary">{point.split(':')[0]}:</strong>
                        <span className="ms-2">{point.split(':').slice(1).join(':')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strength Areas */}
                {currentSample.data.aiAnalysis.strengthAreas && currentSample.data.aiAnalysis.strengthAreas.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-info">Demonstrated Best Practices</h6>
                  <div className="row">
                    {currentSample.data.aiAnalysis.strengthAreas.map((strength, index) => (
                      <div key={index} className="col-md-4 mb-3">
                        <div className="card border-success">
                          <div className="card-header bg-success text-white py-2">
                            <strong>{strength.category}</strong>
                          </div>
                          <div className="card-body py-2">
                            <div className="small mb-2">
                              <strong>Highlights:</strong> {strength.highlights}
                            </div>
                            <div className="small text-muted">
                              <strong>Practices:</strong> {strength.bestPractices}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Improvement Opportunities */}
                {currentSample.data.aiAnalysis.improvementOpportunities && currentSample.data.aiAnalysis.improvementOpportunities.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-info">Improvement Opportunities</h6>
                    {/* For object-based opportunities (assessment reports) */}
                    {typeof currentSample.data.aiAnalysis.improvementOpportunities[0] === 'object' ? (
                      <div className="row">
                        {currentSample.data.aiAnalysis.improvementOpportunities.map((opportunity, index) => (
                          <div key={index} className="col-md-6 mb-3">
                            <div className="card border-warning">
                              <div className="card-header bg-warning py-2">
                                <strong>{opportunity.category}</strong>
                              </div>
                              <div className="card-body py-2">
                                <div className="small mb-2">
                                  <strong>Gaps:</strong> {opportunity.gaps}
                                </div>
                                <div className="small text-muted">
                                  <strong>Recommendations:</strong> {opportunity.recommendations}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* For string-based opportunities (brainstorming reports) */
                      <ul className="list-unstyled">
                        {currentSample.data.aiAnalysis.improvementOpportunities.map((opportunity, index) => (
                          <li key={index} className="mb-2">
                            <i className="fas fa-lightbulb text-warning me-2"></i>
                            <span dangerouslySetInnerHTML={{ __html: opportunity }} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Learning Points - For brainstorming and creative reports */}
                {currentSample.data.aiAnalysis.learningPoints && currentSample.data.aiAnalysis.learningPoints.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-info">Learning Points</h6>
                    <ul className="list-unstyled">
                      {currentSample.data.aiAnalysis.learningPoints.map((point, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-graduation-cap text-primary me-2"></i>
                          <span dangerouslySetInnerHTML={{ __html: point }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {currentSample.data.aiAnalysis.nextSteps && currentSample.data.aiAnalysis.nextSteps.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-info">Recommended Next Steps</h6>
                    <ul className="list-unstyled">
                      {currentSample.data.aiAnalysis.nextSteps.map((step, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-arrow-right text-success me-2"></i>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Legacy Next Steps - For other report types */}
                {currentSample.data.aiAnalysis.recommendedActions && currentSample.data.aiAnalysis.recommendedActions.length > 0 && (
                  <div className="mb-4">
                    <h6 className="text-info">Recommended Next Steps</h6>
                    <ol className="ps-3">
                      {currentSample.data.aiAnalysis.recommendedActions.map((step, index) => (
                        <li key={index} className="mb-2">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Organizational Maturity */}
                {currentSample.data.aiAnalysis.organizationalMaturity && (
                  <div>
                    <h6 className="text-info">Organizational Maturity Assessment</h6>
                    <div className="bg-light p-3 rounded">
                      <div className="row">
                        <div className="col-md-6">
                          <strong>Maturity Level:</strong> {currentSample.data.aiAnalysis.organizationalMaturity.level}
                          {currentSample.data.aiAnalysis.organizationalMaturity.characteristics && currentSample.data.aiAnalysis.organizationalMaturity.characteristics.length > 0 && (
                          <ul className="mt-2 small">
                            {currentSample.data.aiAnalysis.organizationalMaturity.characteristics.map((char, index) => (
                              <li key={index}>{char}</li>
                            ))}
                          </ul>
                          )}
                        </div>
                        <div className="col-md-6">
                          <strong>Advancement Readiness:</strong>
                          <p className="mt-2 small text-muted">
                            {currentSample.data.aiAnalysis.organizationalMaturity.readinessForAdvancement}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

    </Container>
  );
};

export default SampleDataPreview;