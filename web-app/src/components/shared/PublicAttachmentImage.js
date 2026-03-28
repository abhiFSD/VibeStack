import React, { useState, useEffect, useRef } from 'react';

const PublicAttachmentImage = ({ path, style, onLoad }) => {
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
        
        const fetchPublicImage = async () => {
            if (!path) {
                setLoading(false);
                if (onLoad) onLoad(null);
                return;
            }

            try {
                console.log(`PublicAttachmentImage: Loading ${path} for public view (attempt ${retryCount + 1})`);
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
                        console.log(`PublicAttachmentImage: Successfully loaded direct URL ${path}`);
                        if (onLoad) onLoad(path);
                    }
                    return;
                }
                
                // For S3 keys, try different public URL approaches
                const publicUrls = [
                    // Method 1: Direct public S3 URL with key as-is
                    `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${path}`,
                    // Method 2: Ensure public/ prefix
                    `https://lf-api-storage-2b19a34bccf91-prod.s3.us-west-2.amazonaws.com/${path.startsWith('public/') ? path : `public/${path}`}`,
                    // Method 3: CloudFront distribution (if available)
                    `https://d3example.cloudfront.net/${path.replace(/^public\//, '')}`,
                ];

                let successUrl = null;
                
                // Try each URL approach
                for (const testUrl of publicUrls) {
                    try {
                        console.log(`PublicAttachmentImage: Trying URL: ${testUrl}`);
                        
                        if (isPDF) {
                            // For PDFs, just test if URL is accessible
                            const response = await fetch(testUrl, { method: 'HEAD' });
                            if (response.ok) {
                                successUrl = testUrl;
                                break;
                            }
                        } else {
                            // For images, pre-load to ensure it works
                            const img = new Image();
                            
                            const loadPromise = new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = reject;
                                setTimeout(reject, 5000); // 5 second timeout
                            });
                            
                            img.src = testUrl;
                            
                            // Wait for image to load
                            await loadPromise;
                            
                            successUrl = testUrl;
                            break;
                        }
                    } catch (urlError) {
                        console.log(`PublicAttachmentImage: Failed URL ${testUrl}:`, urlError.message);
                        continue;
                    }
                }

                if (successUrl && mounted.current) {
                    if (isPDF) {
                        setImageUrl(successUrl);
                    } else {
                        // For images, we already have the pre-loaded image
                        setImageUrl(successUrl);
                    }
                    setLoading(false);
                    console.log(`PublicAttachmentImage: Successfully loaded ${path} from ${successUrl}`);
                    if (onLoad) onLoad(path);
                } else {
                    throw new Error('All public URL methods failed');
                }

            } catch (error) {
                console.error(`PublicAttachmentImage: Error fetching public image (${path}):`, error);
                
                // Retry logic
                if (retryCount < maxRetries && mounted.current) {
                    console.log(`PublicAttachmentImage: Retrying ${path} (${retryCount + 1}/${maxRetries})`);
                    setRetryCount(prev => prev + 1);
                    // Wait before retrying
                    setTimeout(fetchPublicImage, 2000);
                } else if (mounted.current) {
                    setError(true);
                    setLoading(false);
                    if (onLoad) onLoad(path, error);
                }
            }
        };

        fetchPublicImage();

        return () => {
            mounted.current = false;
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
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#ffe6e6',
                color: '#666',
                fontSize: '10px',
                textAlign: 'center',
                padding: '5px'
            }}>
                <span>⚠️</span>
                <span>Image unavailable in public view</span>
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
                console.error(`Failed to load public image: ${path}`);
                setError(true);
                if (onLoad) onLoad(path, new Error('Image load failed'));
            }}
        />
    );
};

export default PublicAttachmentImage;