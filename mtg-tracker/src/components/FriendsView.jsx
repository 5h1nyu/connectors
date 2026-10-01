import { useCallback, useEffect, useState } from 'react'
import PageHeader from './PageHeader'
import Avatar from './Avatar'
import AvatarPicker from './AvatarPicker'
import VisibilityPicker from './VisibilityPicker'
import VaultView from './VaultView'
import { acceptRequest, getFriendships, profileLink, removeFriendship, searchProfiles, sendRequest } from '../lib/social'

// First time: choose a username so friends can find you.
function ProfileSetup({ onSave, email }) {
  const [username, setUsername] = useState(email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))
  const [displayName, setDisplayName] = useState('')
  const [status, setStatus] = useState(null)
  return (
    <form
      className="panel stack setup"
      onSubmit={async (e) => {
        e.preventDefault()
        setStatus({ busy: true })
        try {
          await onSave({ username: username.toLowerCase(), display_name: displayName.trim() || null })
        } catch (err) {
          setStatus({ error: err.message })
        }
      }}
    >
      <h2>Pick a username</h2>
      <p className="muted">This is how friends find you. Lowercase letters, numbers and _ only.</p>
      <label>Username<input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required minLength={3} maxLength={20} pattern="[a-z0-9_]+" /></label>
      <label>Display name (optional)<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder="e.g. Shinyu" /></label>
      {status?.error && <p className="error">{status.error}</p>}
      <div><button disabled={status?.busy}>{status?.busy ? <><span className="spinner" /> Saving…</> : 'Save'}</button></div>
    </form>
  )
}

function PersonRow({ person, onOpen, children }) {
  return (
    <li className="person">
      <button className="person-main" onClick={onOpen} disabled={!onOpen}>
        <Avatar profile={person} size={44} />
        <span className="person-names">
          <strong>{person.display_name || person.username}</strong>
          <small className="muted">@{person.username}</small>
        </span>
      </button>
      <span className="row">{children}</span>
    </li>
  )
}

