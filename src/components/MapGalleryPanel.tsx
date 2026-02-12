import { useMemo } from "react";
import clsx from "clsx";
import type { Place, PlaceCategory } from "../types";
import { placeMediaCover, resolvePlaceMedia } from "../utils/placeMedia";

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

const metaByCat: Record<PlaceCategory, { label: string; color: string }> = {
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

function clip(text: string, max = 84) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export default function MapGalleryPanel(props: {
  places: Place[];
  activePlaceId: string | null;
  filtersActive: boolean;
  onSelectPlace: (id: string) => void;
}) {
  const { places, activePlaceId, filtersActive, onSelectPlace } = props;

  const picks = useMemo(() => {
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
    <div className="map-panel rounded-3xl p-4 shadow-soft" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="panel-title">معرض المعالم</div>
        <div className="text-xs text-white/70">{filtersActive ? "صور المعالم المفلترة" : "عينات من كل المعالم"}</div>
      </div>

      {!picks.length ? (
        <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          لا توجد معالم معروضة الآن. جرّب تفعيل بعض الفلاتر.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {picks.map((p) => {
            const meta = metaByCat[p.category];
            const importance = p.metrics?.importance;
            const media = resolvePlaceMedia(p);
            const cover = placeMediaCover(p);
            const hasVideo = media.videos.length > 0;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPlace(p.id)}
                className={clsx(
                  "text-right rounded-2xl border border-white/15 bg-white/5 overflow-hidden hover:bg-white/10 transition",
                  p.id === activePlaceId && "border-white/40 bg-white/10"
                )}
              >
                {cover ? (
                  <div className="h-[120px] w-full overflow-hidden relative">
                    <img src={cover} alt={p.title} className="h-full w-full object-cover" loading="lazy" />
                    {hasVideo ? <span className="absolute bottom-2 left-2 badge !py-0.5">فيديو</span> : null}
                  </div>
                ) : (
                  <div
                    className="h-[120px] w-full flex items-center justify-center text-3xl"
                    style={{
                      background: `radial-gradient(circle at 30% 20%, ${meta?.color ?? "#94a3b8"}55, rgba(2,6,23,0.95))`,
                    }}
                  >
                    {emojiByCat[p.category] ?? "📍"}
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-extrabold text-sm">{p.title}</div>
                    <span className="badge">{meta?.label ?? p.category}</span>
                  </div>
                  <div className="mt-2 text-xs text-white/80">{clip(p.summary)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {typeof importance === "number" ? <span className="badge">أهمية {importance}</span> : null}
                    <span className="badge">اضغط للانتقال</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

