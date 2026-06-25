# SETUP — куда класть файлы и как добавить в git

## A. Куда какой файл (структура репозитория)

```
<корень репо>/
├─ MIGRATION.md                      ← в КОРЕНЬ (рядом с README.md)
├─ design/                           ← НОВАЯ папка: справочные материалы дизайна
│  ├─ PetHealthAI Prototype.html        (рабочий прототип, нужен интернет)
│  ├─ PetHealthAI Prototype (standalone).html  (открывается офлайн, 1 файл)
│  ├─ core.jsx
│  ├─ screens-auth.jsx
│  ├─ screens-dashboard.jsx
│  ├─ screens-health.jsx
│  ├─ screens-assistant.jsx
│  ├─ screens-activity.jsx
│  ├─ screens-profile.jsx
│  ├─ screens-extra.jsx
│  └─ tweaks-panel.jsx
│
├─ src/
│  ├─ components/
│  │  └─ Segmented.js               ← из rn-port/components/Segmented.js (РАБОЧИЙ код)
│  └─ screens/
│     └─ MedicalHubScreen.js        ← из rn-port/screens/MedicalHubScreen.js (заменяет заглушку)
```

Коротко:
- **`MIGRATION.md`** → корень репо.
- **`design/`** → весь прототип (HTML + все `*.jsx`). Это справка/референс, НЕ компилируется приложением.
- **`rn-port/` → НЕ копировать как есть.** Это исходники переноса. Их содержимое идёт в `src/`:
  - `rn-port/components/Segmented.js` → `src/components/Segmented.js`
  - `rn-port/screens/MedicalHubScreen.js` → `src/screens/MedicalHubScreen.js` (замена текущей заглушки)
  - `rn-port/PORTING_GUIDE.md` → можно положить в `design/` или `docs/` для справки.

> `design/` — рабочий код React, его не нужно собирать в RN-бандл. Чтобы Metro его случайно не подхватил,
> при желании добавь в `metro.config.js` → `resolver.blockList` правило на папку `design/`
> (необязательно, т.к. `.jsx`-веб-файлы и так не импортируются из `src/`).

## B. Что делает каждый файл
- `PetHealthAI Prototype (standalone).html` — открой двойным кликом в браузере: весь прототип офлайн,
  с панелью Tweaks (акцент/тема/язык/вариант). Удобно показывать команде/заказчику.
- `MIGRATION.md` — главный документ: §6 и §7 — готовые промты для Claude Code.
- `src/components/Segmented.js`, `src/screens/MedicalHubScreen.js` — первый реально перенесённый экран.

---

## C. ГОТОВЫЙ ПРОМТ ДЛЯ CLAUDE CODE — добавить файлы в существующий git

```
В этом репозитории нужно добавить дизайн-материалы и первый перенесённый экран. Сделай аккуратно,
по конвенциям проекта, и не ломай сборку.

1. Создай папку design/ в корне и помести туда справочные файлы прототипа (НЕ компилируемые приложением):
   PetHealthAI Prototype.html, PetHealthAI Prototype (standalone).html, core.jsx, tweaks-panel.jsx и все
   screens-*.jsx. Это веб-референс на React+Babel, из src/ он не импортируется.

2. Положи MIGRATION.md в корень репозитория (рядом с README). Если файл уже есть — не затирай, а
   объедини разделы (сохрани существующее содержимое, добавь новые §0–§8).

3. Перенеси РАБОЧИЙ RN-код в src/:
   - rn-port/components/Segmented.js  → src/components/Segmented.js
   - rn-port/screens/MedicalHubScreen.js → src/screens/MedicalHubScreen.js (заменяет текущую заглушку
     MedicalHubScreen, сверь импорты Screen/GlassCard/IconChip с реальными путями проекта).
   PORTING_GUIDE.md из rn-port положи в design/.

4. Проверь, что Metro/ESLint не пытаются собирать design/*.jsx как часть приложения. При необходимости
   добавь design/ в resolver.blockList в metro.config.js и в ignore ESLint.

5. Убедись, что приложение стартует (expo start), экран MedicalHub открывается без красных ошибок;
   данные в нём пока DEMO_* — оставь как есть, замену на реальные хуки сделаем отдельным шагом.

6. Закоммить логично:
   - commit 1 "docs: добавить дизайн-прототип и MIGRATION.md"  (design/ + MIGRATION.md)
   - commit 2 "feat(medical): экран Здоровье по новому дизайну + Segmented"  (src/)
   Создай ветку feature/design-migration, выведи git status и дифф перед коммитом, ничего не пушь без
   моего подтверждения.
```

## D. Если предпочитаешь руками (без Claude Code)
```bash
git checkout -b feature/design-migration

mkdir -p design src/components src/screens
# скопируй файлы из присланного архива согласно секции A, затем:

git add MIGRATION.md design/
git commit -m "docs: добавить дизайн-прототип и MIGRATION.md"

git add src/components/Segmented.js src/screens/MedicalHubScreen.js
git commit -m "feat(medical): экран Здоровье по новому дизайну + Segmented"

git status        # проверь
# git push -u origin feature/design-migration   # когда готов
```
