<template lang="pug">
  section.newsletter#newsletter
    .wrap.newsletter-inner
      .newsletter-icon
        svg(viewBox="0 0 28 28", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
          rect(x="4", y="7", width="20", height="14", rx="2")
          path(d="M4 9 L14 16 L24 9")
      h2
        | Sei der Erste bei&nbsp;
        em neuen Geschichten.
      p Alle paar Wochen eine Mail mit neuen Buch-Veröffentlichungen, App-Updates, kostenlosen Ausmalseiten und einem kleinen Impuls aus meinem Familien-Alltag.
      form.newsletter-form(action="#", method="post")
        input.newsletter-input(type="email", name="email", placeholder="deine@email.de", required)
        button.newsletter-btn(type="submit") Anmelden
      p.newsletter-mini
        | Kein Spam, jederzeit abbestellbar. Mehr in der&nbsp;
        a(href="#") Datenschutzerklärung
        | .
</template>

<style scoped lang="scss">
.newsletter {
  padding: 96px 0;
  background: var(--cream-dark);
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  text-align: center;
}

.newsletter-inner {
  max-width: 580px;
  margin: 0 auto;
}

.newsletter-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--ink);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;

  svg {
    width: 28px;
    height: 28px;
  }
}

h2 {
  font-family: 'Fraunces', serif;
  font-size: 38px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 14px;

  em {
    font-style: italic;
    color: var(--coral);
  }
}

p {
  font-size: 16px;
  line-height: 1.55;
  color: var(--ink-soft);
  margin-bottom: 28px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.newsletter-form {
  display: flex;
  gap: 8px;
  max-width: 480px;
  margin: 0 auto 16px;
}

.newsletter-input {
  flex: 1;
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 14px 22px;
  font-size: 15px;
  font-family: inherit;
  color: var(--ink);
  transition: border-color 0.15s;

  &:focus {
    outline: none;
    border-color: var(--coral);
    box-shadow: 0 0 0 3px var(--coral-soft);
  }
}

.newsletter-btn {
  background: var(--ink);
  color: var(--cream);
  border: none;
  padding: 14px 26px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--navy-deep);
  }
}

.newsletter-mini {
  font-size: 12px;
  color: var(--ink-ghost);
  margin-bottom: 0;

  a {
    color: var(--ink-soft);
    text-decoration: underline;
  }
}

@media (max-width: 540px) {
  .newsletter-form {
    flex-direction: column;
  }
  h2 {
    font-size: 30px;
  }
}
</style>
