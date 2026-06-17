import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function MedicalHubScreen() {
  const { t } = useTranslation('medical');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('hub.title')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 24, fontWeight: 'bold', color: '#6C63FF' },
});
