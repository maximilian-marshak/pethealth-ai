# MIGRATION.md — перенос дизайна прототипа в приложение

Документ для передачи в **Claude Code**: как воспроизвести **Главную (Dashboard)**
и **Здоровье (Medical Hub)** из веб-прототипа в реальном приложении
(Expo SDK 54 / RN 0.81 / React Navigation 7), **1-в-1 по структуре и виду**.

Источник дизайна — `PetHealthAI Prototype.html` (+ файлы `core.jsx`, `screens-dashboard.jsx`,
`screens-health.jsx`, `screens-extra.jsx`). Готовый RN-образец экрана «Здоровье» —
`rn-port/screens/MedicalHubScreen.js`, примитив — `rn-port/components/Segmented.js`.

---

## 0. Жёсткие правила (Definition of Done на каждый экран)
- Цвета/радиусы/тени — **только** из `theme`-токенов (`useTheme()` → `theme.*`). Хардкод-hex запрещён.
- Стекло (`GlassCard`) — на декоре/бренде/навигации; **данные** (числа, графики, медзаписи) — на solid `surface`.
- Каждая строка — внутри `<Text>`. `onClick`→`onPress` (`Pressable`).
- Иконки — `@expo/vector-icons` `Ionicons`, имена как в прототипе (см. ниже, имена совпадают).
- Шрифт — `fontFamily: theme.font.bold | semibold | medium | regular` (Nunito).
- Все тексты — через `react-i18next` (ru/en), без хардкода в проде.
- Обе темы (light/dark) корректны; контраст ≥ WCAG AA.
- **CTA-кнопки с белым текстом — заливка `theme.accentPress`** (не `accent`): на `accent` белый не проходит AA.

## 1. Что уже есть в репозитории (переиспользуем)
- `theme.js` / `useTheme()` → `{ theme, scheme, accent }`. Токены: `accent`, `accentPress`, `accentTint`,
  `surface`, `hairline`, `t1..t4`, `onAccent`, `ok/warn/danger`, `eventTypes.*`, `assistantCategories.*`,
  `radii.{sm12,md16,lg24,xl28,pill999}`, `font.*`, `shadow`, `glowAccent`, `bgBase/bgBlobs`.
- `components/Screen.js` — фон-блобы + SafeArea (обёртка любого экрана).
- `components/GlassCard.js` — `variant="data" | "decor"`, проп `glow` (мятное свечение).
- `components/IconChip.js` — круглый тонированный чип под иконку (`name`, `size`, `color`, `bg`).
- `components/ProgressBar.js`, `ui/Button.jsx`, `ui/Card.jsx`, `ui/Badge.jsx`, `ui/Switch.jsx`.

## 2. Чего не хватает — добавить
- `components/Segmented.js` — сегмент-контрол (Список/Календарь/Паспорт). Готов: `rn-port/components/Segmented.js`.
- Мелкие инлайн-части: `StatusDot` (точка статуса ok/warn/danger), `Chip` (фильтр-пилюля),
  `Ring` (кольцо прогресса для «Индекса здоровья»). Можно держать инлайн в экране или вынести в `components/`.

---

## 3. ГЛАВНАЯ (DashboardScreen) — структура

**Шапка (всегда):** `PetSwitcher` — `GlassCard variant="decor"`:
- слева аватар (кольцо `accent`) + кличка (`t1`, bold) + порода (`t2`); тап → PetDetail.
- справа `notifications-outline` (с красным бейджем непрочитанных) + `person-circle-outline` (→ Profile).
- ниже — горизонтальный скролл чипов питомцев (активный = `accentPress`/`onAccent`) + пунктирный чип «+ Добавить».

Дальше — **3 варианта компоновки** (переключатель — проп/тумблер; в проде можно зафиксировать один):

### Вариант A «Карточки» (эталон)
1. Заголовок «Здоровье».
2. Сетка 2 кол. из **5 status-карточек** (`SolidCard`): `IconChip` + `StatusDot` (верхний ряд), заголовок (`t2`),
   значение (семантический цвет), подпись (`t3`). Карточки: Вакцинация (ok «Защищён»), Ближайший приём
   (warn «28 июн, 14:30»), Паразиты (ok «Обработан»), Лекарства (warn «1 курс»), Анализы (ok «В норме»).
   Тап → Health. *(статус «Активность %» НЕ показываем.)*
3. «Рекомендации врача» — `GlassCard variant="data"`: `clipboard-outline` + заголовок + сабтайтл «С последнего
   визита: …» + 1–3 пункта с буллетами `accent` + ссылка «Все рекомендации» → RecordDetail.
4. «Совет дня» (AI Insight) — `GlassCard variant="decor"` **glow**: `sparkles` chip + текст + кнопка-tint
   «Обсудить с ИИ» → Assistant.
5. **Paws Points** — `GlassCard variant="decor"`: paw-плитка + «Paws Points» + сабтайтл + иконка «i»
   (→ экран **Помощь приютам**). Крупный баланс `1 240` (`t1`). Прогресс месяца `320/500` (`ProgressBar`).
   Кнопка «Поддержать приют» (`accentPress`, → **Помощь приютам**). Ссылка «+ Заработать больше Paws»
   (→ экран **Как заработать Paws**).
