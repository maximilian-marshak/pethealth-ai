// ══════════════════════════════════════════════════
// src/screens/DashboardScreen.js
// Главная (Dashboard) — Redesign Шаг B1: стекло + фон-градиент.
// Композиция по design_spec §4: шапка-свитчер (4.1) → [Weight 4.2 — B2] →
// StatusCards (4.3) → [Рекомендации 4.4 — B2] → AI Insight (4.5) →
// Paws (4.6) → ранг → Quick actions (4.7).
// Стекло — примитивы Screen/GlassCard/IconChip; цвета только из theme-токенов.
// ══════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../utils/supabase';
import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import IconChip from '../components/IconChip';
import PawsBalanceCard from '../components/PawsBalanceCard';
import { useDashboardStatus } from '../hooks/useDashboardStatus';
import { useCharity } from '../hooks/useCharity';
import { useCharityRanks } from '../hooks/useCharityRanks';
import { useNotifications } from '../hooks/useNotifications';
import { requestNotificationPermission, scheduleNotificationsFromEvents, cancelAllScheduled } from '../utils/notificationsSetup';
import { useNotificationPref } from '../hooks/useNotificationPref';
import { useUnits } from '../hooks/useUnits';
import { useLatestRecommendations } from '../hooks/useLatestRecommendations';
import { StatusCards } from '../components/dashboard/StatusCards';

