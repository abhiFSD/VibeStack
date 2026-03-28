import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Nav, Table, Badge } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy, faTrash, faCoins, faWallet, faMoneyBillTransfer, faUsers, faMedal, faRankingStar } from '@fortawesome/free-solid-svg-icons';
import Lottie from 'lottie-react';
import avocadoAnimation from '../../assets/animation/Avocado.json';
import { getUserCoins } from '../../utils/awardDefinitions';
import { getUserPurchases } from '../../utils/shop';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useUser } from '../../contexts/UserContext';
import UserAvatar from '../shared/UserAvatar';
import { getUserByCognitoID, getUserByEmail } from '../../utils/userSync';

const Awards = () => {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCoins, setTotalCoins] = useState(0);
  const [availableCoins, setAvailableCoins] = useState(0);
  const [spentCoins, setSpentCoins] = useState(0);
  const { activeOrganization } = useOrganization();
  const { dbUser, user } = useUser();
  const [activeTab, setActiveTab] = useState('awards');
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);

  useEffect(() => {
    if (activeOrganization?.id) {
      fetchAwards();
      checkLeaderboardEnabled();
    }
  }, [activeOrganization]);

  // Check if leaderboard is enabled for this organization
  const checkLeaderboardEnabled = async () => {
    try {
      const orgResult = await API.graphql({
        query: queries.getOrganization,
        variables: { id: activeOrganization.id }
      });
      
      const org = orgResult.data.getOrganization;
      // Set to true by default if the field is not defined (for backward compatibility)
      setLeaderboardEnabled(org.leaderboardEnabled !== false);
    } catch (error) {
      console.error('Error checking leaderboard status:', error);
      // Default to enabled if there's an error
      setLeaderboardEnabled(true);
    }
  };

  // Load leaderboard data when tab changes to 'leaderboard'
  useEffect(() => {
    if (activeTab === 'leaderboard' && activeOrganization?.id && leaderboardEnabled) {
      fetchLeaderboard();
    }
  }, [activeTab, activeOrganization, leaderboardEnabled]);

  const fetchLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      if (!activeOrganization?.id) {
        console.error('No active organization ID available');
        return;
      }

      // Fetch all organization members
      const membersResult = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            status: { eq: 'ACTIVE' },
            _deleted: { ne: true }
          }
        }
      });

      const members = membersResult.data.listOrganizationMembers.items;
      
      // Fetch all departments for the organization
      const departmentsResult = await API.graphql({
        query: queries.listDepartments,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }
      });
      
      const departments = departmentsResult.data.listDepartments.items;
      const departmentsMap = {};
      departments.forEach(dept => {
        departmentsMap[dept.id] = dept.name;
      });
      
      // Fetch all user coins records for available coins
      const userCoinsResult = await API.graphql({
        query: queries.listUserCoins,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          },
          limit: 1000
        }
      });

      const userCoinsRecords = userCoinsResult.data.listUserCoins.items;
      
      // Fetch all purchases to calculate spent coins
      const purchasesResult = await API.graphql({
        query: queries.listUserPurchases,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            status: { eq: 'DELIVERED' },
            _deleted: { ne: true }
          },
          limit: 1000
        }
      });

      const allPurchases = purchasesResult.data.listUserPurchases.items;
      
      // Fetch shop items to get prices
      const shopItemsResult = await API.graphql({
        query: queries.listShopItems,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id }
          },
          limit: 1000
        }
      });
      
      const shopItems = shopItemsResult.data.listShopItems.items;
      const shopItemsMap = {};
      shopItems.forEach(item => {
        shopItemsMap[item.id] = item;
      });
      
      // Create maps for available coins and spent coins
      const availableCoinsMap = {};
      const spentCoinsMap = {};
      
      // Map available coins from UserCoins records
      userCoinsRecords.forEach(record => {
        if (record.user_sub && record.total_coins !== undefined) {
          availableCoinsMap[record.user_sub] = record.total_coins;
        }
      });
      
      // Calculate spent coins from delivered purchases
      allPurchases.forEach(purchase => {
        if (purchase.user_sub && purchase.shopItemID && shopItemsMap[purchase.shopItemID]) {
          const price = shopItemsMap[purchase.shopItemID].price || 0;
          spentCoinsMap[purchase.user_sub] = (spentCoinsMap[purchase.user_sub] || 0) + price;
        }
      });
      
      // Create leaderboard data with earned, spent, and available coins
      const leaderboardData = members.map(member => {
        // For current user, use data from context if available
        const isCurrentUser = user?.attributes?.sub === member.userSub;
        const available = availableCoinsMap[member.userSub] || 0;
        const spent = spentCoinsMap[member.userSub] || 0;
        const earned = available + spent; // Total earned = available + spent
        
        return {
          id: member.id,
          email: member.email,
          userSub: member.userSub,
          coinsEarned: earned,
          coinsAvailable: available,
          coinsSpent: spent,
          department: member.departmentID ? departmentsMap[member.departmentID] : null,
          // For current user, get from context
          firstName: isCurrentUser && dbUser ? dbUser.firstName : null,
          lastName: isCurrentUser && dbUser ? dbUser.lastName : null,
          isCurrentUser
        };
      });

      // Sort by total earned coins (highest first)
      const sortedLeaderboard = leaderboardData.sort((a, b) => b.coinsEarned - a.coinsEarned);
      setLeaderboard(sortedLeaderboard);
      
      // For non-current users, fetch their names in batches to optimize
      const nonCurrentUsers = sortedLeaderboard.filter(member => !member.isCurrentUser);
      
      // Process in smaller batches of 10 users at a time to avoid query issues
      const batchSize = 10;
      for (let i = 0; i < nonCurrentUsers.length; i += batchSize) {
        const batch = nonCurrentUsers.slice(i, i + batchSize);
        
        // Process each user in the batch individually but in parallel
        await Promise.all(batch.map(async (member) => {
          try {
            if (member.userSub) {
              const userData = await getUserByCognitoID(member.userSub);
              if (userData) {
                member.firstName = userData.firstName;
                member.lastName = userData.lastName;
              }
            }
          } catch (error) {
            console.error(`Error fetching data for user ${member.email}:`, error);
          }
        }));
      }
      
      // Update the leaderboard with the enhanced data
      setLeaderboard([...sortedLeaderboard]);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Log detailed error information for debugging
      if (error.errors) {
        console.error('GraphQL Errors:', error.errors);
      }
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const fetchAwards = async () => {
    try {
      if (!activeOrganization?.id) {
        console.error('No active organization ID available');
        return;
      }

      const user = await Auth.currentAuthenticatedUser();
      
      // Fetch user's awards for the current organization
      const awardsResult = await API.graphql({
        query: queries.listAwards,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          }
        }
      });

      // Fetch award definitions for the current organization
      const awardDefsResult = await API.graphql({
        query: queries.listAwardDefinitions,
        variables: {
          filter: {
            organizationID: { eq: activeOrganization.id },
            _deleted: { ne: true }
          },
          limit: 1000
        }
      });

      const userAwards = awardsResult.data.listAwards.items;
      const awardDefs = awardDefsResult.data.listAwardDefinitions.items;

      // Sort awards by date (most recent first)
      const sortedAwards = userAwards.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );

      setAwards(sortedAwards);

      // Get available coins for the current organization
      const availableCoins = await getUserCoins(user.attributes.sub, activeOrganization.id);
      setAvailableCoins(availableCoins);

      // Get user's purchases to calculate spent coins
      const userPurchases = await getUserPurchases(activeOrganization.id);
      // Only count delivered purchases
      const deliveredPurchases = userPurchases.filter(p => p.status === 'DELIVERED' && p.shopItem);
      const totalSpent = deliveredPurchases.reduce((sum, purchase) => sum + (purchase.shopItem.price || 0), 0);
      setSpentCoins(totalSpent);

      // Calculate total earned (available + spent)
      const totalEarned = availableCoins + totalSpent;
      setTotalCoins(totalEarned);
      
    } catch (error) {
      console.error('Error fetching awards:', error);
      setError('Failed to load awards');
    } finally {
      setLoading(false);
    }
  };

  const setupSubscription = () => {
    const subscription = API.graphql({
      query: `subscription OnCreateAwards {
        onCreateAwards {
          id
          title
          date
          description
          user_sub
          tool_id
          type
          coins
          createdAt
          updatedAt
        }
      }`
    }).subscribe({
      next: () => {
        fetchAwards();
      },
      error: error => console.warn(error)
    });

    return () => subscription.unsubscribe();
  };

  const deleteAward = async (awardId) => {
    try {
      const awardToDelete = await API.graphql({
        query: queries.getAwards,
        variables: { id: awardId }
      });

      if (awardToDelete.data.getAwards) {
        await API.graphql({
          query: mutations.deleteAwards,
          variables: { 
            input: {
              id: awardId
            }
          }
        });
        setAwards(awards.filter(award => award.id !== awardId));
      }
    } catch (error) {
      console.error('Error deleting award:', error);
    }
  };

  // Helper function to render medal icon based on position
  const renderMedalIcon = (position) => {
    switch(position) {
      case 0: // Gold - 1st place
        return <FontAwesomeIcon icon={faMedal} className="text-warning" />;
      case 1: // Silver - 2nd place
        return <FontAwesomeIcon icon={faMedal} className="text-secondary" />;
      case 2: // Bronze - 3rd place
        return <FontAwesomeIcon icon={faMedal} className="text-danger" />;
      default:
        return null;
    }
  };

  if (loading && activeTab === 'awards') {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4 mt-5">
      <div className="position-relative">
        <h2 className="mb-4">
          <FontAwesomeIcon icon={faTrophy} className="me-2" />
          Your Awards
        </h2>

        <Card className="mb-4">
          <Card.Header>
            <Nav variant="tabs" className="flex-row" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="awards">
                  <FontAwesomeIcon icon={faTrophy} className="me-2" />
                  My Awards
                </Nav.Link>
              </Nav.Item>
              {leaderboardEnabled && (
                <Nav.Item>
                  <Nav.Link eventKey="leaderboard">
                    <FontAwesomeIcon icon={faRankingStar} className="me-2" />
                    Leaderboard
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>
          </Card.Header>
        </Card>

        {activeTab === 'awards' && (
          <>
            <Row className="mb-4">
              <Col md={3}>
                <Card className="bg-warning bg-opacity-25">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-warning bg-opacity-25 p-3 me-3">
                        <FontAwesomeIcon icon={faTrophy} className="text-warning" />
                      </div>
                      <div>
                        <h5 className="mb-0">Total Awards</h5>
                        <h3 className="mb-0">{awards.length}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="bg-success bg-opacity-25">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-success bg-opacity-25 p-3 me-3">
                        <FontAwesomeIcon icon={faCoins} className="text-warning" />
                      </div>
                      <div>
                        <h5 className="mb-0">Total Earned</h5>
                        <h3 className="mb-0">{totalCoins}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="bg-primary bg-opacity-25">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-primary bg-opacity-25 p-3 me-3">
                        <FontAwesomeIcon icon={faCoins} className="text-warning" />
                      </div>
                      <div>
                        <h5 className="mb-0">Available</h5>
                        <h3 className="mb-0">{availableCoins}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="bg-info bg-opacity-25">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-info bg-opacity-25 p-3 me-3">
                        <FontAwesomeIcon icon={faCoins} className="text-warning" />
                      </div>
                      <div>
                        <h5 className="mb-0">Spent</h5>
                        <h3 className="mb-0">{spentCoins}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {awards.length > 0 ? (
              <div className="timeline-container">
                <div className="timeline-line" />
                <Row className="g-4">
                  {awards.map((award) => (
                    <Col xs={12} key={award.id}>
                      <div className="d-flex align-items-start">
                        <div className="timeline-date me-4">
                          <div className="date-badge">
                            {new Date(award.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        <Card className="flex-grow-1">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="d-flex align-items-center">
                                  <FontAwesomeIcon icon={faTrophy} className="me-2 text-warning" />
                                  <h5 className="mb-0">{award.title}</h5>
                                  {award.coins && (
                                    <span className="ms-3 badge bg-warning text-dark">
                                      <FontAwesomeIcon icon={faCoins} className="me-1" />
                                      {award.coins} coins
                                    </span>
                                  )}
                                </div>
                                <p className="text-muted mt-2 mb-0">{award.description}</p>
                              </div>
                              <Button 
                                variant="link" 
                                className="text-danger p-0" 
                                onClick={() => deleteAward(award.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            ) : (
              <div className="text-center py-5">
                <div style={{ width: '200px', height: '200px', margin: 'auto' }}>
                  <Lottie
                    animationData={avocadoAnimation}
                    loop={true}
                    autoplay={true}
                  />
                </div>
                <h4 className="mt-4">No Awards Yet</h4>
                <p className="text-muted">Complete quizzes and tasks to earn awards and coins!</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'leaderboard' && (
          <Card>
            <Card.Header className="bg-white">
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faRankingStar} className="me-2 text-primary" />
                <h5 className="mb-0">Organization Leaderboard</h5>
              </div>
              <small className="text-muted mt-1">Ranking based on total coins earned, regardless of coins spent</small>
            </Card.Header>
            <Card.Body>
              {leaderboardLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : leaderboard.length > 0 ? (
                <div className="leaderboard-container">
                  {leaderboard.map((member, index) => (
                    <Card key={member.id} className={`mb-3 leaderboard-card ${index < 3 ? 'top-performer' : ''}`}>
                      <Card.Body className="p-3">
                        <Row className="align-items-center">
                          <Col xs="auto" className="pe-0">
                            <div className={`rank-indicator ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                              {index === 0 ? (
                                <>
                                  <FontAwesomeIcon icon={faTrophy} size="2x" className="trophy-icon" />
                                  <div className="rank-text">1st</div>
                                </>
                              ) : index === 1 ? (
                                <>
                                  <FontAwesomeIcon icon={faMedal} size="2x" className="medal-icon" />
                                  <div className="rank-text">2nd</div>
                                </>
                              ) : index === 2 ? (
                                <>
                                  <FontAwesomeIcon icon={faMedal} size="2x" className="medal-icon" />
                                  <div className="rank-text">3rd</div>
                                </>
                              ) : (
                                <div className="rank-number">{index + 1}</div>
                              )}
                            </div>
                          </Col>
                          <Col xs="auto">
                            <UserAvatar 
                              email={member.email}
                              userSub={member.userSub}
                              size={60}
                              squareStyle={true}
                              customColor={
                                index === 0 ? '#FFD700' : // Gold
                                index === 1 ? '#C0C0C0' : // Silver
                                index === 2 ? '#CD7F32' : // Bronze
                                '#00897b'  // Default teal
                              }
                              tooltipLabel={
                                member.firstName && member.lastName 
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.email
                              }
                            />
                          </Col>
                          <Col>
                            <div className="member-info">
                              {member.firstName && member.lastName ? (
                                <>
                                  <h5 className="mb-1">{member.firstName} {member.lastName}</h5>
                                  <small className="text-muted d-block">{member.email}</small>
                                </>
                              ) : (
                                <h5 className="mb-1">{member.email}</h5>
                              )}
                              <div className="mt-2 d-flex flex-wrap gap-2">
                                <Badge bg="success" className="coin-inline-badge">
                                  <FontAwesomeIcon icon={faCoins} className="me-1" />
                                  Earned: {member.coinsEarned}
                                </Badge>
                                <Badge bg="danger" className="coin-inline-badge">
                                  <FontAwesomeIcon icon={faMoneyBillTransfer} className="me-1" />
                                  Spent: {member.coinsSpent}
                                </Badge>
                                <Badge bg="primary" className="coin-inline-badge">
                                  <FontAwesomeIcon icon={faWallet} className="me-1" />
                                  Balance: {member.coinsAvailable}
                                </Badge>
                                {member.department && (
                                  <Badge bg="secondary" className="coin-inline-badge">
                                    <FontAwesomeIcon icon={faUsers} className="me-1" />
                                    {member.department}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faUsers} size="3x" className="text-muted mb-3" />
                  <h5>No leaderboard data available</h5>
                  <p className="text-muted">Members will appear here once they start earning coins</p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}
      </div>

      <style jsx>{`
        .timeline-container {
          position: relative;
          padding-left: 20px;
        }
        .timeline-line {
          position: absolute;
          left: 100px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: #dee2e6;
        }
        .timeline-date {
          width: 120px;
          flex-shrink: 0;
        }
        .date-badge {
          background-color: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.875rem;
          text-align: center;
        }
        .leaderboard-container {
          max-width: 100%;
        }
        .leaderboard-card {
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid #e0e0e0;
        }
        .leaderboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .leaderboard-card.top-performer {
          border-width: 2px;
        }
        .leaderboard-card:nth-child(1).top-performer {
          border-color: #FFD700;
          background-color: #fffef5;
        }
        .leaderboard-card:nth-child(2).top-performer {
          border-color: #C0C0C0;
          background-color: #fafafa;
        }
        .leaderboard-card:nth-child(3).top-performer {
          border-color: #CD7F32;
          background-color: #fffbf8;
        }
        .rank-indicator {
          width: 70px;
          height: 70px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background-color: #f8f9fa;
          margin-right: 15px;
          position: relative;
          overflow: hidden;
        }
        .rank-indicator.gold {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
        }
        .rank-indicator.silver {
          background: linear-gradient(135deg, #C0C0C0, #808080);
          color: white;
          box-shadow: 0 4px 15px rgba(192, 192, 192, 0.4);
        }
        .rank-indicator.bronze {
          background: linear-gradient(135deg, #CD7F32, #8B4513);
          color: white;
          box-shadow: 0 4px 15px rgba(205, 127, 50, 0.4);
        }
        .rank-indicator::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
          transform: rotate(45deg);
          transition: transform 0.6s;
        }
        .rank-indicator:hover::before {
          transform: rotate(45deg) translateY(100%);
        }
        .trophy-icon {
          z-index: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        .medal-icon {
          z-index: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        .rank-text {
          font-size: 0.75rem;
          font-weight: bold;
          margin-top: 2px;
          z-index: 1;
        }
        .rank-number {
          font-size: 1.5rem;
          font-weight: bold;
        }
        .member-info h5 {
          margin-bottom: 0.25rem;
        }
        .coin-inline-badge {
          font-size: 0.875rem;
          font-weight: normal;
          padding: 0.35rem 0.65rem;
        }
      `}</style>
    </Container>
  );
};

export default Awards; 