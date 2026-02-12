import { useMemo } from "react";
import clsx from "clsx";
import type { Place, PlaceCategory } from "../types";

const emojiByCat: Record<PlaceCategory, string> = {
  fresh: "💧",
  salty: "🌊",
  mineral: "⛏️",
  energy: "⚡",
  renewable: "☀️",
  problem: "⚠️",
  project: "🏗️",
  agri: "🌾",
  transport: "🚆",
  urban: "🏙️",
  aquaculture: "🐟",
  waterway: "🚢",
  mega: "🏆",
};

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

function clip(text: string, max = 92) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function MapHighlightsPanel(props: {
  places: Place[];
  activePlaceId: string | null;
  filtersActive: boolean;
  onSelectPlace: (id: string) => void;
}) {
  const { places, activePlaceId, filtersActive, onSelectPlace } = props;

  const highlights = useMemo(() => {
    if (!places.length) return [];
    const sorted = [...places].sort((a, b) => {
      const ai = a.metrics?.importance ?? 0;
      const bi = b.metrics?.importance ?? 0;
      if (bi !== ai) return bi - ai;
      return a.title.localeCompare(b.title);
    });
    return sorted.slice(0, 8);
  }, [places]);

  return (
    <div className="map-panel rounded-3xl p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="panel-title">لقطات سريعة</div>
        <div className="text-xs text-white/70">{filtersActive ? "معالم مفلترة" : "أهم المعالم"}</div>
      </div>

      {!highlights.length ? (
        <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          لا توجد معالم معروضة الآن. جرّب تفعيل بعض الفلاتر.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {highlights.map((p) => {
            const importance = p.metrics?.importance;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlace(p.id)}
                className={clsx(
                  "text-right rounded-2xl border border-white/15 bg-white/5 p-3 hover:bg-white/10 transition",
                  p.id === activePlaceId && "border-white/40 bg-white/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-extrabold text-sm flex items-center gap-2">
                    <span>{emojiByCat[p.category] ?? "📍"}</span>
                    <span>{p.title}</span>
                  </div>
                  <span className="badge">{labelByCat[p.category] ?? p.category}</span>
                </div>
                <div className="mt-2 text-xs text-white/80">{clip(p.summary)}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {typeof importance === "number" ? <span className="badge">أهمية {importance}</span> : null}
                  <span className="badge">اضغط للانتقال</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
