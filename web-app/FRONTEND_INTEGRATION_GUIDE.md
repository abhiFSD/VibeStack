# FITTWorks™ AI - Frontend Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Chat Room System](#chat-room-system)
4. [Streaming Chat Implementation](#streaming-chat-implementation)
5. [Organization Configuration](#organization-configuration)
6. [4-Lens Response Handling](#4-lens-response-handling)
7. [Token/Credit Management](#tokencredit-management)
8. [Complete Implementation Examples](#complete-implementation-examples)

---

## Overview

The FITTWorks™ AI system provides a comprehensive chat interface with real-time streaming, 4-lens analysis, and organization-based configuration. This guide covers everything needed for frontend integration.

### Base URL
- **Development**: `http://localhost:8080`
- **Production**: `https://thefittlab.com`

### Required Headers
```javascript
{
  "Content-Type": "application/json",
  "X-API-Key": "your-api-key",
  "Accept": "text/event-stream"  // For streaming endpoints
}
```

---

## Authentication

### API Key Authentication
All endpoints require an API key in the header:
```javascript
headers: {
  "X-API-Key": "your-api-key"
}
```

### User & Organization Context
Every chat request requires:
- `organization_id`: Organization identifier (e.g., "org_123")
- `user_sub`: User identifier (e.g., "user_456")

---

## Chat Room System

### Create Chat Room
```javascript
POST /api/chat-rooms

Request:
{
  "name": "Project Discussion",
  "user_id": 123  // Database user ID
}

Response:
{
  "id": 1,
  "name": "Project Discussion",
  "user_id": 123,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Get User's Chat Rooms
```javascript
GET /api/users/{user_id}/chat-rooms

Response:
[
  {
    "id": 1,
    "name": "Project Discussion",
    "created_at": "2024-01-15T10:00:00Z",
    "message_count": 15,
    "last_message": "2024-01-15T14:30:00Z"
  }
]
```

### Get Chat History
```javascript
GET /api/chat-rooms/{chat_room_id}/messages

Response:
[
  {
    "id": 1,
    "role": "user",
    "content": "Help me improve my process",
    "created_at": "2024-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "role": "assistant",
    "content": "I'll analyze your process using the 4-lens framework...",
    "formatted_content": "<formatted HTML or markdown>",
    "model_id": "us.anthropic.claude-3-7-sonnet",
    "tools_used": ["calculate_lens_scores", "get_learning_suggestions"],
    "token_usage": {
      "inputTokens": 150,
      "outputTokens": 500,
      "toolTokens": 200,
      "totalTokens": 850,
      "amount_charged": 0.00034
    },
    "created_at": "2024-01-15T10:00:05Z"
  }
]
```

---

## Streaming Chat Implementation

### Primary Endpoint - Real-time Streaming with Tools
```javascript
POST /api/chat-rooms/{chat_room_id}/messages/tools/stream
```

### JavaScript Implementation with EventSource

```javascript
class FWMentorChat {
  constructor(apiKey, organizationId, userSub) {
    this.apiKey = apiKey;
    this.organizationId = organizationId;
    this.userSub = userSub;
    this.baseUrl = 'http://localhost:8080';
  }

  async sendMessage(chatRoomId, message) {
    const response = await fetch(
      `${this.baseUrl}/api/chat-rooms/${chatRoomId}/messages/tools/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          content: message,
          organization_id: this.organizationId,
          user_sub: this.userSub
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return this.handleStream(response.body);
  }

  async handleStream(stream) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result = {
      tokens: [],
      tools: [],
      complete: false,
      finalMessage: '',
      usage: {}
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          // Check for stream end
          if (data === '[DONE]') {
            result.complete = true;
            continue;
          }

          try {
            const event = JSON.parse(data);
            this.handleEvent(event, result);
          } catch (e) {
            console.error('Failed to parse event:', e);
          }
        }
      }
    }

    return result;
  }

  handleEvent(event, result) {
    switch (event.type) {
      case 'status':
        // Update UI with status message
        console.log('Status:', event.message);
        break;

      case 'token':
        // Append token to display
        result.tokens.push(event.content);
        result.finalMessage += event.content;
        this.onToken?.(event.content);
        break;

      case 'tool_start':
        // Show tool execution
        result.tools.push({
          name: event.tool_name,
          display: event.display_name,
          status: 'running'
        });
        this.onToolStart?.(event.tool_name, event.display_name);
        break;

      case 'tool_complete':
        // Update tool status
        const tool = result.tools.find(t => t.name === event.tool_name);
        if (tool) tool.status = 'complete';
        this.onToolComplete?.(event.tool_name);
        break;

      case 'complete':
        // Final completion with all data
        result.complete = true;
        result.usage = event.usage;
        result.finalMessage = event.message || result.finalMessage;
        result.ai_message = event.ai_message;
        this.onComplete?.(result);
        break;

      case 'error':
        // Handle errors
        this.onError?.(event.message);
        break;
    }
  }
}

// Usage Example
const chat = new FWMentorChat('api-key', 'org_123', 'user_456');

// Set event handlers
chat.onToken = (token) => {
  // Append token to chat display
  document.getElementById('message').innerHTML += token;
};

chat.onToolStart = (toolName, displayName) => {
  // Show tool execution status
  document.getElementById('status').innerHTML = `🔧 ${displayName}...`;
};

chat.onComplete = (result) => {
  // Handle completion
  console.log('Message complete:', result);
  console.log('Tokens used:', result.usage.totalTokens);
  console.log('Cost:', result.usage.amount_charged);
};

// Send message
await chat.sendMessage(1, "Help me improve my team communication");
```

### Stream Event Types

```typescript
// Status Update
{
  "type": "status",
  "message": "Understanding your question..."
}

// Real-time Token
{
  "type": "token",
  "content": "Based "  // Individual tokens streamed
}

// Tool Execution Start
{
  "type": "tool_start",
  "tool_name": "calculate_lens_scores",
  "display_name": "Analyzing with 4-lens framework..."
}

// Tool Execution Complete
{
  "type": "tool_complete",
  "tool_name": "calculate_lens_scores"
}

// Final Completion Event
{
  "type": "complete",
  "message": "Full response text...",
  "ai_message": {
    "id": 123,
    "content": "Full response",
    "formatted_content": "Formatted HTML/Markdown",
    "model_id": "us.anthropic.claude-3-7-sonnet",
    "tools_used": ["calculate_lens_scores", "get_learning_suggestions"],
    "token_usage": {
      "inputTokens": 150,
      "outputTokens": 500,
      "toolTokens": 200,
      "totalTokens": 850
    }
  },
  "usage": {
    "inputTokens": 150,
    "outputTokens": 500,
    "toolTokens": 200,
    "totalTokens": 850,
    "amount_charged": 0.00034
  },
  "tools_used": [
    "calculate_lens_scores",
    "get_learning_suggestions"
  ]
}

// Stream End Marker
data: [DONE]
```

---

## Organization Configuration

### Get Organization Configuration
```javascript
GET /api/organizations/{organization_id}/config

Response:
{
  "organization_id": "org_123",
  "performance_drivers": {
    "org_performance_weight": 20,
    "growth_innovation_weight": 20,
    "quality_workflow_weight": 20,
    "team_engagement_weight": 20,
    "customer_satisfaction_weight": 20
  },
  "everlight_enabled": true,
  "default_platform": "VibeStack",
  "ai_model_id": "us.anthropic.claude-3-7-sonnet"
}
```

### Update Organization Configuration
```javascript
PUT /api/organizations/{organization_id}/config

Request:
{
  "org_performance_weight": 30,      // Max 50%
  "growth_innovation_weight": 25,    // Max 50%
  "quality_workflow_weight": 20,     // Max 50%
  "team_engagement_weight": 15,      // Max 50%
  "customer_satisfaction_weight": 10, // Max 50%
  "everlight_enabled": false
  // Note: All weights must sum to 100%
}

Response:
{
  "success": true,
  "message": "Configuration updated successfully"
}
```

### Check Balance/Credits
```javascript
GET /api/organization/{organization_id}/available-balance

Response:
{
  "balance": 8.50,           // Dollar amount
  "available_tokens": 8500000, // Tokens available
  "tokens_per_dollar": 1000000
}

// For UI display, convert balance to credits (1:1 ratio)
// $8.50 = 8.5 credits
```

---

## 4-Lens Response Handling

### Expected Response Structure

The AI will return responses in this format:

```markdown
## Leadership Lens ℹ️
👥 **Leadership & Team Dynamics**
**Score:** 3/10 (🔴) — High priority
**Rationale:** Team communication breakdown detected requiring immediate leadership intervention...

**Action Items:**
- Schedule one-on-one meetings with each team member
- Implement daily standup meetings
- Create communication guidelines document

## Lean Management Lens ℹ️
⚙️ **Process & Efficiency Optimization**
**Score:** 6/10 (🟡) — Medium priority
**Rationale:** Process improvements can support better team coordination...

**Action Items:**
- Map current communication workflow
- Identify bottlenecks in information flow
- Standardize meeting formats

## Work-Life Balance Lens ℹ️
⚖️ **Well-being & Sustainability**
**Score:** 7/10 (🟢) — Strong performance
- Establish "no meeting" time blocks
- Encourage regular breaks
- Set clear work hour boundaries

## EverLight™ Lens ℹ️
[Only shown if everlight_enabled = true]
Lead with patience and empathy. Foster an environment of trust...

## Summary Recommendation
Focus first on leadership interventions while implementing process improvements...

## 📚 Learning Content Sources
• Communication Excellence Guide [Watch Tutorial](link)
• Team Dynamics Assessment [Watch Tutorial](link)
• Effective Meeting Practices [Watch Tutorial](link)
```

### Parsing the Response

```javascript
class LensResponseParser {
  parseResponse(content) {
    const lenses = {
      leadership: this.extractLens(content, 'Leadership Lens'),
      lean: this.extractLens(content, 'Lean Management Lens'),
      workLife: this.extractLens(content, 'Work-Life Balance Lens'),
      everlight: this.extractLens(content, 'EverLight™ Lens'),
      summary: this.extractSection(content, 'Summary Recommendation'),
      learning: this.extractLearning(content)
    };
    
    return lenses;
  }

  extractLens(content, lensName) {
    const regex = new RegExp(`## ${lensName}.*?(?=##|$)`, 's');
    const match = content.match(regex);
    if (!match) return null;

    const lensContent = match[0];
    const scoreMatch = lensContent.match(/Score:\s*(\d+)\/10\s*\((.*?)\)\s*—\s*(.*)/);
    
    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : null,
      emoji: scoreMatch ? scoreMatch[2] : null,
      priority: scoreMatch ? scoreMatch[3] : null,
      rationale: this.extractRationale(lensContent),
      actionItems: this.extractActionItems(lensContent),
      color: this.getColorFromScore(scoreMatch ? parseInt(scoreMatch[1]) : 0)
    };
  }

  getColorFromScore(score) {
    if (score >= 8) return 'green';
    if (score >= 5) return 'yellow';
    return 'red';
  }

  extractActionItems(content) {
    const items = [];
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        items.push(line.trim().substring(1).trim());
      }
    }
    return items;
  }

  extractRationale(content) {
    const match = content.match(/Rationale:\s*(.*?)(?=\*\*Action Items|\n-|\n•|$)/s);
    return match ? match[1].trim() : '';
  }

  extractLearning(content) {
    const section = this.extractSection(content, 'Learning Content Sources');
    if (!section) return [];

    const items = [];
    const lines = section.split('\n');
    for (const line of lines) {
      const match = line.match(/•\s*(.*?)\s*(?:\[Watch Tutorial\]\((.*?)\))?$/);
      if (match) {
        items.push({
          title: match[1],
          tutorialLink: match[2] || null
        });
      }
    }
    return items;
  }

  extractSection(content, sectionName) {
    const regex = new RegExp(`## ${sectionName}.*?(?=##|$)`, 's');
    const match = content.match(regex);
    return match ? match[0].replace(`## ${sectionName}`, '').trim() : null;
  }
}
```

---

## Token/Credit Management

### Display Credits (Not Dollars)
```javascript
// Convert backend balance to credits for display
function formatCredits(balance) {
  // 1 dollar = 1 credit
  return {
    credits: balance,
    display: `${balance.toFixed(1)} credits`
  };
}

// Check if user can send message
function canSendMessage(balance) {
  return balance >= 0.5; // Minimum 0.5 credits required
}
```

### Token Usage Tracking
```javascript
GET /api/token-usage?organization_id=org_123&page=1

Response:
{
  "parent_organization_id": "org_123",
  "total_records": 150,
  "page": 1,
  "limit": 20,
  "hasNextPage": true,
  "usage_history": [
    {
      "id": 1,
      "model_name": "us.anthropic.claude-3-7-sonnet",
      "token_amount": 850,
      "amount": 0.00034,
      "date": "2024-01-15T14:30:00Z",
      "type": "streaming",
      "description": "Streaming - 150 in / 200 tools / 500 out (Tools: 2)"
    }
  ]
}
```

### Handling Insufficient Credits
```javascript
// Error response when balance < 0.5
{
  "detail": "Insufficient balance. Minimum required: $0.50. Please top up.",
  "status_code": 402
}

// Handle in frontend
if (error.status_code === 402) {
  showTopUpModal();
  displayError("You need at least 0.5 credits to send messages. Please add credits.");
}
```

---

## Complete Implementation Examples

### React Component Example

```jsx
import React, { useState, useEffect, useRef } from 'react';

const FWMentorChatComponent = ({ organizationId, userSub, apiKey }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [credits, setCredits] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const streamingMessage = useRef('');

  // Load credits on mount
  useEffect(() => {
    loadCredits();
    loadOrCreateChatRoom();
  }, []);

  const loadCredits = async () => {
    try {
      const response = await fetch(
        `/api/organization/${organizationId}/available-balance`,
        {
          headers: { 'X-API-Key': apiKey }
        }
      );
      const data = await response.json();
      setCredits(data.balance);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const loadOrCreateChatRoom = async () => {
    // Implementation to get or create chat room
    setChatRoomId(1); // Example
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    
    // Check credits
    if (credits < 0.5) {
      alert('Insufficient credits. Please top up.');
      return;
    }

    const userMessage = input;
    setInput('');
    setIsStreaming(true);
    
    // Add user message to display
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);

    // Create placeholder for AI message
    const aiMessageId = Date.now();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true
    }]);

    streamingMessage.current = '';

    try {
      const response = await fetch(
        `/api/chat-rooms/${chatRoomId}/messages/tools/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
            'Accept': 'text/event-stream'
          },
          body: JSON.stringify({
            content: userMessage,
            organization_id: organizationId,
            user_sub: userSub
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      await handleStream(response.body, aiMessageId);
      
      // Reload credits after message
      loadCredits();
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.filter(m => m.id !== aiMessageId));
      alert('Failed to send message');
    } finally {
      setIsStreaming(false);
      setCurrentTool(null);
    }
  };

  const handleStream = async (stream, messageId) => {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            // Stream complete
            setMessages(prev => prev.map(m => 
              m.id === messageId 
                ? { ...m, isStreaming: false }
                : m
            ));
            continue;
          }

          try {
            const event = JSON.parse(data);
            
            switch (event.type) {
              case 'token':
                streamingMessage.current += event.content;
                setMessages(prev => prev.map(m => 
                  m.id === messageId 
                    ? { ...m, content: streamingMessage.current }
                    : m
                ));
                break;
                
              case 'tool_start':
                setCurrentTool(event.display_name);
                break;
                
              case 'tool_complete':
                setCurrentTool(null);
                break;
                
              case 'complete':
                // Final message with all data
                setMessages(prev => prev.map(m => 
                  m.id === messageId 
                    ? {
                        ...m,
                        content: event.message || streamingMessage.current,
                        formatted_content: event.ai_message?.formatted_content,
                        tools_used: event.tools_used,
                        usage: event.usage,
                        isStreaming: false
                      }
                    : m
                ));
                break;
            }
          } catch (e) {
            console.error('Failed to parse event:', e);
          }
        }
      }
    }
  };

  const parseAndRenderLenses = (content) => {
    const parser = new LensResponseParser();
    const lenses = parser.parseResponse(content);
    
    return (
      <div className="lens-response">
        {lenses.leadership && (
          <LensCard 
            title="Leadership"
            lens={lenses.leadership}
            icon="👥"
          />
        )}
        {lenses.lean && (
          <LensCard 
            title="Lean Management"
            lens={lenses.lean}
            icon="⚙️"
          />
        )}
        {lenses.workLife && (
          <LensCard 
            title="Work-Life Balance"
            lens={lenses.workLife}
            icon="⚖️"
          />
        )}
        {lenses.everlight && (
          <LensCard 
            title="EverLight™"
            lens={lenses.everlight}
            icon="✨"
          />
        )}
        {lenses.summary && (
          <div className="summary">
            <h3>Summary Recommendation</h3>
            <p>{lenses.summary}</p>
          </div>
        )}
        {lenses.learning && lenses.learning.length > 0 && (
          <div className="learning-resources">
            <h3>📚 Learning Resources</h3>
            <ul>
              {lenses.learning.map((item, idx) => (
                <li key={idx}>
                  {item.title}
                  {item.tutorialLink && (
                    <a href={item.tutorialLink} target="_blank">
                      Watch Tutorial
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>FW™ Mentor AI</h2>
        <div className="credits">
          {credits !== null && (
            <span className={credits < 0.5 ? 'low-credits' : ''}>
              💳 {credits.toFixed(1)} credits
            </span>
          )}
        </div>
      </div>

      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && msg.formatted_content
              ? parseAndRenderLenses(msg.content)
              : msg.content
            }
            {msg.isStreaming && (
              <span className="streaming-indicator">●●●</span>
            )}
          </div>
        ))}
        
        {currentTool && (
          <div className="tool-status">
            🔧 {currentTool}...
          </div>
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask FW™ Mentor AI..."
          disabled={isStreaming || credits < 0.5}
        />
        <button 
          onClick={sendMessage}
          disabled={isStreaming || !input.trim() || credits < 0.5}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const LensCard = ({ title, lens, icon }) => {
  const getColorClass = (color) => {
    return `lens-card lens-${color}`;
  };

  return (
    <div className={getColorClass(lens.color)}>
      <div className="lens-header">
        <span className="lens-icon">{icon}</span>
        <h3>{title}</h3>
        <span className="lens-score">
          {lens.score}/10 {lens.emoji} - {lens.priority}
        </span>
      </div>
      {lens.rationale && (
        <div className="lens-rationale">
          <strong>Rationale:</strong> {lens.rationale}
        </div>
      )}
      {lens.actionItems && lens.actionItems.length > 0 && (
        <div className="lens-actions">
          <strong>Action Items:</strong>
          <ul>
            {lens.actionItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### CSS Styling for Lens Display

```css
.lens-response {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lens-card {
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid;
}

.lens-red {
  background-color: #ffebee;
  border-left-color: #f44336;
}

.lens-yellow {
  background-color: #fff8e1;
  border-left-color: #ff9800;
}

.lens-green {
  background-color: #e8f5e9;
  border-left-color: #4caf50;
}

.lens-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.lens-score {
  margin-left: auto;
  font-weight: bold;
}

.lens-icon {
  font-size: 1.5rem;
}

.lens-rationale {
  margin: 0.5rem 0;
  color: #555;
}

.lens-actions ul {
  margin-top: 0.5rem;
  padding-left: 1.5rem;
}

.credits {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border-radius: 4px;
}

.low-credits {
  color: #f44336;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.tool-status {
  padding: 0.5rem;
  background: #e3f2fd;
  border-radius: 4px;
  color: #1976d2;
  margin: 0.5rem 0;
}

.streaming-indicator {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
```

---

## Error Handling

### Common Error Scenarios

```javascript
class ErrorHandler {
  handleApiError(error) {
    switch (error.status_code) {
      case 402:
        // Insufficient credits
        return {
          type: 'INSUFFICIENT_CREDITS',
          message: 'You need at least 0.5 credits to send messages',
          action: 'TOP_UP'
        };
        
      case 404:
        // Chat room not found
        return {
          type: 'NOT_FOUND',
          message: 'Chat room not found',
          action: 'CREATE_NEW'
        };
        
      case 429:
        // Rate limit
        return {
          type: 'RATE_LIMIT',
          message: 'Too many requests. Please wait.',
          action: 'WAIT'
        };
        
      case 500:
        // Server error
        return {
          type: 'SERVER_ERROR',
          message: 'Server error. Please try again.',
          action: 'RETRY'
        };
        
      default:
        return {
          type: 'UNKNOWN',
          message: error.detail || 'An error occurred',
          action: 'RETRY'
        };
    }
  }
}
```

---

## Testing Checklist

- [ ] Authentication with API key works
- [ ] Chat room creation and listing works
- [ ] Message streaming displays tokens in real-time
- [ ] Tool execution status shows during processing
- [ ] 4-lens response parses and displays correctly
- [ ] Credit balance updates after each message
- [ ] Insufficient credit error handled gracefully
- [ ] EverLight™ lens shows only when enabled
- [ ] Token usage tracking displays correctly
- [ ] Organization config updates work
- [ ] Performance driver weights save correctly
- [ ] Chat history loads properly
- [ ] Error states handled appropriately

---

## API Rate Limits

- **Messages per minute**: 10 per user
- **Concurrent streams**: 1 per user
- **Maximum message length**: 4000 characters
- **Maximum response tokens**: No limit (but costs apply)

---

## Support & Troubleshooting

### Common Issues

1. **Stream not working**: Ensure `Accept: text/event-stream` header is set
2. **Credits not updating**: Check organization_id matches
3. **Tools not executing**: Verify API key has proper permissions
4. **Response not formatted**: Check if model supports 4-lens structure

### Debug Mode

Enable debug logging by adding to request:
```javascript
{
  "content": "your message",
  "organization_id": "org_123",
  "user_sub": "user_456",
  "debug": true  // Returns additional diagnostic info
}
```

---

## Next Steps

1. Implement the chat UI using the examples above
2. Add credit purchase flow (Stripe or IAP)
3. Create organization settings page
4. Add chat room management UI
5. Implement response caching for better performance
6. Add typing indicators and presence
7. Create mobile-responsive design

For questions or issues, refer to the backend API documentation at `/docs` endpoint.