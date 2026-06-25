/* @ds-bundle: {"format":3,"namespace":"PetHealthAIDesignSystem_fd90ba","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"GlassCard","sourcePath":"components/core/GlassCard.jsx"},{"name":"IconChip","sourcePath":"components/core/IconChip.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"StatusCard","sourcePath":"components/feedback/StatusCard.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"472b5fc8ded7","components/core/Button.jsx":"435af204f4cf","components/core/Card.jsx":"f40f095c6050","components/core/GlassCard.jsx":"821c530605b7","components/core/IconChip.jsx":"6c6e8fe93604","components/feedback/ProgressBar.jsx":"1f4a4bfdfe38","components/feedback/StatusCard.jsx":"821e9ae812c6","components/forms/Input.jsx":"9ce27949bceb","components/forms/Switch.jsx":"b88749e70db4","ui_kits/app/ActivityScreen.jsx":"d255c0c53e56","ui_kits/app/AppShell.jsx":"d3fdc32bb9b8","ui_kits/app/AssistantScreens.jsx":"b414f76ded35","ui_kits/app/DashboardScreen.jsx":"2d1bcef584b1","ui_kits/app/LoginScreen.jsx":"cae3c49c88f6","ui_kits/app/MedicalScreen.jsx":"622acb768460","ui_kits/app/ProfileScreen.jsx":"e088ae88ab49"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PetHealthAIDesignSystem_fd90ba = window.PetHealthAIDesignSystem_fd90ba || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
/**
 * PetHealthAI — Badge
 * Small pill label. tone maps to a colour family: 'accent' (brand),
 * health semantics 'ok' | 'warn' | 'danger', or 'neutral'. soft (default)
 * renders a tinted background with coloured text; solid fills with the colour.
 */
