<script setup lang="ts">
defineProps<{
  description?: string
}>()
</script>
<template>
  <div class="my-6">
    <span class="text-sm text-zinc-500">Bio</span>
    <p class="text-sm text-zinc-800">{{ description }}</p>
  </div>
</template>
