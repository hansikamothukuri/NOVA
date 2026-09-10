import React from 'react';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  size = 'md',
  className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(progress || 0)));

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  }[size];

  // Dynamic subtle gradient depending on completion
  const getGradient = () => {
    if (clamped >= 100) return 'bg-emerald-500';
    if (clamped >= 60) return 'bg-amber-500';
    if (clamped >= 25) return 'bg-orange-500';
    return 'bg-orange-600';
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-medium">
          <span>Progress</span>
          <span className="text-slate-200 font-semibold">{clamped}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 ${heightClasses}`}>
        <div
          className={`${heightClasses} ${getGradient()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
