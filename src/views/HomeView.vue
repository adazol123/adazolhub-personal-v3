<script setup lang="ts">
import Button from '@/components/elements/GeneralButton.vue'
import { ref, reactive, watch } from 'vue'
import gsap from 'gsap'
import ProfileName from '@/components/ui/ProfileName.vue'
import BioDescription from '@/components/ui/BioDescription.vue'
import ExperienceSection from '@/components/ui/ExperienceSection.vue'
import FeaturedSection from '@/components/ui/FeaturedSection.vue'
import SocialSection from '@/components/ui/SocialSection.vue'
import SocialCarouselSection from '@/components/ui/SocialCarouselSection.vue'

const count = ref(0)
function increment() {
  count.value += 10
}

const tweened = reactive({ count: 0 })

watch(count, (number) => {
  gsap.to(tweened, { duration: 0.5, count: Number(number) || 0 })
})
</script>

<template>
  <main>
    <!--<h1>Hello Main</h1>-->
    <ProfileName position="Software Engineer" name="Daniel Josaphat Lozada" />
    <BioDescription
      description="Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam, fuga? Laudantium quia quod quibusdam libero eveniet molestias ipsum itaque autem, sint voluptatum! Enim, molestiae maxime."
    />

    <Button @click="increment">{{ tweened.count.toFixed(0) }}</Button>
    <FeaturedSection />
    <social-carousel-section />
    <ExperienceSection />
  </main>
</template>
