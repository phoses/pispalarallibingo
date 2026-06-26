import { ref } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'
import { formatDuration, playerId } from '../utils/format.js'

function playerRef(username) {
  return doc(db, 'players', playerId(username))
}

function bestWin(wins) {
  if (!wins?.length) return null
  return wins.reduce((a, b) => (a.timeMs < b.timeMs ? a : b))
}

function sortLeaderboard(rows) {
  return rows.sort((a, b) => {
    const aHasWin = a.bestTimeMs != null
    const bHasWin = b.bestTimeMs != null

    if (aHasWin && bHasWin) return a.bestTimeMs - b.bestTimeMs
    if (aHasWin) return -1
    if (bHasWin) return 1
    if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount
    return a.username.localeCompare(b.username, 'fi')
  })
}

export function usePlayerStats() {
  const leaderboard = ref([])
  const globalFoundWords = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchPlayer(username) {
    if (!isFirebaseConfigured() || !username) return null
    const snap = await getDoc(playerRef(username))
    if (!snap.exists()) return null
    return snap.data()
  }

  async function ensurePlayer(username) {
    if (!isFirebaseConfigured() || !username) return
    const ref = playerRef(username)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        username: username.trim(),
        foundWords: [],
        wins: [],
        updatedAt: serverTimestamp(),
      })
    }
  }

  async function syncFoundWords(username, words) {
    if (!isFirebaseConfigured() || !username || words.length === 0) return
    await ensurePlayer(username)
    const ref = playerRef(username)
    const remote = await fetchPlayer(username)
    const remoteSet = new Set(remote?.foundWords ?? [])
    const missing = words.filter((w) => !remoteSet.has(w))
    if (missing.length === 0) return
    await updateDoc(ref, {
      foundWords: arrayUnion(...missing),
      updatedAt: serverTimestamp(),
    })
  }

  async function addFoundWord(username, word) {
    if (!isFirebaseConfigured() || !username || !word) return
    await ensurePlayer(username)
    await updateDoc(playerRef(username), {
      foundWords: arrayUnion(word),
      updatedAt: serverTimestamp(),
    })
  }

  async function recordWin(username, timeMs) {
    if (!isFirebaseConfigured() || !username || !timeMs) return
    await ensurePlayer(username)
    await updateDoc(playerRef(username), {
      wins: arrayUnion({
        timeMs,
        time: formatDuration(timeMs),
        at: Date.now(),
      }),
      updatedAt: serverTimestamp(),
    })
  }

  async function mergePlayerData(username, localWords) {
    if (!isFirebaseConfigured() || !username) return localWords
    await ensurePlayer(username)
    const remote = await fetchPlayer(username)
    const merged = [...new Set([...(remote?.foundWords ?? []), ...localWords])]
    const remoteSet = new Set(remote?.foundWords ?? [])
    const missing = merged.filter((w) => !remoteSet.has(w))
    if (missing.length > 0) {
      await updateDoc(playerRef(username), {
        foundWords: arrayUnion(...missing),
        updatedAt: serverTimestamp(),
      })
    }
    return merged
  }

  async function loadPlayerData() {
    loading.value = true
    error.value = null
    try {
      if (!isFirebaseConfigured() || !db) {
        leaderboard.value = []
        globalFoundWords.value = []
        error.value = 'Firebase ei ole konfiguroitu'
        return
      }
      const snap = await getDocs(collection(db, 'players'))
      const allWords = new Set()
      const rows = snap.docs.map((d) => {
        const data = d.data()
        for (const word of data.foundWords ?? []) {
          allWords.add(word)
        }
        const best = bestWin(data.wins)
        return {
          username: data.username ?? d.id,
          wordCount: data.foundWords?.length ?? 0,
          bestTime: best?.time ?? null,
          bestTimeMs: best?.timeMs ?? null,
          hasWin: Boolean(best),
        }
      })
      leaderboard.value = sortLeaderboard(rows)
      globalFoundWords.value = [...allWords].sort((a, b) => a.localeCompare(b, 'fi'))
    } catch (e) {
      error.value = 'Tietojen lataus epäonnistui'
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return {
    leaderboard,
    globalFoundWords,
    loading,
    error,
    fetchPlayer,
    syncFoundWords,
    addFoundWord,
    recordWin,
    mergePlayerData,
    loadPlayerData,
    loadLeaderboard: loadPlayerData,
    isFirebaseConfigured,
  }
}
