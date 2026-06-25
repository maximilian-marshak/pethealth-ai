// ══════════════════════════════════════════════════
// src/screens/AIAssistantHubScreen.js
// ══════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePetContext } from '../context/PetContext';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';

export default function AIAssistantHubScreen({ navigation }) {
  const { selectedPet, pets, selectPet } = usePetContext();
  const { t } = useTranslation('ai');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
      description: t('hub.categories.emergency.description'),
      questions: [
        t('hub.categories.emergency.q1'),
        t('hub.categories.emergency.q2'),
        t('hub.categories.emergency.q3'),
      ],
    },
    {
      id: 'relocation',
      title: t('hub.categories.relocation.title'),
      icon: 'airplane',
      description: t('hub.categories.relocation.description'),
      questions: [
        t('hub.categories.relocation.q1'),
        t('hub.categories.relocation.q2'),
        t('hub.categories.relocation.q3'),
      ],
    },
    {
      id: 'general',
      title: t('hub.categories.general.title'),
      icon: 'help-circle',
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
      color: theme.assistantCategories[category.id],
    });
  };

  const handleQuickQuestion = (category, question) => {
    navigation.navigate('AIAssistantChat', {
      category: category.id,
      initialQuestion: question,
      title: category.title,
      color: theme.assistantCategories[category.id],
    });
  };

  const handleStartFreeChat = () => {
    navigation.navigate('AIAssistantChat', {
      category: 'free-chat',
      title: t('chat.defaultTitle'),
      color: theme.accent,
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
        color: theme.accent,
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
      color: theme.accent,
      photoUri,
      analysisType,
    });
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══ HEADER ═══ */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIcon}>
              <Ionicons name="chatbubbles" size={32} color={theme.onAccent} />
            </View>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handlePhotoAnalysis}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={24} color={theme.onAccent} />
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
            <Ionicons name="paw" size={24} color={theme.accent} />
            <View style={styles.petInfoText}>
              <Text style={styles.petName}>{selectedPet.name}</Text>
              <Text style={styles.petDetails}>
                {selectedPet.breed} • {selectedPet.age != null
                  ? t('common:yearsOld', { count: selectedPet.age })
                  : t('chat.unknownAge')}
              </Text>
            </View>
            {pets.length > 1 && (
              <Ionicons name="chevron-down" size={20} color={theme.t3} />
            )}
          </TouchableOpacity>
        )}

        {/* ═══ SECTION: ASK AI ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.sections.ai')}</Text>

        {/* ═══ FREE CHAT CARD ═══ */}
        <GlassCard variant="decor" style={styles.freeChatCard}>
          <TouchableOpacity
            style={styles.freeChatInner}
            onPress={handleStartFreeChat}
            activeOpacity={0.8}
          >
            <View style={styles.freeChatIcon}>
              <Ionicons name="chatbubble-ellipses" size={28} color={theme.onAccent} />
            </View>
            <View style={styles.freeChatContent}>
              <Text style={styles.freeChatTitle}>{t('hub.freeChat')}</Text>
              <Text style={styles.freeChatSubtitle}>{t('hub.freeChatSubtitle')}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={theme.accent} />
          </TouchableOpacity>
        </GlassCard>

        {/* ═══ PHOTO ANALYSIS CARD ═══ */}
        <GlassCard variant="decor" style={styles.photoAnalysisCard}>
          <TouchableOpacity
            style={styles.photoAnalysisInner}
            onPress={handlePhotoAnalysis}
            activeOpacity={0.8}
          >
            <View style={styles.photoAnalysisIcon}>
              <Ionicons name="camera" size={28} color={theme.onAccent} />
            </View>
            <View style={styles.photoAnalysisContent}>
              <Text style={styles.photoAnalysisTitle}>{t('hub.photoAnalysis')}</Text>
              <Text style={styles.photoAnalysisSubtitle}>{t('hub.photoAnalysisSubtitle')}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={theme.accent} />
          </TouchableOpacity>
        </GlassCard>

        {/* ═══ CATEGORIES GRID ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.browseByCategory')}</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const catColor = theme.assistantCategories[category.id];
            return (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryCard, { borderLeftColor: catColor }]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryIcon, { backgroundColor: catColor + '20' }]}>
                <Ionicons name={category.icon} size={28} color={catColor} />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>{category.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.t3} />
            </TouchableOpacity>
          ); })}
        </View>

        {/* ═══ QUICK QUESTIONS ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.popularQuestions')}</Text>
        {categories.slice(0, 3).map((category) => {
          const catColor = theme.assistantCategories[category.id];
          return (
          <View key={category.id} style={styles.quickQuestionsSection}>
            <Text style={[styles.quickQuestionsHeader, { color: catColor }]}>
              {category.title}
            </Text>
            {category.questions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionCard}
                onPress={() => handleQuickQuestion(category, question)}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={20} color={catColor} />
                <Text style={styles.quickQuestionText}>{question}</Text>
                <Ionicons name="arrow-forward" size={16} color={theme.t3} />
              </TouchableOpacity>
            ))}
          </View>
        ); })}

        {/* ═══ SECTION: REFERENCE (статика, без AI) ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.sections.reference')}</Text>
        <GlassCard variant="decor" style={styles.freeChatCard}>
          <TouchableOpacity
            style={styles.freeChatInner}
            onPress={() => navigation.navigate('KnowledgeBase')}
            activeOpacity={0.8}
          >
            <View style={[styles.freeChatIcon, { backgroundColor: theme.accentPress }]}>
              <Ionicons name="library" size={28} color={theme.onAccent} />
            </View>
            <View style={styles.freeChatContent}>
              <Text style={styles.freeChatTitle}>{t('knowledge.title')}</Text>
              <Text style={styles.freeChatSubtitle}>{t('hub.knowledgeSubtitle')}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={theme.accent} />
          </TouchableOpacity>
        </GlassCard>

        <GlassCard variant="decor" style={styles.freeChatCard}>
          <TouchableOpacity
            style={styles.freeChatInner}
            onPress={() => navigation.navigate('Relocation')}
            activeOpacity={0.8}
          >
            <View style={[styles.freeChatIcon, { backgroundColor: theme.accentPress }]}>
              <Ionicons name="airplane" size={26} color={theme.onAccent} />
            </View>
            <View style={styles.freeChatContent}>
              <Text style={styles.freeChatTitle}>{t('relocation.title')}</Text>
              <Text style={styles.freeChatSubtitle}>{t('hub.relocationSubtitle')}</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color={theme.accent} />
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* ═══ FAB ═══ */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleStartFreeChat}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubbles" size={28} color={theme.onAccent} />
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
                    <Ionicons name="paw" size={20} color={isActive ? theme.accent : theme.t3} />
                    <View style={styles.pickerRowText}>
                      <Text style={styles.pickerRowName}>{pet.name}</Text>
                      <Text style={styles.pickerRowDetails}>
                        {pet.breed} • {pet.age != null
                          ? t('common:yearsOld', { count: pet.age })
                          : t('chat.unknownAge')}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

