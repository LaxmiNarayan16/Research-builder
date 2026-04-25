export default function CompareSourcesTable({ rows = [] }) {
  if (!rows.length) return null;

  return (
    <section className="card overflow-hidden">
      <h2 className="text-lg font-semibold mb-3">Compare Sources</h2>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-3 font-semibold">Source</th>
              <th className="p-3 font-semibold">Top Claim</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.source} className="border-t border-slate-200 align-top">
                <td className="p-3">
                  <a href={row.source} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline break-all">
                    {row.title || row.source}
                  </a>
                </td>
                <td className="p-3 text-slate-700">{row.topClaim}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
