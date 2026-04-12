// /src/services/openAIService.js

const OPENAI_API_KEY = 'your-api-key-here'; // Replace with your actual key
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function callOpenAI(userMessage, conversationHistory = []) {
  try {
    // Build messages array
    const messages = [
      {
        role: 'system',
        content: `You are a helpful pet care assistant. Provide accurate, concise, and friendly advice about pet health, nutrition, behavior, and care. Always prioritize pet safety and recommend consulting a veterinarian for serious health concerns.`,
      },
      // Add conversation history
      ...conversationHistory.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      // Add current message
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI Service Error:', error);
    throw error;
  }
}
