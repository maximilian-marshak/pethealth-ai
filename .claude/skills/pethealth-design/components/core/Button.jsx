import React from 'react';

/**
 * PetHealthAI — Button
 * Pill CTA. Primary fills with --accent-press (white text passes AA),
 * secondary uses the accent tint, ghost is transparent. Optional Ionicons
 * leading/trailing icon. Colours come from CSS custom properties only.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: { fontSize: 13, padding: '8px 14px', gap: 6, icon: 16 },
    md: { fontSize: 15, padding: '12px 18px', gap: 8, icon: 18 },
    lg: { fontSize: 17, padding: '15px 22px', gap: 9, icon: 20 },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: { background: 'var(--accent-press)', color: 'var(--on-accent)', border: '1px solid transparent' },
    secondary: { background: 'var(--accent-tint)', color: 'var(--accent-press)', border: '1px solid transparent' },
    ghost: { background: 'transparent', color: 'var(--accent-press)', border: '1px solid transparent' },
    outline: { background: 'transparent', color: 'var(--t1)', border: '1px solid var(--hairline)' },
    danger: { background: 'var(--danger)', color: '#fff', border: '1px solid transparent' },
  };
  const v = variants[variant] || variants.primary;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: block ? 'flex' : 'inline-flex',
        width: block ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        fontFamily: 'var(--font-sans)',
        fontSize: s.fontSize,
        fontWeight: 700,
        lineHeight: 1,
        padding: s.padding,
        borderRadius: 'var(--r-pill)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'filter .15s ease, transform .05s ease',
        WebkitTapHighlightColor: 'transparent',
        ...v,
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      {...rest}
    >
      {icon && <ion-icon name={icon} style={{ fontSize: s.icon }}></ion-icon>}
      {children}
      {iconRight && <ion-icon name={iconRight} style={{ fontSize: s.icon }}></ion-icon>}
    </button>
  );
}
