import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useNavigation, useRoute, useFocusEffect, StackActions } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { usePetContext } from '../context/PetContext';
import { useLoyaltyPoints } from '../hooks/useLoyaltyPoints';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { parseMedicalDocument } from '../services/ocrService';
import AutocompleteInput from '../components/AutocompleteInput';
import { VACCINES, DRUGS } from '../data/medicalPresets';
import { Calendar } from 'react-native-calendars';
import { useMedicalCalendar } from '../hooks/useMedicalCalendar';
import { useMedicationIntakes } from '../hooks/useMedicationIntakes';
import { useUnits } from '../hooks/useUnits';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collectMedicalExport } from '../utils/collectMedicalExport';
import { buildMedicalExportHtml } from '../utils/medicalExportHtml';
import { usePetHealth } from '../hooks/usePetHealth';
import { useAppointments } from '../hooks/useAppointments';
import { useTheme } from '../theme/ThemeProvider';
import { buildTheme } from '../theme/theme';
import Screen from '../components/Screen';
import Segmented from '../components/Segmented';
import PassportView from '../components/PassportView';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (dateStr, locale = 'en-US') => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
};

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const getVaccineStatus = (nextDueDate) => {
  if (!nextDueDate) return 'completed';
  const days = getDaysUntil(nextDueDate);
  if (days < 0)   return 'overdue';
  if (days <= 30) return 'due_soon';
  return 'up_to_date';
};

// Пустой OCR: все массивы пусты И ключевые скаляры пусты (record_type не в счёт).
const isEmptyOCR = (d) => {
  if (!d) return true;
  const arraysEmpty =
    !(d.vaccines && d.vaccines.length) &&
    !(d.prescriptions && d.prescriptions.length) &&
    !(d.parasite_treatments && d.parasite_treatments.length) &&
    !(d.lab_tests && d.lab_tests.length);
  const scalarsEmpty = [
    d.diagnosis, d.symptoms, d.recommendations,
    d.vet_name, d.clinic_name, d.weight, d.temperature,
  ].every((v) => v == null || v === '');
  return arraysEmpty && scalarsEmpty;
};

// ─── DatePicker Field ─────────────────────────────────────────────────────────

const DatePickerField = ({ label, value, onChange, placeholder }) => {
  const { theme } = useTheme();
  const dpStyles = useMemo(() => makeDpStyles(theme), [theme]);
  const mStyles = useMemo(() => makeMStyles(theme), [theme]);
  const [show, setShow] = useState(false);
  const dateValue = value ? new Date(value + 'T00:00:00') : new Date();

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'dismissed') { setShow(false); return; }
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
    if (Platform.OS === 'ios') setShow(false);
  };

  return (
    <View style={dpStyles.container}>
      <Text style={mStyles.label}>{label}</Text>
      <TouchableOpacity
        style={dpStyles.field}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={18}
          color={value ? theme.accent : theme.t4}
          style={dpStyles.icon}
        />
        <Text style={[dpStyles.text, !value && dpStyles.placeholder]}>
          {value ? formatDate(value) : placeholder || 'Select date'}
        </Text>
        {value ? (
          <TouchableOpacity
            onPress={() => onChange('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={theme.t3} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color={theme.t3} />
        )}
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={new Date(2100, 11, 31)}
          minimumDate={new Date(2000, 0, 1)}
        />
      )}
    </View>
  );
};

// ─── Vaccine Modal ────────────────────────────────────────────────────────────

