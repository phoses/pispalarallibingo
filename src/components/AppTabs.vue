<script setup>
defineProps({
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const tabs = [
  { id: 'bingo', label: 'Bingo' },
  { id: 'leaderboard', label: 'Tulostaulu' },
  { id: 'words', label: 'Löydetyt sanat' },
]
</script>

<template>
  <nav class="app-tabs" aria-label="Päävalikko">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="app-tabs__btn"
      :class="{ 'app-tabs__btn--active': modelValue === tab.id }"
      @click="emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
