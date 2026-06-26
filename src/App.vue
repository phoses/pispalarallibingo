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
  recordWin,
  mergePlayerData,
  loadPlayerData,
  isFirebaseConfigured,
} = usePlayerStats()

const {
  username,
  phase,
  grid,
  marked,
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
  syncWithFirebase,
} = useBingo({
  onWordFound: (word) => addFoundWord(username.value, word),
  onWin: (timeMs) => recordWin(username.value, timeMs),
})

const activeTab = ref(localStorage.getItem(TAB_KEY) ?? 'bingo')

watch(activeTab, (tab) => {
  localStorage.setItem(TAB_KEY, tab)
  if (tab === 'leaderboard' || tab === 'words') loadPlayerData()
})

async function syncFirebase() {
  await syncWithFirebase(mergePlayerData)
}

watch(
  () => [phase.value, username.value],
  ([currentPhase, name]) => {
    if (currentPhase !== 'username' && currentPhase !== 'password' && name) {
      syncFirebase()
    }
  },
  { immediate: true }
)

function onUnlock(password) {
  if (unlockWithPassword(password, BINGO_PASSWORD)) {
    syncFirebase()
  }
}

function onSetUsername(name) {
  setUsername(name)
  if (phase.value !== 'username' && phase.value !== 'password') {
    syncFirebase()
  }
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
          <BingoBoard
            v-show="activeTab === 'bingo'"
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
