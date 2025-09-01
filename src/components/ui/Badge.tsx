import React from 'react';

interface BadgeProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Badge: React.FC<BadgeProps> = ({ 
  text, 
  className = 'bg-gray-100 text-gray-800',
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1'
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${className}`}
    >
      {text}
    </span>
  );
};

export default Badge;