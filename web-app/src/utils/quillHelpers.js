// Quill configuration helpers for consistent paste behavior

// Define allowed formats across all editors
export const ALLOWED_FORMATS = [
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

// Clean HTML before it gets to Quill
export const cleanHtml = (html) => {
  // Create a temporary container
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Remove all inline styles and unwanted attributes
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
    const attrs = Array.from(element.attributes);
    attrs.forEach(attr => {
      if (attr.name.startsWith('data-')) {
        element.removeAttribute(attr.name);
      }
    });
  }
  
  // Remove unwanted tags but keep their content
  const unwantedTags = [
    'font', 'center', 'marquee', 'blink', 
    'style', 'script', 'meta', 'link', 
    'xml', 'o:p'
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
    'i': 'em'
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
  
  return temp.innerHTML;
};

// Custom clipboard configuration that works with matchVisual: false
export const getClipboardModule = () => {
  return {
    matchVisual: false,
    matchers: [
      // Match all elements and clean their attributes
      [Node.ELEMENT_NODE, function(node, delta) {
        // The delta here already has ops array with insert operations
        const cleanedOps = [];
        
        if (delta && delta.ops) {
          delta.ops.forEach(op => {
            if (op.insert !== undefined) {
              const cleanOp = { insert: op.insert };
              
              // Only keep allowed attributes
              if (op.attributes) {
                const cleanAttributes = {};
                Object.keys(op.attributes).forEach(key => {
                  if (ALLOWED_FORMATS.includes(key)) {
                    cleanAttributes[key] = op.attributes[key];
                  }
                });
                
                if (Object.keys(cleanAttributes).length > 0) {
                  cleanOp.attributes = cleanAttributes;
                }
              }
              
              cleanedOps.push(cleanOp);
            }
          });
        }
        
        return { ops: cleanedOps };
      }]
    ]
  };
};

// Get standard modules configuration with custom clipboard
export const getQuillModules = (toolbarOptions = null) => {
  const defaultToolbar = [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ];
  
  return {
    toolbar: toolbarOptions || defaultToolbar,
    clipboard: getClipboardModule()
  };
};