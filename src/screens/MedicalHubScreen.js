import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MedicalHubScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical Hub 🏥</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#6C63FF' },
});
