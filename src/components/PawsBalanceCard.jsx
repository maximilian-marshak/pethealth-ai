// ══════════════════════════════════════════════════════════════
// src/components/PawsBalanceCard.jsx
// Карточка «Баланс лапок» (вынос из DashboardScreen для переиспользования
// на Dashboard и Activity → «Сводка»). Самодостаточна:
//  • баланс — useLoyaltyPoints (singleton-стор, per-account);
//  • прогресс месяца — RPC get_month_points (read-only) на фокусе экрана;
//  • навигация — CharityStore / HowToEarnPaws.
// Только отображение: начисления/списания НЕ затрагиваются.
// i18n namespace: dashboard (paws.*).
// ══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../utils/supabase';
import GlassCard from './GlassCard';
import ProgressBar from './ProgressBar';
import { useLoyaltyPoints } from '../hooks/useLoyaltyPoints';

export default function PawsBalanceCard() {
  const navigation = useNavigation();
  const { t } = useTranslation('dashboard');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { points, loading: loadingPoints } = useLoyaltyPoints();
  const [monthData, setMonthData] = useState(null); // { month_points, monthly_cap, remaining } | null

  // Месячный прогресс баллов — RPC get_month_points (одна строка). Некритично.
  const loadMonthPoints = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_month_points');
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setMonthData(row || null);
    } catch (e) {
      console.warn('get_month_points failed (non-critical):', e?.message);
      setMonthData(null);
    }
  }, []);

  // Перезагрузка при фокусе экрана (как было на Dashboard).
  useFocusEffect(useCallback(() => { loadMonthPoints(); }, [loadMonthPoints]));

  return (
    <GlassCard variant="decor" style={styles.pawsCard} padding={20}>
      <View style={styles.pawsHeader}>
        <View style={styles.pawsIconContainer}>
          <Text style={styles.pawsEmoji}>🐾</Text>
        </View>
        <View style={styles.pawsInfo}>
          <Text style={styles.pawsTitle}>{t('paws.title')}</Text>
          <Text style={styles.pawsSubtitle}>{t('paws.subtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.pawsInfoBtn} onPress={() => navigation.navigate('CharityStore')}>
          <Ionicons name="information-circle-outline" size={24} color={theme.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.pawsBalanceContainer}>
        <Text style={styles.pawsBalance}>{loadingPoints ? '...' : points}</Text>
        <Text style={styles.pawsBalanceLabel}>{t('paws.balanceLabel')}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{t('paws.monthProgressLabel')}</Text>
          <Text style={styles.progressValue}>
            {monthData ? `${monthData.month_points}/${monthData.monthly_cap}` : '...'}
          </Text>
        </View>
        <ProgressBar current={monthData?.month_points || 0} goal={monthData?.monthly_cap || 1} height={12} />
      </View>

      <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('CharityStore')} activeOpacity={0.8}>
        <Ionicons name="heart" size={20} color={theme.onAccent} />
        <Text style={styles.supportButtonText}>{t('paws.supportShelter')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.earnMoreButton} onPress={() => navigation.navigate('HowToEarnPaws')} activeOpacity={0.8}>
        <Text style={styles.earnMoreText}>{t('paws.earnMore')}</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  pawsCard: { marginHorizontal: 16, marginBottom: 16 },
  pawsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  pawsIconContainer: { width: 48, height: 48, borderRadius: theme.radii.sm12, backgroundColor: theme.accentTint, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pawsEmoji: { fontSize: 24 },
  pawsInfo: { flex: 1 },
  pawsTitle: { fontSize: 18, fontFamily: theme.font.bold, color: theme.t1 },
  pawsSubtitle: { fontSize: 13, color: theme.t2, marginTop: 2 },
  pawsInfoBtn: { padding: 4 },
  pawsBalanceContainer: { alignItems: 'center', paddingVertical: 16, backgroundColor: 'transparent', borderRadius: theme.radii.md16, marginBottom: 16 },
  pawsBalance: { fontSize: 48, fontFamily: theme.font.bold, color: theme.t1 },
  pawsBalanceLabel: { fontSize: 14, color: theme.t2, fontFamily: theme.font.semibold, marginTop: 4 },
  progressContainer: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: theme.t2, fontFamily: theme.font.medium },
  progressValue: { fontSize: 13, color: theme.t1, fontFamily: theme.font.bold },
  supportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentPress, paddingVertical: 14, borderRadius: theme.radii.sm12, gap: 8, marginBottom: 8 },
  supportButtonText: { color: theme.onAccent, fontSize: 16, fontFamily: theme.font.bold },
  earnMoreButton: { alignItems: 'center', paddingVertical: 10 },
  earnMoreText: { fontSize: 14, color: theme.accentPress, fontFamily: theme.font.semibold },
});
