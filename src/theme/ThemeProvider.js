// ══════════════════════════════════════════════════════════════════════════════
// src/theme/ThemeProvider.js
// ThemeProvider + useTheme(). Источник схемы: useColorScheme() (RN) + ручной
// override (system/light/dark) и выбор акцентного пресета (mint/peach/blue),
// persist в AsyncStorage. Дефолт — следовать системе, акцент mint.
//
// Persist реализован синглтоном + listeners (по образцу useUnits), чтобы
// сеттеры работали из любого экрана; контекст пробрасывает активные токены
// в дерево (включая splash и NavigationContainer в App.js).
// ══════════════════════════════════════════════════════════════════════════════

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildTheme, ACCENT_PRESETS, DEFAULT_MODE, DEFAULT_ACCENT } from './theme';

const MODE_KEY   = '@pethealth_theme_mode';    // 'system' | 'light' | 'dark'
const ACCENT_KEY = '@pethealth_theme_accent';  // 'mint' | 'peach' | 'blue'

// ─── Синглтон состояния выбора темы (mode/accent) + listeners ─────────────────
const _store = { mode: DEFAULT_MODE, accent: DEFAULT_ACCENT, loaded: false, listeners: new Set() };
const _notify = () => _store.listeners.forEach((fn) => fn());

async function _load() {
  if (_store.loaded) return;
  try {
    const [m, a] = await Promise.all([
      AsyncStorage.getItem(MODE_KEY),
      AsyncStorage.getItem(ACCENT_KEY),
    ]);
    if (m === 'system' || m === 'light' || m === 'dark') _store.mode = m;
    if (a && ACCENT_PRESETS[a]) _store.accent = a;
  } catch (_) { /* оставляем дефолты */ }
  _store.loaded = true;
  _notify();
}

export async function setThemeMode(mode) {
  const m = (mode === 'system' || mode === 'light' || mode === 'dark') ? mode : DEFAULT_MODE;
  _store.mode = m;
  _notify();
  try { await AsyncStorage.setItem(MODE_KEY, m); }
  catch (e) { console.warn('ThemeProvider: persist mode failed:', e?.message); }
}

export async function setThemeAccent(accent) {
  const a = ACCENT_PRESETS[accent] ? accent : DEFAULT_ACCENT;
  _store.accent = a;
  _notify();
  try { await AsyncStorage.setItem(ACCENT_KEY, a); }
  catch (e) { console.warn('ThemeProvider: persist accent failed:', e?.message); }
}

// ─── Контекст ─────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();                 // 'light' | 'dark' | null
  const [mode, setMode]     = useState(_store.mode);
  const [accent, setAccent] = useState(_store.accent);

  useEffect(() => {
    const fn = () => { setMode(_store.mode); setAccent(_store.accent); };
    _store.listeners.add(fn);
    _load();
    fn(); // синхронизируемся с уже загруженным значением
    return () => { _store.listeners.delete(fn); };
  }, []);

  // Активная схема: override либо системная (фолбэк light).
  const scheme = mode === 'system' ? (systemScheme || 'light') : mode;
  const theme = buildTheme(scheme, accent);

  const value = {
    theme,                 // активный объект токенов
    mode,                  // 'system' | 'light' | 'dark'
    accent,                // 'mint' | 'peach' | 'blue'
    scheme,                // фактическая схема ('light' | 'dark')
    setMode: setThemeMode,
    setAccent: setThemeAccent,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Фолбэк вне провайдера: статичная light+mint, безопасные no-op сеттеры.
    return {
      theme: buildTheme('light', 'mint'),
      mode: DEFAULT_MODE, accent: DEFAULT_ACCENT, scheme: 'light',
      setMode: setThemeMode, setAccent: setThemeAccent,
    };
  }
  return ctx;
}
