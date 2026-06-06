import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Invoices.css';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access');
      const response = await fetch('/api/invoices/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      paid: '#22C55E',
      open: '#F59E0B',
      draft: '#64748B',
      void: '#EF4444',
    };
    return colors[status] || '#64748B';
  };

  if (loading) {
    return (
      <div className="invoices-page">
        <div className="billing-container">
          <div className="billing-loading">
            <div className="spinner"></div>
            <p>Loading invoices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoices-page">
      <div className="billing-container">
        <div className="billing-header">
          <button className="btn-back" onClick={() => navigate('/billing')}>
            ← Back to Billing
          </button>
          <h1>Invoices</h1>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="billing-card">
          {invoices.length === 0 ? (
            <div className="empty-state">
              <p>No invoices found. Invoices will appear after your first payment.</p>
            </div>
          ) : (
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="invoice-number">{invoice.invoice_number}</td>
                    <td className="invoice-date">{formatDate(invoice.created_at)}</td>
                    <td className="invoice-amount">{formatCurrency(invoice.amount_due)}</td>
                    <td>
                      <span
                        className="invoice-status-badge"
                        style={{ backgroundColor: getStatusColor(invoice.status) }}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="invoice-actions">
                      {invoice.invoice_pdf_url && (
                        <button
                          className="btn-download"
                          onClick={() => window.open(invoice.invoice_pdf_url, '_blank')}
                          title="Download PDF"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        className="btn-print"
                        onClick={() => window.print()}
                        title="Print Invoice"
                      >
                        🖨
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;