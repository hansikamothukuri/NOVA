import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRoleBadge?: boolean;
  role?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  showRoleBadge = false,
  role
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  }[size];

  // Deterministic background color based on name string
  const colors = [
    'bg-orange-600',
    'bg-emerald-600',
    'bg-cyan-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-purple-600'
  ];
  const charCode = (name || 'A').charCodeAt(0) + ((name || 'A').charCodeAt(1) || 0);
  const bgColor = colors[charCode % colors.length];

  return (
    <div className={`relative inline-block ${className}`} id={`avatar-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          className={`${sizeClasses} rounded-full object-cover ring-2 ring-slate-800 shadow-sm`}
          onError={(e) => {
            // Fallback to initials if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses} ${bgColor} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-slate-800 shadow-sm`}
        >
          {getInitials(name)}
        </div>
      )}
      {showRoleBadge && role === 'Owner' && (
        <span
          title="Project Owner"
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full ring-2 ring-slate-900 flex items-center justify-center"
        >
          <span className="w-1.5 h-1.5 bg-slate-950 rounded-full" />
        </span>
      )}
    </div>
  );
};
