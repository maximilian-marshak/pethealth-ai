// ══════════════════════════════════════════════════════════════
// screens-profile.jsx — Профиль: Account Hub + Settings
// ══════════════════════════════════════════════════════════════

function Row({ icon, iconColor, iconBg, label, value, right, onClick, danger, last }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px',
      borderBottom: last ? 'none' : `1px solid ${theme.hairline}`, cursor: onClick ? 'pointer' : 'default' }}>
      <IconChip name={icon} dim={36} size={18} bg={iconBg || theme.accentTint} color={iconColor || theme.accent} />
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 700, color: danger ? theme.danger : theme.t1 }}>{label}</span>
      {value && <span style={{ fontSize: 13.5, color: theme.t3, fontWeight: 600 }}>{value}</span>}
      {right || (onClick && !danger && <Icon name="chevron-forward" size={18} color={theme.t4} />)}
    </div>
  );
}

function Toggle({ on, onChange }) {
  const { theme } = useTheme();
  return (
    <div onClick={() => onChange(!on)} style={{ width: 48, height: 28, borderRadius: 14, padding: 3, cursor: 'pointer',
      background: on ? theme.accent : (theme.scheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'), transition: 'background .2s' }}>
      <div style={{ width: 22, height: 22, borderRadius: 11, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        transform: on ? 'translateX(20px)' : 'translateX(0)', transition: 'transform .2s' }} />
    </div>
  );
}

function MiniSeg({ options, value, onChange }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', background: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)', borderRadius: RADII.pill, padding: 3 }}>
      {options.map(o => (
        <button key={o.k} onClick={() => onChange(o.k)} style={{ padding: '6px 12px', borderRadius: RADII.pill, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, background: value === o.k ? theme.surface : 'transparent',
          color: value === o.k ? theme.t1 : theme.t3, boxShadow: value === o.k ? theme.shadow1 : 'none' }}>{o.label}</button>
      ))}
    </div>
  );
}

function ProfileScreen({ pets, go, lang, onSetLang, scheme, onSetScheme }) {
  const { theme } = useTheme();
  const L = useL();
  const [notif, setNotif] = useState(true);
  const [units, setUnits] = useState('kg');

  return (
    <ScreenBody>
      <div style={{ paddingTop: 8 }}>
        <ScreenHeader titleRu="Профиль" titleEn="Profile" go={go} />

        {/* User card */}
        <GlassCard variant="decor" pad={20} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: theme.accentTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 30 }}>👩</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: theme.t1 }}>{L('Анна Петрова', 'Anna Petrova')}</div>
            <div style={{ fontSize: 13.5, color: theme.t2 }}>anna@petmail.com</div>
          </div>
          <Icon name="create-outline" size={22} color={theme.accent} style={{ cursor: 'pointer' }} />
        </GlassCard>

        {/* Rank */}
        <GlassCard variant="decor" pad={16} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 34 }}>🥈</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: theme.t2, fontWeight: 700, textTransform: 'uppercase' }}>{L('Ранг · Серебро', 'Rank · Silver')}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: theme.t1 }}>{L('Защитник лап', 'Paw Guardian')}</div>
            <div style={{ marginTop: 7 }}><ProgressBar value={1240} max={2000} height={7} /></div>
            <div style={{ fontSize: 11.5, color: theme.t3, marginTop: 5 }}>{L('До следующего ранга 760 Paws', '760 Paws to next rank')}</div>
          </div>
        </GlassCard>

        {/* Pets */}
        <SectionTitle action={L('+ Добавить', '+ Add')} onAction={() => go('addpet')}>{L('Мои питомцы', 'My pets')}</SectionTitle>
        <SolidCard pad={6} style={{ marginBottom: 16 }}>
          {pets.map((p, i) => (
            <Row key={p.name} icon="paw" label={p.name} value={L(p.breedRu, p.breedEn)} onClick={() => go('petdetail')} last={i === pets.length - 1}
              right={<span style={{ fontSize: 20, marginLeft: 8 }}>{p.emoji}</span>} />
          ))}
        </SolidCard>

        {/* Settings */}
        <SectionTitle>{L('Настройки', 'Settings')}</SectionTitle>
        <SolidCard pad={6} style={{ marginBottom: 16 }}>
          <Row icon="notifications-outline" label={L('Уведомления', 'Notifications')} right={<Toggle on={notif} onChange={setNotif} />} />
          <Row icon="language-outline" label={L('Язык', 'Language')} right={
            <MiniSeg value={lang} onChange={onSetLang} options={[{ k: 'ru', label: 'RU' }, { k: 'en', label: 'EN' }]} />} />
          <Row icon="barbell-outline" label={L('Единицы веса', 'Weight units')} right={
            <MiniSeg value={units} onChange={setUnits} options={[{ k: 'kg', label: L('кг', 'kg') }, { k: 'lb', label: L('фунт', 'lb') }]} />} />
          <Row icon="moon-outline" label={L('Тёмная тема', 'Dark theme')} right={
            <Toggle on={scheme === 'dark'} onChange={v => onSetScheme(v ? 'dark' : 'light')} />} last />
        </SolidCard>

        <SolidCard pad={6} style={{ marginBottom: 16 }}>
          <Row icon="document-text-outline" label={L('Экспорт медкарты (PDF)', 'Export records (PDF)')} onClick={() => {}} />
          <Row icon="shield-checkmark-outline" label={L('Приватность и данные', 'Privacy & data')} onClick={() => {}} />
          <Row icon="help-circle-outline" label={L('Помощь и FAQ', 'Help & FAQ')} onClick={() => {}} last />
        </SolidCard>

        {/* Account */}
        <SolidCard pad={6} style={{ marginBottom: 8 }}>
          <Row icon="log-out-outline" iconBg={theme.hairline} iconColor={theme.t2} label={L('Выйти', 'Log out')} onClick={() => {}} />
          <Row icon="trash-outline" iconBg={`${theme.danger}18`} iconColor={theme.danger} label={L('Удалить аккаунт', 'Delete account')} danger onClick={() => {}} last />
        </SolidCard>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: theme.t4, marginTop: 16 }}>PetHealthAI · v2.0.0</p>
      </div>
    </ScreenBody>
  );
}

Object.assign(window, { ProfileScreen });
