<template lang="pug">
  nav.nav
    .nav-inner
      a.logo(href="#")
        .logo-mark
          svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
            path(d="M12 22 V11")
            path(d="M12 11 C8 11 6 8 6 5 C9 5 12 7 12 11")
            path(d="M12 11 C16 11 18 8 18 5 C15 5 12 7 12 11")
            circle(cx="12", cy="22", r="1.2", fill="currentColor")
        .logo-text SenfkornGeschichten
      .nav-links
        a.nav-link(href="#books") Bücher
        a.nav-link(href="#app") App
        a.nav-link(href="#about") Über Anton
        a.nav-link(href="#faq") FAQ
        a.nav-cta(v-if="newsletterEnabled", href="#newsletter") Newsletter
</template>

<script setup lang="ts">
import { runtime } from '@/config/runtime'

const newsletterEnabled = runtime.newsletterEnabled
</script>

<style scoped lang="scss">
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(250, 244, 234, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--line);
}

.nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  background: var(--navy);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);

  svg {
    width: 22px;
    height: 22px;
  }
}

.logo-text {
  font-family: 'Fraunces', serif;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.nav-links {
  display: flex;
  gap: 28px;
  align-items: center;
}

.nav-link {
  font-size: 14px;
  color: var(--ink-soft);
  font-weight: 500;
  transition: color 0.15s;

  &:hover {
    color: var(--ink);
  }
}

.nav-cta {
  background: var(--ink);
  color: var(--cream);
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s;

  &:hover {
    background: var(--navy-deep);
  }
}

@media (max-width: 820px) {
  .nav-links .nav-link {
    display: none;
  }
}
</style>
