import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { useOrganization } from '../../contexts/OrganizationContext';
import { getShopItems, getUserPurchases, purchaseItem } from '../../utils/shop';
import { getUserCoins } from '../../utils/awardDefinitions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faCheck, faShoppingCart, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Auth, Storage } from 'aws-amplify';
import './UserShop.css';

const UserShop = () => {
  const { activeOrganization } = useOrganization();
  const [shopItems, setShopItems] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [itemImages, setItemImages] = useState({});
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (activeOrganization?.id) {
      loadShopData();
    }
  }, [activeOrganization]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const user = await Auth.currentAuthenticatedUser();
      const [items, purchases, coins] = await Promise.all([
        getShopItems(activeOrganization.id),
        getUserPurchases(activeOrganization.id),
        getUserCoins(user.attributes.sub, activeOrganization.id)
      ]);
      setShopItems(items);
      setUserPurchases(purchases);
      setUserCoins(coins);
      
      // Load S3 image URLs for all items with S3 keys
      const imagePromises = items
        .filter(item => item.image && item.image.startsWith('shop-items/'))
        .map(async item => {
          try {
            const imageUrl = await Storage.get(item.image, { 
              level: 'public',
              expires: 60 * 60 // 1 hour
            });
            return { id: item.id, url: imageUrl };
          } catch (error) {
            console.error(`Error loading image for item ${item.id}:`, error);
            return { id: item.id, url: null };
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
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (item) => {
    setSelectedItem(item);
    setPurchaseError('');
    setShowPurchaseModal(true);
  };

  const handlePurchaseConfirm = async () => {
    try {
      setIsPurchasing(true);
      setPurchaseError('');
      const result = await purchaseItem(selectedItem.id, activeOrganization.id);
      if (result.success) {
        await loadShopData(); // Refresh the data
        setShowPurchaseModal(false);
        // Show success message
        setSuccessMessage(`Purchase request submitted for ${selectedItem.name}! You will receive an email confirmation and another notification once your request is reviewed by organization administrators.`);
      }
    } catch (error) {
      setPurchaseError(error.message || 'Failed to submit purchase request');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Get the number of times a user has purchased an item (only count delivered items)
  const getItemPurchaseCount = (itemId) => {
    return userPurchases.filter(purchase => 
      purchase.shopItemID === itemId && purchase.status === 'DELIVERED'
    ).length;
  };

  // Helper function to get the correct image URL
  const getItemImageUrl = (item) => {
    if (!item.image) return null;
    
    // If it's an S3 image and we have a resolved URL in our state
    if (item.image.startsWith('shop-items/') && itemImages[item.id]) {
      return itemImages[item.id];
    }
    
    // Otherwise use the direct URL (for external images)
    return item.image;
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
    <Container className="py-4">
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Shop</h2>
        <div className="user-coins">
          <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
          {userCoins} coins
        </div>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4">
        {shopItems.map((item) => (
          <Col key={item.id}>
            <Card className="h-100 shop-item-card">
              {getItemImageUrl(item) && (
                <Card.Img variant="top" src={getItemImageUrl(item)} alt={item.name} />
              )}
              <Card.Body>
                <Card.Title className="d-flex justify-content-between align-items-center">
                  {item.name}
                  <Badge bg="warning" text="dark">
                    <FontAwesomeIcon icon={faCoins} className="me-1" />
                    {item.price}
                  </Badge>
                </Card.Title>
                <Card.Text>{item.description}</Card.Text>
                <div className="mt-auto">
                  <div className="d-flex justify-content-between align-items-center">
                    <Button
                      variant="primary"
                      onClick={() => handlePurchaseClick(item)}
                      disabled={userCoins < item.price || !item.isEnabled}
                    >
                      <FontAwesomeIcon icon={faShoppingCart} className="me-2" />
                      Request Purchase
                    </Button>
                    {getItemPurchaseCount(item.id) > 0 && (
                      <Badge bg="info" className="ms-2">
                        Owned: {getItemPurchaseCount(item.id)}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showPurchaseModal} onHide={() => !isPurchasing && setShowPurchaseModal(false)}>
        <Modal.Header closeButton={!isPurchasing}>
          <Modal.Title>Confirm Purchase Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <>
              <p>Are you sure you want to request to purchase {selectedItem.name}?</p>
              {getItemPurchaseCount(selectedItem.id) > 0 && (
                <p className="text-info">
                  You already own {getItemPurchaseCount(selectedItem.id)} of this item.
                </p>
              )}
              <p>
                Price: <FontAwesomeIcon icon={faCoins} className="text-warning" /> {selectedItem.price} coins
              </p>
              <p>
                Your current balance: <FontAwesomeIcon icon={faCoins} className="text-warning" /> {userCoins} coins
              </p>
              <div className="alert alert-info">
                <strong>Note:</strong> This will create a purchase request that needs approval from organization administrators. Your coins will only be deducted once the request is approved.
              </div>
              {purchaseError && (
                <div className="alert alert-danger">{purchaseError}</div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowPurchaseModal(false)}
            disabled={isPurchasing}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handlePurchaseConfirm}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Submitting Request...
              </>
            ) : (
              'Submit Purchase Request'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserShop; 