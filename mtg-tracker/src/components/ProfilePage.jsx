import { useState } from 'react'
import PageHeader from './PageHeader'
import Avatar from './Avatar'
import AvatarPicker from './AvatarPicker'
import VisibilityPicker from './VisibilityPicker'
import Account from './Account'
import { profileLink } from '../lib/social'
import { deckSize } from '../lib/collection'

// Choose (or change) your username and display name.
export function ProfileForm({ profile, email, onSave, onCancel, title = 'Pick a username' }) {
  const [username, setUsername] = useState(profile?.username ?? email.split('@')[0].slice(0, 30))
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [status, setStatus] = useState(null)
  return (
    <form
      className="panel stack setup"
      onSubmit={async (e) => {
        e.preventDefault()
        setStatus({ busy: true })
        try {
          await onSave({ username: username.trim(), display_name: displayName.trim() || null })
          setStatus(null)
          onCancel?.()
        } catch (err) {
          setStatus({ error: err.message })
        }
      }}
    >
      <h2>{title}</h2>
      <p className="muted">This is how friends find you. Any letters, numbers, spaces or symbols, 2–30 characters.</p>
      <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} maxLength={30} /></label>
      <label>Display name (optional)<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder="e.g. Shinyu" /></label>
      {status?.error && <p className="error">{status.error}</p>}
      <div className="row">
        <button disabled={status?.busy}>{status?.busy ? <><span className="spinner" /> Saving…</> : 'Save'}</button>
        {onCancel && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

// Your own profile: picture, names, link, and who can see what.
export default function ProfilePage({ sync, profileState, decks, onDeckVisibility, onOpenSettings, onPreview, notify }) {
  const { user } = sync
  const { profile, status, save } = profileState
  const [editing, setEditing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!user) {
    return (
      <section className="me">
        <PageHeader title="Your profile" subtitle="Log in to sync your vault and add friends." />
        <Account sync={sync} />
      </section>
    )
  }
  if (status === 'loading' || status === 'idle') return <p className="muted"><span className="spinner" /> Loading…</p>
  if (status === 'error') {
    return (
      <section className="me">
        <PageHeader title="Your profile" />
        <div className="notice error">Profiles aren't set up in Supabase yet. Run <code>supabase/social.sql</code> in the SQL Editor (see the README), then refresh.</div>
      </section>
    )
  }
  if (status === 'missing') {
    return (
      <section className="me">
        <PageHeader title="Your profile" subtitle="Make yourself findable." />
        <ProfileForm email={user.email} onSave={save} />
      </section>
    )
  }

  const shareable = decks.filter((d) => !d.brew)
  return (
    <section className="me">
      <PageHeader
        title="Your profile"
        actions={
          <>
            <button className="secondary" onClick={onPreview}>See what others see</button>
            <button className="secondary" onClick={onOpenSettings}>Settings</button>
          </>
        }
      />

      {editing ? (
        <ProfileForm profile={profile} email={user.email} title="Edit profile" onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        <div className="panel profile-card">
          <button className="avatar-edit" onClick={() => setPicking(true)} title="Change profile picture">
            <Avatar profile={profile} size={96} />
            <span className="edit-label">Change</span>
          </button>
          <div className="profile-info">
            <h2>{profile.display_name || profile.username}</h2>
            <p className="muted">@{profile.username} · {user.email}</p>
            <div className="row">
              <button className="secondary small-btn" onClick={() => setEditing(true)}>Edit name</button>
              <button className="secondary small-btn" onClick={() => navigator.clipboard.writeText(profileLink(profile.username)).then(() => setCopied(true))}>
                {copied ? '✓ Link copied' : 'Copy profile link'}
              </button>
              <button className="secondary small-btn" onClick={() => sync.auth.signOut()}>Log out</button>
            </div>
          </div>
        </div>
      )}

      <div className="panel sharing">
        <h2>Who can see what</h2>
        <div className="share-row">
          <span><strong>Loose cards</strong><small className="muted">Singles, binder, everything not in a deck</small></span>
          <VisibilityPicker
            value={profile.collection_visibility}
            onChange={(v) => save({ collection_visibility: v }).then(() => notify('✓ Saved who can see your loose cards.'))}
          />
        </div>
        {shareable.map((d) => (
          <div key={d.id} className="share-row">
            <span><strong>{d.name}</strong><small className="muted">{deckSize(d)} cards</small></span>
            <VisibilityPicker value={d.visibility} onChange={(v) => onDeckVisibility(d.id, v)} />
          </div>
        ))}
        <p className="muted small">🔒 Private: only you · 👥 Friends: you and your friends · 🌐 Public: anyone with your profile link</p>
      </div>

      {picking && (
        <AvatarPicker
          userId={user.id}
          onCancel={() => setPicking(false)}
          onPick={async (url) => {
            setPicking(false)
            await save({ avatar_url: url })
            notify('✓ Profile picture updated.')
          }}
        />
      )}
    </section>
  )
}
