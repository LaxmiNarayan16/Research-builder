import { useMemo } from "react";
import { useBriefContext } from "../context/BriefContext";
import { getBriefHistory } from "../utils/storage";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

export default function HistoryPage() {
  const { setActiveBrief, setActiveUrls, setActiveSources } = useBriefContext();
  const historyItems = useMemo(() => getBriefHistory(), []);

  const reopen = (record) => {
    setActiveBrief(record.brief);
    setActiveUrls(record.inputUrls || []);
    setActiveSources(record.sources || []);
  };

  if (!historyItems.length) {
    return (
      <section className="card">
        <h2 className="text-lg font-semibold">Brief History</h2>
        <p className="text-sm text-slate-500 mt-2">No saved briefs yet. Generate a brief to automatically store it.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2 className="text-lg font-semibold mb-3">Brief History (Last 5)</h2>
      <div className="space-y-3">
        {historyItems.map((item) => (
          <article key={item.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-500">{formatDate(item.createdAt)}</p>
              <button
                type="button"
                onClick={() => reopen(item)}
                className="px-3 py-1.5 rounded-md bg-brand-500 text-white text-sm hover:bg-brand-700"
              >
                Reopen brief
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-700">{item.brief?.summary || "No summary saved."}</p>
            <p className="mt-2 text-xs text-slate-500">Sources: {(item.inputUrls || []).length}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
