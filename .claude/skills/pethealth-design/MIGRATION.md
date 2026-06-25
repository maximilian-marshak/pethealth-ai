# PetHealthAI — Миграция приложения на дизайн-систему

Пошаговый план пересборки **реального RN-приложения** (`pethealth-ai`) под этот дизайн-скил. Делайте сверху вниз. Каждый блок «промпта» — копируйте целиком в Claude Code, запущенный **из корня `pethealth-ai`**.

> Принципы (не нарушать): по **одному экрану** за раз · акцент **точечно** · данные на **solid**, декор на **стекле** · семантика `ok/warn/danger` только для **статуса** · всё через **`useTheme()`**, без хардкода · бизнес-логику и навигацию **не трогать**. Подробности — в `PRODUCTION_RN.md`.

После каждого экрана: прогон на симуляторе → сверка со скриншотом из `ui_kits/app/` → `git commit`.

---

## Шаг 0 — установка скила

Распакуйте дизайн-систему в репозиторий приложения:
```
pethealth-ai/.claude/skills/pethealth-design/
   ├─ SKILL.md   PRODUCTION_RN.md   readme.md   styles.css
   ├─ tokens/   components/   ui_kits/   assets/
```
Запустите Claude Code из корня `pethealth-ai`. Проверка: «какие у тебя есть skills?» → должен увидеть `pethealth-design`.

---

## Шаг 1 — сверить тему

```
Прочитай .claude/skills/pethealth-design/PRODUCTION_RN.md и tokens/colors.css из этого скила.
Сверь их с src/theme/theme.js (buildTheme). Проверь, что присутствуют и совпадают по
значениям все токены: accent / accentPress / accentTint, ok / warn / danger, t1–t4, onAccent,
surface / surfaceGlassData / surfaceGlass / hairline, eventTypes.*, assistantCategories.*,
radii (sm12/md16/lg24/xl28/pill999), shadow, glowAccent, bgBase / bgBlobs.
Добавь недостающие токены, НИЧЕГО существующего не ломая и не переименовывая.
Покажи список расхождений и что добавил. Файлы экранов пока не трогай.
```

---

## Шаг 2 — RN-примитивы (фундамент)

```
Используй навык pethealth-design. По таблице «веб-компонент → RN» из PRODUCTION_RN.md
создай (или приведи к ней существующие) переиспользуемые RN-компоненты в src/components/ui/:
Button, IconChip, Badge, Card, GlassCard, Input, Switch, ProgressBar, StatusCard.
Вид и API бери из components/**/*.jsx этого скила, значения — из useTheme() (theme.js),
иконки — @expo/vector-icons Ionicons. Стекло — через expo-blur BlurView (data vs decor).
Не хардкодь цвета/радиусы/шрифты. Бизнес-логику приложения не затрагивай.
Покажи итоговые файлы и краткий пример использования каждого.
```

---

## Шаг 3 — выбить хардкод

```
Найди в src/ все хардкод-значения цветов (#hex, rgb), радиусов и fontWeight в StyleSheet
компонентов и экранов. Замени их на токены из useTheme() согласно маппингу в PRODUCTION_RN.md.
Логику, навигацию и тексты не меняй. Сгруппируй изменения по файлам и покажи дифф.
```

---

## Шаг 4 — экраны по одному

Эталоны лежат в скиле: `ui_kits/app/*.jsx`. Промпты ниже — по очереди.

### 4.1 — Dashboard
```
Используй навык pethealth-design. Перестрой src/screens/DashboardScreen.js так, чтобы он
визуально совпал с ui_kits/app/DashboardScreen.jsx. Порядок блоков: pet switcher (decor glass)
→ Health Overview (сетка 2×2 StatusCard, solid, семантические левые страйпы) → Vet
recommendations (data glass) → Tip of the Day (decor glass) → Paws (decor glass + ProgressBar
+ CTA «Support a shelter»). Используй RN-примитивы из src/components/ui/ и useTheme().
Соблюдай PRODUCTION_RN.md. Бизнес-логику и навигацию НЕ меняй — только визуальный слой.
```

### 4.2 — Medical
```
Используй навык pethealth-design. Приведи src/screens/MedicalScreen.js к виду
ui_kits/app/MedicalScreen.jsx: allergy-баннер с warn-страйпом → легенда eventTypes →
записи как solid Card с левым страйпом цвета типа события и плашкой иконки (цвет @14%).
Цвета только из eventTypes.* в useTheme(), без хардкода. Логику не трогай.
(MedicalScreen.js очень большой — меняй ТОЛЬКО визуальный слой/стили, поэтапно,
не переписывай обработчики и работу с данными.)
```

