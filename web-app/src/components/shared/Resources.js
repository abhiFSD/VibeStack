import React, { useState } from 'react';
import { Card, Alert, Image, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

// Import images (you'll need to add these to your assets)
import LEADERSHIPFITT from '../../assets/new_mfImage.png';
import LEANSTORE from '../../assets/products/leanstore_logo.png';
import LEANFOX from '../../assets/products/leanfoxsolutions_logo.png';

const resources = [
    {
        name: 'leadershipfitt',
        logo: LEADERSHIPFITT,
        link: 'https://leadershipfitt.com/'
    },
    {
        name: 'The Lean Store',
        logo: LEANSTORE,
        link: 'https://theleanstore.com/'
    },
    {
        name: 'Lean Fox Solutions',
        logo: LEANFOX,
        link: 'http://www.leanfoxsolutions.com/'
    },
];

const Resources = () => {
    const [showHelper, setShowHelper] = useState(true);

    return (
        <div>
            {showHelper && (
                <Alert 
                    variant="info" 
                    className="mb-4" 
                    dismissible 
                    onClose={() => setShowHelper(false)}
                >
                    <FontAwesomeIcon icon={faQuestionCircle} className="me-2" color="#0dcaf0"/>
                    <span>
                        We, at <i>Lean</i><strong>FITT™ </strong>
                        are committed to guide you throughout your LEAN journey. Here are few resources that you may find helpful.
                    </span>
                    <hr />
                    <small className="d-block mt-2">
                        Note: The following resources will take you to their respective sites.
                    </small>
                </Alert>
            )}

            <ListGroup variant="flush">
                {resources.map((resource, index) => (
                    <ListGroup.Item 
                        key={index}
                        className="py-3"
                    >
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center flex-grow-1">
                                <div style={{ width: '150px', height: '90px' }} className="me-4">
                                    <Image 
                                        src={resource.logo} 
                                        alt={resource.name}
                                        className="h-100 w-100"
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div>
                                    <h5 className="mb-1">{resource.name}</h5>
                                    <span className="text-muted">Click to visit the site</span>
                                </div>
                            </div>
                            <div className="ms-3">
                                <a 
                                    href={resource.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary"
                                >
                                    Visit Site <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                                </a>
                            </div>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </div>
    );
};

export default Resources; 