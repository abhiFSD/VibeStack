// AI Chat Utilities for FITTWorks™ Integration

// Parse 4-lens response from AI
export class LensResponseParser {
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

// Streaming chat handler
export class StreamingChatHandler {
  constructor(apiUrl, apiKey, organizationId, userSub) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.organizationId = organizationId;
    this.userSub = userSub;
    this.callbacks = {};
  }

  // Set event callbacks
  on(event, callback) {
    this.callbacks[event] = callback;
  }

  // Send message with streaming
  async sendMessage(chatRoomId, message) {
    try {
      // If no valid chat room ID, use a simpler endpoint that auto-creates rooms
      const endpoint = chatRoomId && chatRoomId !== 'default' 
        ? `${this.apiUrl}/chat-rooms/${chatRoomId}/messages/tools/stream`
        : `${this.apiUrl}/chat/stream`; // Fallback endpoint
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          content: message,
          organization_id: this.organizationId,
          user_sub: this.userSub,
          chat_room_id: chatRoomId // Include if available
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send message');
      }

      return this.handleStream(response.body);
    } catch (error) {
      if (this.callbacks.error) {
        this.callbacks.error(error);
      }
      throw error;
    }
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
      usage: {},
      ai_message: null
    };

    try {
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
              if (this.callbacks.complete) {
                this.callbacks.complete(result);
              }
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
    } catch (error) {
      console.error('Stream handling error:', error);
      if (this.callbacks.error) {
        this.callbacks.error(error);
      }
    }

    return result;
  }

  handleEvent(event, result) {
    switch (event.type) {
      case 'status':
        if (this.callbacks.status) {
          this.callbacks.status(event.message);
        }
        break;

      case 'token':
        result.tokens.push(event.content);
        result.finalMessage += event.content;
        if (this.callbacks.token) {
          this.callbacks.token(event.content);
        }
        break;

      case 'tool_start':
        result.tools.push({
          name: event.tool_name,
          display: event.display_name,
          status: 'running'
        });
        if (this.callbacks.toolStart) {
          this.callbacks.toolStart(event.tool_name, event.display_name);
        }
        break;

      case 'tool_complete':
        const tool = result.tools.find(t => t.name === event.tool_name);
        if (tool) tool.status = 'complete';
        if (this.callbacks.toolComplete) {
          this.callbacks.toolComplete(event.tool_name);
        }
        break;

      case 'complete':
        result.complete = true;
        result.usage = event.usage || {};
        result.finalMessage = event.message || result.finalMessage;
        result.ai_message = event.ai_message;
        if (this.callbacks.complete) {
          this.callbacks.complete(result);
        }
        break;

      case 'error':
        if (this.callbacks.error) {
          this.callbacks.error(new Error(event.message));
        }
        break;
    }
  }
}

// Convert balance to credits (keeping existing system logic)
export const convertBalanceToCredits = (balance) => {
  // Using the existing token system: 1 USD = 49,999 tokens
  // For display as "credits", we can show as is or adjust
  return Math.floor(balance * 49999);
};

// Check if user has enough credits
export const hasEnoughCredits = (balance) => {
  return balance >= 0.5; // Minimum $0.50 required
};

// Format credits for display
export const formatCredits = (credits) => {
  return credits.toLocaleString();
};