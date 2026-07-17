import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHttpUrl(value: unknown): string | null {
  if (!value) return null;
  try {
    const u = new URL(String(value));
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch { /* ignore */ }
  return null;
}

interface MapLocation {
  id: string;
  title: string;
  slug?: string;
  latitude: number;
  longitude: number;
  price?: string;
  currency?: string;
  image?: string;
}

interface MapboxMapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  height?: string;
  interactive?: boolean;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

export function MapboxMap({
  locations,
  center = [-16.6817, 13.4438],
  zoom = 11,
  className = "",
  height = "400px",
  interactive = true,
  onBoundsChange,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setError("Mapbox token not configured. Set VITE_MAPBOX_TOKEN in your environment.");
      setLoading(false);
      return;
    }

    // Display a placeholder/fallback map if token is missing
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        const mapboxgl = await import("mapbox-gl");

        mapboxgl.default.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.default.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom,
          interactive,
        });

        map.addControl(new mapboxgl.default.NavigationControl(), "top-right");

        map.on("load", () => {
          setLoading(false);
        });

        // Add markers (escape all user-derived content for setHTML / innerHTML)
        locations.forEach((loc) => {
          const el = document.createElement("div");
          el.className = "mapbox-marker";
          const marker = document.createElement("div");
          marker.style.cssText =
            "width:36px;height:36px;border-radius:50%;background:#1a5c3e;border:3px solid white;" +
            "box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;display:flex;align-items:center;" +
            "justify-content:center;color:white;font-size:16px;";
          marker.textContent = "🏠";
          el.appendChild(marker);

          const safeImage = safeHttpUrl(loc.image);
          const popup = new mapboxgl.default.Popup({ offset: 25 }).setHTML(`
            <div style="font-family: system-ui; max-width: 200px;">
              ${safeImage ? `<img src="${escapeHtml(safeImage)}" style="width:100%;height:100px;object-fit:cover;border-radius:4px;margin-bottom:8px;" />` : ""}
              <strong style="font-size:14px;">${escapeHtml(loc.title)}</strong>
              ${loc.price ? `<p style="color:#1a5c3e;font-weight:bold;margin:4px 0;">${escapeHtml(loc.price)} ${escapeHtml(loc.currency || "")}</p>` : ""}
            </div>
          `);

          new mapboxgl.default.Marker({ element: el })
            .setLngLat([loc.longitude, loc.latitude])
            .setPopup(popup)
            .addTo(map);
        });

        // Draw area bounds
        if (onBoundsChange) {
          map.on("moveend", () => {
            const b = map.getBounds();
            onBoundsChange({
              north: b.getNorth(),
              south: b.getSouth(),
              east: b.getEast(),
              west: b.getWest(),
            });
          });
        }

        // Fit bounds if multiple locations
        if (locations.length > 1) {
          const bounds = new mapboxgl.default.LngLatBounds();
          locations.forEach((loc) => bounds.extend([loc.longitude, loc.latitude]));
          map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
        }

        return () => { map.remove(); };
      } catch (err: any) {
        console.error("Mapbox failed to load:", err);
        setError("Failed to load map");
        setLoading(false);
      }
    };

    const cleanupFn = initMap();
    return () => { cleanupFn.then(fn => fn?.()).catch(() => {}); };
  }, [locations, center, zoom, interactive, onBoundsChange]);

  if (!MAPBOX_TOKEN) {
    // Fallback: static map display
    return (
      <div className={`bg-gray-100 rounded-xl overflow-hidden relative ${className}`} style={{ height }}>
        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="font-medium text-gray-700 mb-2">Property Map</p>
          <p className="text-sm text-center max-w-md mb-4">
            {locations.length} {locations.length === 1 ? "property" : "properties"} in this area
          </p>
          {locations.length > 0 && (
            <div className="text-xs text-gray-400 max-h-32 overflow-y-auto space-y-1">
              {locations.map((loc) => (
                <div key={loc.id} className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{loc.title}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">
            Set VITE_MAPBOX_TOKEN env var to enable interactive map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10" style={{ height }}>
          <Loader2 className="w-6 h-6 animate-spin text-kunda-700" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10" style={{ height }}>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div ref={mapContainer} style={{ height, width: "100%" }} />
    </div>
  );
}
