import React from 'react';

/**
 * PetHealthAI — GlassCard
 * Frosted-glass surface. Two-tier discipline:
 *   variant="data"  → dense/readable (.62 bg, blur 24) for status & recs.
 *   variant="decor" → translucent brand glass (.30 bg, blur 34, light border)
 *                     for switcher, AI insight, Paws, rank.
 * Soft outer shadow; large radius. Never put fine data on decor glass.
 */
export function GlassCard({ children, variant = 'data', padding = 16, radius, glow = false, style }) {
  const r = radius != null ? radius : 'var(--r-lg)';
  const isDecor = variant === 'decor';
  return (
    <div
      style={{
        borderRadius: r,
        background: isDecor ? 'var(--glass-decor-bg)' : 'var(--glass-data-bg)',
        backdropFilter: `blur(${isDecor ? 34 : 24}px) saturate(${isDecor ? 1.9 : 1.4})`,
        WebkitBackdropFilter: `blur(${isDecor ? 34 : 24}px) saturate(${isDecor ? 1.9 : 1.4})`,
        border: `1px solid ${isDecor ? 'var(--glass-decor-border)' : 'var(--hairline)'}`,
        boxShadow: glow ? 'var(--glow-accent)' : 'var(--shadow-card)',
        padding,
        color: 'var(--t1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
