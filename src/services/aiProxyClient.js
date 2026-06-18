// ══════════════════════════════════════════════════════════════
// src/services/aiProxyClient.js
// Клиент Edge Function ai-proxy. Ключ OpenRouter в приложении НЕ хранится.
// ══════════════════════════════════════════════════════════════

import { supabase } from '../utils/supabase';

/**
 * Вызвать прокси ai-proxy.
 * @param {Object} params
 * @param {'chat'|'vision'|'ocr'} params.purpose
 * @param {Array} params.messages - OpenRouter-совместимый messages[]
 * @param {number} [params.temperature]
 * @param {number} [params.max_tokens]
 * @returns {Promise<{success:boolean, model?:string, content?:string, error?:string}>}
 */
export async function callAIProxy({ purpose, messages, temperature, max_tokens }) {
  try {
    const { data, error } = await supabase.functions.invoke('ai-proxy', {
      body: { purpose, messages, temperature, max_tokens },
    });

    if (error) {
      // Не-2xx от функции приходит сюда (FunctionsHttpError); пробуем достать тело.
      let detail = error.message || 'ai-proxy invoke failed';
      try {
        const body = await error.context?.json?.();
        if (body?.error) detail = body.error;
      } catch (_) {}
      return { success: false, error: detail };
    }

    if (!data || data.success === false) {
      return { success: false, error: data?.error || 'ai-proxy returned no data' };
    }

    return { success: true, model: data.model, content: data.content };
  } catch (e) {
    return { success: false, error: e?.message || 'Network error calling ai-proxy' };
  }
}
