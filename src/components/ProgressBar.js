import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

export default function ProgressBar({ current = 0, goal = 1000, height = 12 }) {
  const { theme } = useTheme();
  const percentage = Math.min((current / goal) * 100, 100);

  // Цвета — из активных токенов (light/dark + mint/peach/blue):
  // трек — accentTint (лёгкий бренд-тон, читается как дорожка показателя),
  // заливка — тональный градиент бренд-акцента (accent → accentPress).
  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.background, { backgroundColor: theme.accentTint }]}>
        <LinearGradient
          colors={[theme.accent, theme.accentPress]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percentage}%` }]}
        />
      </View>
    </View>
  );
}

// Только layout (не зависит от темы); цвета задаются inline от theme выше.
const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    borderRadius: 100,
  },
  fill: {
    height: '100%',
    borderRadius: 100,
  },
});
