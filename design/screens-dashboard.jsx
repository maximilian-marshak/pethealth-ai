// ══════════════════════════════════════════════════════════════
// screens-dashboard.jsx — Главная (Dashboard), 3 layout variants
// A "Карточки" (polished эталон) · B "Фокус" (health-score hero)
// C "Лента" (today timeline)
// ══════════════════════════════════════════════════════════════

// ─── Shared header: Pet Switcher (glass decor) ────────────────
function PetSwitcher({ pet, pets, onSelect, go }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <GlassCard variant="decor" pad={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={() => go('petdetail')} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, cursor: 'pointer' }}>
          <Avatar emoji={pet.emoji} size={52} ring />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.t1 }}>{pet.name}</div>
            <div style={{ fontSize: 13, color: theme.t2 }}>{L(pet.breedRu, pet.breedEn)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => go('notifications')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="notifications-outline" size={24} color={theme.accent} />
            <span style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
              background: theme.danger, color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
          </button>
          <Icon name="person-circle-outline" size={38} color={theme.accent} style={{ cursor: 'pointer' }} onClick={() => go('profile')} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, overflowX: 'auto', paddingBottom: 2 }} className="hscroll">
        {pets.map(p => {
          const on = p.name === pet.name;
          return (
            <button key={p.name} onClick={() => onSelect(p)} style={{ display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: RADII.pill, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              background: on ? theme.accentPress : theme.surface, border: `1px solid ${on ? theme.accentPress : theme.hairline}` }}>
              <span style={{ fontSize: 15 }}>{p.emoji}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: on ? theme.onAccent : theme.t2 }}>{p.name}</span>
            </button>
          );
        })}
        <button onClick={() => go('addpet')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: RADII.pill,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', background: 'transparent', border: `1.5px dashed ${theme.accent}` }}>
          <Icon name="add" size={16} color={theme.accent} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: theme.accentPress }}>{L('Добавить', 'Add')}</span>
        </button>
      </div>
    </GlassCard>
  );
}

// ─── Status data ──────────────────────────────────────────────
function useStatuses(L) {
  const { theme } = useTheme();
  return [
    { id: 'vac', ic: 'shield-checkmark-outline', titleRu: 'Вакцинация', titleEn: 'Vaccination', valRu: 'Защищён', valEn: 'Protected', subRu: 'до 12 авг', subEn: 'until Aug 12', kind: 'ok' },
    { id: 'appt', ic: 'medkit-outline', titleRu: 'Ближайший приём', titleEn: 'Next visit', valRu: '28 июн, 14:30', valEn: 'Jun 28, 2:30pm', subRu: 'Клиника «Айболит»', subEn: 'Aibolit Clinic', kind: 'warn' },
    { id: 'para', ic: 'bug-outline', titleRu: 'Паразиты', titleEn: 'Parasites', valRu: 'Обработан', valEn: 'Treated', subRu: 'до 5 июл', subEn: 'until Jul 5', kind: 'ok' },
    { id: 'med', ic: 'medical-outline', titleRu: 'Лекарства', titleEn: 'Medication', valRu: '1 курс', valEn: '1 course', subRu: 'Apoquel · 16 мг', subEn: 'Apoquel · 16 mg', kind: 'warn' },
    { id: 'lab', ic: 'flask-outline', titleRu: 'Анализы', titleEn: 'Lab results', valRu: 'В норме', valEn: 'Normal', subRu: 'кровь · 2 июн', subEn: 'blood · Jun 2', kind: 'ok' },
  ];
}

function StatusCard({ s, go }) {
  const { theme } = useTheme();
  const L = useL();
  const kindColor = s.kind === 'ok' ? theme.ok : s.kind === 'warn' ? theme.warn : s.kind === 'danger' ? theme.danger : theme.t3;
  return (
    <SolidCard pad={14} onClick={() => go('health')} style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <IconChip name={s.ic} dim={38} size={19} />
        <StatusDot kind={s.kind} />
      </div>
      <div style={{ fontSize: 12.5, color: theme.t2, fontWeight: 600 }}>{L(s.titleRu, s.titleEn)}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: s.kind === 'neutral' ? theme.t1 : kindColor, marginTop: 2 }}>{L(s.valRu, s.valEn)}</div>
      <div style={{ fontSize: 11.5, color: theme.t3, marginTop: 1 }}>{L(s.subRu, s.subEn)}</div>
    </SolidCard>
  );
}

