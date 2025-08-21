import React from 'react';

interface CheckIconProps {
  className?: string;
  size?: number;
}

export function CheckIcon({ className = '', size = 16 }: CheckIconProps) {
  return (
    <svg
      className={className}
      fill='none'
      height={size}
      viewBox='0 0 24 24'
      width={size}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M20 6L9 17L4 12'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
      />
    </svg>
  );
}
