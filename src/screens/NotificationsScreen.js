// ══════════════════════════════════════════════════════════════
// src/screens/NotificationsScreen.js
// Центр уведомлений — кросс-pet лента due-событий (под-шаг 1).
// Корневой Stack.Screen (petId не нужен). Read-state из useNotifications.
// ══════════════════════════════════════════════════════════════

import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { useNotifications } from '../hooks/useNotifications';

// Иконки по типу (цвет — из токенов, см. typeColor в компоненте).
const TYPE_ICONS = {
  reminder:    'notifications-outline',
  vaccine:     'medkit-outline',
  course_end:  'medical-outline',
  appointment: 'today-outline',
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation('notifications');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  // Цвет по типу: семантика где уместно (vaccine→warn, course_end→ok),
  // прочее (reminder/appointment) — бренд-акцент (decorative-палитра сведена к токенам).
  const typeColor = {
    reminder:    theme.accent,
    vaccine:     theme.warn,
    course_end:  theme.ok,
    appointment: theme.accent,
  };
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const { upcoming, past, unreadCount, loading, markRead, markAllRead, isRead } = useNotifications();

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('title') });
  }, [navigation, t]);

  const fmtDate = (ymd) =>
    ymd ? new Date(`${ymd}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const onPressItem = (ev) => {
    markRead(ev.id);
    if (ev.type === 'appointment' && ev.petId) {
      navigation.navigate('Appointments', { petId: ev.petId });
    }
  };

  const renderItem = (ev) => {
    const icon = TYPE_ICONS[ev.type] || TYPE_ICONS.reminder;
    const color = typeColor[ev.type] || theme.accent;
    const read = isRead(ev.id);
    return (
      <TouchableOpacity
        key={ev.id}
        style={[s.card, !read && s.cardUnread]}
        activeOpacity={0.7}
        onPress={() => onPressItem(ev)}
      >
        <View style={[s.iconWrap, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.type}>{t(`types.${ev.type}`, { defaultValue: ev.type })}</Text>
          <Text style={s.title} numberOfLines={1}>
            {[ev.title, ev.petName].filter(Boolean).join(' · ')}
          </Text>
          <Text style={s.date}>{fmtDate(ev.date)}</Text>
        </View>
        {!read && <View style={[s.dot, { backgroundColor: theme.accent }]} />}
      </TouchableOpacity>
    );
  };

  const isEmpty = !loading && upcoming.length === 0 && past.length === 0;

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {unreadCount > 0 && (
        <View style={s.topBar}>
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={s.markAll}>{t('markAllRead')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
      ) : isEmpty ? (
        <View style={s.empty}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.t4} />
          <Text style={s.emptyTitle}>{t('empty.title')}</Text>
          <Text style={s.emptySub}>{t('empty.subtitle')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {upcoming.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('sections.upcoming')}</Text>
              {upcoming.map(renderItem)}
            </View>
          )}
          {past.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('sections.past')}</Text>
              {past.map(renderItem)}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.bg },
  topBar:       { alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 12 },
  markAll:      { fontSize: 14, fontFamily: theme.font.semibold, color: theme.accent },
  content:      { padding: 16 },
  section:      { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontFamily: theme.font.bold, color: theme.t3, marginBottom: 8, textTransform: 'uppercase' },
  card:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: theme.radii.r14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.hairline },
  cardUnread:   { borderColor: theme.accent, backgroundColor: theme.accentTint },
  iconWrap:     { width: 40, height: 40, borderRadius: theme.radii.sm12, alignItems: 'center', justifyContent: 'center' },
  type:         { fontSize: 11, fontFamily: theme.font.bold, color: theme.t4, textTransform: 'uppercase' },
  title:        { fontSize: 15, fontFamily: theme.font.semibold, color: theme.t1, marginTop: 1 },
  date:         { fontSize: 12, color: theme.t3, marginTop: 2 },
  dot:          { width: 8, height: 8, borderRadius: theme.radii.pill999 },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 17, fontFamily: theme.font.bold, color: theme.t1, marginTop: 16 },
  emptySub:     { fontSize: 14, color: theme.t3, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
