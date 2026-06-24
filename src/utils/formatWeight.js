// ══════════════════════════════════════════════════════════════
// src/utils/formatWeight.js
// Единый хелпер форматирования веса. База хранения — КИЛОГРАММЫ
// (в БД weight + weight_unit, запись всегда в kg по умолчанию), поэтому
// принимаем valueKg и конвертируем в выбранную единицу отображения.
// Подпись единицы локализуется через i18n (profile:units.<unit>).
// Данные в БД не меняются — только отображение.
// ══════════════════════════════════════════════════════════════

import i18n from './i18n';

const KG_TO_LB = 2.20462;

// Конвертация хранимого веса (база — кг) в единицу отображения. Число | null.
export function convertWeight(valueKg, unit = 'kg') {
  const n = Number(valueKg);
  if (!Number.isFinite(n)) return null;
  return unit === 'lb' ? n * KG_TO_LB : n;
}

// Округлённое значение веса как строка (без подписи). '' если невалидно.
export function formatWeightValue(valueKg, unit = 'kg') {
  const c = convertWeight(valueKg, unit);
  return c == null ? '' : String(Math.round(c * 10) / 10);
}

// Локализованная подпись единицы ('kg'/'lb' → kg/кг, lb/фунт).
export function unitLabel(unit = 'kg') {
  return i18n.t(`profile:units.${unit}`, { defaultValue: unit });
}

// Полная строка: значение + локализованная подпись (напр. «12.5 кг»). '' если невалидно.
export function formatWeight(valueKg, unit = 'kg') {
  const v = formatWeightValue(valueKg, unit);
  if (!v) return '';
  return `${v} ${unitLabel(unit)}`;
}
