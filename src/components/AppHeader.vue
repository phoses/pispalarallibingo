<script setup>
defineProps({
  username: { type: String, required: true },
  bingoCount: { type: Number, default: 0 },
  isPlaying: { type: Boolean, default: false },
  formattedElapsed: { type: String, default: '0:00' },
})
</script>

<template>
  <header class="app-header">
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
</template>
