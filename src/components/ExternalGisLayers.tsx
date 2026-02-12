import { useEffect, useMemo, useRef, useState } from "react";
import { GeoJSON, Pane, WMSTileLayer, useMapEvents } from "react-leaflet";
import L, { type LatLngBounds, type Layer } from "leaflet";
import type { FeatureCollection, GeoJsonObject } from "geojson";

import { BUILTIN_GIS_SERVICES } from "../gis/catalog";
import type { GisLayerKey, GisLayerStats, GisServiceDef, GisState } from "../gis/types";
import { arcgisLayerUrl, getArcgisLayerInfo, queryArcgisLayerGeoJSON } from "../gis/arcgis";
import type { ArcgisLayerInfo } from "../gis/arcgis";
import { styleFromArcgisLayerInfo } from "../gis/arcgisStyle";

type Viewport = { bbox4326: { xmin: number; ymin: number; xmax: number; ymax: number }; zoom: number };

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function bboxFromBounds(bounds: LatLngBounds) {
  return {
    xmin: clamp(bounds.getWest(), -180, 180),
    ymin: clamp(bounds.getSouth(), -90, 90),
    xmax: clamp(bounds.getEast(), -180, 180),
    ymax: clamp(bounds.getNorth(), -90, 90),
  };
}

function bboxKey(b: Viewport["bbox4326"], zoom: number) {
  const d = zoom < 7 ? 1 : zoom < 10 ? 2 : 3;
  const r = (x: number) => Number(x.toFixed(d));
  return `${zoom}:${r(b.xmin)},${r(b.ymin)},${r(b.xmax)},${r(b.ymax)}`;
}

function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function featurePopupHtml(feature: any, layerInfo: ArcgisLayerInfo | null) {
  const props = feature?.properties ?? {};
  const keys = Object.keys(props).filter((k) => props[k] != null);
  const display = layerInfo?.displayField && props[layerInfo.displayField] != null ? String(props[layerInfo.displayField]) : null;
  const title = display ?? (keys[0] ? String(props[keys[0]]) : "Feature");

  const rows = keys.slice(0, 12).map((k) => {
    const v = props[k];
    const val = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `<tr><td style="opacity:0.75;padding:4px 8px;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:4px 8px">${escapeHtml(val)}</td></tr>`;
  });

  return `
    <div style="min-width:220px">
      <div style="font-weight:900;margin:2px 0 8px">${escapeHtml(title)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">${rows.join("")}</table>
    </div>
  `;
}

function applyOpacityToPath(opts: any, opacity: number) {
  const baseOpacity = typeof opts.opacity === "number" ? opts.opacity : 1;
  const baseFill = typeof opts.fillOpacity === "number" ? opts.fillOpacity : 0.2;
  return {
    ...opts,
    opacity: baseOpacity * opacity,
    fillOpacity: baseFill * opacity,
  };
}

function applyOpacityToPoint(opts: any, opacity: number) {
  const baseOpacity = typeof opts.opacity === "number" ? opts.opacity : 1;
  const baseFill = typeof opts.fillOpacity === "number" ? opts.fillOpacity : 0.35;
  return {
    ...opts,
    opacity: baseOpacity * opacity,
    fillOpacity: baseFill * opacity,
  };
}

