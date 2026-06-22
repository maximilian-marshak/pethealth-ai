// ══════════════════════════════════════════════════════════════
// src/utils/collectMedicalExport.js
// Сбор всех данных медкарты питомца для PDF-экспорта одним проходом.
// Ошибки отдельных запросов не валят экспорт — несобранный раздел пуст.
// Дети медзаписей подтягиваются по record_id одним запросом на тип (без N+1).
// ══════════════════════════════════════════════════════════════

import { supabase } from './supabase';

const EMPTY = {
  pet: null,
  allergies: [],
  conditions: [],
  vaccines: [],
  medications: [],
  records: [],
  weight: [],
};

// Выполнить запрос, вернуть data || [] (или [] при ошибке).
const list = async (query) => {
  try {
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('collectMedicalExport: query failed (non-fatal):', e?.message);
    return [];
  }
};

const groupByRecord = (rows) =>
  rows.reduce((m, x) => {
    if (x.record_id == null) return m;
    (m[x.record_id] = m[x.record_id] || []).push(x);
    return m;
  }, {});

export async function collectMedicalExport(petId) {
  if (!petId) return { ...EMPTY };

  const [pet, allergies, conditions, vaccines, medications, records, weight] = await Promise.all([
    (async () => {
      try {
        const { data } = await supabase
          .from('pets')
          .select('name, species, breed, gender, birth_date, weight, weight_unit, blood_type, pet_context, microchip')
          .eq('id', petId)
          .maybeSingle();
        return data || null;
      } catch (e) {
        console.warn('collectMedicalExport: pet failed (non-fatal):', e?.message);
        return null;
      }
    })(),
    list(supabase.from('pet_allergies').select('substance, reaction, severity, noted_on').eq('pet_id', petId)),
    list(supabase.from('pet_conditions').select('condition, code, since_date, active, notes').eq('pet_id', petId)),
    list(supabase.from('record_vaccines').select('*').eq('pet_id', petId)),
    list(supabase.from('record_prescriptions').select('*').eq('pet_id', petId)),
    list(
      supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', petId)
        .order('occurred_at', { ascending: false, nullsFirst: false }),
    ),
    list(
      supabase
        .from('weight_history')
        .select('weight, weight_unit, measured_at, notes')
        .eq('pet_id', petId)
        .order('measured_at', { ascending: false }),
    ),
  ]);

  // Дети медзаписей — по record_id, одним запросом на тип.
  const recordIds = records.map((r) => r.id).filter(Boolean);
  let cVac = [], cRx = [], cPar = [], cLab = [];
  if (recordIds.length) {
    [cVac, cRx, cPar, cLab] = await Promise.all([
      list(supabase.from('record_vaccines').select('*').in('record_id', recordIds)),
      list(supabase.from('record_prescriptions').select('*').in('record_id', recordIds)),
      list(supabase.from('record_parasite_treatments').select('*').in('record_id', recordIds)),
      list(supabase.from('record_lab_tests').select('*').in('record_id', recordIds)),
    ]);
  }
  const gv = groupByRecord(cVac);
  const gr = groupByRecord(cRx);
  const gp = groupByRecord(cPar);
  const gl = groupByRecord(cLab);

  const recordsWithChildren = records.map((r) => ({
    ...r,
    vaccines: gv[r.id] || [],
    prescriptions: gr[r.id] || [],
    parasites: gp[r.id] || [],
    labs: gl[r.id] || [],
  }));

  return {
    pet,
    allergies,
    conditions,
    vaccines, // record_vaccines питомца (раздел «Вакцины»)
    medications: medications.filter((m) => m.active !== false), // активные курсы
    records: recordsWithChildren,
    weight,
  };
}
