// ══════════════════════════════════════════════════════════════
// src/screens/DocumentsScreen.js
// «Документы» — грид всех вложений питомца (S6).
// petId приходит через route params (экран вне PetProvider, как Appointments/
// RecordDetail). Источник — record_attachments + signed-URL из бакета
// medical-docs. Новой схемы/SQL нет.
// ══════════════════════════════════════════════════════════════

import React, { useState, useLayoutEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeProvider';
import { supabase } from '../utils/supabase';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 3;
const GAP = 8;
const PAD = 16;
const SIZE = Math.floor((SCREEN_W - PAD * 2 - GAP * (COLS - 1)) / COLS);

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation('medical');
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);

  const { petId } = route.params || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('documents.title') });
  }, [navigation, t]);

  const load = useCallback(async () => {
    if (!petId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('record_attachments')
        .select('*')
        .eq('pet_id', petId);
      if (error) throw error;

      let list = data || [];
      // Сортировка на клиенте по created_at (убыв.), только если поле присутствует.
      if (list.length && list[0].created_at !== undefined) {
        list = [...list].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      }

      // Signed-URL батчем; сопоставляем по path (порядок результата не критичен).
      const paths = list.map((a) => a.file_url).filter(Boolean);
      const urlByPath = {};
      if (paths.length) {
        const { data: signed } = await supabase.storage.from('medical-docs').createSignedUrls(paths, 3600);
        (signed || []).forEach((sgn) => {
          if (sgn && sgn.path && sgn.signedUrl) urlByPath[sgn.path] = sgn.signedUrl;
        });
      }

      setItems(list.map((a) => ({ ...a, signedUrl: a.file_url ? urlByPath[a.file_url] || null : null })));
    } catch (e) {
      console.warn('DocumentsScreen: load failed (non-critical):', e?.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }) => {
    const isImage = item.file_type === 'image' && !!item.signedUrl;
    return (
      <TouchableOpacity
        style={[s.cell, { width: SIZE, height: SIZE }]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('RecordDetail', { recordId: item.record_id, petId })}
      >
        {isImage ? (
          <Image source={{ uri: item.signedUrl }} style={s.cellImage} resizeMode="cover" />
        ) : (
          <View style={s.cellPlaceholder}>
            <Ionicons name="document-outline" size={30} color={theme.t4} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
      ) : items.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="documents-outline" size={64} color={theme.t4} />
          <Text style={s.emptyTitle}>{t('documents.empty.title')}</Text>
          <Text style={s.emptySub}>{t('documents.empty.subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          numColumns={COLS}
          renderItem={renderItem}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: GAP }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container:        { flex: 1, backgroundColor: theme.bg },
  grid:             { padding: PAD },
  cell:             { borderRadius: theme.radii.sm12, overflow: 'hidden', backgroundColor: theme.accentTint, marginBottom: GAP },
  cellImage:        { width: '100%', height: '100%' },
  cellPlaceholder:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg },
  empty:            { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle:       { fontSize: 17, fontWeight: '700', color: theme.t1, marginTop: 16 },
  emptySub:         { fontSize: 14, color: theme.t3, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
