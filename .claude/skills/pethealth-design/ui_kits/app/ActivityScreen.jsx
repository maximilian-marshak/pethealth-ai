// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Activity: weight trend (solid card) + recent log.
// Solid surfaces only — this screen is all data.
// ════════════════════════════════════════════════════════════
function ActivityScreen() {
  const { Card, IconChip, Badge } = window.PetHealthAIDesignSystem_fd90ba;
  const weights = [31.2, 31.6, 31.4, 31.9, 32.1, 32.4];
  const labels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const min = 30.5, max = 33;
  const log = [
    { icon: 'medkit-outline', color: 'var(--event-vaccine)', title: 'Vaccination logged', sub: 'Rabies booster · verified', when: 'Today', paws: 15 },
    { icon: 'document-text-outline', color: 'var(--event-record)', title: 'Document scanned', sub: 'Blood panel results', when: 'Yesterday', paws: 10 },
    { icon: 'scale-outline', color: 'var(--t3)', title: 'Weight recorded', sub: '32.4 kg · +0.3 kg', when: '2 days ago', paws: 5 },
    { icon: 'walk-outline', color: 'var(--cat-nutrition)', title: 'Daily check-in', sub: '7-day care streak 🔥', when: '2 days ago', paws: 5 },
  ];

  return (
    <ScreenBody style={{ padding: '4px 16px 24px' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', padding: '6px 4px 16px', letterSpacing: '-0.4px' }}>Activity</div>

      {/* weight trend */}
      <Card padding={18} style={{ borderRadius: 20, marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--t3)' }}>Weight</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.1 }}>32.4<span style={{ fontSize: 16, color: 'var(--t3)' }}> kg</span></div>
          </div>
          <Badge tone="ok" icon="trending-up">+1.2 kg / 6mo</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
          {weights.map((w, i) => {
            const h = ((w - min) / (max - min)) * 100;
            const last = i === weights.length - 1;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: last ? 'var(--accent-press)' : 'var(--t3)' }}>{w}</div>
                <div style={{ width: '100%', height: `${h}%`, minHeight: 8, borderRadius: 8,
                  background: last ? 'var(--accent)' : 'var(--accent-tint)' }} />
                <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{labels[i]}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* recent activity */}
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', margin: '0 4px 12px' }}>Recent Activity</div>
      <Card padding={6} style={{ borderRadius: 20 }}>
        {log.map((e, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px',
            borderBottom: i < log.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
            <IconChip name={e.icon} color={e.color} size={17} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>{e.title}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>{e.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-press)' }}>+{e.paws} 🐾</div>
              <div style={{ fontSize: 11, color: 'var(--t4)' }}>{e.when}</div>
            </div>
          </div>
        ))}
      </Card>
    </ScreenBody>
  );
}
window.ActivityScreen = ActivityScreen;
