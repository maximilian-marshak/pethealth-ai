import * as React from 'react';

/**
 * Rounded progress track with an accent fill.
 */
export interface ProgressBarProps {
  /** Current value (used with goal). */
  current?: number;
  /** Target value. @default 1 */
  goal?: number;
  /** Explicit 0–100 percent (overrides current/goal). */
  percent?: number;
  /** Track height in px. @default 12 */
  height?: number;
  /** Fill colour. Defaults to brand accent. */
  color?: string;
  style?: React.CSSProperties;
}

export function ProgressBar(props: ProgressBarProps): JSX.Element;
