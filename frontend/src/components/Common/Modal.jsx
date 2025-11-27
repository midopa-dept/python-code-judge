import React from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-lg shadow-xl overflow-hidden transform transition-all ${sizeClasses[size]} w-full`}>
        {(title || onClose) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && <h3 id="modal-title" className="text-lg font-semibold text-gray-900">{title}</h3>}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label="모달 닫기"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default Modal;
