# VibeStack™ Pro - ChatBot Context Selection System Documentation

## Overview

This document details the context selection mechanism in the VibeStack™ Pro ChatBot system that allows users to select reports, projects, and organizational learnings to provide contextual information to the AI. This feature enables users to ask specific questions about their data and get more relevant responses from the LF Mentor.

## Context Selection Architecture

### Context Types
The system supports three types of context selection:
1. **Reports** - User's owned and assigned reports
2. **Projects** - User's owned projects  
3. **Learning Content** - Organizational learning materials

### Mutual Exclusivity
Only one context type can be selected at a time. When a user selects a report, project, or learning item, the other two types become disabled until the selection is cleared.

## Data Loading and Management

### Context Data Fetching

#### Reports Context
```javascript
// Fetch both owned and assigned reports
const fetchReports = async () => {
  const [ownedReports, assignedReports] = await Promise.all([
    // Reports created by user
    API.graphql(graphqlOperation(listReports, {
      filter: {
        user_sub: { eq: user.attributes.sub },
        organizationID: { eq: activeOrganization.id },
        _deleted: { ne: true }
      },
      limit: 100
    })),
    
    // Reports assigned to user
    API.graphql(graphqlOperation(listReports, {
      filter: {
        assignedMembers: { contains: user.attributes.sub },
        organizationID: { eq: activeOrganization.id },
        _deleted: { ne: true }
      },
      limit: 100
    }))
  ]);

  // Combine and deduplicate reports
  const allReports = [...ownedReports.data.listReports.items, ...assignedReports.data.listReports.items];
  const uniqueReports = Array.from(new Map(allReports.map(report => [report.id, report])).values());
  
  setReports(uniqueReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
};
```

#### Projects Context
```javascript
// Fetch user's owned projects
const fetchProjects = async () => {
  const projectsResponse = await API.graphql(graphqlOperation(listProjects, {
    filter: {
      owner: { eq: user.attributes.sub },
      organizationID: { eq: activeOrganization.id },
      _deleted: { ne: true }
    },
    limit: 100
  }));
  
  const ownedProjects = projectsResponse.data.listProjects.items;
  setProjects(ownedProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
};
```

#### Learning Content Context
```javascript
// Fetch organizational learning materials
const fetchLearnings = async () => {
  const learningsResponse = await API.graphql(graphqlOperation(listLearnings, {
    filter: {
      organizationID: { eq: activeOrganization.id },
      _deleted: { ne: true }
    },
    limit: 100
  }));
  
  const organizationalLearnings = learningsResponse.data.listLearnings.items;
  setLearnings(organizationalLearnings.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
};
```

### Owner Email Resolution

For better UX, the system resolves user IDs to email addresses:

```javascript
const fetchOwnerEmails = async (items) => {
  if (!items || !items.length) return {};
  
  // Get unique owner user_sub values
  const uniqueOwnerSubs = [...new Set(
    items.map(item => item.owner || item.user_sub).filter(Boolean)
  )];
  
  if (uniqueOwnerSubs.length === 0) return {};
  
  try {
    // Fetch organization members to get owner email information
    const result = await API.graphql(graphqlOperation(`
      query ListOrganizationMembers($filter: ModelOrganizationMemberFilterInput) {
        listOrganizationMembers(filter: $filter) {
          items {
            userSub
            email
            name
          }
        }
      }
    `, {
      filter: {
        organizationID: { eq: activeOrganization.id },
        _deleted: { ne: true }
      }
    }));
    
    const members = result.data.listOrganizationMembers.items;
    const emailMap = {};
    
    uniqueOwnerSubs.forEach(sub => {
      const member = members.find(m => m.userSub === sub);
      emailMap[sub] = member ? (member.email || member.name || sub) : sub;
    });
    
    return emailMap;
  } catch (error) {
    console.error('Error fetching owner emails:', error);
    return {};
  }
};
```

## UI Implementation

### Context Selector Component Structure

