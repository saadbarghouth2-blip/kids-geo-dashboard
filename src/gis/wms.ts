export type WmsLayerInfo = { name: string; title?: string };

async function fetchText(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return await res.text();
}

export function wmsGetCapabilitiesUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.searchParams.set("service", "WMS");
  url.searchParams.set("request", "GetCapabilities");
  return url.toString();
}

export async function fetchWmsLayers(baseUrl: string, signal?: AbortSignal): Promise<WmsLayerInfo[]> {
  const xmlText = await fetchText(wmsGetCapabilitiesUrl(baseUrl), signal);
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");

  const parseErr = doc.getElementsByTagName("parsererror")[0];
  if (parseErr) throw new Error("Invalid WMS GetCapabilities XML");

  const layers: WmsLayerInfo[] = [];
  const layerNodes = Array.from(doc.getElementsByTagName("Layer"));
  for (const n of layerNodes) {
    const name = n.getElementsByTagName("Name")[0]?.textContent?.trim();
    if (!name) continue;
    const title = n.getElementsByTagName("Title")[0]?.textContent?.trim() ?? undefined;
    layers.push({ name, title });
  }

  // Many capabilities docs repeat nested layers; dedupe by name.
  const seen = new Set<string>();
  const out: WmsLayerInfo[] = [];
  for (const l of layers) {
    if (seen.has(l.name)) continue;
    seen.add(l.name);
    out.push(l);
  }
  return out;
}