### 4.3 — AI Assistant (hub + chat)
```
Используй навык pethealth-design. Приведи src/screens/AIAssistantHubScreen.js и
src/screens/AIAssistantChatScreen.js к виду ui_kits/app/AssistantScreens.jsx.
Хаб: карточки Free chat / Photo analysis + сетка категорий, цвета из assistantCategories.*.
Чат: хедер цветом категории, бот-баблы на surfaceGlassData + glowAccent, юзер-баблы accentPress.
Всё через useTheme(). Логику отправки/стриминга и навигацию не меняй.
```

### 4.4 — Activity
```
Используй навык pethealth-design. Приведи src/screens/ActivityScreen.js к виду
ui_kits/app/ActivityScreen.jsx. Это экран данных — ВСЁ на solid surface, не на стекле:
weight-тренд (бар-чарт, последний бар = accent, остальные accentTint) + лента активности
с «+N 🐾». Цвета/радиусы/шрифты из useTheme(). Логику не трогай.
```

### 4.5 — Profile
```
Используй навык pethealth-design. Приведи src/screens/ProfileScreen.js к виду
ui_kits/app/ProfileScreen.jsx: user-карточка + rank (decor glass) → блоки настроек на
data glass с RN Switch (notifications, dark mode) и сегментами (units kg/lb, язык) →
logout как outline/нейтральная кнопка (НЕ красная — действие обратимое).
Подключи реальное переключение темы (light/dark) через ваш ThemeProvider, если оно есть.
Через useTheme(), без хардкода. Логику не меняй.
```

### 4.6 — Login
```
Используй навык pethealth-design. Приведи src/screens/LoginScreen.js к виду
ui_kits/app/LoginScreen.jsx: лого с мятной «AI» → Input (mail / lock, ведущие Ionicons,
фокус-бордер accent) → pill-CTA (accentPress, текст onAccent) → переключатель login/signup.
Через useTheme(). Логику авторизации не трогай.
```

---

## Шаг 5 — глобальный слой

```
Используй навык pethealth-design. 1) Сделай фон каждого экрана эквивалентом .ph-bg:
bgBase + bgBlobs через react-native-svg RadialGradient (вынеси в общий компонент
ScreenBackground в src/components/ui/). 2) Таб-бар — decor glass (BlurView), активная
вкладка — accent, неактивные — t3, иконки Ionicons (-outline неактив / filled актив).
Через useTheme(). Навигацию не меняй.
```

---

## Шаг 6 — вторичные экраны (по тем же правилам)

После основных шести пройдись по остальным, переиспользуя готовые примитивы и правила
PRODUCTION_RN.md (отдельные эталоны для них не делались — держись токенов и общих принципов):
`AddPetScreen`, `AppointmentsScreen`, `DocumentsScreen`, `PetDetailScreen`,
`RecordDetailScreen`, `OCRReviewScreen`, `NotificationsScreen`, `KnowledgeBaseScreen`,
`KnowledgeArticleScreen`, `FAQScreen`, `HowToEarnPawsScreen`, `RelocationScreen`.

Промпт-шаблон:
```
Используй навык pethealth-design. Приведи src/screens/<ИМЯ>.js к бренду по PRODUCTION_RN.md:
данные на solid Card, декор на стекле, акцент точечно, семантика только для статуса,
иконки в IconChip, всё через useTheme(). Переиспользуй примитивы из src/components/ui/.
Эталонного макета для этого экрана нет — следуй токенам и принципам системы.
Бизнес-логику и навигацию не меняй.
```

---

## Чеклист готовности (отмечайте по мере прохождения)

- [ ] Шаг 1 — тема сверена, расхождений нет
- [ ] Шаг 2 — RN-примитивы в `src/components/ui/`
- [ ] Шаг 3 — хардкод-цвета выбиты
- [ ] 4.1 Dashboard
- [ ] 4.2 Medical
- [ ] 4.3 Assistant (hub + chat)
- [ ] 4.4 Activity
- [ ] 4.5 Profile
- [ ] 4.6 Login
- [ ] Шаг 5 — фон-блобы + таб-бар
- [ ] Шаг 6 — вторичные экраны
- [ ] Финальный прогон light + dark на симуляторе
```
```
