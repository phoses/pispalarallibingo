import { ref, computed, onUnmounted } from 'vue'
import { bingoWords, useFreeCenter } from '../data/bingoWords.js'
import { formatDuration } from '../utils/format.js'

const AUTH_STORAGE_KEY = 'pispala-bingo-auth'
export const TAB_STORAGE_KEY = 'pispala-bingo-tab'
const GRID_SIZE = 25

function createEmptyMarked() {
  return Array(GRID_SIZE).fill(false)
}

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function drawGrid() {
  const words = shuffleArray(bingoWords).slice(0, GRID_SIZE)
  const marked = createEmptyMarked()
  if (useFreeCenter) {
    marked[12] = true
  }
  return { grid: words, marked }
}

function checkWin(marked) {
  const size = 5
  for (let row = 0; row < size; row++) {
    if ([0, 1, 2, 3, 4].every((col) => marked[row * size + col])) return true
  }
  for (let col = 0; col < size; col++) {
    if ([0, 1, 2, 3, 4].every((row) => marked[row * size + col])) return true
  }
  if ([0, 1, 2, 3, 4].every((i) => marked[i * size + i])) return true
  if ([0, 1, 2, 3, 4].every((i) => marked[i * size + (size - 1 - i)])) return true
  return false
}

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        username: data.username ?? '',
        unlocked: Boolean(data.unlocked),
      }
    }
    const legacy = localStorage.getItem('pispala-bingo-v1')
    if (legacy) {
      const data = JSON.parse(legacy)
      const auth = {
        username: data.username ?? '',
        unlocked: Boolean(data.unlocked),
      }
      saveAuth(auth.username, auth.unlocked)
      localStorage.removeItem('pispala-bingo-v1')
      return auth
    }
    return { username: '', unlocked: false }
  } catch {
    return { username: '', unlocked: false }
  }
}

function saveAuth(username, unlocked) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ username, unlocked }))
}

function clearLocalStorage() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem('pispala-bingo-v1')
  localStorage.removeItem(TAB_STORAGE_KEY)
}

function getAuthPhase(auth) {
  if (!auth.username) return 'username'
  if (!auth.unlocked) return 'password'
  return 'game'
}

