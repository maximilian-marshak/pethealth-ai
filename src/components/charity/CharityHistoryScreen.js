import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCharity } from '../../hooks/useCharity';
import { useTranslation } from 'react-i18next';

// ====================================
// КОМПОНЕНТ: Карточка статистики
// ====================================
function StatCard({ icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={32} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ====================================
// КОМПОНЕНТ: Карточка доната
// ====================================
function DonationCard({ donation }) {
  const { t } = useTranslation('charity');
  // Форматируем дату
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} в ${hours}:${minutes}`;
  };

  return (
    <View style={styles.donationCard}>
      <View style={styles.donationHeader}>
        <View style={styles.donationIconContainer}>
          <MaterialCommunityIcons name="heart" size={24} color="#EF4444" />
        </View>
        <View style={styles.donationInfo}>
          <Text style={styles.donationShelter} numberOfLines={1}>
            {donation.shelter_name}
          </Text>
          <Text style={styles.donationDate}>
            {formatDate(donation.created_at)}
          </Text>
        </View>
        <View style={styles.donationAmountContainer}>
          <Text style={styles.donationAmount}>{donation.points_spent}</Text>
          <Text style={styles.donationPaws}>{t('votesUnit')}</Text>
        </View>
      </View>
    </View>
  );
}

// ====================================
// КОМПОНЕНТ: Empty State
// ====================================
function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="heart-broken-outline" 
        size={80} 
        color="#D1D5DB" 
      />
      <Text style={styles.emptyStateTitle}>
        Пока нет пожертвований
      </Text>
      <Text style={styles.emptyStateText}>
        Накопите 1000 Paws и помогите приютам для животных в Беларуси! 🐾
      </Text>
    </View>
  );
}

// ====================================
// КОМПОНЕНТ: Мотивационная карточка
// ====================================
function MotivationalCard({ totalDonated }) {
  const getMotivationalMessage = () => {
    if (totalDonated === 0) {
      return {
        title: "Начните помогать!",
        text: "Каждая Paw приближает вас к первому пожертвованию",
        icon: "paw",
      };
    } else if (totalDonated < 5000) {
      return {
        title: "Отличное начало! 🌟",
        text: "Вы уже помогли приютам, продолжайте в том же духе!",
        icon: "star",
      };
    } else if (totalDonated < 10000) {
      return {
        title: "Невероятно! 💪",
        text: "Вы настоящий герой для бездомных животных!",
        icon: "trophy",
      };
    } else {
      return {
        title: "Легенда! 👑",
        text: "Вы изменили жизни многих животных к лучшему!",
        icon: "crown",
      };
    }
  };

  const message = getMotivationalMessage();

  return (
    <LinearGradient
      colors={['#8B5CF6', '#6366F1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.motivationalCard}
    >
      <MaterialCommunityIcons 
        name={message.icon} 
        size={40} 
        color="white" 
      />
      <Text style={styles.motivationalTitle}>{message.title}</Text>
      <Text style={styles.motivationalText}>{message.text}</Text>
    </LinearGradient>
  );
}

// ====================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ====================================
export default function CharityHistoryScreen() {
  const { donations, totalDonated, loading, refreshDonations } = useCharity();
  const { t } = useTranslation('charity');
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshDonations();
    setRefreshing(false);
  }, [refreshDonations]);

  // Подсчет уникальных приютов
  const uniqueShelters = new Set(
    donations.map((d) => d.shelter_id || d.shelter_name)
  ).size;

  // Состояние загрузки
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Загрузка истории...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
      >
        {/* Заголовок */}
        <Text style={styles.screenTitle}>История благотворительности</Text>
        
        {/* Статистика */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="heart-multiple"
            label="Всего пожертвовано"
            value={`${totalDonated} 🐾`}
            color="#EF4444"
          />
          <StatCard
            icon="home-heart"
            label="Помогли приютам"
            value={uniqueShelters}
            color="#8B5CF6"
          />
          <StatCard
            icon="cash-multiple"
            label="Донатов"
            value={donations.length}
            color="#10B981"
          />
        </View>

        {/* Список донатов или Empty State */}
        {donations.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>История пожертвований</Text>
              <MaterialCommunityIcons 
                name="history" 
                size={20} 
                color="#6B7280" 
              />
            </View>
            
            {donations.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </>
        ) : (
          <EmptyState />
        )}

        {/* Мотивационная карточка */}
        <MotivationalCard totalDonated={totalDonated} />

        {/* Информационный блок */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons 
            name="information-outline" 
            size={24} 
            color="#8B5CF6" 
          />
          <Text style={styles.infoText}>
            {t('poolInfo')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ====================================
// СТИЛИ
// ====================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Заголовок экрана
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },

  // Статистика
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },

  // Заголовок секции
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Карточка доната
  donationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  donationInfo: {
    flex: 1,
  },
  donationShelter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  donationDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  donationAmountContainer: {
    alignItems: 'flex-end',
  },
  donationAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  donationPaws: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Мотивационная карточка
  motivationalCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  motivationalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },

  // Информационная карточка
  infoCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    lineHeight: 20,
  },
});
