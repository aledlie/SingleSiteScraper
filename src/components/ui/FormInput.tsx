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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</div>}
        <input
          type={type}
          min={min}
          max={max}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

