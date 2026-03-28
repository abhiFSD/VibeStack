import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faDownload, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';

const InvoiceHistory = ({ organizationId }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, [organizationId]);

  const fetchInvoices = async () => {
    try {
      const result = await API.graphql({
        query: queries.listSubscriptionInvoices,
        variables: {
          filter: {
            organizationId: { eq: organizationId }
          }
        }
      });

      const sortedInvoices = result.data.listSubscriptionInvoices.items
        .filter(invoice => !invoice._deleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setInvoices(sortedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Card className="shadow-sm mb-4">
        <Card.Body className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white py-3">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faFileInvoice} className="text-primary me-2" />
          <h5 className="mb-0">Invoice History</h5>
        </div>
      </Card.Header>
      <Card.Body>
        {invoices.length === 0 ? (
          <div className="text-center text-muted py-4">
            No invoices found
          </div>
        ) : (
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
                      <small className="text-muted">
                        ({invoice.userCount} users × {formatCurrency(invoice.pricePerUser)})
                      </small>
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
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
        )}
      </Card.Body>
    </Card>
  );
};

export default InvoiceHistory; 