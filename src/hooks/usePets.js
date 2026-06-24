import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import * as imageUploadService from '../services/imageUploadService';

export const usePets = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pets for current user
  const fetchPets = useCallback(async () => {
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('❌ Error fetching pets:', fetchError);
        throw fetchError;
      }

      // Filter active pets (where is_active is true or null)
      const activePets = (data || []).filter(
        (pet) => pet.is_active === true || pet.is_active === null || pet.is_active === undefined
      );

      console.log(`✅ Loaded ${activePets.length} active pets for user ${user.id.slice(0, 8)}...`);
      setPets(activePets);
    } catch (err) {
      console.error('❌ Exception fetching pets:', err);
      setError(err.message);
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Стабильный id инстанса (уникальное имя Realtime-канала) + ref на актуальный
  // fetchPets, чтобы не пересоздавать подписку при смене идентичности функции.
  const instanceIdRef = useRef(Math.random().toString(36).slice(2));
  const fetchPetsRef = useRef(fetchPets);
  fetchPetsRef.current = fetchPets;

  // Add new pet
  const addPet = async (petData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('pets')
        .insert([
          {
            ...petData,
            owner_id: user.id,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error adding pet:', insertError);
        throw insertError;
      }

      console.log('✅ Pet added successfully:', data.id);
      await fetchPets(); // Refresh pets list
      return data;
    } catch (err) {
      console.error('❌ Exception adding pet:', err);
      throw err;
    }
  };

  // Update existing pet
  const updatePet = async (petId, updates) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: updateError } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', petId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating pet:', updateError);
        throw updateError;
      }

      console.log('✅ Pet updated successfully:', petId);
      await fetchPets(); // Refresh pets list
      return data;
    } catch (err) {
      console.error('❌ Exception updating pet:', err);
      throw err;
    }
  };

  // ✅ НОВОЕ: Обновление фото питомца
  const updatePetPhoto = async (petId, newPhotoUrl) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
  
    try {
      if (!newPhotoUrl) {
        throw new Error('Photo URL is required');
      }
  
      // 🗑️ ОПЦИОНАЛЬНО: Удаляем старое фото
      const oldPet = pets.find(p => p.id === petId);
      if (oldPet?.avatar_url && oldPet.avatar_url.includes('supabase.co/storage')) {
        try {
          // deleteFromStorage принимает полный URL и сам извлекает путь после "pets/"
          await imageUploadService.deleteFromStorage(oldPet.avatar_url);
          console.log('🗑️ Old photo deleted:', oldPet.avatar_url);
        } catch (deleteError) {
          console.warn('⚠️ Could not delete old photo:', deleteError);
          // Продолжаем выполнение даже если удаление не удалось
        }
      }
  
      // Обновляем запись в БД
      const { error: updateError } = await supabase
        .from('pets')
        .update({ avatar_url: newPhotoUrl })
        .eq('id', petId)
        .eq('owner_id', user.id);
  
      if (updateError) {
        console.error('❌ Error updating pet photo in DB:', updateError);
        throw updateError;
      }
  
      console.log('✅ Pet photo updated in DB:', petId);
  
      // Обновляем локальное состояние
      setPets(prev => 
        prev.map(pet => 
          pet.id === petId ? { ...pet, avatar_url: newPhotoUrl } : pet
        )
      );
  
      return true;
    } catch (err) {
      console.error('❌ Exception updating pet photo:', err);
      throw err;
    }
  };  

  // Soft delete pet (set is_active = false)
  const deletePet = async (petId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const pet = pets.find(p => p.id === petId);

      // Soft delete в БД
      const { error: deleteError } = await supabase
        .from('pets')
        .update({ is_active: false })
        .eq('id', petId)
        .eq('owner_id', user.id);

      if (deleteError) {
        console.error('❌ Error deleting pet:', deleteError);
        throw deleteError;
      }

      console.log('✅ Pet soft-deleted successfully:', petId);

      // ✅ НОВОЕ: Удаляем фото из Storage (опционально, если хотите сохранять историю - закомментируйте)
      if (pet?.avatar_url && pet.avatar_url.includes('supabase')) {
        // Передаём полный URL — путь извлекается внутри deleteFromStorage
        await imageUploadService.deleteFromStorage(pet.avatar_url);
      }

      await fetchPets(); // Refresh pets list
    } catch (err) {
      console.error('❌ Exception deleting pet:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Real-time subscription — уникальный канал на инстанс (имя с user.id +
  // instanceId), чтобы несколько инстансов usePets не делили один topic и не
  // ловили "add postgres_changes ... after subscribe()". Пересоздаётся только
  // при смене пользователя.
  useEffect(() => {
    if (!user) return;

    const channelName = `pets_changes_${user.id}_${instanceIdRef.current}`;
    console.log('🔄 Setting up real-time subscription for pets...', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Real-time pets update:', payload.eventType);
          fetchPetsRef.current?.();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Removing pets changes channel...');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    pets,
    loading,
    error,
    addPet,
    updatePet,
    deletePet,
    updatePetPhoto, // ✅ Новый метод
    refetch: fetchPets,
  };
};