function Badge({
  children,
  tone = 'neutral',
  solid = false,
  icon,
  style
}) {
  const tones = {
    accent: 'var(--accent)',
    ok: 'var(--ok)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    neutral: 'var(--t3)'
  };
  const c = tones[tone] || tones.neutral;
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontFamily: 'var(--font-sans)',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
    padding: '5px 9px',
    borderRadius: 'var(--r-pill)',
    letterSpacing: '0.2px',
    whiteSpace: 'nowrap'
  };
  const skin = solid ? {
    background: c,
    color: tone === 'neutral' ? 'var(--surface)' : '#fff'
  } : {
    background: `color-mix(in srgb, ${c} 16%, transparent)`,
    color: c
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...base,
      ...skin,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("ion-icon", {
    name: icon,
    style: {
      fontSize: 12
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PetHealthAI — Button
 * Pill CTA. Primary fills with --accent-press (white text passes AA),
 * secondary uses the accent tint, ghost is transparent. Optional Ionicons
 * leading/trailing icon. Colours come from CSS custom properties only.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  block = false,
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: {
      fontSize: 13,
      padding: '8px 14px',
      gap: 6,
      icon: 16
    },
    md: {
      fontSize: 15,
      padding: '12px 18px',
      gap: 8,
      icon: 18
    },
    lg: {
      fontSize: 17,
      padding: '15px 22px',
      gap: 9,
      icon: 20
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: 'var(--accent-press)',
      color: 'var(--on-accent)',
      border: '1px solid transparent'
    },
    secondary: {
      background: 'var(--accent-tint)',
      color: 'var(--accent-press)',
      border: '1px solid transparent'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--accent-press)',
      border: '1px solid transparent'
    },
    outline: {
      background: 'transparent',
      color: 'var(--t1)',
      border: '1px solid var(--hairline)'
    },
    danger: {
      background: 'var(--danger)',
      color: '#fff',
      border: '1px solid transparent'
    }
  };
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    onClick: disabled ? undefined : onClick,
    disabled: disabled,
    style: {
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : undefined,
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      fontFamily: 'var(--font-sans)',
      fontSize: s.fontSize,
      fontWeight: 700,
      lineHeight: 1,
      padding: s.padding,
      borderRadius: 'var(--r-pill)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'filter .15s ease, transform .05s ease',
      WebkitTapHighlightColor: 'transparent',
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = 'scale(0.98)';
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = 'scale(1)';
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = 'scale(1)';
    }
  }, rest), icon && /*#__PURE__*/React.createElement("ion-icon", {
    name: icon,
    style: {
      fontSize: s.icon
    }
  }), children, iconRight && /*#__PURE__*/React.createElement("ion-icon", {
    name: iconRight,
    style: {
      fontSize: s.icon
    }
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
/**
 * PetHealthAI — Card
 * Solid surface for dense data: numbers, charts, medical records, forms.
 * High-contrast white (--surface) with a soft shadow and large radius.
 * Optional left accent stripe (statusColor) as used by health status cards.
 */
function Card({
  children,
  padding = 16,
  radius,
  statusColor,
  onClick,
  style
}) {
  const r = radius != null ? radius : 'var(--r-md)';
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      borderRadius: r,
      background: 'var(--surface)',
      border: '1px solid var(--hairline)',
      boxShadow: 'var(--shadow-1)',
      borderLeft: statusColor ? `4px solid ${statusColor}` : undefined,
      padding,
      color: 'var(--t1)',
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/GlassCard.jsx
try { (() => {
/**
 * PetHealthAI — GlassCard
 * Frosted-glass surface. Two-tier discipline:
 *   variant="data"  → dense/readable (.62 bg, blur 24) for status & recs.
 *   variant="decor" → translucent brand glass (.30 bg, blur 34, light border)
 *                     for switcher, AI insight, Paws, rank.
 * Soft outer shadow; large radius. Never put fine data on decor glass.
 */
function GlassCard({
  children,
  variant = 'data',
  padding = 16,
  radius,
  glow = false,
  style
}) {
  const r = radius != null ? radius : 'var(--r-lg)';
  const isDecor = variant === 'decor';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: r,
      background: isDecor ? 'var(--glass-decor-bg)' : 'var(--glass-data-bg)',
      backdropFilter: `blur(${isDecor ? 34 : 24}px) saturate(${isDecor ? 1.9 : 1.4})`,
      WebkitBackdropFilter: `blur(${isDecor ? 34 : 24}px) saturate(${isDecor ? 1.9 : 1.4})`,
      border: `1px solid ${isDecor ? 'var(--glass-decor-border)' : 'var(--hairline)'}`,
      boxShadow: glow ? 'var(--glow-accent)' : 'var(--shadow-card)',
      padding,
      color: 'var(--t1)',
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { GlassCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/GlassCard.jsx", error: String((e && e.message) || e) }); }

// components/core/IconChip.jsx
try { (() => {
/**
 * PetHealthAI — IconChip
 * Round tinted plate with a centered line Ionicons glyph. Default is
 * accent on accent-tint; pass a color to tint the plate with that hue
 * (color + ~12% alpha) or an explicit bg. Used in status cards & quick actions.
 */
function IconChip({
  name,
  color,
  size = 18,
  bg,
  style
}) {
  const iconColor = color || 'var(--accent)';
  const background = bg || (color ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--accent-tint)');
  const box = Math.round(size * 1.7);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: box,
      height: box,
      borderRadius: '50%',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background,
      flex: 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: name,
    style: {
      fontSize: size,
      color: iconColor
    }
  }));
}
Object.assign(__ds_scope, { IconChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconChip.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
/**
 * PetHealthAI — ProgressBar
 * Rounded track with an accent fill. Used for monthly Paws progress, course
 * completion, etc. Pass current/goal (clamped) or an explicit percent.
 */
function ProgressBar({
  current,
  goal = 1,
  percent,
  height = 12,
  color = 'var(--accent)',
  style
}) {
  const pct = percent != null ? Math.max(0, Math.min(100, percent)) : Math.max(0, Math.min(100, current / (goal || 1) * 100));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height,
      borderRadius: 'var(--r-pill)',
      background: 'var(--hairline)',
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      borderRadius: 'var(--r-pill)',
      background: color,
      transition: 'width .4s cubic-bezier(.4,0,.2,1)'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusCard.jsx
try { (() => {
/**
 * PetHealthAI — StatusCard
 * Dashboard health-overview tile: tinted icon-chip + uppercase caption,
 * a bold metric value, and a muted subtitle. statusColor drives the chip
 * tint AND the 4px left stripe (health semantics ok/warn/danger, or t3).
 * Solid surface — it carries fine data.
 */
function StatusCard({
  icon,
  title,
  value,
  subtitle,
  statusColor = 'var(--t3)',
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      flex: 1,
      minWidth: 0,
      background: 'var(--surface)',
      border: '1px solid var(--hairline)',
      borderLeft: `4px solid ${statusColor}`,
      borderRadius: 'var(--r-md)',
      padding: 13,
      boxShadow: 'var(--shadow-1)',
      cursor: onClick ? 'pointer' : undefined,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconChip, {
    name: icon,
    color: statusColor,
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 700,
      color: 'var(--t3)',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--t1)',
      marginBottom: 3
    }
  }, value), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t3)',
      lineHeight: 1.35
    }
  }, subtitle));
}
Object.assign(__ds_scope, { StatusCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PetHealthAI — Input
 * Pill / rounded text field on a solid surface. Optional leading Ionicons
 * glyph. Focus lifts the border to the brand accent. t4 placeholder.
 */
function Input({
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
  pill = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--surface)',
      border: `1px solid ${focus ? 'var(--accent)' : 'var(--hairline)'}`,
      borderRadius: pill ? 'var(--r-pill)' : 'var(--r-sm)',
      padding: pill ? '12px 18px' : '13px 14px',
      boxShadow: focus ? '0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent)' : 'none',
      transition: 'border-color .15s ease, box-shadow .15s ease',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement("ion-icon", {
    name: icon,
    style: {
      fontSize: 18,
      color: focus ? 'var(--accent)' : 'var(--t3)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    type: type,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--t1)'
    }
  }, rest)));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/**
 * PetHealthAI — Switch
 * Pill toggle. On = brand accent track, white knob. Off = hairline track.
 * Controlled via `checked` + `onChange(next)`.
 */
function Switch({
  checked = false,
  onChange,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    disabled: disabled,
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 48,
      height: 28,
      borderRadius: 'var(--r-pill)',
      border: 'none',
      padding: 3,
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: checked ? 'var(--accent)' : 'var(--hairline)',
      opacity: disabled ? 0.5 : 1,
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'background .18s ease',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      transform: checked ? 'translateX(20px)' : 'translateX(0)',
      transition: 'transform .18s cubic-bezier(.4,0,.2,1)'
    }
  }));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ActivityScreen.jsx
try { (() => {
// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Activity: weight trend (solid card) + recent log.
// Solid surfaces only — this screen is all data.
// ════════════════════════════════════════════════════════════
function ActivityScreen() {
  const {
    Card,
    IconChip,
    Badge
  } = window.PetHealthAIDesignSystem_fd90ba;
  const weights = [31.2, 31.6, 31.4, 31.9, 32.1, 32.4];
  const labels = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const min = 30.5,
    max = 33;
  const log = [{
    icon: 'medkit-outline',
    color: 'var(--event-vaccine)',
    title: 'Vaccination logged',
    sub: 'Rabies booster · verified',
    when: 'Today',
    paws: 15
  }, {
    icon: 'document-text-outline',
    color: 'var(--event-record)',
    title: 'Document scanned',
    sub: 'Blood panel results',
    when: 'Yesterday',
    paws: 10
  }, {
    icon: 'scale-outline',
    color: 'var(--t3)',
    title: 'Weight recorded',
    sub: '32.4 kg · +0.3 kg',
    when: '2 days ago',
    paws: 5
  }, {
    icon: 'walk-outline',
    color: 'var(--cat-nutrition)',
    title: 'Daily check-in',
    sub: '7-day care streak 🔥',
    when: '2 days ago',
    paws: 5
  }];
  return /*#__PURE__*/React.createElement(ScreenBody, {
    style: {
      padding: '4px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--t1)',
      padding: '6px 4px 16px',
      letterSpacing: '-0.4px'
    }
  }, "Activity"), /*#__PURE__*/React.createElement(Card, {
    padding: 18,
    style: {
      borderRadius: 20,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: 'var(--t3)'
    }
  }, "Weight"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      color: 'var(--t1)',
      lineHeight: 1.1
    }
  }, "32.4", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      color: 'var(--t3)'
    }
  }, " kg"))), /*#__PURE__*/React.createElement(Badge, {
    tone: "ok",
    icon: "trending-up"
  }, "+1.2 kg / 6mo")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: 10,
      height: 110
    }
  }, weights.map((w, i) => {
    const h = (w - min) / (max - min) * 100;
    const last = i === weights.length - 1;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: last ? 'var(--accent-press)' : 'var(--t3)'
      }
    }, w), /*#__PURE__*/React.createElement("div", {
      style: {
        width: '100%',
        height: `${h}%`,
        minHeight: 8,
        borderRadius: 8,
        background: last ? 'var(--accent)' : 'var(--accent-tint)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: 'var(--t3)',
        fontWeight: 600
      }
    }, labels[i]));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--t1)',
      margin: '0 4px 12px'
    }
  }, "Recent Activity"), /*#__PURE__*/React.createElement(Card, {
    padding: 6,
    style: {
      borderRadius: 20
    }
  }, log.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 12px',
      borderBottom: i < log.length - 1 ? '1px solid var(--hairline)' : 'none'
    }
  }, /*#__PURE__*/React.createElement(IconChip, {
    name: e.icon,
    color: e.color,
    size: 17
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, e.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)'
    }
  }, e.sub)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--accent-press)'
    }
  }, "+", e.paws, " \uD83D\uDC3E"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: 'var(--t4)'
    }
  }, e.when))))));
}
window.ActivityScreen = ActivityScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ActivityScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AppShell.jsx
try { (() => {
// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — App shell: phone frame, status bar, bottom tab bar.
// Composes DS tokens (CSS vars) + the radial-blob background.
// ════════════════════════════════════════════════════════════
const {
  useState
} = React;

// ─── Phone frame (iPhone-ish bezel) ──────────────────────────
function PhoneFrame({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 800,
      borderRadius: 46,
      background: '#0a0a0c',
      padding: 11,
      boxShadow: '0 30px 70px rgba(20,40,35,0.30), 0 6px 18px rgba(0,0,0,0.18)',
      flex: 'none',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 36,
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column'
    },
    className: "ph-bg"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 128,
      height: 30,
      background: '#0a0a0c',
      borderRadius: '0 0 18px 18px',
      zIndex: 50
    }
  }), children));
}

