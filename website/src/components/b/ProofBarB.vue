<template lang="pug">
  section.proof-bar
    .proof-bar-inner
      .proof
        svg(viewBox="0 0 20 20")
          path(d="M3 10 L8 15 L17 6", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
        span Biblisch geprüft &amp; ökumenisch
      .proof
        svg(viewBox="0 0 20 20")
          path(d="M10 3 C 6 3 4 6 4 9 C 4 14 10 18 10 18 C 10 18 16 14 16 9 C 16 6 14 3 10 3 Z", fill="none", stroke="currentColor", stroke-width="2", stroke-linecap="round", stroke-linejoin="round")
        span Klimaneutral, Print-on-Demand
      .proof
        svg(viewBox="0 0 20 20")
          circle(cx="10", cy="10", r="7", fill="none", stroke="currentColor", stroke-width="2")
          path(d="M5 5 L15 15", stroke="currentColor", stroke-width="2", stroke-linecap="round")
        span Werbefrei, kein Tracking
      .proof
        svg(viewBox="0 0 20 20")
          rect(x="3", y="3", width="14", height="14", rx="2", fill="none", stroke="currentColor", stroke-width="2")
          path(d="M3 8 H17 M8 3 V8", stroke="currentColor", stroke-width="2")
        span 14 Tage Widerrufsrecht
</template>

<style scoped lang="scss">
.proof-bar {
  background: var(--ink);
  color: var(--cream);
  padding: 14px 20px;
}

.proof-bar-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px 36px;
  font-size: 13px;
  font-weight: 500;
}

.proof {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(250, 244, 234, 0.85);

  svg {
    width: 16px;
    height: 16px;
    color: var(--gold);
  }
}
</style>
