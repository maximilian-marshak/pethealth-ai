// ══════════════════════════════════════════════════
// src/context/PetContext.js
// ══════════════════════════════════════════════════

import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loading, setLoading] = useState(true);

  // ═══ LOAD PETS FROM STORAGE ═══
  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const storedPets = await AsyncStorage.getItem('pets');
      const storedSelectedId = await AsyncStorage.getItem('selectedPetId');

      if (storedPets) {
        const parsedPets = JSON.parse(storedPets);
        setPets(parsedPets);

        if (storedSelectedId) {
          const selected = parsedPets.find(pet => pet.id === storedSelectedId);
          setSelectedPet(selected || parsedPets[0] || null);
        } else {
          setSelectedPet(parsedPets[0] || null);
        }
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  // ═══ ADD PET ═══
  const addPet = async (newPet) => {
    try {
      const petWithId = {
        ...newPet,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };

      const updatedPets = [...pets, petWithId];
      setPets(updatedPets);
      await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));

      // Auto-select first pet
      if (!selectedPet) {
        setSelectedPet(petWithId);
        await AsyncStorage.setItem('selectedPetId', petWithId.id);
      }

      return petWithId;
    } catch (error) {
      console.error('Error adding pet:', error);
      throw error;
    }
  };

  // ═══ UPDATE PET ═══
  const updatePet = async (petId, updates) => {
    try {
      const updatedPets = pets.map(pet =>
        pet.id === petId ? { ...pet, ...updates, updated_at: new Date().toISOString() } : pet
      );

      setPets(updatedPets);
      await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));

      // Update selected pet if it's the one being updated
      if (selectedPet?.id === petId) {
        setSelectedPet({ ...selectedPet, ...updates });
      }
    } catch (error) {
      console.error('Error updating pet:', error);
      throw error;
    }
  };

  // ═══ DELETE PET ═══
  const deletePet = async (petId) => {
    try {
      const updatedPets = pets.filter(pet => pet.id !== petId);
      setPets(updatedPets);
      await AsyncStorage.setItem('pets', JSON.stringify(updatedPets));

      // If deleted pet was selected, select first remaining pet
      if (selectedPet?.id === petId) {
        const newSelected = updatedPets[0] || null;
        setSelectedPet(newSelected);
        if (newSelected) {
          await AsyncStorage.setItem('selectedPetId', newSelected.id);
        } else {
          await AsyncStorage.removeItem('selectedPetId');
        }
      }
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  };

  // ═══ SELECT PET ═══
  const selectPet = async (petId) => {
    try {
      const pet = pets.find(p => p.id === petId);
      if (pet) {
        setSelectedPet(pet);
        await AsyncStorage.setItem('selectedPetId', petId);
      }
    } catch (error) {
      console.error('Error selecting pet:', error);
    }
  };

  // ═══ CONTEXT VALUE ═══
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
