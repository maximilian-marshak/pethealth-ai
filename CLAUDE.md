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
- **Стиль кода** соответствует окружающим файлам: функциональные компоненты + хуки. **Цвет берётся из theme-токенов через `useTheme()` — хардкод-hex запрещён.** Акцент — токен `accent` (мятный `#56B89F` light / `#6FCBB2` dark); семантика здоровья `ok / warn / danger` отдельно от акцента.
- Рабочая ветка разработки — `develop`; основная — `main`.

## Тема и визуальная система (редизайн)

Идёт визуальный редизайн приложения (весь экранный слой; визуал + перекомпоновка, логика и данные сохраняются). Зафиксированный фундамент:

- **Источник правды по дизайну** — `src/theme/theme.js` (light + dark) + `ThemeProvider` / `useTheme`. Обе темы равноправны: следуем системной теме с ручным override.
- **Акцент — мятный** токен `accent` (`#56B89F` light / `#6FCBB2` dark); заменяет прежний `#6B4EFF`. Семантика здоровья — `ok / warn / danger`, отдельно от акцента.
- **Glassmorphism через `expo-blur`** (`<BlurView>`). Дисциплина: поверхности с **данными** (графики, статусы, медкарта, формы) — плотные/читаемые (`surface` / `glass.data`); **декор, чат, навигация** — полупрозрачное стекло (`glass.decor`). Критичный текст не размещать на «грязном» стекле.
- **Новые зависимости:** `expo-blur`, `expo-font`, `react-native-calendars`.
- **Доступность:** контраст текста ≥ WCAG AA в обеих темах.
- **Миграция цвета:** свести разрозненные значения (`#6B4EFF`, `#6C63FF`, `#6B46C1`, `#8B5CF6`, `#6366F1`, локальные `const ACCENT`) → токен `accent`; инлайн-нейтрали (`#1F2937`/`#6B7280`/`#F9FAFB` и пр.) → `t1..t4` / `surface` / `hairline`.
- **Порядок старта:** theme-слой + консолидация цвета → примитивы (`GlassCard` / `Card` / `IconChip`) → экраны (Dashboard → Medical/Passport → Assistant → Activity → Profile). **Начинать только после влития MVP-фич в `develop`.**
- **Детали:** токены и карта дисциплины стекла — в дизайн-системе (`visual_foundation`); поэкранные требования — в «Задании на дизайн» (redesign).
- **Открытые решения до старта:** B2C-paywall (оставляем/убираем при B2B), финальный шрифт, мультитема (да/нет), таблицы `breeds` / `achievements`.

## При изменениях, затрагивающих ТЗ / интерфейс / схему / бизнес-модель

Всегда отмечать, **какой документ нужно обновить** (ТЗ / дизайн-док / схема БД / `BUSINESS_MODEL.md` / `CLAUDE.md`), и не расходиться с доками молча.