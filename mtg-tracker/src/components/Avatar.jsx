// A round profile picture, or the first letter of the name if there isn't one.
export default function Avatar({ profile, size = 40 }) {
  const name = profile?.display_name || profile?.username || '?'
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : name[0].toUpperCase()}
    </span>
  )
}
