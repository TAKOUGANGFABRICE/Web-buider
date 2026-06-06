import React from 'react';
import './PaymentSuccess.css';

const PaymentSuccess = ({ isOpen, onClose, result }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-icon">✓</div>
        <h2>Payment Successful</h2>

        <div className="success-details">
          <div className="success-row">
            <span>Transaction ID</span>
            <span>{result?.transaction_id || 'N/A'}</span>
          </div>
          <div className="success-row">
            <span>Amount</span>
            <span>{result?.amount ? `$${result.amount}` : 'N/A'}</span>
          </div>
          <div className="success-row">
            <span>Plan Activated</span>
            <span>{result?.plan || 'N/A'}</span>
          </div>
          <div className="success-row">
            <span>Payment Date</span>
            <span>{new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
        </div>

        <div className="success-actions">
          <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/billing/invoices'}>
            View Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;