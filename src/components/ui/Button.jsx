// ══════════════════════════════════════════════════════════════
// src/components/ui/Button.jsx  (pethealth-design / Шаг 2)
// Pill-кнопка. primary = accentPress fill (белый текст AA), secondary =
// accentTint, ghost = прозрачная, outline = hairline-бордер, danger = danger.
// Все цвета/радиусы/шрифт — из useTheme(); иконки — Ionicons.
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

const SIZES = {
  sm: { fontSize: 13, padV: 8, padH: 14, gap: 6, icon: 16 },
  md: { fontSize: 15, padV: 12, padH: 18, gap: 8, icon: 18 },
  lg: { fontSize: 17, padV: 15, padH: 22, gap: 9, icon: 20 },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block = false,
  disabled = false,
  onPress,
  style,
}) {
  const { theme } = useTheme();
  const s = SIZES[size] || SIZES.md;
  const variants = {
    primary:   { bg: theme.accentPress, fg: theme.onAccent,    border: 'transparent' },
    secondary: { bg: theme.accentTint,  fg: theme.accentPress, border: 'transparent' },
    ghost:     { bg: 'transparent',     fg: theme.accentPress, border: 'transparent' },
    outline:   { bg: 'transparent',     fg: theme.t1,          border: theme.hairline },
    danger:    { bg: theme.danger,      fg: theme.onAccent,    border: 'transparent' },
  };
  const v = variants[variant] || variants.primary;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: s.gap,
          paddingVertical: s.padV,
          paddingHorizontal: s.padH,
          borderRadius: theme.radii.pill999,
          borderWidth: 1,
          borderColor: v.border,
          backgroundColor: v.bg,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={s.icon} color={v.fg} /> : null}
      {children != null ? (
        <Text style={{ color: v.fg, fontSize: s.fontSize, fontFamily: theme.font.bold }}>{children}</Text>
      ) : null}
      {iconRight ? <Ionicons name={iconRight} size={s.icon} color={v.fg} /> : null}
    </Pressable>
  );
}
