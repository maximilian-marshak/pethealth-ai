// ══════════════════════════════════════════════════════════════
// src/screens/KnowledgeBaseScreen.js
// Справочник по уходу/здоровью (статика, без AI). Аккордеон категорий →
// строки статей → KnowledgeArticle. Контент из i18n (ai.knowledge.*).
// ══════════════════════════════════════════════════════════════

import React, { useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const ACCENT = '#6B4EFF';

export default function KnowledgeBaseScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation('ai');
  const [openCat, setOpenCat] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('knowledge.title') });
  }, [navigation, t]);

  const raw = t('knowledge.categories', { returnObjects: true });
  const categories = Array.isArray(raw) ? raw : [];

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.disclaimer}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={s.disclaimerText}>{t('knowledge.disclaimer')}</Text>
        </View>

        {categories.map((cat, ci) => {
          const expanded = openCat === ci;
          const color = cat.color || ACCENT;
          const items = Array.isArray(cat.items) ? cat.items : [];
          return (
            <View key={cat.id || ci} style={s.catCard}>
              <TouchableOpacity
                style={s.catHeader}
                activeOpacity={0.7}
                onPress={() => setOpenCat(expanded ? null : ci)}
              >
                <View style={[s.catIcon, { backgroundColor: color + '22' }]}>
                  <Ionicons name={cat.icon || 'book-outline'} size={20} color={color} />
                </View>
                <Text style={s.catTitle}>{cat.category}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {expanded && items.map((art, ai) => (
                <TouchableOpacity
                  key={art.id || ai}
                  style={s.artRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('KnowledgeArticle', { title: art.title, body: art.body })}
                >
                  <Text style={s.artTitle} numberOfLines={2}>{art.title}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CCC" />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8F9FA' },
  content:        { padding: 16 },
  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, marginBottom: 14 },
  disclaimerText: { flex: 1, fontSize: 12, color: '#6B7280', lineHeight: 17 },
  catCard:        { backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEF0F4', overflow: 'hidden' },
  catHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  catIcon:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catTitle:       { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F2937' },
  artRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#F1F1F4' },
  artTitle:       { flex: 1, fontSize: 14, color: '#374151' },
});
