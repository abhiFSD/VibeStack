import React, { useState, useEffect, useRef } from 'react';
import { API, graphqlOperation, Storage } from 'aws-amplify';
import { useParams } from 'react-router-dom';
import { Card, Button, Alert, Col, Container, Table, Badge, Spinner, Row } from 'react-bootstrap';
import AttachmentImage from '../shared/AttachmentImage';
import UserAvatar from '../shared/UserAvatar';
import histogram from '../../assets/lean-tools/light/histogram.png';
import paretoChart from '../../assets/lean-tools/light/pareto_chart.png';
import scatterPlot from '../../assets/lean-tools/light/scatter_plot.png';
import runChart from '../../assets/lean-tools/light/run_chart.png';
import standardWork from '../../assets/lean-tools/light/standard_work.png';
import BarChart from '../shared/charts/BarChart';
import ScatterChart from '../shared/charts/ScatterChart';
import RunChart from '../shared/charts/RunChart';
import SwChart from '../shared/charts/SwChart';
import ParetoChart from '../shared/charts/ParetoChart';
import * as queries from '../../graphql/queries';
import * as subscriptions from '../../graphql/subscriptions';
import { generatePdfViaApi } from '../../utils/apiPdfGenerator';
import { getStatusColor, getStatusText, fetchUserEmails } from '../../utils/reportHelper';

