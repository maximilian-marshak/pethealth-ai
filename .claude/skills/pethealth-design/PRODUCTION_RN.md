# PetHealthAI — перенос в production (React Native)

Этот файл — мост между **веб**-дизайн-системой (этот скил: CSS-токены + веб-компоненты + HTML UI-кит) и **реальным RN-приложением** (`pethealth-ai`, Expo). В RN **ничего из этого скила не импортируется напрямую**: HTML/CSS/веб-компоненты — это **эталон вида и поведения**, а источник значений в коде — ваш `src/theme/theme.js` (`buildTheme()` → `useTheme()`).

Цель работы: каждый экран должен **визуально совпасть с `ui_kits/app/*.jsx`**, используя токены темы, без хардкод-цветов.

---

## Золотые правила

1. **Никаких хардкод-цветов/радиусов/шрифтов в компонентах.** Только `const t = useTheme()` → `t.accent`, `t.t1`, `t.radii.lg24`, `t.font.bold`, …
2. **Мятный акцент — точечно.** Только CTA, активные состояния, icon-chip, прогресс, «AI» в логотипе. Никаких больших мятных заливок.
3. **Текст на CTA — `accentPress`, не `accent`** (AA-контраст белого текста).
4. **Семантика здоровья (`ok/warn/danger`) — только реальный статус**, не декор. Обратимые действия (logout) — нейтральные, не красные.
5. **Данные — на solid `surface`. Декор — на стекле.** Мелкие числа/записи/графики никогда не на `surfaceGlass` (decor).
6. **Два стекла различать:** `surfaceGlassData` (плотное, читаемое — статус, рекомендации) vs `surfaceGlass` (decor — switcher, Paws, таб-бар).
7. **Эмодзи** только: Paws 🐾, виды питомцев 🐶🐱, ранги-медали 🥈. Не в иконографии и не в тексте-руководстве.
8. **Сообщения о здоровье** всегда несут оговорку: «общие рекомендации, не диагноз; при проблемах — к ветеринару».

---

## Маппинг: веб-токен (CSS) → RN-тема (`useTheme()`)

| Веб (`styles.css` / `tokens`) | RN (`t = useTheme()`) |
|---|---|
| `var(--accent)` / `--accent-press` / `--accent-tint` | `t.accent` / `t.accentPress` / `t.accentTint` |
| `var(--ok|warn|danger)` | `t.ok` / `t.warn` / `t.danger` |
| `var(--t1..--t4)`, `--on-accent` | `t.t1..t.t4`, `t.onAccent` |
| `var(--surface)` | `t.surface` |
| `.ph-glass-data` | `t.surfaceGlassData` (`bg/blur` → `expo-blur` `BlurView` + overlay) |
| `.ph-glass-decor` | `t.surfaceGlass` (`bg/blur/border`) |
| `var(--hairline)` | `t.hairline` |
| `--event-*` | `t.eventTypes.{record,prescription,vaccine,reminder,appointment}` |
| `--cat-*` | `t.assistantCategories.{health,nutrition,behavior,grooming,emergency,relocation,general}` |
| `--r-sm..--r-xl`, `--r-pill` | `t.radii.{sm12,md16,lg24,xl28,pill999}` |
| `--font-sans` + вес | `fontFamily: t.font.{regular,medium,semibold,bold}` (в RN вес задаётся **семейством**, не `fontWeight`) |
| `--shadow-*` | `t.shadow` (iOS `shadow*` + Android `elevation`) |
| `--glow-accent` | `t.glowAccent` |
| `.ph-bg` (радиальные блобы) | `t.bgBase` + `t.bgBlobs[]` через `react-native-svg` `RadialGradient` (легаси-fallback: `t.bgGradient` в `expo-linear-gradient`) |

> Значения в скиле и в `theme.js` **совпадают 1:1** — токены портированы из `theme.js`. Если расходятся — источник истины `theme.js`.

---

## Веб-компонент скила → что использовать в RN

