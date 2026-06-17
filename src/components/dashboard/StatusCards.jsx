// ══════════════════════════════════════════════════
// src/components/dashboard/StatusCards.jsx
// ══════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Хелпер форматирования даты ─────────────────
const formatCardDate = (date) => {
  if (!date) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
};

// ─── Одна карточка ───────────────────────────────
const StatusCard = ({ icon, statusColor, title, value, subtitle, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderLeftColor: statusColor }]}
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

// ─── Главный компонент ───────────────────────────
export const StatusCards = ({ status, onNavigate, petId }) => {
  const { vaccination, doctorVisit, parasites, biometry } = status;

  // ── Vaccination ────────────────────────────────
  const vaccColor =
    !vaccination                       ? '#9E9E9E'
    : vaccination.status === 'overdue' ? '#F44336'
    : vaccination.status === 'soon'    ? '#FF9800'
    : '#4CAF50';

  const vaccValue    = vaccination
    ? formatCardDate(vaccination.dueDate)
    : 'Нет данных';

  const vaccSubtitle = vaccination
    ? vaccination.name
    : 'Добавить вакцинацию';

  // ── Doctor Visit ───────────────────────────────
  const doctorColor    = doctorVisit ? '#2196F3' : '#9E9E9E';
  const doctorValue    = doctorVisit
    ? formatCardDate(doctorVisit.dueDate)
    : 'Нет записи';
  const doctorSubtitle = doctorVisit
    ? doctorVisit.title
    : 'Записаться к врачу';

  // ── Parasites ──────────────────────────────────
  const parasitesColor    = parasites ? '#8BC34A' : '#9E9E9E';
  const parasitesValue    = parasites
    ? formatCardDate(parasites.date)
    : 'Нет данных';
  const parasitesSubtitle = parasites
    ? (parasites.title || 'Последняя обработка')
    : 'Добавить запись';

  // ── Biometry ───────────────────────────────────
  const biometryColor =
    !biometry                    ? '#9E9E9E'
    : biometry.trend === 'up'   ? '#FF9800'
    : biometry.trend === 'down' ? '#2196F3'
    : '#4CAF50';

  const biometryValue = biometry
    ? `${biometry.weight} ${biometry.unit}`
    : 'Нет данных';

  const biometrySubtitle = (() => {
    if (!biometry)        return 'Добавить вес';
    if (biometry.isFirst) return 'Первое взвешивание';

    const sign    = biometry.diff > 0 ? '+' : '';
    const diffStr = `${sign}${biometry.diff} ${biometry.unit}`;
    const prevStr = biometry.previousWeight !== null
      ? `было ${biometry.previousWeight} ${biometry.unit}`
      : '';

    if (biometry.diff === 0) {
      return prevStr ? `Стабильно · ${prevStr}` : 'Вес стабилен';
    }

    return prevStr ? `${diffStr} · ${prevStr}` : diffStr;
  })();

  // ── Навигация ──────────────────────────────────
  const handleMedicalNav  = () => onNavigate?.('Medical');
  const handleBiometryNav = () => {
    if (!petId) return;
    onNavigate?.('PetDetail', { petId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatusCard
          icon="medkit-outline"
          statusColor={vaccColor}
          title="Вакцинация"
          value={vaccValue}
          subtitle={vaccSubtitle}
          onPress={handleMedicalNav}
        />
        <StatusCard
          icon="calendar-outline"
          statusColor={doctorColor}
          title="Врач"
          value={doctorValue}
          subtitle={doctorSubtitle}
          onPress={handleMedicalNav}
        />
      </View>

      <View style={styles.row}>
        <StatusCard
          icon="bug-outline"
          statusColor={parasitesColor}
          title="Паразиты"
          value={parasitesValue}
          subtitle={parasitesSubtitle}
          onPress={handleMedicalNav}
        />
        <StatusCard
          icon="scale-outline"
          statusColor={biometryColor}
          title="Биометрия"
          value={biometryValue}
          subtitle={biometrySubtitle}
          onPress={handleBiometryNav}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    borderLeftWidth: 4,
    shadowColor: '#000',
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
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#9E9E9E',
    lineHeight: 15,
  },
});
