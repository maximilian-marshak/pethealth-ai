// ══════════════════════════════════════════════════════════════
// screens-extra.jsx — secondary overlay screens reached via go()
// Notifications · RecordDetail · Appointments · AddPet · OCR · PetDetail
// ══════════════════════════════════════════════════════════════

function OverlayShell({ titleRu, titleEn, onBack, children, action }) {
  const { theme } = useTheme();
  const L = useL();
  const g = theme.glassDecor;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: bgString(theme), zIndex: 30 }}>
      <StatusBar />
      <div style={{ padding: '0 12px 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: theme.accent, fontFamily: 'inherit' }}>
          <Icon name="chevron-back" size={26} color={theme.accent} />
        </button>
        <h1 style={{ flex: 1, fontSize: 19, fontWeight: 900, color: theme.t1, margin: 0 }}>{L(titleRu, titleEn)}</h1>
        {action}
      </div>
      <div className="screen-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 30px' }}>{children}</div>
    </div>
  );
}

function NotificationsOverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const items = [
    { ic: 'medkit-outline', type: 'appointment', titleRu: 'Приём через 3 дня', titleEn: 'Visit in 3 days', subRu: 'Клиника «Айболит», 28 июн 14:30', subEn: 'Aibolit Clinic, Jun 28 2:30pm', when: L('2 ч назад', '2h ago'), unread: true },
    { ic: 'medical-outline', type: 'prescription', titleRu: 'Не забудьте Apoquel', titleEn: 'Don’t forget Apoquel', subRu: 'вечерняя доза · 16 мг', subEn: 'evening dose · 16 mg', when: L('Сегодня', 'Today'), unread: true },
    { ic: 'shield-checkmark-outline', type: 'vaccine', titleRu: 'Ревакцинация скоро', titleEn: 'Booster due soon', subRu: 'Бешенство · до 12 авг', subEn: 'Rabies · until Aug 12', when: L('Вчера', 'Yesterday'), unread: true },
    { ic: 'paw-outline', type: 'reminder', titleRu: '+100 Paws начислено', titleEn: '+100 Paws earned', subRu: 'за подтверждённый визит', subEn: 'for a verified visit', when: L('2 дн назад', '2d ago'), unread: false },
  ];
  return (
    <OverlayShell titleRu="Уведомления" titleEn="Notifications" onBack={onBack}
      action={<span style={{ fontSize: 13, fontWeight: 700, color: theme.accentPress, cursor: 'pointer', paddingRight: 8 }}>{L('Прочитать всё', 'Read all')}</span>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((n, i) => (
          <SolidCard key={i} pad={14} style={{ display: 'flex', gap: 13, alignItems: 'flex-start', opacity: n.unread ? 1 : 0.7 }}>
            <IconChip name={n.ic} dim={42} bg={`${theme.eventTypes[n.type]}1f`} color={theme.eventTypes[n.type]} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1 }}>{L(n.titleRu, n.titleEn)}</span>
                {n.unread && <span style={{ width: 8, height: 8, borderRadius: 4, background: theme.accent }} />}
              </div>
              <div style={{ fontSize: 12.5, color: theme.t2, marginTop: 2 }}>{L(n.subRu, n.subEn)}</div>
              <div style={{ fontSize: 11.5, color: theme.t4, marginTop: 4 }}>{n.when}</div>
            </div>
          </SolidCard>
        ))}
      </div>
    </OverlayShell>
  );
}

function RecordDetailOverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const fields = [
    { labelRu: 'Дата визита', labelEn: 'Visit date', valRu: '14 июня 2026', valEn: 'Jun 14, 2026' },
    { labelRu: 'Клиника', labelEn: 'Clinic', valRu: 'Клиника «Айболит»', valEn: 'Aibolit Clinic' },
    { labelRu: 'Ветеринар', labelEn: 'Vet', valRu: 'д-р Соколова', valEn: 'Dr. Sokolova' },
    { labelRu: 'Диагноз', labelEn: 'Diagnosis', valRu: 'Атопический дерматит', valEn: 'Atopic dermatitis' },
    { labelRu: 'Вес', labelEn: 'Weight', valRu: '24,5 кг', valEn: '24.5 kg' },
  ];
  const recs = [
    L('Продолжить Apoquel ещё 10 дней', 'Continue Apoquel for 10 more days'),
    L('Гипоаллергенный корм, исключить курицу', 'Hypoallergenic diet, exclude chicken'),
    L('Контрольный осмотр через 2 недели', 'Follow-up check-up in 2 weeks'),
  ];
  return (
    <OverlayShell titleRu="Запись" titleEn="Record" onBack={onBack} action={<Icon name="create-outline" size={22} color={theme.accent} style={{ cursor: 'pointer', paddingRight: 8 }} />}>
      <SolidCard pad={16} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 13 }}>
        <IconChip name="medkit-outline" dim={46} bg={`${theme.eventTypes.record}1f`} color={theme.eventTypes.record} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.t1 }}>{L('Визит — дерматит', 'Visit — dermatitis')}</div>
          <div style={{ fontSize: 13, color: theme.t2 }}>{L('14 июня · Клиника «Айболит»', 'Jun 14 · Aibolit Clinic')}</div>
        </div>
      </SolidCard>
      <SolidCard pad={6} style={{ marginBottom: 14 }}>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 12px', borderBottom: i < fields.length - 1 ? `1px solid ${theme.hairline}` : 'none' }}>
            <span style={{ fontSize: 13.5, color: theme.t2, fontWeight: 600 }}>{L(f.labelRu, f.labelEn)}</span>
            <span style={{ fontSize: 14, color: theme.t1, fontWeight: 700 }}>{L(f.valRu, f.valEn)}</span>
          </div>
        ))}
      </SolidCard>
      <GlassCard variant="data" pad={16} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="clipboard-outline" size={18} color={theme.accent} />
          <span style={{ fontSize: 15, fontWeight: 800, color: theme.t1 }}>{L('Рекомендации врача', 'Vet recommendations')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {recs.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: theme.accent, marginTop: 7, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: theme.t1, lineHeight: 1.4 }}>{r}</span>
            </div>
          ))}
        </div>
      </GlassCard>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 13.5, color: theme.t2, fontWeight: 600 }}>{L('Скан документа', 'Document scan')}</span>
      </div>
      <SolidCard pad={0} style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        backgroundImage: `repeating-linear-gradient(45deg, ${theme.hairline} 0 10px, transparent 10px 20px)` }}>
        <div style={{ textAlign: 'center', color: theme.t3 }}>
          <Icon name="document-outline" size={32} color={theme.t3} />
          <div style={{ fontSize: 12, marginTop: 6, fontFamily: 'monospace' }}>scan_2026-06-14.pdf</div>
        </div>
      </SolidCard>
    </OverlayShell>
  );
}

function AppointmentsOverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const [tab, setTab] = useState('upcoming');
  const status = {
    confirmed: { c: theme.ok, ru: 'Подтверждена', en: 'Confirmed' },
    requested: { c: theme.warn, ru: 'Заявка', en: 'Requested' },
    completed: { c: theme.t3, ru: 'Завершена', en: 'Completed' },
  };
  const upcoming = [
    { st: 'confirmed', titleRu: 'Контрольный осмотр', titleEn: 'Follow-up check-up', clinicRu: 'Клиника «Айболит»', clinicEn: 'Aibolit Clinic', when: L('28 июн · 14:30', 'Jun 28 · 2:30pm') },
    { st: 'requested', titleRu: 'Чистка зубов', titleEn: 'Dental cleaning', clinicRu: 'ВетСити', clinicEn: 'VetCity', when: L('5 июл · 11:00', 'Jul 5 · 11:00am') },
  ];
  const past = [
    { st: 'completed', titleRu: 'Визит — дерматит', titleEn: 'Visit — dermatitis', clinicRu: 'Клиника «Айболит»', clinicEn: 'Aibolit Clinic', when: L('14 июн', 'Jun 14') },
    { st: 'completed', titleRu: 'Анализ крови', titleEn: 'Blood test', clinicRu: 'Клиника «Айболит»', clinicEn: 'Aibolit Clinic', when: L('2 июн', 'Jun 2') },
  ];
  const list = tab === 'upcoming' ? upcoming : past;
  return (
    <OverlayShell titleRu="Мои записи" titleEn="Appointments" onBack={onBack}>
      <div style={{ marginBottom: 16 }}>
        <Segmented value={tab} onChange={setTab} options={[
          { k: 'upcoming', label: L('Предстоящие', 'Upcoming') },
          { k: 'past', label: L('Прошедшие', 'Past') },
        ]} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {list.map((a, i) => {
          const s = status[a.st];
          return (
            <SolidCard key={i} pad={15}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: theme.t1 }}>{L(a.titleRu, a.titleEn)}</span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: s.c, background: `${s.c}1f`, padding: '4px 10px', borderRadius: RADII.pill }}>{L(s.ru, s.en)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: theme.t2, marginBottom: 3 }}>
                <Icon name="business-outline" size={15} color={theme.t3} /><span style={{ fontSize: 13 }}>{L(a.clinicRu, a.clinicEn)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: theme.t2 }}>
                <Icon name="time-outline" size={15} color={theme.t3} /><span style={{ fontSize: 13 }}>{a.when}</span>
              </div>
            </SolidCard>
          );
        })}
      </div>
      <Btn full icon="add" style={{ marginTop: 16 }}>{L('Создать запись', 'New appointment')}</Btn>
    </OverlayShell>
  );
}

function AddPetOverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const species = [
    { ic: '🐶', ru: 'Собака', en: 'Dog', on: true }, { ic: '🐱', ru: 'Кошка', en: 'Cat' },
    { ic: '🐰', ru: 'Кролик', en: 'Rabbit' }, { ic: '🐦', ru: 'Птица', en: 'Bird' },
  ];
  const Field = ({ labelRu, labelEn, placeRu, placeEn, value }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.t2, marginBottom: 7 }}>{L(labelRu, labelEn)}</div>
      <input defaultValue={value} placeholder={L(placeRu, placeEn)} style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${theme.hairline}`, background: theme.surface,
        borderRadius: RADII.pill, padding: '13px 18px', fontFamily: 'inherit', fontSize: 15, color: theme.t1, outline: 'none' }} />
    </div>
  );
  return (
    <OverlayShell titleRu="Добавить питомца" titleEn="Add pet" onBack={onBack}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, background: theme.accentTint, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: 'pointer' }}>
          <Icon name="camera-outline" size={26} color={theme.accent} />
          <span style={{ fontSize: 11, color: theme.accentPress, fontWeight: 700 }}>{L('Фото', 'Photo')}</span>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.t2, marginBottom: 9 }}>{L('Вид', 'Species')}</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {species.map(s => (
          <div key={s.en} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '12px 4px', borderRadius: RADII.md,
            background: s.on ? theme.accentTint : theme.surface, border: `1.5px solid ${s.on ? theme.accent : theme.hairline}`, cursor: 'pointer' }}>
            <span style={{ fontSize: 24 }}>{s.ic}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: s.on ? theme.accentPress : theme.t2 }}>{L(s.ru, s.en)}</span>
          </div>
        ))}
      </div>
      <Field labelRu="Имя" labelEn="Name" placeRu="напр. Барсик, Луна, Макс" placeEn="e.g. Luna, Max" />
      <Field labelRu="Порода" labelEn="Breed" placeRu="напр. Лабрадор" placeEn="e.g. Labrador" />
      <Field labelRu="Дата рождения" labelEn="Birth date" placeRu="12.03.2023" placeEn="03/12/2023" />
      <Btn full icon="paw" style={{ marginTop: 6 }}>{L('Сохранить питомца', 'Save pet')}</Btn>
    </OverlayShell>
  );
}

function OCROverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const fields = [
    { labelRu: 'Тип записи', labelEn: 'Record type', valRu: 'Вакцинация', valEn: 'Vaccination', conf: true },
    { labelRu: 'Вакцина', labelEn: 'Vaccine', valRu: 'Нобивак Rabies', valEn: 'Nobivac Rabies', conf: true },
    { labelRu: 'Дата введения', labelEn: 'Date given', valRu: '12.06.2026', valEn: '06/12/2026', conf: true },
    { labelRu: 'Следующая', labelEn: 'Next due', valRu: '12.08.2026', valEn: '08/12/2026', low: true },
  ];
  return (
    <OverlayShell titleRu="Проверка скана" titleEn="Scan review" onBack={onBack}>
      <SolidCard pad={0} style={{ height: 150, marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        backgroundImage: `repeating-linear-gradient(45deg, ${theme.hairline} 0 10px, transparent 10px 20px)` }}>
        <div style={{ textAlign: 'center', color: theme.t3 }}>
          <Icon name="image-outline" size={30} color={theme.t3} />
          <div style={{ fontSize: 12, marginTop: 6, fontFamily: 'monospace' }}>vet_doc.jpg</div>
        </div>
      </SolidCard>
      <p style={{ fontSize: 13, color: theme.t2, marginBottom: 14, lineHeight: 1.45 }}>
        {L('ИИ распознал документ. Проверьте подсвеченные поля с низкой уверенностью.', 'AI recognised the document. Review the highlighted low-confidence fields.')}
      </p>
      {fields.map((f, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.t2, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {L(f.labelRu, f.labelEn)}{f.low && <span style={{ fontSize: 11, color: theme.warn, fontWeight: 700 }}>· {L('проверьте', 'check')}</span>}
          </div>
          <div style={{ border: `1.5px solid ${f.low ? theme.warn : theme.hairline}`, background: f.low ? `${theme.warn}10` : theme.surface,
            borderRadius: RADII.pill, padding: '12px 18px', fontSize: 15, fontWeight: 700, color: theme.t1 }}>{L(f.valRu, f.valEn)}</div>
        </div>
      ))}
      <Btn full icon="checkmark-circle" style={{ marginTop: 8 }} onClick={onBack}>{L('Подтвердить и сохранить', 'Confirm & save')}</Btn>
    </OverlayShell>
  );
}

function PetDetailOverlay({ pet, onBack, go }) {
  const { theme } = useTheme();
  const L = useL();
  return (
    <OverlayShell titleRu={pet.name} titleEn={pet.name} onBack={onBack} action={<Icon name="ellipsis-horizontal" size={22} color={theme.accent} style={{ paddingRight: 8 }} />}>
      <PassportView pet={pet} go={go} />
    </OverlayShell>
  );
}

// ─── Помощь приютам (Charity Store) ───────────────────────────
function CharityStoreOverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const shelters = [
    { ru: 'Приют «Тёплый дом»', en: 'Warm Home Shelter', votes: 142, pct: 46 },
    { ru: 'Фонд «Лапа в лапу»', en: 'Paw-in-Paw Fund', votes: 98, pct: 32 },
    { ru: 'Приют «Верный друг»', en: 'Loyal Friend Shelter', votes: 67, pct: 22 },
  ];
  return (
    <OverlayShell titleRu="Помощь приютам" titleEn="Support shelters" onBack={onBack}>
      <GlassCard variant="decor" glow pad={20} style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: `${theme.danger}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Icon name="heart" size={28} color={theme.danger} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: theme.t1 }}>{L('Ваш баланс — 1 240 🐾', 'Your balance — 1,240 🐾')}</div>
        <p style={{ fontSize: 13, color: theme.t2, lineHeight: 1.5, marginTop: 8, marginBottom: 0 }}>
          {L('Ваши Paws — это голоса. В конце периода благотворительный пул делится между приютами пропорционально голосам.',
             'Your Paws are votes. At the end of the period the charity pool is split between shelters in proportion to votes.')}
        </p>
      </GlassCard>

      <SolidCard pad={18} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 13, color: theme.t2, fontWeight: 600 }}>{L('Пул июня собрано', 'June pool raised')}</span>
          <span style={{ fontSize: 13, color: theme.t1, fontWeight: 800 }}>61 400 ₽ / 100 000 ₽</span>
        </div>
        <ProgressBar value={614} max={1000} height={12} color={theme.danger} />
      </SolidCard>

      <SectionTitle>{L('Выберите приют', 'Choose a shelter')}</SectionTitle>
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
      <Btn full icon="heart">{L('Отдать голос приюту', 'Cast a vote')}</Btn>
    </OverlayShell>
  );
}

