import * as React from 'react';

/**
 * Frosted-glass surface with two-tier discipline (data vs decor).
 *
 * @startingPoint section="Core" subtitle="Frosted-glass card — data & decor variants" viewport="700x200"
 */
export interface GlassCardProps {
  children?: React.ReactNode;
  /** data = dense/readable; decor = translucent brand glass. @default "data" */
  variant?: 'data' | 'decor';
  /** Inner padding (px). @default 16 */
  padding?: number;
  /** Corner radius (CSS value). Defaults to --r-lg (24px). */
  radius?: number | string;
  /** Swap the soft shadow for the mint accent glow. @default false */
  glow?: boolean;
  style?: React.CSSProperties;
}

export function GlassCard(props: GlassCardProps): JSX.Element;
