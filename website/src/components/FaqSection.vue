<template lang="pug">
  section.section#faq
    .wrap
      .section-head.centered
        .section-eyebrow Häufige Fragen
        h2.section-title
          | Was du&nbsp;
          em wissen möchtest.

      .faq-list
        details.faq-item(v-for="item in items", :key="item.q")
          summary.faq-question
            | {{ item.q }}
            span.faq-icon
              svg(viewBox="0 0 12 12")
                path(d="M6 2 V10 M2 6 H10")
          .faq-answer
            p(v-for="(p, i) in item.a", :key="i", v-html="p")
</template>

<script setup lang="ts">
const items: { q: string; a: string[] }[] = [
  {
    q: 'Wo werden die Bücher gedruckt?',
    a: [
      'Alle Bücher werden bei Gelato gedruckt — einem Print-on-Demand-Partner mit Druckstandorten in über 30 Ländern. Dein Buch wird erst gedruckt, wenn du bestellst, und kommt vom nächstgelegenen Standort zu dir. Das spart Transportwege und ist deutlich klimafreundlicher als zentrale Lagerhaltung.'
    ]
  },
  {
    q: 'Wie lange dauert der Versand?',
    a: [
      'Druck &amp; Versand zusammen dauern in der Regel 5–8 Werktage innerhalb Deutschlands. Das Buch wird erst nach deiner Bestellung gedruckt — darum etwas länger als im Lagerversand.'
    ]
  },
  {
    q: 'Versendet ihr auch ins Ausland?',
    a: [
      'Ja — in die gesamte EU, die Schweiz, Großbritannien und viele weitere Länder. Die Bücher werden vom nächstgelegenen Gelato-Druckzentrum versendet, das spart Zeit und CO₂. Versandkosten werden im Checkout berechnet.'
    ]
  },
  {
    q: 'Was ist der Unterschied zwischen Buch und App?',
    a: [
      'Die gedruckten Bücher sind hochwertige Hardcover zum Lesen und Verschenken. Die App bietet dieselben Geschichten zusätzlich zum Hören, Ausmalen und mit interaktiven Quiz-Fragen — plus Belohnungen und Lese-Streaks.',
      'Viele Familien nutzen beides: Buch für die Abend-Routine, App für unterwegs.'
    ]
  },
  {
    q: 'Ist der Inhalt an eine bestimmte Konfession gebunden?',
    a: [
      'Nein. SenfkornGeschichten ist bewusst ökumenisch und nicht konfessionsgebunden. Die Geschichten stützen sich auf das gemeinsame Zeugnis der Bibel und sind sowohl für katholische als auch evangelische und freikirchliche Familien geeignet.'
    ]
  },
  {
    q: 'Für welches Alter sind die Bücher geeignet?',
    a: [
      'Das hängt von der Reihe ab. Die <em>Fruchtagenten</em> sind für Kinder von 9 bis 11 Jahren geschrieben — zum Selber-Lesen oder Vorlesen-Lassen. <em>Gottes große Geschichte</em> als Wimmelbuch eignet sich ab 6 Jahren, <em>Petrus &amp; Paulus</em> für 10 bis 12. Die empfohlene Altersgruppe steht bei jedem Buch oben.'
    ]
  },
  {
    q: 'Gibt es ein Widerrufsrecht?',
    a: [
      'Ja, wie gesetzlich vorgeschrieben: 14 Tage Widerrufsrecht ab Erhalt der Ware. Details zur Rücksendung findest du in unseren AGB und der Widerrufsbelehrung.'
    ]
  },
  {
    q: 'Kann ich Bücher als Geschenk direkt an eine andere Adresse versenden?',
    a: [
      'Ja — im Checkout kannst du eine abweichende Lieferadresse angeben. Auf Wunsch auch mit Geschenkverpackung und persönlicher Karte (gegen kleinen Aufpreis).'
    ]
  }
]
</script>

<style scoped lang="scss">
.faq-list {
  max-width: 760px;
  margin: 0 auto;
}

.faq-item {
  border-bottom: 1px solid var(--line);

  &:first-child {
    border-top: 1px solid var(--line);
  }
}

.faq-question {
  font-family: 'Fraunces', serif;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.01em;
  padding: 22px 0;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  color: var(--ink);
  transition: color 0.15s;

  &::-webkit-details-marker {
    display: none;
  }

  &:hover {
    color: var(--coral);
  }
}

.faq-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s, background 0.15s;

  svg {
    width: 12px;
    height: 12px;
    stroke: var(--ink);
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
  }
}

details[open] .faq-icon {
  transform: rotate(45deg);
  background: var(--coral);
  border-color: var(--coral);

  svg {
    stroke: #fff;
  }
}

.faq-answer {
  padding: 0 48px 24px 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink-soft);

  p {
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