const BarChartComponent = ({ reportId: propReportId, fromProject = false, previewMode = false, previewData = null }) => {
    const { reportId: urlReportId } = useParams();
    const effectiveReportId = propReportId || urlReportId;
    const [data, setData] = useState([]);
    const [report, setReport] = useState(null);
    const [actionItems, setActionItems] = useState([]);
    const [chart, setChart] = useState([]);
    const [timeUnit, setTimeUnit] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [imageUrlsMap, setImageUrlsMap] = useState({});
    const [loadedImages, setLoadedImages] = useState({});
    const [emailMap, setEmailMap] = useState(new Map());

    const gridRef = useRef(null);
    const reportRef = useRef(null);

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
                console.log('Direct HTTP URL detected, returning as-is:', attachmentName);
                return attachmentName;
            }
            
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
                console.log("Set all image URLs:", allUrlsMap);
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

    function truncateLabel(str, num) {
        if (str.length <= num) {
            return str;
        }
        return str.slice(0, num) + '...';
    }
    
    async function fetchData() {
        try {
            // Handle preview mode
            if (previewMode && previewData) {
                console.log("Using preview data for ReportDataChartPdf:", previewData);
                setReport(previewData.reportData);
                setActionItems(previewData.actionItemsData || []);
                
                // Set timeUnit from preview data
                if (previewData.timeUnit) {
                    setTimeUnit(previewData.timeUnit);
                }
                
                // Set chart data from preview
                if (previewData.chartData && previewData.chartData.length > 0) {
                    setChart(previewData.chartData);
                    
                    // Transform preview data for charts based on report type
                    let transformedData;
                    if (previewData.reportData?.type === 'Standard Work Report') {
                        // Special transformation for Standard Work Reports
                        transformedData = previewData.chartData.map((d, index) => ({
                            index: index + 1,
                            start: parseFloat(d.posX),
                            end: parseFloat(d.posY),
                            id: d.id,
                            Description: d.Description,
                            text: d.text,
                            orderIndex: d.orderIndex,
                            value: parseFloat(d.value) || 0
                        }));
                    } else {
                        // Standard transformation for other chart types
                        transformedData = previewData.chartData.map((d, index) => ({
                            index: index + 1,
                            value: parseFloat(d.value) || 0,
                            text: d.text,
                            Description: d.Description || '',
                            id: d.id,
                            date: d.date, // Preserve date field for Run Chart components
                            posX: d.posX, // Preserve posX for scatter plot components
                            posY: d.posY, // Preserve posY for scatter plot components
                            xValue: parseFloat(d.posX) || 0, // Transform posX to xValue for ScatterChart
                            yValue: parseFloat(d.posY) || 0  // Transform posY to yValue for ScatterChart
                        }));
                    }
                    console.log('ReportDataChartPdf: Preview transformed data for', previewData.reportData?.type, ':', transformedData);
                    setData(transformedData);
                }
                return;
            }

            // Fetch report
            const fetchedReportResponse = await API.graphql(
                graphqlOperation(queries.getReport, { id: effectiveReportId })
            );
            const fetchedReport = fetchedReportResponse.data.getReport;
            console.log("fetchedReport", fetchedReport);
            setReport(fetchedReport);

            // Fetch chart data with pagination
            let allChartItems = [];
            let chartNextToken = null;
            
            do {
                const fetchedDataResponse = await API.graphql({
                    query: queries.chartDataByReportID,
                    variables: {
                        reportID: effectiveReportId,
                        filter: {
                            _deleted: { ne: true }
                        },
                        limit: 100,
                        nextToken: chartNextToken
                    }
                });
                
                if (fetchedDataResponse.data?.chartDataByReportID?.items) {
                    const items = fetchedDataResponse.data.chartDataByReportID.items;
                    allChartItems = [...allChartItems, ...items];
                    chartNextToken = fetchedDataResponse.data.chartDataByReportID.nextToken;
                    
                    console.log(`Fetched ${items.length} chart items, total so far: ${allChartItems.length}`);
                } else {
                    console.error("Invalid response structure:", fetchedDataResponse);
                    break;
                }
            } while (chartNextToken);

            // Check if we have data
            if (allChartItems.length > 0) {
                let fetchedData = allChartItems;

                // Sort data to match normal view behavior
                if (fetchedReport.type === 'Pareto Chart Report') {
                    fetchedData.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
                } else if (fetchedReport.type === 'Standard Work Report') {
                    fetchedData.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                } else if (fetchedReport.type === 'Run Chart Report') {
                    fetchedData.sort((a, b) => new Date(a.date) - new Date(b.date));
                } else {
                    // For Histogram and other reports - sort by date/createdAt ascending (oldest first) to match normal view
                    fetchedData.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
                }

                setChart(fetchedData);

                // Update the timeUnit state based on the fetched report's bones value
                setTimeUnit(
                    fetchedReport.bones === 1 ? 'Seconds' : 
                    fetchedReport.bones === 2 ? 'Minutes' : 
                    fetchedReport.bones === 3 ? 'Hours' : 
                    null
                );

                // Transform the data based on report type
                let transformedData;
                if (fetchedReport.type === 'Standard Work Report') {
                    transformedData = fetchedData.map((d, index) => ({
                        index: index + 1,
                        start: parseFloat(d.posX),
                        end: parseFloat(d.posY),
                        id: d.id,
                        Description: d.Description,
                        text: d.text,
                        orderIndex: d.orderIndex,
                    }));
                } else {
                    transformedData = fetchedData.map(d => ({
                        text: d.text,
                        value: parseFloat(d.value),
                        id: d.id,
                        description: d.Description,
                        posX: d.posX,
                        posY: d.posY,
                        xValue: parseFloat(d.posX) || 0, // Transform posX to xValue for ScatterChart
                        yValue: parseFloat(d.posY) || 0, // Transform posY to yValue for ScatterChart
                        date: d.date,
                    }));
                }

                setData(transformedData);
            } else {
                console.error("No chart data found");
                setData([]);
                setChart([]);
            }

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
            allActionItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            console.log(`Fetched ${allActionItems.length} action items for report ${effectiveReportId}`);
            setActionItems(allActionItems);

        } catch (error) {
            console.error("Error fetching data:", error);
            // Log more detailed error information
            if (error.errors) {
                error.errors.forEach(err => console.error("GraphQL Error:", err));
            }
        }
    }

    console.log("chart", chart);

    useEffect(() => {
        if (previewMode) {
            // In preview mode, just call fetchData without setting up subscriptions
            fetchData();
            return;
        }

        fetchData();
      
        // Set up subscriptions for ChartData
        const createSubscription = API.graphql(
            graphqlOperation(subscriptions.onCreateChartData, {
                filter: { reportID: { eq: effectiveReportId } }
            })
        ).subscribe({
            next: () => {
                fetchData();
            },
            error: error => console.warn(error)
        });

        const updateSubscription = API.graphql(
            graphqlOperation(subscriptions.onUpdateChartData, {
                filter: { reportID: { eq: effectiveReportId } }
            })
        ).subscribe({
            next: () => {
                fetchData();
            },
            error: error => console.warn(error)
        });

        const deleteSubscription = API.graphql(
            graphqlOperation(subscriptions.onDeleteChartData, {
                filter: { reportID: { eq: effectiveReportId } }
            })
        ).subscribe({
            next: () => {
                fetchData();
            },
            error: error => console.warn(error)
        });

        // Clean up subscriptions when component unmounts
        return () => {
            createSubscription.unsubscribe();
            updateSubscription.unsubscribe();
            deleteSubscription.unsubscribe();
        };
    }, [effectiveReportId, previewMode]);

    const generateCombinedPDF = async () => {
        if (!allImagesLoaded) {
            console.warn('Not all images are loaded yet');
            return;
        }

        setIsGeneratingPDF(true);

        try {
            // Get the current URL of the page
            const currentUrl = window.location.href;
            
            // Call the API to generate the PDF
            await generatePdfViaApi(currentUrl);
            
            console.log('PDF generation initiated successfully');
        } catch (error) {
            console.error('Error initiating PDF generation:', error);
            console.error(error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            reader.onerror = (err) => {
                reject(err);
            };
            reader.readAsDataURL(blob);
        });
    }

    const calculateCumulativeData = (data) => {
        if (!data || data.length === 0) {
            return [];
        }
    
        let cumulativeValue = 0;
        const offset = data[0].value * 0.2;
    
        return data.map((item, index) => {
            cumulativeValue += item.value;
            return {
                x: item.text,
                y: index === 0 ? cumulativeValue : cumulativeValue
            };
        });
    };

    function calculateCumulativeDataValue(data) {
        let cumulativeValue = 0;
        const sortedData = [...data].sort((a, b) => b.value - a.value);
        const totalSum = sortedData.reduce((total, item) => total + item.value, 0);
        
        return sortedData.map((item) => {
            cumulativeValue += item.value;
            return {
                x: item.text,
                y: (cumulativeValue / totalSum) * 100,
            };
        });
    }

    const maxDataValue = Math.max(...data.map(item => item.value));
    const cumulativeData = calculateCumulativeData(data);

    console.log("cumulativeData", cumulativeData);

    const colorMap = {
        'Manual': '#efcc00',
        'Wait': '#FF0000',
        'Auto': '#008000',
        'Walk': '#800080',
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
        marginBottom: '20px', // Space between cards
        border: 'none' // Remove default card border
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
        width: "20px",  
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
        <Container style={{ width: '1024px' }} className="chart-component">
        {isGeneratingPDF && (
        <Alert variant="success">
            <div className="d-flex align-items-center">
                <span className="mr-3">
                    <Spinner animation="border" role="status" size="sm" />
                </span>
                <span>PDF is generating, please wait it can take a moment...</span>
            </div>
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
            <div ref={gridRef} className="landscape">
                {report && (
                    <Card style={cardStyle} className="card-header">
                        <Card.Header style={{ ...cardHeaderStyle, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <img 
                                style={reportImageStyle} 
                                src={
                                    report?.type === 'Pareto Chart Report' 
                                        ? paretoChart 
                                        : report?.type === 'Scatter Plot Report'
                                            ? scatterPlot
                                            : report?.type === 'Standard Work Report'
                                                ? standardWork
                                                : report?.type === 'Run Chart Report'
                                                    ? runChart
                                                    : histogram
                                } 
                                alt="Chart Type" 
                            />
                            <h6 style={{ letterSpacing: '2px', textAlign: 'center' }}>
                                {report.type} - {truncateLabel(report.name, 10)} | Created At: {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                {report?.type === 'Run Chart Report' && (
                                    <span style={{ marginLeft: '10px', color: report.trend ? 'green' : 'red', backgroundColor: 'white' }}>
                                        | Desired Trend: {report.trend ? "Positive (+)" : "Negative (-)"}
                                    </span>
                                )}
                            </h6>
                        </Card.Header>
                    </Card>
                )}

                {chart.length > 0 && (
                    <Card style={{ 
                        marginBottom: 20,
                        width: '100%',
                        padding: '20px',
                        minHeight: report?.type === 'Scatter Plot Report' ? '300px' : '500px',
                        backgroundColor: 'white',
                    }} className="chart-card">
                        <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            backgroundColor: 'white' 
                        }}>
                            {
                                report?.type === 'Scatter Plot Report' ? ( 
                                    <ScatterChart data={data} xaxis={report.media} yaxis={report.target} />
                                ) : report?.type === 'Run Chart Report' ? (
                                    <RunChart 
                                        data={data.sort((a, b) => {
                                            if (a.date && b.date) {
                                                // Handle both MM/DD/YYYY and YYYY-MM-DD date formats
                                                const parseDate = (dateStr) => {
                                                    if (dateStr.includes('/')) {
                                                        const [month, day, year] = dateStr.split('/');
                                                        return new Date(`${month}/${day}/${year}`);
                                                    } else if (dateStr.includes('-')) {
                                                        return new Date(dateStr);
                                                    } else {
                                                        return new Date(dateStr);
                                                    }
                                                };
                                                return parseDate(a.date) - parseDate(b.date);
                                            } else {
                                                return 0;
                                            }
                                        })} 
                                        target={report?.target} 
                                        xaxis={report?.xaxis} 
                                        yaxis={report?.yaxis} 
                                        isPdfView={true}
                                        maxWidth={950}
                                    />
                                ) : report?.type === 'Standard Work Report' ? (
                                    <SwChart 
                                        data={data} 
                                        timeUnit={timeUnit} 
                                        target={previewMode ? previewData?.taktTime : report?.target} 
                                        taktTime={previewMode ? previewData?.taktTime : report?.target} 
                                    />
                                ) : report?.type === 'Pareto Chart Report' ? (
                                    <ParetoChart data={data} />
                                ) : (
                                    <BarChart 
                                        data={data}
                                        reportType={report?.type}
                                        maxDataValue={maxDataValue}
                                        cumulativeData={cumulativeData}
                                    />
                                )
                            }
                        </div>
                    </Card>
                )}
            </div>

            <div className="portrait">
                {chart.length > 0 && (
                    <Card style={{ marginBottom: 20 }} className="data-table capture-card">
                        <Card.Header style={cardHeaderStyle}>
                            <h2 style={{ margin: '20px 0' }}>Chart Data: {chart.length}</h2>
                        </Card.Header>
                        <Card.Body style={cardBodyStyle}>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        {report?.type === 'Scatter Plot Report' ? (
                                            <>
                                                <th>X Value</th>
                                                <th>Y Value</th>
                                            </>
                                        ) : report?.type === 'Standard Work Report' ? (
                                            <>
                                                <th>Start</th>
                                                <th>Stop</th>
                                                <th>Type</th>
                                                <th>Total Cycle Time</th>
                                            </>
                                        ) : (
                                            <>
                                            {report?.type !== 'Run Chart Report' && <th>Label</th>}
                                                <th>Value</th>
                                            </>
                                        )}
                                        {report?.type === "Pareto Chart Report" && (
                                            <th>Cumulative %</th>
                                        )}
                                        {report?.type === 'Run Chart Report' && (
                                            <th>Date</th>
                                        )}
                                        <th>Description</th>
                                        {/* <th>Date Added</th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                {(report?.type === 'Pareto Chart Report' ? 
                                    chart.sort((a, b) => parseFloat(b.value) - parseFloat(a.value)) : 
                                    report?.type === 'Standard Work Report' ?
                                    chart.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)) :
                                    report?.type === 'Run Chart Report' ? 
                                    chart.sort((a, b) => new Date(a.date) - new Date(b.date)) : 
                                    chart.sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
                                ).map((item, index) => (
                                        <tr key={index}>
                                            {report?.type === 'Scatter Plot Report' ? (
                                                <>
                                                    <td>{item.posX}</td>
                                                    <td>{item.posY}</td>
                                                </>
                                            ) : report?.type === 'Standard Work Report' ? (
                                                <>
                                                    <td>{item.posX}</td>
                                                    <td>{item.posY}</td>
                                                    <td>
                                                        <span style={{ backgroundColor: colorMap[item.text], padding: '0.25em 0.4em', borderRadius: '10px' }}>{item.text}</span>
                                                    </td>
                                                    <td>
                                                        <Badge variant="primary">{item.value}</Badge>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                {report?.type !== 'Run Chart Report' && <td>{item.text}</td>}
                                                    <td>
                                                        <Badge variant="primary">{item.value}</Badge>
                                                    </td>
                                                </>
                                            )}
                                            {report?.type === "Pareto Chart Report" && (
                                                <td>
                                                    {(() => {
                                                        const cumulativeDataValue = calculateCumulativeDataValue(data);
                                                        const foundItem = cumulativeDataValue.find(d => d.x === item.text);
                                                        const currentCumulativePercentage = foundItem ? foundItem.y : 0;
                                                        return Math.round(currentCumulativePercentage);
                                                    })()}%
                                                </td>
                                            )}
                                            {report?.type === 'Run Chart Report' && (
                                                <td>{item.date}</td>
                                            )}
                                            <td>{item.Description}</td>
                                            {/* <td>
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                                {report?.type === 'Standard Work Report' && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="5">Total Cycle Time for all statements:  <Badge variant="primary"> {chart.reduce((total, item) => total + Number(item.value), 0)} </Badge></td>
                                        </tr>
                                    </tfoot>
                                )}
                                {report?.type === 'Pareto Chart Report' && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="5">Total Units/Values:  <Badge variant="primary"> {chart.reduce((total, item) => total + Number(item.value), 0)} </Badge></td>
                                        </tr>
                                        <tr>
                                            <td colSpan="5" style={{ color: 'green' }}>Vital Few @ 80%: 
                                            {(() => {
                                                const total = chart.reduce((total, item) => total + Number(item.value), 0);
                                                const eightyPercent = total * 0.8;
                                                return Math.round(eightyPercent);
                                            })()}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </Table>
                        </Card.Body>
                    </Card>
                )}

                {actionItems.length > 0 && (
                    <div className="action-items">
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
        </div>
    </Container>
  );
};

export default BarChartComponent;