// ─── Как заработать Paws ───────────────────────────────────────
function HowToEarnPawsOverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const rows = [
    { ic: 'medkit-outline', ru: 'Подтверждённый визит', en: 'Verified visit', pts: '+100', capRu: 'до 100 в день', capEn: 'up to 100/day' },
    { ic: 'shield-checkmark-outline', ru: 'Подтверждённая вакцинация', en: 'Verified vaccination', pts: '+80' },
    { ic: 'checkmark-done-outline', ru: 'Выполненное напоминание', en: 'Completed reminder', pts: '+20' },
    { ic: 'medical-outline', ru: 'Завершённый курс лекарств', en: 'Completed course', pts: '+60' },
    { ic: 'scan-outline', ru: 'Скан документа', en: 'Document scan', pts: '+40' },
    { ic: 'sunny-outline', ru: 'Ежедневный чек-ин', en: 'Daily check-in', pts: '+10' },
    { ic: 'flame-outline', ru: 'Серия ухода 7 дней', en: '7-day care streak', pts: '+50' },
  ];
  return (
    <OverlayShell titleRu="Как заработать Paws" titleEn="How to earn Paws" onBack={onBack}>
      <GlassCard variant="decor" pad={18} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: theme.accentTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22 }}>🐾</span>
          </div>
          <p style={{ flex: 1, fontSize: 13, color: theme.t2, lineHeight: 1.45, margin: 0 }}>
            {L('Зарабатывайте Paws, заботясь о здоровье питомца. Paws становятся голосами и направляют месячный благотворительный пул приютам.',
               'Earn Paws by caring for your pet. Paws become votes that direct the monthly charity pool to shelters.')}
          </p>
        </div>
      </GlassCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {rows.map((r, i) => (
          <SolidCard key={i} pad={13} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <IconChip name={r.ic} dim={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.t1 }}>{L(r.ru, r.en)}</div>
              {r.capRu && <div style={{ fontSize: 11.5, color: theme.t3, marginTop: 1 }}>{L(r.capRu, r.capEn)}</div>}
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, color: theme.accentPress }}>{r.pts}</span>
          </SolidCard>
        ))}
      </div>
    </OverlayShell>
  );
}

