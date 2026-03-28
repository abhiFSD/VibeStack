// Simple Quill configuration for consistent paste behavior

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

// Simple clipboard configuration using built-in matchers
export const getClipboardConfig = () => ({
  matchVisual: false,
  matchers: [
    // Universal matcher that strips unwanted formatting
    ['*', function(node, delta) {
      // Return a cleaned delta with only allowed attributes
      const cleanOps = [];
      
      if (delta && delta.ops && Array.isArray(delta.ops)) {
        delta.ops.forEach(op => {
          if (op.insert !== undefined) {
            const newOp = { insert: op.insert };
            
            // Filter attributes to only keep allowed ones
            if (op.attributes && typeof op.attributes === 'object') {
              const cleanAttributes = {};
              Object.keys(op.attributes).forEach(key => {
                if (ALLOWED_FORMATS.includes(key)) {
                  cleanAttributes[key] = op.attributes[key];
                }
              });
              
              if (Object.keys(cleanAttributes).length > 0) {
                newOp.attributes = cleanAttributes;
              }
            }
            
            cleanOps.push(newOp);
          } else if (op.retain !== undefined || op.delete !== undefined) {
            // Keep retain and delete operations as-is
            cleanOps.push(op);
          }
        });
      }
      
      return { ops: cleanOps };
    }]
  ]
});

// Get standard modules configuration with clean clipboard
export const getQuillModules = (customToolbar = null) => {
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
    toolbar: customToolbar || defaultToolbar,
    clipboard: getClipboardConfig()
  };
};