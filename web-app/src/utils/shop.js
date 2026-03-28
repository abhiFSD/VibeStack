import { API, Auth } from 'aws-amplify';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import { getUserCoins } from './awardDefinitions';
import { sendEmailNotification } from './emailNotifications';

// Get all shop items for an organization
export const getShopItems = async (organizationId) => {
  try {
    console.log('Fetching shop items for organization:', organizationId);
    const result = await API.graphql({
      query: queries.listShopItems,
      variables: {
        filter: {
          organizationID: { eq: organizationId }
        }
      }
    });
    
    console.log('Raw response:', result.data.listShopItems.items);
    
    // Only filter out deleted items, keep both enabled and disabled
    const filteredItems = result.data.listShopItems.items.filter(item => !item._deleted);
    console.log('Filtered items:', filteredItems);
    console.log('Disabled items:', filteredItems.filter(item => !item.isEnabled));
    
    return filteredItems;
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return [];
  }
};

// Get user's purchased items
export const getUserPurchases = async (organizationId) => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    console.log('Fetching purchases for user:', user.attributes.sub, 'in organization:', organizationId);
    
    // First, get the user purchases without nested shop item details
    const result = await API.graphql({
      query: queries.listUserPurchases,
      variables: {
        filter: {
          user_sub: { eq: user.attributes.sub },
          organizationID: { eq: organizationId }
        }
      }
    });
    
    const purchases = result.data.listUserPurchases.items.filter(item => !item._deleted);
    console.log('Found purchases:', purchases.length, purchases);
    
    // Then, fetch shop item details for each purchase
    const purchasesWithItems = await Promise.all(
      purchases.map(async (purchase) => {
        try {
          const itemResult = await API.graphql({
            query: queries.getShopItem,
            variables: { id: purchase.shopItemID }
          });
          
          return {
            ...purchase,
            shopItem: itemResult.data.getShopItem
          };
        } catch (error) {
          console.error(`Error fetching shop item ${purchase.shopItemID}:`, error);
          return {
            ...purchase,
            shopItem: null
          };
        }
      })
    );
    
    console.log('Purchases with shop items:', purchasesWithItems);
    return purchasesWithItems;
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return [];
  }
};

// Purchase an item (creates a purchase request)
export const purchaseItem = async (shopItemId, organizationId) => {
  try {
    console.log(`Starting purchase request for item ${shopItemId} in organization ${organizationId}`);
    const user = await Auth.currentAuthenticatedUser();
    console.log(`User authenticated: ${user.attributes.email}`);
    
    // Get the shop item
    const itemResult = await API.graphql({
      query: queries.getShopItem,
      variables: { id: shopItemId }
    });
    const shopItem = itemResult.data.getShopItem;
    console.log(`Found shop item: ${shopItem.name}, price: ${shopItem.price}`);

    if (!shopItem || !shopItem.isEnabled) {
      throw new Error('Item not available for purchase');
    }

    // Get user's current coins record
    const userCoinsResult = await API.graphql({
      query: queries.listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: user.attributes.sub },
          organizationID: { eq: organizationId }
        }
      }
    });

    const userCoinsRecord = userCoinsResult.data.listUserCoins.items[0];
    console.log(`User coins: ${userCoinsRecord ? userCoinsRecord.total_coins : 0}, item price: ${shopItem.price}`);
    
    if (!userCoinsRecord || userCoinsRecord.total_coins < shopItem.price) {
      throw new Error('Insufficient coins');
    }

    // Create purchase request with PENDING status
    const purchaseInput = {
      shopItemID: shopItemId,
      user_sub: user.attributes.sub,
      purchaseDate: new Date().toISOString(),
      organizationID: organizationId,
      status: 'PENDING'
    };
    console.log('Creating purchase request with input:', purchaseInput);

    const purchaseResult = await API.graphql({
      query: mutations.createUserPurchase,
      variables: { input: purchaseInput }
    });
    
    const purchase = purchaseResult.data.createUserPurchase;
    console.log('Purchase request created successfully:', purchase.id);

    // Send email notification to organization admins about the purchase request
    console.log('Sending purchase request notification to admins...');
    try {
      const notificationResult = await sendPurchaseRequestNotification(
        purchase, 
        shopItem, 
        user.attributes.email,
        organizationId
      );
      console.log('Purchase request notification result:', notificationResult);
    } catch (notificationError) {
      console.error('Error sending purchase request notification:', notificationError);
      // Continue with the purchase request even if notification fails
    }

    // Send confirmation email to user
    try {
      await sendPurchaseRequestConfirmationToUser(
        purchase,
        shopItem,
        user.attributes.email,
        organizationId
      );
    } catch (userNotificationError) {
      console.error('Error sending purchase request confirmation to user:', userNotificationError);
    }

    return {
      success: true,
      purchaseRequest: purchase,
      purchasedItem: shopItem,
      status: 'PENDING'
    };
  } catch (error) {
    console.error('Error creating purchase request:', error);
    throw error;
  }
};

