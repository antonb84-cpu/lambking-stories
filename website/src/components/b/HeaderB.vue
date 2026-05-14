<template lang="pug">
  header.b-header
    .b-header-inner
      a.b-logo(href="#top")
        .b-logo-mark
          svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
            path(d="M12 22 V11")
            path(d="M12 11 C8 11 6 8 6 5 C9 5 12 7 12 11")
            path(d="M12 11 C16 11 18 8 18 5 C15 5 12 7 12 11")
            circle(cx="12", cy="22", r="1.2", fill="currentColor")
        span.b-logo-text SenfkornGeschichten

      .b-header-actions
        a.b-kofi(
          href="https://ko-fi.com/U6U21YO0Z5",
          target="_blank",
          rel="noopener noreferrer",
          title="Unterstütze mich auf hier"
        )
          img.b-kofi-img(src="https://storage.ko-fi.com/cdn/cup-border.png", alt="Ko-fi")
          span.b-kofi-text Unterstütze mich auf hier
        a.b-cta(v-if="buyUrl", :href="buyUrl", target="_blank", rel="noopener") buy
</template>

<script setup lang="ts">
defineProps<{ buyUrl: string }>()
</script>

<style scoped lang="scss">
.b-header {
  position: sticky;
  top: 0;
  z-index: 90;
  background: rgba(250, 244, 234, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--line);
}

.b-header-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
}

.b-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.b-logo-mark {
  width: 32px;
  height: 32px;
  background: var(--navy);
  color: var(--gold);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 20px;
    height: 20px;
  }
}

.b-logo-text {
  font-family: 'PoetsenOne', serif;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.b-cta {
  background: var(--coral);
  color: #fff;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  transition: background 0.15s, transform 0.15s;

  &:hover {
    background: var(--coral-dark);
    transform: translateY(-1px);
  }
}

.b-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.b-kofi {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #60daf0;
  color: #fff;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: filter 0.15s, transform 0.15s;

  &:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
  }
}

.b-kofi-img {
  width: 18px;
  height: 18px;
  display: block;
}

@media (max-width: 540px) {
  .b-logo-text {
    font-size: 15px;
  }

  .b-kofi-text {
    display: none;
  }

  .b-kofi {
    padding: 8px;
  }
}
</style>
