# Перенос прототипа в приложение (React Native / Expo)

Прототип построен на **ваших токенах** (`src/theme/theme.js`) и **ваших примитивах**
(`Screen`, `GlassCard`, `IconChip`). Поэтому перенос — это перевод веб-разметки
в RN, а не переделка дизайна. Логика и данные у вас уже есть — меняется только вёрстка.

## Что уже совпадает 1-в-1
- Палитра, акцент mint/peach/blue, ok/warn/danger, eventTypes — это ваш `buildTheme()`.
- Стекло: веб `GlassCard variant="data|decor"` == ваш `GlassCard` на `expo-blur`.
- Иконки: в вебе Ionicons-имена → в RN те же имена в `<Ionicons />` (`@expo/vector-icons`).
- Фон-блобы: веб radial-gradient == ваш `Screen.js` (react-native-svg).

## Таблица перевода веб → RN
| Прототип (web)                  | React Native                                  |
|---------------------------------|-----------------------------------------------|
| `<div>`                         | `<View>`                                      |
| текст в любом теге              | **всегда** внутри `<Text>`                     |
| `onClick`                       | `onPress` (`Pressable` / `TouchableOpacity`)  |
| `<ion-icon name>`               | `<Ionicons name size color />`                |
| CSS `display:flex; gap`         | `flexDirection`, `gap` (RN 0.71+, у вас 0.81 ✓)|
| `backdrop-filter` (стекло)      | `<GlassCard>` (expo-blur) — уже готово         |
| `grid 2 кол.`                   | `flexDirection:'row', flexWrap`, ширина `48%` / `100/7 %` |
| скролл                          | `<ScrollView>` (гориз. чипы — `horizontal`)    |
| `box-shadow`                    | `theme.shadow` / `theme.glowAccent`            |
| inline `style={{}}`             | `StyleSheet.create` + `makeStyles(theme)`      |
| строки RU/EN                    | `useTranslation('ns')` + ключи в `locales/`    |

## Порядок (рекомендую)
1. **Примитивы, которых ещё нет.** Скопируйте `rn-port/components/Segmented.js`
   в `src/components/`. (Chip и StatusDot я встроил прямо в экран — при желании вынесите.)
2. **Экран «Здоровье».** `rn-port/screens/MedicalHubScreen.js` → замените им ваш
   текущий `MedicalHubScreen.js` (сейчас это заглушка) и зарегистрируйте в `AppNavigator`.
3. **Данные.** В файле помечены `DEMO_*` массивы — поменяйте на ваши хуки
   (`useMedicalRecords`, `usePets`, `useDashboardStatus`). Разметка не меняется.
4. **i18n.** Тексты «Список/Календарь/Паспорт», «Аллергии», легенда, дни недели —
   вынесите в `locales/{ru,en}/medical.json` (ключи `medical.calendar.types.*` у вас уже есть).
5. Повторите для остальных экранов (Главная с 3 вариантами, Ассистент+чат, Активность, Профиль).

## Важные RN-нюансы
- **Каждая** строка — в `<Text>`, иначе краш.
- `gap` и проценты в `flexBasis/width` поддерживаются (RN 0.81).
- Шрифт: используйте `fontFamily: theme.font.bold/semibold/regular` (Nunito уже в `useFonts`).
- Тени кросс-платформенно уже зашиты в `theme.shadow` (iOS shadow* + Android elevation).
- Не хардкодьте hex — только `theme.*` (правило вашего DoD).

## Хотите — продолжу
Скажите, какой экран следующий (Главная / Ассистент / Активность / Профиль) —
выдам так же готовый RN-файл под ваши примитивы. Либо соберу полный
developer-handoff пакет для Claude Code.
