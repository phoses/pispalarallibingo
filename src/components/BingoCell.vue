<script setup>
defineProps({
  word: { type: String, required: true },
  marked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <button
    type="button"
    class="bingo-cell"
    :class="{ 'bingo-cell--marked': marked }"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    <span class="bingo-cell__text">{{ word }}</span>
    <span v-if="marked" class="bingo-cell__stamp">BINGO</span>
  </button>
</template>
