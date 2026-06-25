// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Medical: event-type legend + records (solid).
// Showcases the categorical eventTypes palette.
// ════════════════════════════════════════════════════════════
function MedicalScreen() {
  const { Card, Button, Badge } = window.PetHealthAIDesignSystem_fd90ba;
  const legend = [
    { t: 'Record', c: 'var(--event-record)' },
    { t: 'Prescription', c: 'var(--event-prescription)' },
    { t: 'Vaccine', c: 'var(--event-vaccine)' },
    { t: 'Reminder', c: 'var(--event-reminder)' },
    { t: 'Appointment', c: 'var(--event-appointment)' },
  ];
  const records = [
    { type: 'Vaccine', c: 'var(--event-vaccine)', title: 'Rabies booster', date: '12 Jul 2026', meta: 'Next due in 12 mo', icon: 'medkit-outline' },
    { type: 'Appointment', c: 'var(--event-appointment)', title: 'Annual check-up', date: '3 Aug 2026', meta: 'Paws & Claws Clinic', icon: 'calendar-outline' },
    { type: 'Prescription', c: 'var(--event-prescription)', title: 'Apoquel 16mg', date: '20 Jun 2026', meta: 'Course 70% complete', icon: 'medical-outline' },
    { type: 'Record', c: 'var(--event-record)', title: 'Blood panel', date: '3 Jun 2026', meta: 'Scanned · all normal', icon: 'document-text-outline' },
  ];

  return (
    <ScreenBody style={{ padding: '4px 16px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px 16px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.4px' }}>Medical</div>
        <ion-icon name="share-outline" style={{ fontSize: 22, color: 'var(--accent)' }}></ion-icon>
      </div>

      {/* allergy banner */}
      <Card statusColor="var(--warn)" padding={14} style={{ borderRadius: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ion-icon name="warning-outline" style={{ fontSize: 20, color: 'var(--warn)' }}></ion-icon>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>Allergies</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Chicken protein · Pollen</div>
          </div>
          <Badge tone="warn">Moderate</Badge>
        </div>
      </Card>

      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '0 4px 14px' }}>
        {legend.map((l) => (
          <div key={l.t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: l.c }} />
            <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{l.t}</span>
          </div>
        ))}
      </div>

      {/* records */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {records.map((r, i) => (
          <Card key={i} statusColor={r.c} padding={14} style={{ borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, flex: 'none',
                background: `color-mix(in srgb, ${r.c} 14%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ion-icon name={r.icon} style={{ fontSize: 19, color: r.c }}></ion-icon>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>{r.meta}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{r.date}</div>
            </div>
          </Card>
        ))}
      </div>

      <Button block icon="add" variant="secondary">Add record</Button>
    </ScreenBody>
  );
}
window.MedicalScreen = MedicalScreen;
