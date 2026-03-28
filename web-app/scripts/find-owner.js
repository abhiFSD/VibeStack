import { API } from 'aws-amplify';

export async function findOxworksOwner() {
  try {
    console.log('Finding the owner of Oxworks organization...\n');
    
    const ownerSub = 'f841a300-1011-70f5-923a-c9eb65a16698';
    console.log(`Owner Cognito Sub: ${ownerSub}\n`);
    
    // Search for this user in OrganizationMembers across all organizations
    console.log('Searching for user in OrganizationMembers...');
    const findOwnerQuery = `
      query FindOwner {
        listOrganizationMembers(filter: { 
          userSub: { eq: "${ownerSub}" }
        }, limit: 1000) {
          items {
            id
            organizationID
            userSub
            email
            role
            status
          }
        }
      }
    `;
    
    const ownerResult = await API.graphql({
      query: findOwnerQuery
    });
    
    const ownerMemberships = ownerResult.data.listOrganizationMembers.items;
    let emails = [];
    
    if (ownerMemberships.length > 0) {
      console.log(`✓ Found ${ownerMemberships.length} organization membership(s) for this owner:\n`);
      
      // Get unique email addresses
      emails = [...new Set(ownerMemberships.map(m => m.email).filter(Boolean))];
      
      if (emails.length > 0) {
        console.log('Owner email address(es):');
        emails.forEach(email => {
          console.log(`  📧 ${email}`);
        });
      }
      
      console.log('\nOrganizations this user belongs to:');
      ownerMemberships.forEach(membership => {
        console.log(`  - Org ID: ${membership.organizationID}`);
        console.log(`    Email: ${membership.email}`);
        console.log(`    Role: ${membership.role}`);
        console.log(`    Status: ${membership.status}\n`);
      });
      
      // Check if owner is a member of Oxworks
      const oxworksMembership = ownerMemberships.find(m => m.organizationID === '7e847748-4394-44dc-be31-104c4c2c6fe1');
      if (oxworksMembership) {
        console.log('✓ Owner IS also a member of Oxworks:');
        console.log(`  - Email: ${oxworksMembership.email}`);
        console.log(`  - Role: ${oxworksMembership.role}`);
      } else {
        console.log('⚠️  Owner is NOT a member of Oxworks (unusual - owner should be a member)');
      }
      
    } else {
      console.log('❌ No OrganizationMember records found for this userSub');
      console.log('This user might have created the organization but never became a member.');
    }
    
    // Also check if this owner owns other organizations
    console.log('\n---\nChecking what organizations this user owns...');
    const ownedOrgsQuery = `
      query GetOwnedOrgs {
        listOrganizations(filter: { 
          owner: { eq: "${ownerSub}" }
        }) {
          items {
            id
            name
            contactEmail
            createdAt
          }
        }
      }
    `;
    
    const ownedOrgsResult = await API.graphql({
      query: ownedOrgsQuery
    });
    
    const ownedOrgs = ownedOrgsResult.data.listOrganizations.items;
    
    if (ownedOrgs.length > 0) {
      console.log(`✓ This user owns ${ownedOrgs.length} organization(s):`);
      ownedOrgs.forEach(org => {
        console.log(`  - ${org.name} (ID: ${org.id})`);
        console.log(`    Contact: ${org.contactEmail}`);
        console.log(`    Created: ${org.createdAt}`);
        if (org.id === '7e847748-4394-44dc-be31-104c4c2c6fe1') {
          console.log(`    ⭐ This is Oxworks!`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No organizations owned by this user found');
    }
    
    console.log('\n=== SUMMARY ===');
    if (emails && emails.length > 0) {
      console.log(`Oxworks owner: ${emails.join(', ')}`);
    } else {
      console.log(`Oxworks owner userSub: ${ownerSub}`);
      console.log('Could not find email address for this owner.');
    }
    
    return {
      ownerSub,
      emails: emails || [],
      memberships: ownerMemberships,
      ownedOrganizations: ownedOrgs
    };
    
  } catch (error) {
    console.error('Error finding owner:', error);
    return null;
  }
}

// Export for use in browser console
window.findOwner = findOxworksOwner;