// Enhanced markdown formatter based on local AI chatbot implementation
import React from 'react';

// Helper function to detect markdown patterns
export const hasMarkdownPatterns = (content) => {
  return (
    content.includes('**') ||           // Bold text
    content.includes('##') ||          // Headers  
    content.includes('# ') ||          // H1 headers
    /^\d+\.\s/.test(content) ||        // Numbered lists at start
    content.includes('\n\n1.') ||     // Numbered lists in content
    content.includes('Reports:') ||    // Common Smart Tools patterns
    content.includes('Projects:') ||
    content.includes('Action Items:') ||
    content.includes('### ') ||        // H3 headers
    content.includes('#### ') ||       // H4 headers
    content.includes('- ') ||          // Bullet lists
    content.includes('* ') ||          // Bullet lists
    content.includes('`') ||           // Code snippets
    content.includes('[') && content.includes(']') && content.includes('(') && content.includes(')') // Links
  );
};

// Parse markdown links and make them clickable
const parseMarkdownLinks = (text) => {
  // Regex to match markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the link as a clickable element
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a 
        key={`link-${keyCounter++}`}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ 
          color: '#1976d2',
          textDecoration: 'underline',
          cursor: 'pointer'
        }}
      >
        {linkText}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no links found, return the original text
  return parts.length > 0 ? parts : [text];
};

export const formatMarkdownLike = (content) => {
  const lines = content.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h6 key={key++} style={{ fontWeight: 600, marginTop: '16px', marginBottom: '8px', fontSize: '1.1rem' }}>
          {line.substring(4)}
        </h6>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h5 key={key++} style={{ fontWeight: 600, marginTop: '16px', marginBottom: '8px', fontSize: '1.25rem' }}>
          {line.substring(3)}
        </h5>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h4 key={key++} style={{ fontWeight: 600, marginTop: '16px', marginBottom: '8px', fontSize: '1.5rem' }}>
          {line.substring(2)}
        </h4>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <p key={key++} style={{ marginLeft: '16px', marginBottom: '4px', fontSize: '0.875rem' }}>
          <strong>{line.match(/^\d+\./)?.[0]}</strong> {line.replace(/^\d+\.\s/, '')}
        </p>
      );
    }
    // Bullet lists (with link support)
    else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const bulletContent = line.startsWith('• ') ? line.substring(2) : line.substring(2);
      const parsedContent = parseMarkdownLinks(bulletContent);
      
      elements.push(
        <p key={key++} style={{ marginLeft: '16px', marginBottom: '4px', fontSize: '0.875rem' }}>
          • {parsedContent}
        </p>
      );
    }
    // Bold sections (Reports:, etc.)
    else if (line.includes('Reports:') || line.includes('Projects:') || line.includes('Action Items:') || line.includes('Summary:')) {
      elements.push(
        <p key={key++} style={{ fontWeight: 600, marginTop: '8px', marginBottom: '4px', fontSize: '0.875rem' }}>
          {line}
        </p>
      );
    }
    // Regular lines with bold text
    else if (line.includes('**')) {
      const parts = line.split('**');
      const formattedParts = parts.map((part, index) => 
        index % 2 === 1 ? <strong key={index}>{part}</strong> : part
      );
      elements.push(
        <p key={key++} style={{ marginBottom: '4px', fontSize: '0.875rem' }}>
          {formattedParts}
        </p>
      );
    }
    // Code snippets
    else if (line.includes('`')) {
      const parts = line.split('`');
      const formattedParts = parts.map((part, index) => 
        index % 2 === 1 ? 
          <code key={index} style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '2px 4px', 
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '0.85em'
          }}>
            {part}
          </code> : part
      );
      elements.push(
        <p key={key++} style={{ marginBottom: '4px', fontSize: '0.875rem' }}>
          {formattedParts}
        </p>
      );
    }
    // Empty lines (spacing)
    else if (line.trim() === '') {
      elements.push(<div key={key++} style={{ height: '8px' }} />);
    }
    // Regular text (with link support)
    else {
      const parsedContent = parseMarkdownLinks(line);
      elements.push(
        <p key={key++} style={{ marginBottom: '4px', fontSize: '0.875rem' }}>
          {parsedContent}
        </p>
      );
    }
  }

  return elements;
};