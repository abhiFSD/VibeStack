import React from 'react';
import { Container, Card, Row, Col, Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import toolsJson from '../../json/tools.json';
import iconMappings from '../../utils/iconMappings';

const Tools = () => {
  const getImageSource = (subtitle) => {
    return iconMappings[subtitle] || null;
  };

  const openToolApp = (tool) => {
    const url = `https://apps.apple.com/app/id${tool.appleStoreId}`;
    window.open(url, '_blank');
  };

  return (
    <Container className="py-4 pt-5">
      <Alert variant="warning" className="text-center mb-4">
        <h5 className="mb-0">Selecting any of these will direct you to the appropriate Store!</h5>
      </Alert>

      <Row className="g-4">
        {toolsJson.map((tool, index) => {
          const iconSource = getImageSource(tool.subtitle);
          return (
            <Col key={tool.id} md={6} lg={4}>
              <Card 
                className="h-100 cursor-pointer" 
                onClick={() => openToolApp(tool)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div 
                      className="me-3 p-3 rounded" 
                      style={{ 
                        backgroundColor: index === 0 ? 'white' : '#00897b',
                        width: '70px',
                        height: '70px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {iconSource && (
                        <img 
                          src={iconSource} 
                          alt={tool.name}
                          style={{ 
                            width: '100%', 
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <h5 className="mb-2">{tool.name}</h5>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: '#b5372e',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {tool.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      style={{ 
                        minWidth: '120px',
                        padding: '8px 16px'
                      }}
                    >
                      Visit Store <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default Tools; 