// ══════════════════════════════════════════════════
// src/hooks/useConversation.js
// Персистентность чата: одна беседа на (user_id, pet_id).
// Таблицы conversations / messages (создаются миграцией, не здесь).
// ══════════════════════════════════════════════════

import { useCallback } from 'react';
import { supabase } from '../utils/supabase';

export function useConversation() {
  // Найти беседу текущего пользователя по (user_id, pet_id) или создать новую.
  // user_id ставится ЯВНО — RLS требует auth.uid() = user_id на insert.
  const getOrCreateConversation = useCallback(async (userId, petId = null, title = null) => {
    if (!userId) throw new Error('userId is required');

    let query = supabase
      .from('conversations')
      .select('id')
      .eq('user_id', userId);

    // Без питомца ищем через IS NULL (pet_id = null в SQL ничего не находит).
    query = petId == null ? query.is('pet_id', null) : query.eq('pet_id', petId);

    const { data: found, error: findError } = await query
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;
    if (found) return found.id;

    const { data: created, error: insertError } = await supabase
      .from('conversations')
      .insert({ user_id: userId, pet_id: petId, title })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return created.id;
  }, []);

  // Сообщения беседы по возрастанию created_at.
  const loadMessages = useCallback(async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }, []);

  // Вставка сообщения + обновление conversations.updated_at.
  const addMessage = useCallback(async (conversationId, role, content, tokensUsed = null) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role, content, tokens_used: tokensUsed })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }, []);

  // Удалить все сообщения беседы (саму беседу не трогаем).
  const clearConversation = useCallback(async (conversationId) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) throw error;
  }, []);

  return { getOrCreateConversation, loadMessages, addMessage, clearConversation };
}
