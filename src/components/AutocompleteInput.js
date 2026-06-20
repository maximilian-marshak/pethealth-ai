// ══════════════════════════════════════════════════════════════
// src/components/AutocompleteInput.js
// Поле имени с автоподстановкой (typeahead) + свободный ввод.
// Вид label/flag повторяет Field в OCRReviewScreen (low-confidence не теряется).
// ══════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const ACCENT = '#6B4EFF';
const MAX_SUGGESTIONS = 6;

export default function AutocompleteInput({
  label,
  value,
  onChangeText,
  suggestions = [],
  placeholder,
  flag,
  keyboardType,
  multiline,
  t,
}) {
  const [focused, setFocused] = useState(false);

  const q = (value || '').trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return [];
    const starts = [];
    const contains = [];
    for (const item of suggestions) {
      const name = (item.name || '').toLowerCase();
      const sub = (item.substance || '').toLowerCase();
      if (name.startsWith(q)) starts.push(item);
      else if (name.includes(q) || sub.includes(q)) contains.push(item);
    }
    return [...starts, ...contains].slice(0, MAX_SUGGESTIONS);
  }, [q, suggestions]);

  // Скрываем список, если value точно равен одной из подсказок (после выбора).
  const exact = useMemo(
    () => suggestions.some((it) => (it.name || '').toLowerCase() === q),
    [q, suggestions]
  );

  const open = focused && q.length > 0 && matches.length > 0 && !exact;

  const pick = (name) => {
    onChangeText(name);
    setFocused(false);
  };

  return (
    <View style={a.wrap}>
      {label != null && (
        <View style={a.labelRow}>
          <Text style={a.label}>{label}</Text>
          {flag && t && <Text style={a.checkHint}>{t('review.checkHint')}</Text>}
        </View>
      )}

      <TextInput
        style={[a.input, multiline && a.textArea, flag && a.flagged]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        autoCorrect={false}
      />

      {open && (
        <View style={a.dropdown}>
          {matches.map((item, i) => (
            <TouchableOpacity
              key={`${item.name}-${i}`}
              style={[a.row, i < matches.length - 1 && a.rowBorder]}
              onPress={() => pick(item.name)}
              activeOpacity={0.7}
            >
              <Text style={a.rowName}>{item.name}</Text>
              {item.substance ? (
                <Text style={a.rowSub} numberOfLines={1}>{item.substance}</Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const a = StyleSheet.create({
  wrap:      { marginBottom: 12 },
  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151' },
  checkHint: { fontSize: 11, fontWeight: '600', color: '#B45309', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  input:     { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#1F2937' },
  textArea:  { height: 70, textAlignVertical: 'top', paddingTop: 10 },
  flagged:   { borderColor: '#F59E0B', borderWidth: 1.5, backgroundColor: '#FFFBEB' },
  dropdown:  { marginTop: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: ACCENT, borderRadius: 10, overflow: 'hidden' },
  row:       { paddingHorizontal: 14, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#EEF2FF' },
  rowName:   { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  rowSub:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
