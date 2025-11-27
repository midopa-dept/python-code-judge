import React from 'react';
import Input from './Input';
import Button from './Button';

const Form = ({ children, onSubmit, className = '', title, description }) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      {(title || description) && (
        <div className="text-center">
          {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </form>
  );
};

// Form.Input component
const FormInput = ({ label, id, type = 'text', placeholder, value, onChange, error, required = false, disabled = false }) => {
  return (
    <Input
      label={label}
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      error={error}
      required={required}
      disabled={disabled}
    />
  );
};

// Form.Button component
const FormButton = ({ children, variant = 'primary', size = 'md', disabled = false, loading = false, type = 'submit' }) => {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      loading={loading}
      type={type}
    >
      {children}
    </Button>
  );
};

// Attach sub-components to Form
Form.Input = FormInput;
Form.Button = FormButton;

export default Form;