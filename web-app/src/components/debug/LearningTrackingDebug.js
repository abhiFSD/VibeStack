import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Alert, Table } from 'react-bootstrap';
import { API, graphqlOperation } from 'aws-amplify';
import { useUser } from '../../contexts/UserContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { learningProgressesByOrganizationID, learningSessionsByOrganizationIDAndStartTime } from '../../graphql/queries';

const LearningTrackingDebug = () => {
  const { user: currentUser } = useUser();
  const { activeOrganization: currentOrganization } = useOrganization();
  const [debugData, setDebugData] = useState({
    localStorage: {},
    progressRecords: [],
    sessionRecords: []
  });
  const [loading, setLoading] = useState(false);

  const refreshDebugData = async () => {
    setLoading(true);
    try {
      // Check localStorage for learning keys
      const localStorageData = {};
      const storageKeys = Object.keys(localStorage);
      const learningKeys = storageKeys.filter(key => key.startsWith('learning_'));
      
      learningKeys.forEach(key => {
        localStorageData[key] = localStorage.getItem(key);
      });

      // Fetch progress records
      let progressRecords = [];
      if (currentOrganization?.id && currentUser?.attributes?.sub) {
        const progressResponse = await API.graphql(
          graphqlOperation(learningProgressesByOrganizationID, {
            organizationID: currentOrganization.id,
            filter: {
              userSub: { eq: currentUser.attributes.sub },
              _deleted: { ne: true }
            }
          })
        );
        progressRecords = progressResponse.data.learningProgressesByOrganizationID.items;
      }

      // Fetch session records
      let sessionRecords = [];
      if (currentOrganization?.id && currentUser?.attributes?.sub) {
        const sessionResponse = await API.graphql(
          graphqlOperation(learningSessionsByOrganizationIDAndStartTime, {
            organizationID: currentOrganization.id,
            filter: {
              userSub: { eq: currentUser.attributes.sub },
              _deleted: { ne: true }
            }
          })
        );
        sessionRecords = sessionResponse.data.learningSessionsByOrganizationIDAndStartTime.items;
      }

      setDebugData({
        localStorage: localStorageData,
        progressRecords,
        sessionRecords
      });

    } catch (error) {
      console.error('Error fetching debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDebugData();
  }, [currentOrganization, currentUser]);

  const clearAllLearningStorage = () => {
    const storageKeys = Object.keys(localStorage);
    const learningKeys = storageKeys.filter(key => key.startsWith('learning_'));
    
    learningKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    });
    
    refreshDebugData();
    alert(`Cleared ${learningKeys.length} learning storage keys`);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Learning Tracking Debug</h2>
        <div>
          <Button variant="outline-primary" onClick={refreshDebugData} disabled={loading} className="me-2">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button variant="outline-danger" onClick={clearAllLearningStorage}>
            Clear Storage
          </Button>
        </div>
      </div>

      <Row>
        {/* LocalStorage Debug */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>LocalStorage Keys ({Object.keys(debugData.localStorage).length})</h5>
            </Card.Header>
            <Card.Body>
              {Object.keys(debugData.localStorage).length === 0 ? (
                <Alert variant="info">No learning-related localStorage keys found</Alert>
              ) : (
                <Table size="sm">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(debugData.localStorage).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {key}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Progress Records */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Progress Records ({debugData.progressRecords.length})</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {debugData.progressRecords.length === 0 ? (
                <Alert variant="info">No progress records found</Alert>
              ) : (
                <Table size="sm">
                  <thead>
                    <tr>
                      <th>Learning ID</th>
                      <th>Total Time</th>
                      <th>Progress</th>
                      <th>Last Accessed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.progressRecords.map((record) => (
                      <tr key={record.id}>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {record.learningID?.substring(0, 8)}...
                        </td>
                        <td>{formatTime(record.totalTimeSpent || 0)}</td>
                        <td>{record.completionPercentage || 0}%</td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(record.lastAccessedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Session Records */}
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5>Session Records ({debugData.sessionRecords.length})</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {debugData.sessionRecords.length === 0 ? (
                <Alert variant="info">No session records found</Alert>
              ) : (
                <Table size="sm">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Learning ID</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Duration</th>
                      <th>Sections Viewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugData.sessionRecords
                      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
                      .map((record) => (
                      <tr key={record.id}>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {record.id?.substring(0, 8)}...
                        </td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                          {record.learningID?.substring(0, 8)}...
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {new Date(record.startTime).toLocaleString()}
                        </td>
                        <td style={{ fontSize: '12px' }}>
                          {record.endTime ? new Date(record.endTime).toLocaleString() : 'Active'}
                        </td>
                        <td>{record.duration ? formatTime(record.duration) : 'N/A'}</td>
                        <td>{record.sectionsViewed?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Alert variant="info">
            <Alert.Heading>Debug Information</Alert.Heading>
            <p>
              <strong>Current User:</strong> {currentUser?.attributes?.sub}<br/>
              <strong>Current Organization:</strong> {currentOrganization?.id}<br/>
              <strong>LocalStorage Keys Pattern:</strong> learning_[learningId]_[userSub]_[key]
            </p>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default LearningTrackingDebug;