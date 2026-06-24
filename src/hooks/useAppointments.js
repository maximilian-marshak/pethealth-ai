// ══════════════════════════════════════════════════════════════
// src/hooks/useAppointments.js
// CRUD по таблице appointments для одного питомца (S2.2 K1, без UI).
// Список: будущие приёмы сверху по возрастанию (ближайший первым),
// прошедшие ниже по убыванию (самый недавний первым).
// RLS на сервере (владелец через pet_id→pets.owner_id). Некритично:
// нет petId или ошибка → пустой список.
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

const COLUMNS = 'id, pet_id, clinic_id, clinic_name, reason, requested_at, status, source, created_at';

export function useAppointments(petId) {
  const [appointments, setAppointments] = useState([]);
  const [future, setFuture] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!petId) { setAppointments([]); setFuture([]); setPast([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('appointments')
        .select(COLUMNS)
        .eq('pet_id', petId);
      if (err) throw err;

      const now = new Date();
      const rows = data || [];
      const fut = rows
        .filter((a) => a.requested_at && new Date(a.requested_at) >= now)
        .sort((a, b) => new Date(a.requested_at) - new Date(b.requested_at)); // ближайший первым
      const pst = rows
        .filter((a) => !a.requested_at || new Date(a.requested_at) < now)
        .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at)); // недавний первым

      setFuture(fut);
      setPast(pst);
      setAppointments([...fut, ...pst]);
    } catch (e) {
      console.warn('useAppointments: load failed (non-critical):', e?.message);
      setError(e?.message || 'load failed');
      setAppointments([]); setFuture([]); setPast([]);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Создание заявки на приём (status='requested', source='app').
  const create = useCallback(async ({ clinic_name, reason, requested_at }) => {
    if (!petId) throw new Error('No pet selected');
    const { data, error: err } = await supabase
      .from('appointments')
      .insert({
        pet_id: petId,
        clinic_name: clinic_name || null,
        reason: reason || null,
        requested_at,
        status: 'requested',
        source: 'app',
      })
      .select()
      .single();
    if (err) throw err;
    await load();
    return data;
  }, [petId, load]);

  // Смена статуса (напр. 'cancelled').
  const updateStatus = useCallback(async (id, status) => {
    const { error: err } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    if (err) throw err;
    await load();
  }, [load]);

  const remove = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);
    if (err) throw err;
    await load();
  }, [load]);

  return { appointments, future, past, loading, error, refetch: load, create, updateStatus, remove };
}
