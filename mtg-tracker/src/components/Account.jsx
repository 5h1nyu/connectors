import { useState } from 'react'

const STATUS_TEXT = {
  synced: '✓ Synced',
  saving: 'Saving…',
  error: "⚠ Couldn't sync. Will retry when you make a change or reopen the app.",
}

// Log in so your collection syncs between phone and PC.
export default function Account({ sync }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const { user, status, auth } = sync

  if (status === 'not-set-up') {
    return (
      <section className="panel stack">
        <h2>Sync</h2>
        <p className="muted">Sync isn't switched on yet (Supabase details missing in src/config.js).</p>
      </section>
    )
  }

  if (user) {
    return (
      <section className="panel stack">
        <h2>Sync</h2>
        <p>Logged in as <strong>{user.email}</strong>. Your collection syncs to every device you log in on.</p>
        <p className={status === 'error' ? 'error' : 'muted'}>{STATUS_TEXT[status]}</p>
        <div><button className="secondary" onClick={auth.signOut}>Log out</button></div>
      </section>
    )
  }

  async function submit(action) {
    setMessage(null)
    const { data, error } = await auth[action](email, password)
    if (error) setMessage({ error: error.message })
    else if (action === 'signUp' && !data.session) setMessage({ ok: 'Account created. Check your email to confirm it, then log in here.' })
  }

  return (
    <section className="panel">
      <h2>Sync</h2>
      <p className="muted">Log in to keep your collection the same on your phone and PC.</p>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); submit('signIn') }}>
        <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <div className="row">
          <button>Log in</button>
          <button type="button" className="secondary" onClick={() => submit('signUp')} disabled={!email || password.length < 6}>
            Create account
          </button>
        </div>
      </form>
      {message?.error && <p className="error">{message.error}</p>}
      {message?.ok && <p>{message.ok}</p>}
    </section>
  )
}
