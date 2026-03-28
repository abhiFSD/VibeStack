import { API } from 'aws-amplify';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';

// Define available shop item types
export const SHOP_ITEM_TYPES = {
  PRODUCT: 'PRODUCT',
  HOLIDAY: 'HOLIDAY',
  TICKET: 'TICKET',
  GIFT: 'GIFT'
};

// Default shop items that will be created for each organization
export const DEFAULT_SHOP_ITEMS = [
  {
    name: 'Premium Product',
    description: 'A high-quality premium product for our valued members',
    price: 100,
    image: 'https://example.com/premium-product.png',
    type: SHOP_ITEM_TYPES.PRODUCT
  },
  {
    name: 'Holiday Special',
    description: 'Special holiday-themed item for festive occasions',
    price: 50,
    image: 'https://example.com/holiday-special.png',
    type: SHOP_ITEM_TYPES.HOLIDAY
  },
  {
    name: 'Event Ticket',
    description: 'Access ticket to exclusive events and workshops',
    price: 75,
    image: 'https://example.com/event-ticket.png',
    type: SHOP_ITEM_TYPES.TICKET
  },
  {
    name: 'Special Gift',
    description: 'A special gift item for recognition and rewards',
    price: 150,
    image: 'https://example.com/special-gift.png',
    type: SHOP_ITEM_TYPES.GIFT
  }
];

// Initialize shop items for a new organization
export const initializeShopItems = async (organizationId) => {
  try {
    // Check if shop items already exist for this organization
    const existingItems = await API.graphql({
      query: queries.listShopItems,
      variables: {
        filter: {
          organizationID: { eq: organizationId }
        }
      }
    });

    if (existingItems.data.listShopItems.items.length === 0) {
      // Create default shop items
      await Promise.all(
        DEFAULT_SHOP_ITEMS.map(item =>
          API.graphql({
            query: mutations.createShopItem,
            variables: {
              input: {
                ...item,
                organizationID: organizationId,
                isEnabled: true
              }
            }
          })
        )
      );
      console.log('Successfully initialized shop items for organization:', organizationId);
    }
  } catch (error) {
    console.error('Error initializing shop items:', error);
  }
}; 