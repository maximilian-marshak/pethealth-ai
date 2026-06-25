// ══════════════════════════════════════════════════════════════
// screens-assistant.jsx — Ассистент: AI Hub + Chat (glass bubbles + widget)
// ══════════════════════════════════════════════════════════════

function AssistantHub({ pet, onOpenChat, go }) {
  const { theme } = useTheme();
  const L = useL();
  const cats = [
    { k: 'health', ic: 'pulse-outline', ru: 'Здоровье', en: 'Health' },
    { k: 'nutrition', ic: 'nutrition-outline', ru: 'Питание', en: 'Nutrition' },
    { k: 'behavior', ic: 'paw-outline', ru: 'Поведение', en: 'Behavior' },
    { k: 'grooming', ic: 'cut-outline', ru: 'Груминг', en: 'Grooming' },
    { k: 'emergency', ic: 'alert-circle-outline', ru: 'Экстренно', en: 'Emergency' },
    { k: 'relocation', ic: 'airplane-outline', ru: 'Переезд', en: 'Relocation' },
  ];
  const popular = [
    L('Признаки болезни у собак', 'Signs of illness in dogs'),
    L('Сколько кормить питомца?', 'How much to feed my pet?'),
    L('Какие прививки нужны?', 'Which vaccines are needed?'),
  ];
  return (
    <ScreenBody>
      <div style={{ paddingTop: 8 }}>
        <ScreenHeader titleRu="ИИ Помощник" titleEn="AI Assistant" go={go} />

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: theme.surface, border: `1px solid ${theme.hairline}`,
          borderRadius: RADII.pill, padding: '13px 18px', boxShadow: theme.shadow1, marginBottom: 16 }}>
          <Icon name="search-outline" size={19} color={theme.t3} />
          <input placeholder={L('Поиск по базе знаний…', 'Search the knowledge base…')}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 15, color: theme.t1 }} />
        </div>

        {/* Two hero actions */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <GlassCard variant="decor" glow pad={16} onClick={onOpenChat} style={{ flex: 1 }}>
            <IconChip name="chatbubble-ellipses" dim={44} />
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.t1, marginTop: 12 }}>{L('Свободный чат', 'Free chat')}</div>
            <div style={{ fontSize: 12, color: theme.t2, marginTop: 2, lineHeight: 1.35 }}>{L('Спросите что угодно о питомце', 'Ask anything about your pet')}</div>
          </GlassCard>
          <GlassCard variant="decor" pad={16} onClick={onOpenChat} style={{ flex: 1 }}>
            <IconChip name="camera" dim={44} bg={`${theme.cat.emergency}1f`} color={theme.cat.emergency} />
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.t1, marginTop: 12 }}>{L('Анализ фото', 'Photo analysis')}</div>
            <div style={{ fontSize: 12, color: theme.t2, marginTop: 2, lineHeight: 1.35 }}>{L('Симптомы или порода', 'Symptoms or breed')}</div>
          </GlassCard>
        </div>

        <SectionTitle>{L('Категории', 'Categories')}</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {cats.map(c => (
            <SolidCard key={c.k} pad={14} onClick={onOpenChat} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <IconChip name={c.ic} dim={46} size={23} bg={`${theme.cat[c.k]}1f`} color={theme.cat[c.k]} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: theme.t1, textAlign: 'center' }}>{L(c.ru, c.en)}</span>
            </SolidCard>
          ))}
        </div>

        <SectionTitle>{L('Справочник', 'Reference')}</SectionTitle>
        <SolidCard pad={14} onClick={() => go('knowledge')} style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 10 }}>
          <IconChip name="library-outline" dim={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1 }}>{L('База знаний', 'Knowledge base')}</div>
            <div style={{ fontSize: 12.5, color: theme.t2 }}>{L('Статьи по уходу и здоровью', 'Care & health articles')}</div>
          </div>
          <Icon name="chevron-forward" size={18} color={theme.t4} />
        </SolidCard>
        <SolidCard pad={14} onClick={() => go('relocation')} style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 20 }}>
          <IconChip name="airplane-outline" dim={42} bg={`${theme.cat.relocation}1f`} color={theme.cat.relocation} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: theme.t1 }}>{L('Переезд с питомцем', 'Relocation')}</div>
            <div style={{ fontSize: 12.5, color: theme.t2 }}>{L('Чеклист переезда', 'Relocation checklist')}</div>
          </div>
          <Icon name="chevron-forward" size={18} color={theme.t4} />
        </SolidCard>

        <SectionTitle>{L('Популярные вопросы', 'Popular questions')}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {popular.map((q, i) => (
            <SolidCard key={i} pad={13} onClick={onOpenChat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="help-circle-outline" size={19} color={theme.accent} />
              <span style={{ flex: 1, fontSize: 14, color: theme.t1, fontWeight: 600 }}>{q}</span>
              <Icon name="arrow-forward" size={16} color={theme.t4} />
            </SolidCard>
          ))}
        </div>
      </div>
    </ScreenBody>
  );
}