```jsx
{/* Context Selector Area */}
<div className="context-selector-area border-top pt-3 mb-3">
  <div className="d-flex gap-2 flex-wrap">
    {/* Reports Selector */}
    <Dropdown className="context-dropdown">
      <Dropdown.Toggle 
        variant={selectedReport ? "primary" : "outline-secondary"} 
        size="sm"
        className="context-dropdown-toggle"
        disabled={selectedProject || selectedLearning}
      >
        <FontAwesomeIcon icon={faFileAlt} className="me-1" />
        {selectedReport ? selectedReport.name : "Select Report"}
        {selectedReport && (
          <FontAwesomeIcon 
            icon={faTimes} 
            className="ms-2 text-light" 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedReport(null);
            }}
          />
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="context-dropdown-menu">
        {loadingData ? (
          <Dropdown.Item disabled>
            <Spinner animation="border" size="sm" className="me-2" />
            Loading reports...
          </Dropdown.Item>
        ) : reports.length === 0 ? (
          <Dropdown.Item disabled>No reports available</Dropdown.Item>
        ) : (
          reports.map(report => (
            <Dropdown.Item
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="context-dropdown-item"
            >
              <div className="d-flex flex-column">
                <span className="fw-medium">{report.name}</span>
                <small className="text-muted">{report.type}</small>
              </div>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>

    {/* Projects Selector */}
    <Dropdown className="context-dropdown">
      <Dropdown.Toggle 
        variant={selectedProject ? "success" : "outline-secondary"} 
        size="sm"
        className="context-dropdown-toggle"
        disabled={selectedReport || selectedLearning}
      >
        <FontAwesomeIcon icon={faProjectDiagram} className="me-1" />
        {selectedProject ? selectedProject.name : "Select Project"}
        {selectedProject && (
          <FontAwesomeIcon 
            icon={faTimes} 
            className="ms-2 text-light" 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProject(null);
            }}
          />
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="context-dropdown-menu">
        {loadingData ? (
          <Dropdown.Item disabled>
            <Spinner animation="border" size="sm" className="me-2" />
            Loading projects...
          </Dropdown.Item>
        ) : projects.length === 0 ? (
          <Dropdown.Item disabled>No projects available</Dropdown.Item>
        ) : (
          projects.map(project => (
            <Dropdown.Item
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="context-dropdown-item"
            >
              <div className="d-flex flex-column">
                <span className="fw-medium">{project.name}</span>
                <small className="text-muted">{project.status}</small>
              </div>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>

    {/* Learnings Selector */}
    <Dropdown className="context-dropdown">
      <Dropdown.Toggle 
        variant={selectedLearning ? "info" : "outline-secondary"} 
        size="sm"
        className="context-dropdown-toggle"
        disabled={selectedReport || selectedProject}
      >
        <FontAwesomeIcon icon={faGraduationCap} className="me-1" />
        {selectedLearning ? selectedLearning.title : "Select Learning"}
        {selectedLearning && (
          <FontAwesomeIcon 
            icon={faTimes} 
            className="ms-2 text-light" 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLearning(null);
            }}
          />
        )}
      </Dropdown.Toggle>
      <Dropdown.Menu className="context-dropdown-menu">
        {loadingData ? (
          <Dropdown.Item disabled>
            <Spinner animation="border" size="sm" className="me-2" />
            Loading learnings...
          </Dropdown.Item>
        ) : learnings.length === 0 ? (
          <Dropdown.Item disabled>No organizational learnings available</Dropdown.Item>
        ) : (
          learnings.map(learning => (
            <Dropdown.Item
              key={learning.id}
              onClick={() => setSelectedLearning(learning)}
              className="context-dropdown-item"
            >
              <div className="d-flex flex-column">
                <span className="fw-medium">{learning.title}</span>
                {learning.description && (
                  <small className="text-muted">{learning.description.substring(0, 50)}...</small>
                )}
              </div>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  </div>
  
  {/* Context Summary */}
  {(selectedReport || selectedProject || selectedLearning) && (
    <div className="context-summary mt-2">
      <small className="text-muted">
        Context: 
        {selectedReport && (
          <span className="badge bg-primary ms-1 d-inline-flex align-items-center">
            {selectedReport.name}
            {(selectedReport.ownerEmail || ownerEmails[selectedReport.user_sub]) && (
              <span className="ms-1 opacity-75">
                | Owner: {selectedReport.ownerEmail || ownerEmails[selectedReport.user_sub]}
              </span>
            )}
            <FontAwesomeIcon 
              icon={faTimes} 
              className="ms-2" 
              style={{ cursor: 'pointer', opacity: 0.8 }}
              onClick={() => setSelectedReport(null)}
            />
          </span>
        )}
        {selectedProject && (
          <span className="badge bg-success ms-1 d-inline-flex align-items-center">
            {selectedProject.name}
            {ownerEmails[selectedProject.owner] && (
              <span className="ms-1 opacity-75">
                | Owner: {ownerEmails[selectedProject.owner]}
              </span>
            )}
            <FontAwesomeIcon 
              icon={faTimes} 
              className="ms-2" 
              style={{ cursor: 'pointer', opacity: 0.8 }}
              onClick={() => setSelectedProject(null)}
            />
          </span>
        )}
        {selectedLearning && (
          <span className="badge bg-info ms-1 d-inline-flex align-items-center">
            {selectedLearning.title}
            <FontAwesomeIcon 
              icon={faTimes} 
              className="ms-2" 
              style={{ cursor: 'pointer', opacity: 0.8 }}
              onClick={() => setSelectedLearning(null)}
            />
          </span>
        )}
      </small>
    </div>
  )}
</div>
```

