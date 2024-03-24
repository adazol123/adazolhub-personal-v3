<script setup lang="ts">
defineProps<{
  position?: string
  name?: string
}>()
</script>
<template lang="">
  <div class="flex justify-between w-full my-6">
    <div>
      <span class="text-sm text-zinc-500">{{ position }}</span>
      <h2 class="text-lg font-semibold max-w-[16ch] text-zinc-800">{{ name }}</h2>
    </div>
    <div>
      <img alt="qr code" class="logo" src="@/assets/qrcode.svg" width="76" height="76" />
    </div>
  </div>
</template>

<style lang=""></style>
