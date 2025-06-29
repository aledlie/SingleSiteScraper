import React from 'react';

interface FormInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  icon?: React.ReactNode;
  onEnter?: () => void;
  type?: string;
  min?: number;
  max?: number;
}

const FormInput: React.FC<FormInputProps> = ({ label, placeholder, value, onChange, icon, onEnter, type = 'text', min, max }) => {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="form-input-container">
        {icon && <div className="form-input-icon">{icon}</div>}
        <input
          type={type}
          min={min}
          max={max}
          className="input-label"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        />
      </div>
    </div>
  );
};

export default FormInput;

