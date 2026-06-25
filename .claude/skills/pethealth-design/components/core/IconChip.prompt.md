Round tinted plate with a centered line icon; the brand's signature way to label status cards and quick actions.

```jsx
<IconChip name="medkit-outline" />
<IconChip name="bug-outline" color="var(--warn)" />
<IconChip name="sparkles-outline" size={20} />
```

- Defaults to accent glyph on accent-tint plate.
- Pass `color` to retint both glyph and plate (plate gets ~14% alpha of that colour); pass `bg` for an explicit plate fill.
- Uses Ionicons names — prefer the `-outline` line variants.
