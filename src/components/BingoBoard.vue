<script setup>
import BingoCell from './BingoCell.vue'

defineProps({
  grid: { type: Array, required: true },
  marked: { type: Array, required: true },
  phase: { type: String, required: true },
  formattedFinalTime: { type: String, default: '0:00' },
  canShuffle: { type: Boolean, default: false },
})

const emit = defineEmits(['shuffle', 'toggle', 'reset'])
</script>

<template>
  <div class="board-container">
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
