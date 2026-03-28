import { API, graphqlOperation } from 'aws-amplify';
import { getOrganization, listLearningProgresses, listAwards } from './graphql/queries';

// User and organization details
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

export async function debugLearningAwards() {
  console.log('🔍 DEBUGGING LEARNING AWARDS ISSUE\n');
  console.log('='.repeat(80));
  
  try {
    // 1. Check Organization Settings
    console.log('\n📋 ORGANIZATION SETTINGS COMPARISON:\n');
    
    const org1Result = await API.graphql(graphqlOperation(getOrganization, { id: USER1.organizationId }));
    const org2Result = await API.graphql(graphqlOperation(getOrganization, { id: USER2.organizationId }));
    
    const org1 = org1Result.data.getOrganization;
    const org2 = org2Result.data.getOrganization;
    
    console.log(`${USER1.label} Organization (${USER1.organizationId}):`);
    console.log(`  - Name: ${org1.name}`);
    console.log(`  - Learning Coins Enabled: ${org1.learningCoinsEnabled}`);
    console.log(`  - Coins Per Interval: ${org1.learningCoinsPerInterval}`);
    console.log(`  - Interval (seconds): ${org1.learningCoinInterval}`);
    console.log(`  - Interval (minutes): ${org1.learningCoinInterval / 60}`);
    console.log(`  - Max Coins Per Session: ${org1.learningMaxCoinsPerSession}`);
    
    console.log(`\n${USER2.label} Organization (${USER2.organizationId}):`);
    console.log(`  - Name: ${org2.name}`);
    console.log(`  - Learning Coins Enabled: ${org2.learningCoinsEnabled}`);
    console.log(`  - Coins Per Interval: ${org2.learningCoinsPerInterval}`);
    console.log(`  - Interval (seconds): ${org2.learningCoinInterval}`);
    console.log(`  - Interval (minutes): ${org2.learningCoinInterval / 60}`);
    console.log(`  - Max Coins Per Session: ${org2.learningMaxCoinsPerSession}`);
    
    // 2. Check Learning Progress
    console.log('\n\n📊 LEARNING PROGRESS DATA:\n');
    
    const progress1Result = await API.graphql(
      graphqlOperation(listLearningProgresses, {
        filter: {
          userSub: { eq: USER1.userSub },
          organizationID: { eq: USER1.organizationId },
          _deleted: { ne: true }
        }
      })
    );
    
    const progress2Result = await API.graphql(
      graphqlOperation(listLearningProgresses, {
        filter: {
          userSub: { eq: USER2.userSub },
          organizationID: { eq: USER2.organizationId },
          learningID: { eq: USER2.toolId },
          _deleted: { ne: true }
        }
      })
    );
    
    const progress1 = progress1Result.data.listLearningProgresses.items;
    const progress2 = progress2Result.data.listLearningProgresses.items;
    
    console.log(`${USER1.label} Progress Records: ${progress1.length}`);
    progress1.forEach(prog => {
      console.log(`  - Learning ID: ${prog.learningID}`);
      console.log(`    Total Time Spent: ${prog.totalTimeSpent} seconds (${(prog.totalTimeSpent / 60).toFixed(2)} minutes)`);
      console.log(`    Created: ${prog.createdAt}`);
      console.log(`    Updated: ${prog.updatedAt}`);
    });
    
    console.log(`\n${USER2.label} Progress Records: ${progress2.length}`);
    progress2.forEach(prog => {
      console.log(`  - Learning ID: ${prog.learningID}`);
      console.log(`    Total Time Spent: ${prog.totalTimeSpent} seconds (${(prog.totalTimeSpent / 60).toFixed(2)} minutes)`);
      console.log(`    Created: ${prog.createdAt}`);
      console.log(`    Updated: ${prog.updatedAt}`);
    });
    
    // 3. Check Awards
    console.log('\n\n🏆 LEARNING TIME AWARDS:\n');
    
    const awards1Result = await API.graphql(
      graphqlOperation(listAwards, {
        filter: {
          user_sub: { eq: USER1.userSub },
          organizationID: { eq: USER1.organizationId },
          type: { eq: 'LEARNING_TIME_MILESTONE' },
          _deleted: { ne: true }
        },
        limit: 1000
      })
    );
    
    const awards2Result = await API.graphql(
      graphqlOperation(listAwards, {
        filter: {
          user_sub: { eq: USER2.userSub },
          organizationID: { eq: USER2.organizationId },
          tool_id: { eq: USER2.toolId },
          type: { eq: 'LEARNING_TIME_MILESTONE' },
          _deleted: { ne: true }
        },
        limit: 1000
      })
    );
    
    const awards1 = awards1Result.data.listAwards.items;
    const awards2 = awards2Result.data.listAwards.items;
    
    console.log(`${USER1.label} Learning Awards: ${awards1.length}`);
    awards1.forEach(award => {
      console.log(`  - Title: ${award.title}`);
      console.log(`    Coins: ${award.coins}`);
      console.log(`    Tool ID: ${award.tool_id}`);
      console.log(`    Date: ${award.date}`);
    });
    
    console.log(`\n${USER2.label} Learning Awards: ${awards2.length}`);
    awards2.forEach(award => {
      console.log(`  - Title: ${award.title}`);
      console.log(`    Coins: ${award.coins}`);
      console.log(`    Tool ID: ${award.tool_id}`);
      console.log(`    Date: ${award.date}`);
    });
    
    // 4. Calculate Expected Awards
    console.log('\n\n🧮 AWARD CALCULATIONS:\n');
    
    // For User 2
    if (progress2.length > 0 && org2.learningCoinsEnabled) {
      const totalTime = progress2[0].totalTimeSpent || 0;
      const intervalSeconds = org2.learningCoinInterval || 120; // 2 minutes default
      const coinsPerInterval = org2.learningCoinsPerInterval || 5;
      const maxCoins = org2.learningMaxCoinsPerSession || 20;
      
      const completeIntervals = Math.floor(totalTime / intervalSeconds);
      const potentialCoins = completeIntervals * coinsPerInterval;
      const shouldHaveCoins = Math.min(potentialCoins, maxCoins);
      const existingCoins = awards2.reduce((sum, award) => sum + (award.coins || 0), 0);
      
      console.log(`${USER2.label} Calculation:`);
      console.log(`  - Total Time: ${totalTime} seconds (${(totalTime / 60).toFixed(2)} minutes)`);
      console.log(`  - Interval: ${intervalSeconds} seconds (${intervalSeconds / 60} minutes)`);
      console.log(`  - Complete Intervals: ${completeIntervals}`);
      console.log(`  - Coins Per Interval: ${coinsPerInterval}`);
      console.log(`  - Potential Coins: ${potentialCoins}`);
      console.log(`  - Max Coins Allowed: ${maxCoins}`);
      console.log(`  - Should Have Coins: ${shouldHaveCoins}`);
      console.log(`  - Existing Coins: ${existingCoins}`);
      console.log(`  - Coins To Award: ${Math.max(0, shouldHaveCoins - existingCoins)}`);
      
      if (shouldHaveCoins > existingCoins) {
        console.log(`\n❌ USER 2 SHOULD HAVE RECEIVED ${shouldHaveCoins - existingCoins} MORE COINS!`);
      }
    }
    
    // 5. Additional Checks
    console.log('\n\n🔍 ADDITIONAL CHECKS:\n');
    
    // Check for any learning awards without tool_id filter
    const allAwards2Result = await API.graphql(
      graphqlOperation(listAwards, {
        filter: {
          user_sub: { eq: USER2.userSub },
          organizationID: { eq: USER2.organizationId },
          type: { eq: 'LEARNING_TIME_MILESTONE' },
          _deleted: { ne: true }
        },
        limit: 1000
      })
    );
    
    const allAwards2 = allAwards2Result.data.listAwards.items;
    
    console.log(`Total Learning Awards for User 2 (all tools): ${allAwards2.length}`);
    if (allAwards2.length > 0) {
      console.log('Awards by tool_id:');
      const byToolId = {};
      allAwards2.forEach(award => {
        const toolId = award.tool_id || 'NO_TOOL_ID';
        byToolId[toolId] = (byToolId[toolId] || 0) + award.coins;
      });
      Object.entries(byToolId).forEach(([toolId, coins]) => {
        console.log(`  - ${toolId}: ${coins} coins`);
      });
    }
    
    // Check if organization settings are null/undefined
    console.log('\n\n⚠️  POTENTIAL ISSUES:\n');
    
    if (org2.learningCoinsEnabled === null || org2.learningCoinsEnabled === undefined) {
      console.log('❌ User 2 organization has NULL/undefined learningCoinsEnabled!');
    }
    
    if (!org2.learningCoinInterval) {
      console.log('❌ User 2 organization has NULL/undefined learningCoinInterval!');
    }
    
    if (!org2.learningCoinsPerInterval) {
      console.log('❌ User 2 organization has NULL/undefined learningCoinsPerInterval!');
    }
    
    if (progress2.length === 0) {
      console.log('❌ User 2 has NO learning progress record for this tool!');
    } else if (!progress2[0].totalTimeSpent || progress2[0].totalTimeSpent === 0) {
      console.log('❌ User 2 has 0 seconds of totalTimeSpent!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// To use this in your app, you can call it from a component or console:
// import { debugLearningAwards } from './debug-learning-awards';
// debugLearningAwards();