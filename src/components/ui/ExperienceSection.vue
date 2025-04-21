<script setup lang="ts">
// ------------- IMPORTS ---------------//
import IconCommunity from '../icons/IconCommunity.vue'
import IconDocumentation from '../icons/IconDocumentation.vue'
import { TimelineItem } from '../elements/custom'
import { cn } from '@/lib/utils'
import { variants } from '@/shared/index'

// -------------- CORE -------------- //

const servicesOffered = [
  {
    title: 'Software Development (Web)',
    range: '2022 - Present (28 months)',
    description:
      "We design and develop experiences that make people's lives simple. With Modern Frameworks, Typescript support for good developer experience and for scalability of code structure.",
    icon: IconCommunity
  },
  {
    title: 'UI/UX Design',
    range: '2022 - 2022 (6 months)',
    description:
      'We aim for user centric design approach in solving user’s problem and needs, to wireframing, prototyping up to testing.',
    icon: IconDocumentation
  },
  {
    title: 'API Integrations',
    range: '2019 - 2022 (26 months)',
    description:
      "We design and develop experiences that make people's lives simple. With Modern Frameworks, Typescript support for good developer experience and for scalability of code structure.",
    icon: IconDocumentation
  }
]

const headingVariants = cn(variants.typographyVariants({ variant: 'base' }))
</script>

<template>
  <div class="my-6">
    <h3 :class="headingVariants">Professional Experiences</h3>
    <div class="my-2">
      <ol class="p-4">
        <TimelineItem
          v-for="service in servicesOffered"
          :key="service.title"
          :title="service.title"
          :subheader="service.range"
          :icon="service.icon"
        >
          {{ service.description }}
        </TimelineItem>
      </ol>
    </div>
  </div>
</template>

