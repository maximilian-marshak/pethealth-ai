import React, { useState, useEffect, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

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

const RECORD_TYPE_KEYS = [
  'checkup', 'surgery', 'emergency', 'dental', 'grooming', 'other',
];

// ─── DatePicker Field ─────────────────────────────────────────────────────────

const DatePickerField = ({ label, value, onChange, placeholder }) => {
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
          color={value ? '#6366F1' : '#9CA3AF'}
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
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
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

  const [name,      setName]      = useState('');
  const [dateGiven, setDateGiven] = useState('');
  const [nextDue,   setNextDue]   = useState('');
  const [vet,       setVet]       = useState('');
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.vaccine_name || '');
      setDateGiven(editData.date_given || '');
      setNextDue(editData.next_due_date || '');
      setVet(editData.vet_name || editData.administered_by || '');
      setNotes(editData.notes || '');
    } else {
      setName(''); setDateGiven(''); setNextDue(''); setVet(''); setNotes('');
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

          <Text style={mStyles.label}>{t('modal.vaccine.nameLabel')}</Text>
          <TextInput
            style={mStyles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('modal.vaccine.namePlaceholder')}
            placeholderTextColor="#9CA3AF"
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
            placeholderTextColor="#9CA3AF"
          />

          <Text style={mStyles.label}>{t('modal.vaccine.notesLabel')}</Text>
          <TextInput
            style={[mStyles.input, mStyles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('modal.vaccine.notesPlaceholder')}
            placeholderTextColor="#9CA3AF"
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
                ? <ActivityIndicator color="#fff" size="small" />
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={mStyles.title}>
              {editData
                ? t('modal.medication.editTitle')
                : t('modal.medication.addTitle')}
            </Text>

            <Text style={mStyles.label}>{t('modal.medication.nameLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('modal.medication.namePlaceholder')}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>{t('modal.medication.dosageLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder={t('modal.medication.dosagePlaceholder')}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>{t('modal.medication.frequencyLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={frequency}
              onChangeText={setFrequency}
              placeholder={t('modal.medication.frequencyPlaceholder')}
              placeholderTextColor="#9CA3AF"
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
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>{t('modal.medication.notesLabel')}</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('modal.medication.notesPlaceholder')}
              placeholderTextColor="#9CA3AF"
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
                  ? <ActivityIndicator color="#fff" size="small" />
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

  const [visitDate,   setVisitDate]   = useState('');
  const [recordType,  setRecordType]  = useState('checkup');
  const [vetName,     setVetName]     = useState('');
  const [clinic,      setClinic]      = useState('');
  const [diagnosis,   setDiagnosis]   = useState('');
  const [treatment,   setTreatment]   = useState('');
  const [cost,        setCost]        = useState('');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    if (editData) {
      setVisitDate(editData.visit_date   || '');
      setRecordType(editData.record_type || 'checkup');
      setVetName(editData.vet_name       || '');
      setClinic(editData.clinic_name     || '');
      setDiagnosis(editData.diagnosis    || '');
      setTreatment(editData.treatment    || '');
      setCost(editData.cost ? String(editData.cost) : '');
      setNotes(editData.notes            || '');
    } else {
      setVisitDate(''); setRecordType('checkup'); setVetName('');
      setClinic(''); setDiagnosis(''); setTreatment(''); setCost(''); setNotes('');
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
        visit_date:  visitDate,
        record_type: recordType,
        vet_name:    vetName.trim()   || null,
        clinic_name: clinic.trim()    || null,
        diagnosis:   diagnosis.trim() || null,
        treatment:   treatment.trim() || null,
        cost:        cost ? parseFloat(cost) : null,
        notes:       notes.trim()     || null,
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

            <Text style={mStyles.label}>{t('modal.record.recordTypeLabel')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {RECORD_TYPE_KEYS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    mStyles.chip,
                    recordType === type && mStyles.chipActive,
                  ]}
                  onPress={() => setRecordType(type)}
                >
                  <Text style={[
                    mStyles.chipText,
                    recordType === type && mStyles.chipTextActive,
                  ]}>
                    {t(`recordTypes.${type}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={mStyles.label}>{t('modal.record.vetNameLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={vetName}
              onChangeText={setVetName}
              placeholder={t('modal.record.vetNamePlaceholder')}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>{t('modal.record.clinicLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={clinic}
              onChangeText={setClinic}
              placeholder={t('modal.record.clinicPlaceholder')}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>{t('modal.record.diagnosisLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder={t('modal.record.diagnosisPlaceholder')}
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>{t('modal.record.treatmentLabel')}</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={treatment}
              onChangeText={setTreatment}
              placeholder={t('modal.record.treatmentPlaceholder')}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <Text style={mStyles.label}>{t('modal.record.costLabel')}</Text>
            <TextInput
              style={mStyles.input}
              value={cost}
              onChangeText={setCost}
              placeholder={t('modal.record.costPlaceholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />

            <Text style={mStyles.label}>{t('modal.record.notesLabel')}</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('modal.record.notesPlaceholder')}
              placeholderTextColor="#9CA3AF"
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
                  ? <ActivityIndicator color="#fff" size="small" />
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MedicalScreen() {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation('medical');

  // Локаль для formatDate
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const fmt    = (dateStr) => formatDate(dateStr, locale);

  const [pets,        setPets]        = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petsLoading, setPetsLoading] = useState(true);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [vaccines,    setVaccines]    = useState([]);
  const [medications, setMedications] = useState([]);
  const [records,     setRecords]     = useState([]);
  const [loading,     setLoading]     = useState(false);

  const [vaccineModal, setVaccineModal] = useState(false);
  const [medModal,     setMedModal]     = useState(false);
  const [recordModal,  setRecordModal]  = useState(false);
  const [editVaccine,  setEditVaccine]  = useState(null);
  const [editMed,      setEditMed]      = useState(null);
  const [editRecord,   setEditRecord]   = useState(null);

  // ─── Load Pets ──────────────────────────────────────────────────────────

  const loadPets = useCallback(async () => {
    try {
      setPetsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, avatar_url')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPets(data || []);
      if (data?.length > 0) setSelectedPet(prev => prev ?? data[0]);
    } catch (err) {
      console.error('loadPets:', err.message);
      Alert.alert('Error', t('errors.loadPets'));
    } finally {
      setPetsLoading(false);
    }
  }, [t]);

  useEffect(() => { loadPets(); }, [loadPets]);

  // ─── Load Medical Data ──────────────────────────────────────────────────

  const loadMedicalData = useCallback(async () => {
    if (!selectedPet) return;
    try {
      setLoading(true);
      const [vaccRes, medRes, recRes] = await Promise.all([
        supabase.from('vaccinations').select('*').eq('pet_id', selectedPet.id)
          .order('next_due_date', { ascending: true }),
        supabase.from('medications').select('*').eq('pet_id', selectedPet.id)
          .order('start_date', { ascending: false }),
        supabase.from('vet_records').select('*').eq('pet_id', selectedPet.id)
          .order('visit_date', { ascending: false }),
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

  useEffect(() => { loadMedicalData(); }, [loadMedicalData]);

  // ─── Vaccine CRUD ───────────────────────────────────────────────────────

  const saveVaccine = async (formData) => {
    try {
      if (editVaccine) {
        const { error } = await supabase.from('vaccinations')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editVaccine.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vaccinations')
          .insert({ ...formData, pet_id: selectedPet.id });
        if (error) throw error;
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
                .from('vaccinations').delete().eq('id', id);
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
        const { error } = await supabase.from('medications')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editMed.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('medications')
          .insert({ ...formData, pet_id: selectedPet.id });
        if (error) throw error;
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
                .from('medications').delete().eq('id', id);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        visit_date:  formData.visit_date,
        reason:      formData.record_type || null,
        vet_name:    formData.vet_name    || null,
        clinic_name: formData.clinic_name || null,
        diagnosis:   formData.diagnosis   || null,
        treatment:   formData.treatment   || null,
        cost:        formData.cost ?? null,
        notes:       formData.notes       || null,
      };

      if (editRecord) {
        const { error } = await supabase.from('vet_records')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vet_records')
          .insert({ ...payload, pet_id: selectedPet.id, user_id: user.id });
        if (error) throw error;
      }
      setRecordModal(false); setEditRecord(null);
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
                .from('vet_records').delete().eq('id', id);
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

  // ─── Render Overview ────────────────────────────────────────────────────

  const renderOverview = () => {
    const activeMeds   = medications.filter(m => m.is_active);
    const recentRecord = records[0];
    const isEmpty =
      vaccines.length === 0 &&
      medications.length === 0 &&
      records.length === 0;

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
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.summaryNum}>{vaccines.length}</Text>
            <Text style={styles.summaryLabel}>{t('overview.summary.vaccines')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.summaryNum}>{activeMeds.length}</Text>
            <Text style={styles.summaryLabel}>{t('overview.summary.activeMeds')}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF7ED' }]}>
            <Text style={styles.summaryNum}>{records.length}</Text>
            <Text style={styles.summaryLabel}>{t('overview.summary.vetVisits')}</Text>
          </View>
        </View>

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

        {/* Active Medications */}
        {activeMeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('overview.activeMedications')}</Text>
            {activeMeds.map(m => (
              <View key={m.id} style={styles.overviewCard}>
                <Text style={styles.overviewCardName}>{m.medication_name}</Text>
                <Text style={styles.overviewCardSub}>
                  {m.dosage} · {m.frequency}
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
                {fmt(recentRecord.visit_date)}
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
            <View key={v.id} style={styles.card}>
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
              {v.administered_by && (
                <Text style={styles.cardMeta}>
                  {t('card.by', { name: v.administered_by })}
                </Text>
              )}
              {v.notes && (
                <Text style={styles.cardNote}>{v.notes}</Text>
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
            </View>
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
          <View key={m.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{m.medication_name}</Text>
              <View style={[
                styles.statusBadge,
                m.is_active ? styles.badgeGreen : styles.badgeGray,
              ]}>
                <Text style={styles.statusText}>
                  {m.is_active ? t('status.active') : t('status.inactive')}
                </Text>
              </View>
            </View>

            {m.dosage && (
              <Text style={styles.cardMeta}>
                {t('card.dosage', { value: m.dosage })}
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
            {m.prescribed_by && (
              <Text style={styles.cardMeta}>
                {t('card.prescribedBy', { name: m.prescribed_by })}
              </Text>
            )}
            {m.notes && (
              <Text style={styles.cardNote}>{m.notes}</Text>
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
          </View>
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
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{fmt(r.visit_date)}</Text>
              <View style={[styles.statusBadge, styles.badgePurple]}>
                <Text style={styles.statusText}>
                  {r.reason
                    ? t(`recordTypes.${r.reason}`, {
                        defaultValue:
                          r.reason.charAt(0).toUpperCase() + r.reason.slice(1),
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
            {r.treatment && (
              <Text style={styles.cardNote}>
                {t('card.treatment', { value: r.treatment })}
              </Text>
            )}
            {r.cost && (
              <Text style={styles.cardMeta}>
                {t('card.cost', { value: Number(r.cost).toFixed(2) })}
              </Text>
            )}
            {r.notes && (
              <Text style={styles.cardNote}>{r.notes}</Text>
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
          </View>
        ))
      )}
    </ScrollView>
  );

  // ─── JSX Return ─────────────────────────────────────────────────────────

  const TABS = ['overview', 'vaccines', 'medications', 'records'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('header.title')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (activeTab === 'vaccines') {
              setEditVaccine(null); setVaccineModal(true);
            } else if (activeTab === 'medications') {
              setEditMed(null); setMedModal(true);
            } else if (activeTab === 'records') {
              setEditRecord(null); setRecordModal(true);
            }
          }}
        >
          <Text style={styles.addBtnText}>
            {activeTab === 'overview' ? '···' : '+'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pet Switcher */}
      {petsLoading ? (
        <ActivityIndicator style={{ marginVertical: 12 }} color="#6366F1" />
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
              onPress={() => setSelectedPet(pet)}
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

      {/* Tabs */}
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

      {/* Content */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6366F1" />
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
    </SafeAreaView>
  );
}

// ─── Styles (без изменений) ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#F9FAFB' },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn:              { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow:            { fontSize: 22, color: '#6366F1', fontWeight: '600' },
  headerTitle:          { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  addBtn:               { width: 36, height: 36, backgroundColor: '#6366F1', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addBtnText:           { color: '#fff', fontSize: 22, fontWeight: '300', lineHeight: 28 },
  petSwitcher:          { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  petSwitcherContent:   { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  petChip:              { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  petChipActive:        { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  petChipText:          { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  petChipTextActive:    { color: '#fff', fontWeight: '600' },
  tabs:                 { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab:                  { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:            { borderBottomColor: '#6366F1' },
  tabText:              { fontSize: 12, fontWeight: '500', color: '#9CA3AF' },
  tabTextActive:        { color: '#6366F1', fontWeight: '700' },
  tabContent:           { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  summaryRow:           { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard:          { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  summaryNum:           { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  summaryLabel:         { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  alertBox:             { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  alertTitle:           { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  alertRow:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  alertRight:           { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertDate:            { fontSize: 12, color: '#6B7280' },
  alertName:            { fontSize: 13, color: '#78350F', fontWeight: '500' },
  alertBadge:           { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  section:              { marginBottom: 16 },
  sectionTitle:         { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8 },
  overviewCard:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  overviewCardName:     { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  overviewCardSub:      { fontSize: 13, color: '#6B7280', marginTop: 3 },
  overviewCardNote:     { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  card:                 { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle:            { fontSize: 16, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 8 },
  cardMeta:             { fontSize: 13, color: '#6B7280', marginBottom: 3 },
  cardNote:             { fontSize: 13, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  cardActions:          { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  actionBtn:            { paddingVertical: 4, paddingHorizontal: 8 },
  actionEdit:           { fontSize: 13, fontWeight: '600', color: '#6366F1' },
  actionDelete:         { fontSize: 13, fontWeight: '600', color: '#EF4444' },
  statusBadge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText:           { fontSize: 11, fontWeight: '700' },
  badgeRed:             { backgroundColor: '#FEE2E2' },
  badgeYellow:          { backgroundColor: '#FEF3C7' },
  badgeGreen:           { backgroundColor: '#D1FAE5' },
  badgeGray:            { backgroundColor: '#F3F4F6' },
  badgePurple:          { backgroundColor: '#EEF2FF' },
  emptyState:           { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:            { fontSize: 48, marginBottom: 12 },
  emptyTitle:           { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  emptySub:             { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },
});

const dpStyles = StyleSheet.create({
  container:   { marginBottom: 12 },
  field:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  icon:        { marginRight: 2 },
  text:        { flex: 1, fontSize: 15, color: '#1F2937' },
  placeholder: { color: '#9CA3AF' },
});

const mStyles = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  title:       { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  label:       { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input:       { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1F2937', marginBottom: 12 },
  textArea:    { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  row:         { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn:         { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnCancel:   { backgroundColor: '#F3F4F6' },
  btnSave:     { backgroundColor: '#6366F1' },
  btnCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  btnSaveText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  chipActive:  { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText:    { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  toggle:      { width: 48, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn:    { backgroundColor: '#6366F1' },
  toggleOff:   { backgroundColor: '#D1D5DB' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  thumbOn:     { alignSelf: 'flex-end' },
  thumbOff:    { alignSelf: 'flex-start' },
});