export function useBingo({ onWordFound, onWordRemoved, onWin, loadGameState, saveGameState } = {}) {
  const auth = loadAuth()
  const initial = drawGrid()

  const username = ref(auth.username)
  const unlocked = ref(auth.unlocked)
  const authPhase = getAuthPhase(auth)
  const phase = ref(authPhase === 'game' ? 'ready' : authPhase)
  const grid = ref(initial.grid)
  const marked = ref(initial.marked)
  const startTime = ref(null)
  const endTime = ref(null)
  const bingoCount = ref(0)
  const shuffleLocked = ref(false)
  const gameLoading = ref(false)
  const discoveredWords = ref(new Set())
  const tick = ref(0)

  let timerInterval = null

  function startTimer() {
    if (timerInterval) return
    timerInterval = setInterval(() => {
      tick.value++
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  onUnmounted(stopTimer)

  function persistAuth() {
    saveAuth(username.value, unlocked.value)
  }

  async function persistGame() {
    if (!saveGameState || !username.value || !unlocked.value) return
    try {
      await saveGameState(username.value, {
        grid: grid.value,
        marked: marked.value,
        phase: phase.value,
        startTime: startTime.value,
        endTime: endTime.value,
        shuffleLocked: shuffleLocked.value,
      })
    } catch (e) {
      console.error('Pelin tilan tallennus epäonnistui', e)
    }
  }

  async function hydrateFromFirebase() {
    if (!loadGameState || !username.value || !unlocked.value) return
    gameLoading.value = true
    try {
      const remote = await loadGameState(username.value)
      if (remote?.grid?.length === GRID_SIZE) {
        grid.value = remote.grid
        marked.value = remote.marked ?? createEmptyMarked()
        phase.value = remote.phase ?? 'ready'
        startTime.value = remote.startTime ?? null
        endTime.value = remote.endTime ?? null
        shuffleLocked.value = remote.shuffleLocked ?? false
        bingoCount.value = remote.bingoCount ?? 0
        discoveredWords.value = new Set(remote.foundWords ?? [])
        if (phase.value === 'playing') startTimer()
      } else {
        await persistGame()
      }
    } catch (e) {
      console.error('Pelin tilan lataus epäonnistui', e)
    } finally {
      gameLoading.value = false
    }
  }

  function setUsername(name) {
    username.value = name.trim()
    phase.value = unlocked.value ? 'ready' : 'password'
    persistAuth()
  }

  function unlockWithPassword(password, correctPassword) {
    if (password !== correctPassword) return false
    unlocked.value = true
    phase.value = 'ready'
    persistAuth()
    return true
  }

  function shuffleGrid() {
    if (phase.value !== 'ready' || shuffleLocked.value) return
    const fresh = drawGrid()
    grid.value = fresh.grid
    marked.value = fresh.marked
    startTime.value = null
    endTime.value = null
    persistGame()
  }

  function toggleCell(index) {
    if (phase.value === 'won') return

    if (marked.value[index]) {
      const word = grid.value[index]
      marked.value[index] = false
      marked.value = [...marked.value]
      if (discoveredWords.value.has(word)) {
        const next = new Set(discoveredWords.value)
        next.delete(word)
        discoveredWords.value = next
        onWordRemoved?.(word)
      }
      persistGame()
      return
    }

    shuffleLocked.value = true

    if (phase.value === 'ready') {
      phase.value = 'playing'
      startTime.value = Date.now()
      startTimer()
    }

    marked.value[index] = true
    marked.value = [...marked.value]

    const word = grid.value[index]
    if (!discoveredWords.value.has(word)) {
      discoveredWords.value = new Set([...discoveredWords.value, word])
      onWordFound?.(word)
    }

    if (checkWin(marked.value)) {
      endTime.value = Date.now()
      phase.value = 'won'
      bingoCount.value++
      stopTimer()
      if (startTime.value) {
        onWin?.(endTime.value - startTime.value)
      }
    }

    persistGame()
  }

  function resetGame() {
    if (phase.value !== 'won') return
    const fresh = drawGrid()
    grid.value = fresh.grid
    marked.value = fresh.marked
    phase.value = 'ready'
    startTime.value = null
    endTime.value = null
    stopTimer()
    persistGame()
  }

  function logout() {
    stopTimer()
    clearLocalStorage()
    const fresh = drawGrid()
    username.value = ''
    unlocked.value = false
    phase.value = 'username'
    grid.value = fresh.grid
    marked.value = fresh.marked
    startTime.value = null
    endTime.value = null
    bingoCount.value = 0
    shuffleLocked.value = false
    gameLoading.value = false
    discoveredWords.value = new Set()
    tick.value = 0
  }

  const elapsedMs = computed(() => {
    tick.value
    if (!startTime.value) return 0
    const end = endTime.value ?? Date.now()
    return end - startTime.value
  })

  const formattedElapsed = computed(() => formatDuration(elapsedMs.value))
  const formattedFinalTime = computed(() =>
    endTime.value && startTime.value ? formatDuration(endTime.value - startTime.value) : '0:00'
  )

  const canShuffle = computed(() => phase.value === 'ready' && !shuffleLocked.value)
  const isPlaying = computed(() => phase.value === 'playing' || phase.value === 'won')

  return {
    username,
    unlocked,
    phase,
    grid,
    marked,
    startTime,
    endTime,
    gameLoading,
    setUsername,
    unlockWithPassword,
    shuffleGrid,
    toggleCell,
    formattedElapsed,
    formattedFinalTime,
    canShuffle,
    isPlaying,
    bingoCount,
    resetGame,
    logout,
    hydrateFromFirebase,
  }
}
