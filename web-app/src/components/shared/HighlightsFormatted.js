import React, { useEffect, useState, useRef } from 'react';
import { Storage, Auth } from 'aws-amplify';
import { Card, Table, Badge } from 'react-bootstrap';
import AttachmentImage from './AttachmentImage';

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
  // For PDF view, use auto height to show all content
  height: window.location.pathname.includes('/report_pdf/') ? "auto" : "260px",
  minHeight: window.location.pathname.includes('/report_pdf/') ? "200px" : undefined,
  // For PDF view, use visible overflow to show all content
  overflow: window.location.pathname.includes('/report_pdf/') ? "visible" : "hidden",
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: window.location.pathname.includes('/report_pdf/') ? '0' : undefined,
  backgroundColor: '#ffffff'
};

const statusText = {
  0: 'To Do',
  1: 'In Progress',
  2: 'In Review',
  3: 'Done'
};

// CSS for formatted content with height control
const formattedContentStyle = {
  fontSize: "11px", 
  lineHeight: "1.4",
  flex: '1 0 auto',
  padding: window.location.pathname.includes('/report_pdf/') ? '8px' : undefined,
  margin: window.location.pathname.includes('/report_pdf/') ? '0' : undefined,
  color: '#000000',
  maxHeight: '180px',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 8, // Approximately 8 lines for 180px with 1.4 line-height
  WebkitBoxOrient: 'vertical',
  overflowWrap: 'break-word',
  wordBreak: 'break-word'
};

// Style for content with image - reduced line clamp
const formattedContentWithImageStyle = {
  ...formattedContentStyle,
  WebkitLineClamp: 5, // Fewer lines when image is present
  maxHeight: '100px'
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

// Function to safely truncate HTML content while preserving tags
const truncateHtmlForPdf = (html, maxLength = 700, isDMAIC = false) => {
  if (!html || !window.location.pathname.includes('/report_pdf/')) {
    return html;
  }
  
  // Use higher character limit for DMAIC reports
  const effectiveMaxLength = isDMAIC ? 1200 : maxLength;
  
  // If content is already short enough, return as-is
  if (html.length <= effectiveMaxLength) {
    return html;
  }
  
  // For now, do a simple truncation that preserves complete tags
  // This is a simplified approach - a full implementation would need a proper HTML parser
  let truncated = html.substring(0, effectiveMaxLength);
  
  // Try to find the last complete tag
  const lastOpenTag = truncated.lastIndexOf('<');
  const lastCloseTag = truncated.lastIndexOf('>');
  
  if (lastOpenTag > lastCloseTag) {
    // We're in the middle of a tag, truncate before it
    truncated = truncated.substring(0, lastOpenTag);
  }
  
  // Add ellipsis
  truncated += '...';
  
  // Close any open tags (simplified - just common tags)
  const openTags = [];
  const tagRegex = /<(\w+)[^>]*>/g;
  const closeTagRegex = /<\/(\w+)>/g;
  
  let match;
  while ((match = tagRegex.exec(truncated)) !== null) {
    openTags.push(match[1]);
  }
  
  while ((match = closeTagRegex.exec(truncated)) !== null) {
    const index = openTags.lastIndexOf(match[1]);
    if (index !== -1) {
      openTags.splice(index, 1);
    }
  }
  
  // Close remaining open tags
  for (let i = openTags.length - 1; i >= 0; i--) {
    truncated += `</${openTags[i]}>`;
  }
  
  return truncated;
};

const HighlightsFormatted = ({ 
    highlightsData, 
    actionItemsData, 
    isA3, 
    isLeadership, 
    isDMAIC, 
    isPDCA,
    onImageLoad
  }) => {
    // Generate a unique ID by prepending "grid_" to the original ID to avoid conflicts
    const getUniqueGridId = (originalId) => `grid_${originalId}`;

    return (
      <Card style={{ border: 0, marginBottom: 20 }}>
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
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          {hasImages && (
                            <div style={{ 
                              position: 'relative', 
                              width: '80px', 
                              height: '80px', 
                              marginRight: '20px', 
                              float: 'left',
                              flexShrink: 0
                            }}>
                              <AttachmentImage 
                                path={highlight.images[0]}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onLoad={() => onImageLoad && onImageLoad(uniqueGridId)}
                              />
                            </div>
                          )}
                          {highlight.description ? (
                            <div 
                              style={hasImages ? formattedContentWithImageStyle : formattedContentStyle} 
                              dangerouslySetInnerHTML={{ 
                                __html: truncateHtmlForPdf(highlight.description, 200, isDMAIC)
                              }}
                            />
                          ) : null}
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
                            {actionItemsData.map((item) => (
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
                      {actionItemsData.map((item) => (
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

export default HighlightsFormatted;