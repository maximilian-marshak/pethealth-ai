// ══════════════════════════════════════════════════════════════
// src/utils/weightHelpers.js
// Чистые хелперы динамики веса (без React). Зеркало логики PassportView
// (getChartData / getWeightTrend) — вынесено для переиспользования в
// Activity → «Сводка». База хранения — кг; отображение через convertWeight.
// PassportView пока НЕ переведён на этот util (отдельный DRY-коммит позже).
// ══════════════════════════════════════════════════════════════

import { convertWeight } from './formatWeight';

// Короткая дата метки столбика: «D/M».
function shortDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// Данные бар-чарта веса. history — строки weight_history (новые первыми, как
// грузит loadWeightHistory). Берём последние 8 в хронологии, только числовые.
// Возвращает { points: [{ value, label }], min, max } в единице отображения,
// либо null если точек < 2 или все значения равны (вырожденный диапазон).
export function buildWeightChart(history, unit = 'kg') {
  if (!Array.isArray(history)) return null;
  const sorted = [...history].reverse().slice(-8); // хронологический порядок, последние 8
  const valid = sorted.filter((w) => Number.isFinite(Number(w.weight)));
  if (valid.length < 2) return null;

  const points = valid.map((w) => ({
    value: convertWeight(Number(w.weight), unit),
    label: shortDate(w.measured_at),
  }));
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return null; // диапазон 0 → нечего рисовать

  return { points, min, max };
}

// Тренд веса по сырым кг (history новыми первыми). { type, diff } | null.
// diff — в КГ (сырой); форматирование/конвертацию делает UI (convertWeight).
export function weightTrend(history) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const latest = Number(history[0].weight);
  const prev = Number(history[1].weight);
  if (!Number.isFinite(latest) || !Number.isFinite(prev)) return null;

  const diff = latest - prev;
  if (Math.abs(diff) < 0.05) return { type: 'stable', diff: 0 };
  return diff > 0 ? { type: 'up', diff } : { type: 'down', diff };
}
