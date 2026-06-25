// ══════════════════════════════════════════════════════════════
// src/screens/FAQScreen.js
// Статический FAQ — аккордеон вопрос/ответ (без AI). Контент из i18n
// (ai.faq.items). Корневой Stack.Screen, вход из профиля.
// ══════════════════════════════════════════════════════════════

import React, { useLayoutEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';

export default function FAQScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation('ai');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('faq.title') });
  }, [navigation, t]);

  const raw = t('faq.items', { returnObjects: true });
  const items = Array.isArray(raw) ? raw : [];

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {items.map((it, i) => {
          const expanded = open === i;
          return (
            <TouchableOpacity
              key={i}
              style={[s.card, expanded && s.cardOpen]}
              activeOpacity={0.7}
              onPress={() => setOpen(expanded ? null : i)}
            >
              <View style={s.qRow}>
                <Text style={s.q}>{it.q}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={theme.accent} />
              </View>
              {expanded && it.a ? <Text style={s.a}>{it.a}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  content:   { padding: 16 },
  card:      { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.hairline },
  cardOpen:  { borderColor: theme.accent },
  qRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  q:         { flex: 1, fontSize: 15, fontWeight: '600', color: theme.t1 },
  a:         { fontSize: 14, color: theme.t2, lineHeight: 20, marginTop: 10 },
});
