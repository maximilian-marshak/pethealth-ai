// ══════════════════════════════════════════════════════════════
// screens-health.jsx — Здоровье: Medical Hub (Список/Календарь) + Паспорт
// ══════════════════════════════════════════════════════════════

function ScreenHeader({ titleRu, titleEn, go, actions }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px 14px' }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: theme.t1, margin: 0, letterSpacing: '-0.02em' }}>{L(titleRu, titleEn)}</h1>
      <div style={{ display: 'flex', gap: 6 }}>{actions}</div>
    </div>
  );
}

function HeaderIconBtn({ name, onClick }) {
  const { theme } = useTheme();
  return (
    <button onClick={onClick} style={{ width: 40, height: 40, borderRadius: 20, background: theme.surface, border: `1px solid ${theme.hairline}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: theme.shadow1 }}>
      <Icon name={name} size={20} color={theme.accent} />
    </button>
  );
}

// ─── Medical events data ──────────────────────────────────────
function medEvents(L) {
  return [
    { day: 14, mo: 'июн', moEn: 'Jun', type: 'record', cat: 'records', ic: 'medkit-outline', titleRu: 'Визит — дерматит', titleEn: 'Visit — dermatitis', subRu: 'Клиника «Айболит» · д-р Соколова', subEn: 'Aibolit Clinic · Dr. Sokolova' },
    { day: 14, mo: 'июн', moEn: 'Jun', type: 'prescription', cat: 'medications', ic: 'medical-outline', titleRu: 'Apoquel · 16 мг', titleEn: 'Apoquel · 16 mg', subRu: 'раз в день · до 24 июн', subEn: 'once daily · until Jun 24' },
    { day: 12, mo: 'июн', moEn: 'Jun', type: 'vaccine', cat: 'vaccines', ic: 'shield-checkmark-outline', titleRu: 'Бешенство (ревакцинация)', titleEn: 'Rabies (booster)', subRu: 'следующая: 12 авг', subEn: 'next: Aug 12' },
    { day: 2, mo: 'июн', moEn: 'Jun', type: 'record', cat: 'records', ic: 'flask-outline', titleRu: 'Анализ крови', titleEn: 'Blood test', subRu: 'результат: в норме', subEn: 'result: normal' },
    { day: 5, mo: 'май', moEn: 'May', type: 'reminder', cat: 'records', ic: 'bug-outline', titleRu: 'Обработка от клещей', titleEn: 'Tick treatment', subRu: 'Bravecto · до 5 июл', subEn: 'Bravecto · until Jul 5' },
  ];
}

function MedTimeline({ filter, go }) {
  const { theme } = useTheme();
  const L = useL();
  const events = medEvents(L).filter(e => filter === 'overview' || e.cat === filter);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {events.map((e, i) => (
        <SolidCard key={i} pad={14} onClick={() => go('record')} style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 38 }}>
            <span style={{ fontSize: 19, fontWeight: 900, color: theme.t1, lineHeight: 1 }}>{e.day}</span>
            <span style={{ fontSize: 11, color: theme.t3, fontWeight: 700, textTransform: 'uppercase' }}>{L(e.mo, e.moEn)}</span>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: theme.hairline }} />
          <IconChip name={e.ic} dim={40} size={20} bg={`${theme.eventTypes[e.type]}1f`} color={theme.eventTypes[e.type]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1 }}>{L(e.titleRu, e.titleEn)}</div>
            <div style={{ fontSize: 12.5, color: theme.t2, marginTop: 1 }}>{L(e.subRu, e.subEn)}</div>
          </div>
          <Icon name="chevron-forward" size={18} color={theme.t4} />
        </SolidCard>
      ))}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────
const CAL_MARKS = { 2: ['record'], 12: ['vaccine'], 14: ['record', 'prescription'], 24: ['prescription'], 28: ['appointment'] };

function CalendarView({ go }) {
  const { theme } = useTheme();
  const L = useL();
  const [sel, setSel] = useState(14);
  const daysRu = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const daysEn = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  // June 2026 starts on Monday (offset 0)
  const cells = [];
  for (let d = 1; d <= 30; d++) cells.push(d);
  const legend = [
    { type: 'record', ru: 'Визит', en: 'Visit' },
    { type: 'vaccine', ru: 'Вакцина', en: 'Vaccine' },
    { type: 'prescription', ru: 'Лекарство', en: 'Med' },
    { type: 'appointment', ru: 'Приём', en: 'Appt' },
  ];
  const agenda = medEvents(L).filter(e => e.day === sel && (e.mo === 'июн'));
  return (
    <>
      <SolidCard pad={16} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Icon name="chevron-back" size={20} color={theme.t3} />
          <span style={{ fontSize: 16, fontWeight: 800, color: theme.t1 }}>{L('Июнь 2026', 'June 2026')}</span>
          <Icon name="chevron-forward" size={20} color={theme.t3} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
          {(L === undefined ? daysRu : daysRu).map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: theme.t3 }}>{L(daysRu[i], daysEn[i])}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map(d => {
            const marks = CAL_MARKS[d] || [];
            const on = sel === d;
            return (
              <button key={d} onClick={() => setSel(d)} style={{ aspectRatio: '1', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: on ? theme.accent : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontFamily: 'inherit' }}>
                <span style={{ fontSize: 13.5, fontWeight: on ? 800 : 600, color: on ? '#fff' : (d === 25 ? theme.accent : theme.t1) }}>{d}</span>
                <div style={{ display: 'flex', gap: 2, height: 5 }}>
                  {marks.map((m, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 3, background: on ? '#fff' : theme.eventTypes[m] }} />)}
                </div>
              </button>
            );
          })}
        </div>
      </SolidCard>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, padding: '0 4px' }}>
        {legend.map(l => (
          <div key={l.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 5, background: theme.eventTypes[l.type] }} />
            <span style={{ fontSize: 12, color: theme.t2, fontWeight: 600 }}>{L(l.ru, l.en)}</span>
          </div>
        ))}
      </div>
      <SectionTitle>{L('События дня', 'Day events')}</SectionTitle>
      {agenda.length ? <MedTimeline filter="overview" go={go} /> : (
        <SolidCard pad={28} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📅</div>
          <div style={{ fontSize: 14, color: theme.t2, fontWeight: 600 }}>{L('Нет событий', 'No events')}</div>
        </SolidCard>
      )}
    </>
  );
}

// ─── Passport ─────────────────────────────────────────────────
function PassportView({ pet, go }) {
  const { theme } = useTheme();
  const L = useL();
  const info = [
    { ic: 'calendar-outline', labelRu: 'Дата рождения', labelEn: 'Birth date', valRu: '12 марта 2023', valEn: 'Mar 12, 2023' },
    { ic: 'male-outline', labelRu: 'Пол', labelEn: 'Gender', valRu: 'Сука · стерилизована', valEn: 'Female · spayed' },
    { ic: 'barbell-outline', labelRu: 'Вес', labelEn: 'Weight', valRu: '24,5 кг', valEn: '24.5 kg' },
    { ic: 'water-outline', labelRu: 'Группа крови', labelEn: 'Blood type', valRu: 'DEA 1.1+', valEn: 'DEA 1.1+' },
    { ic: 'hardware-chip-outline', labelRu: 'Микрочип', labelEn: 'Microchip', valRu: '985112…78903', valEn: '985112…78903' },
  ];
  const allergies = [
    { nameRu: 'Курица', nameEn: 'Chicken', sev: 'moderate' },
    { nameRu: 'Амоксициллин', nameEn: 'Amoxicillin', sev: 'severe' },
  ];
  const sevColor = { mild: theme.ok, moderate: theme.warn, severe: theme.danger };
  const sevLabel = { mild: L('Лёгкая', 'Mild'), moderate: L('Средняя', 'Moderate'), severe: L('Тяжёлая', 'Severe') };
  return (
    <>
      {/* Pet hero */}
      <SolidCard pad={20} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar emoji={pet.emoji} size={72} ring />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: theme.t1 }}>{pet.name}</div>
          <div style={{ fontSize: 14, color: theme.t2 }}>{L(pet.breedRu, pet.breedEn)} · {L('3 года', '3 yrs')}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Btn variant="tint" style={{ padding: '7px 14px', fontSize: 13 }} icon="create-outline" onClick={() => go('editpet')}>{L('Изменить', 'Edit')}</Btn>
            <Btn variant="outline" style={{ padding: '7px 14px', fontSize: 13 }} icon="qr-code-outline">{L('QR', 'QR')}</Btn>
          </div>
        </div>
      </SolidCard>

      {/* Allergy danger banner */}
      <div style={{ background: `${theme.danger}14`, border: `1px solid ${theme.danger}40`, borderRadius: RADII.lg, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="warning" size={19} color={theme.danger} />
          <span style={{ fontSize: 15, fontWeight: 800, color: theme.danger }}>{L('Аллергии', 'Allergies')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {allergies.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14.5, fontWeight: 700, color: theme.t1 }}>{L(a.nameRu, a.nameEn)}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: sevColor[a.sev], background: `${sevColor[a.sev]}1f`, padding: '4px 10px', borderRadius: RADII.pill }}>{sevLabel[a.sev]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <SolidCard pad={6} style={{ marginBottom: 14 }}>
        {info.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 12px', borderBottom: i < info.length - 1 ? `1px solid ${theme.hairline}` : 'none' }}>
            <Icon name={it.ic} size={20} color={theme.accent} />
            <span style={{ flex: 1, fontSize: 13.5, color: theme.t2, fontWeight: 600 }}>{L(it.labelRu, it.labelEn)}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{L(it.valRu, it.valEn)}</span>
          </div>
        ))}
      </SolidCard>

      {/* Chronic */}
      <SectionTitle action={L('+ Добавить', '+ Add')}>{L('Хронические', 'Chronic')}</SectionTitle>
      <SolidCard pad={16} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <IconChip name="pulse-outline" dim={40} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1 }}>{L('Атопический дерматит', 'Atopic dermatitis')}</div>
          <div style={{ fontSize: 12.5, color: theme.t2 }}>{L('С марта 2025 · активно', 'Since Mar 2025 · active')}</div>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: theme.warn, background: `${theme.warn}1f`, padding: '4px 10px', borderRadius: RADII.pill }}>{L('Активно', 'Active')}</span>
      </SolidCard>
    </>
  );
}

// ─── Composer ─────────────────────────────────────────────────
function PetChips({ pet, pets, onSelect, go }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }} className="hscroll">
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
  );
}

function HealthScreen({ pet, pets, onSelect, go }) {
  const { theme } = useTheme();
  const L = useL();
  const [view, setView] = useState('list'); // list | calendar | passport
  const [filter, setFilter] = useState('overview');
  const filters = [
    { k: 'overview', label: L('Обзор', 'All') },
    { k: 'vaccines', label: L('Вакцины', 'Vaccines') },
    { k: 'medications', label: L('Лекарства', 'Meds') },
    { k: 'records', label: L('Записи', 'Records') },
  ];
  return (
    <ScreenBody>
      <div style={{ paddingTop: 8 }}>
        <ScreenHeader titleRu="Медкарта" titleEn="Records" go={go} actions={<>
          <HeaderIconBtn name="folder-open-outline" onClick={() => go('documents')} />
          <HeaderIconBtn name="share-outline" />
          <HeaderIconBtn name="scan-outline" onClick={() => go('ocr')} />
        </>} />
        {pets && <PetChips pet={pet} pets={pets} onSelect={onSelect} go={go} />}
        <div style={{ marginBottom: 16 }}>
          <Segmented value={view} onChange={setView} options={[
            { k: 'list', label: L('Список', 'List') },
            { k: 'calendar', label: L('Календарь', 'Calendar') },
            { k: 'passport', label: L('Паспорт', 'Passport') },
          ]} />
        </div>

        {view === 'list' && (<>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, paddingBottom: 2 }} className="hscroll">
              {filters.map(f => <Chip key={f.k} label={f.label} active={filter === f.k} onClick={() => setFilter(f.k)} />)}
            </div>
            <button onClick={() => go('addrecord')} style={{ width: 38, height: 38, borderRadius: 19, flexShrink: 0, background: theme.accentPress,
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 6px 16px rgba(${theme.accentRgb},0.4)` }}>
              <Icon name="add" size={22} color="#fff" />
            </button>
          </div>
          <MedTimeline filter={filter} go={go} />
        </>)}

        {view === 'calendar' && <CalendarView go={go} />}
        {view === 'passport' && <PassportView pet={pet} go={go} />}
      </div>
    </ScreenBody>
  );
}

Object.assign(window, { HealthScreen, ScreenHeader, HeaderIconBtn });
