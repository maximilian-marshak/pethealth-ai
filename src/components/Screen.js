// ══════════════════════════════════════════════════════════════
// src/components/Screen.js  (= GlassBackground)
// Базовая обёртка экрана. Фон (вариант B): почти-белая подложка (bgBase) +
// 3 мягких радиальных пастельных «блоба» (mint/peach/blue) через react-native-svg.
// Цветные пятна дают фактуру, на которой читается блюр стекла (GlassCard).
// Слои: bgBase (View) → Svg blobs → SafeArea + children (прозрачные, поверх).
// Все цвета — из theme-токенов (bgBase/bgBlobs); хардкод-hex запрещён.
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export default function Screen({ children, edges = ['top'], style }) {
  const { theme } = useTheme();
  // Статичные размеры экрана — перерисовка только на поворот/resize, не на скролл.
  const { width, height } = useWindowDimensions();
  const span = Math.max(width, height); // радиус блоба в долях от большей стороны

  return (
    <View style={styles.root}>
      {/* Подложка */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bgBase }]} />

      {/* Радиальные пастельные пятна (fade color → transparent по краю) */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
        <Defs>
          {theme.bgBlobs.map((b, i) => (
            <RadialGradient key={`def${i}`} id={`blob${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={b.color} stopOpacity={b.opacity} />
              <Stop offset="100%" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {theme.bgBlobs.map((b, i) => (
          <Circle
            key={`c${i}`}
            cx={b.cx * width}
            cy={b.cy * height}
            r={b.r * span}
            fill={`url(#blob${i})`}
          />
        ))}
      </Svg>

      {/* Контент поверх, прозрачный; SafeArea только сверху по умолчанию */}
      <SafeAreaView edges={edges} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: 'transparent' },
});
