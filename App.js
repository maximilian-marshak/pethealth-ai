import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme as NavDefaultTheme,
  DarkTheme as NavDarkTheme,
} from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { initI18n } from './src/utils/i18n';

// Маппинг наших токенов в тему RN-Navigation (фон/карточки/текст/акцент/границы).
function buildNavTheme(theme, scheme) {
  const base = scheme === 'dark' ? NavDarkTheme : NavDefaultTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      background: theme.bg,
      card: theme.surface,
      text: theme.t1,
      primary: theme.accent,
      border: theme.hairline,
    },
  };
}

// Корневое дерево — внутри ThemeProvider, поэтому useTheme доступен и для splash.
function Root() {
  const { theme, scheme } = useTheme();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await initI18n();
        console.log('[App] i18n initialized ✓');
      } catch (e) {
        console.error('[App] i18n init failed:', e);
      } finally {
        setI18nReady(true);
      }
    };

    bootstrap();
  }, []);

  // ─── Пока i18n не готов — показываем (темизированный) сплэш ─────────────
  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer theme={buildNavTheme(theme, scheme)}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
