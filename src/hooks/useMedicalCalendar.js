// ══════════════════════════════════════════════════════════════
// src/hooks/useMedicalCalendar.js
// Read-only агрегатор событий Medical Hub по датам (S1, без UI).
// Мёржит 4 существующих источника в:
//   itemsByDate  — { 'YYYY-MM-DD': [event, ...] }  (для agenda дня)
//   markedDates  — формат react-native-calendars (multi-dot, для маркеров)
// Некритично: нет petId или ошибка запроса → пустые структуры, экран работает.
// ══════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

const EMPTY = { itemsByDate: {}, markedDates: {} };

// Цвета точек по типу события (на базе акцента #6B4EFF).
const DOT_COLORS = {
  record:       '#6B4EFF',
  prescription: '#22C55E',
  vaccine:      '#F59E0B',
  reminder:     '#3B82F6',
  appointment:  '#EC4899',
};

// 'YYYY-MM-DD' из date/timestamp-строки БД.
const ymd = (d) => (d ? String(d).slice(0, 10) : null);

// Локальный 'YYYY-MM-DD' из объекта Date.
const toLocalYMD = (dt) => {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Перечисление дней [start..end] включительно с предохранителем от переполнения.
function daysBetween(start, end, cap = 366) {
  const out = [];
  const last = new Date(`${end}T00:00:00`);
  const cur = new Date(`${start}T00:00:00`);
  if (isNaN(cur) || isNaN(last) || last < cur) return out;
  let i = 0;
  while (cur <= last && i < cap) {
    out.push(toLocalYMD(cur));
    cur.setDate(cur.getDate() + 1);
    i += 1;
  }
  return out;
}

export function useMedicalCalendar(petId) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!petId) { setData(EMPTY); return; }
    setLoading(true);
    try {
      const [recRes, rxRes, vacRes, remRes, apptRes] = await Promise.all([
        supabase
          .from('medical_records')
          .select('id, occurred_at, record_type, diagnosis, vet_name, clinic_name')
          .eq('pet_id', petId)
          .in('record_type', ['visit', 'procedure', 'lab_test', 'parasite_treatment', 'other'])
          .not('occurred_at', 'is', null),
        supabase
          .from('record_prescriptions')
          .select('id, name, dose, start_date, end_date, active')
          .eq('pet_id', petId)
          .eq('active', true),
        supabase
          .from('record_vaccines')
          .select('id, vaccine_name, next_due_date')
          .eq('pet_id', petId)
          .not('next_due_date', 'is', null),
        supabase
          .from('reminders')
          .select('id, title, reminder_type, due_date')
          .eq('pet_id', petId)
          .eq('is_completed', false)
          .not('due_date', 'is', null),
        supabase
          .from('appointments')
          .select('id, clinic_name, reason, requested_at')
          .eq('pet_id', petId)
          .neq('status', 'cancelled')
          .not('requested_at', 'is', null),
      ]);

      const itemsByDate = {};
      const marks = {}; // date -> Set<type> (дедуп точек по типу)

      const pushItem = (date, ev) => {
        if (!date) return;
        (itemsByDate[date] = itemsByDate[date] || []).push(ev);
      };
      const pushMark = (date, type) => {
        if (!date) return;
        (marks[date] = marks[date] || new Set()).add(type);
      };

      // 1) Записи (прошедшие) — medical_records.occurred_at
      (recRes.data || []).forEach((r) => {
        const date = ymd(r.occurred_at);
        const title = r.diagnosis || r.vet_name || r.clinic_name || '';
        pushItem(date, { date, type: 'record', title, recordId: r.id });
        pushMark(date, 'record');
      });

      // 2) Лекарства (активные курсы) — agenda по дням, маркер только на start/end
      (rxRes.data || []).forEach((p) => {
        const start = ymd(p.start_date);
        const end = ymd(p.end_date);
        if (!start) return;
        const range = end ? daysBetween(start, end) : [start];
        range.forEach((d) =>
          pushItem(d, { date: d, type: 'prescription', title: p.name || '', refId: p.id })
        );
        // Маркеры — только границы курса, чтобы не залить календарь сплошными точками.
        pushMark(start, 'prescription');
        if (end) pushMark(end, 'prescription');
      });

      // 3) Вакцины (предстоящая ревакцинация) — record_vaccines.next_due_date
      (vacRes.data || []).forEach((v) => {
        const date = ymd(v.next_due_date);
        pushItem(date, { date, type: 'vaccine', title: v.vaccine_name || '', refId: v.id });
        pushMark(date, 'vaccine');
      });

      // 4) Напоминания — reminders.due_date
      (remRes.data || []).forEach((r) => {
        const date = ymd(r.due_date);
        pushItem(date, { date, type: 'reminder', title: r.title || '', refId: r.id });
        pushMark(date, 'reminder');
      });

      // 5) Записи к врачу — appointments.requested_at
      (apptRes.data || []).forEach((a) => {
        const date = ymd(a.requested_at);
        pushItem(date, { date, type: 'appointment', title: a.clinic_name || a.reason || '', refId: a.id });
        pushMark(date, 'appointment');
      });

      // markedDates для react-native-calendars (multi-dot).
      const markedDates = {};
      Object.keys(marks).forEach((date) => {
        const dots = Array.from(marks[date]).map((type) => ({ key: type, color: DOT_COLORS[type] }));
        markedDates[date] = { marked: true, dots };
      });

      setData({ itemsByDate, markedDates });
    } catch (e) {
      console.warn('useMedicalCalendar: load failed (non-critical):', e?.message);
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return { ...data, loading, refetch: load };
}
