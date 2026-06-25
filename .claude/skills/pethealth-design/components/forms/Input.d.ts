import * as React from 'react';

/**
 * Text field on a solid surface with optional leading icon and accent focus ring.
 */
export interface InputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  /** Leading Ionicons glyph name. */
  icon?: string;
  /** HTML input type. @default "text" */
  type?: string;
  /** Fully rounded pill shape. @default false */
  pill?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
