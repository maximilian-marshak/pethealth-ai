# PetHealthAI — App UI Kit

Interactive, high-fidelity recreation of the PetHealthAI mobile app (Expo / React Native), rebuilt as click-through HTML using this design system's component primitives.

Open `index.html`. Flow:

1. **Login** → tap *Log in*.
2. **Dashboard (Home)** — the redesign reference screen: pet switcher (decor glass) · Health Overview status grid (solid `StatusCard`s) · vet recommendations (data glass) · Tip of the Day (decor glass) · Paws gamification card (decor glass with `ProgressBar`).
3. **Assistant** tab — AI hub: free chat, photo analysis, category tiles (coloured by the `assistantCategories` palette). Tap any to open…
4. **AI Chat** — category-coloured header, glass bot bubbles with accent glow, working send (canned replies).
5. **Medical / Activity / Profile** tabs — records with the `eventTypes` palette, weight trend, settings with working `Switch`es and a **light/dark toggle** (flips the whole app theme).

## Files
- `index.html` — entry; loads React + Babel + Ionicons + `_ds_bundle.js`, wires navigation.
- `AppShell.jsx` — `PhoneFrame`, `StatusBar`, `TabBar`, `ScreenBody`.
- `LoginScreen.jsx`, `DashboardScreen.jsx`, `AssistantScreens.jsx`, `MedicalScreen.jsx`, `ActivityScreen.jsx`, `ProfileScreen.jsx`.

Screens compose this system's components (`Button`, `GlassCard`, `Card`, `StatusCard`, `IconChip`, `Badge`, `Input`, `Switch`, `ProgressBar`) — they don't re-implement them. Copy is taken from the app's English locale files.
