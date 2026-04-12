// ══════════════════════════════════════════════════
// src/screens/DashboardScreen.js (WITH CHARITY NAVIGATION)
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
import { supabase } from '../utils/supabase';
import RecentActivityCard from '../components/RecentActivityCard';
import { useLoyaltyPoints } from '../hooks/useLoyaltyPoints';
import ProgressBar from '../components/ProgressBar';

export default function DashboardScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🆕 Paws Loyalty Points Hook
  const { points, loading: loadingPoints, addPoints } = useLoyaltyPoints();

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = navigation.addListener('focus', loadDashboardData);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (selectedPet) {
      console.log(`🔄 Switched to pet: ${selectedPet.name} (${selectedPet.id?.slice(0, 8)}...)`);
      
      // Очищаем предыдущие данные ПЕРЕД загрузкой новых
      setRecentActivities([]);
      setUpcomingVaccinations([]);
      setHealthStatus(null);
      
      loadRecentActivities();
      loadHealthStatus();
    }
  }, [selectedPet]);

  const loadDashboardData = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error('❌ Auth Error:', authError.message);
        return;
      }

      setUser(user);

      if (user) {
        await loadPets(user.id);
      }
    } catch (error) {
      console.error('❌ Dashboard Error:', error.message);
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

      if (error) {
        console.error('❌ Error loading pets:', error.message);
        setPets([]);
        setSelectedPet(null);
        return;
      }

      if (!data || data.length === 0) {
        setPets([]);
        setSelectedPet(null);
        return;
      }

      const activePets = data.filter(
        (pet) =>
          pet.is_active === true ||
          pet.is_active === null ||
          pet.is_active === undefined
      );

      console.log(`✅ Loaded ${activePets.length} active pets`);
      setPets(activePets);
      setSelectedPet(activePets[0] ?? null);
    } catch (err) {
      console.error('❌ Exception loading pets:', err.message);
    }
  };

  const loadUpcomingVaccinations = useCallback(async () => {
    if (!selectedPet) {
      setUpcomingVaccinations([]);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: vaccData, error: vaccError } = await supabase
        .from('vaccinations')
        .select('id, pet_id, vaccine_name, next_due_date')
        .eq('pet_id', selectedPet.id)
        .gte('next_due_date', today)
        .order('next_due_date', { ascending: true });

      if (vaccError) {
        throw vaccError;
      }

      if (!vaccData || vaccData.length === 0) {
        setUpcomingVaccinations([]);
        return;
      }

      const enriched = vaccData.map(v => ({
        id: v.id,
        pet_id: v.pet_id,
        vaccine_name: v.vaccine_name || 'Unnamed Vaccine',
        next_due_date: v.next_due_date,
        pet_name: selectedPet.name,
      }));

      console.log(`✅ Loaded ${enriched.length} upcoming vaccinations`);
      setUpcomingVaccinations(enriched);
    } catch (error) {
      console.error('❌ Error loading vaccinations:', error);
      setUpcomingVaccinations([]);
    }
  }, [selectedPet]);

  const loadHealthStatus = async () => {
    if (!selectedPet) {
      setHealthStatus(null);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Vaccination Status
      const { data: vaccData } = await supabase
        .from('vaccinations')
        .select('next_due_date')
        .eq('pet_id', selectedPet.id)
        .order('next_due_date', { ascending: true })
        .limit(1);

      let vaccinationStatus = 'up_to_date';
      let nextVaccDate = null;

      if (vaccData && vaccData.length > 0) {
        nextVaccDate = vaccData[0].next_due_date;
        const daysUntil = getDaysUntil(nextVaccDate);
        
        if (daysUntil < 0) {
          vaccinationStatus = 'overdue';
        } else if (daysUntil <= 7) {
          vaccinationStatus = 'due_soon';
        } else {
          vaccinationStatus = 'up_to_date';
        }
      }

      // 2. Weight Tracking
      const currentWeight = selectedPet.weight || null;
      const weightUnit = selectedPet.weight_unit || 'kg';

      // 3. Next Checkup
      const { data: checkupData } = await supabase
        .from('doctor_visits')
        .select('visit_date, visit_type')
        .eq('pet_id', selectedPet.id)
        .gte('visit_date', today)
        .order('visit_date', { ascending: true })
        .limit(1);

      let nextCheckup = null;
      if (checkupData && checkupData.length > 0) {
        nextCheckup = {
          date: checkupData[0].visit_date,
          type: checkupData[0].visit_type || 'Checkup',
        };
      }

      setHealthStatus({
        vaccination: {
          status: vaccinationStatus,
          nextDate: nextVaccDate,
        },
        weight: {
          value: currentWeight,
          unit: weightUnit,
        },
        checkup: nextCheckup,
      });

      loadUpcomingVaccinations();

    } catch (error) {
      console.error('❌ Error loading health status:', error);
      setHealthStatus(null);
    }
  };

  const calculateStreak = (activities) => {
    if (!activities || activities.length === 0) return 0;

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(b.activity_date) - new Date(a.activity_date)
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);

      const hasActivityOnDate = sortedActivities.some(activity => {
        const activityDate = new Date(activity.activity_date);
        activityDate.setHours(0, 0, 0, 0);
        return activityDate.getTime() === checkDate.getTime();
      });

      if (hasActivityOnDate) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  const loadRecentActivities = async () => {
    if (!selectedPet) {
      setRecentActivities([]);
      return;
    }

    setLoadingActivities(true);
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .order('activity_date', { ascending: false });

      if (error) {
        console.error('❌ Error loading activities:', error.message);
        throw error;
      }

      console.log(`✅ Loaded ${data?.length || 0} activities for ${selectedPet.name}`);

      if (!data || data.length === 0) {
        setRecentActivities([]);
        return;
      }

      const currentStreak = calculateStreak(data);

      const formattedActivities = data.slice(0, 5).map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        title: activity.activity_type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        date: activity.activity_date,
        pet_name: selectedPet.name,
        duration: activity.duration,
        distance: activity.distance,
        notes: activity.notes,
        streak: currentStreak,
      }));

      setRecentActivities(formattedActivities);
    } catch (error) {
      console.error('❌ Exception loading activities:', error.message);
      setRecentActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const navigateToActivities = () => {
    navigation.navigate('Activity');
  };

  // 🆕 НАВИГАЦИЯ НА CHARITY STORE
  const navigateToCharityStore = () => {
    navigation.navigate('CharityStore', { 
      screen: 'CharityStoreMain' 
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) {
      const namePart = user.email.split('@')[0];
      return namePart
        .split(/[._]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
    if (totalMonths < 1) return 'Newborn';
    if (totalMonths < 12) return `${totalMonths}mo`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return months === 0 ? `${years}yr` : `${years}yr ${months}mo`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateString);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const getPetEmoji = (species) => {
    if (!species) return '🐾';
    const emojis = {
      dog: '🐶',
      cat: '🐱',
      rabbit: '🐰',
      bird: '🐦',
      hamster: '🐹',
      fish: '🐠',
      turtle: '🐢',
      snake: '🐍',
    };
    return emojis[species.toLowerCase()] || '🐾';
  };

  const getVaccinationStatusInfo = () => {
    if (!healthStatus?.vaccination) {
      return {
        icon: 'shield-checkmark-outline',
        color: '#888',
        bgColor: '#F5F5F5',
        title: 'Vaccinations',
        subtitle: 'No data',
      };
    }

    const { status, nextDate } = healthStatus.vaccination;

    if (status === 'overdue') {
      return {
        icon: 'alert-circle',
        color: '#FF6B6B',
        bgColor: '#FFE8E8',
        title: 'Vaccination Overdue',
        subtitle: nextDate ? `Due: ${formatDate(nextDate)}` : 'Check schedule',
      };
    }

    if (status === 'due_soon') {
      return {
        icon: 'time',
        color: '#FFA500',
        bgColor: '#FFF4E6',
        title: 'Vaccination Due Soon',
        subtitle: nextDate ? `${formatDate(nextDate)}` : 'Coming up',
      };
    }

    return {
      icon: 'checkmark-circle',
      color: '#51CF66',
      bgColor: '#E8FFE8',
      title: 'Up to Date',
      subtitle: nextDate ? `Next: ${formatDate(nextDate)}` : 'All good!',
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading your pets...</Text>
      </View>
    );
  }

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
      {/* HEADER */}
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

      {pets.length === 0 ? (
        <View style={styles.noPetsContainer}>
          <Text style={styles.noPetsEmoji}>🐾</Text>
          <Text style={styles.noPetsTitle}>No pets yet!</Text>
          <Text style={styles.noPetsSubtitle}>
            Add your first pet to get started
          </Text>
          <TouchableOpacity
            style={styles.addPetBtn}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addPetBtnText}>Add Your Pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* PET SELECTOR */}
          {pets.length > 1 && (
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
                  <Text style={styles.petSelectorEmoji}>
                    {getPetEmoji(pet.species)}
                  </Text>
                  <Text
                    style={[
                      styles.petSelectorName,
                      selectedPet?.id === pet.id &&
                        styles.petSelectorNameActive,
                    ]}
                  >
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* PET CARD */}
          {selectedPet && (
            <View style={styles.petCard}>
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
                      'Unknown breed'}
                  </Text>
                  <View style={styles.petBadge}>
                    <Text style={styles.petBadgeText}>
                      {selectedPet.gender
                        ? selectedPet.gender.charAt(0).toUpperCase() +
                          selectedPet.gender.slice(1)
                        : 'Unknown'}
                      {' • '}
                      {calculateAge(selectedPet.birth_date) || 'Age unknown'}
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
            </View>
          )}

          {/* 🆕 PAWS LOYALTY CARD */}
          {selectedPet && (
            <View style={styles.pawsCard}>
              <View style={styles.pawsHeader}>
                <View style={styles.pawsIconContainer}>
                  <Text style={styles.pawsEmoji}>🐾</Text>
                </View>
                <View style={styles.pawsInfo}>
                  <Text style={styles.pawsTitle}>Paws Points</Text>
                  <Text style={styles.pawsSubtitle}>Help shelter animals</Text>
                </View>
                <TouchableOpacity 
                  style={styles.pawsInfoBtn}
                  onPress={navigateToCharityStore}
                >
                  <Ionicons name="information-circle-outline" size={24} color="#6C63FF" />
                </TouchableOpacity>
              </View>

              <View style={styles.pawsBalanceContainer}>
                <Text style={styles.pawsBalance}>{loadingPoints ? '...' : points}</Text>
                <Text style={styles.pawsBalanceLabel}>Paws</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progress to Help Shelter</Text>
                  <Text style={styles.progressValue}>{points}/1000</Text>
                </View>
                <ProgressBar current={points} goal={1000} height={12} />
              </View>

              {points >= 1000 && (
                <TouchableOpacity 
                  style={styles.donateButton}
                  onPress={navigateToCharityStore}
                  activeOpacity={0.8}
                >
                  <Ionicons name="heart" size={20} color="#fff" />
                  <Text style={styles.donateButtonText}>Help a Shelter Now!</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.earnMoreButton}
                onPress={() => navigation.navigate('Activity')}
                activeOpacity={0.8}
              >
                <Text style={styles.earnMoreText}>+ Earn More Paws</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* HEALTH STATUS CARDS */}
          {selectedPet && healthStatus && (
            <>
              <Text style={styles.sectionTitle}>Health Overview</Text>
              <View style={styles.healthCardsContainer}>
                {/* Card 1: Vaccination Status */}
                <TouchableOpacity
                  style={styles.healthCard}
                  onPress={() => navigation.navigate('Medical')}
                  activeOpacity={0.8}
                >
                  {(() => {
                    const info = getVaccinationStatusInfo();
                    return (
                      <>
                        <View style={[styles.healthCardIcon, { backgroundColor: info.bgColor }]}>
                          <Ionicons name={info.icon} size={24} color={info.color} />
                        </View>
                        <View style={styles.healthCardContent}>
                          <Text style={styles.healthCardTitle}>{info.title}</Text>
                          <Text style={styles.healthCardSubtitle}>{info.subtitle}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                      </>
                    );
                  })()}
                </TouchableOpacity>

                {/* Card 2: Weight Tracking */}
                <TouchableOpacity
                  style={styles.healthCard}
                  onPress={() => navigation.navigate('Medical')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.healthCardIcon, { backgroundColor: '#E8F4FD' }]}>
                    <Ionicons name="trending-up" size={24} color="#4ECDC4" />
                  </View>
                  <View style={styles.healthCardContent}>
                    <Text style={styles.healthCardTitle}>Weight</Text>
                    <Text style={styles.healthCardSubtitle}>
                      {healthStatus.weight.value 
                        ? `${healthStatus.weight.value} ${healthStatus.weight.unit}`
                        : 'Not recorded'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>

                {/* Card 3: Next Checkup */}
                <TouchableOpacity
                  style={styles.healthCard}
                  onPress={() => navigation.navigate('Medical')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.healthCardIcon, { backgroundColor: '#F3F0FF' }]}>
                    <Ionicons name="calendar" size={24} color="#6C63FF" />
                  </View>
                  <View style={styles.healthCardContent}>
                    <Text style={styles.healthCardTitle}>Next Checkup</Text>
                    <Text style={styles.healthCardSubtitle}>
                      {healthStatus.checkup 
                        ? `${healthStatus.checkup.type} - ${formatDate(healthStatus.checkup.date)}`
                        : 'Not scheduled'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCC" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* QUICK ACTIONS */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Medical')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FFE8E8' }]}>
                <Ionicons name="medical" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.actionText}>Medical</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('AIAssistant')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8F4FD' }]}>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={24}
                  color="#4ECDC4"
                />
              </View>
              <Text style={styles.actionText}>AI Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Activity')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#E8FFE8' }]}>
                <Ionicons name="fitness" size={24} color="#51CF66" />
              </View>
              <Text style={styles.actionText}>Activity</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F3F0FF' }]}>
                <Ionicons name="person" size={24} color="#6C63FF" />
              </View>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ADD ANOTHER PET */}
          <TouchableOpacity
            style={styles.addAnotherPetBtn}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Ionicons name="add-circle-outline" size={18} color="#6C63FF" />
            <Text style={styles.addAnotherPetText}>Add Another Pet</Text>
          </TouchableOpacity>

          {/* UPCOMING VACCINATIONS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Vaccinations</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Medical')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingVaccinations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>💉</Text>
              <Text style={styles.emptyText}>No upcoming vaccinations</Text>
              <Text style={styles.emptySubtext}>All up to date!</Text>
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
                      {vax.pet_name} • Due {formatDate(vax.next_due_date)}
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
                        ? 'Today'
                        : daysUntil === 1
                        ? '1 day'
                        : `${daysUntil} days`}
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* RECENT ACTIVITY */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={navigateToActivities}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingActivities ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6C63FF" />
            </View>
          ) : recentActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>🏃</Text>
              <Text style={styles.emptyText}>No recent activity</Text>
              <Text style={styles.emptySubtext}>
                Start tracking your pet's activities!
              </Text>
              <TouchableOpacity 
                style={styles.addActivityButton}
                onPress={navigateToActivities}
                activeOpacity={0.8}
              >
                <Text style={styles.addActivityText}>+ Add First Activity</Text>
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
  noPetsContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
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
  petCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
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

  // PAWS CARD STYLES
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
  pawsEmoji: {
    fontSize: 24,
  },
  pawsInfo: {
    flex: 1,
  },
  pawsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  pawsSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  pawsInfoBtn: {
    padding: 4,
  },
  pawsBalanceContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F3F0FF',
    borderRadius: 16,
    marginBottom: 16,
  },
  pawsBalance: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  pawsBalanceLabel: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
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
  donateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  earnMoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  earnMoreText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },

  healthCardsContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 8,
  },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  healthCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  healthCardContent: {
    flex: 1,
  },
  healthCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  healthCardSubtitle: {
    fontSize: 13,
    color: '#888',
  },
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
  addAnotherPetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
    backgroundColor: '#F3F0FF',
  },
  addAnotherPetText: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 14,
  },
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
  emptySubtext: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 16 },
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
  addActivityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  activitiesContainer: {
    paddingHorizontal: 20,
  },
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
  vaccinationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  vaccinationPet: { fontSize: 12, color: '#888', marginTop: 2 },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  urgencyText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  bottomPadding: { height: 100 },
});