// ─── Health timeline widget (embedded in chat, per spec §6.2) ──
function HealthTimelineWidget() {
  const { theme } = useTheme();
  const L = useL();
  const nodes = [
    { ru: 'Бешенство', en: 'Rabies', when: L('12 июн', 'Jun 12'), past: true },
    { ru: 'Apoquel — конец курса', en: 'Apoquel — course end', when: L('24 июн', 'Jun 24'), past: false },
    { ru: 'Контрольный осмотр', en: 'Follow-up', when: L('28 июн', 'Jun 28'), past: false },
  ];
  return (
    <SolidCard pad={14} style={{ marginTop: 4, marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <Icon name="git-commit-outline" size={17} color={theme.accent} />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.t1 }}>{L('Хронология здоровья', 'Health timeline')}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 11 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ width: 11, height: 11, borderRadius: 6, background: n.past ? theme.t3 : theme.accent, border: `2px solid ${theme.surface}`, boxShadow: n.past ? 'none' : `0 0 0 2px ${theme.accent}` }} />
              {i < nodes.length - 1 && <div style={{ width: 2, flex: 1, background: theme.hairline, minHeight: 16 }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: i < nodes.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.t1 }}>{L(n.ru, n.en)}</div>
              <div style={{ fontSize: 11.5, color: theme.t3 }}>{n.when}</div>
            </div>
          </div>
        ))}
      </div>
    </SolidCard>
  );
}

function Bubble({ from, children, glow }) {
  const { theme } = useTheme();
  const isUser = from === 'user';
  if (isUser) {
    return (
      <div style={{ alignSelf: 'flex-end', maxWidth: '82%', background: theme.accentPress, color: theme.onAccent,
        padding: '11px 15px', borderRadius: 20, borderBottomRightRadius: 6, fontSize: 14.5, lineHeight: 1.45 }}>{children}</div>
    );
  }
  const g = theme.glassData;
  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '88%', background: g.bg, WebkitBackdropFilter: `blur(${g.blur}px)`, backdropFilter: `blur(${g.blur}px)`,
      border: `1px solid ${g.border}`, color: theme.t1, padding: '12px 15px', borderRadius: 20, borderBottomLeftRadius: 6,
      fontSize: 14.5, lineHeight: 1.5, boxShadow: glow ? `0 0 24px rgba(${theme.accentRgb},0.28)` : theme.shadow1 }}>{children}</div>
  );
}

function ChatScreen({ pet, onBack }) {
  const { theme } = useTheme();
  const L = useL();
  const g = theme.glassDecor;
  const quick = [L('Чем кормить?', 'What to feed?'), L('Признаки аллергии', 'Allergy signs'), L('График прививок', 'Vaccine schedule')];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header (glass) */}
      <div style={{ padding: '6px 16px 12px', background: g.bg, WebkitBackdropFilter: `blur(${g.blur}px)`, backdropFilter: `blur(${g.blur}px)`,
        borderBottom: `1px solid ${g.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Icon name="chevron-back" size={26} color={theme.accent} style={{ cursor: 'pointer' }} onClick={onBack} />
        <div style={{ position: 'relative' }}>
          <div style={{ width: 42, height: 42, borderRadius: 21, background: theme.accentTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={21} color={theme.accent} />
          </div>
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, background: theme.ok, border: `2px solid ${theme.bgBase}` }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: theme.t1 }}>BuddyAI</div>
          <div style={{ fontSize: 12, color: theme.ok, fontWeight: 600 }}>{L(`онлайн · ${pet.name}`, `online · ${pet.name}`)}</div>
        </div>
        <Icon name="ellipsis-horizontal" size={22} color={theme.t3} style={{ cursor: 'pointer' }} />
      </div>

      {/* Messages */}
      <div className="screen-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', fontSize: 11.5, color: theme.t3, fontWeight: 600 }}>{L('Сегодня', 'Today')}</div>
        <Bubble from="bot" glow>{L('Привет! Я помощник по уходу за Луной. Чем могу помочь? 🐾', 'Hi! I’m Luna’s care assistant. How can I help? 🐾')}</Bubble>
        <Bubble from="user">{L('У Луны чешется кожа последние дни', 'Luna has been scratching her skin lately')}</Bubble>
        <Bubble from="bot">{L('Учитывая атопический дерматит и курс Apoquel, это может быть обострение. Вот ближайшие события по здоровью:', 'Given her atopic dermatitis and Apoquel course, this may be a flare-up. Here are her upcoming health events:')}</Bubble>
        <div style={{ alignSelf: 'flex-start', width: '88%' }}><HealthTimelineWidget /></div>
        <Bubble from="bot">{L('Рекомендую не пропускать вечернюю дозу и показать ветеринару на осмотре 28 июня. Это не замена очной консультации.', 'I’d keep the evening dose and mention it at the Jun 28 check-up. This isn’t a substitute for an in-person visit.')}</Bubble>
      </div>

      {/* Quick replies */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 10px', overflowX: 'auto', flexShrink: 0 }} className="hscroll">
        {quick.map((q, i) => (
          <button key={i} style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: RADII.pill, background: theme.accentTint,
            color: theme.accentPress, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{q}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 16px calc(14px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        background: g.bg, WebkitBackdropFilter: `blur(${g.blur}px)`, backdropFilter: `blur(${g.blur}px)`, borderTop: `1px solid ${g.border}` }}>
        <Icon name="add-circle-outline" size={28} color={theme.accent} style={{ cursor: 'pointer' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: theme.surface, border: `1px solid ${theme.hairline}`, borderRadius: RADII.pill, padding: '11px 16px' }}>
          <input placeholder={L('Сообщение…', 'Message…')} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14.5, color: theme.t1 }} />
        </div>
        <button style={{ width: 44, height: 44, borderRadius: 22, background: theme.accentPress, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="send" size={19} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function AssistantScreen({ pet, go }) {
  const [chat, setChat] = useState(false);
  if (chat) return <ChatScreen pet={pet} onBack={() => setChat(false)} />;
  return <AssistantHub pet={pet} onOpenChat={() => setChat(true)} go={go} />;
}

Object.assign(window, { AssistantScreen });
