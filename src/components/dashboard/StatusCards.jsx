// ══════════════════════════════════════════════════
// src/components/dashboard/StatusCards.jsx
// ══════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { formatWeightValue, unitLabel } from '../../utils/formatWeight';
import StatusCard from '../ui/StatusCard';

// ─── Хелпер форматирования даты ─────────────────
const formatCardDate = (date) => {
  if (!date) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
};

// Одна health-плитка вынесена в src/components/ui/StatusCard.jsx (рендер 1:1).

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

// Только grid-раскладка; плитка (card/icon/title/value/subtitle) — в ui/StatusCard.
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
});
