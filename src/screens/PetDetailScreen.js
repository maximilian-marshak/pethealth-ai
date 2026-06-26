// ══════════════════════════════════════════════════
// src/screens/PetDetailScreen.js
// Тонкая обёртка над <PassportView/> (M1): header(back+delete), Screen+ScrollView+
// RefreshControl, резолв petId→pet, не-passport секции (stats/events/records/
// quick-actions) — передаются в слоты PassportView, чтобы порядок совпал 1:1.
// Passport-контент (hero/вес/аллергии/хроники/инфо + модалки) живёт в PassportView.
// ══════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePets } from '../hooks/usePets';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { useTheme } from '../theme/ThemeProvider';
import Screen from '../components/Screen';
import PassportView from '../components/PassportView';
import IconChip from '../components/IconChip';
import GlassCard from '../components/GlassCard';
import Badge from '../components/ui/Badge';

// Тип события/записи → ключ категориальной палитры theme.eventTypes (единая с Medical).
const EVENT_TYPE_KEY = {
  vaccination:        'vaccine',
  parasite_treatment: 'prescription',
  medication:         'prescription',
  vet_visit:          'appointment',
  grooming:           'reminder',
  checkup:            'record',
  surgery:            'record',
  diagnosis:          'record',
  other:              'record',
};
// Цвет события по типу (категориальная палитра; дефолт — record).
const eventColorFor = (theme, type) => theme.eventTypes[EVENT_TYPE_KEY[type] || 'record'];

