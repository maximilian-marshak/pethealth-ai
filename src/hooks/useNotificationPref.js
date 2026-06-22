// ══════════════════════════════════════════════════════════════
// src/hooks/useNotificationPref.js
// Флаг «уведомления вкл/выкл» — persist в AsyncStorage (singleton +
// listeners, как useUnits). Дефолт — true. Реактивно на всех экранах.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREF_KEY = '@pethealth_notifications_enabled';

const _store = { enabled: true, loaded: false, listeners: new Set() };
const _notify = () => _store.listeners.forEach((fn) => fn(_store.enabled));

async function _load() {
  if (_store.loaded) return;
  try {
    const raw = await AsyncStorage.getItem(PREF_KEY);
    if (raw === 'false') _store.enabled = false;
    else if (raw === 'true') _store.enabled = true;
  } catch (_) { /* оставляем дефолт true */ }
  _store.loaded = true;
  _notify();
}

export async function setNotificationsEnabled(value) {
  const v = !!value;
  _store.enabled = v;
  _notify();
  try {
    await AsyncStorage.setItem(PREF_KEY, v ? 'true' : 'false');
  } catch (e) {
    console.warn('useNotificationPref: persist failed:', e?.message);
  }
}

export function useNotificationPref() {
  const [enabled, setEnabledState] = useState(_store.enabled);

  useEffect(() => {
    const fn = (v) => setEnabledState(v);
    _store.listeners.add(fn);
    _load();
    setEnabledState(_store.enabled);
    return () => { _store.listeners.delete(fn); };
  }, []);

  return { enabled, setEnabled: setNotificationsEnabled };
}
