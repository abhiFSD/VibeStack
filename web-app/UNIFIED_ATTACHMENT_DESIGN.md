# Unified Attachment Component Design

## Overview
This document outlines the design for a unified attachment component that consolidates all attachment functionality across the VibeStack application.

## Current Problems Solved
1. **Code Duplication**: Multiple similar attachment components
2. **Inconsistent UX**: Different behaviors across components  
3. **Maintenance Burden**: Changes need to be made in multiple places
4. **PDF Support**: Inconsistent PDF handling

## Unified Component API

### Core Props
```javascript
<UnifiedAttachments
  // Core Data (Required)
  attachments={attachments}                    // Array of strings (keys) or objects {key, url, name}
  onAttachmentsChange={handleAttachmentsChange} // Unified change handler
  
  // Upload Configuration
  uploadConfig={{
    multiple: true,           // Allow multiple file uploads
    accept: "*/*",           // File type filter (images, PDFs, etc.)
    maxFiles: 10,            // Maximum number of files
    compress: true,          // Auto-compress images
    autoSave: false          // Auto-save to backend on upload
  }}
  
  // Display Configuration  
  displayMode="grid"         // "grid", "list", "preview"
  showFilenames={true}       // Show filenames under attachments
  showDownload={false}       // Show download buttons
  thumbnailSize={150}        // Thumbnail size in pixels
  allowFullscreen={true}     // Enable modal gallery view
  
  // State Management
  loading={uploading}        // Upload loading state
  disabled={false}          // Disable upload/delete
  
  // Callbacks
  onUploadStart={() => {}}   // Called when upload begins
  onUploadComplete={() => {}} // Called when upload completes
  onDelete={() => {}}        // Called before delete (for confirmation)
  onError={() => {}}         // Called on errors
  
  // Backend Integration (Optional)
  saveConfig={{
    apiCall: updateCategoryMutation,  // GraphQL mutation
    entityId: "category-123",         // Entity being updated
    fieldName: "attachments"          // Field to update
  }}
  
  // Customization
  emptyMessage="No attachments yet"
  className="custom-attachments"
  style={{}}
/>
```

## Display Modes

### 1. Grid Mode (Default)
- Responsive CSS grid layout
- Image thumbnails with PDF icons
- Hover effects and delete buttons
- Click to view full-size

### 2. List Mode  
- Vertical list with filenames
- Download and delete buttons
- Compact display for many files

### 3. Preview Mode
- Single file preview with navigation
- Used in highlights and floating layouts

## Data Flow

### Input Data Formats (Auto-detected)
```javascript
// Format 1: Create mode (separate arrays)
{
  attachments: ["key1", "key2"],
  attachmentURLs: ["url1", "url2"]
}

// Format 2: Edit mode (objects with URLs)
{
  attachments: [
    { key: "key1", url: "url1", name: "file1.jpg" },
    { key: "key2", url: "url2", name: "file2.pdf" }
  ]
}

// Format 3: Mixed (auto-normalize)
{
  attachments: ["key1", { key: "key2", url: "url2" }]
}
```

### Unified Change Handler
```javascript
const handleAttachmentsChange = (newAttachments, changeType, metadata) => {
  // changeType: "add", "delete", "reorder"
  // metadata: { uploadedFiles, deletedKey, etc. }
  
  setAttachments(newAttachments);
  
  if (changeType === "add") {
    onUploadComplete?.(metadata.uploadedFiles);
  }
};
```

## Features

### File Upload
- Drag & drop support
- Multiple file selection
- Progress indicators
- Auto image compression
- PDF passthrough
- File type validation
- Size limits

### Display & Interaction
- Responsive thumbnails
- PDF icon rendering
- Modal gallery with navigation
- Download links
- Delete confirmation
- Loading states
- Error handling

### Backend Integration
- Optional auto-save
- GraphQL mutation support
- Optimistic updates
- Version tracking
- Error retry logic

## Migration Strategy

### Phase 1: Create Unified Component
1. Build `UnifiedAttachments` component
2. Include all existing features
3. Add comprehensive tests

### Phase 2: Gradual Migration
1. Start with simple use cases (CategoryCard)
2. Test thoroughly in one location
3. Migrate one component at a time
4. Maintain backward compatibility

### Phase 3: Cleanup
1. Remove old attachment components
2. Update documentation
3. Optimize bundle size

## Backward Compatibility

### Wrapper Components
Create wrapper components that maintain existing APIs:
```javascript
// AttachmentsList.js (legacy wrapper)
const AttachmentsList = (props) => (
  <UnifiedAttachments
    displayMode="grid"
    uploadConfig={{ multiple: true }}
    {...convertLegacyProps(props)}
  />
);
```

### Props Conversion
```javascript
const convertLegacyProps = (legacyProps) => {
  return {
    attachments: legacyProps.attachments,
    onAttachmentsChange: (newAttachments) => {
      legacyProps.setAttachments(newAttachments);
      // Handle URL updates for create mode
    },
    // Convert other props...
  };
};
```

## Implementation Benefits

1. **Consistency**: Same UX across all attachment areas
2. **Maintenance**: Single place to add features/fix bugs  
3. **Testing**: Comprehensive test suite in one location
4. **Performance**: Optimized loading and caching
5. **Accessibility**: Proper ARIA support throughout
6. **Type Safety**: Full TypeScript support
7. **Documentation**: Single component to document