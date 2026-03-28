import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as subscriptions from '../../graphql/subscriptions';
import brainstorming from '../../assets/lean-tools/light/brainstorming.png';
import fishboneDiagram from '../../assets/lean-tools/light/fishbone_diagram.png';
import stakeholderAnalysis from '../../assets/lean-tools/light/stakeholder_analysis.png';
import impactMap from '../../assets/lean-tools/light/impact_map.png';
import { Card, Button, Alert, Col, Container, Row } from 'react-bootstrap';
import AttachmentImage from '../shared/AttachmentImage';
import UserAvatar from '../shared/UserAvatar';
import { generatePdfViaApi } from '../../utils/apiPdfGenerator';
import { getStatusColor, getStatusText, fetchUserEmails } from '../../utils/reportHelper';

const ReportChartPdf = ({ reportId: propReportId, fromProject = false, previewMode = false, previewData = null }) => {
  const { reportId: urlReportId } = useParams();
  const effectiveReportId = propReportId || urlReportId;
  const [chartData, setChartData] = useState([]);
  const [report, setReport] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [isFishbone, setIsFishbone] = useState(false);
  const [isImpact, setIsImpact] = useState(false);
  const [isSa, setIsSa] = useState(false);
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [loadedAttachments, setLoadedAttachments] = useState({});
  const [imageUrlsMap, setImageUrlsMap] = useState({});
  const [loadedImages, setLoadedImages] = useState({});
  const [emailMap, setEmailMap] = useState(new Map());
  const subscriptions = useRef([]);

  // Add new image loading check
  const allImagesLoaded = actionItems.every(item => 
    !item.attachments?.length || // Skip items with no attachments
    (imageUrlsMap[item.id]?.length > 0 && loadedImages[item.id]) // Check if images are loaded
  );

  const handleImageLoad = (attachmentId) => {
    setLoadedImages(prevState => ({
      ...prevState,
      [attachmentId]: true
    }));
  };

  const fetchSignedUrlForAttachment = async (attachmentData) => {
    try {
      // Handle attachment objects with URL (for sample data)
      if (typeof attachmentData === 'object' && attachmentData.url) {
        if (attachmentData.url.startsWith('http')) {
          return attachmentData.url;
        }
      }
      
      // Handle direct HTTP URLs (for sample data)
      const attachmentName = typeof attachmentData === 'string' ? attachmentData : (attachmentData?.name || attachmentData?.key || attachmentData);
      if (typeof attachmentName === 'string' && attachmentName.startsWith('http')) {
        return attachmentName;
      }
      
      // Original S3 logic
      let signedUrl;
      try {
        signedUrl = await Storage.get(attachmentName, {
          level: 'public',
          expires: 60 * 60 * 24,
        });
      } catch (authError) {
        // Fallback to direct public S3 URL
        const cleanKey = attachmentName.startsWith('public/') ? attachmentName : `public/${attachmentName}`;
        signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
      }

      // Fetch the signed URL as a blob
      const response = await fetch(signedUrl, { method: 'GET', mode: 'cors' });
      const blob = await response.blob();
      const objectURL = URL.createObjectURL(blob);

      return objectURL;
    } catch (err) {
      console.error('Error fetching signed URL for attachment:', attachmentData, err);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllSignedUrls = async () => {
      if (actionItems) {
        const allUrlsMap = {};
        for (let item of actionItems) {
          if (item.attachments && item.attachments.length > 0) {
            const urls = await Promise.all(
              item.attachments.map(attachment => fetchSignedUrlForAttachment(attachment))
            );
            allUrlsMap[item.id] = urls.filter(url => url !== null);
          }
        }
        setImageUrlsMap(allUrlsMap);
      }
    };

    fetchAllSignedUrls();

    // Cleanup function
    return () => {
      // Release the Object URLs to free up resources
      for (let itemId in imageUrlsMap) {
        for (let url of imageUrlsMap[itemId]) {
          URL.revokeObjectURL(url);
        }
      }
    };
  }, [actionItems]);

  console.log("report:", report);

  const gridRef = useRef(null);
  const reportRef = useRef(null); 

  const formatDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  };

  const fetchData = useCallback(async () => {
    try {
        if (previewMode && previewData) {
            // Use preview data instead of fetching from API
            console.log("Using preview data:", previewData);
            setChartData(previewData.chartData || []);
            setReport(previewData.reportData);
            setActionItems(previewData.actionItemsData || []);
            
            // Set report type flags
            if (previewData.reportData?.type === "Fishbone Diagram Report") {
                setIsFishbone(true);
            }
            if (previewData.reportData?.type === "Stakeholder Analysis Report") {
                setIsSa(true);
            }
            if (previewData.reportData?.type === "Impact Map Report") {
                setIsImpact(true);
            }
            
            return;
        }

        // Fetch chart data with pagination
        let allChartDataItems = [];
        let nextToken = null;
        
        do {
            const chartDataResponse = await API.graphql({
                query: queries.listChartData,
                variables: {
                    filter: { 
                        reportID: { eq: effectiveReportId },
                        _deleted: { ne: true }
                    },
                    limit: 100,
                    nextToken: nextToken
                }
            });
            
            const items = chartDataResponse.data.listChartData.items;
            allChartDataItems = [...allChartDataItems, ...items];
            nextToken = chartDataResponse.data.listChartData.nextToken;
            
            console.log(`Fetched ${items.length} chart data items, total so far: ${allChartDataItems.length}`);
        } while (nextToken);
        
        console.log('Total chart data items fetched:', allChartDataItems.length);
        setChartData(allChartDataItems);

        // Fetch report
        const fetchedReportResponse = await API.graphql(
            graphqlOperation(queries.getReport, { 
                id: effectiveReportId 
            })
        );
        const fetchedReport = fetchedReportResponse.data.getReport;
        console.log("fetchedReport", fetchedReport);

        if (fetchedReport.type === "Fishbone Diagram Report") {
            setIsFishbone(true);
        }
        if (fetchedReport.type === "Stakeholder Analysis Report") {
            setIsSa(true);
        }
        if (fetchedReport.type === "Impact Map Report") {
            setIsImpact(true);
        }

        setReport(fetchedReport);

        // Fetch action items
        let allActionItems = [];
        let actionItemsNextToken = null;
        
        do {
          const actionItemsResponse = await API.graphql({
            query: queries.listActionItems,
            variables: {
              filter: { 
                reportID: { eq: effectiveReportId },
                _deleted: { ne: true }
              },
              limit: 1000,
              nextToken: actionItemsNextToken
            }
          });
          
          const items = actionItemsResponse.data.listActionItems.items
            .filter(item => item && !item._deleted);
          
          allActionItems = [...allActionItems, ...items];
          actionItemsNextToken = actionItemsResponse.data.listActionItems.nextToken;
        } while (actionItemsNextToken);

        // Sort all action items
        allActionItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        console.log(`Fetched ${allActionItems.length} action items for report ${effectiveReportId}`);
        setActionItems(allActionItems);

    } catch (error) {
        console.error("Error in fetchData:", error);
        setError(error.message);
    }
}, [effectiveReportId, previewMode, previewData]);

  useEffect(() => {
    if (previewMode) {
      // In preview mode, just call fetchData without setting up subscriptions
      fetchData();
      return;
    }

    if (!effectiveReportId) {
      console.error('No report ID provided');
      setError('No report ID provided');
      return;
    }
    fetchData();

    // Set up subscriptions for chart data changes
    const setupSubscriptions = () => {
      try {
        const subs = [
          API.graphql(
            graphqlOperation(subscriptions.onCreateChartData, {
              filter: {
                reportID: { eq: effectiveReportId }
              }
            })
          ).subscribe({
            next: () => fetchData(),
            error: error => {
              console.warn('Create subscription error:', error);
              setError('Error in create subscription: ' + error.message);
            }
          }),
          API.graphql(
            graphqlOperation(subscriptions.onUpdateChartData, {
              filter: {
                reportID: { eq: effectiveReportId }
              }
            })
          ).subscribe({
            next: () => fetchData(),
            error: error => {
              console.warn('Update subscription error:', error);
              setError('Error in update subscription: ' + error.message);
            }
          }),
          API.graphql(
            graphqlOperation(subscriptions.onDeleteChartData, {
              filter: {
                reportID: { eq: effectiveReportId }
              }
            })
          ).subscribe({
            next: () => fetchData(),
            error: error => {
              console.warn('Delete subscription error:', error);
              setError('Error in delete subscription: ' + error.message);
            }
          })
        ];

        subscriptions.current = subs;
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setError('Error setting up subscriptions: ' + error.message);
      }
    };

    setupSubscriptions();

    // Cleanup subscriptions
    return () => {
      if (subscriptions.current) {
        subscriptions.current.forEach(subscription => {
          try {
            if (subscription && typeof subscription.unsubscribe === 'function') {
              subscription.unsubscribe();
            }
          } catch (error) {
            console.warn('Error unsubscribing:', error);
          }
        });
      }
    };
  }, [effectiveReportId, fetchData, previewMode]);

  useEffect(() => {
    const fetchEmails = async () => {
      // Collect all unique assignee IDs
      const allAssignees = new Set();
      
      // Add assignees from action items
      actionItems.forEach(item => {
        if (item.assignees && item.assignees.length > 0) {
          item.assignees.forEach(id => allAssignees.add(id));
        }
      });
      
      // Add assignees from the report
      if (report?.assignedMembers && report.assignedMembers.length > 0) {
        report.assignedMembers.forEach(id => allAssignees.add(id));
      }
      
      // Convert Set to Array
      const assigneeArray = Array.from(allAssignees);
      
      if (assigneeArray.length > 0 && report?.organizationID) {
        const emails = await fetchUserEmails(assigneeArray, report.organizationID);
        setEmailMap(emails);
      }
    };
    
    if (report && (actionItems.length > 0 || (report.assignedMembers && report.assignedMembers.length > 0))) {
      fetchEmails();
    }
  }, [report, actionItems]);

  const boneLength = 250;
  const gap = boneLength * 0.10;
  const bones = report?.bones;
  const fixedWidth = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 994 : 1024;
  const fixedHeight = (report?.type === 'Impact Map Report' || report?.type === 'Stakeholder Analysis Report') ? 590 : 640;

  const generateCombinedPDF = async () => {
    setIsGeneratingPDF(true);
    setError(null);

    try {
      // Get the current URL of the page
      const currentUrl = window.location.href;
      
      // Call the API to generate the PDF
      await generatePdfViaApi(currentUrl);
      
      console.log('PDF generation initiated successfully');
    } catch (error) {
      console.error('Error initiating PDF generation:', error);
      setError(error.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const statusText = {
    0: 'To Do',
    1: 'In Progress',
    2: 'In Review',
    3: 'Done'
  };

  const colStyle = {
    marginLeft: '20px', 
    marginRight: '20px',
    marginBottom: '20px',
    marginTop: '20px',
  }
  
  const buttonStyle = {
    marginRight: '20px',
  }
  
  const cardStyle = {
    marginBottom: '10px',
    border: 'none',
    pageBreakInside: 'avoid',
    breakInside: 'avoid-page',
    width: '100%'
  };

  
  const cardHeaderStyle = {
    backgroundColor: '#009688', // Blue color
    color: 'white', // Text color
    padding: '10px',
    display: "flex",
    alignItems: "center",
  };

  const reportImageStyle ={
    marginRight: "20px",
    width: "30px", 
  }

  const cardBodyStyle = {
    backgroundColor: '#f5f5f5', // Light grey color
    padding: '20px'
  };

  const reportStyle = {
    padding: 20,
  };

  const headerCardStyle = {
    marginBottom: '15px',
    border: '2px solid #009688',
    backgroundColor: '#f0f8f6', // Light teal background
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  const reportInfoStyle = {
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  const renderStructure = () => {
    if (!report) return null;

    const commonStyles = {
      position: 'absolute',
      backgroundColor: 'black'
    };

    switch (report.type) {
      case 'Fishbone Diagram Report':
        return (
          <>
            {/* Spine */}
            <div style={{
              ...commonStyles,
              top: '50%',
              left: 40 + gap,
              width: fixedWidth - 310 - (2 * gap),
              height: '2px'
            }} />
            
            {/* Arrow */}
            <div style={{
              ...commonStyles,
              left: fixedWidth - 300,
              top: 'calc(50% - 4px)',
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderTop: '5px solid transparent',
              borderLeft: '10px solid black',
              borderBottom: '5px solid transparent'
            }} />

            {/* Vertical line after arrow */}
            <div style={{
              ...commonStyles,
              top: '25%',
              right: '230px',
              width: '2px',
              height: '50%',
              backgroundColor: 'black'
            }} />

            {/* Labels */}
            <div style={{ position: 'absolute', top: '5%', left: '25%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              "Bones" Major Cause Categories
            </div>
            <div style={{ position: 'absolute', top: '5%', right: '10%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Effect
            </div>

            {/* Bones */}
            {[...Array(bones/2)].map((_, index) => {
              const boneSpacingMultiplier = ((2 * gap)) / (bones/3.5);
              const boneStart = (index * boneSpacingMultiplier + 3) / 100 * (fixedWidth - 300 - (2 * gap));
              
              return (
                <React.Fragment key={index}>
                  {/* Top bone */}
                  <div style={{
                    ...commonStyles,
                    top: '50%',
                    left: boneStart,
                    width: boneLength,
                    height: '2px',
                    transform: 'translateY(-110px) rotate(60deg)'
                  }} />
                  
                  {/* Bottom bone */}
                  <div style={{
                    ...commonStyles,
                    top: '50%',
                    left: boneStart,
                    width: boneLength,
                    height: '2px',
                    transform: 'translateY(110px) rotate(-60deg)'
                  }} />
                </React.Fragment>
              );
            })}
          </>
        );

      case 'Impact Map Report':
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', top: '25%', left: '15%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Implement Immediately
            </div>
            <div style={{ position: 'absolute', top: '25%', right: '20%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Develop Further
            </div>
            <div style={{ position: 'absolute', bottom: '25%', left: '10%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Develop Greater Business Impact
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '12%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Watch For Further Development
            </div>
            <div style={{ position: 'absolute', left: '-31px', top: '10px', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              High
            </div>
            <div style={{ position: 'absolute', left: '-121px', top: '50%', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Impact of Implementation
            </div>
            <div style={{ position: 'absolute', left: '-28px', bottom: '5px', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Low
            </div>
            <div style={{ position: 'absolute', left: '0', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Very Easy
            </div>
            <div style={{ position: 'absolute', left: '40%', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Ease of Implementation
            </div>
            <div style={{ position: 'absolute', right: '0', bottom: '-20px', fontWeight: 'bold', color: 'black', fontSize: '18px' }}>
              Very Difficult
            </div>
          </>
        );

      case 'Stakeholder Analysis Report':
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', left: '-20px', top: '10px', fontWeight: 'bold', color: 'black', fontSize: '28px' }}>
              +
            </div>
            <div style={{ position: 'absolute', left: '-45px', top: '50%', fontWeight: 'bold', color: 'black', fontSize: '18px', transform: 'rotate(90deg)' }}>
              Attitude
            </div>
            <div style={{ position: 'absolute', left: '-20px', bottom: '5px', fontWeight: 'bold', color: 'black', fontSize: '38px' }}>
              -
            </div>
            <div style={{ position: 'absolute', left: '20px', bottom: '-30px', fontWeight: 'bold', color: 'black', fontSize: '38px' }}>
              -
            </div>
            <div style={{ position: 'absolute', left: '30%', bottom: '-20px', fontSize: '18px' }}>
              <span style={{ fontWeight: 'bold' }}>Influence</span>
              <span> (Note: This is a political map of your key stakeholders.)</span>
            </div>
            <div style={{ position: 'absolute', right: '0', bottom: '-25px', fontWeight: 'bold', color: 'black', fontSize: '28px' }}>
              +
            </div>
          </>
        );

      default: // Brainstorming
        return (
          <>
            <div style={{ ...commonStyles, top: '50%', width: fixedWidth, height: '1px' }} />
            <div style={{ ...commonStyles, left: '50%', height: fixedHeight, width: '1px' }} />
            <div style={{ position: 'absolute', top: '25%', left: '20%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem
            </div>
            <div style={{ position: 'absolute', top: '25%', right: '21%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem
            </div>
            <div style={{ position: 'absolute', bottom: '25%', left: '17%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem Solution
            </div>
            <div style={{ position: 'absolute', bottom: '25%', right: '17%', fontWeight: 'bold', color: 'gray', fontSize: '18px' }}>
              Problem Solution
            </div>
          </>
        );
    }
  };
  
  const renderReportInfoHeader = () => {
    // Get all assignees from report data
    const assignedMembers = report?.assignedMembers || [];
    
    return (
      <div className="portrait">
        <Card style={headerCardStyle}>
          <Card.Body style={reportInfoStyle}>
            <h5 style={{ color: '#00897b', borderBottom: '1px solid #ddd', paddingBottom: '8px', marginBottom: '10px' }}>
              Report Information
            </h5>
            
            <Row>
              <Col xs={12} md={6}>
                <div style={{ marginBottom: '15px' }}>
                  <h6 style={{ color: '#444', fontWeight: 'bold' }}>Owner</h6>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {report?.ownerEmail && (
                      <>
                        <UserAvatar 
                          email={report.ownerEmail}
                          organizationID={report.organizationID}
                          size={40}
                          style={{ marginRight: '10px' }}
                          isOwner={true}
                        />
                        <span>{report.ownerEmail}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {assignedMembers.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <h6 style={{ color: '#444', fontWeight: 'bold' }}>Assigned Members ({assignedMembers.length})</h6>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {assignedMembers.map((userSub) => (
                        <div key={userSub} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', marginRight: '15px' }}>
                          <UserAvatar 
                            userSub={userSub}
                            organizationID={report.organizationID}
                            size={36}
                            style={{ marginRight: '8px' }}
                          />
                          <span>{emailMap.get(userSub) || '(Email not available)'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Col>
              
              <Col xs={12} md={6}>
                <div>
                  <h6 style={{ color: '#444', fontWeight: 'bold' }}>Report Details</h6>
                  <div style={{ padding: '8px', backgroundColor: '#e9f5f2', borderRadius: '4px' }}>
                    <div><strong>Type:</strong> {report?.type}</div>
                    <div><strong>Created:</strong> {report?.createdAt && new Date(report.createdAt).toLocaleDateString()}</div>
                    {report?.updatedAt && report.updatedAt !== report.createdAt && (
                      <div><strong>Last Updated:</strong> {new Date(report.updatedAt).toLocaleDateString()}</div>
                    )}
                    <div><strong>Status:</strong> {report?.completed ? 'Completed' : 'In Progress'}</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <>
    <style>
      {`
        @media (min-width: 992px) {
          .container, .container-lg, .container-md, .container-sm {
            max-width: ${fixedWidth + 100}px;
          }
        }
      `}
    </style>
    <Container style={{ width: fixedWidth + 80 + 'px' }} className="chart-component">
        {isGeneratingPDF && (
        <Alert variant="success">
            <Alert.Heading>PDF is generating, please wait it can take a moment..</Alert.Heading>
        </Alert>
        )}
        <Col style={colStyle}>
        {!fromProject && (
            <Button 
                style={buttonStyle} 
                onClick={() => generateCombinedPDF()}
                disabled={isGeneratingPDF || !allImagesLoaded}
            >
                {isGeneratingPDF ? 'Generating PDF...' : 
                 !allImagesLoaded ? 'Loading images...' : 
                 'Export Report as PDF'}
            </Button>
        )}
        </Col>
        <div ref={reportRef} style={reportStyle} className="report-page">
        {report && renderReportInfoHeader()}
        <div ref={gridRef} className="basic landscape">
        {report && (
            <Card style={headerCardStyle}>
                <Card.Header style={{ ...cardHeaderStyle, display: 'flex', justifyContent: 'center'}}>
                    {isFishbone ? <img style={reportImageStyle} src={fishboneDiagram} alt="Fishbone" /> : 
                     isSa ? <img style={reportImageStyle} src={stakeholderAnalysis} alt="Sa" /> : 
                     isImpact ? <img style={reportImageStyle} src={impactMap} alt="Impact" /> : 
                     <img style={reportImageStyle} src={brainstorming} alt="Brain" />}
                    <h6>{`${report.type} - ${report.name}`} | Created At: {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</h6>
                </Card.Header>
            </Card>
        )}
        <div style={{
          position: 'relative',
          width: fixedWidth + 80,
          height: fixedHeight + 80,
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'relative',
            margin: '20px',
            width: fixedWidth,
            height: fixedHeight,
            border: '1px solid black'
          }}>
            {renderStructure()}
            {chartData.map((item, index) => (
              <div 
                key={index}
                style={{ 
                  position: 'absolute', 
                  top: `${parseFloat(item.posY)}px`, 
                  left: `${parseFloat(item.posX)}px`, 
                  color: item.textColor,
                  padding: '16px',
                  userSelect: 'none',
                  whiteSpace: 'pre-wrap',
                  maxWidth: '350px'
                }}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>
        </div>
        {actionItems.length > 0 && (
            <div className="action-items portrait">
                <Card style={cardStyle}>
                    <Card.Header style={cardHeaderStyle}>
                        <h2 style={{ margin: '20px 0' }}>Action Items / Notes: {actionItems.length}</h2>
                    </Card.Header>
                </Card>
                {actionItems.map((item, index) => (
                    <Card key={index} style={cardStyle}>
                        <Card.Header style={cardHeaderStyle}>
                            {item.title}
                        </Card.Header>
                        <Card.Body style={cardBodyStyle}>
                            {!item.note && item.status !== null && item.status !== undefined && (
                                <p>Status: <span style={{ 
                                    color: 'white', 
                                    backgroundColor: getStatusColor(item.status),
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold'
                                }}>{getStatusText(item.status)}</span></p>
                            )}
                            {!item.note && item.duedate && <p>Due Date: {new Date(item.duedate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>}
                            <p>Description: {item.description}</p>
                            
                            {item.assignees && item.assignees.length > 0 && (
                                <div>
                                    <p>Assignee(s):</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {item.assignees.map((userSub, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                                                <UserAvatar 
                                                    userSub={userSub}
                                                    organizationID={report.organizationID}
                                                    size={24}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span>{emailMap.get(userSub) || '(Email not available)'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {item.attachments && item.attachments.length > 0 && (
                                <>
                                    <p>Attachment(s):</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", margin: "-10px" }}>
                                        {imageUrlsMap[item.id]?.map((url, imgIndex) => (
                                            <div key={imgIndex} style={{ margin: "10px", textAlign: "center" }}>
                                                <img
                                                    src={url}
                                                    alt={`Attachment ${imgIndex + 1}`}
                                                    style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                                    onLoad={() => handleImageLoad(item.id)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                ))}
            </div>
        )}
        </div>
    </Container>
    </>
  );
};

export default ReportChartPdf;