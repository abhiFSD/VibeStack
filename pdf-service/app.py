import os
import asyncio
import tempfile
import uuid
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from dotenv import load_dotenv
import time
import logging
from PyPDF2 import PdfReader, PdfWriter

# Import the PDF generator function
from layout_specific_pdf_generator import generate_pdf_from_url

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("pdf-generator-api")

# Initialize FastAPI app
app = FastAPI(
    title="PDF Generator API",
    description="API for generating PDFs from URLs with layout optimization",
    version="1.0.0"
)

# Manual CORS handling - add after app creation

# Initialize S3 client with the appropriate config
s3_config = Config(
    signature_version='v4',
    retries={
        'max_attempts': 3,
        'mode': 'standard'
    }
)

s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION'),
    config=s3_config
)

# Models for request validation
class PDFRequest(BaseModel):
    url: HttpUrl
    wait_time: Optional[int] = 30
    user_id: str
    job_id: str

class BatchPDFRequest(BaseModel):
    urls: List[HttpUrl]
    wait_time: Optional[int] = 30
    user_id: str
    job_id: str
    merge_pdfs: Optional[bool] = False

class PDFResponse(BaseModel):
    success: bool
    message: str
    file_url: Optional[str] = None
    job_id: Optional[str] = None

class BatchPDFResponse(BaseModel):
    overall_success: bool
    job_id: str
    results: List[PDFResponse]
    message: str
    combined_pdf_url: Optional[str] = None

# Helper function to create pre-signed URL
def generate_presigned_url(s3_key: str, expiration=3600) -> str:
    """Generate a pre-signed URL for an S3 object"""
    bucket_name = os.getenv('S3_BUCKET')
    try:
        response = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': bucket_name,
                'Key': s3_key
            },
            ExpiresIn=expiration
        )
        logger.info(f"Generated pre-signed URL for {s3_key}, valid for {expiration} seconds")
        return response
    except ClientError as e:
        logger.error(f"Error generating pre-signed URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate pre-signed URL: {str(e)}")

# Helper function to delete old files for the same job
async def cleanup_old_job_files(user_id: str, job_id: str) -> None:
    """Delete all old files for the same user/job combination"""
    bucket_name = os.getenv('S3_BUCKET')
    prefix = f"PDF/{user_id}/{job_id}/"
    
    try:
        # List all objects with the prefix
        logger.info(f"Listing objects with prefix: {prefix}")
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix
        )
        
        # If there are any existing files, delete them
        if 'Contents' in response and len(response['Contents']) > 0:
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            
            if objects_to_delete:
                logger.info(f"Deleting {len(objects_to_delete)} old files for user_id={user_id}, job_id={job_id}")
                for obj in objects_to_delete:
                    logger.debug(f"Will delete: {obj['Key']}")
                    
                s3_client.delete_objects(
                    Bucket=bucket_name,
                    Delete={'Objects': objects_to_delete}
                )
                logger.info(f"Successfully deleted old files for user_id={user_id}, job_id={job_id}")
        else:
            logger.info(f"No existing files found for user_id={user_id}, job_id={job_id}")
    except ClientError as e:
        logger.error(f"Error cleaning up old files: {str(e)}")
        # Continue with the process even if cleanup fails

