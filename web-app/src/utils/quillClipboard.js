import Quill from 'quill';

const Delta = Quill.import('delta');

// Custom clipboard module to handle paste events and clean content
export class CustomClipboard extends Quill.import('modules/clipboard') {
  constructor(quill, options) {
    super(quill, options);
    
    // Define allowed formats
    this.allowedFormats = [
      'bold',
      'italic', 
      'underline',
      'strike',
      'list',
      'header',
      'blockquote',
      'code-block',
      'link',
      'align',
      'direction',
      'indent',
      'color',
      'background'
    ];
  }
  
  onPaste(e) {
    if (e.defaultPrevented || !this.quill.isEnabled()) return;
    
    e.preventDefault();
    
    const range = this.quill.getSelection();
    if (!range) return;
    
    // Get clipboard data
    const clipboardData = e.clipboardData || window.clipboardData;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');
    
    // If we have HTML, clean it first
    if (html) {
      const cleanedHtml = this.cleanHtml(html);
      
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = cleanedHtml;
      
      // Convert to delta using the parent's convert method
      const delta = this.convert(container);
      
      // Clean the delta to remove unwanted formats
      const cleanedDelta = this.cleanDelta(delta);
      
      // Delete current selection if any
      if (range.length > 0) {
        this.quill.deleteText(range.index, range.length, Quill.sources.USER);
      }
      
      // Insert the cleaned content
      this.quill.updateContents(cleanedDelta, Quill.sources.USER);
      this.quill.setSelection(range.index + this.getLength(cleanedDelta), Quill.sources.SILENT);
    } else if (text) {
      // For plain text, just insert it
      if (range.length > 0) {
        this.quill.deleteText(range.index, range.length, Quill.sources.USER);
      }
      this.quill.insertText(range.index, text, Quill.sources.USER);
      this.quill.setSelection(range.index + text.length, Quill.sources.SILENT);
    }
    
    this.quill.scrollIntoView();
  }
  
  cleanDelta(delta) {
    const Delta = Quill.import('delta');
    const cleanedDelta = new Delta();
    
    delta.ops.forEach(op => {
      if (op.insert) {
        const attributes = {};
        
        // Only keep allowed attributes
        if (op.attributes) {
          Object.keys(op.attributes).forEach(key => {
            if (this.allowedFormats.includes(key)) {
              attributes[key] = op.attributes[key];
            }
          });
        }
        
        if (Object.keys(attributes).length > 0) {
          cleanedDelta.insert(op.insert, attributes);
        } else {
          cleanedDelta.insert(op.insert);
        }
      }
    });
    
    return cleanedDelta;
  }
  
  getLength(delta) {
    return delta.ops.reduce((length, op) => {
      return length + (op.insert ? op.insert.length : 0);
    }, 0);
  }
  
  cleanHtml(html) {
    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all inline styles
    const allElements = temp.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      
      // Remove style-related attributes
      element.removeAttribute('style');
      element.removeAttribute('class');
      element.removeAttribute('id');
      element.removeAttribute('width');
      element.removeAttribute('height');
      element.removeAttribute('align');
      element.removeAttribute('valign');
      element.removeAttribute('bgcolor');
      element.removeAttribute('color');
      element.removeAttribute('face');
      element.removeAttribute('size');
      element.removeAttribute('border');
      element.removeAttribute('cellpadding');
      element.removeAttribute('cellspacing');
      
      // Remove data attributes
      const attrs = element.attributes;
      const attrsToRemove = [];
      for (let j = 0; j < attrs.length; j++) {
        if (attrs[j].name.startsWith('data-')) {
          attrsToRemove.push(attrs[j].name);
        }
      }
      attrsToRemove.forEach(attr => element.removeAttribute(attr));
    }
    
    // Remove unwanted tags but keep their content
    const unwantedTags = [
      'font', 'center', 'marquee', 'blink', 
      'style', 'script', 'meta', 'link', 
      'xml', 'o:p', 'v:shape', 'v:imagedata'
    ];
    
    unwantedTags.forEach(tag => {
      const elements = temp.getElementsByTagName(tag);
      while (elements.length > 0) {
        const element = elements[0];
        const parent = element.parentNode;
        
        // Move children to parent before removing the element
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
    });
    
    // Convert deprecated tags to modern equivalents
    const tagReplacements = {
      'b': 'strong',
      'i': 'em',
      'u': 'u'  // Keep underline as is
    };
    
    Object.entries(tagReplacements).forEach(([oldTag, newTag]) => {
      const elements = temp.getElementsByTagName(oldTag);
      while (elements.length > 0) {
        const element = elements[0];
        const newElement = document.createElement(newTag);
        
        // Copy children
        while (element.firstChild) {
          newElement.appendChild(element.firstChild);
        }
        
        // Replace element
        element.parentNode.replaceChild(newElement, element);
      }
    });
    
    // Clean up empty paragraphs and divs
    const blocks = temp.querySelectorAll('p, div');
    blocks.forEach(block => {
      if (block.innerHTML.trim() === '' || block.innerHTML === '&nbsp;') {
        block.remove();
      }
    });
    
    // Normalize whitespace
    temp.innerHTML = temp.innerHTML
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return temp.innerHTML;
  }
}

// Export a function to register the custom clipboard
export function registerCustomClipboard() {
  Quill.register('modules/clipboard', CustomClipboard, true);
}