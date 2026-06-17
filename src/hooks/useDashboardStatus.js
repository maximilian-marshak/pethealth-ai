// ══════════════════════════════════════════════════
// src/hooks/useDashboardStatus.js
// ══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const getVaccinationStatus = (nextDueDate) => {
  const today = new Date();
  const due = new Date(nextDueDate);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'soon';
  return 'ok';
};

export const useDashboardStatus = (petId) => {
  const [status, setStatus] = useState({
    vaccination: null,
    doctorVisit: null,
    parasites: null,
    biometry: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!petId) {
      setStatus({
        vaccination: null,
        doctorVisit: null,
        parasites: null,
        biometry: null,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [vaccinationRes, doctorVisitRes, parasitesRes, biometryRes] =
        await Promise.all([

          // 1. Ближайшая вакцинация (не завершённая)
          supabase
            .from('vaccinations')
            .select('vaccine_name, next_due_date')
            .eq('pet_id', petId)
            .eq('is_completed', false)
            .not('next_due_date', 'is', null)
            .order('next_due_date', { ascending: true })
            .limit(1)
            .maybeSingle(),

          // 2. Следующий визит к врачу из reminders
          supabase
            .from('reminders')
            .select('title, due_date, reminder_type')
            .eq('pet_id', petId)
            .eq('is_completed', false)
            .in('reminder_type', ['checkup', 'vet_visit'])
            .gte('due_date', new Date().toISOString())
            .order('due_date', { ascending: true })
            .limit(1)
            .maybeSingle(),

          // 3. Последняя обработка от паразитов
          supabase
            .from('medical_records')
            .select('title, date, description')
            .eq('pet_id', petId)
            .eq('record_type', 'parasite_treatment')
            .order('date', { ascending: false })
            .limit(1)
            .maybeSingle(),

          // 4. История веса — последние 2 записи
          // Двойная сортировка: сначала по дате измерения, потом по дате создания
          // чтобы корректно обрабатывать несколько записей в один день
          supabase
            .from('weight_history')
            .select('weight, weight_unit, measured_at, created_at')
            .eq('pet_id', petId)
            .order('measured_at', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(2),
        ]);

      // ── Vaccination ──────────────────────────────
      const vaccination = vaccinationRes.data
        ? {
            name: vaccinationRes.data.vaccine_name,
            dueDate: new Date(vaccinationRes.data.next_due_date),
            status: getVaccinationStatus(vaccinationRes.data.next_due_date),
          }
        : null;

      // ── Doctor Visit ─────────────────────────────
      const doctorVisit = doctorVisitRes.data
        ? {
            title: doctorVisitRes.data.title,
            dueDate: new Date(doctorVisitRes.data.due_date),
          }
        : null;

      // ── Parasites ────────────────────────────────
      const parasites = parasitesRes.data
        ? {
            title: parasitesRes.data.title,
            date: new Date(parasitesRes.data.date),
            description: parasitesRes.data.description,
          }
        : null;

      // ── Biometry ─────────────────────────────────
      let biometry = null;
      const weightData = biometryRes.data;

      if (weightData && weightData.length > 0) {
        const latest   = weightData[0];
        const previous = weightData.length > 1 ? weightData[1] : null;

        const currentWeight = parseFloat(latest.weight);
        const prevWeight    = previous ? parseFloat(previous.weight) : null;

        let diff           = null;
        let trend          = 'stable';
        let previousWeight = null;

        if (
          prevWeight !== null &&
          !isNaN(prevWeight) &&
          !isNaN(currentWeight)
        ) {
          const rawDiff = parseFloat((currentWeight - prevWeight).toFixed(2));
          previousWeight = prevWeight;

          if (rawDiff > 0.009) {
            diff  = rawDiff;
            trend = 'up';
          } else if (rawDiff < -0.009) {
            diff  = rawDiff;
            trend = 'down';
          } else {
            diff  = 0;
            trend = 'stable';
          }
        }

        biometry = {
          weight:        currentWeight,
          unit:          latest.weight_unit || 'kg',
          measuredAt:    new Date(latest.measured_at),
          previousWeight,
          diff,
          trend,
          isFirst: previous === null,
        };
      }

      setStatus({ vaccination, doctorVisit, parasites, biometry });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { status, loading, error, refetch: fetchStatus };
};