# Add a function to delete all files for a user
async def cleanup_user_files(user_id: str) -> None:
    """Delete all files for a specific user"""
    bucket_name = os.getenv('S3_BUCKET')
    prefix = f"PDF/{user_id}/"
    
    try:
        # List all objects with the prefix, handling pagination
        continuation_token = None
        total_deleted = 0
        total_files_found = 0
        
        logger.info(f"Starting deep cleanup for user_id={user_id} with prefix={prefix}")
        
        while True:
            list_args = {
                'Bucket': bucket_name,
                'Prefix': prefix
            }
            
            # Add continuation token for pagination if this isn't the first request
            if continuation_token:
                list_args['ContinuationToken'] = continuation_token
                
            # Make the request to list objects
            response = s3_client.list_objects_v2(**list_args)
            
            # Process this batch of objects
            if 'Contents' in response and len(response['Contents']) > 0:
                file_count = len(response['Contents'])
                total_files_found += file_count
                
                logger.info(f"Found {file_count} files to delete in this batch for user_id={user_id}")
                
                # Prepare objects for deletion
                objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
                
                # Log some sample files for debugging
                if objects_to_delete:
                    sample_keys = [obj['Key'] for obj in objects_to_delete[:5]]
                    logger.info(f"Sample files to delete: {sample_keys}...")
                    
                    # Delete objects (maximum 1000 at a time as per S3 limits)
                    for i in range(0, len(objects_to_delete), 1000):
                        batch = objects_to_delete[i:i+1000]
                        batch_size = len(batch)
                        delete_response = s3_client.delete_objects(
                            Bucket=bucket_name,
                            Delete={'Objects': batch}
                        )
                        
                        # Count successful deletions
                        deleted_count = len(delete_response.get('Deleted', []))
                        total_deleted += deleted_count
                        
                        logger.info(f"Deleted {deleted_count}/{batch_size} objects in this batch")
                        
                        # Log any errors
                        if 'Errors' in delete_response and delete_response['Errors']:
                            for error in delete_response['Errors']:
                                logger.error(f"Error deleting {error.get('Key')}: {error.get('Message')}")
            
            # Check if there are more objects to list
            if response.get('IsTruncated', False):
                continuation_token = response.get('NextContinuationToken')
                logger.info(f"More files exist, continuing with token: {continuation_token}")
            else:
                # No more objects, we're done
                break
        
        if total_files_found > 0:
            logger.info(f"Cleanup complete. Found {total_files_found} files, successfully deleted {total_deleted} files for user_id={user_id}")
        else:
            logger.info(f"No existing files found for user_id={user_id}")
            
    except ClientError as e:
        logger.error(f"Error cleaning up user files: {str(e)}")
        # Continue with the process even if cleanup fails

# Helper function to upload to S3
def upload_to_s3(file_path: str, s3_key: str) -> str:
    """Upload a file to S3 bucket and return a pre-signed URL"""
    bucket_name = os.getenv('S3_BUCKET')
    
    try:
        s3_client.upload_file(
            file_path, 
            bucket_name, 
            s3_key,
            ExtraArgs={'ContentType': 'application/pdf', 'ContentDisposition': 'attachment'}
        )
        
        # Generate a pre-signed URL
        presigned_url = generate_presigned_url(s3_key)
        logger.info(f"Successfully uploaded to S3 and generated pre-signed URL")
        return presigned_url
    
    except ClientError as e:
        logger.error(f"S3 upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload to S3: {str(e)}")