// Create a new shop item (admin only)
export const createShopItem = async (itemData, organizationId) => {
  try {
    const input = {
      ...itemData,
      organizationID: organizationId,
      isEnabled: true
    };

    const result = await API.graphql({
      query: mutations.createShopItem,
      variables: { input }
    });

    return result.data.createShopItem;
  } catch (error) {
    console.error('Error creating shop item:', error);
    throw error;
  }
};

// Update a shop item (admin only)
export const updateShopItem = async (itemId, updates) => {
  try {
    const input = {
      id: itemId,
      ...updates
    };

    const result = await API.graphql({
      query: mutations.updateShopItem,
      variables: { input }
    });

    return result.data.updateShopItem;
  } catch (error) {
    console.error('Error updating shop item:', error);
    throw error;
  }
};

// Delete a shop item (admin only)
export const deleteShopItem = async (itemId) => {
  try {
    const result = await API.graphql({
      query: mutations.deleteShopItem,
      variables: { input: { id: itemId } }
    });

    return result.data.deleteShopItem;
  } catch (error) {
    console.error('Error deleting shop item:', error);
    throw error;
  }
};

// Send notification to organization admins about a purchase request
export const sendPurchaseRequestNotification = async (purchase, shopItem, userEmail, organizationId) => {
  try {
    if (!purchase || !shopItem || !userEmail || !organizationId) {
      console.error('Missing required data for purchase notification');
      return false;
    }

    console.log('Sending purchase notification for:', {
      purchaseId: purchase.id,
      itemName: shopItem.name,
      userEmail,
      organizationId
    });

    // Get organization details first
    const orgResponse = await API.graphql({
      query: queries.getOrganization,
      variables: { id: organizationId }
    });
    
    const organization = orgResponse.data.getOrganization;
    const organizationName = organization ? organization.name : 'Your Organization';
    console.log('Organization details:', {
      id: organization.id,
      name: organization.name,
      owner: organization.owner,
      contactEmail: organization.contactEmail
    });

    // Get organization members to find admins
    const membersResponse = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          organizationID: { eq: organizationId },
          role: { eq: 'ADMIN' }, // Filter for ADMIN role
          status: { eq: 'ACTIVE' },
          _deleted: { ne: true }
        }
      }
    });
    
    let adminEmails = membersResponse.data.listOrganizationMembers.items
      .map(member => member.email)
      .filter(Boolean);
    
    // If no admin emails found through members, get the owner's email directly
    if (adminEmails.length === 0 && organization.owner) {
      console.log('No admin emails found through members query. Getting owner email directly...');
      
      // Get the owner's email from the organization members
      const ownerMemberResponse = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            userSub: { eq: organization.owner },
            status: { eq: 'ACTIVE' },
            _deleted: { ne: true }
          }
        }
      });
      
      const ownerMember = ownerMemberResponse.data.listOrganizationMembers.items.find(member => Boolean(member.email));
      
      if (ownerMember && ownerMember.email) {
        console.log(`Found owner email: ${ownerMember.email}`);
        adminEmails = [ownerMember.email];
      }
      // If we still don't have an admin email, use the organization's contact email as a fallback
      else if (organization.contactEmail) {
        console.log(`Using organization contact email as fallback: ${organization.contactEmail}`);
        adminEmails = [organization.contactEmail];
      }
    }
    
    // If we still don't have any admin emails, use the current user's email as a last resort
    if (adminEmails.length === 0 && userEmail) {
      console.log(`Using purchaser's email as final fallback: ${userEmail}`);
      adminEmails = [userEmail];
    }
    
    if (adminEmails.length === 0) {
      console.error('No admin emails found for purchase notification, even after trying all fallbacks');
      return false;
    }

    console.log(`Found ${adminEmails.length} admin emails:`, adminEmails);

    // Format purchase date
    const purchaseDate = new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Prepare notification data for the CUSTOM_NOTIFICATION template
    const notificationData = {
      subject: `Shop Purchase Request: ${shopItem.name}`,
      title: `Shop Purchase Request - ${organizationName}`,
      message: `
        <p><strong>Purchase Request Details:</strong></p>
        <ul>
          <li><strong>User:</strong> ${userEmail}</li>
          <li><strong>Item:</strong> ${shopItem.name}</li>
          <li><strong>Type:</strong> ${shopItem.type || 'N/A'}</li>
          <li><strong>Price:</strong> ${shopItem.price} coins</li>
          <li><strong>Request Date:</strong> ${purchaseDate}</li>
          <li><strong>Status:</strong> Pending Approval</li>
        </ul>
        <p>A user in your organization has requested to purchase an item from the shop. Please review and approve/reject this request.</p>
      `,
      actionURL: `${window.location.origin}/organization-management?tab=shop&subtab=requests`,
      actionText: 'Review Purchase Requests'
    };

    // Use the standard sendEmailNotification function that other parts of the app use
    const result = await sendEmailNotification({
      type: 'CUSTOM_NOTIFICATION',
      to: adminEmails,
      data: notificationData,
      organizationID: organizationId
    });

    console.log('Purchase request notification sent to admins:', adminEmails, 'Result:', result);
    return result;
  } catch (error) {
    console.error('Error sending purchase request notification:', error);
    return false;
  }
};

