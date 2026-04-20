import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BadgeEditor from '@/components/molecules/BadgeEditor.vue'

describe('BadgeEditor', () => {
  it('adds a badge on Enter', async () => {
    const w = mount(BadgeEditor, { props: { modelValue: ['new'] } })
    const input = w.find('input')
    await input.setValue('hot')
    await input.trigger('keydown.enter')
    expect(w.emitted('update:modelValue')![0]).toEqual([['new', 'hot']])
  })

  it('removes a badge when × is clicked', async () => {
    const w = mount(BadgeEditor, { props: { modelValue: ['a', 'b'] } })
    const removeButtons = w.findAll('button')
    await removeButtons[0]!.trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual([['b']])
  })
})
