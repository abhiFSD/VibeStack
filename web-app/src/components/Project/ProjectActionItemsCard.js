import React, { useState, useEffect } from 'react';
import { Card, Button, ListGroup, Badge, Row, Col } from 'react-bootstrap';
import { API, Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faPaperclip, faUser, faPlus, faTableList, faPencil, faClipboard } from '@fortawesome/free-solid-svg-icons';
import * as queries from '../../graphql/queries';
import * as mutations from '../../graphql/mutations';
import ActionItemModal from '../shared/ActionItemModal';

const ProjectActionItemsCard = ({ projectId, project }) => {
  const [actionItems, setActionItems] = useState([]);
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedActionItemId, setSelectedActionItemId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const itemsToShow = isExpanded ? actionItems : actionItems.slice(0, 2);

  useEffect(() => {
    if (projectId) {
      fetchActionItems();
      fetchReports();
    }
  }, [projectId]);

  const fetchActionItems = async () => {
    try {
      const result = await API.graphql({
        query: queries.listActionItems,
        variables: {
          filter: {
            projectID: { eq: projectId },
            note: { eq: false }
          }
        }
      });
      
      let items = result.data.listActionItems.items;
      items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setActionItems(items);
    } catch (error) {
      console.error('Error fetching action items:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const result = await API.graphql({
        query: queries.listReports,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            projectID: { eq: projectId },
            _deleted: { ne: true }
          }
        }
      });
      const fetchedReports = result.data.listReports.items.filter(item => !item._deleted);
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const truncateText = (text, maxLength) => {
    if (text?.length > maxLength) {
      return text.substr(0, maxLength) + '...';
    }
    return text;
  };

  const compareDate = (dateString) => {
    const currentDate = new Date();
    const dueDate = new Date(dateString);
    // Compare dates properly by resetting time to midnight
    currentDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() > currentDate.getTime();
  };

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

  const handleShowModal = (actionItemId = null) => {
    setSelectedActionItemId(actionItemId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedActionItemId(null);
    setShowModal(false);
  };

  const handleActionItemSave = () => {
    fetchActionItems();
    handleCloseModal();
  };

  const navigateToBoard = () => {
    navigate(`/action-items`);
  };

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-danger text-white">
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">Action Items</h5>
            <small>⭐ Project Action Items</small>
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
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faPaperclip} className="me-1" />
                      <small>{item.attachments.length}</small>
                    </div>
                  )}
                  {item.assignees?.length > 0 && (
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={faUser} className="me-1" />
                      <small>{item.assignees.length}</small>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </ListGroup.Item>
        ))}
        {actionItems.length === 0 && (
          <ListGroup.Item className="text-center py-4">
            <p className="mb-3">No action items available.</p>
            <Button 
              variant="primary"
              size="sm"
              onClick={() => handleShowModal()}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Create Action Item
            </Button>
          </ListGroup.Item>
        )}
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
        reports={reports}
        projects={[project]}
        onSave={handleActionItemSave}
        defaultProjectId={projectId}
      />
    </Card>
  );
};

export default ProjectActionItemsCard; 