/**
 * Welcome screen (`AppWelcomeView`).
 *
 * What this test covers (JSDom):
 *   - Exactly one interactive control on the page, and it routes to
 *     `app-main` — the "only 1 button" contract.
 *   - The {de,en} × {portrait,landscape} asset matrix is wired to the right
 *     files, with the landscape variant behind an `(orientation: landscape)`
 *     `<source>` so the swap stays native.
 *
 * What this test does NOT cover:
 *   - Where the button lands on the artwork. That depends on the `contain`
 *     fit of the <img>, and JSDom runs no layout engine — percentage offsets
 *     inside `.welcome-stage` resolve to nothing here. Verify visually.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AppWelcomeView from '@/views/app/AppWelcomeView.vue'

const push = vi.fn()
const currentLocale = { value: 'de' }

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back: vi.fn() })
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: currentLocale
  })
}))

describe('AppWelcomeView', () => {
  beforeEach(() => {
    push.mockClear()
    currentLocale.value = 'de'
  })

  it('renders a single button that goes to the home page', async () => {
    const w = mount(AppWelcomeView)

    const buttons = w.findAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]!.text()).toBe('app.welcome.cta')

    await buttons[0]!.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'app-main' })
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
