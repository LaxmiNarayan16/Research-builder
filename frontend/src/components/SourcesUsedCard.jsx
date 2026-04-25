function highlightPreview(preview, phrases = []) {
  if (!phrases.length || !preview) return preview;

  let result = preview;
  phrases.slice(0, 3).forEach((phrase) => {
    if (!phrase) return;
    const safe = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(safe, "i"), (matched) => `[${matched}]`);
  });
  return result;
}

export default function SourcesUsedCard({ sources = [], keyPoints = [] }) {
  if (!sources.length) {
    return (
      <section className="card">
        <h2 className="text-lg font-semibold">Sources</h2>
        <p className="text-sm text-slate-500 mt-2">Source previews show up here after generating a brief.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="text-lg font-semibold mb-3">Sources</h2>
      <div className="space-y-4">
        {sources.map((source) => {
          const sourcePoints = keyPoints
            .filter((point) => (point.sourceUrl || point.source) === source.url)
            .map((point) => point.snippet);
          const highlighted = highlightPreview(source.preview, sourcePoints);
          return (
            <article key={source.url} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
              <a href={source.url} target="_blank" rel="noreferrer" className="font-medium text-brand-700 hover:underline break-all">
                {source.title || source.url}
              </a>
              <p className="text-xs text-slate-500 mt-1">{source.url}</p>
              <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{highlighted}</p>
              <p className="text-xs text-slate-500 mt-2">Bracketed text indicates likely usage in key points.</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
