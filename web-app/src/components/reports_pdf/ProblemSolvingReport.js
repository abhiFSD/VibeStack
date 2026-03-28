import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card, Table, Badge, Row, Col } from 'react-bootstrap';
import { Storage, API } from 'aws-amplify';
import BaseReportPdf from './BaseReportPdf';
import AttachmentImage from '../shared/AttachmentImage';
import UserAvatar from '../shared/UserAvatar';
import { fetchUserEmails, getStatusText, formatAssignees, getStatusColor } from '../../utils/reportHelper';
import * as queries from '../../graphql/queries';
import '../../styles/highlight-content.css';

// Import report type images
import WhysReportImage from '../../assets/lean-tools/light/5_whys.png';
import KaizenReportImage from '../../assets/lean-tools/light/kaizen_project.png';

const ProblemSolvingReport = ({
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
      case "5 Whys Report":
        return WhysReportImage;
      case "Kaizen Project Report":
        return KaizenReportImage;
      default:
        return WhysReportImage;
    }
  };

  // Ensure highlightsData is an array before using array methods
  const validHighlights = Array.isArray(highlightsData) ? highlightsData : [];
  
  // Ensure actionItemsData is an array
  const validActionItems = Array.isArray(actionItemsData) ? actionItemsData : [];

  // Track image loading status
  const handleImageLoad = (id) => {
    setLoadedImages(prevState => ({
      ...prevState,
      [id]: true
    }));
  };

  // Fetch signed URLs for attachments
  const fetchSignedUrlForAttachment = async (attachment) => {
    try {
      // Handle direct HTTP URLs (for sample data)
      if (typeof attachment === 'string' && attachment.startsWith('http')) {
        console.log('Direct HTTP URL detected, returning as-is:', attachment);
        return attachment;
      } else if (attachment && attachment.url) {
        // Direct URL handling (for sample data and external images)
        if (attachment.url.startsWith('http')) {
          // For external URLs like Unsplash, return directly
          return attachment.url;
        } else {
          // For S3 paths in the url field
          let signedUrl;
          try {
            signedUrl = await Storage.get(attachment.url, {
              level: 'public',
              expires: 60 * 60 * 24,
            });
          } catch (authError) {
            // Fallback to direct public S3 URL
            const cleanKey = attachment.url.startsWith('public/') ? attachment.url : `public/${attachment.url}`;
            signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
          }

          const response = await fetch(signedUrl, { method: 'GET', mode: 'cors' });
          const blob = await response.blob();
          const objectURL = URL.createObjectURL(blob);

          return objectURL;
        }
      }

      // Fallback for legacy string-based attachment names
      const attachmentName = typeof attachment === 'string' ? attachment : attachment.name;
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
      console.error('Error fetching signed URL for attachment:', attachment, err);
      return null;
    }
  };

  // Fetch all image URLs
  useEffect(() => {
    const fetchAllSignedUrls = async () => {
      const allUrlsMap = {};

      // Fetch highlight images
      for (const highlight of validHighlights) {
        if (highlight.images?.length > 0) {
          const urls = await Promise.all(
            highlight.images.map(attachment => fetchSignedUrlForAttachment(attachment))
          );
          allUrlsMap[highlight.id] = urls.filter(url => url !== null);
        }
      }

      // Fetch category attachments
      if (reportData.Categories?.items) {
        for (const category of reportData.Categories.items) {
          if (category.attachments?.length > 0) {
            const urls = await Promise.all(
              category.attachments.map(attachment => fetchSignedUrlForAttachment(attachment))
            );
            allUrlsMap[category.id] = urls.filter(url => url !== null);
          }
        }
      }

      // Fetch action item attachments
      for (const item of validActionItems) {
        if (item.attachments?.length > 0) {
          const urls = await Promise.all(
            item.attachments.map(attachment => fetchSignedUrlForAttachment(attachment))
          );
          allUrlsMap[item.id] = urls.filter(url => url !== null);
        }
      }

      setImageUrlsMap(allUrlsMap);
    };

    if (validHighlights.length > 0 || validActionItems.length > 0 || reportData.Categories?.items?.length > 0) {
      fetchAllSignedUrls();
    }

    // Cleanup function
    return () => {
      // Release the Object URLs to free up resources
      Object.values(imageUrlsMap).forEach(urls => {
        urls.forEach(url => URL.revokeObjectURL(url));
      });
    };
  }, [validHighlights, validActionItems, reportData.Categories?.items]);

  // Check if all images are loaded
  const areAllImagesLoaded = useMemo(() => {
    // Check highlight images
    const highlightImagesLoaded = validHighlights.every(highlight => 
      !highlight.images?.length || // Skip if no images
      (imageUrlsMap[highlight.id] && loadedImages[highlight.id])
    );

    // Check category images
    const categoryImagesLoaded = reportData.Categories?.items?.every(category =>
      !category.attachments?.length || // Skip if no attachments
      (imageUrlsMap[category.id] && loadedImages[category.id])
    ) ?? true;

    // Check action item images
    const actionItemImagesLoaded = validActionItems.every(item =>
      !item.attachments?.length || // Skip if no attachments
      (imageUrlsMap[item.id] && loadedImages[item.id])
    );

    return highlightImagesLoaded && categoryImagesLoaded && actionItemImagesLoaded;
  }, [validHighlights, validActionItems, reportData.Categories?.items, imageUrlsMap, loadedImages]);

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
  }, [validActionItems, reportData.organizationID]);

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
    border: 'none',
    pageBreakInside: 'avoid',
    breakInside: 'avoid-page',
    width: '100%'
  };

  const imageContainerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    width: '100%'
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
              <span>{emailMap.get(userSub) || userSub}</span>
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

      <div className="portrait">

      {/* Report Header */}
      <div ref={reportRef} className="capture-card ">
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
      </div>

      {/* Highlights Section */}
      {validHighlights.length > 0 && (
        <>
          <div ref={getCardRef('highlights-header')} className="capture-card">
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <h2 style={{ margin: '20px 0' }}>Notes</h2>
              </Card.Header>
            </Card>
          </div>

          {validHighlights.map((item) => (
            <div key={item.id} ref={getCardRef(`highlight-${item.id}`)} className="capture-card">
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  {item.title}
                </Card.Header>
                <Card.Body style={cardBodyStyle}>
                  <p>Description:</p>
                  <div 
                    className="highlight-content"
                    dangerouslySetInnerHTML={{ __html: item.description }} 
                  />
                  {item.assignees?.length > 0 && (
                    <p>Assignee(s): {item.assignees.join(", ")}</p>
                  )}
                  {item.images?.length > 0 && imageUrlsMap[item.id] && (
                    <>
                      <p>Attachment(s):</p>
                      <div style={imageContainerStyle}>
                        {imageUrlsMap[item.id].map((url, imgIndex) => (
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
            </div>
          ))}
        </>
      )}

      {/* Categories Section */}
      {reportData.Categories?.items?.length > 0 && (
        <>
          <div ref={getCardRef('categories-header')} className="capture-card">
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <h2 style={{ margin: '20px 0' }}>
                  {reportData.type === "Kaizen Project Report" ? 'Phase' : 'Problem'}
                </h2>
              </Card.Header>
            </Card>
          </div>

          {reportData.Categories.items.map((category) => (
            <div key={category.id} ref={getCardRef(`category-${category.id}`)} className="capture-card">
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  {category.name}
                </Card.Header>
                <Card.Body style={cardBodyStyle}>
                  {category.Statements?.items?.map((statement) => (
                    <div key={statement.id} style={{ marginBottom: '10px' }}>
                      {reportData.type === '5 Whys Report' ? (
                        <>
                          <div>{statement.name}</div>
                          {statement.value === 0 && (
                            <span style={{ marginLeft: '10px', color: '#666' }}>
                              (This is the root cause)
                            </span>
                          )}
                        </>
                      ) : reportData.type === 'Kaizen Project Report' ? (
                        <div>{statement.name}</div>
                      ) : (
                        <>
                          <strong>{statement.name}:</strong> {statement.value}
                        </>
                      )}
                    </div>
                  ))}

                  {/* Additional Details */}
                  {(category.assignees?.length > 0 || category.description || category.attachments) && (
                    <>
                      <div style={{ fontWeight: 'bold', marginTop: '20px' }}>Additional Details</div>
                      {category.assignees?.length > 0 && (
                        <p><strong>Assignees:</strong> {category.assignees.join(", ")}</p>
                      )}
                      {category.description && (
                        <div>
                          <strong>Description:</strong>
                          <div 
                            className="highlight-content"
                            dangerouslySetInnerHTML={{ __html: category.description }} 
                          />
                        </div>
                      )}
                      {category.attachments?.length > 0 && imageUrlsMap[category.id] && (
                        <>
                          <p>Attachment(s):</p>
                          <div style={imageContainerStyle}>
                            {imageUrlsMap[category.id].map((url, imgIndex) => (
                              <div key={imgIndex} style={{ margin: "10px", textAlign: "center" }}>
                                <img
                                  src={url}
                                  alt={`Attachment ${imgIndex + 1}`}
                                  style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                  onLoad={() => handleImageLoad(category.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </div>
          ))}
        </>
      )}

      {/* Action Items Section */}
      {validActionItems.length > 0 && (
        <div className="capture-card">
          <div ref={getCardRef('action-items-header')}>
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <h2 style={{ margin: '20px 0' }}>Action Items: {validActionItems.length}</h2>
              </Card.Header>
            </Card>
          </div>

          {validActionItems.map((item) => (
            <div key={item.id} ref={getCardRef(`action-item-${item.id}`)}>
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
                      <div style={imageContainerStyle}>
                        {imageUrlsMap[item.id].map((url, imgIndex) => (
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
            </div>
          ))}
        </div>
      )}
      </div>
    </BaseReportPdf>
  );
};

export default ProblemSolvingReport; 