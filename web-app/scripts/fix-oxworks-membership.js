import { API } from 'aws-amplify';
import * as mutations from './graphql/mutations';

export async function addUserToOxworks() {
  try {
    console.log('Adding user@example.com to Oxworks organization...\n');
    
    // Create OrganizationMember record
    const createMemberInput = {
      organizationID: '7e847748-4394-44dc-be31-104c4c2c6fe1', // Oxworks ID
      userSub: '980133f0-1071-702d-d6a4-262dbb058d87', // User's Cognito sub from test
      email: 'user@example.com',
      role: 'ADMIN', // Since this is the contact email, making them ADMIN
      status: 'ACTIVE'
    };
    
    console.log('Creating OrganizationMember with:', createMemberInput);
    
    const result = await API.graphql({
      query: mutations.createOrganizationMember,
      variables: {
        input: createMemberInput
      }
    });
    
    if (result.data.createOrganizationMember) {
      console.log('✓ Successfully added user@example.com to Oxworks!');
      console.log('Member details:', result.data.createOrganizationMember);
      console.log('\n📝 Next steps:');
      console.log('1. Refresh the page');
      console.log('2. The Oxworks organization should now appear in the dropdown');
      console.log('3. Select it to switch to Oxworks');
      return result.data.createOrganizationMember;
    }
    
  } catch (error) {
    console.error('Error adding user to organization:', error);
    
    if (error.errors) {
      error.errors.forEach(err => {
        console.error('GraphQL Error:', err.message);
      });
    }
    
    // Check if member already exists
    if (error.message && error.message.includes('duplicate')) {
      console.log('\n⚠️  It looks like this user might already be a member.');
      console.log('Try refreshing the page to see if the organization appears.');
    }
    
    return null;
  }
}

// Export for use in browser console
window.fixOxworks = addUserToOxworks;