#!/usr/bin/env python3
"""
Simple CORS proxy server to handle the CORS issue
Run this on port 3001 and point your frontend to it instead of port 8000
"""

import asyncio
import json
from aiohttp import web, ClientSession

async def proxy_handler(request):
    """Proxy requests to the actual FastAPI server"""
    
    # Handle OPTIONS requests first
    if request.method == 'OPTIONS':
        response = web.Response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = '*'
        response.headers['Access-Control-Max-Age'] = '3600'
        return response
    
    # Extract the method, headers, and body
    method = request.method
    headers = dict(request.headers)
    
    # Remove problematic headers
    headers.pop('Host', None)
    headers.pop('Origin', None)
    
    # Target URL (your FastAPI server)
    target_url = f"http://localhost:8000{request.path_qs}"
    
    print(f"Proxying {method} request to: {target_url}")
    
    # Make the request to the actual server
    async with ClientSession() as session:
        try:
            if method in ['POST', 'PUT', 'PATCH']:
                body = await request.read()
                async with session.request(method, target_url, headers=headers, data=body) as resp:
                    response_body = await resp.read()
                    response = web.Response(
                        body=response_body,
                        status=resp.status,
                        content_type=resp.content_type
                    )
            else:
                async with session.request(method, target_url, headers=headers) as resp:
                    response_body = await resp.read()
                    response = web.Response(
                        body=response_body,
                        status=resp.status,
                        content_type=resp.content_type
                    )
            
            # Add CORS headers to all responses
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = '*'
            
            return response
            
        except Exception as e:
            print(f"Error proxying request: {e}")
            response = web.Response(
                text=f"Proxy error: {str(e)}",
                status=500
            )
            response.headers['Access-Control-Allow-Origin'] = '*'
            return response

def create_app():
    """Create the proxy app with CORS support"""
    app = web.Application()
    
    # Add single route to handle all requests
    app.router.add_route('*', '/{path:.*}', proxy_handler)
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("Starting CORS proxy server on http://localhost:3001")
    print("Point your frontend to http://localhost:3001 instead of http://localhost:8000")
    print("This will proxy all requests to your FastAPI server with proper CORS headers")
    
    web.run_app(app, host='localhost', port=3001)