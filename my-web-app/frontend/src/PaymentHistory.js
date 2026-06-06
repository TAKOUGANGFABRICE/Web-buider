import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access');
      const response = await fetch('/api/payments/history/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setPayments(data);
    } catch (err) {
      setError('Failed to load payment history');
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
      completed: '#22C55E',
      pending: '#F59E0B',
      failed: '#EF4444',
      refunded: '#64748B',
    };
    return colors[status] || '#64748B';
  };

  if (loading) {
    return (
      <div className="payment-history-page">
        <div className="billing-container">
          <div className="billing-loading">
            <div className="spinner"></div>
            <p>Loading payment history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-history-page">
      <div className="billing-container">
        <div className="billing-header">
          <button className="btn-back" onClick={() => navigate('/billing')}>
            ← Back to Billing
          </button>
          <h1>Payment History</h1>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="billing-card">
          {payments.length === 0 ? (
            <div className="empty-state">
              <p>No payments found. Make your first payment to upgrade your plan.</p>
            </div>
          ) : (
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="payment-date">{formatDate(payment.created_at)}</td>
                    <td className="payment-desc">{payment.description || 'Subscription Payment'}</td>
                    <td className="payment-amount">{formatCurrency(payment.amount)}</td>
                    <td>
                      <span
                        className="payment-status-badge"
                        style={{ backgroundColor: getStatusColor(payment.status) }}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="payment-actions">
                      {payment.invoice_id && (
                        <button
                          className="btn-view"
                          onClick={() => navigate(`/billing/invoices`)}
                          title="View Invoice"
                        >
                          📄
                        </button>
                      )}
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

export default PaymentHistory;