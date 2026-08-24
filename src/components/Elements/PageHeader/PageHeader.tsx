import React from 'react';
import './PageHeader.css';
import type { PageHeaderProps } from '@/types/index.js';

export default function PageHeader({ title, copy, className }: PageHeaderProps) {
  return (
    <div className={`page-header ${className || ''}`}>
      <h1>{title}</h1>
      {copy && <p>{copy}</p>}
    </div>
  );
}