// ─── Документы (Vault) ─────────────────────────────────────────
function DocumentsOverlay({ onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const docs = [
    { ru: 'Вакцинация · Бешенство', en: 'Vaccination · Rabies', file: 'rabies_2026.pdf', d: '12 июн' },
    { ru: 'Анализ крови', en: 'Blood test', file: 'blood_0602.jpg', d: '2 июн' },
    { ru: 'Визит — дерматит', en: 'Visit — dermatitis', file: 'visit_0614.pdf', d: '14 июн' },
    { ru: 'Обработка от клещей', en: 'Tick treatment', file: 'bravecto.jpg', d: '5 май' },
  ];
  return (
    <OverlayShell titleRu="Документы" titleEn="Documents" onBack={onBack} action={<Icon name="scan-outline" size={22} color={theme.accent} style={{ paddingRight: 8 }} />}>
      <p style={{ fontSize: 13, color: theme.t2, marginBottom: 14 }}>{L('Все сканы и PDF питомца. Тап — к привязанной записи.', 'All scans & PDFs. Tap to open the linked record.')}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {docs.map((doc, i) => (
          <SolidCard key={i} pad={10}>
            <div style={{ height: 110, borderRadius: RADII.md, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10,
              backgroundImage: `repeating-linear-gradient(45deg, ${theme.hairline} 0 9px, transparent 9px 18px)` }}>
              <Icon name={doc.file.endsWith('pdf') ? 'document-text-outline' : 'image-outline'} size={28} color={theme.t3} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: theme.t1, lineHeight: 1.3 }}>{L(doc.ru, doc.en)}</div>
            <div style={{ fontSize: 11, color: theme.t3, marginTop: 3, fontFamily: 'monospace' }}>{doc.file}</div>
          </SolidCard>
        ))}
      </div>
    </OverlayShell>
  );
}

// ─── Добавить запись (bottom-sheet chooser) ───────────────────
function AddRecordSheet({ onBack, go }) {
  const { theme } = useTheme();
  const L = useL();
  const opts = [
    { ic: 'shield-checkmark-outline', type: 'vaccine', ru: 'Вакцина', en: 'Vaccine', subRu: 'прививка и срок ревакцинации', subEn: 'shot & next-due date' },
    { ic: 'medical-outline', type: 'prescription', ru: 'Лекарство', en: 'Medication', subRu: 'курс, доза, частота', subEn: 'course, dose, frequency' },
    { ic: 'medkit-outline', type: 'record', ru: 'Запись о визите', en: 'Visit record', subRu: 'диагноз, врач, рекомендации', subEn: 'diagnosis, vet, recommendations' },
    { ic: 'bandage-outline', type: 'reminder', ru: 'Процедура / обработка', en: 'Procedure', subRu: 'паразиты, груминг и др.', subEn: 'parasites, grooming, etc.' },
    { ic: 'scan-outline', type: 'vaccine', ru: 'Сканировать документ', en: 'Scan document', subRu: 'распознать ИИ и заполнить', subEn: 'AI recognise & prefill', scan: true },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onBack} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'relative', background: theme.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '10px 16px calc(20px + env(safe-area-inset-bottom))', boxShadow: theme.shadow3 }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: theme.hairline, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, fontWeight: 900, color: theme.t1, marginBottom: 14, paddingLeft: 4 }}>{L('Добавить запись', 'Add a record')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {opts.map((o, i) => (
            <button key={i} onClick={() => { onBack(); if (o.scan) go('ocr'); }} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 12px',
              borderRadius: RADII.md, background: o.scan ? theme.accentTint : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
              <IconChip name={o.ic} dim={42} bg={o.scan ? undefined : `${theme.eventTypes[o.type]}1f`} color={o.scan ? undefined : theme.eventTypes[o.type]} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1 }}>{L(o.ru, o.en)}</div>
                <div style={{ fontSize: 12, color: theme.t2, marginTop: 1 }}>{L(o.subRu, o.subEn)}</div>
              </div>
              <Icon name="chevron-forward" size={18} color={theme.t4} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NotificationsOverlay, RecordDetailOverlay, AppointmentsOverlay, AddPetOverlay, OCROverlay, PetDetailOverlay, OverlayShell, CharityStoreOverlay, HowToEarnPawsOverlay, DocumentsOverlay, AddRecordSheet });
