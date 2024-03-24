<template>
  <div class="my-6">
    <span class="text-zinc-500 text-sm">Socials</span>
    <Carousel
      :opts="{
        align: 'center',
        loop: true,
        containScroll: 'keepSnaps'
      }"
      class="my-2 flex flex-col"
      @init-api="setApi"
    >
      <CarouselContent>
        <CarouselItem class="basis-[80%] rounded-xl overflow-hidden">
          <img
            class="embla__slide_img"
            :src="`https://picsum.photos/600/350?v=${1}`"
            alt="image__1"
          />
        </CarouselItem>
        <CarouselItem class="basis-[80%] rounded-xl overflow-hidden">
          <img
            class="embla__slide_img"
            :src="`https://picsum.photos/600/350?v=${3}`"
            alt="image__3"
          />
        </CarouselItem>
        <CarouselItem class="basis-[80%] rounded-xl overflow-hidden">
          <img
            class="embla__slide_img"
            :src="`https://picsum.photos/600/350?v=${5}`"
            alt="image__5"
          />
        </CarouselItem>
      </CarouselContent>
      <div class="relative top-8 flex gap-2">
        <CarouselPrevious />
        <CarouselNext />
      </div>
      <div class="embla__controls">Slide {{ currentSlider }} of {{ totalSlider }}</div>
    </Carousel>
  </div>
</template>

<script setup lang="ts">
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
  useCarousel
} from '@/components/elements/carousel'
import { ref } from 'vue'
import { watchOnce } from '@vueuse/core'

const api = ref<CarouselApi>()
const totalSlider = ref(0)
const currentSlider = ref(0)

function setApi(val: CarouselApi) {
  api.value = val
}

watchOnce(api, (api: CarouselApi | undefined) => {
  if (!api) return

  totalSlider.value = api.scrollSnapList().length
  currentSlider.value = api.selectedScrollSnap() + 1

  api.on('select', () => {
    currentSlider.value = api.selectedScrollSnap() + 1
  })
})
</script>

<style scoped>
.embla__slide__img {
  border-radius: 1.8rem;
  display: block;
  height: var(--slide-height);
  width: 100%;
  object-fit: cover;
}
.embla__controls {
  display: grid;
  grid-template-columns: auto 1fr;
  justify-content: space-between;
  gap: 1.2rem;
  margin-top: 1.8rem;
}
.embla__buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
  align-items: center;
}
.embla__button {
  -webkit-tap-highlight-color: rgba(var(--text-high-contrast-rgb-value), 0.5);
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;
  touch-action: manipulation;
  display: inline-flex;
  text-decoration: none;
  cursor: pointer;
  border: 0;
  padding: 0;
  margin: 0;
  box-shadow: inset 0 0 0 0.2rem var(--detail-medium-contrast);
  width: 3.6rem;
  height: 3.6rem;
  z-index: 1;
  border-radius: 50%;
  color: var(--text-body);
  display: flex;
  align-items: center;
  justify-content: center;
}
.embla__button:disabled {
  color: var(--detail-high-contrast);
}
.embla__button__svg {
  width: 35%;
  height: 35%;
}
.embla__dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  margin-right: calc((2.6rem - 1.4rem) / 2 * -1);
}
.embla__dot {
  -webkit-tap-highlight-color: rgba(var(--text-high-contrast-rgb-value), 0.5);
  -webkit-appearance: none;
  appearance: none;
  background-color: transparent;
  touch-action: manipulation;
  display: inline-flex;
  text-decoration: none;
  cursor: pointer;
  border: 0;
  padding: 0;
  margin: 0;
  width: 2.6rem;
  height: 2.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.embla__dot:after {
  box-shadow: inset 0 0 0 0.2rem var(--detail-medium-contrast);
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  content: '';
}
.embla__dot--selected:after {
  box-shadow: inset 0 0 0 0.2rem var(--text-body);
}
</style>
