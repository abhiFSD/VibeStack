import { API } from 'aws-amplify';
import * as mutations from '../graphql/mutations';

/**
 * Creates highlight sections for specific report types
 * @param {string} reportId - The ID of the report
 * @param {string} reportType - The type of report
 * @returns {Promise} - Promise that resolves when all highlights are created
 */
export const createHighlights = async (reportId, reportType) => {
  try {
    let titles = [];

    if (reportType === 'Leadership Report') {
      titles = [
        'Accomplishments and significant events',
        'Improvement PDCAs',
        'Special recognitions',
        'Upcoming issues and events',
        'Resource and support needs',
        'Action Items'
      ];
    } else if (reportType === 'A3 Project Report') {
      titles = [
        'Problem Statement',
        'Current State',
        'Improvement Opportunity',
        'Problem Analysis',
        'Future State',
        'Implementation Plan',
        'Verify Results',
        'Follow-Up',
      ];
    } else if (reportType === 'PDCA Report') {
      titles = [
        'Plan',
        'Do',
        'Check',
        'Act',
      ];
    } else if (reportType === 'DMAIC Report') {
      titles = [
        '(Prepare)',
        'Define',
        'Measure',
        'Analyze',
        'Improve',
        'Control',
      ];
    }
  
    for (const title of titles) {
      const highlightInput = {
        title: title || '',
        reportID: reportId,
        description: '',
        images: [],
        assignees: [],
        waste_type: ''
      };

      await API.graphql({
        query: mutations.createHighlights,
        variables: { input: highlightInput }
      });
    }
  } catch (error) {
    console.error('Error creating highlights:', error);
    if (error.errors) {
      console.error('GraphQL Errors:', error.errors);
    }
    throw error;
  }
}; 