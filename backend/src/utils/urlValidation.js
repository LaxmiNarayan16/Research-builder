export function normalizeAndValidateUrls(urls = []) {
  if (!Array.isArray(urls)) return [];

  const normalized = urls
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("http://") || item.startsWith("https://") ? item : `https://${item}`));

  const validUnique = [];
  const seen = new Set();

  for (const value of normalized) {
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) continue;
      const href = parsed.href;
      if (seen.has(href)) continue;
      seen.add(href);
      validUnique.push(href);
    } catch {
      // Ignore invalid URLs.
    }
  }

  return validUnique;
}
