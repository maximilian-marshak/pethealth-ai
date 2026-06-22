// ══════════════════════════════════════════════════
// src/screens/DashboardScreen.js
// ══════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '../utils/supabase';
import RecentActivityCard from '../components/RecentActivityCard';
import { useLoyaltyPoints } from '../hooks/useLoyaltyPoints';
import { useDashboardStatus } from '../hooks/useDashboardStatus';
import { usePetHealth } from '../hooks/usePetHealth';
import { StatusCards } from '../components/dashboard/StatusCards';
import ProgressBar from '../components/ProgressBar';

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation('dashboard');

  // ─── State ──────────────────────────────────────
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthData, setMonthData] = useState(null); // { month_points, monthly_cap, remaining } | null

  // ─── Хуки ───────────────────────────────────────
  const { points, loading: loadingPoints } = useLoyaltyPoints();
  const {
    status: dashStatus,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useDashboardStatus(selectedPet?.id);
  const { allergies } = usePetHealth(selectedPet?.id);

  // ─── Совет дня (статичный, детерминированная ротация по дню года) ───
  const _now = new Date();
  const _startOfYear = new Date(_now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((_now - _startOfYear) / 86400000);
  // TODO: Block 2 — заменить на ai-proxy совет
  const _tipsItems = t('tips.items', { returnObjects: true });
  const _tipsList = Array.isArray(_tipsItems) ? _tipsItems : [];
  const tipText = _tipsList.length ? _tipsList[dayOfYear % _tipsList.length] : '';

  // ─── Effects ────────────────────────────────────

  // Начальная загрузка
  useEffect(() => {
    loadDashboardData();
    loadMonthPoints();
  }, []);

  // Обновление при возврате на экран
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
      refetchStatus();
      loadMonthPoints();
    });
    return unsubscribe;
  }, [navigation, refetchStatus]);

  // Загрузка данных питомца при смене выбранного
  useEffect(() => {
    if (selectedPet) {
      setRecentActivities([]);
      setUpcomingVaccinations([]);
      loadRecentActivities();
      loadUpcomingVaccinations();
    }
  }, [selectedPet]);

  // ─── Data Loading ────────────────────────────────
  const loadDashboardData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) return;
      setUser(user);
      if (user) await loadPets(user.id);
    } catch (error) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Месячный прогресс баллов — RPC get_month_points (одна строка). Некритично.
  const loadMonthPoints = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_month_points');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setMonthData(row || null);
    } catch (e) {
      console.warn('get_month_points failed (non-critical):', e?.message);
      setMonthData(null);
    }
  }, []);

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

  const loadUpcomingVaccinations = useCallback(async () => {
    if (!selectedPet) { setUpcomingVaccinations([]); return; }
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('vaccinations')
        .select('id, pet_id, vaccine_name, next_due_date')
        .eq('pet_id', selectedPet.id)
        .eq('is_completed', false)
        .gte('next_due_date', today)
        .order('next_due_date', { ascending: true });

      if (error) throw error;

      const enriched = (data || []).map((v) => ({
        id: v.id,
        pet_id: v.pet_id,
        vaccine_name: v.vaccine_name || 'Unnamed Vaccine',
        next_due_date: v.next_due_date,
        pet_name: selectedPet.name,
      }));

      setUpcomingVaccinations(enriched);
    } catch {
      setUpcomingVaccinations([]);
    }
  }, [selectedPet]);

  const loadRecentActivities = async () => {
    if (!selectedPet) { setRecentActivities([]); return; }
    setLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .order('activity_date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) { setRecentActivities([]); return; }

      const currentStreak = calculateStreak(data);
      const formatted = data.slice(0, 5).map((a) => ({
        id: a.id,
        type: a.activity_type,
        title: a.activity_type
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        date: a.activity_date,
        pet_name: selectedPet.name,
        duration: a.duration,
        distance: a.distance,
        notes: a.notes,
        streak: currentStreak,
      }));

      setRecentActivities(formatted);
    } catch {
      setRecentActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetchStatus();
    loadDashboardData();
  }, [refetchStatus]);

  const calculateStreak = (activities) => {
    if (!activities?.length) return 0;
    const sorted = [...activities].sort(
      (a, b) => new Date(b.activity_date) - new Date(a.activity_date)
    );
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const check = new Date(today);
      check.setDate(check.getDate() - i);
      const has = sorted.some((a) => {
        const d = new Date(a.activity_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === check.getTime();
      });
      if (has) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 17) return t('greeting.afternoon');
    return t('greeting.evening');
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) {
      return user.email
        .split('@')[0]
        .split(/[._]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return 'Pet Parent';
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    const totalMonths =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());
    if (totalMonths < 1) return t('petCard.newborn');
    if (totalMonths < 12) return `${totalMonths}mo`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return months === 0 ? `${years}yr` : `${years}yr ${months}mo`;
  };

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────
  return (
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
      {/* ── HEADER ─────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.userName}>{getUserName()}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={40} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      {/* ── NO PETS ────────────────────────────── */}
      {pets.length === 0 ? (
        <View style={styles.noPetsContainer}>
          <Text style={styles.noPetsEmoji}>🐾</Text>
          <Text style={styles.noPetsTitle}>{t('noPets.title')}</Text>
          <Text style={styles.noPetsSubtitle}>{t('noPets.subtitle')}</Text>
          <TouchableOpacity
            style={styles.addPetBtn}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addPetBtnText}>{t('noPets.addBtn')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── PET SELECTOR ───────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.petSelector}
            contentContainerStyle={styles.petSelectorContent}
          >
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petSelectorItem,
                  selectedPet?.id === pet.id && styles.petSelectorItemActive,
                ]}
                onPress={() => setSelectedPet(pet)}
              >
                <Text style={styles.petSelectorEmoji}>{getPetEmoji(pet.species)}</Text>
                <Text
                  style={[
                    styles.petSelectorName,
                    selectedPet?.id === pet.id && styles.petSelectorNameActive,
                  ]}
                >
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.petSelectorAddBtn}
              onPress={() => navigation.navigate('AddPet')}
            >
              <Ionicons name="add" size={16} color="#6C63FF" />
              <Text style={styles.petSelectorAddText}>{t('petSelector.addPet')}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── PET CARD ───────────────────────── */}
          {selectedPet && (
            <TouchableOpacity
              style={styles.petCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PetDetail', { petId: selectedPet.id })}
            >
              <View style={styles.petCardLeft}>
                <View style={styles.petAvatar}>
                  {selectedPet.avatar_url ? (
                    <Image
                      source={{ uri: selectedPet.avatar_url }}
                      style={styles.petImage}
                    />
                  ) : (
                    <Text style={styles.petAvatarEmoji}>
                      {getPetEmoji(selectedPet.species)}
                    </Text>
                  )}
                </View>
                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{selectedPet.name}</Text>
                  <Text style={styles.petBreed}>
                    {selectedPet.breed ||
                      selectedPet.species ||
                      t('petCard.unknownBreed')}
                  </Text>
                  <View style={styles.petBadge}>
                    <Text style={styles.petBadgeText}>
                      {selectedPet.gender
                        ? selectedPet.gender.charAt(0).toUpperCase() +
                          selectedPet.gender.slice(1)
                        : t('petCard.unknownGender')}
                      {' • '}
                      {calculateAge(selectedPet.birth_date) ||
                        t('petCard.ageUnknown')}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.petStats}>
                <View style={styles.petStat}>
                  <Text style={styles.petStatValue}>
                    {selectedPet.weight ?? '--'}
                  </Text>
                  <Text style={styles.petStatLabel}>
                    {selectedPet.weight_unit || 'kg'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── ALLERGY BANNER ─────────────────── */}
          {selectedPet && allergies.length > 0 && (
            <View style={styles.allergyBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.allergyBannerTitle}>{t('health.allergyBanner.title')}</Text>
                <Text style={styles.allergyBannerList}>
                  {allergies.map((a) => (a.severity ? `${a.substance} (${a.severity})` : a.substance)).join(', ')}
                </Text>
              </View>
            </View>
          )}

          {/* ── STATUS CARDS (4 виджета) ────────── */}
          {selectedPet && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('health.sectionTitle')}</Text>
                {statusLoading && (
                  <ActivityIndicator size="small" color="#6C63FF" />
                )}
              </View>
              <StatusCards
                status={dashStatus}
                petId={selectedPet?.id}
                onNavigate={(screen, params) => navigation.navigate(screen, params)}
              />
            </>
          )}

          {/* ── PAWS CARD ──────────────────────── */}
          {selectedPet && (
            <View style={styles.pawsCard}>
              <View style={styles.pawsHeader}>
                <View style={styles.pawsIconContainer}>
                  <Text style={styles.pawsEmoji}>🐾</Text>
                </View>
                <View style={styles.pawsInfo}>
                  <Text style={styles.pawsTitle}>{t('paws.title')}</Text>
                  <Text style={styles.pawsSubtitle}>{t('paws.subtitle')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.pawsInfoBtn}
                  onPress={() => navigation.navigate('CharityStore')}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="#6C63FF"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.pawsBalanceContainer}>
                <Text style={styles.pawsBalance}>
                  {loadingPoints ? '...' : points}
                </Text>
                <Text style={styles.pawsBalanceLabel}>{t('paws.balanceLabel')}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>
                    {t('paws.monthProgressLabel')}
                  </Text>
                  <Text style={styles.progressValue}>
                    {monthData ? `${monthData.month_points}/${monthData.monthly_cap}` : '...'}
                  </Text>
                </View>
                <ProgressBar
                  current={monthData?.month_points || 0}
                  goal={monthData?.monthly_cap || 1}
                  height={12}
                />
              </View>

              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => navigation.navigate('CharityStore')}
                activeOpacity={0.8}
              >
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.supportButtonText}>{t('paws.supportShelter')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.earnMoreButton}
                onPress={() => navigation.navigate('HowToEarnPaws')}
                activeOpacity={0.8}
              >
                <Text style={styles.earnMoreText}>{t('paws.earnMore')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── QUICK ACTIONS ──────────────────── */}
          <Text style={styles.sectionTitle}>{t('quickActions.sectionTitle')}</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Medical')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFE8E8' }]}>
                <Ionicons name="medical" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.actionText}>{t('quickActions.medical')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Assistant')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F4FD' }]}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#4ECDC4" />
              </View>
              <Text style={styles.actionText}>{t('quickActions.aiChat')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3F0FF' }]}>
                <Ionicons name="person" size={24} color="#6C63FF" />
              </View>
              <Text style={styles.actionText}>{t('quickActions.profile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { if (selectedPet?.id) navigation.navigate('Appointments', { petId: selectedPet.id }); }}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="today-outline" size={24} color="#6B4EFF" />
              </View>
              <Text style={styles.actionText}>{t('quickActions.appointments')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── TIP OF THE DAY (статичный, слот под AI) ── */}
          <Text style={styles.sectionTitle}>{t('tips.title')}</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={22} color="#6B4EFF" />
            <Text style={styles.tipText}>{tipText}</Text>
          </View>

          {/* ── UPCOMING VACCINATIONS ──────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('vaccinations.sectionTitle')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Medical')}>
              <Text style={styles.seeAll}>{t('vaccinations.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {upcomingVaccinations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💉</Text>
              <Text style={styles.emptyText}>{t('vaccinations.empty')}</Text>
              <Text style={styles.emptySubtext}>
                {t('vaccinations.emptySubtext')}
              </Text>
            </View>
          ) : (
            upcomingVaccinations.map((vax) => {
              const daysUntil = getDaysUntil(vax.next_due_date);
              const urgent = daysUntil !== null && daysUntil <= 7;
              return (
                <View key={vax.id} style={styles.vaccinationCard}>
                  <View
                    style={[
                      styles.vaccinationIcon,
                      { backgroundColor: urgent ? '#FFE8E8' : '#F3F0FF' },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={20}
                      color={urgent ? '#FF6B6B' : '#6C63FF'}
                    />
                  </View>
                  <View style={styles.vaccinationInfo}>
                    <Text style={styles.vaccinationName}>
                      {vax.vaccine_name}
                    </Text>
                    <Text style={styles.vaccinationPet}>
                      {vax.pet_name} • {t('vaccinations.due')}{' '}
                      {formatDate(vax.next_due_date)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.urgencyBadge,
                      { backgroundColor: urgent ? '#FF6B6B' : '#6C63FF' },
                    ]}
                  >
                    <Text style={styles.urgencyText}>
                      {daysUntil === 0
                        ? t('vaccinations.today')
                        : daysUntil === 1
                        ? t('vaccinations.oneDay')
                        : t('vaccinations.days', { count: daysUntil })}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* ── RECENT ACTIVITY ────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('recentActivity.sectionTitle')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
              <Text style={styles.seeAll}>{t('recentActivity.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {loadingActivities ? (
            <View style={styles.centeredLoader}>
              <ActivityIndicator size="small" color="#6C63FF" />
            </View>
          ) : recentActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🏃</Text>
              <Text style={styles.emptyText}>{t('recentActivity.empty')}</Text>
              <Text style={styles.emptySubtext}>
                {t('recentActivity.emptySubtext')}
              </Text>
              <TouchableOpacity
                style={styles.addActivityButton}
                onPress={() => navigation.navigate('Activity')}
                activeOpacity={0.8}
              >
                <Text style={styles.addActivityText}>
                  {t('recentActivity.addFirst')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.activitiesContainer}>
              {recentActivities.slice(0, 3).map((activity, index) => (
                <RecentActivityCard
                  key={activity.id}
                  type={activity.type}
                  title={activity.title}
                  date={activity.date}
                  petName={activity.pet_name}
                  duration={activity.duration}
                  distance={activity.distance}
                  notes={activity.notes}
                  streak={activity.streak}
                  showStreak={index === 0}
                  onPress={() => navigation.navigate('Activity')}
                />
              ))}
            </View>
          )}
        </>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 40,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6C63FF' },

  centeredLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  greeting: { fontSize: 14, color: '#888' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1A1A2E' },
  notificationBtn: { padding: 4 },

  // No Pets
  noPetsContainer: { alignItems: 'center', padding: 40, marginTop: 40 },
  noPetsEmoji: { fontSize: 60, marginBottom: 16 },
  noPetsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  noPetsSubtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  addPetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  addPetBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Pet Selector
  petSelector: { backgroundColor: '#fff', paddingVertical: 12 },
  petSelectorContent: { paddingHorizontal: 20, gap: 12 },
  petSelectorItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    flexDirection: 'row',
    gap: 6,
  },
  petSelectorItemActive: { backgroundColor: '#6C63FF' },
  petSelectorEmoji: { fontSize: 16 },
  petSelectorName: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  petSelectorNameActive: { color: '#fff' },
  petSelectorAddBtn: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  petSelectorAddText: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },

  // Pet Card
  petCard: {
    backgroundColor: '#6C63FF',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  petCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  petAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  petImage: { width: 70, height: 70, borderRadius: 35 },
  petAvatarEmoji: { fontSize: 35 },
  petInfo: { flex: 1 },
  petName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  petBreed: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  petBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  petBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  petStats: { alignItems: 'center' },
  petStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    minWidth: 60,
  },
  petStatValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  petStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  // Paws Card
  pawsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F3F0FF',
  },
  pawsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pawsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pawsEmoji: { fontSize: 24 },
  pawsInfo: { flex: 1 },
  pawsTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A2E' },
  pawsSubtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  pawsInfoBtn: { padding: 4 },
  pawsBalanceContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    marginBottom: 16,
  },
  pawsBalance: { fontSize: 48, fontWeight: 'bold', color: '#6C63FF' },
  pawsBalanceLabel: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: 4,
  },
  progressContainer: { marginBottom: 16 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  progressValue: { fontSize: 13, color: '#6C63FF', fontWeight: 'bold' },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  donateButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  supportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6B4EFF', paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 8, shadowColor: '#6B4EFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  supportButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  earnMoreButton: { alignItems: 'center', paddingVertical: 10 },
  earnMoreText: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  seeAll: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionText: { fontSize: 12, color: '#555', fontWeight: '500' },
  allergyBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, marginHorizontal: 20, marginBottom: 8 },
  allergyBannerTitle: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  allergyBannerList: { fontSize: 13, color: '#DC2626', marginTop: 2 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: '#EEF0F4' },
  tipText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  // Empty states
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  emptySubtext: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    marginBottom: 16,
  },
  addActivityButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addActivityText: { color: 'white', fontSize: 14, fontWeight: '700' },

  // Activities
  activitiesContainer: { paddingHorizontal: 20 },

  // Vaccination Cards
  vaccinationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vaccinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vaccinationInfo: { flex: 1 },
  vaccinationName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  vaccinationPet: { fontSize: 12, color: '#888', marginTop: 2 },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  urgencyText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  bottomPadding: { height: 100 },
});
