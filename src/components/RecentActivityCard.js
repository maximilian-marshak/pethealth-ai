import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RecentActivityCard({
  type,
  title,
  date,
  petName,
  duration,
  distance,
  notes,
  streak,
  showStreak = true,
  onPress,
}) {
  const getActivityIcon = (type) => {
    const icons = {
      walk: 'walk-outline',
      play: 'game-controller-outline',
      training: 'school-outline',
      feeding: 'restaurant-outline',
      grooming: 'cut-outline',
    };
    return icons[type] || 'paw-outline';
  };

  const getActivityColor = (type) => {
    const colors = {
      walk: '#4A90E2',
      play: '#E94B3C',
      training: '#F39C12',
      feeding: '#27AE60',
      grooming: '#9B59B6',
    };
    return colors[type] || '#95A5A6';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: getActivityColor(type) }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: getActivityColor(type) + '20' }]}>
            <Ionicons name={getActivityIcon(type)} size={24} color={getActivityColor(type)} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.petName}>{petName}</Text>
          </View>
        </View>

        {showStreak && streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{streak}</Text>
            <Text style={styles.streakLabel}>day{streak !== 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        {duration && (
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{duration} min</Text>
          </View>
        )}
        {distance && (
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{distance} km</Text>
          </View>
        )}
      </View>

      {notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {notes}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.date}>{formatDate(date)}</Text>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  petName: {
    fontSize: 13,
    color: '#666',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F57C00',
    marginRight: 2,
  },
  streakLabel: {
    fontSize: 11,
    color: '#F57C00',
    fontWeight: '600',
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  notes: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  date: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
});
