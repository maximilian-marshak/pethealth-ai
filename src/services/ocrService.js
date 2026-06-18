// ══════════════════════════════════════════════════════════════
// src/services/ocrService.js
// OCR ветеринарных выписок через OpenRouter (vision-модели).
// Переиспользует URL/заголовки из visionService (единый клиент-сетап).
// ══════════════════════════════════════════════════════════════

import axios from 'axios';
import { OPENROUTER_BASE_URL, buildOpenRouterHeaders } from './visionService';

// Vision-цепочка с фолбэком (первые три — настоящие мультимодальные;
// openrouter/free — крайний фолбэк, зрение не гарантировано).
const OCR_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-4-maverick:free',
  'openrouter/free',
];

const SYSTEM_PROMPT = `You extract data from a veterinary document. Return ONLY JSON matching the schema below — no markdown, no code fences, no explanations. Detect the document language and keep values in the original language. Dates in ISO (YYYY-MM-DD). Numbers as numbers. If a field is absent — null. For every filled field add a confidence score 0..1 in the "confidence" object.

Schema:
{
  "record_type": "visit|vaccination|medication_course|parasite_treatment|procedure|lab_test|other",
  "occurred_at": null,
  "vet_name": null,
  "clinic_name": null,
  "diagnosis": null,
  "diagnosis_code": null,
  "symptoms": null,
  "recommendations": null,
  "weight": null,
  "weight_unit": "kg|lb",
  "temperature": null,
  "follow_up_date": null,
  "urgency": "normal|elevated|high",
  "vaccines": [{ "vaccine_name": null, "vaccine_type": "primary|booster", "batch_series": null, "date_given": null, "next_due_date": null }],
  "prescriptions": [{ "name": null, "dose": null, "frequency": null, "duration": null, "instruction": null, "start_date": null, "end_date": null, "active": null }],
  "parasite_treatments": [{ "kind": "deworming|ectoparasite", "product": null, "treated_on": null, "interval_days": null, "next_due_date": null }],
  "lab_tests": [{ "test_type": null, "status": null, "result": null }],
  "confidence": {}
}`;

// Безопасный парсинг: снять ```json-обёртку, затем JSON.parse; при неудаче —
// попытаться выделить внешние фигурные скобки. Вернуть объект или null.
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
 * Распознать ветеринарную выписку по base64-изображению.
 * @param {string} imageBase64 - base64 (без data-URI префикса)
 * @param {string} mimeType - 'image/jpeg' по умолчанию
 * @returns {Promise<{success:boolean, model?:string, data?:object, rawContent?:string, error?:string}>}
 */
export async function parseMedicalDocument(imageBase64, mimeType = 'image/jpeg') {
  if (!imageBase64) {
    return { success: false, error: 'No image provided' };
  }

  let lastError = null;

  for (const model of OCR_MODELS) {
    try {
      console.log(`📄 OCR attempt with model: ${model}`);

      const response = await axios.post(
        `${OPENROUTER_BASE_URL}/chat/completions`,
        {
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Extract structured data from this veterinary document.' },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              ],
            },
          ],
          max_tokens: 3000,
          temperature: 0.1,
        },
        { headers: buildOpenRouterHeaders(), timeout: 60000 }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      const parsed = stripAndParse(content);

      if (!parsed) {
        console.warn(`⚠️ OCR JSON parse failed for ${model}, trying next model...`);
        lastError = new Error('Failed to parse JSON from model response');
        continue;
      }

      console.log('✅ OCR parsed with model:', model);
      return { success: true, model, data: parsed, rawContent: content };
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      console.warn(`OCR model ${model} failed:`, error.response?.data || error.message);

      if (status === 401 || status === 403) {
        return { success: false, error: 'Invalid API key or unauthorized access' };
      }
      // На прочих ошибках — следующая модель в цепочке
      continue;
    }
  }

  return { success: false, error: lastError?.message || 'All OCR models failed' };
}
