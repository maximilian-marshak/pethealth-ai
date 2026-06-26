// ══════════════════════════════════════════════════════════════
// src/hooks/usePointsHistory.js
// Лента транзакций баллов (Activity → «Сводка»). ТОЛЬКО ЧТЕНИЕ.
// Источник — RPC get_points_history (леджер user_points, фильтр auth.uid()).
// НЕ трогает useLoyaltyPoints (singleton-стор баланса/начислений) — отдельный
// локальный фетч на экранный список.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function usePointsHistory(limit = 30) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('get_points_history', { p_limit: limit });
      if (error) throw error;
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('usePointsHistory:', e.message);
      setError(e.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  return { history, loading, error, refresh: load };
}
