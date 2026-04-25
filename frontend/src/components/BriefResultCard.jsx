import KeyPointsList from "./KeyPointsList";
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";

export default function BriefResultCard({ brief }) {
  const [search, setSearch] = useState("");

  const filteredKeyPoints = useMemo(() => {
    if (!brief) return [];
    if (!search.trim()) return brief.keyPoints || [];
    const term = search.toLowerCase();
    return (brief.keyPoints || []).filter((point) =>
      `${point.point || point.text} ${point.snippet || ""}`.toLowerCase().includes(term)
    );
  }, [brief, search]);

  if (!brief) {
    return (
      <section className="card">
        <h2 className="text-lg font-semibold">Generated Brief</h2>
        <p className="text-sm text-slate-500 mt-2">Your summary, key points, conflicts, and verification checklist appear here.</p>
      </section>
    );
  }

  const copyBrief = async () => {
    const payload = {
      summary: brief.summary,
      keyPoints: brief.keyPoints,
      conflictingClaims: brief.conflictingClaims || brief.conflicts || [],
      verifyChecklist: brief.verifyChecklist || []
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    const ensureSpace = (needed = 22) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const addParagraph = (text = "", fontSize = 11, gap = 16) => {
      const safeText = String(text || "");
      if (!safeText.trim()) return;
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(safeText, maxWidth);
      lines.forEach((line) => {
        ensureSpace(16);
        doc.text(line, margin, y);
        y += 14;
      });
      y += gap - 14;
    };

    doc.setFontSize(18);
    doc.text("Research Brief", margin, y);
    y += 22;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    doc.setFontSize(13);
    doc.text("Summary", margin, y);
    y += 14;
    addParagraph(brief.summary, 11, 18);

    doc.setFontSize(13);
    ensureSpace(18);
    doc.text("Key Points", margin, y);
    y += 14;
    (brief.keyPoints || []).forEach((point, idx) => {
      addParagraph(`${idx + 1}. ${point.point || point.text}`, 11, 6);
      addParagraph(`Source: ${point.sourceUrl || point.source || ""}`, 9, 4);
      addParagraph(`Snippet: ${point.snippet || ""}`, 9, 10);
    });

    const conflicts = brief.conflictingClaims || brief.conflicts || [];
    if (conflicts.length) {
      doc.setFontSize(13);
      ensureSpace(18);
      doc.text("Conflicting Claims", margin, y);
      y += 14;
      conflicts.forEach((conflict, idx) => {
        addParagraph(`${idx + 1}. Claim A: ${conflict.claimA}`, 10, 4);
        addParagraph(`Claim B: ${conflict.claimB}`, 10, 4);
        if (Array.isArray(conflict.sources) && conflict.sources.length) {
          addParagraph(`Sources: ${conflict.sources.join(", ")}`, 9, 8);
        }
      });
    }

    doc.setFontSize(13);
    ensureSpace(18);
    doc.text("What to Verify", margin, y);
    y += 14;
    (brief.verifyChecklist || []).forEach((item, idx) => {
      addParagraph(`${idx + 1}. ${item}`, 10, 6);
    });

    doc.save(`research-brief-${Date.now()}.pdf`);
  };

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Generated Brief</h2>
        <p className="text-xs text-slate-500 mt-1">Evidence-based output: claims are extracted from source text snippets.</p>
        <p className="text-xs text-slate-500 mt-1">
          Style: <span className="font-medium capitalize">{brief.summaryStyle || "informative"}</span>
        </p>
        <p className="text-sm text-slate-600 mt-1">{brief.summary}</p>
        <div className="mt-3 flex gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search within brief..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="button" onClick={copyBrief} className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm">
            Copy
          </button>
          <button type="button" onClick={downloadPdf} className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm">
            Download PDF
          </button>
        </div>
      </div>

      {brief.topicTags?.length ? (
        <div className="flex flex-wrap gap-2">
          {brief.topicTags.map((tag) => (
            <span key={tag} className="px-2 py-1 text-xs rounded-full bg-brand-100 text-brand-700 font-medium">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div>
        <h3 className="font-semibold mb-2">Key Points & Citations</h3>
        <KeyPointsList keyPoints={filteredKeyPoints} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Conflicting Claims</h3>
        {(brief.conflictingClaims || brief.conflicts || []).length ? (
          <ul className="space-y-2">
            {(brief.conflictingClaims || brief.conflicts || []).map((conflict, idx) => (
              <li key={`${conflict.claimA}-${idx}`} className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm">
                <p className="font-medium text-amber-800">Detected disagreement across sources.</p>
                <p className="mt-2"><span className="font-semibold">Claim A:</span> {conflict.claimA}</p>
                <p className="mt-1"><span className="font-semibold">Claim B:</span> {conflict.claimB}</p>
                {(conflict.sources || []).length ? (
                  <div className="mt-2 space-y-1">
                    {(conflict.sources || []).map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="block text-xs text-brand-700 hover:underline break-all">
                        {url}
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No strong conflicting claims detected.</p>
        )}
      </div>

      <div>
        <h3 className="font-semibold mb-2">What to Verify</h3>
        <ul className="list-disc ml-5 text-sm text-slate-700 space-y-1">
          {(brief.verifyChecklist || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
