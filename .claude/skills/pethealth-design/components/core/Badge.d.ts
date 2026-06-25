import * as React from 'react';

/**
 * Small pill label for statuses and counts.
 */
export interface BadgeProps {
  children?: React.ReactNode;
  /** Colour family. @default "neutral" */
  tone?: 'accent' | 'ok' | 'warn' | 'danger' | 'neutral';
  /** Filled instead of tinted-soft. @default false */
  solid?: boolean;
  /** Optional leading Ionicons glyph. */
  icon?: string;
  style?: React.CSSProperties;
}

export function Badge(props: BadgeProps): JSX.Element;
