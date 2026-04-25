import { useState } from "react";

function CitationRow({ point, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <p className="font-medium text-slate-800">
        <span className="inline-flex w-6 h-6 mr-2 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs align-middle">
          {index + 1}
        </span>
        <span className="align-middle">{point.point || point.text}</span>
      </p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-2 text-sm text-brand-700 hover:underline"
      >
        {expanded ? "Hide citation" : `Show citation #${index + 1}`}
      </button>

      {expanded ? (
        <div className="mt-2 p-2 rounded-md bg-white border border-slate-200 text-sm">
          <a href={point.sourceUrl || point.source} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline break-all">
            {point.sourceUrl || point.source}
          </a>
          <p className="mt-1 text-slate-600">"{point.snippet}"</p>
        </div>
      ) : null}
    </li>
  );
}

export default function KeyPointsList({ keyPoints = [] }) {
  if (!keyPoints.length) {
    return <p className="text-sm text-slate-500">No key points generated yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {keyPoints.map((point, idx) => (
        <CitationRow key={`${point.source}-${idx}`} point={point} index={idx} />
      ))}
    </ul>
  );
}