// Send confirmation email to user about their purchase request
export const sendPurchaseRequestConfirmationToUser = async (purchase, shopItem, userEmail, organizationId) => {
  try {
    if (!purchase || !shopItem || !userEmail || !organizationId) {
      console.error('Missing required data for user purchase request confirmation');
      return false;
    }

    // Get organization details
    const orgResponse = await API.graphql({
      query: queries.getOrganization,
      variables: { id: organizationId }
    });
    
    const organization = orgResponse.data.getOrganization;
    const organizationName = organization ? organization.name : 'Your Organization';

    const purchaseDate = new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Prepare notification data for the user
    const notificationData = {
      subject: `Purchase Request Submitted: ${shopItem.name}`,
      title: `Purchase Request Confirmation - ${organizationName}`,
      message: `
        <p>Your purchase request has been submitted successfully!</p>
        <p><strong>Request Details:</strong></p>
        <ul>
          <li><strong>Item:</strong> ${shopItem.name}</li>
          <li><strong>Description:</strong> ${shopItem.description || 'N/A'}</li>
          <li><strong>Price:</strong> ${shopItem.price} coins</li>
          <li><strong>Request Date:</strong> ${purchaseDate}</li>
          <li><strong>Status:</strong> Pending Approval</li>
        </ul>
        <p>Your request is now pending approval from organization administrators. You will receive an email notification once your request has been reviewed.</p>
        <p><strong>Note:</strong> Your coins will only be deducted once the request is approved and the item is delivered.</p>
      `,
      actionURL: `${window.location.origin}/shop`,
      actionText: 'View Shop'
    };

    // Send notification to user
    const result = await sendEmailNotification({
      type: 'CUSTOM_NOTIFICATION',
      to: userEmail,
      data: notificationData,
      organizationID: organizationId
    });

    console.log('Purchase request confirmation sent to user:', userEmail, 'Result:', result);
    return result;
  } catch (error) {
    console.error('Error sending purchase request confirmation to user:', error);
    return false;
  }
};

