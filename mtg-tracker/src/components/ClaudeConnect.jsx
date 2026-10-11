import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { SUPABASE_URL } from '../config'

const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
async function sha256(text) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))))
}

// Make (or turn off) your private link that lets Claude read and edit your vault.
export default function ClaudeConnect({ user, notify }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'off' | 'on' | 'not-set-up'
  const [link, setLink] = useState(null) // only shown right after making it
  const [copied, setCopied] = useState(false)

  const check = useCallback(async () => {
    const { data, error } = await supabase.from('claude_keys').select('created_at').eq('user_id', user.id).maybeSingle()
    setStatus(error ? 'not-set-up' : data ? 'on' : 'off')
  }, [user.id])
  useEffect(() => {
    // check() only sets state after waiting for Supabase.
    // oxlint-disable-next-line react/set-state-in-effect
    check()
  }, [check])

  async function makeLink() {
    const key = hex(crypto.getRandomValues(new Uint8Array(32)))
    const { error } = await supabase
      .from('claude_keys')
      .upsert({ user_id: user.id, key_hash: await sha256(key), created_at: new Date().toISOString() })
    if (error) return setStatus('not-set-up')
    setLink(`${SUPABASE_URL}/functions/v1/vault-mcp/${key}`)
    setStatus('on')
    setCopied(false)
  }

  async function turnOff() {
    if (!confirm('Turn off the Claude connector? Claude will no longer be able to see or change your vault.')) return
    await supabase.from('claude_keys').delete().eq('user_id', user.id)
    setLink(null)
    setStatus('off')
    notify('Claude connector turned off.')
  }

  return (
    <div className="panel claude-connect">
      <h2>Connect Claude</h2>
      <p className="muted">
        Let Claude read and edit your vault from any Claude chat: "add Sol Ring to my Atraxa deck", "what do I own that fits a
        Yennett deck?", "make me a brew and tell me what to buy". Changes show up here within about 20 seconds.
      </p>

      {status === 'loading' && <p className="muted"><span className="spinner" /> Checking…</p>}
      {status === 'not-set-up' && (
        <div className="notice info">
          <div>The connector isn't set up in Supabase yet. Follow <strong>Connect Claude</strong> in the README (run <code>supabase/claude-connector.sql</code> and deploy the <code>vault-mcp</code> function), then refresh.</div>
        </div>
      )}
      {status === 'off' && <button onClick={makeLink}>Make my Claude link</button>}
      {status === 'on' && !link && (
        <div className="row">
          <span className="ok">✓ Connected</span>
          <button className="secondary small-btn" onClick={makeLink}>Make a new link</button>
          <button className="secondary small-btn danger" onClick={turnOff}>Turn off</button>
        </div>
      )}
      {link && (
        <div className="stack">
          <div className="notice ok">
            <div>
              <strong>Your private link</strong> (shown once; it's like a password, so don't share it):
              <code className="secret-link">{link}</code>
            </div>
          </div>
          <div className="row">
            <button onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true))}>{copied ? '✓ Copied' : 'Copy link'}</button>
            <button className="secondary small-btn danger" onClick={turnOff}>Turn off</button>
          </div>
          <ol className="steps">
            <li>In Claude, open <strong>Settings → Connectors → Add custom connector</strong>.</li>
            <li>Name it <em>Shinyu's Vault</em>, paste the link as the URL, and click <strong>Add</strong>.</li>
            <li>In a chat, turn the connector on (the tools/search menu) and ask away.</li>
          </ol>
        </div>
      )}
    </div>
  )
}
