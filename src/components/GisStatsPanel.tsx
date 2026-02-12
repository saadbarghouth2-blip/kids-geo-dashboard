import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import type { GisServiceDef, GisStatsMap } from "../gis/types";

type Row = { key: string; label: string; value: number; color: string };

const palette = ["#38bdf8", "#22c55e", "#f59e0b", "#a78bfa", "#fb7185", "#14b8a6", "#f97316", "#60a5fa"];

const tooltipStyle = {
  background: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(255,255,255,0.24)",
  borderRadius: 12,
};

const tooltipItemStyle = { color: "white" } as const;

export default function GisStatsPanel(props: { services: GisServiceDef[]; stats: GisStatsMap }) {
  const { services, stats } = props;

  const svcLabel = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of services) m.set(s.id, s.label);
    return m;
  }, [services]);

  const summary = useMemo(() => {
    const entries = Object.entries(stats);
    const ok = entries.filter(([, v]) => v.status === "ok").length;
    const loading = entries.filter(([, v]) => v.status === "loading").length;
    const error = entries.filter(([, v]) => v.status === "error").length;
    return { ok, loading, error, total: entries.length };
  }, [stats]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    for (const [k, v] of Object.entries(stats)) {
      if (v.status !== "ok" || typeof v.featureCount !== "number") continue;
      const [serviceId, layerPart] = k.split(":");
      const label = `${svcLabel.get(serviceId) ?? serviceId} • ${layerPart ?? ""}`;
      const color = palette[out.length % palette.length];
      out.push({ key: k, label, value: v.featureCount, color });
    }
    return out.sort((a, b) => b.value - a.value).slice(0, 10);
  }, [stats, svcLabel]);

  return (
    <div className="map-panel rounded-3xl p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="panel-title">GIS إحصائيات</div>
        <div className="text-xs text-white/70">
          ok {summary.ok} • loading {summary.loading} • err {summary.error}
        </div>
      </div>

      {!rows.length ? (
        <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          حرّك الخريطة أو كبّر (Zoom) علشان يتم تحميل طبقات GIS وتظهر الإحصائيات.
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-bold text-white/80 mb-1">أكبر الطبقات (عدد العناصر داخل الشاشة)</div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} height={60} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} formatter={(value: any) => [value, "Features"]} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {rows.map((r) => (
                    <Cell key={r.key} fill={r.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 text-[11px] text-white/60">الأرقام بتتغير حسب حدود الشاشة وفلتر WHERE.</div>
        </div>
      )}
    </div>
  );
}

