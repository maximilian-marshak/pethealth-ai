// ══════════════════════════════════════════════════
// src/services/visionService.js
// Vision-анализ фото через Edge Function ai-proxy (purpose:'vision').
// Ключ OpenRouter в приложении НЕ хранится; цепочка моделей живёт в функции.
// ══════════════════════════════════════════════════

import * as FileSystem from 'expo-file-system';
import { callAIProxy } from './aiProxyClient';

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
 * Analyze image with vision via ai-proxy (purpose:'vision', proxy defaults 0.2/1500)
 */
export const analyzeImageWithVision = async (imageUri, analysisType = 'general') => {
  try {
    console.log(`🔍 Starting vision analysis: ${analysisType}`);

    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const systemPrompt = getSystemPrompt(analysisType);

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: analysisType === 'symptoms'
              ? 'Analyze this pet image for any visible health symptoms or concerns.'
              : analysisType === 'breed'
              ? 'Identify the breed of this pet.'
              : 'Describe this pet and provide helpful insights.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
        ],
      },
    ];

    // temperature/max_tokens НЕ передаём — берём дефолты vision из ai-proxy.
    const res = await callAIProxy({ purpose: 'vision', messages });

    if (res.success === false) {
      return {
        success: false,
        error: res.error || 'Failed to analyze image',
        timestamp: new Date().toISOString(),
      };
    }

    const content = res.content || '';
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

    console.log('✅ Vision analysis successful with model:', res.model);

    return {
      success: true,
      model: res.model,
      analysisType,
      result: parsedResult || content,
      rawContent: content,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Vision analysis failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to analyze image',
      timestamp: new Date().toISOString(),
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

_Analyzed with ${model?.split('/')[1] || model || 'AI'}_
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

_Analyzed with ${model?.split('/')[1] || model || 'AI'}_
    `.trim();
  }

  // ═══ GENERAL ANALYSIS ═══
  return `
🔍 **Image Analysis**

${result.rawContent || result}

_Analyzed with ${model?.split('/')[1] || model || 'AI'}_
  `.trim();
};
