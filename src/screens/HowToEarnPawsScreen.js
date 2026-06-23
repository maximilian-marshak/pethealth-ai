// ══════════════════════════════════════════════════════════════
// src/screens/HowToEarnPawsScreen.js
// «Как заработать Paws» — read-only список начисляемых событий из
// gamification_config (RLS select для authenticated). Без AI, без записи.
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../utils/supabase';

// Иконка по event_key (фолбэк — paw-outline).
const EVENT_ICONS = {
  visit_verified:       'medical-outline',
  vaccination_verified: 'medkit-outline',
  reminder_completed:   'notifications-outline',
  course_completed:     'checkmark-done-outline',
  ocr_document:         'document-text-outline',
  daily_checkin:        'today-outline',
  streak_7:             'flame-outline',
  streak_30:            'flame',
  manual_first:         'create-outline',
  medication_taken:     'bandage-outline',
};

export default function HowToEarnPawsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation('dashboard');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('paws.howToEarn.title') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gamification_config')
        .select('event_key, points, daily_cap, enabled')
        .eq('enabled', true);
      if (error) throw error;
      const list = (data || [])
        .filter((r) => (r.points || 0) > 0)
        .sort((a, b) => (b.points || 0) - (a.points || 0));
      setItems(list);
    } catch (e) {
      console.warn('HowToEarnPaws: load failed (non-critical):', e?.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderItem = ({ item }) => {
    const icon = EVENT_ICONS[item.event_key] || 'paw-outline';
    return (
      <View style={s.row}>
        <View style={s.iconWrap}>
          <Ionicons name={icon} size={22} color={theme.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>
            {t(`paws.events.${item.event_key}`, { defaultValue: item.event_key })}
          </Text>
          {item.daily_cap ? (
            <Text style={s.cap}>{t('paws.howToEarn.dailyCap', { count: item.daily_cap })}</Text>
          ) : null}
        </View>
        <Text style={s.points}>+{item.points}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <Text style={s.subtitle}>{t('paws.howToEarn.subtitle')}</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.event_key}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  subtitle:  { fontSize: 14, color: theme.t3, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, lineHeight: 20 },
  list:      { padding: 16 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.hairline },
  iconWrap:  { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.accentTint, alignItems: 'center', justifyContent: 'center' },
  name:      { fontSize: 15, fontWeight: '600', color: theme.t1 },
  cap:       { fontSize: 12, color: theme.t4, marginTop: 2 },
  points:    { fontSize: 16, fontWeight: '800', color: theme.accent },
});
