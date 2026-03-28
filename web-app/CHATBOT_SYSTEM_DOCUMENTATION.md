# VibeStack™ Pro - ChatBot System Documentation

## Overview

This document provides comprehensive details on how the VibeStack™ Pro application implements the AI ChatBot system (LF Mentor) for user interactions. The system uses an external API (`https://thefittlab.com/api`) to provide AI-powered assistance to users. This documentation enables React Native developers to replicate the exact same functionality using the existing infrastructure.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Configuration](#api-configuration)
3. [User Permission System](#user-permission-system)
4. [Chat Room Management](#chat-room-management)
5. [Message System](#message-system)
6. [Real-time Features](#real-time-features)
7. [UI Components](#ui-components)
8. [Mobile Implementation Guide](#mobile-implementation-guide)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

## System Architecture

### Overview
The ChatBot system in VibeStack™ Pro provides AI-powered assistance through "LF Mentor" - an intelligent assistant that can help users with lean methodology questions, organizational data queries, and process improvement guidance.

### Key Technologies
- **Frontend**: React with AWS Amplify integration
- **External API**: https://thefittlab.com/api (VibeStack Chat API)
- **Authentication**: AWS Cognito integration
- **Permission System**: Organization-based access control
- **Real-time UI**: Auto-scroll, typing indicators, optimistic updates
- **Markdown Support**: Rich text formatting for AI responses

### Data Flow
```
User Input → Permission Check → API Request → AI Response → Display → Auto-scroll
```

## API Configuration

### Environment Variables
```bash
# Primary API endpoint
REACT_APP_CHAT_API_URL=https://thefittlab.com/api

# API authentication key
REACT_APP_CHAT_API_KEY=test-api-key-123
```

### API Endpoints

#### 1. Chat Rooms Management
```javascript
// Get user's chat rooms
GET ${API_BASE_URL}/chat-rooms?user_id={user_sub}

// Create new chat room
POST ${API_BASE_URL}/chat-rooms
Body: {
  name: string,
  user_id: string
}

// Delete chat room
DELETE ${API_BASE_URL}/chat-rooms/{chatRoomId}
```

#### 2. Messages Management
```javascript
// Get chat room messages
GET ${API_BASE_URL}/chat-rooms/{chatRoomId}/messages

// Send message to LF Mentor
POST ${API_BASE_URL}/leinfitt-chat
Body: {
  message: string,
  lf_user_id: string,
  organization_id: string,
  chat_room_id?: string  // Optional - auto-created if not provided
}
```

### API Headers
```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.REACT_APP_CHAT_API_KEY
};
```

## User Permission System

### Permission Hierarchy
1. **Organization Owners**: Always have access
2. **Co-owners**: Always have access
3. **Regular Members**: Access controlled by `aiDisabledUsers` list

### Permission Check Implementation
```javascript
const checkUserPermission = async () => {
  try {
    // Get user's organization member data
    const memberData = await API.graphql({
      query: listOrganizationMembers,
      variables: {
        filter: {
          organizationID: { eq: activeOrganization.id },
          userSub: { eq: user.attributes.sub }
        }
      }
    });

    // Check if user is active member
    const member = memberData.data.listOrganizationMembers.items.find(
      m => !m._deleted && m.status === 'ACTIVE'
    );

    if (!member) {
      setHasPermission(false);
      return;
    }

    // Check ownership
    const isOwner = activeOrganization.owner === user.attributes.sub;
    const isCoOwner = activeOrganization.additionalOwners?.includes(user.attributes.email);
    
    if (isOwner || isCoOwner) {
      setHasPermission(true);
    } else {
      // Check if user is in disabled list
      const aiDisabledUsers = activeOrganization.aiDisabledUsers || [];
      setHasPermission(!aiDisabledUsers.includes(user.attributes.sub));
    }
  } catch (error) {
    setHasPermission(false);
    setError('Unable to verify chat permissions');
  }
};
```

### Organization Data Structure
```javascript
// Organization model includes AI permission fields
const organization = {
  id: string,
  name: string,
  owner: string,                    // Owner's userSub
  additionalOwners: [string],       // Co-owner emails
  aiDisabledUsers: [string],        // Disabled user subs
  // ... other fields
};
```

## Chat Room Management

### Chat Room Data Structure
```javascript
const chatRoom = {
  id: string,
  name: string,
  user_id: string,                  // Owner's userSub
  created_at: string,              // ISO timestamp
  last_activity?: string,          // ISO timestamp
};
```

### Chat Room Operations

#### Fetching Chat Rooms
```javascript
const fetchChatRooms = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat-rooms`, {
      params: { user_id: user.attributes.sub },
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    // Sort by last activity (most recent first)
    const sortedRooms = response.data.sort((a, b) => {
      const aLastActivity = new Date(a.last_activity || a.created_at || 0);
      const bLastActivity = new Date(b.last_activity || b.created_at || 0);
      return bLastActivity - aLastActivity;
    });
    
    setChatRooms(sortedRooms);
    
    // Auto-select most recent room if none selected
    if (sortedRooms.length > 0 && !selectedChatRoom) {
      setSelectedChatRoom(sortedRooms[0]);
      fetchChatMessages(sortedRooms[0].id);
    }
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
  }
};
```

#### Creating Chat Rooms
```javascript
const createChatRoom = async (roomName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat-rooms`, {
      name: roomName,
      user_id: user.attributes.sub
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    const newChatRoom = response.data;
    
    // Add to chat rooms and select it
    setChatRooms(prev => [...prev, newChatRoom]);
    setSelectedChatRoom(newChatRoom);
    setMessages([]);
    
    return newChatRoom;
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
};
```

#### Deleting Chat Rooms
```javascript
const deleteChatRoom = async (chatRoomId) => {
  try {
    await axios.delete(`${API_BASE_URL}/chat-rooms/${chatRoomId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    // Remove from local state
    setChatRooms(prev => prev.filter(room => room.id !== chatRoomId));
    
    // Clear selection if deleted room was selected
    if (selectedChatRoom?.id === chatRoomId) {
      setSelectedChatRoom(null);
      setMessages([]);
    }
  } catch (error) {
    console.error('Error deleting chat room:', error);
    throw error;
  }
};
```

## Message System

### Message Data Structure
```javascript
const message = {
  role: 'user' | 'assistant' | 'system',
  content: string,
  created_at?: string,             // ISO timestamp
  isTyping?: boolean              // For typing indicators
};
```

### Message Operations

#### Fetching Messages
```javascript
const fetchChatMessages = async (chatRoomId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chat-rooms/${chatRoomId}/messages`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    setMessages(response.data);
    
    // Auto-scroll to bottom
    setTimeout(() => scrollToBottom(true), 100);
  } catch (error) {
    console.error('Error fetching messages:', error);
    setMessages([]);
  }
};
```

#### Sending Messages
```javascript
const handleSendMessage = async (messageText) => {
  if (!messageText.trim() || !organizationData || !user?.attributes?.sub) {
    return;
  }

  // Add user message to UI immediately
  setMessages(prev => [
    ...prev, 
    { role: 'user', content: messageText }
  ]);
  
  // Add typing indicator
  setMessages(prev => [
    ...prev,
    { role: 'assistant', content: '', isTyping: true }
  ]);
  
  try {
    const requestBody = {
      message: messageText,
      lf_user_id: user.attributes.sub,
      organization_id: activeOrganization.id
    };
    
    // Include chat room ID if available
    if (selectedChatRoom?.id) {
      requestBody.chat_room_id = selectedChatRoom.id;
    }
    
    const response = await axios.post(`${API_BASE_URL}/leinfitt-chat`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    
    // Remove typing indicator and add AI response
    setMessages(prev => {
      const newMessages = [...prev];
      
      // Remove typing indicator
      const typingIndex = newMessages.findIndex(msg => msg.isTyping);
      if (typingIndex !== -1) {
        newMessages.splice(typingIndex, 1);
      }
      
      // Add AI response
      if (response.data?.response) {
        newMessages.push({ 
          role: 'assistant', 
          content: response.data.response,
          created_at: response.data.ai_message?.created_at || new Date().toISOString()
        });
        
        // Handle auto-created chat room
        if (response.data.chat_room_id && response.data.chat_room_id !== selectedChatRoom?.id) {
          const newChatRoom = {
            id: response.data.chat_room_id,
            name: "VibeStack Chat",
            user_id: user.attributes.sub
          };
          
          setChatRooms(prev => {
            const exists = prev.some(room => room.id === response.data.chat_room_id);
            return exists ? prev : [...prev, newChatRoom];
          });
          
          setSelectedChatRoom(newChatRoom);
        }
      }
      
      return newMessages;
    });
    
    // Auto-scroll to bottom
    setTimeout(() => scrollToBottom(true), 100);
    
  } catch (error) {
    // Handle specific error types
    let errorMessage = 'Sorry, I encountered an error processing your request.';
    
    if (error.response?.status === 402) {
      errorMessage = 'Insufficient balance to send message. Please contact your organization administrator.';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.detail || 'Invalid request. Please check your input.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication failed. Please refresh the page and try again.';
    }
    
    // Remove typing indicator and add error message
    setMessages(prev => {
      const newMessages = [...prev];
      const typingIndex = newMessages.findIndex(msg => msg.isTyping);
      if (typingIndex !== -1) {
        newMessages.splice(typingIndex, 1);
      }
      
      newMessages.push({ 
        role: 'system', 
        content: errorMessage
      });
      
      return newMessages;
    });
  }
};
```

## Real-time Features

### Auto-scroll Implementation
```javascript
const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
const messagesContainerRef = useRef(null);
const messagesEndRef = useRef(null);

// Auto-scroll when messages change
useEffect(() => {
  if (messages.length > 0 && autoScrollEnabled) {
    const scrollToBottom = () => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
    };

    // Multiple attempts for reliable scrolling
    scrollToBottom();
    setTimeout(scrollToBottom, 100);
    setTimeout(scrollToBottom, 300);
  }
}, [messages, autoScrollEnabled]);

// Detect manual scroll to disable auto-scroll
useEffect(() => {
  const container = messagesContainerRef.current;
  if (!container) return;

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setAutoScrollEnabled(isScrolledToBottom);
  };

  container.addEventListener('scroll', handleScroll);
  return () => container.removeEventListener('scroll', handleScroll);
}, []);
```

### Typing Indicator
```javascript
// CSS Animation for typing indicator
.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 2px;
  background-color: #6c757d;
  border-radius: 50%;
  display: inline-block;
  opacity: 0.6;
  animation: typing 1.5s infinite;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
```

## UI Components

### Main ChatBot Component Structure
```jsx
const ChatBot = () => {
  return (
    <div className="chat-container">
      <Row className="h-100 g-0">
        {/* Sidebar */}
        <Col md={3} className="chat-sidebar">
          <ChatSidebar 
            chatRooms={chatRooms}
            selectedChatRoom={selectedChatRoom}
            onSelectChatRoom={handleSelectChatRoom}
            onCreateChatRoom={createChatRoom}
            onDeleteChatRoom={deleteChatRoom}
          />
        </Col>

        {/* Main Chat Area */}
        <Col md={9} className="chat-main">
          <ChatHeader 
            selectedChatRoom={selectedChatRoom}
            organizationData={organizationData}
            isUserAdmin={isUserAdmin()}
          />
          
          <ChatMessages 
            messages={messages}
            loading={loadingMessages}
            messagesContainerRef={messagesContainerRef}
            messagesEndRef={messagesEndRef}
          />
          
          <ChatInput 
            message={message}
            setMessage={setMessage}
            onSendMessage={handleSendMessage}
            disabled={sendingMessage || !hasPermission}
          />
        </Col>
      </Row>
    </div>
  );
};
```

### Message Rendering
```jsx
const ChatMessage = ({ message, index }) => {
  return (
    <div className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}>
      <div className="message-avatar">
        {message.role === 'user' ? (
          <FontAwesomeIcon icon={faUser} className="user-avatar" />
        ) : (
          <Image src={AiIcon} alt="LF Mentor" className="assistant-avatar" width="40" height="40" />
        )}
      </div>
      
      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">
            {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'LF Mentor'}
          </span>
          {message.created_at && (
            <span className="message-time">
              {new Date(message.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
        
        <div className="message-text">
          {message.role === 'assistant' ? (
            <div className="markdown-body">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ) : (
            <div>{message.content}</div>
          )}
          
          {message.isTyping && (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Mobile Implementation Guide

### React Native ChatBot Component

```jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios from 'axios';
import { Auth, API } from 'aws-amplify';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://thefittlab.com/api';
const API_KEY = 'test-api-key-123';

const MobileChatBot = ({ organizationId }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [user, setUser] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, [organizationId]);

  const initializeChat = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      
      await checkPermissions(currentUser);
      await loadChatRooms(currentUser);
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const checkPermissions = async (currentUser) => {
    try {
      // Get organization member data
      const memberResult = await API.graphql({
        query: `
          query ListOrganizationMembers($filter: ModelOrganizationMemberFilterInput) {
            listOrganizationMembers(filter: $filter) {
              items {
                userSub
                role
                status
              }
            }
          }
        `,
        variables: {
          filter: {
            organizationID: { eq: organizationId },
            userSub: { eq: currentUser.attributes.sub }
          }
        }
      });

      const member = memberResult.data.listOrganizationMembers.items.find(
        m => !m._deleted && m.status === 'ACTIVE'
      );

      if (!member) {
        setHasPermission(false);
        return;
      }

      // Get organization data for permission check
      const orgResult = await API.graphql({
        query: `
          query GetOrganization($id: ID!) {
            getOrganization(id: $id) {
              owner
              additionalOwners
              aiDisabledUsers
            }
          }
        `,
        variables: { id: organizationId }
      });

      const organization = orgResult.data.getOrganization;
      const isOwner = organization.owner === currentUser.attributes.sub;
      const isCoOwner = organization.additionalOwners?.includes(currentUser.attributes.email);
      const isDisabled = organization.aiDisabledUsers?.includes(currentUser.attributes.sub);

      setHasPermission((isOwner || isCoOwner) || !isDisabled);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    }
  };

  const loadChatRooms = async (currentUser) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat-rooms`, {
        params: { user_id: currentUser.attributes.sub },
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });

      const sortedRooms = response.data.sort((a, b) => {
        const aTime = new Date(a.last_activity || a.created_at || 0);
        const bTime = new Date(b.last_activity || b.created_at || 0);
        return bTime - aTime;
      });

      setChatRooms(sortedRooms);

      // Auto-select most recent room
      if (sortedRooms.length > 0) {
        setSelectedChatRoom(sortedRooms[0]);
        await loadMessages(sortedRooms[0].id);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    }
  };

  const loadMessages = async (chatRoomId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/chat-rooms/${chatRoomId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });

      setMessages(response.data);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !hasPermission || !user) {
      return;
    }

    const messageText = inputText;
    setInputText('');

    // Add user message
    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);

    // Add typing indicator
    const typingMessage = { role: 'assistant', content: '', isTyping: true };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const requestBody = {
        message: messageText,
        lf_user_id: user.attributes.sub,
        organization_id: organizationId
      };

      if (selectedChatRoom?.id) {
        requestBody.chat_room_id = selectedChatRoom.id;
      }

      const response = await axios.post(`${API_BASE_URL}/leinfitt-chat`, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });

      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));

      // Add AI response
      if (response.data?.response) {
        const aiMessage = {
          role: 'assistant',
          content: response.data.response,
          created_at: response.data.ai_message?.created_at || new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Handle auto-created chat room
        if (response.data.chat_room_id && response.data.chat_room_id !== selectedChatRoom?.id) {
          const newChatRoom = {
            id: response.data.chat_room_id,
            name: "VibeStack Chat",
            user_id: user.attributes.sub
          };

          setChatRooms(prev => {
            const exists = prev.some(room => room.id === response.data.chat_room_id);
            return exists ? prev : [...prev, newChatRoom];
          });

          setSelectedChatRoom(newChatRoom);
        }
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      // Add error message
      let errorMessage = 'Sorry, I encountered an error processing your request.';
      if (error.response?.status === 402) {
        errorMessage = 'Insufficient balance. Please contact your administrator.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid request.';
      }
      
      setMessages(prev => [...prev, { role: 'system', content: errorMessage }]);
    }
  };

  const createNewChatRoom = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat-rooms`, {
        name: `Chat ${new Date().toLocaleDateString()}`,
        user_id: user.attributes.sub
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });

      const newChatRoom = response.data;
      setChatRooms(prev => [...prev, newChatRoom]);
      setSelectedChatRoom(newChatRoom);
      setMessages([]);
    } catch (error) {
      console.error('Error creating chat room:', error);
      Alert.alert('Error', 'Failed to create new chat room');
    }
  };

  const renderMessage = ({ item, index }) => {
    return (
      <View style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage
      ]}>
        <View style={styles.messageContent}>
          <Text style={styles.messageSender}>
            {item.role === 'user' ? 'You' : item.role === 'system' ? 'System' : 'LF Mentor'}
          </Text>
          
          {item.isTyping ? (
            <View style={styles.typingIndicator}>
              <Text>LF Mentor is typing...</Text>
              <ActivityIndicator size="small" />
            </View>
          ) : (
            <Text style={styles.messageText}>{item.content}</Text>
          )}
          
          {item.created_at && (
            <Text style={styles.messageTime}>
              {new Date(item.created_at).toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.noPermissionContainer}>
          <Text style={styles.noPermissionTitle}>Access Restricted</Text>
          <Text style={styles.noPermissionText}>
            You don't have permission to use the AI chat feature.
          </Text>
          <Text style={styles.noPermissionSubtext}>
            Please contact your organization administrator to request access.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {selectedChatRoom ? selectedChatRoom.name : 'LF Mentor'}
          </Text>
          <TouchableOpacity onPress={createNewChatRoom} style={styles.newChatButton}>
            <Text style={styles.newChatButtonText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Start a Conversation</Text>
              <Text style={styles.emptyStateText}>
                Ask LF Mentor about lean management, process improvement, or your organizational data.
              </Text>
            </View>
          )}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            multiline
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  newChatButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  newChatButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  messagesList: {
    flex: 1
  },
  messagesContainer: {
    padding: 16
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  userMessage: {
    alignItems: 'flex-end'
  },
  assistantMessage: {
    alignItems: 'flex-start'
  },
  messageContent: {
    maxWidth: '80%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#6c757d'
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  messageTime: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 4
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'flex-end'
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 14
  },
  sendButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d'
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#343a40'
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20
  },
  noPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  noPermissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#ffc107'
  },
  noPermissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    color: '#343a40'
  },
  noPermissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6c757d'
  }
};

export default MobileChatBot;
```

### Mobile Navigation Integration

```jsx
// Add to React Native navigation
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MobileChatBot from './components/MobileChatBot';

const Tab = createBottomTabNavigator();

const AppTabs = () => (
  <Tab.Navigator>
    {/* Other tabs */}
    <Tab.Screen 
      name="ChatBot" 
      component={MobileChatBot}
      options={{
        title: 'LF Mentor',
        tabBarIcon: ({ color, size }) => (
          <Image 
            source={require('./assets/Ai-icon.png')} 
            style={{ width: size, height: size, tintColor: color }}
          />
        )
      }}
    />
  </Tab.Navigator>
);
```

### Permission Check Hook

```javascript
import { useState, useEffect } from 'react';
import { API, Auth } from 'aws-amplify';

export const useChatPermission = (organizationId) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkPermission();
  }, [organizationId]);

  const checkPermission = async () => {
    if (!organizationId) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const user = await Auth.currentAuthenticatedUser();
      
      // Get organization member data
      const memberResult = await API.graphql({
        query: `
          query ListOrganizationMembers($filter: ModelOrganizationMemberFilterInput) {
            listOrganizationMembers(filter: $filter) {
              items {
                userSub
                role
                status
              }
            }
          }
        `,
        variables: {
          filter: {
            organizationID: { eq: organizationId },
            userSub: { eq: user.attributes.sub }
          }
        }
      });

      const member = memberResult.data.listOrganizationMembers.items.find(
        m => !m._deleted && m.status === 'ACTIVE'
      );

      if (!member) {
        setHasPermission(false);
        return;
      }

      // Get organization data
      const orgResult = await API.graphql({
        query: `
          query GetOrganization($id: ID!) {
            getOrganization(id: $id) {
              owner
              additionalOwners
              aiDisabledUsers
            }
          }
        `,
        variables: { id: organizationId }
      });

      const organization = orgResult.data.getOrganization;
      const isOwner = organization.owner === user.attributes.sub;
      const isCoOwner = organization.additionalOwners?.includes(user.attributes.email);
      const isDisabled = organization.aiDisabledUsers?.includes(user.attributes.sub);

      setHasPermission((isOwner || isCoOwner) || !isDisabled);
    } catch (err) {
      console.error('Error checking chat permission:', err);
      setError(err.message);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasPermission, loading, error, recheckPermission: checkPermission };
};
```

## Error Handling

### API Error Responses
```javascript
const handleApiError = (error) => {
  if (error.response) {
    switch (error.response.status) {
      case 400:
        // Bad Request
        return {
          type: 'validation',
          message: error.response.data?.detail || 'Invalid request parameters'
        };
        
      case 401:
        // Unauthorized
        return {
          type: 'auth',
          message: 'Authentication failed. Please refresh and try again.'
        };
        
      case 402:
        // Payment Required (Insufficient balance)
        return {
          type: 'payment',
          message: 'Insufficient balance. Please contact your administrator to top up the account.'
        };
        
      case 403:
        // Forbidden
        return {
          type: 'permission',
          message: 'You do not have permission to perform this action.'
        };
        
      case 404:
        // Not Found
        return {
          type: 'notfound',
          message: 'The requested resource was not found.'
        };
        
      case 429:
        // Rate Limited
        return {
          type: 'ratelimit',
          message: 'Too many requests. Please wait a moment and try again.'
        };
        
      case 500:
        // Server Error
        return {
          type: 'server',
          message: 'Server error. Please try again later.'
        };
        
      default:
        return {
          type: 'unknown',
          message: `Request failed with status ${error.response.status}`
        };
    }
  } else if (error.request) {
    // Network Error
    return {
      type: 'network',
      message: 'Network error. Please check your connection and try again.'
    };
  } else {
    // Other Error
    return {
      type: 'unknown',
      message: error.message || 'An unexpected error occurred'
    };
  }
};
```

### Retry Logic
```javascript
const sendMessageWithRetry = async (messageData, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios.post(`${API_BASE_URL}/leinfitt-chat`, messageData, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  
  throw lastError;
};
```

## Best Practices

### 1. Performance Optimization

```javascript
// Debounce API calls
import { debounce } from 'lodash';

const debouncedSendMessage = debounce(async (message) => {
  await sendMessage(message);
}, 500);

// Memoize expensive computations
const memoizedMessageRenderer = useMemo(() => {
  return messages.map((message, index) => ({
    ...message,
    key: `${message.created_at}-${index}`
  }));
}, [messages]);

// Lazy load chat rooms
const lazyLoadChatRooms = async (page = 1, limit = 20) => {
  const response = await axios.get(`${API_BASE_URL}/chat-rooms`, {
    params: { 
      user_id: user.attributes.sub,
      page,
      limit
    },
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  });
  
  return response.data;
};
```

### 2. Offline Support

```javascript
import NetInfo from '@react-native-netinfo/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache messages for offline viewing
const cacheMessages = async (chatRoomId, messages) => {
  try {
    await AsyncStorage.setItem(
      `chat_messages_${chatRoomId}`,
      JSON.stringify({
        messages,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.error('Error caching messages:', error);
  }
};

// Load cached messages when offline
const loadCachedMessages = async (chatRoomId) => {
  try {
    const cached = await AsyncStorage.getItem(`chat_messages_${chatRoomId}`);
    if (cached) {
      const data = JSON.parse(cached);
      
      // Check if cache is less than 24 hours old
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.messages;
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading cached messages:', error);
    return null;
  }
};

// Queue messages for sending when back online
const queueOfflineMessage = async (message) => {
  try {
    const queue = await AsyncStorage.getItem('offline_message_queue');
    const existingQueue = queue ? JSON.parse(queue) : [];
    
    existingQueue.push({
      id: Date.now().toString(),
      message,
      timestamp: Date.now()
    });
    
    await AsyncStorage.setItem('offline_message_queue', JSON.stringify(existingQueue));
  } catch (error) {
    console.error('Error queuing offline message:', error);
  }
};

// Process queued messages when back online
const processOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem('offline_message_queue');
    if (!queue) return;
    
    const messages = JSON.parse(queue);
    
    for (const queuedMessage of messages) {
      try {
        await sendMessage(queuedMessage.message);
      } catch (error) {
        console.error('Error sending queued message:', error);
      }
    }
    
    // Clear queue after processing
    await AsyncStorage.removeItem('offline_message_queue');
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};

// Monitor network status
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && !wasOnline.current) {
      // Just came back online
      processOfflineQueue();
    }
    wasOnline.current = state.isConnected;
  });

  return () => unsubscribe();
}, []);
```

### 3. Security Considerations

```javascript
// Validate input before sending
const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message format');
  }
  
  if (message.length > 4000) {
    throw new Error('Message too long (max 4000 characters)');
  }
  
  // Remove potentially harmful content
  const cleanMessage = message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
    
  return cleanMessage;
};

