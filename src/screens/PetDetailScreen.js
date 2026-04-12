// ══════════════════════════════════════════════════
// src/screens/PetDetailScreen.js
// ══════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePets } from '../hooks/usePets';
import { supabase } from '../utils/supabase';
import { pickAndUploadImage } from '../services/imageUploadService';

export default function PetDetailScreen({ route, navigation }) {
  const { petId } = route.params;
  const { pets, updatePetPhoto, deletePet } = usePets();
  
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    vaccinations: 0,
    visits: 0,
    daysSinceLastVisit: null,
  });
  
  // Upcoming events
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  
  // Recent records
  const [recentRecords, setRecentRecords] = useState([]);
  
  // AI Analysis history
  const [aiHistory, setAiHistory] = useState([]);

  // ═══ LOAD PET DATA ═══
  useEffect(() => {
    loadPetData();
  }, [petId, pets]);

  const loadPetData = () => {
    const foundPet = pets.find(p => p.id === petId);
    if (foundPet) {
      setPet(foundPet);
      loadStats();
      loadUpcomingEvents();
      loadRecentRecords();
      loadAIHistory();
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStats(),
      loadUpcomingEvents(),
      loadRecentRecords(),
      loadAIHistory(),
    ]);
    setRefreshing(false);
  };

  // ═══ LOAD STATS ═══
  const loadStats = async () => {
    try {
      // Count vaccinations
      const { count: vaccCount } = await supabase
        .from('vaccinations')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', petId);

      // Count vet visits
      const { count: visitCount } = await supabase
        .from('vet_visits')
        .select('*', { count: 'exact', head: true })
        .eq('pet_id', petId);

      // Get last visit date
      const { data: lastVisit } = await supabase
        .from('vet_visits')
        .select('visit_date')
        .eq('pet_id', petId)
        .order('visit_date', { ascending: false })
        .limit(1)
        .single();

      let daysSince = null;
      if (lastVisit?.visit_date) {
        const diffTime = Date.now() - new Date(lastVisit.visit_date).getTime();
        daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      setStats({
        vaccinations: vaccCount || 0,
        visits: visitCount || 0,
        daysSinceLastVisit: daysSince,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ═══ LOAD UPCOMING EVENTS ═══
  const loadUpcomingEvents = async () => {
    try {
      const now = new Date().toISOString();
      
      // Get upcoming vaccinations
      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('vaccine_name, next_due_date')
        .eq('pet_id', petId)
        .gte('next_due_date', now)
        .order('next_due_date', { ascending: true })
        .limit(2);

      // Get upcoming vet visits
      const { data: visits } = await supabase
        .from('vet_visits')
        .select('reason, next_appointment')
        .eq('pet_id', petId)
        .gte('next_appointment', now)
        .order('next_appointment', { ascending: true })
        .limit(2);

      const events = [];
      
      if (vaccinations) {
        vaccinations.forEach(v => {
          events.push({
            type: 'vaccination',
            title: v.vaccine_name,
            date: v.next_due_date,
            icon: '💉',
          });
        });
      }

      if (visits) {
        visits.forEach(v => {
          events.push({
            type: 'visit',
            title: v.reason || 'Плановый осмотр',
            date: v.next_appointment,
            icon: '🏥',
          });
        });
      }

      // Sort by date
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setUpcomingEvents(events.slice(0, 3));
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  };

  // ═══ LOAD RECENT RECORDS ═══
  const loadRecentRecords = async () => {
    try {
      const { data: vaccinations } = await supabase
        .from('vaccinations')
        .select('id, vaccine_name, vaccination_date, created_at')
        .eq('pet_id', petId)
        .order('vaccination_date', { ascending: false })
        .limit(2);

      const { data: visits } = await supabase
        .from('vet_visits')
        .select('id, reason, visit_date, notes, created_at')
        .eq('pet_id', petId)
        .order('visit_date', { ascending: false })
        .limit(2);

      const records = [];

      if (vaccinations) {
        vaccinations.forEach(v => {
          records.push({
            type: 'vaccination',
            title: v.vaccine_name,
            date: v.vaccination_date,
            description: 'Прививка',
            icon: '💉',
          });
        });
      }

      if (visits) {
        visits.forEach(v => {
          records.push({
            type: 'visit',
            title: v.reason || 'Визит к ветеринару',
            date: v.visit_date,
            description: v.notes || 'Плановый осмотр',
            icon: '🏥',
          });
        });
      }

      // Sort by date
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setRecentRecords(records.slice(0, 3));
    } catch (error) {
      console.error('Error loading recent records:', error);
    }
  };

  // ═══ LOAD AI ANALYSIS HISTORY ═══
  const loadAIHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_history')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setAiHistory(data || []);
    } catch (error) {
      console.error('Error loading AI history:', error);
      setAiHistory([]);
    }
  };

  // ═══ UPDATE PET PHOTO ═══
  const handleUpdatePhoto = async () => {
    try {
      setUploading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // ✅ ИСПРАВЛЕНО: Используем бакет 'pets' вместо 'profiles'
      const result = await pickAndUploadImage(
        'pets',              // ← ИЗМЕНЕНО: теперь 'pets'
        pet.owner_id,
        `pet-${petId}`
      );
      
      if (result.success) {
        await updatePetPhoto(petId, result.url);
        setPet({ ...pet, avatar_url: result.url });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Успех', 'Фото питомца обновлено!');
      } else if (result.error && result.error !== 'Upload cancelled') {
        Alert.alert('Ошибка', result.error);
      }
    } catch (error) {
      console.error('❌ Error updating photo:', error);
      Alert.alert('Ошибка', error.message || 'Не удалось обновить фото');
    } finally {
      setUploading(false);
    }
  };

  // ═══ DELETE PET ═══
  const handleDelete = () => {
    Alert.alert(
      'Удалить питомца?',
      `Вы уверены, что хотите удалить ${pet?.name}? Все связанные данные будут сохранены, но питомец будет скрыт.`,
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
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить питомца');
            }
          },
        },
      ]
    );
  };

  // ═══ CALCULATE AGE ═══
  const calculateAge = (birthDate) => {
    if (!birthDate) return 'Неизвестно';
    const today = new Date();
    const birth = new Date(birthDate);
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${months} мес.`;
    } else if (months < 0) {
      return `${years - 1} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    } else {
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    }
  };

  // ═══ FORMAT DATE ═══
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // ═══ CALCULATE DAYS UNTIL ═══
  const daysUntil = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    if (diffDays < 7) return `Через ${diffDays} дн.`;
    if (diffDays < 30) return `Через ${Math.floor(diffDays / 7)} нед.`;
    return `Через ${Math.floor(diffDays / 30)} мес.`;
  };

  if (loading || !pet) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
      }
    >
      {/* ═══ HEADER ═══ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => Alert.alert('Coming Soon', 'Редактирование будет доступно в следующей версии')}
          >
            <Ionicons name="create-outline" size={22} color="#6C63FF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ PET PHOTO ═══ */}
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
                  uri: pet.avatar_url || `https://ui-avatars.com/api/?name=${pet.name}&size=400&background=6C63FF&color=fff`,
                }}
                style={styles.avatar}
              />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.petName}>{pet.name}</Text>
        <Text style={styles.petBreed}>{pet.breed || pet.species}</Text>
        <View style={styles.petMeta}>
          <Text style={styles.petMetaText}>
            {calculateAge(pet.birth_date)} • {pet.weight} {pet.weight_unit}
          </Text>
        </View>
      </View>

      {/* ═══ QUICK STATS ═══ */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💉</Text>
          <Text style={styles.statValue}>{stats.vaccinations}</Text>
          <Text style={styles.statLabel}>Прививки</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏥</Text>
          <Text style={styles.statValue}>{stats.visits}</Text>
          <Text style={styles.statLabel}>Визитов</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>
            {stats.daysSinceLastVisit !== null ? stats.daysSinceLastVisit : '—'}
          </Text>
          <Text style={styles.statLabel}>Дней</Text>
        </View>
      </View>

      {/* ═══ UPCOMING EVENTS ═══ */}
      {upcomingEvents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Ближайшие события</Text>
          {upcomingEvents.map((event, index) => (
            <View key={index} style={styles.eventCard}>
              <Text style={styles.eventIcon}>{event.icon}</Text>
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
              </View>
              <Text style={styles.eventBadge}>{daysUntil(event.date)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ═══ MEDICAL RECORDS ═══ */}
      {recentRecords.length > 0 && (
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

          {recentRecords.map((record, index) => (
            <View key={index} style={styles.recordCard}>
              <Text style={styles.recordIcon}>{record.icon}</Text>
              <View style={styles.recordContent}>
                <Text style={styles.recordTitle}>{record.title}</Text>
                <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                <Text style={styles.recordDescription} numberOfLines={1}>
                  {record.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ═══ AI ANALYSIS HISTORY ═══ */}
      {aiHistory.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🤖 AI Анализы</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Coming Soon', 'История AI анализов будет доступна в следующей версии');
              }}
            >
              <Text style={styles.seeAll}>Все →</Text>
            </TouchableOpacity>
          </View>

          {aiHistory.map((analysis) => (
            <View key={analysis.id} style={styles.aiCard}>
              <Text style={styles.aiIcon}>📸</Text>
              <View style={styles.aiContent}>
                <Text style={styles.aiTitle}>
                  {analysis.analysis_type === 'symptom' ? 'Анализ симптомов' :
                   analysis.analysis_type === 'breed' ? 'Определение породы' :
                   'Общий анализ'}
                </Text>
                <Text style={styles.aiDate}>
                  {formatDate(analysis.created_at)}
                </Text>
                {analysis.urgency && (
                  <View style={[
                    styles.urgencyBadge,
                    { backgroundColor: 
                      analysis.urgency === 'HIGH' ? '#FFE8E8' :
                      analysis.urgency === 'MEDIUM' ? '#FFF4E6' :
                      '#E8FFE8'
                    }
                  ]}>
                    <Text style={[
                      styles.urgencyText,
                      { color:
                        analysis.urgency === 'HIGH' ? '#FF6B6B' :
                        analysis.urgency === 'MEDIUM' ? '#FFA500' :
                        '#51CF66'
                      }
                    ]}>
                      {analysis.urgency}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ═══ QUICK ACTIONS ═══ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Быстрые действия</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F3F0FF' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Assistant', {
                screen: 'AIAssistantChat',
                params: { petId: pet.id, petName: pet.name }
              });
            }}
          >
            <Ionicons name="scan" size={28} color="#6C63FF" />
            <Text style={styles.actionText}>AI Анализ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#E8F4FD' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Coming Soon', 'Добавление записей будет доступно в следующей версии');
            }}
          >
            <Ionicons name="document-text" size={28} color="#4ECDC4" />
            <Text style={styles.actionText}>Запись</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FFE8E8' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Coming Soon', 'Добавление прививок будет доступно в следующей версии');
            }}
          >
            <Ionicons name="medical" size={28} color="#FF6B6B" />
            <Text style={styles.actionText}>Прививка</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#E8FFE8' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Coming Soon', 'Добавление визитов будет доступно в следующей версии');
            }}
          >
            <Ionicons name="fitness" size={28} color="#51CF66" />
            <Text style={styles.actionText}>Визит</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ═══ ADDITIONAL INFO ═══ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ Дополнительная информация</Text>
        <View style={styles.infoCard}>
          <InfoRow icon="🎂" label="Дата рождения" value={pet.birth_date ? formatDate(pet.birth_date) : '—'} />
          <InfoRow icon={pet.gender === 'male' ? '♂️' : '♀️'} label="Пол" value={pet.gender === 'male' ? 'Кобель' : pet.gender === 'female' ? 'Сука' : '—'} />
          {pet.microchip_id && <InfoRow icon="🏷️" label="ID чипа" value={pet.microchip_id} />}
          <InfoRow icon="💊" label="Кастрирован" value={pet.is_neutered ? 'Да' : 'Нет'} />
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

// ═══ INFO ROW COMPONENT ═══
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFE8E8',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: '#6C63FF',
  },
  uploadingOverlay: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(108, 99, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  petMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petMetaText: {
    fontSize: 14,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#888',
  },
  eventBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
  },
  recordCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recordIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: 13,
    color: '#666',
  },
  aiCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  aiDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  urgencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 30,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A2E',
  },
  bottomPadding: {
    height: 40,
  },
});
