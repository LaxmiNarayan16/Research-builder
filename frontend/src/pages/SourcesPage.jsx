import { useBriefContext } from "../context/BriefContext";
import SourcesUsedCard from "../components/SourcesUsedCard";
import CompareSourcesTable from "../components/CompareSourcesTable";

export default function SourcesPage() {
  const { activeBrief, activeSources } = useBriefContext();

  if (!activeSources.length) {
    return (
      <section className="card">
        <h2 className="text-lg font-semibold">Sources</h2>
        <p className="text-sm text-slate-500 mt-2">Generate a brief from Dashboard to inspect source extraction details.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <CompareSourcesTable rows={activeBrief?.compareSources || []} />
      <SourcesUsedCard sources={activeSources} keyPoints={activeBrief?.keyPoints || []} />
    </div>
  );
}
