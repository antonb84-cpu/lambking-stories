<template lang="pug">
  footer.footer-b
    .footer-b-inner
      .footer-b-brand
        .b-logo-mark
          svg(viewBox="0 0 24 24", fill="none", stroke="currentColor", stroke-width="1.8", stroke-linecap="round", stroke-linejoin="round")
            path(d="M12 22 V11")
            path(d="M12 11 C8 11 6 8 6 5 C9 5 12 7 12 11")
            path(d="M12 11 C16 11 18 8 18 5 C15 5 12 7 12 11")
            circle(cx="12", cy="22", r="1.2", fill="currentColor")
        div SenfkornGeschichten
      .footer-b-links
        a(href="#") Impressum
        a(href="#") Datenschutz
        a(href="#") AGB
        a(href="#") Widerruf
        a(href="#") Versand
      .footer-b-copy © 2026 SenfkornGeschichten · Made with ♥ in Deutschland
</template>

<style scoped lang="scss">
.footer-b {
  background: var(--ink);
  color: rgba(250, 244, 234, 0.75);
  padding: 36px 20px;
}

.footer-b-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px 28px;
  font-size: 13px;
}

.footer-b-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Fraunces', serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--cream);

  .b-logo-mark {
    width: 28px;
    height: 28px;
    background: var(--gold);
    color: var(--navy-deep);
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 18px;
      height: 18px;
    }
  }
}

.footer-b-links {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;

  a {
    color: rgba(250, 244, 234, 0.65);

    &:hover {
      color: var(--gold);
    }
  }
}

.footer-b-copy {
  margin-left: auto;
  color: rgba(250, 244, 234, 0.45);
  font-size: 12px;
}

@media (max-width: 540px) {
  .footer-b-copy {
    margin-left: 0;
    width: 100%;
  }
}
</style>
