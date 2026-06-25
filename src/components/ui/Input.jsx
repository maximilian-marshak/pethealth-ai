// ══════════════════════════════════════════════════════════════
// src/components/ui/Input.jsx  (pethealth-design / Шаг 2)
// Текстовое поле на solid surface: ведущий Ionicons, бордер hairline →
// accent на фокусе, текст t1, placeholder t4. radii.md16 (или pill999 при pill).
// Все цвета/радиусы — из useTheme().
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';

export default function Input({
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  pill = false,
  editable = true,
  style,
  ...rest
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: theme.surface,
          borderWidth: 1.5,
          borderColor: focused ? theme.accent : theme.hairline,
          borderRadius: pill ? theme.radii.pill999 : theme.radii.md16,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={focused ? theme.accent : theme.t3} /> : null}
      <TextInput
        style={{ flex: 1, fontSize: 15, color: theme.t1, padding: 0 }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.t4}
        secureTextEntry={secureTextEntry}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
    </View>
  );
}
