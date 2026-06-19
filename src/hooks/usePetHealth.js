// ══════════════════════════════════════════════════════════════
// src/hooks/usePetHealth.js
// Здоровье питомца для ИИ-контекста: аллергии, активные хронические
// заболевания, активные лекарства. Всё НЕКРИТИЧНО: нет petId / ошибка
// запроса → пустые списки, чат работает как обычно (без health-блока).
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

const EMPTY_HEALTH = { allergies: [], conditions: [], medications: [] };

export function usePetHealth(petId) {
  const [health, setHealth] = useState(EMPTY_HEALTH);

  const load = useCallback(async () => {
    if (!petId) { setHealth(EMPTY_HEALTH); return; }
    try {
      const [aRes, cRes, mRes] = await Promise.all([
        supabase.from('pet_allergies').select('substance, severity').eq('pet_id', petId),
        supabase.from('pet_conditions').select('condition, code').eq('pet_id', petId).eq('active', true),
        supabase.from('record_prescriptions').select('name, dose').eq('pet_id', petId).eq('active', true),
      ]);
      setHealth({
        allergies: aRes.data || [],
        conditions: cRes.data || [],
        medications: mRes.data || [],
      });
    } catch (e) {
      console.warn('usePetHealth: load failed (non-critical):', e?.message);
      setHealth(EMPTY_HEALTH);
    }
  }, [petId]);

  // Рефетч при фокусе экрана и при смене petId (подхватывает правки из паспорта).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return health;
}
