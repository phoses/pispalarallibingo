import { ref } from 'vue'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'
import { formatDuration, formatFoundAt, playerId, wordId } from '../utils/format.js'

function playerRef(username) {
  return doc(db, 'players', playerId(username))
}

function discoveryRef(word) {
  return doc(db, 'discoveredWords', wordId(word))
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

function sortDiscoveries(items) {
  return items.sort((a, b) => {
    if (a.foundAt && b.foundAt) return b.foundAt - a.foundAt
    if (a.foundAt) return -1
    if (b.foundAt) return 1
    return a.word.localeCompare(b.word, 'fi')
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
        grid: [],
        marked: [],
        phase: 'ready',
        startTime: null,
        endTime: null,
        shuffleLocked: false,
        updatedAt: serverTimestamp(),
      })
    }
  }

  async function registerWordDiscovery(username, word) {
    if (!isFirebaseConfigured() || !db || !username || !word) return
    const ref = discoveryRef(word)
    const foundAt = Date.now()
    try {
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref)
        if (!snap.exists()) {
          transaction.set(ref, {
            word,
            username: username.trim(),
            foundAt,
          })
        }
      })
    } catch (e) {
      console.error('Sanan löydön tallennus epäonnistui', e)
    }
  }

  async function isWordHeldByAnyPlayer(word) {
    const snap = await getDocs(collection(db, 'players'))
    return snap.docs.some((d) => d.data().foundWords?.includes(word))
  }

  async function addFoundWord(username, word) {
    if (!isFirebaseConfigured() || !username || !word) return false
    await ensurePlayer(username)
    const remote = await fetchPlayer(username)
    if (remote?.foundWords?.includes(word)) return false
    await registerWordDiscovery(username, word)
    await updateDoc(playerRef(username), {
      foundWords: arrayUnion(word),
      updatedAt: serverTimestamp(),
    })
    return true
  }

  async function removeFoundWord(username, word) {
    if (!isFirebaseConfigured() || !username || !word) return false
    await ensurePlayer(username)
    const remote = await fetchPlayer(username)
    if (!remote?.foundWords?.includes(word)) return false
    await updateDoc(playerRef(username), {
      foundWords: arrayRemove(word),
      updatedAt: serverTimestamp(),
    })
    const stillHeld = await isWordHeldByAnyPlayer(word)
    if (!stillHeld) {
      await deleteDoc(discoveryRef(word))
    }
    return true
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

  async function loadGameState(username) {
    if (!isFirebaseConfigured() || !username) return null
    await ensurePlayer(username)
    const data = await fetchPlayer(username)
    if (!data) return null
    return {
      grid: data.grid,
      marked: data.marked,
      phase: data.phase,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      shuffleLocked: data.shuffleLocked ?? false,
      bingoCount: data.wins?.length ?? 0,
      foundWords: data.foundWords ?? [],
    }
  }

  async function saveGameState(username, state) {
    if (!isFirebaseConfigured() || !username) return
    await ensurePlayer(username)
    await updateDoc(playerRef(username), {
      grid: state.grid,
      marked: state.marked,
      phase: state.phase,
      startTime: state.startTime,
      endTime: state.endTime,
      shuffleLocked: state.shuffleLocked,
      updatedAt: serverTimestamp(),
    })
  }

  async function loadDiscoveries(fallbackWords = []) {
    const discoveryMap = new Map()
    const snap = await getDocs(collection(db, 'discoveredWords'))
    for (const d of snap.docs) {
      const data = d.data()
      discoveryMap.set(data.word, {
        word: data.word,
        username: data.username ?? null,
        foundAt: data.foundAt ?? null,
        foundAtLabel: formatFoundAt(data.foundAt),
      })
    }
    for (const word of fallbackWords) {
      if (!discoveryMap.has(word)) {
        discoveryMap.set(word, {
          word,
          username: null,
          foundAt: null,
          foundAtLabel: '',
        })
      }
    }
    return sortDiscoveries([...discoveryMap.values()])
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
      globalFoundWords.value = await loadDiscoveries([...allWords])
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
    addFoundWord,
    removeFoundWord,
    recordWin,
    loadGameState,
    saveGameState,
    loadPlayerData,
    loadLeaderboard: loadPlayerData,
    isFirebaseConfigured,
  }
}
