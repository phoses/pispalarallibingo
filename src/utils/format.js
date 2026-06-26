export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function playerId(username) {
  return username.trim().toLowerCase().replace(/[^a-z0-9åäöü_-]/gi, '_')
}
