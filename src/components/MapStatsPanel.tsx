import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import type { Place, PlaceCategory } from "../types";

type CategoryRow = {
  key: PlaceCategory;
  name: string;
  value: number;
  pct: number;
  color: string;
};

const categoryMeta: Record<PlaceCategory, { label: string; color: string }> = {
  fresh: { label: "عذبة", color: "#38bdf8" },
  salty: { label: "مالحة", color: "#0ea5e9" },
  mineral: { label: "معادن", color: "#f97316" },
  energy: { label: "طاقة", color: "#f59e0b" },
  renewable: { label: "متجددة", color: "#22c55e" },
  problem: { label: "مشكلات", color: "#ef4444" },
  project: { label: "مشروعات", color: "#facc15" },
  agri: { label: "زراعي", color: "#84cc16" },
  transport: { label: "نقل", color: "#14b8a6" },
  urban: { label: "عمران/مدن", color: "#94a3b8" },
  aquaculture: { label: "استزراع", color: "#06b6d4" },
  waterway: { label: "ممر مائي", color: "#0284c7" },
  mega: { label: "قومي", color: "#f97316" },
};

const tooltipStyle = {
  background: "rgba(15,23,42,0.95)",
  border: "1px solid rgba(255,255,255,0.24)",
  borderRadius: 12,
};

const tooltipItemStyle = { color: "white" } as const;

const radiusFromImportance = (importance: number) => 12000 + importance * 260;

export default function MapStatsPanel(props: { places: Place[]; filtersActive: boolean }) {
  const { places, filtersActive } = props;

  const byCat = useMemo<CategoryRow[]>(() => {
    const m = new Map<PlaceCategory, number>();
    for (const p of places) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    const total = places.length;
    return Array.from(m.entries())
      .map(([k, v]) => ({
        key: k,
        name: categoryMeta[k]?.label ?? k,
        value: v,
        pct: total ? Math.round((v / total) * 100) : 0,
        color: categoryMeta[k]?.color ?? "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [places]);

  const topCats = useMemo(() => byCat.slice(0, 6), [byCat]);

  const metrics = useMemo(() => {
    const importanceValues = places.map((p) => p.metrics?.importance).filter((v): v is number => typeof v === "number");
    const avgImportance = importanceValues.length
      ? Math.round(importanceValues.reduce((acc, v) => acc + v, 0) / importanceValues.length)
      : 0;
    const highlightCount = places.filter((p) => (p.metrics?.importance ?? 0) >= 80).length;
    return { avgImportance, highlightCount };
  }, [places]);

  const impact = useMemo(() => {
    const areas = places.map((p) => {
      const importance = p.metrics?.importance ?? 55;
      const r = radiusFromImportance(importance);
      return Math.PI * r * r;
    });
    const totalAreaKm2 = Math.round(areas.reduce((acc, v) => acc + v, 0) / 1_000_000);
    return { totalAreaKm2 };
  }, [places]);

  const importanceBands = useMemo(() => {
    let high = 0;
    let mid = 0;
    let low = 0;
    for (const p of places) {
      const imp = p.metrics?.importance;
      if (typeof imp !== "number") {
        low += 1;
      } else if (imp >= 80) {
        high += 1;
      } else if (imp >= 50) {
        mid += 1;
      } else {
        low += 1;
      }
    }
    return [
      { key: "high", label: "عالية", value: high, color: "#22c55e" },
      { key: "mid", label: "متوسطة", value: mid, color: "#f59e0b" },
      { key: "low", label: "منخفضة", value: low, color: "#94a3b8" },
    ].filter((b) => b.value > 0);
  }, [places]);

  return (
    <div className="map-panel rounded-3xl p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="panel-title">نبض الخريطة</div>
        <div className="text-xs text-white/70">{filtersActive ? "يتغير مع الفلاتر" : "كل المعالم"}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="text-xs text-white/75">المعالم المعروضة</div>
          <div className="text-xl font-extrabold mt-1">{places.length}</div>
          <div className="text-[11px] text-white/60">{filtersActive ? "بعد الفلاتر" : "إجمالي المعالم"}</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="text-xs text-white/75">الفئات النشطة</div>
          <div className="text-xl font-extrabold mt-1">{byCat.length}</div>
          <div className="text-[11px] text-white/60">أنواع معروضة على الخريطة</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="text-xs text-white/75">متوسط الأهمية</div>
          <div className="text-xl font-extrabold mt-1">{metrics.avgImportance}</div>
          <div className="text-[11px] text-white/60">من 100</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="text-xs text-white/75">مساحة التأثير</div>
          <div className="text-xl font-extrabold mt-1">{impact.totalAreaKm2}</div>
          <div className="text-[11px] text-white/60">كم² تقديري</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-bold text-white/80 mb-1">أكثر الفئات ظهورًا</div>
          <div className="h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCats}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <RTooltip
                  formatter={(value, _, entry: any) => [`${value} (${entry.payload.pct}%)`, entry.payload.name]}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {topCats.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 text-[11px] text-white/60">كل عمود = عدد المعالم المعروضة.</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-bold text-white/80 mb-1">مستويات الأهمية</div>
          <div className="h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={importanceBands} dataKey="value" nameKey="label" innerRadius={38} outerRadius={64} paddingAngle={2}>
                  {importanceBands.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 text-[11px] text-white/60">مميزة: {metrics.highlightCount} معلم.</div>
        </div>
      </div>
    </div>
  );
}
