const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export function fetchContent(urls) {
  return request("/fetch-content", {
    method: "POST",
    body: JSON.stringify({ urls })
  });
}

export function fetchSystemStatus() {
  return request("/status", {
    method: "GET"
  });
}

export function generateBrief(sources, summaryStyle = "informative") {
  return request("/generate-brief", {
    method: "POST",
    body: JSON.stringify({ sources, summaryStyle })
  });
}
