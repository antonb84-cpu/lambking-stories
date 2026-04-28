import { ref, watch } from 'vue'

export type LayoutVariant = 'a' | 'b'

const STORAGE_KEY = 'sg.layout'

function readInitial(): LayoutVariant {
  if (typeof localStorage === 'undefined') return 'a'
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'b' ? 'b' : 'a'
}

const layout = ref<LayoutVariant>(readInitial())

watch(layout, (next) => {
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* SSR / private mode — skip */
  }
})

export function useLayout() {
  function setLayout(v: LayoutVariant) {
    layout.value = v
  }

  function toggle() {
    layout.value = layout.value === 'a' ? 'b' : 'a'
  }

  return { layout, setLayout, toggle }
}
