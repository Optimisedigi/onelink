<template>
  <div>
    <templates-simple v-if="decodedData" :acc="decodedData" />
    <p v-else class="p-8 text-center text-slate-700">
      This profile link is invalid. Ask its owner for a new link.
    </p>
  </div>
</template>
<script setup>
import { decodeData } from "../utils/transformer";
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
