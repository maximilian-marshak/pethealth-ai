import * as React from 'react';

/**
 * Pill button with brand-accent fills and optional Ionicons icon.
 *
 * @startingPoint section="Core" subtitle="Primary / secondary / ghost pill button" viewport="700x140"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Ionicons name for a leading icon, e.g. "heart". */
  icon?: string;
  /** Ionicons name for a trailing icon. */
  iconRight?: string;
  /** Stretch to full width. @default false */
  block?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
