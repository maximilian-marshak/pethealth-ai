// ══════════════════════════════════════════════════════════════
// src/components/Segmented.js
// Сегмент-контрол (Список ↔ Календарь ↔ Паспорт, табы и т.п.).
// Активный сегмент — surface + тень; неактивные — приглушённый t3.
// Все цвета из theme-токенов. Перенос веб-примитива Segmented из прототипа.
// ══════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// options: [{ k: 'list', label: '...' }, ...]
export default function Segmented({ options, value, onChange }) {
  const { theme, scheme } = useTheme();
  const trackBg = scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)';

  return (
    <View style={[styles.track, { backgroundColor: trackBg, borderRadius: theme.radii.pill999 }]}>
      {options.map((o) => {
        const active = value === o.k;
        return (
          <Pressable
            key={o.k}
            onPress={() => onChange(o.k)}
            style={[
              styles.seg,
              { borderRadius: theme.radii.pill999 },
              active && { backgroundColor: theme.surface, ...theme.shadow },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, { color: active ? theme.t1 : theme.t3, fontFamily: theme.font.bold }]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, gap: 2 },
  seg: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13 },
});
