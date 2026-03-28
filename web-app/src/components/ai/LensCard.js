import React from 'react';
import { Card, Badge, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faCogs, 
  faBalanceScale, 
  faStar,
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';

const LensCard = ({ title, lens, type }) => {
  if (!lens) return null;

  const getIcon = () => {
    switch (type) {
      case 'leadership':
        return faUsers;
      case 'lean':
        return faCogs;
      case 'workLife':
        return faBalanceScale;
      case 'everlight':
        return faStar;
      default:
        return faCheckCircle;
    }
  };

  const getColorClass = () => {
    switch (lens.color) {
      case 'green':
        return 'success';
      case 'yellow':
        return 'warning';
      case 'red':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getBorderClass = () => {
    switch (lens.color) {
      case 'green':
        return 'border-success';
      case 'yellow':
        return 'border-warning';
      case 'red':
        return 'border-danger';
      default:
        return 'border-secondary';
    }
  };

  return (
    <Card className={`mb-3 ${getBorderClass()}`} style={{ borderWidth: '2px' }}>
      <Card.Header className={`bg-light d-flex justify-content-between align-items-center`}>
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={getIcon()} className={`me-2 text-${getColorClass()}`} />
          <strong>{title}</strong>
        </div>
        {lens.score !== null && (
          <div className="d-flex align-items-center">
            <Badge bg={getColorClass()} className="me-2">
              {lens.score}/10
            </Badge>
            <span className="text-muted small">{lens.priority}</span>
          </div>
        )}
      </Card.Header>
      <Card.Body>
        {lens.rationale && (
          <div className="mb-3">
            <small className="text-muted">Rationale:</small>
            <p className="mb-2">{lens.rationale}</p>
          </div>
        )}
        
        {lens.actionItems && lens.actionItems.length > 0 && (
          <div>
            <small className="text-muted">Action Items:</small>
            <ListGroup variant="flush" className="mt-2">
              {lens.actionItems.map((item, idx) => (
                <ListGroup.Item key={idx} className="ps-0 border-0 py-1">
                  <FontAwesomeIcon 
                    icon={faCheckCircle} 
                    className={`me-2 text-${getColorClass()}`} 
                    size="sm"
                  />
                  {item}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default LensCard;