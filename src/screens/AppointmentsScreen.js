// ══════════════════════════════════════════════════════════════
// src/screens/AppointmentsScreen.js
// «Мои записи» — список приёмов питомца (S2.2 K2).
// petId приходит через route params (экран вне PetProvider, как RecordDetail).
// Модалка создания подключается в K3 (кнопка «создать» пока no-op).
// ══════════════════════════════════════════════════════════════

import React, { useLayoutEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAppointments } from '../hooks/useAppointments';

const ACCENT = '#6B4EFF';

// Цвет бейджа по статусу.
const STATUS_COLORS = {
  requested: '#F59E0B',
  confirmed: '#22C55E',
  cancelled: '#EF4444',
  completed: '#6B7280',
};

export default function AppointmentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation('medical');
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const { petId } = route.params || {};
  const { future, past, loading, updateStatus, remove } = useAppointments(petId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('appointments.title') });
  }, [navigation, t]);

  const fmt = (ts) =>
    ts
      ? new Date(ts).toLocaleString(locale, {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })
      : '';

  const onCancel = (id) => {
    updateStatus(id, 'cancelled').catch((e) => Alert.alert(t('common:error'), e.message));
  };

  const onDelete = (id) => {
    Alert.alert(
      t('appointments.confirmDelete.title'),
      t('appointments.confirmDelete.message'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: () => remove(id).catch((e) => Alert.alert(t('common:error'), e.message)),
        },
      ]
    );
  };

  const renderCard = (a) => {
    const color = STATUS_COLORS[a.status] || '#6B7280';
    const canCancel = a.status === 'requested' || a.status === 'confirmed';
    return (
      <View key={a.id} style={s.card}>
        <View style={s.cardTop}>
          <Text style={s.clinic} numberOfLines={1}>
            {a.clinic_name || t('appointments.untitled')}
          </Text>
          <View style={[s.badge, { backgroundColor: color + '22' }]}>
            <Text style={[s.badgeText, { color }]}>
              {t(`appointments.status.${a.status}`, { defaultValue: a.status })}
            </Text>
          </View>
        </View>

        {a.reason ? <Text style={s.reason}>{a.reason}</Text> : null}

        <View style={s.dateRow}>
          <Ionicons name="time-outline" size={15} color="#6B7280" />
          <Text style={s.date}>{fmt(a.requested_at)}</Text>
        </View>

        <View style={s.actions}>
          {canCancel && (
            <TouchableOpacity style={s.actionBtn} onPress={() => onCancel(a.id)} activeOpacity={0.7}>
              <Ionicons name="close-circle-outline" size={16} color="#B45309" />
              <Text style={[s.actionText, { color: '#B45309' }]}>{t('appointments.actions.cancel')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.actionBtn} onPress={() => onDelete(a.id)} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={[s.actionText, { color: '#EF4444' }]}>{t('appointments.actions.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSection = (titleKey, items, emptyKey) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{t(titleKey)}</Text>
      {items.length === 0 ? (
        <Text style={s.empty}>{t(emptyKey)}</Text>
      ) : (
        items.map(renderCard)
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={ACCENT} />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {renderSection('appointments.sections.upcoming', future, 'appointments.empty.upcoming')}
          {renderSection('appointments.sections.past', past, 'appointments.empty.past')}
        </ScrollView>
      )}

      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => { /* K3: открыть модалку создания приёма */ }}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={s.fabText}>{t('appointments.create')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8F9FA' },
  content:      { padding: 16, paddingBottom: 96 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  empty:        { fontSize: 13, color: '#9CA3AF', paddingVertical: 8 },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEF0F4' },
  cardTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  clinic:       { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },
  badge:        { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  reason:       { fontSize: 13, color: '#4B5563', marginTop: 6 },
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  date:         { fontSize: 13, color: '#6B7280' },
  actions:      { flexDirection: 'row', gap: 18, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F1F4' },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText:   { fontSize: 13, fontWeight: '600' },
  fab:          { position: 'absolute', right: 16, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 26, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  fabText:      { color: '#fff', fontSize: 15, fontWeight: '600' },
});
