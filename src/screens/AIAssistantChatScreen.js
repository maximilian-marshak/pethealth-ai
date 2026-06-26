// ══════════════════════════════════════════════════
// src/screens/AIAssistantChatScreen.js
// ══════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import Screen from '../components/Screen';
import GlassCard from '../components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { usePetContext } from '../context/PetContext';
import { usePetHealth } from '../hooks/usePetHealth';
import { useUnits } from '../hooks/useUnits';
import { useAuth } from '../context/AuthContext';
import { useConversation } from '../hooks/useConversation';
import { sendMessageToOpenAI } from '../services/openAIService';
import { analyzeImageWithVision, formatVisionResponse } from '../services/visionService';

export default function AIAssistantChatScreen({ route, navigation }) {
  const {
    category,
    initialQuestion,
    title,
    color,
    photoUri,
    analysisType,
  } = route.params || {};

  const { selectedPet } = usePetContext();
  const { user } = useAuth();
  const { getOrCreateConversation, loadMessages, addMessage, clearConversation } = useConversation();
  const { t } = useTranslation('ai');
  const health = usePetHealth(selectedPet?.id);
  const { unit } = useUnits();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Цвет категории (из хаба, уже токен) — для аватара ассистента в шапке.
  const catColor = color || theme.accent;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const dotAnimation = useRef(new Animated.Value(0)).current;
  const conversationIdRef = useRef(null);
  const didAutoActRef = useRef(false);

  // ═══ ЗАГОЛОВОК: нативный скрыт — кастомная glass-шапка в теле (эталон) ═══
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Очистка чата (была в нативном headerRight → теперь ellipsis кастомной шапки). Логика та же.
  const handleClearChat = () => {
    Alert.alert(t('chat.clearChat'), t('chat.clearChatMessage'), [
      { text: t('hub.cancel'), style: 'cancel' },
      {
        text: t('chat.clear'),
        style: 'destructive',
        onPress: async () => {
          try {
            if (conversationIdRef.current) {
              await clearConversation(conversationIdRef.current);
            }
          } catch (e) {
            console.error('❌ clearConversation failed:', e);
            Alert.alert(t('chat.clearError'));
          }
          setMessages([]);
        },
      },
    ]);
  };

  // ═══ ИНИЦИАЛИЗАЦИЯ: беседа + история ДО авто-действий ═══
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (user?.id) {
        try {
          const convId = await getOrCreateConversation(
            user.id,
            selectedPet?.id ?? null,
            selectedPet?.name ?? null
          );
          if (cancelled) return;
          conversationIdRef.current = convId;

          const loaded = await loadMessages(convId);
          if (cancelled) return;

          setMessages(
            loaded.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: m.created_at,
            }))
          );
        } catch (e) {
          console.error('❌ Failed to load conversation:', e);
          if (!cancelled) Alert.alert(t('chat.historyError'));
        }
      }

      // Авто-действие из route params — один раз, ПОСЛЕ загрузки истории
      if (!cancelled && !didAutoActRef.current) {
        didAutoActRef.current = true;
        if (photoUri && analysisType) {
          handlePhotoAnalysis(photoUri, analysisType);
        } else if (initialQuestion) {
          handleSendMessage(initialQuestion, true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, selectedPet?.id]);

  // ═══ АНИМАЦИЯ ТОЧЕК ═══
  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnimation, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(dotAnimation, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      dotAnimation.setValue(0);
    }
  }, [isLoading]);

  // ═══ СОХРАНЕНИЕ УСПЕШНОЙ ПАРЫ (user + assistant) В БЕСЕДУ ═══
  const persistPair = async (userContent, assistantContent, tokensUsed = null) => {
    const convId = conversationIdRef.current;
    if (!convId) return;
    try {
      await addMessage(convId, 'user', userContent, null);
      await addMessage(convId, 'assistant', assistantContent, tokensUsed ?? null);
    } catch (e) {
      console.error('❌ Failed to persist messages:', e);
    }
  };

  // ═══ АНАЛИЗ ФОТО ═══
  const handlePhotoAnalysis = async (uri, type) => {
    setIsLoading(true);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: getAnalysisPrompt(type),
      timestamp: new Date().toISOString(),
      imageUri: uri,
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const visionResult = await analyzeImageWithVision(uri, type);
      const formattedResponse = formatVisionResponse(visionResult);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: formattedResponse,
        timestamp: new Date().toISOString(),
        isVisionAnalysis: true,
        visionResult,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Сохраняем успешную пару (visionService не возвращает usage → null)
      await persistPair(userMessage.content, formattedResponse, visionResult?.usage?.total_tokens ?? null);

      if (visionResult.success && visionResult.result.urgency === 'red') {
        Alert.alert(
          t('chat.urgentAlertTitle'),
          t('chat.urgentAlertMessage'),
          [
            { text: 'OK', style: 'default' },
            { text: t('chat.findVet'), style: 'default', onPress: () => {} },
          ]
        );
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${t('chat.errorPrefix')} ${error.message}\n\n${t('chat.errorRetry')}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══ ПРИКРЕПЛЕНИЕ ФОТО (attach) ═══
  // Зеркалит пикер из AIAssistantHubScreen, но вместо навигации зовёт
  // СУЩЕСТВУЮЩИЙ in-screen обработчик handlePhotoAnalysis(uri, type).
  const handleAttachPhoto = () => {
    if (isLoading) return;
    Alert.alert(
      t('hub.photoSourceTitle'),
      t('hub.photoSourceMessage'),
      [
        { text: t('hub.takePhoto'), onPress: () => attachFromCamera() },
        { text: t('hub.chooseGallery'), onPress: () => attachFromGallery() },
        { text: t('hub.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const attachFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('hub.permissionRequired'), t('hub.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.8, aspect: [4, 3],
    });
    if (!result.canceled) promptAttachAnalysisType(result.assets[0].uri);
  };

  const attachFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('hub.permissionRequired'), t('hub.galleryPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.8, aspect: [4, 3],
    });
    if (!result.canceled) promptAttachAnalysisType(result.assets[0].uri);
  };

  const promptAttachAnalysisType = (uri) => {
    Alert.alert(
      t('hub.analysisTypeTitle'),
      t('hub.analysisTypeMessage'),
      [
        { text: t('hub.checkSymptoms'), onPress: () => handlePhotoAnalysis(uri, 'symptoms') },
        { text: t('hub.identifyBreed'), onPress: () => handlePhotoAnalysis(uri, 'breed') },
        { text: t('hub.generalAnalysis'), onPress: () => handlePhotoAnalysis(uri, 'general') },
      ],
      { cancelable: true }
    );
  };

  // ═══ ПРОМПТ ДЛЯ АНАЛИЗА ═══
  const getAnalysisPrompt = (type) => {
    const prompts = {
      symptoms: t('chat.promptSymptoms'),
      breed: t('chat.promptBreed'),
      general: t('chat.promptGeneral'),
    };
    return prompts[type] || prompts.general;
  };

  // ═══ ОТПРАВКА СООБЩЕНИЯ ═══
  const handleSendMessage = async (text = inputText, isInitial = false) => {
    if (!text.trim() && !isInitial) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendMessageToOpenAI(text.trim(), messages, { selectedPet, category, health, unit });

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: response.timestamp,
        isEmergency: response.isEmergency,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Сохраняем успешную пару (user + assistant)
      await persistPair(userMessage.content, response.message, response.usage?.total_tokens ?? null);

      if (response.isEmergency) {
        Alert.alert(t('chat.emergencyAlert'), t('chat.emergencyMessage'));
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${t('chat.errorChat')} ${error.message}\n\n${t('chat.errorChatRetry')}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ═══ EMPTY STATE ═══
  // Подсказки-вопросы: используются и в пустом состоянии, и в quick-replies над вводом.
  const suggestedQuestions = [
    t('chat.suggestedQ1'),
    t('chat.suggestedQ2'),
    t('chat.suggestedQ3'),
    t('chat.suggestedQ4'),
  ];
  // Индекс первого ассистент-сообщения (glow только у него).
  const firstAssistantIndex = messages.findIndex((m) => m.role === 'assistant');

  // Пустое состояние — эталонный greeting-пузырь (bot-бабл с glow).
  // Подсказки вынесены в quick-replies над вводом; разделитель «Сегодня» — ListHeaderComponent.
  const renderEmptyState = () => {
    const title = selectedPet
      ? t('chat.emptyTitleWithPet', { name: selectedPet.name })
      : t('chat.emptyTitle');
    const welcome = selectedPet
      ? t('chat.emptyWelcomeWithPet', { name: selectedPet.name })
      : t('chat.emptyWelcome');
    return (
      <View
        style={[styles.messageContainer, styles.assistantMessage, styles.assistantGlow, styles.greetingBubble]}
      >
        <Text style={styles.greetingTitle}>{title}</Text>
        <Text style={[styles.messageText, styles.assistantText]}>{welcome}</Text>
      </View>
    );
  };

  // ═══ РЕНДЕР СООБЩЕНИЯ ═══
  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    const glow = !isUser && index === firstAssistantIndex;

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
          glow && styles.assistantGlow,
          item.isEmergency && styles.emergencyMessage,
          item.isError && styles.errorMessage,
        ]}
      >
        {item.imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.imageUri }}
              style={styles.messageImage}
              contentFit="cover"
              transition={200}
              placeholder={require('../../assets/icon.png')}
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="camera" size={16} color={theme.onAccent} />
            </View>
          </View>
        )}

        <Text
          style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
            item.isEmergency && styles.emergencyText,
            item.isError && styles.errorText,
          ]}
        >
          {item.content}
        </Text>

        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {item.isVisionAnalysis && item.visionResult?.success && (
          <View style={styles.visionBadge}>
            <Ionicons name="eye" size={12} color={theme.accent} />
            <Text style={styles.visionBadgeText}>
              {t('chat.visionBadge')} • {item.visionResult.model?.split('/')[1] || 'AI'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ═══ TYPING INDICATOR ═══
  const renderTypingIndicator = () => {
    const dot1Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [0.3, 1, 0.3, 0.3],
    });
    const dot2Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [0.3, 0.3, 1, 0.3],
    });
    const dot3Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.33, 0.66, 1],
      outputRange: [0.3, 0.3, 0.3, 1],
    });

    return (
      <View style={styles.typingIndicatorContainer}>
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3Opacity }]} />
        </View>
        <Text style={styles.typingText}>{t('chat.analyzingPhoto')}</Text>
      </View>
    );
  };

  return (
    <Screen edges={[]}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Custom glass-шапка (эталон): back + аватар(catColor)+online + title/статус + ellipsis */}
      <GlassCard variant="decor" radius={0} padding={0}>
        <View style={[styles.chatHeaderRow, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={26} color={theme.accent} />
          </TouchableOpacity>
          <View style={styles.chatAvatarWrap}>
            <View style={[styles.chatAvatar, { backgroundColor: catColor + '22' }]}>
              <Ionicons name="sparkles" size={20} color={catColor} />
            </View>
            <View style={styles.chatOnlineDot} />
          </View>
          <View style={styles.chatHeaderText}>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>{title || t('chat.defaultTitle')}</Text>
            <Text style={styles.chatHeaderStatus} numberOfLines={1}>
              {selectedPet ? t('chat.statusOnlineWithPet', { name: selectedPet.name }) : t('chat.statusOnline')}
            </Text>
          </View>
          <TouchableOpacity onPress={handleClearChat} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={22} color={theme.t3} />
          </TouchableOpacity>
        </View>
      </GlassCard>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={<Text style={styles.dayDivider}>{t('chat.today')}</Text>}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {isLoading && renderTypingIndicator()}

      {/* Quick-replies — горизонтальные чипы над вводом (из suggestedQuestions), видны всегда */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickRow}
        contentContainerStyle={styles.quickRowContent}
        keyboardShouldPersistTaps="handled"
      >
        {suggestedQuestions.map((q, i) => (
          <TouchableOpacity
            key={i}
            style={styles.quickChip}
            onPress={() => handleSendMessage(q, true)}
            disabled={isLoading}
          >
            <Text style={styles.quickChipText} numberOfLines={1}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Инпут — glass pill (GlassCard decor) + accent-кнопка */}
      <GlassCard variant="decor" style={styles.inputBar} radius={0} padding={12}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={handleAttachPhoto}
            disabled={isLoading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle-outline" size={28} color={theme.accent} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('chat.inputPlaceholder')}
            placeholderTextColor={theme.t4}
            multiline
            maxLength={1000}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Ionicons name="send" size={22} color={theme.onAccent} />
          </TouchableOpacity>
        </View>
      </GlassCard>
    </KeyboardAvoidingView>
    </Screen>
  );
}
// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Custom glass-шапка чата (эталон): аватар(catColor inline) + online(ok) + title/статус
  chatHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  chatAvatarWrap: { position: 'relative' },
  chatAvatar: {
    width: 42, height: 42, borderRadius: theme.radii.pill999,
    alignItems: 'center', justifyContent: 'center',
  },
  chatOnlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: theme.radii.pill999,
    backgroundColor: theme.ok, borderWidth: 2, borderColor: theme.bgBase,
  },
  chatHeaderText: { flex: 1 },
  chatHeaderTitle: { fontSize: 15.5, fontFamily: theme.font.bold, color: theme.t1 },
  chatHeaderStatus: { fontSize: 12, fontFamily: theme.font.semibold, color: theme.ok, marginTop: 1 },

  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    flexGrow: 1,
  },

  // Разделитель «Сегодня» над лентой
  dayDivider: {
    textAlign: 'center',
    fontSize: 11.5,
    fontFamily: theme.font.semibold,
    color: theme.t3,
    marginBottom: 14,
  },

  // Quick-replies (горизонтальные чипы над вводом)
  quickRow: { maxHeight: 48, flexGrow: 0 },
  quickRowContent: { paddingHorizontal: 16, paddingBottom: 8 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.pill999,
    backgroundColor: theme.accentTint,
    marginRight: 8,
  },
  quickChipText: { fontSize: 13, fontFamily: theme.font.bold, color: theme.accentPress },

  // Empty State — greeting-пузырь (bot-бабл)
  greetingBubble: {
    marginTop: 2,
  },
  greetingTitle: {
    fontSize: 15.5,
    fontFamily: theme.font.bold,
    color: theme.t1,
    marginBottom: 4,
  },

  // Messages
  messageContainer: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: theme.radii.r20,
  },
  // user-бабл — accentPress-заливка (белый на accent ≈2.4:1 не AA; accentPress лучше)
  userMessage: {
    backgroundColor: theme.accentPress,
    alignSelf: 'flex-end',
    maxWidth: '82%',
    borderBottomRightRadius: theme.radii.sm8,
  },
  // bot-бабл — data-стекло (surfaceGlassData) + hairline; текст t1
  assistantMessage: {
    backgroundColor: theme.surfaceGlassData.bg,
    alignSelf: 'flex-start',
    maxWidth: '88%',
    borderBottomLeftRadius: theme.radii.sm8,
    borderWidth: 1,
    borderColor: theme.hairline,
  },
  // glow-accent — только у первого ассистент-сообщения (по §6.2)
  assistantGlow: {
    shadowColor: theme.glowAccent.shadowColor,
    shadowOpacity: theme.glowAccent.shadowOpacity,
    shadowRadius: theme.glowAccent.shadowRadius,
    shadowOffset: theme.glowAccent.shadowOffset,
    elevation: theme.glowAccent.elevation,
  },
  emergencyMessage: {
    backgroundColor: theme.danger + '22',
    borderColor: theme.danger,
    borderWidth: 2,
  },
  errorMessage: {
    backgroundColor: theme.danger + '14',
    borderColor: theme.danger,
    borderWidth: 1,
  },
  
  // ✨ ИСПРАВЛЕНО: Улучшенные стили для фото
  imageContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 8,
    borderRadius: theme.radii.sm12,
    overflow: 'hidden',
    backgroundColor: theme.hairline,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.radii.sm12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // theme-neutral: бейдж-камера поверх фото
    borderRadius: theme.radii.sm12,
    padding: 4,
  },
  
  messageText: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  userText: {
    color: theme.onAccent,
  },
  assistantText: {
    color: theme.t1,
  },
  emergencyText: {
    color: theme.danger,
    fontFamily: theme.font.semibold,
  },
  errorText: {
    color: theme.danger,
  },
  timestamp: {
    fontSize: 11,
    color: theme.t3,
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  // ✨ Vision Analysis Badge
  visionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.hairline,
    gap: 4,
  },
  visionBadgeText: {
    fontSize: 11,
    color: theme.accent,
    fontFamily: theme.font.medium,
  },

  // Typing Indicator
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radii.md16,
    borderWidth: 1,
    borderColor: theme.hairline,
    marginRight: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.xs4,
    backgroundColor: theme.accent,
    marginHorizontal: 3,
  },
  typingText: {
    fontSize: 14,
    color: theme.t3,
    fontStyle: 'italic',
  },

  // Input Bar — glass pill (GlassCard decor), низ экрана
  inputBar: {
    marginHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: theme.hairline,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  // attach — слева, зовёт handleAttachPhoto (камера/галерея → handlePhotoAnalysis)
  attachButton: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: theme.surface,
    borderRadius: theme.radii.pill999,
    borderWidth: 1,
    borderColor: theme.hairline,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 14.5,
    color: theme.t1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.pill999,
    backgroundColor: theme.accentPress,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.hairline,
  },
});
