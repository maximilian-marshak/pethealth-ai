// ══════════════════════════════════════════════════════════════
// src/hooks/useUnits.js
// Пользовательская единица веса ('kg' | 'lb'), persist в AsyncStorage
// (по образцу языка). Singleton-стор + слушатели — смена в профиле сразу
// отражается на всех экранах. Дефолт — 'kg'.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UNIT_KEY = '@pethealth_weight_unit';
const DEFAULT_UNIT = 'kg';

const _store = { unit: DEFAULT_UNIT, loaded: false, listeners: new Set() };

function _notify() {
  _store.listeners.forEach((fn) => fn(_store.unit));
}

async function _load() {
  if (_store.loaded) return;
  try {
    const saved = await AsyncStorage.getItem(UNIT_KEY);
    if (saved === 'kg' || saved === 'lb') _store.unit = saved;
  } catch (_) { /* оставляем дефолт */ }
  _store.loaded = true;
  _notify();
}

export async function setWeightUnit(u) {
  if (u !== 'kg' && u !== 'lb') return;
  _store.unit = u;
  _notify();
  try {
    await AsyncStorage.setItem(UNIT_KEY, u);
  } catch (e) {
    console.warn('useUnits: persist failed:', e?.message);
  }
}

export function useUnits() {
  const [unit, setUnit] = useState(_store.unit);

  useEffect(() => {
    const fn = (u) => setUnit(u);
    _store.listeners.add(fn);
    _load();
    setUnit(_store.unit); // синхронизируемся с уже загруженным значением
    return () => { _store.listeners.delete(fn); };
  }, []);

  return { unit, setUnit: setWeightUnit };
}
