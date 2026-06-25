import React from 'react';

/**
 * PetHealthAI — Input
 * Pill / rounded text field on a solid surface. Optional leading Ionicons
 * glyph. Focus lifts the border to the brand accent. t4 placeholder.
 */
export function Input({
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
  pill = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--surface)',
        border: `1px solid ${focus ? 'var(--accent)' : 'var(--hairline)'}`,
        borderRadius: pill ? 'var(--r-pill)' : 'var(--r-sm)',
        padding: pill ? '12px 18px' : '13px 14px',
        boxShadow: focus ? '0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent)' : 'none',
        transition: 'border-color .15s ease, box-shadow .15s ease',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {icon && <ion-icon name={icon} style={{ fontSize: 18, color: focus ? 'var(--accent)' : 'var(--t3)' }}></ion-icon>}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          fontWeight: 500,
          color: 'var(--t1)',
        }}
        {...rest}
      />
    </div>
  );
}
