import React from 'react';
import { Loader2 } from 'lucide-react';

export const ProgressIndicator: React.FC<{ isLoading: boolean, progress: string }> = ({ isLoading, progress }) => {
    return isLoading && (
      <div className="progress-indicator">
        <div className="progress-indicator-content">
          <Loader2 className="progress-indicator-icon" />
          <span className="progress-indicator-text">{progress}</span>
        </div>
      </div>
    );
};
