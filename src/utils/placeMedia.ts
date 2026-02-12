import type { Place, PlaceCategory } from "../types";

export type ResolvedPlaceMedia = {
  images: string[];
  videos: string[];
  source?: string;
  attribution?: string;
};

const categoryEmoji: Record<PlaceCategory, string> = {
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

const categoryColor: Record<PlaceCategory, string> = {
  fresh: "#38bdf8",
  salty: "#0ea5e9",
  mineral: "#f59e0b",
  energy: "#f97316",
  renewable: "#22c55e",
  problem: "#ef4444",
  project: "#facc15",
  agri: "#84cc16",
  transport: "#14b8a6",
  urban: "#94a3b8",
  aquaculture: "#06b6d4",
  waterway: "#0284c7",
  mega: "#fb923c",
};

const categoryHint: Record<PlaceCategory, string> = {
  fresh: "fresh water",
  salty: "sea and lakes",
  mineral: "minerals and mines",
  energy: "energy resources",
  renewable: "renewable energy",
  problem: "environment issue",
  project: "national projects",
  agri: "agriculture",
  transport: "transport and trains",
  urban: "modern cities",
  aquaculture: "fish farming",
  waterway: "waterway",
  mega: "mega project",
};

const mediaCache = new Map<string, ResolvedPlaceMedia>();

const fallbackVideoPool = [
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-20s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-30s.mp4",
  "https://filesamples.com/samples/video/mp4/sample_640x360.mp4",
  "https://filesamples.com/samples/video/mp4/sample_960x400_ocean_with_audio.mp4",
  "https://filesamples.com/samples/video/mp4/sample_1280x720.mp4",
  "https://filesamples.com/samples/video/mp4/sample_1920x1080.mp4",
  "https://download.samplelib.com/mp4/sample-5s.mp4",
  "https://download.samplelib.com/mp4/sample-10s.mp4",
  "https://download.samplelib.com/mp4/sample-15s.mp4",
  "https://download.samplelib.com/mp4/sample-20s.mp4",
  "https://download.samplelib.com/mp4/sample-30s.mp4",
  "https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4",
  "https://archive.org/download/Sintel/sintel-2048-surround.mp4",
];

function uniq(items: Array<string | undefined | null>) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const value = (item ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cleanId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

function normalizeVideoUrl(value: string) {
  const url = value.trim();
  if (!url) return "";
  const watch = /youtube\.com\/watch\?v=([^&]+)/i.exec(url);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = /youtu\.be\/([^?&/]+)/i.exec(url);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

function idHash(value: string) {
  let h = 0;
  for (const c of value) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function withStartOffset(url: string, seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const sep = url.includes("#") ? "&" : "#";
  return `${url}${sep}t=${safe}`;
}

function fallbackVideosForPlace(place: Place) {
  const h = idHash(`${place.id}_${place.category}_${place.title}`);
  const len = fallbackVideoPool.length;
  const baseA = fallbackVideoPool[h % len];
  const baseB = fallbackVideoPool[(h + 7) % len];
  const baseC = fallbackVideoPool[(h + 13) % len];
  const offA = 1 + (h % 11);
  const offB = 2 + ((h >> 3) % 17);
  const offC = 3 + ((h >> 5) % 23);
  return uniq([
    withStartOffset(baseA, offA),
    withStartOffset(baseB, offB),
    withStartOffset(baseC, offC),
  ]);
}

function arcgisExport(place: Place, style: "street" | "imagery", zoomFactor = 1) {
  const importance = place.metrics?.importance ?? 65;
  const span = Math.max(0.35, (1.6 - (importance / 100) * 0.9) * zoomFactor);
  const latMin = (place.lat - span).toFixed(4);
  const latMax = (place.lat + span).toFixed(4);
  const lngSpan = span * 1.35;
  const lngMin = (place.lng - lngSpan).toFixed(4);
  const lngMax = (place.lng + lngSpan).toFixed(4);
  const service = style === "imagery" ? "World_Imagery" : "World_Street_Map";
  const marker = `${place.lng.toFixed(4)},${place.lat.toFixed(4)}`;
  return [
    `https://services.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/export`,
    `?bbox=${lngMin},${latMin},${lngMax},${latMax}`,
    "&bboxSR=4326&imageSR=4326",
    "&size=1280,720&dpi=96",
    "&format=jpg",
    "&transparent=false",
    "&f=image",
    `&marker=${encodeURIComponent(marker)}`,
  ].join("");
}

function posterImage(place: Place, variant: 0 | 1) {
  const accent = categoryColor[place.category] ?? "#38bdf8";
  const emoji = categoryEmoji[place.category] ?? "📍";
  const placeTitle = xmlEscape(place.title);
  const subtitle = variant === 0 ? "رحلة جغرافية ممتعة" : "اكتشف المكان خطوة خطوة";
  const dark = variant === 0 ? "#0f172a" : "#1e293b";
  const glowOpacity = variant === 0 ? "0.28" : "0.18";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${dark}" />
      <stop offset="100%" stop-color="${accent}" />
    </linearGradient>
    <radialGradient id="bubble" cx="20%" cy="10%" r="80%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${glowOpacity}" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)" />
  <circle cx="220" cy="120" r="160" fill="url(#bubble)" />
  <circle cx="1040" cy="560" r="220" fill="url(#bubble)" />
  <circle cx="980" cy="150" r="70" fill="#ffffff22" />
  <circle cx="320" cy="540" r="90" fill="#ffffff15" />
  <rect x="110" y="110" width="1060" height="500" rx="42" fill="#02061777" stroke="#ffffff44" />
  <text x="170" y="245" fill="#ffffff" font-size="74" font-family="Segoe UI, Tahoma, Arial, sans-serif">${emoji}</text>
  <text x="250" y="245" fill="#ffffff" font-size="56" font-weight="700" font-family="Segoe UI, Tahoma, Arial, sans-serif">${placeTitle}</text>
  <text x="170" y="315" fill="#dbeafe" font-size="34" font-family="Segoe UI, Tahoma, Arial, sans-serif">${xmlEscape(subtitle)}</text>
  <text x="170" y="390" fill="#bfdbfe" font-size="28" font-family="Segoe UI, Tahoma, Arial, sans-serif">Kids Geo Explorer</text>
  <text x="170" y="450" fill="#ffffffcc" font-size="28" font-family="Segoe UI, Tahoma, Arial, sans-serif">Lat ${place.lat.toFixed(3)}  Lng ${place.lng.toFixed(3)}</text>
  <rect x="170" y="500" width="360" height="14" rx="7" fill="#ffffff33" />
  <rect x="170" y="500" width="220" height="14" rx="7" fill="#ffffffbb" />
</svg>`.trim();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function youtubeSearchPage(place: Place) {
  const query = `${place.title} مصر ${categoryHint[place.category]} for kids`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function resolvePlaceMedia(place: Place): ResolvedPlaceMedia {
  const cacheKey = `${cleanId(place.id)}_${place.lat}_${place.lng}`;
  const cached = mediaCache.get(cacheKey);
  if (cached) return cached;

  const providedImages = uniq([place.media?.image, ...(place.media?.images ?? [])]);
  const providedVideos = uniq([place.media?.video, ...(place.media?.videos ?? [])]).map(normalizeVideoUrl).filter(Boolean);

  const generatedImages = uniq([
    arcgisExport(place, "street"),
    arcgisExport(place, "imagery"),
    posterImage(place, 0),
    posterImage(place, 1),
  ]);

  const images = uniq([...providedImages, ...generatedImages]);
  const fallbackVideos = fallbackVideosForPlace(place);
  const videos = uniq([...fallbackVideos, ...providedVideos]);

  const resolved: ResolvedPlaceMedia = {
    images,
    videos,
    source: place.media?.source ?? youtubeSearchPage(place),
    attribution: place.media?.attribution ?? "Esri Basemap + Sample videos",
  };

  mediaCache.set(cacheKey, resolved);
  return resolved;
}

export function placeMediaCover(place: Place) {
  const resolved = resolvePlaceMedia(place);
  return resolved.images[0] ?? posterImage(place, 0);
}
