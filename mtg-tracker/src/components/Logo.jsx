import RingInscription from './RingInscription'

// Shinyu's Vault logo: a small ring with the inscription, in the theme's accent colour.
export default function Logo() {
  return (
    <span className="brand">
      <RingInscription className="logo-ring" size={64} rings={[{ r: 23, fontSize: 6.4, speed: 120, band: true }]} />
      <span className="brand-name">Shinyu's Vault</span>
    </span>
  )
}
