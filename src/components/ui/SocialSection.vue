<template>
  <div class="my-6">
    <span class="text-zinc-500 text-sm">Services Offered</span>
    <div class="embla">
      <div class="embla__viewport" ref="emblaRef">
        <div class="embla__container">
          <div class="embla__slide">
            <img
              class="embla__slide_img"
              :src="`https://picsum.photos/600/350?v=${1}`"
              alt="image__1"
            />
          </div>
          <div class="embla__slide">
            <img
              class="embla__slide_img"
              :src="`https://picsum.photos/600/350?v=${2}`"
              alt="image__2"
            />
          </div>
          <div class="embla__slide">
            <img
              class="embla__slide_img"
              :src="`https://picsum.photos/600/350?v=${3}`"
              alt="image__3"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import Autoplay from 'embla-carousel-autoplay'

const [emblaRef, emblaApi] = emblaCarouselVue(
  {
    loop: true,
    align: 'center',
    containScroll: 'keepSnaps'
  },
  [Autoplay({ delay: 10000, playOnInit: true })]
)

let selectedIndex = 0
let scrollSnaps = []
let prevBtnDisabled = false
let nextBtnDisabled = false
let tweenFactor = 0.84

watchEffect(() => {
  if (emblaApi.value) {
    console.log(emblaApi.value.slideNodes()) // Access API
  }
})
</script>

<style scoped>
.embla {
  max-width: 70rem;
  margin: auto;
  --slide-height: 19rem;
  --slide-spacing: 1rem;
  --slide-size: 100%;
  --slide-spacing-sm: 1.6rem;
  --slide-size-sm: 50%;
  --slide-spacing-lg: 2rem;
  --slide-size-lg: calc(100% / 3);
}
.embla__viewport {
  overflow: hidden;
}
.embla__container {
  backface-visibility: hidden;
  display: flex;
  touch-action: pan-y;
  margin-left: calc(var(--slide-spacing) * -1);
}
.embla__slide {
  flex: 0 0 var(--slide-size);
  min-width: 0;
  /*padding-left: var(--slide-spacing);*/
  min-height: 156px;
  border-radius: 12px;
  @apply bg-zinc-900 text-white mx-2 overflow-hidden;
}
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
