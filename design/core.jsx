// ══════════════════════════════════════════════════════════════
// core.jsx — PetHealthAI prototype foundation
// Tokens mirror src/theme/theme.js (mint glassmorphism, light+dark).
// Provides: ThemeProvider/useTheme, LangProvider/useL, primitives,
// PhoneFrame, TabBar, Icon. Exported to window for sibling scripts.
// ══════════════════════════════════════════════════════════════
const { useState, useEffect, useMemo, useRef, useContext, createContext, createElement } = React;

// ─── Radii / shadows (spec) ───────────────────────────────────
const RADII = { sm: 12, md: 16, lg: 24, xl: 28, pill: 999 };
const SEMANTIC = { ok: '#2EA567', warn: '#E8A93C', danger: '#E2574C' };

const ACCENT_PRESETS = {
  mint:  { light: { accent: '#56B89F', accentPress: '#3E9C84', accentTint: '#E0F2EC' },
           dark:  { accent: '#6FCBB2', accentPress: '#56B89F', accentTint: 'rgba(86,184,159,0.18)' } },
  peach: { light: { accent: '#EC8C69', accentPress: '#D2734F', accentTint: '#FBE6DC' },
           dark:  { accent: '#F2A07B', accentPress: '#DB8763', accentTint: 'rgba(242,160,123,0.18)' } },
  blue:  { light: { accent: '#4F8DF0', accentPress: '#3A74D1', accentTint: '#E2ECFC' },
           dark:  { accent: '#6BA1F5', accentPress: '#5587DC', accentTint: 'rgba(107,161,245,0.18)' } },
};

const LIGHT = {
  scheme: 'light', ...SEMANTIC,
  bgBase: '#FBFEFD',
  blobs: [
    { c: '86,184,159', cx: 16, cy: 10, r: 72, o: 0.26 },
    { c: '236,140,105', cx: 92, cy: 4, r: 55, o: 0.18 },
    { c: '79,141,240', cx: 50, cy: 96, r: 66, o: 0.16 },
  ],
  surface: '#FFFFFF',
  glassDecor: { bg: 'rgba(255,255,255,0.34)', blur: 22, border: 'rgba(255,255,255,0.7)' },
  glassData:  { bg: 'rgba(255,255,255,0.66)', blur: 16, border: 'rgba(0,0,0,0.06)' },
  hairline: 'rgba(0,0,0,0.07)',
  t1: '#1A1A2E', t2: '#4A4A5C', t3: '#8A8A99', t4: '#B5B5C0', onAccent: '#FFFFFF',
  eventTypes: { record: '#7B6EF0', prescription: '#4F8DF0', vaccine: '#2BB6A8', reminder: '#E0A23E', appointment: '#E06C9C' },
  cat: { health: '#2FAFB5', nutrition: '#6BB24F', behavior: '#E0A23E', grooming: '#E07BA8', emergency: '#E8654E', relocation: '#4F8DF0', general: '#8C7FD0' },
  shadow1: '0 2px 8px rgba(11,31,26,0.05)',
  shadow2: '0 10px 28px rgba(11,31,26,0.10)',
  shadow3: '0 18px 44px rgba(11,31,26,0.14)',
};
const DARK = {
  scheme: 'dark', ...SEMANTIC,
  bgBase: '#0F1117',
  blobs: [
    { c: '111,203,178', cx: 16, cy: 10, r: 72, o: 0.16 },
    { c: '242,160,123', cx: 92, cy: 4, r: 55, o: 0.11 },
    { c: '107,161,245', cx: 50, cy: 96, r: 66, o: 0.12 },
  ],
  surface: '#1E1E28',
  glassDecor: { bg: 'rgba(40,44,58,0.42)', blur: 22, border: 'rgba(255,255,255,0.14)' },
  glassData:  { bg: 'rgba(28,31,42,0.72)', blur: 16, border: 'rgba(255,255,255,0.08)' },
  hairline: 'rgba(255,255,255,0.09)',
  t1: '#F2F2F7', t2: '#B0B0BC', t3: '#8A8A99', t4: '#55555F', onAccent: '#FFFFFF',
  eventTypes: { record: '#9A8FF5', prescription: '#6BA1F5', vaccine: '#4FCFC0', reminder: '#ECB75C', appointment: '#EC88B2' },
  cat: { health: '#4FC9CE', nutrition: '#84C96B', behavior: '#ECB75C', grooming: '#EC93B8', emergency: '#F0826E', relocation: '#6BA1F5', general: '#A99CE6' },
  shadow1: '0 2px 8px rgba(0,0,0,0.35)',
  shadow2: '0 10px 28px rgba(0,0,0,0.45)',
  shadow3: '0 18px 44px rgba(0,0,0,0.55)',
};

