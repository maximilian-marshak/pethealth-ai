// ══════════════════════════════════════════════════
// src/hooks/useCharity.js
// ИСПРАВЛЕНО: Добавлен shelterCount для подсчета уникальных приютов
// ══════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export function useCharity() {
  const { user } = useAuth();
  const [shelters, setShelters] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [poolAmountByn, setPoolAmountByn] = useState(null);
  const [openPeriod, setOpenPeriod] = useState(null);
  const [lifetimeDonatedState, setLifetimeDonatedState] = useState(null); // RPC get_donation_total | null (фолбэк)

  // ═══ FETCH SHELTERS ═══
  const fetchShelters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('shelters')
        .select('*')
        .eq('active', true)
        .order('city', { ascending: true });

      if (fetchError) throw fetchError;

      console.log('✅ Fetched shelters:', data?.length || 0);
      setShelters(data || []);
    } catch (err) {
      console.error('❌ Error fetching shelters:', err);
      setError(err.message);
      setShelters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ═══ FETCH USER DONATIONS ═══
  const fetchDonations = useCallback(async () => {
    if (!user?.id) {
      setDonations([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('charity_donations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      console.log('✅ Fetched donations:', data?.length || 0);
      setDonations(data || []);
    } catch (err) {
      console.error('❌ Error fetching donations:', err);
      setError(err.message);
      setDonations([]);
    }
  }, [user?.id]);

  // ═══ FETCH ACTIVE POOL (amount_byn) ═══
  // Вариант B: пул периода делится между приютами по голосам. Чтение некритично.
  const fetchPool = useCallback(async () => {
    try {
      const { data, error: poolError } = await supabase
        .from('charity_pools')
        .select('amount_byn')
        .eq('active', true)
        .maybeSingle();
      if (poolError) throw poolError;
      setPoolAmountByn(data?.amount_byn ?? null);
    } catch (err) {
      console.warn('useCharity: pool load failed (non-critical):', err?.message);
      setPoolAmountByn(null);
    }
  }, []);

  // ═══ FETCH OPEN PERIOD ═══
  const fetchOpenPeriod = useCallback(async () => {
    try {
      const { data, error: periodError } = await supabase
        .from('charity_pool_periods')
        .select('id, period_start, period_end, status')
        .eq('status', 'open')
        .maybeSingle();
      if (periodError) throw periodError;
      setOpenPeriod(data ?? null);
    } catch (err) {
      console.warn('useCharity: open period load failed (non-critical):', err?.message);
      setOpenPeriod(null);
    }
  }, []);

  // ═══ FETCH LIFETIME DONATED (точная сумма за всё время через RPC) ═══
  // Для рангов/прогрессии используем именно это; totalDonated (limit(50)) не трогаем.
  const fetchLifetimeDonated = useCallback(async () => {
    if (!user?.id) { setLifetimeDonatedState(null); return; }
    try {
      const { data, error: rpcError } = await supabase.rpc('get_donation_total');
      if (rpcError) throw rpcError;
      const n = Number(Array.isArray(data) ? data[0] : data);
      setLifetimeDonatedState(Number.isFinite(n) ? n : null);
    } catch (err) {
      // Фолбэк на totalDonated (в return), не падаем.
      console.warn('useCharity: get_donation_total failed (fallback to totalDonated):', err?.message);
      setLifetimeDonatedState(null);
    }
  }, [user?.id]);

  // ═══ CALCULATE TOTAL DONATED ═══
  const totalDonated = useMemo(() => {
    const total = donations.reduce((sum, donation) => {
      return sum + (donation.points_spent || 0);
    }, 0);
    
    console.log('💰 Total donated calculated:', total);
    return total;
  }, [donations]);

  // ═══ CALCULATE UNIQUE SHELTERS COUNT ═══
  // ✅ ДОБАВЛЕНО: Подсчет уникальных приютов, которым пользователь жертвовал
  const shelterCount = useMemo(() => {
    const uniqueShelters = new Set(
      donations
        .map((donation) => donation.shelter_name)
        .filter(Boolean) // Убираем null/undefined значения
    );
    
    const count = uniqueShelters.size;
    console.log('🏠 Unique shelters count:', count, Array.from(uniqueShelters));
    return count;
  }, [donations]);

  // ═══ MAKE DONATION (RPC CALL) ═══
  const makeDonation = useCallback(async (shelterId, points) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    console.log('🎁 Calling make_donation RPC:', {
      p_user_id: user.id,
      p_shelter_id: shelterId,
      p_points: points,
    });

    try {
      const { data, error: rpcError } = await supabase.rpc('make_donation', {
        p_user_id: user.id,
        p_shelter_id: shelterId,
        p_points: points,
      });

      if (rpcError) {
        console.error('❌ RPC error:', rpcError);
        throw rpcError;
      }

      console.log('✅ Donation successful:', data);

      // Refresh donations history
      await fetchDonations();
      await fetchLifetimeDonated();

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error making donation:', err);
      throw err;
    }
  }, [user?.id, fetchDonations, fetchLifetimeDonated]);

  // ═══ REFETCH ALL DATA ═══
  // ✅ ДОБАВЛЕНО: Единая функция для обновления всех данных (для RefreshControl)
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchShelters(),
      fetchDonations(),
      fetchPool(),
      fetchOpenPeriod(),
      fetchLifetimeDonated(),
    ]);
  }, [fetchShelters, fetchDonations, fetchPool, fetchOpenPeriod, fetchLifetimeDonated]);

  // ═══ INITIAL LOAD ═══
  useEffect(() => {
    fetchShelters();
    fetchPool();
    fetchOpenPeriod();
    if (user?.id) {
      fetchDonations();
      fetchLifetimeDonated();
    }
  }, [fetchShelters, fetchDonations, fetchPool, fetchOpenPeriod, fetchLifetimeDonated, user?.id]);

  // ═══ RETURN HOOK DATA ═══
  return {
    shelters,
    donations,
    totalDonated,     // ✅ Общая сумма всех пожертвований (по limit(50)-выборке)
    lifetimeDonated: lifetimeDonatedState != null ? lifetimeDonatedState : totalDonated, // точная сумма за всё время (RPC) с фолбэком
    shelterCount,     // ✅ ДОБАВЛЕНО: Количество уникальных приютов
    poolAmountByn,    // Вариант B: размер активного пула (BYN)
    openPeriod,       // Вариант B: открытый период распределения (или null)
    loading,
    error,
    makeDonation,
    refreshShelters: fetchShelters,
    refreshDonations: fetchDonations,
    refetch,          // ✅ ДОБАВЛЕНО: Для одновременного обновления всех данных
  };
}
