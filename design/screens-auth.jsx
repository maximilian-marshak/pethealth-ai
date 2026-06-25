// ══════════════════════════════════════════════════════════════
// screens-auth.jsx — Login / Onboarding entry flow
// ══════════════════════════════════════════════════════════════

function Logo({ size = 34 }) {
  const { theme } = useTheme();
  return (
    <span style={{ fontSize: size, fontWeight: 900, letterSpacing: '-0.02em', color: theme.t1 }}>
      PetHealth<span style={{ color: theme.accent }}>AI</span>
    </span>
  );
}

function PillInput({ icon, placeholder, type = 'text', value, onChange, right }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: theme.surface,
      border: `1px solid ${theme.hairline}`, borderRadius: RADII.pill, padding: '14px 18px', boxShadow: theme.shadow1 }}>
      <Icon name={icon} size={19} color={theme.t3} />
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange && onChange(e.target.value)}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit',
          fontSize: 15, color: theme.t1 }} />
      {right}
    </div>
  );
}

function AuthScreen({ onEnter }) {
  const { theme } = useTheme();
  const L = useL();
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('anna@petmail.com');
  const [pw, setPw] = useState('••••••••');
  const [showPw, setShowPw] = useState(false);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: bgString(theme) }}>
      <StatusBar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 30px', display: 'flex', flexDirection: 'column' }}>
        {/* Brand hero */}
        <div style={{ textAlign: 'center', paddingTop: 26, paddingBottom: 28 }}>
          <div style={{ width: 84, height: 84, margin: '0 auto 18px', borderRadius: 26, background: theme.accentTint,
            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 36px rgba(${theme.accentRgb},0.32)` }}>
            <span style={{ fontSize: 42 }}>🐾</span>
          </div>
          <Logo size={32} />
          <p style={{ color: theme.t2, fontSize: 15, marginTop: 8, lineHeight: 1.45 }}>
            {L('Здоровье питомца — под рукой. Записи, напоминания и ИИ-помощник в одном месте.',
               'Your pet’s health, in one place. Records, reminders & an AI helper.')}
          </p>
        </div>

        {/* Mode switch */}
        <div style={{ marginBottom: 18 }}>
          <Segmented value={mode} onChange={setMode} options={[
            { k: 'login', label: L('Вход', 'Sign in') },
            { k: 'register', label: L('Регистрация', 'Sign up') },
          ]} />
        </div>

        <GlassCard variant="decor" pad={20} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <PillInput icon="person-outline" placeholder={L('Имя', 'Name')} value="" onChange={() => {}} />
          )}
          <PillInput icon="mail-outline" placeholder={L('Электронная почта', 'Email')} value={email} onChange={setEmail} />
          <PillInput icon="lock-closed-outline" type={showPw ? 'text' : 'password'} placeholder={L('Пароль', 'Password')} value={pw} onChange={setPw}
            right={<Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.t3} style={{ cursor: 'pointer' }} onClick={() => setShowPw(!showPw)} />} />
          {mode === 'login' && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.accentPress, cursor: 'pointer' }}>{L('Забыли пароль?', 'Forgot password?')}</span>
            </div>
          )}
          <Btn full onClick={onEnter} style={{ marginTop: 4 }} icon="paw">
            {mode === 'login' ? L('Войти', 'Sign in') : L('Создать аккаунт', 'Create account')}
          </Btn>
        </GlassCard>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 16px' }}>
          <div style={{ flex: 1, height: 1, background: theme.hairline }} />
          <span style={{ fontSize: 12, color: theme.t3, fontWeight: 600 }}>{L('или войти через', 'or continue with')}</span>
          <div style={{ flex: 1, height: 1, background: theme.hairline }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[{ ic: 'logo-apple', t: 'Apple' }, { ic: 'logo-google', t: 'Google' }].map(s => (
            <button key={s.t} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: theme.surface, border: `1px solid ${theme.hairline}`, borderRadius: RADII.pill, padding: '12px',
              fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: theme.t1, cursor: 'pointer', boxShadow: theme.shadow1 }}>
              <Icon name={s.ic} size={19} color={theme.t1} />{s.t}
            </button>
          ))}
        </div>

        {/* QR onboarding hint (B2B core) */}
        <SolidCard pad={14} style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
          <IconChip name="qr-code-outline" dim={46} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.t1 }}>{L('Пришли из клиники?', 'Came from a clinic?')}</div>
            <div style={{ fontSize: 12.5, color: theme.t2, marginTop: 2, lineHeight: 1.4 }}>
              {L('Отсканируйте QR на ресепшене — питомец и визиты подключатся автоматически.',
                 'Scan the QR at reception — your pet & visits link automatically.')}
            </div>
          </div>
          <Icon name="chevron-forward" size={20} color={theme.t3} />
        </SolidCard>

        <p style={{ fontSize: 11.5, color: theme.t3, textAlign: 'center', marginTop: 'auto', paddingTop: 24, lineHeight: 1.5 }}>
          {L('Продолжая, вы принимаете Условия использования и Политику конфиденциальности.',
             'By continuing you accept the Terms of Use and Privacy Policy.')}
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { AuthScreen, Logo, PillInput });
