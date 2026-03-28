#!/usr/bin/env node

/**
 * Quick Test Runner for VibeStack Pro Subscription System
 * 
 * This script provides a simple way to run all test suites or individual tests
 * with proper environment setup and error handling.
 * 
 * Usage:
 *   node quick-test-runner.js [options]
 *   
 * Options:
 *   --all                    Run all test suites
 *   --subscription          Run subscription creation tests only
 *   --upgrade-downgrade     Run upgrade/downgrade tests only  
 *   --webhook               Run webhook tests only
 *   --dry-run               Validate configuration without running tests
 *   --help                  Show this help message
 */

const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  requiredEnvVars: [
    'API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT',
    'API_LFAPI_GRAPHQLAPIKEYOUTPUT',
    'STRIPE_SECRET_KEY',
    'REACT_APP_STRIPE_PUBLISHABLE_KEY'
  ],
  optionalEnvVars: [
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_WEBHOOK_ENDPOINT'
  ],
  testFiles: {
    subscription: './subscription-test-suite.js',
    'upgrade-downgrade': './subscription-upgrade-downgrade-test.js',
    webhook: './webhook-test-suite.js'
  }
};

// Utility functions
function printHeader(title) {
  const line = '='.repeat(60);
  console.log(`\n${line}`);
  console.log(`🚀 ${title}`);
  console.log(`${line}\n`);
}

function printSection(title) {
  console.log(`\n📋 ${title}`);
  console.log('-'.repeat(40));
}

function checkEnvironment() {
  printSection('Environment Check');
  
  let allValid = true;
  const missingRequired = [];
  const missingOptional = [];
  
  // Check required environment variables
  CONFIG.requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: configured`);
    } else {
      console.log(`❌ ${varName}: missing`);
      missingRequired.push(varName);
      allValid = false;
    }
  });
  
  // Check optional environment variables
  CONFIG.optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: configured`);
    } else {
      console.log(`⚠️  ${varName}: missing (optional)`);
      missingOptional.push(varName);
    }
  });
  
  if (!allValid) {
    console.log(`\n❌ Missing required environment variables:`);
    missingRequired.forEach(varName => {
      console.log(`   export ${varName}="your-value-here"`);
    });
  }
  
  if (missingOptional.length > 0) {
    console.log(`\n⚠️  Missing optional environment variables (some tests may be skipped):`);
    missingOptional.forEach(varName => {
      console.log(`   export ${varName}="your-value-here"`);
    });
  }
  
  return allValid;
}

function checkTestFiles() {
  printSection('Test File Check');
  
  let allExist = true;
  
  Object.entries(CONFIG.testFiles).forEach(([name, filePath]) => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${name}: ${filePath}`);
    } else {
      console.log(`❌ ${name}: ${filePath} (not found)`);
      allExist = false;
    }
  });
  
  return allExist;
}

function checkNodeVersion() {
  printSection('Node.js Version Check');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].slice(1));
  
  console.log(`Node.js version: ${nodeVersion}`);
  
  if (majorVersion >= 14) {
    console.log('✅ Node.js version is compatible');
    return true;
  } else {
    console.log('❌ Node.js version 14+ is required');
    return false;
  }
}

function runTest(testName, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running ${testName} tests...`);
    console.log(`Command: node ${filePath}\n`);
    
    const child = spawn('node', [filePath], {
      stdio: 'inherit',
      cwd: __dirname
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${testName} tests completed successfully`);
        resolve({ testName, success: true, exitCode: code });
      } else {
        console.log(`\n❌ ${testName} tests failed with exit code ${code}`);
        resolve({ testName, success: false, exitCode: code });
      }
    });
    
    child.on('error', (error) => {
      console.log(`\n❌ Error running ${testName} tests: ${error.message}`);
      reject({ testName, success: false, error: error.message });
    });
  });
}

async function runAllTests() {
  const results = [];
  
  for (const [testName, filePath] of Object.entries(CONFIG.testFiles)) {
    try {
      const result = await runTest(testName, filePath);
      results.push(result);
      
      // Wait between test suites to avoid overwhelming the system
      if (testName !== 'webhook') { // Don't wait after the last test
        console.log('\n⏱️  Waiting 5 seconds before next test suite...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      results.push(error);
    }
  }
  
  return results;
}

function printSummary(results) {
  printHeader('Test Summary');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${total}`);
  console.log(`   ❌ Failed: ${failed}/${total}`);
  console.log(`   📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log(`\n❌ Failed Test Suites:`);
    results.filter(r => !r.success).forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.testName}: Exit code ${result.exitCode || 'unknown'}`);
    });
  }
  
  console.log('\n📁 Check the following files for detailed results:');
  console.log('   - subscription-test-report.json');
  console.log('   - upgrade-downgrade-test-report.json');
  console.log('   - webhook-test-report.json');
}

