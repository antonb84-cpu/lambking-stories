<template>
  <div class="flex flex-col gap-y-0.5">
    <!-- METADATA PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Metadaten</h2>
          <p class="panel-subtitle">Grunddaten des Buchs — gelten für alle Sprachen.</p>
        </div>
        <LocaleSwitcher v-model="activeLocale" :busy="translating" @translate="onTranslateSwitch" />
      </header>

      <div class="form-grid">
        <div id="field-bookId" class="field col-4" :class="fieldClass('field-bookId')">
          <label class="field-label">
            Book-ID <span v-if="isMissing('field-bookId')" class="missing-dot" />
            <span class="muted">{{ prefix || '??' }}-n-shortname</span>
          </label>
          <XInput v-model="draft.book.bookId" placeholder="fa-1-apple" />
          <p class="field-hint">2-Buchstaben-Prefix, Band, Kurzname.</p>
        </div>
        <div id="field-author" class="field col-4" :class="fieldClass('field-author')">
          <label class="field-label">
            Autor <span v-if="isMissing('field-author')" class="missing-dot" />
          </label>
          <XInput v-model="draft.book.author" placeholder="Jane Doe" />
        </div>
        <div id="field-releaseDate" class="field col-4" :class="fieldClass('field-releaseDate')">
          <label class="field-label">
            Erscheinungsdatum <span v-if="isMissing('field-releaseDate')" class="missing-dot" />
          </label>
          <DatePicker v-model="draft.book.releaseDate" />
        </div>

        <div id="field-bookSeries" class="field col-6" :class="fieldClass('field-bookSeries')">
          <label class="field-label">
            Buchreihe <span v-if="isMissing('field-bookSeries')" class="missing-dot" />
            <span class="count-badge" :title="`${seriesStore.items.length} verfügbar`">
              {{ seriesStore.items.length }}
            </span>
          </label>
          <SeriesPicker v-model="draft.book.bookSeriesId" :series="seriesStore.items" />
        </div>
        <div id="field-category" class="field col-6" :class="fieldClass('field-category')">
          <label class="field-label">
            Kategorie <span v-if="isMissing('field-category')" class="missing-dot" />
            <span class="count-badge" :title="`${categoriesStore.items.length} verfügbar`">
              {{ categoriesStore.items.length }}
            </span>
            <span class="muted">suchbar</span>
          </label>
          <CategoryPicker v-model="draft.book.category" :categories="categoriesStore.items" />
        </div>

        <div class="field col-12">
          <label class="field-label">Badges</label>
          <BadgeEditor v-model="draft.book.badges" />
        </div>
      </div>
    </section>

    <!-- LOCALIZED TEXT PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Beschreibung · {{ activeLocale.toUpperCase() }}</h2>
          <p class="panel-subtitle">Titel und Einleitungstexte pro Sprache.</p>
        </div>
      </header>

      <div class="form-grid">
        <div id="field-title" class="field col-4" :class="activeLocale === 'de' ? fieldClass('field-title') : ''">
          <label class="field-label">
            Titel <span v-if="activeLocale === 'de' && isMissing('field-title')" class="missing-dot" />
          </label>
          <XInput v-model="draft.activeLocalization.title" placeholder="Der Apfel" />
        </div>
        <div id="field-shortDescription" class="field col-4"
             :class="activeLocale === 'de' ? fieldClass('field-shortDescription') : ''">
          <label class="field-label">
            Kurzbeschreibung <span v-if="activeLocale === 'de' && isMissing('field-shortDescription')"
                                   class="missing-dot" />
          </label>
          <textarea
            v-model="draft.activeLocalization.shortDescription"
            class="glass w-full min-h-[110px]"
            placeholder="1–2 Sätze für Listen & Previews."
          />
        </div>
        <div id="field-description" class="field col-4"
             :class="activeLocale === 'de' ? fieldClass('field-description') : ''">
          <label class="field-label">
            Beschreibung <span v-if="activeLocale === 'de' && isMissing('field-description')" class="missing-dot" />
          </label>
          <textarea
            v-model="draft.activeLocalization.description"
            class="glass w-full min-h-[110px]"
            placeholder="Ausführliche Beschreibung für die Detailseite."
          />
        </div>
      </div>
    </section>

    <!-- MEDIA PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Medien</h2>
          <p class="panel-subtitle">Cover- &amp; Preview-Bild, Audio, Buch-Vorderseiten-Titelbild.</p>
        </div>
      </header>

      <div class="form-grid">
        <div id="field-cover" class="col-6" :class="fieldClass('field-cover')">
          <DropZone
            label="Cover-Bild"
            accept="image/webp,image/jpeg,image/png"
            kind="image"
            hint="16:9 · 800x450, 1280×720 · max 3 MB"
            subhint=".webp bevorzugt · ziehen oder klicken"
            :status="draft.uploadStatus.cover"
            :preview-url="draft.book.coverImage || undefined"
            :on-file="uploadCover"
          />
        </div>
        <div id="field-preview" class="col-6" :class="fieldClass('field-preview')">
          <DropZone
            label="Preview-Bild"
            accept="image/webp,image/jpeg,image/png"
            kind="image"
            hint="1:1 · 512×512 or larger · max 2 MB"
            subhint=".webp bevorzugt · ziehen oder klicken"
            :status="draft.uploadStatus.preview"
            :preview-url="draft.book.previewImage || undefined"
            :on-file="uploadPreview"
          />
        </div>

        <div id="field-audio" class="col-6" :class="activeLocale === 'de' ? fieldClass('field-audio') : ''">
          <DropZone
            :label="`Audio-Datei (${activeLocale.toUpperCase()})`"
            accept="audio/ogg"
            kind="audio"
            hint=".ogg-Datei · max 50 MB"
            subhint="Ziehen oder klicken zum Auswählen"
            :filename-hint="draft.book.bookId ? `e.g. ${draft.book.bookId}.ogg` : ''"
            :status="draft.uploadStatus.audio"
            :preview-url="draft.book.audio?.[activeLocale] || undefined"
            :on-file="uploadAudio"
          />
        </div>
        <div v-if="activeLocale === 'de'" class="col-6">
          <DropZone
            label="Buch-Vorderseiten-Titelbild (DE)"
            accept="image/webp,image/jpeg,image/png"
            kind="image"
            hint="9:16 · z.B. 450x800 · max 2 MB"
            subhint=".webp bevorzugt · ziehen oder klicken · optional"
            :status="draft.uploadStatus.contentCoverDe"
            :preview-url="draft.book.contentCoverImage?.de || undefined"
            :on-file="uploadContentCoverDe"
          />
        </div>
        <div v-else class="col-6">
          <DropZone
            label="Buch-Vorderseiten-Titelbild (EN)"
            accept="image/webp,image/jpeg,image/png"
            kind="image"
            hint="9:16 · z.B. 450x800 · max 2 MB"
            subhint=".webp bevorzugt · ziehen oder klicken · optional"
            :status="draft.uploadStatus.contentCoverEn"
            :preview-url="draft.book.contentCoverImage?.en || undefined"
            :on-file="uploadContentCoverEn"
          />
        </div>
      </div>
    </section>

    <!-- CONTENT PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Seiteneditor · {{ activeLocale.toUpperCase() }}</h2>
          <p class="panel-subtitle">Seitenumbrüche via „## Kapitel 1" oder „# …".</p>
        </div>
      </header>
      <div id="field-content" :class="activeLocale === 'de' ? fieldClass('field-content') : ''">
        <RichTextEditor v-model="draft.activeLocalization.content" />
      </div>
    </section>

    <!-- ATTACHMENTS PANEL -->
    <section class="form-panel">
      <header class="panel-header">
        <div>
          <h2 class="panel-title">Anhänge</h2>
          <p class="panel-subtitle">PDF-Dokumente, die das Buch begleiten.</p>
        </div>
      </header>

      <div class="form-grid">
        <div class="col-4">
          <DropZone
            label="PDF hinzufügen"
            accept="application/pdf"
            kind="pdf"
            hint=".pdf · max 3 MB · shrink pls"
            subhint="Mehrere Uploads möglich"
            :auto-reset-ms="3000"
            :on-file="uploadAttachment"
          />
        </div>
        <div class="col-8">
          <AttachmentsList :items="draft.book.attachments" @remove="removeAttachment" />
        </div>
      </div>
    </section>

    <!-- SUBMIT BAR -->
    <div class="submit-bar py-4 gap-1">
      <div class="flex-1 min-w-0 flex flex-col gap-2 px-3">
        <p v-if="draft.isGermanComplete" class="text-xs text-emerald-700 font-medium">
          ✓ Bereit zum Speichern.
        </p>
        <template v-else>
          <p class="text-xs text-stone-600">
            Noch <strong class="text-rose-600">{{ draft.missingFields.length }}</strong>
            {{ draft.missingFields.length === 1 ? 'Feld' : 'Felder' }} offen
            <span class="text-stone-400">· klicken um zum Feld zu springen</span>
          </p>
          <div class="flex flex-wrap gap-1">
            <button
              v-for="m in draft.missingFields"
              :key="m.anchor"
              type="button"
              class="missing-chip"
              @click="scrollToField(m.anchor)"
            >{{ m.label }}
            </button>
          </div>
        </template>
      </div>
      <div class="flex gap-4 px-3 py-1 items-center flex-shrink-0">
        <XButton label="Zurücksetzen" @click="draft.reset" />
        <span
          class="inline-flex"
          :title="draft.isGermanComplete ? '' : `Fehlt noch: ${draft.missingFields.map((m) => m.label).join(', ')}`"
        >
          <XButton
            class="primary"
            :label="draft.isEditingExisting ? 'Aktualisieren' : 'Speichern'"
            :disabled="!draft.isGermanComplete || submitting"
            @click="submit"
          />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import LocaleSwitcher from '@/components/molecules/LocaleSwitcher.vue'
