// ══════════════════════════════════════════════════════════════
// src/screens/RelocationScreen.js
// Помощник по переезду — статический чеклист (без AI) с отметками.
// Отметки persist в AsyncStorage (множество id отмеченных пунктов).
// Контент из i18n (ai.relocation.*). Прогресс N из M сверху.
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import ProgressBar from '../components/ProgressBar';

const STORE_KEY = '@pethealth_relocation_checklist';

export default function RelocationScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation('ai');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const [checked, setChecked] = useState({}); // { 'sectionId:index': true }

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('relocation.title') });
  }, [navigation, t]);

  // Загрузка отметок (некритично).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORE_KEY);
        if (raw) setChecked(JSON.parse(raw) || {});
      } catch (e) {
        console.warn('relocation: load failed (non-critical):', e?.message);
      }
    })();
  }, []);

  const rawSections = t('relocation.sections', { returnObjects: true });
  const sections = Array.isArray(rawSections) ? rawSections : [];

  const allIds = useMemo(
    () => sections.flatMap((sec) => (Array.isArray(sec.items) ? sec.items : []).map((_, i) => `${sec.id}:${i}`)),
    [sections],
  );
  const total = allIds.length;
  const done = allIds.filter((id) => checked[id]).length;

  const toggle = async (id) => {
    const next = { ...checked };
    if (next[id]) delete next[id];
    else next[id] = true;
    setChecked(next);
    try {
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('relocation: persist failed:', e?.message);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.progressCard}>
          <Text style={s.progressText}>{t('relocation.progress', { done, total })}</Text>
          <ProgressBar current={done} goal={total || 1} height={10} />
        </View>

        <View style={s.disclaimer}>
          <Ionicons name="information-circle-outline" size={18} color={theme.t3} />
          <Text style={s.disclaimerText}>{t('relocation.disclaimer')}</Text>
        </View>

        {sections.map((sec) => (
          <View key={sec.id} style={s.section}>
            <View style={s.secHeader}>
              <View style={s.secIcon}>
                <Ionicons name={sec.icon || 'list-outline'} size={18} color={theme.accent} />
              </View>
              <Text style={s.secTitle}>{sec.title}</Text>
            </View>
            {(Array.isArray(sec.items) ? sec.items : []).map((item, i) => {
              const id = `${sec.id}:${i}`;
              const on = !!checked[id];
              return (
                <TouchableOpacity key={id} style={s.itemRow} activeOpacity={0.7} onPress={() => toggle(id)}>
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? theme.accent : theme.t4} />
                  <Text style={[s.itemText, on && s.itemTextDone]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.bg },
  content:        { padding: 16 },
  progressCard:   { backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.hairline },
  progressText:   { fontSize: 14, fontWeight: '700', color: theme.t1, marginBottom: 8 },
  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: theme.accentTint, borderRadius: 12, padding: 12, marginBottom: 14 },
  disclaimerText: { flex: 1, fontSize: 12, color: theme.t3, lineHeight: 17 },
  section:        { backgroundColor: theme.surface, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.hairline, overflow: 'hidden' },
  secHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.hairline },
  secIcon:        { width: 32, height: 32, borderRadius: 9, backgroundColor: theme.accentTint, alignItems: 'center', justifyContent: 'center' },
  secTitle:       { flex: 1, fontSize: 15, fontWeight: '700', color: theme.t1 },
  itemRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  itemText:       { flex: 1, fontSize: 14, color: theme.t2, lineHeight: 20 },
  itemTextDone:   { color: theme.t4, textDecorationLine: 'line-through' },
});
