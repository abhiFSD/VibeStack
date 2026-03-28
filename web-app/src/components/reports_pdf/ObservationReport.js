import React, { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { Storage, API } from 'aws-amplify';
import BaseReportPdf from './BaseReportPdf';
import AttachmentImage from '../shared/AttachmentImage';
import UserAvatar from '../shared/UserAvatar';
import { fetchUserEmails, getStatusText, formatAssignees, getStatusColor } from '../../utils/reportHelper';
import * as queries from '../../graphql/queries';
import '../../styles/highlight-content.css';

// Import report type images
import GembaWalkImage from '../../assets/lean-tools/light/gemba_walk.png';
import WasteWalkImage from '../../assets/lean-tools/light/waste_walk.png';

const ObservationReport = ({
  reportData,
  highlightsData = [],
  fromProject = false,
  isGeneratingPDF = false,
  allImagesLoaded = true
}) => {
  const [emailMap, setEmailMap] = useState(new Map());
  const [userSubMap, setUserSubMap] = useState(new Map());
  const [projectDetails, setProjectDetails] = useState(null);
  const [imageUrlsMap, setImageUrlsMap] = useState({});
  const [loadedImages, setLoadedImages] = useState({});
  
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
  
  // Helper function to fetch signed URLs for attachments
  const fetchSignedUrlForAttachment = async (attachment) => {
    try {
      // Ensure we have a valid attachment key
      if (!attachment) {
        console.warn('Received null or undefined attachment');
        return null;
      }
      
      // If attachment is a string, use it directly
      // If it's an object, use its key property or use the attachment directly
      const key = typeof attachment === 'string' ? attachment : attachment.url || attachment.key || attachment;
      
      // Handle direct HTTP URLs (for sample data)
      if (typeof key === 'string' && key.startsWith('http')) {
        console.log('Direct HTTP URL detected, returning as-is:', key);
        return key;
      }
      
      // Get the signed URL
      let signedUrl;
      try {
        signedUrl = await Storage.get(key, {
          level: 'public',
          expires: 60 * 60 * 24,
        });
      } catch (authError) {
        // Fallback to direct public S3 URL
        const cleanKey = key.startsWith('public/') ? key : `public/${key}`;
        signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
      }

      // Fetch the signed URL as a blob
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching signed URL:', error, 'for attachment:', attachment);
      return null;
    }
  };

  // Track image loading status
  const handleImageLoad = (id) => {
    setLoadedImages(prevState => ({
      ...prevState,
      [id]: true
    }));
  };

  // Fetch all image URLs
  useEffect(() => {
    const fetchAllSignedUrls = async () => {
      const urlsMap = {};
      
      // Fetch URLs for highlights images
      const validHighlights = Array.isArray(highlightsData) ? highlightsData : [];
      for (const highlight of validHighlights) {
        if (highlight.images?.length > 0) {
          try {
            const urls = await Promise.all(
              highlight.images.map(image => fetchSignedUrlForAttachment(image))
            );
            urlsMap[highlight.id] = urls.filter(url => url !== null);
          } catch (error) {
            console.error('Error fetching highlight images:', error);
          }
        }
      }
      
      // Fetch URLs for action item attachments
      const validActionItems = Array.isArray(reportData.ActionItems?.items) ? reportData.ActionItems.items : [];
      for (const actionItem of validActionItems) {
        if (actionItem.attachments?.length > 0) {
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
      if (reportData.Categories?.items) {
        for (const category of reportData.Categories.items) {
          if (category.attachments?.length > 0) {
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
      }

      setImageUrlsMap(urlsMap);
    };

    fetchAllSignedUrls();
    
    // Cleanup function
    return () => {
      // Release the Object URLs to free up resources
      Object.values(imageUrlsMap).forEach(urls => {
        if (urls) {
          urls.forEach(url => {
            if (url) URL.revokeObjectURL(url);
          });
        }
      });
    };
  }, [highlightsData, reportData.ActionItems?.items, reportData.Categories?.items]);
  
  // Add email fetching effect
  useEffect(() => {
    const fetchEmails = async () => {
      // Collect all unique assignee IDs
      const allAssignees = new Set();
      
      const validActionItems = Array.isArray(reportData.ActionItems?.items) ? reportData.ActionItems.items : [];
      
      validActionItems.forEach(item => {
        if (item.assignees && item.assignees.length > 0) {
          item.assignees.forEach(id => allAssignees.add(id));
        }
      });
      
      // Add assignees from highlights
      const validHighlights = Array.isArray(highlightsData) ? highlightsData : [];
      validHighlights.forEach(item => {
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
  }, [reportData.ActionItems?.items, reportData.organizationID, highlightsData, reportData.assignedMembers]);

  const getReportImage = (type) => {
    switch (type) {
      case "Gemba Walk Report":
        return GembaWalkImage;
      case "Waste Walk Report":
        return WasteWalkImage;
      default:
        return GembaWalkImage;
    }
  };

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

  const wasteType = {
    backgroundColor: 'lightgray', 
    color: '#666', 
    width: '100%', 
    padding: '10px', 
    marginBottom: '10px',
    borderRadius: '5px'
  };

  // Ensure highlightsData is an array
  const validHighlights = Array.isArray(highlightsData) ? highlightsData : [];

  // For Waste Walk, group highlights by waste type
  const groupedHighlights = reportData.type === "Waste Walk Report" 
    ? validHighlights.reduce((groups, item) => {
        const group = groups.find(g => g[0]?.waste_type === item.waste_type);
        if (group) {
          group.push(item);
        } else {
          groups.push([item]);
        }
        return groups;
      }, [])
    : [validHighlights];

  // Ensure action items data is an array
  const validActionItems = Array.isArray(reportData.ActionItems?.items) ? reportData.ActionItems.items : [];

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

  return (
    <BaseReportPdf
      isGeneratingPDF={isGeneratingPDF}
      allImagesLoaded={allImagesLoaded}
      fromProject={fromProject}
    >
      {/* Report Information Header */}
      {renderReportInfoHeader()}

      <div className="portrait">
      
      {/* Report Header */}
      <div className="capture-card">
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

      {/* Total Notes Count */}
      {validHighlights.length > 0 && (
        <div className="capture-card">
          <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
              <h2 style={{ margin: '20px 0' }}>Total Notes: {validHighlights.length}</h2>
            </Card.Header>
          </Card>
        </div>
      )}

      {/* Observations/Waste Groups */}
      {groupedHighlights.map((group, groupIndex) => {
        const isWasteWalk = reportData.type === "Waste Walk Report";
        return (
          <React.Fragment key={groupIndex}>
            {isWasteWalk && group[0]?.waste_type && (
              <div className="capture-card">
                <h2 style={wasteType}>{group[0].waste_type}</h2>
              </div>
            )}
            {group.map((item) => (
              <div key={item.id} className="capture-card">
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
                      renderAssigneeAvatars(item.assignees)
                    )}
                    {item.images?.length > 0 && (
                      <>
                        <p>Attachment(s):</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                          {imageUrlsMap[item.id] && imageUrlsMap[item.id].map((url, index) => (
                            <div key={index} style={{ margin: "10px", textAlign: "center" }}>
                              <img
                                src={url}
                                alt={`Attachment ${index + 1}`}
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
          </React.Fragment>
        );
      })}

      {/* Categories Section */}
      {reportData.Categories?.items?.length > 0 && (
        <>
          <div className="capture-card">
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <h2 style={{ margin: '20px 0' }}>
                  {reportData.type === "Gemba Walk Report" ? 'Department' : 'Categories'}
                </h2>
              </Card.Header>
            </Card>
          </div>

          {reportData.Categories.items.map((category) => (
            <div key={category.id} className="capture-card">
              <Card style={cardStyle}>
                <Card.Header style={cardHeaderStyle}>
                  {category.name}
                </Card.Header>
                <Card.Body style={cardBodyStyle}>
                  {category.Statements?.items?.map((statement) => (
                    <div key={statement.id} style={{ marginBottom: '10px' }}>
                      {reportData.type === 'Gemba Walk Report' || 
                       reportData.type === 'Kaizen Project Report' ||
                       reportData.type === 'Leadership Report' ||
                       reportData.type === '5 Whys Report' ? (
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
                        renderAssigneeAvatars(category.assignees)
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
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          {imageUrlsMap[category.id].map((url, index) => (
                            <div key={index} style={{ margin: "10px", textAlign: "center" }}>
                              <img
                                src={url}
                                alt={`Attachment ${index + 1}`}
                                style={{ width: "200px", height: "200px", objectFit: "cover" }}
                                onLoad={() => handleImageLoad(`${category.id}-${index}`)}
                              />
                            </div>
                          ))}
                        </div>
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
          <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
              <h2 style={{ margin: '20px 0' }}>Action Items: {validActionItems.length}</h2>
            </Card.Header>
          </Card>

          {validActionItems.map((item) => (
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
                  {item.attachments?.length > 0 && imageUrlsMap[item.id] && (
                    <>
                      <p>Attachment(s):</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                        {imageUrlsMap[item.id].map((url, index) => (
                          <div key={index} style={{ margin: "10px", textAlign: "center" }}>
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
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

export default ObservationReport; 