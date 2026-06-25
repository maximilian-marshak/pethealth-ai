Pill-shaped call-to-action button in the brand mint; use for primary actions, with secondary/ghost variants for lower-emphasis actions.

```jsx
<Button icon="heart" onClick={donate}>Support a shelter</Button>
<Button variant="secondary">Earn more Paws</Button>
<Button variant="ghost" size="sm" iconRight="chevron-forward">All recommendations</Button>
```

- `variant`: primary (filled accent-press, white text — AA safe), secondary (accent tint), ghost (transparent accent text), outline (hairline border), danger (red — destructive only).
- `size`: sm / md / lg. `block` stretches to full width.
- `icon` / `iconRight` take Ionicons names. Always pill radius.
