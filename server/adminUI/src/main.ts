import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import './styles/tailwind.css'
import './styles/main.scss'

const app = createApp(App)

const dsn = import.meta.env.VITE_SENTRY_DSN
if (dsn) {
  Sentry.init({
    app,
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 0
  })
}

app.use(createPinia())
app.mount('#app')
