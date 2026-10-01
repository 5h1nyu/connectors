import { useState } from 'react'

// Supabase's error messages, made friendlier.
function explain(error) {
  const msg = error.message ?? String(error)
  if (/invalid login credentials/i.test(msg)) return 'Email or password is wrong. Tick "Show password" to check it, or use "Forgot password?".'
  if (/email not confirmed/i.test(msg)) return 'Confirm your email first: open the email from Supabase (check spam too).'
  if (/rate limit/i.test(msg)) return 'Too many emails sent in the last hour. Wait a bit and try again.'
  if (/already registered/i.test(msg)) return 'That email already has an account. Use the Log in tab.'
  return msg
}

function timeAgo(iso) {
  if (!iso) return null
  const s = Math.round((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return new Date(iso).toLocaleDateString()
}

function Notice({ kind, children }) {
  const icon = { error: '⚠', ok: '✓', info: '✉' }[kind]
  return <div className={`notice ${kind}`}><span className="notice-icon">{icon}</span><div>{children}</div></div>
}

// Log in so your collection syncs between phone and PC.
export default function Account({ sync }) {
  const [tab, setTab] = useState('login') // 'login' | 'signup' | 'check-email'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(null) // which button is working
  const [message, setMessage] = useState(null) // { kind, text }
  const { user, recovering, status, auth } = sync

  async function run(name, fn) {
    setBusy(name)
    setMessage(null)
    try {
      await fn()
    } catch (err) {
      setMessage({ kind: 'error', text: explain(err) })
    }
    setBusy(null)
  }

  const passwordField = (placeholder, autoComplete) => (
    <>
      <input type={showPassword ? 'text' : 'password'} placeholder={placeholder} autoComplete={autoComplete}
        autoCapitalize="off" autoCorrect="off" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <label className="row small">
        <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
        Show password
      </label>
    </>
  )
  const spinnerOr = (name, label, working) => (busy === name ? <><span className="spinner" /> {working}</> : label)

  if (status === 'not-set-up') {
    return <section className="panel"><h2>Sync</h2><p className="muted">Sync isn't switched on (Supabase details missing in src/config.js).</p></section>
  }

  // Came back from a "reset password" email.
  if (user && recovering) {
    return (
      <section className="panel account">
        <h2>Choose a new password</h2>
        <form className="stack" onSubmit={(e) => {
          e.preventDefault()
          run('reset', async () => {
            const { error } = await auth.setNewPassword(password)
            if (error) throw error
            setPassword('')
            setMessage({ kind: 'ok', text: 'Password saved. Use it to log in on your other devices.' })
          })
        }}>
          {passwordField('New password (6+ characters)', 'new-password')}
          <button disabled={!!busy}>{spinnerOr('reset', 'Save new password', 'Saving…')}</button>
        </form>
        {message && <Notice kind={message.kind}>{message.text}</Notice>}
      </section>
    )
  }

  if (user) {
    const state = {
      synced: ['ok', '✓ Everything is synced', `Last saved ${timeAgo(sync.lastSyncedAt) ?? 'just now'}`],
      saving: ['info', 'Saving your changes…', 'This takes a second or two.'],
      error: ['error', "Couldn't sync", sync.errorDetail ? `Details: ${sync.errorDetail}` : 'Will retry when you make a change or reopen the app.'],
    }[status]
    return (
      <section className="panel account">
        <div className="row">
          <span className="avatar">{user.email[0].toUpperCase()}</span>
          <div>
            <strong>{user.email}</strong>
            <div className="muted small">Your collection is the same on every device you log in on.</div>
          </div>
        </div>
        <div className={`sync-state ${state[0]}`}>
          {status === 'saving' ? <span className="spinner" /> : <span className="notice-icon">{status === 'error' ? '⚠' : '✓'}</span>}
          <div><strong>{state[1]}</strong><div className="small">{state[2]}</div></div>
          {status === 'error' && <button onClick={sync.retry}>Try again</button>}
        </div>
        {message && <Notice kind={message.kind}>{message.text}</Notice>}
        <div><button className="secondary" onClick={auth.signOut}>Log out</button></div>
      </section>
    )
  }

  if (tab === 'check-email') {
    return (
      <section className="panel account">
        <div className="big-icon">✉</div>
        <h2>Check your email</h2>
        <ol className="steps">
          <li>Open the email from Supabase sent to <strong>{email.trim()}</strong> (check spam too).</li>
          <li>Click the link inside. It brings you back here, logged in.</li>
          <li>If it doesn't, come back to this tab and log in with your email and password.</li>
        </ol>
        <button className="secondary" onClick={() => setTab('login')}>Go to log in</button>
      </section>
    )
  }

  return (
    <section className="panel account">
      <h2>Sync your collection</h2>
      <p className="muted">Log in on your phone and PC with the same account and your decks stay identical.</p>
      <div className="tabs segmented">
        <button className={tab === 'login' ? 'active' : ''} onClick={() => { setTab('login'); setMessage(null) }}>Log in</button>
        <button className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setMessage(null) }}>Create account</button>
      </div>

      <form className="stack" onSubmit={(e) => {
        e.preventDefault()
        if (tab === 'login') {
          run('login', async () => {
            const { error } = await auth.signIn(email, password)
            if (error) throw error
          })
        } else {
          run('signup', async () => {
            const { data, error } = await auth.signUp(email, password)
            if (error) throw error
            if (!data.session) setTab('check-email') // otherwise you're logged in straight away
          })
        }
      }}>
        <input type="email" placeholder="Email" autoComplete="email" autoCapitalize="off" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {passwordField(tab === 'signup' ? 'Choose a password (6+ characters)' : 'Password', tab === 'signup' ? 'new-password' : 'current-password')}
        <button disabled={!!busy}>
          {tab === 'login' ? spinnerOr('login', 'Log in', 'Logging in…') : spinnerOr('signup', 'Create account', 'Creating account…')}
        </button>
        {tab === 'login' && (
          <button type="button" className="link" disabled={!!busy} onClick={() => {
            if (!email.trim()) return setMessage({ kind: 'error', text: 'Type your email first, then press "Forgot password?".' })
            run('forgot', async () => {
              const { error } = await auth.resetPassword(email)
              if (error) throw error
              setMessage({ kind: 'info', text: 'If that email has an account, a reset link is on its way. Open it on this device.' })
            })
          }}>{spinnerOr('forgot', 'Forgot password?', 'Sending…')}</button>
        )}
      </form>
      {message && <Notice kind={message.kind}>{message.text}</Notice>}
    </section>
  )
}
