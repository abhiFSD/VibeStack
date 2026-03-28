import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API, graphqlOperation } from 'aws-amplify';
import { getOrganizationWithDetails } from '../graphql/custom-queries';
import { Row, Col, Alert, Spinner, Form, Button, InputGroup, Modal, Dropdown, Image, Badge } from 'react-bootstrap';
import { useOrganization } from '../contexts/OrganizationContext';
import { useUser } from '../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faUser, 
  faPlus, 
  faTrash, 
  faEllipsisV,
  faSearch,
  faInfoCircle,
  faCog,
  faCoins
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './ChatBot.css';
import AiIcon from '../assets/Ai-icon.png';
import { useNavigate } from 'react-router-dom';
import { StreamingChatHandler, hasEnoughCredits } from '../utils/aiChatUtils';
import { formatMarkdownLike, hasMarkdownPatterns } from '../utils/markdownFormatter';

// Get API configuration from environment variables
const API_BASE_URL = process.env.REACT_APP_CHAT_API_URL || 'https://54.188.183.157/api';
const API_KEY = process.env.REACT_APP_CHAT_API_KEY || 'test-api-key-123';

// For debugging during development
if (process.env.NODE_ENV === 'development') {
  console.log('API_BASE_URL:', API_BASE_URL);
}

