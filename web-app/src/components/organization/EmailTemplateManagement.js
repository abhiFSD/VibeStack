import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Form, Alert, Tabs, Tab, Badge, Spinner } from 'react-bootstrap';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faEnvelope, faCheck, faTimes, faList, faTh } from '@fortawesome/free-solid-svg-icons';
import { DEFAULT_EMAIL_TEMPLATES } from '../../utils/emailTemplates';

// Default email template examples for reference
const defaultTemplates = {
  REPORT_CREATED: {
    subject: 'New Report Created: {{reportName}}',
    htmlTemplate: `
      <h2>New Report Created</h2>
      <p>A new report "{{reportName}}" has been created.</p>
      <a href="{{reportURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Report
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{reportURL}}</p>
    `
  },
  REPORT_COMPLETED: {
    subject: 'Report Completed: {{reportName}}',
    htmlTemplate: `
      <h2>Report Completed</h2>
      <p>The report "{{reportName}}" has been marked as completed.</p>
      <a href="{{reportURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Report
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{reportURL}}</p>
    `
  },
  REPORT_MEMBER_ADDED: {
    subject: 'You have been added to report: {{reportName}}',
    htmlTemplate: `
      <h2>Report Assignment</h2>
      <p>You have been added to the report "{{reportName}}".</p>
      <a href="{{reportURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Report
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{reportURL}}</p>
    `
  },
  REPORT_MEMBER_REMOVED: {
    subject: 'You have been removed from report: {{reportName}}',
    htmlTemplate: `
      <h2>Report Access Update</h2>
      <p>You have been removed from the report "{{reportName}}".</p>
      <p>If you believe this is a mistake, please contact your administrator.</p>
    `
  },
  ACTION_ITEM_CREATED: {
    subject: 'New Action Item: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>New Action Item Created</h2>
      <p>A new action item "{{actionItemTitle}}" has been created.</p>
      <p><strong>Description:</strong> {{actionItemDescription}}</p>
      <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{actionItemURL}}</p>
    `
  },
  ACTION_ITEM_ASSIGNED: {
    subject: 'You have been assigned a new action item: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>Action Item Assignment</h2>
      <p>You have been assigned to the action item "{{actionItemTitle}}".</p>
      <p><strong>Description:</strong> {{actionItemDescription}}</p>
      <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{actionItemURL}}</p>
    `
  },
  ACTION_ITEM_COMPLETED: {
    subject: 'Action Item Completed: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>Action Item Completed</h2>
      <p>The action item "{{actionItemTitle}}" has been marked as completed.</p>
      <p><strong>Description:</strong> {{actionItemDescription}}</p>
      <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{actionItemURL}}</p>
    `
  },
  ACTION_ITEM_STATUS_CHANGED: {
    subject: 'Action Item Status Changed: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>Action Item Status Update</h2>
      <p>The status of action item "{{actionItemTitle}}" has been updated to "{{status}}".</p>
      <p><strong>Description:</strong> {{actionItemDescription}}</p>
      <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{actionItemURL}}</p>
    `
  },
  PROJECT_CREATED: {
    subject: 'New Project Created: {{projectName}}',
    htmlTemplate: `
      <h2>New Project Created</h2>
      <p>A new project "{{projectName}}" has been created.</p>
      <p>{{projectDescription}}</p>
      <a href="{{projectURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Project
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{projectURL}}</p>
    `
  },
  PROJECT_COMPLETED: {
    subject: 'Project Completed: {{projectName}}',
    htmlTemplate: `
      <h2>Project Completed</h2>
      <p>The project "{{projectName}}" has been marked as completed.</p>
      <a href="{{projectURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Project
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{projectURL}}</p>
    `
  },
  PROJECT_MEMBER_ADDED: {
    subject: 'You have been added to project: {{projectName}}',
    htmlTemplate: `
      <h2>Project Membership</h2>
      <p>You have been added to the project "{{projectName}}".</p>
      <p>{{projectDescription}}</p>
      <a href="{{projectURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Project
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{projectURL}}</p>
    `
  },
  PROJECT_MEMBER_REMOVED: {
    subject: 'You have been removed from project: {{projectName}}',
    htmlTemplate: `
      <h2>Project Membership Update</h2>
      <p>You have been removed from the project "{{projectName}}".</p>
      <p>If you believe this is a mistake, please contact your administrator.</p>
    `
  },
  AWARD_EARNED: {
    subject: 'Congratulations! You earned a new award: {{awardTitle}}',
    htmlTemplate: `
      <h2>New Award Earned</h2>
      <p>Congratulations! You have earned a new award: <strong>{{awardTitle}}</strong></p>
      <p>{{awardDescription}}</p>
      <p>You've earned {{awardCoins}} coins with this achievement!</p>
      <a href="{{awardsURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Your Awards
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{awardsURL}}</p>
    `
  },
  CUSTOM_NOTIFICATION: {
    subject: '{{subject}}',
    htmlTemplate: `
      <h2>{{title}}</h2>
      <p>{{message}}</p>
      <a href="{{actionURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          {{actionText}}
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{actionURL}}</p>
    `
  }
};

