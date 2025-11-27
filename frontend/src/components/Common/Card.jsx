import React from 'react';

const Card = ({ children, className = '', title, headerActions }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {(title || headerActions) && (
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;