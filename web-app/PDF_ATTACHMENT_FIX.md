# PDF Attachment Display Fix for ActionItemModal

## Problem Identified
When opening an Action Item with PDF attachments, the attachments section showed "- attachment and nothing" instead of displaying the PDF icon and filename.

## Root Cause
The issue was in the ActionItemModal component:

1. **Data Format Mismatch**: ActionItemModal loads attachments as objects `{key, url, name}` but was using legacy mode which expects strings + separate URL array
2. **Incorrect Filename Extraction**: The filename extraction logic was flawed, looking for `_` instead of `-` in the S3 key format
3. **Legacy Mode Confusion**: Using `useLegacyMode={true}` but providing object format data

## Fixes Applied

### 1. **Fixed Filename Extraction in ActionItemModal**
```javascript
// OLD (incorrect):
const name = key.includes('_') ? key.split('_').pop() : 'attachment';

// NEW (correct):
let name = 'attachment';
if (key && typeof key === 'string') {
  if (key.includes('/')) {
    const filename = key.split('/').pop();
    if (filename.includes('-')) {
      // Remove timestamp prefix: "1234567890-document.pdf" -> "document.pdf"
      name = filename.substring(filename.indexOf('-') + 1);
    } else {
      name = filename;
    }
  } else {
    name = key;
  }
}
```

### 2. **Switched ActionItemModal to New Mode**
```javascript
// OLD (legacy mode):
<AttachmentsWrapper
  attachments={attachments}
  setAttachments={setAttachments}
  attachmentURLs={attachmentURLs}
  setAttachmentURLs={setAttachmentURLs}
  onDeleteAttachment={handleDeleteAttachment}
  useLegacyMode={true}
  // ...
/>

// NEW (unified mode):
<AttachmentsWrapper
  attachments={attachments}
  onAttachmentsChange={handleAttachmentsChange}
  useLegacyMode={false}
  onDelete={async (attachment) => {
    return window.confirm('Are you sure you want to delete this attachment?');
  }}
  // ...
/>
```

### 3. **Added Debug Logging**
Added console.log statements in development mode to help diagnose similar issues:
- Attachment object processing
- PDF detection logic
- Render state debugging

## Expected Result After Fix

When you open an Action Item with PDF attachments, you should now see:

✅ **PDF Icon**: Red PDF icon with "PDF" text  
✅ **Filename**: Actual filename (e.g., "document.pdf")  
✅ **Click to Open**: Clicking opens PDF in new browser tab  
✅ **No "attachment and nothing"**: Proper display instead of empty state  

## Testing Steps

1. **Open an Action Item** that has PDF attachments
2. **Verify Display**: Should show PDF icon + filename
3. **Test Click**: Click on PDF should open in new tab
4. **Test Upload**: Upload a new PDF should work correctly
5. **Test Delete**: Delete button should work

## Debug Information

If issues persist, check browser console for debug logs that show:
- Attachment object structure
- PDF detection results
- Render state information

## Files Modified

1. `/src/components/shared/ActionItemModal.js`
   - Fixed filename extraction logic
   - Switched to unified mode
   - Added handleAttachmentsChange function

2. `/src/components/shared/UnifiedAttachments.js`
   - Added debug logging for development

The fix should resolve the PDF display issue in Action Items while maintaining all existing functionality.