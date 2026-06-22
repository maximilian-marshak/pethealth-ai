// ══════════════════════════════════════════════════
// src/screens/AIAssistantHubScreen.js
// ══════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePetContext } from '../context/PetContext';
import * as ImagePicker from 'expo-image-picker';

export default function AIAssistantHubScreen({ navigation }) {
  const { selectedPet, pets, selectPet } = usePetContext();
  const { t } = useTranslation('ai');
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSelectPet = async (petId) => {
    await selectPet(petId);
    setPickerVisible(false);
  };

  // ═══ КАТЕГОРИИ ═══
  const categories = [
    {
      id: 'health',
      title: t('hub.categories.health.title'),
      icon: 'medical',
      color: '#FF6B6B',
      description: t('hub.categories.health.description'),
      questions: [
        t('hub.categories.health.q1'),
        t('hub.categories.health.q2'),
        t('hub.categories.health.q3'),
      ],
    },
    {
      id: 'nutrition',
      title: t('hub.categories.nutrition.title'),
      icon: 'restaurant',
      color: '#4ECDC4',
      description: t('hub.categories.nutrition.description'),
      questions: [
        t('hub.categories.nutrition.q1'),
        t('hub.categories.nutrition.q2'),
        t('hub.categories.nutrition.q3'),
      ],
    },
    {
      id: 'behavior',
      title: t('hub.categories.behavior.title'),
      icon: 'school',
      color: '#FFD93D',
      description: t('hub.categories.behavior.description'),
      questions: [
        t('hub.categories.behavior.q1'),
        t('hub.categories.behavior.q2'),
        t('hub.categories.behavior.q3'),
      ],
    },
    {
      id: 'grooming',
      title: t('hub.categories.grooming.title'),
      icon: 'cut',
      color: '#A8E6CF',
      description: t('hub.categories.grooming.description'),
      questions: [
        t('hub.categories.grooming.q1'),
        t('hub.categories.grooming.q2'),
        t('hub.categories.grooming.q3'),
      ],
    },
    {
      id: 'emergency',
      title: t('hub.categories.emergency.title'),
      icon: 'alert-circle',
      color: '#FF8B94',
      description: t('hub.categories.emergency.description'),
      questions: [
        t('hub.categories.emergency.q1'),
        t('hub.categories.emergency.q2'),
        t('hub.categories.emergency.q3'),
      ],
    },
    {
      id: 'general',
      title: t('hub.categories.general.title'),
      icon: 'help-circle',
      color: '#B4A7D6',
      description: t('hub.categories.general.description'),
      questions: [
        t('hub.categories.general.q1'),
        t('hub.categories.general.q2'),
        t('hub.categories.general.q3'),
      ],
    },
  ];

  // ═══ ОБРАБОТЧИКИ ═══
  const handleCategoryPress = (category) => {
    navigation.navigate('AIAssistantChat', {
      category: category.id,
      title: category.title,
      color: category.color,
    });
  };

  const handleQuickQuestion = (category, question) => {
    navigation.navigate('AIAssistantChat', {
      category: category.id,
      initialQuestion: question,
      title: category.title,
      color: category.color,
    });
  };

  const handleStartFreeChat = () => {
    navigation.navigate('AIAssistantChat', {
      category: 'free-chat',
      title: t('chat.defaultTitle'),
      color: '#6C63FF',
    });
  };

  const handlePhotoAnalysis = async () => {
    Alert.alert(
      t('hub.photoSourceTitle'),
      t('hub.photoSourceMessage'),
      [
        { text: t('hub.takePhoto'), onPress: () => takePhoto() },
        { text: t('hub.chooseGallery'), onPress: () => pickImage() },
        { text: t('hub.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('hub.permissionRequired'), t('hub.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      navigation.navigate('AIAssistantChat', {
        category: 'photo-analysis',
        title: t('chat.titleSymptoms'),
        color: '#FF6B6B',
        photoUri: result.assets[0].uri,
        analysisType: 'symptoms',
      });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('hub.permissionRequired'), t('hub.galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      Alert.alert(
        t('hub.analysisTypeTitle'),
        t('hub.analysisTypeMessage'),
        [
          {
            text: t('hub.checkSymptoms'),
            onPress: () => navigateToPhotoAnalysis(result.assets[0].uri, 'symptoms'),
          },
          {
            text: t('hub.identifyBreed'),
            onPress: () => navigateToPhotoAnalysis(result.assets[0].uri, 'breed'),
          },
          {
            text: t('hub.generalAnalysis'),
            onPress: () => navigateToPhotoAnalysis(result.assets[0].uri, 'general'),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const navigateToPhotoAnalysis = (photoUri, analysisType) => {
    const titleMap = {
      symptoms: t('chat.titleSymptoms'),
      breed: t('chat.titleBreed'),
      general: t('chat.titleGeneral'),
    };

    navigation.navigate('AIAssistantChat', {
      category: 'photo-analysis',
      title: titleMap[analysisType] || titleMap.general,
      color: '#FF6B6B',
      photoUri,
      analysisType,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="chatbubbles" size={32} color="#FFFFFF" />
            </View>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePhotoAnalysis}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>{t('hub.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {selectedPet
              ? t('hub.subtitleWithPet', { name: selectedPet.name })
              : t('hub.subtitleNoPet')}
          </Text>
        </View>

        {/* ═══ SELECTED PET INFO (тап → выбор питомца) ═══ */}
        {selectedPet && (
          <TouchableOpacity
            style={styles.petInfoCard}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="paw" size={24} color="#6C63FF" />
            <View style={styles.petInfoText}>
              <Text style={styles.petName}>{selectedPet.name}</Text>
              <Text style={styles.petDetails}>
                {selectedPet.breed} • {selectedPet.age != null
                  ? t('common:yearsOld', { count: selectedPet.age })
                  : t('chat.unknownAge')}
              </Text>
            </View>
            {pets.length > 1 && (
              <Ionicons name="chevron-down" size={20} color="#999" />
            )}
          </TouchableOpacity>
        )}

        {/* ═══ SECTION: ASK AI ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.sections.ai')}</Text>

        {/* ═══ FREE CHAT CARD ═══ */}
        <TouchableOpacity
          style={styles.freeChatCard}
          onPress={handleStartFreeChat}
          activeOpacity={0.8}
        >
          <View style={styles.freeChatIcon}>
            <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.freeChatContent}>
            <Text style={styles.freeChatTitle}>{t('hub.freeChat')}</Text>
            <Text style={styles.freeChatSubtitle}>{t('hub.freeChatSubtitle')}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color="#6C63FF" />
        </TouchableOpacity>

        {/* ═══ PHOTO ANALYSIS CARD ═══ */}
        <TouchableOpacity
          style={styles.photoAnalysisCard}
          onPress={handlePhotoAnalysis}
          activeOpacity={0.8}
        >
          <View style={styles.photoAnalysisIcon}>
            <Ionicons name="camera" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.photoAnalysisContent}>
            <Text style={styles.photoAnalysisTitle}>{t('hub.photoAnalysis')}</Text>
            <Text style={styles.photoAnalysisSubtitle}>{t('hub.photoAnalysisSubtitle')}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color="#FF6B6B" />
        </TouchableOpacity>

        {/* ═══ CATEGORIES GRID ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.browseByCategory')}</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { borderLeftColor: category.color }]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                <Ionicons name={category.icon} size={28} color={category.color} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ═══ QUICK QUESTIONS ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.popularQuestions')}</Text>
        {categories.slice(0, 3).map((category) => (
          <View key={category.id} style={styles.quickQuestionsSection}>
            <Text style={[styles.quickQuestionsHeader, { color: category.color }]}>
              {category.title}
            </Text>
            {category.questions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionCard}
                onPress={() => handleQuickQuestion(category, question)}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={20} color={category.color} />
                <Text style={styles.quickQuestionText}>{question}</Text>
                <Ionicons name="arrow-forward" size={16} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* ═══ SECTION: REFERENCE (статика, без AI) ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.sections.reference')}</Text>
        <TouchableOpacity
          style={styles.freeChatCard}
          onPress={() => navigation.navigate('KnowledgeBase')}
          activeOpacity={0.8}
        >
          <View style={[styles.freeChatIcon, { backgroundColor: '#6B4EFF' }]}>
            <Ionicons name="library" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.freeChatContent}>
            <Text style={styles.freeChatTitle}>{t('knowledge.title')}</Text>
            <Text style={styles.freeChatSubtitle}>{t('hub.knowledgeSubtitle')}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color="#6B4EFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.freeChatCard}
          onPress={() => navigation.navigate('Relocation')}
          activeOpacity={0.8}
        >
          <View style={[styles.freeChatIcon, { backgroundColor: '#6B4EFF' }]}>
            <Ionicons name="airplane" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.freeChatContent}>
            <Text style={styles.freeChatTitle}>{t('relocation.title')}</Text>
            <Text style={styles.freeChatSubtitle}>{t('hub.relocationSubtitle')}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color="#6B4EFF" />
        </TouchableOpacity>

        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* ═══ FAB ═══ */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleStartFreeChat}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ═══ PET PICKER MODAL ═══ */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>{t('hub.choosePet')}</Text>
            <ScrollView>
              {pets.map((pet) => {
                const isActive = pet.id === selectedPet?.id;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={[styles.pickerRow, isActive && styles.pickerRowActive]}
                    onPress={() => handleSelectPet(pet.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="paw" size={20} color={isActive ? '#6C63FF' : '#999'} />
                    <View style={styles.pickerRowText}>
                      <Text style={styles.pickerRowName}>{pet.name}</Text>
                      <Text style={styles.pickerRowDetails}>
                        {pet.breed} • {pet.age != null
                          ? t('common:yearsOld', { count: pet.age })
                          : t('chat.unknownAge')}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color="#6C63FF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ═══ STYLES ═══
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    gap: 12,
  },
  pickerRowActive: {
    backgroundColor: '#6C63FF20',
    borderWidth: 1,
    borderColor: '#6C63FF',
  },
  pickerRowText: {
    flex: 1,
  },
  pickerRowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  pickerRowDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  header: {
    backgroundColor: '#6C63FF',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButton: {
    position: 'absolute',
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  petInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  petInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  petDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  freeChatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  freeChatIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  freeChatContent: {
    flex: 1,
  },
  freeChatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  freeChatSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  photoAnalysisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  photoAnalysisIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  photoAnalysisContent: {
    flex: 1,
  },
  photoAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoAnalysisSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  categoriesGrid: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#666',
  },
  quickQuestionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickQuestionsHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quickQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickQuestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  footerSpacing: {
    height: 40,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
