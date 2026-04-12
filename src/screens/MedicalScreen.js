import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
};

const getVaccineStatus = (nextDueDate) => {
  if (!nextDueDate) return { label: 'Completed', color: '#10B981', bg: '#D1FAE5' };
  const days = getDaysUntil(nextDueDate);
  if (days < 0)   return { label: 'Overdue',    color: '#EF4444', bg: '#FEE2E2' };
  if (days <= 30) return { label: 'Due Soon',   color: '#F59E0B', bg: '#FEF3C7' };
  return             { label: 'Up to Date', color: '#10B981', bg: '#D1FAE5' };
};

// ─── Constants ───────────────────────────────────────────────────────────────

const RECORD_TYPES = [
  'checkup',
  'surgery',
  'emergency',
  'dental',
  'grooming',
  'other',
];

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Every other day',
  'Weekly',
  'As needed',
];

// ─── Vaccine Modal ────────────────────────────────────────────────────────────

const VaccineModal = ({ visible, onClose, onSave, editData }) => {
  const [name, setName]         = useState('');
  const [dateGiven, setDateGiven] = useState('');
  const [nextDue, setNextDue]   = useState('');
  const [vet, setVet]           = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.vaccine_name || '');
      setDateGiven(editData.date_given || '');
      setNextDue(editData.next_due_date || '');
      setVet(editData.vet_name || editData.administered_by || '');
      setNotes(editData.notes || '');
    } else {
      setName(''); setDateGiven(''); setNextDue('');
      setVet(''); setNotes('');
    }
  }, [editData, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a vaccine name.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        vaccine_name:   name.trim(),
        date_given:     dateGiven || null,
        next_due_date:  nextDue || null,
        vet_name:       vet.trim() || null,
        administered_by: vet.trim() || null,
        notes:          notes.trim() || null,
      });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={mStyles.overlay}>
        <View style={mStyles.sheet}>
          <Text style={mStyles.title}>
            {editData ? 'Edit Vaccine' : 'Add Vaccine'}
          </Text>

          <Text style={mStyles.label}>Vaccine Name *</Text>
          <TextInput
            style={mStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rabies, DHPP"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={mStyles.label}>Date Given (YYYY-MM-DD)</Text>
          <TextInput
            style={mStyles.input}
            value={dateGiven}
            onChangeText={setDateGiven}
            placeholder="2024-01-15"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={mStyles.label}>Next Due Date (YYYY-MM-DD)</Text>
          <TextInput
            style={mStyles.input}
            value={nextDue}
            onChangeText={setNextDue}
            placeholder="2025-01-15"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={mStyles.label}>Administered By</Text>
          <TextInput
            style={mStyles.input}
            value={vet}
            onChangeText={setVet}
            placeholder="Dr. Smith"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={mStyles.label}>Notes</Text>
          <TextInput
            style={[mStyles.input, mStyles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />

          <View style={mStyles.row}>
            <TouchableOpacity
              style={[mStyles.btn, mStyles.btnCancel]}
              onPress={onClose}
            >
              <Text style={mStyles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mStyles.btn, mStyles.btnSave]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={mStyles.btnSaveText}>Save</Text>
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
  const [name, setName]             = useState('');
  const [dosage, setDosage]         = useState('');
  const [frequency, setFrequency]   = useState('');
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [notes, setNotes]           = useState('');
  const [isActive, setIsActive]     = useState(true);
  const [saving, setSaving]         = useState(false);

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
      Alert.alert('Required', 'Please enter a medication name.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        medication_name: name.trim(),
        dosage:          dosage.trim() || null,
        frequency:       frequency.trim() || null,
        start_date:      startDate || null,
        end_date:        endDate || null,
        prescribed_by:   prescriber.trim() || null,
        notes:           notes.trim() || null,
        is_active:       isActive,
      });
    } catch (err) {
      Alert.alert('Error', err.message);
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
              {editData ? 'Edit Medication' : 'Add Medication'}
            </Text>

            <Text style={mStyles.label}>Medication Name *</Text>
            <TextInput
              style={mStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Apoquel, Heartgard"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Dosage</Text>
            <TextInput
              style={mStyles.input}
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g. 16mg, 1 tablet"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Frequency</Text>
            <TextInput
              style={mStyles.input}
              value={frequency}
              onChangeText={setFrequency}
              placeholder="e.g. Once daily"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={mStyles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2024-01-15"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={mStyles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2024-06-15 (leave blank if ongoing)"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Prescribed By</Text>
            <TextInput
              style={mStyles.input}
              value={prescriber}
              onChangeText={setPrescriber}
              placeholder="Dr. Smith"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Notes</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={mStyles.toggleRow}
              onPress={() => setIsActive(!isActive)}
            >
              <Text style={mStyles.label}>Active Medication</Text>
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
                <Text style={mStyles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mStyles.btn, mStyles.btnSave]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={mStyles.btnSaveText}>Save</Text>
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
  const [visitDate, setVisitDate]   = useState('');
  const [recordType, setRecordType] = useState('checkup');
  const [vetName, setVetName]       = useState('');
  const [clinic, setClinic]         = useState('');
  const [diagnosis, setDiagnosis]   = useState('');
  const [treatment, setTreatment]   = useState('');
  const [cost, setCost]             = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (editData) {
      setVisitDate(editData.visit_date || '');
      setRecordType(editData.record_type || 'checkup');
      setVetName(editData.vet_name || '');
      setClinic(editData.clinic_name || '');
      setDiagnosis(editData.diagnosis || '');
      setTreatment(editData.treatment || '');
      setCost(editData.cost ? String(editData.cost) : '');
      setNotes(editData.notes || '');
    } else {
      setVisitDate(''); setRecordType('checkup'); setVetName('');
      setClinic(''); setDiagnosis(''); setTreatment('');
      setCost(''); setNotes('');
    }
  }, [editData, visible]);

  const handleSave = async () => {
    if (!visitDate.trim()) {
      Alert.alert('Required', 'Please enter a visit date.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        visit_date:  visitDate.trim(),
        record_type: recordType,
        vet_name:    vetName.trim()   || null,
        clinic_name: clinic.trim()    || null,
        diagnosis:   diagnosis.trim() || null,
        treatment:   treatment.trim() || null,
        cost:        cost ? parseFloat(cost) : null,
        notes:       notes.trim()     || null,
      });
    } catch (err) {
      Alert.alert('Error', err.message);
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
              {editData ? 'Edit Record' : 'Add Vet Record'}
            </Text>

            <Text style={mStyles.label}>Visit Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={mStyles.input}
              value={visitDate}
              onChangeText={setVisitDate}
              placeholder="2024-01-15"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Record Type</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {RECORD_TYPES.map((type) => (
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
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={mStyles.label}>Vet Name</Text>
            <TextInput
              style={mStyles.input}
              value={vetName}
              onChangeText={setVetName}
              placeholder="Dr. Smith"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Clinic Name</Text>
            <TextInput
              style={mStyles.input}
              value={clinic}
              onChangeText={setClinic}
              placeholder="Happy Paws Clinic"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Diagnosis</Text>
            <TextInput
              style={mStyles.input}
              value={diagnosis}
              onChangeText={setDiagnosis}
              placeholder="e.g. Ear infection"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={mStyles.label}>Treatment</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={treatment}
              onChangeText={setTreatment}
              placeholder="e.g. Prescribed antibiotics"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <Text style={mStyles.label}>Cost ($)</Text>
            <TextInput
              style={mStyles.input}
              value={cost}
              onChangeText={setCost}
              placeholder="150.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />

            <Text style={mStyles.label}>Notes</Text>
            <TextInput
              style={[mStyles.input, mStyles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />

            <View style={mStyles.row}>
              <TouchableOpacity
                style={[mStyles.btn, mStyles.btnCancel]}
                onPress={onClose}
              >
                <Text style={mStyles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[mStyles.btn, mStyles.btnSave]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={mStyles.btnSaveText}>Save</Text>
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

  const [pets, setPets]               = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petsLoading, setPetsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('overview');

  const [vaccines, setVaccines]       = useState([]);
  const [medications, setMedications] = useState([]);
  const [records, setRecords]         = useState([]);
  const [loading, setLoading]         = useState(false);

  const [vaccineModal, setVaccineModal] = useState(false);
  const [medModal, setMedModal]         = useState(false);
  const [recordModal, setRecordModal]   = useState(false);
  const [editVaccine, setEditVaccine]   = useState(null);
  const [editMed, setEditMed]           = useState(null);
  const [editRecord, setEditRecord]     = useState(null);

  // ─── Load Pets ────────────────────────────────────────────────────────────

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
      if (data && data.length > 0) {
        setSelectedPet(prev => prev ?? data[0]);
      }
    } catch (err) {
      console.error('loadPets error:', err.message);
      Alert.alert('Error', 'Could not load pets.');
    } finally {
      setPetsLoading(false);
    }
  }, []);

  useEffect(() => { loadPets(); }, [loadPets]);

  // ─── Load Medical Data ────────────────────────────────────────────────────

  const loadMedicalData = useCallback(async () => {
    if (!selectedPet) return;
    try {
      setLoading(true);

      const [vaccRes, medRes, recRes] = await Promise.all([
        supabase
          .from('vaccinations')
          .select('*')
          .eq('pet_id', selectedPet.id)
          .order('next_due_date', { ascending: true }),
        supabase
          .from('medications')
          .select('*')
          .eq('pet_id', selectedPet.id)
          .order('start_date', { ascending: false }),
        supabase
          .from('vet_records')
          .select('*')
          .eq('pet_id', selectedPet.id)
          .order('visit_date', { ascending: false }),
      ]);

      if (vaccRes.error) throw vaccRes.error;
      if (medRes.error)  throw medRes.error;
      if (recRes.error)  throw recRes.error;

      setVaccines(vaccRes.data   || []);
      setMedications(medRes.data || []);
      setRecords(recRes.data     || []);
    } catch (err) {
      console.error('loadMedicalData error:', err.message);
      Alert.alert('Error', 'Could not load medical data.');
    } finally {
      setLoading(false);
    }
  }, [selectedPet]);

  useEffect(() => { loadMedicalData(); }, [loadMedicalData]);

  // ─── Vaccine CRUD ─────────────────────────────────────────────────────────

  const saveVaccine = async (formData) => {
    try {
      if (editVaccine) {
        const { error } = await supabase
          .from('vaccinations')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editVaccine.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vaccinations')
          .insert({ ...formData, pet_id: selectedPet.id });
        if (error) throw error;
      }
      setVaccineModal(false);
      setEditVaccine(null);
      await loadMedicalData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const deleteVaccine = (id) => {
    Alert.alert(
      'Delete Vaccination',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('vaccinations')
                .delete()
                .eq('id', id);
              if (error) throw error;
              await loadMedicalData();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Medication CRUD ──────────────────────────────────────────────────────

  const saveMedication = async (formData) => {
    try {
      if (editMed) {
        const { error } = await supabase
          .from('medications')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editMed.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medications')
          .insert({ ...formData, pet_id: selectedPet.id });
        if (error) throw error;
      }
      setMedModal(false);
      setEditMed(null);
      await loadMedicalData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const deleteMedication = (id) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('medications')
                .delete()
                .eq('id', id);
              if (error) throw error;
              await loadMedicalData();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Vet Record CRUD ──────────────────────────────────────────────────────

  const saveRecord = async (formData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload = {
        visit_date:  formData.visit_date,
        reason:      formData.record_type || null,
        diagnosis:   formData.diagnosis   || null,
        treatment:   formData.treatment   || null,
        notes:       formData.notes       || null,
      };

      if (editRecord) {
        const { error } = await supabase
          .from('vet_records')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', editRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vet_records')
          .insert({ ...payload, pet_id: selectedPet.id, user_id: user.id });
        if (error) throw error;
      }

      setRecordModal(false);
      setEditRecord(null);
      await loadMedicalData();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const deleteRecord = (id) => {
    Alert.alert(
      'Delete Vet Record',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('vet_records')
                .delete()
                .eq('id', id);
              if (error) throw error;
              await loadMedicalData();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  // ─── Overview Tab ─────────────────────────────────────────────────────────

  // ===== ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ (добавить ПЕРЕД renderOverview) =====

const SummaryCard = ({ count, label, color }) => (
  <View style={[styles.summaryCard, { backgroundColor: color }]}>
    <Text style={styles.summaryNum}>{count}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const SummaryCards = ({ vaccineCount, activeMedCount, recordCount }) => (
  <View style={styles.summaryRow}>
    <SummaryCard count={vaccineCount} label="Vaccines" color="#EEF2FF" />
    <SummaryCard count={activeMedCount} label="Active Meds" color="#F0FDF4" />
    <SummaryCard count={recordCount} label="Vet Visits" color="#FFF7ED" />
  </View>
);

const AttentionSection = ({ vaccines, getVaccineStatus, getDaysUntil, styles }) => (
  <View style={styles.alertBox}>
    <Text style={styles.alertTitle}>⚠️ Attention Required</Text>
    <Text style={styles.sectionTitle}>Upcoming Vaccines</Text>
    {vaccines.map(v => {
      const status = getVaccineStatus(v.next_due_date);
      const days = getDaysUntil(v.next_due_date);
      const isOverdue = status.label === 'Overdue';
      
      return (
        <View key={v.id} style={styles.alertRow}>
          <Text style={styles.alertName}>{v.vaccine_name}</Text>
          <Text style={[
            styles.alertBadge,
            isOverdue ? styles.badgeRed : styles.badgeYellow,
          ]}>
            {isOverdue ? `${Math.abs(days)}d overdue` : `Due in ${days}d`}
          </Text>
        </View>
      );
    })}
  </View>
);

const ActiveMedicationsSection = ({ medications, styles }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Active Medications</Text>
    {medications.map(m => (
      <View key={m.id} style={styles.overviewCard}>
        <Text style={styles.overviewCardName}>{m.medication_name}</Text>
        <Text style={styles.overviewCardSub}>
          {m.dosage} · {m.frequency}
        </Text>
      </View>
    ))}
  </View>
);

const LastVisitSection = ({ record, formatDate, styles }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Last Vet Visit</Text>
    <View style={styles.overviewCard}>
      <Text style={styles.overviewCardName}>
        {formatDate(record.visit_date)}
      </Text>
      {record.vet_name && (
        <Text style={styles.overviewCardSub}>
          Dr. {record.vet_name}
          {record.clinic_name ? ` · ${record.clinic_name}` : ''}
        </Text>
      )}
      {record.diagnosis && (
        <Text style={styles.overviewCardNote}>{record.diagnosis}</Text>
      )}
    </View>
  </View>
);

// ===== ОСНОВНАЯ ФУНКЦИЯ renderOverview =====
const renderOverview = () => {
  // ВРЕМЕННО: расширяем окно до 365 дней для тестирования
  const dueVaccines = vaccines.filter(v => {
    if (!v.next_due_date) return false;
    const days = getDaysUntil(v.next_due_date);
    return days >= -30 && days <= 365; // от 30 дней просрочки до 365 дней вперед
  });
  
  const activeMeds = medications.filter(m => m.is_active);
  const recentRecord = records[0];

  const isEmpty = vaccines.length === 0 && medications.length === 0 && records.length === 0;

  if (isEmpty) {
    return (
      <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏥</Text>
          <Text style={styles.emptyTitle}>No Medical Records Yet</Text>
          <Text style={styles.emptySub}>
            Start by adding a vaccination, medication, or vet visit.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      <SummaryCards 
        vaccineCount={vaccines.length}
        activeMedCount={activeMeds.length}
        recordCount={records.length}
      />

      {/* DEBUG: Всегда показываем секцию вакцин если они есть */}
      {vaccines.length > 0 && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>⚠️ Upcoming Vaccines</Text>
          {vaccines.map(v => {
            const status = getVaccineStatus(v.next_due_date);
            const days = getDaysUntil(v.next_due_date);
            
            return (
              <View key={v.id} style={styles.alertRow}>
                <Text style={styles.alertName}>{v.vaccine_name}</Text>
                <View style={styles.alertRight}>
                  <Text style={styles.alertDate}>{formatDate(v.next_due_date)}</Text>
                  <Text style={[
                    styles.alertBadge,
                    status.label === 'Overdue' ? styles.badgeRed :
                    status.label === 'Due Soon' ? styles.badgeYellow :
                    styles.badgeGreen
                  ]}>
                    {status.label === 'Overdue' ? `${Math.abs(days)}d overdue` :
                     status.label === 'Due Soon' ? `Due in ${days}d` :
                     `In ${days}d`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {activeMeds.length > 0 && (
        <ActiveMedicationsSection medications={activeMeds} styles={styles} />
      )}

      {recentRecord && (
        <LastVisitSection record={recentRecord} formatDate={formatDate} styles={styles} />
      )}
    </ScrollView>
  );
};
  // ─── Vaccines Tab ─────────────────────────────────────────────────────────

  const renderVaccines = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      {vaccines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💉</Text>
          <Text style={styles.emptyTitle}>No Vaccinations Recorded</Text>
          <Text style={styles.emptySub}>
            Tap the + button to add a vaccination.
          </Text>
        </View>
      ) : (
        vaccines.map(v => {
          const status = getVaccineStatus(v.next_due_date);
          const days   = getDaysUntil(v.next_due_date);
          return (
            <View key={v.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{v.vaccine_name}</Text>
                <View style={[
                  styles.statusBadge,
                  status.label === 'Overdue'     && styles.badgeRed,
                  status.label === 'Due Soon'    && styles.badgeYellow,
                  status.label === 'Up to Date'  && styles.badgeGreen,
                  status.label === 'Completed'   && styles.badgeGreen,
                ]}>
                  <Text style={styles.statusText}>
                    {status.label === 'Overdue'
                      ? `${Math.abs(days)}d overdue`
                      : status.label === 'Due Soon'
                      ? `Due in ${days}d`
                      : status.label}
                  </Text>
                </View>
              </View>

              {v.date_given && (
                <Text style={styles.cardMeta}>
                  Given: {formatDate(v.date_given)}
                </Text>
              )}
              {v.next_due_date && (
                <Text style={styles.cardMeta}>
                  Next due: {formatDate(v.next_due_date)}
                </Text>
              )}
              {v.administered_by && (
                <Text style={styles.cardMeta}>
                  By: {v.administered_by}
                </Text>
              )}
              {v.notes && (
                <Text style={styles.cardNote}>{v.notes}</Text>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setEditVaccine(v);
                    setVaccineModal(true);
                  }}
                >
                  <Text style={styles.actionEdit}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => deleteVaccine(v.id)}
                >
                  <Text style={styles.actionDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  // ─── Medications Tab ──────────────────────────────────────────────────────

  const renderMedications = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      {medications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💊</Text>
          <Text style={styles.emptyTitle}>No Medications Recorded</Text>
          <Text style={styles.emptySub}>
            Tap the + button to add a medication.
          </Text>
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
                  {m.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {m.dosage && (
              <Text style={styles.cardMeta}>Dosage: {m.dosage}</Text>
            )}
            {m.frequency && (
              <Text style={styles.cardMeta}>Frequency: {m.frequency}</Text>
            )}
            {m.start_date && (
              <Text style={styles.cardMeta}>
                Started: {formatDate(m.start_date)}
              </Text>
            )}
            {m.end_date && (
              <Text style={styles.cardMeta}>
                Ends: {formatDate(m.end_date)}
              </Text>
            )}
            {m.prescribed_by && (
              <Text style={styles.cardMeta}>
                Prescribed by: {m.prescribed_by}
              </Text>
            )}
            {m.notes && (
              <Text style={styles.cardNote}>{m.notes}</Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditMed(m);
                  setMedModal(true);
                }}
              >
                <Text style={styles.actionEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => deleteMedication(m.id)}
              >
                <Text style={styles.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // ─── Records Tab ──────────────────────────────────────────────────────────
  // ✅ ИСПРАВЛЕНО: был сломан JSX — <Textrecords.map ...> и неверная структура

  const renderRecords = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.tabContent}>
      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Vet Records Yet</Text>
          <Text style={styles.emptySub}>
            Tap the + button to log a vet visit.
          </Text>
        </View>
      ) : (
        records.map(r => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {formatDate(r.visit_date)}
              </Text>
              <View style={[styles.statusBadge, styles.badgePurple]}>
                <Text style={styles.statusText}>
                  {r.reason
                    ? r.reason.charAt(0).toUpperCase() + r.reason.slice(1)
                    : 'Visit'}
                </Text>
              </View>
            </View>

            {r.vet_name && (
              <Text style={styles.cardMeta}>Vet: Dr. {r.vet_name}</Text>
            )}
            {r.clinic_name && (
              <Text style={styles.cardMeta}>Clinic: {r.clinic_name}</Text>
            )}
            {r.diagnosis && (
              <Text style={styles.cardMeta}>Diagnosis: {r.diagnosis}</Text>
            )}
            {r.treatment && (
              <Text style={styles.cardNote}>Treatment: {r.treatment}</Text>
            )}
            {r.cost && (
              <Text style={styles.cardMeta}>
                Cost: ${Number(r.cost).toFixed(2)}
              </Text>
            )}
            {r.notes && (
              <Text style={styles.cardNote}>{r.notes}</Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setEditRecord(r);
                  setRecordModal(true);
                }}
              >
                <Text style={styles.actionEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => deleteRecord(r.id)}
              >
                <Text style={styles.actionDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  // ─── JSX Return ───────────────────────────────────────────────────────────

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
        <Text style={styles.headerTitle}>Medical Records</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (activeTab === 'vaccines') {
              setEditVaccine(null);
              setVaccineModal(true);
            } else if (activeTab === 'medications') {
              setEditMed(null);
              setMedModal(true);
            } else if (activeTab === 'records') {
              setEditRecord(null);
              setRecordModal(true);
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
        {['overview', 'vaccines', 'medications', 'records'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive,
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color="#6366F1"
        />
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

// ─── Main StyleSheet ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: '#6366F1',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  addBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#6366F1',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 28,
  },
  petSwitcher: {
    maxHeight: 52,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  petSwitcherContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  petChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  petChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  petChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  petChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  summaryNum: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  alertBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },  
  alertName: {
    fontSize: 13,
    color: '#78350F',
    fontWeight: '500',
  },
  alertBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overviewCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  overviewCardSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  overviewCardNote: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 3,
  },
  cardNote: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionEdit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  actionDelete: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeYellow: {
    backgroundColor: '#FEF3C7',
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  badgeGray: {
    backgroundColor: '#F3F4F6',
  },
  badgePurple: {
    backgroundColor: '#EEF2FF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // NEW: Vaccine due date badges
  dueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  dueSoonBadge: {
    backgroundColor: '#FEF3C7',
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
  },
  dueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dueSoonText: {
    color: '#92400E',
  },
  overdueText: {
    color: '#991B1B',
  },
}); 


// ─── Modal Styles ─────────────────────────────────────────────────────────────

const mStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#F3F4F6',
  },
  btnSave: {
    backgroundColor: '#6366F1',
  },
  btnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  btnSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: '#6366F1',
  },
  toggleOff: {
    backgroundColor: '#D1D5DB',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  thumbOff: {
    alignSelf: 'flex-start',
  },
});
