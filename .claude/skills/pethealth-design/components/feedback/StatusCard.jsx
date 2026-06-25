import React from 'react';
import { IconChip } from '../core/IconChip.jsx';

/**
 * PetHealthAI — StatusCard
 * Dashboard health-overview tile: tinted icon-chip + uppercase caption,
 * a bold metric value, and a muted subtitle. statusColor drives the chip
 * tint AND the 4px left stripe (health semantics ok/warn/danger, or t3).
 * Solid surface — it carries fine data.
 */
export function StatusCard({ icon, title, value, subtitle, statusColor = 'var(--t3)', onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
        borderLeft: `4px solid ${statusColor}`,
        borderRadius: 'var(--r-md)',
        padding: 13,
        boxShadow: 'var(--shadow-1)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <IconChip name={icon} color={statusColor} size={15} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--t3)',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.35 }}>{subtitle}</div>}
    </div>
  );
}