// ══════════════════════════════════════════════════
// MAIN SCREEN (обёртка)
// ══════════════════════════════════════════════════
export default function PetDetailScreen({ route, navigation }) {
  const petId = route?.params?.petId;
  const { pets, deletePet } = usePets();
  const { t, i18n } = useTranslation('pets');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // ─── Core state ───────────────────────────────
  const [pet, setPet]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Не-passport секции ───────────────────────
  const [stats, setStats] = useState({
    vaccinations: 0,
    medicalRecords: 0,
    daysSinceLastVisit: null,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [recentRecords, setRecentRecords]   = useState([]);

  // Сигнал на ре-фетч passport-данных в PassportView (pull-to-refresh).
  const [refreshTick, setRefreshTick] = useState(0);

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
    const foundPet = pets.find(p => p.id === petId);
    if (foundPet) {
      setPet(foundPet);
      loadStats();
      loadUpcomingEvents();
      loadRecentRecords();
    }
    setLoading(false);
  }, [petId, pets]);

  const loadNonPassport = async () => {
    await Promise.all([
      loadStats(),
      loadUpcomingEvents(),
      loadRecentRecords(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNonPassport();
    setRefreshTick((x) => x + 1); // → PassportView ре-фетчит passport-данные
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
            });
          }
        });
      }

      if (reminders) {
        const iconMap = {
          vaccination: 'medkit-outline',
          checkup:     'pulse-outline',
          vet_visit:   'business-outline',
          medication:  'medical-outline',
          grooming:    'cut-outline',
        };
        reminders.forEach(r => {
          events.push({
            type:  r.reminder_type,
            title: r.title,
            date:  r.due_date,
            icon:  iconMap[r.reminder_type] || 'calendar-outline',
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
        vaccination:        'medkit-outline',
        parasite_treatment: 'bug-outline',
        checkup:            'pulse-outline',
        surgery:            'cut-outline',
        diagnosis:          'clipboard-outline',
        other:              'document-outline',
      };

      const records = [];

      if (medRecords) {
        medRecords.forEach(r => {
          records.push({
            type:        r.record_type,
            title:       r.title,
            date:        r.date,
            description: r.description || '',
            icon:        typeIconMap[r.record_type] || typeIconMap.other,
          });
        });
      }

      if (vaccinations) {
        vaccinations.forEach(v => {
          records.push({
            type:        'vaccination',
            title:       v.vaccine_name,
            date:        v.date_given,
            description: v.notes || t('detail.events.vaccinationFallback'),
            icon:        'medkit-outline',
          });
        });
      }

      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentRecords(records.slice(0, 4));
    } catch (error) {
      console.error('Error loading recent records:', error);
    }
  };

  // ═══ DELETE PET ══════════════════════════════
  const handleDelete = () => {
    Alert.alert(
      t('detail.alerts.deletePet.title'),
      t('detail.alerts.deletePet.message', { name: pet?.name }),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(petId);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } catch {
              Alert.alert(t('common:error'), t('detail.alerts.deletePet.error'));
            }
          },
        },
      ]
    );
  };

  // ═══ HELPERS (не-passport) ════════════════════
  // Локаль для toLocaleDateString — по языку приложения (а не хардкод ru-RU).
  const dateLocale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';

  const formatShortDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(dateLocale, {
      day: 'numeric', month: 'short',
    });
  };

  const daysUntil = (dateString) => {
    const diffDays = Math.ceil(
      (new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 0) return t('detail.relative.today');
    if (diffDays === 1) return t('detail.relative.tomorrow');
    if (diffDays < 7)  return t('detail.relative.inDays', { count: diffDays });
    if (diffDays < 30) return t('detail.relative.inWeeks', { count: Math.floor(diffDays / 7) });
    return t('detail.relative.inMonths', { count: Math.floor(diffDays / 30) });
  };

  // ═══ LOADING GUARDS ══════════════════════════
  if (!petId || loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </Screen>
    );
  }

  if (!pet) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Text style={styles.notFoundText}>{t('detail.notFound')}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← {t('common:back')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  // ─── Слот: QUICK STATS (между alert и weight) ─────────
  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <IconChip name="medkit-outline" color={theme.accent} size={22} />
        <Text style={styles.statValue}>{stats.vaccinations}</Text>
        <Text style={styles.statLabel}>{t('detail.stats.vaccinations')}</Text>
      </View>
      <View style={styles.statCard}>
        <IconChip name="document-text-outline" color={theme.accent} size={22} />
        <Text style={styles.statValue}>{stats.medicalRecords}</Text>
        <Text style={styles.statLabel}>{t('detail.stats.records')}</Text>
      </View>
      <View style={styles.statCard}>
        <IconChip name="calendar-outline" color={theme.accent} size={22} />
        <Text style={styles.statValue}>
          {stats.daysSinceLastVisit !== null ? stats.daysSinceLastVisit : '—'}
        </Text>
        <Text style={styles.statLabel}>{t('detail.stats.daysAgo')}</Text>
      </View>
    </View>
  );

  // ─── Слот: events / records / quick-actions (между chronic и info) ─────────
  const renderOverview = () => (
    <>
      {/* ─── UPCOMING EVENTS — ряды в одной GlassCard ──────────────── */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.events.section')}</Text>
          <GlassCard variant="data" radius={theme.radii.r20} padding={0}>
            {upcomingEvents.map((event, index) => {
              const evColor = eventColorFor(theme, event.type);
              const last = index === upcomingEvents.length - 1;
              return (
                <View key={index} style={[styles.listRow, !last && styles.listRowDivider]}>
                  <IconChip name={event.icon} color={evColor} size={18} />
                  <View style={styles.listText}>
                    <Text style={styles.listTitle} numberOfLines={1}>{event.title}</Text>
                    <Text style={styles.listDate}>{formatShortDate(event.date)}</Text>
                  </View>
                  <Badge tone="accent">{daysUntil(event.date)}</Badge>
                </View>
              );
            })}
          </GlassCard>
        </View>
      )}

      {/* ─── RECENT MEDICAL RECORDS — ряды в одной GlassCard ───────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('detail.records.section')}</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Medical');
            }}
          >
            <Text style={styles.seeAll}>{t('detail.records.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-outline" size={32} color={theme.hairline} />
            <Text style={styles.emptyText}>{t('detail.records.empty')}</Text>
          </View>
        ) : (
          <GlassCard variant="data" radius={theme.radii.r20} padding={0}>
            {recentRecords.map((record, index) => {
              const recColor = eventColorFor(theme, record.type);
              const last = index === recentRecords.length - 1;
              return (
                <View key={index} style={[styles.listRow, !last && styles.listRowDivider]}>
                  <IconChip name={record.icon} color={recColor} size={18} />
                  <View style={styles.listText}>
                    <Text style={styles.listTitle} numberOfLines={1}>{record.title}</Text>
                    <Text style={styles.listDate}>{formatShortDate(record.date)}</Text>
                    {record.description ? (
                      <Text style={styles.listDesc} numberOfLines={1}>{record.description}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}
      </View>

      {/* ─── QUICK ACTIONS ────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('detail.quickActions.section')}</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accentTint }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Assistant', {
                screen:  'AIAssistantChat',
                params: { petId: pet.id, petName: pet.name },
              });
            }}
          >
            <Ionicons name="scan-outline" size={28} color={theme.accent} />
            <Text style={styles.actionText}>{t('detail.quickActions.aiAnalysis')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accentTint }]}
            onPress={() => navigation.navigate('Medical')}
          >
            <Ionicons name="document-text-outline" size={28} color={theme.accent} />
            <Text style={styles.actionText}>{t('detail.quickActions.records')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accentTint }]}
            onPress={() => navigation.navigate('Medical')}
          >
            <Ionicons name="medkit-outline" size={28} color={theme.accent} />
            <Text style={styles.actionText}>{t('detail.quickActions.vaccines')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.accentTint }]}
            onPress={() => navigation.navigate('Activity')}
          >
            <Ionicons name="fitness-outline" size={28} color={theme.accent} />
            <Text style={styles.actionText}>{t('detail.quickActions.activity')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <Screen>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
      >
        {/* ─── HEADER (чистый прозрачный: back accent + delete danger; имя — в hero паспорта) ─── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={theme.accent} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>{t('detail.headerTitle')}</Text>

          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={22} color={theme.danger} />
          </TouchableOpacity>
        </View>

        {/* ─── PASSPORT (hero/вес/аллергии/хроники/инфо + модалки) ───
             не-passport секции — через слоты на их прежних местах */}
        <PassportView
          pet={pet}
          refreshSignal={refreshTick}
          renderStatsSlot={renderStats()}
          renderOverviewSlot={renderOverview()}
        />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </Screen>
  );
}

