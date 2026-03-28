import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import toolsJson from '../../json/tools.json';
import iconMappings from '../../utils/iconMappings';

const ToolsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef(null);
  
  // Number of tools to display at once based on screen size
  const getVisibleCount = () => {
    if (window.innerWidth >= 1200) return 4; // xl screens
    if (window.innerWidth >= 992) return 3; // lg screens
    if (window.innerWidth >= 768) return 2; // md screens
    return 1; // sm and xs screens
  };
  
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());
  
  // Update visible count on window resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Auto-scroll carousel
  useEffect(() => {
    if (isHovered || isTouching) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === toolsJson.length - visibleCount ? 0 : prevIndex + 1
      );
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isHovered, isTouching, visibleCount]);
  
  const getImageSource = (subtitle) => {
    return iconMappings[subtitle] || null;
  };
  
  const openToolApp = (tool) => {
    const url = `https://apps.apple.com/app/id${tool.appleStoreId}`;
    window.open(url, '_blank');
  };
  
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? toolsJson.length - visibleCount : prevIndex - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === toolsJson.length - visibleCount ? 0 : prevIndex + 1
    );
  };
  
  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsTouching(true);
  };
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    setIsTouching(false);
    
    if (touchStart - touchEnd > 75) {
      // Swipe left
      handleNext();
    } else if (touchStart - touchEnd < -75) {
      // Swipe right
      handlePrev();
    }
  };
  
  return (
    <div 
      className="tools-carousel position-relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={carouselRef}
    >
      <div className="d-flex justify-content-between mb-3">
        <h6 className="mb-0">Swipe to explore all tools</h6>
        <div>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="me-2" 
            onClick={handlePrev}
          >
            &lt;
          </Button>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleNext}
          >
            &gt;
          </Button>
        </div>
      </div>
      
      <div 
        className="carousel-container overflow-hidden"
        style={{
          position: 'relative',
          width: '100%'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Row 
          className="flex-nowrap"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            transition: isTouching ? 'none' : 'transform 0.5s ease-in-out',
            willChange: 'transform'
          }}
        >
          {toolsJson.map((tool, index) => {
            const iconSource = getImageSource(tool.subtitle);
            return (
              <Col 
                key={tool.id} 
                style={{ 
                  flex: `0 0 ${100 / visibleCount}%`, 
                  maxWidth: `${100 / visibleCount}%`,
                  padding: '0 10px'
                }}
              >
                <Card 
                  className="h-100 cursor-pointer" 
                  onClick={() => openToolApp(tool)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div 
                        className="me-3 p-2 rounded" 
                        style={{ 
                          backgroundColor: index === 0 ? 'white' : '#00897b',
                          width: '60px',
                          height: '60px',
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
                        <h6 className="mb-1">{tool.name}</h6>
                        <span 
                          className="badge" 
                          style={{ 
                            backgroundColor: '#b5372e',
                            color: 'white',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem'
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
                          minWidth: '100px',
                          padding: '4px 8px',
                          fontSize: '0.8rem'
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
      </div>
      
      <div className="text-center mt-3">
        <Link to="/tools" className="btn btn-primary">
          View All Tools <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
        </Link>
      </div>
    </div>
  );
};

export default ToolsCarousel; 