<template>
  <div>
    <aside class="bg-slate-800 text-white text-center p-3 text-sm">Saved profile preview. The homepage has not switched yet.</aside>
    <templates-simple v-if="profile" :acc="profile" />
    <main v-else class="min-h-screen grid place-items-center bg-[#f7f6f3] text-[#17181a] p-6">
      <div class="text-center">
        <h1 class="text-2xl font-semibold">Profile not yet published</h1>
        <p class="mt-2">Please check back later.</p>
      </div>
    </main>
  </div>
</template>
<script setup>
useSeoMeta({ robots: 'noindex, nofollow' });
const { data, error } = await useFetch('/api/profile', { key: 'public-profile' });
if (error.value) throw createError({ statusCode: 503, statusMessage: 'Profile unavailable' });
const profile = computed(() => data.value?.profile || null);
</script>
