// ══════════════════════════════════════════════════
// src/hooks/useLoyaltyPoints.js
// ══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export function useLoyaltyPoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ═══ FETCH POINTS (SUM ALL TRANSACTIONS) ═══
  const fetchPoints = useCallback(async () => {
    if (!user?.id) {
      setPoints(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ ИСПРАВЛЕНО: получаем ВСЕ записи и суммируем
      const { data, error: fetchError } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // ✅ Суммируем все транзакции
      const totalPoints = data?.reduce((sum, record) => sum + (record.points || 0), 0) || 0;
      
      setPoints(totalPoints);
      console.log(`✅ Fetched points: ${totalPoints} (from ${data?.length || 0} transactions)`);
    } catch (err) {
      console.error('❌ Error fetching points:', err);
      setError(err.message);
      setPoints(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ═══ REALTIME SUBSCRIPTION ═══
  useEffect(() => {
    if (!user?.id) {
      setPoints(0);
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchPoints();

    // ✅ ИСПРАВЛЕНО: слушаем INSERT (новые транзакции)
    const subscription = supabase
      .channel('loyalty-points-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // ✅ Слушаем добавление новых записей
          schema: 'public',
          table: 'user_points',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New transaction:', payload.new);
          // При новой транзакции пересчитываем баланс
          fetchPoints();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchPoints]);

  // ═══ MANUAL REFRESH ═══
  const refresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchPoints();
  }, [fetchPoints]);

  return {
    points,
    loading,
    error,
    refresh,
  };
}
