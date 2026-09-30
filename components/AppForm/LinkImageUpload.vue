<template>
  <div class="mt-3 space-y-2">
    <input ref="picker" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" tabindex="-1" @change="upload" />
    <div class="flex flex-wrap items-center gap-3">
      <button type="button" :disabled="uploading" :aria-label="`Attach image to ${label || 'untitled'} link`" class="min-h-11 rounded-md bg-slate-800 px-4 py-2 text-sm text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800" @click="picker?.click()">
        {{ uploading ? 'Uploading…' : 'Attach image' }}
      </button>
      <img v-if="safeImage && failedImage !== safeImage" :src="safeImage" alt="Attached link image" width="44" height="44" class="h-11 w-11 rounded-md object-cover" referrerpolicy="no-referrer" @error="failedImage = safeImage" />
      <button v-if="modelValue" type="button" :disabled="uploading" class="min-h-11 text-sm underline text-slate-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800" @click="remove">Remove image</button>
    </div>
    <p class="text-xs text-slate-600">PNG, JPEG or WebP, up to 2 MB. Uploads are public and kept even if removed from a link.</p>
    <p v-if="error" role="alert" class="text-sm text-red-800">{{ error }}</p>
    <p v-else role="status" aria-live="polite" class="text-sm text-slate-700">{{ status }}</p>
  </div>
</template>
<script setup>
import { safeHttpsUrl } from '../../utils/safeLinks';

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'upload-state']);
const picker = ref(null);
const uploading = ref(false);
const status = ref('');
const error = ref('');
const failedImage = ref('');
const safeImage = computed(() => safeHttpsUrl(props.modelValue));
let controller;
onBeforeUnmount(() => controller?.abort());

async function upload(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || uploading.value) return;
  error.value = '';
  status.value = '';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    error.value = 'Choose a PNG, JPEG or WebP image.';
    return;
  }
  if (file.size === 0 || file.size > 2 * 1024 * 1024) {
    error.value = 'Choose an image up to 2 MB that is not empty.';
    return;
  }
  controller = new AbortController();
  uploading.value = true;
  emit('upload-state', 1);
  status.value = 'Uploading image…';
  try {
    const result = await $fetch('/api/admin/link-image', {
      method: 'POST', body: file, headers: { 'Content-Type': file.type },
      signal: controller.signal, timeout: 15000, retry: 0,
    });
    const url = safeHttpsUrl(result.url);
    if (!url) throw new Error('Invalid image response');
    emit('update:modelValue', url);
    failedImage.value = '';
    status.value = 'Image attached. Save your profile to publish it.';
  } catch (problem) {
    status.value = '';
    error.value = problem.statusCode === 401 ? 'Sign in again before attaching an image.' : problem.data?.statusMessage || 'Image upload failed. Your existing image is unchanged. Try again.';
  } finally {
    uploading.value = false;
    emit('upload-state', -1);
  }
}
function remove() {
  emit('update:modelValue', '');
  error.value = '';
  status.value = 'Image removed from your draft. Save to publish this change.';
}
</script>