Веб-компоненты (`components/**/*.jsx`) показывают **API и вид**. В RN это ваши примитивы (Фаза 3) или обёртки над `Pressable`/`View`/`Text`:

| Скил (веб) | RN-эквивалент | Ключевое |
|---|---|---|
| `Button` | `Pressable` + `Text` | pill (`radii.pill999`), фон `accentPress`, текст `onAccent` `font.bold`; press → `opacity`/`scale 0.98` |
| `IconChip` | `View` + `@expo/vector-icons` `Ionicons` | круглая плашка, фон = цвет @14% alpha, глиф = цвет |
| `Badge` | `View` + `Text` | pill; soft = цвет@16% + цветной текст; solid = заливка |
| `Card` | `View` | `surface`, `hairline`, `t.shadow`, `radii.md16`; статус — левый бордер 4px |
| `GlassCard` | `BlurView` (expo-blur) + overlay | `data` vs `decor` по таблице выше |
| `Input` | `TextInput` | бордер→`accent` на фокусе; ведущий `Ionicons` |
| `Switch` | `Switch` (RN) или кастом | `trackColor` on=`accent` |
| `ProgressBar` | 2×`View` | трек `hairline`, заливка `accent`, `radii.pill999` |
| `StatusCard` | `View` + `IconChip` | solid; левый страйп = семантика; UPPERCASE caption `t3`; метрика `font.bold` |

Иконки в обоих местах — **Ionicons** (в RN `@expo/vector-icons`), имена совпадают (предпочтительно `-outline`).

---

## Чеклист по экранам (делать по одному)

Сверять с соответствующим `ui_kits/app/*.jsx`.

- [ ] **DashboardScreen** ← `DashboardScreen.jsx`
  Порядок: pet switcher (decor glass) → **Health Overview** 2×2 `StatusCard` (solid, семантические страйпы) → Vet recommendations (data glass) → Tip of the Day (decor glass) → **Paws** (decor glass + `ProgressBar` + CTA «Support a shelter»).
- [ ] **MedicalScreen** ← `MedicalScreen.jsx`
  Allergy-баннер (`warn`-страйп) → легенда `eventTypes` → записи (solid `Card`, левый страйп = тип события, плашка иконки @14%).
- [ ] **AIAssistantHub + Chat** ← `AssistantScreens.jsx`
  Хаб: Free chat / Photo analysis + сетка категорий (цвета `assistantCategories`). Чат: хедер цветом категории, бот-баблы на `surfaceGlassData` + `glowAccent`, юзер-баблы `accentPress`.
- [ ] **ActivityScreen** ← `ActivityScreen.jsx`
  Всё на solid (данные): weight-тренд (бар-чарт, последний бар `accent`), лента активности с `+N 🐾`.
- [ ] **ProfileScreen** ← `ProfileScreen.jsx`
  User-карточка + rank (decor glass) → settings на data glass: `Switch` (notifications, dark mode), сегменты (units kg/lb, язык) → logout `outline`/нейтральный.
- [ ] **LoginScreen** ← `LoginScreen.jsx`
  Лого (мятная «AI») → `Input` (mail/lock) → pill CTA → переключатель login/signup.
- [ ] **Глобально:** фон каждого экрана — `.ph-bg`-эквивалент (`bgBase` + `bgBlobs` через svg). Таб-бар — decor glass, активная вкладка — `accent`.

---

## Как формулировать задания Claude Code

Давайте по одному экрану, со ссылкой на эталон:

> «Используй навык pethealth-design (`.claude/skills/pethealth-design/`). Перестрой `src/screens/DashboardScreen.js` так, чтобы он визуально совпал с `ui_kits/app/DashboardScreen.jsx`. Все цвета/радиусы/шрифты — через `useTheme()` (`buildTheme` в `src/theme/theme.js`), без хардкода. Соблюдай PRODUCTION_RN.md: акцент точечно, данные на solid, декор на стекле, семантика только для статуса. Не меняй бизнес-логику и навигацию — только визуальный слой.»

После каждого экрана — прогон на устройстве/симуляторе и сверка со скриншотом из UI-кита.
