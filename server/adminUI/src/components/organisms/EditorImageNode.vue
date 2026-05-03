<template>
  <node-view-wrapper
    as="div"
    class="editor-image-wrapper"
    :class="{ selected }"
    draggable="false"
    @dragstart.prevent
  >
    <span class="editor-image-frame" contenteditable="false">
      <!--
        `draggable="false"` here is critical. Without it, the browser's
        native HTML5 drag of an `<img>` element races with ProseMirror's
        own drag plugin: both fire on the same drop, and the second one
        inserts a *copy* on top of ProseMirror's move, producing the
        spurious duplicates the user sees when reorganising images. We
        intentionally don't support drag-to-move within the editor — the
        user can cut/paste or use the trash button instead.
      -->
      <img :src="src" :alt="alt" class="editor-image" draggable="false" />
      <button
        type="button"
        class="editor-image-trash"
        title="Bild entfernen"
        draggable="false"
        @click.stop.prevent="onDelete"
        @dragstart.prevent
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </span>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps(nodeViewProps)

const src = computed<string>(() => (props.node.attrs.src as string) || '')
const alt = computed<string>(() => (props.node.attrs.alt as string) || '')
const selected = computed(() => props.selected)

function onDelete() {
  const url = src.value
  // Tell the editor extension storage so the form can issue a server delete
  // on save. We do this BEFORE removing the node so other listeners still
  // see the URL on the document if they need it.
  const storage = props.editor.storage.image as
    | { pendingDeletes?: Set<string> }
    | undefined
  if (storage && url) {
    storage.pendingDeletes ??= new Set<string>()
    storage.pendingDeletes.add(url)
  }
  if (typeof props.deleteNode === 'function') props.deleteNode()
}
</script>

<style scoped>
.editor-image-wrapper {
  /* Block-level so each image sits on its own line, but `width: fit-content`
   * shrinks the click target to just the image. Without that, the wrapper
   * spans the full editor width and clicks in the blank area beside or
   * below the image select the node (the blue outline) instead of letting
   * ProseMirror place a caret there — which is what you want for typing
   * or drag-dropping the next image at the caret position. */
  display: block;
  width: fit-content;
  max-width: 100%;
  margin: 0.5rem 0;
}

.editor-image-frame {
  position: relative;
  display: inline-block;
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid transparent;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.editor-image-wrapper.selected .editor-image-frame {
  border-color: rgba(52, 152, 219, 0.7);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.25);
}

.editor-image {
  display: block;
  width: auto;
  height: auto;
  max-width: 200px;
  max-height: 200px;
  object-fit: contain;
  border-radius: 12px;
}

.editor-image-trash {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(225, 90, 90, 0.95);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.55);
  box-shadow: 0 6px 14px -6px rgba(150, 30, 30, 0.55);
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 140ms ease, transform 140ms ease, background 140ms ease;
  cursor: pointer;
}

.editor-image-frame:hover .editor-image-trash,
.editor-image-wrapper.selected .editor-image-trash {
  opacity: 1;
  transform: scale(1);
}

.editor-image-trash:hover {
  background: rgba(200, 60, 60, 1);
}
</style>
