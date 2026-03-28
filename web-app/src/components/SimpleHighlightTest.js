import React from 'react';
import { Card } from 'react-bootstrap';
import '../styles/highlight-content.css';

const SimpleHighlightTest = () => {
  const testContent = `<h1>Main Heading</h1>
<p>This is a <strong>bold statement</strong> with formatting that should wrap around the image nicely.</p>
<h2>Sub Heading</h2>
<p>This is a <em>italic text</em> example that continues flowing around the floated image on the left side.</p>
<h3>Smaller Heading</h3>
<ul>
<li>First bullet point that wraps</li>
<li>Second bullet point that also wraps around the image</li>
</ul>
<p>Final paragraph with enough text to demonstrate the text wrapping behavior around the floated image element.</p>`;

  const cardStyle = {
    width: '250px',
    height: '260px',
    margin: '10px'
  };

  const contentStyle = {
    fontSize: "11px", 
    lineHeight: 1.2,
    padding: '8px',
    margin: '0',
    color: '#000000',
    maxHeight: '180px',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9'
  };

  const strippedContentStyle = {
    ...contentStyle,
    backgroundColor: '#ffe6e6'
  };

  return (
    <div style={{ display: 'flex', padding: '20px', flexWrap: 'wrap' }}>
      <Card style={cardStyle}>
        <Card.Header style={{ backgroundColor: '#009688', color: 'white' }}>
          With HTML + Image Wrap
        </Card.Header>
        <Card.Body style={{ padding: '8px' }}>
          <div style={{ position: 'relative' }}>
            {/* Sample image */}
            <div style={{ 
              width: '80px', 
              height: '80px', 
              marginRight: '15px', 
              marginBottom: '10px',
              float: 'left',
              backgroundColor: '#ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: '#666',
              shapeOutside: 'margin-box',
              WebkitShapeOutside: 'margin-box'
            }}>
              IMG
            </div>
            <div 
              className="highlight-content"
              dangerouslySetInnerHTML={{ __html: testContent }} 
            />
          </div>
        </Card.Body>
      </Card>

      <Card style={cardStyle}>
        <Card.Header style={{ backgroundColor: '#009688', color: 'white' }}>
          With HTML (No Image)
        </Card.Header>
        <Card.Body style={{ padding: '8px' }}>
          <div 
            className="highlight-content"
            dangerouslySetInnerHTML={{ __html: testContent }}
          />
        </Card.Body>
      </Card>

      <Card style={cardStyle}>
        <Card.Header style={{ backgroundColor: '#d32f2f', color: 'white' }}>
          Without HTML (Old)
        </Card.Header>
        <Card.Body style={{ padding: '8px' }}>
          <div 
            style={{ fontSize: '13px', lineHeight: '1.4' }}
            dangerouslySetInnerHTML={{ __html: testContent.replace(/<[^>]*>/g, '') }}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default SimpleHighlightTest;