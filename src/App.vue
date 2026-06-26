<script setup>
import { ref, watch } from 'vue'
import { BINGO_PASSWORD } from './data/bingoWords.js'
import { useBingo } from './composables/useBingo.js'
import { usePlayerStats } from './composables/usePlayerStats.js'
import UsernamePrompt from './components/UsernamePrompt.vue'
import PasswordPrompt from './components/PasswordPrompt.vue'
import AppHeader from './components/AppHeader.vue'
import AppTabs from './components/AppTabs.vue'
import BingoBoard from './components/BingoBoard.vue'
import Leaderboard from './components/Leaderboard.vue'
import FoundWords from './components/FoundWords.vue'

const TAB_KEY = 'pispala-bingo-tab'

const {
  leaderboard,
  globalFoundWords,
  loading: remoteLoading,
  error: remoteError,
  addFoundWord,
  removeFoundWord,
  recordWin,
  loadGameState,
  saveGameState,
  loadPlayerData,
  isFirebaseConfigured,
} = usePlayerStats()

const {
  username,
  unlocked,
  phase,
  grid,
  marked,
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
  hydrateFromFirebase,
} = useBingo({
  onWordFound: async (word) => {
    const added = await addFoundWord(username.value, word)
    if (added) loadPlayerData()
  },
  onWordRemoved: async (word) => {
    const removed = await removeFoundWord(username.value, word)
    if (removed) loadPlayerData()
  },
  onWin: (timeMs) => recordWin(username.value, timeMs),
  loadGameState,
  saveGameState,
})

const activeTab = ref(localStorage.getItem(TAB_KEY) ?? 'bingo')

watch(activeTab, (tab) => {
  localStorage.setItem(TAB_KEY, tab)
  if (tab === 'leaderboard' || tab === 'words') loadPlayerData()
})

watch(
  () => [username.value, unlocked.value],
  ([name, isUnlocked]) => {
    if (name && isUnlocked) hydrateFromFirebase()
  },
  { immediate: true }
)

function onUnlock(password) {
  unlockWithPassword(password, BINGO_PASSWORD)
}

function onSetUsername(name) {
  setUsername(name)
}
</script>

<template>
  <main class="app" :class="{ 'app--with-tabs': phase !== 'username' && phase !== 'password' }">
    <UsernamePrompt
      v-if="phase === 'username'"
      :model-value="username"
      @submit="onSetUsername"
    />
    <PasswordPrompt
      v-else-if="phase === 'password'"
      :username="username"
      @unlock="onUnlock"
    />
    <template v-else>
      <div class="app-shell">
        <AppHeader
          :username="username"
          :bingo-count="bingoCount"
          :is-playing="isPlaying"
          :formatted-elapsed="formattedElapsed"
        />
        <AppTabs v-model="activeTab" />
        <div class="app-content">
          <p v-if="gameLoading" class="panel-message">Ladataan peliä...</p>
          <BingoBoard
            v-show="activeTab === 'bingo' && !gameLoading"
            :grid="grid"
            :marked="marked"
            :phase="phase"
            :formatted-final-time="formattedFinalTime"
            :can-shuffle="canShuffle"
            @shuffle="shuffleGrid"
            @toggle="toggleCell"
            @reset="resetGame"
          />
          <Leaderboard
            v-if="activeTab === 'leaderboard'"
            :leaderboard="leaderboard"
            :loading="remoteLoading"
            :error="remoteError"
            :firebase-configured="isFirebaseConfigured()"
            @refresh="loadPlayerData"
          />
          <FoundWords
            v-if="activeTab === 'words'"
            :words="globalFoundWords"
            :loading="remoteLoading"
            :error="remoteError"
            :firebase-configured="isFirebaseConfigured()"
            @refresh="loadPlayerData"
          />
        </div>
      </div>
    </template>
  </main>
</template>
