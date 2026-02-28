"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HockeyMap = dynamic(() => import("../components/HockeyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-900">
      <div className="text-slate-400 text-sm animate-pulse">Loading map...</div>
    </div>
  ),
});

export interface Team {
  team: string;
  homesite: string;
  town: string;
  suggested_town: string | null;
  continent: string;
  lat: number | null;
  lng: number | null;
}

export default function Home() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/teams-geocoded.json")
      .then((r) => r.json())
      .then((data: Team[]) => {
        setTeams(data);
        setLoading(false);
      });
  }, []);

  const mappable = teams.filter((t) => t.lat !== null && t.lng !== null);
  const total = teams.length;
  const withCoords = mappable.length;

  return (
    <main className="flex flex-col h-screen bg-slate-900">
      <header className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏒</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Swedish Hockey Teams
            </h1>
            <p className="text-xs text-slate-400">
              {loading
                ? "Loading..."
                : `${withCoords} teams mapped · ${total - withCoords} without location`}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Click a pin for details
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            Scroll to zoom
          </span>
        </div>
      </header>
      <div className="flex-1 relative">
        {!loading && <HockeyMap teams={mappable} />}
      </div>
    </main>
  );
}
