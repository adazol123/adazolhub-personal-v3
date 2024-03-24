<template>
  <div class="my-6">
    <span class="text-zinc-500 text-sm">Services Offered</span>
    <Accordion type="multiple" collapsible class="my-2 gap-1 flex flex-col">
      <AccordionItem
        v-for="service in servicesOffered"
        :key="service.title"
        :value="service.title"
        class="bg-zinc-900 px-4 rounded-xl text-white"
      >
        <AccordionTrigger>{{ service.title }}</AccordionTrigger>
        <AccordionContent class="text-zinc-400"> {{ service.description }}</AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</template>
<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/elements/accordion'

const servicesOffered = [
  {
    title: 'Software Development (Web)',
    description:
      "We design and develop experiences that make people's lives simple. With Modern Frameworks, Typescript support for good developer experience and for scalability of code structure."
  },
  {
    title: 'UI/UX Design',
    description:
      'We aim for user centric design approach in solving user’s problem and needs, to wireframing, prototyping up to testing.'
  },
  {
    title: 'API Integrations',
    description:
      "We design and develop experiences that make people's lives simple. With Modern Frameworks, Typescript support for good developer experience and for scalability of code structure."
  },
  {
    title: 'Server/Serverless Backend',
    description:
      "We design and develop experiences that make people's lives simple. With Modern Frameworks, Typescript support for good developer experience and for scalability of code structure."
  }
]
</script>
