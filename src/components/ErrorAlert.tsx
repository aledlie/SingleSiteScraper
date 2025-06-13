import { AlertCircle } from 'lucide-react';
import React from 'react';

export const ErrorAlert: React.FC<{ error: string }> = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
    <div>
      <p className="text-red-700 font-medium">Scraping Failed</p>
      <p className="text-red-600 text-sm mt-1">{error}</p>
    </div>
  </div>
);