// ─── Recommendations card ─────────────────────────────────────
function RecCard({ go }) {
  const { theme } = useTheme();
  const L = useL();
  const items = [
    L('Продолжить Apoquel ещё 10 дней', 'Continue Apoquel for 10 more days'),
    L('Гипоаллергенный корм, исключить курицу', 'Hypoallergenic diet, exclude chicken'),
    L('Контрольный осмотр через 2 недели', 'Follow-up check-up in 2 weeks'),
  ];
  return (
    <GlassCard variant="data" pad={16} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Icon name="clipboard-outline" size={18} color={theme.accent} />
        <span style={{ fontSize: 16, fontWeight: 800, color: theme.t1 }}>{L('Рекомендации врача', 'Vet recommendations')}</span>
      </div>
      <div style={{ fontSize: 12, color: theme.t2, marginBottom: 12 }}>{L('С последнего визита: Клиника «Айболит», 14 июн', 'Since last visit: Aibolit Clinic, Jun 14')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: theme.accent, marginTop: 7, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: theme.t1, lineHeight: 1.4 }}>{it}</span>
          </div>
        ))}
      </div>
      <span onClick={() => go('record')} style={{ display: 'inline-block', marginTop: 12, fontSize: 14, fontWeight: 700, color: theme.accentPress, cursor: 'pointer' }}>{L('Все рекомендации', 'All recommendations')}</span>
    </GlassCard>
  );
}

// ─── AI insight ───────────────────────────────────────────────
function AIInsight({ go }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <GlassCard variant="decor" pad={16} glow style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <IconChip name="sparkles" dim={36} size={18} />
        <span style={{ fontSize: 16, fontWeight: 800, color: theme.t1 }}>{L('Совет дня', 'Tip of the day')}</span>
      </div>
      <p style={{ fontSize: 14, color: theme.t2, lineHeight: 1.5, margin: 0 }}>
        {L('Регулярно вычёсывайте шерсть Луны — это снижает линьку и помогает раньше заметить проблемы с кожей.',
           'Brush Luna regularly — it reduces shedding and helps spot skin issues early.')}
      </p>
      <Btn variant="tint" full icon="chatbubble-ellipses-outline" style={{ marginTop: 14 }} onClick={() => go('assistant')}>{L('Обсудить с ИИ', 'Discuss with AI')}</Btn>
    </GlassCard>
  );
}

// ─── Paws / charity card ──────────────────────────────────────
function PawsCard({ compact, go }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <GlassCard variant="decor" pad={20} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: compact ? 12 : 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: theme.accentTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 24 }}>🐾</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.t1 }}>Paws Points</div>
          <div style={{ fontSize: 12.5, color: theme.t2 }}>{L('Помогайте животным в приютах', 'Help shelter animals')}</div>
        </div>
        <Icon name="information-circle-outline" size={22} color={theme.accent} style={{ cursor: 'pointer' }} onClick={() => go('charity')} />
      </div>
      {!compact && (
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 46, fontWeight: 900, color: theme.t1, lineHeight: 1 }}>1 240</div>
          <div style={{ fontSize: 13, color: theme.t2, fontWeight: 700, marginTop: 4 }}>{L('Всего Paws', 'Total Paws')}</div>
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: theme.t2, fontWeight: 600 }}>{L('Заработано в этом месяце', 'Earned this month')}</span>
          <span style={{ fontSize: 13, color: theme.t1, fontWeight: 800 }}>320/500</span>
        </div>
        <ProgressBar value={320} max={500} height={12} />
      </div>
      <Btn full icon="heart" onClick={() => go('charity')}>{L('Поддержать приют', 'Support a shelter')}</Btn>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: theme.accentPress, cursor: 'pointer' }} onClick={() => go('earnpaws')}>{L('+ Заработать больше Paws', '+ Earn more Paws')}</span>
      </div>
    </GlassCard>
  );
}