// ══════════════════════════════════════════════════
// STYLES (обёртка: header/loading/stats/events/records/quick-actions
//          + shared: section/sectionHeader/sectionTitle/emptyCard/emptyText)
// ══════════════════════════════════════════════════
const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: 16,
  },
  notFoundText: { fontSize: 16, color: theme.t3 },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.accentTint,
    borderRadius: theme.radii.r10,
  },
  backBtnText: { color: theme.accentPress, fontFamily: theme.font.semibold },

  // ─── Header (прозрачный ряд; top safe-area даёт Screen) ───
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.t1,
    letterSpacing: -0.2,
    marginHorizontal: 8,
  },

  // ─── Stats ────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1, backgroundColor: theme.surface, borderRadius: theme.radii.r18,
    paddingVertical: 16, alignItems: 'center', gap: 8,
    shadowColor: theme.shadow.shadowColor, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontFamily: theme.font.bold, color: theme.t1 },
  statLabel: { fontSize: 11, color: theme.t3, textAlign: 'center' },

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
  seeAll: { fontSize: 14, color: theme.accentPress, fontFamily: theme.font.semibold },

  // ─── Events / Records — ряды в одной GlassCard ───
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  listRowDivider: { borderBottomWidth: 1, borderBottomColor: theme.hairline },
  listText: { flex: 1, minWidth: 0 },
  listTitle: { fontSize: 14, fontFamily: theme.font.bold, color: theme.t1 },
  listDate: { fontSize: 12, color: theme.t3, marginTop: 2 },
  listDesc: { fontSize: 12, color: theme.t2, marginTop: 2 },

  // ─── Empty card (shared) ──────────────────────
  emptyCard: {
    backgroundColor: theme.surface, borderRadius: theme.radii.r18,
    padding: 24, alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 14, color: theme.t3 },

  // ─── Actions ──────────────────────────────────
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: {
    width: '47%', aspectRatio: 1.6, borderRadius: theme.radii.md16,
    justifyContent: 'center', alignItems: 'center', gap: 6,
    shadowColor: theme.shadow.shadowColor, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  actionText: { fontSize: 13, fontFamily: theme.font.semibold, color: theme.t1 },

  bottomPadding: { height: 40 },
});
