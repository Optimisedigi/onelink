<template>
  <main class="min-h-screen bg-slate-100">
    <div v-if="pending" class="p-8">Loading editor…</div>
    <div v-else-if="loadError" class="p-8" role="alert">{{ loadError }} <NuxtLink to="/login" class="underline">Sign in</NuxtLink></div>
    <div v-else class="editor grid grid-cols-1 lg:grid-cols-3 lg:divide-x">
      <div class="lg:col-span-2 flex flex-col min-w-0">
        <div class="p-4 bg-white border-b flex flex-wrap gap-3 items-center">
          <h1 class="text-xl font-semibold mr-auto">Edit profile</h1>
          <button type="button" class="underline" @click="copyLink">Copy profile preview link</button>
          <button type="button" class="underline" @click="exportProfile">Export profile JSON</button>
          <button type="button" :disabled="uploadsPending > 0" class="underline disabled:opacity-50" @click="logout">Sign out</button>
        </div>
        <div class="flex-1 overflow-y-auto p-5 sm:p-8">
          <app-form-profile v-model:name="data.n" v-model:desc="data.d" v-model:image="data.i" />
          <app-form-hr />
          <app-form-social-links
            v-model:facebook="data.f" v-model:twitter="data.t" v-model:instagram="data.ig"
            v-model:github="data.gh" v-model:telegram="data.tg" v-model:linkedin="data.l"
            v-model:email="data.e" v-model:whatsapp="data.w" v-model:youtube="data.y"
          />
          <app-form-hr />
          <app-form-links v-model="data.ls" allow-uploads @upload-state="uploadsPending += $event" />
          <section class="mt-8 max-w-xl space-y-3">
            <h2 class="font-semibold">Import an old profile link</h2>
            <label class="block text-sm">Old /1?data= link
              <input v-model="legacyUrl" type="url" class="mt-1 block w-full rounded-md border-gray-300" placeholder="https://your-site/1?data=…" />
            </label>
            <button type="button" class="underline" @click="previewImport">Preview import</button>
            <p v-if="importError" role="alert" class="text-red-800">{{ importError }}</p>
            <div v-if="importDraft" class="border bg-white p-4 space-y-2">
              <p>Replace your unsaved draft with <strong>{{ importDraft.n || 'Untitled profile' }}</strong> and {{ importDraft.ls.length }} links?</p>
              <div class="max-h-96 overflow-y-auto border" aria-label="Imported profile preview"><templates-simple :acc="importDraft" /></div>
              <button type="button" :disabled="uploadsPending > 0" class="underline disabled:opacity-50" @click="confirmImport">Replace draft with this import</button>
              <button type="button" class="ml-4 underline" @click="importDraft = null">Cancel</button>
            </div>
          </section>
        </div>
        <div class="border-t bg-white p-4 flex flex-wrap gap-4 items-center">
          <button type="button" :disabled="saving || uploadsPending > 0" @click="save" class="px-5 py-2 bg-slate-800 text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800 disabled:opacity-50">{{ saving ? 'Saving…' : uploadsPending > 0 ? 'Uploading images…' : 'Save' }}</button>
          <p role="status" aria-live="polite" class="text-sm">{{ status }}</p>
        </div>
      </div>
      <app-form-preview :data="data" />
    </div>
  </main>
</template>
<script setup>
import { decodeData } from '../utils/transformer';

const empty = () => ({ n: '', d: '', i: '', f: '', t: '', ig: '', gh: '', tg: '', l: '', e: '', w: '', y: '', ls: [] });
const data = ref(empty());
const version = ref(null);
const pending = ref(true);
const loadError = ref('');
const saving = ref(false);
const uploadsPending = ref(0);
const status = ref('');
const legacyUrl = ref('');
const importError = ref('');
const importDraft = ref(null);
const { data: stored, error } = await useFetch('/api/admin/profile', { key: 'owner-profile', cache: 'no-store' });
if (error.value) loadError.value = error.value.statusCode === 401 ? 'Sign in to edit.' : 'Could not load the profile. Try again later.';
else if (stored.value) {
  data.value = { ...empty(), ...stored.value.profile, ls: stored.value.profile?.ls || [] };
  version.value = stored.value.version;
}
pending.value = false;
watch(data, () => { if (!saving.value) status.value = 'Unsaved changes'; }, { deep: true });

async function save() {
  if (saving.value || uploadsPending.value > 0) return;
  saving.value = true;
  status.value = 'Saving…';
  const snapshot = JSON.stringify(data.value);
  try {
    const result = await $fetch('/api/admin/profile', { method: 'PUT', body: { profile: JSON.parse(snapshot), expectedVersion: version.value } });
    version.value = result.version;
    status.value = JSON.stringify(data.value) === snapshot ? 'Saved. View /official after up to a minute; the homepage has not switched yet.' : 'Saved earlier changes. You still have unsaved changes.';
  } catch (error) {
    status.value = error.statusCode === 409 ? 'Another tab saved changes. Export your draft before reloading and merging.' : error.data?.statusMessage || 'Save failed. Your draft is still here.';
  } finally { saving.value = false; }
}
async function logout() {
  try {
    await $fetch('/api/auth/logout', { method: 'POST', body: {} });
    await navigateTo('/login');
  } catch { status.value = 'Sign out failed. Try again.'; }
}
async function copyLink() {
  try { await navigator.clipboard.writeText(window.location.origin + '/official'); status.value = 'Profile preview link copied.'; }
  catch { status.value = 'Could not copy. Open /official to preview the saved profile.'; }
}
function exportProfile() {
  const blob = new Blob([JSON.stringify(data.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'profile.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  status.value = 'Draft exported. This copy does not replace a tested storage backup.';
}
function previewImport() {
  importDraft.value = null;
  importError.value = '';
  try {
    if (legacyUrl.value.length > 90000) throw new Error('Link is too long');
    const url = new URL(legacyUrl.value);
    if ((url.protocol !== 'https:' && url.origin !== window.location.origin) || url.pathname !== '/1') throw new Error('Use an HTTPS /1 profile link');
    const encoded = url.searchParams.get('data');
    if (!encoded) throw new Error('The link has no profile data');
    const decoded = decodeData(encoded);
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded) || !Array.isArray(decoded.ls)) throw new Error('Invalid profile data');
    if (decoded.ls.length > 100 || decoded.ls.some((link) => !link || typeof link !== 'object')) throw new Error('Invalid profile links');
    const clean = empty();
    for (const key of Object.keys(clean)) if (key !== 'ls' && typeof decoded[key] === 'string') clean[key] = decoded[key];
    clean.ls = decoded.ls.map((link) => Object.fromEntries(['l', 'g', 's', 'i', 'image', 'u']
      .filter((key) => typeof link[key] === 'string').map((key) => [key, link[key]])));
    importDraft.value = clean;
  } catch (error) { importError.value = error.message || 'Could not read this link'; }
}
function confirmImport() {
  data.value = importDraft.value;
  importDraft.value = null;
  status.value = 'Imported into your draft. Save to publish.';
}
</script>
<style scoped>
@media (min-width: 1024px) { .editor { min-height: 100vh; } }
button:not(:disabled) { cursor: pointer; }
button:focus-visible, a:focus-visible { outline: 2px solid #334155; outline-offset: 3px; }
</style>
