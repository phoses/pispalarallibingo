<script setup>
import { useInstallPrompt } from '../composables/useInstallPrompt.js'

const { visible, isIosDevice, canNativeInstall, install, dismiss } = useInstallPrompt()
</script>

<template>
  <div v-if="visible" class="install-prompt" role="region" aria-label="Asenna sovellus">
    <div class="install-prompt__content">
      <p class="install-prompt__title">Asenna sovellus</p>
      <p v-if="canNativeInstall" class="install-prompt__text">
        Lisää PispalaRalli-Bingo kotinäytölle nopeaa käyttöä varten.
      </p>
      <p v-else-if="isIosDevice" class="install-prompt__text">
        Safari: napauta <span class="install-prompt__highlight">Jaa</span>
        <span class="install-prompt__share-icon" aria-hidden="true">□↑</span>
        ja valitse <span class="install-prompt__highlight">Lisää Koti-valikkoon</span>.
      </p>
      <div class="install-prompt__actions">
        <button
          v-if="canNativeInstall"
          type="button"
          class="btn btn-primary btn--small install-prompt__install"
          @click="install"
        >
          Asenna
        </button>
        <button
          type="button"
          class="btn btn-secondary btn--small"
          @click="dismiss"
        >
          Ei nyt
        </button>
      </div>
    </div>
  </div>
</template>
