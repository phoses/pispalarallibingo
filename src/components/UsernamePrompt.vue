<script setup>
defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['submit'])

function onSubmit(e) {
  e.preventDefault()
  const input = e.target.elements.username
  const value = input.value.trim()
  if (value) emit('submit', value)
}
</script>

<template>
  <div class="prompt-card">
    <h1 class="title">Pispala Bingo</h1>
    <p class="subtitle">Pubikierros-bingo Tampereella</p>
    <form class="prompt-form" @submit="onSubmit">
      <label class="label" for="username">Käyttäjätunnus</label>
      <input
        id="username"
        name="username"
        class="input"
        type="text"
        autocomplete="username"
        :value="modelValue"
        placeholder="Nimesi..."
        required
      />
      <button type="submit" class="btn btn-primary">Jatka</button>
    </form>
  </div>
</template>
