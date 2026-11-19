import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export const REGIONS = ["水戸駅周辺", "水戸市内", "いわき市", "その他の地域"] as const;
export type Region = typeof REGIONS[number];
export type RegionFilter = Region | "すべて";

type RegionContextValue = { region: RegionFilter; setRegion: (region: RegionFilter) => void };
const RegionContext = createContext<RegionContextValue | undefined>(undefined);

function readRegion(): RegionFilter {
  let stored: string | null = null;
  try { stored = localStorage.getItem("hoshii-region"); } catch { /* Storage can be disabled by the browser. */ }
  return stored === "すべて" || stored === "水戸駅周辺" || stored === "水戸市内" || stored === "いわき市" || stored === "その他の地域" ? stored : "水戸駅周辺";
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<RegionFilter>(readRegion);
  const value = useMemo(() => ({
    region,
    setRegion(next: RegionFilter) {
      setRegionState(next);
      try { localStorage.setItem("hoshii-region", next); } catch { /* Keep the in-memory selection. */ }
    },
  }), [region]);
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (!context) throw new Error("useRegion は RegionProvider の内側で使ってください。");
  return context;
}
