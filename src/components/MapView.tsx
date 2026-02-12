import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  CircleMarker,
  Circle,
  GeoJSON,
  useMapEvents,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { Lesson, Place, PlaceCategory } from "../types";
import { haversineKm, sumPathKm } from "../utils/geo";
import type { Layers } from "./LayerControls";
import type { CategoryFilter } from "./FilterControls";
import type { BaseMapId } from "./BaseMapControls";
import type { GisLayerKey, GisLayerStats, GisState } from "../gis/types";
import ExternalGisLayers from "./ExternalGisLayers";

import egyptGeo from "../data/geo/egypt.json";
import nileGeo from "../data/geo/nile.json";
import deltaGeo from "../data/geo/delta.json";

const MAP_CENTER: [number, number] = [26.5, 30.8];

type DrawMode = "none" | "marker" | "path";

function TapHandler(props: {
  mode: DrawMode;
  onAddMarker: (pos: LatLngExpression) => void;
  onAddPathPoint: (pos: [number, number]) => void;
  onMove?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (props.mode === "marker") props.onAddMarker([e.latlng.lat, e.latlng.lng]);
      if (props.mode === "path") props.onAddPathPoint([e.latlng.lat, e.latlng.lng]);
    },
    mousemove(e) {
      props.onMove?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapFocus(props: { place: Place | null; focusToken: number }) {
  const map = useMap();
  useEffect(() => {
    if (!props.place) return;
    const zoom = Math.max(map.getZoom(), 9);
    map.flyTo([props.place.lat, props.place.lng], zoom, { duration: 1.1 });
  }, [map, props.place, props.focusToken]);
  return null;
}

const emojiByCat: Record<PlaceCategory, string> = {
  fresh: "💧",
  salty: "🌊",
  mineral: "⛏️",
  energy: "⚡",
  renewable: "☀️",
  problem: "⚠️",
  project: "🏗️",
  agri: "🌾",
  transport: "🚆",
  urban: "🏙️",
  aquaculture: "🐟",
  waterway: "🚢",
  mega: "🏆",
};

const labelByCat: Record<PlaceCategory, string> = {
  fresh: "عذبة",
  salty: "مالحة",
  mineral: "معادن",
  energy: "طاقة",
  renewable: "متجددة",
  problem: "مشكلات",
  project: "مشروعات",
  agri: "زراعي",
  transport: "نقل",
  urban: "عمران/مدن",
  aquaculture: "استزراع",
  waterway: "ممر مائي",
  mega: "قومي",
};

const colorByCat: Record<PlaceCategory, string> = {
  fresh: "#38bdf8",
  salty: "#0ea5e9",
  mineral: "#f97316",
  energy: "#f59e0b",
  renewable: "#22c55e",
  problem: "#ef4444",
  project: "#facc15",
  agri: "#84cc16",
  transport: "#14b8a6",
  urban: "#94a3b8",
  aquaculture: "#06b6d4",
  waterway: "#0284c7",
  mega: "#f97316",
};

type MarkerState = "idle" | "hover" | "active";

function mkIcon(cat: PlaceCategory, state: MarkerState) {
  const em = emojiByCat[cat] ?? "\uD83D\uDCCD";
  const accent = colorByCat[cat] ?? "#38bdf8";
  const isActive = state === "active";
  const isHover = state === "hover";
  const size = isActive ? 72 : isHover ? 68 : 62;
  const anchor = isActive ? 36 : isHover ? 34 : 31;
  const popup = isActive ? -64 : isHover ? -60 : -56;
  return L.divIcon({
    className: "kids-marker",
    html: `<div class="kids-pin ${isActive ? "active" : ""} ${isHover ? "hover" : ""}" style="--pin-accent:${accent};"><span class="emoji">${em}</span><span class="pulse"></span><span class="halo"></span></div>`,
    iconSize: [size, size],
    iconAnchor: [anchor, size],
    popupAnchor: [0, popup],
  });
}

function tileFor(id: BaseMapId) {
  if (id === "esri") return { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attr: "Tiles © Esri" };
  if (id === "hot") return { url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", attr: "© OpenStreetMap contributors, HOT" };
  if (id === "osm") return { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr: "© OpenStreetMap contributors" };
  if (id === "kids") return { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attr: "© OpenStreetMap contributors © CARTO" };
  return { url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attr: "© OpenStreetMap contributors © CARTO" };
}

export default function MapView(props: {
  lesson: Lesson;
  activePlaceId: string | null;
  onSelectPlace: (id: string) => void;
  focusToken: number;
  resetToken: number;
  layers: Layers;
  filters: CategoryFilter;
  baseMap: BaseMapId;
  gis?: GisState;
  onGisStats?: (layerKey: GisLayerKey, next: GisLayerStats) => void;
}) {
  const { lesson, activePlaceId, onSelectPlace, focusToken, resetToken, layers, filters, baseMap } = props;

  const activePlace: Place | null = useMemo(
    () => lesson.places.find((p) => p.id === activePlaceId) ?? null,
    [lesson.places, activePlaceId]
  );

  const [mode, setMode] = useState<DrawMode>("none");
  const [userMarkers, setUserMarkers] = useState<LatLngExpression[]>([]);
  const [path, setPath] = useState<[number, number][]>([]);
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);

  const [legendQuery, setLegendQuery] = useState("");
  const legendRefs = useMemo(() => new Map<string, HTMLButtonElement | null>(), []);
  const markerRefs = useRef<Map<string, any>>(new Map());
  const [legendOpen, setLegendOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [hoverPlaceId, setHoverPlaceId] = useState<string | null>(null);

  const isCompact = useMemo(() => window.innerWidth < 1024, []);
  useEffect(() => {
    if (isCompact) { setLegendOpen(false); setToolsOpen(false); }
  }, [isCompact]);


  useEffect(() => {
    if (!activePlaceId) return;
    const el = legendRefs.get(activePlaceId);
    if (el && typeof (el as any).scrollIntoView === "function") {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activePlaceId, legendRefs]);


  const distanceKm = useMemo(() => (path.length >= 2 ? sumPathKm(path) : 0), [path]);
  const heatCenters = useMemo(() => {
    return [...lesson.places]
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        importance: p.metrics?.importance ?? 55,
        color: colorByCat[p.category] ?? "#94a3b8",
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10);
  }, [lesson.places]);
  const visiblePlaces = useMemo<Place[]>(() => {
    return lesson.places.filter((p) => (filters[p.category] ?? true));
  }, [lesson.places, filters]);

  useEffect(() => {
    if (!activePlaceId) return;
    const m = markerRefs.current.get(activePlaceId);
    try {
      m?.openPopup?.();
    } catch { }
  }, [activePlaceId, focusToken, visiblePlaces]);

  const legendPlaces = useMemo<Place[]>(() => {
    const q = legendQuery.trim().toLowerCase();
    const source = lesson.places;
    if (!q) return source;
    return source.filter((p) => {
      const hay = `${p.title} ${(p.aliases ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [lesson.places, legendQuery]);

  const distanceById = useMemo(() => {
    const origin: [number, number] = activePlace ? [activePlace.lat, activePlace.lng] : MAP_CENTER;
    const m = new Map<string, number>();
    for (const p of lesson.places) {
      const d = haversineKm(origin, [p.lat, p.lng]);
      m.set(p.id, Math.round(d));
    }
    return m;
  }, [lesson.places, activePlace]);

  const hiddenCount = useMemo(
    () => lesson.places.filter((p) => !(filters[p.category] ?? true)).length,
    [lesson.places, filters]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMode("none"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setUserMarkers([]);
    setPath([]);
    setMode("none");
    setLegendQuery("");
    setLegendOpen(true);
    setToolsOpen(true);
  }, [resetToken]);

  const tile = tileFor(baseMap);
  const egyptStyle = { color: "#0f172a", weight: 2.2, opacity: 0.55, fillOpacity: 0.05 };
  const deltaStyle = { color: "#38bdf8", weight: 2.8, opacity: 0.75, fillOpacity: 0.14 };
  const nileStyle = { color: "#0ea5e9", weight: 4.2, opacity: 0.85 };
  const activeAccent = activePlace ? colorByCat[activePlace.category] ?? "#38bdf8" : "#38bdf8";
  const activeImportance = activePlace?.metrics?.importance ?? 60;
  const ringInner = 12000 + activeImportance * 180;
  const ringOuter = 26000 + activeImportance * 360;
  const ringHalo = 8000 + activeImportance * 120;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={7}
        className={clsx(
          "h-full w-full rounded-[34px] overflow-hidden shadow-glow gradient-stroke transition-all duration-700 kids-map-shell",
          baseMap === "kids" && "map-kids-filter"
        )}
      >
        <TileLayer attribution={tile.attr} url={tile.url} />
        <MapFocus place={activePlace} focusToken={focusToken} />
        <TapHandler
          mode={mode}
          onAddMarker={(pos) => setUserMarkers((m) => [...m, pos])}
          onAddPathPoint={(pos) => setPath((p) => [...p, pos])}
          onMove={(lat, lng) => setCursor({ lat, lng })}
        />

        {props.gis ? <ExternalGisLayers gis={props.gis} onGisStats={props.onGisStats} /> : null}

        {layers.showEgypt ? <GeoJSON data={egyptGeo as any} style={() => egyptStyle} /> : null}
        {layers.showDelta ? <GeoJSON data={deltaGeo as any} style={() => deltaStyle} /> : null}
        {layers.showNile ? <GeoJSON data={nileGeo as any} style={() => nileStyle} /> : null}

        {layers.showHeat ? heatCenters.map((c) => (
          <Circle
            key={c.id}
            center={[c.lat, c.lng] as any}
            radius={12000 + c.importance * 260}
            pathOptions={{ color: c.color, weight: 1.5, opacity: 0.25, fillOpacity: 0.12 }}
          />
        )) : null}

        {layers.showPlaces ? visiblePlaces.map((p) => {
          const markerState: MarkerState = p.id === activePlaceId ? "active" : p.id === hoverPlaceId ? "hover" : "idle";
          const isPinned = layers.showLabels || p.id === activePlaceId;
          const showLabel = layers.showLabels || p.id === activePlaceId || p.id === hoverPlaceId;
          const importance = p.metrics?.importance;
          const distanceKm = distanceById.get(p.id) ?? 0;
          const distanceLabel = p.id === activePlaceId ? "هنا" : `${distanceKm} كم`;
          const distanceTitle = activePlace ? "المسافة من المعلم الحالي" : "المسافة من مركز الخريطة";
          const metaLine = [
            labelByCat[p.category] ?? p.category,
            typeof importance === "number" ? `أهمية ${importance}` : null,
          ]
            .filter(Boolean)
            .join(" • ");
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              ref={(r) => { if (r) markerRefs.current.set(p.id, r); }}
              icon={mkIcon(p.category, markerState)}
              eventHandlers={{
                click: () => onSelectPlace(p.id),
                mouseover: () => setHoverPlaceId(p.id),
                mouseout: () => setHoverPlaceId((prev) => (prev === p.id ? null : prev)),
              }}
            >
              {showLabel ? (
                <Tooltip direction="top" offset={[0, -26]} opacity={1} permanent={isPinned}>
                  {p.title}
                </Tooltip>
              ) : null}
              <Popup>
                <div className="space-y-2">
                  <div className="text-base font-extrabold">{p.title}</div>
                  <div className="text-sm text-white/90">{p.summary}</div>
                  {metaLine ? <div className="text-xs text-white/70">{metaLine}</div> : null}
                  <div className="flex gap-2 flex-wrap">
                    <span className="badge">{labelByCat[p.category] ?? p.category}</span>
                    {typeof importance === "number" ? <span className="badge">أهمية {importance}</span> : null}
                    <span className="badge" title={distanceTitle}>{distanceLabel}</span>
                    <span className="badge">اضغط للانتقال</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }) : null}

        {activePlace ? (
          <>
            <CircleMarker
              center={[activePlace.lat, activePlace.lng]}
              radius={20}
              pathOptions={{ color: activeAccent, weight: 3, opacity: 1, fillOpacity: 0.22 }}
            />
            <Circle
              center={[activePlace.lat, activePlace.lng] as any}
              radius={ringHalo}
              pathOptions={{ color: activeAccent, weight: 1.5, opacity: 0.28, fillOpacity: 0.12 }}
            />
            <Circle
              center={[activePlace.lat, activePlace.lng] as any}
              radius={ringInner}
              pathOptions={{ color: activeAccent, weight: 1.2, opacity: 0.2, fillOpacity: 0.07 }}
            />
            <Circle
              center={[activePlace.lat, activePlace.lng] as any}
              radius={ringOuter}
              pathOptions={{ color: activeAccent, weight: 1.2, opacity: 0.16, fillOpacity: 0.04, className: "map-pulse-ring" }}
            />
          </>
        ) : null}

        {userMarkers.map((pos, i) => (
          <CircleMarker key={i} center={pos as any} radius={7} pathOptions={{ color: "#22d3ee", weight: 2.5, opacity: 0.9, fillOpacity: 0.35 }} />
        ))}
        {path.length >= 2 ? <Polyline positions={path as any} pathOptions={{ color: "#f59e0b", weight: 3.5, opacity: 0.9 }} /> : null}
      </MapContainer>

      {activePlace ? <div key={`${activePlace.id}-${focusToken}`} className="map-focus-ring z-[500]" /> : null}

      <div className="absolute left-1/2 top-4 z-[850] -translate-x-1/2 hidden md:block pointer-events-none">
        <div className="kids-map-guide rounded-2xl px-4 py-2 text-center">
          <div className="panel-title">كيف تبدأ؟</div>
          <div className="text-xs text-white/90">
            1) اختر معلم • 2) شاهد الصور والفيديو • 3) أكمل الرحلة
          </div>
        </div>
      </div>

      {/* Panel toggles */}
      {!legendOpen || !toolsOpen ? (
        <div className="absolute left-4 top-4 z-[999] map-panel rounded-2xl p-2 shadow-soft space-y-2 w-[200px]">
          {!legendOpen ? (
            <button className="btn-strong text-xs w-full" onClick={() => setLegendOpen(true)}>فتح مفتاح المعالم</button>
          ) : null}
          {!toolsOpen ? (
            <button className="btn-strong text-xs w-full" onClick={() => setToolsOpen(true)}>فتح أدوات الرسم</button>
          ) : null}
        </div>
      ) : null}

      {/* Legend panel */}
      <AnimatePresence>
        {legendOpen ? (
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 top-4 z-[900] w-[260px] map-panel rounded-3xl p-2 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <div className="panel-title">فلتر المعالم</div>
              <button className="btn text-xs" onClick={() => setLegendOpen(false)}>إغلاق</button>
            </div>

            <div className="mt-2">
              <input value={legendQuery} onChange={(e) => setLegendQuery(e.target.value)} className="input w-full" placeholder="ابحث عن معلم... (اكتب اسم مكان)" />
            </div>
            <div className="mt-2 text-xs text-white/70">
              إجمالي: {lesson.places.length} • مخفي بالفلاتر: {hiddenCount}
            </div>
            <div className="mt-1 text-[11px] text-white/60">القائمة تعرض كل المعالم حتى لو مخفية بالفلاتر.</div>

            <div className="mt-2 grid gap-2 max-h-[220px] overflow-auto pr-1">
              {legendPlaces.map((p) => {
                const importance = p.metrics?.importance;
                const isHidden = !(filters[p.category] ?? true);
                const metaLine = [
                  labelByCat[p.category] ?? p.category,
                  typeof importance === "number" ? `أهمية ${importance}` : null,
                ]
                  .filter(Boolean)
                  .join(" • ");
                const distanceKm = distanceById.get(p.id) ?? 0;
                const distanceLabel = p.id === activePlaceId ? "هنا" : `${distanceKm} كم`;
                return (
                  <button
                    key={p.id}
                    ref={(el) => legendRefs.set(p.id, el)}
                    onClick={() => {
                      onSelectPlace(p.id);
                      if (isCompact) setLegendOpen(false);
                    }}
                    onMouseEnter={() => setHoverPlaceId(p.id)}
                    onMouseLeave={() => {
                      setHoverPlaceId((prev) => (prev === p.id ? null : prev));
                    }}
                    onFocus={() => setHoverPlaceId(p.id)}
                    onBlur={() => setHoverPlaceId((prev) => (prev === p.id ? null : prev))}
                    className={clsx(
                      "btn text-right font-semibold flex items-center justify-between",
                      p.id === activePlaceId && "border-white/35 bg-white/10",
                      isHidden && "opacity-60"
                    )}
                    title={`${p.summary}${isHidden ? " • مخفي بالفلاتر" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{emojiByCat[p.category] ?? "📍"}</span>
                      <span className="text-right leading-tight">
                        <span className="block">{p.title}</span>
                        {metaLine ? <span className="block text-[11px] text-white/65">{metaLine}</span> : null}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      {isHidden ? <span className="badge">مخفي</span> : null}
                      <span
                        className="badge"
                        title={activePlace ? "المسافة من المعلم الحالي" : "المسافة من مركز الخريطة"}
                      >
                        {distanceLabel}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 text-xs text-white/70">أي زر هنا = FlyTo للمكان + فتح معلوماته.</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Tools panel */}
      <AnimatePresence>
        {toolsOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.2 }}
            className="absolute left-4 bottom-4 z-[900] map-panel rounded-3xl p-2 shadow-soft w-[260px]"
          >
            <div className="flex items-center justify-between">
              <div className="panel-title">أدوات الرسم</div>
              <button className="btn text-xs" onClick={() => setToolsOpen(false)}>إغلاق</button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button className={clsx("btn text-xs", mode === "marker" && "border-white/35 bg-white/10")} onClick={() => setMode(mode === "marker" ? "none" : "marker")}>نقطة ✦</button>
              <button className={clsx("btn text-xs", mode === "path" && "border-white/35 bg-white/10")} onClick={() => setMode(mode === "path" ? "none" : "path")}>مسار ➝</button>
              <button className="btn text-xs" onClick={() => { setUserMarkers([]); setPath([]); }}>مسح</button>
              <span className="badge">Esc</span>
            </div>

            <AnimatePresence>
              {mode !== "none" ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-3 text-sm text-white/85">
                  اضغط على الخريطة لإضافة {mode === "marker" ? "نقطة" : "نقاط للمسار"}.
                  {mode === "path" && path.length >= 2 ? (
                    <div className="mt-2">المسافة: <span className="font-extrabold">{distanceKm.toFixed(2)}</span> كم</div>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-xs text-white/70">
              تلميح: فعّل/اقفل الفلاتر من اليمين علشان المعالم تبقى أوضح.
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {layers.showCoords && cursor ? (
        <div className="absolute right-4 bottom-4 map-panel rounded-3xl px-3 py-2 shadow-soft text-xs z-[900]">
          <span className="panel-title">إحداثيات المؤشر</span>
          <div className="font-extrabold mt-1">{cursor.lat.toFixed(4)}, {cursor.lng.toFixed(4)}</div>
        </div>
      ) : null}

      {/* KIDS OVERLAY ELEMENTS */}
      {baseMap === "kids" && (
        <div className="absolute inset-0 pointer-events-none z-[800] overflow-hidden rounded-[34px]">
          <motion.div
            animate={{ x: [0, 40, 0], y: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-1/4 text-4xl opacity-60"
          >
            ☁️
          </motion.div>
          <motion.div
            animate={{ x: [0, -60, 0], y: [0, 15, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-24 right-1/3 text-3xl opacity-50"
          >
            ☁️
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-6 right-8 text-5xl filter drop-shadow-lg"
          >
            ☀️
          </motion.div>
          <div className="absolute bottom-10 left-10 text-6xl opacity-20 rotate-12 grayscale">
            ⛵
          </div>
        </div>
      )}
    </div>
  );
}
