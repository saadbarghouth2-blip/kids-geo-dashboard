import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import type { Lesson, Place, PlaceCategory } from "../types";

type Point = { t: number; visible: number; highlights: number };

type CategoryRow = {
  key: PlaceCategory;
  name: string;
  rawName: PlaceCategory;
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
  background: "rgba(10,10,14,0.92)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 12,
};

const tooltipItemStyle = { color: "white" } as const;

const radiusFromImportance = (importance: number) => 12000 + importance * 260;

function fmtTime(t: number) {
  const d = new Date(t);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderPieLabel(props: any) {
  const { x, y, percent } = props;
  if (percent < 0.08) return null;
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.9)" fontSize={10} textAnchor="middle" dominantBaseline="middle">
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function InsightsPanel(props: {
  lesson: Lesson;
  places: Place[];
  timeline: Point[];
  filtersActive: boolean;
}) {
  const { lesson, places, timeline, filtersActive } = props;

  const byCat = useMemo<CategoryRow[]>(() => {
    const m = new Map<PlaceCategory, number>();
    for (const p of places) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    const total = places.length;
    const rows = Array.from(m.entries())
      .map(([k, v]) => ({
        key: k,
        name: categoryMeta[k]?.label ?? k,
        rawName: k,
        value: v,
        pct: total ? Math.round((v / total) * 100) : 0,
        color: categoryMeta[k]?.color ?? "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
    return rows;
  }, [places]);

  const topCats = useMemo(() => byCat.slice(0, 6), [byCat]);
  const pieData = useMemo(() => byCat.slice(0, 8), [byCat]);

  const lineData = useMemo(() => {
    return (timeline ?? []).map((p) => ({
      time: fmtTime(p.t),
      visible: p.visible,
      highlights: p.highlights,
    }));
  }, [timeline]);

  const metrics = useMemo(() => {
    const rows = places.map((p) => ({
      id: p.id,
      title: p.title,
      importance: p.metrics?.importance,
    }));
    const importanceValues = rows.map((r) => r.importance).filter((v): v is number => typeof v === "number");
    const avgImportance = importanceValues.length
      ? Math.round(importanceValues.reduce((acc, v) => acc + v, 0) / importanceValues.length)
      : 0;
    const topImportance = [...rows]
      .filter((r) => typeof r.importance === "number")
      .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
      .slice(0, 3);
    return { avgImportance, topImportance };
  }, [places]);

  const impact = useMemo(() => {
    const areas = places.map((p) => {
      const importance = p.metrics?.importance ?? 55;
      const r = radiusFromImportance(importance);
      return Math.PI * r * r;
    });
    const totalAreaKm2 = Math.round(areas.reduce((acc, v) => acc + v, 0) / 1_000_000);
    const avgAreaKm2 = areas.length ? Math.round(totalAreaKm2 / areas.length) : 0;
    const highlightCount = places.filter((p) => (p.metrics?.importance ?? 0) >= 80).length;
    return { totalAreaKm2, avgAreaKm2, highlightCount };
  }, [places]);

  const topCategory = topCats[0];
  const totalAll = lesson.places.length;
  const hiddenCount = Math.max(0, totalAll - places.length);

  const facts = useMemo(() => {
    const base = [
      {
        k: filtersActive ? "المعالم المعروضة" : "إجمالي المعالم",
        value: `${places.length}`,
        hint: filtersActive ? `مخفي ${hiddenCount}` : "عدد النقاط على الخريطة",
      },
      { k: "فئات نشطة", value: `${byCat.length}`, hint: "أنواع ظاهرة حالياً" },
      { k: "مساحة تأثير", value: `${impact.totalAreaKm2} كم²`, hint: "مبنية على دوائر التأثير" },
      { k: "نسبة أكبر فئة", value: topCategory ? `${topCategory.pct}%` : "—", hint: topCategory?.name },
    ];

    const skipTokens = ["{progress}", "{badges}", "{xp}", "{discovered}"];
    const lessonFacts = (lesson.facts ?? [])
      .filter((f) => !skipTokens.some((t) => f.v.includes(t)))
      .map((f) => {
        const value = f.v
          .replace("{places}", `${places.length}`)
          .replace("{area}", `${impact.totalAreaKm2}`)
          .replace("{highlights}", `${impact.highlightCount}`)
          .replace("{avgArea}", `${impact.avgAreaKm2}`);
        return { ...f, value };
      });

    const seen = new Set<string>();
    const merged = [] as { k: string; value: string; hint?: string }[];
    for (const f of [...base, ...lessonFacts]) {
      if (seen.has(f.k)) continue;
      seen.add(f.k);
      merged.push(f);
    }
    return merged;
  }, [lesson.facts, places.length, filtersActive, byCat.length, hiddenCount, impact.totalAreaKm2, impact.highlightCount, impact.avgAreaKm2, topCategory?.name, topCategory?.pct]);

  return (
    <div className="glass rounded-3xl p-3 shadow-soft overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="panel-title">مؤشرات &amp; رسومات</div>
        <div className="text-xs text-white/70">{filtersActive ? "حسب الفلاتر • تحديث تلقائي" : "تحديث تلقائي"}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="text-xs text-white/70">المعالم المعروضة</div>
          <div className="text-xl font-extrabold mt-1">{places.length}</div>
          <div className="text-[11px] text-white/60">
            {filtersActive ? `مخفي ${hiddenCount}` : `إجمالي ${totalAll}`}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="text-xs text-white/70">الفئات النشطة</div>
          <div className="text-xl font-extrabold mt-1">{byCat.length}</div>
          <div className="text-[11px] text-white/60">أنواع ظاهرة على الخريطة</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="text-xs text-white/70">متوسط الأهمية</div>
          <div className="text-xl font-extrabold mt-1">{metrics.avgImportance}</div>
          <div className="text-[11px] text-white/60">من 100</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="text-xs text-white/70">مساحة التأثير</div>
          <div className="text-xl font-extrabold mt-1">{impact.totalAreaKm2}</div>
          <div className="text-[11px] text-white/60">كم² تقديري</div>
        </div>
      </div>

      {facts.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {facts.map((f) => (
            <div key={f.k} className="rounded-2xl border border-white/10 bg-black/20 p-2">
              <div className="text-xs text-white/70">{f.k}</div>
              <div className="text-base font-extrabold mt-1">{f.value}</div>
              {f.hint ? <div className="text-[11px] text-white/60 mt-1">{f.hint}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-bold text-white/80 mb-1">توزيع المعالم (Pie)</div>
          <div className="h-[170px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={35}
                  outerRadius={62}
                  paddingAngle={2}
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip
                  formatter={(value, _, entry: any) => [`${value} (${entry.payload.pct}%)`, entry.payload.name]}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 text-[11px] text-white/60">نصيحة: غيّر الفلاتر وشوف الرسم يتغير.</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-bold text-white/80 mb-1">أكثر 6 فئات (Bar)</div>
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
          <div className="mt-1 text-[11px] text-white/60">كل عمود = عدد المعالم + نسبتها من الإجمالي.</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-bold text-white/80 mb-2">أعلى معالم في الأهمية</div>
          {metrics.topImportance.length ? (
            <div className="space-y-2">
              {metrics.topImportance.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{p.title}</span>
                  <span className="badge">{p.importance}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/60">لا توجد بيانات كفاية</div>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
          <div className="text-xs font-bold text-white/80 mb-2">أكثر فئات ظهوراً</div>
          {topCats.length ? (
            <div className="space-y-2">
              {topCats.slice(0, 3).map((c) => (
                <div key={c.key} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.name}</span>
                  <span className="badge">{c.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-white/60">لا توجد بيانات كفاية</div>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-2">
        <div className="text-xs font-bold text-white/80 mb-1">سجل التغير (Serial / Line)</div>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="time" hide />
              <YAxis allowDecimals={false} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
              <Line type="monotone" dataKey="visible" name="معالم ظاهرة" dot={false} strokeWidth={2} stroke="#38bdf8" />
              <Line type="monotone" dataKey="highlights" name="مزارات مميزة" dot={false} strokeWidth={2} stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 text-[11px] text-white/60">عدد المعالم الظاهرة + المزارات المميزة مع الفلاتر.</div>
      </div>
    </div>
  );
}
