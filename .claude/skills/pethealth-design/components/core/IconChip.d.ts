import * as React from 'react';

/**
 * Round tinted plate holding a line Ionicons glyph (status cards, quick actions).
 */
export interface IconChipProps {
  /** Ionicons glyph name, e.g. "medkit-outline". */
  name: string;
  /** Glyph + tint colour. Defaults to brand accent. Any CSS colour or token. */
  color?: string;
  /** Glyph size in px; plate is ~1.7×. @default 18 */
  size?: number;
  /** Explicit plate background (overrides derived tint). */
  bg?: string;
  style?: React.CSSProperties;
}

export function IconChip(props: IconChipProps): JSX.Element;
