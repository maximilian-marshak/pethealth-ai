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
- All dates in ISO YYYY-MM-DD. Convert Russian date formats (day-first numeric or month-name forms) to ISO. date_given = when administered; next_due_date = revaccination / "valid until" / "next"; occurred_at = visit/document date.
- Each vaccine and each medication is a SEPARATE array item, do not merge them.
- confidence: an object { name_of_non_null_field: number 0..1 }.
- The pet's name, species (e.g. "Собака"/"Dog") and breed are NEVER a diagnosis, a clinic_name, or a vet_name. A header line like "<Name> / <Species> / <Breed>" describes the PET — ignore it for clinic_name/diagnosis.
- "Владелец"/"Хозяин"/owner name is NOT vet_name. Use vet_name ONLY for an actual treating doctor (e.g. after "Врач:", "Ветеринар:", a doctor's signature). If no vet is shown, vet_name = null.
- A vaccination record usually has NO diagnosis — set diagnosis null unless a real illness is diagnosed.
- Each distinct vaccine PRODUCT is its OWN vaccines[] item, even if several are printed on one line. If several vaccine products are listed together, split them into separate items.
- next_due_date: capture revaccination/next dates ("ревакцинация", "действительна до", "следующая вакцинация DD.MM.YYYY"). If only a relative interval is given ("через год"/"ежегодно"), compute date_given + 1 year in ISO.
- Forms often contain CHECKLISTS / MENUS of possible items. Extract ONLY the marked ones (checkmark, cross, "+", underline, filled in). Do NOT extract empty, unmarked items. A list of possible tests/procedures is NOT a list of performed ones.
- Each item belongs to EXACTLY ONE category. Laboratory/diagnostic tests go ONLY in lab_tests, NEVER in vaccines. vaccines are real vaccine products, NOT tests and NOT procedures. Do not duplicate one item across multiple arrays.
- LAB TESTS — be strict. Only include an item in lab_tests[] when there is clear evidence it was actually ordered or performed at THIS visit: a checkmark/tick beside it, a filled-in result or value, or it is explicitly named in the diagnosis or treatment plan. Do NOT extract items merely because they appear on the form as a printed list, services menu, price list, or unchecked checklist. Service items such as castration/neutering, vaccination, dental cleaning, deworming, or a general "comprehensive examination" are NOT lab tests and must never appear in lab_tests[]. If you cannot determine which items were actually ordered, return lab_tests: [].
- VET NAME — vet_name is the name of a PERSON who is the treating veterinarian, and only when the document explicitly labels them as the doctor/vet (e.g. a "врач"/"doctor" label or a signature line). Never use the pet owner's name. Never use a product, drug, or brand name as the vet — names appearing in the medications/treatment section, including brand names that contain "Доктор" or "Dr" (e.g. an ear-lotion brand), are NOT the veterinarian. If no treating veterinarian is explicitly named, set vet_name: null.
- Determine record_type by the essence of the visit: if there is a DIAGNOSIS and/or TREATMENT, it is 'visit' (or 'procedure'), NOT 'vaccination'. The word "Вакцинация" inside a recommendations/prevention checklist does NOT make the record a vaccination.
- Prescribed MEDICATIONS with a dosage go to prescriptions[] (name, dose, frequency, duration, instruction), even under headers like "Рекомендации и назначения" / "Препараты и манипуляции". General care advice (how to clean ears, etc.) goes to recommendations.
- diagnosis: extract the diagnosis text; if a code precedes the text, put the code in diagnosis_code and the text in diagnosis.
- recommendations is a SINGLE string (join multiple points with line breaks), NOT an array.
- Russian dates are day-first (DD.MM.YYYY).
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
