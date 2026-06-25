import * as React from 'react';

/**
 * Dashboard health-overview tile: icon-chip + caption + metric + subtitle.
 *
 * @startingPoint section="Feedback" subtitle="Health status tile with semantic stripe" viewport="360x120"
 */
export interface StatusCardProps {
  /** Ionicons glyph name, e.g. "medkit-outline". */
  icon: string;
  /** Uppercase caption, e.g. "Vaccination". */
  title: string;
  /** Bold metric value, e.g. "12 Jul". */
  value: React.ReactNode;
  /** Muted helper line. */
  subtitle?: string;
  /** Health-semantic colour for chip + left stripe. @default "var(--t3)" */
  statusColor?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}

export function StatusCard(props: StatusCardProps): JSX.Element;
