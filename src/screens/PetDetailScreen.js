// ══════════════════════════════════════════════════
// src/screens/PetDetailScreen.js
// ══════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePets } from '../hooks/usePets';
import { supabase } from '../utils/supabase';
import { pickAndUpload } from '../services/imageUploadService';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Тяжесть аллергии: хранится mild/moderate/severe или null (CHECK в БД).
const SEVERITY_OPTIONS = [
  { value: null,       label: 'Не указано' },
  { value: 'mild',     label: 'Лёгкая' },
  { value: 'moderate', label: 'Средняя' },
  { value: 'severe',   label: 'Тяжёлая' },
];

// Поле даты для модалок паспорта: хранит YYYY-MM-DD, показывает DD.MM.YYYY.
const PassportDateField = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  const dateVal = value ? new Date(value + 'T00:00:00') : new Date();
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
  const display = value ? `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}` : 'Выберите дату';
  return (
    <View style={styles.modalInputGroup}>
      <Text style={styles.modalInputLabel}>{label}</Text>
      <TouchableOpacity style={[styles.modalInput, styles.passportDateField]} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={18} color={value ? '#6B4EFF' : '#C0C0C0'} />
        <Text style={[styles.passportDateText, !value && { color: '#C0C0C0' }]}>{display}</Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#C0C0C0" />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
      {show && (
        <DateTimePicker value={dateVal} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handle} />
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════
export default function PetDetailScreen({ route, navigation }) {
  const petId = route?.params?.petId;
  const { pets, updatePetPhoto, deletePet } = usePets();

  // ─── Core state ───────────────────────────────
  const [pet, setPet]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading]   = useState(false);

  // ─── Stats & sections ─────────────────────────
  const [stats, setStats] = useState({
    vaccinations: 0,
    medicalRecords: 0,
    daysSinceLastVisit: null,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentRecords, setRecentRecords]   = useState([]);
  const [allergies, setAllergies]           = useState([]);
  const [conditions, setConditions]         = useState([]);

  // ─── Weight state ─────────────────────────────
  const [weightHistory, setWeightHistory]     = useState([]);
  const [weightLoading, setWeightLoading]     = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [newWeight, setNewWeight]             = useState('');
  const [weightNote, setWeightNote]           = useState('');
  const [savingWeight, setSavingWeight]       = useState(false);

  // ─── Passport (allergies / conditions) modal state ───
  const [allergyModal, setAllergyModal]   = useState(false);
  const [editAllergy, setEditAllergy]     = useState(null);
  const [aSubstance, setASubstance]       = useState('');
  const [aReaction, setAReaction]         = useState('');
  const [aSeverity, setASeverity]         = useState(null);
  const [aNotedOn, setANotedOn]           = useState('');
  const [savingAllergy, setSavingAllergy] = useState(false);

  const [condModal, setCondModal]         = useState(false);
  const [editCondition, setEditCondition] = useState(null);
  const [cCondition, setCCondition]       = useState('');
  const [cCode, setCCode]                 = useState('');
  const [cSince, setCSince]               = useState('');
  const [cActive, setCActive]             = useState(true);
  const [cNotes, setCNotes]               = useState('');
  const [savingCondition, setSavingCondition] = useState(false);

  // ═══ GUARD: нет petId ════════════════════════
  useEffect(() => {
    if (!petId) {
      console.warn('PetDetailScreen: petId is undefined, going back');
      navigation.goBack();
    }
  }, [petId]);

  // ═══ LOAD ON MOUNT / PETS CHANGE ═════════════
  useEffect(() => {
    if (!petId) return;
    loadPetData();
  }, [petId, pets]);

  const loadPetData = () => {
    const foundPet = pets.find(p => p.id === petId);
    if (foundPet) {
      setPet(foundPet);
      loadStats();
      loadUpcomingEvents();
      loadRecentRecords();
      loadWeightHistory();
      loadAllergies();
      loadConditions();
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStats(),
      loadUpcomingEvents(),
      loadRecentRecords(),
      loadWeightHistory(),
      loadAllergies(),
      loadConditions(),
    ]);
    setRefreshing(false);
  };

  // ═══ STATS ═══════════════════════════════════
  const loadStats = async () => {
    if (!petId) return;
    try {
      const { count: vaccCount } = await supabase
        .from('vaccinations')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', petId);

      const { count: medCount } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', petId);

      const { data: lastVisitData } = await supabase
        .from('medical_records')
        .select('date')
        .eq('pet_id', petId)
        .in('record_type', ['checkup', 'surgery', 'diagnosis'])
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      let daysSince = null;
      if (lastVisitData?.date) {
        const diffTime = Date.now() - new Date(lastVisitData.date).getTime();
        daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      setStats({
        vaccinations:      vaccCount || 0,
        medicalRecords:    medCount  || 0,
        daysSinceLastVisit: daysSince,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ═══ UPCOMING EVENTS ════════════════════════
  const loadUpcomingEvents = async () => {
    if (!petId) return;
    try {
      const now = new Date().toISOString();

      const { data: reminders } = await supabase
        .from('reminders')
        .select('id, title, reminder_type, due_date')
        .eq('pet_id', petId)
        .eq('is_completed', false)
        .gte('due_date', now)
        .order('due_date', { ascending: true })
        .limit(5);

      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('id, vaccine_name, next_due_date')
        .eq('pet_id', petId)
        .not('next_due_date', 'is', null)
        .gte('next_due_date', now)
        .order('next_due_date', { ascending: true })
        .limit(3);

      const events = [];

      if (vaccinations) {
        vaccinations.forEach(v => {
          if (v.next_due_date) {
            events.push({
              type:  'vaccination',
              title: v.vaccine_name,
              date:  v.next_due_date,
              icon:  'medkit-outline',
              color: '#FF6B6B',
            });
          }
        });
      }

      if (reminders) {
        const iconMap = {
          vaccination: 'medkit-outline',
          checkup:     'stethoscope-outline',
          vet_visit:   'hospital-outline',
          medication:  'medical-outline',
          grooming:    'cut-outline',
        };
        reminders.forEach(r => {
          events.push({
            type:  r.reminder_type,
            title: r.title,
            date:  r.due_date,
            icon:  iconMap[r.reminder_type] || 'calendar-outline',
            color: '#6C63FF',
          });
        });
      }

      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      setUpcomingEvents(events.slice(0, 3));
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  };

  // ═══ RECENT RECORDS ═════════════════════════
  const loadRecentRecords = async () => {
    if (!petId) return;
    try {
      const { data: medRecords } = await supabase
        .from('medical_records')
        .select('id, record_type, title, date, description')
        .eq('pet_id', petId)
        .order('date', { ascending: false })
        .limit(3);

      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('id, vaccine_name, date_given, notes')
        .eq('pet_id', petId)
        .order('date_given', { ascending: false })
        .limit(2);

      const typeIconMap = {
        vaccination:        { icon: 'medkit-outline',      color: '#FF6B6B' },
        parasite_treatment: { icon: 'bug-outline',         color: '#8BC34A' },
        checkup:            { icon: 'stethoscope-outline', color: '#2196F3' },
        surgery:            { icon: 'cut-outline',         color: '#FF9800' },
        diagnosis:          { icon: 'clipboard-outline',   color: '#9C27B0' },
        other:              { icon: 'document-outline',    color: '#9E9E9E' },
      };

      const records = [];

      if (medRecords) {
        medRecords.forEach(r => {
          const meta = typeIconMap[r.record_type] || typeIconMap.other;
          records.push({
            type:        r.record_type,
            title:       r.title,
            date:        r.date,
            description: r.description || '',
            icon:        meta.icon,
            color:       meta.color,
          });
        });
      }

      if (vaccinations) {
        vaccinations.forEach(v => {
          records.push({
            type:        'vaccination',
            title:       v.vaccine_name,
            date:        v.date_given,
            description: v.notes || 'Вакцинация',
            icon:        'medkit-outline',
            color:       '#FF6B6B',
          });
        });
      }

      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentRecords(records.slice(0, 4));
    } catch (error) {
      console.error('Error loading recent records:', error);
    }
  };

  // ═══ WEIGHT HISTORY ═════════════════════════
  const loadWeightHistory = async () => {
    if (!petId) return;
    setWeightLoading(true);
    try {
      const { data, error } = await supabase
        .from('weight_history')
        .select('id, weight, weight_unit, measured_at, notes')
        .eq('pet_id', petId)
        .order('measured_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setWeightHistory(data || []);
    } catch (error) {
      console.error('Error loading weight history:', error);
    } finally {
      setWeightLoading(false);
    }
  };

  // ═══ ALLERGIES / CONDITIONS (паспорт) ════════
  const loadAllergies = async () => {
    if (!petId) return;
    try {
      const { data, error } = await supabase
        .from('pet_allergies')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAllergies(data || []);
    } catch (error) {
      console.error('Error loading allergies:', error);
    }
  };

  const loadConditions = async () => {
    if (!petId) return;
    try {
      const { data, error } = await supabase
        .from('pet_conditions')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConditions(data || []);
    } catch (error) {
      console.error('Error loading conditions:', error);
    }
  };

  // ─── Save new weight ──────────────────────
  const handleSaveWeight = async () => {
    const parsed = parseFloat(newWeight.replace(',', '.'));
    if (!parsed || parsed <= 0 || parsed > 200) {
      Alert.alert('Ошибка', 'Введите корректный вес (0–200)');
      return;
    }

    setSavingWeight(true);
    try {
      const unit = pet?.weight_unit || 'kg';

      // 1. Добавляем в weight_history
      const { error: histError } = await supabase
        .from('weight_history')
        .insert({
          pet_id:      petId,
          weight:      parsed,
          weight_unit: unit,
          measured_at: new Date().toISOString(),
          notes:       weightNote.trim() || null,
        });

      if (histError) throw histError;

      // 2. Обновляем текущий вес питомца
      const { error: petError } = await supabase
        .from('pets')
        .update({ weight: parsed, weight_unit: unit })
        .eq('id', petId);

      if (petError) throw petError;

      // 3. Обновляем локальный стейт
      setPet(prev => prev ? { ...prev, weight: parsed, weight_unit: unit } : prev);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWeightModalVisible(false);
      setNewWeight('');
      setWeightNote('');
      await loadWeightHistory();
    } catch (error) {
      console.error('Error saving weight:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить вес');
    } finally {
      setSavingWeight(false);
    }
  };

  // ═══ ALLERGY CRUD ════════════════════════════
  const openAddAllergy = () => {
    setEditAllergy(null);
    setASubstance(''); setAReaction(''); setASeverity(null); setANotedOn('');
    setAllergyModal(true);
  };
  const openEditAllergy = (row) => {
    setEditAllergy(row);
    setASubstance(row.substance || '');
    setAReaction(row.reaction || '');
    setASeverity(row.severity || null);
    setANotedOn(row.noted_on ? row.noted_on.slice(0, 10) : '');
    setAllergyModal(true);
  };
  const saveAllergy = async () => {
    if (!aSubstance.trim()) { Alert.alert('Ошибка', 'Укажите вещество (аллерген)'); return; }
    setSavingAllergy(true);
    try {
      const payload = {
        substance: aSubstance.trim(),
        reaction: aReaction.trim() || null,
        severity: aSeverity || null,
        noted_on: aNotedOn || null,
      };
      const { error } = editAllergy
        ? await supabase.from('pet_allergies').update(payload).eq('id', editAllergy.id)
        : await supabase.from('pet_allergies').insert({ pet_id: petId, ...payload });
      if (error) throw error;
      setAllergyModal(false); setEditAllergy(null);
      await loadAllergies();
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSavingAllergy(false);
    }
  };
  const deleteAllergy = (row) => {
    Alert.alert('Удалить аллергию?', row.substance, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('pet_allergies').delete().eq('id', row.id);
          if (error) throw error;
          await loadAllergies();
        } catch (e) { Alert.alert('Ошибка', e.message); }
      } },
    ]);
  };

  // ═══ CONDITION CRUD ══════════════════════════
  const openAddCondition = () => {
    setEditCondition(null);
    setCCondition(''); setCCode(''); setCSince(''); setCActive(true); setCNotes('');
    setCondModal(true);
  };
  const openEditCondition = (row) => {
    setEditCondition(row);
    setCCondition(row.condition || '');
    setCCode(row.code || '');
    setCSince(row.since_date ? row.since_date.slice(0, 10) : '');
    setCActive(row.active !== false);
    setCNotes(row.notes || '');
    setCondModal(true);
  };
  const saveCondition = async () => {
    if (!cCondition.trim()) { Alert.alert('Ошибка', 'Укажите название заболевания'); return; }
    setSavingCondition(true);
    try {
      const payload = {
        condition: cCondition.trim(),
        code: cCode.trim() || null,
        since_date: cSince || null,
        active: cActive,
        notes: cNotes.trim() || null,
      };
      const { error } = editCondition
        ? await supabase.from('pet_conditions').update(payload).eq('id', editCondition.id)
        : await supabase.from('pet_conditions').insert({ pet_id: petId, ...payload });
      if (error) throw error;
      setCondModal(false); setEditCondition(null);
      await loadConditions();
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSavingCondition(false);
    }
  };
  const deleteCondition = (row) => {
    Alert.alert('Удалить заболевание?', row.condition, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('pet_conditions').delete().eq('id', row.id);
          if (error) throw error;
          await loadConditions();
        } catch (e) { Alert.alert('Ошибка', e.message); }
      } },
    ]);
  };

  // ─── Weight chart data ────────────────────
  const getChartData = () => {
    // Берём последние 8, переворачиваем в хронологический порядок
    const sorted = [...weightHistory].reverse().slice(-8);
    if (sorted.length < 2) return null;

    const labels = sorted.map(w => {
      const d = new Date(w.measured_at);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const datasets = [{ data: sorted.map(w => w.weight) }];

    return { labels, datasets };
  };

  // ─── Weight trend ─────────────────────────
  const getWeightTrend = () => {
    if (weightHistory.length < 2) return null;
    const latest = weightHistory[0].weight;
    const prev   = weightHistory[1].weight;
    const diff   = latest - prev;

    if (Math.abs(diff) < 0.05) return { type: 'stable', diff: 0, label: 'Стабильно' };
    if (diff > 0)               return { type: 'up',     diff,   label: `+${diff.toFixed(1)} кг` };
    return                              { type: 'down',   diff,   label: `${diff.toFixed(1)} кг` };
  };

  // ═══ PHOTO UPLOAD ════════════════════════════
  const handleUpdatePhoto = async () => {
    if (!pet) return;
    try {
      setUploading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // pickAndUpload(petId, currentImageUrl) -> новый URL (строка) или null
      const newUrl = await pickAndUpload(petId, pet.avatar_url ?? null);

      if (newUrl) {
        await updatePetPhoto(petId, newUrl);
        setPet({ ...pet, avatar_url: newUrl });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Успех', 'Фото питомца обновлено!');
      }
    } catch (error) {
      console.error('❌ Error updating photo:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось обновить фото');
    } finally {
      setUploading(false);
    }
  };

  // ═══ DELETE PET ══════════════════════════════
  const handleDelete = () => {
    Alert.alert(
      'Удалить питомца?',
      `Вы уверены, что хотите удалить ${pet?.name}? Питомец будет скрыт.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(petId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } catch {
              Alert.alert('Ошибка', 'Не удалось удалить питомца');
            }
          },
        },
      ]
    );
  };

  // ═══ HELPERS ══════════════════════════════════
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Неизвестно';
    const today = new Date();
    const birth = new Date(birthDate);
    const years  = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth()    - birth.getMonth();

    if (years === 0)  return `${Math.max(months, 1)} мес.`;
    if (months < 0)   return `${years - 1} ${pluralYears(years - 1)}`;
    return `${years} ${pluralYears(years)}`;
  };

  const pluralYears = (n) =>
    n === 1 ? 'год' : n < 5 ? 'года' : 'лет';

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short',
    });
  };

  const daysUntil = (dateString) => {
    const diffDays = Math.ceil(
      (new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays < 7)  return `Через ${diffDays} дн.`;
    if (diffDays < 30) return `Через ${Math.floor(diffDays / 7)} нед.`;
    return `Через ${Math.floor(diffDays / 30)} мес.`;
  };

  // ═══ LOADING GUARDS ══════════════════════════
  if (!petId || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Питомец не найден</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const chartData  = getChartData();
  const trend      = getWeightTrend();
  const trendColor =
    trend?.type === 'up' ? '#FF6B6B' :
    trend?.type === 'down' ? '#51CF66' : '#6C63FF';
  const trendIcon =
    trend?.type === 'up' ? 'trending-up' :
    trend?.type === 'down' ? 'trending-down' : 'remove';

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6C63FF"
          />
        }
      >
        {/* ─── HEADER ───────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{pet.name}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── PHOTO SECTION ────────────────── */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleUpdatePhoto}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : (
              <>
                <Image
                  source={{
                    uri:
                      pet.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(pet.name)}&size=400&background=6C63FF&color=fff`,
                  }}
                  style={styles.avatar}
                />
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>{pet.breed || pet.species}</Text>
          <Text style={styles.petMeta}>
            {calculateAge(pet.birth_date)}
            {pet.weight ? ` • ${pet.weight} ${pet.weight_unit || 'кг'}` : ''}
          </Text>
        </View>

        {/* ─── ⚠️ ALLERGY ALERT (safety-critical, над плитками) ─── */}
        {allergies.length > 0 && (
          <View style={styles.allergyBanner}>
            <Ionicons name="warning" size={22} color="#EF4444" />
            <View style={styles.allergyBannerText}>
              <Text style={styles.allergyBannerTitle}>Аллергии</Text>
              <Text style={styles.allergyBannerList}>
                {allergies.map((a) => a.substance).filter(Boolean).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* ─── QUICK STATS ──────────────────── */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="medkit-outline" size={28} color="#FF6B6B" />
            <Text style={styles.statValue}>{stats.vaccinations}</Text>
            <Text style={styles.statLabel}>Прививки</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={28} color="#4ECDC4" />
            <Text style={styles.statValue}>{stats.medicalRecords}</Text>
            <Text style={styles.statLabel}>Записи</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={28} color="#6C63FF" />
            <Text style={styles.statValue}>
              {stats.daysSinceLastVisit !== null ? stats.daysSinceLastVisit : '—'}
            </Text>
            <Text style={styles.statLabel}>Дней назад</Text>
          </View>
        </View>

        {/* ─── WEIGHT DYNAMICS ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚖️ Динамика веса</Text>
            <TouchableOpacity
              style={styles.addWeightBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setWeightModalVisible(true);
              }}
            >
              <Ionicons name="add" size={18} color="#6C63FF" />
              <Text style={styles.addWeightBtnText}>Добавить</Text>
            </TouchableOpacity>
          </View>

          {weightLoading ? (
            <View style={styles.weightLoadingBox}>
              <ActivityIndicator color="#6C63FF" />
            </View>
          ) : weightHistory.length === 0 ? (
            /* ── Empty weight ─────────────── */
            <View style={styles.emptyCard}>
              <Ionicons name="scale-outline" size={32} color="#E0E0E0" />
              <Text style={styles.emptyText}>Нет данных о весе</Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setWeightModalVisible(true)}
              >
                <Text style={styles.emptyAddBtnText}>+ Добавить первый вес</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.weightCard}>
              {/* Current weight + trend */}
              <View style={styles.weightTopRow}>
                <View>
                  <Text style={styles.weightCurrentLabel}>Текущий вес</Text>
                  <Text style={styles.weightCurrentValue}>
                    {weightHistory[0].weight}{' '}
                    <Text style={styles.weightUnit}>
                      {weightHistory[0].weight_unit || 'кг'}
                    </Text>
                  </Text>
                </View>

                {trend && (
                  <View style={[styles.trendBadge, { backgroundColor: trendColor + '18' }]}>
                    <Ionicons name={trendIcon} size={16} color={trendColor} />
                    <Text style={[styles.trendText, { color: trendColor }]}>
                      {trend.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Chart (если >= 2 записей) */}
              {chartData && (
                <View style={styles.chartWrapper}>
                  <LineChart
                    data={chartData}
                    width={SCREEN_WIDTH - 80}
                    height={160}
                    chartConfig={{
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo:   '#fff',
                      color: (opacity = 1) => `rgba(108,99,255,${opacity})`,
                      labelColor: () => '#888',
                      strokeWidth: 2,
                      decimalPlaces: 1,
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#6C63FF',
                      },
                    }}
                    bezier
                    withShadow={false}
                    withInnerLines={false}
                    withOuterLines={false}
                    style={styles.chart}
                  />
                </View>
              )}

              {/* History list (последние 5) */}
              <View style={styles.weightHistoryList}>
                <Text style={styles.weightHistoryTitle}>История измерений</Text>
                {weightHistory.slice(0, 5).map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.weightHistoryRow,
                      index === weightHistory.slice(0, 5).length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.weightHistoryLeft}>
                      <View style={styles.weightHistoryDot} />
                      <View>
                        <Text style={styles.weightHistoryValue}>
                          {item.weight} {item.weight_unit || 'кг'}
                        </Text>
                        {item.notes ? (
                          <Text style={styles.weightHistoryNote} numberOfLines={1}>
                            {item.notes}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.weightHistoryDate}>
                      {formatShortDate(item.measured_at)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* ─── 🤧 ALLERGIES (паспорт) ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤧 Аллергии</Text>
            <TouchableOpacity style={styles.addWeightBtn} onPress={openAddAllergy}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addWeightBtnText}>Добавить</Text>
            </TouchableOpacity>
          </View>
          {allergies.length === 0 ? (
            <Text style={styles.emptyText}>Нет данных об аллергиях</Text>
          ) : (
            allergies.map((a) => {
              const parts = [];
              if (a.reaction) parts.push(a.reaction);
              if (a.severity) parts.push(a.severity);
              if (a.noted_on) parts.push(formatDate(a.noted_on));
              return (
                <View key={a.id} style={styles.passportRow}>
                  <View style={styles.passportHeadRow}>
                    <Text style={styles.passportName}>{a.substance}</Text>
                    <View style={styles.passportActions}>
                      <TouchableOpacity onPress={() => openEditAllergy(a)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="create-outline" size={18} color="#6B4EFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteAllergy(a)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {parts.length > 0 && (
                    <Text style={styles.passportSub}>{parts.join(' · ')}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ─── 🩺 CHRONIC CONDITIONS ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🩺 Хронические заболевания</Text>
            <TouchableOpacity style={styles.addWeightBtn} onPress={openAddCondition}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addWeightBtnText}>Добавить</Text>
            </TouchableOpacity>
          </View>
          {conditions.length === 0 ? (
            <Text style={styles.emptyText}>Нет хронических заболеваний</Text>
          ) : (
            conditions.map((c) => {
              const sub = [];
              if (c.since_date) sub.push(`С ${formatDate(c.since_date)}`);
              if (c.notes) sub.push(c.notes);
              return (
                <View key={c.id} style={styles.passportRow}>
                  <View style={styles.passportHeadRow}>
                    <Text style={styles.passportName}>
                      {c.condition}{c.code ? ` (${c.code})` : ''}
                    </Text>
                    <View style={styles.passportHeadRight}>
                      <View style={[styles.condBadge, c.active ? styles.condBadgeActive : styles.condBadgeRemission]}>
                        <Text style={[styles.condBadgeText, c.active ? styles.condBadgeTextActive : styles.condBadgeTextRemission]}>
                          {c.active ? 'Активно' : 'В ремиссии'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => openEditCondition(c)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="create-outline" size={18} color="#6B4EFF" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteCondition(c)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {sub.length > 0 && (
                    <Text style={styles.passportSub}>{sub.join(' · ')}</Text>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ─── UPCOMING EVENTS ──────────────── */}
        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Ближайшие события</Text>
            {upcomingEvents.map((event, index) => (
              <View key={index} style={styles.eventCard}>
                <View style={[styles.eventIconWrap, { backgroundColor: event.color + '20' }]}>
                  <Ionicons name={event.icon} size={20} color={event.color} />
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{formatShortDate(event.date)}</Text>
                </View>
                <Text style={styles.eventBadge}>{daysUntil(event.date)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ─── RECENT MEDICAL RECORDS ───────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏥 Медицинские записи</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Medical');
              }}
            >
              <Text style={styles.seeAll}>Все →</Text>
            </TouchableOpacity>
          </View>

          {recentRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-outline" size={32} color="#E0E0E0" />
              <Text style={styles.emptyText}>Нет медицинских записей</Text>
            </View>
          ) : (
            recentRecords.map((record, index) => (
              <View key={index} style={styles.recordCard}>
                <View style={[styles.recordIconWrap, { backgroundColor: record.color + '20' }]}>
                  <Ionicons name={record.icon} size={20} color={record.color} />
                </View>
                <View style={styles.recordContent}>
                  <Text style={styles.recordTitle}>{record.title}</Text>
                  <Text style={styles.recordDate}>{formatShortDate(record.date)}</Text>
                  {record.description ? (
                    <Text style={styles.recordDescription} numberOfLines={1}>
                      {record.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ─── QUICK ACTIONS ────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Быстрые действия</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F3F0FF' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Assistant', {
                  screen:  'AIAssistantChat',
                  params: { petId: pet.id, petName: pet.name },
                });
              }}
            >
              <Ionicons name="scan-outline" size={28} color="#6C63FF" />
              <Text style={styles.actionText}>AI Анализ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#E8F4FD' }]}
              onPress={() => navigation.navigate('Medical')}
            >
              <Ionicons name="document-text-outline" size={28} color="#4ECDC4" />
              <Text style={styles.actionText}>Записи</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FFE8E8' }]}
              onPress={() => navigation.navigate('Medical')}
            >
              <Ionicons name="medkit-outline" size={28} color="#FF6B6B" />
              <Text style={styles.actionText}>Прививки</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#E8FFE8' }]}
              onPress={() => navigation.navigate('Activity')}
            >
              <Ionicons name="fitness-outline" size={28} color="#51CF66" />
              <Text style={styles.actionText}>Активность</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── INFO SECTION ─────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Информация</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar-outline"
              label="Дата рождения"
              value={pet.birth_date ? formatDate(pet.birth_date) : '—'}
            />
            <InfoRow
              icon={pet.gender === 'male' ? 'male-outline' : 'female-outline'}
              label="Пол"
              value={
                pet.gender === 'male'   ? 'Кобель / Кот' :
                pet.gender === 'female' ? 'Сука / Кошка'  : '—'
              }
            />
            {pet.microchip_id && (
              <InfoRow
                icon="barcode-outline"
                label="Микрочип"
                value={pet.microchip_id}
              />
            )}
            <InfoRow
              icon="medkit-outline"
              label="Кастрирован"
              value={pet.is_neutered ? 'Да' : 'Нет'}
              isLast
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* ══════════════════════════════════════════
          WEIGHT MODAL
      ══════════════════════════════════════════ */}
      <Modal
        visible={weightModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Добавить вес</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setWeightModalVisible(false);
                  setNewWeight('');
                  setWeightNote('');
                }}
              >
                <Ionicons name="close" size={22} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Pet name hint */}
            <Text style={styles.modalSubtitle}>{pet.name}</Text>

            {/* Weight input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Вес</Text>
              <View style={styles.modalInputRow}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.0"
                  placeholderTextColor="#C0C0C0"
                  keyboardType="decimal-pad"
                  value={newWeight}
                  onChangeText={setNewWeight}
                  autoFocus
                />
                <View style={styles.modalUnitBadge}>
                  <Text style={styles.modalUnitText}>
                    {pet.weight_unit || 'кг'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Note input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Заметка (необязательно)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputNote]}
                placeholder="Например: после стрижки"
                placeholderTextColor="#C0C0C0"
                value={weightNote}
                onChangeText={setWeightNote}
                multiline
                maxLength={120}
              />
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.modalSaveBtn, savingWeight && styles.modalSaveBtnDisabled]}
              onPress={handleSaveWeight}
              disabled={savingWeight}
            >
              {savingWeight ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════ ALLERGY MODAL ══════ */}
      <Modal visible={allergyModal} animationType="slide" transparent onRequestClose={() => setAllergyModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editAllergy ? 'Изменить аллергию' : 'Добавить аллергию'}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAllergyModal(false)}>
                <Ionicons name="close" size={22} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Вещество (аллерген) *</Text>
              <TextInput style={styles.modalInput} placeholder="Напр.: курица, амоксициллин" placeholderTextColor="#C0C0C0" value={aSubstance} onChangeText={setASubstance} />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Реакция</Text>
              <TextInput style={styles.modalInput} placeholder="Напр.: зуд, отёк" placeholderTextColor="#C0C0C0" value={aReaction} onChangeText={setAReaction} />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Тяжесть</Text>
              <View style={styles.sevRow}>
                {SEVERITY_OPTIONS.map((opt) => {
                  const active = aSeverity === opt.value;
                  return (
                    <TouchableOpacity key={String(opt.value)} style={[styles.sevChip, active && styles.sevChipActive]} onPress={() => setASeverity(opt.value)}>
                      <Text style={[styles.sevChipText, active && styles.sevChipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <PassportDateField label="Дата выявления" value={aNotedOn} onChange={setANotedOn} />

            <TouchableOpacity style={[styles.modalSaveBtn, savingAllergy && styles.modalSaveBtnDisabled]} onPress={saveAllergy} disabled={savingAllergy}>
              {savingAllergy ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveBtnText}>Сохранить</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════ CONDITION MODAL ══════ */}
      <Modal visible={condModal} animationType="slide" transparent onRequestClose={() => setCondModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editCondition ? 'Изменить заболевание' : 'Добавить заболевание'}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCondModal(false)}>
                <Ionicons name="close" size={22} color="#888" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Заболевание *</Text>
              <TextInput style={styles.modalInput} placeholder="Напр.: атопический дерматит" placeholderTextColor="#C0C0C0" value={cCondition} onChangeText={setCCondition} />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Код (МКБ/прочее)</Text>
              <TextInput style={styles.modalInput} placeholder="Напр.: L20" placeholderTextColor="#C0C0C0" value={cCode} onChangeText={setCCode} />
            </View>

            <PassportDateField label="С какого времени" value={cSince} onChange={setCSince} />

            <View style={styles.toggleRow}>
              <Text style={styles.modalInputLabel}>Активно</Text>
              <Switch value={cActive} onValueChange={setCActive} trackColor={{ true: '#6B4EFF', false: '#D1D5DB' }} thumbColor="#fff" />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Заметки</Text>
              <TextInput style={[styles.modalInput, styles.modalInputNote]} placeholder="Доп. информация" placeholderTextColor="#C0C0C0" value={cNotes} onChangeText={setCNotes} multiline maxLength={300} />
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, savingCondition && styles.modalSaveBtnDisabled]} onPress={saveCondition} disabled={savingCondition}>
              {savingCondition ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveBtnText}>Сохранить</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ══════════════════════════════════════════════════
// INFO ROW COMPONENT
// ══════════════════════════════════════════════════
function InfoRow({ icon, label, value, isLast }) {
  return (
    <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#6C63FF" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    gap: 16,
  },
  notFoundText: { fontSize: 16, color: '#888' },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F0FF',
    borderRadius: 10,
  },
  backBtnText: { color: '#6C63FF', fontWeight: '600' },

  // ─── Header ───────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center', alignItems: 'center',
  },
  deleteButton: { backgroundColor: '#FFE8E8' },

  // ─── Photo section ────────────────────────────
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 4, borderColor: '#6C63FF',
  },
  uploadingOverlay: {
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(108,99,255,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 18, width: 36, height: 36,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  petName: { fontSize: 26, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 4 },
  petBreed: { fontSize: 15, color: '#666', marginBottom: 6 },
  petMeta:  { fontSize: 13, color: '#888' },

  // ─── Stats ────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#1A1A2E' },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },

  // ─── Sections ─────────────────────────────────
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 12,
  },
  seeAll: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },

  // ─── Weight ───────────────────────────────────
  addWeightBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
  },
  addWeightBtnText: { fontSize: 13, color: '#6C63FF', fontWeight: '600' },

  weightLoadingBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center',
  },
  weightCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  weightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  weightCurrentLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  weightCurrentValue: { fontSize: 28, fontWeight: 'bold', color: '#1A1A2E' },
  weightUnit:         { fontSize: 16, color: '#888', fontWeight: '400' },
  trendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  trendText: { fontSize: 13, fontWeight: '700' },

  chartWrapper: { paddingHorizontal: 12, paddingVertical: 4 },
  chart: { borderRadius: 10 },

  weightHistoryList: {
    borderTopWidth: 1, borderTopColor: '#F5F5F5',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  weightHistoryTitle: {
    fontSize: 12, fontWeight: '600', color: '#888',
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  weightHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  weightHistoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weightHistoryDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#6C63FF',
  },
  weightHistoryValue: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  weightHistoryNote:  { fontSize: 11, color: '#888', marginTop: 1 },
  weightHistoryDate:  { fontSize: 12, color: '#888' },

  emptyAddBtn: {
    marginTop: 10,
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  emptyAddBtnText: { color: '#6C63FF', fontWeight: '600', fontSize: 13 },

  // ─── Events ───────────────────────────────────
  eventCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 14,
    borderRadius: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  eventIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  eventContent: { flex: 1 },
  eventTitle:   { fontSize: 14, fontWeight: '600', color: '#1A1A2E', marginBottom: 3 },
  eventDate:    { fontSize: 12, color: '#888' },
  eventBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, fontSize: 11, fontWeight: '600', color: '#6C63FF',
  },

  // ─── Records ──────────────────────────────────
  recordCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 14,
    borderRadius: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  recordIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  recordContent: { flex: 1 },
  recordTitle:   { fontSize: 14, fontWeight: '600', color: '#1A1A2E', marginBottom: 3 },
  recordDate:    { fontSize: 12, color: '#888', marginBottom: 2 },
  recordDescription: { fontSize: 12, color: '#666' },

  // ─── Empty card ───────────────────────────────
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 14, color: '#B0B0B0' },
  allergyBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 16, padding: 14, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#EF4444', borderRadius: 12 },
  allergyBannerText: { flex: 1 },
  allergyBannerTitle: { fontSize: 14, fontWeight: '700', color: '#B91C1C' },
  allergyBannerList: { fontSize: 13, color: '#B91C1C', marginTop: 2 },
  passportRow: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#F0F0F5' },
  passportHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  passportName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', flexShrink: 1 },
  passportSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  condBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  condBadgeActive: { backgroundColor: '#FEE2E2' },
  condBadgeRemission: { backgroundColor: '#E5E7EB' },
  condBadgeText: { fontSize: 11, fontWeight: '700' },
  condBadgeTextActive: { color: '#B91C1C' },
  condBadgeTextRemission: { color: '#6B7280' },
  passportActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  passportHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passportDateField: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passportDateText: { flex: 1, fontSize: 15, color: '#1A1A2E' },
  sevRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sevChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  sevChipActive: { backgroundColor: '#6B4EFF', borderColor: '#6B4EFF' },
  sevChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  sevChipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },

  // ─── Actions ──────────────────────────────────
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: {
    width: '47%', aspectRatio: 1.6, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },

  // ─── Info ─────────────────────────────────────
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  infoIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 12, color: '#888', marginBottom: 2 },
  infoValue:   { fontSize: 14, fontWeight: '500', color: '#1A1A2E' },

  // ─── Modal ────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle:   { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  modalSubtitle: { fontSize: 14, color: '#888', marginBottom: 24 },

  modalInputGroup: { marginBottom: 16 },
  modalInputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  modalInputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalInput: {
    flex: 1,
    backgroundColor: '#F8F9FA', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontWeight: '600', color: '#1A1A2E',
    borderWidth: 1.5, borderColor: '#EBEBEB',
  },
  modalInputNote: {
    fontSize: 14, fontWeight: '400',
    height: 80, textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalUnitBadge: {
    backgroundColor: '#F3F0FF', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  modalUnitText: { fontSize: 16, fontWeight: '700', color: '#6C63FF' },

  modalSaveBtn: {
    backgroundColor: '#6C63FF', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  modalSaveBtnDisabled: { opacity: 0.6 },
  modalSaveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  bottomPadding: { height: 40 },
});
