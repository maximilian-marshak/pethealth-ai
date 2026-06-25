import React from 'react';

/**
 * PetHealthAI — Card
 * Solid surface for dense data: numbers, charts, medical records, forms.
 * High-contrast white (--surface) with a soft shadow and large radius.
 * Optional left accent stripe (statusColor) as used by health status cards.
 */
export function Card({ children, padding = 16, radius, statusColor, onClick, style }) {
  const r = radius != null ? radius : 'var(--r-md)';
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: r,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        boxShadow: 'var(--shadow-1)',
        borderLeft: statusColor ? `4px solid ${statusColor}` : undefined,
        padding,
        color: 'var(--t1)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
