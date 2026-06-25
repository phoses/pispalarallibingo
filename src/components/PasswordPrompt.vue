<script setup>
import { ref } from 'vue'
import { BINGO_PASSWORD } from '../data/bingoWords.js'

defineProps({
  username: { type: String, required: true },
})

const emit = defineEmits(['unlock'])

const password = ref('')
const error = ref('')

function onSubmit(e) {
  e.preventDefault()
  error.value = ''
  if (password.value === BINGO_PASSWORD) {
    emit('unlock', password.value)
  } else {
    error.value = 'Väärä salasana!'
    password.value = ''
  }
}
</script>

<template>
  <div class="prompt-card">
    <h1 class="title">Tervetuloa, {{ username }}!</h1>
    <p class="subtitle">Syötä salasana päästäksesi ruudukkoon</p>
    <form class="prompt-form" @submit="onSubmit">
      <label class="label" for="password">Salasana</label>
      <input
        id="password"
        v-model="password"
        class="input"
        type="password"
        autocomplete="current-password"
        placeholder="••••••••••••"
        required
      />
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="btn btn-primary">Avaa bingo</button>
    </form>
  </div>
</template>
