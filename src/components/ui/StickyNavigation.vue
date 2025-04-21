<script setup lang="ts">
const navigations = [
  {
    name: 'Home',
    link: '/'
  },
  {
    name: 'Info',
    link: '/information'
  },
  {
    name: 'Projects',
    link: '/projects'
  },
  {
    name: 'Contact',
    link: '/contact'
  }
]
</script>
<template>
  <nav>
    <ul
      class="inline-flex gap-1 fixed bottom-4 outline outline-1 min-h-[40px] items-center left-1/2 -translate-x-1/2 rounded-xl p-1 bg-white"
    >
      <li
        v-for="navigation in navigations"
        :key="navigation.name"
        class="min-w-[76px] flex justify-center items-stretch rounded-lg"
      >
        <router-link
          :to="navigation.link"
          class="w-full flex justify-center rounded-lg py-2"
          active-class="bg-zinc-800 text-white"
          replace
          >{{ navigation.name }}</router-link
        >
      </li>
    </ul>
  </nav>
</template>