function RankCard({ go }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <GlassCard variant="decor" pad={16} onClick={() => go('profile')} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ fontSize: 34 }}>🥈</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, color: theme.t2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L('Ранг', 'Rank')}</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: theme.t1 }}>{L('Защитник лап', 'Paw Guardian')}</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase' }}>{L('Серебро', 'Silver')}</div>
      </div>
      <Icon name="chevron-forward" size={20} color={theme.t3} />
    </GlassCard>
  );
}

function QuickActions({ go }) {
  const { theme } = useTheme();
  const L = useL();
  const acts = [
    { ic: 'medical', label: L('Медкарта', 'Records'), t: 'health' },
    { ic: 'chatbubble-ellipses', label: L('AI Чат', 'AI Chat'), t: 'assistant' },
    { ic: 'today', label: L('Запись', 'Booking'), t: 'appointments' },
    { ic: 'person', label: L('Профиль', 'Profile'), t: 'profile' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
      {acts.map(a => (
        <button key={a.label} onClick={() => go(a.t)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, fontFamily: 'inherit' }}>
          <IconChip name={a.ic} dim={56} size={24} bg={theme.surface} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: theme.t2 }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Variant B: health-score hero ─────────────────────────────
function HealthHero({ go }) {
  const { theme } = useTheme();
  const L = useL();
  const minis = [
    { ic: 'shield-checkmark', valRu: 'Защищён', valEn: 'Protected', kind: 'ok' },
    { ic: 'medkit', valRu: '28 июн', valEn: 'Jun 28', kind: 'warn' },
    { ic: 'bug', valRu: 'Обработан', valEn: 'Treated', kind: 'ok' },
  ];
  return (
    <GlassCard variant="decor" pad={22} glow style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <Ring pct={86} size={128} stroke={13}>
          <span style={{ fontSize: 38, fontWeight: 900, color: theme.t1, lineHeight: 1 }}>86</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.t3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{L('баллов', 'score')}</span>
        </Ring>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.accentPress, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{L('Индекс здоровья', 'Health index')}</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: theme.t1, marginTop: 3, lineHeight: 1.2 }}>{L('Луна в хорошей форме', 'Luna is doing great')}</div>
          <div style={{ fontSize: 13, color: theme.t2, marginTop: 5, lineHeight: 1.4 }}>{L('1 задача требует внимания', '1 item needs attention')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        {minis.map((m, i) => (
          <div key={i} style={{ flex: 1, background: theme.scheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)', borderRadius: RADII.md, padding: '10px 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <Icon name={m.ic} size={20} color={m.kind === 'ok' ? theme.ok : m.kind === 'warn' ? theme.warn : theme.accent} />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: theme.t1 }}>{L(m.valRu, m.valEn)}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function StatusStrip({ statuses, go }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }} className="hscroll">
      {statuses.map(s => {
        const kc = s.kind === 'ok' ? theme.ok : s.kind === 'warn' ? theme.warn : s.kind === 'danger' ? theme.danger : theme.t3;
        return (
          <SolidCard key={s.id} pad={13} onClick={() => go('health')} style={{ minWidth: 124 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <IconChip name={s.ic} dim={34} size={17} /><StatusDot kind={s.kind} />
            </div>
            <div style={{ fontSize: 11.5, color: theme.t2, fontWeight: 600 }}>{L(s.titleRu, s.titleEn)}</div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: s.kind === 'neutral' ? theme.t1 : kc, marginTop: 2 }}>{L(s.valRu, s.valEn)}</div>
          </SolidCard>
        );
      })}
    </div>
  );
}

// ─── Variant C: today timeline ────────────────────────────────
function TodayTimeline({ go }) {
  const { theme } = useTheme();
  const L = useL();
  const events = [
    { t: '08:00', type: 'reminder', ic: 'medical-outline', titleRu: 'Apoquel · 16 мг', titleEn: 'Apoquel · 16 mg', subRu: 'утренний приём', subEn: 'morning dose', done: true },
    { t: '13:00', type: 'reminder', ic: 'restaurant-outline', titleRu: 'Кормление', titleEn: 'Feeding', subRu: 'гипоаллергенный корм', subEn: 'hypoallergenic diet', done: false },
    { t: '18:30', type: 'record', ic: 'walk-outline', titleRu: 'Прогулка', titleEn: 'Walk', subRu: 'цель 30 мин', subEn: 'goal 30 min', done: false },
  ];
  return (
    <SolidCard pad={18} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: theme.t1 }}>{L('Сегодня', 'Today')}</span>
        <span style={{ fontSize: 13, color: theme.t2, fontWeight: 600 }}>{L('25 июня', 'June 25')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.map((e, i) => {
          const ec = theme.eventTypes[e.type];
          return (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: e.done ? theme.accent : `${ec}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={e.done ? 'checkmark' : e.ic} size={17} color={e.done ? '#fff' : ec} />
                </div>
                {i < events.length - 1 && <div style={{ width: 2, flex: 1, background: theme.hairline, minHeight: 22 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: i < events.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1, textDecoration: e.done ? 'line-through' : 'none', opacity: e.done ? 0.55 : 1 }}>{L(e.titleRu, e.titleEn)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.t3 }}>{e.t}</span>
                </div>
                <div style={{ fontSize: 12.5, color: theme.t3, marginTop: 1 }}>{L(e.subRu, e.subEn)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Btn variant="tint" full icon="calendar-outline" style={{ marginTop: 16 }} onClick={() => go('health')}>{L('Открыть календарь', 'Open calendar')}</Btn>
    </SolidCard>
  );
}

function MiniSummary({ statuses, go }) {
  const { theme } = useTheme();
  const L = useL();
  const ok = statuses.filter(s => s.kind === 'ok').length;
  const warn = statuses.filter(s => s.kind === 'warn').length;
  const items = [
    { ic: 'shield-checkmark', n: ok, labelRu: 'в норме', labelEn: 'on track', c: theme.ok },
    { ic: 'alert-circle', n: warn, labelRu: 'внимание', labelEn: 'attention', c: theme.warn },
    { ic: 'flask', n: 4, labelRu: 'записей', labelEn: 'records', c: theme.accent },
  ];
  return (
    <SolidCard pad={16} onClick={() => go('health')} style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Icon name={it.ic} size={22} color={it.c} />
          <span style={{ fontSize: 20, fontWeight: 900, color: theme.t1 }}>{it.n}</span>
          <span style={{ fontSize: 11.5, color: theme.t2, fontWeight: 600 }}>{L(it.labelRu, it.labelEn)}</span>
        </div>
      ))}
    </SolidCard>
  );
}

// ─── Dashboard composer ───────────────────────────────────────
function DashboardScreen({ pet, pets, onSelect, variant, go }) {
  const { theme } = useTheme();
  const L = useL();
  const statuses = useStatuses(L);
  const header = <PetSwitcher pet={pet} pets={pets} onSelect={onSelect} go={go} />;

  return (
    <ScreenBody>
      <div style={{ paddingTop: 8 }}>{header}</div>

      {variant === 'cards' && (<>
        <SectionTitle>{L('Здоровье', 'Health')}</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {statuses.map(s => <StatusCard key={s.id} s={s} go={go} />)}
        </div>
        <RecCard go={go} />
        <AIInsight go={go} />
        <PawsCard go={go} />
        <RankCard go={go} />
        <SectionTitle>{L('Быстрые действия', 'Quick actions')}</SectionTitle>
        <QuickActions go={go} />
      </>)}

      {variant === 'focus' && (<>
        <HealthHero go={go} />
        <StatusStrip statuses={statuses} go={go} />
        <AIInsight go={go} />
        <SectionTitle>{L('Быстрые действия', 'Quick actions')}</SectionTitle>
        <QuickActions go={go} />
        <div style={{ height: 16 }} />
        <PawsCard compact go={go} />
        <RankCard go={go} />
      </>)}

      {variant === 'timeline' && (<>
        <TodayTimeline go={go} />
        <MiniSummary statuses={statuses} go={go} />
        <RecCard go={go} />
        <AIInsight go={go} />
        <PawsCard compact go={go} />
        <RankCard go={go} />
      </>)}
    </ScreenBody>
  );
}

Object.assign(window, { DashboardScreen, PetSwitcher });
