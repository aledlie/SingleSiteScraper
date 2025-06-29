import { AlertCircle } from 'lucide-react';
import React from 'react';

export const ErrorAlert: React.FC<{ error: string }> = ({ error }) => (
  <div className="error-alert">
    <AlertCircle className="error-icon" />
    <div>
      <p className="error-title">Scraping Failed</p>
      <p className="error-message">{error}</p>
    </div>
  </div>
);

