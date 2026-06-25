// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Profile: rank card, settings (switches), account.
// ════════════════════════════════════════════════════════════
function ProfileScreen({ dark, onToggleDark }) {
  const { GlassCard, Switch, Badge, Button } = window.PetHealthAIDesignSystem_fd90ba;
  const [notif, setNotif] = React.useState(true);
  const [units, setUnits] = React.useState('kg');
  const [lang, setLang] = React.useState('EN');

  const Row = ({ icon, label, children, danger }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0' }}>
      <ion-icon name={icon} style={{ fontSize: 20, color: danger ? 'var(--danger)' : 'var(--accent)' }}></ion-icon>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: danger ? 'var(--danger)' : 'var(--t1)' }}>{label}</span>
      {children}
    </div>
  );
  const Seg = ({ options, value, onChange }) => (
    <div style={{ display: 'flex', background: 'var(--hairline)', borderRadius: 999, padding: 2 }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{
          border: 'none', cursor: 'pointer', padding: '5px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,
          fontFamily: 'var(--font-sans)', background: value === o ? 'var(--surface)' : 'transparent',
          color: value === o ? 'var(--accent-press)' : 'var(--t3)', boxShadow: value === o ? 'var(--shadow-1)' : 'none',
        }}>{o}</button>
      ))}
    </div>
  );

  return (
    <ScreenBody style={{ padding: '4px 16px 24px' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', padding: '6px 4px 16px', letterSpacing: '-0.4px' }}>Profile</div>

      {/* user */}
      <GlassCard variant="decor" padding={18} style={{ borderRadius: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, flex: 'none' }}>M</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Max Marshak</div>
            <div style={{ fontSize: 13, color: 'var(--t2)' }}>max@pethealth.ai</div>
          </div>
        </div>
      </GlassCard>

      {/* rank */}
      <GlassCard variant="decor" padding={16} style={{ borderRadius: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 36 }}>🥈</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--t3)' }}>Rank</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)' }}>Caring Guardian</div>
            <Badge tone="accent" style={{ marginTop: 4 }}>Silver League</Badge>
          </div>
          <ion-icon name="chevron-forward" style={{ fontSize: 20, color: 'var(--t3)' }}></ion-icon>
        </div>
      </GlassCard>

      {/* settings */}
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--t3)', margin: '6px 4px 4px' }}>Settings</div>
      <GlassCard variant="data" padding={16} style={{ borderRadius: 20, marginBottom: 16 }}>
        <Row icon="notifications-outline" label="Notifications"><Switch checked={notif} onChange={setNotif} /></Row>
        <div style={{ height: 1, background: 'var(--hairline)' }} />
        <Row icon="moon-outline" label="Dark mode"><Switch checked={dark} onChange={onToggleDark} /></Row>
        <div style={{ height: 1, background: 'var(--hairline)' }} />
        <Row icon="scale-outline" label="Units"><Seg options={['kg', 'lb']} value={units} onChange={setUnits} /></Row>
        <div style={{ height: 1, background: 'var(--hairline)' }} />
        <Row icon="language-outline" label="Language"><Seg options={['EN', 'RU']} value={lang} onChange={setLang} /></Row>
      </GlassCard>

      <GlassCard variant="data" padding={16} style={{ borderRadius: 20, marginBottom: 16 }}>
        <Row icon="help-circle-outline" label="FAQ"><ion-icon name="chevron-forward" style={{ fontSize: 18, color: 'var(--t3)' }}></ion-icon></Row>
        <div style={{ height: 1, background: 'var(--hairline)' }} />
        <Row icon="shield-checkmark-outline" label="Privacy & data"><ion-icon name="chevron-forward" style={{ fontSize: 18, color: 'var(--t3)' }}></ion-icon></Row>
      </GlassCard>

      <Button variant="outline" block icon="log-out-outline">Log out</Button>
    </ScreenBody>
  );
}
window.ProfileScreen = ProfileScreen;
