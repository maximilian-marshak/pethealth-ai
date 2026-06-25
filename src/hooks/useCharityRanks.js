// ══════════════════════════════════════════════════════════════
// src/hooks/useCharityRanks.js
// Конфиг рангов (charity_ranks) + маппинг lifetime-суммы донатов в текущий/
// следующий ранг и прогресс (Шаг 2, только данные — без UI).
// Название ранга берётся из charity_ranks (name_ru/name_en) по языку i18next.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import i18n from '../utils/i18n';
import { supabase } from '../utils/supabase';

// Цвета лиг вынесены в theme-токен `leagueColors` (light/dark) — UI берёт
// theme.leagueColors[league] || theme.accent. Здесь — только данные ранг-системы.

export function useCharityRanks(lifetimeDonated = 0) {
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('charity_ranks')
        .select('*')
        .eq('enabled', true)
        .order('rank_no', { ascending: true });
      if (error) throw error;
      setRanks(data || []);
    } catch (e) {
      console.warn('useCharityRanks: load failed (non-critical):', e?.message);
      setRanks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const mapped = useMemo(() => {
    const isRu = (i18n.language || 'en').startsWith('ru');
    const withName = (r) =>
      r ? { ...r, name: (isRu ? r.name_ru : r.name_en) || r.name_en || r.name_ru || '' } : null;

    const lifetime = Number(lifetimeDonated) || 0;
    const named = ranks.map(withName);

    // Текущий ранг — наибольший threshold <= lifetime; следующий — первый threshold > lifetime.
    const reached  = named.filter((r) => lifetime >= r.threshold).sort((a, b) => a.threshold - b.threshold);
    const upcoming = named.filter((r) => r.threshold > lifetime).sort((a, b) => a.threshold - b.threshold);
    const currentRank = reached.length ? reached[reached.length - 1] : null;
    const nextRank    = upcoming.length ? upcoming[0] : null;

    // Прогресс/остаток — к порогу следующего ранга (на максимуме: 100% / 0).
    let progress = 100;
    let remaining = 0;
    if (nextRank) {
      const base = currentRank ? currentRank.threshold : 0;
      const span = nextRank.threshold - base;
      progress = span > 0 ? Math.min(Math.max(((lifetime - base) / span) * 100, 0), 100) : 0;
      remaining = Math.max(nextRank.threshold - lifetime, 0);
    }

    return { ranks: named, currentRank, nextRank, progress: Math.round(progress), remaining };
  }, [ranks, lifetimeDonated]);

  return { ...mapped, loading, refetch: load };
}
