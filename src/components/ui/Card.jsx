// ══════════════════════════════════════════════════════════════
// src/components/ui/Card.jsx  (pethealth-design / Шаг 2)
// Плотная solid-поверхность для данных (числа, записи, формы):
// surface + hairline-бордер + мягкая тень + radii.md16. statusColor →
// левый 4px-страйп (health status). onPress → Pressable, иначе View.
// Все значения — из useTheme().
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

export default function Card({ children, padding = 16, radius, statusColor, onPress, style }) {
  const { theme } = useTheme();
  const r = radius ?? theme.radii.md16;
  const base = {
    backgroundColor: theme.surface,
    borderRadius: r,
    borderWidth: 1,
    borderColor: theme.hairline,
    padding,
    shadowColor: theme.shadow.shadowColor,
    shadowOpacity: theme.shadow.shadowOpacity,
    shadowRadius: theme.shadow.shadowRadius,
    shadowOffset: theme.shadow.shadowOffset,
    elevation: theme.shadow.elevation,
    ...(statusColor ? { borderLeftWidth: 4, borderLeftColor: statusColor } : null),
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
