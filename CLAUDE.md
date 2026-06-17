# CLAUDE.md

PetHealthAI — мобильное приложение для ухода за здоровьем питомцев с AI-ассистентом.
Expo / React Native, бэкенд на Supabase, AI через OpenRouter.

## Технологический стек

- **Expo SDK ~54**, React Native 0.81, React 19.1
- **React Navigation 7** — `@react-navigation/native`, bottom-tabs, native-stack
- **Supabase** (`@supabase/supabase-js`) — auth + база данных, сессии в AsyncStorage
- **OpenRouter** (через SDK `openai` v4, `baseURL: openrouter.ai/api/v1`) — AI-ассистент с фолбэком по нескольким моделям
- **i18next / react-i18next** — локализация (en + ru), namespace-файлы
- **react-native-chart-kit** + `react-native-svg` — графики
- **expo-image-picker / image-manipulator / file-system** — фото питомцев и vision-сервис
- **react-native-dotenv** — переменные окружения через импорт из `@env`

## Структура проекта

```
App.js                      — точка входа: init i18n → AuthProvider → NavigationContainer
src/
  navigation/AppNavigator.js — 5 табов (Dashboard, Medical, Activity, Assistant, Profile)
                               + стек AI-ассистента + экраны charity
  screens/                   — экраны приложения
    LoginScreen, DashboardScreen, MedicalScreen, MedicalHubScreen,
    ActivityScreen, ProfileScreen, AddPetScreen, PetDetailScreen,
    AIAssistantHubScreen, AIAssistantChatScreen
  context/                   — AuthContext (авторизация), PetContext (питомцы)
  hooks/                     — usePets, useUserProfile, useBadges, useCharity,
                               useLoyaltyPoints, useDashboardStatus, useLanguage
  services/                  — openAIService (AI/OpenRouter), visionService,
                               imageUploadService, userService
  components/                — BadgeCard, ProgressBar, RecentActivityCard,
                               dashboard/, charity/
  locales/{en,ru}/           — JSON-переводы по namespace: activity, ai, auth,
                               common, dashboard, medical, pets, profile
  utils/                     — supabase.js (клиент), i18n.js (init), activityHelpers.js
```

## Команды

```bash
npm start          # expo start
npm run ios        # expo start --ios
npm run android    # expo start --android
npm run web        # expo start --web
```

## Переменные окружения

Загружаются через `react-native-dotenv` из файла `.env` (см. `.env.example`), импорт из `@env`:

- `OPENROUTER_API_KEY` — ключ OpenRouter для AI-ассистента
- Supabase URL/anon-key

> ⚠️ В `src/utils/supabase.js` ключи сейчас захардкожены. При изменениях по возможности переносить секреты в `.env` и не коммитить реальные значения.

## Соглашения и правила

- **AI идёт через OpenRouter, не напрямую OpenAI.** Модель выбирается из списка с фолбэком (`src/services/openAIService.js`); при добавлении моделей сохранять порядок «бесплатные → платные запасные».
- **Локализация обязательна.** Любой пользовательский текст добавляется в `src/locales/en/*` и `src/locales/ru/*` в соответствующий namespace; в коде использовать `useTranslation` / ключи, не хардкодить строки.
- **Навигация:** новые экраны регистрируются в `src/navigation/AppNavigator.js`. AI-экраны живут в отдельном `AssistantStack`.
- **Данные питомцев** — через `PetContext` и хук `usePets`; данные пользователя — через `useUserProfile` / `userService`.
- **Геймификация** (бейджи, баллы лояльности, charity) реализована в `hooks/` и `components/charity/` — переиспользовать существующие хуки (`useBadges`, `useLoyaltyPoints`, `useCharity`).
- **Стиль кода** соответствует окружающим файлам: функциональные компоненты + хуки, акцентный цвет UI `#6B4EFF`.
- Рабочая ветка разработки — `develop`; основная — `main`.
