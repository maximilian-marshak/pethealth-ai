// ══════════════════════════════════════════════════
// src/components/dashboard/StatusCards.jsx
// ══════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { formatWeightValue, unitLabel } from '../../utils/formatWeight';

// ─── Хелпер форматирования даты ─────────────────
const formatCardDate = (date) => {
  if (!date) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
};

// ─── Одна карточка ───────────────────────────────
const StatusCard = ({ icon, statusColor, title, value, subtitle, onPress }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
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
};

// ─── Главный компонент ───────────────────────────
export const StatusCards = ({ status, onNavigate, petId, unit = 'kg' }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { vaccination, doctorVisit, parasites, biometry } = status;

  // ── Vaccination ────────────────────────────────
  // Семантика здоровья: overdue→danger, soon→warn, up-to-date→ok, нет данных→t3.
  const vaccColor =
    !vaccination                       ? theme.t3
    : vaccination.status === 'overdue' ? theme.danger
    : vaccination.status === 'soon'    ? theme.warn
    : theme.ok;

  const vaccValue    = vaccination
    ? formatCardDate(vaccination.dueDate)
    : 'Нет данных';

  const vaccSubtitle = vaccination
    ? vaccination.name
    : 'Добавить вакцинацию';

  // ── Doctor Visit ───────────────────────────────
  // Есть запись → ok (закрыто/запланировано), нет → t3 (нейтрально).
  const doctorColor    = doctorVisit ? theme.ok : theme.t3;
  const doctorValue    = doctorVisit
    ? formatCardDate(doctorVisit.dueDate)
    : 'Нет записи';
  const doctorSubtitle = doctorVisit
    ? doctorVisit.title
    : 'Записаться к врачу';

  // ── Parasites ──────────────────────────────────
  // Есть свежая обработка → ok, нет → t3.
  const parasitesColor    = parasites ? theme.ok : theme.t3;
  const parasitesValue    = parasites
    ? formatCardDate(parasites.date)
    : 'Нет данных';
  const parasitesSubtitle = parasites
    ? (parasites.title || 'Последняя обработка')
    : 'Добавить запись';

  // ── Biometry ───────────────────────────────────
  // Вес — информационная метрика, НЕ статус здоровья: приложение не знает целевого
  // веса питомца, поэтому тренд (набор/потеря) может быть и нормой, и проблемой.
  // Красить в warn/ok = ложный сигнал → всегда нейтральный t3. Направление и
  // величину несёт subtitle (+/- diff). Семантику оставляем для реальных алертов.
  const biometryColor = theme.t3;

  const biometryValue = biometry
    ? `${formatWeightValue(biometry.weight, unit)} ${unitLabel(unit)}`
    : 'Нет данных';

  const biometrySubtitle = (() => {
    if (!biometry)        return 'Добавить вес';
    if (biometry.isFirst) return 'Первое взвешивание';

    const sign    = biometry.diff > 0 ? '+' : '';
    const diffStr = `${sign}${formatWeightValue(biometry.diff, unit)} ${unitLabel(unit)}`;
    const prevStr = biometry.previousWeight !== null
      ? `было ${formatWeightValue(biometry.previousWeight, unit)} ${unitLabel(unit)}`
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

const makeStyles = (theme) => StyleSheet.create({
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