const ChatBot = () => {
  const { activeOrganization } = useOrganization();
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [organizationData, setOrganizationData] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [loadingChatRooms, setLoadingChatRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasPermission, setHasPermission] = useState(true); // Default to true, will be checked
  const [checkingPermission, setCheckingPermission] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const autoScrollEnabled = useRef(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamMessage, setCurrentStreamMessage] = useState('');
  const [currentTool, setCurrentTool] = useState(null);
  const [organizationBalance, setOrganizationBalance] = useState(null);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  // Context selection functionality removed - no longer needed

  // Fetch organization data when org changes
  useEffect(() => {
    if (activeOrganization?.id) {
      fetchOrganizationData(activeOrganization.id);
    }
  }, [activeOrganization?.id]);

  // Fetch chat rooms when user or org changes
  useEffect(() => {
    console.log('Organization changed to:', activeOrganization?.id);
    if (user?.attributes?.sub && activeOrganization?.id) {
      // Clear ALL previous data immediately
      setSelectedChatRoom(null);
      setChatRooms([]);
      setMessages([]);
      setError(null);
      
      // Small delay to ensure state is cleared before fetching
      setTimeout(() => {
        console.log('Fetching data for organization:', activeOrganization.id);
        checkUserPermission();
        fetchChatRooms();
        fetchOrganizationBalance();
      }, 100);
    }
  }, [user?.attributes?.sub, activeOrganization?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && autoScrollEnabled.current) {
      // For initial page load, wait longer for DOM to be ready
      const isInitialLoad = messages.length > 1; // Multiple messages loaded at once = initial load
      
      if (isInitialLoad) {
        // Extended delays for initial load from auto-selection
        setTimeout(() => scrollToBottom(true), 200);
        setTimeout(() => scrollToBottom(true), 500);
        setTimeout(() => scrollToBottom(true), 1000);
        setTimeout(() => scrollToBottom(true), 1500); // Extra time for auto-selection
      } else {
        // Normal scrolling for new messages
        scrollToBottom(true);
        setTimeout(() => scrollToBottom(true), 100);
        setTimeout(() => scrollToBottom(true), 300);
      }
    }
  }, [messages]);

  // Additional effect specifically for initial load after page refresh
  useEffect(() => {
    if (messages.length > 0 && !loadingMessages && selectedChatRoom) {
      // This runs after messages are loaded and loading is complete
      const forceScrollToBottom = () => {
        const container = messagesContainerRef.current;
        if (container) {
          autoScrollEnabled.current = true;
          container.scrollTop = container.scrollHeight;
        }
        
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
        }
      };

      // Multiple attempts with longer delays for initial load
      setTimeout(forceScrollToBottom, 200);
      setTimeout(forceScrollToBottom, 500);
      setTimeout(forceScrollToBottom, 1000);
    }
  }, [loadingMessages, messages.length, selectedChatRoom]);

  // Ensure scroll to bottom when chat room changes
  useEffect(() => {
    if (selectedChatRoom && messages.length > 0) {
      // Force scroll when switching chat rooms
      autoScrollEnabled.current = true;
      setTimeout(() => scrollToBottom(true), 100);
      setTimeout(() => scrollToBottom(true), 300);
    }
  }, [selectedChatRoom]);

  // Special handling for auto-selection scroll
  useEffect(() => {
    if (isAutoSelecting && messages.length > 0 && !loadingMessages) {
      console.log('Auto-selection detected, forcing scroll to bottom');
      autoScrollEnabled.current = true;
      
      // Extended delays specifically for auto-selection after page load
      setTimeout(() => scrollToBottom(true), 300);
      setTimeout(() => scrollToBottom(true), 800);
      setTimeout(() => scrollToBottom(true), 1500);
      setTimeout(() => scrollToBottom(true), 2500); // Final attempt
      
      // Reset the flag after scrolling attempts
      setTimeout(() => setIsAutoSelecting(false), 3000);
    }
  }, [isAutoSelecting, messages.length, loadingMessages]);

  // Check if user has permission to use chat
  const checkUserPermission = useCallback(async () => {
    setCheckingPermission(true);
    try {
      // Get user's organization member data
      const response = await API.graphql(
        graphqlOperation(`
          query ListOrganizationMembers($filter: ModelOrganizationMemberFilterInput) {
            listOrganizationMembers(filter: $filter) {
              items {
                id
                email
                userSub
                role
                status
              }
            }
          }
        `, {
          filter: {
            organizationID: { eq: activeOrganization.id },
            userSub: { eq: user.attributes.sub }
          }
        })
      );

      const memberData = response.data.listOrganizationMembers.items.find(
        m => !m._deleted && m.status === 'ACTIVE'
      );

      if (!memberData) {
        setHasPermission(false);
        setError('You are not an active member of this organization.');
        return;
      }

      // Check if user is owner or co-owner (they always have access)
      const isOwner = activeOrganization.owner === user.attributes.sub;
      const isCoOwner = activeOrganization.additionalOwners?.includes(user.attributes.email);
      
      if (isOwner || isCoOwner) {
        setHasPermission(true);
      } else {
        // For regular members, check if they are in the aiDisabledUsers list
        const aiDisabledUsers = activeOrganization.aiDisabledUsers || [];
        setHasPermission(!aiDisabledUsers.includes(user.attributes.sub));
      }
      
    } catch (err) {
      console.error('Error checking user permission:', err);
      setHasPermission(false);
      setError('Unable to verify chat permissions. Please contact your administrator.');
    } finally {
      setCheckingPermission(false);
    }
  }, [activeOrganization?.id, user?.attributes?.sub]);

  // Handle manual scroll to detect if user scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isScrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;
      autoScrollEnabled.current = isScrolledToBottom;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = (force = false) => {
    const container = messagesContainerRef.current;
    
    // Enable auto-scroll
    autoScrollEnabled.current = true;
    
    // Method 1: Try container scroll
    if (container) {
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      // Debug info for auto-selection issues
      if (isAutoSelecting) {
        console.log('Scroll attempt:', {
          scrollHeight,
          clientHeight, 
          currentScrollTop: container.scrollTop,
          force
        });
      }
      
      if (force) {
        container.scrollTop = scrollHeight;
      } else {
        container.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      }
      
      // Verify scroll worked for auto-selection
      if (isAutoSelecting) {
        setTimeout(() => {
          console.log('Scroll verification - scrollTop:', container.scrollTop, 'should be:', scrollHeight);
        }, 100);
      }
    }
    
    // Method 2: Try scrolling to messagesEndRef as fallback
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: force ? 'auto' : 'smooth', 
        block: 'end' 
      });
    }
  };

  // Fetch organization balance - using same approach as organization management page
  const fetchOrganizationBalance = useCallback(async () => {
    if (!activeOrganization?.id) return;
    
    try {
      // Use the same endpoint as organization management page
      const response = await axios.get(
        `${API_BASE_URL}/organizations/${activeOrganization.id}`,
        {
          headers: {
            'X-API-Key': API_KEY
          }
        }
      );
      
      // Extract balance the same way as organization management
      const org = response.data.organization;
      const availableBalance = org.available_balance || 0;
      
      console.log('Fetched organization balance:', availableBalance);
      
      setOrganizationBalance({
        balance: availableBalance,
        available_tokens: Math.floor(availableBalance * 49999), // Same conversion as org management
        tokens_per_dollar: 49999
      });
    } catch (err) {
      console.error('Error fetching organization balance:', err);
      // Only set default if we really can't get the data
      setOrganizationBalance({ 
        balance: 0,  // Show 0 instead of fake 10.0
        available_tokens: 0,
        tokens_per_dollar: 49999
      });
    }
  }, [activeOrganization?.id]);

  const fetchOrganizationData = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.graphql(
        graphqlOperation(getOrganizationWithDetails, { id })
      );
      
      const data = response.data.getOrganization;
      setOrganizationData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organization data:', err);
      setError('Failed to fetch organization data. Please try again later.');
      setLoading(false);
    }
  };

  // Context data fetching functions removed - no longer needed

  const fetchChatRooms = useCallback(async () => {
    if (!user?.attributes?.sub || !activeOrganization?.id) return;
    
    setLoadingChatRooms(true);
    try {
      // Try the new endpoint format first
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/users/${user.attributes.sub}/chat-rooms`, {
          params: { 
            organization_id: activeOrganization.id
          },
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          }
        });
      } catch (err) {
        if (err.response?.status === 404) {
          // Fallback to the old endpoint format if new one doesn't exist
          console.log('New endpoint not found, trying legacy endpoint...');
          // The backend might need the numeric user ID instead of the sub
          // For now, use the sub and let backend handle the mapping
          response = await axios.get(`${API_BASE_URL}/chat-rooms`, {
            params: { 
              user_id: user.attributes.sub,  // Backend should map this
              organization_id: activeOrganization.id
            },
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': API_KEY
            }
          });
          console.log('Chat rooms fetched:', response.data);
        } else {
          throw err;
        }
      }
      
      // Ensure we have data
      const rooms = response?.data || [];
      console.log('Raw chat rooms from API:', rooms);
      
      // Filter rooms to ensure they belong to current organization
      const filteredRooms = rooms.filter(room => 
        room.organization_id === activeOrganization.id
      );
      console.log('Filtered rooms for org', activeOrganization.id, ':', filteredRooms);
      
      // Sort chat rooms by last activity (most recent first)
      const sortedRooms = filteredRooms.sort((a, b) => {
        const aLastActivity = new Date(a.last_activity || a.created_at || 0);
        const bLastActivity = new Date(b.last_activity || b.created_at || 0);
        return bLastActivity - aLastActivity;
      });
      
      setChatRooms(sortedRooms);
      console.log('Final sorted rooms set:', sortedRooms);
      
      // If we have chat rooms but none selected, select the most recent one (first in sorted list)
      if (sortedRooms.length > 0 && !selectedChatRoom) {
        setIsAutoSelecting(true); // Flag that we're auto-selecting
        setSelectedChatRoom(sortedRooms[0]);
        fetchChatMessages(sortedRooms[0].id);
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
      // Don't show error for 404, just set empty chat rooms
      if (err.response?.status === 404) {
        setChatRooms([]);
        setSelectedChatRoom(null);
      } else {
        setError('Failed to load chat rooms. Please try again.');
      }
    } finally {
      setLoadingChatRooms(false);
    }
  }, [user?.attributes?.sub, activeOrganization?.id]);

  const fetchChatMessages = async (chatRoomId) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      // Fetch both messages and recent token usage
      const [messagesResponse, usageResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/chat-rooms/${chatRoomId}/messages`, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          }
        }),
        // Fetch recent token usage to correlate with messages
        axios.get(`${API_BASE_URL}/token-usage`, {
          params: { 
            organization_id: activeOrganization?.id,
            page: 1
          },
          headers: {
            'X-API-Key': API_KEY
          }
        }).catch(err => {
          console.warn('Could not fetch token usage:', err);
          return { data: { usage_history: [] } };
        })
      ]);
      
      const response = messagesResponse;
      
      console.log('=== DEBUG: MESSAGE AND TOKEN DATA ===');
      console.log('Raw message data:', response.data);
      console.log('Token usage history:', usageResponse.data?.usage_history);
      
      // Check every message's token_usage field
      response.data.forEach((msg, index) => {
        console.log(`Message ${index} (${msg.role}):`, {
          id: msg.id,
          has_token_usage: !!msg.token_usage,
          token_usage_value: msg.token_usage,
          created_at: msg.created_at
        });
      });
      
      // Check if the API structure matches what we expect
      if (response.data[0]?.token_usage) {
        console.log('✅ Messages DO have token_usage field:', response.data[0].token_usage);
      } else {
        console.log('❌ Messages DO NOT have token_usage field');
        console.log('Sample message fields:', Object.keys(response.data[0] || {}));
      }
      
      // Create a map of token usage by approximate timestamp for correlation
      const tokenUsageMap = new Map();
      const usageHistory = usageResponse.data?.usage_history || [];
      usageHistory.forEach(usage => {
        const usageDate = new Date(usage.date);
        const key = usageDate.toISOString().split('T')[0] + '_' + usageDate.getHours(); // Group by day and hour
        if (!tokenUsageMap.has(key)) {
          tokenUsageMap.set(key, []);
        }
        tokenUsageMap.get(key).push(usage);
      });
      
      console.log('Token usage map by time:', tokenUsageMap);
      
      // Map backend fields to frontend interface (same as local AI chatbot)
      const mappedMessages = response.data.map((msg) => {
        let correlatedTokenUsage = msg.token_usage;
        
        // If message doesn't have token usage, try to correlate with usage history (for assistant messages only)
        if (!correlatedTokenUsage && msg.role === 'assistant' && msg.created_at) {
          const msgDate = new Date(msg.created_at);
          const timeKey = msgDate.toISOString().split('T')[0] + '_' + msgDate.getHours();
          const usageForTime = tokenUsageMap.get(timeKey) || [];
          
          console.log(`Trying to correlate message ${msg.id} (${msg.created_at}) with timeKey: ${timeKey}`);
          console.log(`Available usage entries for timeKey:`, usageForTime);
          
          // Find usage entry that roughly matches this message time (within 5 minutes)
          const matchingUsage = usageForTime.find(usage => {
            const usageDate = new Date(usage.date);
            const timeDiff = Math.abs(msgDate.getTime() - usageDate.getTime());
            console.log(`Checking usage ${usage.date}, time diff: ${timeDiff}ms (${timeDiff/1000/60} minutes)`);
            return timeDiff < 5 * 60 * 1000; // 5 minutes tolerance
          });
          
          if (matchingUsage) {
            console.log(`✅ Correlated message ${msg.id} with usage:`, matchingUsage);
            correlatedTokenUsage = {
              input_tokens: matchingUsage.input_tokens || 0,
              output_tokens: matchingUsage.output_tokens || 0, 
              tool_tokens: matchingUsage.tool_tokens || 0,
              total_tokens: matchingUsage.token_amount || 0,
              amount_charged: matchingUsage.amount || 0
            };
          } else {
            console.log(`❌ No matching usage found for message ${msg.id} (${msg.created_at})`);
            console.log(`Available usage dates:`, usageForTime.map(u => u.date));
          }
        }
        
        return {
          ...msg,
          timestamp: msg.created_at || msg.timestamp, // Map created_at to timestamp
          // Ensure we have the enhanced fields
          formatted_content: msg.formatted_content,
          is_enhanced: msg.is_enhanced,
          tools_used: msg.tools_used || [],
          token_usage: correlatedTokenUsage ? {
            inputTokens: correlatedTokenUsage.input_tokens || correlatedTokenUsage.inputTokens || 0,
            outputTokens: correlatedTokenUsage.output_tokens || correlatedTokenUsage.outputTokens || 0,
            toolTokens: correlatedTokenUsage.tool_tokens || correlatedTokenUsage.toolTokens || 0,
            totalTokens: correlatedTokenUsage.total_tokens || correlatedTokenUsage.totalTokens || correlatedTokenUsage.token_amount ||
                        (correlatedTokenUsage.input_tokens + correlatedTokenUsage.output_tokens + correlatedTokenUsage.tool_tokens) ||
                        (correlatedTokenUsage.inputTokens + correlatedTokenUsage.outputTokens + correlatedTokenUsage.toolTokens) || 0,
            amount_charged: correlatedTokenUsage.amount_charged || correlatedTokenUsage.amount || 0
          } : undefined
        };
      });
      
      // Sort messages by timestamp (oldest first for chat display)
      const sortedMessages = mappedMessages.sort((a, b) => 
        new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
      );
      
      console.log('=== DEBUG: FINAL MAPPED MESSAGES ===');
      sortedMessages.forEach((msg, index) => {
        if (msg.role === 'assistant') {
          console.log(`Final message ${index}:`, {
            id: msg.id,
            role: msg.role,
            has_token_usage: !!msg.token_usage,
            token_usage: msg.token_usage,
            created_at: msg.timestamp
          });
        }
      });
      
      setMessages(sortedMessages);
      
      // Enable auto-scroll and scroll to bottom after messages are loaded
      autoScrollEnabled.current = true;
      
      // Multiple scrolling attempts with different delays to handle various loading scenarios
      setTimeout(() => scrollToBottom(true), 50);   // Very quick attempt
      setTimeout(() => scrollToBottom(true), 200);  // After DOM updates
      setTimeout(() => scrollToBottom(true), 500);  // After all content loads
      setTimeout(() => scrollToBottom(true), 1000); // Final attempt for slow content
      
    } catch (err) {
      console.error('Error fetching chat messages:', err);
      setError('Failed to load chat history. Please try again.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const createChatRoom = async () => {
    if (!newChatName.trim() || !user?.attributes?.sub || !activeOrganization?.id) return;
    
    try {
      // The backend expects user_id but accepts the user_sub UUID as its value
      const response = await axios.post(`${API_BASE_URL}/chat-rooms`, {
        name: newChatName,
        user_id: user.attributes.sub,  // Backend maps this UUID to internal user_id
        organization_id: activeOrganization.id
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
      setNewChatName('');
      setShowNewChatModal(false);
      
      // Clear messages since this is a new chat
      setMessages([]);
    } catch (err) {
      console.error('Error creating chat room:', err);
      setError('Failed to create chat room. Please try again.');
    }
  };

  const deleteChatRoom = async (chatRoomId) => {
    if (!chatRoomId) return;
    
    if (!window.confirm('Are you sure you want to delete this chat room? All messages will be permanently deleted.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_BASE_URL}/chat-rooms/${chatRoomId}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      });
      
      // Remove from chat rooms list
      setChatRooms(prev => prev.filter(room => room.id !== chatRoomId));
      
      // If the deleted room was selected, clear selection
      if (selectedChatRoom?.id === chatRoomId) {
        setSelectedChatRoom(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting chat room:', err);
      setError('Failed to delete chat room. Please try again.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    if (!organizationData) {
      setError('Organization data is not available. Please wait until it loads.');
      return;
    }
    if (!user?.attributes?.sub) {
      setError('User information is not available. Please make sure you are logged in.');
      return;
    }
    
    // Check balance
    if (!hasEnoughCredits(organizationBalance?.balance || 0)) {
      setError('Insufficient credits. Please contact your organization administrator to top up.');
      return;
    }
    
    // Check if we need to ensure a chat room exists
    let chatRoomToUse = selectedChatRoom;
    
    if (!chatRoomToUse) {
      try {
        // Create a new chat room for this conversation
        const response = await axios.post(`${API_BASE_URL}/chat-rooms`, {
          name: "New Chat",
          user_id: user.attributes.sub,  // Backend maps this UUID to internal user_id
          organization_id: activeOrganization.id
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          }
        });
        
        chatRoomToUse = response.data;
        setChatRooms(prev => [...prev, chatRoomToUse]);
        setSelectedChatRoom(chatRoomToUse);
      } catch (err) {
        console.error('Error creating chat room:', err);
        // Try to proceed without a chat room ID (backend might auto-create)
        console.log('Proceeding without explicit chat room, backend may auto-create one');
        chatRoomToUse = { id: 'auto' }; // Use a placeholder
      }
    }

    const userMessage = message;
    setMessage('');
    
    // Add user message to chat 
    const userMessageObj = {
      role: 'user', 
      content: userMessage
    };
    
    setMessages(prevMessages => [
      ...prevMessages, 
      userMessageObj
    ]);
    
    // Add placeholder for streaming message
    const aiMessageId = Date.now();
    setMessages(prevMessages => [
      ...prevMessages,
      { 
        id: aiMessageId,
        role: 'assistant', 
        content: '', 
        isStreaming: true 
      }
    ]);
    
    setSendingMessage(true);
    setIsStreaming(true);
    setCurrentStreamMessage('');
    setCurrentTool(null);
    
    try {
      // Create streaming handler
      const streamHandler = new StreamingChatHandler(
        API_BASE_URL,
        API_KEY,
        activeOrganization.id,
        user.attributes.sub
      );
      
      // Set up event handlers
      streamHandler.on('token', (token) => {
        setCurrentStreamMessage(prev => prev + token);
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: currentStreamMessage + token }
              : msg
          )
        );
      });
      
      streamHandler.on('toolStart', (toolName, displayName) => {
        // Make tool status messages more descriptive (same as local AI chatbot)
        let statusMessage = '';
        
        switch(toolName) {
          case 'list_reports':
            statusMessage = '📋 Getting your reports...';
            break;
          case 'get_report_details':
            statusMessage = '📊 Loading report details...';
            break;
          case 'calculate_lens_scores':
            statusMessage = '🎯 Analyzing with 4-lens framework...';
            break;
          case 'get_learning_suggestions':
            statusMessage = '💡 Finding learning suggestions...';
            break;
          case 'retrieve_knowledge_base':
            statusMessage = '📚 Searching knowledge base...';
            break;
          case 'graphql_query':
            statusMessage = '🔍 Fetching your data...';
            break;
          case 'search_action_items':
            statusMessage = '✅ Finding action items...';
            break;
          default:
            statusMessage = `🛠️ ${displayName || toolName}`;
        }
        
        setCurrentTool(statusMessage);
      });
      
      streamHandler.on('toolComplete', () => {
        // Tool completed - show transitional status
        setCurrentTool('🔄 Generating response...');
        setTimeout(() => setCurrentTool(null), 500); // Brief transition
      });
      
      streamHandler.on('status', (status) => {
        console.log('Status:', status);
      });
      
      streamHandler.on('complete', (result) => {
        // Update final message with enhanced data (same as local AI chatbot)
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === aiMessageId 
              ? { 
                  ...msg, 
                  content: result.ai_message?.content || result.finalMessage || currentStreamMessage,
                  formatted_content: result.ai_message?.formatted || result.ai_message?.formatted_content,
                  is_enhanced: result.enhanced || result.ai_message?.is_enhanced,
                  tools_used: result.tools_used || result.tools || [],
                  token_usage: result.usage ? {
                    inputTokens: result.usage.input_tokens || result.usage.inputTokens || 0,
                    outputTokens: result.usage.output_tokens || result.usage.outputTokens || 0,
                    toolTokens: result.usage.tool_tokens || result.usage.toolTokens || 0,
                    totalTokens: result.usage.total_tokens || result.usage.totalTokens || 
                                 (result.usage.input_tokens + result.usage.output_tokens + result.usage.tool_tokens) ||
                                 (result.usage.inputTokens + result.usage.outputTokens + result.usage.toolTokens) || 0,
                    amount_charged: result.usage.amount_charged || 0
                  } : undefined,
                  isStreaming: false,
                  created_at: new Date().toISOString()
                }
              : msg
          )
        );
        
        // Update balance after successful message
        fetchOrganizationBalance();
        
        console.log('Stream complete - full result:', result);
        console.log('Stream usage object:', result.usage);
        console.log('Stream AI message:', result.ai_message);
        console.log('Stream usage fields:', {
          input_tokens: result.usage?.input_tokens,
          output_tokens: result.usage?.output_tokens,
          total_tokens: result.usage?.total_tokens,
          amount_charged: result.usage?.amount_charged
        });
        
        if (result.usage?.total_tokens || result.usage?.totalTokens) {
          console.log(`Tokens used: ${result.usage.total_tokens || result.usage.totalTokens}, Cost: $${result.usage.amount_charged || 0}`);
        } else {
          console.log('No token usage found in stream result');
        }
      });
      
      streamHandler.on('error', (error) => {
        console.error('Stream error:', error);
        setError(`Stream error: ${error.message}`);
      });
      
      // Send message with streaming
      // If chat room ID is 'auto', let the backend handle it
      const roomId = chatRoomToUse.id === 'auto' ? null : chatRoomToUse.id;
      await streamHandler.sendMessage(roomId || 'default', userMessage);
      
      // Force scroll to bottom after streaming
      autoScrollEnabled.current = true;
      setTimeout(() => scrollToBottom(true), 100);
      
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Handle specific error types
      let errorMessage = 'Sorry, I encountered an error processing your request. Please try again.';
      
      if (err.message?.includes('402') || err.message?.includes('Insufficient')) {
        errorMessage = 'Insufficient balance. Please contact your organization administrator to top up.';
        setError('Insufficient credits. Minimum 0.5 credits required.');
      } else if (err.message?.includes('401')) {
        errorMessage = 'Authentication failed. Please refresh the page and try again.';
        setError('Authentication error. Please refresh the page.');
      } else {
        setError(`Failed to send message: ${err.message || 'Unknown error'}`);
      }
      
      // Update the streaming message to show error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === aiMessageId 
            ? { 
                ...msg, 
                content: errorMessage,
                isStreaming: false,
                isError: true
              }
            : msg
        )
      );
    } finally {
      setSendingMessage(false);
      setIsStreaming(false);
      setCurrentTool(null);
    }
  };

  const handleSelectChatRoom = (room) => {
    setSelectedChatRoom(room);
    // Clear current messages immediately for better UX
    setMessages([]);
    fetchChatMessages(room.id);
  };


  // Check if user is admin (owner or co-owner)
  const isUserAdmin = () => {
    if (!user?.attributes?.sub || !activeOrganization) return false;
    
    const isOwner = activeOrganization.owner === user.attributes.sub;
    const isCoOwner = activeOrganization.additionalOwners?.includes(user.attributes.email);
    
    return isOwner || isCoOwner;
  };

  // Navigate to AI settings
  const handleOpenAiSettings = () => {
    navigate('/organization-management', { 
      state: { activeTab: 'ai-settings' } 
    });
  };


  const renderChatMessages = () => {
    return (
      <>
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
          >
            <div className="message-avatar">
              {msg.role === 'user' ? (
                <FontAwesomeIcon icon={faUser} className="user-avatar" />
              ) : (
                <Image src={AiIcon} alt="LF Mentor" className="assistant-avatar" width="40" height="40" />
              )}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-sender">
                  {msg.role === 'user' ? 'You' : msg.role === 'system' ? 'System' : 'LF Mentor'}
                </span>
                {msg.created_at && (
                  <span className="message-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className="message-text">
                {msg.role === 'assistant' ? (
                  <div className="response-content">
                    {/* Enhanced message rendering based on local AI chatbot */}
                    {msg.role === 'assistant' && msg.formatted_content ? (
                      // Use formatted content if available
                      <div style={{ marginBottom: '8px' }}>
                        {formatMarkdownLike(msg.formatted_content)}
                      </div>
                    ) : msg.role === 'assistant' && hasMarkdownPatterns(msg.content) ? (
                      // Auto-detect and format markdown patterns
                      <div style={{ marginBottom: '8px' }}>
                        {formatMarkdownLike(msg.content)}
                      </div>
                    ) : (
                      // Fallback to plain text with line breaks
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                        {msg.content}
                      </div>
                    )}

                    {/* Tools Used Info for AI messages */}
                    {msg.role === 'assistant' && msg.tools_used && Array.isArray(msg.tools_used) && msg.tools_used.length > 0 && (
                      <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                        <small style={{ color: '#666', fontSize: '0.75rem' }}>
                          🛠️ Tools used: {msg.tools_used.map((tool) => tool.name).join(', ')}
                        </small>
                      </div>
                    )}

                    {/* Token Usage Info for AI messages (same as local chatbot) */}
                    {msg.role === 'assistant' && msg.token_usage && (
                      <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <Badge 
                          bg="light" 
                          text="dark"
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          📥 {msg.token_usage.inputTokens} in
                        </Badge>
                        {msg.token_usage.toolTokens > 0 && (
                          <Badge 
                            bg="light" 
                            text="dark"
                            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                          >
                            🔧 {msg.token_usage.toolTokens} tools
                          </Badge>
                        )}
                        <Badge 
                          bg="light" 
                          text="dark"
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          📤 {msg.token_usage.outputTokens} out
                        </Badge>
                        <Badge 
                          bg="light" 
                          text="dark"
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          Σ {msg.token_usage.totalTokens}
                        </Badge>
                        <Badge 
                          bg="light" 
                          text="dark"
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          💰 ${(msg.token_usage.amount_charged || 0).toFixed(6)}
                        </Badge>
                      </div>
                    )}

                    {/* Show streaming indicator if message is still streaming */}
                    {msg.isStreaming && !msg.content && (
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {msg.content.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i !== msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                    {/* Context display removed - no longer needed */}
                  </>
                )}
                {msg.isTyping && (
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Scroll target element */}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </>
    );
  };

  return (
    <div className="chat-container">
      <Row className="h-100 g-0">
        {/* Sidebar */}
        <Col md={3} className="chat-sidebar">
          <div className="sidebar-header">
            <h4>Chat Rooms</h4>
            <Button 
              variant="primary" 
              size="sm" 
              className="new-chat-btn"
              onClick={() => setShowNewChatModal(true)}
            >
              <FontAwesomeIcon icon={faPlus} /> New Chat
            </Button>
          </div>

          <div className="sidebar-search">
            <InputGroup>
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search chats..."
                className="search-input"
              />
            </InputGroup>
          </div>

          <div className="chat-rooms-list">
            {loadingChatRooms ? (
              <div className="text-center py-4">
                <Spinner animation="border" size="sm" />
                <p className="mt-2">Loading chats...</p>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="empty-chats">
                <Image src={AiIcon} alt="LF Mentor" className="ai-icon" />
                <p>No chat rooms yet</p>
                <Button 
                  variant="outline-primary" 
                  className="start-chat-btn"
                  onClick={() => setShowNewChatModal(true)}
                >
                  Start a new chat
                </Button>
              </div>
            ) : (
              chatRooms.map(room => (
                <div 
                  key={room.id}
                  className={`chat-room-item ${selectedChatRoom?.id === room.id ? 'active' : ''}`}
                  onClick={() => handleSelectChatRoom(room)}
                >
                  <div className="chat-room-icon">
                    <Image src={AiIcon} alt="LF Mentor" className="ai-icon" />
                  </div>
                  <div className="chat-room-info">
                    <div className="chat-room-name">{room.name}</div>
                    <div className="chat-room-preview">
                      {room.last_activity ? 
                        `Last activity: ${new Date(room.last_activity).toLocaleDateString()}` : 
                        'Click to view conversation'
                      }
                    </div>
                  </div>
                  <Dropdown className="chat-room-actions">
                    <Dropdown.Toggle variant="link" className="no-arrow">
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item 
                        className="text-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChatRoom(room.id);
                        }}
                      >
                        <FontAwesomeIcon icon={faTrash} className="me-2" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              ))
            )}
          </div>
        </Col>

        {/* Main Chat Area */}
        <Col md={9} className="chat-main">
          {error && (
            <Alert variant="danger" className="chat-alert" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {!activeOrganization ? (
            <div className="chat-placeholder">
              <FontAwesomeIcon icon={faInfoCircle} size="3x" />
              <h4>Select an Organization</h4>
              <p>Please select an organization to start chatting</p>
            </div>
          ) : checkingPermission ? (
            <div className="chat-loading">
              <Spinner animation="border" role="status" />
              <p>Checking permissions...</p>
            </div>
          ) : !hasPermission ? (
            <div className="chat-placeholder">
              <FontAwesomeIcon icon={faInfoCircle} size="3x" className="text-warning" />
              <h4>Access Restricted</h4>
              <p>You don't have permission to use the AI chat feature.</p>
              <p className="text-muted">Please contact your organization administrator to request access.</p>
            </div>
          ) : loading ? (
            <div className="chat-loading">
              <Spinner animation="border" role="status" />
              <p>Loading chat...</p>
            </div>
          ) : organizationData && (
            <>
              <div className="chat-header">
                <div className="chat-title">
                  <h4>{selectedChatRoom ? selectedChatRoom.name : 'Select a Chat'}</h4>
                  <div className="chat-subtitle">{organizationData.name}</div>
                  {/* Debug info - temporarily visible */}
                  <small className="text-muted">
                    Org: {activeOrganization?.id} | Rooms: {chatRooms.length} | 
                    Selected: {selectedChatRoom?.id || 'none'}
                  </small>
                </div>
                <div className="chat-header-actions d-flex align-items-center">
                  {/* Credits/Balance Display */}
                  {organizationBalance && (
                    <div className="credits-display me-3">
                      <Badge 
                        bg={organizationBalance.balance < 0.5 ? 'danger' : 'success'}
                        className="p-2"
                      >
                        <FontAwesomeIcon icon={faCoins} className="me-1" />
                        ${organizationBalance.balance.toFixed(2)}
                        <small className="d-block" style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                          {organizationBalance.available_tokens.toLocaleString()} credits
                        </small>
                      </Badge>
                      {organizationBalance.balance < 0.5 && (
                        <small className="text-danger d-block mt-1">Low balance</small>
                      )}
                    </div>
                  )}
                  {isUserAdmin() && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={handleOpenAiSettings}
                      title="AI Settings"
                      className="me-2"
                    >
                      <FontAwesomeIcon icon={faCog} className="me-1" />
                      AI Settings
                    </Button>
                  )}
                </div>
              </div>

              <div className="chat-messages" ref={messagesContainerRef}>
                {loadingMessages ? (
                  <div className="messages-loading">
                    <Spinner animation="border" role="status" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-placeholder">
                    <Image src={AiIcon} alt="LF Mentor" className="ai-icon" />
                    <h4>Start a Conversation with LF Mentor</h4>
                    <p>Ask questions about lean management, process improvement, or organizational tools.</p>
                    <p className="text-muted small">
                      Try asking: "Show me my recent reports", "What are my action items?", or "How many coins do I have?"
                    </p>
                  </div>
                ) : (
                  <>
                    {renderChatMessages()}
                    {/* Tool execution status */}
                    {currentTool && (
                      <div className="tool-status-display p-3 bg-light border-top">
                        <div className="d-flex align-items-center">
                          <Spinner animation="border" size="sm" className="me-2" />
                          <span className="text-muted">
                            <FontAwesomeIcon icon={faCog} className="me-2" />
                            {currentTool}...
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Context selector removed - no longer needed */}

              <div className="chat-input-area">
                <Form onSubmit={handleSendMessage} className="chat-form">
                  <InputGroup className="align-items-center">
                    <Form.Control
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={organizationData && hasPermission ? "Type your message here..." : "Loading..."}
                      disabled={sendingMessage || !organizationData || !hasPermission}
                      className="chat-input"
                    />
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={sendingMessage || !message.trim() || !organizationData || !hasPermission}
                      className="send-btn"
                    >
                      {sendingMessage ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <FontAwesomeIcon icon={faPaperPlane} />
                      )}
                    </Button>
                  </InputGroup>
                </Form>
                <p className="disclaimer-text mt-2 text-center text-muted small">
                  Note: LF Mentor can make mistakes. Always check important info!
                </p>
              </div>
            </>
          )}
        </Col>
      </Row>

      {/* New Chat Modal */}
      <Modal 
        show={showNewChatModal} 
        onHide={() => setShowNewChatModal(false)}
        className="chat-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Create New LF Mentor Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Chat Room Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter a name for your chat room"
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="chat-input"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewChatModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={createChatRoom}
            disabled={!newChatName.trim()}
          >
            Create Chat Room
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChatBot; 