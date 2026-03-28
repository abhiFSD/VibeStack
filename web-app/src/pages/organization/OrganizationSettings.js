import InvoiceHistory from '../../components/subscription/InvoiceHistory';

return (
  <Container>
    {/* ... existing organization settings ... */}
    
    <Row className="mt-4">
      <Col>
        <h3 className="mb-4">Billing & Invoices</h3>
        <InvoiceHistory organizationId={organization.id} />
      </Col>
    </Row>
  </Container>
); 