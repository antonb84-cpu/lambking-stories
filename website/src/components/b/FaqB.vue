<template lang="pug">
  section.faq-b#fragen
    .faq-b-inner
      h2 Bevor du bestellst.
      p.faq-b-lead Die Antworten auf die Fragen, die wir am häufigsten bekommen.

      .faq-b-list
        details.faq-b-item(v-for="item in items", :key="item.q", :open="item.open")
          summary
            | {{ item.q }}
            span.icon
              svg(viewBox="0 0 12 12", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round")
                path(d="M6 2 V10 M2 6 H10")
          .answer(v-html="item.a")
</template>

<script setup lang="ts">
const items: { q: string; a: string; open?: boolean }[] = [
  {
    q: 'Wie lange dauert die Lieferung?',
    a: '5–8 Werktage innerhalb Deutschlands. Wir drucken erst nach deiner Bestellung — darum etwas länger als im Lagerversand, dafür ohne Überproduktion.',
    open: true
  },
  {
    q: 'Für welches Alter ist das Buch geeignet?',
    a: 'Die <em>Fruchtagenten</em> sind für Kinder von 9 bis 11 Jahren — zum Selber-Lesen oder Vorlesen-Lassen. Empfehlung steht bei jedem Buch dabei.'
  },
  {
    q: 'Ist der Inhalt an eine Konfession gebunden?',
    a: 'Nein. Bewusst ökumenisch — geeignet für katholische, evangelische und freikirchliche Familien.'
  },
  {
    q: 'Was, wenn das Buch nicht gefällt?',
    a: '14 Tage Widerrufsrecht ab Erhalt. Zurücksenden, Geld zurück. Keine Diskussion, keine Extra-Gebühren.'
  }
]
</script>

<style scoped lang="scss">
.faq-b {
  padding: 88px 20px;
  background: var(--cream);
}

.faq-b-inner {
  max-width: 720px;
  margin: 0 auto;
}

h2 {
  font-family: 'Fraunces', serif;
  font-size: 34px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
  text-align: center;
}

.faq-b-lead {
  text-align: center;
  color: var(--ink-soft);
  margin-bottom: 36px;
  font-size: 15.5px;
}

.faq-b-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.faq-b-item {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 4px 18px;
  transition: border-color 0.15s;

  &[open] {
    border-color: var(--line-strong);
  }

  summary {
    list-style: none;
    cursor: pointer;
    padding: 16px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 500;
    color: var(--ink);

    &::-webkit-details-marker {
      display: none;
    }
  }

  &[open] summary {
    color: var(--coral);
  }
}

.icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s, background 0.15s, border-color 0.15s;

  svg {
    width: 11px;
    height: 11px;
    color: var(--ink);
  }
}

details[open] .icon {
  transform: rotate(45deg);
  background: var(--coral);
  border-color: var(--coral);

  svg {
    color: #fff;
  }
}

.answer {
  padding: 0 0 18px;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--ink-soft);

  :deep(em) {
    color: var(--ink);
    font-style: italic;
  }
}

@media (max-width: 540px) {
  .faq-b {
    padding: 56px 18px;
  }
  h2 {
    font-size: 26px;
  }
}
</style>
