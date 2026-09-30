<template>
  <li v-if="label && safeUrl">
    <div class="link-row" :class="{ 'has-description': hasDescription, expanded }">
      <a :href="safeUrl" target="_blank" rel="noopener noreferrer" class="link-target">
        <span class="link-visual" aria-hidden="true">
          <img
            v-if="imageSource"
            :key="imageSource"
            ref="imageElement"
            :src="imageSource"
            alt=""
            width="32"
            height="32"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
            @error="markFailedImage($event.currentTarget.getAttribute('src'))"
          />
          <Icon v-else-if="safeIcon" :name="safeIcon" class="link-icon" />
          <span v-else>{{ label.trim().charAt(0).toUpperCase() }}</span>
        </span>
        <span class="link-copy">
          <span class="link-title">{{ label }}</span>
          <span v-if="hasDescription && !expanded" class="link-preview">{{ preview }}</span>
        </span>
        <span class="arrow" aria-hidden="true">→</span>
      </a>
      <button
        v-if="hasDescription"
        type="button"
        class="expand-button"
        :aria-expanded="expanded"
        :aria-controls="descriptionId"
        :aria-label="`${expanded ? 'Hide' : 'Show'} details for ${label}`"
        @click="expanded = !expanded"
      >
        <Icon name="ph:caret-down" class="chevron" :class="{ expanded }" aria-hidden="true" />
      </button>
    </div>
    <p v-if="hasDescription" v-show="expanded" :id="descriptionId" class="link-description">{{ description }}</p>
  </li>
</template>
<script setup>
import { useId } from "vue";
import { safeHttpsUrl } from "../utils/safeLinks";

const props = defineProps({
  label: { type: String, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  icon: { type: String, default: "" },
  url: { type: String, required: true },
});

const safeUrl = computed(() => safeHttpsUrl(props.url));
const safeImage = computed(() => safeHttpsUrl(props.image));
const safeIcon = computed(() => /^[a-z][a-z0-9-]{0,31}:[a-z0-9][a-z0-9-]{0,63}$/.test(props.icon) ? props.icon : "");
const faviconUrl = computed(() => safeUrl.value ? new URL('/favicon.ico', safeUrl.value).href : '');
const failedImage = ref('');
const failedFavicon = ref('');
const imageSource = computed(() => {
  if (safeImage.value && failedImage.value !== safeImage.value) return safeImage.value;
  if (!safeIcon.value && faviconUrl.value && failedFavicon.value !== faviconUrl.value) return faviconUrl.value;
  return '';
});
const imageElement = ref(null);
function markFailedImage(source) {
  if (source === safeImage.value) failedImage.value = source;
  if (source === faviconUrl.value) failedFavicon.value = source;
}
watch([safeImage, safeUrl], () => {
  failedImage.value = '';
  failedFavicon.value = '';
});
onMounted(() => {
  if (imageElement.value?.complete && imageElement.value.currentSrc && imageElement.value.naturalWidth === 0) {
    markFailedImage(imageElement.value.getAttribute('src'));
  }
});
const hasDescription = computed(() => props.description.trim().length > 0);
const preview = computed(() => props.description.trim().replace(/\s+/g, " "));
const expanded = ref(true);
const descriptionId = useId();
</script>
<style scoped>
li { border: 1px solid #e8e6e1; border-radius: 14px; background: #fff; overflow: hidden; transition: border-color 150ms ease; }
li:hover { border-color: #d5d2cb; }
.link-row { position: relative; min-height: 50px; }
.link-target {
  display: flex;
  align-items: center;
  min-height: 50px;
  gap: 12px;
  padding: 8px 44px 8px 8px;
  color: #17181a;
  text-decoration: none;
  font-size: 15px;
  line-height: 1.35;
  transition: color 150ms ease;
}
.link-row.has-description .link-target { padding-right: 76px; }
.link-row.expanded, .link-row.expanded .link-target { min-height: 44px; }
.link-row.expanded .link-target { padding-block: 4px; }
.link-target:hover { color: #4a4d52; }
.link-target:focus-visible, .expand-button:focus-visible { outline: 2px solid #44413c; outline-offset: -3px; border-radius: 8px; }
.link-visual {
  flex: none;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid #e8e6e1;
  border-radius: 9px;
  background: #f0eeea;
  color: #646970;
  font-size: 14px;
  font-weight: 600;
}
.link-visual img { display: block; width: 100%; height: 100%; object-fit: cover; }
.link-icon { width: 20px; height: 20px; }
.link-copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.link-title { font-weight: 500; overflow-wrap: anywhere; }
.link-preview { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #646970; font-size: 13px; line-height: 1.4; }
.arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #b9bcc2; font-size: 18px; font-weight: 300; line-height: 1; }
.expand-button {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: #646970;
  border-radius: 8px;
}
.expand-button:hover { color: #17181a; }
.chevron { width: 20px; height: 20px; }
.chevron.expanded { transform: rotate(180deg); }
.link-description { padding: 0 12px 12px; color: #646970; font-size: 14px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; text-wrap: pretty; }
@media (max-width: 480px) { .chevron { width: 18px; height: 18px; } }
@media (prefers-reduced-motion: reduce) { .link-target, li { transition: none; } }
</style>