// Get all purchase requests for an organization
export const getPurchaseRequests = async (organizationId, status = null) => {
  try {
    console.log('Fetching purchase requests for organization:', organizationId, 'with status:', status);
    
    const filter = {
      organizationID: { eq: organizationId }
    };
    
    if (status) {
      filter.status = { eq: status };
    }

    // First, get the purchase requests without nested shop item details
    const result = await API.graphql({
      query: queries.listUserPurchases,
      variables: { filter }
    });
    
    const requests = result.data.listUserPurchases.items.filter(item => !item._deleted);
    console.log('Found purchase requests:', requests.length, requests);
    
    // Then, fetch shop item details for each request
    const requestsWithItems = await Promise.all(
      requests.map(async (request) => {
        try {
          const itemResult = await API.graphql({
            query: queries.getShopItem,
            variables: { id: request.shopItemID }
          });
          
          return {
            ...request,
            shopItem: itemResult.data.getShopItem
          };
        } catch (error) {
          console.error(`Error fetching shop item ${request.shopItemID}:`, error);
          return {
            ...request,
            shopItem: null
          };
        }
      })
    );
    
    // Get user emails for each request
    const requestsWithUserInfo = await Promise.all(
      requestsWithItems.map(async (request) => {
        try {
          // Get user email from organization members
          const memberResponse = await API.graphql({
            query: queries.listOrganizationMembers,
            variables: {
              filter: {
                organizationID: { eq: organizationId },
                userSub: { eq: request.user_sub }
              }
            }
          });
          
          const member = memberResponse.data.listOrganizationMembers.items[0];
          return {
            ...request,
            userEmail: member ? member.email : 'Unknown User'
          };
        } catch (error) {
          console.error('Error getting user email for request:', request.id, error);
          return {
            ...request,
            userEmail: 'Unknown User'
          };
        }
      })
    );
    
    console.log('Final requests with items and user info:', requestsWithUserInfo.length, requestsWithUserInfo);
    return requestsWithUserInfo;
  } catch (error) {
    console.error('Error fetching purchase requests:', error);
    return [];
  }
};

// Approve a purchase request
export const approvePurchaseRequest = async (purchaseId, approverSub, deliveryNotes = '') => {
  try {
    console.log(`Approving purchase request ${purchaseId} by ${approverSub}`);
    
    // Get the purchase request
    const purchaseResult = await API.graphql({
      query: queries.getUserPurchase,
      variables: { id: purchaseId }
    });
    
    const purchase = purchaseResult.data.getUserPurchase;
    if (!purchase) {
      throw new Error('Purchase request not found');
    }
    
    if (purchase.status !== 'PENDING') {
      throw new Error('Purchase request is not pending');
    }

    // Get the shop item
    const itemResult = await API.graphql({
      query: queries.getShopItem,
      variables: { id: purchase.shopItemID }
    });
    const shopItem = itemResult.data.getShopItem;

    // Get user's current coins record
    const userCoinsResult = await API.graphql({
      query: queries.listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: purchase.user_sub },
          organizationID: { eq: purchase.organizationID }
        }
      }
    });

    const userCoinsRecord = userCoinsResult.data.listUserCoins.items[0];
    
    if (!userCoinsRecord || userCoinsRecord.total_coins < shopItem.price) {
      throw new Error('User has insufficient coins for this purchase');
    }

    // Update user's coins
    const remainingCoins = userCoinsRecord.total_coins - shopItem.price;
    await API.graphql({
      query: mutations.updateUserCoins,
      variables: {
        input: {
          id: userCoinsRecord.id,
          total_coins: remainingCoins,
          _version: userCoinsRecord._version
        }
      }
    });

    // Update purchase request status to DELIVERED (skip APPROVED step)
    const updateResult = await API.graphql({
      query: mutations.updateUserPurchase,
      variables: {
        input: {
          id: purchaseId,
          status: 'DELIVERED',
          approvedBy: approverSub,
          approvedDate: new Date().toISOString(),
          deliveryNotes: deliveryNotes,
          _version: purchase._version
        }
      }
    });

    const updatedPurchase = updateResult.data.updateUserPurchase;

    // Send approval and delivery notification to user
    try {
      await sendPurchaseApprovalAndDeliveryNotification(updatedPurchase, shopItem, purchase.organizationID, deliveryNotes);
    } catch (notificationError) {
      console.error('Error sending approval and delivery notification:', notificationError);
    }

    return {
      success: true,
      purchase: updatedPurchase,
      remainingCoins
    };
  } catch (error) {
    console.error('Error approving purchase request:', error);
    throw error;
  }
};

