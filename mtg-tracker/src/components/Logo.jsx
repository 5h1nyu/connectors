// Shinyu's Vault logo: a gold ring with a glowing inscription, after The One Ring.
export default function Logo() {
  return (
    <span className="brand">
      <svg className="logo-ring" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff1b8" />
            <stop offset="0.3" stopColor="#e5bb5f" />
            <stop offset="0.55" stopColor="#8f5f1d" />
            <stop offset="0.8" stopColor="#f0cd78" />
            <stop offset="1" stopColor="#fff4c2" />
          </linearGradient>
          <path id="ring-text" d="M32,13 a19,19 0 1,1 -0.01,0" />
        </defs>
        <circle cx="32" cy="32" r="24" fill="none" stroke="url(#ring-gold)" strokeWidth="9" />
        <circle cx="32" cy="32" r="28.2" fill="none" stroke="#fff1b8" strokeOpacity="0.5" strokeWidth="0.6" />
        <text fontSize="6.2" fill="#ff8a3d" letterSpacing="0.6" fontFamily="Cinzel, serif" opacity="0.95">
          <textPath href="#ring-text">ONE VAULT TO HOLD THEM ALL ·</textPath>
        </text>
      </svg>
      <span>
        <span className="brand-name">Shinyu's Vault</span>
        <span className="brand-tag">One vault to hold them all</span>
      </span>
    </span>
  )
}
