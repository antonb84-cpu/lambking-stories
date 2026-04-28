<template lang="pug">
  div.layout-b
    HeaderB(:buy-url="featuredBuyUrl")
    HeroB(:book="featured", :buy-url="featuredBuyUrl")
    ProofBarB
    BenefitsB
    FeaturedBookB(:book="featured", :buy-url="featuredBuyUrl")
    BookGridB(:books="others", :buy-url-of="buyUrlOf")
    FaqB
    FinalCtaB(:book="featured", :buy-url="featuredBuyUrl")
    FooterB
    StickyBuyBar(:book="featured", :buy-url="featuredBuyUrl")
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HeaderB from '@/components/b/HeaderB.vue'
import HeroB from '@/components/b/HeroB.vue'
import ProofBarB from '@/components/b/ProofBarB.vue'
import BenefitsB from '@/components/b/BenefitsB.vue'
import FeaturedBookB from '@/components/b/FeaturedBookB.vue'
import BookGridB from '@/components/b/BookGridB.vue'
import FaqB from '@/components/b/FaqB.vue'
import FinalCtaB from '@/components/b/FinalCtaB.vue'
import FooterB from '@/components/b/FooterB.vue'
import StickyBuyBar from '@/components/b/StickyBuyBar.vue'
import { useFeaturedBook } from '@/composables/useFeaturedBook'

const { featured, others, buyUrlOf } = useFeaturedBook()

const featuredBuyUrl = computed(() => (featured.value ? buyUrlOf(featured.value) : ''))
</script>

<style scoped lang="scss">
.layout-b {
  background: var(--cream);
}
</style>
