<script setup>
import BingoCell from './BingoCell.vue'

defineProps({
  username: { type: String, required: true },
  grid: { type: Array, required: true },
  marked: { type: Array, required: true },
  phase: { type: String, required: true },
  formattedElapsed: { type: String, default: '0:00' },
  formattedFinalTime: { type: String, default: '0:00' },
  canShuffle: { type: Boolean, default: false },
  isPlaying: { type: Boolean, default: false },
  bingoCount: { type: Number, default: 0 },
})

const emit = defineEmits(['shuffle', 'toggle', 'reset', 'clear-marks'])
</script>

<template>
  <div class="board-container">
    <header class="board-header">
      <h1 class="title title--small">PispalaRalli-Bingo</h1>
      <div
        v-if="bingoCount > 0"
        class="bingo-stars"
        :aria-label="`Saavutetut bingot: ${bingoCount}`"
      >
        <span v-for="n in bingoCount" :key="n" class="bingo-star" aria-hidden="true">★</span>
      </div>
      <p class="player-name">{{ username }}</p>
      <div v-if="isPlaying" class="timer">
        <span class="timer__label">Aika</span>
        <span class="timer__value">{{ formattedElapsed }}</span>
      </div>
    </header>

    <div v-if="phase === 'won'" class="win-banner">
      <p class="win-banner__title">BINGO!</p>
      <p class="win-banner__time">Kesto: {{ formattedFinalTime }}</p>
    </div>

    <div class="bingo-grid">
      <BingoCell
        v-for="(word, index) in grid"
        :key="index"
        :word="word"
        :marked="marked[index]"
        :disabled="phase === 'won'"
        @toggle="emit('toggle', index)"
      />
    </div>

    <div class="board-actions">
      <button
        v-if="phase === 'won'"
        type="button"
        class="btn btn-primary"
        @click="emit('reset')"
      >
        Uusi bingo
      </button>
      <button
        v-if="phase === 'playing'"
        type="button"
        class="btn btn-secondary"
        @click="emit('clear-marks')"
      >
        Nollaa valinnat
      </button>
      <button
        v-if="canShuffle"
        type="button"
        class="btn btn-secondary"
        @click="emit('shuffle')"
      >
        Sekoita ruudukko
      </button>
    </div>
  </div>
</template>
