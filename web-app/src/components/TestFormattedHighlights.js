import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Highlights from './shared/Highlights';
import HighlightsFormatted from './shared/HighlightsFormatted';
import HighlightsPdfFormatted from './shared/HighlightsPdfFormatted';

const TestFormattedHighlights = () => {
  // Sample data with HTML formatting
  const sampleHighlights = [
    {
      id: '1',
      title: 'Problem Statement',
      description: `<p>This is a <strong>bold statement</strong> about the problem.</p>
<p>Here's a new paragraph with <em>italic text</em>.</p>
<ul>
<li>First bullet point</li>
<li>Second bullet point</li>
</ul>
<p>And a final paragraph with <strong><em>bold italic text</em></strong>.</p>`,
      images: []
    },
    {
      id: '2',
      title: 'Current State',
      description: `<p>The current state has multiple issues:</p>
<ol>
<li>First issue with <strong>emphasis</strong></li>
<li>Second issue with <em>details</em></li>
<li>Third issue that's quite long and will demonstrate how the text wrapping works when we have a lot of content in a single line item</li>
</ol>
<p>Additional paragraph with line<br/>break in the middle.</p>`,
      images: []
    },
    {
      id: '3',
      title: 'Improvement Opportunity',
      description: `<h4>Key Opportunities</h4>
<p>We can improve by:</p>
<ul>
<li><strong>Reducing cycle time</strong> by 50%</li>
<li><em>Improving quality</em> metrics</li>
<li>Enhancing customer satisfaction</li>
</ul>
<p>This will result in <strong>$1.2M savings</strong> annually.</p>`,
      images: []
    },
    {
      id: '4',
      title: 'Problem Analysis',
      description: `<p>Root cause analysis reveals:</p>
<p><strong>Primary Causes:</strong></p>
<ul>
<li>Inefficient processes</li>
<li>Lack of standardization</li>
<li>Poor communication</li>
</ul>
<p><strong>Secondary Causes:</strong></p>
<ul>
<li>Training gaps</li>
<li>Technology limitations</li>
</ul>`,
      images: []
    }
  ];

  const sampleActionItems = [
    { id: '1', title: 'Review Process', status: 0, note: false },
    { id: '2', title: 'Update SOPs', status: 1, note: false },
    { id: '3', title: 'Train Staff', status: 2, note: false }
  ];

  // Simulate PDF view by modifying pathname
  const originalPathname = window.location.pathname;
  
  React.useEffect(() => {
    // Force PDF view mode for testing
    Object.defineProperty(window.location, 'pathname', {
      writable: true,
      value: '/report_pdf/test-id'
    });
    
    return () => {
      // Restore original pathname
      Object.defineProperty(window.location, 'pathname', {
        writable: true,
        value: originalPathname
      });
    };
  }, [originalPathname]);

  return (
    <Container fluid style={{ padding: '20px' }}>
      <h2 className="mb-4">Highlights Formatting Comparison</h2>
      
      <Row>
        <Col xs={12}>
          <Card className="mb-4">
            <Card.Header>
              <h4>Original Version (Strips HTML Formatting)</h4>
            </Card.Header>
            <Card.Body>
              <Highlights 
                highlightsData={sampleHighlights}
                actionItemsData={sampleActionItems}
                isA3={true}
                isDMAIC={false}
                isPDCA={false}
                onImageLoad={() => {}}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card>
            <Card.Header>
              <h4>New Formatted Version (Preserves HTML with Height Control)</h4>
            </Card.Header>
            <Card.Body>
              <HighlightsFormatted 
                highlightsData={sampleHighlights}
                actionItemsData={sampleActionItems}
                isA3={true}
                isDMAIC={false}
                isPDCA={false}
                onImageLoad={() => {}}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Card className="mb-4">
            <Card.Header>
              <h4>PDF-Optimized Version (Basic Formatting with Height Control)</h4>
            </Card.Header>
            <Card.Body>
              <HighlightsPdfFormatted 
                highlightsData={sampleHighlights}
                actionItemsData={sampleActionItems}
                isA3={true}
                isDMAIC={false}
                isPDCA={false}
                onImageLoad={() => {}}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12}>
          <Card>
            <Card.Header>
              <h4>Key Differences</h4>
            </Card.Header>
            <Card.Body>
              <ul>
                <li><strong>Original:</strong> Removes all HTML tags, no formatting preserved</li>
                <li><strong>Formatted (CSS):</strong> Preserves HTML formatting using CSS line-clamp (may not work in PDF)</li>
                <li><strong>PDF-Optimized:</strong> Converts formatting to simpler HTML that works in PDFs:
                  <ul>
                    <li>Paragraphs → Line breaks</li>
                    <li>Lists → Bullet points with line breaks</li>
                    <li>Bold and italic preserved</li>
                    <li>Fixed height with gradient fade</li>
                  </ul>
                </li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TestFormattedHighlights;