# Function to merge multiple PDFs into a single PDF
def merge_pdfs(pdf_paths: List[str], output_path: str) -> bool:
    """Merge multiple PDFs into a single PDF file"""
    try:
        if not pdf_paths:
            logger.error("Cannot merge PDFs: No PDF paths provided")
            return False
            
        pdf_writer = PdfWriter()
        total_pages = 0
        
        # Log the paths of files we're trying to merge
        logger.info(f"Attempting to merge PDFs from paths: {pdf_paths}")
        
        # Add each PDF to the writer
        for i, pdf_path in enumerate(pdf_paths):
            if os.path.exists(pdf_path):
                try:
                    pdf_reader = PdfReader(pdf_path)
                    pages_count = len(pdf_reader.pages)
                    if pages_count == 0:
                        logger.warning(f"PDF {pdf_path} has no pages")
                        continue
                        
                    for page in pdf_reader.pages:
                        pdf_writer.add_page(page)
                    
                    total_pages += pages_count
                    logger.info(f"Added {pages_count} pages from PDF #{i+1}: {pdf_path}")
                except Exception as e:
                    logger.error(f"Error processing PDF #{i+1} {pdf_path}: {str(e)}")
            else:
                logger.warning(f"PDF file not found: {pdf_path}")
        
        if total_pages == 0:
            logger.error("No pages were added to the merged PDF, nothing to write")
            return False
            
        # Write the merged PDF to the output path
        logger.info(f"Writing merged PDF with {total_pages} total pages to {output_path}")
        with open(output_path, 'wb') as output_file:
            pdf_writer.write(output_file)
        
        # Verify the file was created
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            logger.info(f"Successfully merged {len(pdf_paths)} PDFs with {total_pages} pages to {output_path}")
            return True
        else:
            logger.error(f"Merged PDF file was not created or is empty: {output_path}")
            return False
            
    except Exception as e:
        logger.error(f"Error merging PDFs: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

# Function to generate PDF and upload to S3
async def process_pdf_generation(url: str, wait_time: int, user_id: str, job_id: str) -> tuple[PDFResponse, str]:
    """Generate PDF from URL and upload to S3"""
    # Create a unique filename
    unique_id = str(uuid.uuid4())
    pdf_filename = f"{unique_id}.pdf"
    
    # Create a temporary file for the PDF
    with tempfile.TemporaryDirectory() as temp_dir:
        local_pdf_path = os.path.join(temp_dir, pdf_filename)
        
        try:
            # Generate the PDF
            logger.info(f"Generating PDF for URL: {url}")
            generate_pdf_from_url(url, local_pdf_path, wait_time)
            
            # Upload to S3 with the new path structure
            s3_key = f"PDF/{user_id}/{job_id}/{pdf_filename}"
            s3_url = upload_to_s3(local_pdf_path, s3_key)
            
            # Save a copy of the PDF in a new temporary directory
            # This allows the PDF to be available for merging later
            temp_storage_dir = os.path.join(tempfile.gettempdir(), f"pdf_gen_{user_id}_{job_id}")
            os.makedirs(temp_storage_dir, exist_ok=True)
            temp_storage_path = os.path.join(temp_storage_dir, pdf_filename)
            
            import shutil
            shutil.copy2(local_pdf_path, temp_storage_path)
            
            response = PDFResponse(
                success=True,
                message="PDF generated and uploaded successfully",
                file_url=s3_url,
                job_id=job_id
            )
            
            return response, temp_storage_path
            
        except Exception as e:
            logger.error(f"Error processing URL {url}: {str(e)}")
            return PDFResponse(
                success=False,
                message=f"Failed to generate PDF: {str(e)}",
                job_id=job_id
            ), ""

# Routes
@app.get("/")
async def root():
    return {"message": "PDF Generator API is running"}

@app.get("/debug/routes")
async def debug_routes():
    """Debug endpoint to list all routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes.append({"path": route.path, "methods": list(route.methods)})
    return {"routes": routes}



# Manual CORS middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

class ManualCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            response = StarletteResponse()
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response
        
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to all responses
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
        return response

app.add_middleware(ManualCORSMiddleware)

@app.post("/generate-pdf", response_model=PDFResponse)
async def generate_pdf(request: PDFRequest, background_tasks: BackgroundTasks):
    
    try:
        # First delete ALL files for this user (not just for the specific job)
        logger.info(f"Cleaning up all existing files for user_id={request.user_id}")
        await cleanup_user_files(request.user_id)
        
        logger.info(f"Starting PDF generation for user_id={request.user_id}, job_id={request.job_id}")
        
        # Process PDF generation
        result, _ = await process_pdf_generation(
            str(request.url), 
            request.wait_time, 
            request.user_id, 
            request.job_id
        )
        return result
    
    except Exception as e:
        logger.error(f"Error in generate_pdf endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/batch-generate-pdf", response_model=BatchPDFResponse)
async def batch_generate_pdf(request: BatchPDFRequest):
    """Generate PDFs from multiple URLs"""
    # Log merge_pdfs parameter to debug issues
    logger.info(f"Batch PDF generation requested with merge_pdfs={request.merge_pdfs}")
    
    # First delete ALL files for this user (not just for the specific job)
    logger.info(f"Cleaning up all existing files for user_id={request.user_id}")
    await cleanup_user_files(request.user_id)
    
    logger.info(f"Starting batch PDF generation for user_id={request.user_id}, job_id={request.job_id}")
    
    # Start the tasks concurrently
    tasks = []
    for url in request.urls:
        task = process_pdf_generation(
            str(url), 
            request.wait_time, 
            request.user_id, 
            request.job_id
        )
        tasks.append(task)
    
    # Wait for all tasks to complete
    task_results = await asyncio.gather(*tasks)
    
    # Separate the responses and file paths
    results = [result for result, _ in task_results]
    pdf_file_paths = [file_path for _, file_path in task_results if file_path]
    
    logger.info(f"Generated {len(pdf_file_paths)} PDFs successfully, will merge: {request.merge_pdfs}")
    
    # Check if all operations were successful
    overall_success = all(result.success for result in results)
    
    combined_pdf_url = None
    
    # Merge PDFs if requested and if there are successful PDFs
    if request.merge_pdfs and pdf_file_paths:
        try:
            # Create a unique filename for the merged PDF
            merged_filename = f"combined_{request.job_id}_{uuid.uuid4()}.pdf"
            temp_dir = tempfile.gettempdir()
            merged_pdf_path = os.path.join(temp_dir, merged_filename)
            
            # Log before merging
            logger.info(f"Merging {len(pdf_file_paths)} PDFs into {merged_pdf_path}")
            
            # Merge the PDFs
            merge_success = merge_pdfs(pdf_file_paths, merged_pdf_path)
            
            if merge_success:
                # Upload the merged PDF to S3
                s3_key = f"PDF/{request.user_id}/{request.job_id}/{merged_filename}"
                combined_pdf_url = upload_to_s3(merged_pdf_path, s3_key)
                logger.info(f"Successfully created and uploaded combined PDF: {combined_pdf_url}")
            else:
                logger.error("PDF merge operation failed")
            
            # Clean up temporary files
            for filepath in pdf_file_paths:
                try:
                    os.remove(filepath)
                except Exception as e:
                    logger.warning(f"Error removing temporary file {filepath}: {str(e)}")
            
            temp_storage_dir = os.path.join(tempfile.gettempdir(), f"pdf_gen_{request.user_id}_{request.job_id}")
            try:
                import shutil
                shutil.rmtree(temp_storage_dir, ignore_errors=True)
            except Exception as e:
                logger.warning(f"Error removing temp directory {temp_storage_dir}: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error merging PDFs: {str(e)}")
    elif request.merge_pdfs:
        logger.warning("Merge PDFs was requested but no successful PDFs were generated to merge")
    
    response = BatchPDFResponse(
        overall_success=overall_success,
        job_id=request.job_id,
        results=results,
        message="Batch PDF generation completed" + (" with combined PDF" if combined_pdf_url else ""),
        combined_pdf_url=combined_pdf_url
    )
    
    # Log the final response structure
    logger.info(f"Returning response with combined_pdf_url: {combined_pdf_url}")
    
    return response

# Add new endpoint to delete all PDFs for a user
class UserRequest(BaseModel):
    user_id: str

class DeleteResponse(BaseModel):
    success: bool
    message: str

@app.post("/delete-user-pdfs", response_model=DeleteResponse)
async def delete_user_pdfs(request: UserRequest):
    """Delete all PDFs associated with a specific user"""
    try:
        logger.info(f"Received request to delete all PDFs for user_id={request.user_id}")
        await cleanup_user_files(request.user_id)
        return DeleteResponse(
            success=True,
            message=f"Successfully deleted all PDFs for user: {request.user_id}"
        )
    except Exception as e:
        logger.error(f"Error deleting user PDFs: {str(e)}")
        return DeleteResponse(
            success=False,
            message=f"Error deleting PDFs: {str(e)}"
        )

# CORS is handled by ManualCORSMiddleware above

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 