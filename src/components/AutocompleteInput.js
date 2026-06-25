// ══════════════════════════════════════════════════════════════
// src/components/AutocompleteInput.js
// Поле имени с автоподстановкой (typeahead) + свободный ввод.
// Вид label/flag повторяет Field в OCRReviewScreen (low-confidence не теряется).
// ══════════════════════════════════════════════════════════════

import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

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
  const { theme } = useTheme();
  const a = useMemo(() => makeStyles(theme), [theme]);
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
        placeholderTextColor={theme.t4}
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

// Фабрика стилей от темы (layout + цвета из токенов). Цвета: см. карту миграции.
const makeStyles = (theme) => StyleSheet.create({
  wrap:      { marginBottom: 12 },
  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label:     { fontSize: 13, fontFamily: theme.font.semibold, color: theme.t2 },
  checkHint: { fontSize: 11, fontFamily: theme.font.semibold, color: theme.warn, backgroundColor: theme.warn + '22', paddingHorizontal: 6, paddingVertical: 1, borderRadius: theme.radii.sm8 },
  input:     { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.hairline, borderRadius: theme.radii.r10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: theme.t1 },
  textArea:  { height: 70, textAlignVertical: 'top', paddingTop: 10 },
  flagged:   { borderColor: theme.warn, borderWidth: 1.5, backgroundColor: theme.warn + '14' },
  dropdown:  { marginTop: 4, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.accent, borderRadius: theme.radii.r10, overflow: 'hidden' },
  row:       { paddingHorizontal: 14, paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.accentTint },
  rowName:   { fontSize: 15, color: theme.t1, fontFamily: theme.font.medium },
  rowSub:    { fontSize: 12, color: theme.t4, marginTop: 2 },
});