// ─── Status bar ──────────────────────────────────────────────
function StatusBar({
  dark
}) {
  const c = dark ? '#F2F2F7' : 'var(--t1)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 46,
      flex: 'none',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '0 26px 6px',
      fontSize: 14,
      fontWeight: 700,
      color: c,
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement("span", null, "9:41"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center',
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "cellular",
    style: {
      color: c
    }
  }), /*#__PURE__*/React.createElement("ion-icon", {
    name: "wifi",
    style: {
      color: c
    }
  }), /*#__PURE__*/React.createElement("ion-icon", {
    name: "battery-full",
    style: {
      color: c
    }
  })));
}

// ─── Bottom tab bar (glass) ──────────────────────────────────
function TabBar({
  active,
  onChange
}) {
  const tabs = [{
    id: 'dashboard',
    icon: 'home',
    label: 'Home'
  }, {
    id: 'medical',
    icon: 'medkit',
    label: 'Medical'
  }, {
    id: 'activity',
    icon: 'pulse',
    label: 'Activity'
  }, {
    id: 'assistant',
    icon: 'sparkles',
    label: 'Assistant'
  }, {
    id: 'profile',
    icon: 'person',
    label: 'Profile'
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 8px 22px',
      background: 'var(--glass-decor-bg)',
      backdropFilter: 'blur(34px) saturate(1.9)',
      WebkitBackdropFilter: 'blur(34px) saturate(1.9)',
      borderTop: '1px solid var(--glass-decor-border)',
      zIndex: 40
    }
  }, tabs.map(t => {
    const on = active === t.id;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      onClick: () => onChange(t.id),
      style: {
        flex: 1,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '4px 0'
      }
    }, /*#__PURE__*/React.createElement("ion-icon", {
      name: on ? t.id === 'assistant' ? 'sparkles' : t.icon : `${t.icon}-outline`,
      style: {
        fontSize: 23,
        color: on ? 'var(--accent)' : 'var(--t3)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        fontWeight: on ? 700 : 600,
        color: on ? 'var(--accent)' : 'var(--t3)'
      }
    }, t.label));
  }));
}

