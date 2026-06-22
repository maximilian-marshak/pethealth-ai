// ══════════════════════════════════════════════════════════════
// src/hooks/useNotifications.js
// Кросс-pet сборщик due-событий (напоминания, вакцины, концы курсов,
// приёмы) для центра уведомлений. События ПРОИЗВОДНЫЕ — новой схемы нет.
// Read-state — в AsyncStorage (singleton + listeners, как useUnits).
// Стабильный id события: `${type}:${refId}:${ymd}`.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

const READ_KEY = '@pethealth_notifications_read';

// ── read-state singleton ──
const _read = { set: new Set(), loaded: false, listeners: new Set() };
const _notify = () => _read.listeners.forEach((fn) => fn(new Set(_read.set)));

async function _loadRead() {
  if (_read.loaded) return;
  try {
    const raw = await AsyncStorage.getItem(READ_KEY);
    if (raw) JSON.parse(raw).forEach((id) => _read.set.add(id));
  } catch (_) { /* пусто */ }
  _read.loaded = true;
  _notify();
}
async function _persist() {
  try {
    await AsyncStorage.setItem(READ_KEY, JSON.stringify([..._read.set]));
  } catch (e) {
    console.warn('useNotifications: read persist failed:', e?.message);
  }
}
export async function markNotificationRead(id) {
  if (!id || _read.set.has(id)) return;
  _read.set.add(id);
  _notify();
  await _persist();
}
export async function markNotificationsRead(ids) {
  let changed = false;
  (ids || []).forEach((id) => {
    if (id && !_read.set.has(id)) { _read.set.add(id); changed = true; }
  });
  if (changed) { _notify(); await _persist(); }
}

// ── helpers ──
const ymd = (d) => (d ? String(d).slice(0, 10) : null);
const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const list = async (query) => {
  try {
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('useNotifications: query failed (non-critical):', e?.message);
    return [];
  }
};

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readSet, setReadSet] = useState(new Set(_read.set));

  // Подписка на read-state.
  useEffect(() => {
    const fn = (s) => setReadSet(s);
    _read.listeners.add(fn);
    _loadRead();
    setReadSet(new Set(_read.set));
    return () => { _read.listeners.delete(fn); };
  }, []);

  const load = useCallback(async () => {
    const uid = user?.id;
    if (!uid) { setItems([]); return; }
    setLoading(true);
    try {
      const pets = await list(supabase.from('pets').select('id, name').eq('owner_id', uid));
      const petIds = pets.map((p) => p.id);
      const nameById = Object.fromEntries(pets.map((p) => [p.id, p.name]));
      if (!petIds.length) { setItems([]); setLoading(false); return; }

      const [reminders, vaccines, courses, appts] = await Promise.all([
        list(supabase.from('reminders').select('id, pet_id, title, reminder_type, due_date')
          .in('pet_id', petIds).eq('is_completed', false).not('due_date', 'is', null)),
        list(supabase.from('record_vaccines').select('id, pet_id, vaccine_name, next_due_date')
          .in('pet_id', petIds).not('next_due_date', 'is', null)),
        list(supabase.from('record_prescriptions').select('id, pet_id, name, end_date, active')
          .in('pet_id', petIds).eq('active', true).not('end_date', 'is', null)),
        list(supabase.from('appointments').select('id, pet_id, clinic_name, reason, requested_at, status')
          .in('pet_id', petIds).neq('status', 'cancelled').not('requested_at', 'is', null)),
      ]);

      const evs = [];
      const push = (type, petId, refId, date, title) => {
        const d = ymd(date);
        if (!d || refId == null) return;
        evs.push({ id: `${type}:${refId}:${d}`, type, petId, petName: nameById[petId] || '', title: title || '', date: d });
      };
      reminders.forEach((r) => push('reminder', r.pet_id, r.id, r.due_date, r.title));
      vaccines.forEach((v) => push('vaccine', v.pet_id, v.id, v.next_due_date, v.vaccine_name));
      courses.forEach((c) => push('course_end', c.pet_id, c.id, c.end_date, c.name));
      appts.forEach((a) => push('appointment', a.pet_id, a.id, a.requested_at, a.clinic_name || a.reason));

      evs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
      setItems(evs);
    } catch (e) {
      console.warn('useNotifications: load failed (non-critical):', e?.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const today = todayYmd();
  const upcoming = items.filter((e) => e.date >= today);
  const past = items.filter((e) => e.date < today).slice().reverse(); // недавние прошедшие первыми
  const unreadCount = items.reduce((n, e) => (readSet.has(e.id) ? n : n + 1), 0);

  const markRead = useCallback((id) => markNotificationRead(id), []);
  const markAllRead = useCallback(() => markNotificationsRead(items.map((e) => e.id)), [items]);
  const isRead = useCallback((id) => readSet.has(id), [readSet]);

  return { items, upcoming, past, unreadCount, loading, refetch: load, markRead, markAllRead, isRead };
}
