<template lang="pug">
  div
    AppNav
    HeroSection
    BooksSection
    AppSection
    AboutSection
    TrustSection
    NewsletterSection(v-if="newsletterEnabled")
    FaqSection
    FinalCta
    AppFooter
</template>

<script setup lang="ts">
import AppNav from '@/components/AppNav.vue'
import HeroSection from '@/components/HeroSection.vue'
import BooksSection from '@/components/BooksSection.vue'
import AppSection from '@/components/AppSection.vue'
import AboutSection from '@/components/AboutSection.vue'
import TrustSection from '@/components/TrustSection.vue'
import NewsletterSection from '@/components/NewsletterSection.vue'
import FaqSection from '@/components/FaqSection.vue'
import FinalCta from '@/components/FinalCta.vue'
import AppFooter from '@/components/AppFooter.vue'
import { runtime } from '@/config/runtime'

const newsletterEnabled = runtime.newsletterEnabled
</script>
