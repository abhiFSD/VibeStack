import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// This component is no longer used - terms validation is handled in AppRouter.js
// Keeping for backward compatibility but functionality moved to LoginRoute component

const CustomSignUpFooter = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <div className="mt-3">
      <Form.Check
        type="checkbox"
        id="terms-checkbox"
        label={
          <span style={{ fontSize: '0.9rem' }}>
            I agree to the{' '}
            <Link 
              to="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'none' }}
            >
              Terms and Conditions
            </Link>
          </span>
        }
        checked={termsAccepted}
        onChange={(e) => setTermsAccepted(e.target.checked)}
        required
      />
    </div>
  );
};

export default CustomSignUpFooter;