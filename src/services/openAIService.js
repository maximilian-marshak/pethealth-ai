// ══════════════════════════════════════════════════════════════════════════════
// src/services/openAIService.js
// Чат-сервис: все вызовы идут через Edge Function ai-proxy (purpose:'chat').
// Ключ OpenRouter в приложении НЕ хранится; цепочка моделей живёт в функции.
// ══════════════════════════════════════════════════════════════════════════════

import i18n from '../utils/i18n';
import { callAIProxy } from './aiProxyClient';
import { formatWeight } from '../utils/formatWeight';

// Код языка i18n -> имя языка для инструкции модели
const LANG_NAMES = { en: 'English', ru: 'Russian' };

// ============================================
// УТИЛИТЫ
// ============================================

const validateUserInput = (message) => {
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new Error('Message cannot be empty');
  }
  if (trimmed.length > 4000) {
    throw new Error('Message is too long (max 4000 characters)');
  }
  return trimmed;
};

// ============================================
// ОПРЕДЕЛЕНИЕ ЭКСТРЕННЫХ СЛУЧАЕВ
// ============================================

const EMERGENCY_KEYWORDS = [
  // Английские ключевые слова
  'bleeding', 'blood', 'poisoning', 'poison', 'seizure', 'convulsion',
  'unconscious', 'not breathing', 'choking', 'broken bone', 'fracture',
  'hit by car', 'attack', 'bite', 'snake bite', 'emergency', 'urgent',

  // Русские ключевые слова
  'кровотечение', 'кровь', 'отравление', 'яд', 'судороги', 'конвульсии',
  'без сознания', 'не дышит', 'задыхается', 'удушье', 'перелом', 'сломана',
  'сбила машина', 'укус', 'нападение', 'укус змеи', 'срочно', 'помогите',
];

export const detectEmergency = (message) => {
  const lowerMessage = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword =>
    lowerMessage.includes(keyword.toLowerCase())
  );
};

// ============================================
// ✅ ОСНОВНАЯ ФУНКЦИЯ: ОТПРАВКА СООБЩЕНИЯ (через ai-proxy)
// ============================================

