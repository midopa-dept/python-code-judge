import React from 'react';

const Textarea = ({ label, className = '', ...props }) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={props.id}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${props.className || ''}`}
      />
    </div>
  );
};

export default Textarea;
