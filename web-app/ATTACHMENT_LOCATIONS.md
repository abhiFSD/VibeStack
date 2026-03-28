# Attachment Upload Locations in VibeStack

This document identifies all locations in the codebase where file attachments (images) are implemented, excluding profile picture uploads.

## Core Components

### 1. FileUploader Utility
- **Location**: `/src/components/basic/FileUploader.js`
- **Current Support**: Images only with compression
- **Usage**: Core utility used across the application

### 2. AttachmentsList Components
- **Main Component**: `/src/components/reports/AttachmentsList.js`
- **5S Variant**: `/src/components/5s/AttachmentsList.js`
- **Current Support**: Images only
- **Display**: Grid/list view with modal preview

### 3. AttachmentImage Display
- **Location**: `/src/components/shared/AttachmentImage.js`
- **Current Support**: Images only
- **Features**: Error handling, retry logic, guest access

## Implementation Areas

### Reports Module
1. **Category Cards** (`/src/components/reports/CategoryCard.js`)
   - Used in: All report types (5S, VSM, Kaizen, etc.)
   - Attachment Type: Images for categories

2. **Highlight Cards** (`/src/components/reports/HighlightCard.js`)
   - Used in: Report highlights sections
   - Attachment Type: Multiple images with carousel

3. **VSM Reports** (`/src/components/reports/ReportVsm.js`)
   - Used in: Value Stream Mapping reports
   - Attachment Type: Process images

### Projects Module
1. **Project Attachments Card** (`/src/components/Project/ProjectAttachmentsCard.js`)
   - Used in: Project detail views
   - Attachment Type: Project documentation images

### Action Items
1. **Action Item Modal** (`/src/components/shared/ActionItemModal.js`)
   - Used in: Action item creation/editing
   - Attachment Type: Reference images


## PDF Generation Components
These components display attachments in PDF reports:
- `/src/components/public/ReportPdf.js`
- `/src/components/public/ReportVsmPdf.js`
- `/src/components/reports_pdf/BaseReportPdf.js`
- `/src/components/reports_pdf/ObservationReport.js`
- `/src/components/reports_pdf/ProcessAnalysisReport.js`

## Required Changes for PDF Support

### 1. Update FileUploader.js
- Add PDF file type validation
- Skip compression for PDF files
- Handle PDF upload to S3

### 2. Update AttachmentsList Components
- Add PDF icon/thumbnail display
- Implement "Open in new tab" for PDFs
- Differentiate between image preview and PDF link

### 3. Update AttachmentImage.js
- Add PDF rendering support or fallback icon
- Handle PDF URLs differently from images

### 4. Update All Implementation Areas
- Ensure file input accepts PDFs
- Update validation rules
- Handle PDF display in UI

### 5. Update PDF Report Generation
- Include PDF links in generated reports
- Show PDF icon instead of trying to embed

## S3 Storage Considerations
- Current: All attachments stored in `attachments/` prefix
- Recommendation: Keep same structure, differentiate by file extension
- Ensure proper MIME types for PDF serving

## Components Excluded from PDF Support
- **Shop Management** - Product images only
- **Video Upload Component** - Video/image specific functionality