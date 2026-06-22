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
import ProgressBar from '../components/ProgressBar';

const ACCENT = '#6B4EFF';
const STORE_KEY = '@pethealth_relocation_checklist';

export default function RelocationScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation('ai');
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
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={s.disclaimerText}>{t('relocation.disclaimer')}</Text>
        </View>

        {sections.map((sec) => (
          <View key={sec.id} style={s.section}>
            <View style={s.secHeader}>
              <View style={s.secIcon}>
                <Ionicons name={sec.icon || 'list-outline'} size={18} color={ACCENT} />
              </View>
              <Text style={s.secTitle}>{sec.title}</Text>
            </View>
            {(Array.isArray(sec.items) ? sec.items : []).map((item, i) => {
              const id = `${sec.id}:${i}`;
              const on = !!checked[id];
              return (
                <TouchableOpacity key={id} style={s.itemRow} activeOpacity={0.7} onPress={() => toggle(id)}>
                  <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? ACCENT : '#9CA3AF'} />
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

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FA' },
  content:        { padding: 16 },
  progressCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EEF0F4' },
  progressText:   { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, marginBottom: 14 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 17 },
  section:        { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEF0F4', overflow: 'hidden' },
  secHeader:      { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F1F4' },
  secIcon:        { width: 32, height: 32, borderRadius: 9, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  secTitle:       { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F2937' },
  itemRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  itemText:       { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  itemTextDone:   { color: '#9CA3AF', textDecorationLine: 'line-through' },
});
