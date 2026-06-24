// ══════════════════════════════════════════════════════════════
// src/utils/medicalExportHtml.js
// Сборка HTML-строки медкарты для expo-print (MVP: только текст, без картинок).
// Метки разделов/полей локализованы через t (ns medical); вес — через formatWeight
// в выбранной единице. Цвета приходят параметром colors (light-токены темы),
// т.к. это генератор HTML-строки (useTheme недоступен) — PDF всегда светлый.
// ══════════════════════════════════════════════════════════════

import { formatWeight } from './formatWeight';

// Экранирование пользовательских значений в HTML.
const esc = (v) =>
  v == null
    ? ''
    : String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function buildMedicalExportHtml(data, { unit = 'kg', lang = 'en', t, colors = {} }) {
  // Цвета PDF — light-токены темы, прокинутые вызывающей стороной (см. MedicalScreen).
  const { accent, text, text2, muted, faint, line, danger, dangerBg } = colors;
  const isRu = (lang || 'en').startsWith('ru');
  const locale = isRu ? 'ru-RU' : 'en-US';
  const sec = (k) => esc(t(`export.sections.${k}`));
  const fld = (k) => esc(t(`export.fields.${k}`));
  const DASH = t('export.fields.none', { defaultValue: '—' });

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const recordTypeLabel = (rt) => esc(t(`recordTypes.${rt}`, { defaultValue: rt }));

  const pet = data.pet || {};

  // Строка «метка: значение» (пропускается, если значение пусто).
  const kv = (label, value) =>
    value == null || value === ''
      ? ''
      : `<div class="kv"><span class="k">${esc(label)}:</span> <span class="v">${esc(value)}</span></div>`;

  // ── Шапка / паспорт ──
  const ageOrBirth = pet.birth_date ? fmtDate(pet.birth_date) : '';
  const petWeight = pet.weight != null ? formatWeight(pet.weight, unit) : '';
  const header = `
    <h1 class="petName">${esc(pet.name || DASH)}</h1>
    <div class="subtitle">${[esc(pet.species), esc(pet.breed)].filter(Boolean).join(' · ')}</div>
    <div class="card">
      <h2>${sec('passport')}</h2>
      ${kv(fld('gender'), pet.gender)}
      ${kv(fld('birthDate'), ageOrBirth)}
      ${kv(fld('weight'), petWeight)}
      ${kv(fld('bloodType'), pet.blood_type)}
      ${kv(fld('microchip'), pet.microchip)}
      ${kv(fld('context'), pet.pet_context)}
    </div>`;

  // ── Аллергии (выделены) ──
  const allergiesHtml = (data.allergies || []).length
    ? `<div class="card alert">
        <h2>${sec('allergies')}</h2>
        ${data.allergies
          .map((a) => {
            const head = a.severity ? `${esc(a.substance)} [${esc(a.severity)}]` : esc(a.substance);
            const parts = [a.reaction, a.noted_on ? fmtDate(a.noted_on) : ''].filter(Boolean).map(esc).join(' · ');
            return `<div class="row"><b>${head}</b>${parts ? ` — ${parts}` : ''}</div>`;
          })
          .join('')}
      </div>`
    : '';

  // ── Хронические заболевания ──
  const conditionsHtml = (data.conditions || []).length
    ? `<div class="card">
        <h2>${sec('conditions')}</h2>
        ${data.conditions
          .map((c) => {
            const head = c.code ? `${esc(c.condition)} (${esc(c.code)})` : esc(c.condition);
            const parts = [
              c.since_date ? `${fld('since')}: ${fmtDate(c.since_date)}` : '',
              c.notes || '',
            ].filter(Boolean).map(esc).join(' · ');
            return `<div class="row"><b>${head}</b>${parts ? ` — ${parts}` : ''}</div>`;
          })
          .join('')}
      </div>`
    : '';

  // ── Вакцины ──
  const vaccinesHtml = (data.vaccines || []).length
    ? `<div class="card">
        <h2>${sec('vaccines')}</h2>
        ${data.vaccines
          .map((v) => {
            const parts = [
              v.date_given ? fmtDate(v.date_given) : '',
              v.next_due_date ? `${fld('nextDue')}: ${fmtDate(v.next_due_date)}` : '',
            ].filter(Boolean).map(esc).join(' · ');
            return `<div class="row"><b>${esc(v.vaccine_name || DASH)}</b>${parts ? ` — ${parts}` : ''}</div>`;
          })
          .join('')}
      </div>`
    : '';

  // ── Активные лекарства ──
  const medsHtml = (data.medications || []).length
    ? `<div class="card">
        <h2>${sec('medications')}</h2>
        ${data.medications
          .map((m) => {
            const parts = [
              m.dose ? `${fld('dose')}: ${esc(m.dose)}` : '',
              m.frequency ? `${fld('frequency')}: ${esc(m.frequency)}` : '',
            ].filter(Boolean).join(' · ');
            return `<div class="row"><b>${esc(m.name || DASH)}</b>${parts ? ` — ${parts}` : ''}</div>`;
          })
          .join('')}
      </div>`
    : '';

  // ── Медзаписи с деталями ──
  const recChild = (title, rows, render) =>
    (rows || []).length ? `<div class="child"><span class="ct">${esc(title)}:</span> ${rows.map(render).join(', ')}</div>` : '';

  const recordsHtml = (data.records || []).length
    ? `<div class="card">
        <h2>${sec('records')}</h2>
        ${data.records
          .map((r) => {
            const date = r.occurred_at ? fmtDate(r.occurred_at) : '';
            const meta = [date, recordTypeLabel(r.record_type)].filter(Boolean).join(' · ');
            const info = [
              r.vet_name ? `${fld('vet')}: ${esc(r.vet_name)}` : '',
              r.clinic_name ? esc(r.clinic_name) : '',
              r.diagnosis ? `${fld('diagnosis')}: ${esc(r.diagnosis)}` : '',
              r.recommendations ? `${fld('recommendations')}: ${esc(r.recommendations)}` : '',
            ].filter(Boolean).map((x) => `<div class="kv">${x}</div>`).join('');
            const children =
              recChild(sec('vaccines'), r.vaccines, (v) => esc(v.vaccine_name)) +
              recChild(sec('medications'), r.prescriptions, (p) => esc(p.name)) +
              recChild('Lab', r.labs, (l) => esc(l.test_type || l.name)) +
              recChild('Parasite', r.parasites, (p) => esc(p.product || p.kind));
            return `<div class="record"><div class="rmeta">${meta}</div>${info}${children}</div>`;
          })
          .join('')}
      </div>`
    : '';

  // ── История веса ──
  const weightHtml = (data.weight || []).length
    ? `<div class="card">
        <h2>${sec('weight')}</h2>
        ${data.weight
          .map((w) => `<div class="row">${esc(fmtDate(w.measured_at))} — <b>${esc(formatWeight(w.weight, unit))}</b>${w.notes ? ` · ${esc(w.notes)}` : ''}</div>`)
          .join('')}
      </div>`
    : '';

  const generated = `${esc(t('export.fields.generated', { defaultValue: 'Generated' }))}: ${esc(
    new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
  )}`;

  return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: ${text}; margin: 24px; }
  .petName { color: ${accent}; font-size: 26px; margin: 0 0 2px; }
  .subtitle { color: ${muted}; font-size: 14px; margin-bottom: 16px; }
  h2 { font-size: 15px; color: ${accent}; margin: 0 0 8px; border-bottom: 2px solid ${accent}; padding-bottom: 4px; }
  .card { border: 1px solid ${line}; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
  .card.alert { border-color: ${danger}; background: ${dangerBg}; }
  .card.alert h2 { color: ${danger}; border-bottom-color: ${danger}; }
  .row { font-size: 13px; padding: 3px 0; }
  .kv { font-size: 13px; padding: 2px 0; }
  .kv .k { color: ${muted}; }
  .record { padding: 8px 0; border-top: 1px solid ${line}; }
  .record:first-of-type { border-top: none; }
  .rmeta { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
  .child { font-size: 12px; color: ${text2}; margin-top: 3px; }
  .child .ct { color: ${muted}; }
  .footer { color: ${faint}; font-size: 11px; margin-top: 12px; text-align: right; }
</style>
</head>
<body>
  ${header}
  ${allergiesHtml}
  ${conditionsHtml}
  ${vaccinesHtml}
  ${medsHtml}
  ${recordsHtml}
  ${weightHtml}
  <div class="footer">${generated}</div>
</body>
</html>`;
}
