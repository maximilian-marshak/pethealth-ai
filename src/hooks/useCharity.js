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

      return { success: true, data };
    } catch (err) {
      console.error('❌ Error making donation:', err);
      throw err;
    }
  }, [user?.id, fetchDonations]);

  // ═══ REFETCH ALL DATA ═══
  // ✅ ДОБАВЛЕНО: Единая функция для обновления всех данных (для RefreshControl)
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchShelters(),
      fetchDonations(),
    ]);
  }, [fetchShelters, fetchDonations]);

  // ═══ INITIAL LOAD ═══
  useEffect(() => {
    fetchShelters();
    if (user?.id) {
      fetchDonations();
    }
  }, [fetchShelters, fetchDonations, user?.id]);

  // ═══ RETURN HOOK DATA ═══
  return {
    shelters,
    donations,
    totalDonated,     // ✅ Общая сумма всех пожертвований
    shelterCount,     // ✅ ДОБАВЛЕНО: Количество уникальных приютов
    loading,
    error,
    makeDonation,
    refreshShelters: fetchShelters,
    refreshDonations: fetchDonations,
    refetch,          // ✅ ДОБАВЛЕНО: Для одновременного обновления всех данных
  };
}