function buildTheme(scheme, accentName) {
  const base = scheme === 'dark' ? DARK : LIGHT;
  const ac = (ACCENT_PRESETS[accentName] || ACCENT_PRESETS.mint)[scheme];
  const accentRgb = scheme === 'dark'
    ? { mint: '111,203,178', peach: '242,160,123', blue: '107,161,245' }[accentName]
    : { mint: '86,184,159', peach: '236,140,105', blue: '79,141,240' }[accentName];
  return { ...base, ...ac, accentRgb, radii: RADII };
}

function bgString(theme) {
  const layers = theme.blobs.map(b => `radial-gradient(circle at ${b.cx}% ${b.cy}%, rgba(${b.c},${b.o}), rgba(${b.c},0) ${b.r}%)`);
  return layers.join(',') + ',' + theme.bgBase;
}

// ─── Contexts ─────────────────────────────────────────────────
const ThemeCtx = createContext(null);
const LangCtx = createContext('ru');
const useTheme = () => useContext(ThemeCtx);
const useL = () => { const lang = useContext(LangCtx); return (ru, en) => (lang === 'ru' ? ru : en); };
const useLang = () => useContext(LangCtx);

// ─── Icon (fetch + inline ionicons SVG; recoloured via currentColor) ──
const _iconCache = {};
const _iconSubs = {};
const ICON_CDN = 'https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/svg/';
function Icon({ name, size = 22, color, style, onClick }) {
  const [, force] = useState(0);
  useEffect(() => {
    if (_iconCache[name]) return;
    fetch(ICON_CDN + name + '.svg').then(r => r.ok ? r.text() : '').then(txt => {
      _iconCache[name] = txt.replace('<svg ', `<svg width="100%" height="100%" `);
      (_iconSubs[name] || []).forEach(fn => fn());
    }).catch(() => {});
  }, [name]);
  useEffect(() => {
    const fn = () => force(x => x + 1);
    (_iconSubs[name] = _iconSubs[name] || []).push(fn);
    return () => { _iconSubs[name] = (_iconSubs[name] || []).filter(f => f !== fn); };
  }, [name]);
  const svg = _iconCache[name];
  return <span onClick={onClick} style={{ display: 'inline-flex', width: size, height: size, color: color || 'inherit',
    flexShrink: 0, lineHeight: 0, cursor: onClick ? 'pointer' : undefined, ...style }}
    dangerouslySetInnerHTML={{ __html: svg || '' }} />;
}

// ─── Primitives ───────────────────────────────────────────────
function GlassCard({ variant = 'data', glow = false, style, children, onClick, pad = 16 }) {
  const { theme } = useTheme();
  const g = variant === 'decor' ? theme.glassDecor : theme.glassData;
  const sh = glow ? `0 0 30px rgba(${theme.accentRgb},0.32)` : theme.shadow2;
  return (
    <div onClick={onClick} style={{
      background: g.bg, WebkitBackdropFilter: `blur(${g.blur}px) saturate(1.4)`, backdropFilter: `blur(${g.blur}px) saturate(1.4)`,
      border: `1px solid ${g.border}`, borderRadius: RADII.lg, boxShadow: sh, padding: pad,
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

function SolidCard({ style, children, onClick, pad = 16, radius = RADII.lg }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{
      background: theme.surface, border: `1px solid ${theme.hairline}`, borderRadius: radius,
      boxShadow: theme.shadow1, padding: pad, cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

function IconChip({ name, size = 22, bg, color, dim = 44, style }) {
  const { theme } = useTheme();
  return (
    <div style={{ width: dim, height: dim, borderRadius: dim / 2.4, background: bg || theme.accentTint,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...style }}>
      <Icon name={name} size={size} color={color || theme.accent} />
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', icon, style, full }) {
  const { theme } = useTheme();
  const base = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: RADII.pill, fontWeight: 700, fontSize: 15, padding: '13px 22px', border: 'none',
    cursor: 'pointer', width: full ? '100%' : 'auto', fontFamily: 'inherit', transition: 'transform .12s' };
  const variants = {
    primary: { background: theme.accentPress, color: theme.onAccent },
    tint: { background: theme.accentTint, color: theme.accentPress },
    ghost: { background: 'transparent', color: theme.accentPress },
    outline: { background: 'transparent', color: theme.t1, border: `1.5px solid ${theme.hairline}` },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
      {icon && <Icon name={icon} size={18} />}{children}
    </button>
  );
}

function Chip({ label, active, onClick, color }) {
  const { theme } = useTheme();
  const c = color || theme.accent;
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: RADII.pill, fontSize: 13, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'inherit', whiteSpace: 'nowrap',
      background: active ? c : theme.surface, color: active ? theme.onAccent : theme.t2,
      border: `1px solid ${active ? c : theme.hairline}`,
    }}>{label}</button>
  );
}

function Segmented({ options, value, onChange }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', background: theme.scheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.045)',
      borderRadius: RADII.pill, padding: 4, gap: 2 }}>
      {options.map(o => (
        <button key={o.k} onClick={() => onChange(o.k)} style={{
          flex: 1, padding: '8px 10px', borderRadius: RADII.pill, border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
          background: value === o.k ? theme.surface : 'transparent',
          color: value === o.k ? theme.t1 : theme.t3,
          boxShadow: value === o.k ? theme.shadow1 : 'none',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

function ProgressBar({ value, max = 100, height = 10, color, track }) {
  const { theme } = useTheme();
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ height, borderRadius: height, background: track || (theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), overflow: 'hidden' }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: height, background: color || theme.accent, transition: 'width .5s ease' }} />
    </div>
  );
}

// Circular progress ring (health score hero)
function Ring({ pct, size = 132, stroke = 12, color, children }) {
  const { theme } = useTheme();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={theme.scheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color || theme.accent} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  );
}

function StatusDot({ kind, size = 8 }) {
  const { theme } = useTheme();
  const c = kind === 'ok' ? theme.ok : kind === 'warn' ? theme.warn : kind === 'danger' ? theme.danger : theme.t3;
  return <span style={{ width: size, height: size, borderRadius: size, background: c, display: 'inline-block', flexShrink: 0 }} />;
}

function Avatar({ emoji, src, size = 52, ring }) {
  const { theme } = useTheme();
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: theme.accentTint,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
      border: ring ? `2px solid ${theme.accent}` : 'none' }}>
      {src ? <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: size * 0.5 }}>{emoji}</span>}
    </div>
  );
}

function SectionTitle({ children, action, onAction }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 2px 12px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: theme.t1, margin: 0, letterSpacing: '-0.01em' }}>{children}</h2>
      {action && <span onClick={onAction} style={{ fontSize: 13, fontWeight: 700, color: theme.accentPress, cursor: 'pointer' }}>{action}</span>}
    </div>
  );
}

// ─── Phone frame + status bar ─────────────────────────────────
function StatusBar() {
  const { theme } = useTheme();
  return (
    <div style={{ height: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 26px 8px', flexShrink: 0, color: theme.t1 }}>
      <span style={{ fontSize: 15, fontWeight: 700 }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="cellular" size={16} color={theme.t1} />
        <Icon name="wifi" size={16} color={theme.t1} />
        <Icon name="battery-full" size={18} color={theme.t1} />
      </div>
    </div>
  );
}

const TABS = [
  { k: 'home', ic: 'home', ico: 'home-outline', ru: 'Главная', en: 'Home' },
  { k: 'health', ic: 'pulse', ico: 'pulse-outline', ru: 'Здоровье', en: 'Health' },
  { k: 'assistant', ic: 'sparkles', ico: 'sparkles-outline', ru: 'Ассистент', en: 'Assistant' },
  { k: 'activity', ic: 'trophy', ico: 'trophy-outline', ru: 'Активность', en: 'Activity' },
  { k: 'profile', ic: 'person', ico: 'person-outline', ru: 'Профиль', en: 'Profile' },
];

function TabBar({ active, onChange }) {
  const { theme } = useTheme();
  const g = theme.glassDecor;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px 14px calc(8px + env(safe-area-inset-bottom))',
      background: g.bg, WebkitBackdropFilter: `blur(${g.blur}px) saturate(1.4)`, backdropFilter: `blur(${g.blur}px) saturate(1.4)`,
      borderTop: `1px solid ${g.border}`, display: 'flex', justifyContent: 'space-around' }}>
      {TABS.map(t => {
        const on = active === t.k;
        return (
          <button key={t.k} onClick={() => onChange(t.k)} style={{ background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 8px', flex: 1, fontFamily: 'inherit' }}>
            <Icon name={on ? t.ic : t.ico} size={24} color={on ? theme.accent : theme.t3} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 800 : 600, color: on ? theme.accent : theme.t3 }}>{theme.lang === 'en' ? t.en : t.ru}</span>
          </button>
        );
      })}
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{ width: 390, height: 844, borderRadius: 54, padding: 0, background: '#000',
      boxShadow: '0 40px 90px rgba(0,0,0,0.4), 0 0 0 11px #0b0b0d, 0 0 0 13px #2a2a2e', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 54, overflow: 'hidden' }}>{children}</div>
      <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 120, height: 32, background: '#000', borderRadius: 20, zIndex: 50 }} />
    </div>
  );
}

// Scrollable screen body
function ScreenBody({ children, style, scrollRef }) {
  return (
    <div ref={scrollRef} className="screen-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden',
      padding: '0 16px 110px', WebkitOverflowScrolling: 'touch', ...style }}>{children}</div>
  );
}

Object.assign(window, {
  buildTheme, bgString, ACCENT_PRESETS, RADII, SEMANTIC,
  ThemeCtx, LangCtx, useTheme, useL, useLang,
  Icon, GlassCard, SolidCard, IconChip, Btn, Chip, Segmented, ProgressBar, Ring, StatusDot, Avatar, SectionTitle,
  StatusBar, TabBar, TABS, PhoneFrame, ScreenBody,
});
