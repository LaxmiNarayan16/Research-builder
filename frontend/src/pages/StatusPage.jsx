import { useEffect, useState } from "react";
import { fetchSystemStatus } from "../api/client";

function StatusBadge({ status }) {
  const styles = {
    ok: "bg-emerald-100 text-emerald-700",
    configured: "bg-blue-100 text-blue-700",
    not_configured: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700"
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

export default function StatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchSystemStatus();
        setStatusData(data);
      } catch (err) {
        setError(err.message || "Failed to load system status.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <section className="card text-sm text-slate-600">Checking backend, database, and LLM status...</section>;
  if (error) return <section className="card text-sm text-red-700">{error}</section>;

  return (
    <section className="card">
      <h2 className="text-lg font-semibold mb-3">System Status</h2>
      <div className="space-y-3 text-sm">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="font-medium">Backend</p>
          <div className="mt-1"><StatusBadge status={statusData.backend.status} /></div>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="font-medium">Database</p>
          <div className="mt-1"><StatusBadge status={statusData.database.status} /></div>
          <p className="text-slate-600 mt-1">{statusData.database.detail}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
          <p className="font-medium">LLM Connection</p>
          <div className="mt-1"><StatusBadge status={statusData.llm.status} /></div>
          <p className="text-slate-600 mt-1">{statusData.llm.detail}</p>
          <p className="text-slate-500 mt-1">Provider: {statusData.llm.provider} | Model: {statusData.llm.model}</p>
        </div>
      </div>
    </section>
  );
}
