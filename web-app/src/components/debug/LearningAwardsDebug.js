import React, { useState } from 'react';
import { Container, Card, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { API, graphqlOperation } from 'aws-amplify';
import { getOrganization, listLearningProgresses, listAwards } from '../../graphql/queries';

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

const LearningAwardsDebug = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const debugLearningAwards = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const debugData = {
        organizations: {},
        progress: {},
        awards: {},
        calculations: {},
        issues: []
      };

      // 1. Check Organization Settings
      console.log('Fetching organization settings...');
      
      const org1Result = await API.graphql(graphqlOperation(getOrganization, { id: USER1.organizationId }));
      const org2Result = await API.graphql(graphqlOperation(getOrganization, { id: USER2.organizationId }));
      
      debugData.organizations.user1 = org1Result.data.getOrganization;
      debugData.organizations.user2 = org2Result.data.getOrganization;

      // 2. Check Learning Progress
      console.log('Fetching learning progress...');
      
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
      
      debugData.progress.user1 = progress1Result.data.listLearningProgresses.items;
      debugData.progress.user2 = progress2Result.data.listLearningProgresses.items;

      // 3. Check Awards
      console.log('Fetching awards...');
      
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
      
      debugData.awards.user1 = awards1Result.data.listAwards.items;
      debugData.awards.user2 = awards2Result.data.listAwards.items;

      // 4. Calculate Expected Awards for User 2
      if (debugData.progress.user2.length > 0 && debugData.organizations.user2.learningCoinsEnabled) {
        const org = debugData.organizations.user2;
        const progress = debugData.progress.user2[0];
        
        const totalTime = progress.totalTimeSpent || 0;
        const intervalSeconds = org.learningCoinInterval || 120;
        const coinsPerInterval = org.learningCoinsPerInterval || 5;
        const maxCoins = org.learningMaxCoinsPerSession || 20;
        
        const completeIntervals = Math.floor(totalTime / intervalSeconds);
        const potentialCoins = completeIntervals * coinsPerInterval;
        const shouldHaveCoins = Math.min(potentialCoins, maxCoins);
        const existingCoins = debugData.awards.user2.reduce((sum, award) => sum + (award.coins || 0), 0);
        
        debugData.calculations.user2 = {
          totalTime,
          totalTimeMinutes: totalTime / 60,
          intervalSeconds,
          intervalMinutes: intervalSeconds / 60,
          completeIntervals,
          coinsPerInterval,
          potentialCoins,
          maxCoins,
          shouldHaveCoins,
          existingCoins,
          coinsToAward: Math.max(0, shouldHaveCoins - existingCoins)
        };
      }

      // 5. Check for issues
      const org2 = debugData.organizations.user2;
      
      if (org2.learningCoinsEnabled === null || org2.learningCoinsEnabled === undefined) {
        debugData.issues.push('User 2 organization has NULL/undefined learningCoinsEnabled');
      }
      
      if (!org2.learningCoinInterval) {
        debugData.issues.push('User 2 organization has NULL/undefined learningCoinInterval');
      }
      
      if (!org2.learningCoinsPerInterval) {
        debugData.issues.push('User 2 organization has NULL/undefined learningCoinsPerInterval');
      }
      
      if (debugData.progress.user2.length === 0) {
        debugData.issues.push('User 2 has NO learning progress record for this tool');
      } else if (!debugData.progress.user2[0].totalTimeSpent || debugData.progress.user2[0].totalTimeSpent === 0) {
        debugData.issues.push('User 2 has 0 seconds of totalTimeSpent');
      }

      setResults(debugData);
      
    } catch (err) {
      console.error('Debug error:', err);
      setError(err.message || 'Failed to debug learning awards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-4">
      <Card>
        <Card.Header>
          <h4>🔍 Learning Awards Debug Tool</h4>
          <p className="mb-0 text-muted">Debug learning awards issue between User 1 and User 2</p>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger">
              <strong>Error:</strong> {error}
            </Alert>
          )}
          
          <Button 
            variant="primary" 
            onClick={debugLearningAwards}
            disabled={loading}
            className="mb-3"
          >
            {loading && <Spinner animation="spin" size="sm" className="me-2" />}
            {loading ? 'Debugging...' : 'Run Debug Analysis'}
          </Button>

          {results && (
            <div>
              {/* Organization Settings */}
              <Card className="mb-3">
                <Card.Header><h5>📋 Organization Settings</h5></Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>{USER1.label}</h6>
                      <ul className="small">
                        <li><strong>Name:</strong> {results.organizations.user1.name}</li>
                        <li><strong>Learning Coins Enabled:</strong> {String(results.organizations.user1.learningCoinsEnabled)}</li>
                        <li><strong>Coins Per Interval:</strong> {results.organizations.user1.learningCoinsPerInterval}</li>
                        <li><strong>Interval:</strong> {results.organizations.user1.learningCoinInterval} seconds ({results.organizations.user1.learningCoinInterval / 60} minutes)</li>
                        <li><strong>Max Coins:</strong> {results.organizations.user1.learningMaxCoinsPerSession}</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <h6>{USER2.label}</h6>
                      <ul className="small">
                        <li><strong>Name:</strong> {results.organizations.user2.name}</li>
                        <li><strong>Learning Coins Enabled:</strong> {String(results.organizations.user2.learningCoinsEnabled)}</li>
                        <li><strong>Coins Per Interval:</strong> {results.organizations.user2.learningCoinsPerInterval}</li>
                        <li><strong>Interval:</strong> {results.organizations.user2.learningCoinInterval} seconds ({results.organizations.user2.learningCoinInterval / 60} minutes)</li>
                        <li><strong>Max Coins:</strong> {results.organizations.user2.learningMaxCoinsPerSession}</li>
                      </ul>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Learning Progress */}
              <Card className="mb-3">
                <Card.Header><h5>📊 Learning Progress</h5></Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>{USER1.label} ({results.progress.user1.length} records)</h6>
                      {results.progress.user1.map((prog, idx) => (
                        <div key={idx} className="small mb-2">
                          <strong>Learning ID:</strong> {prog.learningID}<br/>
                          <strong>Time:</strong> {prog.totalTimeSpent}s ({(prog.totalTimeSpent / 60).toFixed(2)} min)<br/>
                          <strong>Updated:</strong> {new Date(prog.updatedAt).toLocaleString()}
                        </div>
                      ))}
                    </Col>
                    <Col md={6}>
                      <h6>{USER2.label} ({results.progress.user2.length} records)</h6>
                      {results.progress.user2.map((prog, idx) => (
                        <div key={idx} className="small mb-2">
                          <strong>Learning ID:</strong> {prog.learningID}<br/>
                          <strong>Time:</strong> {prog.totalTimeSpent}s ({(prog.totalTimeSpent / 60).toFixed(2)} min)<br/>
                          <strong>Updated:</strong> {new Date(prog.updatedAt).toLocaleString()}
                        </div>
                      ))}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Awards */}
              <Card className="mb-3">
                <Card.Header><h5>🏆 Learning Awards</h5></Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <h6>{USER1.label} ({results.awards.user1.length} awards)</h6>
                      {results.awards.user1.map((award, idx) => (
                        <div key={idx} className="small mb-2">
                          <strong>{award.title}</strong><br/>
                          Coins: {award.coins} | Tool: {award.tool_id}<br/>
                          Date: {new Date(award.date).toLocaleString()}
                        </div>
                      ))}
                    </Col>
                    <Col md={6}>
                      <h6>{USER2.label} ({results.awards.user2.length} awards)</h6>
                      {results.awards.user2.map((award, idx) => (
                        <div key={idx} className="small mb-2">
                          <strong>{award.title}</strong><br/>
                          Coins: {award.coins} | Tool: {award.tool_id}<br/>
                          Date: {new Date(award.date).toLocaleString()}
                        </div>
                      ))}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Calculations */}
              {results.calculations.user2 && (
                <Card className="mb-3">
                  <Card.Header><h5>🧮 Award Calculations (User 2)</h5></Card.Header>
                  <Card.Body>
                    <ul className="small">
                      <li><strong>Total Time:</strong> {results.calculations.user2.totalTime} seconds ({results.calculations.user2.totalTimeMinutes.toFixed(2)} minutes)</li>
                      <li><strong>Interval:</strong> {results.calculations.user2.intervalSeconds} seconds ({results.calculations.user2.intervalMinutes} minutes)</li>
                      <li><strong>Complete Intervals:</strong> {results.calculations.user2.completeIntervals}</li>
                      <li><strong>Coins Per Interval:</strong> {results.calculations.user2.coinsPerInterval}</li>
                      <li><strong>Potential Coins:</strong> {results.calculations.user2.potentialCoins}</li>
                      <li><strong>Max Coins Allowed:</strong> {results.calculations.user2.maxCoins}</li>
                      <li><strong>Should Have Coins:</strong> {results.calculations.user2.shouldHaveCoins}</li>
                      <li><strong>Existing Coins:</strong> {results.calculations.user2.existingCoins}</li>
                      <li><strong>Coins To Award:</strong> {results.calculations.user2.coinsToAward}</li>
                    </ul>
                    
                    {results.calculations.user2.coinsToAward > 0 && (
                      <Alert variant="danger">
                        <strong>❌ USER 2 SHOULD HAVE RECEIVED {results.calculations.user2.coinsToAward} MORE COINS!</strong>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* Issues */}
              {results.issues.length > 0 && (
                <Card>
                  <Card.Header><h5>⚠️ Potential Issues</h5></Card.Header>
                  <Card.Body>
                    {results.issues.map((issue, idx) => (
                      <Alert key={idx} variant="warning" className="py-2 mb-2">
                        ❌ {issue}
                      </Alert>
                    ))}
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LearningAwardsDebug;