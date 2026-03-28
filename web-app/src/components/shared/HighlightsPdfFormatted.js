import React, { useEffect, useState } from 'react';
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

// CSS for formatted content with height control using standard properties
const formattedContentStyle = {
  fontSize: "11px", 
  lineHeight: "1.4em",
  padding: '8px',
  margin: '0',
  color: '#000000',
  // For PDF view, allow full content height
  maxHeight: window.location.pathname.includes('/report_pdf/') ? 'none' : '180px',
  height: window.location.pathname.includes('/report_pdf/') ? 'auto' : '180px',
  // For PDF view, show all content
  overflow: window.location.pathname.includes('/report_pdf/') ? 'visible' : 'hidden',
  position: 'relative'
};

// Gradient overlay to fade out text at bottom
const fadeOverlayStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '40px',
  background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,1) 100%)',
  pointerEvents: 'none'
};

// Style for content with image - smaller height, but auto for PDF view
const formattedContentWithImageStyle = {
  ...formattedContentStyle,
  // For PDF view, allow full content height even with images
  maxHeight: window.location.pathname.includes('/report_pdf/') ? 'none' : '100px',
  height: window.location.pathname.includes('/report_pdf/') ? 'auto' : '100px'
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

// Function to handle HTML content for PDF view - removed truncation to show full content
const truncateHtmlByLines = (html, maxLines = 8, lineHeight = 1.4, fontSize = 11) => {
  if (!html) {
    return html;
  }
  
  // For PDF view, return the full HTML content without truncation
  // This ensures all content is visible in the PDF
  if (window.location.pathname.includes('/report_pdf/')) {
    return html;
  }
  
  // Create a temporary element to measure content
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: 200px;
    font-size: ${fontSize}px;
    line-height: ${lineHeight}em;
    padding: 8px;
  `;
  tempDiv.innerHTML = html;
  document.body.appendChild(tempDiv);
  
  const maxHeight = maxLines * lineHeight * fontSize;
  
  // If content fits, return as-is
  if (tempDiv.offsetHeight <= maxHeight) {
    document.body.removeChild(tempDiv);
    return html;
  }
  
  // Binary search to find the right amount of content
  let low = 0;
  let high = html.length;
  let bestFit = '';
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    tempDiv.innerHTML = html.substring(0, mid) + '...';
    
    if (tempDiv.offsetHeight <= maxHeight) {
      bestFit = html.substring(0, mid);
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  document.body.removeChild(tempDiv);
  
  // Ensure we don't cut in the middle of an HTML tag
  const lastOpenTag = bestFit.lastIndexOf('<');
  const lastCloseTag = bestFit.lastIndexOf('>');
  
  if (lastOpenTag > lastCloseTag) {
    bestFit = bestFit.substring(0, lastOpenTag);
  }
  
  return bestFit + '...';
};

// Function to preserve basic formatting for PDF view - removed truncation to show full content
const preserveBasicFormatting = (html, maxChars = 200) => {
  if (!html) {
    return html;
  }
  
  // For PDF view, return the full HTML content without truncation
  // This ensures all content is visible in the PDF
  if (window.location.pathname.includes('/report_pdf/')) {
    return html;
  }
  
  // For non-PDF views, apply the original formatting and truncation logic
  // Convert common formatting to preserve structure
  let processedHtml = html
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '<br/>')
    .replace(/<br\s*\/?>/g, '<br/>')
    .replace(/<ul>/g, '<br/>')
    .replace(/<\/ul>/g, '')
    .replace(/<ol>/g, '<br/>')
    .replace(/<\/ol>/g, '')
    .replace(/<li>/g, '• ')
    .replace(/<\/li>/g, '<br/>')
    .replace(/<h\d>/g, '<strong>')
    .replace(/<\/h\d>/g, '</strong><br/>');
  
  // If short enough, return as-is
  if (processedHtml.length <= maxChars) {
    return processedHtml;
  }
  
  // Truncate and ensure tags are closed
  let truncated = processedHtml.substring(0, maxChars);
  
  // Count open tags
  const strongOpen = (truncated.match(/<strong>/g) || []).length;
  const strongClose = (truncated.match(/<\/strong>/g) || []).length;
  const emOpen = (truncated.match(/<em>/g) || []).length;
  const emClose = (truncated.match(/<\/em>/g) || []).length;
  
  // Add closing tags as needed
  if (strongOpen > strongClose) {
    truncated += '</strong>';
  }
  if (emOpen > emClose) {
    truncated += '</em>';
  }
  
  return truncated + '...';
};

const HighlightsPdfFormatted = ({ 
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
                        <div style={{ height: '100%', position: 'relative' }}>
                          {hasImages && (
                            <div style={{ 
                              position: 'relative', 
                              width: '80px', 
                              height: '80px', 
                              marginRight: '20px', 
                              float: 'left'
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
                            <>
                              <div 
                                style={hasImages ? formattedContentWithImageStyle : formattedContentStyle} 
                                dangerouslySetInnerHTML={{ 
                                  __html: preserveBasicFormatting(highlight.description, isDMAIC ? 1200 : 200)
                                }}
                              />
                              {/* Only show fade overlay when not in PDF view */}
                              {!window.location.pathname.includes('/report_pdf/') && (
                                <div style={fadeOverlayStyle}></div>
                              )}
                            </>
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

export default HighlightsPdfFormatted;