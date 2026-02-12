import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import type { GisServiceDef, GisState, GisStatsMap } from "../gis/types";
import { getArcgisServiceInfo } from "../gis/arcgis";
import { fetchWmsLayers } from "../gis/wms";
import { KIDS_GIS_PRESETS, type KidsGisPreset } from "../gis/kidsPresets";

function clamp01(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function applyPreset(gis: GisState, preset: KidsGisPreset, enabled: boolean): GisState {
  const next: GisState = { ...gis, byServiceId: { ...gis.byServiceId } };

  for (const item of preset.items) {
    const st = next.byServiceId[item.serviceId];
    if (!st) continue;

    const baseOpacity = typeof preset.defaultOpacity === "number" ? clamp01(preset.defaultOpacity) : st.opacity;

    if (item.kind === "arcgis") {
      const before = st.selectedArcgisLayerIds;
      const after = enabled
        ? Array.from(new Set([...before, ...item.layerIds])).sort((a, b) => a - b)
        : before.filter((id) => !item.layerIds.includes(id));

      const shouldEnable = enabled ? true : after.length > 0 || st.selectedWmsLayers.length > 0;
      next.byServiceId[item.serviceId] = {
        ...st,
        enabled: shouldEnable,
        opacity: enabled ? baseOpacity : st.opacity,
        selectedArcgisLayerIds: after,
      };
    } else if (item.kind === "wms") {
      const before = st.selectedWmsLayers;
      const after = enabled
        ? Array.from(new Set([...before, ...item.layers]))
        : before.filter((name) => !item.layers.includes(name));

      const shouldEnable = enabled ? true : st.selectedArcgisLayerIds.length > 0 || after.length > 0;
      next.byServiceId[item.serviceId] = {
        ...st,
        enabled: shouldEnable,
        opacity: enabled ? baseOpacity : st.opacity,
        selectedWmsLayers: after,
      };
    }
  }

  return next;
}

function presetEnabled(gis: GisState, preset: KidsGisPreset) {
  for (const item of preset.items) {
    const st = gis.byServiceId[item.serviceId];
    if (!st?.enabled) return false;
    if (item.kind === "arcgis") {
      if (!item.layerIds.some((id) => st.selectedArcgisLayerIds.includes(id))) return false;
    } else if (item.kind === "wms") {
      if (!item.layers.some((name) => st.selectedWmsLayers.includes(name))) return false;
    }
  }
  return true;
}

export default function GisServicesControls(props: {
  services: GisServiceDef[];
  gis: GisState;
  setGis: (next: GisState) => void;
  stats: GisStatsMap;
}) {
  const { services, gis, setGis, stats } = props;
  const [q, setQ] = useState("");
  const [kidsMode, setKidsMode] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [meta, setMeta] = useState<
    Record<
      string,
      | { status: "idle" | "loading" | "ok" | "error"; error?: string; arcgisLayers?: { id: number; name: string }[] }
      | { status: "idle" | "loading" | "ok" | "error"; error?: string; wmsLayers?: { name: string; title?: string }[] }
    >
  >({});

  useEffect(() => {
    const ids = Object.keys(open).filter((id) => open[id]);
    if (!ids.length) return;

    const ac = new AbortController();
    const run = async () => {
      for (const id of ids) {
        const s = services.find((x) => x.id === id);
        if (!s) continue;
        const m = meta[id];
        if (m?.status === "ok" || m?.status === "loading") continue;

        setMeta((prev) => ({ ...prev, [id]: { status: "loading" } as any }));
        try {
          if (s.kind === "arcgis") {
            const info = await getArcgisServiceInfo(s.url, ac.signal);
            const layers = (info.layers ?? []).map((l) => ({ id: l.id, name: l.name }));
            setMeta((prev) => ({ ...prev, [id]: { status: "ok", arcgisLayers: layers } }));
          } else if (s.kind === "wms") {
            const layers = await fetchWmsLayers(s.url, ac.signal);
            setMeta((prev) => ({ ...prev, [id]: { status: "ok", wmsLayers: layers } }));
          }
        } catch (e: any) {
          if (ac.signal.aborted) return;
          setMeta((prev) => ({ ...prev, [id]: { status: "error", error: e?.message ? String(e.message) : "Failed" } as any }));
        }
      }
    };
    run();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, services]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return services;
    return services.filter((s) => {
      const hay = `${s.label} ${s.description ?? ""} ${s.url}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q, services]);

  const setService = (serviceId: string, patch: Partial<GisState["byServiceId"][string]>) => {
    const prev = gis.byServiceId[serviceId];
    if (!prev) return;
    setGis({
      ...gis,
      byServiceId: {
        ...gis.byServiceId,
        [serviceId]: { ...prev, ...patch },
      },
    });
  };

  const toggleArcgisLayer = (serviceId: string, layerId: number) => {
    const st = gis.byServiceId[serviceId];
    if (!st) return;
    const has = st.selectedArcgisLayerIds.includes(layerId);
    const next = has ? st.selectedArcgisLayerIds.filter((x) => x !== layerId) : [...st.selectedArcgisLayerIds, layerId].sort((a, b) => a - b);
    setService(serviceId, { selectedArcgisLayerIds: next });
  };

  const toggleWmsLayer = (serviceId: string, layerName: string) => {
    const st = gis.byServiceId[serviceId];
    if (!st) return;
    const has = st.selectedWmsLayers.includes(layerName);
    const next = has ? st.selectedWmsLayers.filter((x) => x !== layerName) : [...st.selectedWmsLayers, layerName];
    setService(serviceId, { selectedWmsLayers: next });
  };

  return (
    <div className="glass rounded-3xl p-3 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="panel-title">طبقات GIS</div>
        <span className="badge" title="خدمات خارجية (ArcGIS / WMS)">خارجي</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button className={clsx("btn text-xs", kidsMode && "border-white/35 bg-white/10")} onClick={() => setKidsMode(true)}>
          وضع الطفل
        </button>
        <button className={clsx("btn text-xs", !kidsMode && "border-white/35 bg-white/10")} onClick={() => setKidsMode(false)}>
          للكبار
        </button>
      </div>

      {kidsMode ? (
        <div className="mt-3">
          <div className="text-xs text-white/70">طبقات كنوز مصر شغّالة تلقائيًا على الخريطة — قرّب (Zoom) علشان التفاصيل تظهر.</div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {KIDS_GIS_PRESETS.map((p) => {
              const on = presetEnabled(gis, p);
              return (
                <div
                  key={p.id}
                  className={clsx(
                    "rounded-3xl border border-white/15 bg-white/5 text-sm flex items-center justify-between gap-3 h-auto py-3 px-4",
                    on && "border-white/35 bg-white/10"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-right">
                      <span className="block font-extrabold">{p.label}</span>
                      {p.description ? <span className="block text-[11px] text-white/70 mt-0.5">{p.description}</span> : null}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {typeof p.minZoomHint === "number" ? <span className="badge">Zoom {p.minZoomHint}+</span> : null}
                    <span className="badge">{on ? "شغال" : "مغلق"}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/65">
            لو مفيش حاجة باينة: جرّب تكبير الخريطة أو حرّكها شوية.
          </div>
        </div>
      ) : (
        <>
          <div className="mt-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} className="input w-full" placeholder="ابحث عن طبقة/خدمة..." />
          </div>

          <div className="mt-2 space-y-2 max-h-[320px] overflow-auto pr-1">
            {filtered.map((s) => {
              const st = gis.byServiceId[s.id];
              if (!st) return null;

              const selectedCount =
                s.kind === "arcgis"
                  ? st.selectedArcgisLayerIds.length
                  : s.kind === "wms"
                    ? st.selectedWmsLayers.length
                    : 0;

              const serviceStats = Object.entries(stats).filter(([k]) => k.startsWith(`${s.id}:`));
              const okCount = serviceStats.filter(([, v]) => v.status === "ok").length;
              const errCount = serviceStats.filter(([, v]) => v.status === "error").length;
              const loadCount = serviceStats.filter(([, v]) => v.status === "loading").length;
              const isOpen = !!open[s.id];
              const m: any = meta[s.id];

              return (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      className="btn text-xs px-2 py-1 h-auto self-start"
                      title={isOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                      onClick={() => setOpen((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                    >
                      {isOpen ? "−" : "+"}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold truncate" title={s.label}>{s.label}</div>
                      {s.description ? <div className="text-[11px] text-white/70 mt-0.5">{s.description}</div> : null}
                      <div className="text-[10px] text-white/50 mt-1 break-all">{s.url}</div>
                    </div>
                    <button
                      className={clsx("btn text-xs whitespace-nowrap", st.enabled && "border-white/35 bg-white/10")}
                      onClick={() => setService(s.id, { enabled: !st.enabled })}
                    >
                      {st.enabled ? "مفعّل" : "مغلق"}
                    </button>
                  </div>

                  {s.kind !== "arcgis-root" ? (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-white/70">
                        طبقات مختارة: <span className="font-extrabold text-white/90">{selectedCount}</span>
                        {okCount || errCount || loadCount ? (
                          <span className="text-white/50"> • ok {okCount} • loading {loadCount} • err {errCount}</span>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white/60">شفافية</span>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={st.opacity}
                          onChange={(e) => setService(s.id, { opacity: clamp01(Number(e.target.value)) })}
                          className="w-[90px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-white/70">
                      دي مكتبة خدمات (Root). لإضافة طبقة منها: انسخ رابط Service (MapServer/FeatureServer) واضيفه من خانة الإضافة.
                    </div>
                  )}

              {isOpen && s.kind === "arcgis" ? (
                <div className="mt-2 rounded-2xl border border-white/10 bg-black/15 p-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white/80">Sublayers</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn text-[11px]"
                        onClick={() => {
                          const layers = (m?.arcgisLayers ?? []).map((x: any) => x.id);
                          setService(s.id, { selectedArcgisLayerIds: layers });
                        }}
                      >
                        اختر الكل
                      </button>
                      <button className="btn text-[11px]" onClick={() => setService(s.id, { selectedArcgisLayerIds: [] })}>
                        مسح
                      </button>
                    </div>
                  </div>

                  {m?.status === "loading" ? <div className="mt-2 text-xs text-white/70">جارٍ تحميل الطبقات…</div> : null}
                  {m?.status === "error" ? <div className="mt-2 text-xs text-rose-200">خطأ: {m.error}</div> : null}

                  {m?.status === "ok" ? (
                    <div className="mt-2 grid gap-2">
                      {(m.arcgisLayers ?? []).map((l: any) => {
                        const checked = st.selectedArcgisLayerIds.includes(l.id);
                        const layerKey = `${s.id}:${l.id}`;
                        const stRow = stats[layerKey];
                        const status = stRow?.status ?? "idle";
                        const count = stRow?.featureCount;
                        return (
                          <div key={l.id} className="flex items-start justify-between gap-2">
                            <button
                              className={clsx("btn text-xs flex-1 text-right", checked && "border-white/35 bg-white/10")}
                              onClick={() => toggleArcgisLayer(s.id, l.id)}
                              title={l.name}
                            >
                              <span className="font-extrabold">#{l.id}</span> {l.name}
                            </button>
                            <span className="badge" title={stRow?.error ?? status}>
                              {status}{typeof count === "number" ? ` • ${count}` : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {st.selectedArcgisLayerIds.length ? (
                    <div className="mt-2 text-[11px] text-white/60">
                      فلتر متقدم (SQL) لكل Layer:
                      {st.selectedArcgisLayerIds.map((lid) => (
                        <div key={lid} className="mt-1">
                          <div className="text-[10px] text-white/55 mb-1">Layer #{lid} WHERE</div>
                          <input
                            className="input w-full text-[12px]"
                            value={st.whereByArcgisLayerId[lid] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setService(s.id, {
                                whereByArcgisLayerId: { ...st.whereByArcgisLayerId, [lid]: v },
                              });
                            }}
                            placeholder="مثال: gov_name = 'القاهرة' أو 1=1"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

                  {isOpen && s.kind === "wms" ? (
                    <div className="mt-2 rounded-2xl border border-white/10 bg-black/15 p-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white/80">WMS Layers</div>
                        <div className="flex items-center gap-2">
                          <button
                            className="btn text-[11px]"
                            onClick={() => {
                              const layers = (m?.wmsLayers ?? []).map((x: any) => x.name);
                              setService(s.id, { selectedWmsLayers: layers });
                            }}
                          >
                            اختر الكل
                          </button>
                          <button className="btn text-[11px]" onClick={() => setService(s.id, { selectedWmsLayers: [] })}>
                            مسح
                          </button>
                        </div>
                      </div>

                      {m?.status === "loading" ? <div className="mt-2 text-xs text-white/70">جارٍ قراءة GetCapabilities…</div> : null}
                      {m?.status === "error" ? <div className="mt-2 text-xs text-rose-200">خطأ: {m.error}</div> : null}

                      {m?.status === "ok" ? (
                        <div className="mt-2 grid gap-2">
                          {(m.wmsLayers ?? []).slice(0, 60).map((l: any) => {
                            const checked = st.selectedWmsLayers.includes(l.name);
                            return (
                              <button
                                key={l.name}
                                className={clsx("btn text-xs text-right", checked && "border-white/35 bg-white/10")}
                                onClick={() => toggleWmsLayer(s.id, l.name)}
                                title={l.title ?? l.name}
                              >
                                {l.name}
                                {l.title ? <span className="text-white/55"> • {l.title}</span> : null}
                              </button>
                            );
                          })}
                          {(m.wmsLayers ?? []).length > 60 ? (
                            <div className="text-[11px] text-white/60">عرضنا أول 60 Layer فقط. استخدم البحث فوق.</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {!filtered.length ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/75">مفيش نتائج.</div>
            ) : null}
          </div>

          <div className="mt-2 text-[11px] text-white/60">
            ملاحظة: التحميل الحقيقي وفلترة الطبقات بيتفعل من الخريطة حسب الزوم/المنطقة.
          </div>
        </>
      )}
    </div>
  );
}
