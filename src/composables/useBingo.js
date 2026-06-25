import { ref, computed, onUnmounted } from 'vue'
import { bingoWords, useFreeCenter } from '../data/bingoWords.js'

const STORAGE_KEY = 'pispala-bingo-v1'
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

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function getInitialPhase(saved) {
  if (!saved?.username) return 'username'
  if (!saved?.unlocked) return 'password'
  if (saved.phase === 'won') return 'won'
  if (saved.phase === 'playing') return 'playing'
  return 'ready'
}

export function useBingo() {
  const saved = loadState()
  const initial = saved?.grid ? { grid: saved.grid, marked: saved.marked } : drawGrid()

  const username = ref(saved?.username ?? '')
  const unlocked = ref(saved?.unlocked ?? false)
  const phase = ref(getInitialPhase(saved))
  const grid = ref(initial.grid)
  const marked = ref(initial.marked ?? createEmptyMarked())
  const startTime = ref(saved?.startTime ?? null)
  const endTime = ref(saved?.endTime ?? null)
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

  if (phase.value === 'playing') {
    startTimer()
  }

  onUnmounted(stopTimer)

  function persist() {
    saveState({
      username: username.value,
      unlocked: unlocked.value,
      phase: phase.value,
      grid: grid.value,
      marked: marked.value,
      startTime: startTime.value,
      endTime: endTime.value,
    })
  }

  function setUsername(name) {
    username.value = name.trim()
    phase.value = unlocked.value ? 'ready' : 'password'
    persist()
  }

  function unlockWithPassword(password, correctPassword) {
    if (password !== correctPassword) return false
    unlocked.value = true
    phase.value = 'ready'
    persist()
    return true
  }

  function shuffleGrid() {
    if (phase.value !== 'ready') return
    const fresh = drawGrid()
    grid.value = fresh.grid
    marked.value = fresh.marked
    startTime.value = null
    endTime.value = null
    persist()
  }

  function toggleCell(index) {
    if (phase.value === 'won') return
    if (marked.value[index]) return

    if (phase.value === 'ready') {
      phase.value = 'playing'
      startTime.value = Date.now()
      startTimer()
    }

    marked.value[index] = true
    marked.value = [...marked.value]

    if (checkWin(marked.value)) {
      endTime.value = Date.now()
      phase.value = 'won'
      stopTimer()
    }

    persist()
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

  const canShuffle = computed(() => phase.value === 'ready')
  const isPlaying = computed(() => phase.value === 'playing' || phase.value === 'won')

  return {
    username,
    unlocked,
    phase,
    grid,
    marked,
    startTime,
    endTime,
    setUsername,
    unlockWithPassword,
    shuffleGrid,
    toggleCell,
    formattedElapsed,
    formattedFinalTime,
    canShuffle,
    isPlaying,
  }
}
