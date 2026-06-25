// ══════════════════════════════════════════════════════════════
// src/screens/OCRReviewScreen.js
// Проверка/правка распознанной выписки и сохранение через save_medical_record.
// Параметры навигации: { data, imageUri, petId }. base64 НЕ передаётся.
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { useLoyaltyPoints } from '../hooks/useLoyaltyPoints';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../utils/supabase';
import AutocompleteInput from '../components/AutocompleteInput';
import { VACCINES, ANTIPARASITICS, DRUGS } from '../data/medicalPresets';

const RECORD_TYPES   = ['visit', 'vaccination', 'medication_course', 'parasite_treatment', 'procedure', 'lab_test', 'other'];
const URGENCIES      = ['normal', 'elevated', 'high'];
const VACCINE_TYPES  = ['primary', 'booster'];
const PARASITE_KINDS = ['deworming', 'ectoparasite'];
const LAB_STATUSES   = ['ordered', 'completed'];
const WEIGHT_UNITS   = ['kg', 'lb'];

const ARRAY_FOR_TYPE = {
  vaccines: 'vaccination',
  prescriptions: 'medication_course',
  parasite_treatments: 'parasite_treatment',
  lab_tests: 'lab_test',
};

// Стабильный id строки для корректного reconciliation (ключи + удаление по id).
let _rowSeq = 0;
const newRowId = () => `row${++_rowSeq}`;

// Чистые маппинги массивов из распознанного data (всегда новый массив).
const mapVaccines = (d) =>
  (d?.vaccines || []).map((v) => ({
    _id: newRowId(),
    vaccine_name: v.vaccine_name || '', vaccine_type: v.vaccine_type || 'primary',
    date_given: v.date_given || '', next_due_date: v.next_due_date || '',
  }));
const mapPrescriptions = (d) =>
  (d?.prescriptions || []).map((p) => ({
    _id: newRowId(),
    name: p.name || '', dose: p.dose || '', frequency: p.frequency || '',
    start_date: p.start_date || '', end_date: p.end_date || '',
    active: p.active !== false, instruction: p.instruction || '',
  }));
const mapParasites = (d) =>
  (d?.parasite_treatments || []).map((p) => ({
    _id: newRowId(),
    kind: p.kind || 'deworming', product: p.product || '',
    treated_on: p.treated_on || '', next_due_date: p.next_due_date || '',
  }));
const mapLabs = (d) =>
  (d?.lab_tests || []).map((l) => ({
    _id: newRowId(),
    test_type: l.test_type || '', status: l.status || 'ordered', result: l.result || '',
  }));

// Приведение значения к строке для state (ловит и нестроковые из OCR).
const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
// Null-safe обрезка для payload: строка → trim ('' → null); иначе v ?? null.
const clean = (v) =>
  typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : (v ?? null);
// Безопасный парс числа: null при пустом/NaN.
const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// ─── Локальный DateField (дубликат, чтобы не трогать MedicalScreen) ──────────
const DateField = ({ label, value, onChange, flag, t }) => {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value + 'T00:00:00') : new Date();

  const handle = (event, selected) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') { setShow(false); return; }
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
    if (Platform.OS === 'ios') setShow(false);
  };

  return (
    <View style={s.fieldWrap}>
      {label != null && <FieldLabel label={label} flag={flag} t={t} />}
      <TouchableOpacity style={[s.input, s.dateField, flag && s.flagged]} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={18} color={value ? theme.accent : theme.t4} />
        <Text style={[s.dateText, !value && { color: theme.t4 }]}>{value || t('review.pickDate')}</Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={theme.t4} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {show && (
        <DateTimePicker value={dateValue} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handle} />
      )}
    </View>
  );
};

const FieldLabel = ({ label, flag, t }) => {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.labelRow}>
      <Text style={s.label}>{label}</Text>
      {flag && <Text style={s.checkHint}>{t('review.checkHint')}</Text>}
    </View>
  );
};

