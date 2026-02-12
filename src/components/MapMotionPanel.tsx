import { useMemo } from "react";
import type { Place, PlaceCategory } from "../types";

const labelByCat: Record<PlaceCategory, string> = {
  fresh: "عذبة",
  salty: "مالحة",
  mineral: "معادن",
  energy: "طاقة",
  renewable: "متجددة",
  problem: "مشكلات",
  project: "مشروعات",
  agri: "زراعي",
  transport: "نقل",
  urban: "عمران/مدن",
  aquaculture: "استزراع",
  waterway: "ممر مائي",
  mega: "قومي",
};

type Dot = { id: string; title: string; x: number; y: number; delay: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function MapMotionPanel(props: { places: Place[]; filtersActive: boolean }) {
  const { places, filtersActive } = props;

  const topCategory = useMemo(() => {
    const m = new Map<PlaceCategory, number>();
    for (const p of places) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    let best: { k: PlaceCategory; v: number } | null = null;
    for (const [k, v] of m.entries()) {
      if (!best || v > best.v) best = { k, v };
    }
    return best;
  }, [places]);

  const dots = useMemo<Dot[]>(() => {
    if (!places.length) return [];
    let minLat = places[0].lat;
    let maxLat = places[0].lat;
    let minLng = places[0].lng;
    let maxLng = places[0].lng;
    for (const p of places) {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
    }
    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;
    return places.slice(0, 14).map((p, i) => {
      const x = 8 + ((p.lng - minLng) / lngRange) * 84;
      const y = 8 + (1 - (p.lat - minLat) / latRange) * 84;
      return {
        id: p.id,
        title: p.title,
        x: clamp(x, 6, 94),
        y: clamp(y, 6, 94),
        delay: (i % 6) * 0.35,
      };
    });
  }, [places]);

  return (
    <div className="map-panel rounded-3xl p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="panel-title">نبض الخريطة الحي</div>
        <div className="text-xs text-white/70">{filtersActive ? "يتغير مع الفلاتر" : "كل المعالم"}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="text-xs text-white/70">المعالم النشطة</div>
          <div className="text-lg font-extrabold mt-1">{places.length}</div>
          <div className="text-[11px] text-white/60">نقاط تتحرك على الرادار</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
          <div className="text-xs text-white/70">أقوى فئة</div>
          <div className="text-lg font-extrabold mt-1">{topCategory ? labelByCat[topCategory.k] : "—"}</div>
          <div className="text-[11px] text-white/60">{topCategory ? `${topCategory.v} معلم` : "لا بيانات"}</div>
        </div>
      </div>

      <div className="mt-3 radar-surface">
        <div className="radar-sweep" />
        <div className="radar-ring radar-ring-1" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-ring radar-ring-3" />
        {dots.map((d) => (
          <div
            key={d.id}
            className="radar-dot"
            style={{ left: `${d.x}%`, top: `${d.y}%`, animationDelay: `${d.delay}s` }}
            title={d.title}
          />
        ))}
      </div>

      <div className="mt-2 text-[11px] text-white/60">
        الحركة تمثل توزيع المعالم المعروضة — جرّب تغيّر الفلاتر.
      </div>
    </div>
  );
}
