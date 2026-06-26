<script setup>
defineProps({
  username: { type: String, required: true },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="prompt-card modal-card" role="dialog" aria-labelledby="logout-title" aria-modal="true">
      <h2 id="logout-title" class="title title--small">Kirjaudu ulos?</h2>
      <p class="subtitle">
        Haluatko kirjautua ulos käyttäjältä <span class="logout-username">{{ username }}</span>?
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="emit('cancel')">Peruuta</button>
        <button type="button" class="btn btn-primary" @click="emit('confirm')">Kirjaudu ulos</button>
      </div>
    </div>
  </div>
</template>