// ─── Текстовое поле с подсветкой проверки ───────────────────────────────────
const Field = ({ label, value, onChange, flag, t, multiline, keyboardType }) => {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.fieldWrap}>
      {label != null && <FieldLabel label={label} flag={flag} t={t} />}
      <TextInput
        style={[s.input, multiline && s.textArea, flag && s.flagged]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={theme.t4}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
};

const Chips = ({ options, value, onChange, labelFor }) => {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.chipsRow}>
      {options.map((o) => (
        <TouchableOpacity key={o} style={[s.chip, value === o && s.chipActive]} onPress={() => onChange(o)}>
          <Text style={[s.chipText, value === o && s.chipTextActive]}>{labelFor(o)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function OCRReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const { awardEvent } = useLoyaltyPoints();

  const { data = {}, imageUri, petId } = route.params || {};
  const conf = data.confidence || {};

  // ─── Скаляры ──────────────────────────────────────────────────────────────
  const [recordType, setRecordType]         = useState(data.record_type || 'visit');
  const [occurredAt, setOccurredAt]         = useState(str(data.occurred_at));
  const [vetName, setVetName]               = useState(str(data.vet_name));
  const [clinicName, setClinicName]         = useState(str(data.clinic_name));
  const [diagnosis, setDiagnosis]           = useState(str(data.diagnosis));
  const [diagnosisCode, setDiagnosisCode]   = useState(str(data.diagnosis_code));
  const [symptoms, setSymptoms]             = useState(str(data.symptoms));
  const [recommendations, setRecommendations] = useState(str(data.recommendations));
  const [weight, setWeight]                 = useState(data.weight != null ? String(data.weight) : '');
  const [weightUnit, setWeightUnit]         = useState(data.weight_unit || 'kg');
  const [temperature, setTemperature]       = useState(data.temperature != null ? String(data.temperature) : '');
  const [followUpDate, setFollowUpDate]     = useState(str(data.follow_up_date));
  const [urgency, setUrgency]               = useState(data.urgency || 'normal');

  // ─── Массивы ──────────────────────────────────────────────────────────────
  const [vaccines, setVaccines]         = useState(mapVaccines(data));
  const [prescriptions, setPrescriptions] = useState(mapPrescriptions(data));
  const [parasites, setParasites]       = useState(mapParasites(data));
  const [labs, setLabs]                 = useState(mapLabs(data));

  const [saving, setSaving] = useState(false);

  // Новый скан = новый scanId → полностью переинициализируем форму, иначе на
  // переиспользованном экране остаются поля/массивы прошлого скана.
  const scanId = route.params?.scanId;
  useEffect(() => {
    setRecordType(data.record_type || 'visit');
    setOccurredAt(str(data.occurred_at));
    setVetName(str(data.vet_name));
    setClinicName(str(data.clinic_name));
    setDiagnosis(str(data.diagnosis));
    setDiagnosisCode(str(data.diagnosis_code));
    setSymptoms(str(data.symptoms));
    setRecommendations(str(data.recommendations));
    setWeight(data.weight != null ? String(data.weight) : '');
    setWeightUnit(data.weight_unit || 'kg');
    setTemperature(data.temperature != null ? String(data.temperature) : '');
    setFollowUpDate(str(data.follow_up_date));
    setUrgency(data.urgency || 'normal');
    setVaccines(mapVaccines(data));
    setPrescriptions(mapPrescriptions(data));
    setParasites(mapParasites(data));
    setLabs(mapLabs(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  const needsReview = (field, value) => {
    const empty = value == null || value === '' || (Array.isArray(value) && value.length === 0);
    const low = conf[field] != null && conf[field] < 0.6;
    return empty || low;
  };

  const showArr = (name, items) => items.length > 0 || recordType === ARRAY_FOR_TYPE[name];

  const upd = (setter, id, key, val) =>
    setter((prev) => prev.map((it) => (it._id === id ? { ...it, [key]: val } : it)));
  const rm = (setter, id) => setter((prev) => prev.filter((it) => it._id !== id));

  // Очистить весь список (подтверждение). Тот же сеттер, без нового источника истины.
  const clearAll = (setter) => {
    Alert.alert(
      t('review.clearAllConfirm'),
      undefined,
      [
        { text: t('review.cancel'), style: 'cancel' },
        { text: t('review.clearAll'), style: 'destructive', onPress: () => setter([]) },
      ]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const p_payload = {
        pet_id: petId,
        record_type: recordType,
        source: 'ocr',
        occurred_at: clean(occurredAt),
        vet_name: clean(vetName),
        clinic_name: clean(clinicName),
        diagnosis: clean(diagnosis),
        diagnosis_code: clean(diagnosisCode),
        symptoms: clean(symptoms),
        recommendations: clean(recommendations),
        weight: toNum(weight),
        weight_unit: weightUnit || null,
        temperature: toNum(temperature),
        follow_up_date: clean(followUpDate),
        urgency: urgency || null,
        vaccines: vaccines.map((v) => ({
          vaccine_name: clean(v.vaccine_name),
          vaccine_type: v.vaccine_type || null,
          date_given: clean(v.date_given),
          next_due_date: clean(v.next_due_date),
        })),
        prescriptions: prescriptions.map((pr) => ({
          name: clean(pr.name),
          dose: clean(pr.dose),
          frequency: clean(pr.frequency),
          start_date: clean(pr.start_date),
          end_date: clean(pr.end_date),
          active: pr.active !== false,
          instruction: clean(pr.instruction),
        })),
        parasite_treatments: parasites.map((pt) => ({
          kind: pt.kind || null,
          product: clean(pt.product),
          treated_on: clean(pt.treated_on),
          next_due_date: clean(pt.next_due_date),
        })),
        lab_tests: labs.map((l) => ({
          test_type: clean(l.test_type),
          status: l.status || null,
          result: clean(l.result),
        })),
      };

      const { data: saveResult, error } = await supabase.rpc('save_medical_record', { p_payload });
      if (error) throw error;

      // Начисление за сохранённый OCR-документ (идемпотентно по dedup_key на сервере).
      await awardEvent('ocr_document', `${petId}|ocr_doc|${occurredAt}|${recordType}`, { sourceType: 'ocr' });

      // Вложение оригинала в бакет — НЕ фатально: запись уже сохранена (RPC прошёл).
      let attachFailed = false;
      const recordId = saveResult?.record_id;
      if (recordId && imageUri) {
        try {
          const path = `${petId}/${recordId}/scan.jpg`;
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const bytes = decode(base64);

          const { error: upErr } = await supabase.storage
            .from('medical-docs')
            .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
          if (upErr) throw upErr;

          const { error: insErr } = await supabase.from('record_attachments').insert({
            record_id: recordId,
            pet_id: petId,
            file_url: path,
            file_type: 'image',
            page: 1,
            ocr_text: null,
            ocr_confidence: null,
          });
          if (insErr) throw insErr;
        } catch (attachErr) {
          attachFailed = true;
          console.error('❌ Attachment failed (record kept):', attachErr.message);
        }
      }

      Alert.alert(
        t('review.savedTitle'),
        attachFailed ? `${t('review.savedMessage')}\n${t('review.attachWarning')}` : t('review.savedMessage')
      );
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('review.errorTitle'), e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.accent} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('review.title')}</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {imageUri ? <Image source={{ uri: imageUri }} style={s.preview} resizeMode="cover" /> : null}

        {/* Record type */}
        <Text style={s.sectionTitle}>{t('review.fields.recordType')}</Text>
        <Chips options={RECORD_TYPES} value={recordType} onChange={setRecordType}
          labelFor={(o) => t(`recordTypes.${o}`, { defaultValue: o })} />

        {/* Scalars */}
        <DateField label={t('review.fields.occurredAt')} value={occurredAt} onChange={setOccurredAt} flag={needsReview('occurred_at', occurredAt)} t={t} />
        <Field label={t('review.fields.vetName')} value={vetName} onChange={setVetName} flag={needsReview('vet_name', vetName)} t={t} />
        <Field label={t('review.fields.clinicName')} value={clinicName} onChange={setClinicName} flag={needsReview('clinic_name', clinicName)} t={t} />
        <Field label={t('review.fields.diagnosis')} value={diagnosis} onChange={setDiagnosis} flag={needsReview('diagnosis', diagnosis)} t={t} />
        <Field label={t('review.fields.diagnosisCode')} value={diagnosisCode} onChange={setDiagnosisCode} flag={needsReview('diagnosis_code', diagnosisCode)} t={t} />
        <Field label={t('review.fields.symptoms')} value={symptoms} onChange={setSymptoms} flag={needsReview('symptoms', symptoms)} t={t} multiline />
        <Field label={t('review.fields.recommendations')} value={recommendations} onChange={setRecommendations} flag={needsReview('recommendations', recommendations)} t={t} multiline />

        {/* Weight + unit */}
        <FieldLabel label={t('review.fields.weight')} flag={needsReview('weight', weight)} t={t} />
        <View style={s.weightRow}>
          <TextInput style={[s.input, { flex: 1 }, needsReview('weight', weight) && s.flagged]} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholderTextColor={theme.t4} />
          <Chips options={WEIGHT_UNITS} value={weightUnit} onChange={setWeightUnit} labelFor={(o) => t(`review.weightUnits.${o}`, { defaultValue: o })} />
        </View>

        <Field label={t('review.fields.temperature')} value={temperature} onChange={setTemperature} flag={needsReview('temperature', temperature)} t={t} keyboardType="decimal-pad" />
        <DateField label={t('review.fields.followUp')} value={followUpDate} onChange={setFollowUpDate} flag={needsReview('follow_up_date', followUpDate)} t={t} />

        <FieldLabel label={t('review.fields.urgency')} flag={needsReview('urgency', urgency)} t={t} />
        <Chips options={URGENCIES} value={urgency} onChange={setUrgency} labelFor={(o) => t(`urgency.${o}`, { defaultValue: o })} />

        {/* Vaccines */}
        {showArr('vaccines', vaccines) && (
          <View style={s.arrSection}>
            <View style={s.arrHeader}>
              <Text style={s.sectionTitle}>{t('review.sections.vaccines')}</Text>
              {vaccines.length > 0 && (
                <TouchableOpacity onPress={() => clearAll(setVaccines)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.clearAllText}>{t('review.clearAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {vaccines.map((v, i) => (
              <View key={v._id} style={s.itemCard}>
                <View style={s.itemHead}>
                  <Text style={s.itemIdx}>#{i + 1}</Text>
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => rm(setVaccines, v._id)}><Ionicons name="trash-outline" size={18} color={theme.danger} /></TouchableOpacity>
                </View>
                <AutocompleteInput label={t('review.fields.vaccineName')} value={v.vaccine_name} onChangeText={(x) => upd(setVaccines, v._id, 'vaccine_name', x)} suggestions={VACCINES} flag={!v.vaccine_name} t={t} />
                <Chips options={VACCINE_TYPES} value={v.vaccine_type} onChange={(x) => upd(setVaccines, v._id, 'vaccine_type', x)} labelFor={(o) => t(`vaccineTypes.${o}`, { defaultValue: o })} />
                <DateField label={t('review.fields.dateGiven')} value={v.date_given} onChange={(x) => upd(setVaccines, v._id, 'date_given', x)} t={t} />
                <DateField label={t('review.fields.nextDue')} value={v.next_due_date} onChange={(x) => upd(setVaccines, v._id, 'next_due_date', x)} t={t} />
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={() => setVaccines([...vaccines, { _id: newRowId(), vaccine_name: '', vaccine_type: 'primary', date_given: '', next_due_date: '' }])}>
              <Ionicons name="add" size={18} color={theme.accent} /><Text style={s.addBtnText}>{t('review.addItem')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Prescriptions */}
        {showArr('prescriptions', prescriptions) && (
          <View style={s.arrSection}>
            <View style={s.arrHeader}>
              <Text style={s.sectionTitle}>{t('review.sections.prescriptions')}</Text>
              {prescriptions.length > 0 && (
                <TouchableOpacity onPress={() => clearAll(setPrescriptions)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.clearAllText}>{t('review.clearAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {prescriptions.map((p, i) => (
              <View key={p._id} style={s.itemCard}>
                <View style={s.itemHead}>
                  <Text style={s.itemIdx}>#{i + 1}</Text>
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => rm(setPrescriptions, p._id)}><Ionicons name="trash-outline" size={18} color={theme.danger} /></TouchableOpacity>
                </View>
                <AutocompleteInput label={t('review.fields.name')} value={p.name} onChangeText={(x) => upd(setPrescriptions, p._id, 'name', x)} suggestions={DRUGS} flag={!p.name} t={t} />
                <Field label={t('review.fields.dose')} value={p.dose} onChange={(x) => upd(setPrescriptions, p._id, 'dose', x)} t={t} />
                <Field label={t('review.fields.frequency')} value={p.frequency} onChange={(x) => upd(setPrescriptions, p._id, 'frequency', x)} t={t} />
                <DateField label={t('review.fields.startDate')} value={p.start_date} onChange={(x) => upd(setPrescriptions, p._id, 'start_date', x)} t={t} />
                <DateField label={t('review.fields.endDate')} value={p.end_date} onChange={(x) => upd(setPrescriptions, p._id, 'end_date', x)} t={t} />
                <Field label={t('review.fields.instruction')} value={p.instruction} onChange={(x) => upd(setPrescriptions, p._id, 'instruction', x)} t={t} multiline />
                <TouchableOpacity style={s.toggleRow} onPress={() => upd(setPrescriptions, p._id, 'active', !p.active)}>
                  <Text style={s.label}>{t('review.fields.active')}</Text>
                  <Ionicons name={p.active ? 'checkbox' : 'square-outline'} size={22} color={p.active ? theme.accent : theme.t4} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={() => setPrescriptions([...prescriptions, { _id: newRowId(), name: '', dose: '', frequency: '', start_date: '', end_date: '', active: true, instruction: '' }])}>
              <Ionicons name="add" size={18} color={theme.accent} /><Text style={s.addBtnText}>{t('review.addItem')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Parasite treatments */}
        {showArr('parasite_treatments', parasites) && (
          <View style={s.arrSection}>
            <View style={s.arrHeader}>
              <Text style={s.sectionTitle}>{t('review.sections.parasites')}</Text>
              {parasites.length > 0 && (
                <TouchableOpacity onPress={() => clearAll(setParasites)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.clearAllText}>{t('review.clearAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {parasites.map((p, i) => (
              <View key={p._id} style={s.itemCard}>
                <View style={s.itemHead}>
                  <Text style={s.itemIdx}>#{i + 1}</Text>
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => rm(setParasites, p._id)}><Ionicons name="trash-outline" size={18} color={theme.danger} /></TouchableOpacity>
                </View>
                <Chips options={PARASITE_KINDS} value={p.kind} onChange={(x) => upd(setParasites, p._id, 'kind', x)} labelFor={(o) => t(`review.kinds.${o}`, { defaultValue: o })} />
                <AutocompleteInput label={t('review.fields.product')} value={p.product} onChangeText={(x) => upd(setParasites, p._id, 'product', x)} suggestions={ANTIPARASITICS} flag={!p.product} t={t} />
                <DateField label={t('review.fields.treatedOn')} value={p.treated_on} onChange={(x) => upd(setParasites, p._id, 'treated_on', x)} t={t} />
                <DateField label={t('review.fields.nextDue')} value={p.next_due_date} onChange={(x) => upd(setParasites, p._id, 'next_due_date', x)} t={t} />
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={() => setParasites([...parasites, { _id: newRowId(), kind: 'deworming', product: '', treated_on: '', next_due_date: '' }])}>
              <Ionicons name="add" size={18} color={theme.accent} /><Text style={s.addBtnText}>{t('review.addItem')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lab tests */}
        {showArr('lab_tests', labs) && (
          <View style={s.arrSection}>
            <View style={s.arrHeader}>
              <Text style={s.sectionTitle}>{t('review.sections.labs')}</Text>
              {labs.length > 0 && (
                <TouchableOpacity onPress={() => clearAll(setLabs)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={s.clearAllText}>{t('review.clearAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {labs.map((l, i) => (
              <View key={l._id} style={s.itemCard}>
                <View style={s.itemHead}>
                  <Text style={s.itemIdx}>#{i + 1}</Text>
                  <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} onPress={() => rm(setLabs, l._id)}><Ionicons name="trash-outline" size={18} color={theme.danger} /></TouchableOpacity>
                </View>
                <Field label={t('review.fields.testType')} value={l.test_type} onChange={(x) => upd(setLabs, l._id, 'test_type', x)} flag={!l.test_type} t={t} />
                <Chips options={LAB_STATUSES} value={l.status} onChange={(x) => upd(setLabs, l._id, 'status', x)} labelFor={(o) => t(`review.labStatus.${o}`, { defaultValue: o })} />
                <Field label={t('review.fields.result')} value={l.result} onChange={(x) => upd(setLabs, l._id, 'result', x)} t={t} multiline />
              </View>
            ))}
            <TouchableOpacity style={s.addBtn} onPress={() => setLabs([...labs, { _id: newRowId(), test_type: '', status: 'ordered', result: '' }])}>
              <Ionicons name="add" size={18} color={theme.accent} /><Text style={s.addBtnText}>{t('review.addItem')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.footer}>
          <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={() => navigation.goBack()} disabled={saving}>
            <Text style={s.btnCancelText}>{t('review.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSave]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={theme.onAccent} /> : <Text style={s.btnSaveText}>{t('review.save')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.bg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.hairline },
  headerBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  content:        { padding: 16, paddingBottom: 40 },
  preview:        { width: '100%', height: 160, borderRadius: theme.radii.sm12, marginBottom: 16, backgroundColor: theme.accentTint },
  sectionTitle:   { fontSize: 15, fontFamily: theme.font.bold, color: theme.t2, marginTop: 8, marginBottom: 8 },
  arrHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearAllText:   { fontSize: 13, fontFamily: theme.font.semibold, color: theme.accent },
  fieldWrap:      { marginBottom: 12 },
  labelRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label:          { fontSize: 13, fontFamily: theme.font.semibold, color: theme.t2 },
  checkHint:      { fontSize: 11, fontFamily: theme.font.semibold, color: theme.warn, backgroundColor: theme.warn + '22', paddingHorizontal: 6, paddingVertical: 1, borderRadius: theme.radii.sm8 },
  input:          { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.r10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.t1 },
  textArea:       { height: 70, textAlignVertical: 'top', paddingTop: 10 },
  flagged:        { borderColor: theme.warn, borderWidth: 1.5, backgroundColor: theme.warn + '14' },
  dateField:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText:       { flex: 1, fontSize: 15, color: theme.t1 },
  weightRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { paddingHorizontal: 12, paddingVertical: 7, borderRadius: theme.radii.r18, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.hairline },
  chipActive:     { backgroundColor: theme.accent, borderColor: theme.accent },
  chipText:       { fontSize: 13, fontFamily: theme.font.medium, color: theme.t3 },
  chipTextActive: { color: theme.onAccent, fontFamily: theme.font.semibold },
  arrSection:     { marginTop: 8, marginBottom: 8, borderTopWidth: 1, borderTopColor: theme.hairline, paddingTop: 12 },
  itemCard:       { backgroundColor: theme.surface, borderRadius: theme.radii.sm12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: theme.hairline },
  itemHead:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemIdx:        { fontSize: 13, fontFamily: theme.font.bold, color: theme.t4 },
  toggleRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  addBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: theme.radii.r10, borderWidth: 1, borderColor: theme.accent, borderStyle: 'dashed' },
  addBtnText:     { fontSize: 14, fontFamily: theme.font.semibold, color: theme.accent },
  footer:         { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn:            { flex: 1, paddingVertical: 14, borderRadius: theme.radii.sm12, alignItems: 'center', justifyContent: 'center' },
  btnCancel:      { backgroundColor: theme.hairline },
  btnSave:        { backgroundColor: theme.accent },
  btnCancelText:  { fontSize: 15, fontFamily: theme.font.semibold, color: theme.t3 },
  btnSaveText:    { fontSize: 15, fontFamily: theme.font.semibold, color: theme.onAccent },
});
