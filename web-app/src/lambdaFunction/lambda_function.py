import os
import json
import boto3
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from io import BytesIO
import base64
from datetime import datetime
from PIL import Image
from reportlab.lib.utils import ImageReader

def lambda_handler(event, context):
    # Common CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',  # Allow localhost during development
        'Access-Control-Allow-Headers': '*',  # Allow all headers
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Max-Age': '3600'
    }

    # Handle OPTIONS request (preflight)
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 204,  # No content for preflight
            'headers': cors_headers,
            'body': ''
        }
    
    try:
        # Parse the incoming request body
        print("Received event:", event)  # Debug log
        body = json.loads(event['body'])
        report_type = body.get('type', 'vsm')  # Default to 'vsm' if not specified
        images = body.get('images', [])
        print(f"Report type: {report_type}")  # Debug log
        print(f"Number of images to process: {len(images)}")  # Debug log
        
        # Create PDF buffer
        buffer = BytesIO()
        
        # Handle different report types
        if report_type == 'vsm':
            # VSM report logic - already implemented
            pdf = create_vsm_report(buffer, images)
        elif report_type == 'standard':
            # Standard report logic
            pdf = create_standard_report(buffer, images)
        elif report_type == 'chart':
            # Chart report logic
            pdf = create_chart_report(buffer, images)
        elif report_type == 'data_chart':
            # Data chart report logic
            pdf = create_data_chart_report(buffer, images)
        elif report_type == 'project':
            # Project report logic - combines multiple reports
            pdf = create_project_report(buffer, images, body.get('reports', []))
        else:
            raise ValueError(f"Unsupported report type: {report_type}")
        
        # Upload to S3
        s3 = boto3.client('s3')
        bucket_name = os.environ.get('S3_BUCKET')
        print(f"Using S3 bucket: {bucket_name}")  # Debug log
        
        if not bucket_name:
            raise ValueError("S3_BUCKET environment variable is not set")
        
        file_name = f'pdf/{report_type}-report-{datetime.now().strftime("%Y%m%d-%H%M%S")}.pdf'
        print(f"Attempting to upload to: {bucket_name}/{file_name}")  # Debug log
        
        s3.put_object(
            Bucket=bucket_name,
            Key=file_name,
            Body=buffer.getvalue(),
            ContentType='application/pdf'
        )
        
        # Generate presigned URL
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': file_name},
            ExpiresIn=3600
        )
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'url': url})
        }
        
    except Exception as e:
        import traceback
        print(f"Error: {str(e)}")
        print("Traceback:", traceback.format_exc())  # Detailed error trace
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': str(e),
                'trace': traceback.format_exc()
            })
        }

def create_vsm_report(buffer, images):
    pdf = canvas.Canvas(buffer)
    
    for img_data in images:
        if img_data['orientation'] == 'landscape':
            pagesize = landscape(A4)
        else:
            pagesize = A4
        
        pdf.setPageSize(pagesize)
        page_width, page_height = pagesize
        
        image_bytes = base64.b64decode(img_data['imageData'])
        img_buffer = BytesIO(image_bytes)
        pil_image = Image.open(img_buffer)
        
        pdf.drawImage(ImageReader(pil_image), 20, 20, 
                    width=page_width-40, height=page_height-40, 
                    preserveAspectRatio=True)
        pdf.showPage()
    
    pdf.save()
    return pdf

def create_standard_report(buffer, images):
    pdf = canvas.Canvas(buffer)
    
    for img_data in images:
        pagesize = A4  # Standard reports are always portrait
        pdf.setPageSize(pagesize)
        page_width, page_height = pagesize
        
        image_bytes = base64.b64decode(img_data['imageData'])
        img_buffer = BytesIO(image_bytes)
        pil_image = Image.open(img_buffer)
        
        pdf.drawImage(ImageReader(pil_image), 20, 20, 
                    width=page_width-40, height=page_height-40, 
                    preserveAspectRatio=True)
        pdf.showPage()
    
    pdf.save()
    return pdf

def create_chart_report(buffer, images):
    pdf = canvas.Canvas(buffer)
    
    for img_data in images:
        # Charts might need landscape for better visibility
        pagesize = landscape(A4) if img_data.get('orientation') == 'landscape' else A4
        pdf.setPageSize(pagesize)
        page_width, page_height = pagesize
        
        image_bytes = base64.b64decode(img_data['imageData'])
        img_buffer = BytesIO(image_bytes)
        pil_image = Image.open(img_buffer)
        
        pdf.drawImage(ImageReader(pil_image), 20, 20, 
                    width=page_width-40, height=page_height-40, 
                    preserveAspectRatio=True)
        pdf.showPage()
    
    pdf.save()
    return pdf

def create_data_chart_report(buffer, images):
    # Similar to chart report but might have different layout requirements
    return create_chart_report(buffer, images)

def create_project_report(buffer, images, reports):
    pdf = canvas.Canvas(buffer)
    
    # First add the project overview/summary
    for img_data in images:
        pagesize = A4
        pdf.setPageSize(pagesize)
        page_width, page_height = pagesize
        
        image_bytes = base64.b64decode(img_data['imageData'])
        img_buffer = BytesIO(image_bytes)
        pil_image = Image.open(img_buffer)
        
        pdf.drawImage(ImageReader(pil_image), 20, 20, 
                    width=page_width-40, height=page_height-40, 
                    preserveAspectRatio=True)
        pdf.showPage()
    
    # Then process each report's images
    for report in reports:
        report_images = report.get('images', [])
        report_type = report.get('type', 'standard')
        
        if report_type == 'vsm':
            create_vsm_report(buffer, report_images)
        elif report_type == 'chart':
            create_chart_report(buffer, report_images)
        elif report_type == 'data_chart':
            create_data_chart_report(buffer, report_images)
        else:
            create_standard_report(buffer, report_images)
    
    pdf.save()
    return pdf