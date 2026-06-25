Dashboard health tile — icon-chip, uppercase caption, bold metric and subtitle, with a semantic left stripe. Compose two-per-row for the Health Overview grid.

```jsx
<StatusCard icon="medkit-outline" title="Vaccination" value="12 Jul"
            subtitle="Rabies booster" statusColor="var(--warn)" />
<StatusCard icon="scale-outline" title="Biometry" value="32.4 kg"
            subtitle="+0.3 kg · was 32.1" />
```

- `statusColor` drives both the icon-chip tint and the 4px stripe — use ok/warn/danger for real health status, `--t3` for neutral metrics (e.g. weight).
- Solid surface by design (carries fine data); don't put it on decor glass.
