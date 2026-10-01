import RingInscription from './RingInscription'

// Shinyu's Vault logo: a gold ring carrying the glowing Ring verse in Tengwar.
export default function Logo() {
  return (
    <span className="brand">
      <RingInscription className="logo-ring" size={64} rings={[{ r: 23, fontSize: 6.4, speed: 90, band: true }]} />
      <span className="brand-name">Shinyu's Vault</span>
    </span>
  )
}
