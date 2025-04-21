<script setup lang="ts">
const props = defineProps<{
  title?: string
  subheader?: string
  description?: string
  tag?: string
  icon?: any
}>()
</script>
<template>
  <li class="relative border-gray-200 border-s last:border-none dark:border-gray-700">
    <div class="mb-10 ms-6">
      <span
        class="absolute flex items-center justify-center w-6 h-6 text-xs rounded-full bg-muted -start-3 ring-4 ring-white dark:bg-muted-foreground"
        v-if="props.icon"
      >
        <component :is="props.icon" class="w-5 h-5 scale-50 text-foreground dark:text-blue-300">{{
          props.icon
        }}</component>
      </span>
      <h3 class="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">
        {{ title }}
        <span
          class="bg-blue-100 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ms-3"
          v-if="props.tag"
          >{{ props.tag }}</span
        >
      </h3>
      <time
        class="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500"
        v-if="props.subheader"
        >{{ props.subheader }}</time
      >
      <p
        class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400"
        v-if="props.description"
      >
        {{ props.description }}
      </p>
      <slot v-else />
    </div>
  </li>
</template>
