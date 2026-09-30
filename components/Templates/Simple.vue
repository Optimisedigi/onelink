<template>
  <main class="profile-page">
    <div class="profile-content">
      <header class="profile-header">
        <div class="avatar">
          <img v-if="safeImage" :src="safeImage" :alt="acc.n ? `${acc.n}'s photo` : 'Profile photo'" width="108" height="108" />
          <span v-else aria-hidden="true">{{ initials }}</span>
        </div>
        <h1 v-if="acc.n">{{ acc.n }}</h1>
        <p v-if="acc.d" class="bio">{{ acc.d }}</p>
      </header>

      <nav
        v-if="socialLinks.length"
        class="social-links"
        :aria-label="socialLinks.length > 6 ? 'Social links, scroll sideways for more' : 'Social links'"
        :tabindex="socialLinks.length > 6 ? 0 : undefined"
      >
        <a
          v-for="social in socialLinks"
          :key="social.label"
          :href="social.href"
          :aria-label="social.label"
          :title="social.label"
          target="_blank"
          rel="noopener noreferrer"
        ><Icon :name="social.icon" class="social-icon" aria-hidden="true" /></a>
      </nav>

      <div v-if="linkGroups.length" class="link-groups">
        <div v-for="(group, groupIndex) in linkGroups" :key="groupIndex" class="link-group">
          <h2 v-if="group.title" class="section-title">{{ group.title }}</h2>
          <ul class="profile-links">
            <ExternalLink
              v-for="(link, id) in group.links"
              :key="id"
              :label="link.l"
              :description="typeof link.s === 'string' ? link.s : ''"
              :image="typeof link.image === 'string' ? link.image : ''"
              :icon="typeof link.i === 'string' ? link.i : ''"
              :url="link.u"
            />
          </ul>
        </div>
      </div>
      <footer v-if="acc.n" class="profile-footer">© {{ year }} {{ acc.n }}</footer>
    </div>
  </main>
</template>
<script setup>
import { safeEmailHref, safeHttpsUrl, safeWhatsappHref } from "../../utils/safeLinks";

const props = defineProps({
  acc: {
    type: Object,
    required: true,
  },
});

const safeImage = computed(() => safeHttpsUrl(props.acc.i));
const initials = computed(() => {
  if (typeof props.acc.n !== "string") return "?";
  const words = props.acc.n.trim().split(/\s+/).filter(Boolean);
  return words.length ? `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`.toUpperCase() : "?";
});
const links = computed(() => Array.isArray(props.acc.ls)
  ? props.acc.ls.filter((link) => link && typeof link === "object" && typeof link.l === "string" && safeHttpsUrl(link.u))
  : []);
const linkGroups = computed(() => {
  const groups = [];
  for (const link of links.value) {
    const title = typeof link.g === "string" ? link.g.trim() : "";
    const previous = groups[groups.length - 1];
    if (!previous || previous.title !== title) groups.push({ title, links: [link] });
    else previous.links.push(link);
  }
  return groups;
});
const year = new Date().getFullYear();
const socialLinks = computed(() => [
  { label: "Facebook", icon: "ph:facebook-logo", href: safeHttpsUrl(props.acc.f) },
  { label: "X", icon: "ph:x-logo", href: safeHttpsUrl(props.acc.t) },
  { label: "Instagram", icon: "ph:instagram-logo", href: safeHttpsUrl(props.acc.ig) },
  { label: "Telegram", icon: "ph:telegram-logo", href: safeHttpsUrl(props.acc.tg) },
  { label: "WhatsApp", icon: "ph:whatsapp-logo", href: safeWhatsappHref(props.acc.w) },
  { label: "YouTube", icon: "ph:youtube-logo", href: safeHttpsUrl(props.acc.y) },
  { label: "Email", icon: "ph:envelope", href: safeEmailHref(props.acc.e) || safeHttpsUrl(props.acc.m) },
  { label: "GitHub", icon: "ph:github-logo", href: safeHttpsUrl(props.acc.gh) },
  { label: "LinkedIn", icon: "ph:linkedin-logo", href: safeHttpsUrl(props.acc.l) },
].filter((social) => social.href));
</script>
<style scoped>
@font-face {
  font-family: "Figtree";
  src: url("/fonts/figtree-latin.woff2") format("woff2");
  font-style: normal;
  font-weight: 400 600;
  font-display: swap;
}
.profile-page {
  min-height: 100vh;
  background: #f7f6f3;
  color: #17181a;
  font-family: "Figtree", "Avenir Next", "Segoe UI", sans-serif;
}
.profile-content {
  max-width: 420px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 56px 20px 40px;
  display: flex;
  flex-direction: column;
}
.profile-header { text-align: center; }
.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  margin: 0 auto;
  background: #e4e2dc;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #575652;
  font-size: 26px;
  font-weight: 500;
  letter-spacing: -0.06em;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
h1 {
  margin-top: 20px;
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.bio {
  max-width: 280px;
  margin: 8px auto 0;
  color: #646970;
  font-size: 15px;
  line-height: 1.45;
  text-wrap: pretty;
}
.social-links {
  --icon-size: 44px;
  --icon-gap: 0px;
  display: flex;
  gap: var(--icon-gap);
  width: max-content;
  max-width: min(100%, calc(6 * var(--icon-size) + 5 * var(--icon-gap)));
  margin: 6px auto 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.social-links::-webkit-scrollbar { display: none; }
.social-links:focus-visible { outline: 2px solid #44413c; outline-offset: 3px; border-radius: 999px; }
.social-links a {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--icon-size);
  height: var(--icon-size);
  color: #4a4d52;
  text-decoration: none;
  transition: color 150ms ease;
}
.social-icon { width: 20px; height: 20px; }
.social-links a:hover { color: #17181a; }
.social-links a:focus-visible { outline: 2px solid #44413c; outline-offset: 3px; }
.link-groups { display: grid; gap: 26px; margin: 20px -8px 0; }
.section-title {
  margin: 0 0 10px;
  padding-left: 12px;
  color: #646970;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
.profile-links { display: grid; gap: 4px; list-style: none; padding: 0; margin: 0; }
.profile-footer {
  margin-top: auto;
  padding-top: 32px;
  text-align: center;
  color: #646970;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}
@media (prefers-reduced-motion: reduce) {
  .social-links a { transition: none; }
}
</style>
