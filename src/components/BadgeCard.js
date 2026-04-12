// src/components/BadgeCard.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * BadgeCard Component
 * Displays an achievement badge with locked/unlocked states
 * @param {Object} badge - Badge data object
 * @param {boolean} badge.unlocked - Whether the badge is unlocked
 * @param {string} badge.icon - Emoji icon for the badge
 * @param {string} badge.title - Badge title
 * @param {string} badge.description - Badge description
 * @param {string} badge.color - Badge color (hex)
 * @param {number} badge.threshold - Required value to unlock
 * @param {string} badge.requirement - Type of requirement
 */
export default function BadgeCard({ badge }) {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Open modal with badge details
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: badge.unlocked ? badge.color : '#E0E0E0',
              opacity: badge.unlocked ? 1 : 0.6,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {/* Lock overlay for locked badges */}
          {!badge.unlocked && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}

          {/* Badge Icon */}
          <Text style={styles.badgeIcon}>{badge.icon}</Text>

          {/* Badge Title */}
          <Text
            style={[
              styles.badgeTitle,
              { color: badge.unlocked ? '#FFFFFF' : '#757575' },
            ]}
            numberOfLines={2}
          >
            {badge.title}
          </Text>

          {/* Unlock indicator */}
          {badge.unlocked && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkIcon}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Modal with badge details */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Badge Icon Large */}
            <Text style={styles.modalIcon}>{badge.icon}</Text>

            {/* Badge Title */}
            <Text style={styles.modalTitle}>{badge.title}</Text>

            {/* Badge Description */}
            <Text style={styles.modalDescription}>{badge.description}</Text>

            {/* Status */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: badge.unlocked
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(158, 158, 158, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: badge.unlocked ? '#4CAF50' : '#9E9E9E' },
                ]}
              >
                {badge.unlocked ? '✓ Разблокирован' : '🔒 Заблокирован'}
              </Text>
            </View>

            {/* Requirement details */}
            {!badge.unlocked && (
              <View style={styles.requirementBox}>
                <Text style={styles.requirementTitle}>Как получить:</Text>
                <Text style={styles.requirementText}>
                  {getRequirementText(badge)}
                </Text>
              </View>
            )}

            {/* Close button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/**
 * Helper function to generate requirement text
 */
function getRequirementText(badge) {
  switch (badge.requirement) {
    case 'total_donated':
      return `Пожертвуйте ${badge.threshold} Paws приютам`;
    case 'current_balance':
      return `Накопите ${badge.threshold} Paws`;
    case 'donation_count':
      return `Сделайте ${badge.threshold} пожертвований`;
    case 'unique_shelters':
      return `Помогите ${badge.threshold} разным приютам`;
    default:
      return badge.description;
  }
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    height: 110,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  lockIcon: {
    fontSize: 16,
  },
  badgeIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  checkmark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requirementBox: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  requirementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
