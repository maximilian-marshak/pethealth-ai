// ══════════════════════════════════════════════════════════════
// src/components/ui/Switch.jsx  (pethealth-design / Шаг 2)
// Обёртка над RN Switch: трек accent (on) / hairline (off), thumb onAccent.
// Цвета — из useTheme().
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { Switch as RNSwitch } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export default function Switch({ value = false, onValueChange, disabled = false }) {
  const { theme } = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: theme.hairline, true: theme.accent }}
      thumbColor={theme.onAccent}
      ios_backgroundColor={theme.hairline}
    />
  );
}
