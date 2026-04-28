<template lang="pug">
  section.section.about-section#about
    .wrap.about-inner
      .about-portrait
        .about-portrait-placeholder
          svg(viewBox="0 0 56 56", stroke-linecap="round", stroke-linejoin="round")
            circle(cx="28", cy="22", r="8")
            path(d="M12 48 C12 38 20 34 28 34 C36 34 44 38 44 48")
          | [Foto von Anton]

      .about-text
        .section-eyebrow Über den Autor
        p.about-quote Kinder verdienen Geschichten, die ihnen nicht nur gefallen — sondern sie auch tragen.
        p
          | Mein Name ist Anton. Ich bin Vater, Christ und seit über zehn Jahren Autor von christlichen Kinderbüchern und Liedern. SenfkornGeschichten ist das Projekt, das alles vereint: biblisch fundierte Inhalte, liebevoll erzählt, für Kinder in einem Alter, in dem sie langsam beginnen, ihren eigenen Glauben zu formen.
        p
          | Jede Geschichte, jedes Lied, jede Ausmalseite entsteht in enger Abstimmung mit Theolog:innen und Pädagog:innen — und wird dann an meinen eigenen Kindern getestet, bevor sie zu euch kommt.
        .about-signature
          .signature-mark A
          .about-signature-text
            strong Anton Müller
            span Gründer · Autor · Vater
</template>

<style scoped lang="scss">
.about-section {
  background: var(--paper);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.about-inner {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 72px;
  align-items: center;
}

@media (max-width: 900px) {
  .about-inner {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  .about-portrait {
    margin: 0 auto;
  }
}

.about-portrait {
  width: 100%;
  max-width: 380px;
  aspect-ratio: 4 / 5;
  background: var(--cream-dark);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-ghost);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 30%, var(--coral-soft), transparent 60%),
    radial-gradient(circle at 70% 70%, var(--gold-soft), transparent 60%);
    opacity: 0.5;
  }
}

.about-portrait-placeholder {
  position: relative;
  z-index: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  padding: 20px;

  svg {
    width: 56px;
    height: 56px;
    stroke: var(--ink-ghost);
    fill: none;
    stroke-width: 1.5;
    margin: 0 auto 12px;
    display: block;
  }
}

.about-quote {
  font-family: 'Fraunces', serif;
  font-size: 30px;
  font-style: italic;
  line-height: 1.25;
  letter-spacing: -0.015em;
  margin-bottom: 28px;
  color: var(--ink);

  &::before {
    content: '„';
    color: var(--coral);
    font-weight: 500;
    margin-right: 2px;
  }

  &::after {
    content: '"';
    color: var(--coral);
    font-weight: 500;
  }
}

.about-text p {
  font-size: 16px;
  line-height: 1.65;
  color: var(--ink-soft);
  margin-bottom: 16px;
}

.about-signature {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.signature-mark {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: var(--navy);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fraunces', serif;
  font-size: 18px;
  font-style: italic;
  font-weight: 500;
}

.about-signature-text {
  font-size: 14px;

  strong {
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 500;
    color: var(--ink);
    display: block;
  }

  span {
    color: var(--ink-soft);
    font-size: 13px;
  }
}
</style>
