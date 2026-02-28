"use client";

import { useEffect, useRef, useState } from "react";
import type { Team } from "../app/page";

interface HockeyMapProps {
  teams: Team[];
}

export default function HockeyMap({ teams }: HockeyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Team | null>(null);
  const markersRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet (browser-only)
    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");

      // Fix Leaflet default icon path issue with Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [62.5, 16.0],
        zoom: 5,
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

      // Custom blue pin icon
      const hockeyIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:12px;height:12px;
          background:#3b82f6;
          border:2px solid #93c5fd;
          border-radius:50%;
          box-shadow:0 0 6px rgba(59,130,246,0.8);
        "></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        popupAnchor: [0, -10],
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clusterGroup = (L as any).markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: (cluster: { getChildCount: () => number }) => {
          const count = cluster.getChildCount();
          const size = count < 10 ? 32 : count < 50 ? 38 : 44;
          return L.divIcon({
            html: `<div style="
              width:${size}px;height:${size}px;
              background:rgba(37,99,235,0.85);
              border:2px solid rgba(147,197,253,0.6);
              border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              color:white;font-weight:700;
              font-size:${count < 10 ? 12 : 11}px;
              box-shadow:0 2px 10px rgba(37,99,235,0.5);
            ">${count}</div>`,
            className: "",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        },
      });

      teams.forEach((team) => {
        if (team.lat === null || team.lng === null) return;
        const displayTown = team.town || team.suggested_town || "";
        const marker = L.marker([team.lat, team.lng], { icon: hockeyIcon });

        const popupContent = `
          <div style="min-width:180px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#f1f5f9">${team.team}</div>
            <div style="color:#94a3b8;font-size:12px;margin-bottom:6px">
              📍 ${displayTown}${team.suggested_town && !team.town ? " <em style='color:#64748b'>(suggested)</em>" : ""}
            </div>
            ${
              team.homesite
                ? `<a href="${team.homesite}" target="_blank" rel="noopener"
                   style="color:#60a5fa;font-size:11px;text-decoration:none;
                   border:1px solid #1e40af;border-radius:4px;padding:2px 6px;display:inline-block">
                   🌐 Website
                   </a>`
                : ""
            }
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 260 });
        clusterGroup.addLayer(marker);
      });

      map.addLayer(clusterGroup);
      mapInstanceRef.current = map;
      markersRef.current = clusterGroup;
    };

    initMap();
  }, [teams]);

  // Search: fly to first matching team
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim() || !mapInstanceRef.current) return;
    const q = search.toLowerCase();
    const match = teams.find(
      (t) =>
        t.team.toLowerCase().includes(q) ||
        (t.town || t.suggested_town || "").toLowerCase().includes(q)
    );
    if (match && match.lat && match.lng) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mapInstanceRef.current as any).flyTo([match.lat, match.lng], 12, {
        duration: 1.2,
      });
      setSelected(match);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Search bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-80">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search team or city..."
            className="flex-1 px-3 py-2 text-sm bg-slate-800/90 backdrop-blur border border-slate-600
                       rounded-lg text-white placeholder-slate-500 focus:outline-none
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm
                       rounded-lg transition-colors font-medium"
          >
            Go
          </button>
        </form>
        {selected && (
          <div className="mt-2 px-3 py-2 bg-slate-800/90 backdrop-blur border border-slate-600
                          rounded-lg text-sm text-slate-300 flex justify-between items-center">
            <span>
              <span className="text-white font-medium">{selected.team}</span>
              {" — "}
              {selected.town || selected.suggested_town}
            </span>
            <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white ml-2">✕</button>
          </div>
        )}
      </div>

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