// Reject a purchase request
export const rejectPurchaseRequest = async (purchaseId, approverSub, rejectionReason = '') => {
  try {
    console.log(`Rejecting purchase request ${purchaseId} by ${approverSub}`);
    
    // Get the purchase request
    const purchaseResult = await API.graphql({
      query: queries.getUserPurchase,
      variables: { id: purchaseId }
    });
    
    const purchase = purchaseResult.data.getUserPurchase;
    if (!purchase) {
      throw new Error('Purchase request not found');
    }
    
    if (purchase.status !== 'PENDING') {
      throw new Error('Purchase request is not pending');
    }

    // Update purchase request status to REJECTED
    const updateResult = await API.graphql({
      query: mutations.updateUserPurchase,
      variables: {
        input: {
          id: purchaseId,
          status: 'REJECTED',
          approvedBy: approverSub,
          approvedDate: new Date().toISOString(),
          rejectionReason: rejectionReason,
          _version: purchase._version
        }
      }
    });

    const updatedPurchase = updateResult.data.updateUserPurchase;

    // Get shop item for notification
    const itemResult = await API.graphql({
      query: queries.getShopItem,
      variables: { id: purchase.shopItemID }
    });
    const shopItem = itemResult.data.getShopItem;

    // Send rejection notification to user
    try {
      await sendPurchaseApprovalNotification(updatedPurchase, shopItem, purchase.organizationID, false, rejectionReason);
    } catch (notificationError) {
      console.error('Error sending rejection notification:', notificationError);
    }

    return {
      success: true,
      purchase: updatedPurchase
    };
  } catch (error) {
    console.error('Error rejecting purchase request:', error);
    throw error;
  }
};

