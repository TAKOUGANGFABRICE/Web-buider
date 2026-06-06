import React from 'react';
import './PaymentFailed.css';

const PaymentFailed = ({ isOpen, onClose, result }) => {
  if (!isOpen) return null;

  const getFailureReason = (reason) => {
    const reasons = {
      insufficient_funds: 'Insufficient Funds',
      cancelled: 'Payment Cancelled',
      verification_failed: 'Verification Failed',
    };
    return reasons[reason] || reason || 'Payment Failed';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="failed-modal" onClick={(e) => e.stopPropagation()}>
        <div className="failed-icon">✗</div>
        <h2>Payment Failed</h2>

        <div className="failed-reason">
          <p>{getFailureReason(result?.reason)}</p>
        </div>

        <div className="failed-actions">
          <button className="btn btn-primary" onClick={() => window.location.href = '/billing'}>
            Retry Payment
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/billing'}>
            Change Payment Method
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;