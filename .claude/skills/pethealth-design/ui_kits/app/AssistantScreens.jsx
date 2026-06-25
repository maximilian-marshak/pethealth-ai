// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — AI Assistant hub + chat.
// Categorical assistantCategories palette drives tiles & chat header.
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  { id: 'health', title: 'Health & Wellness', icon: 'medical', color: 'var(--cat-health)', q: 'What are signs of illness in dogs?' },
  { id: 'nutrition', title: 'Nutrition & Diet', icon: 'restaurant', color: 'var(--cat-nutrition)', q: 'Foods toxic to pets' },
  { id: 'behavior', title: 'Behavior & Training', icon: 'school', color: 'var(--cat-behavior)', q: 'How to stop excessive barking?' },
  { id: 'grooming', title: 'Grooming & Care', icon: 'cut', color: 'var(--cat-grooming)', q: 'How often to bathe my dog?' },
  { id: 'emergency', title: 'Emergency Guide', icon: 'alert-circle', color: 'var(--cat-emergency)', q: 'Signs of poisoning' },
  { id: 'relocation', title: 'Relocation & Travel', icon: 'airplane', color: 'var(--cat-relocation)', q: 'Documents to fly with my dog?' },
];

function AssistantHubScreen({ onOpenChat }) {
  const { GlassCard } = window.PetHealthAIDesignSystem_fd90ba;
  return (
    <ScreenBody style={{ padding: '4px 16px 24px' }}>
      <div style={{ padding: '6px 4px 16px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.4px' }}>AI Pet Assistant</div>
        <div style={{ fontSize: 14, color: 'var(--t2)', marginTop: 2 }}>Ask me anything about Mango's care</div>
      </div>

      {/* Free chat + photo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
        <button onClick={() => onOpenChat({ id: 'free-chat', title: 'AI Assistant', color: 'var(--accent)' })}
          style={tileBtn('var(--accent)')}>
          <div style={chipBox('var(--accent)')}><ion-icon name="chatbubbles" style={{ fontSize: 22, color: '#fff' }}></ion-icon></div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Start Free Chat</div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>Ask me anything about your pet</div>
          </div>
          <ion-icon name="chevron-forward" style={{ fontSize: 18, color: 'var(--t3)' }}></ion-icon>
        </button>
        <button style={tileBtn('var(--cat-general)')}>
          <div style={chipBox('var(--cat-general)')}><ion-icon name="camera" style={{ fontSize: 22, color: '#fff' }}></ion-icon></div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>Photo Analysis</div>
            <div style={{ fontSize: 12, color: 'var(--t2)' }}>Check symptoms or identify breed</div>
          </div>
          <ion-icon name="chevron-forward" style={{ fontSize: 18, color: 'var(--t3)' }}></ion-icon>
        </button>
      </div>

      {/* Browse by category */}
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', margin: '0 4px 12px' }}>Browse by Category</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => onOpenChat(c)} style={{
            background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 18,
            padding: 14, cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-1)',
            display: 'flex', flexDirection: 'column', gap: 10, minHeight: 108,
          }}>
            <div style={chipBox(c.color)}><ion-icon name={c.icon} style={{ fontSize: 20, color: '#fff' }}></ion-icon></div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.25 }}>{c.title}</div>
          </button>
        ))}
      </div>
    </ScreenBody>
  );
}

