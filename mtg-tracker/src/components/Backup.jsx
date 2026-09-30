// Download your data as a file, or load it back (e.g. to move from PC to phone until sync exists).
export default function Backup({ state, onRestore }) {
  function exportFile() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mtg-collection-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function importFile(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data.decks) || !Array.isArray(data.loose)) throw new Error('not a backup file')
      if (confirm(`Replace everything here with this backup (${data.decks.length} decks)?`)) onRestore(data)
    } catch (err) {
      alert(`Couldn't read that file: ${err.message}`)
    }
    e.target.value = ''
  }

  return (
    <section className="panel stack">
      <h2>Backup</h2>
      <p className="muted">
        Your decks are saved in this browser only. Download a backup now and then, and use it to copy
        your collection to another device.
      </p>
      <button onClick={exportFile}>Download backup</button>
      <label className="file-label">
        Restore from a backup file
        <input type="file" accept="application/json,.json" onChange={importFile} />
      </label>
    </section>
  )
}
