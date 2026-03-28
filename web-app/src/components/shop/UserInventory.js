import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { useOrganization } from '../../contexts/OrganizationContext';
import { getUserPurchases } from '../../utils/shop';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { Storage } from 'aws-amplify';
import './UserInventory.css';

const UserInventory = () => {
  const { activeOrganization } = useOrganization();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemImages, setItemImages] = useState({});

  useEffect(() => {
    if (activeOrganization?.id) {
      loadPurchases();
    }
  }, [activeOrganization]);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      console.log('Loading user purchases for organization:', activeOrganization.id);
      const userPurchases = await getUserPurchases(activeOrganization.id);
      console.log('Received user purchases:', userPurchases.length, userPurchases);
      
      // Only show delivered items in inventory
      const deliveredPurchases = userPurchases.filter(purchase => purchase.status === 'DELIVERED');
      console.log('Filtered delivered purchases:', deliveredPurchases.length, deliveredPurchases);
      setPurchases(deliveredPurchases);

      // Load S3 image URLs for all items with S3 keys
      const imagePromises = deliveredPurchases
        .filter(purchase => purchase.shopItem?.image && purchase.shopItem.image.startsWith('shop-items/'))
        .map(async purchase => {
          try {
            const imageUrl = await Storage.get(purchase.shopItem.image, { 
              level: 'public',
              expires: 60 * 60 // 1 hour
            });
            return { id: purchase.shopItem.id, url: imageUrl };
          } catch (error) {
            console.error(`Error loading image for item ${purchase.shopItem.id}:`, error);
            return { id: purchase.shopItem.id, url: null };
          }
        });
      
      const resolvedImages = await Promise.all(imagePromises);
      
      // Create a mapping of item IDs to image URLs
      const imageMap = resolvedImages.reduce((map, item) => {
        if (item.url) {
          map[item.id] = item.url;
        }
        return map;
      }, {});
      
      setItemImages(imageMap);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get the correct image URL
  const getItemImageUrl = (shopItem) => {
    if (!shopItem?.image) return null;
    
    // If it's an S3 image and we have a resolved URL in our state
    if (shopItem.image.startsWith('shop-items/') && itemImages[shopItem.id]) {
      return itemImages[shopItem.id];
    }
    
    // Otherwise use the direct URL (for external images)
    return shopItem.image;
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4 mt-5">
      <h2 className="mb-4">My Inventory</h2>
      {purchases.length === 0 ? (
        <div className="text-center mt-5">
          <h4>No items in your inventory yet</h4>
          <p>Visit the shop to purchase items with your coins!</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {purchases.map((purchase) => (
            <Col key={purchase.id}>
              <Card className="inventory-item-card">
                {purchase.shopItem && getItemImageUrl(purchase.shopItem) && (
                  <Card.Img
                    variant="top"
                    src={getItemImageUrl(purchase.shopItem)}
                    alt={purchase.shopItem.name}
                  />
                )}
                <Card.Body>
                  <Card.Title>{purchase.shopItem?.name}</Card.Title>
                  <Card.Text>{purchase.shopItem?.description}</Card.Text>
                  
                  {purchase.deliveryNotes && (
                    <div className="mb-3">
                      <strong className="text-primary">Delivery Notes:</strong>
                      <div className="mt-1 p-2 bg-light rounded">
                        <small>{purchase.deliveryNotes}</small>
                      </div>
                    </div>
                  )}
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <Badge bg="info">{purchase.shopItem?.type}</Badge>
                    <small className="text-muted">
                      <FontAwesomeIcon icon={faClock} className="me-1" />
                      {formatDate(purchase.purchaseDate)}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default UserInventory; 