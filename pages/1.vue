<template>
  <div>
    <aside class="bg-slate-800 text-white text-center p-3 text-sm">Legacy link, not verified. <NuxtLink to="/" class="underline focus-visible:outline">View the official profile</NuxtLink>.</aside>
    <templates-simple v-if="decodedData" :acc="decodedData" />
    <p v-else class="p-8 text-center text-slate-700">
      This profile link is invalid. Ask its owner for a new link.
    </p>
  </div>
</template>
<script setup>
import { decodeData } from "../utils/transformer";
useSeoMeta({ robots: 'noindex, nofollow' });
const route = useRoute();
const decodedData = computed(() => {
  if (typeof route.query.data !== "string") return null;
  try {
    const data = decodeData(route.query.data);
    return data && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
});
</script>
<style scoped></style>
