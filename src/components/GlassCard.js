// ══════════════════════════════════════════════════════════════
// src/components/GlassCard.js
// Стеклянная карточка (frosted glass) на expo-blur <BlurView>.
// Дисциплина стекла (visual_foundation §2.2):
//   variant='data'  → surfaceGlassData (bg .62 / blur 24) — читаемые данные;
//   variant='decor' → surfaceGlass     (bg .30 / blur 34 / border) — декор/бренд.
// Реализация = BlurView + полупрозрачный bg-оверлей (токен) + 1px бордер.
// Все цвета/радиусы/тени — из theme-токенов (хардкод-hex запрещён).
//
// saturate из токена — web-CSS свойство, в RN недоступно: НЕ применяем,
// читаемость держим на intensity (blur-токен) + плотности bg-альфы.
// Кросс-платформенно: на Android нативный BlurView слабее → включаем
// experimentalBlurMethod='dimezisBlurView' (реальный блюр); базовую
// легибельность в любом случае даёт bg-оверлей токена (.62/.30).
// ══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeProvider';

export default function GlassCard({ variant = 'data', style, children, padding = 16, radius, glow = false }) {
  const { theme, scheme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const glass = variant === 'decor' ? theme.surfaceGlass : theme.surfaceGlassData;
  // decor несёт собственный светлый бордер-токен; data — hairline-разделитель.
  const borderColor = variant === 'decor' ? (glass.border || theme.hairline) : theme.hairline;
  const r = radius ?? theme.radii.lg24;
  // glow=true → мятное свечение accent (glowAccent) вместо мягкой тени; дефолт — тень.
  const sh = glow ? theme.glowAccent : theme.shadow;

  return (
    <View
      style={[
        {
          backgroundColor: 'transparent',
          borderRadius: r,
          shadowColor: sh.shadowColor,
          shadowOpacity: sh.shadowOpacity,
          shadowRadius: sh.shadowRadius,
          shadowOffset: sh.shadowOffset,
          elevation: sh.elevation,
        },
        style,
      ]}
    >
      <View style={[s.clip, { borderRadius: r, borderColor }]}>
        <BlurView
          intensity={glass.blur}
          tint={scheme === 'dark' ? 'dark' : 'light'}
          experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
          style={StyleSheet.absoluteFill}
        />
        {/* Полупрозрачный bg-оверлей — несёт цвет/плотность стекла из токена */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: glass.bg }]} />
        <View style={{ padding }}>{children}</View>
      </View>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  // Клиппинг-слой: скругление + обрезка блюра/оверлея под радиус + бордер.
  // (Тень/glow задаётся инлайн на внешнем слое — зависит от пропа glow.)
  clip: { overflow: 'hidden', borderWidth: 1 },
});
