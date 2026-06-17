// ══════════════════════════════════════════════════════════════
// src/hooks/useLoyaltyPoints.js
// Singleton pattern — один канал на всё приложение
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════════
// ГЛОБАЛЬНЫЙ СТОР
// Один экземпляр на всё приложение, живёт вне React
// ═══════════════════════════════════════════════════════════════
const _store = {
  userId:      null,
  points:      0,
  loading:     true,
  error:       null,
  channel:     null,
  listeners:   new Set(),   // колбэки всех подписчиков
  fetchCount:  0,           // защита от race condition при fetch
};

// Сколько Paws начисляем за каждый тип награды.
// addPoints принимает либо строковый reward-тип, либо число.
const REWARD_POINTS = {
  training: 10,
};
const DEFAULT_REWARD_POINTS = 10;

// Уведомить все компоненты об изменении стора
function _notify() {
  _store.listeners.forEach(fn => fn({ ..._store }));
}

// ─── FETCH ──────────────────────────────────────────────────
async function _fetchPoints(userId) {
  const fetchId = ++_store.fetchCount; // уникальный ID этого запроса

  _store.loading = true;
  _store.error   = null;
  _notify();

  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId);

    // Устаревший запрос — игнорируем
    if (fetchId !== _store.fetchCount) {
      console.log(`⚡ Fetch #${fetchId} stale — skipping`);
      return;
    }

    if (error) throw error;

    _store.points  = data?.reduce((sum, r) => sum + (r.points || 0), 0) ?? 0;
    _store.loading = false;
    console.log(`✅ Points fetched: ${_store.points} (${data?.length ?? 0} rows)`);

  } catch (err) {
    if (fetchId !== _store.fetchCount) return;
    console.error('❌ fetchPoints:', err.message);
    _store.error   = err.message;
    _store.points  = 0;
    _store.loading = false;
  }

  _notify();
}

// ─── ADD POINTS ─────────────────────────────────────────────
// Начисление: пишем строку в user_points. Стор увеличится через
// realtime INSERT-handler; если канала нет — подстрахуемся refetch.
async function _addPoints(userId, points) {
  try {
    const { error } = await supabase
      .from('user_points')
      .insert([{ user_id: userId, points }]);

    if (error) throw error;

    console.log(`➕ Awarded ${points} points to ${userId.slice(0, 8)}`);
    if (!_store.channel) _fetchPoints(userId);
    return true;
  } catch (err) {
    console.error('❌ addPoints:', err.message);
    _store.error = err.message;
    _notify();
    return false;
  }
}

// ─── SUBSCRIPTION ────────────────────────────────────────────
function _ensureChannel(userId) {
  // Канал уже существует для этого пользователя — не пересоздаём
  if (_store.channel && _store.userId === userId) {
    console.log('♻️  Reusing existing channel for', userId.slice(0, 8));
    return;
  }

  // Убиваем старый канал (другой пользователь или первый запуск)
  _destroyChannel();

  _store.userId = userId;

  console.log(`📡 Creating channel for ${userId.slice(0, 8)}...`);

  _store.channel = supabase
    .channel(`loyalty-${userId}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'user_points',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const added = payload.new?.points || 0;
        console.log(`🔔 Realtime INSERT: +${added} points`);
        _store.points += added;
        _notify();
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED')    console.log('✅ Realtime SUBSCRIBED');
      if (status === 'CHANNEL_ERROR') console.error('❌ Realtime ERROR', err);
      if (status === 'TIMED_OUT')     console.warn('⏱️  Realtime TIMED_OUT');
      if (status === 'CLOSED')        console.log('🔒 Realtime CLOSED');
    });
}

function _destroyChannel() {
  if (_store.channel) {
    try {
      supabase.removeChannel(_store.channel);
    } catch (_) {}
    _store.channel = null;
    console.log('🗑️  Channel destroyed');
  }
}

// ─── ИНИЦИАЛИЗАЦИЯ / СБРОС ───────────────────────────────────
function _init(userId) {
  if (_store.userId === userId && !_store.loading && _store.points !== null) {
    console.log('♻️  Store already initialized for this user');
    return; // данные уже есть — не перегружаем
  }
  _fetchPoints(userId);
  _ensureChannel(userId);
}

function _reset() {
  _destroyChannel();
  _store.userId   = null;
  _store.points   = 0;
  _store.loading  = true;
  _store.error    = null;
  _notify();
}

// ══════════════════════════════════════════════════════════════
// HOOK — просто подписка на глобальный стор
// ══════════════════════════════════════════════════════════════
export function useLoyaltyPoints() {
  const { user } = useAuth();

  // Локальный стейт = снимок глобального стора
  const [state, setState] = useState({
    points:  _store.points,
    loading: _store.loading,
    error:   _store.error,
  });

  // Ref чтобы не закрывать старый listener в useEffect
  const listenerRef = useRef(null);

  useEffect(() => {
    // Создаём listener для этого компонента
    const listener = (snapshot) => {
      setState({
        points:  snapshot.points,
        loading: snapshot.loading,
        error:   snapshot.error,
      });
    };
    listenerRef.current = listener;
    _store.listeners.add(listener);

    if (user?.id) {
      _init(user.id);
    } else {
      _reset();
    }

    return () => {
      // Удаляем listener при размонтировании
      _store.listeners.delete(listener);

      // Уничтожаем канал только если больше нет подписчиков
      if (_store.listeners.size === 0) {
        console.log('👋 Last subscriber unmounted — destroying channel');
        _destroyChannel();
        _store.userId = null; // позволить пересоздать при следующем mount
      } else {
        console.log(`👀 ${_store.listeners.size} subscriber(s) remain — keeping channel`);
      }
    };
  }, [user?.id]);

  const refresh = useCallback(() => {
    if (user?.id) _fetchPoints(user.id);
  }, [user?.id]);

  // Принимает reward-тип (строка) или число очков; пишет в user_points.
  const addPoints = useCallback(async (rewardType, _activityType) => {
    if (!user?.id) return false;
    const points = typeof rewardType === 'number'
      ? rewardType
      : (REWARD_POINTS[rewardType] ?? DEFAULT_REWARD_POINTS);
    return _addPoints(user.id, points);
  }, [user?.id]);

  return {
    ...state,
    balance: state.points,   // алиас для потребителей, ожидающих `balance`
    refresh,
    refreshPoints: refresh,  // алиас для потребителей, ожидающих `refreshPoints`
    addPoints,
  };
}
