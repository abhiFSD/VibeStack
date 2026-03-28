import { Auth } from 'aws-amplify';

/**
 * Generate a simple unique ID using timestamp and random number
 * @returns {string} A unique ID
 */
const generateSimpleId = () => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `${timestamp}-${random}`;
};

/**
 * Generates a PDF using the external PDF generator API
 * @param {string} url - The URL of the page to convert to PDF
 * @param {number} waitTime - Time to wait for page rendering (in seconds)
 * @returns {Promise<string>} - Promise that resolves to the PDF URL
 */
export const generatePdfViaApi = async (url, waitTime = 60) => {
  try {
    // Try to get current authenticated user, fallback to anonymous if not authenticated
    let userId = 'anonymous';
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      userId = currentUser.attributes.sub || currentUser.username;
    } catch (authError) {
      console.log('No authenticated user found, using anonymous user for PDF generation');
      // Use anonymous user ID for public PDF generation
      userId = 'anonymous';
    }
    
    // Generate a simple job ID
    const jobId = generateSimpleId();
    
    // Get the API endpoint from environment variables
    const apiEndpoint = process.env.REACT_APP_PDF_API_ENDPOINT;
    
    // Create the request payload
    const payload = {
      url,
      wait_time: waitTime,
      user_id: userId,
      job_id: jobId
    };
    
    console.log('Sending PDF generation request to API:', `${apiEndpoint}/generate-pdf`);
    
    // Make the API request
    const response = await fetch(`${apiEndpoint}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Parse the response
    const data = await response.json();
    
    // Check if the request was successful
    if (!data.success) {
      throw new Error(data.message || 'PDF generation failed');
    }
    
    console.log('PDF generated successfully:', data);
    
    // Trigger file download
    downloadFile(data.file_url);
    
    // Return the file URL
    return data.file_url;
  } catch (error) {
    console.error('Error generating PDF via API:', error);
    throw error;
  }
};

/**
 * Generates a batch of PDFs using the external PDF generator API and combines them
 * @param {string[]} urls - Array of URLs to convert to PDFs
 * @param {number} waitTime - Time to wait for page rendering (in seconds)
 * @param {boolean} mergePdfs - Whether to merge the PDFs into one document
 * @returns {Promise<Object>} - Promise that resolves to the API response with file URLs
 */
export const generateBatchPdfViaApi = async (urls, waitTime = 60, mergePdfs = true) => {
  try {
    // Verify that urls is an array and not empty
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("No URLs provided for PDF generation");
    }

    // Try to get current authenticated user, fallback to anonymous if not authenticated
    let userId = 'anonymous';
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      userId = currentUser.attributes.sub || currentUser.username;
    } catch (authError) {
      console.log('No authenticated user found, using anonymous user for batch PDF generation');
      // Use anonymous user ID for public PDF generation
      userId = 'anonymous';
    }
    
    // Generate a simple job ID
    const jobId = generateSimpleId();
    
    // Get the API endpoint from environment variables
    const apiEndpoint = process.env.REACT_APP_PDF_API_ENDPOINT;
    
    if (!apiEndpoint) {
      throw new Error("PDF API endpoint is not configured");
    }
    
    // Create the request payload
    const payload = {
      urls,
      wait_time: waitTime,
      user_id: userId,
      job_id: jobId,
      merge_pdfs: mergePdfs
    };
    
    console.log('Prepared batch PDF generation request:', payload);
    console.log('PDF API endpoint:', apiEndpoint);
    
    // Log the request payload for testing
    console.log('Sending batch PDF generation request to API:', `${apiEndpoint}/batch-generate-pdf`);
    
    // Make the API request
    const response = await fetch(`${apiEndpoint}/batch-generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }
    
    // Parse the response
    const data = await response.json();
    
    // Check if the request was successful
    if (!data.overall_success) {
      console.error('API reported failure:', data);
      throw new Error(data.message || 'Batch PDF generation failed');
    }
    
    console.log('Batch PDF generated successfully:', data);
    
    // Trigger file download if there's a combined PDF
    if (data.combined_pdf_url) {
      downloadFile(data.combined_pdf_url);
    } else {
      console.warn('No combined PDF URL in the response');
    }
    
    // Return the API response
    return data;
  } catch (error) {
    console.error('Error generating batch PDF via API:', error);
    throw error;
  }
};

/**
 * Downloads a file from a URL
 * @param {string} url - The URL of the file to download
 */
export const downloadFile = (url) => {
  // Create a temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from URL
  const filename = url.substring(url.lastIndexOf('/') + 1);
  link.download = filename;
  
  // Append to the document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 