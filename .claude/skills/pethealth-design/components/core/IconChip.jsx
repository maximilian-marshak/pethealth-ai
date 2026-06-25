import React from 'react';

/**
 * PetHealthAI — IconChip
 * Round tinted plate with a centered line Ionicons glyph. Default is
 * accent on accent-tint; pass a color to tint the plate with that hue
 * (color + ~12% alpha) or an explicit bg. Used in status cards & quick actions.
 */
export function IconChip({ name, color, size = 18, bg, style }) {
  const iconColor = color || 'var(--accent)';
  const background = bg || (color ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--accent-tint)');
  const box = Math.round(size * 1.7);
  return (
    <span
      style={{
        width: box,
        height: box,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background,
        flex: 'none',
        ...style,
      }}
    >
      <ion-icon name={name} style={{ fontSize: size, color: iconColor }}></ion-icon>
    </span>
  );
}
