import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, Badge, Alert, Row, Col, Table } from 'react-bootstrap';
import { Storage, API } from 'aws-amplify';
import BaseReportPdf from './BaseReportPdf';
import AttachmentImage from '../shared/AttachmentImage';
import PublicAttachmentImage from '../shared/PublicAttachmentImage';
import UserAvatar from '../shared/UserAvatar';
import leadershipImage from '../../assets/lean-tools/light/leadership.png';
import { fetchUserEmails, getStatusText, formatAssignees, getStatusColor } from '../../utils/reportHelper';
import * as queries from '../../graphql/queries';
import Highlights from '../shared/Highlights';
import '../../styles/highlight-content.css';

const LeadershipReport = ({
  reportData,
  highlightsData = [],
  actionItemsData = [],
  fromProject = false,
  isGeneratingPDF = false,
  allImagesLoaded = true,
  onImageLoad
}) => {
  const [imageUrlsMap, setImageUrlsMap] = useState({});
  const [loadedImages, setLoadedImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalImages, setTotalImages] = useState(0);
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);
  const [emailMap, setEmailMap] = useState(new Map());
  const [userSubMap, setUserSubMap] = useState(new Map());
  const [projectDetails, setProjectDetails] = useState(null);
  const cardRefs = useRef({});

  // Define these at the component level since they're used in multiple places
  const validHighlights = Array.isArray(highlightsData) ? highlightsData : [];
  const validActionItems = Array.isArray(actionItemsData) ? actionItemsData : [];
  const validCategories = Array.isArray(reportData?.Categories?.items) ? reportData.Categories.items : [];

  // Fetch project details if a projectID is available (skip for public views)
  useEffect(() => {
    const fetchProjectInfo = async () => {
      // Skip API calls for public PDF views to prevent authentication errors
      if (window.location.pathname.includes('/report_pdf/')) {
        console.log('Skipping project fetch for public PDF view');
        return;
      }
      
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

  const handleImageLoad = (id) => {
    console.log('Image loaded:', id);
    setLoadedImages(prevState => {
      const newState = {
        ...prevState,
        [id]: true
      };
      console.log('Updated loadedImages:', newState);
      return newState;
    });
    setLoadedImagesCount(prev => prev + 1);
  };

  const fetchSignedUrlForAttachment = async (attachment) => {
    try {
      // Ensure we have a valid attachment key
      if (!attachment) {
        console.warn('Received null or undefined attachment');
        return null;
      }
      
      // Handle direct URL objects (for sample data)
      if (attachment && attachment.url && attachment.url.startsWith('http')) {
        console.log('Direct HTTP URL from attachment object, returning as-is:', attachment.url);
        return attachment.url;
      }
      
      // If attachment is a string (for highlights), use it directly
      // If it's an object (for action items/categories), use its key property
      const key = typeof attachment === 'string' ? attachment : attachment.key || attachment;
      
      console.log('Fetching signed URL for attachment key:', key);
      
      // Handle direct HTTP URLs (for sample data)
      if (typeof key === 'string' && key.startsWith('http')) {
        console.log('Direct HTTP URL detected, returning as-is:', key);
        return key;
      }

      // Validate key exists and is not empty
      if (!key || key.trim() === '') {
        console.warn('Empty or invalid key:', key);
        return null;
      }
      
      // Get the signed URL for S3 keys - use same approach as normal view
      try {
        const signedUrl = await Storage.get(key, {
          level: 'public',
          expires: 60 * 60 * 24,
        });
        console.log('Successfully got signed URL for key:', key);
        return signedUrl;
      } catch (authError) {
        console.error('Failed to get signed URL for key:', key, authError);
        // Fallback to direct public S3 URL
        const cleanKey = key.startsWith('public/') ? key : `public/${key}`;
        const fallbackUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
        console.log('Using fallback URL:', fallbackUrl);
        return fallbackUrl;
      }
    } catch (error) {
      console.error('Error fetching signed URL:', error, 'for attachment:', attachment);
      return null;
    }
  };

  useEffect(() => {
    const fetchAllSignedUrls = async () => {
      const urlsMap = {};
      const validHighlights = Array.isArray(highlightsData) ? highlightsData : [];
      const validActionItems = Array.isArray(actionItemsData) ? actionItemsData : [];
      const validCategories = Array.isArray(reportData?.Categories?.items) ? reportData.Categories.items : [];

      console.log('Starting to fetch all signed URLs');
      console.log('Highlights to process:', validHighlights.length);
      console.log('Full highlights data:', validHighlights);
      
      // Fetch URLs for highlight images
      for (const highlight of validHighlights) {
        if (highlight.images?.length > 0) {
          console.log(`Processing highlight ${highlight.id} with ${highlight.images.length} images`);
          try {
            const urls = await Promise.all(
              highlight.images.map((image, idx) => {
                console.log(`Fetching image ${idx} for highlight ${highlight.id}:`, image);
                return fetchSignedUrlForAttachment(image);
              })
            );
            const filteredUrls = urls.filter(url => url !== null);
            console.log(`Got ${filteredUrls.length} valid URLs for highlight ${highlight.id}`);
            urlsMap[highlight.id] = filteredUrls;
          } catch (error) {
            console.error('Error fetching highlight images:', error);
          }
        }
      }

      // Fetch URLs for action item attachments
      for (const actionItem of validActionItems) {
        if (actionItem.attachments && actionItem.attachments.length > 0) {
          try {
            const urls = await Promise.all(
              actionItem.attachments.map(attachment => fetchSignedUrlForAttachment(attachment))
            );
            urlsMap[actionItem.id] = urls.filter(url => url !== null);
          } catch (error) {
            console.error('Error fetching action item attachments:', error);
          }
        }
      }

      // Fetch URLs for category attachments
      for (const category of validCategories) {
        if (category.attachments && category.attachments.length > 0) {
          try {
            const urls = await Promise.all(
              category.attachments.map(attachment => fetchSignedUrlForAttachment(attachment))
            );
            urlsMap[category.id] = urls.filter(url => url !== null);
          } catch (error) {
            console.error('Error fetching category attachments:', error);
          }
        }
      }

      console.log('Final imageUrlsMap:', urlsMap);
      setImageUrlsMap(urlsMap);
    };

    // Skip URL fetching since we're using PublicAttachmentImage components now
    // This prevents authentication errors in public PDF views
    console.log('Skipping signed URL fetching - using PublicAttachmentImage components');
  }, [highlightsData, actionItemsData, reportData?.Categories?.items?.length]);

  // Calculate total expected images
  useEffect(() => {
    let total = 0;
    // Count highlight images
    validHighlights.forEach(highlight => {
      if (highlight.images) {
        total += highlight.images.length;
      }
    });
    // Count action item attachments
    validActionItems.forEach(item => {
      if (item.attachments) {
        total += item.attachments.length;
      }
    });
    // Count category attachments
    validCategories.forEach(category => {
      if (category.attachments) {
        total += category.attachments.length;
      }
    });
    console.log('Total expected images:', total);
    setTotalImages(total);
  }, [validHighlights, validActionItems, validCategories]);

  // Check if all images are loaded
  useEffect(() => {
    if (totalImages === 0 || loadedImagesCount >= totalImages) {
      console.log('All images loaded or no images to load');
      setIsLoading(false);
    }
  }, [totalImages, loadedImagesCount]);

  // Fetch user emails for assignees (skip for public views)
  useEffect(() => {
    const fetchEmails = async () => {
      // Skip API calls for public PDF views to prevent authentication errors
      if (window.location.pathname.includes('/report_pdf/')) {
        console.log('Skipping email fetch for public PDF view');
        return;
      }
      
      // Collect all unique assignee IDs
      const allAssignees = new Set();
      
      actionItemsData.forEach(item => {
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
  }, [actionItemsData, reportData.organizationID, reportData.assignedMembers]);

  const titleOrder = [
    'Accomplishments and significant events',
    'Improvement PDCAs',
    'Special recognitions',
    'Upcoming issues and events',
    'Resource and support needs',
    'Action Items'
  ];

  const sortedHighlights = [...validHighlights].sort((a, b) => {
    return titleOrder.indexOf(a.title) - titleOrder.indexOf(b.title);
  });

  const cardHeaderStyle = {
    backgroundColor: '#009688',
    color: 'white',
    padding: '10px',
    display: "flex",
    alignItems: "center"
  };

  const cardBodyStyle = {
    padding: '15px'
  };

  const cardStyle = {
    marginBottom: '10px',
    border: 'none',
    pageBreakInside: 'avoid',
    breakInside: 'avoid-page',
    width: '100%'
  };

  const cardSecandHeaderStyle = {
    backgroundColor: '#4db6ac',
    color: 'white',
    padding: '10px',
    display: "flex",
    alignItems: "center"
  };

  const customContent = {
    // Remove font sizing - let CSS class handle it
  };

  const imageContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    width: '100%'
  };

  // Initialize refs for each card
  const getCardRef = useCallback((id) => {
    if (!cardRefs.current[id]) {
      cardRefs.current[id] = React.createRef();
    }
    return cardRefs.current[id];
  }, []);

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
              <span>{emailMap.get(userSub) || userSub}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const headerCardStyle = {
    marginBottom: '15px',
    border: '2px solid #009688',
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

  // Props for Highlights component - pass raw image keys instead of pre-fetched URLs
  const childProps = {
    highlightsData: sortedHighlights,
    actionItemsData: validActionItems,
    isLeadership: true,
    onImageLoad: handleImageLoad,
    imageUrlsMap: {}  // Don't pass pre-fetched URLs, let Highlights handle Storage.get directly
  };

  return (
    <BaseReportPdf
      isGeneratingPDF={isGeneratingPDF}
      allImagesLoaded={allImagesLoaded}
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
                src={leadershipImage} 
                alt="Leadership Report" 
                style={{ marginRight: '20px', width: '30px' }} 
              />
              <div>
                <h6>{`Leadership Report - ${reportData.name}`} | Created At: {new Date(reportData.createdAt).toLocaleDateString()}</h6>
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
      
      {/* All detailed content below wrapped in portrait class */}
      <div className="portrait">
        {/* Keep existing detailed report below */}
        <div className="capture-card">
          <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
              <img src={leadershipImage} alt="Leadership Report" style={{ marginRight: '20px', width: '30px' }} />
              <div>
                <h6>{`Leadership Report - ${reportData.name}`} | Created At: {new Date(reportData.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</h6>
              </div>
            </Card.Header>
          </Card>
        </div>

        {/* Highlights Report Header */}
        <div className="capture-card">
          <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
              <h2 style={{ margin: '20px 0' }}>Highlights Report</h2>
            </Card.Header>
          </Card>
        </div>

        {/* Highlights Section */}
        {titleOrder.map((title) => {
          const highlightsForTitle = sortedHighlights.filter(h => h.title === title);
          return (
            <React.Fragment key={title}>
              {/* Title Card */}
              <div className="capture-card">
                <Card style={cardStyle}>
                  <Card.Header style={cardSecandHeaderStyle}>
                    <h2 style={{ margin: '10px 0', fontSize: '1.2em' }}>{title}</h2>
                  </Card.Header>
                </Card>
              </div>

              {/* Empty Section Card */}
              {highlightsForTitle.length === 0 && (
                <div className="capture-card">
                  <Card style={cardStyle}>
                    <Card.Body style={cardBodyStyle}>
                      <p style={{ color: '#666', fontStyle: 'italic' }}>No entries for this section</p>
                    </Card.Body>
                  </Card>
                </div>
              )}

              {/* Individual Highlight Cards */}
              {highlightsForTitle.map((item) => (
                <div key={item.id} className="capture-card">
                  <Card style={cardStyle}>
                    {/* Don't show duplicate header for Leadership Reports (only for this specific report type) */}
                    {reportData.type !== "Leadership Report" && (
                      <Card.Header style={cardHeaderStyle}>
                        {title}
                      </Card.Header>
                    )}
                    <Card.Body style={cardBodyStyle}>
                      <div style={customContent}>
                        <p><strong>Description:</strong></p>
                        <div 
                          className="highlight-content"
                          dangerouslySetInnerHTML={{ __html: item.description }} 
                        />
                        
                        {item.assignees?.length > 0 && (
                          <p style={{ marginTop: '10px' }}>{renderAssigneeAvatars(item.assignees)}</p>
                        )}
                        
                        {item.images?.length > 0 && (
                          <>
                            <p>Attachment(s):</p>
                            <div style={imageContainerStyle}>
                              {item.images.map((imagePath, index) => (
                                <div key={index} style={{ margin: "10px", textAlign: "center" }}>
                                  <PublicAttachmentImage
                                    path={imagePath}
                                    style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                    onLoad={() => handleImageLoad(`${item.id}-${index}`)}
                                  />
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </React.Fragment>
          );
        })}

        {/* Department Header */}
        {reportData.Categories?.items?.length > 0 && (
          <>
            <div className="capture-card">
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  <h2 style={{ margin: '20px 0' }}>Department</h2>
                </Card.Header>
              </Card>
            </div>

            {/* Category Cards */}
            {reportData.Categories.items.map((category) => (
              <React.Fragment key={category.id}>
                <div className="capture-card">
                  <Card style={cardStyle}>
                    <Card.Header style={cardHeaderStyle}>
                      {category.name}
                    </Card.Header>
                    <Card.Body style={cardBodyStyle}>
                      {category.Statements?.items?.map((statement) => (
                        <div key={statement.id} style={{ marginBottom: '10px' }}>
                          <div>{statement.name}</div>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </div>

                {(category.assignees?.length > 0 || category.description || category.attachments?.length > 0) && (
                  <div className="capture-card">
                    <Card style={cardStyle}>
                      <Card.Header style={cardSecandHeaderStyle}>
                        <div>Additional Details</div>
                      </Card.Header>
                      <Card.Body style={cardBodyStyle}>
                        {category.assignees?.length > 0 && (
                          <p>{renderAssigneeAvatars(category.assignees)}</p>
                        )}
                        {category.description && (
                          <div style={{ ...customContent, display: 'flex', flexDirection: 'column', alignItems: 'baseline' }}>
                            <strong>Description:</strong>
                            <div 
                              className="highlight-content"
                              dangerouslySetInnerHTML={{ __html: category.description }} 
                            />
                          </div>
                        )}
                        {category.attachments?.length > 0 && (
                          <>
                            <p>Attachment(s):</p>
                            <div style={imageContainerStyle}>
                              {category.attachments.map((attachment, index) => (
                                <div key={index} style={{ margin: "10px", textAlign: "center" }}>
                                  <PublicAttachmentImage
                                    path={attachment.key || attachment}
                                    style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                    onLoad={() => handleImageLoad(`${category.id}-${index}`)}
                                  />
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                )}
              </React.Fragment>
            ))}
          </>
        )}

        {/* Action Items Section */}
        {actionItemsData?.length > 0 && (
          <div className="capture-card">
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <h2 style={{ margin: '20px 0' }}>Action Items Details: {actionItemsData.length}</h2>
              </Card.Header>
            </Card>

            {actionItemsData.map((item) => (
              <div key={item.id}>
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
                    {item.attachments?.length > 0 && (
                      <>
                        <p>Attachment(s):</p>
                        <div style={imageContainerStyle}>
                          {item.attachments.map((attachment, index) => (
                            <div key={index} style={{ margin: "10px", textAlign: "center" }}>
                              <PublicAttachmentImage
                                path={attachment.key || attachment}
                                style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                onLoad={() => handleImageLoad(`${item.id}-${index}`)}
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
      </div>
    </BaseReportPdf>
  );
};

export default LeadershipReport; 