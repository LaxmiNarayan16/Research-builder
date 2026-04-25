import { Link } from "react-router-dom";

const steps = [
  "Paste 5-10 article/blog/document URLs in Dashboard.",
  "Click Generate Research Brief to fetch and clean content.",
  "Review summary, key points, conflicts, and verify checklist.",
  "Open Sources page to inspect what content was used.",
  "Use History page to reopen one of the last 5 briefs."
];

export default function HomePage() {
  return (
    <section className="card">
      <h2 className="text-xl font-semibold">Welcome</h2>
      <p className="text-sm text-slate-600 mt-1">
        This app builds evidence-grounded research briefs from multiple web sources.
      </p>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">Simple Steps</h3>
        <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="mt-5 flex gap-2">
        <Link to="/dashboard" className="px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-700">
          Go to Dashboard
        </Link>
        <Link to="/status" className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50">
          Check System Status
        </Link>
      </div>
    </section>
  );
}
