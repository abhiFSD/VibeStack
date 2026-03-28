import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Alert, Container, Card, Button, Image, ListGroup, ListGroupItem, Badge, Row, Col } from 'react-bootstrap';
import { API, graphqlOperation } from 'aws-amplify';
import { getReport, getVsm, actionItemsByReportID } from '../../graphql/queries';
import { onUpdateVsm, onCreateActionItems, onUpdateActionItems, onDeleteActionItems } from '../../graphql/subscriptions';
import VsmImage from '../../assets/lean-tools/light/value_stream_mapping.png';
import { Storage } from 'aws-amplify';
import triangleImage from '../../assets/triangle.png';
import { generatePdfViaApi } from '../../utils/apiPdfGenerator';
import UserAvatar from '../shared/UserAvatar';
import { fetchUserEmails } from '../../utils/reportHelper';
import * as queries from '../../graphql/queries';

const generateID = () => {
    return Date.now() + '_' + Math.round(Math.random() * 1000000);
};

const ReportVsmPdf = ({ reportId: propReportId, fromProject = false, projectDetails, onCaptureImages, previewMode = false, previewData = null }) => {
    const { reportId: urlReportId } = useParams();
    const effectiveReportId = propReportId || urlReportId;

    const initialProcess = {
        processID: generateID(),
        Name: '',
        CycleTime: '0',
        CycleTimeUnit: 'minutes',
        CycleEfficiency: '',
        Attributes: [],
        Note: '',
        CycleTimeIsSumOfAttributes: true,
        Images: [],
        Waste: []
    };

    const initialInventory = {
        WaitTimeOrInventory: '0',
        WaitTimeOrInventoryUnit: 'minutes',
        waste: []
    };

    const [retries, setRetries] = useState(0);
    const MAX_RETRIES = 3;

    const [reportData, setReportData] = useState(null);
    const [vsmProcess, setVsmProcess] = useState(null);
    const [vsmInventory, setVsmInventory] = useState(null);
    const [imageUrlsMap, setImageUrlsMap] = useState({});
    const [vsmData, setVsmData] = useState(null);
    const [error, setError] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [actionItemsData, setActionItemsData] = useState([]);
    const [loadedImages, setLoadedImages] = useState({});
    const [emailMap, setEmailMap] = useState(new Map());

    // Update allImagesLoaded check to properly verify all images
    const allImagesLoaded = useMemo(() => {
        // Check process images
        const processImagesLoaded = vsmProcess?.every(process => 
            !process.Images?.length || // Skip if no images
            (imageUrlsMap[process.processID] && loadedImages[process.processID])
        ) ?? true;

        // Check action item images
        const actionItemImagesLoaded = actionItemsData?.every(item =>
            !item.attachments?.length || // Skip if no attachments
            (imageUrlsMap[item.id] && loadedImages[item.id])
        ) ?? true;

        return processImagesLoaded && actionItemImagesLoaded;
    }, [vsmProcess, actionItemsData, imageUrlsMap, loadedImages]);

    const handleImageLoad = (id) => {
        console.log('Image loaded for ID:', id);
        setLoadedImages(prevState => ({
            ...prevState,
            [id]: true
        }));
    };

    const fetchSignedUrlForAttachment = async (attachmentName) => {
        try {
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
            console.error('Error fetching signed URL for attachment:', attachmentName, err);
            return null;
        }
    };

    useEffect(() => {
        if (previewMode) {
            // In preview mode, use the image URLs directly from sample data
            const allUrlsMap = {};
            
            if (vsmProcess) {
                for (let process of vsmProcess) {
                    if (process.Images && process.Images.length > 0) {
                        allUrlsMap[process.processID] = process.Images;
                    }
                }
            }
            
            if (actionItemsData) {
                for (const item of actionItemsData) {
                    if (item.attachments && item.attachments.length > 0) {
                        const urls = item.attachments.map(attachment => attachment.url);
                        allUrlsMap[item.id] = urls;
                    }
                }
            }
            
            setImageUrlsMap(allUrlsMap);
            
            // Also set all images as loaded for preview mode
            const loadedState = {};
            Object.keys(allUrlsMap).forEach(id => {
                loadedState[id] = true;
            });
            setLoadedImages(loadedState);
            
            console.log("Set preview image URLs:", allUrlsMap);
            return;
        }

        const fetchAllSignedUrls = async () => {
            const allUrlsMap = {};

            // Fetch process images
            if (vsmProcess) {
                for (let process of vsmProcess) {
                    const signedUrls = await fetchSignedUrlsForProcess(process);
                    allUrlsMap[process.processID] = signedUrls;
                }
            }

            // Fetch action item attachments
            for (const item of actionItemsData) {
                if (item.attachments && item.attachments.length > 0) {
                    const urls = await Promise.all(
                        item.attachments.map(attachment => fetchSignedUrlForAttachment(attachment))
                    );
                    allUrlsMap[item.id] = urls.filter(url => url !== null);
                }
            }

            setImageUrlsMap(allUrlsMap);
            console.log("Set all image URLs:", allUrlsMap);
        };

        if (vsmProcess || actionItemsData.length > 0) {
            fetchAllSignedUrls();
        }

        // Cleanup function
        return () => {
            // Release the Object URLs to free up resources
            for (let id in imageUrlsMap) {
                for (let url of imageUrlsMap[id]) {
                    URL.revokeObjectURL(url);
                }
            }
        };
    }, [vsmProcess, actionItemsData, previewMode]);

    const reportRef = useRef(null);
    const gridRef = useRef(null);
    const inventoryRef = useRef(null);

    const statusText = {
        0: 'To Do',
        1: 'In Progress',
        2: 'In Review',
        3: 'Done'
      };

    const bodyStyle ={
        // marginLeft: '20px', 
        // marginRight: "20px",
    }

    const colStyle ={
        marginLeft: '20px', 
        marginRight: "20px",
        marginBottom: "20px",
        marginTop: "20px",
      }
    
      const buttonStyle = {
        marginRight: "20px",
        padding: "12px 25px",  // Increase padding for larger button size
        fontSize: "28px",      // Increase font size for larger text
        borderRadius: "8px",   // Optional: rounded corners
    }

        const cardBodyStyle = {
        backgroundColor: '#f5f5f5', // Light grey color
        padding: '20px'
        };

        const cardStyle = {
        marginBottom: '20px',
        border: '1px solid rgba(0,0,0,.125)',
        width: '100%'
        };

        const containerStyle = {
            maxWidth: '1024px',
            margin: '0 auto',
            padding: '20px'
        };

        const reducedFontSize ={
            fontSize: '0.6rem',
            paddingTop: 10,
        }

        const liGroup ={
            padding: 0,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'normal',
            width: '100%',
            boxSizing: 'border-box'
        }

        const cardHeaderStyle = {
            backgroundColor: '#009688', // Blue color
            color: 'white', // Text color
            padding: '10px',
            display: "flex",
            alignItems: "center",
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

        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            if (previewMode) {
                // Skip fetching action items in preview mode - data is already set
                return;
            }

            const fetchActionItemsByReportId = async () => {
                try {
                    if (effectiveReportId) {
                        let allActionItems = [];
                        let nextToken = null;
                        
                        do {
                            const response = await API.graphql({
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
                            
                            const items = response.data.listActionItems.items;
                            allActionItems = [...allActionItems, ...items];
                            nextToken = response.data.listActionItems.nextToken;
                        } while (nextToken);
                        
                        // Sort all items by creation date
                        allActionItems = allActionItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        console.log(`Fetched ${allActionItems.length} action items for report ${effectiveReportId}`);
                        setActionItemsData(allActionItems);
                    }
                } catch (error) {
                    // Silently handle auth errors for public access
                    if (error.message && error.message.includes('byteLength')) {
                        console.log('Authentication required for action items - silencing error');
                        return;
                    }
                    console.error("Error fetching action items:", error);
                    if (error.errors) {
                        console.error("GraphQL Errors:", error.errors);
                    }
                }
            };

            // Fetch action items initially
            fetchActionItemsByReportId();

            // Set up subscription
            const subscription = API.graphql(
                graphqlOperation(onCreateActionItems)
            ).subscribe({
                next: ({ value }) => {
                    if (value.data.onCreateActionItems.reportID === effectiveReportId) {
                        fetchActionItemsByReportId();
                    }
                }
            });

            const updateSubscription = API.graphql(
                graphqlOperation(onUpdateActionItems)
            ).subscribe({
                next: ({ value }) => {
                    if (value.data.onUpdateActionItems.reportID === effectiveReportId) {
                        fetchActionItemsByReportId();
                    }
                }
            });

            const deleteSubscription = API.graphql(
                graphqlOperation(onDeleteActionItems)
            ).subscribe({
                next: ({ value }) => {
                    if (value.data.onDeleteActionItems.reportID === effectiveReportId) {
                        fetchActionItemsByReportId();
                    }
                }
            });

            // Clean up subscriptions
            return () => {
                subscription.unsubscribe();
                updateSubscription.unsubscribe();
                deleteSubscription.unsubscribe();
            };
        }, [effectiveReportId, previewMode]);

        useEffect(() => {
            if (previewMode) {
                // Skip email fetching in preview mode
                return;
            }

            const fetchEmails = async () => {
                // Collect all unique assignee IDs
                const allAssignees = new Set();
                
                // Add assignees from action items
                actionItemsData.forEach(item => {
                    if (item.assignees && item.assignees.length > 0) {
                        item.assignees.forEach(id => allAssignees.add(id));
                    }
                });
                
                // Add assignees from the report
                if (reportData?.assignedMembers && reportData.assignedMembers.length > 0) {
                    console.log('Report assigned members:', reportData.assignedMembers);
                    reportData.assignedMembers.forEach(id => allAssignees.add(id));
                }
                
                // Convert Set to Array
                const assigneeArray = Array.from(allAssignees);
                console.log('All assignees to fetch:', assigneeArray);
                console.log('Organization ID:', reportData?.organizationID);
                
                if (assigneeArray.length > 0 && reportData?.organizationID) {
                    const emails = await fetchUserEmails(assigneeArray, reportData.organizationID);
                    console.log('Received email map:', emails);
                    setEmailMap(emails);
                }
            };
            
            if (reportData && (actionItemsData.length > 0 || (reportData.assignedMembers && reportData.assignedMembers.length > 0))) {
                fetchEmails();
            }
        }, [reportData, actionItemsData, previewMode]);

    const generateCombinedPDF = async () => {
        if (!allImagesLoaded) {
            console.warn('Not all images are loaded yet');
            return;
        }

        setIsGeneratingPDF(true);

        try {
            // Get the current URL of the page
            const currentUrl = window.location.href;
            
            // Debug log
            console.log('VSM PDF generation payload:', {
                url: currentUrl,
                allImagesLoaded,
                vsmProcess: !!vsmProcess,
                vsmInventory: !!vsmInventory,
                imageUrlsMap: Object.keys(imageUrlsMap)
            });
            
            // Call the API to generate the PDF
            await generatePdfViaApi(currentUrl);
            
            console.log('PDF generation initiated successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            setError(error.message || 'Failed to generate PDF');
        } finally {
            setIsGeneratingPDF(false);
        }
    };
        
           

    const attributeOptions = [
        { label: 'Value Added', color: 'green' },
        { label: 'Value Enabled', color: '#ffc107' },
        { label: 'Non-value Added', color: 'red' }
    ];

    const getColorForStatus = (status) => {
        const option = attributeOptions.find(opt => opt.label === status);
        return option ? option.color : '#6c757d';  // fallback to Bootstrap 'secondary' if not found
    }

    const fetchSignedUrlsForProcess = async (process) => {
        const signedUrls = [];
        if (process && process.Images) {
            for (let imageName of process.Images) {
                try {  
                    let signedUrl;
                    try {
                        signedUrl = await Storage.get(imageName);
                    } catch (authError) {
                        // Fallback to direct public S3 URL
                        const cleanKey = imageName.startsWith('public/') ? imageName : `public/${imageName}`;
                        signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
                    }
                    
                    // Fetch the signed URL as a blob
                    const response = await fetch(signedUrl, { method: 'GET', mode: 'cors' });
                    const blob = await response.blob();
                    const objectURL = URL.createObjectURL(blob);
    
                    signedUrls.push(objectURL);
                    console.log('Fetched signed URL for image:', imageName, objectURL);
    
                } catch (err) {
                    console.error('Error fetching signed URL for image:', imageName, err);
                }
            }
        } else {
            console.warn("Process does not have images:", process);
        }
        return signedUrls;
    };
    

    const convertToMinutes = (value, unit) => {
        switch (unit) {
            case "seconds":
                return value / 60;
            case "minutes":
                return value; // Value is already in minutes
            case "hours":
                return value * 60;
            case "days":
                return value * 60 * 24;
            case "weeks":
                return value * 60 * 24 * 7;
            case "months":
                return value * 60 * 24 * 30; // Assuming an average month has 30 days
            case "years":
                return value * 60 * 24 * 365; // Not accounting for leap years
            default:
                return value;
        }
    };  

    const convertTime = (value, fromUnit, toUnit) => {
        // First, convert everything to a common unit, let's say minutes
        const valueInMinutes = convertToMinutes(value, fromUnit);
        
        // Then, convert the value in minutes to the desired unit
        switch (toUnit) {
            case "seconds":
                return valueInMinutes * 60;
            case "minutes":
                return valueInMinutes;
            case "hours":
                return valueInMinutes / 60;
            case "days":
                return valueInMinutes / (60 * 24);
            case "weeks":
                return valueInMinutes / (60 * 24 * 7);
            case "months":
                return valueInMinutes / (60 * 24 * 30); // Assuming an average month has 30 days
            case "years":
                return valueInMinutes / (60 * 24 * 365); // Not accounting for leap years
            default:
                return valueInMinutes;
        }
    };

    const calculateCycleTime = (card) => {
        console.log("Processing card:", card);
    
        if (!card || !card.Attributes) return 0;
        
        if (card.CycleTimeIsSumOfAttributes) {
            // Filter out attributes with units not in the range of seconds to years
            const validUnits = ["seconds", "minutes", "hours", "days", "weeks", "months", "years"];
            const validAttributes = card.Attributes.filter(attr => validUnits.includes(attr.unit));
    
            console.log("Valid attributes for summation:", validAttributes);
            
            // Sum up the attribute values after converting them to the unit specified in card.data.CycleTimeUnit
            const totalCycleTime = validAttributes.reduce((acc, attr) => {
                return acc + convertTime(Number(attr.value), attr.unit, card.CycleTimeUnit);
            }, 0);
            
            console.log("Calculated total cycle time:", totalCycleTime);
    
            return Math.round(totalCycleTime * 100) / 100; // Correct rounding to two decimal places
        } else {
            console.log("Using direct cycle time value:", Number(card.CycleTime));
            return Number(card.CycleTime);
        }
    };

    const calculateCycleEfficiency = (card) => {
        // If there are no attributes, set cycle efficiency to 0
        if (!card.Attributes || card.Attributes.length === 0) return 0;
    
        const nonValueAddedAttributes = card.Attributes.filter(attr => attr.status === "Non-value Added");
    
        // If all attributes are "Non-value Added"
        if (nonValueAddedAttributes.length === card.Attributes.length) return 0;
    
        // If there are no "Non-value Added" attributes
        if (nonValueAddedAttributes.length === 0) return 100;
    
        const cycleTimeInMinutes = convertToMinutes(parseFloat(card.CycleTime), card.CycleTimeUnit);
        if (cycleTimeInMinutes === 0) return 0;  // To avoid division by zero later
    
        // Calculate the sum of Value-added time
        const sumValueAddedTime = card.Attributes
            .filter(attr => attr.status === "Value Added")
            .reduce((acc, attr) => acc + convertToMinutes(Number(attr.value), attr.unit), 0);
    
        // Calculate the sum of Value-enabled time (assuming a status named "Value Enabled")
        const sumValueEnabledTime = card.Attributes
            .filter(attr => attr.status === "Value Enabled")
            .reduce((acc, attr) => acc + convertToMinutes(Number(attr.value), attr.unit), 0);
    
        // Calculate the sum of Non-value time (you already have nonValueAddedAttributes, but to match the pattern, I'm recalculating it)
        const sumNonValueTime = nonValueAddedAttributes
            .reduce((acc, attr) => acc + convertToMinutes(Number(attr.value), attr.unit), 0);
    
        // Now calculate efficiency
        const numerator = sumValueAddedTime + sumValueEnabledTime;
        const denominator = numerator + sumNonValueTime;
    
        // To avoid division by zero if denominator is 0
        if (denominator === 0) return 0;
    
        const efficiency = (numerator / denominator) * 100;
    
        return Math.min(100, parseFloat(efficiency.toFixed(2)));  // Return efficiency as percentage rounded to two decimal places
    };
    

    useEffect(() => {
        if (previewMode && previewData) {
            // Use preview data instead of fetching from API
            setReportData(previewData.reportData);
            setVsmProcess(previewData.vsmProcess);
            setVsmInventory(previewData.vsmInventory);
            setVsmData(previewData.vsmData);
            setActionItemsData(previewData.actionItemsData);
            setIsLoading(false);
            return;
        }

        const fetchReport = async () => {
            try {
                const reportData = await API.graphql(
                    graphqlOperation(getReport, { id: effectiveReportId })
                );
                
                if (reportData.data.getReport) {
                    setReportData(reportData.data.getReport);
                    console.log("Fetched report:", reportData.data.getReport);
                } else if (retries < MAX_RETRIES) {
                    setRetries(prevRetries => prevRetries + 1);
                    setTimeout(fetchReport, 2000);
                } else {
                    console.error("Report not found with the provided ID:", effectiveReportId);
                }
            } catch (err) {
                console.error("Error fetching the report:", err);
                setError("Error fetching the report. Please try again.");
            }
        };

        if (!previewMode) {
            fetchReport();
        }
    }, [effectiveReportId, retries, previewMode, previewData]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const vsmData = await API.graphql({
                query: queries.listVsms,
                variables: {
                    filter: { 
                        reportID: { eq: effectiveReportId },
                        _deleted: { ne: true }
                    }
                }
            });
            
            const existingEntries = vsmData.data.listVsms.items.filter(item => !item._deleted);
            const vsmItem = existingEntries[0];

            if (vsmItem) {
                console.log("Raw VSM item from API:", vsmItem);
                const processCards = JSON.parse(vsmItem.process || '[]');
                const inventoryCards = JSON.parse(vsmItem.inventory || '[]');
                
                // Parse JSON strings for summaryData and demandData
                let parsedVsmItem = {
                    ...vsmItem,
                    process: processCards,
                    inventory: inventoryCards
                };
                
                if (vsmItem.summaryData) {
                    try {
                        console.log("Raw summaryData:", vsmItem.summaryData);
                        parsedVsmItem.summaryData = JSON.parse(vsmItem.summaryData);
                        console.log("Parsed summaryData:", parsedVsmItem.summaryData);
                    } catch (error) {
                        console.error("Error parsing summaryData:", error);
                        parsedVsmItem.summaryData = {};
                    }
                } else {
                    console.log("No summaryData found in the VSM item");
                    parsedVsmItem.summaryData = {};
                }
                
                if (vsmItem.demandData) {
                    try {
                        console.log("Raw demandData:", vsmItem.demandData);
                        parsedVsmItem.demandData = JSON.parse(vsmItem.demandData);
                        console.log("Parsed demandData:", parsedVsmItem.demandData);
                    } catch (error) {
                        console.error("Error parsing demandData:", error);
                        parsedVsmItem.demandData = {};
                    }
                } else {
                    console.log("No demandData found in the VSM item");
                    parsedVsmItem.demandData = {};
                }
                
                setVsmProcess(processCards);
                setVsmInventory(inventoryCards);
                setVsmData(parsedVsmItem);
                console.log("Final parsed VSM data:", parsedVsmItem);
            } else {
                console.log("No VSM item found for reportID:", effectiveReportId);
            }
        } catch (error) {
            setError(error.message);
            console.error("Error fetching VSM data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (effectiveReportId && !previewMode) {
            fetchData();
        }
    }, [effectiveReportId, previewMode]);
       

    let processCount = 0;
    
    const truncateNote = (note) => {
        if (!note) return "";
    
        if (note.length <= 40) return note;
    
        return `${note.substring(0, 40)}...`; // Return the first 20 characters and append ...
    };
    
    const MAX_ITEMS_PER_CARD = 3;

    const stacked = false; 

    const renderInventoryCards = (startIndex) => {
        if (!Array.isArray(vsmInventory)) {
            console.warn("vsmInventory is not an array:", vsmInventory);
            return null;
        }

        const endIndex = stacked ? vsmInventory.length : startIndex + MAX_ITEMS_PER_CARD;
        
        return (
            <Card style={{
                ...cardStyle,
                display: 'flex',
                flexDirection: stacked ? 'column' : 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                paddingBottom: 20,
            }} className="capture-card">
                {vsmInventory.slice(startIndex, endIndex).map((inventory, index) => {
                    if (!inventory) {
                        console.warn("Inventory item is null or undefined at index:", index);
                        return null;
                    }
                    const actualIndex = startIndex + index;
                    const relatedProcess = vsmProcess ? vsmProcess[actualIndex] : null;
    
                    return (
                        <React.Fragment key={actualIndex}>
                            <div style={{ marginTop: 10, marginRight: stacked ? 'auto' : 0, width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ border: '1px solid #e0e0e0', borderRadius: 5, marginRight: 5, marginLeft: 5 }}>
                                    <div className="card-header" style={{ textAlign: 'center' }}>
                                        <img src={triangleImage} alt="Triangle" style={{ width: '50px', height: '50px' }} />
                                    </div>
                                    <div className="card-body" style={{ padding: 5 }}>
                                        <div className="card-text">
                                            {inventory.WaitTimeOrInventory || 0} {inventory.WaitTimeOrInventoryUnit}
                                        </div>
                                        <div className="card-text">
                                            Wait Time or Inventory
                                        </div>
                                        {/* Rendering the list of Wastes */}
                                        {inventory.waste && inventory.waste.length > 0 && (
                                            <>
                                                <div style={{ marginTop: 10, fontWeight: 'bold' }}>Waste:</div>
                                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                                    {inventory.waste.join(', ')}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: 'auto', marginBottom: 30 }}>
                                    <div className="capture-card mb-3" style={{ width: '100%', borderRadius: 0, borderBottom: '1px solid #000', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
                                        <div className="card-body" style={{ 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            justifyContent: 'center',
                                            padding: '0 2px'
                                        }}>
                                            <p style={{ 
                                                textAlign: 'center', 
                                                margin: '-15px 0 10px 0',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                width: '100%'
                                            }}>
                                                {inventory.WaitTimeOrInventory || 0} {inventory.WaitTimeOrInventoryUnit}
                                            </p>
                                            <p style={{ 
                                                textAlign: 'center', 
                                                margin: '0 0 0 0', 
                                                color: 'red',
                                            }}>
                                                wait time or inventory
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {relatedProcess && (
                                <div style={{ marginTop: 10, marginRight: stacked ? 'auto' : 0, width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 5 }}>
                                    <div style={{ border: '1px solid #e0e0e0', borderRadius: 5 }}>
                                        <div className="card-header" style={{ backgroundColor: '#00897b', color: '#FFFFFF' }}>
                                            {`Process ${++processCount}`}
                                        </div>
                                        <div className="card-body" style={{ padding: 5, minHeight: '400px' }}>
                                            <ul className="list-group list-group-flush">
                                                <li style={ liGroup } className="list-group-item">Name: {relatedProcess.Name}</li>
                                                <li style={ liGroup } className="list-group-item">Cycle Time: {calculateCycleTime(relatedProcess) || 0} {relatedProcess.CycleTimeUnit || 'seconds'}</li>
                                                <li style={ liGroup } className="list-group-item">Cycle Efficiency: {calculateCycleEfficiency(relatedProcess) || 0} %</li>
                                                <li style={ liGroup } className="list-group-item">Is Cycle Time Sum of Attributes? {relatedProcess.CycleTimeIsSumOfAttributes ? "Yes" : "No"}</li>
                                                <li style={ liGroup } className="list-group-item">Notes: {truncateNote(relatedProcess.Note)}</li>
                                            </ul>
                                            <div className="mt-3" style={{ fontWeight: 'bold' }}>Attributes:</div>
                                            {relatedProcess.Attributes && (
                                                <ul className="list-group list-group-flush">
                                                    {relatedProcess.Attributes.slice(0, 2).map((attr, attrIndex) => (
                                                        <li style={ liGroup } className="list-group-item" key={attr.id}>
                                                            <div style={{
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: '100%',
                                                                width: '100%',
                                                                lineHeight: '1.3'
                                                            }}>
                                                                {attr.name.length > 25 ? `${attr.name.substring(0, 25)}...` : attr.name}
                                                            </div>
                                                            <div 
                                                                style={{
                                                                    backgroundColor: getColorForStatus(attr.status),
                                                                    color: 'white',
                                                                    borderRadius: '5px',
                                                                    padding: '2px 5px',
                                                                    display: 'inline-block',
                                                                    fontSize: '0.6rem',
                                                                    fontWeight: '400',
                                                                    textAlign: 'center',
                                                                    whiteSpace: 'nowrap',
                                                                    verticalAlign: 'baseline'
                                                                }}
                                                                className="ml-2"
                                                            >
                                                                {attr.status}
                                                            </div>
                                                            <div style={{
                                                                wordBreak: 'break-word',
                                                                overflowWrap: 'break-word'
                                                            }}>
                                                                {attr.value} {attr.unit}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
    
                                            {relatedProcess.Images && relatedProcess.Images.length > 0 && imageUrlsMap[relatedProcess.processID] && (
                                                <div>
                                                    <div className="mt-3" style={{ fontWeight: 'bold' }}>Images:</div>
                                                    <img 
                                                        src={imageUrlsMap[relatedProcess.processID][0]} 
                                                        alt={`Related Process Image 0`} 
                                                        style={{ width: '100%', height: '200px', marginRight: '10px', marginTop: 5, objectFit: 'contain' }} 
                                                        onLoad={() => handleImageLoad(relatedProcess.processID)}
                                                    />
                                                </div>
                                            )}
                                            <div>For Full Attributes,images, wastes and notes see below.</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'auto', marginBottom: 25, }}>
                                    <div className="mb-3" style={{ marginTop: 30, width: '220px', borderRadius: 0, borderLeft: '1px solid #000', borderRight: '1px solid #000', borderTop: '1px solid #000', borderBottom: 'none' }}>
                                            <div className="card-body">
                                                <p style={{ textAlign: 'center', margin: '-1px 0px -39px', color: 'green' }}>Cycle Time</p>
                                                <p style={{ textAlign: 'center', margin: '10px 0 0 0' }}>{calculateCycleTime(relatedProcess) || 0} {relatedProcess.CycleTimeUnit || 'seconds'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </Card>
        );
    };    

    useEffect(() => {
        if (previewMode) {
            // Skip loading data in preview mode - data is already set
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                await fetchData();
            } catch (err) {
                setError(err.message);
                console.error("Error loading VSM data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (effectiveReportId) {
            loadData();
        }
    }, [effectiveReportId, previewMode]);

    const renderReportInfoHeader = () => {
        // Get all assignees from report data
        const assignedMembers = reportData?.assignedMembers || [];
        
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
                                        {reportData?.ownerEmail && (
                                            <>
                                                <UserAvatar 
                                                    email={reportData.ownerEmail}
                                                    organizationID={reportData?.organizationID}
                                                    size={40}
                                                    style={{ marginRight: '10px' }}
                                                    isOwner={true}
                                                />
                                                <span>{reportData.ownerEmail}</span>
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
                                                        organizationID={reportData?.organizationID}
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
                                {projectDetails && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <h6 style={{ color: '#444', fontWeight: 'bold' }}>Project</h6>
                                        <div style={{ padding: '8px', backgroundColor: '#e9f5f2', borderRadius: '4px' }}>
                                            <div><strong>Name:</strong> {projectDetails.name}</div>
                                            {projectDetails.description && <div><strong>Description:</strong> {projectDetails.description}</div>}
                                            <div><strong>Status:</strong> {projectDetails.status}</div>
                                            {projectDetails.createdAt && (
                                                <div><strong>Created:</strong> {new Date(projectDetails.createdAt).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <h6 style={{ color: '#444', fontWeight: 'bold' }}>Report Details</h6>
                                    <div style={{ padding: '8px', backgroundColor: '#e9f5f2', borderRadius: '4px' }}>
                                        <div><strong>Type:</strong> {reportData?.type}</div>
                                        <div><strong>Created:</strong> {reportData?.createdAt && new Date(reportData.createdAt).toLocaleDateString()}</div>
                                        {reportData?.updatedAt && reportData.updatedAt !== reportData.createdAt && (
                                            <div><strong>Last Updated:</strong> {new Date(reportData.updatedAt).toLocaleDateString()}</div>
                                        )}
                                        <div><strong>Status:</strong> {reportData?.completed ? 'Completed' : 'In Progress'}</div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </div>
        );
    };

    const computeTotalCycleTime = (process) => {
        if (!process) return 0;
        return process.reduce((acc, card) => acc + calculateCycleTime(card), 0);
    };

    const totalInventoryTime = (inventories) => {
        if (!inventories) return 0;
        return inventories.reduce((acc, inventory) => {
            return acc + convertTime(parseFloat(inventory.WaitTimeOrInventory || 0), inventory.WaitTimeOrInventoryUnit || 'minutes', 'minutes');
        }, 0);
    };

    const computeSummaryData = () => {
        if (!vsmProcess || !vsmInventory) {
            return null;
        }

        try {
            const rawCycleTimeValue = computeTotalCycleTime(vsmProcess);
            const rawInventoryTimeValue = totalInventoryTime(vsmInventory);
            const rawLeadTimeValue = rawCycleTimeValue + rawInventoryTimeValue;

            return {
                totalLeadTime: {
                    value: convertTime(rawLeadTimeValue, 'minutes', 'minutes').toFixed(2),
                    unit: 'minutes'
                },
                totalCycleTime: {
                    value: convertTime(rawCycleTimeValue, 'minutes', 'minutes').toFixed(2),
                    unit: 'minutes'
                },
                cycleTimePercentage: rawLeadTimeValue ? (rawCycleTimeValue / rawLeadTimeValue * 100).toFixed(2) : "0.00",
                totalWaitTimeOrInventory: {
                    value: convertTime(rawInventoryTimeValue, 'minutes', 'minutes').toFixed(2),
                    unit: 'minutes'
                },
                waitTimeOrInventoryDelayPercentage: rawLeadTimeValue ? (rawInventoryTimeValue / rawLeadTimeValue * 100).toFixed(2) : "0.00"
            };
        } catch (error) {
            console.error('Error computing summary data:', error);
            return null;
        }
    };

    // Add loading and error states to your render method
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger">
                Error loading data: {error}
            </Alert>
        );
    }

    return (
        <Container style={containerStyle} className="vsm-component">
            {isGeneratingPDF && (
                <Alert variant="success">
                    <Alert.Heading>PDF is generating, please wait it can take a moment..</Alert.Heading>
                </Alert>
            )}
            
            {!fromProject && (
                <>
                    <div className="mb-4">
                        <Button 
                            style={buttonStyle} 
                            onClick={() => generateCombinedPDF()}
                            disabled={isGeneratingPDF || !allImagesLoaded}
                        >
                            {isGeneratingPDF ? 'Generating PDF...' : 
                             !allImagesLoaded ? 'Loading images...' : 
                             'Export Report as PDF'}
                        </Button>
                        <h6>Please allow all images to appear before exporting to PDF.</h6>
                    </div>
                </>
            )}

            {error && <Alert variant="danger">{error}</Alert>}
            
            <div className="portrait" ref={reportRef}>
                <div className="report-page">
                    {reportData && renderReportInfoHeader()}
                    {reportData && 
                        <Card style={cardStyle} className="capture-card">
                            <Card.Header style={{ ...cardHeaderStyle, display: 'flex', justifyContent: 'center'}}>
                                <img src={VsmImage} alt="VSM" style={{ marginRight: '10px', height: '25px' }} />
                                {reportData.name} | Created At: {new Date(reportData.createdAt).toLocaleString()} 
                            </Card.Header>
                        </Card>
                    }
                   

                    {/* Summary Data Card */}
                    {vsmData && (
                        <Card style={cardStyle} className="capture-card">
                            <div className="card-header" style={cardHeaderStyle}>
                                SUMMARY DATA
                            </div>
                            <div className="card-body" style={cardBodyStyle}>
                                <div className="alert alert-info mb-4">
                                    Please note that when converting time to seconds or minutes, we round to the nearest whole number to keep the display simple. 
                                    This rounding can cause slight discrepancies in the total values. If you need more precise values, please consider using a unit 
                                    of time that does not require rounding.
                                </div>

                                {(() => {
                                    const summaryData = computeSummaryData();
                                    if (!summaryData) return null;

                                    return (
                                        <>
                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-3">Total Lead Time:</span>
                                                    <span>{summaryData.totalLeadTime.value} {summaryData.totalLeadTime.unit}</span>
                                                </div>
                                            </div>

                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-3">Total Cycle Time:</span>
                                                    <span>{summaryData.totalCycleTime.value} {summaryData.totalCycleTime.unit}</span>
                                                </div>
                                            </div>

                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-3">Cycle Time Percentage:</span>
                                                    <span>{summaryData.cycleTimePercentage}%</span>
                                                </div>
                                            </div>

                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-3">Total Wait Time or Inventory:</span>
                                                    <span>{summaryData.totalWaitTimeOrInventory.value} {summaryData.totalWaitTimeOrInventory.unit}</span>
                                                </div>
                                            </div>

                                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center">
                                                    <span className="me-3">Wait Time or Inventory Delay Percentage:</span>
                                                    <span>{summaryData.waitTimeOrInventoryDelayPercentage}%</span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </Card>
                    )}
                    

                    {/* Show additional sections when VSM data exists (matching main report logic) */}
                    {vsmData && (
                        <>
                            {/* Demand Data Card */}
                            <Card style={cardStyle} className="capture-card">
                                <div className="card-header" style={cardHeaderStyle}>
                                    TOTAL DEMAND/TARGET DATA
                                </div>
                                <div className="card-body" style={cardBodyStyle}>
                                    {vsmData.demandData && Object.keys(vsmData.demandData).length > 0 ? (
                                        <>
                                            <p>Total Demand/Volume: {vsmData.demandData.totalDemand || 'N/A'}</p>
                                            <p>Time to Produce: {vsmData.demandData.timeToProduce || 'N/A'} {vsmData.demandData.timeToProduceUnit || ''}</p>
                                            <p>Takt Time/Target: {vsmData.demandData.totalDemand && vsmData.demandData.timeToProduce ? 
                                                (Number(vsmData.demandData.timeToProduce) / Number(vsmData.demandData.totalDemand)).toFixed(2) + ' ' + (vsmData.demandData.timeToProduceUnit || '') : 'N/A'}</p>
                                        </>
                                    ) : (
                                        <p>No demand data available</p>
                                    )}
                                </div>
                            </Card>

                            {/* Information Flow Card */}
                            <Card style={cardStyle} className="capture-card">
                                <div className="card-header" style={cardHeaderStyle}>
                                    INFORMATION FLOW
                                </div>
                                <div className="card-body" style={cardBodyStyle}>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {vsmData.informationFlow || 'No information flow data available'}
                                    </div>
                                </div>
                            </Card>

                            {/* Kaizen Project Card */}
                            <Card style={cardStyle} className="capture-card">
                                <div className="card-header" style={cardHeaderStyle}>
                                    KAIZEN PROJECT
                                </div>
                                <div className="card-body" style={cardBodyStyle}>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {vsmData.kaizenProject || 'No kaizen project data available'}
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            <div style={reducedFontSize} ref={gridRef} className="landscape">
                {(() => {
                    if (!vsmInventory || vsmInventory.length === 0) return null;
                    
                    const pages = [];
                    const totalItems = vsmInventory.length;
                    
                    for (let i = 0; i < totalItems; i += MAX_ITEMS_PER_CARD) {
                        pages.push(renderInventoryCards(i));
                    }
                    
                    return pages;
                })()}
            </div>

            <div className="portrait">
                <div ref={inventoryRef} className="inventory-section">
                    <div>
                        {(vsmInventory || []).map((inventory, index) => {
                        const process = vsmProcess ? vsmProcess[index] : null;

                        const hasWaitTimeOrInventory = inventory.WaitTimeOrInventory;
                        const hasWaste = inventory.waste && inventory.waste.length > 0;
                        
                        if (!process) {
                            // Render just the inventory card if there's no associated process
                            return (
                                <Card style={cardStyle} key={index} className="capture-card">
                                    <Card.Header style={cardHeaderStyle}>
                                        {`Inventory ${index + 1}`}
                                    </Card.Header>
                                    <Card.Body>
                                    {hasWaitTimeOrInventory && (
                                        <div>
                                            <strong>Wait Time Or Inventory:</strong> {inventory.WaitTimeOrInventory} {inventory.WaitTimeOrInventoryUnit}
                                        </div>
                                    )}
                                        {inventory.waste && inventory.waste.length > 0 && (
                                            <>
                                                <div style={{ marginTop: 10, fontWeight: 'bold' }}>Waste:</div>
                                                <div style={{ whiteSpace: 'pre-wrap' }}>
                                                    {inventory.waste.join(', ')}
                                                </div>
                                            </>
                                        )}
                                        {!hasWaitTimeOrInventory && !hasWaste && (
                                            <div>No Data available</div>
                                        )}
                                    </Card.Body>
                                </Card>
                            );
                        }

                        const hasAttributes = process.Attributes && process.Attributes.length > 0;
                        const hasImages = process.Images && process.Images.length > 0 && imageUrlsMap[process.processID];

                        
                            return (
                                <React.Fragment key={index}>
                                    {/* Render Inventory Card */}
                                    <Card style={cardStyle} className="capture-card">
                                        <Card.Header style={cardHeaderStyle}>
                                            {`Inventory ${index + 1}`}
                                        </Card.Header>
                                        <Card.Body>
                                        {hasWaitTimeOrInventory && (
                                            <div>
                                                <strong>Wait Time Or Inventory:</strong> {inventory.WaitTimeOrInventory} {inventory.WaitTimeOrInventoryUnit}
                                            </div>
                                        )}
                                            {inventory.waste && inventory.waste.length > 0 && (
                                                <>
                                                    <div style={{ marginTop: 10, fontWeight: 'bold' }}>Waste:</div>
                                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                                        {inventory.waste.join(', ')}
                                                    </div>
                                                </>
                                            )}
                                            {!hasWaitTimeOrInventory && !hasWaste && (
                                                <div>No Data available</div>
                                            )}
                                        </Card.Body>
                                    </Card>

                                    {/* Render the related Process Card */}
                                    <Card style={cardStyle} className="capture-card">
                                        <Card.Header style={cardHeaderStyle}>
                                            {process.Name}
                                        </Card.Header>
                                        <Card.Body>
                                            <div style={{ fontWeight: 'bold' }}>Attributes:</div>
                                            <Table bordered hover responsive>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Status</th>
                                                        <th>Value</th>
                                                        <th>Unit</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(!process.Attributes || process.Attributes.length === 0) ? (
                                                        <tr>
                                                            <td colSpan="4" style={{ textAlign: 'center' }}>No Data available</td>
                                                        </tr>
                                                    ) : (
                                                        <>
                                                            {process.Attributes.map((attr, attrIndex) => (
                                                                <tr key={attr.id}>
                                                                    <td style={{
                                                                        wordBreak: 'break-word',
                                                                        overflowWrap: 'break-word',
                                                                        lineHeight: '1.3',
                                                                        maxWidth: '150px'
                                                                    }}>
                                                                        {attr.name}
                                                                    </td>
                                                                    <td style={{
                                                                        backgroundColor: getColorForStatus(attr.status),
                                                                        color: 'white',
                                                                        borderRadius: '5px',
                                                                        padding: '2px 5px',
                                                                        display: 'inline-block',
                                                                        fontSize: '0.875rem',
                                                                        fontWeight: '400',
                                                                        textAlign: 'center',
                                                                        whiteSpace: 'nowrap',
                                                                        verticalAlign: 'baseline'
                                                                    }}>
                                                                        {attr.status}
                                                                    </td>
                                                                    <td style={{
                                                                        wordBreak: 'break-word',
                                                                        overflowWrap: 'break-word'
                                                                    }}>
                                                                        {attr.value}
                                                                    </td>
                                                                    <td style={{
                                                                        wordBreak: 'break-word',
                                                                        overflowWrap: 'break-word'
                                                                    }}>
                                                                        {attr.unit}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr>
                                                                <td colSpan="4">Total cycle time for this process: <b></b>{process.Attributes.reduce((total, attr) => total + Number(attr.value), 0)}</td>
                                                            </tr>
                                                        </>
                                                    )}
                                                </tbody>
                                            </Table>
                                            
                                            {process.Waste && process.Waste.length > 0 && (
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>Waste:</div>
                                                    <div style={{ whiteSpace: 'pre-wrap' }}>{process.Waste.join(', ')}</div>
                                                </div>
                                            )}

                                            {process.Note && process.Note.length > 0 && (
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>Note:</div>
                                                    <div style={{ whiteSpace: 'pre-wrap' }}>{process.Note}</div>
                                                </div>
                                            )}

                                            {hasImages && (
                                                <div style={{ marginTop: 10 }}>
                                                    <div style={{ fontWeight: 'bold' }}>Images:</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                        {imageUrlsMap[process.processID].map((url, imgIndex) => (
                                                            <img 
                                                                key={imgIndex}
                                                                src={url}
                                                                alt={`Related Process Image ${imgIndex}`} 
                                                                style={{ width: '150px', height: '150px' }} 
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </React.Fragment>
                            );
                        

                        return null;
                    })}
                    </div>

                    {reportData && actionItemsData && actionItemsData.length > 0 && (
                        <div className="capture-card">
                            <Card style={cardStyle}>
                                <Card.Header style={cardHeaderStyle}>
                                    <h2 style={{ margin: '20px 0' }}>Action Items / Notes: {actionItemsData.length}</h2>
                                </Card.Header>
                            </Card>
                            {actionItemsData.map((item) => (
                                <Card key={item.id} style={cardStyle}>
                                    <Card.Header style={cardHeaderStyle}>
                                        {item.title}
                                    </Card.Header>
                                    <Card.Body style={cardBodyStyle}>
                                        {item.note ? <p>Notes</p> : <p>Status: {statusText[item.status]}</p>}
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
                                                                organizationID={reportData?.organizationID}
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
}

export default ReportVsmPdf;