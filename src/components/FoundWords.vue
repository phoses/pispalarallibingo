<script setup>
defineProps({
  words: { type: Array, default: () => [] },
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
    <p v-else-if="words.length === 0" class="panel-message">
      Kukaan ei ole vielä löytänyt sanoja.
    </p>

    <ul v-else class="found-words-list">
      <li v-for="word in words" :key="word" class="found-word">{{ word }}</li>
    </ul>

    <p v-if="firebaseConfigured && !loading && !error && words.length > 0" class="panel-hint">
      Kaikkien pelaajien löytämät sanat · yhteensä {{ words.length }}
    </p>
  </div>
</template>
