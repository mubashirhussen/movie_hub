import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import './index.css';

const Toast = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        if (toast.type === 'success') Icon = CheckCircle2;
        if (toast.type === 'error') Icon = AlertCircle;

        return (
          <div key={toast.id} className={`toast-card toast-${toast.type} animate-fade-in`}>
            <div className="toast-icon-wrapper">
              <Icon size={18} />
            </div>
            <div className="toast-message-content">
              <p>{toast.message}</p>
            </div>
            <button
              className="toast-dismiss-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
