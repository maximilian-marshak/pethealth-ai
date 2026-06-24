Redesign kickoff — бриф для кодинг-чата
Цель: подготовить старт реализации нового дизайна PetHealthAI в отдельном чате по коду. ⚠️ Запуск — только после того, как текущие фичи завершены и влиты в develop. До этого — не начинать.

СТАТУС (обновлено в редизайне): цвет-миграция ЗАВЕРШЕНА — все экраны и компоненты на theme-токенах, хардкод-hex = 0 (кроме обоснованных theme-neutral оверлеев/scrim с комментарием, определений токенов в theme.js и всегда-light PDF-экспорта). Введены палитры eventTypes (§2.2-ter) и assistantCategories (§2.2-quater). Процесс шёл прямыми коммитами в develop (НЕ отдельными feature/redesign-ветками — см. п.5). Дальше — финальная визуальная полировка/стекло по экранам.


0. Что передать в кодинг-чат
PetHealthAI_design_spec_full.md — полное ТЗ (поэкранно).
PetHealthAI_visual_foundation.md — токены (+ зафиксированные значения стекла).
Проектный скилл/конвенции (рельсы стека) — уже в проекте.
Этот бриф.
1. Рельсы проекта (не нарушать)
Стек: Expo SDK 54 / RN 0.81 / React 19 / React Navigation 7 / Supabase / AI через OpenRouter (free→paid).
Функциональные компоненты + хуки. Ветка разработки develop, основная main.
Экраны регистрируются в AppNavigator; AI-экраны — в AssistantStack.
Данные: usePets/PetContext, useUserProfile/userService; геймификация — useBadges/useLoyaltyPoints/useCharity (начисление баллов — server-side).
Все строки — i18next (en/ru), без хардкода.
Цвета — только из theme-токенов, никаких хардкод-hex.
2. Дизайн-фундамент (кратко)
Акцент мятный #56B89F (dark #6FCBB2); семантика здоровья ok/warn/danger — отдельно.
Стекло: surface-glass (декор/чат/навигация, прозрачное) и surface-glass-data (данные, плотнее). Полные значения — в фундаменте.
Обе темы (light/dark) через useTheme.
Дисциплина: данные — плотные/контрастные; стекло — на декоре. A11y: контраст ≥ AA.
3. Зависимости к установке
expo-blur (BlurView — настоящее стекло), expo-font (выбранный шрифт), react-native-calendars (US#16, если ещё нет).
4. Порядок реализации
Theme-слой: theme.js (light/dark токены из фундамента) + ThemeProvider/useTheme. Заменить хардкод #6B4EFF на accent-токен по всему коду.
Примитивы: GlassCard (на BlurView), Card, IconChip, Button, Badge/StatusBadge, Chip, Segmented, ProgressBar, Skeleton. Состояния: default/press/disabled/loading/empty/error.
Перекомпоновка экранов (визуал + раскладка), порядок:
Глобально: TabBar (glass) + screenOptions в AppNavigator.
Главная (Dashboard) → Медкарта + Паспорт (Medical Hub) → Ассистент (чат + встроенный мини-виджет) → Активность (Награды/charity, 3D-бейджи) → Профиль.
Новые фичи (календарь/рекомендации/запись) — по своей очереди из Delivery Plan, сразу в новом визуале.
5. Definition of Done (на каждый экран)
Только theme-токены, без хардкод-hex.
Дисциплина стекла соблюдена (данные читаемы).
Обе темы (light/dark) корректны; контраст ≥ AA.
Все строки через i18next (en/ru).
Функциональные компоненты + хуки; данные через существующие контексты/сервисы.
Состояния loading/empty/error проработаны.
Ветка feature/redesign-<экран> → PR в develop. (Фактически — обновлено в редизайне: цвет-миграция шла прямыми коммитами в develop, по одному коммиту на экран/группу, без отдельных feature-веток.)
6. Решить до старта
B2C-paywall (оставляем/убираем) · финальный шрифт · мультитема да/нет · breeds/achievements.


7. Готовое первое сообщение для нового чата (скопировать)
Контекст: редизайн мобильного приложения PetHealthAI (Expo SDK 54 / RN 0.81 / React 19 /

React Navigation 7 / Supabase / AI через OpenRouter). Прикладываю: полное ТЗ

(PetHealthAI_design_spec_full.md), визуальный фундамент с токенами

(PetHealthAI_visual_foundation.md) и конвенции проекта.

Задача этого чата — реализация нового дизайна на ветке develop. Глубина: визуал +

перекомпоновка экранов; логика и данные сохраняются.

Жёсткие правила: акцент — мятный токен accent #56B89F (НЕ хардкодить hex, брать из

theme); обе темы light/dark через useTheme; стекло — expo-blur BlurView с дисциплиной

(данные плотные/читаемые, декор прозрачный); все строки — i18next en/ru; экраны — в

AppNavigator (AI — в AssistantStack); данные — usePets/useUserProfile; геймификация —

useBadges/useLoyaltyPoints/useCharity.

Начни с шага 1: собери theme-слой (theme.js light/dark + ThemeProvider/useTheme) и замени

хардкод #6B4EFF на accent-токен. Перед кодом сверься с конвенциями проекта.

