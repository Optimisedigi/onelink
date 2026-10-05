<template>
  <div>
    <templates-simple v-if="profile" :acc="profile" track-clicks />
    <main v-else class="min-h-screen grid place-items-center bg-[#f7f6f3] text-[#17181a] p-6">
      <div class="text-center">
        <h1 class="text-2xl font-semibold">Profile not yet published</h1>
        <p class="mt-2">Please check back later.</p>
      </div>
    </main>
  </div>
</template>
<script setup>
import { trackEvent } from '../utils/trackEvent';

const { data, error } = await useFetch('/api/profile', { key: 'public-profile', cache: 'no-store' });
if (error.value) throw createError({ statusCode: 503, statusMessage: 'Profile unavailable', fatal: true });
const profile = computed(() => data.value?.profile || null);
onMounted(() => { if (profile.value) trackEvent({ type: 'view' }); });
</script>
