import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  }[size];

  const content = (
    <div className="flex flex-col items-center justify-center p-6 space-y-3" id="loading-spinner">
      <Loader2 className={`${sizeClasses} text-orange-500 animate-spin`} />
      {message && <p className="text-sm font-medium text-slate-400">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