// ─── Scrollable screen body ──────────────────────────────────
function ScreenBody({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      ...style
    }
  }, children);
}
Object.assign(window, {
  PhoneFrame,
  StatusBar,
  TabBar,
  ScreenBody
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/AssistantScreens.jsx
try { (() => {
// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — AI Assistant hub + chat.
// Categorical assistantCategories palette drives tiles & chat header.
// ════════════════════════════════════════════════════════════
const CATEGORIES = [{
  id: 'health',
  title: 'Health & Wellness',
  icon: 'medical',
  color: 'var(--cat-health)',
  q: 'What are signs of illness in dogs?'
}, {
  id: 'nutrition',
  title: 'Nutrition & Diet',
  icon: 'restaurant',
  color: 'var(--cat-nutrition)',
  q: 'Foods toxic to pets'
}, {
  id: 'behavior',
  title: 'Behavior & Training',
  icon: 'school',
  color: 'var(--cat-behavior)',
  q: 'How to stop excessive barking?'
}, {
  id: 'grooming',
  title: 'Grooming & Care',
  icon: 'cut',
  color: 'var(--cat-grooming)',
  q: 'How often to bathe my dog?'
}, {
  id: 'emergency',
  title: 'Emergency Guide',
  icon: 'alert-circle',
  color: 'var(--cat-emergency)',
  q: 'Signs of poisoning'
}, {
  id: 'relocation',
  title: 'Relocation & Travel',
  icon: 'airplane',
  color: 'var(--cat-relocation)',
  q: 'Documents to fly with my dog?'
}];
function AssistantHubScreen({
  onOpenChat
}) {
  const {
    GlassCard
  } = window.PetHealthAIDesignSystem_fd90ba;
  return /*#__PURE__*/React.createElement(ScreenBody, {
    style: {
      padding: '4px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '6px 4px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--t1)',
      letterSpacing: '-0.4px'
    }
  }, "AI Pet Assistant"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--t2)',
      marginTop: 2
    }
  }, "Ask me anything about Mango's care")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenChat({
      id: 'free-chat',
      title: 'AI Assistant',
      color: 'var(--accent)'
    }),
    style: tileBtn('var(--accent)')
  }, /*#__PURE__*/React.createElement("div", {
    style: chipBox('var(--accent)')
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "chatbubbles",
    style: {
      fontSize: 22,
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Start Free Chat"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t2)'
    }
  }, "Ask me anything about your pet")), /*#__PURE__*/React.createElement("ion-icon", {
    name: "chevron-forward",
    style: {
      fontSize: 18,
      color: 'var(--t3)'
    }
  })), /*#__PURE__*/React.createElement("button", {
    style: tileBtn('var(--cat-general)')
  }, /*#__PURE__*/React.createElement("div", {
    style: chipBox('var(--cat-general)')
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "camera",
    style: {
      fontSize: 22,
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Photo Analysis"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t2)'
    }
  }, "Check symptoms or identify breed")), /*#__PURE__*/React.createElement("ion-icon", {
    name: "chevron-forward",
    style: {
      fontSize: 18,
      color: 'var(--t3)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--t1)',
      margin: '0 4px 12px'
    }
  }, "Browse by Category"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12
    }
  }, CATEGORIES.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    onClick: () => onOpenChat(c),
    style: {
      background: 'var(--surface)',
      border: '1px solid var(--hairline)',
      borderRadius: 18,
      padding: 14,
      cursor: 'pointer',
      textAlign: 'left',
      boxShadow: 'var(--shadow-1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      minHeight: 108
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: chipBox(c.color)
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: c.icon,
    style: {
      fontSize: 20,
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--t1)',
      lineHeight: 1.25
    }
  }, c.title)))));
}
function tileBtn(color) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    cursor: 'pointer',
    background: 'var(--surface)',
    border: '1px solid var(--hairline)',
    borderRadius: 18,
    boxShadow: 'var(--shadow-1)',
    width: '100%',
    fontFamily: 'var(--font-sans)'
  };
}
function chipBox(color) {
  return {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: color,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
}

// ─── Chat ────────────────────────────────────────────────────
function ChatScreen({
  category,
  onBack
}) {
  const {
    Input
  } = window.PetHealthAIDesignSystem_fd90ba;
  const color = category.color || 'var(--accent)';
  const seed = category.id === 'free-chat' ? [] : [{
    from: 'user',
    text: category.q
  }, {
    from: 'bot',
    text: botReply(category.id)
  }];
  const [msgs, setMsgs] = React.useState(seed);
  const [draft, setDraft] = React.useState('');
  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);
  const send = text => {
    const t = (text != null ? text : draft).trim();
    if (!t) return;
    setDraft('');
    setMsgs(m => [...m, {
      from: 'user',
      text: t
    }]);
    setTimeout(() => setMsgs(m => [...m, {
      from: 'bot',
      text: botReply(category.id)
    }]), 450);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px 12px',
      background: color,
      color: '#fff',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "chevron-back",
    style: {
      fontSize: 24,
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700
    }
  }, category.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      opacity: 0.85
    }
  }, "Mango \u2022 Golden Retriever \u2022 4 yrs")), /*#__PURE__*/React.createElement("ion-icon", {
    name: "ellipsis-horizontal",
    style: {
      fontSize: 22,
      color: '#fff'
    }
  })), /*#__PURE__*/React.createElement("div", {
    ref: scrollRef,
    style: {
      flex: 1,
      overflowY: 'auto',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, msgs.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginTop: 30,
      padding: '0 20px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 10
    }
  }, "\u2728"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--t1)',
      marginBottom: 6
    }
  }, "Mango's AI Assistant"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t2)',
      lineHeight: 1.5,
      marginBottom: 18
    }
  }, "Hi! I'm your AI assistant for Mango. How can I help you today?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, ['What vaccinations does my pet need?', 'How often should I feed my pet?', 'Signs of illness in pets?'].map(q => /*#__PURE__*/React.createElement("button", {
    key: q,
    onClick: () => send(q),
    style: {
      padding: '10px 14px',
      borderRadius: 14,
      border: '1px solid var(--hairline)',
      background: 'var(--surface)',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--t2)',
      fontFamily: 'var(--font-sans)',
      textAlign: 'left'
    }
  }, q)))), msgs.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: m.from === 'user' ? {
      maxWidth: '80%',
      padding: '10px 14px',
      borderRadius: '18px 18px 4px 18px',
      background: 'var(--accent-press)',
      color: '#fff',
      fontSize: 14,
      lineHeight: 1.45
    } : {
      maxWidth: '82%',
      padding: '11px 14px',
      borderRadius: '18px 18px 18px 4px',
      background: 'var(--glass-data-bg)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid var(--hairline)',
      color: 'var(--t1)',
      fontSize: 14,
      lineHeight: 1.5,
      boxShadow: 'var(--glow-accent)'
    }
  }, m.text)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 'none',
      padding: '10px 14px 26px',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      background: 'var(--glass-decor-bg)',
      backdropFilter: 'blur(34px)',
      WebkitBackdropFilter: 'blur(34px)',
      borderTop: '1px solid var(--glass-decor-border)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Input, {
    pill: true,
    icon: "paw-outline",
    placeholder: "Ask me anything about pet care\u2026",
    value: draft,
    onChange: e => setDraft(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') send();
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => send(),
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      flex: 'none',
      background: 'var(--accent-press)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "arrow-up",
    style: {
      fontSize: 22,
      color: '#fff'
    }
  }))));
}
function botReply(id) {
  const map = {
    health: "Watch for changes in appetite, energy or bathroom habits. Repeated vomiting, lethargy or refusing food for over a day warrants a vet visit. This is general guidance, not a diagnosis.",
    nutrition: "Keep treats to ~10% of daily calories and avoid chocolate, grapes, onions, garlic and xylitol — all toxic to dogs. Introduce diet changes gradually over 5–7 days.",
    behavior: "Reward the behaviour you want and avoid punishment. Dogs thrive on routine and exercise; for persistent barking, identify the trigger and redirect with positive reinforcement.",
    grooming: "Bathe only as needed with a pet-safe shampoo — over-bathing dries the skin. Brush regularly to reduce shedding and catch skin issues early.",
    emergency: "Signs of poisoning include drooling, vomiting, tremors or collapse. Call a vet or poison line immediately and don't give any human medicine unless instructed.",
    relocation: "You'll typically need a vet passport, an ISO microchip, a valid rabies vaccine (often 21+ days before travel) and possibly a titre test. Always verify the destination's current import rules.",
    'free-chat': "Happy to help! Tell me a bit more about Mango and what you'd like to know — health, nutrition, behaviour or travel."
  };
  return map[id] || map['free-chat'];
}
Object.assign(window, {
  AssistantHubScreen,
  ChatScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/AssistantScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/DashboardScreen.jsx
try { (() => {
// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Dashboard (Home). The redesign reference screen:
// pet switcher (decor glass) → Health Overview status grid (solid) →
// Vet recommendations (data glass) → Tip of the Day (decor) → Paws (decor).
// ════════════════════════════════════════════════════════════
function DashboardScreen({
  onOpenAssistant
}) {
  const DS = window.PetHealthAIDesignSystem_fd90ba;
  const {
    GlassCard,
    StatusCard,
    ProgressBar,
    Button,
    IconChip,
    Badge
  } = DS;
  const [pet, setPet] = React.useState('Mango');
  const pets = [{
    name: 'Mango',
    emoji: '🐶',
    breed: 'Golden Retriever'
  }, {
    name: 'Luna',
    emoji: '🐱',
    breed: 'British Shorthair'
  }];
  const cur = pets.find(p => p.name === pet);
  const SectionTitle = ({
    children
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--t1)',
      margin: '4px 4px 10px'
    }
  }, children);
  return /*#__PURE__*/React.createElement(ScreenBody, {
    style: {
      padding: '4px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement(GlassCard, {
    variant: "decor",
    padding: 16,
    style: {
      borderRadius: 24,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: '50%',
      background: 'var(--accent-tint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 28,
      flex: 'none'
    }
  }, cur.emoji), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 19,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, cur.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t2)'
    }
  }, cur.breed)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "notifications-outline",
    style: {
      fontSize: 24,
      color: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: 'var(--danger)',
      color: '#fff',
      fontSize: 10,
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, "2")), /*#__PURE__*/React.createElement("ion-icon", {
    name: "person-circle-outline",
    style: {
      fontSize: 38,
      color: 'var(--accent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 14,
      overflowX: 'auto'
    }
  }, pets.map(p => {
    const on = p.name === pet;
    return /*#__PURE__*/React.createElement("button", {
      key: p.name,
      onClick: () => setPet(p.name),
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        cursor: 'pointer',
        borderRadius: 999,
        border: '1px solid',
        whiteSpace: 'nowrap',
        borderColor: on ? 'transparent' : 'var(--hairline)',
        background: on ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
        color: on ? 'var(--on-accent)' : 'var(--t2)',
        fontWeight: 700,
        fontSize: 13,
        fontFamily: 'var(--font-sans)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15
      }
    }, p.emoji), p.name);
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '7px 12px',
      cursor: 'pointer',
      borderRadius: 999,
      border: '1px dashed var(--accent)',
      background: 'transparent',
      color: 'var(--accent)',
      fontWeight: 700,
      fontSize: 13,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "add",
    style: {
      fontSize: 16
    }
  }), "Add Pet"))), /*#__PURE__*/React.createElement(SectionTitle, null, "Health Overview"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(StatusCard, {
    icon: "medkit-outline",
    title: "Vaccination",
    value: "12 Jul",
    subtitle: "Rabies booster",
    statusColor: "var(--warn)"
  }), /*#__PURE__*/React.createElement(StatusCard, {
    icon: "calendar-outline",
    title: "Vet",
    value: "3 Aug",
    subtitle: "Annual check-up",
    statusColor: "var(--ok)"
  }), /*#__PURE__*/React.createElement(StatusCard, {
    icon: "bug-outline",
    title: "Parasites",
    value: "Overdue",
    subtitle: "Last: 2 Feb",
    statusColor: "var(--danger)"
  }), /*#__PURE__*/React.createElement(StatusCard, {
    icon: "scale-outline",
    title: "Biometry",
    value: "32.4 kg",
    subtitle: "+0.3 kg \xB7 was 32.1"
  })), /*#__PURE__*/React.createElement(GlassCard, {
    variant: "data",
    padding: 16,
    style: {
      borderRadius: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "clipboard-outline",
    style: {
      fontSize: 18,
      color: 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Vet recommendations")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)',
      marginBottom: 10
    }
  }, "Since last visit: Paws & Claws Clinic, 3 Jun 2026"), ['Switch to senior-formula food over the next week.', 'Recheck weight in 30 days.', 'Dental cleaning recommended.'].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      gap: 8,
      marginBottom: 6,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--accent)',
      marginTop: 6,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--t2)',
      lineHeight: 1.4
    }
  }, r))), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--accent-press)',
      fontSize: 13,
      fontWeight: 700,
      marginTop: 6
    }
  }, "All recommendations")), /*#__PURE__*/React.createElement(GlassCard, {
    variant: "decor",
    padding: 16,
    style: {
      borderRadius: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement(IconChip, {
    name: "sparkles-outline",
    size: 20
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Tip of the Day")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--t2)',
      lineHeight: 1.5,
      marginBottom: 12
    }
  }, "Check ears and teeth weekly \u2014 early signs of trouble are easy to miss."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "chatbubble-ellipses-outline",
    onClick: onOpenAssistant
  }, "Discuss with AI")), /*#__PURE__*/React.createElement(GlassCard, {
    variant: "decor",
    padding: 20,
    style: {
      borderRadius: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: 'var(--accent-tint)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      flex: 'none'
    }
  }, "\uD83D\uDC3E"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Paws Points"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t2)'
    }
  }, "Help shelter animals")), /*#__PURE__*/React.createElement("ion-icon", {
    name: "information-circle-outline",
    style: {
      fontSize: 24,
      color: 'var(--accent)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 38,
      fontWeight: 700,
      color: 'var(--accent-press)',
      lineHeight: 1
    }
  }, "1,240"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--t3)'
    }
  }, "Total Paws")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--t3)',
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Earned this month"), /*#__PURE__*/React.createElement("span", null, "320/500")), /*#__PURE__*/React.createElement(ProgressBar, {
    current: 320,
    goal: 500
  })), /*#__PURE__*/React.createElement(Button, {
    block: true,
    icon: "heart"
  }, "Support a shelter"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      color: 'var(--accent-press)',
      fontSize: 13,
      fontWeight: 700,
      marginTop: 12
    }
  }, "+ Earn more Paws")));
}
window.DashboardScreen = DashboardScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/LoginScreen.jsx
try { (() => {
// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Login screen.
// ════════════════════════════════════════════════════════════
function LoginScreen({
  onLogin
}) {
  const {
    Button,
    Input
  } = window.PetHealthAIDesignSystem_fd90ba;
  const [signup, setSignup] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 28px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 36
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/icon.png",
    alt: "PetHealthAI",
    style: {
      width: 84,
      height: 84,
      borderRadius: 22,
      boxShadow: 'var(--shadow-2)',
      marginBottom: 18
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 30,
      fontWeight: 700,
      color: 'var(--t1)',
      letterSpacing: '-0.5px'
    }
  }, "PetHealth", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--accent)'
    }
  }, "AI")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: 'var(--t2)',
      marginTop: 4
    }
  }, "Your pet's health companion")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "mail-outline",
    placeholder: "Email",
    defaultValue: "max@pethealth.ai"
  }), /*#__PURE__*/React.createElement(Input, {
    icon: "lock-closed-outline",
    type: "password",
    placeholder: "Password",
    defaultValue: "paws1234"
  }), signup && /*#__PURE__*/React.createElement(Input, {
    icon: "person-outline",
    placeholder: "Name"
  }), /*#__PURE__*/React.createElement(Button, {
    block: true,
    size: "lg",
    onClick: onLogin,
    style: {
      marginTop: 6
    }
  }, signup ? 'Create account' : 'Log in'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSignup(!signup),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      marginTop: 4,
      color: 'var(--accent-press)',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      fontWeight: 600
    }
  }, signup ? 'Already have an account? Log in' : "Don't have an account? Sign up")));
}
window.LoginScreen = LoginScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/MedicalScreen.jsx
try { (() => {
// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Medical: event-type legend + records (solid).
// Showcases the categorical eventTypes palette.
// ════════════════════════════════════════════════════════════
function MedicalScreen() {
  const {
    Card,
    Button,
    Badge
  } = window.PetHealthAIDesignSystem_fd90ba;
  const legend = [{
    t: 'Record',
    c: 'var(--event-record)'
  }, {
    t: 'Prescription',
    c: 'var(--event-prescription)'
  }, {
    t: 'Vaccine',
    c: 'var(--event-vaccine)'
  }, {
    t: 'Reminder',
    c: 'var(--event-reminder)'
  }, {
    t: 'Appointment',
    c: 'var(--event-appointment)'
  }];
  const records = [{
    type: 'Vaccine',
    c: 'var(--event-vaccine)',
    title: 'Rabies booster',
    date: '12 Jul 2026',
    meta: 'Next due in 12 mo',
    icon: 'medkit-outline'
  }, {
    type: 'Appointment',
    c: 'var(--event-appointment)',
    title: 'Annual check-up',
    date: '3 Aug 2026',
    meta: 'Paws & Claws Clinic',
    icon: 'calendar-outline'
  }, {
    type: 'Prescription',
    c: 'var(--event-prescription)',
    title: 'Apoquel 16mg',
    date: '20 Jun 2026',
    meta: 'Course 70% complete',
    icon: 'medical-outline'
  }, {
    type: 'Record',
    c: 'var(--event-record)',
    title: 'Blood panel',
    date: '3 Jun 2026',
    meta: 'Scanned · all normal',
    icon: 'document-text-outline'
  }];
  return /*#__PURE__*/React.createElement(ScreenBody, {
    style: {
      padding: '4px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 4px 16px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--t1)',
      letterSpacing: '-0.4px'
    }
  }, "Medical"), /*#__PURE__*/React.createElement("ion-icon", {
    name: "share-outline",
    style: {
      fontSize: 22,
      color: 'var(--accent)'
    }
  })), /*#__PURE__*/React.createElement(Card, {
    statusColor: "var(--warn)",
    padding: 14,
    style: {
      borderRadius: 16,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "warning-outline",
    style: {
      fontSize: 20,
      color: 'var(--warn)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Allergies"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)'
    }
  }, "Chicken protein \xB7 Pollen")), /*#__PURE__*/React.createElement(Badge, {
    tone: "warn"
  }, "Moderate"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      padding: '0 4px 14px'
    }
  }, legend.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.t,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: l.c
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: 'var(--t2)',
      fontWeight: 600
    }
  }, l.t)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      marginBottom: 16
    }
  }, records.map((r, i) => /*#__PURE__*/React.createElement(Card, {
    key: i,
    statusColor: r.c,
    padding: 14,
    style: {
      borderRadius: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 38,
      height: 38,
      borderRadius: 12,
      flex: 'none',
      background: `color-mix(in srgb, ${r.c} 14%, transparent)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: r.icon,
    style: {
      fontSize: 19,
      color: r.c
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, r.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--t3)'
    }
  }, r.meta)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      color: 'var(--t3)',
      whiteSpace: 'nowrap'
    }
  }, r.date))))), /*#__PURE__*/React.createElement(Button, {
    block: true,
    icon: "add",
    variant: "secondary"
  }, "Add record"));
}
window.MedicalScreen = MedicalScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/MedicalScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/ProfileScreen.jsx
try { (() => {
// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Profile: rank card, settings (switches), account.
// ════════════════════════════════════════════════════════════
function ProfileScreen({
  dark,
  onToggleDark
}) {
  const {
    GlassCard,
    Switch,
    Badge,
    Button
  } = window.PetHealthAIDesignSystem_fd90ba;
  const [notif, setNotif] = React.useState(true);
  const [units, setUnits] = React.useState('kg');
  const [lang, setLang] = React.useState('EN');
  const Row = ({
    icon,
    label,
    children,
    danger
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '13px 0'
    }
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: icon,
    style: {
      fontSize: 20,
      color: danger ? 'var(--danger)' : 'var(--accent)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15,
      fontWeight: 600,
      color: danger ? 'var(--danger)' : 'var(--t1)'
    }
  }, label), children);
  const Seg = ({
    options,
    value,
    onChange
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      background: 'var(--hairline)',
      borderRadius: 999,
      padding: 2
    }
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    onClick: () => onChange(o),
    style: {
      border: 'none',
      cursor: 'pointer',
      padding: '5px 12px',
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: 'var(--font-sans)',
      background: value === o ? 'var(--surface)' : 'transparent',
      color: value === o ? 'var(--accent-press)' : 'var(--t3)',
      boxShadow: value === o ? 'var(--shadow-1)' : 'none'
    }
  }, o)));
  return /*#__PURE__*/React.createElement(ScreenBody, {
    style: {
      padding: '4px 16px 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 26,
      fontWeight: 700,
      color: 'var(--t1)',
      padding: '6px 4px 16px',
      letterSpacing: '-0.4px'
    }
  }, "Profile"), /*#__PURE__*/React.createElement(GlassCard, {
    variant: "decor",
    padding: 18,
    style: {
      borderRadius: 24,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 60,
      height: 60,
      borderRadius: '50%',
      background: 'var(--accent)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      fontWeight: 700,
      flex: 'none'
    }
  }, "M"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Max Marshak"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--t2)'
    }
  }, "max@pethealth.ai")))), /*#__PURE__*/React.createElement(GlassCard, {
    variant: "decor",
    padding: 16,
    style: {
      borderRadius: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36
    }
  }, "\uD83E\uDD48"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: 'var(--t3)'
    }
  }, "Rank"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      color: 'var(--t1)'
    }
  }, "Caring Guardian"), /*#__PURE__*/React.createElement(Badge, {
    tone: "accent",
    style: {
      marginTop: 4
    }
  }, "Silver League")), /*#__PURE__*/React.createElement("ion-icon", {
    name: "chevron-forward",
    style: {
      fontSize: 20,
      color: 'var(--t3)'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: 'var(--t3)',
      margin: '6px 4px 4px'
    }
  }, "Settings"), /*#__PURE__*/React.createElement(GlassCard, {
    variant: "data",
    padding: 16,
    style: {
      borderRadius: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Row, {
    icon: "notifications-outline",
    label: "Notifications"
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: notif,
    onChange: setNotif
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--hairline)'
    }
  }), /*#__PURE__*/React.createElement(Row, {
    icon: "moon-outline",
    label: "Dark mode"
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: dark,
    onChange: onToggleDark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--hairline)'
    }
  }), /*#__PURE__*/React.createElement(Row, {
    icon: "scale-outline",
    label: "Units"
  }, /*#__PURE__*/React.createElement(Seg, {
    options: ['kg', 'lb'],
    value: units,
    onChange: setUnits
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--hairline)'
    }
  }), /*#__PURE__*/React.createElement(Row, {
    icon: "language-outline",
    label: "Language"
  }, /*#__PURE__*/React.createElement(Seg, {
    options: ['EN', 'RU'],
    value: lang,
    onChange: setLang
  }))), /*#__PURE__*/React.createElement(GlassCard, {
    variant: "data",
    padding: 16,
    style: {
      borderRadius: 20,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Row, {
    icon: "help-circle-outline",
    label: "FAQ"
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "chevron-forward",
    style: {
      fontSize: 18,
      color: 'var(--t3)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: 'var(--hairline)'
    }
  }), /*#__PURE__*/React.createElement(Row, {
    icon: "shield-checkmark-outline",
    label: "Privacy & data"
  }, /*#__PURE__*/React.createElement("ion-icon", {
    name: "chevron-forward",
    style: {
      fontSize: 18,
      color: 'var(--t3)'
    }
  }))), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    block: true,
    icon: "log-out-outline"
  }, "Log out"));
}
window.ProfileScreen = ProfileScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.GlassCard = __ds_scope.GlassCard;

__ds_ns.IconChip = __ds_scope.IconChip;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatusCard = __ds_scope.StatusCard;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Switch = __ds_scope.Switch;

})();
