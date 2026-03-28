// Quick console debug script - paste this into your browser console
// Make sure you're logged in and on a page with access to the API

const debugUsers = async () => {
  const USER1 = {
    userSub: '08f1f3b0-5091-7035-732e-46afcfdf72bb',
    organizationId: 'fc533ed5-b9b7-4d3a-8261-7c4e6ffb2dc9',
    label: 'User 1 (Gets Awards)'
  };

  const USER2 = {
    userSub: '980133f0-1071-702d-d6a4-262dbb058d87',
    organizationId: '74209e32-d4f4-4389-b31d-cb93eb04e40c',
    toolId: '9bb6c86b-8f1b-4cbe-bcbe-a25a55819fe8',
    label: 'User 2 (No Awards)'
  };

  console.log('🔍 DEBUGGING LEARNING AWARDS ISSUE\n');
  console.log('='.repeat(80));

  try {
    // Get organizations
    const org1Query = `query { getOrganization(id: "${USER1.organizationId}") { id name learningCoinsEnabled learningCoinsPerInterval learningCoinInterval learningMaxCoinsPerSession } }`;
    const org2Query = `query { getOrganization(id: "${USER2.organizationId}") { id name learningCoinsEnabled learningCoinsPerInterval learningCoinInterval learningMaxCoinsPerSession } }`;

    const org1Result = await API.graphql({query: org1Query});
    const org2Result = await API.graphql({query: org2Query});

    const org1 = org1Result.data.getOrganization;
    const org2 = org2Result.data.getOrganization;

    console.log('\n📋 ORGANIZATION SETTINGS:');
    console.log('\nUser 1 Organization:', org1);
    console.log('User 2 Organization:', org2);

    // Get learning progress
    const progress2Query = `
      query {
        listLearningProgresses(
          filter: {
            userSub: {eq: "${USER2.userSub}"}
            organizationID: {eq: "${USER2.organizationId}"}
            learningID: {eq: "${USER2.toolId}"}
            _deleted: {ne: true}
          }
        ) {
          items {
            id totalTimeSpent createdAt updatedAt
          }
        }
      }
    `;

    const progressResult = await API.graphql({query: progress2Query});
    const progress = progressResult.data.listLearningProgresses.items;

    console.log('\n📊 USER 2 LEARNING PROGRESS:');
    console.log('Progress records:', progress);

    if (progress.length > 0) {
      const totalTime = progress[0].totalTimeSpent || 0;
      const intervalSeconds = org2.learningCoinInterval || 120;
      const coinsPerInterval = org2.learningCoinsPerInterval || 5;
      const completeIntervals = Math.floor(totalTime / intervalSeconds);

      console.log('\n🧮 CALCULATIONS:');
      console.log(`Total time: ${totalTime} seconds (${(totalTime/60).toFixed(2)} minutes)`);
      console.log(`Interval: ${intervalSeconds} seconds (${intervalSeconds/60} minutes)`);
      console.log(`Complete intervals: ${completeIntervals}`);
      console.log(`Coins per interval: ${coinsPerInterval}`);
      console.log(`Should have coins: ${completeIntervals * coinsPerInterval}`);

      if (completeIntervals > 0) {
        console.log('\n❌ USER 2 SHOULD HAVE AWARDS BUT DOESN\'T!');
      } else {
        console.log('\n✅ User 2 hasn\'t completed enough time for an award yet');
      }
    }

    // Get awards
    const awards2Query = `
      query {
        listAwards(
          filter: {
            user_sub: {eq: "${USER2.userSub}"}
            organizationID: {eq: "${USER2.organizationId}"}
            tool_id: {eq: "${USER2.toolId}"}
            type: {eq: "LEARNING_TIME_MILESTONE"}
            _deleted: {ne: true}
          }
        ) {
          items {
            id title coins date tool_id
          }
        }
      }
    `;

    const awardsResult = await API.graphql({query: awards2Query});
    const awards = awardsResult.data.listAwards.items;

    console.log('\n🏆 USER 2 AWARDS:');
    console.log('Awards:', awards);

  } catch (error) {
    console.error('Debug error:', error);
  }
};

// To run this, paste it in console and then call:
// debugUsers();

console.log('Debug script loaded. Call debugUsers() to run the analysis.');