import React, { useState, useEffect, useRef } from 'react';
import { DataStore } from 'aws-amplify';
import { Storage } from 'aws-amplify';
import { ActionItems } from '../models';
import { Card, Button } from 'react-bootstrap';
import Spinner from 'react-bootstrap/Spinner';
import { generatePdfViaApi } from '../utils/apiPdfGenerator';

function ActionItemCard() {
    const [actionItem, setActionItem] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isImageLoaded, setImageLoaded] = useState(false);

    const reportRef = useRef(null);
    const actionItemId = "c8988078-2fd3-45eb-8892-86190200b743";

    useEffect(() => {
        const fetchActionItem = async () => {
            try {
                const fetchedItem = await DataStore.query(ActionItems, actionItemId);
                setActionItem(fetchedItem);

                if (fetchedItem?.attachments?.length) {
                    const signedUrl = await Storage.get(fetchedItem.attachments[0]);
                    fetchImageAsBlob(signedUrl);
                }

            } catch (error) {
                console.error("Error fetching action item:", error);
            }
        };

        const fetchImageAsBlob = async (url) => {
            try {
                const response = await fetch(url, { method: 'GET', mode: 'cors' });
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);
                setImageUrl(objectURL);
            } catch (error) {
                console.error("Error fetching image as blob:", error);
            }
        };

        fetchActionItem();
    }, [actionItemId]);
    
    const generatePDF = async () => {
        console.log('PDF generation initiated.');
        setIsGeneratingPDF(true);
        
        try {
            // Use the API-based PDF generation
            const currentUrl = window.location.href;
            await generatePdfViaApi(currentUrl);
            console.log('PDF generation via API initiated successfully');
        } catch (error) {
            console.error('Error during PDF generation:', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    if (!actionItem) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spinner animation="border" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );

    return (
        <div ref={reportRef}>
            <Card className="my-4">
                <Card.Header>
                    <Card.Title>Action Item</Card.Title>
                </Card.Header>
                <Card.Body>
                    <Card.Title>{actionItem.title}</Card.Title>
                    <Card.Text>{actionItem.description}</Card.Text>
                    {imageUrl && (
                        <div className="my-3">
                            <img 
                                src={imageUrl} 
                                alt="Attachment" 
                                style={{ maxWidth: '100%' }} 
                                onLoad={() => setImageLoaded(true)}
                            />
                        </div>
                    )}
                    <div>
                        <strong>Due Date:</strong> {actionItem.duedate}
                    </div>
                    <div>
                        <strong>Status:</strong> {actionItem.status}
                    </div>
                </Card.Body>
                <Card.Footer>
                    <Button 
                        onClick={generatePDF} 
                        disabled={isGeneratingPDF || !isImageLoaded}
                    >
                        {isGeneratingPDF ? "Generating PDF..." : "Export Report as PDF"}
                    </Button>
                </Card.Footer>
            </Card>
        </div>
    );
}

export default ActionItemCard;
