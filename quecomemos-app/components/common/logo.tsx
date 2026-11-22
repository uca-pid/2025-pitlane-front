import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: { width: 120, height: 42, className: 'h-8 w-auto' },
  md: { width: 160, height: 56, className: 'h-12 w-auto' },
  lg: { width: 200, height: 70, className: 'h-16 w-auto' },
  xl: { width: 240, height: 84, className: 'h-20 w-auto' },
};

export function Logo({ size = 'md', className = '' }: LogoProps) {
  const { width, height, className: sizeClassName } = sizeMap[size];

  return (
    <Link
      href="/protected"
      aria-label="Ir al inicio de QueComemos"
      className={`flex items-center p-2 ${className}`}
    >
      <Image
        src="/logo.svg"
        alt="QueComemos Logo"
        width={width}
        height={height}
        className={`${sizeClassName} transition-all duration-200 hover:scale-105 !filter-none`}
        priority
      />
    </Link>
  );
}