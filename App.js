import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { initI18n } from './src/utils/i18n';

export default function App() {
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

  // ─── Пока i18n не готов — показываем сплэш ─────────────
  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
