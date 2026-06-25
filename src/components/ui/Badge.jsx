// ══════════════════════════════════════════════════════════════
// src/components/ui/Badge.jsx  (pethealth-design / Шаг 2)
// Маленький pill-лейбл для статусов/счётчиков. tone → семейство цвета
// (accent / ok / warn / danger / neutral=t3). soft (деф.) = тинт tone+'22'
// с цветным текстом; solid = заливка tone (текст onAccent; neutral→surface).
// Цвета — из useTheme().
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export default function Badge({ children, tone = 'neutral', solid = false, icon, style }) {
  const { theme } = useTheme();
  const tones = { accent: theme.accent, ok: theme.ok, warn: theme.warn, danger: theme.danger, neutral: theme.t3 };
  const c = tones[tone] || tones.neutral;
  const bg = solid ? c : c + '22';
  const fg = solid ? (tone === 'neutral' ? theme.surface : theme.onAccent) : c;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 4,
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: theme.radii.pill999,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      {children != null ? (
        <Text style={{ fontSize: 11, fontFamily: theme.font.semibold, color: fg, letterSpacing: 0.2 }}>{children}</Text>
      ) : null}
    </View>
  );
}
