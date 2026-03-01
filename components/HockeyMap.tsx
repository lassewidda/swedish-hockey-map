"use client";

import { useEffect, useRef, useState } from "react";
import type { Team } from "../app/page";

interface HockeyMapProps {
  teams: Team[];
}

// Flag emoji from ISO country name (best-effort)
const NATION_FLAGS: Record<string, string> = {
  Sweden: "🇸🇪", Finland: "🇫🇮", Canada: "🇨🇦", USA: "🇺🇸", USa: "🇺🇸",
  Russia: "🇷🇺", Germany: "🇩🇪", Switzerland: "🇨🇭", Norway: "🇳🇴",
  Denmark: "🇩🇰", France: "🇫🇷", Austria: "🇦🇹", Slovakia: "🇸🇰",
  Czechia: "🇨🇿", "Czech Republic": "🇨🇿", Latvia: "🇱🇻", Lithuania: "🇱🇹",
  Estonia: "🇪🇪", Belarus: "🇧🇾", Ukraine: "🇺🇦", Poland: "🇵🇱",
  Italy: "🇮🇹", Spain: "🇪🇸", Netherlands: "🇳🇱", Belgium: "🇧🇪",
  Hungary: "🇭🇺", Romania: "🇷🇴", Croatia: "🇭🇷", Slovenia: "🇸🇮",
  Serbia: "🇷🇸", Bulgaria: "🇧🇬", Japan: "🇯🇵", "South Korea": "🇰🇷",
  China: "🇨🇳", Australia: "🇦🇺", "New Zealand": "🇳🇿", Kazakhstan: "🇰🇿",
  Israel: "🇮🇱", Turkey: "🇹🇷", Iceland: "🇮🇸", Ireland: "🇮🇪",
  "U.K.": "🇬🇧", England: "🇬🇧", Scotland: "🇬🇧", Wales: "🇬🇧",
  "Northern Ireland": "🇬🇧", Mexico: "🇲🇽", Argentina: "🇦🇷",
  Brazil: "🇧🇷", "South Africa": "🇿🇦",
};

function getFlag(nation: string): string {
  return NATION_FLAGS[nation] || "🌍";
}

export default function HockeyMap({ teams }: HockeyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [50, 15],
        zoom: 4,
        zoomControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      const hockeyIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:10px;height:10px;
          background:#3b82f6;
          border:2px solid #93c5fd;
          border-radius:50%;
          box-shadow:0 0 5px rgba(59,130,246,0.7);
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
        popupAnchor: [0, -8],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 35,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount();
          const size = count < 10 ? 30 : count < 100 ? 36 : count < 500 ? 42 : 48;
          const bg = count < 10
            ? "rgba(37,99,235,0.85)"
            : count < 100
            ? "rgba(29,78,216,0.85)"
            : "rgba(30,58,138,0.9)";
          return L.divIcon({
            html: `<div style="
              width:${size}px;height:${size}px;
              background:${bg};
              border:2px solid rgba(147,197,253,0.5);
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              color:white;font-weight:700;
              font-size:${count < 10 ? 12 : 10}px;
              box-shadow:0 2px 8px rgba(37,99,235,0.4);
            ">${count >= 1000 ? Math.round(count / 1000) + "k" : count}</div>`,
            className: "",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });

      teams.forEach((team) => {
        if (team.lat === null || team.lng === null) return;
        const displayTown = team.town || team.suggested_town || "";
        const flag = getFlag(team.nation);
        const marker = L.marker([team.lat, team.lng], { icon: hockeyIcon });

        const popupContent = `
          <div style="min-width:190px;font-family:-apple-system,sans-serif">
            <div style="font-weight:700;font-size:14px;margin-bottom:5px;color:#f1f5f9;line-height:1.3">${team.team}</div>
            ${team.nation ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:3px">${flag} ${team.nation}</div>` : ""}
            ${displayTown ? `<div style="font-size:12px;color:#94a3b8;margin-bottom:7px">📍 ${displayTown}</div>` : ""}
            ${
              team.homesite
                ? `<a href="${team.homesite}" target="_blank" rel="noopener"
                   style="color:#60a5fa;font-size:11px;text-decoration:none;
                   border:1px solid #1e40af;border-radius:4px;padding:2px 8px;display:inline-block">
                   🌐 Website
                   </a>`
                : ""
            }
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280 });
        clusterGroup.addLayer(marker);
      });

      map.addLayer(clusterGroup);
      mapInstanceRef.current = map;
    };

    initMap();
  }, [teams]);

  // Live search: update results as user types
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearch(q);
    if (!q.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const lower = q.toLowerCase();
    const matches = teams
      .filter(
        (t) =>
          t.team.toLowerCase().includes(lower) ||
          (t.town || "").toLowerCase().includes(lower) ||
          (t.nation || "").toLowerCase().includes(lower)
      )
      .slice(0, 8);
    setResults(matches);
    setShowResults(true);
  };

  const flyTo = (team: Team) => {
    if (!team.lat || !team.lng || !mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstanceRef.current as any).flyTo([team.lat, team.lng], 13, {
      duration: 1.2,
    });
    setSearch(team.team);
    setShowResults(false);
  };

  return (
    <div className="relative w-full h-full">
      {/* Search */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-96 max-w-[calc(100vw-2rem)]">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Search team, city, or country..."
            className="w-full px-4 py-2.5 text-sm bg-slate-800/95 backdrop-blur border border-slate-600
                       rounded-xl text-white placeholder-slate-500 focus:outline-none
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setResults([]); setShowResults(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {showResults && results.length > 0 && (
          <div className="mt-1 bg-slate-800/98 backdrop-blur border border-slate-600 rounded-xl
                          overflow-hidden shadow-2xl">
            {results.map((team, i) => (
              <button
                key={i}
                onClick={() => flyTo(team)}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors
                           border-b border-slate-700/50 last:border-0"
              >
                <div className="text-sm font-medium text-white truncate">{team.team}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  {team.nation && (
                    <span className="flex items-center gap-1">
                      <span>{getFlag(team.nation)}</span>
                      <span className="text-slate-300">{team.nation}</span>
                      {team.town && <span className="text-slate-600">·</span>}
                    </span>
                  )}
                  {team.town && <span>{team.town}</span>}
                </div>
              </button>
            ))}
            {results.length === 8 && (
              <div className="px-4 py-1.5 text-xs text-slate-500 italic">
                Showing top 8 results — type more to narrow
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
