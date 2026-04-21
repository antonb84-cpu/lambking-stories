import { createApp, ref } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import '@/assets/css/tailwind.css'
import '@/assets/css/index.sass'
import { createI18n } from 'vue-i18n'
import baseTranslations from '@/i18n/translations'
import bookTranslations from '@/i18n/books'
import appTranslations from '@/i18n/app'
import { mergeObjectsRecursive } from '@/utils/function'
import { GAME_USER_LANGUAGE } from '@/utils/constants.ts'

const translations = mergeObjectsRecursive(
  mergeObjectsRecursive(
    mergeObjectsRecursive({}, bookTranslations),
    baseTranslations
  ),
  appTranslations
)

const userLanguage = ref(
  localStorage.getItem(GAME_USER_LANGUAGE)
  || sessionStorage.getItem(GAME_USER_LANGUAGE)
  || navigator.language?.split('-')[0]
)

const i18n: any = createI18n({
  locale: userLanguage.value || 'en', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages: translations,
  missingWarn: false,
  fallbackWarn: false
})

const app = createApp(App)

app.use(router)
app.use(i18n)

app.mount('#app')
