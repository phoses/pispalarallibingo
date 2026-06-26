import { ref, onMounted, onUnmounted } from 'vue'

const DISMISS_KEY = 'pispala-bingo-install-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function isIos() {
  const ua = window.navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

function isDismissed() {
  return localStorage.getItem(DISMISS_KEY) === '1'
}

export function useInstallPrompt() {
  const visible = ref(false)
  const isIosDevice = ref(false)
  const canNativeInstall = ref(false)
  let deferredPrompt = null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    visible.value = false
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    canNativeInstall.value = false
    visible.value = false
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISS_KEY, '1')
    }
  }

  function onBeforeInstallPrompt(e) {
    e.preventDefault()
    deferredPrompt = e
    canNativeInstall.value = true
    if (!isDismissed() && !isStandalone()) {
      visible.value = true
    }
  }

  onMounted(() => {
    if (isStandalone() || isDismissed()) return

    isIosDevice.value = isIos()
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    if (isIosDevice.value) {
      visible.value = true
    }
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  })

  return {
    visible,
    isIosDevice,
    canNativeInstall,
    install,
    dismiss,
  }
}
