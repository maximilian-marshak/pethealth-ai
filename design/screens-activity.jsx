// ══════════════════════════════════════════════════════════════
// screens-activity.jsx — Активность: Награды + Charity
// ══════════════════════════════════════════════════════════════

function Medallion({ tier, locked, size = 60 }) {
  const grad = {
    gold: ['#FFE08A', '#E8B23C', '#B8861F'],
    silver: ['#EAEFF5', '#B9C3CF', '#8A95A3'],
    bronze: ['#F0C49A', '#CC8A52', '#9C6536'],
  }[tier] || ['#EAEFF5', '#B9C3CF', '#8A95A3'];
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      background: `radial-gradient(circle at 35% 28%, ${grad[0]}, ${grad[1]} 55%, ${grad[2]})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: locked ? 'none' : `0 6px 16px ${grad[2]}66, inset 0 2px 4px rgba(255,255,255,0.6)`,
      filter: locked ? 'grayscale(1) opacity(0.4)' : 'none', position: 'relative' }}>
      <Icon name={locked ? 'lock-closed' : 'paw'} size={size * 0.4} color={locked ? '#fff' : 'rgba(255,255,255,0.95)'} />
    </div>
  );
}

function ActivityScreen({ go }) {
  const { theme } = useTheme();
  const L = useL();
  const [tab, setTab] = useState('rewards');

  const badges = [
    { tier: 'gold', ru: 'Чемпион лап', en: 'Champion Paws', locked: false },
    { tier: 'silver', ru: 'Вакцинирован', en: 'Vaccinated', locked: false },
    { tier: 'bronze', ru: 'Ежедневный гуляка', en: 'Daily Walker', locked: false },
    { tier: 'gold', ru: 'Защитник', en: 'Guardian', locked: true },
    { tier: 'silver', ru: '30 дней', en: '30-day streak', locked: true },
    { tier: 'bronze', ru: 'Первый скан', en: 'First scan', locked: true },
  ];
  const shelters = [
    { ru: 'Приют «Тёплый дом»', en: 'Warm Home Shelter', votes: 142, pct: 46 },
    { ru: 'Фонд «Лапа в лапу»', en: 'Paw-in-Paw Fund', votes: 98, pct: 32 },
    { ru: 'Приют «Верный друг»', en: 'Loyal Friend Shelter', votes: 67, pct: 22 },
  ];

  return (
    <ScreenBody>
      <div style={{ paddingTop: 8 }}>
        <ScreenHeader titleRu="Активность" titleEn="Activity" go={go} />

        {/* Paws hero (glass) */}
        <GlassCard variant="decor" glow pad={22} style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.accentPress, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L('Баланс Paws', 'Paws balance')}</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: theme.t1, lineHeight: 1.1, margin: '4px 0' }}>1 240 🐾</div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 12.5, color: theme.t2, fontWeight: 600 }}>{L('Заработано в этом месяце', 'Earned this month')}</span>
              <span style={{ fontSize: 12.5, color: theme.t1, fontWeight: 800 }}>320/500</span>
            </div>
            <ProgressBar value={320} max={500} height={12} />
          </div>
        </GlassCard>

        <div style={{ marginBottom: 16 }}>
          <Segmented value={tab} onChange={setTab} options={[
            { k: 'rewards', label: L('Награды', 'Rewards') },
            { k: 'charity', label: L('Благотворительность', 'Charity') },
          ]} />
        </div>

        {tab === 'rewards' && (<>
          <SectionTitle action={L('Все', 'All')}>{L('Достижения', 'Achievements')}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            {badges.map((b, i) => (
              <SolidCard key={i} pad={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
                <Medallion tier={b.tier} locked={b.locked} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: b.locked ? theme.t4 : theme.t1, textAlign: 'center', lineHeight: 1.25 }}>{L(b.ru, b.en)}</span>
              </SolidCard>
            ))}
          </div>
          <SectionTitle>{L('Как заработать Paws', 'How to earn Paws')}</SectionTitle>
          {[
            { ic: 'medkit-outline', ru: 'Подтверждённый визит', en: 'Verified visit', pts: '+100' },
            { ic: 'shield-checkmark-outline', ru: 'Подтверждённая вакцинация', en: 'Verified vaccination', pts: '+80' },
            { ic: 'scan-outline', ru: 'Скан документа', en: 'Document scan', pts: '+40' },
            { ic: 'checkmark-done-outline', ru: 'Отметка приёма лекарства', en: 'Medication check-in', pts: '+10' },
          ].map((r, i) => (
            <SolidCard key={i} pad={13} style={{ marginBottom: 9, display: 'flex', alignItems: 'center', gap: 13 }}>
              <IconChip name={r.ic} dim={40} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: theme.t1 }}>{L(r.ru, r.en)}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: theme.accentPress }}>{r.pts}</span>
            </SolidCard>
          ))}
        </>)}

        {tab === 'charity' && (<>
          <SolidCard pad={18} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${theme.danger}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="heart" size={24} color={theme.danger} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: theme.t1 }}>{L('Пул помощи приютам', 'Shelter support pool')}</div>
                <div style={{ fontSize: 12.5, color: theme.t2 }}>{L('Июнь · 307 голосов', 'June · 307 votes')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <span style={{ fontSize: 13, color: theme.t2, fontWeight: 600 }}>{L('Собрано', 'Raised')}</span>
              <span style={{ fontSize: 13, color: theme.t1, fontWeight: 800 }}>61 400 ₽ / 100 000 ₽</span>
            </div>
            <ProgressBar value={614} max={1000} height={12} color={theme.danger} />
          </SolidCard>

          <SectionTitle>{L('Распределение голосов', 'Vote distribution')}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 16 }}>
            {shelters.map((s, i) => (
              <SolidCard key={i} pad={14}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1 }}>{L(s.ru, s.en)}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: theme.t2 }}>{L(`${s.votes} голосов`, `${s.votes} votes`)}</span>
                </div>
                <ProgressBar value={s.pct} max={100} height={8} />
              </SolidCard>
            ))}
          </div>
          <Btn full icon="heart" onClick={() => {}}>{L('Отдать голос приюту', 'Cast a vote')}</Btn>
          <p style={{ fontSize: 12, color: theme.t3, lineHeight: 1.5, marginTop: 14, padding: '0 4px' }}>
            {L('Ваши Paws — это голоса: они определяют долю приюта в благотворительном пуле периода.',
               'Your Paws are votes — they determine each shelter’s share of the period’s charity pool.')}
          </p>
        </>)}
      </div>
    </ScreenBody>
  );
}

Object.assign(window, { ActivityScreen, Medallion });
