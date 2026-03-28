import React, { useState, useEffect, useRef } from 'react';
import { Storage } from 'aws-amplify';
import { Auth } from 'aws-amplify';

const AttachmentImage = ({ path, style, onLoad }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const mounted = useRef(true);
    const maxRetries = 3;
    
    // Check if the file is a PDF
    const isPDF = path && typeof path === 'string' && path.toLowerCase().endsWith('.pdf');
    
    // PDF icon component
    const PDFIcon = () => (
        <div style={{
            ...style,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f8f9fa',
            cursor: 'pointer',
            position: 'relative'
        }}
        onClick={() => window.open(imageUrl, '_blank')}
        >
            <svg width="40" height="50" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0H40L60 20V70C60 75.5228 55.5228 80 50 80H10C4.47715 80 0 75.5228 0 70V10C0 4.47715 4.47715 0 10 0Z" fill="#E74C3C"/>
                <path d="M40 0L60 20H50C44.4772 20 40 15.5228 40 10V0Z" fill="#C0392B"/>
                <text x="30" y="50" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="white">PDF</text>
            </svg>
            <div style={{ 
                fontSize: '10px', 
                marginTop: '5px', 
                textAlign: 'center',
                wordBreak: 'break-all',
                maxWidth: '100%'
            }}>
                {path.split('/').pop()}
            </div>
        </div>
    );

    useEffect(() => {
        mounted.current = true;
        
        const fetchImage = async () => {
            if (!path) {
                setLoading(false);
                if (onLoad) onLoad(null);
                return;
            }

            try {
                console.log(`AttachmentImage: Loading ${path} (attempt ${retryCount + 1})`);
                setLoading(true);
                
                // Handle direct HTTP URLs (for sample data)
                if (typeof path === 'string' && path.startsWith('http')) {
                    // Pre-load the image before displaying
                    const img = new Image();
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                    
                    img.src = path;
                    
                    // Wait for image to load
                    await loadPromise;
                    
                    if (mounted.current) {
                        setImageUrl(path);
                        setLoading(false);
                        console.log(`AttachmentImage: Successfully loaded direct URL ${path}`);
                        if (onLoad) onLoad(path);
                    }
                    return;
                }
                
                // Original S3 handling logic
                let signedUrl;
                
                // Check if we're in a public PDF view - skip auth entirely
                if (window.location.pathname.includes('/report_pdf/')) {
                    console.log('Public PDF view detected, using direct S3 URL:', path);
                    const cleanKey = path.startsWith('public/') ? path : `public/${path}`;
                    signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
                } else {
                    try {
                        // Try authenticated approach for authenticated views
                        const credentials = await Auth.currentCredentials();
                        signedUrl = await Storage.get(path, {
                            level: 'public',
                            expires: 60 * 60 * 24,
                        });
                    } catch (authError) {
                        console.log('Auth failed, trying public S3 URL fallback:', authError);
                        // Fallback for public PDF reports - direct S3 public URL
                        const cleanKey = path.startsWith('public/') ? path : `public/${path}`;
                        signedUrl = `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${cleanKey}`;
                    }
                }

                if (isPDF) {
                    // For PDFs, just set the signed URL
                    if (mounted.current) {
                        setImageUrl(signedUrl);
                        setLoading(false);
                        console.log(`AttachmentImage: Successfully loaded PDF ${path}`);
                        if (onLoad) onLoad(path);
                    }
                } else {
                    // Fetch the signed URL as a blob for images
                    const response = await fetch(signedUrl, {
                        method: 'GET',
                        mode: 'cors',
                        cache: 'no-store' // Prevent caching issues
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    
                    // Pre-load the image before displaying
                    const img = new Image();
                    
                    const loadPromise = new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                    
                    img.src = URL.createObjectURL(blob);
                    
                    // Wait for image to load
                    await loadPromise;
                    
                    if (mounted.current) {
                        setImageUrl(img.src);
                        setLoading(false);
                        console.log(`AttachmentImage: Successfully loaded ${path}`);
                        if (onLoad) onLoad(path);
                    }
                }
            } catch (error) {
                console.error(`AttachmentImage: Error fetching image (${path}):`, error);
                
                // Retry logic
                if (retryCount < maxRetries && mounted.current) {
                    console.log(`AttachmentImage: Retrying ${path} (${retryCount + 1}/${maxRetries})`);
                    setRetryCount(prev => prev + 1);
                    // Wait before retrying
                    setTimeout(fetchImage, 1000);
                } else if (mounted.current) {
                    setError(true);
                    setLoading(false);
                    if (onLoad) onLoad(path, error);
                }
            }
        };

        fetchImage();

        return () => {
            mounted.current = false;
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [path, retryCount]);

    if (loading) {
        return (
            <div style={{
                ...style,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#f0f0f0',
                color: '#666',
                fontSize: '12px'
            }}>
                Loading... {retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : ''}
            </div>
        );
    }

    if (error || !imageUrl || !path) {
        return (
            <div style={{
                ...style,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#ffe6e6',
                color: '#666',
                fontSize: '12px'
            }}>
                Failed to load image
            </div>
        );
    }

    return isPDF ? (
        <PDFIcon />
    ) : (
        <img
            src={imageUrl}
            alt="Attachment"
            style={style}
            onError={() => {
                console.error(`Failed to load image: ${path}`);
                setError(true);
                if (onLoad) onLoad(path, new Error('Image load failed'));
            }}
        />
    );
};

export default AttachmentImage;