// Compare defaultTemplates with DEFAULT_EMAIL_TEMPLATES
const compareTemplates = () => {
  const defaultTemplateTypes = Object.keys(defaultTemplates);
  const utilTemplateTypes = DEFAULT_EMAIL_TEMPLATES.map(t => t.type);
  
  console.log("Template types in defaultTemplates:", defaultTemplateTypes);
  console.log("Template types in DEFAULT_EMAIL_TEMPLATES:", utilTemplateTypes);
  
  const missingInDefault = utilTemplateTypes.filter(type => !defaultTemplateTypes.includes(type));
  const missingInUtil = defaultTemplateTypes.filter(type => !utilTemplateTypes.includes(type));
  
  if (missingInDefault.length > 0) {
    console.warn("Types in DEFAULT_EMAIL_TEMPLATES but not in defaultTemplates:", missingInDefault);
  }
  
  if (missingInUtil.length > 0) {
    console.warn("Types in defaultTemplates but not in DEFAULT_EMAIL_TEMPLATES:", missingInUtil);
  }
};

// Template categories for tabs
const templateCategories = [
  { 
    key: 'reports', 
    label: 'Reports', 
    types: ['REPORT_CREATED', 'REPORT_COMPLETED', 'REPORT_MEMBER_ADDED', 'REPORT_MEMBER_REMOVED'] 
  },
  { 
    key: 'actionItems', 
    label: 'Action Items', 
    types: ['ACTION_ITEM_CREATED', 'ACTION_ITEM_ASSIGNED', 'ACTION_ITEM_COMPLETED', 'ACTION_ITEM_STATUS_CHANGED'] 
  },
  { 
    key: 'projects', 
    label: 'Projects', 
    types: ['PROJECT_CREATED', 'PROJECT_COMPLETED', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_REMOVED'] 
  },
  { 
    key: 'other', 
    label: 'Other', 
    types: ['AWARD_EARNED', 'CUSTOM_NOTIFICATION'] 
  }
];

// Helper to get readable label for template type
const getTemplateTypeLabel = (type) => {
  const labels = {
    REPORT_CREATED: 'Report Created',
    REPORT_COMPLETED: 'Report Completed',
    REPORT_MEMBER_ADDED: 'Report Member Added',
    REPORT_MEMBER_REMOVED: 'Report Member Removed',
    ACTION_ITEM_CREATED: 'Action Item Created',
    ACTION_ITEM_ASSIGNED: 'Action Item Assigned',
    ACTION_ITEM_COMPLETED: 'Action Item Completed',
    ACTION_ITEM_STATUS_CHANGED: 'Action Item Status Changed',
    PROJECT_CREATED: 'Project Created',
    PROJECT_COMPLETED: 'Project Completed',
    PROJECT_MEMBER_ADDED: 'Project Member Added',
    PROJECT_MEMBER_REMOVED: 'Project Member Removed',
    AWARD_EARNED: 'Award Earned',
    CUSTOM_NOTIFICATION: 'Custom Notification'
  };
  return labels[type] || type;
};

// Valid template types that exist in the GraphQL schema
const validSchemaTemplateTypes = [
  'REPORT_CREATED',
  'REPORT_COMPLETED',
  'REPORT_MEMBER_ADDED',
  'REPORT_MEMBER_REMOVED',
  'ACTION_ITEM_CREATED',
  'ACTION_ITEM_ASSIGNED',
  'ACTION_ITEM_COMPLETED',
  'ACTION_ITEM_STATUS_CHANGED',
  'PROJECT_CREATED',
  'PROJECT_COMPLETED',
  'PROJECT_MEMBER_ADDED',
  'PROJECT_MEMBER_REMOVED',
  'AWARD_EARNED',
  'CUSTOM_NOTIFICATION'
];

// Helper to get available placeholders for template types
const getAvailablePlaceholders = (type) => {
  const placeholdersByType = {
    REPORT_CREATED: ['reportName', 'reportURL', 'reportType'],
    REPORT_COMPLETED: ['reportName', 'reportURL', 'reportType'],
    REPORT_MEMBER_ADDED: ['reportName', 'reportURL', 'reportType'],
    REPORT_MEMBER_REMOVED: ['reportName'],
    ACTION_ITEM_CREATED: ['actionItemTitle', 'actionItemDescription', 'actionItemDueDate', 'actionItemURL'],
    ACTION_ITEM_ASSIGNED: ['actionItemTitle', 'actionItemDescription', 'actionItemDueDate', 'actionItemURL'],
    ACTION_ITEM_COMPLETED: ['actionItemTitle', 'actionItemDescription', 'actionItemDueDate', 'actionItemURL'],
    ACTION_ITEM_STATUS_CHANGED: ['actionItemTitle', 'actionItemDescription', 'status', 'actionItemDueDate', 'actionItemURL'],
    PROJECT_CREATED: ['projectName', 'projectDescription', 'projectURL'],
    PROJECT_COMPLETED: ['projectName', 'projectURL'],
    PROJECT_MEMBER_ADDED: ['projectName', 'projectDescription', 'projectURL'],
    PROJECT_MEMBER_REMOVED: ['projectName'],
    AWARD_EARNED: ['awardTitle', 'awardDescription', 'awardCoins', 'awardsURL'],
    CUSTOM_NOTIFICATION: ['subject', 'title', 'message', 'actionURL', 'actionText']
  };
  return placeholdersByType[type] || [];
};

const EmailTemplateManagement = ({ organizationId }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('reports');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    subject: '',
    htmlTemplate: '',
    isEnabled: true,
    customType: ''
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'tabs' or 'list'
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchTemplates();
      // Compare template definitions
      compareTemplates();
    }
  }, [organizationId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // Initialize variables for pagination
      let allTemplates = [];
      let nextToken = null;
      let result;
      
      // Loop through all pages of templates
      do {
        result = await API.graphql({
          query: queries.listEmailTemplates,
          variables: {
            filter: {
              organizationID: { eq: organizationId },
              _deleted: { ne: true }
            },
            limit: 100, // Request a large number of templates at once
            nextToken: nextToken
          }
        });
        
        // Add the current page of results to our collection
        const currentItems = result.data.listEmailTemplates.items;
        allTemplates = [...allTemplates, ...currentItems];
        
        // Get the token for the next page, if any
        nextToken = result.data.listEmailTemplates.nextToken;
        
        console.log(`Fetched ${currentItems.length} templates, nextToken: ${nextToken}`);
      } while (nextToken);
      
      console.log(`Total templates fetched: ${allTemplates.length}`);
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      setError('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleTypeChange = (type) => {
    // If we have a default template, use it as a starting point
    const defaultTemplate = defaultTemplates[type];
    
    setFormData({
      ...formData,
      type,
      subject: defaultTemplate?.subject || formData.subject,
      htmlTemplate: defaultTemplate?.htmlTemplate || formData.htmlTemplate
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const input = {
        ...formData,
        organizationID: organizationId,
        _version: editingTemplate?._version
      };

      if (editingTemplate) {
        // Update existing template
        await API.graphql({
          query: mutations.updateEmailTemplate,
          variables: {
            input: {
              id: editingTemplate.id,
              ...input
            }
          }
        });
      } else {
        // Create new template
        await API.graphql({
          query: mutations.createEmailTemplate,
          variables: { input }
        });
      }

      setShowModal(false);
      setError(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template: ' + (error.errors?.[0]?.message || error.message));
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      subject: template.subject,
      htmlTemplate: template.htmlTemplate,
      isEnabled: template.isEnabled,
      customType: template.customType || ''
    });
    setShowModal(true);
    setPreviewMode(false);
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
    // For a real preview we'd render the HTML safely
    setHtmlPreview(formData.htmlTemplate);
  };

  const handleDelete = async (templateId, version) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        console.log('Deleting template ID:', templateId);
        
        await API.graphql({
          query: mutations.deleteEmailTemplate,
          variables: {
            input: { 
              id: templateId
            }
          }
        });
        setError(null);
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        // Log more detailed error information to help with debugging
        if (error.errors) {
          error.errors.forEach(err => {
            console.error('GraphQL Error:', err);
          });
        }
        setError('Failed to delete template: ' + (error.errors?.[0]?.message || error.message));
      }
    }
  };

  const handleToggleStatus = async (template) => {
    try {
      await API.graphql({
        query: mutations.updateEmailTemplate,
        variables: {
          input: {
            id: template.id,
            isEnabled: !template.isEnabled,
            _version: template._version
          }
        }
      });
      
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      setError('Failed to update template status');
    }
  };

  const handleAddNew = () => {
    setEditingTemplate(null);
    const initialType = templateCategories.find(c => c.key === activeCategory)?.types[0] || '';
    const defaultTemplate = defaultTemplates[initialType];
    
    setFormData({
      type: initialType,
      subject: defaultTemplate?.subject || '',
      htmlTemplate: defaultTemplate?.htmlTemplate || '',
      isEnabled: true,
      customType: ''
    });
    
    setShowModal(true);
    setPreviewMode(false);
  };

  // Create all default templates at once
  const createAllDefaultTemplates = async () => {
    try {
      setCreatingDefaults(true);
      setError(null);
      
      // Generate a comprehensive list of all template types from defaultTemplates
      const allTemplateTypes = Object.keys(defaultTemplates);
      
      console.log(`Creating/updating ${allTemplateTypes.length} templates:`, allTemplateTypes);
      
      // Create each template - this will overwrite existing ones with the same type
      const creationPromises = allTemplateTypes.map(async (type) => {
        const defaultTemplate = defaultTemplates[type];
        if (!defaultTemplate) return null;
        
        // Check if template already exists
        const existingTemplates = templates.filter(t => t.type === type);
        
        if (existingTemplates.length > 0) {
          // Update existing template
          const existingTemplate = existingTemplates[0];
          const input = {
            id: existingTemplate.id,
            type,
            subject: defaultTemplate.subject,
            htmlTemplate: defaultTemplate.htmlTemplate,
            organizationID: organizationId,
            isEnabled: true,
            _version: existingTemplate._version
          };
          
          try {
            return await API.graphql({
              query: mutations.updateEmailTemplate,
              variables: { input }
            });
          } catch (err) {
            console.error(`Error updating template for type ${type}:`, err);
            return null;
          }
        } else {
          // Create new template
          const input = {
            type,
            subject: defaultTemplate.subject,
            htmlTemplate: defaultTemplate.htmlTemplate,
            organizationID: organizationId,
            isEnabled: true
          };
          
          try {
            return await API.graphql({
              query: mutations.createEmailTemplate,
              variables: { input }
            });
          } catch (err) {
            console.error(`Error creating template for type ${type}:`, err);
            return null;
          }
        }
      });
      
      const results = await Promise.all(creationPromises);
      const successfulOperations = results.filter(r => r !== null).length;
      
      if (successfulOperations > 0) {
        setError(`Successfully created/updated ${successfulOperations} default templates.`);
      } else {
        setError('Failed to create any templates. Check console for errors.');
      }
      
      fetchTemplates();
    } catch (error) {
      console.error('Error creating default templates:', error);
      setError('Failed to create default templates: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setCreatingDefaults(false);
    }
  };

  // Delete all templates
  const deleteAllTemplates = async () => {
    if (!window.confirm('Are you sure you want to delete ALL email templates? This action cannot be undone.')) {
      return;
    }
    
    try {
      setDeletingAll(true);
      setError(null);
      
      if (templates.length === 0) {
        setError('No templates to delete');
        setDeletingAll(false);
        return;
      }
      
      console.log(`Deleting ${templates.length} templates...`);
      
      // Delete each template
      const deletePromises = templates.map(async (template) => {
        try {
          await API.graphql({
            query: mutations.deleteEmailTemplate,
            variables: {
              input: { 
                id: template.id
              }
            }
          });
          return true;
        } catch (err) {
          console.error(`Error deleting template ${template.id} (${template.type}):`, err);
          return false;
        }
      });
      
      const results = await Promise.all(deletePromises);
      const successfulDeletions = results.filter(r => r).length;
      
      if (successfulDeletions > 0) {
        setError(`Successfully deleted ${successfulDeletions}/${templates.length} templates.`);
      } else {
        setError('Failed to delete any templates. Check console for errors.');
      }
      
      // Refresh templates list
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting all templates:', error);
      setError('Failed to delete templates: ' + (error.errors?.[0]?.message || error.message));
    } finally {
      setDeletingAll(false);
    }
  };

  const renderTemplatesList = () => {
    if (loading) {
      return (
        <div className="text-center my-4">
          <Spinner animation="border" />
        </div>
      );
    }
    
    // Debug logging to understand what templates we have
    console.log("All templates:", templates.map(t => t.type));
    
    // For 'tabs' view - show only templates from the active category
    if (viewMode === 'tabs') {
      const currentCategoryTypes = templateCategories.find(c => c.key === activeCategory)?.types || [];
      const filteredTemplates = templates.filter(template => currentCategoryTypes.includes(template.type));
      
      console.log(`Templates in category ${activeCategory}:`, filteredTemplates.map(t => t.type));
      
      if (filteredTemplates.length === 0) {
        return (
          <div className="text-center py-4">
            <p className="text-muted">No templates found for this category.</p>
            <Button 
              variant="primary" 
              onClick={handleAddNew}
              style={{ minWidth: '180px' }}
              className="me-2"
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add New Template
            </Button>
          </div>
        );
      }
      
      return (
        <Table responsive>
          <thead>
            <tr>
              <th>Type</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((template) => (
              <tr key={template.id}>
                <td>{getTemplateTypeLabel(template.type)}</td>
                <td>{template.subject}</td>
                <td>
                  <Badge bg={template.isEnabled ? 'success' : 'secondary'}>
                    {template.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="link"
                    className="text-primary p-0 me-2"
                    onClick={() => handleEdit(template)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </Button>
                  <Button
                    variant="link"
                    className={template.isEnabled ? 'text-danger p-0 me-2' : 'text-success p-0 me-2'}
                    onClick={() => handleToggleStatus(template)}
                  >
                    <FontAwesomeIcon icon={template.isEnabled ? faTimes : faCheck} />
                  </Button>
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={() => handleDelete(template.id, template._version)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }
    
    // For 'list' view - show all templates grouped by category
    return (
      <>
        {templateCategories.map(category => {
          const categoryTemplates = templates.filter(template => 
            category.types.includes(template.type)
          );
          
          console.log(`Templates in category ${category.key}:`, categoryTemplates.map(t => t.type));
          
          if (categoryTemplates.length === 0) return null;
          
          return (
            <div key={category.key} className="mb-4">
              <h5 className="border-bottom pb-2">{category.label}</h5>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryTemplates.map(template => (
                    <tr key={template.id}>
                      <td>{getTemplateTypeLabel(template.type)}</td>
                      <td>{template.subject}</td>
                      <td>
                        <Badge bg={template.isEnabled ? 'success' : 'secondary'}>
                          {template.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="link"
                          className="text-primary p-0 me-2"
                          onClick={() => handleEdit(template)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </Button>
                        <Button
                          variant="link"
                          className={template.isEnabled ? 'text-danger p-0 me-2' : 'text-success p-0 me-2'}
                          onClick={() => handleToggleStatus(template)}
                        >
                          <FontAwesomeIcon icon={template.isEnabled ? faTimes : faCheck} />
                        </Button>
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={() => handleDelete(template.id, template._version)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          );
        })}
      </>
    );
  };

  const renderTemplateModal = () => {
    const availablePlaceholders = getAvailablePlaceholders(formData.type);
    
    return (
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTemplate ? 'Edit Email Template' : 'Add New Email Template'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}
          
          <Tabs defaultActiveKey="edit" id="template-tabs">
            <Tab eventKey="edit" title="Edit Template">
              <Form className="mt-3" onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Template Type</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    disabled={editingTemplate !== null}
                  >
                    {templateCategories.map((category) => (
                      <optgroup key={category.key} label={category.label}>
                        {category.types.map((type) => (
                          <option key={type} value={type}>
                            {getTemplateTypeLabel(type)}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>HTML Template</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={10}
                    value={formData.htmlTemplate}
                    onChange={(e) => handleInputChange('htmlTemplate', e.target.value)}
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="switch"
                    id="template-enabled"
                    label="Enable this template"
                    checked={formData.isEnabled}
                    onChange={(e) => handleInputChange('isEnabled', e.target.checked)}
                  />
                </Form.Group>
              </Form>
              
              {availablePlaceholders.length > 0 && (
                <div className="mt-3">
                  <h6>Available Placeholders:</h6>
                  <p className="small text-muted">
                    You can use these placeholders in your template:
                  </p>
                  <div>
                    {availablePlaceholders.map((placeholder) => (
                      <Badge key={placeholder} bg="secondary" className="me-2 mb-2">
                        {`{{${placeholder}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Tab>
            
            <Tab eventKey="preview" title="Preview">
              <div className="mt-3">
                <h6>Subject Preview:</h6>
                <p>{formData.subject}</p>
                
                <h6>HTML Preview:</h6>
                <div className="border p-3 bg-light">
                  <div dangerouslySetInnerHTML={{ __html: formData.htmlTemplate }} />
                </div>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Template
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
            Email Templates
          </h5>
          <div>
            <Button 
              variant={viewMode === 'tabs' ? 'outline-primary' : 'primary'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className="me-2"
              title="View all templates"
            >
              <FontAwesomeIcon icon={faList} />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'outline-primary' : 'primary'} 
              size="sm" 
              onClick={() => setViewMode('tabs')}
              className="me-2"
              title="View templates by category"
            >
              <FontAwesomeIcon icon={faTh} />
            </Button>
            <Button 
              variant="success" 
              size="sm" 
              onClick={createAllDefaultTemplates}
              className="me-2"
              disabled={creatingDefaults}
            >
              {creatingDefaults ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-1"
                  />
                  Creating...
                </>
              ) : (
                'Create Default Templates'
              )}
            </Button>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={deleteAllTemplates}
              className="me-2"
              disabled={deletingAll || templates.length === 0}
            >
              {deletingAll ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-1"
                  />
                  Deleting...
                </>
              ) : (
                'Delete All Templates'
              )}
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleAddNew}
              style={{ minWidth: '120px' }}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Add Template
            </Button>
          </div>
        </div>
      </Card.Header>
      <Card.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {viewMode === 'tabs' && (
          <Tabs
            activeKey={activeCategory}
            onSelect={(key) => setActiveCategory(key)}
            className="mb-4"
          >
            {templateCategories.map((category) => (
              <Tab 
                key={category.key} 
                eventKey={category.key} 
                title={category.label}
              />
            ))}
          </Tabs>
        )}
        
        {renderTemplatesList()}
      </Card.Body>
      
      {renderTemplateModal()}
    </Card>
  );
};

export default EmailTemplateManagement; 