<template lang="pug">
  div.h-screen.w-screen.bg-slate-200.flex.items-center.justify-center.p-4(class="")
    //FLogoProgress.absolute(
    //  class="left-1/2 top-12 -translate-x-1/2 w-32 h-32 sm:top-4 sm:w-[8rem] sm:h-[8rem] md:w-[10rem] md:h-[10rem] landscape:left-2\
    //         landscape:top-2 landscape:-translate-x-0 landscape:md:left-1/2 landscape:md:top-12 landscape:md:-translate-x-1/2"
    //)

    // UI Bottom Right (Mute + Version)
    div.absolute.bottom-2.right-2.flex.flex-col.items-end.gap-1
      // UI Bottom Right (Mute + Version)
      FMuteButton.mb-2

      div.text-xs.text-slate-200.opacity-70.text-shadow {{ isNative && false ? 'native:': ''}} v.{{ version }}{{ isDemo ? '-demo': ''}}

    // Menu box
    div.relative.p-10.flex.flex-col.gap-4.text-center.self-end(
      class="min-w-[320px] max-w-lg mb-15 sm:mb-8"
    )
      // Menu
      div.flex.flex-col.gap-4.relative.z-10
        FButton(@click="onCampaign" :is-disabled="loadingProgress < 100") {{ t('play') }}
        FButton(v-if="isNative" type="secondary" @click="handleExit") {{ t('quitApp') }}

    OptionsModal(
      :is-open="showOptions"
      @close="showOptions = false"
    )
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import OptionsModal from '@/components/organisms/OptionsModal.vue'
import FButton from '@/components/atoms/FButton.vue'
import {} from '@/use/useMatch'
import useUser, { version, isDemo, isNative } from '@/use/useUser'
import { mobileCheck } from '@/utils/function'
import FLogoProgress from '@/components/atoms/FLogoProgress.vue'
import useAssets from '@/use/useAssets'
import FMuteButton from '@/components/atoms/FMuteButton.vue'

const router = useRouter()
const { t } = useI18n()
const { userSoundVolume, userMusicVolume, setSettingValue } = useUser()
const { loadingProgress } = useAssets()

const showOptions = ref(false)

// Logic to determine if muted based on current volumes
const isMuted = computed(() => userMusicVolume.value === 0 && userSoundVolume.value === 0)

// Store previous volumes to restore them when unmuting
const prevMusicVol = ref(userMusicVolume.value || 0.5)
const prevSoundVol = ref(userSoundVolume.value || 0.7)

onMounted(() => {
})

const toggleMute = () => {
  if (!isMuted.value) {
    // Save current values before muting
    prevMusicVol.value = userMusicVolume.value
    prevSoundVol.value = userSoundVolume.value
    // Mute
    setSettingValue('music', 0)
    setSettingValue('sound', 0)
  } else {
    // Restore previous values (or defaults if previous was somehow 0)
    setSettingValue('music', prevMusicVol.value || 0.5)
    setSettingValue('sound', prevSoundVol.value || 0.7)
  }
}

const onCampaign = () => {
  if (loadingProgress.value < 100) return
  router.push({ name: 'match' })
}

const handleExit = () => {
  // Check if we are actually in Electron to avoid errors in browser
  if (window?.electronAPI) {
    window.electronAPI?.quitApp()
  } else {
    console.log('Exit requested (Browser mode - no action taken)')
  }
}
</script>

<style lang="sass" scoped>
.text-outline
  text-shadow: 3px 3px 0 #000

.text-shadow
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8)
</style>

<i18n>
en:
  play: "Play"
  settings: "Settings"
  quitApp: "Quit Game"
de:
  play: "Spielen"
  settings: "Einstellungen"
  quitApp: "Spiel beenden"
fr:
  play: "Jouer"
  settings: "Paramètres"
  quitApp: "Quitter le jeu"
es:
  play: "Jugar"
  settings: "Ajustes"
  quitApp: "Salir del juego"
jp:
  play: "プレイ"
  settings: "設定"
  quitApp: "ゲームを終了"
kr:
  play: "플레이"
  settings: "설정"
  quitApp: "게임 종료"
zh:
  play: "开始游戏"
  settings: "设置"
  quitApp: "退出游戏"
ru:
  play: "Играть"
  settings: "Настройки"
  quitApp: "Выйти из игры"
</i18n>