export default function DashboardScreen({ navigation }) {
  const { t, i18n } = useTranslation('dashboard');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // ─── State ──────────────────────────────────────
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── Хуки ───────────────────────────────────────
  const {
    status: dashStatus,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useDashboardStatus(selectedPet?.id);
  const { lifetimeDonated } = useCharity();
  const { currentRank, loading: loadingRanks } = useCharityRanks(lifetimeDonated);
  const { unit } = useUnits();
  const { unreadCount, upcoming } = useNotifications();
  const { enabled: notifEnabled } = useNotificationPref();
  const { recommendation } = useLatestRecommendations(selectedPet?.id);

  // ─── AI Insight (4.5): статичный совет дня, ротация по дню года ───
  // TODO: Block 2 — заменить на ai-proxy совет (динамический инсайт).
  const _now = new Date();
  const _startOfYear = new Date(_now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((_now - _startOfYear) / 86400000);
  const _tipsItems = t('tips.items', { returnObjects: true });
  const _tipsList = Array.isArray(_tipsItems) ? _tipsItems : [];
  const tipText = _tipsList.length ? _tipsList[dayOfYear % _tipsList.length] : '';

  // ─── Ранг: имя реактивно по языку (из raw name_ru/name_en) ───
  const _lang = i18n.language || 'en';
  const rankName = (r) => (_lang.startsWith('ru') ? r?.name_ru : r?.name_en) || r?.name_en || r?.name_ru || '';
  const rankAccent = theme.leagueColors[currentRank?.league] || theme.accent;

  // ─── Рекомендации (4.4): локализ. дата визита + 1–3 пункта из текста ───
  const recLocale = (i18n.language || 'en').startsWith('ru') ? 'ru-RU' : 'en-US';
  const recDateStr = recommendation?.date
    ? new Date(recommendation.date).toLocaleDateString(recLocale, { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const _recPoints = recommendation
    ? recommendation.text
        .split('\n')
        .map((s) => s.replace(/^[\s•\-*\d.)]+/, '').trim()) // снять маркеры/нумерацию
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const recItems = _recPoints.length ? _recPoints : (recommendation ? [recommendation.text.trim()] : []);

  // ─── Effects ────────────────────────────────────

  // Начальная загрузка
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Обновление при возврате на экран
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
      refetchStatus();
    });
    return unsubscribe;
  }, [navigation, refetchStatus]);

  // Локальные пуши по due-событиям: мягкий запрос разрешения + полная
  // пере-синхронизация при изменении списка предстоящих событий.
  useEffect(() => {
    (async () => {
      if (!notifEnabled) { await cancelAllScheduled(); return; }
      const status = await requestNotificationPermission();
      if (status === 'granted') await scheduleNotificationsFromEvents(upcoming);
    })();
  }, [upcoming, notifEnabled]);

  // ─── Data Loading ────────────────────────────────
  const loadDashboardData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) return;
      if (user) await loadPets(user.id);
    } catch (error) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const loadPets = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true });

      if (error || !data || data.length === 0) {
        setPets([]);
        setSelectedPet(null);
        return;
      }

      const activePets = data.filter(
        (p) => p.is_active === true || p.is_active == null
      );

      setPets(activePets);
      setSelectedPet((prev) => {
        const stillExists = prev && activePets.find((p) => p.id === prev.id);
        return stillExists || activePets[0] || null;
      });
    } catch {
      setPets([]);
      setSelectedPet(null);
    }
  };

  // ─── Helpers ─────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchStatus();
    loadDashboardData();
  }, [refetchStatus]);

  const getPetEmoji = (species) => {
    if (!species) return '🐾';
    const map = {
      dog: '🐶', cat: '🐱', rabbit: '🐰', bird: '🐦',
      hamster: '🐹', fish: '🐠', turtle: '🐢', snake: '🐍',
    };
    return map[species.toLowerCase()] || '🐾';
  };

  // ─── Loading screen ──────────────────────────────
  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </Screen>
    );
  }

  // ─── Render ──────────────────────────────────────
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        {pets.length === 0 ? (
          /* ── NO PETS ─────────────────────────── */
          <View style={styles.noPetsContainer}>
            <Text style={styles.noPetsEmoji}>🐾</Text>
            <Text style={styles.noPetsTitle}>{t('noPets.title')}</Text>
            <Text style={styles.noPetsSubtitle}>{t('noPets.subtitle')}</Text>
            <TouchableOpacity style={styles.addPetBtn} onPress={() => navigation.navigate('AddPet')}>
              <Ionicons name="add-circle" size={20} color={theme.onAccent} />
              <Text style={styles.addPetBtnText}>{t('noPets.addBtn')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── 4.1 PET SWITCHER (glass decor) ──── */}
            <GlassCard variant="decor" style={styles.switcherCard}>
              <View style={styles.switcherTop}>
                <TouchableOpacity
                  style={styles.switcherPet}
                  activeOpacity={0.8}
                  disabled={!selectedPet}
                  onPress={() => selectedPet && navigation.navigate('PetDetail', { petId: selectedPet.id })}
                >
                  <View style={styles.switcherAvatar}>
                    {selectedPet?.avatar_url ? (
                      <Image source={{ uri: selectedPet.avatar_url }} style={styles.switcherAvatarImg} />
                    ) : (
                      <Text style={styles.switcherAvatarEmoji}>{getPetEmoji(selectedPet?.species)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switcherName} numberOfLines={1}>{selectedPet?.name}</Text>
                    <Text style={styles.switcherBreed} numberOfLines={1}>
                      {selectedPet?.breed || selectedPet?.species || t('petCard.unknownBreed')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.switcherActions}>
                  <TouchableOpacity
                    style={styles.bellBtn}
                    onPress={() => navigation.navigate('Notifications')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="notifications-outline" size={24} color={theme.accent} />
                    {unreadCount > 0 && (
                      <View style={styles.bellBadge}>
                        <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                    <Ionicons name="person-circle-outline" size={38} color={theme.accent} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Горизонтальный список питомцев + «Добавить» */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.petList}
                contentContainerStyle={styles.petListContent}
              >
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.petSelectorItem, selectedPet?.id === pet.id && styles.petSelectorItemActive]}
                    onPress={() => setSelectedPet(pet)}
                  >
                    <Text style={styles.petSelectorEmoji}>{getPetEmoji(pet.species)}</Text>
                    <Text
                      style={[styles.petSelectorName, selectedPet?.id === pet.id && styles.petSelectorNameActive]}
                      numberOfLines={1}
                    >
                      {pet.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.petSelectorAddBtn} onPress={() => navigation.navigate('AddPet')}>
                  <Ionicons name="add" size={16} color={theme.accent} />
                  <Text style={styles.petSelectorAddText}>{t('petSelector.addPet')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </GlassCard>

            {/* ── 4.3 STATUS CARDS (solid data) ───── */}
            {selectedPet && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('health.sectionTitle')}</Text>
                  {statusLoading && <ActivityIndicator size="small" color={theme.accent} />}
                </View>
                <StatusCards
                  status={dashStatus}
                  petId={selectedPet?.id}
                  unit={unit}
                  onNavigate={(screen, params) => navigation.navigate(screen, params)}
                />
              </>
            )}

            {/* ── 4.4 VET RECOMMENDATIONS (solid data; пусто → скрыт) ── */}
            {recommendation && (
              <GlassCard variant="data" style={styles.recCard}>
                <View style={styles.recHeader}>
                  <Ionicons name="clipboard-outline" size={18} color={theme.accent} />
                  <Text style={styles.recTitle}>{t('recommendations.title')}</Text>
                </View>
                <Text style={styles.recSub}>
                  {recommendation.clinic
                    ? t('recommendations.sinceVisit', { clinic: recommendation.clinic, date: recDateStr })
                    : t('recommendations.sinceVisitDate', { date: recDateStr })}
                </Text>
                <View style={styles.recList}>
                  {recItems.map((item, i) =>
                    recItems.length > 1 ? (
                      <View key={i} style={styles.recItemRow}>
                        <View style={styles.recBullet} />
                        <Text style={styles.recItemText}>{item}</Text>
                      </View>
                    ) : (
                      <Text key={i} style={styles.recParagraph}>{item}</Text>
                    )
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('RecordDetail', { recordId: recommendation.recordId, petId: selectedPet.id })}
                >
                  <Text style={styles.recSeeAll}>{t('recommendations.seeAll')}</Text>
                </TouchableOpacity>
              </GlassCard>
            )}

            {/* ── 4.5 AI INSIGHT (glass decor) ────── */}
            <GlassCard variant="decor" style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <IconChip name="sparkles-outline" size={20} />
                <Text style={styles.insightTitle}>{t('tips.title')}</Text>
              </View>
              <Text style={styles.insightText}>{tipText}</Text>
              <TouchableOpacity
                style={styles.insightBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Assistant')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.accent} />
                <Text style={styles.insightBtnText}>{t('tips.discuss')}</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* ── 4.6 PAWS (вынесено в PawsBalanceCard) ──────────── */}
            {selectedPet && <PawsBalanceCard />}

            {/* ── RANK (glass decor) ──────────────── */}
            {!loadingRanks && currentRank && (
              <GlassCard variant="decor" style={styles.rankCard}>
                <TouchableOpacity style={styles.rankRow} activeOpacity={0.8} onPress={() => navigation.navigate('Profile')}>
                  <Text style={styles.rankCardIcon}>{currentRank.icon || '🏅'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankCardLabel}>{t('rank.title')}</Text>
                    <Text style={styles.rankCardName}>{rankName(currentRank)}</Text>
                    {currentRank.league ? (
                      <Text style={[styles.rankCardLeague, { color: rankAccent }]}>
                        {t(`profile:rank.league.${currentRank.league}`, { defaultValue: currentRank.league })}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={rankAccent} />
                </TouchableOpacity>
              </GlassCard>
            )}

            {/* ── 4.7 QUICK ACTIONS ───────────────── */}
            <Text style={styles.sectionTitle}>{t('quickActions.sectionTitle')}</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Medical')}>
                <IconChip name="medical" size={24} bg={theme.surface} />
                <Text style={styles.actionText}>{t('quickActions.medical')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Assistant')}>
                <IconChip name="chatbubble-ellipses" size={24} bg={theme.surface} />
                <Text style={styles.actionText}>{t('quickActions.aiChat')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile')}>
                <IconChip name="person" size={24} bg={theme.surface} />
                <Text style={styles.actionText}>{t('quickActions.profile')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => { if (selectedPet?.id) navigation.navigate('Appointments', { petId: selectedPet.id }); }}
              >
                <IconChip name="today-outline" size={24} bg={theme.surface} />
                <Text style={styles.actionText}>{t('quickActions.appointments')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

// ══════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════
const makeStyles = (theme) => StyleSheet.create({
  scrollContent: { paddingTop: 8, paddingBottom: 100 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 16, color: theme.t2 },

  // No Pets
  noPetsContainer: { alignItems: 'center', padding: 40, marginTop: 40 },
  noPetsEmoji: { fontSize: 60, marginBottom: 16 },
  noPetsTitle: { fontSize: 22, fontFamily: theme.font.bold, color: theme.t1, marginBottom: 8 },
  noPetsSubtitle: { fontSize: 14, color: theme.t2, marginBottom: 24 },
  addPetBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accentPress, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radii.lg24, gap: 8 },
  addPetBtnText: { color: theme.onAccent, fontFamily: theme.font.bold, fontSize: 16 },

  // 4.1 Pet Switcher (glass decor)
  switcherCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
  switcherTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switcherPet: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  switcherAvatar: { width: 52, height: 52, borderRadius: theme.radii.r26, backgroundColor: theme.accentTint, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  switcherAvatarImg: { width: 52, height: 52, borderRadius: theme.radii.r26 },
  switcherAvatarEmoji: { fontSize: 26 },
  switcherName: { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  switcherBreed: { fontSize: 13, color: theme.t2, marginTop: 1 },
  switcherActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bellBtn: { padding: 4, position: 'relative' },
  bellBadge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: theme.radii.sm8, backgroundColor: theme.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText: { color: theme.onAccent, fontSize: 10, fontFamily: theme.font.bold },

  petList: { marginTop: 14 },
  petListContent: { gap: 10, paddingRight: 4 },
  petSelectorItem: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radii.r20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, flexDirection: 'row', gap: 6 },
  petSelectorItemActive: { backgroundColor: theme.accentPress, borderColor: theme.accentPress },
  petSelectorEmoji: { fontSize: 16 },
  petSelectorName: { fontSize: 14, color: theme.t2, fontFamily: theme.font.semibold, maxWidth: 110 },
  petSelectorNameActive: { color: theme.onAccent },
  petSelectorAddBtn: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.radii.r20, flexDirection: 'row', gap: 6, borderWidth: 1.5, borderColor: theme.accent, borderStyle: 'dashed' },
  petSelectorAddText: { fontSize: 14, color: theme.accentPress, fontFamily: theme.font.semibold },

  // 4.4 Vet recommendations (glass data)
  recCard: { marginHorizontal: 16, marginBottom: 16 },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  recTitle: { fontSize: 16, fontFamily: theme.font.bold, color: theme.t1 },
  recSub: { fontSize: 12, color: theme.t2, marginBottom: 10 },
  recList: { gap: 6 },
  recItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  recBullet: { width: 5, height: 5, borderRadius: theme.radii.xs4, backgroundColor: theme.accent, marginTop: 7 },
  recItemText: { flex: 1, fontSize: 14, color: theme.t1, lineHeight: 20 },
  recParagraph: { fontSize: 14, color: theme.t1, lineHeight: 20 },
  recSeeAll: { fontSize: 14, color: theme.accentPress, fontFamily: theme.font.semibold, marginTop: 12 },

  // Sections
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1, paddingHorizontal: 20, marginTop: 8, marginBottom: 12 },

  // 4.5 AI Insight (glass decor)
  insightCard: { marginHorizontal: 16, marginBottom: 16 },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  insightTitle: { fontSize: 16, fontFamily: theme.font.bold, color: theme.t1 },
  insightText: { fontSize: 14, color: theme.t2, lineHeight: 20 },
  insightBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 11, borderRadius: theme.radii.pill999, backgroundColor: theme.accentTint },
  insightBtnText: { fontSize: 14, fontFamily: theme.font.bold, color: theme.accentPress },

  // Rank (glass decor — outer → primitive; margins only)
  rankCard: { marginHorizontal: 16, marginBottom: 16 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rankCardIcon: { fontSize: 34 },
  rankCardLabel: { fontSize: 12, color: theme.t2, fontFamily: theme.font.semibold, textTransform: 'uppercase' },
  rankCardName: { fontSize: 17, fontFamily: theme.font.bold, color: theme.t1, marginTop: 1 },
  rankCardLeague: { fontSize: 12, fontFamily: theme.font.bold, marginTop: 1, textTransform: 'uppercase' },

  // 4.7 Quick Actions
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  actionBtn: { alignItems: 'center', flex: 1, gap: 6 },
  actionText: { fontSize: 12, color: theme.t2, fontFamily: theme.font.medium },
});
