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

export default function AIAssistantHubScreen({ navigation }) {
  const { selectedPet, pets, selectPet } = usePetContext();
  const { t } = useTranslation('ai');
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Читаемая иконка на solid-подложке: белая (onAccent) на тёмных цветах,
  // тёмная (t1) на светлых — белая держит ≥3:1 только при яркости фона ≤0.30.
  const iconOn = (hex) => {
    const h = (hex || '').replace('#', '');
    if (h.length < 6) return theme.onAccent;
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const L = 0.2126 * lin(parseInt(h.slice(0, 2), 16))
      + 0.7152 * lin(parseInt(h.slice(2, 4), 16))
      + 0.0722 * lin(parseInt(h.slice(4, 6), 16));
    return L <= 0.30 ? theme.onAccent : theme.t1;
  };

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
        {/* ═══ HEADER (плоский, эталон) — subtitle/имя tappable → pet-picker ═══ */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('hub.title')}</Text>
          <TouchableOpacity
            style={styles.subtitleRow}
            onPress={() => setPickerVisible(true)}
            disabled={!selectedPet}
            activeOpacity={0.7}
          >
            <Text style={styles.headerSubtitle}>
              {selectedPet
                ? t('hub.subtitleWithPet', { name: selectedPet.name })
                : t('hub.subtitleNoPet')}
            </Text>
            {selectedPet && pets.length > 1 && (
              <Ionicons name="chevron-down" size={16} color={theme.t3} />
            )}
          </TouchableOpacity>
        </View>

        {/* ═══ ЭКШН-ПЛИТКИ: Free Chat + Photo (эталон tileBtn) ═══ */}
        <View style={styles.actionTiles}>
          <TouchableOpacity style={styles.tileBtn} onPress={handleStartFreeChat} activeOpacity={0.8}>
            <View style={[styles.tileChip, { backgroundColor: theme.accent }]}>
              <Ionicons name="chatbubbles" size={22} color={iconOn(theme.accent)} />
            </View>
            <View style={styles.tileText}>
              <Text style={styles.tileTitle}>{t('hub.freeChat')}</Text>
              <Text style={styles.tileSubtitle}>{t('hub.freeChatSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.t3} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.tileBtn} onPress={handlePhotoAnalysis} activeOpacity={0.8}>
            <View style={[styles.tileChip, { backgroundColor: theme.assistantCategories.general }]}>
              <Ionicons name="camera" size={22} color={theme.onAccent} />
            </View>
            <View style={styles.tileText}>
              <Text style={styles.tileTitle}>{t('hub.photoAnalysis')}</Text>
              <Text style={styles.tileSubtitle}>{t('hub.photoAnalysisSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.t3} />
          </TouchableOpacity>
        </View>

        {/* ═══ CATEGORIES GRID — 2 колонки квадратов (эталон) ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.browseByCategory')}</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const catColor = theme.assistantCategories[category.id];
            return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
            >
              <View style={[styles.categoryChip, { backgroundColor: catColor }]}>
                <Ionicons name={category.icon} size={20} color={theme.onAccent} />
              </View>
              <Text style={styles.categoryTitle}>{category.title}</Text>
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

        {/* ═══ SECTION: REFERENCE (статика, без AI) — tileBtn ═══ */}
        <Text style={styles.sectionTitle}>{t('hub.sections.reference')}</Text>
        <View style={styles.referenceTiles}>
          <TouchableOpacity
            style={styles.tileBtn}
            onPress={() => navigation.navigate('KnowledgeBase')}
            activeOpacity={0.8}
          >
            <View style={[styles.tileChip, { backgroundColor: theme.accent }]}>
              <Ionicons name="library" size={22} color={iconOn(theme.accent)} />
            </View>
            <View style={styles.tileText}>
              <Text style={styles.tileTitle}>{t('knowledge.title')}</Text>
              <Text style={styles.tileSubtitle}>{t('hub.knowledgeSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.t3} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tileBtn}
            onPress={() => navigation.navigate('Relocation')}
            activeOpacity={0.8}
          >
            <View style={[styles.tileChip, { backgroundColor: theme.assistantCategories.relocation }]}>
              <Ionicons name="airplane" size={22} color={theme.onAccent} />
            </View>
            <View style={styles.tileText}>
              <Text style={styles.tileTitle}>{t('relocation.title')}</Text>
              <Text style={styles.tileSubtitle}>{t('hub.relocationSubtitle')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.t3} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>

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
    paddingBottom: 24,
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
  // Плоский заголовок (эталон)
  header: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: theme.font.bold,
    color: theme.t1,
    letterSpacing: -0.4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.t2,
  },
  // Экшн-плитки Free Chat / Photo (эталон tileBtn)
  actionTiles: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  tileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.hairline,
    borderRadius: theme.radii.r18,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tileChip: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.r14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    flex: 1,
  },
  tileTitle: {
    fontSize: 15,
    fontFamily: theme.font.bold,
    color: theme.t1,
  },
  tileSubtitle: {
    fontSize: 12,
    color: theme.t2,
    marginTop: 2,
  },
  // Справочник — те же tileBtn, что и экшн-плитки (AH-1)
  referenceTiles: {
    paddingHorizontal: 20,
    gap: 12,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  categoryCard: {
    width: '48%',
    minHeight: 108,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.hairline,
    borderRadius: theme.radii.r18,
    padding: 14,
    marginBottom: 12,
    gap: 10,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryChip: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.r14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontFamily: theme.font.bold,
    color: theme.t1,
    lineHeight: 18,
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
    borderRadius: theme.radii.r14,
    borderWidth: 1,
    borderColor: theme.hairline,
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
});
