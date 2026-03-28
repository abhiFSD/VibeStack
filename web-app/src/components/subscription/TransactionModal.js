import React from 'react';
import { Modal, Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faExternalLinkAlt, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

const TransactionModal = ({ show, onHide, invoices }) => {
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'UNPAID':
        return 'warning';
      case 'FAILED':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faFileInvoice} className="text-primary me-2" />
          Transaction History
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="table-responsive">
          <Table hover className="align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice ID</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{formatDate(invoice.createdAt)}</td>
                  <td>
                    <small className="text-muted">
                      {invoice.stripeInvoiceId}
                    </small>
                  </td>
                  <td>
                    <div className="small">
                      {formatDate(invoice.billingPeriodStart)}
                      <br />
                      to
                      <br />
                      {formatDate(invoice.billingPeriodEnd)}
                    </div>
                  </td>
                  <td>
                    <div>{formatCurrency(invoice.amount)}</div>
                    {invoice.isProrated && (
                      <small className="text-muted">
                        (Base: {formatCurrency(invoice.basePrice)}/user
                        {invoice.proratedAmount > 0 && ` + Prorated: ${formatCurrency(invoice.proratedAmount)}`})
                      </small>
                    )}
                    <small className="d-block text-muted">
                      {invoice.userCount} licenses ({invoice.licenseChange ? `Changed by ${invoice.licenseChange}` : 'Initial'})
                    </small>
                  </td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(invoice.status || 'OPEN')}>
                      {invoice.status || 'PENDING'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      {invoice.hostedInvoiceUrl && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Invoice"
                        >
                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </Button>
                      )}
                      {invoice.invoicePdfUrl && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          href={invoice.invoicePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Download PDF"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default TransactionModal; 