Small pill label for health statuses, counts and tags; tone carries meaning via the semantic palette.

```jsx
<Badge tone="ok" icon="checkmark-circle">Up to date</Badge>
<Badge tone="warn">Due soon</Badge>
<Badge tone="danger" solid>Overdue</Badge>
<Badge tone="accent">AI</Badge>
```

- `tone`: accent (brand), ok/warn/danger (health semantics), neutral.
- `soft` (default) = tinted bg + coloured text; `solid` = filled.
- Use ok/warn/danger only for real health status, never decoration.
