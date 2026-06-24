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

// Уведомить все компоненты об изменении стора
function _notify() {
  _store.listeners.forEach(fn => fn({ ..._store }));
}

// ─── FETCH ──────────────────────────────────────────────────
async function _fetchPoints(userId, { silent = false } = {}) {
  const fetchId = ++_store.fetchCount; // уникальный ID этого запроса

  // silent=true — фоновая сверка после insert/realtime: не трогаем loading,
  // чтобы не моргать спиннером и не сбрасывать оптимистичное значение.
  if (!silent) {
    _store.loading = true;
    _store.error   = null;
    _notify();
  }

  try {
    // Баланс считает сервер (RPC по auth.uid()), а не клиент через SUM.
    const { data, error } = await supabase.rpc('get_points_balance');

    // Устаревший запрос — игнорируем
    if (fetchId !== _store.fetchCount) {
      console.log(`⚡ Fetch #${fetchId} stale — skipping`);
      return;
    }

    if (error) throw error;

    _store.points  = data ?? 0;
    _store.loading = false;
    console.log(`✅ Balance fetched: ${_store.points}`);

  } catch (err) {
    if (fetchId !== _store.fetchCount) return;
    console.error('❌ fetchPoints:', err.message);
    _store.error   = err.message;
    _store.points  = 0;
    _store.loading = false;
  }

  _notify();
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
        // Realtime-событие (в т.ч. из другой сессии/устройства того же юзера).
        // Делаем авторитетный тихий refetch — идемпотентно, не двоит с
        // оптимистичным балансом из awardEvent.
        console.log('🔔 Realtime INSERT on user_points — refetch');
        _fetchPoints(userId, { silent: true });
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

  // Начисление только через сервер: RPC award_points идемпотентно по dedup_key,
  // капы/потолок проверяет сервер. Клиент НЕ пишет в user_points напрямую.
  const awardEvent = useCallback(async (eventKey, dedupKey, { sourceType = 'app' } = {}) => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase.rpc('award_points', {
        p_user_id:     user.id,
        p_event_key:   eventKey,
        p_dedup_key:   dedupKey,
        p_source_type: sourceType,
      });
      if (error) throw error;

      // Начислено — оптимистично выставляем авторитетный баланс из ответа.
      if (data?.awarded) {
        _store.points = data.new_balance ?? _store.points;
        _notify();
      }
      return data;
    } catch (err) {
      console.error('❌ awardEvent:', err.message);
      return null;
    }
  }, [user?.id]);

  return {
    ...state,
    balance: state.points,   // алиас для потребителей, ожидающих `balance`
    refresh,
    refreshPoints: refresh,  // алиас для потребителей, ожидающих `refreshPoints`
    awardEvent,
  };
}
