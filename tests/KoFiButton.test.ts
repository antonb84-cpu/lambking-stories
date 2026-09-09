/**
 * Donate CTA (`KoFiButton`) — the PayPal and Ko-fi buttons on the welcome
 * slider.
 *
 * These shipped as bare `<a target="_blank" rel="noopener noreferrer">`, which
 * works on the web and is silently dropped by the Tauri Android WebView (no
 * `onCreateWindow`, `supportMultipleWindows` off) — so in the Play Store build
 * the buttons highlighted on tap and did nothing. The contract pinned here:
 * a plain activation goes through `openExternal`, and the anchor's own
 * navigation is cancelled so the two paths can't both fire.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import KoFiButton from '@/components/molecules/KoFiButton.vue'

const openExternal = vi.fn(async () => true)

vi.mock('@/utils/openExternal', () => ({
  openExternal: (url: string) => openExternal(url),
  default: (url: string) => openExternal(url)
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}:${JSON.stringify(params)}` : key
  })
}))

const KOFI_URL = 'https://ko-fi.com/U6U21YO0Z5'

beforeEach(() => {
  openExternal.mockClear()
})

describe('KoFiButton', () => {
  it('routes a plain click through openExternal instead of the anchor', async () => {
    const wrapper = mount(KoFiButton, { props: { href: KOFI_URL, label: 'Ko-fi' } })

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })
    wrapper.get('a').element.dispatchEvent(event)

    expect(openExternal).toHaveBeenCalledWith(KOFI_URL)
    expect(event.defaultPrevented).toBe(true)
  })

  it('keeps the href so the link survives without JS and reads as a link', () => {
    const wrapper = mount(KoFiButton, { props: { href: KOFI_URL } })
    const anchor = wrapper.get('a')

    expect(anchor.attributes('href')).toBe(KOFI_URL)
    expect(anchor.attributes('rel')).toContain('noopener')
  })

  it('leaves a ctrl/cmd-click to the browser (open in background tab)', () => {
    const wrapper = mount(KoFiButton, { props: { href: KOFI_URL, tone: 'paypal', label: 'PayPal' } })

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true })
    wrapper.get('a').element.dispatchEvent(event)

    expect(openExternal).not.toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(false)
  })

  it('names the payment method in the accessible label', () => {
    const wrapper = mount(KoFiButton, { props: { href: KOFI_URL, tone: 'paypal', label: 'PayPal' } })

    expect(wrapper.get('a').attributes('aria-label')).toBe(
      'app.main.donateVia:{"method":"PayPal"}'
    )
  })
})

/**
 * The press animation. These buttons shipped with a CSS-only `:active` rule,
 * which the Android WebView withholds while it decides whether a touch is a
 * tap or the start of a slider swipe — so on device they were the only
 * controls in the app that stayed flat under a finger. Every other button
 * (`ZButton`, `AButton`, `ZChip`, …) drives an `is-pressed` class from pointer
 * events; that is what is pinned here, including the release paths, because a
 * button stuck in the pressed state is worse than one that never moves.
 */
describe('KoFiButton press state', () => {
  it('marks itself pressed on pointerdown and releases on pointerup', async () => {
    const wrapper = mount(KoFiButton, { props: { href: KOFI_URL } })
    const anchor = wrapper.get('a')

    expect(anchor.classes()).not.toContain('is-pressed')

    await anchor.trigger('pointerdown')
    expect(anchor.classes()).toContain('is-pressed')

    await anchor.trigger('pointerup')
    expect(anchor.classes()).not.toContain('is-pressed')
  })

  it('releases when the slider claims the gesture (pointercancel) or the finger slides off', async () => {
    for (const releaseEvent of ['pointercancel', 'pointerleave']) {
      const wrapper = mount(KoFiButton, { props: { href: KOFI_URL, tone: 'paypal' } })
      const anchor = wrapper.get('a')

      await anchor.trigger('pointerdown')
      expect(anchor.classes()).toContain('is-pressed')

      await anchor.trigger(releaseEvent)
      expect(anchor.classes()).not.toContain('is-pressed')
    }
  })
})
