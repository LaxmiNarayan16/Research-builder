import { useState } from "react";
import { fetchContent, generateBrief } from "../api/client";
import { useBriefContext } from "../context/BriefContext";
import { saveBriefToHistory } from "../utils/storage";
import UrlInputCard from "../components/UrlInputCard";
import BriefResultCard from "../components/BriefResultCard";
import SourcesUsedCard from "../components/SourcesUsedCard";
import CompareSourcesTable from "../components/CompareSourcesTable";

export default function DashboardPage() {
  const { activeBrief, setActiveBrief, activeSources, setActiveSources, setActiveUrls } = useBriefContext();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchErrors, setFetchErrors] = useState([]);
  const [error, setError] = useState("");

  const handleGenerate = async ({ urls, summaryStyle }) => {
    setIsLoading(true);
    setError("");
    setFetchErrors([]);

    try {
      const contentResult = await fetchContent(urls);
      const sources = contentResult.sources || [];
      const failed = contentResult.failed || [];

      if (!sources.length) {
        throw new Error("No readable source content was extracted.");
      }

      const brief = await generateBrief(sources, summaryStyle);

      setActiveSources(sources);
      setActiveBrief(brief);
      setActiveUrls(urls);
      setFetchErrors(failed);
      saveBriefToHistory(brief, urls, sources);
    } catch (requestError) {
      setError(requestError.message || "Could not generate brief.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <UrlInputCard onSubmit={handleGenerate} isLoading={isLoading} />

      {error ? <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p> : null}

      {fetchErrors.length ? (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Some Sources Failed</h2>
          <ul className="list-disc ml-5 text-sm text-slate-700">
            {fetchErrors.map((item) => (
              <li key={item.url}>
                {item.url} - {item.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <BriefResultCard brief={activeBrief} />
      <CompareSourcesTable rows={activeBrief?.compareSources || []} />
      <SourcesUsedCard sources={activeSources} keyPoints={activeBrief?.keyPoints || []} />
    </div>
  );
}
