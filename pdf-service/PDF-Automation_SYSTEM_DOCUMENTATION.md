# LF-PRO-PDF System Documentation

## Overview

LF-PRO-PDF is a FastAPI-based web service that generates optimized PDF documents from web pages with specialized handling for landscape and portrait layouts. The system is designed to convert web content into high-quality PDFs while preserving layout integrity and handling complex page structures.

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI       │    │   AWS S3        │
│   Application   │───▶│   Web Service   │───▶│   Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Selenium      │
                       │   Chrome        │
                       │   PDF Engine    │
                       └─────────────────┘
```

### Core Components

1. **FastAPI Web Service** (`app.py`)
   - RESTful API endpoints for PDF generation
   - User and job management
   - S3 integration for file storage
   - Background task processing

2. **PDF Generation Engine** (`layout_specific_pdf_generator.py`)
   - Selenium-based web page rendering
   - Chrome headless browser automation
   - Layout-specific CSS injection
   - Page break optimization

3. **Storage Layer**
   - AWS S3 bucket for PDF storage
   - Pre-signed URL generation for secure access
   - Organized file structure by user and job

4. **Test and Debug Files**
   - Various testing utilities for debugging PDF generation
   - Image loading tests
   - DOM transformation tests

## Data Flow

### Single PDF Generation Flow

```
1. Client Request ───▶ POST /generate-pdf
2. Request Validation
3. User File Cleanup ───▶ Delete existing user files from S3
4. PDF Generation ───▶ Selenium Chrome automation
   ├─ Page loading and waiting
   ├─ Layout detection (.landscape/.portrait)
   ├─ CSS injection for page breaks
   └─ PDF generation via Chrome DevTools
5. S3 Upload ───▶ Upload PDF with organized path structure
6. Pre-signed URL ───▶ Generate secure download link
7. Response ───▶ Return PDF URL to client
```

### Batch PDF Generation Flow

```
1. Client Request ───▶ POST /batch-generate-pdf
2. Request Validation
3. User File Cleanup ───▶ Delete existing user files from S3
4. Parallel Processing ───▶ asyncio.gather() for concurrent PDF generation
   ├─ Multiple URLs processed simultaneously
   └─ Individual PDF files created
5. Optional Merging ───▶ Combine PDFs using PyPDF2 (if merge_pdfs=true)
6. S3 Upload ───▶ Upload individual and/or merged PDFs
7. Cleanup ───▶ Remove temporary local files
8. Response ───▶ Return URLs for all generated PDFs
```

## API Endpoints

### Core Endpoints

| Endpoint | Method | Purpose | Parameters |
|----------|---------|---------|------------|
| `/` | GET | Health check | None |
| `/generate-pdf` | POST | Generate single PDF | url, wait_time, user_id, job_id |
| `/batch-generate-pdf` | POST | Generate multiple PDFs | urls[], wait_time, user_id, job_id, merge_pdfs |
| `/delete-user-pdfs` | POST | Delete user files | user_id |
| `/debug/routes` | GET | List all routes | None |

### Request/Response Models

#### PDFRequest
```json
{
  "url": "https://example.com/page",
  "wait_time": 30,
  "user_id": "user123",
  "job_id": "job456"
}
```

#### BatchPDFRequest
```json
{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "wait_time": 30,
  "user_id": "user123", 
  "job_id": "job456",
  "merge_pdfs": true
}
```

## PDF Generation Process

### Layout Detection and Processing

The system specifically looks for CSS classes that indicate layout orientation:

- **`.landscape`** - Content optimized for landscape orientation
- **`.portrait`** - Content optimized for portrait orientation
- **`.capture-card`** - Individual content cards within portrait sections

### CSS Injection Strategy

The system injects specialized CSS to handle:

1. **Page Size and Orientation**
   ```css
   @page landscape_page { size: A4 landscape; margin: 8mm; }
   @page portrait_page { size: A4 portrait; margin: 8mm; }
   ```

2. **Page Break Avoidance**
   ```css
   .landscape .card,
   .portrait .capture-card {
     page-break-inside: avoid !important;
     break-inside: avoid !important;
   }
   ```

3. **Content Grouping**
   - Consecutive `.capture-card` elements are grouped to prevent splitting
   - Dynamic page break logic based on element height calculations

### Browser Automation Features

- **Headless Chrome** with optimized flags for PDF generation
- **Smart Waiting** for page load, images, and dynamic content
- **Scroll-through** to trigger lazy-loaded content
- **Image Loading Detection** with retry mechanisms
- **CSS Background Rendering** enabled for complete visual fidelity

## Storage Architecture

### S3 File Organization

```
S3_BUCKET/
├── PDF/
│   └── {user_id}/
│       └── {job_id}/
│           ├── {uuid1}.pdf
│           ├── {uuid2}.pdf
│           └── combined_{job_id}_{uuid}.pdf (if merged)
```

### Security Features

- **Pre-signed URLs** with 1-hour expiration (configurable)
- **Automatic cleanup** of user files before new job execution
- **User-level file management** for complete data control

## Dependencies

### Core Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.104.1 | Web framework |
| `uvicorn` | 0.24.0 | ASGI server |
| `selenium` | 4.15.2 | Browser automation |
| `PyPDF2` | 3.0.1 | PDF manipulation |
| `boto3` | 1.28.64 | AWS integration |
| `python-dotenv` | 1.0.0 | Environment configuration |
| `aiofiles` | 23.2.1 | Async file operations |
| `python-multipart` | 0.0.6 | Form data handling |

### System Requirements

- **Python 3.6+**
- **Google Chrome** browser
- **ChromeDriver** compatible with Chrome version
- **AWS credentials** and S3 bucket access

## Configuration

### Environment Variables

Required environment variables in `.env` file:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key  
AWS_REGION=your_region
S3_BUCKET=your_bucket_name
```

