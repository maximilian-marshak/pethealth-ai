// ══════════════════════════════════════════════════════════════════════════════
// src/theme/theme.js
// Источник правды по дизайну (Redesign, Фаза 1). Токены тем light + dark — оба
// first-class — плюс акцентные пресеты (mint/peach/blue).
//
// ИСТОЧНИК ЗНАЧЕНИЙ:
//  • spec    — зафиксировано в PetHealthAI_visual_foundation.md / CLAUDE.md:
//              accent mint (#56B89F light / #6FCBB2 dark), ok/warn/danger,
//              набор токенов и радиусы.
//  • derived — выведено здесь из spec-якорей по конвенциям дизайн-системы
//              (accentPress/accentTint, surfaces, t1..t4, peach/blue, тени).
//              ⚠️ Свериться с visual_foundation при появлении файла в репо.
// ══════════════════════════════════════════════════════════════════════════════

// ─── Радиусы (spec) ───────────────────────────────────────────────────────────
export const radii = { sm12: 12, md16: 16, lg24: 24, xl28: 28, pill999: 999 };

// ─── Шрифт (Nunito, Фаза 1b) ──────────────────────────────────────────────────
// Значения = семейства, зарегистрированные в useFonts (App.js). Веса по
// visual_foundation: 400 тело / 500 акценты / 700 заголовки-метрики (+600 SemiBold).
// Едины для обеих тем. Использовать как fontFamily в компонентах (примитивы Фазы 3).
export const font = {
  regular:  'Nunito-Regular',   // 400
  medium:   'Nunito-Medium',    // 500
  semibold: 'Nunito-SemiBold',  // 600
  bold:     'Nunito-Bold',      // 700
};

// ─── Семантика здоровья (spec) — отдельно от акцента, общая для обеих тем ──────
const semantic = { ok: '#2EA567', warn: '#E8A93C', danger: '#E2574C' };

// ─── Акцентные пресеты ────────────────────────────────────────────────────────
// accent — основной; accentPress — нажатое; accentTint — подложка.
// mint — канон (visual_foundation). peach/blue — derived (калибровать на бренде).
export const ACCENT_PRESETS = {
  mint: { // spec
    light: { accent: '#56B89F', accentPress: '#3E9C84', accentTint: '#E0F2EC' },
    dark:  { accent: '#6FCBB2', accentPress: '#56B89F', accentTint: 'rgba(86,184,159,0.18)' },
  },
  peach: { // derived, калибровать на финальном бренде
    light: { accent: '#EC8C69', accentPress: '#D2734F', accentTint: '#FBE6DC' },
    dark:  { accent: '#F2A07B', accentPress: '#DB8763', accentTint: 'rgba(242,160,123,0.18)' },
  },
  blue: { // derived, калибровать на финальном бренде
    light: { accent: '#4F8DF0', accentPress: '#3A74D1', accentTint: '#E2ECFC' },
    dark:  { accent: '#6BA1F5', accentPress: '#5587DC', accentTint: 'rgba(107,161,245,0.18)' },
  },
};

// Канон glow: `0 0 30px rgba(86,184,159,0.32)`. Раскладка в RN-тень цветом accent
// (offset 0 → свечение, не дроп; shadowRadius ≈ css-blur). alpha 0.32 из канона.
const GLOW_OPACITY = 0.32;
const GLOW_RADIUS = 15; // ≈ css 30px blur

export const ACCENT_NAMES = Object.keys(ACCENT_PRESETS); // ['mint','peach','blue']

// ─── Базовые поверхности/текст по схеме (derived из мятной spec-палитры) ───────
const lightBase = {
  scheme: 'light',
  ...semantic,
  // поверхности (spec, кроме помеченного derived)
  bg: '#FBFEFD',                                 // derived: солид-фон ≈ светлый стоп градиента
  bgGradient: ['#E0F2EC', '#FBFEFD'],            // spec: стопы bg-градиента
  surface: '#FFFFFF',                            // spec: solid-поверхность
  // decor-стекло (полупрозрачное) — поля доступны GlassCard (Фаза 3)
  surfaceGlass: { bg: 'rgba(255,255,255,0.30)', blur: 34, saturate: 1.9, border: 'rgba(255,255,255,0.65)' }, // spec
  // data-стекло (плотное/читаемое)
  surfaceGlassData: { bg: 'rgba(255,255,255,0.62)', blur: 24, saturate: 1.4 }, // spec
  hairline: 'rgba(0,0,0,0.06)',                  // spec
  // текст t1 (основной) … t4 (плейсхолдер) + on-accent — spec (visual_foundation §2.3)
  t1: '#1A1A2E', t2: '#4A4A5C', t3: '#8A8A99', t4: '#B5B5C0', onAccent: '#FFFFFF', // spec
  // тень карточек (iOS shadow* + Android elevation) — derived
  shadow: { shadowColor: '#0B1F1A', shadowOpacity: 0.10, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 }, // derived
};

const darkBase = {
  scheme: 'dark',
  ...semantic,
  bg: '#0F1117',                                 // derived: солид-фон ≈ тёмный стоп градиента
  bgGradient: ['#14141C', '#0F1117'],            // spec
  surface: '#1E1E28',                            // spec
  surfaceGlass: { bg: 'rgba(38,42,56,0.34)', blur: 34, border: 'rgba(255,255,255,0.14)' }, // spec (saturate не задан каноном)
  surfaceGlassData: { bg: 'rgba(30,33,44,0.66)', blur: 24 }, // spec
  hairline: 'rgba(255,255,255,0.08)',            // spec
  t1: '#F2F2F7', t2: '#B0B0BC', t3: '#7A7A88', t4: '#55555F', onAccent: '#FFFFFF', // spec
  shadow: { shadowColor: '#000000', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 }, // derived
};

// ─── Сборка активной темы: схема (light/dark) + акцентный пресет ───────────────
export function buildTheme(scheme = 'light', accentName = 'mint') {
  const base = scheme === 'dark' ? darkBase : lightBase;
  const preset = ACCENT_PRESETS[accentName] || ACCENT_PRESETS.mint;
  const ac = preset[scheme];
  return {
    ...base,
    ...ac,              // accent, accentPress, accentTint
    radii,
    font,               // Nunito-семейства (одинаковы для light/dark)
    // свечение акцента — канон `0 0 30px rgba(accent,0.32)` (offset 0)
    glowAccent: {
      shadowColor: ac.accent,
      shadowOpacity: GLOW_OPACITY,
      shadowRadius: GLOW_RADIUS,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
  };
}

// Предсобранные дефолты (системная схема + mint) — для статических импортов.
export const themes = {
  light: buildTheme('light', 'mint'),
  dark: buildTheme('dark', 'mint'),
};

export const DEFAULT_MODE = 'system';   // 'system' | 'light' | 'dark'
export const DEFAULT_ACCENT = 'mint';   // 'mint' | 'peach' | 'blue'
