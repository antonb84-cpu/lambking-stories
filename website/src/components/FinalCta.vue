<template lang="pug">
  section.final-cta
    .wrap.final-cta-inner
      h2
        | Womit möchtest du&nbsp;
        em anfangen?
      p Zwei Wege in die Welt der SenfkornGeschichten — wähl den, der zu eurer Familie passt.

      .final-cta-options
        a.final-option(href="#books")
          .final-option-icon
            svg(viewBox="0 0 20 20")
              rect(x="4", y="3", width="12", height="14", rx="1")
              path(d="M4 7 H16 M8 11 H12 M8 14 H11")
          h3 Ein Buch bestellen
          p Hardcover, klimaneutral gedruckt, in 5–8 Tagen bei dir zu Hause.
          span.final-option-link
            | Zu den Büchern
            svg(viewBox="0 0 11 11")
              path(d="M2 5.5 H9 M6.5 3 L9 5.5 L6.5 8", stroke-linecap="round")

        a.final-option(href="#app")
          .final-option-icon.navy
            svg(viewBox="0 0 20 20")
              rect(x="6", y="2", width="8", height="16", rx="1.5")
              circle(cx="10", cy="15", r="0.8", fill="currentColor", stroke="none")
          h3 App herunterladen
          p Lesen, Hören, Ausmalen und Belohnungen — alles in einer App.
          span.final-option-link
            | Zur App
            svg(viewBox="0 0 11 11")
              path(d="M2 5.5 H9 M6.5 3 L9 5.5 L6.5 8", stroke-linecap="round")
</template>

<style scoped lang="scss">
.final-cta {
  padding: 120px 0;
  text-align: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 50%, var(--coral-soft) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 50%, var(--gold-soft) 0%, transparent 50%);
    opacity: 0.5;
    pointer-events: none;
  }
}

.final-cta-inner {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin: 0 auto;

  > p {
    font-size: 18px;
    line-height: 1.6;
    color: var(--ink-soft);
    margin-bottom: 36px;
  }
}

h2 {
  font-family: 'Fraunces', serif;
  font-size: 56px;
  line-height: 1.02;
  font-weight: 500;
  letter-spacing: -0.028em;
  margin-bottom: 24px;

  em {
    font-style: italic;
    color: var(--coral);
  }
}

.final-cta-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 640px;
  margin: 0 auto;
}

@media (max-width: 600px) {
  .final-cta-options {
    grid-template-columns: 1fr;
  }
  h2 {
    font-size: 36px;
  }
  .final-cta {
    padding: 72px 0;
  }
}

.final-option {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 28px 24px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--line-strong);
  }
}

.final-option-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--coral);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;

  &.navy {
    background: var(--navy);
    color: var(--gold);
  }

  svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
  }
}

.final-option h3 {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin: 0;
}

.final-option p {
  font-size: 14px;
  color: var(--ink-soft);
  line-height: 1.5;
  margin: 0 0 6px;
}

.final-option-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--coral);
  margin-top: auto;

  svg {
    width: 11px;
    height: 11px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
  }
}
</style>
