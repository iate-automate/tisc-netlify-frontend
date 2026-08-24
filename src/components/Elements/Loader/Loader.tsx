import React from 'react';
import './Loader.css';
import type { LoaderProps } from '@/types/index.js';

export default function Loader({
  label = 'Loading...',
  variant = 'naked',
  height,
  className = ''
}: LoaderProps) {
  const baseClasses = 'loader';
  const variantClass = `loader-variant-${variant}`;
  const classes = `${baseClasses} ${variantClass} ${className}`.trim();

  const style = height ? { height: typeof height === 'number' ? `${height}px` : height } : {};

  return (
    <div className={classes} style={style}>
      <i className="loader-spinner fa-solid fa-loader fa-spin icon"></i>
      {label && <p className="loader-text">{label}</p>}
    </div>
  );
}