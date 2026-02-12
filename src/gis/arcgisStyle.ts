import type { PathOptions, CircleMarkerOptions } from "leaflet";
import type { ArcgisLayerInfo } from "./arcgis";

function rgbaFromEsriColor(c: any): string | null {
  if (!Array.isArray(c) || c.length < 3) return null;
  const [r, g, b, a = 255] = c;
  const alpha = Math.max(0, Math.min(1, a / 255));
  return `rgba(${r},${g},${b},${alpha})`;
}

function safeNum(v: any, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function styleFromArcgisLayerInfo(layerInfo: ArcgisLayerInfo): {
  path: PathOptions;
  point: CircleMarkerOptions;
} {
  const fallbackPath: PathOptions = { color: "#60a5fa", weight: 2, opacity: 0.85, fillColor: "#38bdf8", fillOpacity: 0.18 };
  const fallbackPoint: CircleMarkerOptions = { radius: 6, color: "#0ea5e9", weight: 2, opacity: 0.9, fillColor: "#38bdf8", fillOpacity: 0.35 };

  const sym = layerInfo?.drawingInfo?.renderer?.symbol;
  if (!sym) return { path: fallbackPath, point: fallbackPoint };

  const outline = sym.outline ?? {};
  const outlineColor = rgbaFromEsriColor(outline.color) ?? "#94a3b8";
  const outlineWidth = safeNum(outline.width, 1.2);
  const fillColor = rgbaFromEsriColor(sym.color) ?? "rgba(56,189,248,0.25)";

  const path: PathOptions = {
    color: outlineColor,
    weight: Math.max(0.5, outlineWidth),
    opacity: 0.9,
    fillColor,
    fillOpacity: 0.22,
  };

  const point: CircleMarkerOptions = {
    radius: 6,
    color: outlineColor,
    weight: Math.max(1, outlineWidth),
    opacity: 0.95,
    fillColor,
    fillOpacity: 0.38,
  };

  return { path, point };
}

