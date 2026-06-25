import React from 'react';

/**
 * PetHealthAI — Switch
 * Pill toggle. On = brand accent track, white knob. Off = hairline track.
 * Controlled via `checked` + `onChange(next)`.
 */
export function Switch({ checked = false, onChange, disabled = false, style }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange && onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 'var(--r-pill)',
        border: 'none',
        padding: 3,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--accent)' : 'var(--hairline)',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'background .18s ease',
        ...style,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform .18s cubic-bezier(.4,0,.2,1)',
        }}
      />
    </button>
  );
}
