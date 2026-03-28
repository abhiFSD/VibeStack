import React from 'react';
import { Container, Card } from 'react-bootstrap';

const TermsPage = () => {
  return (
    <Container className="py-5">
      <Card>
        <Card.Header>
          <h2>Terms and Conditions</h2>
        </Card.Header>
        <Card.Body>
          <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing and using VibeStack™ Pro, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            
            <h3>2. Use License</h3>
            <p>
              Permission is granted to temporarily download one copy of the materials on VibeStack™ Pro for personal, 
              non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul>
              <li>modify or copy the materials;</li>
              <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial);</li>
              <li>attempt to decompile or reverse engineer any software contained on VibeStack™ Pro;</li>
              <li>remove any copyright or other proprietary notations from the materials.</li>
            </ul>
            <p>
              This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time. 
              Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.
            </p>

            <h3>3. Disclaimer</h3>
            <p>
              The materials on VibeStack™ Pro are provided on an 'as is' basis. We make no warranties, expressed or implied, 
              and hereby disclaim and negate all other warranties including without limitation, implied warranties or conditions of merchantability, 
              fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>

            <h3>4. Limitations</h3>
            <p>
              In no event shall FittWorks or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, 
              or due to business interruption) arising out of the use or inability to use the materials on VibeStack™ Pro, 
              even if FittWorks or a FittWorks authorized representative has been notified orally or in writing of the possibility of such damage. 
              Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages, 
              these limitations may not apply to you.
            </p>

            <h3>5. Privacy Policy</h3>
            <p>
              Your privacy is important to us. We collect minimal personal information necessary to provide our services. 
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
              except as described in our Privacy Policy.
            </p>

            <h3>6. Data Security</h3>
            <p>
              We implement appropriate security measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage 
              is 100% secure.
            </p>

            <h3>7. User Accounts</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account information and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h3>8. Revisions and Errata</h3>
            <p>
              The materials appearing on VibeStack™ Pro could include technical, typographical, or photographic errors. 
              We do not warrant that any of the materials on its website are accurate, complete, or current. 
              We may make changes to the materials contained on its website at any time without notice.
            </p>

            <h3>9. Governing Law</h3>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws and you irrevocably submit 
              to the exclusive jurisdiction of the courts in that state or location.
            </p>

            <h3>10. Contact Information</h3>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at:{' '}
              <a href="mailto:hello@vibestack.example">hello@vibestack.example</a>
            </p>

            <p className="text-muted mt-4">
              <small>Last updated: {new Date().toLocaleDateString()}</small>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default TermsPage;