function showHelp() {
  console.log(`
VibeStack Pro Subscription Test Runner

Usage:
  node quick-test-runner.js [options]

Options:
  --all                    Run all test suites (default)
  --subscription          Run subscription creation tests only
  --upgrade-downgrade     Run upgrade/downgrade tests only  
  --webhook               Run webhook tests only
  --dry-run               Validate configuration without running tests
  --help                  Show this help message

Environment Variables Required:
  API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT    Your GraphQL API endpoint
  API_LFAPI_GRAPHQLAPIKEYOUTPUT         Your GraphQL API key
  STRIPE_SECRET_KEY                     Your Stripe secret key (test mode)
  REACT_APP_STRIPE_PUBLISHABLE_KEY      Your Stripe publishable key (test mode)

Environment Variables Optional:
  STRIPE_WEBHOOK_SECRET                 For webhook signature verification
  STRIPE_WEBHOOK_ENDPOINT              Your webhook endpoint URL

Examples:
  node quick-test-runner.js --all
  node quick-test-runner.js --subscription
  node quick-test-runner.js --dry-run
  
Report Issues:
  If you encounter issues, check the generated JSON reports for detailed information.
`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const options = {
    all: args.includes('--all') || args.length === 0,
    subscription: args.includes('--subscription'),
    upgradeDowngrade: args.includes('--upgrade-downgrade'),
    webhook: args.includes('--webhook'),
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help')
  };
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  printHeader('VibeStack Pro Subscription Test Runner');
  
  // Pre-flight checks
  const nodeOk = checkNodeVersion();
  const envOk = checkEnvironment();
  const filesOk = checkTestFiles();
  
  if (!nodeOk || !filesOk) {
    console.log('\n❌ Pre-flight checks failed. Please resolve the issues above.');
    process.exit(1);
  }
  
  if (!envOk) {
    console.log('\n❌ Environment configuration is incomplete.');
    console.log('Please set the required environment variables and try again.');
    process.exit(1);
  }
  
  if (options.dryRun) {
    console.log('\n✅ Dry run completed successfully. All checks passed.');
    console.log('You can now run the tests with: node quick-test-runner.js --all');
    process.exit(0);
  }
  
  // Determine which tests to run
  let testsToRun = [];
  
  if (options.all) {
    testsToRun = Object.entries(CONFIG.testFiles);
  } else {
    if (options.subscription) testsToRun.push(['subscription', CONFIG.testFiles.subscription]);
    if (options.upgradeDowngrade) testsToRun.push(['upgrade-downgrade', CONFIG.testFiles['upgrade-downgrade']]);
    if (options.webhook) testsToRun.push(['webhook', CONFIG.testFiles.webhook]);
  }
  
  if (testsToRun.length === 0) {
    console.log('\n⚠️  No tests specified. Use --all or specify individual test suites.');
    showHelp();
    process.exit(1);
  }
  
  console.log(`\n🎯 Running ${testsToRun.length} test suite(s)...`);
  
  // Run the tests
  const startTime = Date.now();
  const results = [];
  
  for (const [testName, filePath] of testsToRun) {
    try {
      const result = await runTest(testName, filePath);
      results.push(result);
      
      // Wait between test suites to avoid overwhelming the system
      if (testName !== testsToRun[testsToRun.length - 1][0]) {
        console.log('\n⏱️  Waiting 5 seconds before next test suite...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      results.push(error);
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print summary
  printSummary(results);
  console.log(`\n⏱️  Total execution time: ${duration} seconds`);
  
  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkEnvironment,
  checkTestFiles,
  runTest,
  runAllTests
};