// Sanitize API responses
const sanitizeApiResponse = (response) => {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid API response format');
  }
  
  return {
    response: typeof response.response === 'string' ? response.response : '',
    chat_room_id: typeof response.chat_room_id === 'string' ? response.chat_room_id : null,
    tokens_used: typeof response.tokens_used === 'number' ? response.tokens_used : 0,
    amount_charged: typeof response.amount_charged === 'number' ? response.amount_charged : 0
  };
};

// Rate limiting
const createRateLimiter = (maxRequests = 10, windowMs = 60000) => {
  const requests = [];
  
  return () => {
    const now = Date.now();
    
    // Remove old requests outside the window
    while (requests.length > 0 && requests[0] <= now - windowMs) {
      requests.shift();
    }
    
    if (requests.length >= maxRequests) {
      throw new Error('Rate limit exceeded. Please wait before sending another message.');
    }
    
    requests.push(now);
  };
};

const rateLimiter = createRateLimiter(10, 60000); // 10 requests per minute
```

## Summary

The VibeStack™ Pro ChatBot system provides AI-powered assistance through a sophisticated permission-based interface. Key features include:

- **External API Integration**: Uses https://thefittlab.com/api for AI processing
- **Organization-based Permissions**: Multi-level access control
- **Chat Room Management**: Create, select, and delete conversation contexts
- **Real-time UI**: Auto-scroll, typing indicators, optimistic updates
- **Rich Formatting**: Markdown support for AI responses
- **Error Handling**: Comprehensive error management with retry logic
- **Mobile-Ready**: Complete React Native implementation examples
- **Offline Support**: Caching and queue-based synchronization
- **Security**: Input validation, rate limiting, and sanitization

The mobile implementation can leverage the same external API with identical permission models and data structures, providing a seamless cross-platform experience for AI-powered lean methodology assistance.

---

*This documentation covers the complete ChatBot system implementation in VibeStack™ Pro as of December 2024. React Native developers can use this guide to implement identical functionality using the same external API and AWS Amplify backend integration patterns.*