import { supabase } from '../utils/supabase';

/**
 * Проверяет и создаёт запись пользователя в public.users если её нет
 * @returns {Promise<boolean>} true если запись была создана, false если уже существовала
 */
export async function ensureUserProfileExists() {
  try {
    // Получаем текущего пользователя
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Error getting user:', userError);
      throw userError;
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Checking user profile for:', user.email);

    // Проверяем, существует ли запись в public.users
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking user profile:', fetchError);
      throw fetchError;
    }

    // Если запись уже существует
    if (existingUser) {
      console.log('✅ User profile already exists');
      return false;
    }

    // Создаём новую запись
    console.log('📝 Creating user profile...');
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        loyalty_points: 0,
      });

    if (insertError) {
      console.error('❌ Error creating user profile:', insertError);
      throw insertError;
    }

    console.log('✅ User profile created successfully');
    return true;

  } catch (error) {
    console.error('❌ Error in ensureUserProfileExists:', error);
    throw error;
  }
}

/**
 * Получает данные пользователя из public.users
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} Данные пользователя
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Обновляет данные пользователя
 * @param {string} userId - ID пользователя
 * @param {Object} updates - Объект с обновлениями
 * @returns {Promise<Object>} Обновлённые данные
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Upsert-обновление полей пользователя (создаёт строку, если её нет — on conflict id).
 * @param {string} userId
 * @param {Object} updates - частичные поля public.users
 * @returns {Promise<Object>} строка пользователя
 */
export async function upsertUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: userId, ...updates })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
}