### CSS Styling

```css
/* Context Selector Styles */
.context-selector-area {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin: 0 1rem;
}

.context-dropdown {
  min-width: 180px;
}

.context-dropdown-toggle {
  border-radius: 20px;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background-color: white;
  color: #495057;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.context-dropdown-toggle:hover {
  background-color: #f8f9fa;
}

.context-dropdown-toggle.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.context-dropdown-toggle.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.context-dropdown-toggle.btn-info {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: white;
}

.context-dropdown-menu {
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  min-width: 250px;
}

.context-dropdown-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f8f9fa;
  cursor: pointer;
}

.context-dropdown-item:last-child {
  border-bottom: none;
}

.context-dropdown-item:hover {
  background-color: #f8f9fa;
}

.context-summary {
  border-top: 1px solid #dee2e6;
  padding-top: 0.5rem;
}

.context-summary .badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .context-selector-area {
    margin: 0 0.5rem;
    padding: 0.75rem;
  }
  
  .context-dropdown {
    min-width: 150px;
  }
  
  .context-dropdown-toggle {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
    max-width: 160px;
  }
  
  .context-dropdown-menu {
    min-width: 200px;
  }
}
```

## Message Context Integration

### Sending Context with Messages

When a message is sent, the selected context is included in both the API request and local message storage:

```javascript
const handleSendMessage = async (e) => {
  e.preventDefault();
  
  if (!message.trim()) return;

  const userMessage = message;
  setMessage('');
  
  // Add user message to chat with context information
  const userMessageWithContext = {
    role: 'user', 
    content: userMessage,
    context: {
      report: selectedReport ? { id: selectedReport.id, name: selectedReport.name } : null,
      project: selectedProject ? { id: selectedProject.id, name: selectedProject.name } : null,
      learning: selectedLearning ? { id: selectedLearning.id, title: selectedLearning.title } : null
    }
  };
  
  // Clear all selections after sending
  setSelectedReport(null);
  setSelectedProject(null);
  setSelectedLearning(null);
  
  setMessages(prevMessages => [
    ...prevMessages, 
    userMessageWithContext
  ]);
  
  try {
    // Send message to chat API using VibeStack endpoint
    const requestBody = {
      message: userMessage,
      lf_user_id: user.attributes.sub,
      organization_id: activeOrganization.id
    };
    
    // Only include chat_room_id if we have a selected chat room
    if (selectedChatRoom?.id) {
      requestBody.chat_room_id = selectedChatRoom.id;
    }

    // Include selected context IDs if available
    if (selectedReport?.id) {
      requestBody.report_id = selectedReport.id;
    }
    if (selectedProject?.id) {
      requestBody.project_id = selectedProject.id;
    }
    if (selectedLearning?.id) {
      requestBody.learning_id = selectedLearning.id;
    }

    const response = await axios.post(`${API_BASE_URL}/leinfitt-chat`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    // Handle AI response...
  } catch (error) {
    // Handle errors...
  }
};
```

