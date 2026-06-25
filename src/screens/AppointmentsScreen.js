// ══════════════════════════════════════════════════════════════
// src/screens/AppointmentsScreen.js
// «Мои записи» — список приёмов питомца (S2.2 K2).
// petId приходит через route params (экран вне PetProvider, как RecordDetail).
// Модалка создания подключается в K3 (кнопка «создать» пока no-op).
// ══════════════════════════════════════════════════════════════

import React, { useLayoutEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
  Modal, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { useAppointments } from '../hooks/useAppointments';

export default function AppointmentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation('medical');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  // Цвет бейджа по статусу — семантика здоровья/статуса из токенов.
  const statusColor = {
    requested: theme.warn,
    confirmed: theme.ok,
    cancelled: theme.danger,
    completed: theme.t3,
  };
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const { petId } = route.params || {};
  const { future, past, loading, create, updateStatus, remove } = useAppointments(petId);

  // ── Create-modal state ──
  const [createOpen, setCreateOpen] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [reason, setReason] = useState('');
  const [requestedAt, setRequestedAt] = useState(null); // Date | null
  const [clinicErr, setClinicErr] = useState(false);
  const [dateErr, setDateErr] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerShow, setPickerShow] = useState(false);
  const [androidStep, setAndroidStep] = useState('date'); // 'date' | 'time'

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('appointments.title') });
  }, [navigation, t]);

  const fmtDate = (d) =>
    d
      ? d.toLocaleString(locale, {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })
      : '';
  const fmt = (ts) => (ts ? fmtDate(new Date(ts)) : '');

  const openCreate = () => {
    setClinicName(''); setReason(''); setRequestedAt(null);
    setClinicErr(false); setDateErr(false);
    setPickerShow(false); setAndroidStep('date');
    setCreateOpen(true);
  };

  // datetimepicker: iOS — единый 'datetime'; Android — двухшаговый date → time.
  const onPickerChange = (event, selected) => {
    if (Platform.OS !== 'ios') {
      if (event.type === 'dismissed') { setPickerShow(false); setAndroidStep('date'); return; }
      const base = requestedAt ? new Date(requestedAt) : new Date();
      if (androidStep === 'date' && selected) {
        base.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        setRequestedAt(base);
        setAndroidStep('time'); // показываем следующий шаг — время
        return;
      }
      if (androidStep === 'time' && selected) {
        base.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setRequestedAt(base);
      }
      setPickerShow(false); setAndroidStep('date');
      return;
    }
    // iOS
    if (selected) { setRequestedAt(selected); setDateErr(false); }
  };

  const save = async () => {
    const okClinic = clinicName.trim().length > 0;
    const okDate = !!requestedAt;
    setClinicErr(!okClinic);
    setDateErr(!okDate);
    if (!okClinic || !okDate) {
      Alert.alert(t('common:error'), t('appointments.validation'));
      return;
    }
    setSaving(true);
    try {
      await create({
        clinic_name: clinicName.trim(),
        reason: reason.trim() || null,
        requested_at: requestedAt.toISOString(),
      });
      setCreateOpen(false);
    } catch (e) {
      Alert.alert(t('common:error'), e.message);
    } finally {
      setSaving(false);
    }
  };

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
    const color = statusColor[a.status] || theme.t3;
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
          <Ionicons name="time-outline" size={15} color={theme.t3} />
          <Text style={s.date}>{fmt(a.requested_at)}</Text>
        </View>

        <View style={s.actions}>
          {canCancel && (
            <TouchableOpacity style={s.actionBtn} onPress={() => onCancel(a.id)} activeOpacity={0.7}>
              <Ionicons name="close-circle-outline" size={16} color={theme.warn} />
              <Text style={[s.actionText, { color: theme.warn }]}>{t('appointments.actions.cancel')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.actionBtn} onPress={() => onDelete(a.id)} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
            <Text style={[s.actionText, { color: theme.danger }]}>{t('appointments.actions.delete')}</Text>
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
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {renderSection('appointments.sections.upcoming', future, 'appointments.empty.upcoming')}
          {renderSection('appointments.sections.past', past, 'appointments.empty.past')}
        </ScrollView>
      )}

      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={openCreate}>
        <Ionicons name="add" size={22} color={theme.onAccent} />
        <Text style={s.fabText}>{t('appointments.create')}</Text>
      </TouchableOpacity>

      {/* ── Create modal ── */}
      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setCreateOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{t('appointments.create')}</Text>

            <Text style={s.label}>{t('appointments.form.clinicLabel')}</Text>
            <TextInput
              style={[s.input, clinicErr && s.inputErr]}
              value={clinicName}
              onChangeText={(v) => { setClinicName(v); if (v.trim()) setClinicErr(false); }}
              placeholder={t('appointments.form.clinicPlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={s.label}>{t('appointments.form.reasonLabel')}</Text>
            <TextInput
              style={s.input}
              value={reason}
              onChangeText={setReason}
              placeholder={t('appointments.form.reasonPlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={s.label}>{t('appointments.form.dateLabel')}</Text>
            <TouchableOpacity
              style={[s.input, s.dateField, dateErr && s.inputErr]}
              onPress={() => { setAndroidStep('date'); setPickerShow(true); }}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color={requestedAt ? theme.accent : theme.t4} />
              <Text style={[s.dateText, !requestedAt && s.datePlaceholder]}>
                {requestedAt ? fmtDate(requestedAt) : t('appointments.form.datePlaceholder')}
              </Text>
            </TouchableOpacity>

            {pickerShow && (
              <DateTimePicker
                value={requestedAt || new Date()}
                mode={Platform.OS === 'ios' ? 'datetime' : androidStep}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPickerChange}
              />
            )}

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnCancel]}
                onPress={() => setCreateOpen(false)}
                disabled={saving}
              >
                <Text style={s.modalBtnCancelText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnSave]}
                onPress={save}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={theme.onAccent} />
                ) : (
                  <Text style={s.modalBtnSaveText}>{t('common:save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.bg },
  content:      { padding: 16, paddingBottom: 96 },
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 10 },
  empty:        { fontSize: 13, color: theme.t4, paddingVertical: 8 },
  card:         { backgroundColor: theme.surface, borderRadius: theme.radii.r14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.hairline },
  cardTop:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  clinic:       { flex: 1, fontSize: 15, fontFamily: theme.font.semibold, color: theme.t1 },
  badge:        { paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.radii.sm8 },
  badgeText:    { fontSize: 11, fontFamily: theme.font.bold },
  reason:       { fontSize: 13, color: theme.t2, marginTop: 6 },
  dateRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  date:         { fontSize: 13, color: theme.t3 },
  actions:      { flexDirection: 'row', gap: 18, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.hairline },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText:   { fontSize: 13, fontFamily: theme.font.semibold },
  fab:          { position: 'absolute', right: 16, bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.accent, paddingHorizontal: 18, paddingVertical: 13, borderRadius: theme.radii.r26, shadowColor: theme.shadow.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  fabText:      { color: theme.onAccent, fontSize: 15, fontFamily: theme.font.semibold },

  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard:    { backgroundColor: theme.surface, borderRadius: theme.radii.md16, padding: 20 },
  modalTitle:   { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 14 },
  label:        { fontSize: 13, fontFamily: theme.font.semibold, color: theme.t2, marginBottom: 6, marginTop: 8 },
  input:        { borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.r10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.t1 },
  inputErr:     { borderColor: theme.danger },
  dateField:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText:     { fontSize: 15, color: theme.t1 },
  datePlaceholder: { color: theme.t4 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 18 },
  modalBtn:     { flex: 1, paddingVertical: 13, borderRadius: theme.radii.r10, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: theme.hairline },
  modalBtnSave: { backgroundColor: theme.accent },
  modalBtnCancelText: { color: theme.t1, fontFamily: theme.font.semibold, fontSize: 15 },
  modalBtnSaveText: { color: theme.onAccent, fontFamily: theme.font.semibold, fontSize: 15 },
});
