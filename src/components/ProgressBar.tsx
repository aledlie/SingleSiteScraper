import React from 'react';
import { Loader2 } from 'lucide-react';

export const ProgressIndicator: React.FC<{ isLoading: boolean, progress: string }> = ({ isLoading, progress }) => {
    return isLoading && (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-blue-700">{progress}</span>
        </div>
      </div>
    );
};