### Context Display in Messages

User messages display their context information as badges:

```jsx
{/* Show context info for user messages */}
{msg.context && (msg.context.report || msg.context.project || msg.context.learning) && (
  <div className="message-context mt-2">
    <small className="text-muted">
      <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
      Context: 
      {msg.context.report && <span className="badge bg-primary ms-1">{msg.context.report.name}</span>}
      {msg.context.project && <span className="badge bg-success ms-1">{msg.context.project.name}</span>}
      {msg.context.learning && <span className="badge bg-info ms-1">{msg.context.learning.title}</span>}
    </small>
  </div>
)}
```

## API Request Structure

### VibeStack Chat API Request Body

```javascript
const requestBody = {
  message: string,                    // User's message text
  lf_user_id: string,                // User's AWS Cognito sub
  organization_id: string,           // Current organization ID
  chat_room_id?: string,             // Optional chat room ID
  
  // Context IDs (optional)
  report_id?: string,                // Selected report ID
  project_id?: string,               // Selected project ID  
  learning_id?: string               // Selected learning content ID
};
```

The API uses these context IDs to fetch and include relevant data in the AI's knowledge base for generating more contextual responses.

## State Management

### Context Selection State

```javascript
// Enhanced context selection states
const [reports, setReports] = useState([]);
const [projects, setProjects] = useState([]);
const [learnings, setLearnings] = useState([]);
const [selectedReport, setSelectedReport] = useState(null);
const [selectedProject, setSelectedProject] = useState(null);
const [selectedLearning, setSelectedLearning] = useState(null);
const [loadingData, setLoadingData] = useState(false);
const [ownerEmails, setOwnerEmails] = useState({});
```

### Context Data Loading on Organization Change

```javascript
// Fetch organization data when org changes
useEffect(() => {
  if (activeOrganization?.id) {
    fetchOrganizationData(activeOrganization.id);
    fetchContextData();
  }
}, [activeOrganization]);

const fetchContextData = async () => {
  if (!activeOrganization?.id || !user?.attributes?.sub) return;
  
  setLoadingData(true);
  try {
    // Fetch reports, projects, and learnings in parallel
    const [reportsResponse, projectsResponse, learningsResponse] = await Promise.all([
      fetchReports(),
      fetchProjects(), 
      fetchLearnings()
    ]);

    // Fetch owner emails for all items
    const allItems = [...uniqueReports, ...ownedProjects];
    const emailMap = await fetchOwnerEmails(allItems);
    setOwnerEmails(emailMap);

  } catch (err) {
    console.error('Error fetching context data:', err);
    setError('Failed to load reports, projects, and learnings. Some features may be limited.');
  } finally {
    setLoadingData(false);
  }
};
```

## Mobile Implementation for Context Selection

### React Native Context Selector

```jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet
} from 'react-native';

const MobileContextSelector = ({ 
  user, 
  organizationId, 
  selectedContext, 
  onContextSelect,
  onContextClear 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [contextType, setContextType] = useState(null); // 'reports', 'projects', 'learnings'
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const contextTypes = [
    { key: 'reports', label: 'Reports', icon: '📊', color: '#007bff' },
    { key: 'projects', label: 'Projects', icon: '📁', color: '#28a745' },
    { key: 'learnings', label: 'Learning', icon: '🎓', color: '#17a2b8' }
  ];

  const fetchContextItems = async (type) => {
    setLoading(true);
    try {
      let response;
      switch (type) {
        case 'reports':
          response = await fetchUserReports();
          break;
        case 'projects':
          response = await fetchUserProjects();
          break;
        case 'learnings':
          response = await fetchOrganizationLearnings();
          break;
        default:
          response = [];
      }
      setItems(response);
    } catch (error) {
      console.error('Error fetching context items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContextTypeSelect = (type) => {
    setContextType(type);
    fetchContextItems(type);
  };

  const handleItemSelect = (item) => {
    onContextSelect(contextType, item);
    setShowModal(false);
    setContextType(null);
    setItems([]);
  };

  const renderContextTypeButton = ({ item }) => (
    <TouchableOpacity
      style={[styles.contextTypeButton, { borderColor: item.color }]}
      onPress={() => handleContextTypeSelect(item.key)}
      disabled={selectedContext && selectedContext.type !== item.key}
    >
      <Text style={styles.contextTypeIcon}>{item.icon}</Text>
      <Text style={[styles.contextTypeLabel, { color: item.color }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderContextItem = ({ item }) => (
    <TouchableOpacity
      style={styles.contextItem}
      onPress={() => handleItemSelect(item)}
    >
      <View style={styles.contextItemContent}>
        <Text style={styles.contextItemTitle}>
          {item.name || item.title}
        </Text>
        <Text style={styles.contextItemSubtitle}>
          {item.type || item.status || item.description?.substring(0, 50)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Context Selection Button */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.selectButtonText}>
          {selectedContext 
            ? `${selectedContext.item.name || selectedContext.item.title}` 
            : 'Add Context'
          }
        </Text>
        {selectedContext && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onContextClear}
          >
            <Text style={styles.clearButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Context Selection Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {contextType ? `Select ${contextType}` : 'Select Context Type'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowModal(false);
                setContextType(null);
                setItems([]);
              }}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {!contextType ? (
            /* Context Type Selection */
            <FlatList
              data={contextTypes}
              renderItem={renderContextTypeButton}
              keyExtractor={(item) => item.key}
              style={styles.contextTypeList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            /* Context Items List */
            <View style={styles.contextItemsList}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text style={styles.loadingText}>Loading {contextType}...</Text>
                </View>
              ) : items.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No {contextType} available</Text>
                </View>
              ) : (
                <FlatList
                  data={items}
                  renderItem={renderContextItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectButtonText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  contextTypeList: {
    flex: 1,
    padding: 16,
  },
  contextTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  contextTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  contextTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  contextItemsList: {
    flex: 1,
  },
  contextItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  contextItemContent: {
    flex: 1,
  },
  contextItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  contextItemSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
});

export default MobileContextSelector;
```

### Mobile Integration in Chat Component

```jsx
// In your mobile chat component
const [selectedContext, setSelectedContext] = useState(null);

const handleContextSelect = (type, item) => {
  setSelectedContext({ type, item });
};

const handleContextClear = () => {
  setSelectedContext(null);
};

const sendMessageWithContext = async (messageText) => {
  const requestBody = {
    message: messageText,
    lf_user_id: user.attributes.sub,
    organization_id: organizationId
  };

  // Include context if selected
  if (selectedContext) {
    switch (selectedContext.type) {
      case 'reports':
        requestBody.report_id = selectedContext.item.id;
        break;
      case 'projects':
        requestBody.project_id = selectedContext.item.id;
        break;
      case 'learnings':
        requestBody.learning_id = selectedContext.item.id;
        break;
    }
  }

  // Send to API...
  const response = await axios.post(`${API_BASE_URL}/leinfitt-chat`, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  });

  // Clear context after sending
  setSelectedContext(null);
};

// Add context selector above the input
return (
  <SafeAreaView style={styles.container}>
    {/* Messages */}
    <FlatList ... />
    
    {/* Context Selector */}
    <MobileContextSelector
      user={user}
      organizationId={organizationId}
      selectedContext={selectedContext}
      onContextSelect={handleContextSelect}
      onContextClear={handleContextClear}
    />
    
    {/* Input */}
    <View style={styles.inputContainer}>
      ...
    </View>
  </SafeAreaView>
);
```

## Summary

The context selection system allows users to:

1. **Select Reports**: Choose from owned or assigned reports to ask specific questions
2. **Select Projects**: Choose from owned projects for project-specific queries  
3. **Select Learning Content**: Choose from organizational learning materials for educational queries
4. **Mutual Exclusivity**: Only one context type can be selected at a time
5. **Visual Feedback**: Selected context is displayed with owner information and easy clearing
6. **API Integration**: Context IDs are sent to the AI API for enhanced responses
7. **Mobile Ready**: Complete React Native implementation with native UI patterns

The system enhances the AI chat experience by providing relevant contextual information, enabling more accurate and specific responses from the LF Mentor.