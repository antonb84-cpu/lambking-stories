<template lang="pug">
  section.section.app-section#app
    .wrap.app-inner
      .app-text
        .section-eyebrow Die App
        h2.section-title
          | Dieselben Geschichten —&nbsp;
          em digital erlebbar.
        p.section-lead
          | Für unterwegs, zum Vorlesen-Lassen oder zum Ausmalen während Papa das Abendessen kocht. Alle Bücher stehen dir auch in der SenfkornGeschichten-App zur Verfügung.

        .app-feature-list
          .app-feature
            .app-feature-icon
              svg(viewBox="0 0 24 24")
                path(d="M4 4 h16 v16 h-16 z M4 8 h16 M8 12 h8 M8 16 h5")
            .app-feature-text
              strong Lesen und Hören
              span Jede Geschichte als Text und als professionell vertontes Hörbuch.
          .app-feature
            .app-feature-icon
              svg(viewBox="0 0 24 24")
                circle(cx="12", cy="12", r="8")
                circle(cx="8", cy="10", r="1.5", fill="currentColor")
                circle(cx="16", cy="10", r="1.5", fill="currentColor")
                circle(cx="12", cy="16", r="1.5", fill="currentColor")
            .app-feature-text
              strong Direkt ausmalen
              span Figuren aus den Büchern ausmalen — ohne Drucker, ohne Bastelei.
          .app-feature
            .app-feature-icon
              svg(viewBox="0 0 24 24")
                path(d="M12 3 L14 9 L20 9 L15 13 L17 19 L12 15 L7 19 L9 13 L4 9 L10 9 Z")
            .app-feature-text
              strong Quiz und Belohnungen
              span Nach jedem Buch ein kurzes Verständnis-Quiz. Mit Abzeichen, Streaks und Levels.

        .app-store-row
          a.store-btn(href="#")
            svg(viewBox="0 0 24 24", fill="currentColor")
              path(d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z")
            .store-btn-text
              .store-btn-top Download im
              .store-btn-bottom App Store
          a.store-btn(href="#")
            svg(viewBox="0 0 24 24")
              path(d="M3 20.5V3.5a1 1 0 0 1 1.5-.87L20 11.13a1 1 0 0 1 0 1.74L4.5 21.37A1 1 0 0 1 3 20.5z", fill="#D4A24C")
              path(d="M3 3.5v17l8.5-8.5L3 3.5z", fill="#E8735A")
              path(d="M3 3.5l8.5 8.5 3-3L4.5 2.63A1 1 0 0 0 3 3.5z", fill="#7A9A6E")
              path(d="M3 20.5l8.5-8.5 3 3L4.5 21.37a1 1 0 0 1-1.5-.87z", fill="#3E6BA8")
            .store-btn-text
              .store-btn-top Jetzt bei
              .store-btn-bottom Google Play

      .app-visual
        .phone-frame
          .phone-screen
            .status-bar
              span 9:41
              div
                svg(viewBox="0 0 20 12", fill="none", stroke="currentColor", stroke-width="1.5", width="14", height="9")
                  rect(x="1", y="1", width="16", height="10", rx="2")
                  rect(x="3", y="3", width="11", height="6", fill="currentColor")
            .app-header-row
              .app-greeting
                | Willkommen zurück,
                strong Jonas
              .streak-pill
                svg(viewBox="0 0 10 12")
                  path(d="M5 0 C6 3 9 4 8 8 C8 10 6 12 5 12 C4 12 2 10 2 8 C1 5 3 4 4 1 Z")
                | 3
            .app-body
              .hero-card-mini
                .hero-cover-mini
                  BookCover(series="FA", number="01", title="Mission<br>Friede", series-class="c-fruchtagenten", small)
                .hero-text-mini
                  .hero-label-mini Weiterlesen
                  .hero-title-mini Mission Friede
                  .hero-progress-row
                    .progress-bar
                      .progress-fill
                    span.progress-value 42%
                  button.btn-mini
                    svg(viewBox="0 0 8 8")
                      path(d="M1 0 L7 4 L1 8 Z")
                    | Weiter

              div
                .section-mini.series-row-label Deine Reihen
                .series-row
                  .series-mini.s-fruchtagenten
                    svg(width="14", height="14", viewBox="0 0 20 20", fill="none", stroke="#fff", stroke-width="1.5", opacity="0.85")
                      circle(cx="10", cy="12", r="6")
                      path(d="M10 6 V3 M10 3 Q13 3 13 5", stroke-linecap="round")
                    .series-count 5
                      span Bände
                  .series-mini.s-petrus
                    svg(width="14", height="14", viewBox="0 0 20 20", fill="none", stroke="#fff", stroke-width="1.5", opacity="0.85")
                      path(d="M3 12 Q10 8 17 12", stroke-linecap="round")
                      path(d="M10 5 V13 M7 9 H13", stroke-linecap="round")
                    .series-count 2
                      span Bände
                  .series-mini.s-geschichte
                    svg(width="14", height="14", viewBox="0 0 20 20", fill="none", stroke="#fff", stroke-width="1.5", opacity="0.85")
                      circle(cx="10", cy="10", r="4")
                      path(d="M10 2 V4 M10 16 V18 M2 10 H4 M16 10 H18", stroke-linecap="round")
                    .series-count 4
                      span Bände
            .bottom-nav
              .nav-item-sm.active
                svg(viewBox="0 0 20 20")
                  path(d="M3 9 L10 3 L17 9 V17 H3 Z")
                | Start
              .nav-item-sm
                svg(viewBox="0 0 20 20")
                  rect(x="4", y="3", width="4", height="14")
                  rect(x="9", y="3", width="4", height="14")
                  rect(x="14", y="6", width="3", height="11")
                | Bibliothek
              .nav-item-sm
                svg(viewBox="0 0 20 20")
                  path(d="M10 3 A7 7 0 1 0 10 17 C12 17 12 15 11 14 C10 13 12 12 14 12 A3 3 0 0 0 17 9 A7 7 0 0 0 10 3 Z")
                | Ausmalen
              .nav-item-sm
                svg(viewBox="0 0 20 20")
                  path(d="M5 8 A5 5 0 1 0 15 8 A5 5 0 0 0 5 8 Z")
                  path(d="M7 12 L5 19 L10 16 L15 19 L13 12")
                | Belohnung
</template>

<script setup lang="ts">
import BookCover from './BookCover.vue'
</script>

<style scoped lang="scss">
.app-section {
  padding: 120px 0;
}

.app-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

@media (max-width: 900px) {
  .app-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .app-visual {
    order: -1;
  }
}

.app-feature-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 32px 0;
}

