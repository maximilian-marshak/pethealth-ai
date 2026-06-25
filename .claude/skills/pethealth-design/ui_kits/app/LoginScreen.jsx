// ════════════════════════════════════════════════════════════
// PetHealthAI UI kit — Login screen.
// ════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const { Button, Input } = window.PetHealthAIDesignSystem_fd90ba;
  const [signup, setSignup] = React.useState(false);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px 40px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
        <img src="../../assets/icon.png" alt="PetHealthAI"
          style={{ width: 84, height: 84, borderRadius: 22, boxShadow: 'var(--shadow-2)', marginBottom: 18 }} />
        <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.5px' }}>
          PetHealth<span style={{ color: 'var(--accent)' }}>AI</span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--t2)', marginTop: 4 }}>Your pet's health companion</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Input icon="mail-outline" placeholder="Email" defaultValue="max@pethealth.ai" />
        <Input icon="lock-closed-outline" type="password" placeholder="Password" defaultValue="paws1234" />
        {signup && <Input icon="person-outline" placeholder="Name" />}
        <Button block size="lg" onClick={onLogin} style={{ marginTop: 6 }}>
          {signup ? 'Create account' : 'Log in'}
        </Button>
        <button onClick={() => setSignup(!signup)} style={{
          background: 'none', border: 'none', cursor: 'pointer', marginTop: 4,
          color: 'var(--accent-press)', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
        }}>
          {signup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
window.LoginScreen = LoginScreen;
