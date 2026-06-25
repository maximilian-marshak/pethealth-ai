// ══════════════════════════════════════════════════════════════
// src/components/ui/StatusCard.jsx  (pethealth-design / Шаг 2)
// Одна health-overview плитка: IconChip(statusColor) + UPPERCASE-caption (t3)
// + метрика (t1, bold) + subtitle (t3), solid surface, левый 4px-страйп
// цвета statusColor. Вынесен 1:1 из dashboard/StatusCards.jsx (рендер идентичен).
// ══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export default function StatusCard({ icon, statusColor, title, value, subtitle, onPress, style }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: statusColor }, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: statusColor + '20' }]}>
          <Ionicons name={icon} size={18} color={statusColor} />
        </View>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text style={styles.cardValue} numberOfLines={1}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={styles.cardSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 13,
    borderLeftWidth: 4,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.t3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.t1,
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11,
    color: theme.t3,
    lineHeight: 15,
  },
});
