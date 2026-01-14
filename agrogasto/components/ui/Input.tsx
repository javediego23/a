import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-sm font-semibold text-gray-700 ml-1">
                    {label}
                </label>
            )}
            <input
                className={`
          px-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm
          focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
          transition-all duration-200 placeholder:text-gray-400
          ${error ? 'border-red-300 focus:ring-red-100' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-500 font-medium ml-1">{error}</span>
            )}
        </div>
    );
}