import SeriesPicker from '@/components/molecules/SeriesPicker.vue'
import CategoryPicker from '@/components/molecules/CategoryPicker.vue'
import DatePicker from '@/components/molecules/DatePicker.vue'
import DropZone from '@/components/molecules/DropZone.vue'
import AttachmentsList from '@/components/molecules/AttachmentsList.vue'
import BadgeEditor from '@/components/molecules/BadgeEditor.vue'
import XInput from '@/components/atoms/XInput.vue'
import XButton from '@/components/atoms/XButton.vue'
import RichTextEditor from './RichTextEditor.vue'

import { useBookDraftStore } from '@/stores/bookDraft'
import { useSeriesStore } from '@/stores/series'
import { useCategoryStore } from '@/stores/categories'
import { useToastStore } from '@/stores/toast'
import { booksApi } from '@/api/books'
import { uploadsApi } from '@/api/uploads'
import { translateApi } from '@/api/translate'
import { ApiClientError } from '@/api/client'

const emit = defineEmits<{ (e: 'saved', book: import('@/types').BookDTO): void }>()

const draft = useBookDraftStore()
const seriesStore = useSeriesStore()
const categoriesStore = useCategoryStore()
const toast = useToastStore()

const { activeLocale } = storeToRefs(draft)
const submitting = ref(false)
const translating = ref(false)