const VaccineModal = ({ visible, onClose, onSave, editData }) => {
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const mStyles = useMemo(() => makeMStyles(theme), [theme]);

  const [name,      setName]      = useState('');
  const [dateGiven, setDateGiven] = useState('');
  const [nextDue,   setNextDue]   = useState('');
  const [vet,       setVet]       = useState('');
  const [vaccineType, setVaccineType] = useState('primary');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.vaccine_name || '');
      setDateGiven(editData.date_given || '');
      setNextDue(editData.next_due_date || '');
      setVet(editData.vet_name || editData.administered_by || '');
      setVaccineType(editData.vaccine_type || 'primary');
      setNotes(editData.notes || '');
    } else {
      setName(''); setDateGiven(''); setNextDue(''); setVet(''); setNotes('');
      setVaccineType('primary');
    }
  }, [editData, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('modal.requiredTitle'), t('modal.vaccine.required'));
      return;
    }
    setSaving(true);
    try {
      await onSave({
        vaccine_name:    name.trim(),
        date_given:      dateGiven || null,
        next_due_date:   nextDue   || null,
        vet_name:        vet.trim() || null,
        administered_by: vet.trim() || null,
        vaccine_type:    vaccineType,
        notes:           notes.trim() || null,
      });
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <Text style={mStyles.title}>
            {editData ? t('modal.vaccine.editTitle') : t('modal.vaccine.addTitle')}
          </Text>

          <AutocompleteInput
            label={t('modal.vaccine.nameLabel')}
            value={name}
            onChangeText={setName}
            suggestions={VACCINES}
            placeholder={t('modal.vaccine.namePlaceholder')}
          />

          <DatePickerField
            label={t('modal.vaccine.dateGivenLabel')}
            value={dateGiven}
            onChange={setDateGiven}
            placeholder={t('modal.vaccine.dateGivenPlaceholder')}
          />

          <DatePickerField
            label={t('modal.vaccine.nextDueLabel')}
            value={nextDue}
            onChange={setNextDue}
            placeholder={t('modal.vaccine.nextDuePlaceholder')}
          />

          <Text style={mStyles.label}>{t('modal.vaccine.adminByLabel')}</Text>
          <TextInput
            style={mStyles.input}
            value={vet}
            onChangeText={setVet}
            placeholder={t('modal.vaccine.adminByPlaceholder')}
            placeholderTextColor={theme.t4}
          />

          <Text style={mStyles.label}>{t('modal.vaccine.typeLabel')}</Text>
          <View style={mStyles.row}>
            {['primary', 'booster'].map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[mStyles.chip, { flex: 1, marginRight: 0 }, vaccineType === vt && mStyles.chipActive]}
                onPress={() => setVaccineType(vt)}
              >
                <Text style={[mStyles.chipText, vaccineType === vt && mStyles.chipTextActive]}>
                  {t(`vaccineTypes.${vt}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={mStyles.label}>{t('modal.vaccine.notesLabel')}</Text>
          <TextInput
            style={[mStyles.input, mStyles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('modal.vaccine.notesPlaceholder')}
            placeholderTextColor={theme.t4}
            multiline
            numberOfLines={3}
          />

          <View style={mStyles.row}>
            <TouchableOpacity
              style={[mStyles.btn, mStyles.btnCancel]}
              onPress={onClose}
            >
              <Text style={mStyles.btnCancelText}>{t('modal.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mStyles.btn, mStyles.btnSave]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color={theme.onAccent} size="small" />
                : <Text style={mStyles.btnSaveText}>{t('modal.save')}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Medication Modal ─────────────────────────────────────────────────────────

const MedicationModal = ({ visible, onClose, onSave, editData }) => {
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const mStyles = useMemo(() => makeMStyles(theme), [theme]);

  const [name,       setName]       = useState('');
  const [dosage,     setDosage]     = useState('');
  const [frequency,  setFrequency]  = useState('');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [notes,      setNotes]      = useState('');
  const [isActive,   setIsActive]   = useState(true);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.medication_name || '');
      setDosage(editData.dosage || '');
      setFrequency(editData.frequency || '');
      setStartDate(editData.start_date || '');
      setEndDate(editData.end_date || '');
      setPrescriber(editData.prescribed_by || '');
      setNotes(editData.notes || '');
      setIsActive(editData.is_active !== false);
    } else {
      setName(''); setDosage(''); setFrequency('');
      setStartDate(''); setEndDate(''); setPrescriber('');
      setNotes(''); setIsActive(true);
    }
  }, [editData, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('modal.requiredTitle'), t('modal.medication.required'));
      return;
    }
    setSaving(true);
    try {
      await onSave({
        medication_name: name.trim(),
        dosage:          dosage.trim()     || null,
        frequency:       frequency.trim()  || null,
        start_date:      startDate         || null,
        end_date:        endDate           || null,
        prescribed_by:   prescriber.trim() || null,
        notes:           notes.trim()      || null,
        is_active:       isActive,
      });
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={mStyles.title}>
              {editData
                ? t('modal.medication.editTitle')
                : t('modal.medication.addTitle')}
            </Text>

            <AutocompleteInput
              label={t('modal.medication.nameLabel')}
              value={name}
              onChangeText={setName}
              suggestions={DRUGS}
              placeholder={t('modal.medication.namePlaceholder')}
            />

            <Text style={mStyles.label}>{t('modal.medication.dosageLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder={t('modal.medication.dosagePlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.medication.frequencyLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={frequency}
              onChangeText={setFrequency}
              placeholder={t('modal.medication.frequencyPlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <DatePickerField
              label={t('modal.medication.startDateLabel')}
              value={startDate}
              onChange={setStartDate}
              placeholder={t('modal.medication.startDatePlaceholder')}
            />

            <DatePickerField
              label={t('modal.medication.endDateLabel')}
              value={endDate}
              onChange={setEndDate}
              placeholder={t('modal.medication.endDatePlaceholder')}
            />

            <Text style={mStyles.label}>{t('modal.medication.prescriberLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={prescriber}
              onChangeText={setPrescriber}
              placeholder={t('modal.medication.prescriberPlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.medication.notesLabel')}</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('modal.medication.notesPlaceholder')}
              placeholderTextColor={theme.t4}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={mStyles.toggleRow}
              onPress={() => setIsActive(!isActive)}
            >
              <Text style={mStyles.label}>{t('modal.medication.activeLabel')}</Text>
              <View style={[
                mStyles.toggle,
                isActive ? mStyles.toggleOn : mStyles.toggleOff,
              ]}>
                <View style={[
                  mStyles.toggleThumb,
                  isActive ? mStyles.thumbOn : mStyles.thumbOff,
                ]} />
              </View>
            </TouchableOpacity>

            <View style={mStyles.row}>
              <TouchableOpacity
                style={[mStyles.btn, mStyles.btnCancel]}
                onPress={onClose}
              >
                <Text style={mStyles.btnCancelText}>{t('modal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mStyles.btn, mStyles.btnSave]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={theme.onAccent} size="small" />
                  : <Text style={mStyles.btnSaveText}>{t('modal.save')}</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Record Modal ─────────────────────────────────────────────────────────────

const RecordModal = ({ visible, onClose, onSave, editData }) => {
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const mStyles = useMemo(() => makeMStyles(theme), [theme]);

  const [visitDate,       setVisitDate]       = useState('');
  const [vetName,         setVetName]         = useState('');
  const [clinic,          setClinic]          = useState('');
  const [diagnosis,       setDiagnosis]       = useState('');
  const [diagnosisCode,   setDiagnosisCode]   = useState('');
  const [symptoms,        setSymptoms]        = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [weight,          setWeight]          = useState('');
  const [temperature,     setTemperature]     = useState('');
  const [followUpDate,    setFollowUpDate]    = useState('');
  const [urgency,         setUrgency]         = useState('normal');
  const [saving,          setSaving]          = useState(false);

  useEffect(() => {
    if (editData) {
      setVisitDate((editData.occurred_at || editData.date || '').slice(0, 10));
      setVetName(editData.vet_name             || '');
      setClinic(editData.clinic_name           || '');
      setDiagnosis(editData.diagnosis          || '');
      setDiagnosisCode(editData.diagnosis_code || '');
      setSymptoms(editData.symptoms            || '');
      setRecommendations(editData.recommendations || '');
      setWeight(editData.weight != null ? String(editData.weight) : '');
      setTemperature(editData.temperature != null ? String(editData.temperature) : '');
      setFollowUpDate((editData.follow_up_date || '').slice(0, 10));
      setUrgency(editData.urgency || 'normal');
    } else {
      setVisitDate(''); setVetName(''); setClinic(''); setDiagnosis('');
      setDiagnosisCode(''); setSymptoms(''); setRecommendations('');
      setWeight(''); setTemperature(''); setFollowUpDate(''); setUrgency('normal');
    }
  }, [editData, visible]);

  const handleSave = async () => {
    if (!visitDate) {
      Alert.alert(t('modal.requiredTitle'), t('modal.record.required'));
      return;
    }
    setSaving(true);
    try {
      await onSave({
        visit_date:      visitDate,
        vet_name:        vetName.trim() || null,
        clinic_name:     clinic.trim() || null,
        diagnosis:       diagnosis.trim() || null,
        diagnosis_code:  diagnosisCode.trim() || null,
        symptoms:        symptoms.trim() || null,
        recommendations: recommendations.trim() || null,
        weight:          weight ? parseFloat(weight) : null,
        temperature:     temperature ? parseFloat(temperature) : null,
        follow_up_date:  followUpDate || null,
        urgency:         urgency,
      });
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={mStyles.title}>
              {editData
                ? t('modal.record.editTitle')
                : t('modal.record.addTitle')}
            </Text>

            <DatePickerField
              label={t('modal.record.visitDateLabel')}
              value={visitDate}
              onChange={setVisitDate}
              placeholder={t('modal.record.visitDatePlaceholder')}
            />

            <Text style={mStyles.label}>{t('modal.record.vetNameLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={vetName}
              onChangeText={setVetName}
              placeholder={t('modal.record.vetNamePlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.record.clinicLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={clinic}
              onChangeText={setClinic}
              placeholder={t('modal.record.clinicPlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.record.diagnosisLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder={t('modal.record.diagnosisPlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.record.diagnosisCodeLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={diagnosisCode}
              onChangeText={setDiagnosisCode}
              placeholder={t('modal.record.diagnosisCodePlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.record.symptomsLabel')}</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder={t('modal.record.symptomsPlaceholder')}
              placeholderTextColor={theme.t4}
              multiline
              numberOfLines={3}
            />

            <Text style={mStyles.label}>{t('modal.record.recommendationsLabel')}</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={recommendations}
              onChangeText={setRecommendations}
              placeholder={t('modal.record.recommendationsPlaceholder')}
              placeholderTextColor={theme.t4}
              multiline
              numberOfLines={3}
            />

            <Text style={mStyles.label}>{t('modal.record.weightLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={weight}
              onChangeText={setWeight}
              placeholder={t('modal.record.weightPlaceholder')}
              placeholderTextColor={theme.t4}
              keyboardType="decimal-pad"
            />

            <Text style={mStyles.label}>{t('modal.record.temperatureLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={temperature}
              onChangeText={setTemperature}
              placeholder={t('modal.record.temperaturePlaceholder')}
              placeholderTextColor={theme.t4}
              keyboardType="decimal-pad"
            />

            <DatePickerField
              label={t('modal.record.followUpLabel')}
              value={followUpDate}
              onChange={setFollowUpDate}
              placeholder={t('modal.record.followUpPlaceholder')}
            />

            <Text style={mStyles.label}>{t('modal.record.urgencyLabel')}</Text>
            <View style={mStyles.row}>
              {['normal', 'elevated', 'high'].map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[mStyles.chip, { flex: 1, marginRight: 0 }, urgency === u && mStyles.chipActive]}
                  onPress={() => setUrgency(u)}
                >
                  <Text style={[mStyles.chipText, urgency === u && mStyles.chipTextActive]}>
                    {t(`urgency.${u}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={mStyles.row}>
              <TouchableOpacity
                style={[mStyles.btn, mStyles.btnCancel]}
                onPress={onClose}
              >
                <Text style={mStyles.btnCancelText}>{t('modal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mStyles.btn, mStyles.btnSave]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={theme.onAccent} size="small" />
                  : <Text style={mStyles.btnSaveText}>{t('modal.save')}</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ProcedureModal = ({ visible, onClose, onSave }) => {
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const mStyles = useMemo(() => makeMStyles(theme), [theme]);

  const [occurredAt, setOccurredAt] = useState('');
  const [name,       setName]       = useState('');
  const [notes,      setNotes]      = useState('');
  const [clinic,     setClinic]     = useState('');
  const [vetName,    setVetName]    = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (!visible) return;
    setOccurredAt(''); setName(''); setNotes(''); setClinic(''); setVetName('');
  }, [visible]);

  const handleSave = async () => {
    if (!occurredAt || !name.trim()) {
      Alert.alert(t('modal.requiredTitle'), t('modal.procedure.required'));
      return;
    }
    setSaving(true);
    try {
      await onSave({
        occurred_at: occurredAt,
        name:        name.trim(),
        notes:       notes.trim() || null,
        clinic_name: clinic.trim() || null,
        vet_name:    vetName.trim() || null,
      });
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={mStyles.title}>{t('modal.procedure.title')}</Text>

            <DatePickerField
              label={t('modal.procedure.date')}
              value={occurredAt}
              onChange={setOccurredAt}
              placeholder={t('modal.record.visitDatePlaceholder')}
            />

            <Text style={mStyles.label}>{t('modal.procedure.name')}</Text>
            <TextInput
              style={mStyles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('modal.procedure.namePlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.procedure.notes')}</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('modal.procedure.notesPlaceholder')}
              placeholderTextColor={theme.t4}
              multiline
              numberOfLines={3}
            />

            <Text style={mStyles.label}>{t('modal.procedure.clinic')}</Text>
            <TextInput
              style={mStyles.input}
              value={clinic}
              onChangeText={setClinic}
              placeholder={t('modal.record.clinicPlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <Text style={mStyles.label}>{t('modal.procedure.vet')}</Text>
            <TextInput
              style={mStyles.input}
              value={vetName}
              onChangeText={setVetName}
              placeholder={t('modal.record.vetNamePlaceholder')}
              placeholderTextColor={theme.t4}
            />

            <View style={mStyles.row}>
              <TouchableOpacity style={[mStyles.btn, mStyles.btnCancel]} onPress={onClose}>
                <Text style={mStyles.btnCancelText}>{t('modal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[mStyles.btn, mStyles.btnSave]} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color={theme.onAccent} size="small" />
                  : <Text style={mStyles.btnSaveText}>{t('common:save')}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

// Иконки типов (цвет — из theme.eventTypes в компоненте; палитра категориальная).
const AGENDA_ICONS = {
  record:       'document-text-outline',
  prescription: 'medical-outline',
  vaccine:      'medkit-outline',
  reminder:     'notifications-outline',
  appointment:  'today-outline',
};
// Порядок типов для легенды календаря.
const EVENT_TYPE_KEYS = ['record', 'prescription', 'vaccine', 'reminder', 'appointment'];

export default function MedicalScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation('medical');
  const { theme, accent } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Семантика статусов записи (как StatusCards): requested→warn, confirmed→ok, cancelled→danger, completed→нейтраль.
  const apptStatusColor = { requested: theme.warn, confirmed: theme.ok, cancelled: theme.danger, completed: theme.t3 };

  // Локаль для formatDate
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const fmt    = (dateStr) => formatDate(dateStr, locale);

  const { pets, selectedPet, selectPet, loading: petsLoading } = usePetContext();
  const { awardEvent } = useLoyaltyPoints();
  const { markedDates, itemsByDate } = useMedicalCalendar(selectedPet?.id, theme.eventTypes);
  const { isTaken, markTaken, unmark } = useMedicationIntakes(selectedPet?.id);
  const { unit } = useUnits();
  const { allergies } = usePetHealth(selectedPet?.id);
  const { future } = useAppointments(selectedPet?.id);
  // ymd сегодняшнего ЛОКАЛЬНОГО дня — тоггл приёма доступен только для дней ≤ сегодня.
  const _today = new Date();
  const todayYmd = `${_today.getFullYear()}-${String(_today.getMonth() + 1).padStart(2, '0')}-${String(_today.getDate()).padStart(2, '0')}`;

  const [activeTab,   setActiveTab]   = useState('overview');
  const [viewMode,    setViewMode]    = useState('list');
  const [selectedDate, setSelectedDate] = useState(null);
  const [scanning,    setScanning]    = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [vaccines,    setVaccines]    = useState([]);
  const [medications, setMedications] = useState([]);
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(false);

  const [vaccineModal, setVaccineModal] = useState(false);
  const [medModal,     setMedModal]     = useState(false);
  const [recordModal,  setRecordModal]  = useState(false);
  const [procedureModal, setProcedureModal] = useState(false);
  const [editVaccine,  setEditVaccine]  = useState(null);
  const [editMed,      setEditMed]      = useState(null);
  const [editRecord,   setEditRecord]   = useState(null);

  // ─── Load Medical Data ──────────────────────────────────────────────────

  const loadMedicalData = useCallback(async () => {
    if (!selectedPet) return;
    try {
      setLoading(true);
      const [vaccRes, medRes, recRes] = await Promise.all([
        supabase.from('record_vaccines').select('*').eq('pet_id', selectedPet.id)
          .order('next_due_date', { ascending: true })
          .order('date_given', { ascending: false }),
        supabase.from('record_prescriptions').select('*').eq('pet_id', selectedPet.id)
          .order('start_date', { ascending: false }),
        supabase.from('medical_records').select('*').eq('pet_id', selectedPet.id)
          .in('record_type', ['visit', 'procedure', 'lab_test', 'parasite_treatment', 'other'])
          .order('occurred_at', { ascending: false, nullsFirst: false })
          .order('date', { ascending: false, nullsFirst: false }),
      ]);
      if (vaccRes.error) throw vaccRes.error;
      if (medRes.error)  throw medRes.error;
      if (recRes.error)  throw recRes.error;
      setVaccines(vaccRes.data   || []);
      setMedications(medRes.data || []);
      setRecords(recRes.data     || []);
    } catch (err) {
      console.error('loadMedicalData:', err.message);
      Alert.alert('Error', t('errors.loadData'));
    } finally {
      setLoading(false);
    }
  }, [selectedPet, t]);

  useFocusEffect(
    useCallback(() => {
      loadMedicalData();
    }, [loadMedicalData])
  );

  // Возврат из RecordDetail с "Изменить": открыть существующий RecordModal и
  // сбросить param, чтобы модалка не открывалась повторно на следующем фокусе.
  const route = useRoute();
  useEffect(() => {
    const er = route.params?.editRecord;
    if (er) {
      setEditRecord(er);
      setRecordModal(true);
      navigation.setParams({ editRecord: undefined });
    }
  }, [route.params?.editRecord]);

  // ─── Vaccine CRUD ───────────────────────────────────────────────────────

  const saveVaccine = async (formData) => {
    try {
      if (editVaccine) {
        // Правка — прямой update дочерней строки record_vaccines
        const { error } = await supabase.from('record_vaccines')
          .update({
            vaccine_name:  formData.vaccine_name,
            vaccine_type:  formData.vaccine_type || null,
            date_given:    formData.date_given || null,
            next_due_date: formData.next_due_date || null,
          })
          .eq('id', editVaccine.id);
        if (error) throw error;
      } else {
        // Добавление — через RPC save_medical_record (родитель + дети)
        const p_payload = {
          pet_id:      selectedPet.id,
          record_type: 'vaccination',
          source:      'manual',
          occurred_at: formData.date_given || null,
          vet_name:    formData.vet_name || null,
          description: formData.notes || null,
          vaccines: [{
            vaccine_name:  formData.vaccine_name,
            vaccine_type:  formData.vaccine_type || null,
            date_given:    formData.date_given || null,
            next_due_date: formData.next_due_date || null,
          }],
        };
        const { error } = await supabase.rpc('save_medical_record', { p_payload });
        if (error) throw error;
        // Начисление за первую ручную медзапись (идемпотентно по dedup_key на сервере).
        await awardEvent('manual_first', `${selectedPet.id}|manual_first`, { sourceType: 'manual' });
      }
      setVaccineModal(false); setEditVaccine(null);
      await loadMedicalData();
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    }
  };

  const deleteVaccine = (id) => {
    Alert.alert(
      t('delete.vaccine.title'),
      t('delete.vaccine.message'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        {
          text: t('delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('record_vaccines').delete().eq('id', id);
              if (error) throw error;
              await loadMedicalData();
            } catch (err) {
              Alert.alert(t('modal.errorTitle'), err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Medication CRUD ────────────────────────────────────────────────────

  const saveMedication = async (formData) => {
    try {
      if (editMed) {
        // Правка — прямой update record_prescriptions
        const { error } = await supabase.from('record_prescriptions')
          .update({
            name:        formData.medication_name,
            dose:        formData.dosage || null,
            frequency:   formData.frequency || null,
            start_date:  formData.start_date || null,
            end_date:    formData.end_date || null,
            instruction: formData.notes || null,
            active:      formData.is_active,
          })
          .eq('id', editMed.id);
        if (error) throw error;
      } else {
        const p_payload = {
          pet_id:      selectedPet.id,
          record_type: 'medication_course',
          source:      'manual',
          occurred_at: formData.start_date || null,
          vet_name:    formData.prescribed_by || null,
          prescriptions: [{
            name:        formData.medication_name,
            dose:        formData.dosage || null,
            frequency:   formData.frequency || null,
            start_date:  formData.start_date || null,
            end_date:    formData.end_date || null,
            instruction: formData.notes || null,
            active:      formData.is_active,
          }],
        };
        const { error } = await supabase.rpc('save_medical_record', { p_payload });
        if (error) throw error;
        // Начисление за первую ручную медзапись (идемпотентно по dedup_key на сервере).
        await awardEvent('manual_first', `${selectedPet.id}|manual_first`, { sourceType: 'manual' });
      }
      setMedModal(false); setEditMed(null);
      await loadMedicalData();
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    }
  };

  const deleteMedication = (id) => {
    Alert.alert(
      t('delete.medication.title'),
      t('delete.medication.message'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        {
          text: t('delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('record_prescriptions').delete().eq('id', id);
              if (error) throw error;
              await loadMedicalData();
            } catch (err) {
              Alert.alert(t('modal.errorTitle'), err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Vet Record CRUD ────────────────────────────────────────────────────

  const saveRecord = async (formData) => {
    try {
      const fields = {
        occurred_at:     formData.visit_date || null,
        vet_name:        formData.vet_name || null,
        clinic_name:     formData.clinic_name || null,
        diagnosis:       formData.diagnosis || null,
        diagnosis_code:  formData.diagnosis_code || null,
        symptoms:        formData.symptoms || null,
        recommendations: formData.recommendations || null,
        weight:          formData.weight ?? null,
        temperature:     formData.temperature ?? null,
        follow_up_date:  formData.follow_up_date || null,
        urgency:         formData.urgency || null,
      };

      if (editRecord) {
        // Правка — прямой update medical_records
        const { error } = await supabase.from('medical_records')
          .update(fields)
          .eq('id', editRecord.id);
        if (error) throw error;
      } else {
        // Добавление — через RPC save_medical_record
        const p_payload = {
          pet_id:      selectedPet.id,
          record_type: 'visit',
          source:      'manual',
          ...fields,
        };
        const { error } = await supabase.rpc('save_medical_record', { p_payload });
        if (error) throw error;
        // Начисление за первую ручную медзапись (идемпотентно по dedup_key на сервере).
        await awardEvent('manual_first', `${selectedPet.id}|manual_first`, { sourceType: 'manual' });
      }
      setRecordModal(false); setEditRecord(null);
      await loadMedicalData();
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    }
  };

  const saveProcedure = async (formData) => {
    try {
      const fields = {
        occurred_at:     formData.occurred_at || null,
        diagnosis:       formData.name || null,          // название процедуры
        recommendations: formData.notes || null,
        clinic_name:     formData.clinic_name || null,
        vet_name:        formData.vet_name || null,
      };
      const p_payload = {
        pet_id:      selectedPet.id,
        record_type: 'procedure',
        source:      'manual',
        ...fields,
      };
      const { error } = await supabase.rpc('save_medical_record', { p_payload });
      if (error) throw error;
      // Начисление за первую ручную медзапись (идемпотентно по dedup_key на сервере).
      await awardEvent('manual_first', `${selectedPet.id}|manual_first`, { sourceType: 'manual' });
      setProcedureModal(false);
      await loadMedicalData();
    } catch (err) {
      Alert.alert(t('modal.errorTitle'), err.message);
    }
  };

  const deleteRecord = (id) => {
    Alert.alert(
      t('delete.record.title'),
      t('delete.record.message'),
      [
        { text: t('delete.cancel'), style: 'cancel' },
        {
          text: t('delete.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('medical_records').delete().eq('id', id);
              if (error) throw error;
              await loadMedicalData();
            } catch (err) {
              Alert.alert(t('modal.errorTitle'), err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Status Badge Helpers ───────────────────────────────────────────────

  const getStatusBadgeText = (statusKey, days) => {
    switch (statusKey) {
      case 'overdue':    return t('status.daysOverdue', { days: Math.abs(days) });
      case 'due_soon':   return t('status.dueIn', { days });
      case 'up_to_date': return t('status.upToDate');
      case 'completed':  return t('status.completed');
      default:           return '';
    }
  };

  // ─── OCR Scan (Commit 1: распознавание без сохранения) ───────────────────

  const runScan = async (fromCamera) => {
    const scanId = Date.now();
    const source = fromCamera ? 'camera' : 'gallery';
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(t('scan.permissionTitle'), t('scan.permissionMessage'));
        return;
      }

      const picked = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.9, mediaTypes: ['images'] });
      if (picked.canceled || !picked.assets?.length) return;

      setScanning(true);
      const manipulated = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const ocr = await parseMedicalDocument(manipulated.base64, 'image/jpeg');
      console.log('🧾 OCR result', scanId, JSON.stringify(ocr, null, 2));

      if (!ocr.success) console.warn('OCR failed:', ocr.error);

      if (!ocr.success || isEmptyOCR(ocr.data)) {
        Alert.alert(
          t('scan.emptyTitle'),
          t('scan.emptyMessage'),
          [
            { text: t('scan.fillManually'), onPress: () => { setEditRecord(null); setRecordModal(true); } },
            { text: t('common:ok'), style: 'cancel' },
          ]
        );
        return;
      }

      // push -> новый экземпляр OCRReview на каждый скан (из таба — через StackActions)
      navigation.dispatch(StackActions.push('OCRReview', {
        data: ocr.data,
        imageUri: manipulated.uri,
        petId: selectedPet.id,
        scanId,
      }));
    } catch (err) {
      console.error('Scan error:', err);
      Alert.alert(t('scan.errorTitle'), err.message || t('scan.error'));
    } finally {
      setScanning(false);
    }
  };

  // ─── Экспорт медкарты в PDF (собрать → HTML → печать → share) ───
  const handleExport = async () => {
    if (!selectedPet?.id || exporting) return;
    setExporting(true);
    try {
      const data = await collectMedicalExport(selectedPet.id);
      // PDF всегда светлый (печать на белом) — берём LIGHT-схему независимо от dark-режима
      // приложения; акцент-пресет (mint/peach/blue) сохраняем.
      const pdf = buildTheme('light', accent);
      const pdfColors = {
        accent: pdf.accent, text: pdf.t1, text2: pdf.t2, muted: pdf.t3,
        faint: pdf.t4, line: pdf.hairline, danger: pdf.danger, dangerBg: pdf.danger + '14',
      };
      const html = buildMedicalExportHtml(data, { unit, lang: i18n.language, t, colors: pdfColors });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('export.button'),
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(t('export.error'), '');
      }
    } catch (e) {
      Alert.alert(t('export.error'), e?.message || '');
    } finally {
      setExporting(false);
    }
  };

  const handleScan = () => {
    Alert.alert(
      t('scan.sourceTitle'),
      t('scan.hint'),
      [
        { text: t('scan.camera'), onPress: () => runScan(true) },
        { text: t('scan.gallery'), onPress: () => runScan(false) },
        { text: t('modal.cancel'), style: 'cancel' },
      ]
    );
  };

  // ─── Render Overview ────────────────────────────────────────────────────

  const renderOverview = () => {
    const activeMeds   = medications.filter(m => m.active);
    const visits       = records.filter(r => r.record_type === 'visit');
    const recentRecord = visits[0];
    const petAllergies = allergies || [];
    const futureAppts  = (future || []).filter(a => a.status !== 'cancelled');
    const fmtDT = (ts) =>
      ts
        ? new Date(ts).toLocaleString(locale, {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })
        : '';
    // Ближайшие напоминания: type 'reminder' c датой [сегодня .. +30 дней], по возрастанию.
    const _end = new Date();
    _end.setDate(_end.getDate() + 30);
    const in30Ymd = `${_end.getFullYear()}-${String(_end.getMonth() + 1).padStart(2, '0')}-${String(_end.getDate()).padStart(2, '0')}`;
    const upcomingReminders = Object.entries(itemsByDate || {})
      .filter(([d]) => d >= todayYmd && d <= in30Ymd)
      .flatMap(([, evs]) => evs.filter((e) => e.type === 'reminder'))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const isEmpty =
      vaccines.length === 0 &&
      medications.length === 0 &&
      records.length === 0 &&
      petAllergies.length === 0 &&
      futureAppts.length === 0;

    if (isEmpty) {
      return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏥</Text>
            <Text style={styles.emptyTitle}>{t('empty.overview.title')}</Text>
            <Text style={styles.emptySub}>{t('empty.overview.subtitle')}</Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Allergy banner */}
        {petAllergies.length > 0 && (
          <View style={styles.ovAllergyBanner}>
            <Ionicons name="alert-circle" size={20} color={theme.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ovAllergyTitle}>{t('overview.allergyBanner.title')}</Text>
              <Text style={styles.ovAllergyList}>
                {petAllergies.map((a) => (a.severity ? `${a.substance} (${a.severity})` : a.substance)).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.accentTint }]}>
            <Text style={styles.summaryNum}>{vaccines.length}</Text>
            <Text style={styles.summaryLabel}>{t('overview.summary.vaccines')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.ok + '1A' }]}>
            <Text style={styles.summaryNum}>{activeMeds.length}</Text>
            <Text style={styles.summaryLabel}>{t('overview.summary.activeMeds')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.warn + '1A' }]}>
            <Text style={styles.summaryNum}>{visits.length}</Text>
            <Text style={styles.summaryLabel}>{t('overview.summary.vetVisits')}</Text>
          </View>
        </View>

        {/* Next Appointment */}
        <TouchableOpacity
          style={styles.section}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Appointments', { petId: selectedPet.id })}
        >
          <Text style={styles.sectionTitle}>{t('overview.nextAppointment.title')}</Text>
          {futureAppts[0] ? (
            <View style={styles.ovApptCard}>
              <View style={styles.ovApptHead}>
                <Text style={styles.overviewCardName} numberOfLines={1}>
                  {futureAppts[0].clinic_name || t('appointments.untitled')}
                </Text>
                <View style={[styles.ovStatusBadge, { backgroundColor: (apptStatusColor[futureAppts[0].status] || theme.t3) + '22' }]}>
                  <Text style={[styles.ovStatusText, { color: apptStatusColor[futureAppts[0].status] || theme.t3 }]}>
                    {t(`appointments.status.${futureAppts[0].status}`, { defaultValue: futureAppts[0].status })}
                  </Text>
                </View>
              </View>
              {futureAppts[0].reason ? (
                <Text style={styles.overviewCardSub}>{futureAppts[0].reason}</Text>
              ) : null}
              <View style={styles.ovApptDate}>
                <Ionicons name="time-outline" size={14} color={theme.accent} />
                <Text style={styles.ovApptDateText}>{fmtDT(futureAppts[0].requested_at)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.ovApptCard}>
              <Text style={styles.ovApptNone}>{t('overview.nextAppointment.none')}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Upcoming Vaccines */}
        {vaccines.length > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>{t('overview.upcomingVaccines')}</Text>
            {vaccines.map(v => {
              const statusKey = getVaccineStatus(v.next_due_date);
              const days      = getDaysUntil(v.next_due_date);
              return (
                <View key={v.id} style={styles.alertRow}>
                  <Text style={styles.alertName}>{v.vaccine_name}</Text>
                  <View style={styles.alertRight}>
                    <Text style={styles.alertDate}>{fmt(v.next_due_date)}</Text>
                    <Text style={[
                      styles.alertBadge,
                      statusKey === 'overdue'   ? styles.badgeRed    :
                      statusKey === 'due_soon'  ? styles.badgeYellow :
                      styles.badgeGreen,
                    ]}>
                      {getStatusBadgeText(statusKey, days)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Upcoming Reminders */}
        {upcomingReminders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('overview.upcomingReminders.title')}</Text>
            {upcomingReminders.map((r, i) => (
              <View key={`${r.refId || i}-${r.date}`} style={styles.ovReminderRow}>
                <Text style={styles.ovReminderDate}>{fmt(r.date)}</Text>
                <Text style={styles.ovReminderTitle} numberOfLines={1}>{r.title}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Active Medications */}
        {activeMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('overview.activeMedications')}</Text>
            {activeMeds.map(m => (
              <View key={m.id} style={styles.overviewCard}>
                <Text style={styles.overviewCardName}>{m.name}</Text>
                <Text style={styles.overviewCardSub}>
                  {[m.dose, m.frequency].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Last Visit */}
        {recentRecord && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('overview.lastVisit')}</Text>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewCardName}>
                {fmt(recentRecord.occurred_at ?? recentRecord.date)}
              </Text>
              {recentRecord.vet_name && (
                <Text style={styles.overviewCardSub}>
                  {t('card.vet', { name: recentRecord.vet_name })}
                  {recentRecord.clinic_name
                    ? ` · ${recentRecord.clinic_name}`
                    : ''}
                </Text>
              )}
              {recentRecord.diagnosis && (
                <Text style={styles.overviewCardNote}>
                  {recentRecord.diagnosis}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // ─── Render Vaccines ────────────────────────────────────────────────────

  const renderVaccines = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {vaccines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{t('empty.vaccines.icon')}</Text>
          <Text style={styles.emptyTitle}>{t('empty.vaccines.title')}</Text>
          <Text style={styles.emptySub}>{t('empty.vaccines.subtitle')}</Text>
        </View>
      ) : (
        vaccines.map(v => {
          const statusKey = getVaccineStatus(v.next_due_date);
          const days      = getDaysUntil(v.next_due_date);
          return (
            <TouchableOpacity
              key={v.id}
              style={styles.card}
              activeOpacity={0.7}
              disabled={!v.record_id}
              onPress={v.record_id ? () => navigation.navigate('RecordDetail', { recordId: v.record_id, petId: selectedPet.id }) : undefined}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{v.vaccine_name}</Text>
                <View style={[
                  styles.statusBadge,
                  statusKey === 'overdue'    && styles.badgeRed,
                  statusKey === 'due_soon'   && styles.badgeYellow,
                  (statusKey === 'up_to_date' ||
                   statusKey === 'completed') && styles.badgeGreen,
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusBadgeText(statusKey, days)}
                  </Text>
                </View>
              </View>

              {v.date_given && (
                <Text style={styles.cardMeta}>
                  {t('card.given', { date: fmt(v.date_given) })}
                </Text>
              )}
              {v.next_due_date && (
                <Text style={styles.cardMeta}>
                  {t('card.nextDue', { date: fmt(v.next_due_date) })}
                </Text>
              )}
              {v.vaccine_type && (
                <Text style={styles.cardMeta}>
                  {t('card.vaccineType', { value: t(`vaccineTypes.${v.vaccine_type}`, { defaultValue: v.vaccine_type }) })}
                </Text>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => { setEditVaccine(v); setVaccineModal(true); }}
                >
                  <Text style={styles.actionEdit}>{t('card.edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => deleteVaccine(v.id)}
                >
                  <Text style={styles.actionDelete}>{t('card.delete')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );

  // ─── Render Medications ─────────────────────────────────────────────────

  const renderMedications = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {medications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{t('empty.medications.icon')}</Text>
          <Text style={styles.emptyTitle}>{t('empty.medications.title')}</Text>
          <Text style={styles.emptySub}>{t('empty.medications.subtitle')}</Text>
        </View>
      ) : (
        medications.map(m => (
          <TouchableOpacity
            key={m.id}
            style={styles.card}
            activeOpacity={0.7}
            disabled={!m.record_id}
            onPress={m.record_id ? () => navigation.navigate('RecordDetail', { recordId: m.record_id, petId: selectedPet.id }) : undefined}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{m.name}</Text>
              <View style={[
                styles.statusBadge,
                m.active ? styles.badgeGreen : styles.badgeGray,
              ]}>
                <Text style={styles.statusText}>
                  {m.active ? t('status.active') : t('status.inactive')}
                </Text>
              </View>
            </View>

            {m.dose && (
              <Text style={styles.cardMeta}>
                {t('card.dosage', { value: m.dose })}
              </Text>
            )}
            {m.frequency && (
              <Text style={styles.cardMeta}>
                {t('card.frequency', { value: m.frequency })}
              </Text>
            )}
            {m.start_date && (
              <Text style={styles.cardMeta}>
                {t('card.started', { date: fmt(m.start_date) })}
              </Text>
            )}
            {m.end_date && (
              <Text style={styles.cardMeta}>
                {t('card.ends', { date: fmt(m.end_date) })}
              </Text>
            )}
            {m.instruction && (
              <Text style={styles.cardNote}>{m.instruction}</Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => { setEditMed(m); setMedModal(true); }}
              >
                <Text style={styles.actionEdit}>{t('card.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => deleteMedication(m.id)}
              >
                <Text style={styles.actionDelete}>{t('card.delete')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  // ─── Render Records ─────────────────────────────────────────────────────

  const renderRecords = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{t('empty.records.icon')}</Text>
          <Text style={styles.emptyTitle}>{t('empty.records.title')}</Text>
          <Text style={styles.emptySub}>{t('empty.records.subtitle')}</Text>
        </View>
      ) : (
        records.map(r => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RecordDetail', { record: r, recordId: r.id, petId: selectedPet.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{fmt(r.occurred_at ?? r.date)}</Text>
              <View style={[styles.statusBadge, styles.badgePurple]}>
                <Text style={styles.statusText}>
                  {r.record_type
                    ? t(`recordTypes.${r.record_type}`, {
                        defaultValue:
                          r.record_type.charAt(0).toUpperCase() + r.record_type.slice(1),
                      })
                    : t('status.visit')}
                </Text>
              </View>
            </View>

            {r.vet_name && (
              <Text style={styles.cardMeta}>
                {t('card.vet', { name: r.vet_name })}
              </Text>
            )}
            {r.clinic_name && (
              <Text style={styles.cardMeta}>
                {t('card.clinic', { name: r.clinic_name })}
              </Text>
            )}
            {r.diagnosis && (
              <Text style={styles.cardMeta}>
                {t('card.diagnosis', { value: r.diagnosis })}
              </Text>
            )}
            {r.diagnosis_code && (
              <Text style={styles.cardMeta}>
                {t('card.diagnosisCode', { value: r.diagnosis_code })}
              </Text>
            )}
            {r.symptoms && (
              <Text style={styles.cardMeta}>
                {t('card.symptoms', { value: r.symptoms })}
              </Text>
            )}
            {r.weight != null && r.weight !== '' && (
              <Text style={styles.cardMeta}>
                {t('card.weight', { value: r.weight })}
              </Text>
            )}
            {r.temperature != null && r.temperature !== '' && (
              <Text style={styles.cardMeta}>
                {t('card.temperature', { value: r.temperature })}
              </Text>
            )}
            {r.follow_up_date && (
              <Text style={styles.cardMeta}>
                {t('card.followUp', { date: fmt(r.follow_up_date) })}
              </Text>
            )}
            {r.recommendations && (
              <Text style={styles.cardNote}>
                {t('card.recommendations', { value: r.recommendations })}
              </Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => { setEditRecord(r); setRecordModal(true); }}
              >
                <Text style={styles.actionEdit}>{t('card.edit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => deleteRecord(r.id)}
              >
                <Text style={styles.actionDelete}>{t('card.delete')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  // ─── JSX Return ─────────────────────────────────────────────────────────

  const TABS = ['overview', 'vaccines', 'medications', 'records'];

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('header.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => { if (selectedPet?.id) navigation.navigate('Appointments', { petId: selectedPet.id }); }}
          >
            <Ionicons name="today-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
          {selectedPet?.id && (
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => navigation.navigate('Documents', { petId: selectedPet.id })}
            >
              <Ionicons name="documents-outline" size={20} color={theme.accent} />
            </TouchableOpacity>
          )}
          {selectedPet?.id && (
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={handleExport}
              disabled={exporting}
            >
              {exporting
                ? <ActivityIndicator size="small" color={theme.accent} />
                : <Ionicons name="share-outline" size={20} color={theme.accent} />}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={handleScan}
            disabled={scanning}
          >
            <Ionicons name="scan-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
          {viewMode === 'list' && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              if (activeTab === 'vaccines') {
                setEditVaccine(null); setVaccineModal(true);
              } else if (activeTab === 'medications') {
                setEditMed(null); setMedModal(true);
              } else if (activeTab === 'records') {
                Alert.alert(t('modal.addChooser.title'), undefined, [
                  { text: t('recordTypes.visit'), onPress: () => { setEditRecord(null); setRecordModal(true); } },
                  { text: t('recordTypes.procedure'), onPress: () => setProcedureModal(true) },
                  { text: t('modal.cancel'), style: 'cancel' },
                ]);
              }
            }}
          >
            <Text style={styles.addBtnText}>
              {activeTab === 'overview' ? '···' : '+'}
            </Text>
          </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pet Switcher */}
      {petsLoading ? (
        <ActivityIndicator style={{ marginVertical: 12 }} color={theme.accent} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.petSwitcher}
          contentContainerStyle={styles.petSwitcherContent}
        >
          {pets.map(pet => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petChip,
                selectedPet?.id === pet.id && styles.petChipActive,
              ]}
              onPress={() => selectPet(pet.id)}
            >
              <Text style={[
                styles.petChipText,
                selectedPet?.id === pet.id && styles.petChipTextActive,
              ]}>
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Segmented: Список / Календарь / Паспорт */}
      <View style={styles.segmentWrap}>
        <Segmented
          options={[
            { k: 'list',     label: t('segment.list') },
            { k: 'calendar', label: t('segment.calendar') },
            { k: 'passport', label: t('segment.passport') },
          ]}
          value={viewMode}
          onChange={setViewMode}
        />
      </View>

      {/* Tabs (только в режиме списка) */}
      {viewMode === 'list' && (
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive,
            ]}>
              {t(`tabs.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      )}

      {/* Content */}
      {viewMode === 'calendar' ? (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          <Calendar
            markingType="multi-dot"
            onDayPress={(d) => setSelectedDate(d.dateString)}
            markedDates={selectedDate
              ? { ...markedDates, [selectedDate]: { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: theme.accentPress } }
              : markedDates}
            theme={{
              calendarBackground: 'transparent',
              monthTextColor: theme.t1,
              dayTextColor: theme.t1,
              textSectionTitleColor: theme.t3,
              textDisabledColor: theme.t4,
              todayTextColor: theme.accent,
              selectedDayBackgroundColor: theme.accentPress,
              selectedDayTextColor: theme.onAccent,
              arrowColor: theme.accent,
              dotColor: theme.accent,
            }}
            style={styles.calendar}
          />

          {/* Легенда типов событий (категориальная палитра) */}
          <View style={styles.legend}>
            {EVENT_TYPE_KEYS.map((type) => (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.eventTypes[type] }]} />
                <Text style={styles.legendText}>{t(`calendar.types.${type}`)}</Text>
              </View>
            ))}
          </View>
          {selectedDate ? (
            <View style={styles.agenda}>
              <Text style={styles.agendaTitle}>{t('calendar.agendaTitle')}</Text>
              {(itemsByDate[selectedDate] || []).length === 0 ? (
                <Text style={styles.agendaEmpty}>{t('calendar.empty')}</Text>
              ) : (
                itemsByDate[selectedDate].map((ev, i) => {
                  const evIcon = AGENDA_ICONS[ev.type] || AGENDA_ICONS.record;
                  const evColor = theme.eventTypes[ev.type] || theme.eventTypes.record;
                  const isRecord = ev.type === 'record';
                  const isAppointment = ev.type === 'appointment';
                  const tappable = isRecord || isAppointment;
                  const onPress = isRecord
                    ? () => navigation.navigate('RecordDetail', { recordId: ev.recordId, petId: selectedPet.id })
                    : isAppointment
                    ? () => navigation.navigate('Appointments', { petId: selectedPet.id })
                    : undefined;
                  const isPrescription = ev.type === 'prescription';
                  const canToggle = isPrescription && selectedDate <= todayYmd; // не отмечаем будущие дозы
                  const taken = isPrescription && isTaken(ev.refId, selectedDate);
                  return (
                    <TouchableOpacity
                      key={`${ev.type}-${ev.refId || ev.recordId || i}`}
                      style={styles.agendaCard}
                      activeOpacity={tappable ? 0.7 : 1}
                      disabled={!tappable}
                      onPress={onPress}
                    >
                      <View style={[styles.agendaIcon, { backgroundColor: evColor + '22' }]}>
                        <Ionicons name={evIcon} size={18} color={evColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.agendaType}>{t(`calendar.types.${ev.type}`)}</Text>
                        {ev.title ? <Text style={styles.agendaItemTitle} numberOfLines={1}>{ev.title}</Text> : null}
                      </View>
                      {tappable && <Ionicons name="chevron-forward" size={18} color={theme.t4} />}
                      {canToggle && (
                        <TouchableOpacity
                          style={styles.intakeToggle}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (taken) {
                              unmark(ev.refId, selectedDate).catch(() => {});
                            } else {
                              // Начисление только при отметке (не при снятии); dedup по рецепт|день.
                              markTaken(ev.refId, selectedDate)
                                .then(() =>
                                  awardEvent('medication_taken', `${ev.refId}|med_taken|${selectedDate}`, { sourceType: 'app' })
                                )
                                .catch(() => {});
                            }
                          }}
                        >
                          <Ionicons
                            name={taken ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={taken ? theme.ok : theme.t3}
                          />
                          <Text style={[styles.intakeLabel, taken && { color: theme.ok }]}>
                            {taken ? t('calendar.intake.taken') : t('calendar.intake.give')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : null}
        </ScrollView>
      ) : viewMode === 'passport' ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {selectedPet ? (
            <PassportView pet={selectedPet} refreshSignal={0} />
          ) : null}
        </ScrollView>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
      ) : (
        <>
          {activeTab === 'overview'    && renderOverview()}
          {activeTab === 'vaccines'    && renderVaccines()}
          {activeTab === 'medications' && renderMedications()}
          {activeTab === 'records'     && renderRecords()}
        </>
      )}

      {/* Modals */}
      <VaccineModal
        visible={vaccineModal}
        onClose={() => { setVaccineModal(false); setEditVaccine(null); }}
        onSave={saveVaccine}
        editData={editVaccine}
      />
      <MedicationModal
        visible={medModal}
        onClose={() => { setMedModal(false); setEditMed(null); }}
        onSave={saveMedication}
        editData={editMed}
      />
      <RecordModal
        visible={recordModal}
        onClose={() => { setRecordModal(false); setEditRecord(null); }}
        onSave={saveRecord}
        editData={editRecord}
      />
      <ProcedureModal
        visible={procedureModal}
        onClose={() => setProcedureModal(false)}
        onSave={saveProcedure}
      />

      {scanning && (
        <View style={styles.scanOverlay}>
          <ActivityIndicator size="large" color={theme.onAccent} />
          <Text style={styles.scanOverlayText}>{t('scan.loading')}</Text>
        </View>
      )}
    </Screen>
  );
}

// ─── Styles (без изменений) ───────────────────────────────────────────────────

const makeStyles = (theme) => StyleSheet.create({
  container:            { flex: 1, backgroundColor: 'transparent' },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: theme.hairline },
  backBtn:              { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:            { fontSize: 22, color: theme.accent, fontFamily: theme.font.semibold },
  headerTitle:          { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  addBtn:               { width: 36, height: 36, backgroundColor: theme.accentPress, borderRadius: theme.radii.r18, alignItems: 'center', justifyContent: 'center' },
  addBtnText:           { color: theme.onAccent, fontSize: 22, fontFamily: theme.font.regular, lineHeight: 28 },
  headerActions:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scanBtn:              { width: 36, height: 36, backgroundColor: theme.accentTint, borderRadius: theme.radii.r18, alignItems: 'center', justifyContent: 'center' },
  scanOverlay:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 14 }, // theme-neutral scrim
  scanOverlayText:      { color: theme.onAccent, fontSize: 15, fontFamily: theme.font.semibold },
  petSwitcher:          { maxHeight: 52, backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: theme.hairline },
  petSwitcherContent:   { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  petChip:              { paddingHorizontal: 16, paddingVertical: 6, borderRadius: theme.radii.r20, backgroundColor: theme.hairline, borderWidth: 1, borderColor: theme.hairline },
  petChipActive:        { backgroundColor: theme.accentPress, borderColor: theme.accentPress },
  petChipText:          { fontSize: 14, fontFamily: theme.font.medium, color: theme.t2 },
  petChipTextActive:    { color: theme.onAccent, fontFamily: theme.font.semibold },
  tabs:                 { flexDirection: 'row', backgroundColor: 'transparent', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.hairline },
  tab:                  { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:            { borderBottomColor: theme.accent },
  tabText:              { fontSize: 12, fontFamily: theme.font.medium, color: theme.t3 },
  tabTextActive:        { color: theme.accentPress, fontFamily: theme.font.bold },
  segmentWrap:          { paddingHorizontal: 16, marginVertical: 10 },
  calendar:             { marginHorizontal: 8, marginTop: 4, borderRadius: theme.radii.sm12, overflow: 'hidden' },
  legend:               { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 12, paddingTop: 10 },
  legendItem:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:            { width: 8, height: 8, borderRadius: theme.radii.xs4 },
  legendText:           { fontSize: 12, color: theme.t2 },
  agenda:               { marginTop: 8, paddingHorizontal: 12, paddingBottom: 24 },
  agendaTitle:          { fontSize: 14, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 8, marginTop: 4 },
  agendaEmpty:          { fontSize: 13, color: theme.t3, paddingVertical: 8 },
  agendaCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: theme.radii.sm12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.hairline },
  agendaIcon:           { width: 34, height: 34, borderRadius: theme.radii.r10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  agendaType:           { fontSize: 11, fontFamily: theme.font.semibold, color: theme.t3, textTransform: 'uppercase' },
  agendaItemTitle:      { fontSize: 14, color: theme.t1, fontFamily: theme.font.medium, marginTop: 1 },
  intakeToggle:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 6 },
  intakeLabel:          { fontSize: 12, fontFamily: theme.font.semibold, color: theme.t3 },
  tabContent:           { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  summaryRow:           { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard:          { flex: 1, borderRadius: theme.radii.sm12, padding: 14, alignItems: 'center' },
  summaryNum:           { fontSize: 24, fontFamily: theme.font.bold, color: theme.t1 },
  summaryLabel:         { fontSize: 11, color: theme.t3, marginTop: 2, fontFamily: theme.font.medium },
  alertBox:             { backgroundColor: theme.warn + '14', borderRadius: theme.radii.sm12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: theme.warn },
  alertTitle:           { fontSize: 14, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 8 },
  alertRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertRight:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertDate:            { fontSize: 12, color: theme.t3 },
  alertName:            { fontSize: 13, color: theme.t1, fontFamily: theme.font.medium },
  alertBadge:           { fontSize: 11, fontFamily: theme.font.bold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radii.sm8 },
  section:              { marginBottom: 16 },
  sectionTitle:         { fontSize: 14, fontFamily: theme.font.bold, color: theme.t2, marginBottom: 8 },
  overviewCard:         { backgroundColor: theme.surface, borderRadius: theme.radii.sm12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.hairline },
  overviewCardName:     { fontSize: 15, fontFamily: theme.font.semibold, color: theme.t1 },
  overviewCardSub:      { fontSize: 13, color: theme.t3, marginTop: 3 },
  overviewCardNote:     { fontSize: 13, color: theme.t3, marginTop: 4 },
  card:                 { backgroundColor: theme.surface, borderRadius: theme.radii.r14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.hairline, shadowColor: theme.shadow.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle:            { fontSize: 16, fontFamily: theme.font.bold, color: theme.t1, flex: 1, marginRight: 8 },
  cardMeta:             { fontSize: 13, color: theme.t3, marginBottom: 3 },
  cardNote:             { fontSize: 13, color: theme.t3, marginTop: 4, fontStyle: 'italic' },
  cardActions:          { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.hairline },
  actionBtn:            { paddingVertical: 4, paddingHorizontal: 8 },
  actionEdit:           { fontSize: 13, fontFamily: theme.font.semibold, color: theme.accentPress },
  actionDelete:         { fontSize: 13, fontFamily: theme.font.semibold, color: theme.danger },
  statusBadge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.r10 },
  statusText:           { fontSize: 11, fontFamily: theme.font.bold, color: theme.t1 },
  badgeRed:             { backgroundColor: theme.danger + '22' },
  badgeYellow:          { backgroundColor: theme.warn + '22' },
  badgeGreen:           { backgroundColor: theme.ok + '22' },
  ovAllergyBanner:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.danger + '14', borderRadius: theme.radii.sm12, padding: 14, marginBottom: 16 },
  ovAllergyTitle:       { fontSize: 14, fontFamily: theme.font.bold, color: theme.danger },
  ovAllergyList:        { fontSize: 13, color: theme.danger, marginTop: 2 },
  ovApptCard:           { backgroundColor: theme.surface, borderRadius: theme.radii.sm12, padding: 14, borderWidth: 1, borderColor: theme.hairline },
  ovApptHead:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  ovStatusBadge:        { paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.radii.sm8 },
  ovStatusText:         { fontSize: 11, fontFamily: theme.font.bold },
  ovApptDate:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ovApptDateText:       { fontSize: 13, color: theme.t3 },
  ovApptNone:           { fontSize: 13, color: theme.t3 },
  ovReminderRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.surface, borderRadius: theme.radii.sm12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.hairline },
  ovReminderDate:       { fontSize: 12, fontFamily: theme.font.bold, color: theme.accentPress, minWidth: 84 },
  ovReminderTitle:      { fontSize: 14, color: theme.t1, flex: 1 },
  badgeGray:            { backgroundColor: theme.hairline },
  badgePurple:          { backgroundColor: theme.accentTint },
  emptyState:           { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:            { fontSize: 48, marginBottom: 12 },
  emptyTitle:           { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 6 },
  emptySub:             { fontSize: 14, color: theme.t3, textAlign: 'center', paddingHorizontal: 20 },
});

const makeDpStyles = (theme) => StyleSheet.create({
  container:   { marginBottom: 12 },
  field:       { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.r10, paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  icon:        { marginRight: 2 },
  text:        { flex: 1, fontSize: 15, color: theme.t1 },
  placeholder: { color: theme.t4 },
});

const makeMStyles = (theme) => StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, // theme-neutral scrim
  sheet:       { backgroundColor: theme.surface, borderTopLeftRadius: theme.radii.lg24, borderTopRightRadius: theme.radii.lg24, padding: 24, maxHeight: '90%' },
  title:       { fontSize: 20, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 20, textAlign: 'center' },
  label:       { fontSize: 13, fontFamily: theme.font.semibold, color: theme.t2, marginBottom: 6, marginTop: 4 },
  input:       { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.r10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.t1, marginBottom: 12 },
  textArea:    { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  row:         { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn:         { flex: 1, paddingVertical: 14, borderRadius: theme.radii.sm12, alignItems: 'center', justifyContent: 'center' },
  btnCancel:   { backgroundColor: theme.hairline },
  btnSave:     { backgroundColor: theme.accentPress },
  btnCancelText: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.t2 },
  btnSaveText: { fontSize: 15, fontFamily: theme.font.semibold, color: theme.onAccent },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radii.r20, backgroundColor: theme.hairline, borderWidth: 1, borderColor: theme.hairline, marginRight: 8 },
  chipActive:  { backgroundColor: theme.accentPress, borderColor: theme.accentPress },
  chipText:    { fontSize: 13, fontFamily: theme.font.medium, color: theme.t2 },
  chipTextActive: { color: theme.onAccent, fontFamily: theme.font.semibold },
  toggleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  toggle:      { width: 48, height: 26, borderRadius: theme.radii.sm12, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn:    { backgroundColor: theme.accent },
  toggleOff:   { backgroundColor: theme.hairline },
  toggleThumb: { width: 20, height: 20, borderRadius: theme.radii.r10, backgroundColor: theme.surface, shadowColor: theme.shadow.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  thumbOn:     { alignSelf: 'flex-end' },
  thumbOff:    { alignSelf: 'flex-start' },
});