export default function FriendsView({ user, profileState, onGoToSettings, notify }) {
  const { profile, status, save } = profileState
  const [links, setLinks] = useState({ friends: [], incoming: [], outgoing: [] })
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [viewing, setViewing] = useState(null)
  const [picking, setPicking] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(() => {
    if (!user) return
    getFriendships(user.id).then(setLinks).catch((err) => setError(err.message))
  }, [user])
  useEffect(() => {
    if (profile) refresh()
  }, [profile, refresh])

  useEffect(() => {
    if (!user || query.trim().length < 2) return
    const timer = setTimeout(() => searchProfiles(query, user.id).then(setResults).catch(() => {}), 250)
    return () => clearTimeout(timer)
  }, [query, user])

  const run = (fn, message) => async () => {
    try {
      await fn()
      if (message) notify(message)
      refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!user) {
    return (
      <section>
        <PageHeader title="Friends" subtitle="See each other's decks and collections." />
        <div className="panel stack empty-state">
          <h2>Log in to add friends</h2>
          <p className="muted">Friends need an account so your decks can be shared. It's free and takes a minute.</p>
          <div><button onClick={onGoToSettings}>Log in or create an account</button></div>
        </div>
      </section>
    )
  }
  if (status === 'loading' || status === 'idle') return <p className="muted"><span className="spinner" /> Loading…</p>
  if (status === 'error') {
    return (
      <section>
        <PageHeader title="Friends" />
        <div className="notice error">Friends aren't set up in Supabase yet. Run <code>supabase/social.sql</code> in the SQL Editor (see the README), then refresh.</div>
      </section>
    )
  }
  if (status === 'missing') {
    return (
      <section>
        <PageHeader title="Friends" subtitle="First, make yourself findable." />
        <ProfileSetup onSave={save} email={user.email} />
      </section>
    )
  }
  if (viewing) return <VaultView profile={viewing} onBack={() => setViewing(null)} />

  const linkState = (id) =>
    links.friends.some((p) => p.id === id) ? 'friend' : links.outgoing.some((p) => p.id === id) ? 'sent' : links.incoming.some((p) => p.id === id) ? 'incoming' : null

  return (
    <section className="friends">
      <PageHeader title="Friends" subtitle={`${links.friends.length} friend${links.friends.length === 1 ? '' : 's'}`} />
      {error && <div className="notice error">{error}</div>}

      <div className="panel profile-card">
        <button className="avatar-edit" onClick={() => setPicking(true)} title="Change profile picture">
          <Avatar profile={profile} size={84} />
          <span className="edit-label">Change</span>
        </button>
        <div className="profile-info">
          <h2>{profile.display_name || profile.username}</h2>
          <p className="muted">@{profile.username}</p>
          <div className="row">
            <button className="secondary small-btn" onClick={() => navigator.clipboard.writeText(profileLink(profile.username)).then(() => setCopied(true))}>
              {copied ? '✓ Link copied' : 'Copy my profile link'}
            </button>
          </div>
        </div>
        <div className="profile-visibility">
          <span className="muted small">Who can see your loose cards</span>
          <VisibilityPicker value={profile.collection_visibility} onChange={(v) => save({ collection_visibility: v }).then(() => notify('Collection visibility saved.'))} />
          <span className="muted small">Each deck has its own setting on its page.</span>
        </div>
      </div>

      <div className="friends-grid">
        <div className="panel">
          <h2>Add a friend</h2>
          <input type="search" className="big-search" placeholder="Search by username" value={query} onChange={(e) => setQuery(e.target.value)} />
          <ul className="people">
            {query.trim().length >= 2 && results.length === 0 && <li className="muted">No one found. Check the spelling with your friend.</li>}
            {query.trim().length >= 2 && results.map((p) => (
              <PersonRow key={p.id} person={p}>
                {linkState(p.id) === 'friend' && <span className="muted small">Friends ✓</span>}
                {linkState(p.id) === 'sent' && <span className="muted small">Request sent</span>}
                {linkState(p.id) === 'incoming' && <button className="small-btn" onClick={run(() => acceptRequest(user.id, p.id), `You and ${p.username} are now friends.`)}>Accept</button>}
                {!linkState(p.id) && <button className="small-btn" onClick={run(() => sendRequest(user.id, p.id), `Request sent to ${p.username}.`)}>Add friend</button>}
              </PersonRow>
            ))}
          </ul>

          {links.incoming.length > 0 && (
            <>
              <h3>Requests for you</h3>
              <ul className="people">
                {links.incoming.map((p) => (
                  <PersonRow key={p.id} person={p}>
                    <button className="small-btn" onClick={run(() => acceptRequest(user.id, p.id), `You and ${p.username} are now friends.`)}>Accept</button>
                    <button className="secondary small-btn" onClick={run(() => removeFriendship(user.id, p.id))}>Decline</button>
                  </PersonRow>
                ))}
              </ul>
            </>
          )}
          {links.outgoing.length > 0 && (
            <>
              <h3>Waiting for them</h3>
              <ul className="people">
                {links.outgoing.map((p) => (
                  <PersonRow key={p.id} person={p}>
                    <button className="secondary small-btn" onClick={run(() => removeFriendship(user.id, p.id))}>Cancel</button>
                  </PersonRow>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="panel">
          <h2>Your friends</h2>
          {links.friends.length === 0 ? (
            <p className="muted">No friends yet. Search for their username, or send them your profile link.</p>
          ) : (
            <ul className="people">
              {links.friends.map((p) => (
                <PersonRow key={p.id} person={p} onOpen={() => setViewing(p)}>
                  <button className="small-btn" onClick={() => setViewing(p)}>View vault</button>
                  <button className="icon" title="Remove friend" onClick={() => confirm(`Remove ${p.username} as a friend?`) && run(() => removeFriendship(user.id, p.id))()}>✕</button>
                </PersonRow>
              ))}
            </ul>
          )}
        </div>
      </div>

      {picking && (
        <AvatarPicker
          userId={user.id}
          onCancel={() => setPicking(false)}
          onPick={async (url) => {
            setPicking(false)
            try {
              await save({ avatar_url: url })
              notify('Profile picture updated.')
            } catch (err) {
              setError(err.message)
            }
          }}
        />
      )}
    </section>
  )
}
