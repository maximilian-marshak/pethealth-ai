// ══════════════════════════════════════════════════════════════
// src/components/Screen.js  (= GlassBackground)
// Базовая обёртка экрана: мятный градиент-фон (theme.bgGradient) на весь
// экран + SafeAreaView поверх. Контент прозрачный — фон даёт градиент.
// Экраны кладут свой скролл/контент внутрь; инсеты управляются пропом edges.
// Все цвета — из theme-токенов (хардкод-hex запрещён).
// ══════════════════════════════════════════════════════════════

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

export default function Screen({ children, edges = ['top'], style }) {
  const { theme } = useTheme();
  return (
    <View style={styles.root}>
      {/* Фон — мятный bg-градиент из токена (light/dark стопы) */}
      <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFill} />
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
