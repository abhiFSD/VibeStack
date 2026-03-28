import React, { useRef, useState } from 'react';
import { Alert, Button, Container, Spinner } from 'react-bootstrap';
import { generatePdfViaApi } from '../../utils/apiPdfGenerator';

const BaseReportPdf = ({ 
  children, 
  onGeneratePDF,
  isGeneratingPDF,
  allImagesLoaded = true,
  fromProject = false 
}) => {
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const defaultGeneratePDF = async () => {
    if (!allImagesLoaded) {
      console.warn('Not all images are loaded yet');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Get the current URL of the page
      const currentUrl = window.location.href;
      
      // Call the API to generate the PDF
      await generatePdfViaApi(currentUrl);
      
      console.log('PDF generation initiated successfully');
    } catch (error) {
      console.error('Error initiating PDF generation:', error);
      setGenerationError(error.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container style={{ width: '1024px' }}>
      {(isGeneratingPDF || isGenerating) && (
        <Alert variant="success">
          <Alert.Heading>
            PDF is generating, please wait it can take a moment..
            <Spinner animation="border" size="sm" className="ml-2" />
          </Alert.Heading>
        </Alert>
      )}

      {generationError && (
        <Alert variant="danger">
          <Alert.Heading>Error generating PDF</Alert.Heading>
          <p>{generationError}</p>
        </Alert>
      )}

      {!fromProject && (
        <div style={{ marginBottom: '20px' }}>
          <Button
            variant="primary"
            onClick={onGeneratePDF || defaultGeneratePDF}
            disabled={isGeneratingPDF || isGenerating || !allImagesLoaded}
            style={{ marginBottom: '20px' }}
          >
            {isGeneratingPDF || isGenerating ? (
              <>
                Generating PDF... <Spinner animation="border" size="sm" />
              </>
            ) : !allImagesLoaded ? (
              'Loading images...'
            ) : (
              'Export Report as PDF'
            )}
          </Button>
          <h6>Please allow all images to appear before exporting to PDF.</h6>
        </div>
      )}

      <div className="report-page" ref={reportRef}>
        {children}
      </div>
    </Container>
  );
};

export default BaseReportPdf; 