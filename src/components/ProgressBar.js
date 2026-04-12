import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProgressBar({ current = 0, goal = 1000, height = 12 }) {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.background}>
        <LinearGradient
          colors={['#6C63FF', '#4ECDC4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percentage}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    borderRadius: 100,
  },
  fill: {
    height: '100%',
    borderRadius: 100,
  },
});
