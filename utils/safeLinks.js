// Return only canonical HTTPS URLs for image sources and outgoing web links.
export const safeHttpsUrl = (value) => {
  if (typeof value !== "string" || !/^https:\/\//i.test(value) || /[\u0000-\u001f\u007f]/.test(value)) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
};

export const safeEmailHref = (value) => {
  // Keep URI escapes and mailto header separators out of addresses.
  if (typeof value !== "string" || !/^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value)) return "";
  return `mailto:${value}`;
};

export const safeWhatsappHref = (value) => {
  if (typeof value !== "string" || !/^[+()\d\s-]+$/.test(value)) return "";
  const digits = value.replace(/\D/g, "");
  return /^\d{7,15}$/.test(digits) ? `https://wa.me/${digits}` : "";
};