export async function sendMessageToOpenAI(userMessage, conversationHistory = [], context = {}) {
  try {
    const validatedMessage = validateUserInput(userMessage);
    const isEmergency = detectEmergency(validatedMessage);

    // Формируем системный промпт
    let systemContent = isEmergency
      ? '🚨 You are an emergency veterinary assistant. Provide immediate, critical care instructions. Be concise and actionable. Start your response with "⚠️ EMERGENCY:"'
      : '🐾 You are a helpful veterinary assistant specializing in pet health. Provide accurate, practical advice in a friendly tone.';

    // Добавляем контекст питомца (маппинг полей: name всегда; breed/age/weight — если есть)
    if (context.selectedPet) {
      const { name, breed, age, weight, pet_context } = context.selectedPet;
      systemContent += ` You are helping with ${name}`;
      if (breed) systemContent += `, a ${breed}`;
      if (age != null) systemContent += ` (${age} years old)`;
      // Вес форматируем в единицы пользователя (unit прокинут из чата, где доступен useUnits).
      const weightStr = formatWeight(weight, context.unit || 'kg');
      if (weightStr) systemContent += `, weighing ${weightStr}`;
      systemContent += '.';
      // Бытовой/lifestyle-контекст из паспорта (служебный для модели), обрезаем до 500 симв.
      if (pet_context && String(pet_context).trim()) {
        const ctx = String(pet_context).trim().slice(0, 500);
        systemContent += ` Household/lifestyle context: ${ctx}`;
        if (!/[.!?]$/.test(ctx)) systemContent += '.';
      }
    }

    // Здоровье питомца (справочный контекст + safety-инструкция); пустые списки пропускаем.
    if (context.health) {
      const { allergies = [], conditions = [], medications = [] } = context.health;
      const lines = [];
      if (allergies.length) {
        const items = allergies
          .map((a) => (a.severity ? `${a.substance} [${a.severity}]` : a.substance))
          .join(', ');
        lines.push(`- ALLERGIES (respect strictly): ${items}.`);
      }
      if (conditions.length) {
        const items = conditions
          .map((c) => (c.code ? `${c.condition} (${c.code})` : c.condition))
          .join(', ');
        lines.push(`- CHRONIC CONDITIONS: ${items}.`);
      }
      if (medications.length) {
        const items = medications
          .map((m) => (m.dose ? `${m.name} (${m.dose})` : m.name))
          .join(', ');
        lines.push(`- ACTIVE MEDICATIONS: ${items}.`);
      }
      if (lines.length) {
        systemContent += ` PET HEALTH CONTEXT (reference only, not a diagnosis):\n${lines.join('\n')}\nINSTRUCTION: If any advice or medication you suggest could conflict with a listed allergy, warn the user explicitly and avoid it. Take chronic conditions and active medications into account (interactions/contraindications). Do not invent health data — absent categories are simply not listed. This is reference context, not a diagnosis.`;
      }
    }

    // Добавляем контекст категории
    if (context.category === 'relocation') {
      systemContent += ` Focus on helping the user relocate or travel with their pet: required documents (pet passport, health/veterinary certificates), vaccinations (especially rabies) and timing, microchipping, blood titer tests and parasite treatments, destination-country import requirements, quarantine, airline/IATA crate and carrier rules, and acclimatization on arrival. IMPORTANT: import and travel rules differ by country, airline and change over time — never state specific country rules as definitive fact. Always advise the user to verify current requirements with official sources (the destination country's authorities, embassy/consulate, the airline) and their veterinarian before relying on anything.`;
    } else if (context.category && context.category !== 'free-chat') {
      systemContent += ` Focus on ${context.category}-related questions.`;
    }

    // Язык ответа = язык приложения (i18n.language), независимо от языка инструкций.
    const lang = i18n.language || 'en';
    const langName = LANG_NAMES[lang] || lang;
    systemContent += ` Always write your reply in ${langName} (the user's app language), regardless of the language of these instructions.`;
    if (isEmergency) {
      // Детектор экстренности ищет символ "⚠️" — префикс не переводим.
      systemContent += ` Keep the literal prefix "⚠️ EMERGENCY:" exactly as written in English, then continue in ${langName}.`;
    }

    // Формируем массив сообщений (последние 6 + текущее)
    const messages = [
      { role: 'system', content: systemContent },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: validatedMessage },
    ];

    console.log('🤖 Sending to ai-proxy (chat)...');
    const result = await callAIProxy({
      purpose: 'chat',
      messages,
      temperature: isEmergency ? 0.3 : 0.7,
      max_tokens: 512,
    });

    if (result.success) {
      const content = result.content || '';
      return {
        message: content.trim(),
        timestamp: new Date().toISOString(),
        isEmergency: isEmergency || content.includes('⚠️'),
        service: 'ai-proxy',
        model: result.model,
      };
    }

    // Прокси исчерпал цепочку моделей или вернул ошибку — пробрасываем
    throw new Error(result.error || 'AI service unavailable');

  } catch (error) {
    console.error('❌ sendMessageToOpenAI error:', error.message);
    throw error;
  }
}

// ============================================
// ✅ ГЕНЕРАЦИЯ КОНТЕКСТУАЛЬНЫХ ВОПРОСОВ
// ============================================

export function generateContextualQuestion(context = {}) {
  const { selectedPet, category } = context;

  if (selectedPet) {
    return `Hi! I'm here to help with ${selectedPet.name}. What would you like to know?`;
  }

  const categoryGreetings = {
    'health': 'Hi! How can I help with your pet\'s health today?',
    'nutrition': 'Hi! Let\'s talk about your pet\'s nutrition.',
    'behavior': 'Hi! What behavior concerns do you have?',
    'grooming': 'Hi! Need grooming advice?',
    'emergency': '⚠️ Emergency mode. Please describe the situation immediately.',
    'free-chat': 'Hi! Ask me anything about pet care.',
  };

  if (category && categoryGreetings[category]) {
    return categoryGreetings[category];
  }

  const questions = [
    "What type of pet do you have?",
    "How old is your pet?",
    "What symptoms is your pet showing?",
    "Has your pet's appetite changed recently?",
    "Is your pet drinking water normally?",
  ];

  return questions[Math.floor(Math.random() * questions.length)];
}

// ============================================
// ЭКСПОРТЫ
// ============================================

export { validateUserInput };
