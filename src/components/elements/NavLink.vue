<script setup lang="ts"></script>

<template>
  <router-link
    v-bind="$attrs"
    class="inline-flex items-center gap-2 hover:text-emerald-600"
    active-class="text-emerald-400"
    inactive-class="text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:text-gray-700 focus:border-gray-300"
  >
    <slot />
  </router-link>
</template>
