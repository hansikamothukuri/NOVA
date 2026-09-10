import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, className = '', ...props }, ref) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-slate-900/90 border rounded-lg text-slate-100 text-sm pl-3.5 pr-9 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-700/80 focus:border-orange-500'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
