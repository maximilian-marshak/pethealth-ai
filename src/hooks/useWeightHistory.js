// ══════════════════════════════════════════════════════════════
// src/hooks/useWeightHistory.js
// Минимальный источник истории веса для Dashboard (карта «Вес» §4.2).
// Те же таблица/колонки/порядок, что и в PetDetail (weight_history, desc),
// чтобы не расходиться. Возвращает последние ~8 измерений активного питомца.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function useWeightHistory(petId, limit = 8) {
  const [history, setHistory] = useState([]); // desc по measured_at
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!petId) { setHistory([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weight_history')
        .select('id, weight, weight_unit, measured_at')
        .eq('pet_id', petId)
        .order('measured_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.warn('useWeightHistory: load failed (non-critical):', e?.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [petId, limit]);

  useEffect(() => { load(); }, [load]);

  return { history, loading, reload: load };
}
