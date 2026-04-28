<template lang="pug">
  .book-cover(:class="[seriesClass, { small }]")
    .bc-top
      .bc-series {{ series }}
      .bc-number {{ number }}
    div
      .bc-title(v-html="title")
      .bc-author(v-if="author") {{ author }}
</template>

<script setup lang="ts">
defineProps<{
  series: string
  number: string
  title: string
  author?: string
  seriesClass?: string
  small?: boolean
}>()
</script>

<style scoped lang="scss">
.book-cover {
  width: 100%;
  height: 100%;
  padding: 14px 14px 18px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
  position: relative;
  overflow: hidden;
  border-left: 3px solid rgba(0, 0, 0, 0.2);
  background: linear-gradient(145deg, var(--s-fruchtagenten), #8e3a28);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at 85% 12%,
        rgba(255, 255, 255, 0.22),
        transparent 60%
    );
    pointer-events: none;
  }

  &.c-fruchtagenten {
    background: linear-gradient(145deg, var(--s-fruchtagenten), #8e3a28);
  }

  &.c-petrus {
    background: linear-gradient(145deg, var(--s-petrus), #264872);
  }

  &.c-geschichte {
    background: linear-gradient(145deg, var(--s-geschichte), #8a631e);
  }

  &.c-obstsalat {
    background: linear-gradient(145deg, var(--s-obstsalat), #5e3149);
  }

  &.c-navy {
    background: linear-gradient(145deg, var(--navy), var(--navy-deep));
  }
}

.bc-top {
  position: relative;
  z-index: 1;
}

.bc-series {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.8;
}

.bc-number {
  font-family: 'Fraunces', serif;
  font-size: 42px;
  font-style: italic;
  font-weight: 500;
  line-height: 1;
  margin-top: 6px;
  position: relative;
  z-index: 1;
}

.bc-title {
  font-family: 'Fraunces', serif;
  font-size: 17px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.01em;
  position: relative;
  z-index: 1;
  margin-bottom: 10px;
}

.bc-author {
  font-size: 10px;
  opacity: 0.7;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.book-cover.small {
  padding: 8px 8px 10px 10px;

  .bc-series {
    font-size: 7px;
  }

  .bc-number {
    font-size: 26px;
    margin-top: 3px;
  }

  .bc-title {
    font-size: 10px;
    margin-bottom: 5px;
  }

  .bc-author {
    font-size: 7px;
  }
}
</style>