6. **Карта ранга** — `GlassCard variant="decor"`: 🥈 + «Ранг» (`t2`, caps) + «Защитник лап» (`t1`) +
   «Серебро» (цвет лиги) + chevron → Profile.
7. Заголовок «Быстрые действия» + ряд из 4 плиток (`IconChip` `bg=surface` + подпись): Медкарта→Health,
   AI Чат→Assistant, Запись→Appointments, Профиль→Profile.

### Вариант B «Фокус»
1. **Health Hero** — `GlassCard variant="decor"` **glow**: слева `Ring` (pct 86, диаметр 128, stroke 13) с
   числом «86» (`t1`) и подписью «баллов»; справа «ИНДЕКС ЗДОРОВЬЯ» (`accentPress`, caps) + «Луна в хорошей
   форме» (`t1`) + «1 задача требует внимания» (`t2`). Ниже — 3 мини-плитки (icon + значение): Защищён (ok),
   28 июн (warn), Обработан (ok). *(без «Активность %».)*
2. Горизонтальный скролл мини status-карточек (тот же набор из A, компактно).
3. «Совет дня» (AI Insight).
4. «Быстрые действия» (4 плитки).
5. Paws Points (компактно, без крупного баланса).
6. Карта ранга.

### Вариант C «Лента»
1. «Сегодня» — `SolidCard`: вертикальный timeline из 3 событий дня (узел-кружок: выполнено = `accent`+галка,
   иначе тинт цвета `eventTypes`; время справа; выполненное — зачёркнуто). Кнопка-tint «Открыть календарь».
2. Мини-сводка — `SolidCard`: 3 счётчика (в норме `ok` / внимание `warn` / записей `accent`).
3. Рекомендации врача → AI Insight → Paws (компактно) → Карта ранга.

**Навигационные цели:** PetDetail, Notifications, AddPet, Profile, Health, Assistant, Appointments,
RecordDetail, **CharityStore (Помощь приютам)**, **HowToEarnPaws (Как заработать Paws)**.

---

## 4. ЗДОРОВЬЕ (MedicalHubScreen) — структура

> Готовый RN-файл: `rn-port/screens/MedicalHubScreen.js` (заменяет текущую заглушку). Ниже — спецификация.

**Шапка:** заголовок «Медкарта» (`t1`, 26, bold) + 3 круглые кнопки (`surface`, бордер `hairline`):
`folder-open-outline` (→ **Документы**), `share-outline` (экспорт PDF), `scan-outline` (→ OCR Review).

**Выбор питомца:** горизонтальные чипы (как в шапке Главной) + «+ Добавить».

**Segmented:** Список ↔ Календарь ↔ Паспорт.

### Список
- Ряд фильтр-чипов: Обзор / Вакцины / Лекарства / Записи **+** круглая кнопка «+» (`accentPress`, glow-тень)
  → лист **«Добавить запись»**.
- Timeline-карточки (`SolidCard`): колонка даты (день `t1` bold / месяц `t3` caps) | вертикальный разделитель |
  `IconChip` цвета `theme.eventTypes[type]` | заголовок (`t1`) + сабтайтл (`t2`) | chevron. Тип события задаёт
  цвет иконки и точки (record/prescription/vaccine/reminder/appointment). Тап → RecordDetail.

### Календарь
- `SolidCard`: шапка месяца (стрелки + «Июнь 2026»), строка дней недели (`t3`), сетка 7 кол. (`width: 100/7 %`).
  В ячейке — число + до 3 точек-маркеров цвета `eventTypes` по типам событий дня. Активный день — заливка `accent`.
- Легенда типов (точка + подпись, i18n `medical.calendar.types.*`).
- «События дня» — тот же timeline для выбранной даты; пусто → empty-стейт.

### Паспорт
- Hero (`SolidCard`): аватар (кольцо `accent`) + кличка + порода·возраст + кнопки «Изменить» (tint) / «QR».
- **Плашка «Аллергии»** (только при наличии): фон `danger+14`, бордер `danger+40`, иконка `warning` `danger`,
  список аллергенов + бейдж тяжести (Лёгкая→ok / Средняя→warn / Тяжёлая→danger).
- Блок «Информация» (`SolidCard`, ряды с разделителем `hairline`): Дата рождения, Пол, Вес, Группа крови,
  Микрочип — иконка `accent` + лейбл (`t2`) + значение (`t1`).
- Секция «Хронические» (CRUD): карточка заболевания + статус-бейдж (Активно `warn`).

**Лист «Добавить запись»** (bottom-sheet): варианты Вакцина / Лекарство / Запись о визите /
Процедура·обработка / Сканировать документ (→ OCR). Каждый — `IconChip` цвета типа + заголовок + сабтайтл.

**Данные:** подключить существующие хуки/сервисы (`usePets`, `useMedicalRecords`/Supabase,
`useDashboardStatus`); в RN-образце они помечены `DEMO_*` — заменить, **разметку не менять**.

---

