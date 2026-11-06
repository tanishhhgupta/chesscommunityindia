import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost' | 'outline' | 'navy' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    navy:
      'bg-[#442D1C] hover:bg-[#583a24] text-white shadow-sm border border-[#362315] active:translate-y-0.5',
    primary:
      'bg-[#84592B] hover:bg-[#6c4822] text-white shadow-sm border border-[#5a3c1c] active:translate-y-0.5',
    gold:
      'bg-[#E8D1A7] hover:bg-[#dfc494] text-[#442D1C] font-bold shadow-sm active:translate-y-0.5',
    amber:
      'bg-[#84592B] hover:bg-[#6c4822] text-white shadow-sm active:translate-y-0.5',
    secondary:
      'bg-[#f3ede2] hover:bg-[#e8decb] text-[#442D1C] border border-[#d6c7b0] active:translate-y-0.5',
    danger:
      'bg-[#743014] hover:bg-[#5a250f] text-white shadow-sm active:translate-y-0.5',
    ghost:
      'bg-transparent hover:bg-[#f3ede2] text-[#442D1C] hover:text-[#2d1e13]',
    outline:
      'bg-white hover:bg-[#faf7f2] text-[#442D1C] border border-[#d6c7b0] hover:border-[#84592B]',
  }[variant];

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 font-semibold',
  }[size];

  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
};
