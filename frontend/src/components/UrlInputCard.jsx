import { useState } from "react";

function normalizeLines(text) {
  return text
    .split(/\n|,/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isValidUrl(value) {
  try {
    const testValue = value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
    const parsed = new URL(testValue);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export default function UrlInputCard({ onSubmit, isLoading }) {
  const [rawInput, setRawInput] = useState("");
  const [summaryStyle, setSummaryStyle] = useState("informative");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const urls = normalizeLines(rawInput);

    if (urls.length < 5 || urls.length > 10) {
      setError("Please provide between 5 and 10 URLs.");
      return;
    }

    const invalid = urls.filter((url) => !isValidUrl(url));
    if (invalid.length > 0) {
      setError(`Invalid URL(s): ${invalid.slice(0, 2).join(", ")}${invalid.length > 2 ? "..." : ""}`);
      return;
    }

    setError("");
    onSubmit({ urls, summaryStyle });
  };

  return (
    <section className="card">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Input Links</h2>
        <p className="text-sm text-slate-600">Paste 5-10 source URLs (one per line or comma separated).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          rows={8}
          placeholder="https://example.com/article-1&#10;https://example.com/article-2"
          className="w-full p-4 outline-none resize-none rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-brand-500"
        />
        <div>
          <label htmlFor="summaryStyle" className="block text-sm font-medium text-slate-700 mb-1">
            Summary Style
          </label>
          <select
            id="summaryStyle"
            value={summaryStyle}
            onChange={(event) => setSummaryStyle(event.target.value)}
            className="w-full rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-brand-500"
          >
            <option value="informative">Informative</option>
            <option value="executive">Executive</option>
            <option value="technical">Technical</option>
          </select>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-brand-500 text-white font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing sources..." : "Generate Research Brief"}
        </button>
      </form>
    </section>
  );
}
