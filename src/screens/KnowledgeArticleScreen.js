// ══════════════════════════════════════════════════════════════
// src/screens/KnowledgeArticleScreen.js
// Статья справочника: заголовок + body (абзацы по \n\n) + дисклеймер.
// title/body приходят через route params.
// ══════════════════════════════════════════════════════════════

import React, { useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

export default function KnowledgeArticleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation('ai');
  const { title = '', body = '' } = route.params || {};

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const paragraphs = String(body).split('\n\n').filter(Boolean);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.h}>{title}</Text>
        {paragraphs.map((p, i) => (
          <Text key={i} style={s.p}>{p}</Text>
        ))}

        <View style={s.disclaimer}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={s.disclaimerText}>{t('knowledge.disclaimer')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  content:        { padding: 20, paddingBottom: 32 },
  h:              { fontSize: 22, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  p:              { fontSize: 15, color: '#374151', lineHeight: 23, marginBottom: 14 },
  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, marginTop: 8 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 17 },
});
