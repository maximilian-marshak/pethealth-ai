---
name: pethealth-design
description: Use this skill to generate well-branded interfaces and assets for PetHealthAI, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

**Working on the real React Native app (`pethealth-ai`)?** Read **`PRODUCTION_RN.md`** first — it maps every web/CSS token in this skill to the app's `src/theme/theme.js` (`useTheme()`), says which RN primitive replaces each web component, and gives a per-screen checklist that pairs each screen with its `ui_kits/app/*.jsx` reference. The web files here are the visual/behaviour reference; values come from `theme.js`, not from `styles.css`.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

PetHealthAI — AI-powered pet-health mobile companion. Warm wellness aesthetic: soft mint/teal accent, frosted glass, rounded Nunito type, radial-blob backgrounds.

- **Tokens:** link `styles.css` (or copy `tokens/*` + `assets/fonts/`). Mint accent `#56B89F` / press `#3E9C84`; health semantics ok/warn/danger separate from the accent; two-tier glass; `.ph-bg` radial-blob background. Dark theme via `data-theme="dark"`.
- **Type:** Nunito 400/500/600/700. Metrics large & bold.
- **Icons:** Ionicons (`<ion-icon name="…-outline">`), shown in round tinted icon-chips.
- **Components:** `window.PetHealthAIDesignSystem_<hash>` → Button, IconChip, Badge, GlassCard, Card, Input, Switch, ProgressBar, StatusCard. Load `_ds_bundle.js` after React.
- **UI kit:** `ui_kits/app/index.html` — interactive mobile app recreation to copy patterns from.
- **Voice:** warm, second-person, sentence case, plain & action-first; always carry the "not a diagnosis, consult a vet" caveat on health guidance. Emoji only for Paws 🐾 / pet species / rank medals.
