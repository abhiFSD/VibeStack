import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, ListGroup, Badge, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faPaperclip, faUser, faPlus, faTableList, faPencil, faClipboard } from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import * as subscriptions from '../../graphql/subscriptions';
import { useToolContext } from '../../contexts/ToolContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import ActionItemModal from './ActionItemModal';
import UserAvatar from './UserAvatar';

const ActionItemsCard = ({ reportId }) => {
  const { defaultType, TOOL_ID } = useToolContext();
  const { activeOrganization } = useOrganization();
  const [actionItems, setActionItems] = useState([]);
  const navigate = useNavigate();
  const [userSub, setUserSub] = useState('');
  const [reports, setReports] = useState('');
  const [report, setReport] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  const itemsToShow = isExpanded ? actionItems : actionItems.slice(0, 2);
  const [assigneeNames, setAssigneeNames] = useState({});

  useEffect(() => {
    fetchSingleReport(reportId);
  }, [reportId]);

  const truncateText = (text, maxLength) => {
    if (text.length > maxLength) {
      return text.substr(0, maxLength) + '...';
    }
    return text;
  };

  const fetchSingleReport = async (reportId) => {
    try {
      const result = await API.graphql({
        query: queries.getReport,
        variables: { id: reportId }
      });
      setReport(result.data.getReport);
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  const compareDate = (dateString) => {
    const currentDate = new Date();
    const dueDate = new Date(dateString);
    // Compare dates properly by resetting time to midnight
    currentDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() > currentDate.getTime();
  };

  useEffect(() => {
    fetchUserSub();
  }, []);

  useEffect(() => {
    if (userSub) {
      fetchReports(userSub);
    }
  }, [userSub]);

  const fetchReports = async (userSub) => {
    try {
      const result = await API.graphql({
        query: queries.listReports,
        variables: {
          filter: {
            user_sub: { eq: userSub }
          }
        }
      });
      
      const filteredReports = TOOL_ID === '0' ? result.data.listReports.items : result.data.listReports.items.filter(report => report.type === defaultType);
      const reportArray = Array.isArray(filteredReports) ? filteredReports : [filteredReports];
      setReports(reportArray);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchUserSub = async () => {
    const user = await Auth.currentAuthenticatedUser();
    setUserSub(user.attributes.sub);
  };

  const navigateToTabScreen = (reportId) => {
    navigate(`/action-items/${reportId}`);
  };

  const navigateToCreateAI = (report) => {
    navigate('/action-items/create', { state: { report } });
  };

  const fetchAssigneeNames = async (actionItems) => {
    if (!actionItems || !actionItems.length) return;
    
    const uniqueUserSubs = [...new Set(
      actionItems.flatMap(item => item.assignees || [])
    )].filter(Boolean);
    
    if (uniqueUserSubs.length === 0) return;
    
    try {
      const results = await Promise.all(
        uniqueUserSubs.map(async (sub) => {
          try {
            const result = await API.graphql({
              query: queries.listOrganizationMembers,
              variables: {
                filter: {
                  userSub: { eq: sub },
                  _deleted: { ne: true }
                }
              }
            });
            
            const member = result.data.listOrganizationMembers.items[0];
            return member ? { sub, name: member.name || member.email || sub } : { sub, name: sub };
          } catch (error) {
            console.error('Error fetching user details:', error);
            return { sub, name: sub };
          }
        })
      );
      
      const namesMap = results.reduce((acc, { sub, name }) => {
        acc[sub] = name;
        return acc;
      }, {});
      
      setAssigneeNames(namesMap);
    } catch (error) {
      console.error('Error fetching assignee names:', error);
    }
  };

  const getActionItemsByReportId = async () => {
    try {
      const result = await API.graphql({
        query: queries.listActionItems,
        variables: {
          filter: { 
            reportID: { eq: reportId },
            _deleted: { ne: true }
          },
          limit: 1000 // Set a high limit to ensure we get all items
        }
      });
      let actionItems = result.data.listActionItems.items;
      // Sort by createdAt date in descending order (newest first)
      actionItems = actionItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setActionItems(actionItems);
      
      fetchAssigneeNames(actionItems);
    } catch (error) {
      console.error('Error fetching action items by report ID:', error);
      // Log the full error for debugging
      console.log('Detailed error:', error);
    }
  };

  useEffect(() => {
    if (reportId) {
      getActionItemsByReportId();
    }
  }, [reportId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour12: false
    };
    return date.toLocaleString('en-US', options);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 0:
        return 'success';
      case 1:
        return 'warning';
      case 2:
        return 'primary';
      case 3:
        return 'info';
      default:
        return 'dark';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0:
        return 'To Do';
      case 1:
        return 'In Progress';
      case 2:
        return 'In Review';
      case 3:
        return 'Done';
      default:
        return 'Unknown';
    }
  };

  useEffect(() => {
    if (reportId) {
      let subscription;
      try {
        subscription = API.graphql({
          query: subscriptions.onCreateActionItems,
          variables: {
            filter: {
              reportID: { eq: reportId }
            }
          }
        }).subscribe({
          next: ({ value }) => {
            if (value?.data?.onCreateActionItems?.reportID === reportId) {
              getActionItemsByReportId();
            }
          },
          error: error => console.error('Subscription error:', error)
        });
      } catch (error) {
        console.error('Error setting up subscription:', error);
      }

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [reportId]);

  // Subscribe to action item updates
  useEffect(() => {
    if (reportId) {
      let subscription;
      try {
        subscription = API.graphql({
          query: subscriptions.onUpdateActionItems,
          variables: {
            filter: {
              reportID: { eq: reportId }
            }
          }
        }).subscribe({
          next: ({ value }) => {
            if (value?.data?.onUpdateActionItems?.reportID === reportId) {
              getActionItemsByReportId();
            }
          },
          error: error => console.error('Subscription error:', error)
        });
      } catch (error) {
        console.error('Error setting up update subscription:', error);
      }

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [reportId]);

  // Subscribe to action item deletions
  useEffect(() => {
    if (reportId) {
      let subscription;
      try {
        subscription = API.graphql({
          query: subscriptions.onDeleteActionItems,
          variables: {
            filter: {
              reportID: { eq: reportId }
            }
          }
        }).subscribe({
          next: ({ value }) => {
            if (value?.data?.onDeleteActionItems?.reportID === reportId) {
              getActionItemsByReportId();
            }
          },
          error: error => console.error('Subscription error:', error)
        });
      } catch (error) {
        console.error('Error setting up delete subscription:', error);
      }

      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [reportId]);

  const handleShowModal = (actionItemId = null) => {
    setSelectedActionItemId(actionItemId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedActionItemId(null);
    setShowModal(false);
  };

  const handleActionItemSave = () => {
    getActionItemsByReportId();
    handleCloseModal();
  };

  const navigateToBoard = () => {
    navigate(`/action-items/${reportId}`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="mb-3">
      <Card.Header className="bg-danger text-white">
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">Total {actionItems.length} Action Items / Notes</h5>
            <small>⭐ Manage Action Items/Notes.</small>
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-light"
              className="me-2"
              onClick={() => handleShowModal()}
              title="Create Action Item"
            >
              <FontAwesomeIcon icon={faPlus} />
            </Button>
            <Button
              variant="outline-light"
              onClick={navigateToBoard}
              title="View Action Items Board"
            >
              <FontAwesomeIcon icon={faTableList} />
            </Button>
          </Col>
        </Row>
      </Card.Header>
      <ListGroup variant="flush">
        {itemsToShow.map((item, index) => (
          <ListGroup.Item
            key={index}
            action
            onClick={() => handleShowModal(item.id)}
            className="py-3"
          >
            <Row className="align-items-center">
              <Col>
                <div className="d-flex align-items-center mb-1">
                  <FontAwesomeIcon icon={item.note ? faPencil : faClipboard} className="me-2" />
                  <h6 className="mb-0">{truncateText(item.title, 17)}</h6>
                </div>
                {!item.note && (
                  <small className="text-muted">
                    <FontAwesomeIcon
                      icon={faCalendarAlt}
                      className={`me-1 ${compareDate(item.duedate) ? 'text-dark' : 'text-danger'}`}
                    />
                    {formatDate(item.duedate)}
                  </small>
                )}
              </Col>
              <Col xs="auto">
                <div className="d-flex align-items-center gap-3">
                  {!item.note && (
                    <Badge bg={getStatusBadgeColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                  )}
                  {item.attachments?.length > 0 && (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>{item.attachments.length} {item.attachments.length === 1 ? 'attachment' : 'attachments'}</Tooltip>}
                    >
                      <Badge bg="secondary" className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faPaperclip} className="me-1" />
                        <span>{item.attachments.length}</span>
                      </Badge>
                    </OverlayTrigger>
                  )}
                  {item.assignees?.length > 0 && (
                    <div className="d-flex assignee-avatars">
                      {item.assignees.slice(0, 3).map((assignee, idx) => (
                        <div 
                          key={idx}
                          style={{
                            marginLeft: idx > 0 ? '-8px' : '0',
                            position: 'relative',
                            zIndex: item.assignees.length - idx
                          }}
                        >
                          <UserAvatar
                            userSub={assignee}
                            size={28}
                            organizationID={activeOrganization?.id}
                            tooltipLabel={assigneeNames[assignee] || 'Assignee'}
                          />
                        </div>
                      ))}
                      {item.assignees.length > 3 && (
                        <div 
                          style={{
                            marginLeft: '-8px',
                            position: 'relative',
                            zIndex: 0
                          }}
                        >
                          <UserAvatar
                            email={`+${item.assignees.length - 3}`}
                            size={28}
                            customColor="#495057"
                            tooltipLabel={item.assignees.slice(3).map(assignee => 
                              assigneeNames[assignee] || 'Assignee'
                            ).join(', ')}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {actionItems.length > 2 && (
        <Card.Footer className="text-center">
          <Button
            variant="link"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Load More'}
          </Button>
        </Card.Footer>
      )}

      <ActionItemModal
        show={showModal}
        handleClose={handleCloseModal}
        actionItemId={selectedActionItemId}
        reports={[report]}
        onSave={handleActionItemSave}
      />

      <style jsx>{`
        .statement-text {
          flex: 1;
          margin-right: 1rem;
        }
        .statement-item {
          margin-bottom: 0.5rem;
        }
        .statement-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .assignee-avatars {
          display: flex;
          margin-left: 4px;
        }
      `}</style>
    </Card>
  );
};

export default ActionItemsCard; 