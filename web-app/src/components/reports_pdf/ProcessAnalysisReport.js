import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Storage, API } from 'aws-amplify';
import BaseReportPdf from './BaseReportPdf';
import AttachmentImage from '../shared/AttachmentImage';
import Highlights from '../shared/Highlights';
import UserAvatar from '../shared/UserAvatar';
import { fetchUserEmails, getStatusText, formatAssignees, getStatusColor } from '../../utils/reportHelper';
import * as queries from '../../graphql/queries';
import '../../styles/highlight-content.css';

// Import report type images
import A3Image from '../../assets/lean-tools/light/a3_project_report.png';
import DMAICImage from '../../assets/lean-tools/light/dmaic.png';
import PDCAImage from '../../assets/lean-tools/light/pdca.png';

const ProcessAnalysisReport = ({
  reportData,
  highlightsData = [],
  actionItemsData = [],
  fromProject = false,
  isGeneratingPDF = false,
  allImagesLoaded = true
}) => {
  const [imageUrlsMap, setImageUrlsMap] = useState({});
  const [loadedImages, setLoadedImages] = useState({});
  const [emailMap, setEmailMap] = useState(new Map());
  const [userSubMap, setUserSubMap] = useState(new Map());
  const [projectDetails, setProjectDetails] = useState(null);
  const reportRef = useRef(null);
  const cardRefs = useRef({});
  const imageLoadAttempted = useRef({});

  // Fetch project details if a projectID is available
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (reportData.projectID) {
        try {
          const projectResult = await API.graphql({
            query: queries.getProject,
            variables: { id: reportData.projectID }
          });
          setProjectDetails(projectResult.data.getProject);
        } catch (error) {
          console.error('Error fetching project details:', error);
        }
      }
    };

    fetchProjectInfo();
  }, [reportData.projectID]);

  // Initialize refs for each card
  const getCardRef = useCallback((id) => {
    if (!cardRefs.current[id]) {
      cardRefs.current[id] = React.createRef();
    }
    return cardRefs.current[id];
  }, []);

  const getReportImage = (type) => {
    switch (type) {
      case "A3 Project Report":
        return A3Image;
      case "DMAIC Report":
        return DMAICImage;
      case "PDCA Report":
        return PDCAImage;
      default:
        return A3Image;
    }
  };

  const getTitleOrder = (type) => {
    switch (type) {
      case "A3 Project Report":
        return [
          'Problem Statement',
          'Current State',
          'Improvement Opportunity',
          'Problem Analysis',
          'Future State',
          'Implementation Plan',
          'Verify Results',
          'Follow-Up'
        ];
      case "DMAIC Report":
        return [
          '(Prepare)',
          'Define',
          'Measure',
          'Analyze',
          'Improve',
          'Control'
        ];
      case "PDCA Report":
        return [
          'Plan',
          'Do',
          'Check',
          'Act'
        ];
      default:
        return [];
    }
  };

  // Ensure highlightsData is an array and sort it
  const validHighlights = Array.isArray(highlightsData) ? highlightsData : [];
  const titleOrder = getTitleOrder(reportData.type);
  
  // Create an array with all expected titles
  const allHighlights = titleOrder.map(title => {
    const existingHighlight = validHighlights.find(h => h.title === title);
    return existingHighlight || {
      id: `placeholder-${title}`,
      title: title,
      description: '',
      images: [],
      assignees: []
    };
  });

  const sortedHighlights = [...allHighlights].sort((a, b) => {
    return titleOrder.indexOf(a.title) - titleOrder.indexOf(b.title);
  });

  // Ensure actionItemsData is an array
  const validActionItems = Array.isArray(actionItemsData) ? actionItemsData : [];

  // Track image loading status
  const handleImageLoad = (id) => {
    console.log(`Image loaded successfully: ${id}`);
    
    setLoadedImages(prevState => ({
      ...prevState,
      [id]: true
    }));
  };

  // For loading timeout
  const [forceComplete, setForceComplete] = useState(false);
  
  // Set a timeout to force complete after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Forcing image loading complete after timeout");
      setForceComplete(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Check if all images are loaded
  const areAllImagesLoaded = useMemo(() => {
    // If we've forced completion, return true
    if (forceComplete) {
      return true;
    }
    
    // Check if we have at least some loaded images or no images to load
    const totalHighlightImages = validHighlights.reduce((count, highlight) => 
      count + (highlight.images?.length || 0), 0);
    
    return totalHighlightImages === 0 || Object.keys(loadedImages).length > 0;
  }, [validHighlights, loadedImages, forceComplete]);

  // Fetch signed URLs for attachments
  const fetchSignedUrlForAttachment = async (attachmentData, retry = 2) => {
    try {
      console.log(`Fetching image: ${attachmentData}`);
      
      // Handle attachment objects with URL (for sample data)
      if (attachmentData && typeof attachmentData === 'object' && attachmentData.url) {
        if (attachmentData.url.startsWith('http')) {
          console.log('Direct HTTP URL from attachment object, returning as-is:', attachmentData.url);
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
          download: false
        });
      } catch (authError) {
        // Fallback to direct public S3 URL
        const cleanKey = attachmentName.startsWith('public/') ? attachmentName : `public/${attachmentName}`;
        signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
      }

      console.log(`Successfully loaded: ${attachmentName}`);
      return signedUrl;
    } catch (err) {
      console.error('Error fetching signed URL for attachment:', attachmentData, err);
      
      if (retry > 0) {
        console.log(`Retrying fetch for ${attachmentData}, attempts left: ${retry}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchSignedUrlForAttachment(attachmentData, retry - 1);
      }
      
      return null;
    }
  };

  // Fetch all image URLs
  useEffect(() => {
    const fetchAllSignedUrls = async () => {
      console.log(`Processing ${validHighlights.length} highlights and ${validActionItems.length} action items for image loading`);
      console.log('ValidHighlights:', validHighlights.map(h => ({ id: h.id, title: h.title, imageCount: h.images?.length || 0 })));
      console.log('SortedHighlights:', sortedHighlights.map(h => ({ id: h.id, title: h.title, imageCount: h.images?.length || 0 })));
      
      const allUrlsMap = {};
      
      // Process highlight images - include all highlights that will be rendered
      const allHighlightsToProcess = [...validHighlights];
      
      // Also add any highlights from sortedHighlights that might not be in validHighlights
      for (const sortedHighlight of sortedHighlights) {
        if (!sortedHighlight.id.startsWith('placeholder-') && 
            !validHighlights.find(vh => vh.id === sortedHighlight.id) &&
            sortedHighlight.images?.length > 0) {
          allHighlightsToProcess.push(sortedHighlight);
        }
      }
      
      console.log('AllHighlightsToProcess:', allHighlightsToProcess.map(h => ({ id: h.id, title: h.title, imageCount: h.images?.length || 0 })));
      
      for (const highlight of allHighlightsToProcess) {
        if (highlight.images?.length > 0) {
          console.log(`Loading ${highlight.images.length} images for highlight: ${highlight.title} (ID: ${highlight.id})`);
          const urls = await Promise.allSettled(
            highlight.images.map(async (image) => {
              try {
                // Handle both S3 keys (strings) and direct HTTP URLs
                const imagePath = typeof image === 'string' ? image : image.url || image.key || image;
                const url = await fetchSignedUrlForAttachment(imagePath);
                return url;
              } catch (error) {
                console.error(`Failed to load image for ${highlight.title}:`, image, error);
                return null;
              }
            })
          );
          const filteredUrls = urls
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
          console.log(`Successfully loaded ${filteredUrls.length} out of ${highlight.images.length} images for highlight: ${highlight.title} (ID: ${highlight.id})`);
          allUrlsMap[highlight.id] = filteredUrls;
        }
      }
      
      // Process action item attachments
      for (const item of validActionItems) {
        if (item.attachments?.length > 0) {
          console.log(`Loading ${item.attachments.length} attachments for action item: ${item.title}`);
          const urls = await Promise.allSettled(
            item.attachments.map(async (attachment) => {
              try {
                // Handle both S3 keys (strings) and sample data objects with URL property
                const attachmentPath = typeof attachment === 'string' ? attachment : attachment.url || attachment.key || attachment;
                const url = await fetchSignedUrlForAttachment(attachmentPath);
                return url;
              } catch (error) {
                console.error(`Failed to load attachment for ${item.title}:`, attachment, error);
                return null;
              }
            })
          );
          const filteredUrls = urls
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
          console.log(`Successfully loaded ${filteredUrls.length} out of ${item.attachments.length} attachments for action item: ${item.title}`);
          allUrlsMap[item.id] = filteredUrls;
        }
      }

      console.log("Setting image URLs map for highlights and action items");
      console.log("Final imageUrlsMap:", allUrlsMap);
      setImageUrlsMap(allUrlsMap);
    };

    if (validHighlights.length > 0 || validActionItems.length > 0) {
      fetchAllSignedUrls();
    }
  }, [highlightsData, actionItemsData]);

  // Fetch user emails for assignees
  useEffect(() => {
    const fetchEmails = async () => {
      // Collect all unique assignee IDs
      const allAssignees = new Set();
      
      validActionItems.forEach(item => {
        if (item.assignees && item.assignees.length > 0) {
          item.assignees.forEach(id => allAssignees.add(id));
        }
      });
      
      // Also collect assignees from the report's assignedMembers
      if (reportData.assignedMembers && reportData.assignedMembers.length > 0) {
        reportData.assignedMembers.forEach(id => allAssignees.add(id));
      }
      
      // Convert Set to Array
      const assigneeArray = Array.from(allAssignees);
      
      if (assigneeArray.length > 0 && reportData.organizationID) {
        const emails = await fetchUserEmails(assigneeArray, reportData.organizationID);
        setEmailMap(emails);
        
        // Create a map of userSub -> userSub for avatar component
        const subMap = new Map();
        assigneeArray.forEach(userSub => {
          subMap.set(userSub, userSub);
        });
        setUserSubMap(subMap);
      }
    };
    
    fetchEmails();
  }, [validActionItems, reportData.organizationID, reportData.assignedMembers]);

  const cardHeaderStyle = {
    backgroundColor: '#009688',
    color: 'white',
    padding: '10px',
    display: "flex",
    alignItems: "center",
  };

  const cardBodyStyle = {
    backgroundColor: '#f5f5f5',
    padding: '20px'
  };

  const cardStyle = {
    marginBottom: '10px',
    border: 'none'
  };

  // Pass image loading handler to Highlights component
  const childProps = {
    highlightsData: sortedHighlights,
    actionItemsData: validActionItems,
    isA3: reportData.type === "A3 Project Report",
    isDMAIC: reportData.type === "DMAIC Report",
    isPDCA: reportData.type === "PDCA Report",
    onImageLoad: handleImageLoad,
    imageUrlsMap: imageUrlsMap  // Pass the pre-fetched URLs
  };

  // Helper to render user avatars for assignees
  const renderAssigneeAvatars = (assignees) => {
    if (!assignees || assignees.length === 0) return null;
    
    return (
      <div style={{ marginTop: '8px' }}>
        <div style={{ marginBottom: '5px' }}><strong>Assignees:</strong></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {assignees.map((userSub) => (
            <div key={userSub} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <UserAvatar 
                userSub={userSub}
                organizationID={reportData.organizationID}
                size={24}
                style={{ marginRight: '8px' }}
              />
              <span>{emailMap.get(userSub) || '(Email not available)'}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const headerCardStyle = {
    marginBottom: '15px',
    border: 'none',
    backgroundColor: '#f0f8f6', // Light teal background to distinguish from other cards
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
    const assignedMembers = reportData.assignedMembers || [];
    
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
                    <UserAvatar 
                      email={reportData.ownerEmail}
                      organizationID={reportData.organizationID}
                      size={40}
                      style={{ marginRight: '10px' }}
                      isOwner={true}
                    />
                    <span>{reportData.ownerEmail}</span>
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
                            organizationID={reportData.organizationID}
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
                    <div><strong>Type:</strong> {reportData.type}</div>
                    <div><strong>Created:</strong> {new Date(reportData.createdAt).toLocaleDateString()}</div>
                    {reportData.updatedAt && reportData.updatedAt !== reportData.createdAt && (
                      <div><strong>Last Updated:</strong> {new Date(reportData.updatedAt).toLocaleDateString()}</div>
                    )}
                    <div><strong>Status:</strong> {reportData.completed ? 'Completed' : 'In Progress'}</div>
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
    <BaseReportPdf
      isGeneratingPDF={isGeneratingPDF}
      allImagesLoaded={areAllImagesLoaded}
      fromProject={fromProject}
    >
      {/* Report Information Header */}
      {renderReportInfoHeader()}
      
      {/* Header and Grid Section - Combined in Landscape */}
      <div className="landscape">
        {/* Report Header and Grid as one section */}
        <div className="grid-section">
          {/* Report Header */}
          <Card style={cardStyle}>
            <Card.Header style={{ ...cardHeaderStyle, display: 'flex', justifyContent: 'center'}}>
              <img 
                src={getReportImage(reportData.type)} 
                alt={reportData.type} 
                style={{ marginRight: '20px', width: '30px' }} 
              />
              <div>
                <h6>{`${reportData.type} - ${reportData.name}`} | Created At: {new Date(reportData.createdAt).toLocaleDateString()}</h6>
              </div>
            </Card.Header>
          </Card>

          {/* Grid Content */}
          <Highlights 
            {...childProps}
          />
          
          {/* Message at the end of grid section */}
          <div style={{ textAlign: 'center', margin: '5px 0', fontStyle: 'italic', color: '#666', fontSize: '14px' }}>
            Full text and all images provided below.
          </div>
        </div>
      </div>

      {/* Notes Section Header - New Page */}
      {sortedHighlights.length > 0 && (
        <div className="portrait new-page">
          <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
              <h2 style={{ margin: '20px 0' }}>Notes</h2>
            </Card.Header>
          </Card>
        </div>
      )}

      {/* Individual Note Cards - Each in Portrait */}
      {(() => {
        console.log('=== NOTES SECTION RENDERING ===');
        console.log('Current imageUrlsMap state:', imageUrlsMap);
        console.log('SortedHighlights with images:', sortedHighlights.filter(h => h.images?.length > 0).map(h => ({
          id: h.id,
          title: h.title,
          imageCount: h.images?.length || 0,
          hasUrlsInMap: !!imageUrlsMap[h.id],
          urlCount: imageUrlsMap[h.id]?.length || 0
        })));
        return null;
      })()}
      {sortedHighlights.map((item, index) => {
        // Generate a unique ID for notes view to prevent conflicts with grid view
        const noteId = `notes_${item.id}`;
        const isFirstCard = index === 0;
        
        // Pre-initialize the card ref to ensure it's available
        const cardRef = getCardRef(noteId);
        
        // Special treatment for first card
        const firstCardStyle = isFirstCard ? {
          border: '2px solid #009688',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        } : {};
        
        return (
          <div key={noteId} className="portrait" ref={cardRef}>
            <Card style={{...cardStyle, ...firstCardStyle}}>
              <Card.Header style={cardHeaderStyle}>
                {item.title} {item.images?.length > 0 ? `(${item.images.length} images)` : ''}
                {isFirstCard && <span style={{marginLeft: '10px', fontSize: '0.8em'}}>(First Card)</span>}
              </Card.Header>
              <Card.Body style={{...cardBodyStyle, minHeight: item.images?.length > 0 ? '300px' : 'auto'}}>
                {item.description ? (
                  <div 
                    className="highlight-content"
                    dangerouslySetInnerHTML={{ __html: item.description }} 
                  />
                ) : (
                  <p style={{ color: '#666' }}>No description available</p>
                )}
                {item.assignees?.length > 0 && (
                  <p>Assignee(s): {item.assignees.join(", ")}</p>
                )}
                
                {/* Use AttachmentImage component to render images */}
                {(() => {
                  console.log(`Notes section - Item ${item.title}: item.images.length = ${item.images?.length}, imageUrlsMap[${item.id}] = `, imageUrlsMap[item.id]);
                  return null;
                })()}
                {item.images?.length > 0 && imageUrlsMap[item.id] && imageUrlsMap[item.id].length > 0 && (
                  <>
                    <p>Attachment(s): <strong>{imageUrlsMap[item.id].length}</strong> | Available Images: <strong>{item.images.length}</strong></p>
                    <div style={{ 
                      display: "flex", 
                      flexWrap: "wrap", 
                      gap: "10px",
                      position: "relative",
                      minHeight: "200px" 
                    }}>
                      {imageUrlsMap[item.id].map((url, imgIndex) => (
                        <div 
                          key={imgIndex} 
                          style={{ 
                            margin: "10px", 
                            textAlign: "center",
                            position: 'relative',
                            width: "200px",
                            height: "200px",
                          }}
                        >
                          {isFirstCard && (
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#009688',
                              color: 'white',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              fontSize: '12px',
                              zIndex: 2
                            }}>
                              {imgIndex + 1}
                            </div>
                          )}
                          
                          <AttachmentImage 
                            path={url}
                            style={{ 
                              width: "200px", 
                              height: "200px", 
                              objectFit: "cover" 
                            }}
                            onLoad={() => handleImageLoad(`${noteId}-img-${imgIndex}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </div>
        );
      })}

      {/* Action Items Section */}
      {validActionItems.length > 0 && (
        <div className="capture-card">
          {/* Action Items Header */}
          <div className="portrait">
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <h2 style={{ margin: '20px 0' }}>Action Items: {validActionItems.length}</h2>
              </Card.Header>
            </Card>
          </div>

          {/* Individual Action Item Cards */}
          {validActionItems.map((item) => (
            <div key={item.id} className="portrait">
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  {item.title}
                </Card.Header>
                <Card.Body style={cardBodyStyle}>
                  {!item.note && item.status !== null && (
                    <p>Status: <span style={{ 
                      color: 'white', 
                      backgroundColor: getStatusColor(item.status),
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>{getStatusText(item.status)}</span></p>
                  )}
                  {!item.note && item.duedate && (
                    <p>Due Date: {new Date(item.duedate).toLocaleDateString()}</p>
                  )}
                  <p>Description: {item.description}</p>
                  {renderAssigneeAvatars(item.assignees)}
                  {item.attachments?.length > 0 && imageUrlsMap[item.id] && (
                    <>
                      <p>Attachment(s):</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {imageUrlsMap[item.id].map((url, imgIndex) => (
                          <div key={imgIndex} style={{ margin: "10px", textAlign: "center" }}>
                            <AttachmentImage
                              path={url}
                              style={{ width: "200px", height: "200px", objectFit: "cover" }}
                              onLoad={() => handleImageLoad(`${item.id}-img-${imgIndex}`)}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </BaseReportPdf>
  );
};

export default ProcessAnalysisReport; 