export type GisServiceKind = "arcgis" | "arcgis-root" | "wms";

export type ArcgisServiceType = "FeatureServer" | "MapServer";

export type GisServiceBase = {
  id: string;
  label: string;
  url: string;
  kind: GisServiceKind;
  description?: string;
  source?: string;
  enabledByDefault?: boolean;
  defaultOpacity?: number; // 0..1
};

export type ArcgisServiceDef = GisServiceBase & {
  kind: "arcgis";
  serviceType: ArcgisServiceType;
  defaultLayerIds?: number[];
  defaultWhereByLayerId?: Record<number, string>;
  minZoom?: number;
};

export type ArcgisRootServiceDef = GisServiceBase & {
  kind: "arcgis-root";
};

export type WmsServiceDef = GisServiceBase & {
  kind: "wms";
  defaultLayers?: string[];
  version?: "1.1.1" | "1.3.0";
  transparent?: boolean;
  format?: string;
  minZoom?: number;
};

export type GisServiceDef = ArcgisServiceDef | ArcgisRootServiceDef | WmsServiceDef;

export type GisServiceState = {
  enabled: boolean;
  opacity: number; // 0..1
  selectedArcgisLayerIds: number[];
  selectedWmsLayers: string[];
  whereByArcgisLayerId: Record<number, string>;
};

export type GisState = {
  byServiceId: Record<string, GisServiceState>;
  customServices: GisServiceDef[];
};

export type GisLayerKey = string; // `${serviceId}:${layerIdOrName}`

export type GisLayerLoadStatus = "idle" | "loading" | "ok" | "error";

export type GisLayerStats = {
  status: GisLayerLoadStatus;
  featureCount?: number;
  error?: string;
  updatedAt?: number;
};

export type GisStatsMap = Record<GisLayerKey, GisLayerStats>;
