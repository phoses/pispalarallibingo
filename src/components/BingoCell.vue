<script setup>
import { computed } from 'vue'
import { displayWord } from '../utils/format.js'

const props = defineProps({
  word: { type: String, required: true },
  marked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle'])

const formattedWord = computed(() =>
  displayWord(props.word).replace(/-/g, '<span class="bingo-cell__hyphen">-</span>')
)
</script>

<template>
  <button
    type="button"
    class="bingo-cell"
    :class="{ 'bingo-cell--marked': marked }"
    :disabled="disabled"
    @click="emit('toggle')"
  >
    <span class="bingo-cell__text" lang="fi" v-html="formattedWord" />
    <span v-if="marked" class="bingo-cell__stamp">BINGO</span>
  </button>
</template>
