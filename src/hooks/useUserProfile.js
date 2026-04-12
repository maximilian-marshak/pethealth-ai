import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Получаем данные профиля из user_metadata
      const currentProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        is_premium: user.user_metadata?.is_premium || false,
      };

      setProfile(currentProfile);
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // ✅ ИЗМЕНЕНО: зависимость только от user.id, а не всего объекта user

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /**
   * Обновляет аватар пользователя
   * @param {string} avatarUrl - URL нового аватара
   */
  const updateAvatar = async (avatarUrl) => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    try {
      console.log('🔄 Updating user avatar:', avatarUrl);

      // Обновляем метаданные пользователя
      const { data, error } = await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrl,
        },
      });

      if (error) throw error;

      console.log('✅ Avatar updated successfully');

      // ✅ ДОБАВЛЕНО: Немедленно обновляем локальное состояние БЕЗ перезагрузки
      setProfile((prev) => ({
        ...prev,
        avatar_url: avatarUrl,
      }));

      return data;
    } catch (err) {
      console.error('❌ Error updating avatar:', err);
      throw err;
    }
  };

  /**
   * Обновляет имя пользователя
   * @param {string} fullName - Новое имя
   */
  const updateName = async (fullName) => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    try {
      console.log('🔄 Updating user name:', fullName);

      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });

      if (error) throw error;

      console.log('✅ Name updated successfully');

      setProfile((prev) => ({
        ...prev,
        full_name: fullName,
      }));

      return data;
    } catch (err) {
      console.error('❌ Error updating name:', err);
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    updateAvatar,
    updateName,
    refetch: fetchProfile,
  };
}
