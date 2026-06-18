// ══════════════════════════════════════════════════
// src/context/PetContext.js
// Источник питомцев — таблица pets в Supabase (реальные UUID).
// Публичный API контекста сохранён без изменений сигнатур.
// ══════════════════════════════════════════════════

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const SELECTED_PET_KEY = 'selectedPetId';

// ═══ CREATE CONTEXT ═══
const PetContext = createContext();

// ═══ CUSTOM HOOK (MUST BE EXPORTED!) ═══
export function usePetContext() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePetContext must be used within PetProvider');
  }
  return context;
}

// ═══ PROVIDER COMPONENT ═══
export function PetProvider({ children }) {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // ═══ LOAD PETS FROM SUPABASE ═══
  const loadPets = useCallback(async () => {
    if (!user) {
      setPets([]);
      setSelectedPet(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Активные питомцы (is_active true/null/undefined)
      const activePets = (data || []).filter(
        (pet) => pet.is_active === true || pet.is_active === null || pet.is_active === undefined
      );

      console.log(`✅ PetContext: loaded ${activePets.length} active pets`);
      setPets(activePets);

      // Восстанавливаем выбранного питомца по сохранённому id, иначе первый
      const storedId = await AsyncStorage.getItem(SELECTED_PET_KEY);
      const restored = storedId ? activePets.find((pet) => pet.id === storedId) : null;
      setSelectedPet(restored || activePets[0] || null);
    } catch (error) {
      console.error('❌ PetContext: error loading pets:', error);
      setPets([]);
      setSelectedPet(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ═══ LOAD ON MOUNT / USER CHANGE ═══
  useEffect(() => {
    loadPets();
  }, [loadPets]);

  // ═══ ADD PET (Supabase) ═══
  const addPet = async (petData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .insert([{ ...petData, owner_id: user.id, is_active: true }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ PetContext: pet added:', data.id);
      await loadPets();
      return data;
    } catch (error) {
      console.error('❌ PetContext: error adding pet:', error);
      throw error;
    }
  };

  // ═══ UPDATE PET (Supabase) ═══
  const updatePet = async (petId, updates) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .update(updates)
        .eq('id', petId)
        .eq('owner_id', user.id)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ PetContext: pet updated:', petId);
      await loadPets();
      return data;
    } catch (error) {
      console.error('❌ PetContext: error updating pet:', error);
      throw error;
    }
  };

  // ═══ DELETE PET (soft delete is_active = false) ═══
  const deletePet = async (petId) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('pets')
        .update({ is_active: false })
        .eq('id', petId)
        .eq('owner_id', user.id);

      if (error) throw error;

      console.log('✅ PetContext: pet soft-deleted:', petId);

      // Если удалён выбранный питомец — сбрасываем сохранённый выбор
      if (selectedPet?.id === petId) {
        await AsyncStorage.removeItem(SELECTED_PET_KEY);
      }

      await loadPets();
    } catch (error) {
      console.error('❌ PetContext: error deleting pet:', error);
      throw error;
    }
  };

  // ═══ SELECT PET ═══
  const selectPet = async (petId) => {
    try {
      const pet = pets.find((p) => p.id === petId);
      if (pet) {
        setSelectedPet(pet);
        await AsyncStorage.setItem(SELECTED_PET_KEY, petId);
      }
    } catch (error) {
      console.error('❌ PetContext: error selecting pet:', error);
    }
  };

  // ═══ CONTEXT VALUE (signatures unchanged) ═══
  const value = {
    pets,
    selectedPet,
    loading,
    addPet,
    updatePet,
    deletePet,
    selectPet,
    refreshPets: loadPets,
  };

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}
