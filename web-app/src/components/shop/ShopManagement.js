import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Badge,
  Image,
  Spinner,
  Nav
} from 'react-bootstrap';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  getShopItems,
  createShopItem,
  updateShopItem,
  deleteShopItem
} from '../../utils/shop';
import { SHOP_ITEM_TYPES } from '../../utils/shopDefaults';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faCoins,
  faToggleOn,
  faToggleOff,
  faUpload,
  faTimes,
  faClipboardList,
  faStore
} from '@fortawesome/free-solid-svg-icons';
import { Storage } from 'aws-amplify';
import { compressImage } from '../../utils/imageUtils';
import PurchaseRequestsManagement from './PurchaseRequestsManagement';
import './ShopManagement.css';

const ShopManagement = () => {
  const { activeOrganization } = useOrganization();
  const [shopItems, setShopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    type: SHOP_ITEM_TYPES.PRODUCT,
    isEnabled: true
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    if (activeOrganization?.id) {
      loadShopItems();
    }
  }, [activeOrganization]);

  const loadShopItems = async () => {
    try {
      setLoading(true);
      const items = await getShopItems(activeOrganization.id);
      console.log('Fetched shop items:', items);
      console.log('Items with isEnabled=false:', items.filter(item => !item.isEnabled));
      setShopItems(items);
    } catch (error) {
      console.error('Error loading shop items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = async (item = null) => {
    setImagePreview(null);
    setImageError(null);
    
    if (item) {
      setEditingItem(item);
      
      // Initialize form data
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        image: item.image || '',
        type: SHOP_ITEM_TYPES.PRODUCT,
        isEnabled: item.isEnabled
      });
      
      // Load image preview if there's an image key
      if (item.image && item.image.startsWith('shop-items/')) {
        try {
          const imageUrl = await Storage.get(item.image, {
            level: 'public',
            expires: 60 * 60 // 1 hour
          });
          setImagePreview(imageUrl);
        } catch (error) {
          console.error('Error loading image preview:', error);
          setImageError('Failed to load image preview');
        }
      } else if (item.image) {
        // If it's an external URL, just use it directly
        setImagePreview(item.image);
      }
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        type: SHOP_ITEM_TYPES.PRODUCT,
        isEnabled: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        ...formData,
        price: parseInt(formData.price),
        type: SHOP_ITEM_TYPES.PRODUCT
      };

      if (editingItem) {
        await updateShopItem(editingItem.id, itemData);
      } else {
        await createShopItem(itemData, activeOrganization.id);
      }

      await loadShopItems();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving shop item:', error);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const itemToDelete = shopItems.find(item => item.id === itemId);
        
        // If the item has an image in S3, delete it
        if (itemToDelete && itemToDelete.image && itemToDelete.image.startsWith('shop-items/')) {
          try {
            await Storage.remove(itemToDelete.image, { level: 'public' });
            console.log('Deleted image from S3:', itemToDelete.image);
          } catch (imageError) {
            console.error('Error deleting image:', imageError);
            // Continue with item deletion even if image deletion fails
          }
        }
        
        await deleteShopItem(itemId);
        await loadShopItems();
      } catch (error) {
        console.error('Error deleting shop item:', error);
      }
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await updateShopItem(item.id, { isEnabled: !item.isEnabled });
      await loadShopItems();
    } catch (error) {
      console.error('Error toggling item status:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      return;
    }

    setUploadingImage(true);
    setImageError(null);

    try {
      // Compress the image
      const compressedFile = await compressImage(file, { 
        quality: 0.6, // Higher quality for product images
        maxWidth: 800,
        maxHeight: 800
      });
      
      // Create a unique filename
      const key = `shop-items/${activeOrganization.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      // Upload to S3
      await Storage.put(key, compressedFile, {
        contentType: file.type,
        level: 'public'
      });
      
      // Get the URL for preview
      const imageUrl = await Storage.get(key, { 
        level: 'public',
        expires: 60 * 60 // 1 hour
      });
      
      // Update the form data with the image key (not the URL)
      setFormData(prev => ({ ...prev, image: key }));
      setImagePreview(imageUrl);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    // If it's an S3 image and we're editing an item, remove it from S3
    if (formData.image && formData.image.startsWith('shop-items/') && editingItem) {
      try {
        await Storage.remove(formData.image, { level: 'public' });
        console.log('Removed image from S3:', formData.image);
      } catch (error) {
        console.error('Error removing image from S3:', error);
      }
    }
    
    // Clear the image field and preview
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
    setImageError(null);
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
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="items">
                <FontAwesomeIcon icon={faStore} className="me-2" />
                Shop Items
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="requests">
                <FontAwesomeIcon icon={faClipboardList} className="me-2" />
                Purchase Requests
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>

        <Card.Body>
          {activeTab === 'items' && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Shop Items Management</h5>
                <Button variant="primary" onClick={() => handleShowModal()}>
                  <FontAwesomeIcon icon={faPlus} className="me-2" />
                  Add New Item
                </Button>
              </div>

              <Table responsive striped hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shopItems.map((item) => (
            <tr 
              key={item.id}
              className={!item.isEnabled ? 'text-muted bg-light' : ''}
            >
              <td>
                {item.name}
                {!item.isEnabled && (
                  <span className="ms-2 badge bg-secondary">Inactive</span>
                )}
              </td>
              <td>
                <FontAwesomeIcon icon={faCoins} className={`me-1 ${item.isEnabled ? 'text-warning' : 'text-secondary'}`} />
                {item.price}
              </td>
              <td>
                <Button
                  variant={item.isEnabled ? "success" : "secondary"}
                  size="sm"
                  onClick={() => handleToggleStatus(item)}
                >
                  <FontAwesomeIcon
                    icon={item.isEnabled ? faToggleOn : faToggleOff}
                    className="me-1"
                  />
                  {item.isEnabled ? 'Active' : 'Inactive'}
                </Button>
              </td>
              <td>
                <div className="d-flex">
                  <Button
                    variant={item.isEnabled ? "outline-primary" : "outline-secondary"}
                    size="sm"
                    className="me-2"
                    style={{
                      width: '30px',
                      height: '30px',
                      padding: 0,
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: item.isEnabled ? '#0d6efd' : '#6c757d',
                      minWidth: 'unset'
                    }}
                    onClick={() => handleShowModal(item)}
                  >
                    <FontAwesomeIcon icon={faEdit} size="sm" />
                  </Button>
                  <Button
                    variant={item.isEnabled ? "outline-danger" : "outline-secondary"}
                    size="sm"
                    style={{
                      width: '30px',
                      height: '30px',
                      padding: 0,
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: item.isEnabled ? '#dc3545' : '#6c757d',
                      minWidth: 'unset'
                    }}
                    onClick={() => handleDelete(item.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} size="sm" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {shopItems.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center py-4">
                No items found. Click "Add New Item" to create one.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
            </>
          )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItem ? 'Edit Shop Item' : 'Add New Shop Item'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (Coins)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Image</Form.Label>
                  {imagePreview ? (
                    <div className="position-relative mb-3">
                      <Image 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="img-thumbnail shop-image-preview" 
                        style={{ maxHeight: '150px' }}
                      />
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className="position-absolute top-0 end-0"
                        onClick={handleRemoveImage}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <div className="d-grid">
                        <Button 
                          variant="outline-primary" 
                          onClick={() => document.getElementById('shop-image-upload').click()}
                          disabled={uploadingImage}
                          className="d-flex align-items-center justify-content-center"
                        >
                          {uploadingImage ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FontAwesomeIcon icon={faUpload} className="me-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                      </div>
                      <input
                        id="shop-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      {imageError && (
                        <div className="text-danger mt-2">
                          {imageError}
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="item-status"
                label="Item Enabled"
                checked={formData.isEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, isEnabled: e.target.checked })
                }
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploadingImage}>
              {editingItem ? 'Update' : 'Create'} Item
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {activeTab === 'requests' && (
        <PurchaseRequestsManagement />
      )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ShopManagement; 