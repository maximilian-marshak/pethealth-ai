// ══════════════════════════════════════════════════════════════
// src/components/IconChip.js
// Круглая тонированная плашка под иконку (StatusCards / quick-actions):
// тонированный фон (цвет + alpha) + линейная Ionicons-иконка по центру.
// Дефолт — accent/accentTint. Все цвета из theme-токенов (хардкод-hex запрещён).
//   bg     — явный фон-токен (приоритет);
//   color  — цвет иконки (default accent); если задан без bg → фон = color + alpha;
//   иначе  — accentTint.
// ══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';

export default function IconChip({ name, color, size = 18, bg, style }) {
  const { theme } = useTheme();
  const iconColor = color || theme.accent;
  // Фон: явный bg → или тинт переданного цвета (color + '20') → или accentTint.
  const background = bg || (color ? color + '20' : theme.accentTint);
  const box = Math.round(size * 1.7);

  const wrap = useMemo(
    () => ({
      width: box,
      height: box,
      borderRadius: box / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: background,
    }),
    [box, background]
  );

  return (
    <View style={[wrap, style]}>
      <Ionicons name={name} size={size} color={iconColor} />
    </View>
  );
}
