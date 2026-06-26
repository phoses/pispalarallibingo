<script setup>
defineProps({
  leaderboard: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null },
  firebaseConfigured: { type: Boolean, default: false },
})

defineEmits(['refresh'])
</script>

<template>
  <div class="panel">
    <div class="panel-toolbar">
      <button type="button" class="btn btn-secondary btn--small" @click="$emit('refresh')">
        Päivitä
      </button>
    </div>

    <p v-if="!firebaseConfigured" class="panel-message">
      Firebase ei ole konfiguroitu. Lisää ympäristömuuttujat (.env).
    </p>
    <p v-else-if="loading" class="panel-message">Ladataan...</p>
    <p v-else-if="error" class="panel-message panel-message--error">{{ error }}</p>
    <p v-else-if="leaderboard.length === 0" class="panel-message">Ei vielä pelaajia.</p>

    <ol v-else class="leaderboard-list">
      <li
        v-for="(row, index) in leaderboard"
        :key="row.username"
        class="leaderboard-row"
        :class="{
          'leaderboard-row--top': index === 0,
          'leaderboard-row--winner': row.hasWin,
          'leaderboard-row--no-time': !row.hasWin,
        }"
      >
        <span class="leaderboard-rank">{{ index + 1 }}.</span>
        <span class="leaderboard-name">{{ row.username }}</span>
        <span class="leaderboard-words">{{ row.wordCount }} sanaa</span>
        <span v-if="row.bestTime" class="leaderboard-time">{{ row.bestTime }}</span>
      </li>
    </ol>

    <p v-if="firebaseConfigured && !loading && !error && leaderboard.length > 0" class="panel-hint">
      Voittajat nopeimman ajan mukaan · muut sanamäärän mukaan
    </p>
  </div>
</template>