### Chrome Configuration

The system configures Chrome with specific options:

```python
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu") 
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--window-size=1920,2000")
```

## Error Handling and Logging

### Logging Strategy

- **Structured logging** with timestamps and log levels
- **Operation tracking** from request to response
- **S3 operation logging** for debugging upload/cleanup issues
- **PDF generation tracking** with detailed Chrome automation steps

### Error Recovery

- **Graceful degradation** when layout-specific elements aren't found
- **Continuation on cleanup failures** to not block PDF generation
- **Individual failure handling** in batch processing (partial success allowed)

## Performance Characteristics

### Concurrent Processing

- **Parallel PDF generation** in batch mode using `asyncio.gather()`
- **Independent processing** allows partial success in batch operations
- **Resource cleanup** after each operation to prevent memory leaks

### Optimization Features

- **Smart waiting strategies** to minimize generation time while ensuring content loading
- **Temporary file management** with automatic cleanup
- **S3 upload optimization** with proper content types and metadata

## Testing and Debugging

### Available Test Files

- `simple_pdf_test.py` - Basic PDF generation testing
- `comprehensive_image_test.py` - Image loading verification  
- `test_dom_transformation.py` - DOM manipulation testing
- `test_s3_access.py` - AWS S3 integration testing
- `debug_pdf_generator.py` - PDF generation debugging utilities

### Debugging Features

- **Screenshot capture** before PDF generation
- **DOM transformation tracking** with before/after comparisons
- **Image loading verification** with detailed logging
- **CSS injection verification** through browser console

## Security Considerations

### Access Control

- **Pre-signed URLs** prevent direct S3 access without authentication
- **Time-limited access** through URL expiration
- **User isolation** through folder structure

### CORS Handling

- **Manual CORS middleware** for cross-origin requests
- **Preflight request handling** for complex requests
- **Wildcard origin support** for development (should be restricted in production)

### Data Privacy

- **Automatic file cleanup** ensures data doesn't persist unnecessarily
- **User-controlled deletion** through dedicated endpoint
- **No persistent session data** stored on server

## Deployment Considerations

### Production Readiness

- **Environment-based configuration** through .env files
- **Health check endpoint** for monitoring
- **Structured error responses** for client handling

### Scaling Considerations

- **Stateless design** allows horizontal scaling
- **External storage** (S3) enables multi-instance deployment
- **Background task support** for handling long-running operations

### Monitoring Points

- **PDF generation success rates**
- **S3 upload/download metrics** 
- **Chrome process lifecycle**
- **Memory usage** during batch operations
- **Response time metrics** per endpoint

## Future Enhancement Areas

1. **Docker containerization** for easier deployment
2. **Queue-based processing** for better resource management
3. **Webhook support** for asynchronous completion notifications
4. **PDF template customization** options
5. **Rate limiting** and request throttling
6. **Metrics and monitoring** integration
7. **Multi-format output** support (PNG, JPEG)
8. **Advanced page break** customization options