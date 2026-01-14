import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    className?: string;
    isLoading?: boolean;
}

export default function Button({
    children,
    variant = 'primary',
    className = '',
    isLoading,
    disabled,
    ...props
}: ButtonProps) {
    const baseClass = 'btn';
    const variantClass = variant === 'primary' ? 'btn-primary' :
        variant === 'secondary' ? 'btn-secondary' : 'hover:bg-gray-100 text-gray-600';

    return (
        <button
            className={`${baseClass} ${variantClass} ${className} ${disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : null}
            {children}
        </button>
    );
}
