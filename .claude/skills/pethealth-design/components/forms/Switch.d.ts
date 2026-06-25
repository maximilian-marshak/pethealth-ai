import * as React from 'react';

/**
 * Pill toggle switch — accent track when on.
 */
export interface SwitchProps {
  /** @default false */
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Switch(props: SwitchProps): JSX.Element;