// Send approval/rejection notification to user
export const sendPurchaseApprovalNotification = async (purchase, shopItem, organizationId, isApproved, rejectionReason = '') => {
  try {
    // Get organization details
    const orgResponse = await API.graphql({
      query: queries.getOrganization,
      variables: { id: organizationId }
    });
    
    const organization = orgResponse.data.getOrganization;
    const organizationName = organization ? organization.name : 'Your Organization';

    // Get user email
    const memberResponse = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          organizationID: { eq: organizationId },
          userSub: { eq: purchase.user_sub }
        }
      }
    });
    
    const member = memberResponse.data.listOrganizationMembers.items[0];
    if (!member) {
      console.error('User not found in organization members');
      return false;
    }

    const approvalDate = new Date(purchase.approvedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let notificationData;
    
    if (isApproved) {
      notificationData = {
        subject: `Purchase Request Approved: ${shopItem.name}`,
        title: `Purchase Request Approved - ${organizationName}`,
        message: `
          <p>Great news! Your purchase request has been approved.</p>
          <p><strong>Purchase Details:</strong></p>
          <ul>
            <li><strong>Item:</strong> ${shopItem.name}</li>
            <li><strong>Price:</strong> ${shopItem.price} coins</li>
            <li><strong>Approved Date:</strong> ${approvalDate}</li>
            ${purchase.deliveryNotes ? `<li><strong>Delivery Notes:</strong> ${purchase.deliveryNotes}</li>` : ''}
          </ul>
          <p>Your coins have been deducted and the item will be delivered soon. You will receive another notification when the item is delivered.</p>
        `,
        actionURL: `${window.location.origin}/inventory`,
        actionText: 'View My Inventory'
      };
    } else {
      notificationData = {
        subject: `Purchase Request Rejected: ${shopItem.name}`,
        title: `Purchase Request Rejected - ${organizationName}`,
        message: `
          <p>We're sorry, but your purchase request has been rejected.</p>
          <p><strong>Request Details:</strong></p>
          <ul>
            <li><strong>Item:</strong> ${shopItem.name}</li>
            <li><strong>Price:</strong> ${shopItem.price} coins</li>
            <li><strong>Rejected Date:</strong> ${approvalDate}</li>
            ${rejectionReason ? `<li><strong>Reason:</strong> ${rejectionReason}</li>` : ''}
          </ul>
          <p>Your coins have not been deducted. You can submit a new purchase request if needed.</p>
        `,
        actionURL: `${window.location.origin}/shop`,
        actionText: 'Browse Shop'
      };
    }

    // Send notification to user
    const result = await sendEmailNotification({
      type: 'CUSTOM_NOTIFICATION',
      to: member.email,
      data: notificationData,
      organizationID: organizationId
    });

    console.log(`Purchase ${isApproved ? 'approval' : 'rejection'} notification sent to user:`, member.email, 'Result:', result);
    return result;
  } catch (error) {
    console.error(`Error sending purchase ${isApproved ? 'approval' : 'rejection'} notification:`, error);
    return false;
  }
};

// Send combined approval and delivery notification to user
export const sendPurchaseApprovalAndDeliveryNotification = async (purchase, shopItem, organizationId, deliveryNotes = '') => {
  try {
    // Get organization details
    const orgResponse = await API.graphql({
      query: queries.getOrganization,
      variables: { id: organizationId }
    });
    
    const organization = orgResponse.data.getOrganization;
    const organizationName = organization ? organization.name : 'Your Organization';

    // Get user email
    const memberResponse = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          organizationID: { eq: organizationId },
          userSub: { eq: purchase.user_sub }
        }
      }
    });
    
    const member = memberResponse.data.listOrganizationMembers.items[0];
    if (!member) {
      console.error('User not found in organization members');
      return false;
    }

    const approvalDate = new Date(purchase.approvedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const notificationData = {
      subject: `Purchase Approved & Delivered: ${shopItem.name}`,
      title: `Purchase Approved & Delivered - ${organizationName}`,
      message: `
        <p>Great news! Your purchase request has been approved and the item has been delivered!</p>
        <p><strong>Purchase Details:</strong></p>
        <ul>
          <li><strong>Item:</strong> ${shopItem.name}</li>
          <li><strong>Price:</strong> ${shopItem.price} coins</li>
          <li><strong>Approved & Delivered:</strong> ${approvalDate}</li>
          ${deliveryNotes ? `<li><strong>Delivery Notes:</strong> ${deliveryNotes}</li>` : ''}
        </ul>
        <p>Your coins have been deducted and the item is now available in your inventory. Enjoy your purchase!</p>
      `,
      actionURL: `${window.location.origin}/inventory`,
      actionText: 'View My Inventory'
    };

    // Send notification to user
    const result = await sendEmailNotification({
      type: 'CUSTOM_NOTIFICATION',
      to: member.email,
      data: notificationData,
      organizationID: organizationId
    });

    console.log('Purchase approval and delivery notification sent to user:', member.email, 'Result:', result);
    return result;
  } catch (error) {
    console.error('Error sending purchase approval and delivery notification:', error);
    return false;
  }
}; 