function tileBtn(color) {
  return {
    display: 'flex', alignItems: 'center', gap: 12, padding: 14, cursor: 'pointer',
    background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 18,
    boxShadow: 'var(--shadow-1)', width: '100%', fontFamily: 'var(--font-sans)',
  };
}
function chipBox(color) {
  return {
    width: 44, height: 44, borderRadius: 14, background: color, flex: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

// ─── Chat ────────────────────────────────────────────────────
function ChatScreen({ category, onBack }) {
  const { Input } = window.PetHealthAIDesignSystem_fd90ba;
  const color = category.color || 'var(--accent)';
  const seed = category.id === 'free-chat'
    ? []
    : [
        { from: 'user', text: category.q },
        { from: 'bot', text: botReply(category.id) },
      ];
  const [msgs, setMsgs] = React.useState(seed);
  const [draft, setDraft] = React.useState('');
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = (text) => {
    const t = (text != null ? text : draft).trim();
    if (!t) return;
    setDraft('');
    setMsgs((m) => [...m, { from: 'user', text: t }]);
    setTimeout(() => setMsgs((m) => [...m, { from: 'bot', text: botReply(category.id) }]), 450);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 12px',
        background: color, color: '#fff', flex: 'none',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <ion-icon name="chevron-back" style={{ fontSize: 24, color: '#fff' }}></ion-icon>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{category.title}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Mango • Golden Retriever • 4 yrs</div>
        </div>
        <ion-icon name="ellipsis-horizontal" style={{ fontSize: 22, color: '#fff' }}></ion-icon>
      </div>

      {/* messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 30, padding: '0 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✨</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>Mango's AI Assistant</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 18 }}>
              Hi! I'm your AI assistant for Mango. How can I help you today?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['What vaccinations does my pet need?', 'How often should I feed my pet?', 'Signs of illness in pets?'].map((q) => (
                <button key={q} onClick={() => send(q)} style={{
                  padding: '10px 14px', borderRadius: 14, border: '1px solid var(--hairline)',
                  background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: 'var(--t2)', fontFamily: 'var(--font-sans)', textAlign: 'left',
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={m.from === 'user' ? {
              maxWidth: '80%', padding: '10px 14px', borderRadius: '18px 18px 4px 18px',
              background: 'var(--accent-press)', color: '#fff', fontSize: 14, lineHeight: 1.45,
            } : {
              maxWidth: '82%', padding: '11px 14px', borderRadius: '18px 18px 18px 4px',
              background: 'var(--glass-data-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--hairline)', color: 'var(--t1)', fontSize: 14, lineHeight: 1.5,
              boxShadow: 'var(--glow-accent)',
            }}>{m.text}</div>
          </div>
        ))}
      </div>

      {/* input */}
      <div style={{ flex: 'none', padding: '10px 14px 26px', display: 'flex', gap: 8, alignItems: 'center',
        background: 'var(--glass-decor-bg)', backdropFilter: 'blur(34px)', WebkitBackdropFilter: 'blur(34px)',
        borderTop: '1px solid var(--glass-decor-border)' }}>
        <div style={{ flex: 1 }}>
          <Input pill icon="paw-outline" placeholder="Ask me anything about pet care…"
            value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        </div>
        <button onClick={() => send()} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', flex: 'none',
          background: 'var(--accent-press)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><ion-icon name="arrow-up" style={{ fontSize: 22, color: '#fff' }}></ion-icon></button>
      </div>
    </div>
  );
}

function botReply(id) {
  const map = {
    health: "Watch for changes in appetite, energy or bathroom habits. Repeated vomiting, lethargy or refusing food for over a day warrants a vet visit. This is general guidance, not a diagnosis.",
    nutrition: "Keep treats to ~10% of daily calories and avoid chocolate, grapes, onions, garlic and xylitol — all toxic to dogs. Introduce diet changes gradually over 5–7 days.",
    behavior: "Reward the behaviour you want and avoid punishment. Dogs thrive on routine and exercise; for persistent barking, identify the trigger and redirect with positive reinforcement.",
    grooming: "Bathe only as needed with a pet-safe shampoo — over-bathing dries the skin. Brush regularly to reduce shedding and catch skin issues early.",
    emergency: "Signs of poisoning include drooling, vomiting, tremors or collapse. Call a vet or poison line immediately and don't give any human medicine unless instructed.",
    relocation: "You'll typically need a vet passport, an ISO microchip, a valid rabies vaccine (often 21+ days before travel) and possibly a titre test. Always verify the destination's current import rules.",
    'free-chat': "Happy to help! Tell me a bit more about Mango and what you'd like to know — health, nutrition, behaviour or travel.",
  };
  return map[id] || map['free-chat'];
}

Object.assign(window, { AssistantHubScreen, ChatScreen });
