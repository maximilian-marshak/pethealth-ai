import React from 'react';

/**
 * PetHealthAI — Badge
 * Small pill label. tone maps to a colour family: 'accent' (brand),
 * health semantics 'ok' | 'warn' | 'danger', or 'neutral'. soft (default)
 * renders a tinted background with coloured text; solid fills with the colour.
 */
export function Badge({ children, tone = 'neutral', solid = false, icon, style }) {
  const tones = {
    accent: 'var(--accent)',
    ok: 'var(--ok)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    neutral: 'var(--t3)',
  };
  const c = tones[tone] || tones.neutral;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
    padding: '5px 9px',
    borderRadius: 'var(--r-pill)',
    letterSpacing: '0.2px',
    whiteSpace: 'nowrap',
  };
  const skin = solid
    ? { background: c, color: tone === 'neutral' ? 'var(--surface)' : '#fff' }
    : { background: `color-mix(in srgb, ${c} 16%, transparent)`, color: c };
  return (
    <span style={{ ...base, ...skin, ...style }}>
      {icon && <ion-icon name={icon} style={{ fontSize: 12 }}></ion-icon>}
      {children}
    </span>
  );
}
