// Profiles, friends and sharing, all through Supabase (see supabase/social.sql).
import { supabase } from './supabase'

export const VISIBILITY = {
  private: { icon: '🔒', label: 'Private', hint: 'Only you' },
  friends: { icon: '👥', label: 'Friends', hint: 'You and your friends' },
  public: { icon: '🌐', label: 'Public', hint: 'Anyone with your profile link' },
}

function check({ data, error }) {
  if (error) throw error
  return data
}

export const profileLink = (username) =>
  `${window.location.origin}${window.location.pathname}#/u/${encodeURIComponent(username)}`

export async function getProfile(id) {
  return check(await supabase.from('profiles').select('*').eq('id', id).maybeSingle())
}

export async function getProfileByUsername(username) {
  return check(await supabase.from('profiles').select('*').eq('username', username.toLowerCase()).maybeSingle())
}

export async function saveProfile(profile) {
  const result = await supabase.from('profiles').upsert(profile).select().single()
  if (result.error?.code === '23505') throw new Error('That username is taken. Try another one.')
  if (result.error?.code === '23514') throw new Error('Usernames are 3–20 characters: lowercase letters, numbers and _ only.')
  return check(result)
}

export async function searchProfiles(query, myId) {
  const q = query.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (q.length < 2) return []
  return check(
    await supabase.from('profiles').select('*').ilike('username', `%${q}%`).neq('id', myId).limit(8),
  )
}

// Everyone you're connected to: { friends, incoming, outgoing }, each a list of profiles.
export async function getFriendships(myId) {
  const rows = check(await supabase.from('friendships').select('*'))
  const otherId = (r) => (r.requester === myId ? r.addressee : r.requester)
  const ids = [...new Set(rows.map(otherId))]
  const profiles = ids.length ? check(await supabase.from('profiles').select('*').in('id', ids)) : []
  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]))
  const pick = (filter) => rows.filter(filter).map((r) => byId[otherId(r)]).filter(Boolean)
  return {
    friends: pick((r) => r.status === 'accepted'),
    incoming: pick((r) => r.status === 'pending' && r.addressee === myId),
    outgoing: pick((r) => r.status === 'pending' && r.requester === myId),
  }
}

export async function sendRequest(myId, otherId) {
  // If they already asked you, adding them back just accepts.
  const theirs = check(
    await supabase.from('friendships').select('*').eq('requester', otherId).eq('addressee', myId).maybeSingle(),
  )
  if (theirs) return acceptRequest(myId, otherId)
  check(await supabase.from('friendships').insert({ requester: myId, addressee: otherId }))
}

export async function acceptRequest(myId, otherId) {
  check(await supabase.from('friendships').update({ status: 'accepted' }).eq('requester', otherId).eq('addressee', myId))
}

// Decline, cancel or unfriend: removes the link either way round.
export async function removeFriendship(myId, otherId) {
  check(
    await supabase
      .from('friendships')
      .delete()
      .or(`and(requester.eq.${myId},addressee.eq.${otherId}),and(requester.eq.${otherId},addressee.eq.${myId})`),
  )
}

// What you're allowed to see of someone's vault: { decks, loose (or null), relationship }
export async function getSharedVault(userId) {
  return check(await supabase.rpc('shared_collection', { target: userId }))
}

// Shrink a photo to a 256px square and upload it as your profile picture. Returns its URL.
export async function uploadAvatar(myId, file) {
  const bitmap = await createImageBitmap(file)
  const size = 256
  const canvas = Object.assign(document.createElement('canvas'), { width: size, height: size })
  const side = Math.min(bitmap.width, bitmap.height)
  canvas
    .getContext('2d')
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  const path = `${myId}/avatar.webp`
  check(await supabase.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/webp' }))
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
