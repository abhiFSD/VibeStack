import { API } from 'aws-amplify';

export async function testOxworksOrganization() {
  const results = {};
  
  try {
    console.log('Testing Oxworks Organization Issue...\n');
    
    // 1. Check the organization directly
    console.log('1. Fetching Oxworks organization (ID: 7e847748-4394-44dc-be31-104c4c2c6fe1)...');
    const orgQuery = `
      query GetOrganization($id: ID!) {
        getOrganization(id: $id) {
          id
          name
          owner
          additionalOwners
          contactEmail
          contactPhone
          isActive
          _deleted
          createdAt
          updatedAt
        }
      }
    `;
    
    try {
      const orgResult = await API.graphql({
        query: orgQuery,
        variables: { id: '7e847748-4394-44dc-be31-104c4c2c6fe1' }
      });
      
      results.organization = orgResult.data.getOrganization;
      console.log('Organization found:', results.organization);
    } catch (error) {
      console.log('Error fetching organization:', error.message);
      results.orgError = error.message;
    }
    
    // 2. Check OrganizationMembers for user@example.com
    console.log('\n2. Checking OrganizationMembers for email: user@example.com...');
    const listMembersQuery = `
      query ListOrganizationMembers {
        listOrganizationMembers(filter: { 
          email: { eq: "user@example.com" },
          _deleted: { ne: true }
        }) {
          items {
            id
            organizationID
            userSub
            email
            role
            status
            _deleted
            createdAt
            updatedAt
          }
        }
      }
    `;
    
    try {
      const membersResult = await API.graphql({
        query: listMembersQuery
      });
      
      results.memberships = membersResult.data.listOrganizationMembers.items;
      console.log(`Found ${results.memberships.length} organization membership(s) for user@example.com`);
      
      // Check if any membership is for Oxworks
      results.oxworksMembership = results.memberships.find(m => m.organizationID === '7e847748-4394-44dc-be31-104c4c2c6fe1');
      if (results.oxworksMembership) {
        console.log('✓ User IS a member of Oxworks organization');
      } else {
        console.log('✗ User is NOT a member of Oxworks organization');
      }
    } catch (error) {
      console.log('Error fetching organization members:', error.message);
      results.membersError = error.message;
    }
    
    // 3. Check OrganizationMembers for the Oxworks organization
    console.log('\n3. Checking all members of Oxworks organization...');
    const listOxworksMembersQuery = `
      query ListOxworksMembers {
        listOrganizationMembers(filter: { 
          organizationID: { eq: "7e847748-4394-44dc-be31-104c4c2c6fe1" },
          _deleted: { ne: true }
        }) {
          items {
            id
            organizationID
            userSub
            email
            role
            status
            _deleted
            createdAt
            updatedAt
          }
        }
      }
    `;
    
    try {
      const oxworksMembersResult = await API.graphql({
        query: listOxworksMembersQuery
      });
      
      results.oxworksMembers = oxworksMembersResult.data.listOrganizationMembers.items;
      console.log(`Oxworks has ${results.oxworksMembers.length} member(s):`);
      if (results.oxworksMembers.length > 0) {
        results.oxworksMembers.forEach(member => {
          console.log(`  - ${member.email} (role: ${member.role}, status: ${member.status})`);
        });
      }
    } catch (error) {
      console.log('Error fetching Oxworks members:', error.message);
      results.oxworksMembersError = error.message;
    }
    
    // 4. Check user's Cognito sub from existing memberships
    console.log('\n4. Looking for userSub for user@example.com...');
    const findUserSubQuery = `
      query FindUserSub {
        listOrganizationMembers(filter: { 
          email: { eq: "user@example.com" }
        }, limit: 1000) {
          items {
            userSub
            email
            organizationID
          }
        }
      }
    `;
    
    try {
      const userSubResult = await API.graphql({
        query: findUserSubQuery
      });
      
      const items = userSubResult.data.listOrganizationMembers.items;
      const uniqueUserSubs = [...new Set(items.map(item => item.userSub).filter(Boolean))];
      
      results.userSubs = uniqueUserSubs;
      if (uniqueUserSubs.length > 0) {
        console.log(`Found userSub(s) for user@example.com: ${uniqueUserSubs.join(', ')}`);
      } else {
        console.log('No userSub found for user@example.com in any organization');
      }
    } catch (error) {
      console.log('Error finding userSub:', error.message);
      results.userSubError = error.message;
    }
    
    // 5. Summary
    console.log('\n=== DIAGNOSIS ===');
    
    if (results.organization) {
      console.log(`✓ Oxworks organization EXISTS (created: ${results.organization.createdAt})`);
      console.log(`  - Owner: ${results.organization.owner || 'Not set'}`);
      console.log(`  - Contact Email: ${results.organization.contactEmail}`);
      console.log(`  - Is Active: ${results.organization.isActive}`);
      console.log(`  - Is Deleted: ${results.organization._deleted || false}`);
    } else {
      console.log('✗ Oxworks organization NOT FOUND in database');
    }
    
    if (results.oxworksMembership) {
      console.log(`\n✓ User user@example.com IS a member of Oxworks`);
      console.log(`  - Membership ID: ${results.oxworksMembership.id}`);
      console.log(`  - Role: ${results.oxworksMembership.role}`);
      console.log(`  - Status: ${results.oxworksMembership.status}`);
      console.log(`  - UserSub: ${results.oxworksMembership.userSub || 'NOT SET'}`);
    } else {
      console.log('\n✗ User user@example.com is NOT a member of Oxworks');
      
      if (results.memberships && results.memberships.length > 0) {
        console.log(`  But user IS a member of ${results.memberships.length} other organization(s)`);
      }
    }
    
    if (results.oxworksMembers && results.oxworksMembers.length === 0) {
      console.log('\n⚠ Oxworks organization has NO members at all');
    }
    
    console.log('\n=== LIKELY ISSUE ===');
    if (!results.oxworksMembership && results.organization) {
      console.log('User user@example.com needs to be added as a member of Oxworks organization');
      console.log('Solution: Create an OrganizationMember record linking the user to Oxworks');
    } else if (results.oxworksMembership && !results.oxworksMembership.userSub) {
      console.log('The OrganizationMember record exists but is missing the userSub field');
      console.log('Solution: Update the OrganizationMember record with the correct userSub');
    } else if (!results.organization) {
      console.log('The Oxworks organization does not exist in the database');
      console.log('Solution: The organization needs to be created first');
    }
    
    return results;
    
  } catch (error) {
    console.error('Error:', error);
    return { error: error.message };
  }
}

// Export for use in browser console
window.testOxworks = testOxworksOrganization;