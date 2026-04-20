import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher.vue'

describe('LocaleSwitcher', () => {
  it('emits update:modelValue and translate when switching from de to en', async () => {
    const wrapper = mount(LocaleSwitcher, { props: { modelValue: 'de' } })
    const buttons = wrapper.findAll('button')
    await buttons[1]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['en']])
    expect(wrapper.emitted('translate')).toEqual([['de', 'en']])
  })

  it('does not emit when clicking the already-active locale', async () => {
    const wrapper = mount(LocaleSwitcher, { props: { modelValue: 'de' } })
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