// ═══ STYLES ═══
const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // theme-neutral scrim
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: theme.radii.r20,
    borderTopRightRadius: theme.radii.r20,
    padding: 20,
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.t1,
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm12,
    marginBottom: 8,
    backgroundColor: theme.surface,
    gap: 12,
  },
  pickerRowActive: {
    backgroundColor: theme.accent + '20',
    borderWidth: 1,
    borderColor: theme.accent,
  },
  pickerRowText: {
    flex: 1,
  },
  pickerRowName: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.t1,
  },
  pickerRowDetails: {
    fontSize: 13,
    color: theme.t2,
    marginTop: 2,
  },
  header: {
    backgroundColor: theme.accentPress,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: theme.radii.xl28,
    borderBottomRightRadius: theme.radii.xl28,
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
    borderRadius: theme.radii.pill999,
    backgroundColor: theme.onAccent + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoButton: {
    position: 'absolute',
    right: 0,
    width: 48,
    height: 48,
    borderRadius: theme.radii.lg24,
    backgroundColor: theme.onAccent + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.onAccent + '4D',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: theme.font.bold,
    color: theme.onAccent,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.onAccent + 'E6',
    textAlign: 'center',
  },
  petInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    marginTop: -20,
    padding: 16,
    borderRadius: theme.radii.md16,
    shadowColor: theme.shadow.shadowColor,
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
    fontFamily: theme.font.bold,
    color: theme.t1,
  },
  petDetails: {
    fontSize: 14,
    color: theme.t2,
    marginTop: 2,
  },
  freeChatCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: theme.radii.r20,
  },
  freeChatInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  freeChatIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.xl28,
    backgroundColor: theme.onAccent + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  freeChatContent: {
    flex: 1,
  },
  freeChatTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.t1,
    marginBottom: 4,
  },
  freeChatSubtitle: {
    fontSize: 14,
    color: theme.t2,
  },
  photoAnalysisCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: theme.radii.r20,
  },
  photoAnalysisInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoAnalysisIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.xl28,
    backgroundColor: theme.onAccent + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  photoAnalysisContent: {
    flex: 1,
  },
  photoAnalysisTitle: {
    fontSize: 18,
    fontFamily: theme.font.bold,
    color: theme.t1,
    marginBottom: 4,
  },
  photoAnalysisSubtitle: {
    fontSize: 14,
    color: theme.t2,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.font.bold,
    color: theme.t1,
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
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: theme.radii.md16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.md16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    color: theme.t1,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: theme.t2,
  },
  quickQuestionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickQuestionsHeader: {
    fontSize: 16,
    fontFamily: theme.font.semibold,
    marginBottom: 12,
  },
  quickQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: theme.radii.sm12,
    marginBottom: 8,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quickQuestionText: {
    flex: 1,
    fontSize: 14,
    color: theme.t1,
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
    borderRadius: theme.radii.pill999,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
