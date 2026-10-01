import { useState } from 'react'

const STATUS_TEXT = {
  synced: '✓ Synced',
  saving: 'Saving…',
  error: "⚠ Couldn't sync. Will retry when you make a change or reopen the app.",
}

// Supabase's error messages, made friendlier.
function explain(error) {
  if (/invalid login credentials/i.test(error.message)) {
    return 'Email or password is wrong. Tick "Show password" to check it, or use "Forgot password?" to set a new one.'
  }
  if (/email not confirmed/i.test(error.message)) return 'Confirm your email first: check your inbox (and spam) for the Supabase email.'
  return error.message
}

function PasswordInput({ value, onChange, show, autoComplete, placeholder = 'Password' }) {
  return (
    <input
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      autoComplete={autoComplete}
      autoCapitalize="off"
      autoCorrect="off"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      minLength={6}
    />
  )
}

// Log in so your collection syncs between phone and PC.
export default function Account({ sync }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState(null)
  const { user, recovering, status, auth } = sync

  if (status === 'not-set-up') {
    return (
      <section className="panel stack">
        <h2>Sync</h2>
        <p className="muted">Sync isn't switched on yet (Supabase details missing in src/config.js).</p>
      </section>
    )
  }

  // Came back from a "reset password" email: choose a new password.
  if (user && recovering) {
    return (
      <section className="panel">
        <h2>Set a new password</h2>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault()
            const { error } = await auth.setNewPassword(password)
            setMessage(error ? { error: explain(error) } : { ok: 'Password updated. Use it to log in on your other devices.' })
            setPassword('')
          }}
        >
          <PasswordInput value={password} onChange={setPassword} show={showPassword} autoComplete="new-password" placeholder="New password (6+ characters)" />
          <ShowToggle checked={showPassword} onChange={setShowPassword} />
          <div><button>Save new password</button></div>
        </form>
        {message?.error && <p className="error">{message.error}</p>}
      </section>
    )
  }

  if (user) {
    return (
      <section className="panel stack">
        <h2>Sync</h2>
        <p>Logged in as <strong>{user.email}</strong>. Your collection syncs to every device you log in on.</p>
        {message?.ok && <p>{message.ok}</p>}
        <p className={status === 'error' ? 'error' : 'muted'}>{STATUS_TEXT[status]}</p>
        <div><button className="secondary" onClick={auth.signOut}>Log out</button></div>
      </section>
    )
  }

  async function submit(action) {
    setMessage(null)
    const { data, error } = await auth[action](email, password)
    if (error) setMessage({ error: explain(error) })
    else if (action === 'signUp' && !data.session) setMessage({ ok: 'Account created. Check your email to confirm it, then log in here.' })
  }

  async function forgot() {
    if (!email.trim()) return setMessage({ error: 'Type your email above first, then press "Forgot password?".' })
    const { error } = await auth.resetPassword(email)
    setMessage(error ? { error: explain(error) } : { ok: `If ${email.trim()} has an account, a reset link is on its way. Open it on this device.` })
  }

  return (
    <section className="panel">
      <h2>Sync</h2>
      <p className="muted">Log in to keep your collection the same on your phone and PC.</p>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); submit('signIn') }}>
        <input type="email" placeholder="Email" autoComplete="email" autoCapitalize="off" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <PasswordInput value={password} onChange={setPassword} show={showPassword} autoComplete="current-password" />
        <ShowToggle checked={showPassword} onChange={setShowPassword} />
        <div className="row">
          <button>Log in</button>
          <button type="button" className="secondary" onClick={() => submit('signUp')} disabled={!email || password.length < 6}>
            Create account
          </button>
          <button type="button" className="link" onClick={forgot}>Forgot password?</button>
        </div>
      </form>
      {message?.error && <p className="error">{message.error}</p>}
      {message?.ok && <p>{message.ok}</p>}
    </section>
  )
}

function ShowToggle({ checked, onChange }) {
  return (
    <label className="row small">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      Show password
    </label>
  )
}