const prefix = computed(() => {
  const s = seriesStore.items.find((x) => x.seriesId === draft.book.bookSeriesId)
  return s?.prefix ?? ''
})

const isMissing = (anchor: string) => draft.missingAnchors.has(anchor)
const fieldClass = (anchor: string) => (isMissing(anchor) ? 'is-missing' : '')
const scrollToField = (anchor: string) => {
  const el = document.getElementById(anchor)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.classList.add('is-flash')
  window.setTimeout(() => el.classList.remove('is-flash'), 1500)
}

const BOOK_ID_PATTERN = /^[a-z]{2}-\d+-[a-z0-9-]+$/

function explainApiError(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.details?.length) {
      return err.details.map((d) => `${d.field}: ${d.message}`).join(' — ')
    }
    return `${err.code}: ${err.message}`
  }
  return (err as Error).message || 'Upload fehlgeschlagen'
}

async function uploadAudio(file: File) {
  if (!draft.book.bookId) {
    throw new Error('Bitte zuerst die Book-ID setzen (z. B. fa-1-apple).')
  }
  if (!BOOK_ID_PATTERN.test(draft.book.bookId)) {
    throw new Error(
      `Ungültige Book-ID „${draft.book.bookId}" — erwartet: 2 Buchstaben, Nummer, Kurzname (z. B. fa-1-apple).`
    )
  }
  try {
    const res = await uploadsApi.audio(file, draft.book.bookId, activeLocale.value)
    draft.book.audio[activeLocale.value] = res.url
    draft.uploadStatus.audio = { ok: true, filename: file.name }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

async function uploadCover(file: File) {
  try {
    const res = await uploadsApi.image(file, 'cover')
    draft.book.coverImage = res.url
    draft.uploadStatus.cover = { ok: true, filename: file.name }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

async function uploadPreview(file: File) {
  try {
    const res = await uploadsApi.image(file, 'preview')
    draft.book.previewImage = res.url
    draft.uploadStatus.preview = { ok: true, filename: file.name }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

async function uploadContentCoverFor(locale: 'de' | 'en', file: File) {
  try {
    const res = await uploadsApi.image(file, 'content')
    if (!draft.book.contentCoverImage) draft.book.contentCoverImage = { de: '', en: '' }
    draft.book.contentCoverImage[locale] = res.url
    draft.uploadStatus[locale === 'de' ? 'contentCoverDe' : 'contentCoverEn'] = {
      ok: true,
      filename: file.name
    }
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

const uploadContentCoverDe = (file: File) => uploadContentCoverFor('de', file)
const uploadContentCoverEn = (file: File) => uploadContentCoverFor('en', file)

async function uploadAttachment(file: File) {
  try {
    const res = await uploadsApi.attachment(file)
    draft.book.attachments.push(res.url)
  } catch (err) {
    throw new Error(explainApiError(err))
  }
}

function removeAttachment(i: number) {
  draft.book.attachments.splice(i, 1)
}

async function onTranslateSwitch(from: 'de' | 'en', to: 'de' | 'en') {
  if (from === to) return
  // Only auto-translate DE → EN. The German side is the source of truth; when
  // switching back to DE we never want to overwrite the original with a
  // round-tripped translation.
  if (from !== 'de' || to !== 'en') return
  const source = draft.book.localizations[from]
  if (!source || !source.title) return

  // Seed target with a deep copy of the source so the user sees text
  // immediately (no empty fields / ghost editor) even if translation fails.
  // Any field still equal to the source after this seed is the signal that
  // it has NOT yet been translated and should be re-run through the model.
  const existing = draft.book.localizations[to]
  if (!existing || !existing.title) {
    draft.book.localizations[to] = {
      title: source.title,
      shortDescription: source.shortDescription,
      description: source.description,
      content: source.content.map((p) => ({ page: p.page, title: p.title, text: p.text }))
    }
  }
  const target = draft.book.localizations[to]!

  // Collect only the fields that still match the source — those are the ones
  // that still need translating. Previously-translated fields are left alone.
  const strings: Record<string, string> = {}
  const pendingFields: Array<keyof typeof target> = []
  for (const field of ['title', 'shortDescription', 'description'] as const) {
    if (target[field] && target[field] === source[field]) {
      strings[field] = source[field] as string
      pendingFields.push(field)
    }
  }
  const pendingPageIdx: number[] = []
  target.content.forEach((p, i) => {
    const srcPage = source.content.find((s) => s.page === p.page)
    if (!srcPage) return
    if (p.title && p.title === srcPage.title) strings[`page.${p.page}.title`] = srcPage.title
    if (p.text && p.text === srcPage.text) strings[`page.${p.page}.text`] = srcPage.text
    if (
      (p.title && p.title === srcPage.title) ||
      (p.text && p.text === srcPage.text)
    ) {
      pendingPageIdx.push(i)
    }
  })

  if (!Object.keys(strings).length) return

  translating.value = true
  try {
    const translations = await translateApi.translate(from, to, strings)
    for (const field of pendingFields) {
      const t = translations[field]
      if (t) (target[field] as string) = t
    }
    for (const i of pendingPageIdx) {
      const p = target.content[i]
      if (!p) continue
      const tTitle = translations[`page.${p.page}.title`]
      const tText = translations[`page.${p.page}.text`]
      if (tTitle) p.title = tTitle
      if (tText) p.text = tText
    }
    // Reassign to trigger reactivity for the RichTextEditor watcher.
    draft.book.localizations[to] = {
      ...target,
      content: target.content.map((p) => ({ ...p }))
    }
    toast.success(
      `Übersetzung ${from.toUpperCase()} → ${to.toUpperCase()} — ${pendingFields.length + pendingPageIdx.length} Felder`
    )
  } catch (err) {
    const msg = err instanceof ApiClientError && err.details?.length
      ? err.details.map((d) => `${d.field}: ${d.message}`).join(' — ')
      : (err as Error).message
    toast.error(
      `${msg} — Quelltext wurde als Fallback übernommen.`,
      'Übersetzung fehlgeschlagen'
    )
  } finally {
    translating.value = false
  }
}

async function submit() {
  submitting.value = true
  try {
    const src = draft.book as Record<string, unknown>
    const { _id, updatedDate, createdAt, updatedAt, __v, ...rest } = src
    void _id
    void updatedDate
    void createdAt
    void updatedAt
    void __v
    const payload = {
      ...rest,
      releaseDate: new Date(draft.book.releaseDate).toISOString()
    } as any
    const saved = draft.isEditingExisting
      ? await booksApi.update(draft.book.bookId, payload)
      : await booksApi.create(payload)
    toast.success(`Buch „${saved.localizations.de?.title}" gespeichert`)
    draft.isEditingExisting = true
    emit('saved', saved)
  } catch (err) {
    if (err instanceof ApiClientError && err.details?.length) {
      toast.error(err.details.map((d) => `${d.field}: ${d.message}`).join(' — '), err.code)
    } else {
      toast.error((err as Error).message)
    }
  } finally {
    submitting.value = false
  }
}
</script>
