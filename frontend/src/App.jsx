import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import SourcesPage from "./pages/SourcesPage";
import HistoryPage from "./pages/HistoryPage";
import StatusPage from "./pages/StatusPage";

const navItems = [
  { to: "/home", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/status", label: "Status" },
  { to: "/sources", label: "Sources" },
  { to: "/history", label: "History" }
];

function Navigation() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-10 backdrop-blur bg-slate-100/90 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Research Brief Builder</h1>
          <p className="text-sm text-slate-600">Collect, compare, and summarize evidence fast.</p>
        </div>
        <div className="flex gap-2">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  active ? "bg-brand-500 text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen text-slate-800">
      <Navigation />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}
