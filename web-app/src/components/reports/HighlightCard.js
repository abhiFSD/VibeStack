import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faTrash, faInfoCircle, faPencilAlt, faFileImage, faUserPlus, faChevronLeft, faChevronRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import { API, Storage } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import AttachmentsList from './AttachmentsList';
import ActionItemsCard from '../shared/ActionItemsCard';
import { compressImage, batchCompressImages } from '../../utils/imageUtils';
import '../../styles/highlight-content.css';

const infoData = [
  {
      "Accomplishments and significant events": "List the 3-7 key accomplishments or problems solved since the last report.\nTo make this easier to complete, consider making notes or adding to this section every day, or as significant things occur.\nLook back on your calendar and phone log, what key meetings or phone calls were conducted since the last report.\nDo not spend too much time on this or the other sections of this report. The entire report should only take 5-15 minutes to complete.",
      "Improvement PDCAs": "What improvement PDCA experiments were completed since the last report, and what were the results and outcomes, who participated, what are the next steps?\nHave any new or potential improvement ideas been identified? Capture them here.\nTo make this easier to complete, consider making notes or adding to this section every day, or as PDCA's occur.\nLook back on your calendar and phone log, what PDCA's were conducted since the last report.\nDo not spend too much time on this or the other sections of this report. The entire report should only take 5-15 minutes to complete.\nIf you've not had something in this section for a report or two, you need to develop an improvement plan as Action Item. Your leaders are expecting improvement initiatives!",
      "Special recognitions": "Was there any individual or team outstanding performance or successes that should be recognized? If so, document who did what, and how it helped the organization or team. Be as specific as you can.\nTo make this easier to complete, consider making notes or adding to this section every day, or as special recognition needs occur.\nLook back on your calendar and phone log, what performance since the last report deserves special recognition? Document it here.\nDo not spend too much time on this or the other sections of this report. The entire report should only take 5-15 minutes to complete.\nMake sure to thank the individuals or teams in person as well for their performance.",
      "Upcoming issues and events": "What are the 3-7 key issues, events, improvement targets, and or problems to resolve in the next report period?\nAre their vacations coming up, or holidays? Make sure to anticipate and plan for them with this report.\nTo make this easier to complete, consider making notes or adding to this section every as new things occur to you.\nLook back on your calendar and phone log, what key items are coming up in the next report period?\nDo not spend too much time on this or the other sections of this report. The entire report should only take 5-15 minutes to complete.",
      "Resource and support needs": "What resources or training might be required to achieve performance objective in the next report period?\nUse this section to document and communicate individual and team needs for success.\nTo make this easier to complete, consider making notes or adding to this section every day, or as needs are identified.\nLook back on your calendar and phone log, what key meetings or phone calls identified resource needs, like overtime, tools, or cross team support. Capture them here.\nDo not spend too much time on this or the other sections of this report. The entire report should only take 5-15 minutes to complete.\nUse this section to get the attention and support of your leadership. If you identify no needs, you should meet all goals!",
      'Problem Statement': 'What data do we have to support the significance of the problem?\nWhat percent of the time are we meeting customer expectations?\nWhat is the impact of the problem on the customers of the process?\nWhat is the "Business Line of Sight" between our strategic goals and dashboards to this particular issue?',
      'Current State': 'What is the value stream or process map, with cycle time and failure data, for this process?\nWhat does the map tell us about the complexity of our process?\nWhat is the feedback from employees/stakeholders on how the process is working for them?\nWhat other data do we need to collect to understand the process?\nCan we create a current state with a value stream map (with data)?',
      'Improvement Opportunity': 'How will we know when we have achieved success?\nAre there benchmarks or comparative data that we should review?\nWhat should we measure in order to (a) compare "before" and "after" and (b) know how we have made a difference in the process?\nHave we identified the wastes?\nWhat does the Voice of the Customer tell us about how we are providing value or meeting expectations?\nCan we show our goals using a Balanced Scorecard for the project? (E.g., flow, customer satisfaction, employee engagement, financial impact, etc.)\nWhat does the future state look like?',
      'Problem Analysis': 'Who will be impacted by changes in this process?\nWhat is the demand for the process - how many requests by hour of the day and/or day of the week?\nWhat is the detailed process flow?\nCan we use a Fishbone Diagram to find and show any likely problem areas and their related root causes?\nHow much waste is there in the process?\nHave we asked the "5 Whys" for each step?\nCan we show that we have identified the major problems using a Pareto Chart?\nHave we used an Impact Map or other tool to prioritize the wastes/problems we will address in this project?\nDo we understand the root causes of the problem?',
      'Future State': 'What gaps exist between current and future states and what changes in the process (PDCAs) should be taken to address these?\nWhat stakeholders will be involved in the action plan?\nWhat is the communication plan?\nCan we show a high-level summary of process steps that need to be changed?',
      'Implementation Plan': "What improvement tools and resources will we need to make the recommended improvements?\nWhat steps need to be taken to accomplish the improvement plan?\nWho will take the lead for each step?\nWhat time frame is required? When will the new process be implemented?\nWhat is the training/education plan?\nWhat data will continue to be collected, and how often will it be collected and reported?\nHow will feedback be obtained from customers and stakeholders?\nCan we show a high-level 4 W's of Who (does) What (by) When, and Why for this project?",
      'Verify Results': 'Can we show a chart or graph to display the process "before and after" to answer the question: Is there a difference?\nWhat are the comparative metrics?\nIs the new process meeting the target?\nDo we have a WWWW to represent any additional work that is needed?\nCan we summarize what we have learned from this improvement project?',
      'Follow-Up': 'Has SPC or a Visual Management system been considered to ensure monitoring improvements?\nWhat have we learned from this project?\nHow will the results continue to be shared with stakeholders and customers?\nHow will we share the learnings with others across the system?\nWhat other projects, topics, or issues have we discovered that should be addressed by follow-up improvement projects?',
      'Plan': 'What data do we have to support the significance of the problem?\nWhat percent of the time are we meeting customer expectations?\nWhat is the impact of the problem on the customers of the process?\nWhat is the "Business Line of Sight" between our strategic goals and dashboards to this particular issue?\nWhat is the value stream or process map, with cycle time and failure data, for this process?\nWhat does the map tell us about the complexity of our process?\nWhat is the feedback from employees/stakeholders on how the process is working for them?\nWhat other data do we need to collect to understand the process?\nCan we create a current state with a value stream map (with data)?',
      'Do': 'What gaps exist between current and future states, and what changes in the process (PDCAs) should be taken to address these?\nWhat stakeholders will be involved in the action plan?\nWhat is the communication plan?\nCan we show a high-level summary of process steps that need to be changed?',
      'Check': 'Who will be impacted by changes in this process?\nWhat is the demand for the process - how many requests by hour of the day and/or day of the week?\nWhat is the detailed process flow?\nCan we use a Fishbone Diagram to find and show any likely problem areas and their related root causes?\nHow much waste is there in the process?\nHave we asked the "5 Whys" for each step?\nCan we show that we have identified the major problems using a Pareto Chart?\nHave we used an Impact Map or other tool to prioritize the wastes/problems we will address in this project?\nDo we understand the root causes of the problem?',
      'Act': "What improvement tools and resources will we need to make the recommended improvements?\nWhat steps need to be taken to accomplish the improvement plan?\nWho will take the lead for each step?\nWhat time frame is required? When will the new process be implemented?\nWhat is the training/education plan?\nWhat data will continue to be collected, and how often will it be collected and reported?\nHow will feedback be obtained from customers and stakeholders?\nCan we show a high-level 4 W's of Who (does) What (by) When, and Why for this project?",
      'Prepare': 'What data do we have to support the significance of the problem?\nWhat percent of the time are we meeting patient/customer expectations?\nWhat is the impact of the problem on the customers of the process?\nWhat is the "Business Line of Sight" between our strategic goals and dashboards to this particular issue?',
      'Define': 'What is the value stream or process map, with cycle time and failure data, for this process?\nWhat does the map tell us about the complexity of our process?\nWhat is the feedback from employees/stakeholders on how the process is working for them?\nWhat other data do we need to collect to understand the process?\nCan we create a current state with a value stream map (with data)?',
      'Measure': 'How will we know when we have achieved success?\nAre there benchmarks or comparative data that we should review?\nWhat should we measure in order to (a) compare "before" and "after" and (b) know how we have made a difference in the process?\nHave we identified the wastes?\nWhat does the Voice of the Customer tell us about how we are providing value or meeting expectations?\nCan we show our goals using a Balanced Scorecard for the project? (E.g., flow, customer satisfaction, employee engagement, financial impact, etc.)\nWhat does the future state look like?',
      'Analyze': 'Who will be impacted by changes in this process?\nWhat is the demand for the process – how many requests/patients by hour of the day and/or day of the week?\nWhat is the detailed process flow?\nCan we use a Fishbone Diagram to find and show any likely problem areas and their related root causes?\nHow much waste is there in the process?\nHave we asked the "5 Whys" for each step?\nCan we show that we have identified the major problems using a Pareto Chart?\nHave we used an Impact Map or other tool to prioritize the wastes/problems we will address in this project?\nDo we understand the root causes of the problem?',
      'Improve': 'What gaps exist between current and future states, and what changes in the process (PDCAs) should be taken to address these?\nWhat stakeholders will be involved in the action plan?\nWhat is the communication plan?\nCan we show a high-level summary of process steps that need to be changed?',
      'Control': "What improvement tools and resources will we need to make the recommended improvements?\nWhat steps need to be taken to accomplish the improvement plan?\nWho will take the lead for each step?\nWhat time frame is required? When will the new process be implemented?\nWhat is the training/education plan?\nWhat data will continue to be collected, and how often will it be collected and reported?\nHow will feedback be obtained from customers and stakeholders?\nCan we show a high-level 4 W's of Who (does) What (by) When, and Why for this project?",
    }
];

