// ══════════════════════════════════════════════════
// src/screens/AIAssistantChatScreen.js
// ══════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

// Читаемый текст на цветной (category) подложке: по относительной яркости фона
// выбираем тёмный (t1) на светлых категориях / onAccent на тёмных — контраст AA.
const readableText = (hex, theme) => {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return theme.onAccent;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? theme.t1 : theme.onAccent;
};

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
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Цвет категории (из хаба, уже токен) + читаемый на нём текст/иконки.
  const catColor = color || theme.accent;
  const onCat = readableText(catColor, theme);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const dotAnimation = useRef(new Animated.Value(0)).current;
  const conversationIdRef = useRef(null);
  const didAutoActRef = useRef(false);

  // ═══ ЗАГОЛОВОК ═══
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: title || t('chat.defaultTitle'),
      headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
      headerStyle: { backgroundColor: catColor },
      headerTintColor: onCat,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
          <Ionicons name="arrow-back" size={24} color={onCat} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              t('chat.clearChat'),
              t('chat.clearChatMessage'),
              [
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
              ]
            )
          }
          style={{ marginRight: 10 }}
        >
          <Ionicons name="trash-outline" size={22} color={onCat} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, title, color, t, catColor, onCat]);

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
  const renderEmptyState = () => {
    const suggestedQuestions = [
      t('chat.suggestedQ1'),
      t('chat.suggestedQ2'),
      t('chat.suggestedQ3'),
      t('chat.suggestedQ4'),
    ];

    return (
      <View style={styles.emptyStateContainer}>
        <View style={[styles.emptyStateIcon, { backgroundColor: catColor }]}>
          <Ionicons name={selectedPet ? 'paw' : 'chatbubbles'} size={48} color={onCat} />
        </View>
        <Text style={styles.emptyStateTitle}>
          {selectedPet
            ? t('chat.emptyTitleWithPet', { name: selectedPet.name })
            : t('chat.emptyTitle')}
        </Text>
        <Text style={styles.emptyStateSubtitle}>
          {selectedPet
            ? t('chat.emptyWelcomeWithPet', { name: selectedPet.name })
            : t('chat.emptyWelcome')}
        </Text>
        <View style={styles.suggestedQuestionsContainer}>
          <Text style={styles.suggestedQuestionsTitle}>{t('chat.tryAsking')}</Text>
          {suggestedQuestions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestedQuestionButton}
              onPress={() => handleSendMessage(question, true)}
            >
              <Ionicons name="help-circle-outline" size={20} color={catColor} />
              <Text style={styles.suggestedQuestionText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ═══ РЕНДЕР СООБЩЕНИЯ ═══
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
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
      {selectedPet && (
        <View style={[styles.petHeader, { backgroundColor: catColor }]}>
          <Ionicons name="paw" size={20} color={onCat} />
          <Text style={[styles.petHeaderText, { color: onCat }]}>
            {t('chat.petHeader', {
              name: selectedPet.name,
              breed: selectedPet.breed,
              age: selectedPet.age || t('chat.unknownAge'),
            })}
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={renderEmptyState}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {isLoading && renderTypingIndicator()}

      {/* Инпут — glass pill (GlassCard decor) + accent-кнопка */}
      <GlassCard variant="decor" style={styles.inputBar} radius={0} padding={12}>
        <View style={styles.inputRow}>
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

  // Pet Header (bg = category-цвет inline; текст onCat inline по контрасту)
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  petHeaderText: {
    fontSize: 14,
    color: theme.onAccent,
    fontWeight: '600',
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    flexGrow: 1,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  emptyStateIcon: {
    width: 96,
    height: 96,
    borderRadius: theme.radii.pill999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.t1,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.t2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  suggestedQuestionsContainer: {
    width: '100%',
  },
  suggestedQuestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.t3,
    marginBottom: 12,
    textAlign: 'center',
  },
  suggestedQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 14,
    borderRadius: theme.radii.sm12,
    marginBottom: 10,
    shadowColor: theme.shadow.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  suggestedQuestionText: {
    flex: 1,
    fontSize: 14,
    color: theme.t1,
    marginLeft: 10,
  },

  // Messages
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: theme.radii.md16,
    maxWidth: '80%',
  },
  // user-бабл — accentPress-заливка (белый на accent ≈2.4:1 не AA; accentPress лучше)
  userMessage: {
    backgroundColor: theme.accentPress,
    alignSelf: 'flex-end',
    borderBottomRightRadius: theme.radii.xs4,
  },
  // bot-бабл — surface + свечение glow-accent (по §6.2); текст t1
  assistantMessage: {
    backgroundColor: theme.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: theme.radii.xs4,
    borderWidth: 1,
    borderColor: theme.hairline,
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
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: theme.onAccent,
  },
  assistantText: {
    color: theme.t1,
  },
  emergencyText: {
    color: theme.danger,
    fontWeight: '600',
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
    fontWeight: '500',
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
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.surface,
    borderRadius: theme.radii.r20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.t1,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.r20,
    backgroundColor: theme.accentPress,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.hairline,
  },
});