.app-feature {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.app-feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--coral-soft);
  color: var(--coral-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;

  svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.app-feature-text strong {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 500;
  color: var(--ink);
  display: block;
  margin-bottom: 2px;
}

.app-feature-text span {
  font-size: 14.5px;
  color: var(--ink-soft);
  line-height: 1.5;
}

.app-store-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.store-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--ink);
  color: var(--cream);
  padding: 10px 18px 10px 16px;
  border-radius: 12px;
  transition: background 0.15s;

  &:hover {
    background: var(--navy-deep);
  }

  svg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
}

.store-btn-text {
  text-align: left;
}

.store-btn-top {
  font-size: 9.5px;
  opacity: 0.7;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 500;
}

.store-btn-bottom {
  font-family: 'Fraunces', serif;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin-top: 1px;
}

.app-visual {
  display: flex;
  justify-content: center;
}

.phone-frame {
  width: 280px;
  aspect-ratio: 280 / 580;
  background: var(--ink);
  border-radius: 38px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(26, 31, 58, 0.1),
  0 20px 48px rgba(26, 31, 58, 0.15);
  transform: rotate(-3deg);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: var(--cream);
  border-radius: 29px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.status-bar {
  height: 22px;
  padding: 6px 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10px;
  font-weight: 600;
  color: var(--ink);
  flex-shrink: 0;
}

.app-header-row {
  padding: 10px 16px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-greeting {
  font-size: 11px;
  color: var(--ink-soft);

  strong {
    color: var(--ink);
    font-weight: 600;
    font-size: 13px;
    display: block;
    margin-top: 1px;
  }
}

.streak-pill {
  background: var(--coral-soft);
  color: var(--coral-dark);
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 3px;

  svg {
    width: 8px;
    height: 9px;
    fill: currentColor;
  }
}

.app-body {
  flex: 1;
  overflow: hidden;
  padding: 4px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-mini {
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.series-row-label {
  margin-bottom: 6px;
}

.hero-card-mini {
  background: var(--paper);
  border-radius: 14px;
  padding: 10px;
  display: flex;
  gap: 10px;
  border: 1px solid var(--line);
}

.hero-cover-mini {
  width: 52px;
  height: 70px;
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
}

.hero-text-mini {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.hero-label-mini {
  font-size: 8.5px;
  color: var(--s-fruchtagenten);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-title-mini {
  font-family: 'Fraunces', serif;
  font-size: 13px;
  font-weight: 500;
  margin: 2px 0 5px;
  letter-spacing: -0.01em;
}

.hero-progress-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: auto;
}

.progress-bar {
  height: 3px;
  background: var(--line);
  border-radius: 999px;
  overflow: hidden;
  flex: 1;
}

.progress-fill {
  height: 100%;
  width: 42%;
  background: var(--s-fruchtagenten);
}

.progress-value {
  font-size: 9px;
  color: var(--ink-soft);
  font-weight: 500;
}

.btn-mini {
  background: var(--navy);
  color: var(--cream);
  font-size: 9.5px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  align-self: flex-start;

  svg {
    width: 7px;
    height: 7px;
    fill: currentColor;
  }
}

.series-row {
  display: flex;
  gap: 8px;
  margin: 4px 0;
}

.series-mini {
  flex: 1;
  aspect-ratio: 1;
  border-radius: 10px;
  padding: 8px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &.s-fruchtagenten {
    background: linear-gradient(145deg, var(--s-fruchtagenten), #8e3a28);
  }

  &.s-petrus {
    background: linear-gradient(145deg, var(--s-petrus), #264872);
  }

  &.s-geschichte {
    background: linear-gradient(145deg, var(--s-geschichte), #8a631e);
  }
}

.series-count {
  font-family: 'Fraunces', serif;
  font-size: 14px;
  font-style: italic;
  line-height: 1;

  span {
    font-size: 8px;
    opacity: 0.7;
    font-style: normal;
    font-family: 'DM Sans', sans-serif;
    margin-left: 2px;
  }
}

.bottom-nav {
  flex-shrink: 0;
  height: 50px;
  background: var(--paper);
  border-top: 1px solid var(--line);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 6px 8px 8px;
}

.nav-item-sm {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 8.5px;
  font-weight: 500;
  color: var(--ink-ghost);

  svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.5;
  }

  &.active {
    color: var(--navy);

    svg {
      stroke-width: 2;
      fill: var(--navy);
      fill-opacity: 0.08;
    }
  }
}
</style>
