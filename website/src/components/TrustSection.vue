<template lang="pug">
  section.section.trust
    .wrap.trust-inner
      .trust-text
        .section-eyebrow Für Eltern
        h2
          | Geschenke, die du mit&nbsp;
          em gutem Gewissen
          |  überreichen kannst.
        p.trust-lead
          | Von christlichen Autor:innen, Pädagog:innen und Eltern für Familien gemacht, denen es nicht egal ist, was ihre Kinder lesen, hören und anschauen.

      .trust-list
        .trust-item
          .trust-icon
            svg(viewBox="0 0 24 24")
              path(d="M4 6 L12 3 L20 6 V12 C20 16 16 19 12 21 C8 19 4 16 4 12 Z")
              path(d="M9 12 L11 14 L15 10")
          div
            .trust-title Biblisch geprüft
            .trust-text Jede Geschichte von christlichen Autor:innen verfasst und theologisch gegengelesen — ökumenisch verträglich.

        .trust-item
          .trust-icon
            svg(viewBox="0 0 24 24")
              path(d="M12 3 C 8 3 5 6 5 10 C 5 16 12 21 12 21 C 12 21 19 16 19 10 C 19 6 16 3 12 3 Z")
          div
            .trust-title Klimaneutral gedruckt
            .trust-text Alle Bücher werden Print-on-Demand bei Gelato gedruckt — nur was bestellt wird, wird auch produziert. Kein Lagerüberschuss, kein Müll.

        .trust-item
          .trust-icon
            svg(viewBox="0 0 24 24")
              circle(cx="12", cy="12", r="9")
              path(d="M6 6 L18 18")
          div
            .trust-title Null Werbung in der App
            .trust-text Kein Tracking, keine Bannerwerbung, keine In-App-Käufe für Kinder.

        .trust-item
          .trust-icon
            svg(viewBox="0 0 24 24")
              rect(x="4", y="4", width="16", height="16", rx="2")
              path(d="M4 10 H20 M10 4 V10")
          div
            .trust-title 14 Tage Widerrufsrecht
            .trust-text Gefällt euch das Buch nicht, einfach zurücksenden. Keine Diskussion, keine Extra-Gebühren.
</template>

<style scoped lang="scss">
.trust {
  background: var(--navy);
  color: var(--cream);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -200px;
    right: -200px;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212, 162, 76, 0.2), transparent 70%);
  }
}

.trust-inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 72px;
  align-items: center;
}

@media (max-width: 900px) {
  .trust-inner {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

.trust :deep(.section-eyebrow) {
  color: var(--gold);

  &::before {
    background: var(--gold);
  }
}

h2 {
  font-family: 'Fraunces', serif;
  font-size: 44px;
  line-height: 1.1;
  font-weight: 500;
  letter-spacing: -0.025em;
  margin-bottom: 24px;

  em {
    font-style: italic;
    color: var(--gold);
  }
}

.trust-lead {
  font-size: 17px;
  line-height: 1.6;
  opacity: 0.85;
}

.trust-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.trust-item {
  display: flex;
  gap: 18px;
  padding: 20px 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(8px);
}

.trust-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--gold);
  color: var(--navy-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
}

.trust-title {
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
}

.trust-text {
  font-size: 14px;
  line-height: 1.55;
  opacity: 0.8;
}
</style>
