<script setup>
import { BINGO_PASSWORD } from './data/bingoWords.js'
import { useBingo } from './composables/useBingo.js'
import UsernamePrompt from './components/UsernamePrompt.vue'
import PasswordPrompt from './components/PasswordPrompt.vue'
import BingoBoard from './components/BingoBoard.vue'

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
  clearMarks,
  resetGame,
} = useBingo()

function onUnlock(password) {
  unlockWithPassword(password, BINGO_PASSWORD)
}
</script>

<template>
  <main class="app">
    <UsernamePrompt
      v-if="phase === 'username'"
      :model-value="username"
      @submit="setUsername"
    />
    <PasswordPrompt
      v-else-if="phase === 'password'"
      :username="username"
      @unlock="onUnlock"
    />
    <BingoBoard
      v-else
      :username="username"
      :grid="grid"
      :marked="marked"
      :phase="phase"
      :formatted-elapsed="formattedElapsed"
      :formatted-final-time="formattedFinalTime"
      :can-shuffle="canShuffle"
      :is-playing="isPlaying"
      :bingo-count="bingoCount"
      @shuffle="shuffleGrid"
      @toggle="toggleCell"
      @clear-marks="clearMarks"
      @reset="resetGame"
    />
  </main>
</template>
