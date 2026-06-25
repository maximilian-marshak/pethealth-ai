// ══════════════════════════════════════════════════════════════
// src/screens/RecordDetailScreen.js
// Детальный просмотр медзаписи (read-only) + изменить/удалить.
// Вне PetProvider (root Stack): питомец из params (record.pet_id / petId).
// Дочерние таблицы связаны с родителем колонкой record_id.
// ══════════════════════════════════════════════════════════════

import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, Modal, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../utils/supabase';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function RecordDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, i18n } = useTranslation('medical');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

  const { record: paramRecord, recordId, petId } = route.params || {};
  const id = recordId || paramRecord?.id;

  const [record, setRecord]   = useState(paramRecord || null);
  const [loadError, setLoadError] = useState(false);

  const [vaccines, setVaccines]         = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [parasites, setParasites]       = useState([]);
  const [labs, setLabs]                 = useState([]);
  const [hasAttachment, setHasAttachment] = useState(false);
  const [signedUrl, setSignedUrl]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [deleting, setDeleting]         = useState(false);
  const [viewerOpen, setViewerOpen]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) { setLoadError(true); setLoading(false); return; }
      // Дозагрузка родителя, если открыли по одному recordId без объекта record.
      if (!paramRecord) {
        try {
          const { data: parent, error: pErr } = await supabase
            .from('medical_records').select('*').eq('id', id).single();
          if (pErr) throw pErr;
          if (cancelled) return;
          setRecord(parent);
        } catch (e) {
          console.error('RecordDetail parent load:', e?.message);
          if (!cancelled) { setLoadError(true); setLoading(false); }
          return;
        }
      }
      try {
        const [vac, rx, par, lab, att] = await Promise.all([
          supabase.from('record_vaccines').select('*').eq('record_id', id),
          supabase.from('record_prescriptions').select('*').eq('record_id', id),
          supabase.from('record_parasite_treatments').select('*').eq('record_id', id),
          supabase.from('record_lab_tests').select('*').eq('record_id', id),
          supabase.from('record_attachments').select('*').eq('record_id', id).limit(1).maybeSingle(),
        ]);
        if (cancelled) return;
        setVaccines(vac.data || []);
        setPrescriptions(rx.data || []);
        setParasites(par.data || []);
        setLabs(lab.data || []);

        const attachment = att.data;
        if (attachment?.file_url) {
          setHasAttachment(true);
          try {
            const { data: signed, error: sErr } = await supabase.storage
              .from('medical-docs')
              .createSignedUrl(attachment.file_url, 3600);
            if (!cancelled && !sErr && signed?.signedUrl) setSignedUrl(signed.signedUrl);
          } catch (e) {
            console.warn('signed url failed:', e?.message);
          }
        }
      } catch (e) {
        console.error('RecordDetail load:', e?.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleEdit = () => {
    // Переиспользуем существующий RecordModal в MedicalScreen (param сбрасывается там).
    navigation.navigate('MainTabs', { screen: 'Medical', params: { editRecord: record } });
  };

  const handleDelete = () => {
    Alert.alert(t('delete.record.title'), t('delete.record.message'), [
      { text: t('delete.cancel'), style: 'cancel' },
      {
        text: t('delete.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            setDeleting(true);
            const { error } = await supabase.from('medical_records').delete().eq('id', id);
            if (error) throw error;
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('modal.errorTitle'), e.message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const Row = ({ label, value }) =>
    value == null || value === '' ? null : (
      <View style={s.row}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{String(value)}</Text>
      </View>
    );

  const ChildSection = ({ title, items, renderItem }) =>
    !items.length ? null : (
      <View style={s.section}>
        <Text style={s.sectionTitle}>{title}</Text>
        {items.map((it, i) => (
          <View key={it.id || i} style={s.childCard}>{renderItem(it)}</View>
        ))}
      </View>
    );

  const recordTypeLabel = record?.record_type
    ? t(`recordTypes.${record.record_type}`, { defaultValue: record.record_type })
    : t('status.visit');

  const weightValue =
    record?.weight != null && record?.weight !== ''
      ? `${record.weight}${record.weight_unit ? ' ' + t(`review.weightUnits.${record.weight_unit}`, { defaultValue: record.weight_unit }) : ''}`
      : null;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.accent} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('detail.title')}</Text>
        <View style={s.headerBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
      ) : loadError || !record ? (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{t('detail.loadError')}</Text>
          <TouchableOpacity style={[s.btn, s.btnEdit, { alignSelf: 'stretch' }]} onPress={() => navigation.goBack()}>
            <Text style={s.btnEditText}>{t('header.back')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Parent */}
          <View style={s.topRow}>
            <Text style={s.date}>{fmt(record.occurred_at ?? record.date)}</Text>
            <View style={s.badge}><Text style={s.badgeText}>{recordTypeLabel}</Text></View>
          </View>

          <View style={s.section}>
            <Row label={t('review.fields.vetName')} value={record.vet_name} />
            <Row label={t('review.fields.clinicName')} value={record.clinic_name} />
            <Row label={t('review.fields.diagnosis')} value={record.diagnosis} />
            <Row label={t('review.fields.diagnosisCode')} value={record.diagnosis_code} />
            <Row label={t('review.fields.symptoms')} value={record.symptoms} />
            <Row label={t('review.fields.weight')} value={weightValue} />
            <Row label={t('review.fields.temperature')} value={record.temperature} />
            <Row label={t('review.fields.followUp')} value={record.follow_up_date ? fmt(record.follow_up_date) : null} />
            <Row label={t('review.fields.urgency')} value={record.urgency ? t(`urgency.${record.urgency}`, { defaultValue: record.urgency }) : null} />
          </View>

          {record.recommendations ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('detail.recommendations')}</Text>
              <View style={s.recoCard}>
                <Text style={s.recoText}>{String(record.recommendations)}</Text>
              </View>
            </View>
          ) : null}

          {/* Children */}
          <ChildSection
            title={t('review.sections.vaccines')}
            items={vaccines}
            renderItem={(v) => (
              <>
                <Text style={s.childTitle}>{v.vaccine_name || '—'}</Text>
                <Row label={t('review.fields.vaccineType')} value={v.vaccine_type ? t(`vaccineTypes.${v.vaccine_type}`, { defaultValue: v.vaccine_type }) : null} />
                <Row label={t('review.fields.dateGiven')} value={v.date_given ? fmt(v.date_given) : null} />
                <Row label={t('review.fields.nextDue')} value={v.next_due_date ? fmt(v.next_due_date) : null} />
              </>
            )}
          />
          <ChildSection
            title={t('review.sections.prescriptions')}
            items={prescriptions}
            renderItem={(p) => (
              <>
                <Text style={s.childTitle}>{p.name || '—'}</Text>
                <Row label={t('review.fields.dose')} value={p.dose} />
                <Row label={t('review.fields.frequency')} value={p.frequency} />
                <Row label={t('review.fields.startDate')} value={p.start_date ? fmt(p.start_date) : null} />
                <Row label={t('review.fields.endDate')} value={p.end_date ? fmt(p.end_date) : null} />
                <Row label={t('review.fields.instruction')} value={p.instruction} />
                <Row label={t('review.fields.active')} value={p.active === false ? t('status.inactive') : t('status.active')} />
              </>
            )}
          />
          <ChildSection
            title={t('review.sections.parasites')}
            items={parasites}
            renderItem={(p) => (
              <>
                <Text style={s.childTitle}>{p.product || '—'}</Text>
                <Row label={t('review.fields.kind') } value={p.kind ? t(`review.kinds.${p.kind}`, { defaultValue: p.kind }) : null} />
                <Row label={t('review.fields.treatedOn')} value={p.treated_on ? fmt(p.treated_on) : null} />
                <Row label={t('review.fields.nextDue')} value={p.next_due_date ? fmt(p.next_due_date) : null} />
              </>
            )}
          />
          <ChildSection
            title={t('review.sections.labs')}
            items={labs}
            renderItem={(l) => (
              <>
                <Text style={s.childTitle}>{l.test_type || '—'}</Text>
                <Row label={t('review.fields.status')} value={l.status ? t(`review.labStatus.${l.status}`, { defaultValue: l.status }) : null} />
                <Row label={t('review.fields.result')} value={l.result} />
              </>
            )}
          />

          {/* Attachment */}
          {(signedUrl || hasAttachment) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('detail.attachment')}</Text>
              {signedUrl ? (
                <TouchableOpacity activeOpacity={0.85} onPress={() => setViewerOpen(true)}>
                  <Image source={{ uri: signedUrl }} style={s.attachment} resizeMode="contain" />
                </TouchableOpacity>
              ) : (
                <Text style={s.attachmentUnavailable}>{t('detail.attachmentUnavailable')}</Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={s.footer}>
            <TouchableOpacity style={[s.btn, s.btnEdit]} onPress={handleEdit} disabled={deleting}>
              <Ionicons name="create-outline" size={18} color={theme.onAccent} />
              <Text style={s.btnEditText}>{t('card.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.btnDelete]} onPress={handleDelete} disabled={deleting}>
              {deleting ? <ActivityIndicator color={theme.danger} /> : (
                <>
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  <Text style={s.btnDeleteText}>{t('card.delete')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Полноэкранный просмотр вложения: pinch-zoom через ScrollView; signed URL уже получен */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={s.viewerBackdrop}>
          <ScrollView
            style={s.viewerScroll}
            contentContainerStyle={s.viewerContent}
            maximumZoomScale={3}
            minimumZoomScale={1}
            centerContent
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => setViewerOpen(false)}>
              {signedUrl ? (
                <Image source={{ uri: signedUrl }} style={s.viewerImage} resizeMode="contain" />
              ) : null}
            </TouchableOpacity>
          </ScrollView>
          <TouchableOpacity
            style={s.viewerClose}
            onPress={() => setViewerOpen(false)}
            accessibilityLabel={t('common:close')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={28} color={theme.onAccent} />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: theme.bg },
  errorBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  errorText:   { fontSize: 15, color: theme.t3, textAlign: 'center' },
  // Полноэкранный просмотр изображения — фон намеренно чёрный (theme-neutral, как scrim).
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,1)' },
  viewerScroll:   { flex: 1 },
  viewerContent:  { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  viewerImage:    { width: SCREEN_W, height: SCREEN_H },
  viewerClose:    { position: 'absolute', top: 48, right: 16, width: 44, height: 44, borderRadius: theme.radii.pill999, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.hairline },
  headerBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  content:     { padding: 16, paddingBottom: 40 },
  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  date:        { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  badge:       { backgroundColor: theme.accentTint, paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.r10 },
  badgeText:   { fontSize: 11, fontFamily: theme.font.bold, color: theme.accent },
  section:     { marginBottom: 16, borderTopWidth: 1, borderTopColor: theme.hairline, paddingTop: 12 },
  sectionTitle:{ fontSize: 15, fontFamily: theme.font.bold, color: theme.t2, marginBottom: 8 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  rowLabel:    { fontSize: 13, color: theme.t3, flexShrink: 0 },
  rowValue:    { fontSize: 13, color: theme.t1, fontFamily: theme.font.medium, flex: 1, textAlign: 'right' },
  childCard:   { backgroundColor: theme.surface, borderRadius: theme.radii.sm12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.hairline },
  childTitle:  { fontSize: 15, fontFamily: theme.font.semibold, color: theme.t1, marginBottom: 6 },
  recoCard:    { backgroundColor: theme.accentTint, borderLeftWidth: 3, borderLeftColor: theme.accent, borderRadius: theme.radii.r10, padding: 12 },
  recoText:    { fontSize: 14, color: theme.t1, lineHeight: 20 },
  attachment:  { width: '100%', height: 240, borderRadius: theme.radii.sm12, backgroundColor: theme.hairline },
  attachmentUnavailable: { fontSize: 13, color: theme.t4, fontStyle: 'italic' },
  footer:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: theme.radii.sm12 },
  btnEdit:     { backgroundColor: theme.accent },
  btnEditText: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.onAccent },
  btnDelete:   { backgroundColor: theme.danger + '22' },
  btnDeleteText:{ fontSize: 15, fontFamily: theme.font.semibold, color: theme.danger },
});
