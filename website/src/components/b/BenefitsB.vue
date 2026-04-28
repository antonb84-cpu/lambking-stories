<template lang="pug">
  section.benefits-b#warum
    .benefits-b-inner
      .benefits-b-head
        .label Warum SenfkornGeschichten
        h2 Geschichten, die&nbsp;
          em mehr
          | &nbsp;sind als Unterhaltung.
        p Damit Geschenke an dein Kind oder Patenkind nicht im Spielzeug-Berg verschwinden — sondern noch Jahre später beim Vorlesen-Lassen am Bett aufgeschlagen werden.

      .benefits-b-grid
        .benefit
          .benefit-icon.coral
            svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
              path(d="M4 6 L12 3 L20 6 V12 C20 16 16 19 12 21 C8 19 4 16 4 12 Z")
              path(d="M9 12 L11 14 L15 10")
          h3 Theologisch geprüft
          p Jede Geschichte ökumenisch von Theolog:innen gegengelesen — kein Konfessions-Streit, kein verwässerter Inhalt.

        .benefit
          .benefit-icon.gold
            svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
              rect(x="3", y="5", width="18", height="14", rx="2")
              path(d="M3 9 H21 M8 14 H12 M8 17 H10")
          h3 Hardcover, das Bestand hat
          p Klimaneutral on demand bei Gelato gedruckt — kein Lagerüberschuss, jedes Buch kommt vom nächstgelegenen Druckzentrum.

        .benefit
          .benefit-icon.sage
            svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
              circle(cx="12", cy="12", r="9")
              path(d="M5 5 L19 19")
          h3 Werbefrei, immer
          p Keine Banner, keine In-App-Käufe, kein Tracking deines Kindes — die App ist eine Erweiterung des Buchs, kein Werbe-Funnel.

        .benefit
          .benefit-icon.navy
            svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
              path(d="M4 5 H20 V19 H4 Z")
              path(d="M4 5 L12 13 L20 5")
          h3 14 Tage Geld-zurück
          p Wenn euch das Buch nicht überzeugt: zurücksenden, Geld zurück. Keine Diskussion, keine Extra-Gebühren.
</template>

<style scoped lang="scss">
.benefits-b {
  padding: 88px 20px;
  background: var(--paper);
  border-top: 1px solid var(--line);
}

.benefits-b-inner {
  max-width: 960px;
  margin: 0 auto;
}

.benefits-b-head {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 56px;

  .label {
    font-size: 12px;
    font-weight: 600;
    color: var(--coral);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 14px;
  }

  h2 {
    font-family: 'Fraunces', serif;
    font-size: 42px;
    line-height: 1.1;
    font-weight: 500;
    letter-spacing: -0.025em;
    margin-bottom: 16px;

    em {
      font-style: italic;
      color: var(--coral);
    }
  }

  p {
    font-size: 17px;
    line-height: 1.6;
    color: var(--ink-soft);
  }
}

.benefits-b-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px 32px;
}

.benefit {
  background: var(--cream);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 24px;

  h3 {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.01em;
    margin: 14px 0 6px;
  }

  p {
    font-size: 14.5px;
    line-height: 1.55;
    color: var(--ink-soft);
  }
}

.benefit-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
  }

  &.coral {
    background: var(--coral-soft);
    color: var(--coral-dark);
  }

  &.gold {
    background: var(--gold-soft);
    color: #7a5f1f;
  }

  &.sage {
    background: var(--sage-soft);
    color: #4d6a44;
  }

  &.navy {
    background: rgba(45, 53, 97, 0.1);
    color: var(--navy);
  }
}

@media (max-width: 760px) {
  .benefits-b {
    padding: 56px 18px;
  }
  .benefits-b-head h2 {
    font-size: 30px;
  }
  .benefits-b-grid {
    grid-template-columns: 1fr;
  }
}
</style>
