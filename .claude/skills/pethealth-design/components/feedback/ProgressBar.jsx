import React from 'react';

/**
 * PetHealthAI — ProgressBar
 * Rounded track with an accent fill. Used for monthly Paws progress, course
 * completion, etc. Pass current/goal (clamped) or an explicit percent.
 */
export function ProgressBar({ current, goal = 1, percent, height = 12, color = 'var(--accent)', style }) {
  const pct = percent != null
    ? Math.max(0, Math.min(100, percent))
    : Math.max(0, Math.min(100, (current / (goal || 1)) * 100));
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--r-pill)',
        background: 'var(--hairline)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 'var(--r-pill)',
          background: color,
          transition: 'width .4s cubic-bezier(.4,0,.2,1)',
        }}
      />
    </div>
  );
}
