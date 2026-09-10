import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry, className = '' }) => {
  return (
    <div
      className={`p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start justify-between gap-3 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-rose-200">Action Failed</h4>
          <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-rose-500/30 text-rose-300 hover:bg-rose-500/15 shrink-0"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
};
