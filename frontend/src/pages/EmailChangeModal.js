import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ProfilePage.css';

// API configuration
const API = '/api';

// Real API functions for email change
const requestEmailChange = async (newEmail) => {
  try {
    const response = await axios.post(`${API}/users/me/email-change-request`, {
      new_email: newEmail
    });
    return response.data;
  } catch (error) {
    console.error('Error requesting email change:', error);
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data.error || 'Failed to send verification email'
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }
};

// Real API function for confirming email change
const confirmEmailChange = async (token) => {
  try {
    const response = await axios.post(`${API}/users/me/email-change-confirm`, {
      token: token
    });
    return response.data;
  } catch (error) {
    console.error('Error confirming email change:', error);
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data.error || 'Invalid or expired token'
      };
    } else if (error.request) {
      // Request made but no response
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.'
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }
};

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * EmailChangeModal - Modal component for email change workflow
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {string} props.currentEmail - Current user email
 * @param {Function} props.onSuccess - Callback when email change succeeds
 */
const EmailChangeModal = ({ isOpen, onClose, currentEmail, onSuccess }) => {
  const [step, setStep] = useState('input'); // 'input' or 'verify'
  const [newEmail, setNewEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenSent, setTokenSent] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  
  const modalRef = useRef(null);
  const emailInputRef = useRef(null);
  const tokenInputRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setNewEmail('');
      setToken('');
      setLoading(false);
      setError('');
      setSuccessMessage('');
      setTokenSent(false);
      setGeneratedToken('');
      
      // Focus email input when modal opens
      setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    modalRef.current.addEventListener('keydown', handleTabKey);
    return () => {
      if (modalRef.current) {
        modalRef.current.removeEventListener('keydown', handleTabKey);
      }
    };
  }, [isOpen]);

  const validateEmail = (email) => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address';
    }
    if (email === currentEmail) {
      return 'New email must be different from current email';
    }
    return '';
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateEmail(newEmail);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Real API call to request email change
      const result = await requestEmailChange(newEmail);
      
      if (result.success) {
        setTokenSent(true);
        setStep('verify');
        setSuccessMessage('Verification email sent. Please check your inbox.');
        
        setTimeout(() => {
          if (tokenInputRef.current) {
            tokenInputRef.current.focus();
          }
        }, 100);
      } else {
        // Handle API errors
        setError(result.error || result.message || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Verification token is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Real API call to confirm email change
      const result = await confirmEmailChange(token);
      
      if (result.success) {
        setSuccessMessage('Email updated successfully!');
        
        // Close modal after success and call onSuccess callback with new email
        setTimeout(() => {
          // Pass the updated user email from the response if available
          const updatedEmail = result.user?.email || newEmail;
          onSuccess(updatedEmail);
          onClose();
        }, 1500);
      } else {
        // Handle API errors
        setError(result.error || result.message || 'Invalid or expired token');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken)
        .then(() => {
          setSuccessMessage('Token copied to clipboard!');
          setTimeout(() => setSuccessMessage(''), 2000);
        })
        .catch(() => {
          setError('Failed to copy token');
        });
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Real API call to resend verification email
      const result = await requestEmailChange(newEmail);
      
      if (result.success) {
        // Update token from response (only available in development mode)
        setGeneratedToken(result.token || '');
        setSuccessMessage('Verification email resent. Please check your inbox.');
      } else {
        // Handle API errors
        setError(result.error || result.message || 'Failed to resend verification email');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Don't render if modal is closed
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-modal-title"
      >
        <div className="modal-header">
          <h2 id="email-modal-title" className="modal-title">
            {step === 'input' ? 'Смена Email' : 'Подтверждение смены Email'}
          </h2>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {step === 'input' ? (
            <form onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label htmlFor="current-email" className="form-label">
                  Текущий Email
                </label>
                <input
                  id="current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="auth-input edit-email-disabled"
                  aria-label="Current email address (read-only)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-email" className="form-label">
                  Новый Email
                </label>
                <input
                  id="new-email"
                  ref={emailInputRef}
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError('');
                  }}
                  className="auth-input"
                  placeholder="new-email@example.com"
                  aria-label="Enter new email address"
                  aria-describedby="email-help"
                  required
                />
                <small id="email-help" className="form-help">
                  Введите новый адрес электронной почты
                </small>
              </div>

              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Verification Email'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleTokenSubmit}>
              <div className="form-group">
                <p className="form-instruction">
                  Мы отправили письмо для подтверждения на адрес <strong>{newEmail}</strong>.
                  Проверьте почту и введите код подтверждения ниже.
                </p>

                <label htmlFor="verification-token" className="form-label">
                  Verification Token
                </label>
                <input
                  id="verification-token"
                  ref={tokenInputRef}
                  type="text"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setError('');
                  }}
                  className="auth-input"
                  placeholder="Paste token from email"
                  aria-label="Enter verification token from email"
                  aria-describedby="token-help"
                  required
                />
                <small id="token-help" className="form-help">
                  Token expires in 24 hours
                </small>
              </div>

              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="form-success" role="status">
                  {successMessage}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={() => {
                    setStep('input');
                    setError('');
                    setSuccessMessage('');
                  }}
                  disabled={loading}
                >
                  Back
                </button>
                
                <div className="action-group">
                  <button
                    type="button"
                    className="modal-btn-secondary"
                    onClick={handleResendEmail}
                    disabled={loading}
                  >
                    {loading ? 'Resending...' : 'Resend Email'}
                  </button>
                  <button
                    type="submit"
                    className="modal-btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify & Update Email'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailChangeModal;