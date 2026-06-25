// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — App shell: phone frame, status bar, bottom tab bar.
// Composes DS tokens (CSS vars) + the radial-blob background.
// ════════════════════════════════════════════════════════════
const { useState } = React;

// ─── Phone frame (iPhone-ish bezel) ──────────────────────────
function PhoneFrame({ children }) {
  return (
    <div style={{
      width: 390, height: 800, borderRadius: 46, background: '#0a0a0c',
      padding: 11, boxShadow: '0 30px 70px rgba(20,40,35,0.30), 0 6px 18px rgba(0,0,0,0.18)',
      flex: 'none', position: 'relative',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden',
        position: 'relative', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column',
      }} className="ph-bg">
        {/* notch */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 128, height: 30, background: '#0a0a0c', borderRadius: '0 0 18px 18px', zIndex: 50,
        }} />
        {children}
      </div>
    </div>
  );
}

// ─── Status bar ──────────────────────────────────────────────
function StatusBar({ dark }) {
  const c = dark ? '#F2F2F7' : 'var(--t1)';
  return (
    <div style={{
      height: 46, flex: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 26px 6px', fontSize: 14, fontWeight: 700, color: c, zIndex: 40,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
        <ion-icon name="cellular" style={{ color: c }}></ion-icon>
        <ion-icon name="wifi" style={{ color: c }}></ion-icon>
        <ion-icon name="battery-full" style={{ color: c }}></ion-icon>
      </div>
    </div>
  );
}

// ─── Bottom tab bar (glass) ──────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'medical', icon: 'medkit', label: 'Medical' },
    { id: 'activity', icon: 'pulse', label: 'Activity' },
    { id: 'assistant', icon: 'sparkles', label: 'Assistant' },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ];
  return (
    <div style={{
      flex: 'none', display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 8px 22px', background: 'var(--glass-decor-bg)',
      backdropFilter: 'blur(34px) saturate(1.9)', WebkitBackdropFilter: 'blur(34px) saturate(1.9)',
      borderTop: '1px solid var(--glass-decor-border)', zIndex: 40,
    }}>
      {tabs.map((t) => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 0',
          }}>
            <ion-icon name={on ? t.id === 'assistant' ? 'sparkles' : t.icon : `${t.icon}-outline`}
              style={{ fontSize: 23, color: on ? 'var(--accent)' : 'var(--t3)' }}></ion-icon>
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 600, color: on ? 'var(--accent)' : 'var(--t3)' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Scrollable screen body ──────────────────────────────────
function ScreenBody({ children, style }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', ...style }}>
      {children}
    </div>
  );
}

Object.assign(window, { PhoneFrame, StatusBar, TabBar, ScreenBody });
