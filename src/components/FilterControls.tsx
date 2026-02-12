import clsx from "clsx";
import type { PlaceCategory } from "../types";

export type CategoryFilter = Record<PlaceCategory, boolean>;

const labels: Partial<Record<PlaceCategory, string>> = {
  fresh: "عذبة",
  salty: "مالحة",
  mineral: "معادن",
  energy: "طاقة",
  renewable: "متجددة",
  problem: "مشكلات",
  project: "مشروع",
  agri: "زراعي",
  transport: "نقل",
  urban: "عمراني/مدن",
  aquaculture: "استزراع سمكي",
  waterway: "ممر مائي",
  mega: "قومي",
};

export default function FilterControls(props: { filters: CategoryFilter; setFilters: (v: CategoryFilter) => void }) {
  const { filters, setFilters } = props;

  const toggle = (k: PlaceCategory) => setFilters({ ...filters, [k]: !filters[k] });

  return (
    <div className="glass rounded-3xl p-3 shadow-soft">
      <div className="panel-title mb-2">فلاتر المعالم</div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(filters) as PlaceCategory[]).map((k) => (
          <button
            key={k}
            className={clsx("btn text-xs", filters[k] && "border-white/35 bg-white/10")}
            onClick={() => toggle(k)}
            title={labels[k] ?? k}
          >
            {labels[k] ?? k}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-white/65">اقفل أنواع واظهر أنواع — المعالم هتبقى أوضح.</div>
    </div>
  );
}
