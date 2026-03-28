import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API, Auth } from 'aws-amplify';
import { Card, Container, Badge, Button } from 'react-bootstrap';
import { format, parseISO } from 'date-fns';
import * as queries from '../../graphql/queries';

const ActionItemsByDate = () => {
  const { date } = useParams();
  const [actionItems, setActionItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActionItems();
  }, [date]);

  const fetchActionItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await Auth.currentAuthenticatedUser();
      const currentUserSub = user.attributes.sub;

      const response = await API.graphql({
        query: queries.listActionItems,
        variables: {
          filter: {
            user_sub: { eq: currentUserSub },
            duedate: { eq: date }
          }
        }
      });

      const items = response.data.listActionItems.items.filter(item => !item._deleted);
      setActionItems(items);
    } catch (error) {
      console.error('Error fetching action items:', error);
      setError('Failed to load action items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      0: { text: 'To Do', variant: 'secondary' },
      1: { text: 'In Progress', variant: 'primary' },
      2: { text: 'In Review', variant: 'warning' },
      3: { text: 'Done', variant: 'success' }
    };

    const { text, variant } = statusMap[status] || { text: 'Unknown', variant: 'light' };
    return <Badge bg={variant}>{text}</Badge>;
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Action Items for {format(parseISO(date), 'MMMM d, yyyy')}</h2>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <Card className="mb-4">
          <Card.Body>
            <p className="text-danger">{error}</p>
            <Button variant="primary" onClick={fetchActionItems}>
              Retry
            </Button>
          </Card.Body>
        </Card>
      ) : actionItems.length === 0 ? (
        <Card>
          <Card.Body>
            <p className="text-center mb-0">No action items found for this date.</p>
          </Card.Body>
        </Card>
      ) : (
        actionItems.map((item) => (
          <Card key={item.id} className="mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <Card.Title>{item.title}</Card.Title>
                  <Card.Text>{item.description}</Card.Text>
                  {item.assignees && item.assignees.length > 0 && (
                    <div className="mt-2">
                      <strong>Assignees:</strong>{' '}
                      {item.assignees.join(', ')}
                    </div>
                  )}
                </div>
                <div>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default ActionItemsByDate; 