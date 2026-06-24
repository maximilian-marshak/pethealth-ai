Патч документации — CLAUDE.md + conventions.md (redesign)
Готовые к применению правки. Снимают конфликт акцента и фиксируют theme/стекло/зависимости. Применить до старта редизайна, иначе правило 6 и реальный дизайн расходятся.


A. CLAUDE.md — правило 6 (Стиль кода)
Было:

(6) Стиль кода — функциональные компоненты + хуки, акцентный цвет #6B4EFF.

Стало:

(6) Стиль кода — функциональные компоненты + хуки. Цвет берётся из theme-токенов через useTheme() — хардкод-hex запрещён. Акцент — токен accent (мятный #56B89F light / #6FCBB2 dark). Семантика здоровья — ok/warn/danger, отдельно от акцента.


B. conventions.md — секция «Code style»
Было:

### Code style

- Functional components + hooks, matching surrounding files.

- Accent UI color `#6B4EFF`.

Стало:

### Code style

- Functional components + hooks, matching surrounding files.

- Colors come from theme tokens via `useTheme()` — NO hardcoded hex.

- Accent = token `accent` (mint #56B89F light / #6FCBB2 dark).

- Health semantics = `ok/warn/danger`, separate from accent.


C. conventions.md — добавить новую секцию «Theming & visual system»
### Theming & visual system (redesign)

- Single source of truth: `src/theme/theme.js` (light + dark) + `ThemeProvider`/`useTheme`.

- Both themes are first-class; follow system scheme with manual override.

- Glassmorphism via `expo-blur` <BlurView>. Discipline: DATA surfaces are dense/solid

  (`surface` / glass.data) and readable; DECOR/chat/nav use translucent glass (glass.decor).

- New deps: `expo-blur`, `expo-font`, `react-native-calendars`.

- Accessibility: text contrast ≥ WCAG AA in both themes; glass never carries critical

  text over a busy background without a backing layer.

- Migration: consolidate scattered colors (#6B4EFF/#6C63FF/#6B46C1/#8B5CF6 → `accent`;

  inline grays → `t1..t4` / `surface` / `hairline`).


D. Delivery Plan — добавить раздел «Redesign»
## Redesign (визуальный)

- Охват: всё приложение. Глубина: визуал + перекомпоновка экранов (логика/данные сохраняются).

- Старт: после завершения MVP-фич и влития в `develop`.

- Фундамент: мятный акцент, glassmorphism, обе темы — см. дизайн-систему (visual_foundation).

- Шаг 1: theme-слой + консолидация цвета. Далее: примитивы → экраны

  (Главная → Медкарта/Паспорт → Ассистент → Награды → Профиль).

- Открытые решения: B2C-paywall, финальный шрифт, мультитема, breeds/achievements.


E. Зафиксировать в дизайн-системе ссылку
В Задании на дизайн (новом) и в CLAUDE.md указать, что детальные токены и дисциплина стекла живут в PetHealthAI_visual_foundation.md, а поэкранные требования — в PetHealthAI_design_spec_full.md.

