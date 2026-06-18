// ══════════════════════════════════════════════════════════════════════════════
// src/services/openAIService.js
// AI Service: OpenRouter API (Multi-Model Support)
// Updated: January 2025 - Fixed model availability issues
// ══════════════════════════════════════════════════════════════════════════════

import OpenAI from 'openai';
import { OPENROUTER_API_KEY } from '@env';
import i18n from '../utils/i18n';

// ============================================
// КОНФИГУРАЦИЯ AI МОДЕЛЕЙ
// ============================================

const AI_MODELS = [
  // 🆓 Только бесплатные :free-слаги; перебор по порядку (см. callOpenRouterAPI)
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'openrouter/free',                               // самозалечивающийся роутер бесплатных моделей
];

// Код языка i18n -> имя языка для инструкции модели
const LANG_NAMES = { en: 'English', ru: 'Russian' };

// ============================================
// ИНИЦИАЛИЗАЦИЯ КЛИЕНТА
// ============================================

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://pethealth.app',        // Для аналитики OpenRouter
    'X-Title': 'PetHealth AI Assistant',
  },
});

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
// AI SERVICE: OPENROUTER
// ============================================

const callOpenRouterAPI = async (messages, options = {}) => {
  const isEmergency = options.isEmergency || false;
  
  // Счетчик попыток для детального логирования
  let attemptCount = 0;

  // Пробуем модели по очереди
  for (const model of AI_MODELS) {
    attemptCount++;
    
    try {
      console.log(`🔄 Trying model ${attemptCount}/${AI_MODELS.length}: ${model}...`);

      const completion = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: isEmergency ? 0.3 : 0.7,  // Строгий режим для экстренных случаев
        max_tokens: 512,
        top_p: 0.9,
      });

      const assistantMessage = completion.choices[0]?.message?.content;

      if (assistantMessage) {
        console.log(`✅ ${model} succeeded`);
        
        // Логируем использование токенов
        if (completion.usage) {
          console.log(`📊 Tokens used: ${completion.usage.total_tokens} (prompt: ${completion.usage.prompt_tokens}, completion: ${completion.usage.completion_tokens})`);
        }

        return {
          success: true,
          message: assistantMessage.trim(),
          service: 'openrouter',
          model: model,
          usage: completion.usage,
        };
      }

      throw new Error('Empty response from model');

    } catch (error) {
      const errorStatus = error.status || 'unknown';
      const errorMsg = error.message || 'Unknown error';
      
      console.error(`❌ ${model} failed:`, errorStatus, errorMsg);

      // Обработка специфичных ошибок
      if (errorStatus === 404) {
        console.log(`⏭️ Model not found or unavailable, trying next...`);
        continue;
      }
      
      if (errorStatus === 429) {
        console.log(`⏭️ Rate limit exceeded, trying next model...`);
        continue;
      }
      
      if (errorStatus === 503) {
        console.log(`⏭️ Service temporarily unavailable, trying next...`);
        continue;
      }

      // Если это критическая ошибка (не 404/429/503) - логируем подробно
      if (![404, 429, 503].includes(errorStatus)) {
        console.error(`🚨 Critical error with ${model}:`, error);
      }

      // Если это последняя модель - возвращаем ошибку
      if (attemptCount === AI_MODELS.length) {
        return { 
          success: false, 
          error: `All ${AI_MODELS.length} models failed. Last error: ${errorMsg}`,
          lastStatus: errorStatus,
        };
      }
    }
  }

  return { 
    success: false, 
    error: 'All models exhausted without success' 
  };
};

// ============================================
// ✅ ОСНОВНАЯ ФУНКЦИЯ: ОТПРАВКА СООБЩЕНИЯ
// ============================================

export async function sendMessageToOpenAI(userMessage, conversationHistory = [], context = {}) {
  try {
    const validatedMessage = validateUserInput(userMessage);
    const isEmergency = detectEmergency(validatedMessage);

    // Формируем системный промпт
    let systemContent = isEmergency
      ? '🚨 You are an emergency veterinary assistant. Provide immediate, critical care instructions. Be concise and actionable. Start your response with "⚠️ EMERGENCY:"'
      : '🐾 You are a helpful veterinary assistant specializing in pet health. Provide accurate, practical advice in a friendly tone.';

    // Добавляем контекст питомца
    if (context.selectedPet) {
      systemContent += ` You are helping with ${context.selectedPet.name}, a ${context.selectedPet.breed} (${context.selectedPet.age} years old).`;
    }

    // Добавляем контекст категории
    if (context.category && context.category !== 'free-chat') {
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
        content: msg.content
      })),
      { role: 'user', content: validatedMessage },
    ];

    console.log('🤖 Sending to OpenRouter API...');
    const result = await callOpenRouterAPI(messages, { isEmergency });
    
    if (result.success) {
      return {
        message: result.message,
        timestamp: new Date().toISOString(),
        isEmergency: isEmergency || result.message.includes('⚠️'),
        service: result.service,
        model: result.model,
        usage: result.usage,
      };
    }

    // Если все модели провалились - выбрасываем ошибку
    throw new Error(result.error || 'AI service unavailable');
    
  } catch (error) {
    console.error('❌ sendMessageToOpenAI error:', error.message);
    throw error;
  }
}

// ============================================
// ✅ ПРОВЕРКА ЗДОРОВЬЯ API
// ============================================

export async function checkAPIHealth() {
  const testMessages = [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Test' }
  ];
  
  try {
    console.log('🏥 Running API health check...');
    const result = await callOpenRouterAPI(testMessages);
    
    if (result.success) {
      console.log(`✅ API Health: OK (model: ${result.model})`);
    } else {
      console.log(`⚠️ API Health: DEGRADED (${result.error})`);
    }
    
    return {
      openrouter: result.success,
      model: result.model || 'unknown',
      status: result.success ? 'operational' : 'degraded',
      error: result.error,
    };
  } catch (error) {
    console.error('❌ API Health check failed:', error.message);
    return {
      openrouter: false,
      status: 'error',
      error: error.message,
    };
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
