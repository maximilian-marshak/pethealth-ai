// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Dashboard (Home). The redesign reference screen:
// pet switcher (decor glass) → Health Overview status grid (solid) →
// Vet recommendations (data glass) → Tip of the Day (decor) → Paws (decor).
// ════════════════════════════════════════════════════════════
function DashboardScreen({ onOpenAssistant }) {
  const DS = window.PetHealthAIDesignSystem_fd90ba;
  const { GlassCard, StatusCard, ProgressBar, Button, IconChip, Badge } = DS;
  const [pet, setPet] = React.useState('Mango');
  const pets = [
    { name: 'Mango', emoji: '🐶', breed: 'Golden Retriever' },
    { name: 'Luna', emoji: '🐱', breed: 'British Shorthair' },
  ];
  const cur = pets.find((p) => p.name === pet);

  const SectionTitle = ({ children }) => (
    <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', margin: '4px 4px 10px' }}>{children}</div>
  );

  return (
    <ScreenBody style={{ padding: '4px 16px 24px' }}>
      {/* ── Pet switcher ── */}
      <GlassCard variant="decor" padding={16} style={{ borderRadius: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flex: 'none',
          }}>{cur.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--t1)' }}>{cur.name}</div>
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>{cur.breed}</div>
          </div>
          <div style={{ position: 'relative' }}>
            <ion-icon name="notifications-outline" style={{ fontSize: 24, color: 'var(--accent)' }}></ion-icon>
            <span style={{
              position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
              background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>2</span>
          </div>
          <ion-icon name="person-circle-outline" style={{ fontSize: 38, color: 'var(--accent)' }}></ion-icon>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto' }}>
          {pets.map((p) => {
            const on = p.name === pet;
            return (
              <button key={p.name} onClick={() => setPet(p.name)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', cursor: 'pointer',
                borderRadius: 999, border: '1px solid', whiteSpace: 'nowrap',
                borderColor: on ? 'transparent' : 'var(--hairline)',
                background: on ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
                color: on ? 'var(--on-accent)' : 'var(--t2)', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-sans)',
              }}>
                <span style={{ fontSize: 15 }}>{p.emoji}</span>{p.name}
              </button>
            );
          })}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', cursor: 'pointer',
            borderRadius: 999, border: '1px dashed var(--accent)', background: 'transparent',
            color: 'var(--accent)', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-sans)',
          }}><ion-icon name="add" style={{ fontSize: 16 }}></ion-icon>Add Pet</button>
        </div>
      </GlassCard>

      {/* ── Health Overview ── */}
      <SectionTitle>Health Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <StatusCard icon="medkit-outline" title="Vaccination" value="12 Jul" subtitle="Rabies booster" statusColor="var(--warn)" />
        <StatusCard icon="calendar-outline" title="Vet" value="3 Aug" subtitle="Annual check-up" statusColor="var(--ok)" />
        <StatusCard icon="bug-outline" title="Parasites" value="Overdue" subtitle="Last: 2 Feb" statusColor="var(--danger)" />
        <StatusCard icon="scale-outline" title="Biometry" value="32.4 kg" subtitle="+0.3 kg · was 32.1" />
      </div>

      {/* ── Vet recommendations (data glass) ── */}
      <GlassCard variant="data" padding={16} style={{ borderRadius: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ion-icon name="clipboard-outline" style={{ fontSize: 18, color: 'var(--accent)' }}></ion-icon>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Vet recommendations</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>Since last visit: Paws &amp; Claws Clinic, 3 Jun 2026</div>
        {['Switch to senior-formula food over the next week.', 'Recheck weight in 30 days.', 'Dental cleaning recommended.'].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flex: 'none' }} />
            <span style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.4 }}>{r}</span>
          </div>
        ))}
        <div style={{ color: 'var(--accent-press)', fontSize: 13, fontWeight: 700, marginTop: 6 }}>All recommendations</div>
      </GlassCard>

      {/* ── Tip of the Day (decor glass) ── */}
      <GlassCard variant="decor" padding={16} style={{ borderRadius: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <IconChip name="sparkles-outline" size={20} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Tip of the Day</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 12 }}>
          Check ears and teeth weekly — early signs of trouble are easy to miss.
        </div>
        <Button variant="secondary" size="sm" icon="chatbubble-ellipses-outline" onClick={onOpenAssistant}>Discuss with AI</Button>
      </GlassCard>

      {/* ── Paws (decor glass) ── */}
      <GlassCard variant="decor" padding={20} style={{ borderRadius: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flex: 'none',
          }}>🐾</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Paws Points</div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>Help shelter animals</div>
          </div>
          <ion-icon name="information-circle-outline" style={{ fontSize: 24, color: 'var(--accent)' }}></ion-icon>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 38, fontWeight: 700, color: 'var(--accent-press)', lineHeight: 1 }}>1,240</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t3)' }}>Total Paws</span>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 6 }}>
            <span>Earned this month</span><span>320/500</span>
          </div>
          <ProgressBar current={320} goal={500} />
        </div>
        <Button block icon="heart">Support a shelter</Button>
        <div style={{ textAlign: 'center', color: 'var(--accent-press)', fontSize: 13, fontWeight: 700, marginTop: 12 }}>+ Earn more Paws</div>
      </GlassCard>
    </ScreenBody>
  );
}
window.DashboardScreen = DashboardScreen;
