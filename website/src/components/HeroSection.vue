<template lang="pug">
  section.hero
    .wrap.hero-inner
      .eyebrow
        span.eyebrow-dot
        | Christliche Geschichten · Buch &amp; App
      h1.hero-title
        | Geschichten, die&nbsp;
        em Glauben pflanzen
        |  — in jedem Kinderherz.
      p.hero-lead
        | Biblisch fundierte Abenteuer für Kinder von 6 bis 12. Als gedrucktes Hardcover-Buch bei dir zu Hause — und als werbefreie App zum Lesen, Hören und Ausmalen.

      .hero-ctas
        a.btn-primary(href="#books")
          | Alle Bücher ansehen
          svg(viewBox="0 0 14 14", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round")
            path(d="M3 7 H11 M8 4 L11 7 L8 10")
        a.btn-secondary(href="#app") App entdecken

      .hero-meta
        .hero-meta-item
          svg(viewBox="0 0 16 16")
            path(d="M3 8.5 L6 11.5 L13 4.5", stroke-linecap="round", stroke-linejoin="round")
          | Biblisch geprüft
        .hero-meta-item
          svg(viewBox="0 0 16 16")
            path(d="M3 8.5 L6 11.5 L13 4.5", stroke-linecap="round", stroke-linejoin="round")
          | Klimaneutral gedruckt &amp; geliefert
        .hero-meta-item
          svg(viewBox="0 0 16 16")
            path(d="M3 8.5 L6 11.5 L13 4.5", stroke-linecap="round", stroke-linejoin="round")
          | Werbefrei

      .hero-books
        .hero-book(v-for="book in books", :key="book.title")
          BookCover(
            :series="book.series",
            :number="book.number",
            :title="book.title",
            :author="book.author",
            :series-class="book.seriesClass",
            small
          )
</template>

<script setup lang="ts">
import BookCover from './BookCover.vue'

const books = [
  {
    series: 'Fruchtagenten',
    number: '01',
    title: 'Mission<br>Friede',
    author: 'Anton Müller',
    seriesClass: 'c-fruchtagenten'
  },
  {
    series: 'Petrus &amp; Paulus',
    number: '01',
    title: 'Der Ruf<br>am See',
    author: 'Anton Müller',
    seriesClass: 'c-petrus'
  },
  {
    series: 'Gottes gr. Geschichte',
    number: '01',
    title: 'Am<br>Anfang',
    author: 'Anton Müller',
    seriesClass: 'c-geschichte'
  },
  {
    series: 'Obstsalat-Agenten',
    number: '01',
    title: 'Das erste<br>Rätsel',
    author: 'Anton Müller',
    seriesClass: 'c-obstsalat'
  }
]
</script>

<style scoped lang="scss">
.hero {
  position: relative;
  padding: 72px 0 88px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -200px;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--gold-soft) 0%, transparent 70%);
    opacity: 0.4;
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -150px;
    left: -180px;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--coral-soft) 0%, transparent 70%);
    opacity: 0.3;
    pointer-events: none;
  }
}

.hero-inner {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 860px;
  margin: 0 auto;
}

.hero-title {
  font-family: 'Fraunces', serif;
  font-size: 72px;
  line-height: 1.02;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: var(--ink);
  margin-bottom: 28px;

  :deep(em) {
    font-style: italic;
    color: var(--coral);
  }
}

.hero-lead {
  font-size: 19px;
  line-height: 1.55;
  color: var(--ink-soft);
  margin-bottom: 40px;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

.hero-ctas {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.hero-meta {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 13px;
  color: var(--ink-soft);
  font-weight: 500;
}

.hero-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 14px;
    height: 14px;
    stroke: var(--sage);
    fill: none;
    stroke-width: 2;
  }
}

.hero-books {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-top: 64px;
  flex-wrap: wrap;
}

.hero-book {
  width: 120px;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(26, 31, 58, 0.1),
  0 12px 32px rgba(26, 31, 58, 0.15);
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-6px);
  }

  &:nth-child(1) {
    transform: rotate(-6deg);

    &:hover {
      transform: rotate(-6deg) translateY(-6px);
    }
  }

  &:nth-child(2) {
    transform: rotate(-2deg) translateY(8px);

    &:hover {
      transform: rotate(-2deg) translateY(2px);
    }
  }

  &:nth-child(3) {
    transform: rotate(2deg);

    &:hover {
      transform: rotate(2deg) translateY(-6px);
    }
  }

  &:nth-child(4) {
    transform: rotate(6deg) translateY(12px);

    &:hover {
      transform: rotate(6deg) translateY(6px);
    }
  }
}

@media (max-width: 760px) {
  .hero {
    padding: 48px 0 64px;
  }
  .hero-title {
    font-size: 46px;
  }
  .hero-lead {
    font-size: 17px;
  }
  .hero-book {
    width: 95px;
  }
}
</style>
