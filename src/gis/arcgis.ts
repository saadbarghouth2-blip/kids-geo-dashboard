import type { FeatureCollection } from "geojson";

export type ArcgisServiceInfo = {
  currentVersion?: number;
  serviceDescription?: string;
  capabilities?: string;
  supportedQueryFormats?: string;
  layers?: { id: number; name: string }[];
  tables?: { id: number; name: string }[];
};

export type ArcgisLayerInfo = {
  id?: number;
  name?: string;
  type?: string;
  geometryType?: string;
  maxRecordCount?: number;
  supportedQueryFormats?: string;
  advancedQueryCapabilities?: { supportsPagination?: boolean };
  drawingInfo?: any;
  fields?: { name: string; type: string; alias?: string }[];
  displayField?: string;
};

async function fetchText(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return await res.text();
}

async function fetchArcgisJson<T>(baseUrl: string, signal?: AbortSignal): Promise<T> {
  const url = new URL(baseUrl);
  url.searchParams.set("f", "pjson");
  const text = await fetchText(url.toString(), signal);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse ArcGIS JSON from ${baseUrl}`);
  }
}

export function arcgisLayerUrl(serviceUrl: string, layerId: number) {
  return `${serviceUrl.replace(/\/+$/, "")}/${layerId}`;
}

export async function getArcgisServiceInfo(serviceUrl: string, signal?: AbortSignal) {
  return await fetchArcgisJson<ArcgisServiceInfo>(serviceUrl, signal);
}

export async function getArcgisLayerInfo(layerUrl: string, signal?: AbortSignal) {
  return await fetchArcgisJson<ArcgisLayerInfo>(layerUrl, signal);
}

function metersPerPixelAtLat(zoom: number, lat: number) {
  const cos = Math.cos((lat * Math.PI) / 180);
  return (156543.03392 * Math.max(0.2, cos)) / Math.pow(2, zoom);
}

export function maxAllowableOffsetDeg(zoom: number, lat: number) {
  const mpp = metersPerPixelAtLat(zoom, lat);
  const metersTol = mpp * 2.0;
  return metersTol / 111320;
}

export type ArcgisQueryOptions = {
  layerUrl: string;
  bbox4326: { xmin: number; ymin: number; xmax: number; ymax: number };
  where?: string;
  outFields?: string; // '*' or comma-list
  zoom?: number;
  maxPages?: number;
  layerInfo?: ArcgisLayerInfo;
  signal?: AbortSignal;
};

export async function queryArcgisLayerGeoJSON(opts: ArcgisQueryOptions): Promise<FeatureCollection> {
  const {
    layerUrl,
    bbox4326,
    where = "1=1",
    outFields = "*",
    zoom = 8,
    maxPages = 6,
    signal,
  } = opts;

  const layerInfo = opts.layerInfo ?? (await getArcgisLayerInfo(layerUrl, signal));
  const maxRecordCount = layerInfo.maxRecordCount ?? 1000;
  const supportsPagination = layerInfo.advancedQueryCapabilities?.supportsPagination ?? true;

  const bboxCenterLat = (bbox4326.ymin + bbox4326.ymax) / 2;
  const allowableOffset = maxAllowableOffsetDeg(zoom, bboxCenterLat);

  const features: any[] = [];
  let offset = 0;

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`${layerUrl.replace(/\/+$/, "")}/query`);
    const p = url.searchParams;
    p.set("f", "geojson");
    p.set("where", where);
    p.set("outFields", outFields);
    p.set("returnGeometry", "true");
    p.set("geometryType", "esriGeometryEnvelope");
    p.set("inSR", "4326");
    p.set("outSR", "4326");
    p.set("spatialRel", "esriSpatialRelIntersects");
    p.set("geometry", `${bbox4326.xmin},${bbox4326.ymin},${bbox4326.xmax},${bbox4326.ymax}`);
    p.set("resultRecordCount", String(maxRecordCount));
    if (supportsPagination) p.set("resultOffset", String(offset));
    p.set("maxAllowableOffset", String(allowableOffset));

    const text = await fetchText(url.toString(), signal);
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Failed to parse GeoJSON from ArcGIS query: ${layerUrl}`);
    }

    if (json?.error?.message) {
      throw new Error(json.error.message);
    }

    const pageFeatures = Array.isArray(json?.features) ? json.features : [];
    features.push(...pageFeatures);

    if (!supportsPagination) break;
    if (pageFeatures.length < maxRecordCount) break;
    offset += maxRecordCount;
  }

  return { type: "FeatureCollection", features } as FeatureCollection;
}
