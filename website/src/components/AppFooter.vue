<template lang="pug">
  footer.footer
    .wrap.footer-inner
      .footer-brand
        a.logo(href="#")
          .logo-mark
            svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
              path(d="M12 22 V11")
              path(d="M12 11 C8 11 6 8 6 5 C9 5 12 7 12 11")
              path(d="M12 11 C16 11 18 8 18 5 C15 5 12 7 12 11")
              circle(cx="12", cy="22", r="1.2", fill="currentColor")
          .logo-text SenfkornGeschichten
        p.footer-desc Christliche Kinderbücher und eine werbefreie App — für Familien, denen die Geschichten ihrer Kinder wichtig sind.

      .footer-col
        h4 Bücher
        ul
          li
            a(href="#books") Alle Bücher
          li
            a(href="#") Fruchtagenten
          li
            a(href="#") Gottes große Geschichte
          li
            a(href="#") Petrus &amp; Paulus
          li
            a(href="#") Geschenk-Sets

      .footer-col
        h4 App
        ul
          li
            a(href="#app") Funktionen
          li
            a(href="#") App Store
          li
            a(href="#") Google Play
          li
            a(href="#") Updates

      .footer-col
        h4 Service
        ul
          li
            a(href="#about") Über Anton
          li
            a(href="#faq") FAQ
          li(v-if="newsletterEnabled")
            a(href="#newsletter") Newsletter
          li
            a(href="#") Kontakt
          li
            a(href="#") Presse

    .wrap.footer-bottom
      div © 2026 SenfkornGeschichten · Made with ♥ in Deutschland
      .footer-bottom-links
        a(href="#") Impressum
        a(href="#") Datenschutz
        a(href="#") AGB
        a(href="#") Widerrufsbelehrung
        a(href="#") Versand
</template>

<script setup lang="ts">
import { runtime } from '@/config/runtime'

const newsletterEnabled = runtime.newsletterEnabled
</script>

<style scoped lang="scss">
.footer {
  background: var(--ink);
  color: var(--cream);
  padding: 72px 0 36px;
}

.footer-inner {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 56px;
}

@media (max-width: 760px) {
  .footer-inner {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  width: 36px;
  height: 36px;
  background: var(--gold);
  color: var(--navy-deep);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;

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
  color: var(--cream);
}

.footer-desc {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(250, 244, 234, 0.6);
  margin-top: 16px;
  max-width: 280px;
}

.footer-col h4 {
  font-family: 'Fraunces', serif;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 16px;
  color: var(--cream);
}

.footer-col ul {
  list-style: none;
}

.footer-col li {
  margin-bottom: 10px;
}

.footer-col a {
  font-size: 14px;
  color: rgba(250, 244, 234, 0.7);
  transition: color 0.15s;

  &:hover {
    color: var(--gold);
  }
}

.footer-bottom {
  padding-top: 32px;
  border-top: 1px solid rgba(250, 244, 234, 0.1);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: rgba(250, 244, 234, 0.5);
}

.footer-bottom-links {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;

  a {
    color: rgba(250, 244, 234, 0.5);

    &:hover {
      color: var(--gold);
    }
  }
}
</style>
