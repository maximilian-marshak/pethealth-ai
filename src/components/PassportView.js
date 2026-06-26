// ══════════════════════════════════════════════════
// src/components/PassportView.js
// Passport-подмножество PetDetail, вынесенное в переиспользуемый компонент
// (используется в PetDetailScreen-обёртке и — позже, M2 — в MedicalHub-сегменте).
// Самодостаточен: self-fetch passport-данных по pet.id, владеет 4 модалками.
//
// API: { pet, refreshSignal, renderStatsSlot, renderOverviewSlot }
//  • pet            — объект питомца (оба места использования его имеют).
//  • refreshSignal  — счётчик от pull-to-refresh обёртки → ре-фетч passport.
//  • renderStatsSlot    — вставляется между allergy-alert и weight (в PetDetail = QuickStats).
//  • renderOverviewSlot — вставляется между chronic и info (в PetDetail = events/records/quick-actions).
//
// Порядок секций (1:1 с прежним PetDetail):
//   hero → allergy-alert → {renderStatsSlot} → weight → blood → allergies → chronic →
//   {renderOverviewSlot} → info  (+ 4 модалки порталом).
// ══════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
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
import { useUnits } from '../hooks/useUnits';
import { formatWeight, formatWeightValue, unitLabel, convertWeight } from '../utils/formatWeight';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { pickAndUpload } from '../services/imageUploadService';
import IconChip from './IconChip';
import { useTheme } from '../theme/ThemeProvider';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Тяжесть аллергии: хранится mild/moderate/severe или null (CHECK в БД).
// Подпись локализуется в месте отрисовки через t('detail.severity.<key>').
const SEVERITY_OPTIONS = [
  { value: null,       key: 'none' },
  { value: 'mild',     key: 'mild' },
  { value: 'moderate', key: 'moderate' },
  { value: 'severe',   key: 'severe' },
];

// Severity → семантика уровня (Лёгкая→ok, Средняя→warn, Тяжёлая→danger, «—»→t3).
const severityColorFor = (theme, value) =>
  value === 'severe' ? theme.danger : value === 'moderate' ? theme.warn : value === 'mild' ? theme.ok : theme.t3;

