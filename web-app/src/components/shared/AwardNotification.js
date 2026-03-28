import React, { useState, useEffect } from 'react';
import { Badge, Button, Overlay, Popover, ListGroup, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faCoins } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { getUnreadAwardsCount } from '../../utils/awards';
import { getUserCoins } from '../../utils/awardDefinitions';
import { API, Auth } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as subscriptions from '../../graphql/subscriptions';
import { useOrganization } from '../../contexts/OrganizationContext';

const AwardNotification = ({ hideCoinsDisplay = false }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalAwards, setTotalAwards] = useState(0);
  const [userCoins, setUserCoins] = useState(0);
  const [unreadAwards, setUnreadAwards] = useState([]);
  const [show, setShow] = useState(false);
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { activeOrganization } = useOrganization();

  useEffect(() => {
    let subscriptions = [];
    
    if (activeOrganization?.id) {
      fetchUnreadCount();
      fetchTotalAwards();
      fetchUserCoins();
      
      // Set up subscriptions
      setupSubscriptions().then(subs => {
        subscriptions = subs;
      });
      
      // Periodic refresh as backup
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchTotalAwards();
        fetchUserCoins();
      }, 30000);
      
      return () => {
        clearInterval(interval);
        // Cleanup subscriptions
        if (subscriptions.length > 0) {
          subscriptions.forEach(sub => {
            if (sub && typeof sub.unsubscribe === 'function') {
              sub.unsubscribe();
            }
          });
        }
      };
    }
  }, [activeOrganization]);

  const setupSubscriptions = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Subscribe to user coins updates
      const coinsSubscription = API.graphql({
        query: subscriptions.onUpdateUserCoins,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: activeOrganization.id }
          }
        }
      }).subscribe({
        next: (data) => {
          const coins = data.value.data.onUpdateUserCoins.total_coins;
          setUserCoins(coins);
        },
        error: error => console.error('Error in coins subscription:', error)
      });

      // Subscribe to new awards
      const awardsSubscription = API.graphql({
        query: subscriptions.onCreateAwards,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: activeOrganization.id }
          }
        }
      }).subscribe({
        next: () => {
          fetchUnreadCount();
          fetchTotalAwards();
          fetchUserCoins();
        },
        error: error => console.error('Error in awards subscription:', error)
      });

      return [coinsSubscription, awardsSubscription];
    } catch (error) {
      console.error('Error setting up subscriptions:', error);
      return [];
    }
  };

  const fetchUserCoins = async () => {
    if (!activeOrganization?.id) return;
    try {
      const user = await Auth.currentAuthenticatedUser();
      const coins = await getUserCoins(user.attributes.sub, activeOrganization.id);
      setUserCoins(coins);
    } catch (error) {
      console.error('Error fetching user coins:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!activeOrganization?.id) return;
    const count = await getUnreadAwardsCount(activeOrganization.id);
    setUnreadCount(count);
  };

  const fetchTotalAwards = async () => {
    if (!activeOrganization?.id) return;
    try {
      const user = await Auth.currentAuthenticatedUser();
      const result = await API.graphql({
        query: queries.listAwards,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }
      });
      const totalCount = result.data.listAwards.items.length;
      setTotalAwards(totalCount);
    } catch (error) {
      console.error('Error fetching total awards:', error);
    }
  };

  const fetchUnreadAwards = async () => {
    if (!activeOrganization?.id) {
      console.warn('No active organization ID available');
      return;
    }
    
    try {
      setLoading(true);
      const user = await Auth.currentAuthenticatedUser();
      const result = await API.graphql({
        query: queries.listAwards,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }
      });

      if (!result.data?.listAwards?.items) {
        console.warn('No awards data found in response');
        setUnreadAwards([]);
        return;
      }

      const awards = result.data.listAwards.items
        .filter(award => award.organizationID && !award._deleted);

      // Sort by date, most recent first and filter to last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const recentAwards = awards.filter(award => {
        const awardDate = new Date(award.date || award.createdAt);
        return awardDate > oneDayAgo;
      });

      recentAwards.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      setUnreadAwards(recentAwards);
    } catch (error) {
      console.error('Error fetching unread awards:', error);
      setUnreadAwards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (event) => {
    setShow(!show);
    setTarget(event.target);
    if (!show) {
      await fetchUnreadAwards();
    }
  };

  const handleViewAll = () => {
    setShow(false);
    navigate('/awards');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="d-flex align-items-center me-2">
      {!hideCoinsDisplay && (
        <div className="me-3 d-flex align-items-center">
          <FontAwesomeIcon icon={faCoins} className="text-warning me-2" />
          <span className="fw-semibold text-white">{userCoins}</span>
        </div>
      )}
      <div className="position-relative d-inline-block">
        <div 
          className="user-tokens d-flex align-items-center py-1 px-3 rounded position-relative"
          onClick={handleClick}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faTrophy} className="text-warning me-2" size="lg" />
          <span className="text-white fw-semibold">{totalAwards}</span>
          {unreadCount > 0 && (
            <Badge 
              bg="danger" 
              className="position-absolute"
              style={{ 
                top: '-8px', 
                right: '-8px',
                fontSize: '0.7rem',
                padding: '0.25em 0.4em'
              }}
            >
              {unreadCount}
            </Badge>
          )}
        </div>

        <Overlay
          show={show}
          target={target}
          placement="bottom"
          rootClose
          onHide={() => setShow(false)}
        >
          <Popover style={{ minWidth: '300px' }}>
            <Popover.Header>
              <div className="d-flex justify-content-between align-items-center">
                <span>Recent Awards</span>
                {unreadCount > 0 && (
                  <Badge bg="danger" pill>
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </Popover.Header>
            <Popover.Body className="p-0">
              {loading ? (
                <div className="text-center p-3">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : unreadAwards.length > 0 ? (
                <ListGroup variant="flush">
                  {unreadAwards.map((award) => (
                    <ListGroup.Item key={award.id} className="border-bottom">
                      <div className="d-flex align-items-start">
                        <FontAwesomeIcon icon={faTrophy} className="text-warning mt-1 me-2" />
                        <div className="flex-grow-1">
                          <div className="fw-semibold">{award.title}</div>
                          <small className="text-muted d-block">
                            {formatDate(award.date || award.createdAt)}
                          </small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                  <ListGroup.Item className="text-center">
                    <Button 
                      variant="link" 
                      className="text-decoration-none"
                      onClick={handleViewAll}
                    >
                      View All Awards
                    </Button>
                  </ListGroup.Item>
                </ListGroup>
              ) : (
                <div className="text-center p-3">
                  <p className="text-muted mb-2">No new awards</p>
                  <Button 
                    variant="link" 
                    className="text-decoration-none"
                    onClick={handleViewAll}
                  >
                    View All Awards
                  </Button>
                </div>
              )}
            </Popover.Body>
          </Popover>
        </Overlay>
      </div>
    </div>
  );
};

export default AwardNotification; 