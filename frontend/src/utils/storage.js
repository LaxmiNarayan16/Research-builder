const STORAGE_KEY = "research-brief-builder-history";
const LIMIT = 5;

export function getBriefHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBriefToHistory(brief, inputUrls = [], sources = []) {
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    inputUrls,
    brief,
    sources
  };

  const current = getBriefHistory();
  const updated = [record, ...current].slice(0, LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
