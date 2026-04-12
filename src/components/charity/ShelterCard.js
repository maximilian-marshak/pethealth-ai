import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DONATION_OPTIONS = [100, 500, 1000];

export default function ShelterCard({ shelter, onDonate, userPoints }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="home-heart" size={32} color="#8B5CF6" />
        <View style={styles.headerText}>
          <Text style={styles.name}>{shelter.name}</Text>
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
            <Text style={styles.city}>{shelter.city}</Text>
          </View>
        </View>
      </View>

      {shelter.description && (
        <Text style={styles.description}>{shelter.description}</Text>
      )}

      {shelter.address && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="home" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{shelter.address}</Text>
        </View>
      )}

      {shelter.phone && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone" size={16} color="#6B7280" />
          <Text style={styles.infoText}>{shelter.phone}</Text>
        </View>
      )}

      {shelter.total_donations > 0 && (
        <View style={styles.statsRow}>
          <MaterialCommunityIcons name="heart" size={16} color="#EF4444" />
          <Text style={styles.statsText}>
            Собрано: {shelter.total_donations} Paws
          </Text>
        </View>
      )}

      <View style={styles.donationButtons}>
        {DONATION_OPTIONS.map((amount) => (
          <TouchableOpacity
            key={amount}
            style={[
              styles.donateButton,
              userPoints < amount && styles.donateButtonDisabled,
            ]}
            onPress={() => onDonate(shelter, amount)}
            disabled={userPoints < amount}
          >
            <Text
              style={[
                styles.donateButtonText,
                userPoints < amount && styles.donateButtonTextDisabled,
              ]}
            >
              {amount} 🐾
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  city: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statsText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 6,
  },
  donationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  donateButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  donateButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  donateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  donateButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
