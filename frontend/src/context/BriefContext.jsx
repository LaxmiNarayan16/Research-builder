import { createContext, useContext, useMemo, useState } from "react";

const BriefContext = createContext(null);

export function BriefProvider({ children }) {
  const [activeBrief, setActiveBrief] = useState(null);
  const [activeSources, setActiveSources] = useState([]);
  const [activeUrls, setActiveUrls] = useState([]);

  const value = useMemo(
    () => ({
      activeBrief,
      setActiveBrief,
      activeSources,
      setActiveSources,
      activeUrls,
      setActiveUrls
    }),
    [activeBrief, activeSources, activeUrls]
  );

  return <BriefContext.Provider value={value}>{children}</BriefContext.Provider>;
}

export function useBriefContext() {
  const context = useContext(BriefContext);
  if (!context) {
    throw new Error("useBriefContext must be used within BriefProvider");
  }
  return context;
}
