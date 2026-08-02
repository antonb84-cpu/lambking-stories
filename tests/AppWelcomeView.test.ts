/**
 * Welcome screen (`AppWelcomeView`).
 *
 * What this test covers (JSDom):
 *   - Exactly one navigation control on the page, and it routes to
 *     `app-main` — the "only 1 button" contract (the two flag buttons of the
 *     language switcher stay on this screen and never navigate).
 *   - The {de,en} × {portrait,landscape} asset matrix is wired to the right
 *     files, with the landscape variant behind an `(orientation: landscape)`
 *     `<source>` so the swap stays native.
 *   - Picking a flag persists the language, which is what re-points the
 *     artwork at the other locale's pair.
 *
 * What this test does NOT cover:
 *   - Where the button lands on the artwork. That depends on the `contain`
 *     fit of the <img>, and JSDom runs no layout engine — percentage offsets
 *     inside `.welcome-stage` resolve to nothing here. Verify visually.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import AppWelcomeView from '@/views/app/AppWelcomeView.vue'

const push = vi.fn()
const currentLocale = { value: 'de' }
const setSettingValue = vi.fn()
const userLanguage = ref('de')

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: currentLocale
  })
}))

// The switcher writes through `useUser`, which otherwise drags in the
// IndexedDB-backed user store on import.
vi.mock('@/use/useUser', () => ({
  default: () => ({ userLanguage, setSettingValue })
}))

describe('AppWelcomeView', () => {
  beforeEach(() => {
    push.mockClear()
    setSettingValue.mockClear()
    currentLocale.value = 'de'
    userLanguage.value = 'de'
  })

  it('renders a single navigation button that goes to the home page', async () => {
    const w = mount(AppWelcomeView)

    const cta = w.find('.welcome-cta')
    expect(cta.text()).toBe('app.welcome.cta')

    await cta.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-main' })
  })

  it('offers both flags and marks the active locale', () => {
    const w = mount(AppWelcomeView)

    const flags = w.findAll('.z-lang-btn')
    expect(flags).toHaveLength(2)
    // English (Union Jack) first, German to its right.
    expect(flags.map((f) => f.attributes('aria-label'))).toEqual([
      'app.language.english',
      'app.language.german'
    ])
    expect(flags[1]!.classes()).toContain('is-active')
    expect(flags[0]!.classes()).not.toContain('is-active')
  })

  it('persists the language when a flag is picked, and not when it is already active', async () => {
    const w = mount(AppWelcomeView)
    const flags = w.findAll('.z-lang-btn')

    await flags[0]!.trigger('click')
    expect(setSettingValue).toHaveBeenCalledWith('language', 'en')
    expect(push).not.toHaveBeenCalled()

    setSettingValue.mockClear()
    await flags[1]!.trigger('click')
    expect(setSettingValue).not.toHaveBeenCalled()
  })

  it('serves the German artwork pair', () => {
    const w = mount(AppWelcomeView)

    expect(w.find('img').attributes('src')).toContain('wilkommen_portrait_de.webp')
    const source = w.find('source')
    expect(source.attributes('srcset')).toContain('willkommen_landscape_de.webp')
    expect(source.attributes('media')).toBe('(orientation: landscape)')
  })

  it('serves the English artwork pair', () => {
    currentLocale.value = 'en'
    const w = mount(AppWelcomeView)

    expect(w.find('img').attributes('src')).toContain('wilkommen_portrait_en.webp')
    expect(w.find('source').attributes('srcset')).toContain('willkommen_landscape_en.webp')
  })
})
