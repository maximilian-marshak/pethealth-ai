Frosted-glass surface — the brand's signature container. Two tiers: `data` for readable info, `decor` for brand/decorative blocks.

```jsx
<GlassCard variant="decor" padding={20}>…pet switcher…</GlassCard>
<GlassCard variant="data">…vet recommendations…</GlassCard>
<GlassCard glow>…active AI chat card…</GlassCard>
```

- Place over the `.ph-bg` radial-blob background so the blur reads.
- `data` = .62 bg / blur 24 (status, recs). `decor` = .30 bg / blur 34 + light border (switcher, insight, Paws).
- Rule: never put fine numbers/records on decor glass — use `data` or a solid `Card`.
- `glow` swaps the soft shadow for the mint accent glow (chat / active states).
