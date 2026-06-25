import * as React from 'react';

/**
 * Solid high-contrast surface for dense data (numbers, records, forms).
 */
export interface CardProps {
  children?: React.ReactNode;
  /** Inner padding (px). @default 16 */
  padding?: number;
  /** Corner radius (CSS value). Defaults to --r-md (16px). */
  radius?: number | string;
  /** Optional left accent stripe colour (health status cards). */
  statusColor?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
