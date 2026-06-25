# PetHealthAI — Design System

A brand & UI design system for **PetHealthAI**, an AI-powered mobile companion for pet health. Owners track vaccinations, vet visits, parasite treatments and weight; scan vet documents; chat with an AI assistant; and earn **Paws** (loyalty points) that translate into votes directing a monthly charity pool to animal shelters.

This system packages the product's redesigned visual foundation — a **warm wellness aesthetic built on soft mint/teal accents, frosted glass, and rounded Nunito type** — into tokens, reusable components, foundation cards, and a full mobile UI kit.

## Sources

Everything here is derived from the product's own source of truth, not invented:

- **GitHub repo:** [`maximilian-marshak/pethealth-ai`](https://github.com/maximilian-marshak/pethealth-ai) — Expo / React Native app (Supabase backend, OpenRouter AI). Explore it to build higher-fidelity designs.
  - `src/theme/theme.js` — the canonical token source (light + dark, accent presets, glass tiers, categorical palettes). Ported 1:1 into `tokens/colors.css`.
  - `docs/PetHealthAI_visual_foundation.md` — the design-foundation spec (glass discipline, accent rules, accessibility). The basis for the Visual Foundations section below.
  - `src/screens/*`, `src/components/*` — screen & primitive implementations the UI kit recreates.
  - `src/locales/en/*` — product copy (used verbatim where possible).
  - `assets/fonts/Nunito-*.ttf`, `assets/icon.png` — fonts and brand mark (copied into `assets/`).

> The app's UI is bilingual (EN/RU). This design system standardises on the **English** copy.

---

## Content Fundamentals

How PetHealthAI writes.

- **Voice: warm, calm, encouraging — a knowledgeable friend, not a clinician.** Wellness tone over medical sternness. "Your pet's health companion." "Help shelter animals." "Keep ears and teeth checked weekly."
- **Second person, addressed to the owner.** "Add your first pet to get started." "Ask me anything about Mango's care." The pet is referred to by name or as "your pet".
- **Sentence case everywhere** for titles, buttons and labels ("Support a shelter", "Add record", "Vet recommendations"). The only uppercase is the tiny tracked caption labels on status cards ("VACCINATION", "WEIGHT").
- **Short, plain, action-first.** Buttons are verb phrases ("Log in", "Earn more Paws", "Discuss with AI"). Empty states are one friendly line + one CTA ("No pets yet!" → "Add your first pet to get started").
- **Concrete and reassuring on health.** Guidance is practical and non-alarming, and always carries the safety caveat: *"This is general guidance, not a diagnosis. For health concerns, emergencies or medication decisions, always consult a veterinarian."* Emergencies are the one place urgency is raised explicitly.
- **Gamification language is generous, never pushy.** Points are "Paws"; earning is framed around caring for your pet and helping shelters, not stre'aks-for-streaks. "Paws become votes that direct the monthly charity pool to shelters."
- **Emoji: used sparingly and purposefully.** A paw 🐾 stands in for the brand/Paws currency; pet species get a face (🐶🐱🐰); rank medals (🥈) and the occasional streak 🔥. Emoji never replace UI labels or appear in body guidance — they're accent moments in gamification and pet identity only.
- **Numbers are the heroes.** Weight, Paws balance, due dates, progress are set large and bold; everything else supports them.

---

## Visual Foundations

The look: **warm wellness, soft glass, one confident accent.**

### Color & accent
- **One brand accent — mint/teal `#56B89F`** (dark `#6FCBB2`), used *only* pointwise: CTAs, active states, icon-chips, progress tracks, the "AI" in the logo. Press state `#3E9C84` is the fill behind white CTA text (passes AA; the base accent does not). Large mint surfaces are avoided — "no overuse of mint."
- **Optional accent presets** (peach, blue) exist as opt-in theme variants; **mint is canon.**
- **Health semantics are a separate triad** — `ok #2EA567` (grassy green, deliberately *not* the teal accent), `warn #E8A93C`, `danger #E2574C`. Used only for real health status. Reversible actions (logout) are neutral, never red.
- **Two more categorical palettes**, distinct from both accent and semantics: **event types** (medical calendar — violet/blue/teal/amber/rose, avoids green & red so a type never reads as a status) and **assistant categories** (7 hues for AI hub tiles; emergency sits in red-orange).
- Neutrals run `t1 #1A1A2E` → `t4 #B5B5C0` (placeholder). Text is always `t1/t2` for AA contrast; the accent family is reserved for large CTA text.

### Backgrounds
**Radial blobs, not flat fills.** A near-white substrate (`#FBFEFD`) under three soft radial pastel blobs — **mint dominant** (top-left), peach (top-right) and blue (bottom) kept delicate. Implemented as `.ph-bg`. Dark theme uses a deep `#0F1117` substrate with dimmer blobs. No harsh linear gradients; no purple.

### Glass (the signature)
**Two-tier frosted glass, with discipline:**
- `data` glass — denser (`.62` white, blur 24) for *readable data*: status cards, recommendations.
- `decor` glass — translucent (`.30` white, blur 34, light 1px border) for *brand/decoration*: pet switcher, AI insight, Paws, rank, tab bar.
- **Rule: anything with fine numbers, charts or records sits on a solid surface (`#FFFFFF`), never on decor glass.** Critical text never floats on un-backed glass.

### Type
**Nunito** — a friendly rounded grotesk — across the board. Weights 400 body / 500 labels / 600 emphasis / 700 headings & metrics. Scale: display 36 (hero numbers / H1) → h2 22 → h3 18 → body 15 → caption 11. Metrics (weight, Paws, dates) are large, bold and tabular.

### Shape, depth & motion
- **Generous radii:** sm 12 · md 16 · lg 24 · xl 28 (large cards) · pill 999 (buttons, inputs, chips, toggles). Buttons and inputs are pills.
- **Soft diffuse shadows** (`shadow-1/2/3`) plus a **mint accent glow** (`0 0 24px mint /.30`) reserved for active chat bubbles / focused cards. Dark theme: softer, deeper shadows, brighter glow.
- **Cards:** rounded, hairline border (`rgba(0,0,0,.06)`), soft shadow. Health status cards add a 4px semantic left stripe.
- **Hover/press:** buttons darken slightly and scale to ~0.98 on press (tactile, subtle); active tab/pill swaps to filled accent. Transitions are short fades/eases (~150ms), no bounces or decorative loops. Inputs lift their border to accent with a soft focus ring on focus.
- **Tactility is point-targeted:** 3D-style badges/medals appear only in gamification & charity, never across the general UI.

### Accessibility
Both light and dark are first-class. Text contrast targets WCAG AA in both themes; white-on-accent CTAs use `accent-press`, not `accent`.

---

## Iconography

- **Ionicons** (`@expo/vector-icons` → `Ionicons` in the app) is the icon system. In this design system they're loaded from the Ionicons web-component CDN (`<ion-icon name="…">`). **This is a faithful match to the app, not a substitution.**
- **Style: line icons, medium weight, rounded caps** — prefer the `-outline` variants (`medkit-outline`, `calendar-outline`, `bug-outline`, `scale-outline`, `sparkles-outline`, `notifications-outline`). Filled glyphs are used for active tab-bar items and small accent moments.
- **Icon-chips are the brand's signature treatment:** a round tinted plate (accent-tint, or a category/semantic colour at ~14% alpha) holding a centered line glyph. See the `IconChip` component and the dashboard status cards.
- **Emoji** are used as lightweight illustration in two places only: the **Paws** currency (🐾), pet **species** avatars (🐶🐱🐰🐦🐹🐠🐢🐍) and rank **medals** (🥇🥈🥉). They are not part of the icon system proper.
- **No hand-drawn / bespoke SVG icon set.** Don't invent icons — pull the closest Ionicon.

### Brand assets (`assets/`)
- `icon.png` / `android-icon-foreground.png` — the **caret app mark** (soft, rounded, dimensional). Note: the mark is currently a **legacy blue**; the redesigned brand accent is mint. Pair the mark with the mint **wordmark** (`PetHealth` in `t1` + `AI` in accent). *(See Caveats.)*
- `splash-icon.png`, `favicon.png` — supporting marks.
- `fonts/Nunito-*.ttf` — the four Nunito weights.

---

## Index / manifest

**Root**
- `styles.css` — global entry point (import this one file). `@import`s all token files + base.
- `tokens/` — `colors.css`, `typography.css`, `spacing.css`, `fonts.css` (@font-face), `base.css` (reset + `.ph-bg` background + glass helpers).
- `assets/` — brand mark, splash/favicon, Nunito font files.
- `cards/` — foundation specimen cards (Colors, Type, Spacing, Brand) shown in the Design System tab.
- `SKILL.md` — Agent-Skill manifest for use in Claude Code.

**Components** (`components/`, namespace `window.PetHealthAIDesignSystem_…`)
- `core/` — `Button`, `IconChip`, `Badge`, `GlassCard`, `Card`
- `forms/` — `Input`, `Switch`
- `feedback/` — `ProgressBar`, `StatusCard`

Each component ships `.jsx` + `.d.ts` + `.prompt.md`, with one `@dsCard` showcase HTML per group.

**UI kit** (`ui_kits/app/`)
- `index.html` — interactive click-through of the mobile app: **login → dashboard → assistant hub → AI chat**, plus Medical, Activity and Profile tabs (with a working light/dark toggle).
- Screens: `LoginScreen`, `DashboardScreen`, `AssistantScreens` (hub + chat), `MedicalScreen`, `ActivityScreen`, `ProfileScreen`; `AppShell` (phone frame, status bar, tab bar).

---

## Caveats

- **Fonts are the real thing** — Nunito TTFs are copied from the app repo; no substitution.
- **The app mark is legacy blue, the brand accent is mint.** The redesign moved the accent to mint but the shipped icon asset is still the blue caret. The wordmark uses mint. If you have an updated mint app icon, drop it into `assets/` and update `cards/brand-appmark.html`.
- **The radial-blob background** uses CSS `radial-gradient` + `color-mix` to approximate the app's `react-native-svg` RadialGradient blobs — visually faithful, not pixel-identical.
- **Glass uses CSS `backdrop-filter`** (the web equivalent of the app's `expo-blur`); rendering varies slightly by browser.
