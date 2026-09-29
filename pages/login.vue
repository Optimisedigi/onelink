<template>
  <main class="min-h-screen grid place-items-center bg-slate-100 p-5">
    <form class="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-4" @submit.prevent="login">
      <h1 class="text-2xl font-semibold">Owner sign in</h1>
      <label class="block text-sm font-medium">Password
        <input v-model="password" type="password" autocomplete="current-password" required class="mt-1 block w-full rounded-md border-gray-300" />
      </label>
      <p v-if="message" role="alert" class="text-sm text-red-800">{{ message }}</p>
      <button type="submit" :disabled="pending" class="bg-slate-800 text-white rounded px-5 py-2 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800">{{ pending ? 'Signing in…' : 'Sign in' }}</button>
      <NuxtLink to="/" class="block underline text-sm">Back to public profile</NuxtLink>
    </form>
  </main>
</template>
<script setup>
const password = ref('');
const pending = ref(false);
const message = ref('');
async function login() {
  pending.value = true;
  message.value = '';
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { password: password.value } });
    password.value = '';
    await navigateTo('/admin');
  } catch (error) { message.value = error.statusCode === 503 ? 'Login is temporarily unavailable.' : 'Could not sign in. Check your password and try again.'; }
  finally { pending.value = false; }
}
</script>
