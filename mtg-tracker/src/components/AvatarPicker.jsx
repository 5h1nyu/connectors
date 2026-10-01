import { useState } from 'react'
import CardSearch from './CardSearch'
import PrintingPicker from './PrintingPicker'
import { uploadAvatar } from '../lib/social'
import Portal from './Portal'

// Change your profile picture: any Magic card's artwork, or a photo of your own.
export default function AvatarPicker({ userId, onPick, onCancel }) {
  const [tab, setTab] = useState('card')
  const [name, setName] = useState('')
  const [picking, setPicking] = useState(false)
  const [status, setStatus] = useState(null)

  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    setStatus({ busy: true })
    try {
      onPick(await uploadAvatar(userId, file))
    } catch (err) {
      setStatus({ error: `Upload failed: ${err.message}` })
    }
  }

  return (
    <Portal>
    <div className="dialog-backdrop top" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Profile picture</h2>
        <div className="tabs segmented">
          <button className={tab === 'card' ? 'active' : ''} onClick={() => setTab('card')}>Card art</button>
          <button className={tab === 'photo' ? 'active' : ''} onClick={() => setTab('photo')}>Upload a photo</button>
        </div>
        {tab === 'card' ? (
          <>
            <p className="muted small">Search any card, then pick the printing whose art you like.</p>
            <CardSearch value={name} onChange={setName} placeholder="e.g. Sheoldred, the Apocalypse" autoFocus />
            <button disabled={name.trim().length < 3} onClick={() => setPicking(true)}>Choose art</button>
          </>
        ) : (
          <>
            <p className="muted small">Any photo. It's cropped to a square and shrunk before uploading.</p>
            <input type="file" accept="image/*" onChange={upload} disabled={status?.busy} />
            {status?.busy && <p className="muted"><span className="spinner" /> Uploading…</p>}
          </>
        )}
        {status?.error && <p className="error">{status.error}</p>}
        <div className="row end"><button className="secondary" onClick={onCancel}>Cancel</button></div>
        {picking && (
          <PrintingPicker
            name={name.trim()}
            onCancel={() => setPicking(false)}
            onPick={(card) => onPick(card.artCrop ?? card.image)}
          />
        )}
      </div>
    </div>
    </Portal>
  )
}
