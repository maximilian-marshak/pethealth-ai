import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';

export default function MedicalHubScreen() {
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('hub.title')}</Text>
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
  title:     { fontSize: 24, fontFamily: theme.font.bold, color: theme.accent },
});
