// ══════════════════════════════════════════════════
// src/screens/AIAssistantHubScreen.js (ФИНАЛЬНАЯ ВЕРСИЯ)
// ══════════════════════════════════════════════════

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePetContext } from '../context/PetContext';
import * as ImagePicker from 'expo-image-picker';

export default function AIAssistantHubScreen({ navigation }) {
  const { selectedPet } = usePetContext();

  // ═══ КАТЕГОРИИ (без изменений) ═══
  const categories = [
    {
      id: 'health',
      title: 'Health & Wellness',
      icon: 'medical',
      color: '#FF6B6B',
      description: 'Medical advice, symptoms, and preventive care',
      questions: [
        'What are signs of illness in dogs?',
        'How often should I visit the vet?',
        'Common health issues in cats',
      ],
    },
    {
      id: 'nutrition',
      title: 'Nutrition & Diet',
      icon: 'restaurant',
      color: '#4ECDC4',
      description: 'Feeding guidelines, recipes, and dietary needs',
      questions: [
        'Best diet for puppies',
        'How much should my pet eat?',
        'Foods toxic to pets',
      ],
    },
    {
      id: 'behavior',
      title: 'Behavior & Training',
      icon: 'school',
      color: '#FFD93D',
      description: 'Training tips, behavioral issues, and socialization',
      questions: [
        'How to stop excessive barking?',
        'Litter training for kittens',
        'Socializing an anxious dog',
      ],
    },
    {
      id: 'grooming',
      title: 'Grooming & Care',
      icon: 'cut',
      color: '#A8E6CF',
      description: 'Bathing, nail care, and hygiene tips',
      questions: [
        'How often to bathe my dog?',
        'Nail trimming best practices',
        'Brushing techniques for long hair',
      ],
    },
    {
      id: 'emergency',
      title: 'Emergency Guide',
      icon: 'alert-circle',
      color: '#FF8B94',
      description: 'First aid and emergency response',
      questions: [
        'What to do if my pet is choking?',
        'Signs of poisoning',
        'Emergency vet contacts',
      ],
    },
    {
      id: 'general',
      title: 'General Questions',
      icon: 'help-circle',
      color: '#B4A7D6',
      description: 'Ask anything about pet care',
      questions: [
        'Travel tips with pets',
        'Introducing a new pet to home',
        'Senior pet care',
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
      title: 'AI Chat',
      color: '#6C63FF',
    });
  };

  // ✨ ИСПРАВЛЕНО: Открыть меню выбора фото
  const handlePhotoAnalysis = async () => {
    Alert.alert(
      '📸 Photo Analysis',
      'Choose photo source',
      [
        {
          text: '📷 Take Photo',
          onPress: () => takePhoto(),
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: () => pickImage(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // ✨ ИСПРАВЛЕНО: Сделать фото (mediaTypes как массив)
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], // ✅ ИСПРАВЛЕНО: массив вместо MediaTypeOptions
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      navigation.navigate('AIAssistantChat', {
        category: 'photo-analysis',
        title: 'Photo Analysis',
        color: '#FF6B6B',
        photoUri: result.assets[0].uri,
        analysisType: 'symptoms',
      });
    }
  };

  // ✨ ИСПРАВЛЕНО: Выбрать из галереи (mediaTypes как массив)
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery access is needed to choose photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // ✅ ИСПРАВЛЕНО: массив вместо MediaTypeOptions
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      Alert.alert(
        'Analysis Type',
        'What would you like to analyze?',
        [
          {
            text: '🩺 Check Symptoms',
            onPress: () => navigateToPhotoAnalysis(result.assets[0].uri, 'symptoms'),
          },
          {
            text: '🏷️ Identify Breed',
            onPress: () => navigateToPhotoAnalysis(result.assets[0].uri, 'breed'),
          },
          {
            text: '🔍 General Analysis',
            onPress: () => navigateToPhotoAnalysis(result.assets[0].uri, 'general'),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const navigateToPhotoAnalysis = (photoUri, analysisType) => {
    console.log('📸 Photo URI received:', photoUri);
    console.log('📋 Analysis type:', analysisType);
    
    navigation.navigate('AIAssistantChat', {
      category: 'photo-analysis',
      title: analysisType === 'symptoms' ? 'Symptom Check' : 
             analysisType === 'breed' ? 'Breed Identification' : 
             'Photo Analysis',
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
          <Text style={styles.headerTitle}>AI Pet Assistant</Text>
          <Text style={styles.headerSubtitle}>
            {selectedPet
              ? `Ask me anything about ${selectedPet.name}'s care`
              : 'Ask me anything about pet care'}
          </Text>
        </View>

        {/* ═══ SELECTED PET INFO ═══ */}
        {selectedPet && (
          <View style={styles.petInfoCard}>
            <Ionicons name="paw" size={24} color="#6C63FF" />
            <View style={styles.petInfoText}>
              <Text style={styles.petName}>{selectedPet.name}</Text>
              <Text style={styles.petDetails}>
                {selectedPet.breed} • {selectedPet.age || 'Unknown age'}
              </Text>
            </View>
          </View>
        )}

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
            <Text style={styles.freeChatTitle}>Start Free Chat</Text>
            <Text style={styles.freeChatSubtitle}>Ask me anything about your pet</Text>
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
            <Text style={styles.photoAnalysisTitle}>Photo Analysis</Text>
            <Text style={styles.photoAnalysisSubtitle}>
              Check symptoms or identify breed
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color="#FF6B6B" />
        </TouchableOpacity>

        {/* ═══ CATEGORIES GRID ═══ */}
        <Text style={styles.sectionTitle}>Browse by Category</Text>
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
        <Text style={styles.sectionTitle}>Popular Questions</Text>
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
    </SafeAreaView>
  );
}

// ═══ STYLES (без изменений) ═══
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100,
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
