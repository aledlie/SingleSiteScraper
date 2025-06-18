import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const FormInput: React.FC<Props> = ({ label, description, className = '', ...props }) => {
  return (
    <label className="form-label">
      <span>{label}</span>
      {description && <p className="form-description">{description}</p>}
      <input className={`input ${className}`.trim()} {...props} />
    </label>
  );
};

