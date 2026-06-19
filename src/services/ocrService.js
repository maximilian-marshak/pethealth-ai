// ══════════════════════════════════════════════════════════════
// src/services/ocrService.js
// OCR ветеринарных выписок через Edge Function ai-proxy (purpose:'ocr').
// Ключ OpenRouter и цепочка моделей живут в функции, не в приложении.
// ══════════════════════════════════════════════════════════════

import { callAIProxy } from './aiProxyClient';

const SYSTEM_PROMPT = `You extract structured data from a veterinary document image. Detect the document language and keep values in the original language. Return ONLY a JSON object (no markdown, no commentary) with EXACTLY this shape, all defaults null:
{ record_type, occurred_at, vet_name, clinic_name, diagnosis, diagnosis_code, symptoms, recommendations, weight, weight_unit, temperature, follow_up_date, urgency, vaccines:[], prescriptions:[], parasite_treatments:[], lab_tests:[], confidence:{} }

Item shapes:
  vaccines: {vaccine_name, vaccine_type, batch_series, date_given, next_due_date}
  prescriptions: {name, dose, frequency, duration, instruction, start_date, end_date, active}
  parasite_treatments: {kind, product, treated_on, interval_days, next_due_date}
  lab_tests: {test_type, status, result}

RULES:
- record_type: exactly one of visit, vaccination, medication_course, parasite_treatment, procedure, lab_test, other.
- urgency: one of normal, elevated, high — or null.
- weight_unit: "kg" | "lb" | null. vaccine_type: "primary" | "booster" | null. parasite kind: "deworming" | "ectoparasite". lab status: "ordered" | "completed".
- Enum fields contain ONE value or null. NEVER output a list of options and NEVER write a string containing the '|' character.
- vet_name = the treating VETERINARIAN, not the owner. If only the owner is visible, vet_name = null.
- clinic_name = the name of the CLINIC, not the pet's name/species/breed.
- All dates in ISO YYYY-MM-DD. Convert Russian formats (15.03.2026, "15 марта 2026") to ISO. date_given = when administered; next_due_date = revaccination / "valid until" / "next"; occurred_at = visit/document date.
- Each vaccine and each medication is a SEPARATE array item, do not merge them.
- confidence: an object { name_of_non_null_field: number 0..1 }.
- The pet's name, species (e.g. "Собака"/"Dog") and breed are NEVER a diagnosis, a clinic_name, or a vet_name. A header line like "<Name> / <Species> / <Breed>" describes the PET — ignore it for clinic_name/diagnosis.
- "Владелец"/"Хозяин"/owner name is NOT vet_name. Use vet_name ONLY for an actual treating doctor (e.g. after "Врач:", "Ветеринар:", a doctor's signature). If no vet is shown, vet_name = null.
- A vaccination record usually has NO diagnosis — set diagnosis null unless a real illness is diagnosed.
- Each distinct vaccine PRODUCT is its OWN vaccines[] item, even if several are printed on one line. Split e.g. "Нобивак DHPPi, Нобивак Lepto, Нобивак Rabies" into THREE items.
- next_due_date: capture revaccination/next dates ("ревакцинация", "действительна до", "следующая вакцинация DD.MM.YYYY"). If only a relative interval is given ("через год"/"ежегодно"), compute date_given + 1 year in ISO.
- Forms often contain CHECKLISTS / MENUS of possible items. Extract ONLY the marked ones (checkmark, cross, "+", underline, filled in). Do NOT extract empty, unmarked items. A list of possible tests/procedures is NOT a list of performed ones.
- Each item belongs to EXACTLY ONE category. Laboratory/diagnostic tests go ONLY in lab_tests, NEVER in vaccines. vaccines are real vaccine PRODUCTS (Нобивак, Eurican, Purevax, Мультикан, etc.), NOT tests and NOT procedures. Do not duplicate one item across multiple arrays.
- Determine record_type by the essence of the visit: if there is a DIAGNOSIS and/or TREATMENT, it is 'visit' (or 'procedure'), NOT 'vaccination'. The word "Вакцинация" inside a recommendations/prevention checklist does NOT make the record a vaccination.
- Prescribed MEDICATIONS with a dosage go to prescriptions[] (name, dose, frequency, duration, instruction), even under headers like "Рекомендации и назначения" / "Препараты и манипуляции". General care advice (how to clean ears, etc.) goes to recommendations.
- diagnosis: extract both the diagnosis text and its code (e.g. "H96 Наружный отит" → diagnosis_code: "H96", diagnosis: "Наружный отит").
- recommendations is a SINGLE string (join multiple points with line breaks), NOT an array.
- Russian dates are day-first (DD.MM.YYYY).

EXAMPLE (guidance only — do not copy these values):
A document with header "Игги / Собака / Чихуахуа", "Владелец: Иванов И.И.", and a line "Вакцинация 15.03.2026: Нобивак DHPPi, Нобивак Lepto, Нобивак Rabies, ревакцинация через год" must yield:
- record_type: "vaccination"
- vet_name: null   (only owner shown)
- clinic_name: null   (header is the pet, not a clinic)
- diagnosis: null   (species is not a diagnosis)
- occurred_at: "2026-03-15"
- vaccines: THREE separate items —
    {"vaccine_name":"Нобивак DHPPi","date_given":"2026-03-15","next_due_date":"2027-03-15"},
    {"vaccine_name":"Нобивак Lepto","date_given":"2026-03-15","next_due_date":"2027-03-15"},
    {"vaccine_name":"Нобивак Rabies","date_given":"2026-03-15","next_due_date":"2027-03-15"}

- Output ONLY the JSON object.`;

// Безопасный парсинг: снять ```-обёртку, затем JSON.parse; при неудаче —
// выделить внешние фигурные скобки. Вернуть объект или null.
const stripAndParse = (content) => {
  if (!content || typeof content !== 'string') return null;
  let text = content.trim();

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) text = fence[1].trim();

  try {
    return JSON.parse(text);
  } catch (e) {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      try {
        return JSON.parse(text.slice(first, last + 1));
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
};

/**
 * Распознать ветеринарную выписку по base64-изображению через ai-proxy.
 * @param {string} imageBase64 - base64 (без data-URI префикса)
 * @param {string} mimeType - 'image/jpeg' по умолчанию
 * @returns {Promise<{success:boolean, model?:string, data?:object, error?:string, raw?:string}>}
 */
export async function parseMedicalDocument(imageBase64, mimeType = 'image/jpeg') {
  if (!imageBase64) {
    return { success: false, error: 'No image provided' };
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Extract the medical record from this document.' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
      ],
    },
  ];

  // Дефолты ocr (temperature 0.1 / max_tokens 3000) заданы в Edge Function.
  const res = await callAIProxy({ purpose: 'ocr', messages });

  if (res.success === false) {
    return { success: false, error: res.error };
  }

  const data = stripAndParse(res.content);
  if (!data) {
    return { success: false, error: 'parse failed', raw: res.content };
  }

  return { success: true, model: res.model, data };
}
