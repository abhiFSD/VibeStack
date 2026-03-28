import React, { useEffect, useState, useRef } from 'react';
import { Storage, Auth } from 'aws-amplify';
import { Card, Table, Badge } from 'react-bootstrap';
import AttachmentImage from './AttachmentImage';
import PublicAttachmentImage from './PublicAttachmentImage';
import '../../styles/highlight-content.css';
import a3ProjectReport from '../../assets/lean-tools/dark/a3_project_report.png';

const cardStyle = {
     minWidth: '0',
     maxWidth: '100%',
};
  
const cardHeaderStyle = {
  backgroundColor: '#009688',
  color: 'white',
  padding: window.location.pathname.includes('/report_pdf/') ? '3px 10px' : '6px 10px',
  display: "flex",
  alignItems: "center",
  fontSize: '0.95rem',
  fontWeight: 'bold'
};

const cardBodyStyle = {
  // Fixed height for both PDF and regular view to maintain grid layout
  height: window.location.pathname.includes('/report_pdf/') ? "290px" : "260px",
  minHeight: window.location.pathname.includes('/report_pdf/') ? "200px" : undefined,
  // Hidden overflow to prevent content from breaking grid layout
  overflow: "hidden",
  display: 'flex',
  flexDirection: 'column',
  padding: window.location.pathname.includes('/report_pdf/') ? '8px' : undefined,
  backgroundColor: '#ffffff',
  boxSizing: 'border-box'
};

const statusText = {
  0: 'To Do',
  1: 'In Progress',
  2: 'In Review',
  3: 'Done'
};

const customContent = {
    fontSize: "11px", 
    lineHeight: 1.2,
    flex: '1 0 auto',
    padding: window.location.pathname.includes('/report_pdf/') ? '0' : undefined,
    margin: window.location.pathname.includes('/report_pdf/') ? '0' : undefined,
    color: '#000000'
};

// Specific style for PDF view content
const customContentPdf = {
    fontSize: "11px", 
    lineHeight: 1.2,
    padding: '0',
    margin: '0',
    color: '#000000',
    // Remove flex to allow text wrapping around floated images
    display: 'block',
    // Allow text to flow around floated images
    textAlign: 'left',
    wordWrap: 'break-word',
    overflowWrap: 'break-word'
};

const getStatusBadgeColor = (status) => {
    switch (status) {
      case 0:
        return 'green';
      case 1:
        return 'orange';
      case 2:
        return 'blue';
      case 3:
        return 'lightgreen';
      default:
        return 'black';
    }
  };