function ArcgisGeoJsonLayer(props: {
  layerKey: GisLayerKey;
  layerUrl: string;
  enabled: boolean;
  opacity: number;
  minZoom: number;
  where?: string;
  viewport: Viewport;
  onStats?: (layerKey: GisLayerKey, next: GisLayerStats) => void;
}) {
  const { layerKey, layerUrl, enabled, opacity, minZoom, where, viewport, onStats } = props;
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [layerInfo, setLayerInfo] = useState<ArcgisLayerInfo | null>(null);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;
    const ac = new AbortController();
    getArcgisLayerInfo(layerUrl, ac.signal)
      .then((info) => setLayerInfo(info))
      .catch(() => {
        // ignore; style fallback
      });
    return () => ac.abort();
  }, [enabled, layerUrl]);

  useEffect(() => {
    if (!enabled) {
      setGeo(null);
      onStats?.(layerKey, { status: "idle", updatedAt: Date.now() });
      return;
    }
    if (viewport.zoom < minZoom) {
      setGeo(null);
      onStats?.(layerKey, { status: "idle", updatedAt: Date.now() });
      return;
    }

    const key = `${bboxKey(viewport.bbox4326, viewport.zoom)}|${where ?? "1=1"}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        onStats?.(layerKey, { status: "loading", updatedAt: Date.now() });
        const fc = await queryArcgisLayerGeoJSON({
          layerUrl,
          bbox4326: viewport.bbox4326,
          zoom: viewport.zoom,
          where,
          layerInfo: layerInfo ?? undefined,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setGeo(fc);
        onStats?.(layerKey, { status: "ok", featureCount: fc.features.length, updatedAt: Date.now() });
      } catch (e: any) {
        if (ac.signal.aborted) return;
        setGeo(null);
        onStats?.(layerKey, { status: "error", error: e?.message ? String(e.message) : "Failed", updatedAt: Date.now() });
      }
    }, 250);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [enabled, layerKey, layerUrl, minZoom, onStats, viewport, where]);

  const styles = useMemo(() => styleFromArcgisLayerInfo(layerInfo ?? {}), [layerInfo]);
  const pathStyle = useMemo(() => applyOpacityToPath(styles.path, opacity), [opacity, styles.path]);
  const pointStyle = useMemo(() => applyOpacityToPoint(styles.point, opacity), [opacity, styles.point]);

  const onEachFeature = useMemo(() => {
    return (feature: any, layer: Layer) => {
      layer.bindPopup(featurePopupHtml(feature, layerInfo));
    };
  }, [layerInfo]);

  const pointToLayer = useMemo(() => {
    return (_f: any, latlng: any) => L.circleMarker(latlng, pointStyle);
  }, [pointStyle]);

  if (!geo) return null;

  return (
    <GeoJSON
      data={geo as unknown as GeoJsonObject}
      style={() => pathStyle as any}
      pointToLayer={pointToLayer as any}
      onEachFeature={onEachFeature as any}
    />
  );
}

export default function ExternalGisLayers(props: {
  gis: GisState;
  services?: GisServiceDef[];
  onGisStats?: (layerKey: GisLayerKey, next: GisLayerStats) => void;
}) {
  const { gis, onGisStats } = props;
  const services = useMemo(() => props.services ?? [...BUILTIN_GIS_SERVICES, ...gis.customServices], [gis.customServices, props.services]);
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useMapEvents({
    load(e) {
      const map = e.target;
      setViewport({ bbox4326: bboxFromBounds(map.getBounds()), zoom: map.getZoom() });
    },
    moveend(e) {
      const map = e.target;
      setViewport({ bbox4326: bboxFromBounds(map.getBounds()), zoom: map.getZoom() });
    },
    zoomend(e) {
      const map = e.target;
      setViewport({ bbox4326: bboxFromBounds(map.getBounds()), zoom: map.getZoom() });
    },
  });

  const arcgisLayers = useMemo(() => {
    const out: { layerKey: GisLayerKey; layerUrl: string; opacity: number; minZoom: number; where?: string }[] = [];
    for (const s of services) {
      if (s.kind !== "arcgis") continue;
      const st = gis.byServiceId[s.id];
      if (!st?.enabled) continue;
      const minZoom = s.minZoom ?? 0;
      for (const layerId of st.selectedArcgisLayerIds) {
        out.push({
          layerKey: `${s.id}:${layerId}`,
          layerUrl: arcgisLayerUrl(s.url, layerId),
          opacity: clamp(st.opacity, 0, 1),
          minZoom,
          where: st.whereByArcgisLayerId[layerId],
        });
      }
    }
    return out;
  }, [gis.byServiceId, services]);

  const wmsLayers = useMemo(() => {
    const out: { layerKey: GisLayerKey; url: string; layers: string; opacity: number; minZoom: number; version: string; transparent: boolean; format: string }[] = [];
    for (const s of services) {
      if (s.kind !== "wms") continue;
      const st = gis.byServiceId[s.id];
      if (!st?.enabled) continue;
      const minZoom = s.minZoom ?? 0;
      for (const l of st.selectedWmsLayers) {
        out.push({
          layerKey: `${s.id}:${l}`,
          url: s.url,
          layers: l,
          opacity: clamp(st.opacity, 0, 1),
          minZoom,
          version: s.version ?? "1.3.0",
          transparent: s.transparent ?? true,
          format: s.format ?? "image/png",
        });
      }
    }
    return out;
  }, [gis.byServiceId, services]);

  if (!viewport) return null;

  return (
    <Pane name="gis" style={{ zIndex: 380 }}>
      {wmsLayers
        .filter((l) => viewport.zoom >= l.minZoom)
        .map((l) => (
          <WMSTileLayer
            key={l.layerKey}
            url={l.url}
            layers={l.layers}
            version={l.version as any}
            transparent={l.transparent}
            format={l.format}
            opacity={l.opacity}
          />
        ))}

      {arcgisLayers.map((l) => (
        <ArcgisGeoJsonLayer
          key={l.layerKey}
          layerKey={l.layerKey}
          layerUrl={l.layerUrl}
          enabled={true}
          opacity={l.opacity}
          minZoom={l.minZoom}
          where={l.where}
          viewport={viewport}
          onStats={onGisStats}
        />
      ))}
    </Pane>
  );
}