const HighlightCard = ({ 
  highlight, 
  onViewDetails, 
  handleShowEmailDialog, 
  reportId, 
  reportType,
  onDeleteHighlight,
  onEditHighlight 
}) => {
  const [attachments, setAttachments] = useState([]);
  const [attachmentURLs, setAttachmentURLs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [assigneeInput, setAssigneeInput] = useState('');
  const fileInputRef = React.useRef();
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [addingAssignee, setAddingAssignee] = useState(false);
  const [deletingAssigneeIndex, setDeletingAssigneeIndex] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (highlight.images && highlight.images.length > 0 && highlight.images.some(image => image)) {
        const urls = await getUrlsFromKeys(highlight.images);
        setAttachmentURLs(urls);
        setAttachments(highlight.images);
      } else {
        setAttachmentURLs([]);
        setAttachments([]);
      }
    };

    fetchImages();
    
    // Initialize assignees from the highlight
    if (highlight.assignees && highlight.assignees.length > 0) {
      setAssignees(highlight.assignees);
    } else {
      setAssignees([]);
    }
  }, [highlight]);

  const getUrlsFromKeys = async (keys) => {
    const urls = await Promise.all(
      keys.map(key => Storage.get(key))
    );
    return urls;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    try {
      const processedFiles = [];
      const keys = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Only compress images, leave PDFs as-is
        const processedFile = file.type.startsWith('image/') 
          ? (await batchCompressImages([file]))[0]
          : file;
        
        processedFiles.push(processedFile);
        
        const key = `attachments/${Date.now()}-${file.name}`;
        await Storage.put(key, processedFile, {
          contentType: file.type
        });
        keys.push(key);
        
        const url = await Storage.get(key);
        setAttachmentURLs(prev => [...prev, url]);
        setAttachments(prev => [...prev, key]);
      }
      await saveAttachments(keys);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAssigneeSubmit = async () => {
    try {
      const result = await API.graphql({
        query: queries.getHighlights,
        variables: { id: highlight.id }
      });
      
      const existingHighlight = result.data.getHighlights;
      
      if (existingHighlight) {
        // Use current assignees state instead of parsing from input
        // This ensures we include any assignees that were deleted using the UI buttons
        const newAssignees = assignees.slice();
        
        // Add any new assignees from input that aren't already in the list
        const inputAssignees = assigneeInput.split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0 && !newAssignees.includes(name));
        
        if (inputAssignees.length > 0) {
          newAssignees.push(...inputAssignees);
        }
        
        const input = {
          id: highlight.id,
          assignees: newAssignees,
          _version: existingHighlight._version,
          title: existingHighlight.title || '',
          description: existingHighlight.description || '',
          images: existingHighlight.images || [],
          reportID: existingHighlight.reportID,
          waste_type: existingHighlight.waste_type || ''
        };

        const updatedHighlight = await API.graphql({
          query: mutations.updateHighlights,
          variables: { input }
        });
        
        // Update local state immediately without requiring a reload
        setAssigneeInput('');
        setShowAssigneeModal(false);
        
        // If the API returns the updated highlight, use it directly
        if (updatedHighlight?.data?.updateHighlights) {
          const serverAssignees = updatedHighlight.data.updateHighlights.assignees || [];
          setAssignees(serverAssignees);
        } else {
          // Otherwise just use the input assignees
          setAssignees(newAssignees);
        }
      }
    } catch (error) {
      console.error('Error updating assignees:', error);
    }
  };

  const saveAttachments = async (newKeys) => {
    try {
      const result = await API.graphql({
        query: queries.getHighlights,
        variables: { id: highlight.id }
      });
      
      const existingHighlight = result.data.getHighlights;
      
      if (existingHighlight) {
        const mergedKeys = existingHighlight.images
          ? [...existingHighlight.images, ...newKeys]
          : newKeys;
          
        const input = {
          id: highlight.id,
          images: mergedKeys,
          _version: existingHighlight._version,
          title: existingHighlight.title || '',
          description: existingHighlight.description || '',
          assignees: existingHighlight.assignees || [],
          reportID: existingHighlight.reportID,
          waste_type: existingHighlight.waste_type || ''
        };

        await API.graphql({
          query: mutations.updateHighlights,
          variables: { input }
        });
      }
    } catch (error) {
      console.error('Error saving attachments:', error);
    }
  };

  const removeAttachments = async (index) => {
    try {
      const result = await API.graphql({
        query: queries.getHighlights,
        variables: { id: highlight.id }
      });
      const existingHighlight = result.data.getHighlights;
      if (existingHighlight && existingHighlight.images) {
        const updatedImages = existingHighlight.images.filter((_, i) => i !== index);
        
        const input = {
          id: highlight.id,
          images: updatedImages,
          _version: existingHighlight._version,
          title: existingHighlight.title || '',
          description: existingHighlight.description || '',
          assignees: existingHighlight.assignees || [],
          reportID: existingHighlight.reportID,
          waste_type: existingHighlight.waste_type || ''
        };

        await API.graphql({
          query: mutations.updateHighlights,
          variables: { input }
        });

        setAttachments(updatedImages);
        setAttachmentURLs(prev => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error(`Error removing attachment at index ${index}:`, error);
    }
  };

  const getHighlightColor = (title) => {
    switch (title) {
      case 'Prepare':
        return '#f8f9fa';
      case 'Define':
        return '#f8f9fa';
      case 'Measure':
        return '#f8f9fa';
      case 'Analyze':
        return '#f8f9fa';
      case 'Improve':
        return '#f8f9fa';
      case 'Control':
        return '#f8f9fa';
      default:
        return '#f8f9fa';
    }
  };

  const cardStyle = {
    height: '400px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    border: '1px solid #dee2e6',
    borderRadius: '0.5rem',
    overflow: 'hidden'
  };

  const headerStyle = {
    backgroundColor: '#00897b',
    borderBottom: '1px solid #dee2e6',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white'
  };

  const bodyStyle = {
    padding: '1rem',
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'calc(400px - 59px)',
    scrollbarWidth: 'thin',
    scrollbarColor: '#00897b #f0f0f0',
    WebkitOverflowScrolling: 'touch'
  };

  const buttonGroupStyle = {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
    marginLeft: 'auto'
  };

  const handleImageClick = () => {
    setCurrentImageIndex(0);
    setShowImageModal(true);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? attachmentURLs.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === attachmentURLs.length - 1 ? 0 : prev + 1
    );
  };

  const handleOpenAssigneeModal = () => {
    // Don't populate input with existing assignees anymore
    setAssigneeInput('');
    setShowAssigneeModal(true);
  };

  const handleDeleteAssignee = async (index) => {
    try {
      setDeletingAssigneeIndex(index);
      
      // Remove the assignee from local state first
      const updatedAssignees = assignees.filter((_, i) => i !== index);
      setAssignees(updatedAssignees);

      // Then update in the database
      const result = await API.graphql({
        query: queries.getHighlights,
        variables: { id: highlight.id }
      });
      
      const existingHighlight = result.data.getHighlights;
      
      if (existingHighlight) {
        const input = {
          id: highlight.id,
          assignees: updatedAssignees,
          _version: existingHighlight._version,
          title: existingHighlight.title || '',
          description: existingHighlight.description || '',
          images: existingHighlight.images || [],
          reportID: existingHighlight.reportID,
          waste_type: existingHighlight.waste_type || ''
        };

        await API.graphql({
          query: mutations.updateHighlights,
          variables: { input }
        });
      }
    } catch (error) {
      console.error('Error deleting assignee:', error);
    } finally {
      setDeletingAssigneeIndex(null);
    }
  };

  const handleAddAssignee = async () => {
    if (!assigneeInput.trim()) return;
    
    try {
      setAddingAssignee(true);
      
      // Get the current highlight to get the latest version
      const result = await API.graphql({
        query: queries.getHighlights,
        variables: { id: highlight.id }
      });
      
      const existingHighlight = result.data.getHighlights;
      
      if (existingHighlight) {
        // Split input by commas to get multiple assignees
        const newAssignees = assigneeInput
          .split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0 && !assignees.includes(name));
        
        if (newAssignees.length === 0) {
          setAssigneeInput('');
          setAddingAssignee(false);
          return; // Don't add if all are duplicates or empty
        }
        
        const updatedAssignees = [...assignees, ...newAssignees];
        
        const input = {
          id: highlight.id,
          assignees: updatedAssignees,
          _version: existingHighlight._version,
          title: existingHighlight.title || '',
          description: existingHighlight.description || '',
          images: existingHighlight.images || [],
          reportID: existingHighlight.reportID,
          waste_type: existingHighlight.waste_type || ''
        };

        const updatedHighlight = await API.graphql({
          query: mutations.updateHighlights,
          variables: { input }
        });
        
        // Clear the input field
        setAssigneeInput('');
        
        // Update the assignees state
        if (updatedHighlight?.data?.updateHighlights) {
          const serverAssignees = updatedHighlight.data.updateHighlights.assignees || [];
          setAssignees(serverAssignees);
        } else {
          setAssignees(updatedAssignees);
        }
      }
    } catch (error) {
      console.error('Error adding assignee:', error);
    } finally {
      setAddingAssignee(false);
    }
  };

  const handleDeleteImage = async () => {
    if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await removeAttachments(currentImageIndex);
        
        // Close modal if no images left, otherwise adjust current index
        if (attachmentURLs.length <= 1) {
          setShowImageModal(false);
        } else if (currentImageIndex === attachmentURLs.length - 1) {
          // If we're deleting the last image, go to the previous one
          setCurrentImageIndex(currentImageIndex - 1);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Add CSS for WebKit browsers (Chrome, Safari)
  const scrollStyles = `
    .highlight-card-body::-webkit-scrollbar {
      width: 8px;
    }
    .highlight-card-body::-webkit-scrollbar-track {
      background: #f0f0f0;
    }
    .highlight-card-body::-webkit-scrollbar-thumb {
      background-color: #00897b;
      border-radius: 4px;
    }
  `;

  return (
    <>
      <style>{scrollStyles}</style>
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: 'bold', flex: 1 }}>
            {highlight.title}
          </h5>
          <div style={buttonGroupStyle}>
            {highlight.title !== "Implementation Plan" && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  style={{ display: 'none' }}
                />
                <Button
                  variant="link"
                  size="sm"
                  style={{ padding: '4px', minWidth: '32px', color: 'white' }}
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : (
                    <FontAwesomeIcon icon={faFileImage} size="lg" />
                  )}
                </Button>
              <Button
                variant="link"
                  size="sm"
                  style={{ padding: '4px', minWidth: '32px', color: 'white' }}
                  onClick={() => onEditHighlight(highlight.id)}
              >
                  <FontAwesomeIcon icon={faPencilAlt} size="lg" />
              </Button>
                <Button
                  variant="link"
                  size="sm"
                  style={{ padding: '4px', minWidth: '32px', color: 'white' }}
                  onClick={handleOpenAssigneeModal}
                >
                  <FontAwesomeIcon icon={faUserPlus} size="lg" />
                </Button>
              </>
              )}
              {reportType !== 'Waste Walk Report' && (
                <Button
                  variant="link"
                  size="sm"
                  style={{ padding: '4px', minWidth: '32px', color: 'white' }}
                  onClick={() => setShowInfoModal(true)}
                >
                  <FontAwesomeIcon icon={faInfoCircle} size="lg" />
                </Button>
              )}
              {/* Add delete button only for Waste Walk Report */}
              {reportType === 'Waste Walk Report' && (
                <Button
                  variant="link"
                  size="sm"
                  style={{ padding: '4px', minWidth: '32px', color: 'white' }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
                      onDeleteHighlight(highlight.id);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} size="lg" />
                </Button>
              )}
          </div>
        </div>
        <div style={bodyStyle} className="highlight-card-body">
          {assignees.length > 0 && highlight.title !== "Implementation Plan" && (
            <div className="mb-2 text-muted">
              <small>Assignees: {assignees.join(', ')}</small>
            </div>
          )}
          <div style={{ position: 'relative' }}>
            {highlight.title === "Implementation Plan" && reportType === "A3 Project Report" ? (
              <ActionItemsCard reportId={reportId} />
            ) : (
              <>
                {attachments?.filter(Boolean).length > 0 && attachmentURLs?.filter(Boolean).length > 0 && (
                  <div style={{ 
                    float: 'left',
                    width: '150px',
                    marginRight: '15px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    shapeOutside: 'margin-box',
                    WebkitShapeOutside: 'margin-box'
                  }}
                  onClick={() => {
                    const firstAttachment = attachments[0];
                    if (firstAttachment && firstAttachment.toLowerCase().endsWith('.pdf')) {
                      window.open(attachmentURLs[0], '_blank');
                    } else {
                      handleImageClick();
                    }
                  }}
                  >
                    {attachmentURLs.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        margin: '4px',
                        zIndex: 1
                      }}>
                        +{attachmentURLs.length - 1} more {attachments.some(a => a.toLowerCase().endsWith('.pdf')) ? 'files' : 'images'}
                      </div>
                    )}
                    {attachments[0] && attachments[0].toLowerCase().endsWith('.pdf') ? (
                      <div style={{ 
                        width: '100%', 
                        height: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        <svg width="40" height="50" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 0H40L60 20V70C60 75.5228 55.5228 80 50 80H10C4.47715 80 0 75.5228 0 70V10C0 4.47715 4.47715 0 10 0Z" fill="#E74C3C"/>
                          <path d="M40 0L60 20H50C44.4772 20 40 15.5228 40 10V0Z" fill="#C0392B"/>
                          <text x="30" y="50" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">PDF</text>
                        </svg>
                        <div style={{ fontSize: '10px', marginTop: '5px', textAlign: 'center', wordBreak: 'break-all' }}>
                          {attachments[0].split('/').pop()}
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={attachmentURLs[0]}
                        alt={`Attachment 1`}
                        style={{ 
                          width: '100%', 
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                      />
                    )}
                  </div>
                )}
                <div 
                  className="highlight-content"
                  dangerouslySetInnerHTML={{ __html: highlight.description }} 
                />
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Info Modal */}
      <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{highlight.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {infoData[0][highlight.title]?.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </Modal.Body>
      </Modal>

      {/* Assignee Modal */}
      <Modal show={showAssigneeModal} onHide={() => setShowAssigneeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Manage Assignees</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => {
            e.preventDefault();
            handleAddAssignee();
          }}>
            <Form.Group className="d-flex mb-3">
              <Form.Label className="w-100 mb-2">Enter names (comma-separated)</Form.Label>
            </Form.Group>
            
            <Form.Group className="d-flex mb-3">
              <Form.Control
                type="text"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                placeholder="John Smith, Jane Doe"
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              className="ms-2" 
              onClick={handleAddAssignee}
              disabled={!assigneeInput.trim() || addingAssignee}
            >
              {addingAssignee ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Adding...
                </>
              ) : (
                'Add'
              )}
            </Button>
            
            {/* Display current assignees list */}
            <div className="mt-3">
              <h6>Current Assignees:</h6>
              {assignees.length > 0 ? (
                <ul className="list-group">
                  {assignees.map((assignee, index) => (
                    <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      {assignee}
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="px-3 py-1"
                        style={{ fontSize: '0.8rem', fontWeight: '500' }}
                        onClick={() => handleDeleteAssignee(index)}
                        disabled={deletingAssigneeIndex === index}
                      >
                        {deletingAssigneeIndex === index ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No assignees added yet</p>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssigneeModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Image Gallery Modal */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Images ({currentImageIndex + 1}/{attachmentURLs.length})</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 position-relative">
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
            position: 'relative',
            minHeight: '400px'
          }}>
            {attachmentURLs.length > 1 && (
              <>
                <Button
                  variant="dark"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    zIndex: 2,
                    opacity: 0.7
                  }}
                  onClick={handlePrevImage}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </Button>
                <Button
                  variant="dark"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    zIndex: 2,
                    opacity: 0.7
                  }}
                  onClick={handleNextImage}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </Button>
              </>
            )}
            {/* Delete button */}
            <Button
              variant="danger"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 2,
                opacity: 0.7
              }}
              onClick={handleDeleteImage}
              title="Delete this image"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Deleting...</span>
                </div>
              ) : (
                <FontAwesomeIcon icon={faTrash} />
              )}
            </Button>
            <img
              src={attachmentURLs[currentImageIndex]}
              alt={`Image ${currentImageIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default HighlightCard; 