// Component to render grid images
const GridImageRenderer = ({ imagePath, cardId, onImageLoad }) => {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      try {
        // Get direct signed URL with cache busting
        const timestamp = Date.now();
        
        // Get credentials from Auth
        const credentials = await Auth.currentCredentials();
        
        // Get a direct URL to the image
        const signedUrl = await Storage.get(imagePath, {
          level: 'public',
          identityId: credentials.identityId,
          download: false // Just get the URL
        });
        
        if (isMounted) {
          // Use cache busting to avoid stale images
          setUrl(`${signedUrl}?t=${timestamp}`);
          setLoading(false);
          if (onImageLoad) onImageLoad(cardId);
        }
      } catch (err) {
        console.error(`Grid image error (${cardId}):`, err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [imagePath, cardId, onImageLoad]);
  
  // Fixed size container
  return (
    <div style={{ position: 'relative', width: '80px', height: '80px', marginRight: '20px', float: 'left' }}>
      {loading && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#f0f0f0', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '10px',
          color: '#666'
        }}>
          Loading
        </div>
      )}
      
      {error && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#ffeeee',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '10px',
          color: '#cc0000'
        }}>
          Error
        </div>
      )}
      
      {!loading && !error && url && (
        <img 
          src={url} 
          alt="Card image" 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

// No text truncation - let CSS handle the visual cutoff
const getFullText = (text) => {
  if (!text) {
    return text;
  }
  
  // Return full text content - CSS will handle the visual cutoff
  return text;
};

const Highlighets = ({ 
    highlightsData, 
    actionItemsData, 
    isA3, 
    isLeadership, 
    isDMAIC, 
    isPDCA,
    onImageLoad,
    imageUrlsMap = {}
  }) => {
    // Generate a unique ID by prepending "grid_" to the original ID to avoid conflicts
    const getUniqueGridId = (originalId) => `grid_${originalId}`;

    // Debug logging for PDF view
    if (window.location.pathname.includes('/report_pdf/')) {
      console.log('Highlights component - PDF view data:');
      console.log('highlightsData:', highlightsData);
      console.log('imageUrlsMap:', imageUrlsMap);
      console.log('isLeadership:', isLeadership);
    }

    return (
      <Card style={{ border: 0, marginBottom: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isA3 ? "repeat(4, 1fr)" : (isPDCA ? "repeat(2, 1fr)" : "repeat(3, 1fr)"),
            gridGap: "5px",
          }}
        >
          {highlightsData && (
            highlightsData.map((highlight, index) => {
              if (highlight.title === "Action Items") {
                return null; // Skip this card
              }

              // Generate a unique grid card ID
              const uniqueGridId = getUniqueGridId(highlight.id);
              const hasImages = highlight.images && highlight.images.length > 0;

              return (
                <div key={uniqueGridId} style={cardStyle} className="capture-card">
                  <Card.Header style={cardHeaderStyle}>
                    {highlight.title.length > 30 ? highlight.title.substring(0, 30) + '...' : highlight.title}
                  </Card.Header>
                  <Card.Body style={{ ...cardBodyStyle }}>
                    {highlight.title !== "Implementation Plan" && (
                      (highlight.description || hasImages) ? (
                        <div style={{ 
                          position: 'relative', 
                          height: '100%', 
                          overflow: 'hidden',
                          padding: '4px'
                        }}>
                          <div 
                            className="highlight-content"
                            style={{
                              overflow: 'hidden',
                              height: '100%',
                              wordWrap: 'break-word',
                              lineHeight: '1.2em',
                              fontSize: '11px',
                              textAlign: 'left'
                            }}
                          >
                            {hasImages && highlight.images && highlight.images[0] && (
                              <div style={{
                                float: 'left',
                                width: '65px',
                                height: '65px',
                                marginRight: '8px',
                                marginBottom: '4px',
                                shapeOutside: 'margin-box',
                                WebkitShapeOutside: 'margin-box'
                              }}>
                                {/* Use public image component for PDF view, regular for normal view */}
                                {window.location.pathname.includes('/report_pdf/') ? (
                                  <PublicAttachmentImage 
                                    path={highlight.images[0]}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                    onLoad={() => onImageLoad && onImageLoad(uniqueGridId)}
                                  />
                                ) : (
                                  <AttachmentImage 
                                    path={highlight.images[0]}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                    onLoad={() => onImageLoad && onImageLoad(uniqueGridId)}
                                  />
                                )}
                              </div>
                            )}
                            <div 
                              style={{
                                textAlign: 'justify',
                                lineHeight: 'inherit',
                                fontSize: 'inherit'
                              }}
                              dangerouslySetInnerHTML={{ __html: getFullText(highlight.description) }} 
                            />
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#666' }}>No description or images available</p>
                      )
                    )}
                    {isA3 && highlight.title === "Implementation Plan" && (
                      actionItemsData.length > 0 ? (
                        <Table striped bordered hover size="sm">
                          <thead>
                          </thead>
                          <tbody>
                            {actionItemsData.slice(0, 3).map((item) => (
                              <tr key={item.id}>
                                <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.title.length > 10 ? item.title.substring(0, 10) + '...' : item.title}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  {!item.note && 
                                    <div style={{
                                      backgroundColor: getStatusBadgeColor(item.status),
                                      color: 'white',
                                      borderRadius: '10px',
                                      padding: '3px 10px',
                                      display: 'inline-block',
                                      fontSize: '0.875em',
                                      fontSize: '12px',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {statusText[item.status]}
                                    </div>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <p>No Action Items available</p>
                      )
                    )}
                  </Card.Body>
                </div>
              );
            })
          )}
          {isLeadership && (
            <div style={cardStyle} className="capture-card">
              <Card.Header style={cardHeaderStyle}>
                Action Items / Notes:
              </Card.Header>
              <Card.Body style={{ ...cardBodyStyle }}>
              <Table striped bordered hover size="sm">
                      <thead>
                      </thead>
                      <tbody>
                      {actionItemsData.slice(0, 3).map((item) => (
                          <tr key={item.id}>
                          <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title.length > 10 ? item.title.substring(0, 10) + '...' : item.title}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                          {!item.note && 
                              <div style={{
                              backgroundColor: getStatusBadgeColor(item.status),
                              color: 'white',
                              borderRadius: '10px',
                              padding: '3px 10px',
                              display: 'inline-block',
                              fontSize: '0.875em',
                              fontSize: '12px',
                              whiteSpace: 'nowrap'
                              }}>
                              {statusText[item.status]}
                              </div>
                          }
                          </td>
                          </tr>
                      ))}
                      </tbody>
                  </Table>
              </Card.Body>
            </div>
          )}
        </div>
      </Card>
    );
  };

export default Highlighets;
