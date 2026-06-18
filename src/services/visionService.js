// ══════════════════════════════════════════════════
// src/services/visionService.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// ══════════════════════════════════════════════════

import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { OPENROUTER_API_KEY } from '@env';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Аддитивный хелпер для переиспользования (новый код: ocrService).
// Существующий инлайн-путь analyzeImageWithVision НЕ меняем.
export const buildOpenRouterHeaders = () => ({
  Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://pethealthai.app',
  'X-Title': 'PetHealth AI',
});

// ✅ ОБНОВЛЕНО: Рабочие vision модели (платные, но доступные)
const VISION_MODELS = [
  'openai/gpt-4o-mini',                           // Самая дешевая ($0.15/1M tokens)
  'google/gemini-pro-vision',                     // Google Gemini Pro Vision
  'anthropic/claude-3-5-sonnet-20241022',         // Claude 3.5 Sonnet (latest)
  'meta-llama/llama-3.2-11b-vision-instruct',     // Llama 3.2 Vision
  'openai/gpt-4o',                                // GPT-4o (fallback, дороже)
];

/**
 * Convert image URI to base64
 */
const imageToBase64 = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('❌ Base64 conversion error:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Get system prompt based on analysis type
 */
const getSystemPrompt = (analysisType) => {
  const prompts = {
    symptoms: `You are a veterinary assistant AI. Analyze the pet image for visible health symptoms.
    
CRITICAL: Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "urgency": "green|yellow|red",
  "findings": ["symptom1", "symptom2"],
  "recommendation": "detailed recommendation",
  "confidence": "high|medium|low"
}

Urgency levels:
- GREEN: Normal appearance, no visible concerns
- YELLOW: Minor concerns, monitor or schedule routine vet visit
- RED: Urgent concerns, immediate veterinary attention recommended`,

    breed: `You are a pet breed identification expert. Analyze the image and identify the breed.
    
CRITICAL: Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "breed": "Primary breed name",
  "confidence": "high|medium|low",
  "mixBreeds": ["breed1", "breed2"],
  "characteristics": ["trait1", "trait2"],
  "funFact": "interesting fact about this breed"
}`,

    general: `You are a helpful pet care assistant. Describe what you see in the image and provide helpful insights about the pet's appearance, behavior, or environment.
    
Be friendly and informative. If you notice anything concerning, mention it gently.`
  };

  return prompts[analysisType] || prompts.general;
};

/**
 * Parse JSON response (with fallback extraction)
 */
const parseJSONResponse = (content) => {
  try {
    // Try direct parse first
    return JSON.parse(content);
  } catch (e) {
    console.warn('⚠️ Direct JSON parse failed, trying extraction...');
    
    // Extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                     content.match(/```\s*([\s\S]*?)\s*```/) ||
                     content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e2) {
        console.error('❌ JSON extraction failed');
      }
    }
    
    return null;
  }
};

/**
 * Analyze image with vision model (with fallback chain)
 */
export const analyzeImageWithVision = async (imageUri, analysisType = 'general') => {
  try {
    console.log(`🔍 Starting vision analysis: ${analysisType}`);
    
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const systemPrompt = getSystemPrompt(analysisType);
    
    let lastError = null;

    // ═══ FALLBACK ЦЕПОЧКА ═══
    for (const model of VISION_MODELS) {
      try {
        console.log(`Attempting vision analysis with model: ${model}`);

        const response = await axios.post(
          `${OPENROUTER_BASE_URL}/chat/completions`,
          {
            model: model,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: analysisType === 'symptoms' 
                      ? 'Analyze this pet image for any visible health symptoms or concerns.'
                      : analysisType === 'breed'
                      ? 'Identify the breed of this pet.'
                      : 'Describe this pet and provide helpful insights.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 1000,
            temperature: 0.3, // Lower temperature for more consistent JSON
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://pethealthai.app',
              'X-Title': 'PetHealth AI'
            },
            timeout: 30000,
          }
        );

        const content = response.data.choices[0].message.content;
        console.log('📥 Raw AI response:', content.substring(0, 200) + '...');
        
        // ═══ ПАРСИНГ JSON ═══
        let parsedResult;
        if (analysisType === 'symptoms' || analysisType === 'breed') {
          parsedResult = parseJSONResponse(content);
          
          if (!parsedResult) {
            console.warn('⚠️ JSON parsing failed, using raw content');
            parsedResult = { rawContent: content };
          }
        }

        console.log('✅ Vision analysis successful with model:', model);
        
        return {
          success: true,
          model: model,
          analysisType,
          result: parsedResult || content,
          rawContent: content,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        lastError = error;
        const errorData = error.response?.data;
        const errorStatus = error.response?.status;
        
        console.warn(`Model ${model} failed:`, errorData || error.message);
        
        // ⚠️ НЕ ПРОДОЛЖАЕМ на критических ошибках
        if (errorStatus === 401 || errorStatus === 403) {
          throw new Error('Invalid API key or unauthorized access');
        }
        
        // Продолжаем fallback на 404, 429, 402, 503
        if (![404, 429, 402, 503, 500].includes(errorStatus)) {
          // Неизвестная ошибка - пробуем следующую модель
          continue;
        }
      }
    }

    // ❌ Все модели провалились
    throw new Error(lastError?.response?.data?.error?.message || 'All vision models failed');

  } catch (error) {
    console.error('❌ Vision analysis failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to analyze image',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Format vision response for chat display
 */
export const formatVisionResponse = (visionResult) => {
  if (!visionResult.success) {
    return `❌ **Analysis failed**\n\n${visionResult.error}\n\n💡 Tip: Make sure the image is clear and well-lit.`;
  }

  const { analysisType, result, model } = visionResult;

  // ═══ SYMPTOMS ANALYSIS ═══
  if (analysisType === 'symptoms') {
    const urgencyEmoji = {
      green: '🟢',
      yellow: '🟡',
      red: '🔴'
    };

    const urgency = result.urgency?.toLowerCase() || 'unknown';
    
    return `
${urgencyEmoji[urgency] || '🔍'} **Health Analysis**

**Urgency Level:** ${urgency.toUpperCase()}
**Confidence:** ${result.confidence || 'N/A'}

**Findings:**
${result.findings?.map(f => `• ${f}`).join('\n') || '• No specific findings'}

**Recommendation:**
${result.recommendation || result.rawContent || 'No specific recommendation provided'}

${urgency === 'red' ? '⚠️ **IMPORTANT:** This is not a substitute for professional veterinary care. Please consult a vet immediately.' : ''}

_Analyzed with ${model.split('/')[1]}_
    `.trim();
  }

  // ═══ BREED IDENTIFICATION ═══
  if (analysisType === 'breed') {
    return `
🐾 **Breed Identification**

**Primary Breed:** ${result.breed || 'Unknown'}
**Confidence:** ${result.confidence || 'N/A'}

${result.mixBreeds?.length ? `**Possible Mix:** ${result.mixBreeds.join(', ')}` : ''}

**Characteristics:**
${result.characteristics?.map(c => `• ${c}`).join('\n') || '• N/A'}

${result.funFact ? `\n💡 **Fun Fact:** ${result.funFact}` : ''}

_Analyzed with ${model.split('/')[1]}_
    `.trim();
  }

  // ═══ GENERAL ANALYSIS ═══
  return `
🔍 **Image Analysis**

${result.rawContent || result}

_Analyzed with ${model.split('/')[1]}_
  `.trim();
};
