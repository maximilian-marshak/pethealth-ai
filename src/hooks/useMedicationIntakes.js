// ══════════════════════════════════════════════════════════════
// src/hooks/useMedicationIntakes.js
// Отметки «принято» для приёмов лекарств (S3.1, без UI).
// Ленивая материализация: «запланированный приём» выводится из активных
// рецептов на экране; здесь хранится только ФАКТ отметки в medication_intakes.
//   ключ дня      — ymd 'YYYY-MM-DD' локального календарного дня (что видит юзер)
//   scheduled_at  — полдень UTC этого дня (`${ymd}T12:00:00Z`): стабильный
//                   инстант, не пересекает границу даты при сериализации.
//   карта takenMap — `${prescriptionId}|${ymd}` -> true
// Некритично: нет petId/ошибка → пустая карта.
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

const noonUtc = (ymd) => `${ymd}T12:00:00Z`;
const keyOf = (prescriptionId, ymd) => `${prescriptionId}|${ymd}`;

export function useMedicationIntakes(petId) {
  const [takenMap, setTakenMap] = useState({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!petId) { setTakenMap({}); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medication_intakes')
        .select('prescription_id, scheduled_at, taken')
        .eq('pet_id', petId)
        .eq('taken', true);
      if (error) throw error;

      const map = {};
      (data || []).forEach((r) => {
        // scheduled_at = полдень UTC дня → slice(0,10) даёт исходный ymd.
        const ymd = r.scheduled_at ? String(r.scheduled_at).slice(0, 10) : null;
        if (ymd && r.prescription_id) map[keyOf(r.prescription_id, ymd)] = true;
      });
      setTakenMap(map);
    } catch (e) {
      console.warn('useMedicationIntakes: load failed (non-critical):', e?.message);
      setTakenMap({});
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isTaken = useCallback(
    (prescriptionId, ymd) => !!takenMap[keyOf(prescriptionId, ymd)],
    [takenMap]
  );

  // Отметить приём за день (idempotent по (prescription_id, scheduled_at)).
  const markTaken = useCallback(async (prescriptionId, ymd) => {
    if (!petId || !prescriptionId || !ymd) return;
    const k = keyOf(prescriptionId, ymd);
    setTakenMap((prev) => ({ ...prev, [k]: true })); // оптимистично
    try {
      const { error } = await supabase
        .from('medication_intakes')
        .upsert(
          {
            prescription_id: prescriptionId,
            pet_id: petId,
            scheduled_at: noonUtc(ymd),
            taken: true,
            taken_at: new Date().toISOString(),
          },
          { onConflict: 'prescription_id,scheduled_at' }
        );
      if (error) throw error;
    } catch (e) {
      console.warn('useMedicationIntakes: markTaken failed:', e?.message);
      setTakenMap((prev) => { const n = { ...prev }; delete n[k]; return n; }); // откат
      throw e;
    }
  }, [petId]);

  // Снять отметку — удаляем строку приёма за этот день (баллы НЕ отзываются).
  const unmark = useCallback(async (prescriptionId, ymd) => {
    if (!petId || !prescriptionId || !ymd) return;
    const k = keyOf(prescriptionId, ymd);
    setTakenMap((prev) => { const n = { ...prev }; delete n[k]; return n; }); // оптимистично
    try {
      const { error } = await supabase
        .from('medication_intakes')
        .delete()
        .eq('pet_id', petId)
        .eq('prescription_id', prescriptionId)
        .eq('scheduled_at', noonUtc(ymd));
      if (error) throw error;
    } catch (e) {
      console.warn('useMedicationIntakes: unmark failed:', e?.message);
      setTakenMap((prev) => ({ ...prev, [k]: true })); // откат
      throw e;
    }
  }, [petId]);

  return { takenMap, loading, isTaken, markTaken, unmark, refetch: load };
}
