import { safeEmailHref, safeHttpsUrl, safeWhatsappHref } from "./safeLinks.js";

// Shared by the public page and the server, so a click's address matches the
// address the server expects when it counts clicks.
export const profileSocialLinks = (acc) => [
  { label: "Facebook", icon: "ph:facebook-logo", href: safeHttpsUrl(acc.f) },
  { label: "X", icon: "ph:x-logo", href: safeHttpsUrl(acc.t) },
  { label: "Instagram", icon: "ph:instagram-logo", href: safeHttpsUrl(acc.ig) },
  { label: "Telegram", icon: "ph:telegram-logo", href: safeHttpsUrl(acc.tg) },
  { label: "WhatsApp", icon: "ph:whatsapp-logo", href: safeWhatsappHref(acc.w) },
  { label: "YouTube", icon: "ph:youtube-logo", href: safeHttpsUrl(acc.y) },
  { label: "Email", icon: "ph:envelope", href: safeEmailHref(acc.e) || safeHttpsUrl(acc.m) },
  { label: "GitHub", icon: "ph:github-logo", href: safeHttpsUrl(acc.gh) },
  { label: "LinkedIn", icon: "ph:linkedin-logo", href: safeHttpsUrl(acc.l) },
].filter((social) => social.href);

// Links with a string label and an HTTPS destination (empty labels are hidden when rendered).
export const profileVisibleLinks = (acc) => Array.isArray(acc.ls)
  ? acc.ls.filter((link) => link && typeof link === "object" && typeof link.l === "string" && safeHttpsUrl(link.u))
  : [];
