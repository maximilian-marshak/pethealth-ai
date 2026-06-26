// ══════════════════════════════════════════════════════════════
// src/hooks/useWeightHistory.js
// Динамика веса по питомцу (Activity → «Сводка»). ТОЛЬКО ЧТЕНИЕ.
// Запрос weight_history (зеркало PassportView.loadWeightHistory) + чистые
// хелперы weightHelpers → { history, chart, trend, unit, loading }.
// Единицы — из useUnits() (тот же источник, что PassportView/Profile).
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useUnits } from './useUnits';
import { buildWeightChart, weightTrend } from '../utils/weightHelpers';

export function useWeightHistory(petId) {
  const { unit } = useUnits();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!petId) { setHistory([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('weight_history')
        .select('id, weight, weight_unit, measured_at, notes')
        .eq('pet_id', petId)
        .order('measured_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error('useWeightHistory:', e.message);
      setError(e.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  const chart = buildWeightChart(history, unit);
  const trend = weightTrend(history);

  return { history, chart, trend, unit, loading, error, refresh: load };
}
