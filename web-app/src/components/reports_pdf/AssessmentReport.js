import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, Table, Badge, Row, Col } from 'react-bootstrap';
import { Storage, API } from 'aws-amplify';
import RadarChart from '../shared/charts/RadarChart';
import BaseReportPdf from './BaseReportPdf';
import UserAvatar from '../shared/UserAvatar';
import { fetchUserEmails, getStatusText, formatAssignees, getStatusColor } from '../../utils/reportHelper';
import * as queries from '../../graphql/queries';
import '../../styles/highlight-content.css';

// Import report type images
import reportImage from '../../assets/lean-tools/light/5s.png';
import LARReportImage from '../../assets/lean-tools/light/lean_overview_and_assessment.png';
import MpImage from '../../assets/lean-tools/light/mistake_proofing.png';

const AssessmentReport = ({ 
  reportData,
  chartData = [],
  fromProject = false,
  isGeneratingPDF = false,
  allImagesLoaded = true
}) => {
  const [imageUrlsMap, setImageUrlsMap] = useState({});
  const [loadedImages, setLoadedImages] = useState({});
  const [emailMap, setEmailMap] = useState(new Map());
  const [userSubMap, setUserSubMap] = useState(new Map());
  const [projectDetails, setProjectDetails] = useState(null);

  useEffect(() => {
    // Fetch project details if a projectID is available
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

  const getReportImage = (type) => {
    switch (type) {
      case "Lean Assessment Report":
        return LARReportImage;
      case "Mistake Proofing Report":
        return MpImage;
      default:
        return reportImage; // 5S Report
    }
  };

  const getValueText = (value, type, name) => {
    if (type === "Mistake Proofing Report") {
      if (name === "Potential Score") return PotenScore(value);
      if (name === "Consequences Score") return ConseScore(value);
    }
    
    switch (value) {
      case 1: return "Strongly Disagree";
      case 2: return "Disagree";
      case 3: return "Neutral";
      case 4: return "Agree";
      case 5: return "Strongly Agree";
      default: return "";
    }
  };

  const PotenScore = (value) => {
    switch (value) {
      case 5: return "Excellent Chance";
      case 4: return "Good Chance";
      case 3: return "50 / 50";
      case 2: return "Rarely";
      case 1: return "Very Unlikely";
      default: return "Select Value";
    }
  };

  const ConseScore = (value) => {
    switch (value) {
      case 5: return "Most Severe";
      case 4: return "Severe";
      case 3: return "Moderate";
      case 2: return "Some Risk";
      case 1: return "Little Risk";
      default: return "Select Value";
    }
  };

  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + item.value, 0);
  };

  const calculateAverage = (items) => {
    return items.length > 0 ? calculateTotal(items) / items.length : 0;
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
      console.log('Processing attachment:', attachment);
      
      // Handle both string paths (legacy) and attachment objects
      if (typeof attachment === 'string') {
        // Skip if empty or invalid string
        if (!attachment || attachment.trim() === '') {
          console.warn('Empty attachment string provided');
          return null;
        }

        // Legacy S3 path handling - ensure proper path format
        let s3Key = attachment;
        // If it's just a filename, prepend with public path
        if (!s3Key.includes('/') && (s3Key.endsWith('.jpg') || s3Key.endsWith('.jpeg') || s3Key.endsWith('.png') || s3Key.endsWith('.gif'))) {
          s3Key = `public/${s3Key}`;
        }

        console.log('Fetching S3 object with key:', s3Key);
        let signedUrl;
        try {
          // If s3Key already includes 'public/', don't use level: 'public' to avoid double prefix
          const storageOptions = {
            expires: 60 * 60 * 24,
          };
          if (!s3Key.startsWith('public/')) {
            storageOptions.level = 'public';
          }
          
          signedUrl = await Storage.get(s3Key, storageOptions);
        } catch (authError) {
          // Fallback to direct public S3 URL
          // Remove 'public/' prefix if it already exists to avoid double prefix
          const cleanKey = s3Key.startsWith('public/') ? s3Key : `public/${s3Key}`;
          signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
        }

        // Fetch the signed URL as a blob
        let response = await fetch(signedUrl, { method: 'GET', mode: 'cors' });
        
        // If the signed URL returns 404, try the direct public URL as fallback
        if (!response.ok && response.status === 404) {
          console.log(`Signed URL returned 404 for ${s3Key}, trying direct public URL`);
          const cleanKey = s3Key.startsWith('public/') ? s3Key : `public/${s3Key}`;
          const directUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
          response = await fetch(directUrl, { method: 'GET', mode: 'cors' });
        }
        
        if (!response.ok) {
          console.warn(`Image not found: ${s3Key} (${response.status} ${response.statusText})`);
          return null; // Return null instead of throwing error for missing images
        }
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);

        return objectURL;
      } else if (attachment && attachment.url) {
        console.log('Processing attachment object with URL:', attachment.url);
        
        // Direct URL handling (for sample data and external images)
        if (attachment.url.startsWith('http')) {
          // For external URLs like Unsplash, return directly
          return attachment.url;
        } else {
          // Skip if empty or invalid URL
          if (!attachment.url || attachment.url.trim() === '') {
            console.warn('Empty attachment URL provided');
            return null;
          }

          // For S3 paths in the url field - ensure proper path format
          let s3Key = attachment.url;
          // If it's just a filename, prepend with public path
          if (!s3Key.includes('/') && (s3Key.endsWith('.jpg') || s3Key.endsWith('.jpeg') || s3Key.endsWith('.png') || s3Key.endsWith('.gif'))) {
            s3Key = `public/${s3Key}`;
          }

          console.log('Fetching S3 object with key from URL:', s3Key);
          let signedUrl;
          try {
            // If s3Key already includes 'public/', don't use level: 'public' to avoid double prefix
            const storageOptions = {
              expires: 60 * 60 * 24,
            };
            if (!s3Key.startsWith('public/')) {
              storageOptions.level = 'public';
            }
            
            signedUrl = await Storage.get(s3Key, storageOptions);
          } catch (authError) {
            // Fallback to direct public S3 URL
            // Remove 'public/' prefix if it already exists to avoid double prefix
            const cleanKey = s3Key.startsWith('public/') ? s3Key : `public/${s3Key}`;
            signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
          }

          let response = await fetch(signedUrl, { method: 'GET', mode: 'cors' });
          
          // If the signed URL returns 404, try the direct public URL as fallback
          if (!response.ok && response.status === 404) {
            console.log(`Signed URL returned 404 for ${s3Key}, trying direct public URL`);
            const cleanKey = s3Key.startsWith('public/') ? s3Key : `public/${s3Key}`;
            const directUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
            response = await fetch(directUrl, { method: 'GET', mode: 'cors' });
          }
          
          if (!response.ok) {
            console.warn(`Image not found: ${s3Key} (${response.status} ${response.statusText})`);
            return null; // Return null instead of throwing error for missing images
          }
          const blob = await response.blob();
          const objectURL = URL.createObjectURL(blob);

          return objectURL;
        }
      }
      
      console.warn('Invalid attachment format:', attachment);
      return null;
    } catch (err) {
      console.error('Error fetching signed URL for attachment:', attachment, err);
      return null;
    }
  };

  // Fetch all image URLs
  useEffect(() => {
    const fetchAllSignedUrls = async () => {
      const allUrlsMap = {};

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
      if (reportData.ActionItems?.items) {
        for (const item of reportData.ActionItems.items) {
          if (item.attachments?.length > 0) {
            const urls = await Promise.all(
              item.attachments.map(attachment => fetchSignedUrlForAttachment(attachment))
            );
            allUrlsMap[item.id] = urls.filter(url => url !== null);
          }
        }
      }

      setImageUrlsMap(allUrlsMap);
    };

    const hasAttachments = reportData.Categories?.items?.some(category => category.attachments?.length > 0) ||
                          reportData.ActionItems?.items?.some(item => item.attachments?.length > 0);

    if (hasAttachments) {
      fetchAllSignedUrls();
    }

    // Cleanup function
    return () => {
      // Release the Object URLs to free up resources (but not external URLs)
      Object.values(imageUrlsMap).forEach(urls => {
        urls.forEach(url => {
          // Only revoke blob URLs, not external HTTP URLs
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      });
    };
  }, [reportData.Categories?.items, reportData.ActionItems?.items]);

  // Check if all images are loaded
  const areAllImagesLoaded = useMemo(() => {
    // Check category images
    const categoryImagesLoaded = reportData.Categories?.items?.every(category =>
      !category.attachments?.length || // Skip if no attachments
      (imageUrlsMap[category.id] && loadedImages[category.id])
    ) ?? true;

    // Check action item images
    const actionItemImagesLoaded = reportData.ActionItems?.items?.every(item =>
      !item.attachments?.length || // Skip if no attachments
      (imageUrlsMap[item.id] && loadedImages[item.id])
    ) ?? true;

    return categoryImagesLoaded && actionItemImagesLoaded;
  }, [reportData.Categories?.items, reportData.ActionItems?.items, imageUrlsMap, loadedImages]);

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
      
      // Also collect assignees from categories
      if (reportData.Categories?.items) {
        reportData.Categories.items.forEach(category => {
          if (category.assignees && category.assignees.length > 0) {
            category.assignees.forEach(id => allAssignees.add(id));
          }
        });
      }
      
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
  }, [reportData.ActionItems?.items, reportData.Categories?.items, reportData.organizationID, reportData.assignedMembers]);

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
      allImagesLoaded={areAllImagesLoaded}
      fromProject={fromProject}
    >
      {/* Report Information Header */}
      {renderReportInfoHeader()}
      
      {/* Header and Radar Chart Section - Landscape */}
      <div className="landscape capture-card">
        {/* Header */}
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

        {/* Radar Chart */}
        <Card style={cardStyle}>
          <RadarChart
            label_arr={chartData.map(category => category.name)}
            data_arr={chartData.map(category => isNaN(category.avgValue) ? 0 : category.avgValue)}
          />
        </Card>
      </div>

      {/* Categories Section - Portrait */}
      <div className="portrait new-page">
        <div className="capture-card">
          <Card style={cardStyle}>
            <Card.Header style={cardHeaderStyle}>
              <h2 style={{ margin: '20px 0' }}>Categories</h2>
            </Card.Header>
          </Card>
        </div>

        {reportData.Categories.items.map((category) => (
          <div key={category.id} className="capture-card">
            <Card style={cardStyle}>
              <Card.Header style={{...cardHeaderStyle, display: 'flex', justifyContent: 'space-between'}}>
                <div>{category.name}</div>
                <div>
                  <Badge variant="light">Total: {calculateTotal(category.Statements.items)}</Badge>{' '}
                  <Badge variant="light">
                    Average: {calculateAverage(category.Statements.items).toFixed(2)}
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body style={cardBodyStyle}>
                <Table striped bordered hover>
                  {reportData.type === "Mistake Proofing Report" && (
                    <thead>
                      <tr>
                        <th>Score Type</th>
                        <th>Value</th>
                        <th>Interpretation</th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {category.Statements.items.map((statement) => {
                      // Ensure value is defined, default to 3 if undefined
                      const value = statement.value !== undefined && statement.value !== null ? 
                        statement.value : 3;
                        
                      return (
                        <tr key={statement.id}>
                          <td>{statement.name}</td>
                          <td>
                            <Badge variant="light">{value}</Badge>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {reportData.type === "Mistake Proofing Report" ? (
                              <span style={{ 
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                color: 'white',
                                backgroundColor: value >= 4 ? '#dc3545' : // High risk (red)
                                                value === 3 ? '#fd7e14' : // Medium risk (orange)
                                                '#28a745' // Low risk (green)
                              }}>
                                {getValueText(value, reportData.type, statement.name)}
                              </span>
                            ) : (
                              getValueText(value, reportData.type, statement.name)
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>

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
                      <>
                        <p>Attachment(s):</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
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

        {/* Action Items Section - Portrait (will flow after categories) */}
        {reportData.ActionItems?.items?.length > 0 && (
          <div className="capture-card">
            <Card style={cardStyle}>
              <Card.Header style={cardHeaderStyle}>
                <h2 style={{ margin: '20px 0' }}>Action Items: {reportData.ActionItems.items.length}</h2>
              </Card.Header>
            </Card>

            {reportData.ActionItems.items.map((item) => (
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

export default AssessmentReport; 