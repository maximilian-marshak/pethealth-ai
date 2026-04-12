import React, { useState, useCallback, useMemo } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useLoyaltyPoints } from '../hooks/useLoyaltyPoints';
import { useCharity } from '../hooks/useCharity';
import { useBadges } from '../hooks/useBadges';
import { usePets } from '../hooks/usePets';
import { useUserProfile } from '../hooks/useUserProfile';
import BadgeCard from '../components/BadgeCard';
import ProgressBar from '../components/ProgressBar';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  
  // ✅ Данные из хуков
  const { points, loading: loadingPoints, refetch: refetchPoints } = useLoyaltyPoints();
  const { 
    totalDonated,
    shelterCount,
    loading: loadingCharity, 
    refetch: refetchCharity 
  } = useCharity();
  const { 
    badges, 
    nextBadge, 
    loading: loadingBadges 
  } = useBadges();
  const { pets, loading: loadingPets, refetch: refetchPets } = usePets();
  
  // ✅ ДОБАВЛЕНО: Хук для управления профилем пользователя
  const { 
    profile, 
    loading: loadingProfile, 
    updateAvatar,
    refetch: refetchProfile 
  } = useUserProfile();
  
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ✅ Автообновление данных при возврате на экран
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ProfileScreen focused - refreshing all data');
      Promise.all([
        refetchPets(),
        refetchProfile(),
      ]).catch(err => console.error('❌ Error during focus refresh:', err));
    }, [refetchPets, refetchProfile])
  );

  // ✅ Текущий баланс для прогресс-бара
  const currentBalance = points || 0;
  
  // ✅ Рассчитываем данные на основе полученных значений
  const unlockedCount = badges.filter(b => b.earned).length;
  const totalBadges = badges.length;
  
  // ✅ Безопасный расчет прогресса к следующему бейджу
  const progressToNext = useMemo(() => {
    if (!nextBadge || nextBadge.earned) return 100;
    
    if (typeof nextBadge.progress === 'number' && !isNaN(nextBadge.progress)) {
      return Math.round(nextBadge.progress * 100);
    }
    
    if (nextBadge.required && typeof nextBadge.current === 'number') {
      const calculated = (nextBadge.current / nextBadge.required) * 100;
      return Math.round(Math.min(calculated, 100));
    }
    
    return 0;
  }, [nextBadge]);

  // ✅ Рефетч всех данных
  const onRefresh = async () => {
    setRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    
    try {
      await Promise.all([
        refetchPets(),
        refetchPoints(),
        refetchCharity(),
        refetchProfile(),
      ]);
      console.log('✅ All data refreshed successfully');
    } catch (error) {
      console.error('❌ Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // ✅ ДОБАВЛЕНО: Обработчик обновления аватара пользователя
  const handleUpdateAvatar = async () => {
    try {
      setUploadingAvatar(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { pickAndUploadUserAvatar } = await import('../services/imageUploadService');
      
      const newAvatarUrl = await pickAndUploadUserAvatar(
        user.id,
        profile?.avatar_url
      );

      if (newAvatarUrl) {
        await updateAvatar(newAvatarUrl);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Успех', 'Фото профиля обновлено');
      }
    } catch (error) {
      console.error('❌ Error updating avatar:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Ошибка', 'Не удалось обновить фото');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
          },
        },
      ]
    );
  };

  const navigateToSettings = (screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', `${screen} будет доступен в следующей версии`);
  };

  // ✅ ОБНОВЛЕНО: Получаем имя из profile или user
  const getUserName = () => {
    if (profile?.full_name) return profile.full_name;
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

  // ✅ ОБНОВЛЕНО: Получаем URL аватара из profile
  const getAvatarUrl = () => {
    if (profile?.avatar_url) return profile.avatar_url;
    if (user?.user_metadata?.avatar_url) return user.user_metadata.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || 'User')}&size=200&background=6C63FF&color=fff`;
  };

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
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: getAvatarUrl() }}
            style={styles.avatar}
          />
          
          {/* ✅ ДОБАВЛЕНО: Кнопка редактирования аватара */}
          <TouchableOpacity
            style={styles.avatarEditButton}
            onPress={handleUpdateAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
          </TouchableOpacity>

          {profile?.is_premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumIcon}>👑</Text>
            </View>
          )}
        </View>

        <Text style={styles.userName}>{getUserName()}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        {profile?.is_premium && (
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionText}>👑 Premium Member</Text>
          </View>
        )}
      </View>

      {/* STATS ROW */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F3F0FF' }]}>
            <Ionicons name="paw" size={24} color="#6C63FF" />
          </View>
          <Text style={styles.statValue}>
            {loadingPoints ? '...' : currentBalance}
          </Text>
          <Text style={styles.statLabel}>Текущие Paws</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="heart" size={24} color="#FF6B6B" />
          </View>
          <Text style={styles.statValue}>
            {loadingCharity ? '...' : totalDonated}
          </Text>
          <Text style={styles.statLabel}>Всего Paws</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E8FFE8' }]}>
            <Ionicons name="home" size={24} color="#51CF66" />
          </View>
          <Text style={styles.statValue}>
            {loadingCharity ? '...' : shelterCount}
          </Text>
          <Text style={styles.statLabel}>Приютов</Text>
        </View>
      </View>

      {/* ACHIEVEMENTS SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            🏆 Достижения ({unlockedCount}/{totalBadges})
          </Text>
          {badges.length > 6 && (
            <TouchableOpacity onPress={() => navigateToSettings('Все достижения')}>
              <Text style={styles.seeAll}>Все →</Text>
            </TouchableOpacity>
          )}
        </View>

        {nextBadge && !nextBadge.earned && (
          <View style={styles.nextBadgeCard}>
            <Text style={styles.nextBadgeLabel}>Следующий бейдж:</Text>
            <Text style={styles.nextBadgeName}>
              {nextBadge.icon} {nextBadge.title}
            </Text>
            <View style={styles.progressContainer}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ProgressBar current={progressToNext} goal={100} height={8} />
              </View>
              <Text style={styles.progressPercent}>{progressToNext}%</Text>
            </View>
          </View>
        )}

        {loadingBadges ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Загрузка достижений...</Text>
          </View>
        ) : (
          <View style={styles.badgesGrid}>
            {badges.slice(0, 6).map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        )}
      </View>

      {/* PETS SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🐾 Мои питомцы</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('AddPet');
            }}
          >
            <Text style={styles.seeAll}>+ Добавить</Text>
          </TouchableOpacity>
        </View>

        {loadingPets ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.emptyText}>Загрузка...</Text>
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🐕</Text>
            <Text style={styles.emptyText}>Нет питомцев</Text>
            <Text style={styles.emptySubtext}>Добавьте первого питомца</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsScroll}
          >
            {pets.map((pet) => {
              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(pet.name)}&size=200&background=6C63FF&color=fff`;

              return (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('PetDetail', { petId: pet.id });
                  }}
                >
                  <Image
                    source={{ uri: pet.avatar_url || fallbackUrl }}
                    style={styles.petAvatar}
                  />
                  <Text style={styles.petName} numberOfLines={1}>
                    {pet.name}
                  </Text>
                  <Text style={styles.petBreed} numberOfLines={1}>
                    {pet.breed || pet.species || 'Питомец'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* CHARITY SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💝 Благотворительность</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('CharityHistory');
            }}
          >
            <Text style={styles.seeAll}>История →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.charityCard}>
          <View style={styles.charityHeader}>
            <Text style={styles.charityTitle}>До следующего пожертвования</Text>
            <Text style={styles.charityGoal}>{currentBalance}/500 Paws</Text>
          </View>
          <ProgressBar current={currentBalance % 500} goal={500} height={12} />
          <Text style={styles.charityHint}>
            Каждые 500 Paws = одно пожертвование в приют
          </Text>
        </View>
      </View>

      {/* SETTINGS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Настройки</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigateToSettings('Уведомления')}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#E8F4FD' }]}>
            <Ionicons name="notifications" size={20} color="#4ECDC4" />
          </View>
          <Text style={styles.settingText}>Уведомления</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigateToSettings('Premium')}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#FFF4E6' }]}>
            <Ionicons name="diamond" size={20} color="#FFA500" />
          </View>
          <Text style={styles.settingText}>Подписка Premium</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigateToSettings('FAQ')}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#F3F0FF' }]}>
            <Ionicons name="help-circle" size={20} color="#6C63FF" />
          </View>
          <Text style={styles.settingText}>Помощь и FAQ</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#FFE8E8' }]}>
            <Ionicons name="log-out" size={20} color="#FF6B6B" />
          </View>
          <Text style={[styles.settingText, styles.logoutText]}>Выйти</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>PetHealth AI v1.0.0</Text>
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#6C63FF',
  },
  // ✅ ДОБАВЛЕНО: Стили для кнопки редактирования аватара
  avatarEditButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#6C63FF',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  premiumIcon: { fontSize: 14 },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  userEmail: { fontSize: 14, color: '#888', marginBottom: 12 },
  subscriptionBadge: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subscriptionText: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: '#888' },
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
  },
  seeAll: { fontSize: 14, color: '#6C63FF', fontWeight: '600' },
  nextBadgeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nextBadgeLabel: { 
    fontSize: 12, 
    color: '#888', 
    marginBottom: 4 
  },
  nextBadgeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    minWidth: 35,
    textAlign: 'right',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  petsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  petCard: {
    width: 110,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  petAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 8,
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  petBreed: { fontSize: 12, color: '#888' },
  charityCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  charityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  charityTitle: { fontSize: 14, color: '#666' },
  charityGoal: { fontSize: 16, fontWeight: 'bold', color: '#6C63FF' },
  charityHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  settingItem: {
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
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    fontWeight: '500',
  },
  logoutItem: {
    borderWidth: 1,
    borderColor: '#FFE8E8',
  },
  logoutText: { color: '#FF6B6B' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  emptySubtext: { fontSize: 13, color: '#888', marginTop: 4 },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 32,
  },
  bottomPadding: { height: 100 },
});
