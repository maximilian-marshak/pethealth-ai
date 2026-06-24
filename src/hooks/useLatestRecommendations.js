// ══════════════════════════════════════════════════════════════
// src/hooks/useLatestRecommendations.js
// Источник для Dashboard-карты «Рекомендации врача» (§4.4, US#17).
// Последняя medical_records-запись активного питомца с непустыми
// recommendations. Колонки — фактические (RecordDetail/OCR): occurred_at
// (дата визита), clinic_name (клиника), recommendations (текст).
// Рефетч на фокусе экрана — чтобы свежие рекомендации после визита подхватывались.
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

export function useLatestRecommendations(petId) {
  const [recommendation, setRecommendation] = useState(null); // { text, clinic, date, recordId } | null
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!petId) { setRecommendation(null); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, occurred_at, clinic_name, recommendations')
        .eq('pet_id', petId)
        .not('recommendations', 'is', null)
        .neq('recommendations', '')
        .order('occurred_at', { ascending: false, nullsFirst: false })
        .limit(1);
      if (error) throw error;

      const row = data?.[0];
      const text = row?.recommendations?.trim();
      setRecommendation(
        text
          ? { text, clinic: row.clinic_name || null, date: row.occurred_at || null, recordId: row.id }
          : null
      );
    } catch (e) {
      console.warn('useLatestRecommendations: load failed (non-critical):', e?.message);
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { recommendation, loading };
}