## 5. Имена иконок (Ionicons), используемые на этих экранах
`home / home-outline`, `pulse-outline`, `sparkles / sparkles-outline`, `trophy-outline`, `person / person-outline`,
`person-circle-outline`, `notifications-outline`, `shield-checkmark-outline`, `medkit-outline`, `bug-outline`,
`medical-outline`, `flask-outline`, `walk-outline`, `clipboard-outline`, `chatbubble-ellipses-outline`,
`heart`, `information-circle-outline`, `chevron-forward / chevron-back`, `folder-open-outline`, `share-outline`,
`scan-outline`, `add`, `calendar-outline`, `barbell-outline`, `water-outline`, `hardware-chip-outline`,
`male-outline`, `warning`, `today`, `git-commit-outline`, `checkmark`.

---

## 6. ГОТОВЫЙ ПРОМТ ДЛЯ CLAUDE CODE — Главная

```
Контекст: приложение PetHealthAI (Expo SDK 54 / RN 0.81 / React Navigation 7). Дизайн-система —
src/theme/theme.js + useTheme(); примитивы — components/Screen.js, GlassCard.js (variant data|decor, glow),
IconChip.js, ProgressBar.js. См. MIGRATION.md §0–§3 и §5.

Задача: переписать src/screens/DashboardScreen.js по структуре MIGRATION.md §3, вариант «Фокус» (B) как
основной (варианты A/C — опционально позже). Глубина: визуал + раскладка; данные брать из существующих
хуков (usePets/PetContext, useDashboardStatus, useLoyaltyPoints, useCharityRanks) — структуру блоков не менять.

Жёсткие правила (MIGRATION.md §0): цвета только из theme-токенов; данные на solid surface, декор/Paws/AI/
свитчер — на GlassCard; CTA с белым текстом — accentPress; строки в <Text>; иконки Ionicons (имена §5);
fontFamily из theme.font; тексты через i18next (namespace dashboard). Обе темы light/dark, контраст ≥ AA.

Блоки (сверху вниз): PetSwitcher (glass decor: аватар+кличка+порода, колокольчик с бейджем, person-circle,
горизонтальные чипы питомцев + «+ Добавить») → Health Hero (glass decor glow: Ring индекса здоровья + 3 мини-
плитки статусов; БЕЗ «Активность %») → горизонтальный ряд status-карточек (Вакцинация/Приём/Паразиты/Лекарства/
Анализы, семантика ok/warn) → AI Insight «Совет дня» (glass decor glow, кнопка → Assistant) → «Быстрые
действия» (4 плитки) → Paws Points (баланс, прогресс месяца, «Поддержать приют» → CharityStore, «Заработать
больше Paws» → HowToEarnPaws) → Карта ранга (→ Profile).

Зарегистрируй экраны CharityStore (Помощь приютам) и HowToEarnPaws в навигаторе, если их нет.
Перед кодом сверься с конвенциями проекта. Выведи дифф по файлам.
```

## 7. ГОТОВЫЙ ПРОМТ ДЛЯ CLAUDE CODE — Здоровье

```
Контекст: тот же (см. MIGRATION.md §0–§2, §4, §5). Есть готовый образец композиции:
rn-port/screens/MedicalHubScreen.js и rn-port/components/Segmented.js.

Задача: заменить заглушку src/screens/MedicalHubScreen.js полноценным экраном по MIGRATION.md §4.
Скопируй Segmented.js в src/components/. Реализуй три вида через Segmented: Список / Календарь / Паспорт.

Список: фильтр-чипы (Обзор/Вакцины/Лекарства/Записи) + круглая «+» → bottom-sheet «Добавить запись»
(Вакцина/Лекарство/Запись/Процедура/Скан→OCRReview); timeline-карточки на solid surface, цвет иконки и
маркера = theme.eventTypes[type], тап → RecordDetail. Календарь: месячная сетка 7 колонок с точками-
маркерами по типам + легенда (i18n medical.calendar.types.*) + «События дня». Паспорт: hero питомца,
danger-плашка «Аллергии» (тяжесть Лёгкая→ok/Средняя→warn/Тяжёлая→danger), блок «Информация», секция
«Хронические». В шапке: folder-open-outline → Documents (архив), share-outline → экспорт PDF,
scan-outline → OCRReview. Сверху — выбор питомца (горизонтальные чипы).

Данные: usePets + ваши медицинские хуки/Supabase (в образце они помечены DEMO_* — заменить, разметку не
менять). Правила §0 соблюдать. Зарегистрируй Documents/OCRReview/RecordDetail в навигаторе при отсутствии.
Перед кодом сверься с конвенциями проекта. Выведи дифф по файлам.
```

---

## 8. Порядок работы для Claude Code
1. Добавить `components/Segmented.js` (+ при желании `StatusDot`, `Chip`, `Ring`).
2. Прогнать промт §7 (Здоровье) — есть готовый образец, риск минимальный.
3. Прогнать промт §6 (Главная, вариант «Фокус»).
4. Подключить реальные данные вместо `DEMO_*`, вынести строки в `locales/{ru,en}/*.json`.
5. Проверить обе темы и три акцента (mint/peach/blue) — уже работают через `useTheme()`.