// Поле даты для модалок паспорта: хранит YYYY-MM-DD, показывает DD.MM.YYYY.
const PassportDateField = ({ label, value, onChange }) => {
  const { t } = useTranslation('pets');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
  const display = value ? `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}` : t('detail.pickDate');
  return (
    <View style={styles.modalInputGroup}>
      <Text style={styles.modalInputLabel}>{label}</Text>
      <View style={styles.modalInputRow}>
        <TouchableOpacity style={[styles.modalInput, styles.passportDateField]} onPress={() => setShow(true)} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={18} color={value ? theme.accent : theme.t4} />
          <Text style={[styles.passportDateText, !value && { color: theme.t4 }]}>{display}</Text>
          {value ? (
            <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={theme.t4} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>
      {show && (
        <DateTimePicker value={dateVal} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handle} />
      )}
    </View>
  );
};

// ══════════════════════════════════════════════════
// PASSPORT VIEW
// ══════════════════════════════════════════════════
export default function PassportView({ pet: petProp, refreshSignal, renderStatsSlot = null, renderOverviewSlot = null }) {
  const { updatePetPhoto } = usePets();
  const { unit } = useUnits();
  const { t, i18n } = useTranslation('pets');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Питомец приходит пропсом; локальная копия — для оптимистичных правок (фото/вес/паспорт).
  const [pet, setPet] = useState(petProp);
  useEffect(() => { setPet(petProp); }, [petProp]);
  const petId = petProp?.id;

  const [uploading, setUploading] = useState(false);

  // ─── Passport-данные (self-fetch) ─────────────
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);

  // ─── Weight state ─────────────────────────────
  const [weightHistory, setWeightHistory]     = useState([]);
  const [weightLoading, setWeightLoading]     = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [newWeight, setNewWeight]             = useState('');
  const [weightNote, setWeightNote]           = useState('');
  const [savingWeight, setSavingWeight]       = useState(false);

  // ─── Allergies / conditions modal state ───────
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

  // ─── Passport (blood_type / pet_context) ──────
  const [passportModal, setPassportModal] = useState(false);
  const [pBlood, setPBlood]               = useState('');
  const [pContext, setPContext]           = useState('');
  const [savingPassport, setSavingPassport] = useState(false);

  // ═══ LOAD / REFRESH ══════════════════════════
  useEffect(() => {
    if (!petId) return;
    loadWeightHistory();
    loadAllergies();
    loadConditions();
  }, [petId, refreshSignal]);

  const openPassportEdit = () => {
    setPBlood(pet?.blood_type || '');
    setPContext(pet?.pet_context || '');
    setPassportModal(true);
  };

  const savePassport = async () => {
    setSavingPassport(true);
    try {
      const blood_type = pBlood.trim() || null;
      const pet_context = pContext.trim() || null;
      const { error } = await supabase.from('pets').update({ blood_type, pet_context }).eq('id', petId);
      if (error) throw error;
      setPet((prev) => (prev ? { ...prev, blood_type, pet_context } : prev));
      setPassportModal(false);
    } catch (e) {
      Alert.alert(t('passport.editTitle'), e.message);
    } finally {
      setSavingPassport(false);
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
      Alert.alert(t('common:error'), t('detail.weight.invalid'));
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
      Alert.alert(t('common:error'), t('detail.weight.saveError'));
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
    if (!aSubstance.trim()) { Alert.alert(t('common:error'), t('detail.allergy.substanceRequired')); return; }
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
      Alert.alert(t('common:error'), e.message);
    } finally {
      setSavingAllergy(false);
    }
  };
  const deleteAllergy = (row) => {
    Alert.alert(t('alerts.deleteAllergy.title'), t('alerts.deleteAllergy.message', { name: row.substance }), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('common:delete'), style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('pet_allergies').delete().eq('id', row.id);
          if (error) throw error;
          await loadAllergies();
        } catch (e) { Alert.alert(t('common:error'), e.message); }
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
    if (!cCondition.trim()) { Alert.alert(t('common:error'), t('detail.condition.nameRequired')); return; }
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
      Alert.alert(t('common:error'), e.message);
    } finally {
      setSavingCondition(false);
    }
  };
  const deleteCondition = (row) => {
    Alert.alert(t('alerts.deleteCondition.title'), t('alerts.deleteCondition.message', { name: row.condition }), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('common:delete'), style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('pet_conditions').delete().eq('id', row.id);
          if (error) throw error;
          await loadConditions();
        } catch (e) { Alert.alert(t('common:error'), e.message); }
      } },
    ]);
  };

  // ─── Weight chart data ────────────────────
  const getChartData = () => {
    // Берём последние 8, переворачиваем в хронологический порядок
    const sorted = [...weightHistory].reverse().slice(-8);
    // Оставляем только записи с числовым весом (numeric из БД может прийти строкой,
    // встречаются null) — иначе LineChart получит NaN. Метки берём из того же
    // отфильтрованного массива, чтобы длины совпадали.
    const valid = sorted.filter((w) => Number.isFinite(Number(w.weight)));
    if (valid.length < 2) return null;

    const points = valid.map((w) => convertWeight(Number(w.weight), unit));
    // Вырожденный случай: все значения равны (max === min) → диапазон 0 → деление
    // на ноль в chart-kit. Не рисуем график (карточка веса остаётся без графика).
    if (Math.min(...points) === Math.max(...points)) return null;

    const labels = valid.map((w) => {
      const d = new Date(w.measured_at);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const datasets = [{ data: points }];

    return { labels, datasets };
  };

  // ─── Weight trend ─────────────────────────
  const getWeightTrend = () => {
    if (weightHistory.length < 2) return null;
    const latest = weightHistory[0].weight;
    const prev   = weightHistory[1].weight;
    const diff   = latest - prev;

    if (Math.abs(diff) < 0.05) return { type: 'stable', diff: 0 };
    if (diff > 0)               return { type: 'up',     diff };
    return                              { type: 'down',   diff };
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
        Alert.alert(t('common:success'), t('detail.alerts.photoSuccess'));
      }
    } catch (error) {
      console.error('❌ Error updating photo:', error);
      Alert.alert(t('common:error'), error.message || t('detail.alerts.photoError'));
    } finally {
      setUploading(false);
    }
  };

  // ═══ HELPERS ══════════════════════════════════
  const calculateAge = (birthDate) => {
    if (!birthDate) return t('detail.age.unknown');
    const today = new Date();
    const birth = new Date(birthDate);
    const years  = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth()    - birth.getMonth();

    if (years === 0)  return t('detail.age.months', { count: Math.max(months, 1) });
    if (months < 0)   return t('detail.age.years', { count: years - 1 });
    return t('detail.age.years', { count: years });
  };

  // Пол с учётом вида: для собак кобель/сука, для кошек кот/кошка, иначе самец/самка.
  // В EN все формы сводятся к Male/Female (видовой нюанс только в RU).
  const genderLabel = () => {
    if (pet?.gender !== 'male' && pet?.gender !== 'female') return '—';
    const sp = pet?.species === 'dog' ? 'dog' : pet?.species === 'cat' ? 'cat' : 'generic';
    return t(`detail.info.genderValue.${sp}.${pet.gender}`);
  };

  // Локаль для toLocaleDateString — по языку приложения (а не хардкод ru-RU).
  const dateLocale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(dateLocale, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(dateLocale, {
      day: 'numeric', month: 'short',
    });
  };

  if (!pet) return null;

  const chartData  = getChartData();
  const trend      = getWeightTrend();
  const trendColor = theme.t3;
  const trendIcon =
    trend?.type === 'up' ? 'trending-up' :
    trend?.type === 'down' ? 'trending-down' : 'remove';
  // Подпись тренда: «Стабильно» либо «±X <ед.>» в единицах пользователя.
  let trendText = '';
  if (trend) {
    if (trend.type === 'stable') {
      trendText = t('detail.weight.trend.stable');
    } else {
      const conv = convertWeight(trend.diff, unit) || 0;
      const value = (conv > 0 ? '+' : '') + (Math.round(conv * 10) / 10);
      trendText = t('detail.weight.trend.delta', { value, unit: unitLabel(unit) });
    }
  }

  return (
    <>
      {/* ─── HERO (эталонный ряд): аватар 72 (тап=upload) + имя/порода + Изменить ─── */}
      <View style={styles.heroCard}>
        <TouchableOpacity onPress={handleUpdatePhoto} disabled={uploading} style={styles.heroAvatarWrap} activeOpacity={0.8}>
          {uploading ? (
            <View style={styles.heroAvatar}><ActivityIndicator color={theme.onAccent} /></View>
          ) : (
            <>
              <Image
                source={{
                  uri:
                    pet.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(pet.name)}&size=400&background=56B89F&color=fff`,
                }}
                style={styles.heroAvatar}
              />
              <View style={styles.heroCamera}>
                <Ionicons name="camera" size={12} color={theme.onAccent} />
              </View>
            </>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.heroName} numberOfLines={1}>{pet.name}</Text>
          <Text style={styles.heroBreed} numberOfLines={1}>
            {[pet.breed || pet.species, calculateAge(pet.birth_date), pet.weight ? formatWeight(pet.weight, unit) : null].filter(Boolean).join(' · ')}
          </Text>
          <View style={styles.heroBtns}>
            <TouchableOpacity style={styles.heroBtnTint} onPress={openPassportEdit} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={15} color={theme.accentPress} />
              <Text style={styles.heroBtnTintText}>{t('common:edit')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── ⚠️ ALLERGY ALERT (danger-box, эталон): построчно имя + severity-бейдж ─── */}
      {allergies.length > 0 && (
        <View style={styles.allergyBox}>
          <View style={styles.allergyBoxHeader}>
            <Ionicons name="warning" size={19} color={theme.danger} />
            <Text style={styles.allergyBoxTitle}>{t('detail.stats.allergies')}</Text>
          </View>
          <View style={styles.allergyBoxList}>
            {allergies.map((a) => {
              const sevColor = severityColorFor(theme, a.severity);
              return (
                <View key={a.id} style={styles.allergyBoxRow}>
                  <Text style={styles.allergyBoxName} numberOfLines={1}>{a.substance}</Text>
                  {a.severity ? (
                    <View style={[styles.sevBadge, { backgroundColor: sevColor + '1f' }]}>
                      <Text style={[styles.sevBadgeText, { color: sevColor }]}>{t('detail.severity.' + a.severity)}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ─── СЛОТ: QUICK STATS (не-passport, рендерит обёртка) ─── */}
      {renderStatsSlot}

      {/* ─── WEIGHT DYNAMICS ──────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('detail.weight.section')}</Text>
          <TouchableOpacity
            style={styles.addWeightBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setWeightModalVisible(true);
            }}
          >
            <Ionicons name="add" size={18} color={theme.accent} />
            <Text style={styles.addWeightBtnText}>{t('common:add')}</Text>
          </TouchableOpacity>
        </View>

        {weightLoading ? (
          <View style={styles.weightLoadingBox}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : weightHistory.length === 0 ? (
          /* ── Empty weight ─────────────── */
          <View style={styles.emptyCard}>
            <Ionicons name="scale-outline" size={32} color={theme.hairline} />
            <Text style={styles.emptyText}>{t('detail.weight.empty')}</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setWeightModalVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>{t('detail.weight.addFirst')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.weightCard}>
            {/* Current weight + trend */}
            <View style={styles.weightTopRow}>
              <View>
                <Text style={styles.weightCurrentLabel}>{t('detail.weight.current')}</Text>
                <Text style={styles.weightCurrentValue}>
                  {formatWeightValue(weightHistory[0].weight, unit)}{' '}
                  <Text style={styles.weightUnit}>
                    {unitLabel(unit)}
                  </Text>
                </Text>
              </View>

              {trend && (
                <View style={[styles.trendBadge, { backgroundColor: theme.t3 + '22' }]}>
                  <Ionicons name={trendIcon} size={16} color={trendColor} />
                  <Text style={[styles.trendText, { color: trendColor }]}>
                    {trendText}
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
                    backgroundGradientFrom: theme.surface,
                    backgroundGradientTo:   theme.surface,
                    color: () => theme.accent,
                    labelColor: () => theme.t3,
                    strokeWidth: 2,
                    decimalPlaces: 1,
                    propsForDots: {
                      r: '4',
                      strokeWidth: '2',
                      stroke: theme.accent,
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
              <Text style={styles.weightHistoryTitle}>{t('detail.weight.historyTitle')}</Text>
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
                        {formatWeight(item.weight, unit)}
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

      {/* ─── 🪪 PASSPORT (blood type / context) ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🪪 {t('passport.title')}</Text>
          <TouchableOpacity onPress={openPassportEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
        </View>
        <View style={styles.passportRow}>
          <Text style={styles.passportInfoLabel}>{t('passport.bloodType')}</Text>
          <Text style={[styles.passportInfoValue, !pet?.blood_type && styles.passportInfoEmpty]}>
            {pet?.blood_type || t('passport.empty')}
          </Text>
        </View>
        <View style={styles.passportRow}>
          <Text style={styles.passportInfoLabel}>{t('passport.context')}</Text>
          <Text style={[styles.passportInfoValue, !pet?.pet_context && styles.passportInfoEmpty]}>
            {pet?.pet_context || t('passport.empty')}
          </Text>
        </View>
      </View>

      {/* ─── 🤧 ALLERGIES (паспорт) ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('detail.allergy.section')}</Text>
          <TouchableOpacity style={styles.addWeightBtn} onPress={openAddAllergy}>
            <Ionicons name="add" size={18} color={theme.onAccent} />
            <Text style={styles.addWeightBtnText}>{t('common:add')}</Text>
          </TouchableOpacity>
        </View>
        {allergies.length === 0 ? (
          <Text style={styles.emptyText}>{t('detail.allergy.empty')}</Text>
        ) : (
          allergies.map((a) => {
            const parts = [];
            if (a.reaction) parts.push(a.reaction);
            if (a.severity) parts.push(t('detail.severity.' + a.severity));
            if (a.noted_on) parts.push(formatDate(a.noted_on));
            return (
              <View key={a.id} style={styles.passportRow}>
                <View style={styles.passportHeadRow}>
                  <Text style={styles.passportName}>{a.substance}</Text>
                  <View style={styles.passportActions}>
                    <TouchableOpacity onPress={() => openEditAllergy(a)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="create-outline" size={18} color={theme.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteAllergy(a)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
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
          <Text style={styles.sectionTitle}>{t('detail.condition.section')}</Text>
          <TouchableOpacity style={styles.addWeightBtn} onPress={openAddCondition}>
            <Ionicons name="add" size={18} color={theme.onAccent} />
            <Text style={styles.addWeightBtnText}>{t('common:add')}</Text>
          </TouchableOpacity>
        </View>
        {conditions.length === 0 ? (
          <Text style={styles.emptyText}>{t('detail.condition.empty')}</Text>
        ) : (
          conditions.map((c) => {
            const sub = [];
            if (c.since_date) sub.push(t('detail.condition.since', { date: formatDate(c.since_date) }));
            if (c.notes) sub.push(c.notes);
            return (
              <View key={c.id} style={styles.chronicCard}>
                <IconChip name="pulse-outline" size={20} color={theme.accent} />
                <View style={styles.chronicContent}>
                  <Text style={styles.chronicTitle} numberOfLines={1}>
                    {c.condition}{c.code ? ` (${c.code})` : ''}
                  </Text>
                  {sub.length > 0 && (
                    <Text style={styles.chronicSub} numberOfLines={1}>{sub.join(' · ')}</Text>
                  )}
                </View>
                <View style={styles.passportHeadRight}>
                  <View style={[styles.condBadge, c.active ? styles.condBadgeActive : styles.condBadgeRemission]}>
                    <Text style={[styles.condBadgeText, c.active ? styles.condBadgeTextActive : styles.condBadgeTextRemission]}>
                      {c.active ? t('detail.condition.active') : t('detail.condition.remission')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => openEditCondition(c)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="create-outline" size={18} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteCondition(c)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* ─── СЛОТ: events / records / quick-actions (не-passport, рендерит обёртка) ─── */}
      {renderOverviewSlot}

      {/* ─── INFO SECTION ─────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('detail.info.section')}</Text>
        <View style={styles.infoCard}>
          <InfoRow
            icon="calendar-outline"
            label={t('detail.info.birthDate')}
            value={pet.birth_date ? formatDate(pet.birth_date) : '—'}
          />
          <InfoRow
            icon={pet.gender === 'male' ? 'male-outline' : 'female-outline'}
            label={t('detail.info.gender')}
            value={genderLabel()}
          />
          {pet.microchip_id && (
            <InfoRow
              icon="barcode-outline"
              label={t('detail.info.microchip')}
              value={pet.microchip_id}
            />
          )}
          <InfoRow
            icon="medkit-outline"
            label={t('detail.info.neutered')}
            value={pet.is_neutered ? t('common:yes') : t('common:no')}
            isLast
          />
        </View>
      </View>

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
              <Text style={styles.modalTitle}>{t('detail.weight.modal.title')}</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setWeightModalVisible(false);
                  setNewWeight('');
                  setWeightNote('');
                }}
              >
                <Ionicons name="close" size={22} color={theme.t3} />
              </TouchableOpacity>
            </View>

            {/* Pet name hint */}
            <Text style={styles.modalSubtitle}>{pet.name}</Text>

            {/* Weight input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.weight.modal.weightLabel')}</Text>
              <View style={styles.modalInputRow}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.0"
                  placeholderTextColor={theme.t4}
                  keyboardType="decimal-pad"
                  value={newWeight}
                  onChangeText={setNewWeight}
                  autoFocus
                />
                <View style={styles.modalUnitBadge}>
                  <Text style={styles.modalUnitText}>
                    {unitLabel(unit)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Note input */}
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.weight.modal.noteLabel')}</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputNote]}
                placeholder={t('detail.weight.modal.notePlaceholder')}
                placeholderTextColor={theme.t4}
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
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <Text style={styles.modalSaveBtnText}>{t('common:save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════ PASSPORT EDIT MODAL ══════ */}
      <Modal visible={passportModal} animationType="slide" transparent onRequestClose={() => setPassportModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('passport.editTitle')}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPassportModal(false)}>
                <Ionicons name="close" size={22} color={theme.t3} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('passport.bloodType')}</Text>
              <View style={styles.modalInputRow}>
                <TextInput style={styles.modalInput} placeholder={t('passport.bloodTypePlaceholder')} placeholderTextColor={theme.t4} value={pBlood} onChangeText={setPBlood} />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('passport.context')}</Text>
              <TextInput style={[styles.modalInput, styles.modalInputNote]} placeholder={t('passport.contextPlaceholder')} placeholderTextColor={theme.t4} value={pContext} onChangeText={setPContext} multiline />
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, savingPassport && styles.modalSaveBtnDisabled]} onPress={savePassport} disabled={savingPassport}>
              {savingPassport ? <ActivityIndicator color={theme.onAccent} /> : <Text style={styles.modalSaveBtnText}>{t('common:save')}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════ ALLERGY MODAL ══════ */}
      <Modal visible={allergyModal} animationType="slide" transparent onRequestClose={() => setAllergyModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editAllergy ? t('detail.allergy.modal.editTitle') : t('detail.allergy.modal.addTitle')}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAllergyModal(false)}>
                <Ionicons name="close" size={22} color={theme.t3} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.allergy.modal.substanceLabel')}</Text>
              <View style={styles.modalInputRow}>
                <TextInput style={styles.modalInput} placeholder={t('detail.allergy.modal.substancePlaceholder')} placeholderTextColor={theme.t4} value={aSubstance} onChangeText={setASubstance} />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.allergy.modal.reactionLabel')}</Text>
              <View style={styles.modalInputRow}>
                <TextInput style={styles.modalInput} placeholder={t('detail.allergy.modal.reactionPlaceholder')} placeholderTextColor={theme.t4} value={aReaction} onChangeText={setAReaction} />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.allergy.modal.severityLabel')}</Text>
              <View style={styles.sevRow}>
                {SEVERITY_OPTIONS.map((opt) => {
                  const active = aSeverity === opt.value;
                  const sevColor = severityColorFor(theme, opt.value); // уровень → семантика
                  return (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[styles.sevChip, active && { backgroundColor: sevColor + '22', borderColor: sevColor }]}
                      onPress={() => setASeverity(opt.value)}
                    >
                      <Text style={[styles.sevChipText, active && { color: sevColor, fontFamily: theme.font.semibold }]}>{t('detail.severity.' + opt.key)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <PassportDateField label={t('detail.allergy.modal.notedOnLabel')} value={aNotedOn} onChange={setANotedOn} />

            <TouchableOpacity style={[styles.modalSaveBtn, savingAllergy && styles.modalSaveBtnDisabled]} onPress={saveAllergy} disabled={savingAllergy}>
              {savingAllergy ? <ActivityIndicator color={theme.onAccent} /> : <Text style={styles.modalSaveBtnText}>{t('common:save')}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════ CONDITION MODAL ══════ */}
      <Modal visible={condModal} animationType="slide" transparent onRequestClose={() => setCondModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editCondition ? t('detail.condition.modal.editTitle') : t('detail.condition.modal.addTitle')}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCondModal(false)}>
                <Ionicons name="close" size={22} color={theme.t3} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.condition.modal.nameLabel')}</Text>
              <View style={styles.modalInputRow}>
                <TextInput style={styles.modalInput} placeholder={t('detail.condition.modal.namePlaceholder')} placeholderTextColor={theme.t4} value={cCondition} onChangeText={setCCondition} />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.condition.modal.codeLabel')}</Text>
              <View style={styles.modalInputRow}>
                <TextInput style={styles.modalInput} placeholder={t('detail.condition.modal.codePlaceholder')} placeholderTextColor={theme.t4} value={cCode} onChangeText={setCCode} />
              </View>
            </View>

            <PassportDateField label={t('detail.condition.modal.sinceLabel')} value={cSince} onChange={setCSince} />

            <View style={styles.toggleRow}>
              <Text style={styles.modalInputLabel}>{t('detail.condition.active')}</Text>
              <Switch value={cActive} onValueChange={setCActive} trackColor={{ true: theme.accent, false: theme.hairline }} thumbColor={theme.onAccent} />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>{t('detail.condition.modal.notesLabel')}</Text>
              <View style={styles.modalInputRow}>
                <TextInput style={[styles.modalInput, styles.modalInputNote]} placeholder={t('detail.condition.modal.notesPlaceholder')} placeholderTextColor={theme.t4} value={cNotes} onChangeText={setCNotes} multiline maxLength={300} />
              </View>
            </View>

            <TouchableOpacity style={[styles.modalSaveBtn, savingCondition && styles.modalSaveBtnDisabled]} onPress={saveCondition} disabled={savingCondition}>
              {savingCondition ? <ActivityIndicator color={theme.onAccent} /> : <Text style={styles.modalSaveBtnText}>{t('common:save')}</Text>}
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
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={20} color={theme.accent} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════
// STYLES (passport-подмножество + shared: section/sectionHeader/sectionTitle/emptyCard/emptyText)
// ══════════════════════════════════════════════════
const makeStyles = (theme) => StyleSheet.create({
  // ─── Photo section ────────────────────────────
  // ─── Hero (эталонный ряд) ───────────────────
  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: theme.surface, borderRadius: theme.radii.lg24,
    borderWidth: 1, borderColor: theme.hairline, padding: 20,
    marginHorizontal: 20, marginTop: 16, marginBottom: 14, ...theme.shadow,
  },
  heroAvatarWrap: { position: 'relative' },
  heroAvatar: {
    width: 72, height: 72, borderRadius: theme.radii.pill999,
    borderWidth: 2, borderColor: theme.accent, backgroundColor: theme.accentTint,
    justifyContent: 'center', alignItems: 'center',
  },
  heroCamera: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: theme.accentPress, borderRadius: theme.radii.pill999,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: theme.surface,
  },
  heroName: { fontSize: 22, fontFamily: theme.font.bold, color: theme.t1 },
  heroBreed: { fontSize: 14, color: theme.t2, marginTop: 2 },
  heroBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
  heroBtnTint: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: theme.radii.pill999, backgroundColor: theme.accentTint,
  },
  heroBtnTintText: { fontSize: 13, fontFamily: theme.font.semibold, color: theme.accentPress },

  // ─── Sections (shared) ────────────────────────
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 12,
  },

  // ─── Weight ───────────────────────────────────
  addWeightBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.accentTint,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: theme.radii.r20,
  },
  addWeightBtnText: { fontSize: 13, color: theme.accentPress, fontFamily: theme.font.semibold },

  weightLoadingBox: {
    backgroundColor: theme.surface, borderRadius: theme.radii.md16, padding: 32,
    alignItems: 'center',
  },
  weightCard: {
    backgroundColor: theme.surface, borderRadius: theme.radii.md16, overflow: 'hidden',
    shadowColor: theme.shadow.shadowColor, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  weightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  weightCurrentLabel: { fontSize: 12, color: theme.t3, marginBottom: 4 },
  weightCurrentValue: { fontSize: 28, fontFamily: theme.font.bold, color: theme.t1 },
  weightUnit:         { fontSize: 16, color: theme.t3, fontFamily: theme.font.regular },
  trendBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radii.r20,
  },
  trendText: { fontSize: 13, fontFamily: theme.font.bold },

  chartWrapper: { paddingHorizontal: 12, paddingVertical: 4 },
  chart: { borderRadius: theme.radii.r10 },

  weightHistoryList: {
    borderTopWidth: 1, borderTopColor: theme.hairline,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  weightHistoryTitle: {
    fontSize: 12, fontFamily: theme.font.semibold, color: theme.t3,
    marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  weightHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.hairline,
  },
  weightHistoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weightHistoryDot: {
    width: 8, height: 8, borderRadius: theme.radii.xs4,
    backgroundColor: theme.accent,
  },
  weightHistoryValue: { fontSize: 14, fontFamily: theme.font.semibold, color: theme.t1 },
  weightHistoryNote:  { fontSize: 11, color: theme.t3, marginTop: 1 },
  weightHistoryDate:  { fontSize: 12, color: theme.t3 },

  emptyAddBtn: {
    marginTop: 10,
    backgroundColor: theme.accentTint,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: theme.radii.r20,
  },
  emptyAddBtnText: { color: theme.accentPress, fontFamily: theme.font.semibold, fontSize: 13 },

  // ─── Empty card (shared) ──────────────────────
  emptyCard: {
    backgroundColor: theme.surface, borderRadius: theme.radii.r14,
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 14, color: theme.t3 },

  // ─── Allergy alert + passport rows ────────────
  // ─── Аллергии: danger-box (эталон) ──────────
  allergyBox: { marginHorizontal: 20, marginTop: 16, padding: 16, backgroundColor: theme.danger + '14', borderWidth: 1, borderColor: theme.danger + '40', borderRadius: theme.radii.lg24 },
  allergyBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  allergyBoxTitle: { fontSize: 15, fontFamily: theme.font.bold, color: theme.danger },
  allergyBoxList: { gap: 8 },
  allergyBoxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  allergyBoxName: { flexShrink: 1, fontSize: 14.5, fontFamily: theme.font.bold, color: theme.t1 },
  sevBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.pill999 },
  sevBadgeText: { fontSize: 12, fontFamily: theme.font.bold },
  passportRow: { backgroundColor: theme.surface, borderRadius: theme.radii.sm12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: theme.hairline },
  passportHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  passportName: { fontSize: 15, fontFamily: theme.font.bold, color: theme.t1, flexShrink: 1 },
  passportSub: { fontSize: 13, color: theme.t3, marginTop: 4 },
  passportInfoLabel: { fontSize: 12, fontFamily: theme.font.semibold, color: theme.t3 },
  passportInfoValue: { fontSize: 15, color: theme.t1, marginTop: 3 },
  passportInfoEmpty: { color: theme.t4, fontStyle: 'italic' },
  condBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radii.pill999 },
  condBadgeActive: { backgroundColor: theme.warn + '1f' },
  condBadgeRemission: { backgroundColor: theme.hairline },
  condBadgeText: { fontSize: 11.5, fontFamily: theme.font.bold },
  condBadgeTextActive: { color: theme.warn },
  condBadgeTextRemission: { color: theme.t3 },
  // ─── Хроники (эталонная карточка: IconChip + контент + бейдж) ──
  chronicCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.surface, borderRadius: theme.radii.md16, padding: 14, marginTop: 8, borderWidth: 1, borderColor: theme.hairline },
  chronicContent: { flex: 1, minWidth: 0 },
  chronicTitle: { fontSize: 14.5, fontFamily: theme.font.bold, color: theme.t1 },
  chronicSub: { fontSize: 12.5, color: theme.t2, marginTop: 1 },
  passportActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  passportHeadRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passportDateField: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passportDateText: { flex: 1, fontSize: 15, color: theme.t1 },
  sevRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // Базовый чип — нейтраль; активный (семантика уровня) задаётся inline в render.
  sevChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: theme.radii.r18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline },
  sevChipText: { fontSize: 13, color: theme.t3, fontFamily: theme.font.medium },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 },

  // ─── Info ─────────────────────────────────────
  infoCard: {
    backgroundColor: theme.surface, borderRadius: theme.radii.md16, paddingHorizontal: 16,
    shadowColor: theme.shadow.shadowColor, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  // ─── Инфо-ряд (эталон): иконка(accent) + label + value одной строкой ──
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.hairline,
  },
  infoLabel:   { flex: 1, fontSize: 13.5, fontFamily: theme.font.semibold, color: theme.t2 },
  infoValue:   { fontSize: 14, fontFamily: theme.font.bold, color: theme.t1 },

  // ─── Modal ────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)', // theme-neutral scrim
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radii.xl28, borderTopRightRadius: theme.radii.xl28,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle:   { fontSize: 20, fontFamily: theme.font.bold, color: theme.t1 },
  modalCloseBtn: {
    width: 34, height: 34, borderRadius: theme.radii.md16,
    backgroundColor: theme.hairline,
    justifyContent: 'center', alignItems: 'center',
  },
  modalSubtitle: { fontSize: 14, color: theme.t3, marginBottom: 24 },

  modalInputGroup: { marginBottom: 16 },
  modalInputLabel: { fontSize: 13, fontFamily: theme.font.semibold, color: theme.t2, marginBottom: 8 },
  modalInputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalInput: {
    flex: 1,
    backgroundColor: theme.surface, borderRadius: theme.radii.r14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontFamily: theme.font.semibold, color: theme.t1,
    borderWidth: 1.5, borderColor: theme.hairline,
  },
  modalInputNote: {
    fontSize: 14, fontFamily: theme.font.regular,
    height: 80, textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalUnitBadge: {
    backgroundColor: theme.accentTint, borderRadius: theme.radii.sm12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  modalUnitText: { fontSize: 16, fontFamily: theme.font.bold, color: theme.accentPress },

  modalSaveBtn: {
    backgroundColor: theme.accentPress, borderRadius: theme.radii.md16,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  modalSaveBtnDisabled: { opacity: 0.6 },
  modalSaveBtnText: { color: theme.onAccent, fontSize: 16, fontFamily: theme.font.bold },
});
