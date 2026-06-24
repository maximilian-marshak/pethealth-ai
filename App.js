import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme as NavDefaultTheme,
  DarkTheme as NavDarkTheme,
} from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { initI18n } from './src/utils/i18n';

// Удерживаем нативный splash, пока не готовы i18n + шрифты Nunito.
SplashScreen.preventAutoHideAsync().catch(() => {});

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

// Корневое дерево — внутри ThemeProvider, поэтому useTheme доступен в навигации.
function Root() {
  const { theme, scheme } = useTheme();
  const [i18nReady, setI18nReady] = useState(false);

  // Шрифты Nunito. Ключи семейств = значения theme.font.* (см. src/theme/theme.js).
  const [fontsLoaded, fontError] = useFonts({
    'Nunito-Regular':  require('./assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Medium':   require('./assets/fonts/Nunito-Medium.ttf'),
    'Nunito-SemiBold': require('./assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold':     require('./assets/fonts/Nunito-Bold.ttf'),
  });

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

  useEffect(() => {
    if (fontError) console.warn('[App] font load error:', fontError?.message);
  }, [fontError]);

  // Единый gate готовности: i18n + шрифты (ошибка шрифта не блокирует запуск).
  const ready = i18nReady && (fontsLoaded || !!fontError);

  // Прячем нативный splash после первого кадра готового дерева.
  const onLayoutRootView = useCallback(async () => {
    if (ready) {
      try { await SplashScreen.hideAsync(); } catch (_) { /* no-op */ }
    }
  }, [ready]);

  // Пока не готово — держим нативный splash (рендерим пусто).
  if (!ready) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer theme={buildNavTheme(theme, scheme)}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </View>
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
