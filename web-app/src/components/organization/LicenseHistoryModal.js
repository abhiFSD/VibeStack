import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faReceipt, faCalendarAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import { API } from 'aws-amplify';
import * as queries from '../../graphql/queries';

const LicenseHistoryModal = ({ show, onHide, organization }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && organization?.id) {
      fetchInvoices();
    }
  }, [show, organization?.id]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await API.graphql({
        query: queries.listSubscriptionInvoices,
        variables: {
          filter: {
            organizationId: { eq: organization.id }
          }
        }
      });

      const sortedInvoices = result.data.listSubscriptionInvoices.items
        .filter(invoice => !invoice._deleted)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setInvoices(sortedInvoices);
    } catch (error) {
      console.error('Error fetching license history:', error);
      setError('Failed to load license history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'danger';
      case 'REFUNDED':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const calculateTotalSpent = () => {
    return invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce((total, invoice) => total + (invoice.amount || 0), 0)
      .toFixed(2);
  };

  const calculateTotalLicenses = () => {
    return invoices
      .filter(invoice => invoice.status === 'PAID')
      .reduce((total, invoice) => total + (invoice.userCount || 0), 0);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faHistory} className="me-2 text-primary" />
          License Purchase History
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading history...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-5">
            <FontAwesomeIcon icon={faReceipt} size="3x" className="text-muted mb-3" />
            <p className="text-muted">No license purchases yet</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="bg-light rounded p-3 text-center">
                  <h6 className="text-muted mb-1">Total Spent</h6>
                  <h4 className="text-primary mb-0">${calculateTotalSpent()}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-light rounded p-3 text-center">
                  <h6 className="text-muted mb-1">Total Licenses</h6>
                  <h4 className="text-success mb-0">{calculateTotalLicenses()}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-light rounded p-3 text-center">
                  <h6 className="text-muted mb-1">Current Licenses</h6>
                  <h4 className="text-info mb-0">{organization?.purchasedLicenses || 0}</h4>
                </div>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Licenses</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-muted" />
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td>
                        <div>
                          <FontAwesomeIcon icon={faUsers} className="me-2 text-primary" />
                          {invoice.billingPeriod === 'YEARLY' ? 'Annual' : 'Monthly'} License
                          {invoice.isProrated && (
                            <Badge bg="info" className="ms-2">Prorated</Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          {invoice.billingPeriodStart && invoice.billingPeriodEnd && (
                            <>Period: {formatDate(invoice.billingPeriodStart)} - {formatDate(invoice.billingPeriodEnd)}</>
                          )}
                        </small>
                      </td>
                      <td>
                        <Badge bg="primary">{invoice.userCount || 0}</Badge>
                      </td>
                      <td>
                        <strong>${invoice.amount?.toFixed(2) || '0.00'}</strong>
                        {invoice.pricePerUser && (
                          <div>
                            <small className="text-muted">
                              ${invoice.pricePerUser.toFixed(2)}/user
                            </small>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status || 'UNKNOWN'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Invoice Links */}
            {invoices.some(inv => inv.hostedInvoiceUrl) && (
              <div className="mt-3">
                <small className="text-muted">
                  <FontAwesomeIcon icon={faReceipt} className="me-2" />
                  Click on any paid invoice to view the receipt
                </small>
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LicenseHistoryModal;