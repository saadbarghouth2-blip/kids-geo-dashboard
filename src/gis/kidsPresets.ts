export type KidsGisPreset = {
  id: string;
  icon: string;
  label: string;
  description?: string;
  minZoomHint?: number;
  defaultOpacity?: number; // 0..1
  items: Array<
    | { kind: "arcgis"; serviceId: string; layerIds: number[] }
    | { kind: "wms"; serviceId: string; layers: string[] }
  >;
};

export const KIDS_GIS_PRESETS: KidsGisPreset[] = [
  {
    id: "water",
    icon: "💧",
    label: "المياه",
    description: "النيل + البحر + مياه",
    minZoomHint: 6,
    defaultOpacity: 0.6,
    items: [
      { kind: "arcgis", serviceId: "egypt_water_bodies", layerIds: [8, 9] },
      { kind: "arcgis", serviceId: "hydro_egypt", layerIds: [0] },
    ],
  },
  {
    id: "minerals",
    icon: "⛏️",
    label: "الثروة المعدنية",
    description: "مناطق/مواقع معادن في مصر",
    minZoomHint: 7,
    defaultOpacity: 0.65,
    items: [
      { kind: "arcgis", serviceId: "minerals_africa_egypt", layerIds: [0] },
      { kind: "arcgis", serviceId: "mrds_compact", layerIds: [0] },
    ],
  },
  {
    id: "geology",
    icon: "🪨",
    label: "الجيولوجيا",
    description: "أنواع الصخور وعلاقتها بالمعادن",
    minZoomHint: 7,
    defaultOpacity: 0.55,
    items: [{ kind: "arcgis", serviceId: "geology_nubian_project", layerIds: [26] }],
  },
  {
    id: "energy",
    icon: "⚡",
    label: "مصادر الطاقة",
    description: "محطات كهرباء + نوع الوقود",
    minZoomHint: 7,
    defaultOpacity: 0.6,
    items: [{ kind: "arcgis", serviceId: "world_power_plants_egypt", layerIds: [0] }],
  },
  {
    id: "roads",
    icon: "🚗",
    label: "الطرق",
    description: "طرق رئيسية داخل مصر",
    minZoomHint: 6,
    defaultOpacity: 0.65,
    items: [{ kind: "arcgis", serviceId: "egypt_resource_map", layerIds: [1] }],
  },
  {
    id: "cities",
    icon: "🏙️",
    label: "مناطق مأهولة",
    description: "أماكن/مناطق سكنية",
    minZoomHint: 7,
    defaultOpacity: 0.55,
    items: [{ kind: "arcgis", serviceId: "egypt_resource_map", layerIds: [3] }],
  },
  {
    id: "nature",
    icon: "🌿",
    label: "نباتات",
    description: "غابات/شجيرات",
    minZoomHint: 6,
    defaultOpacity: 0.55,
    items: [{ kind: "arcgis", serviceId: "egypt_scrub_forest", layerIds: [2] }],
  },
];
