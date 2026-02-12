import { useMemo } from "react";
import type { Place } from "../types";

type BoundsInfo = {
  north: Place;
  south: Place;
  east: Place;
  west: Place;
  centerLat: number;
  centerLng: number;
  spanLatKm: number;
  spanLngKm: number;
  areaKm2: number;
  density: number;
};

function kmFromLatDiff(diff: number) {
  return Math.max(0, Math.round(Math.abs(diff) * 111));
}

function kmFromLngDiff(diff: number, atLat: number) {
  const cos = Math.cos((atLat * Math.PI) / 180);
  return Math.max(0, Math.round(Math.abs(diff) * 111 * Math.max(0.2, cos)));
}

export default function MapGeoPanel(props: { places: Place[]; filtersActive: boolean }) {
  const { places, filtersActive } = props;

  const bounds = useMemo<BoundsInfo | null>(() => {
    if (!places.length) return null;
    let north = places[0];
    let south = places[0];
    let east = places[0];
    let west = places[0];
    for (const p of places) {
      if (p.lat > north.lat) north = p;
      if (p.lat < south.lat) south = p;
      if (p.lng > east.lng) east = p;
      if (p.lng < west.lng) west = p;
    }
    const centerLat = (north.lat + south.lat) / 2;
    const centerLng = (east.lng + west.lng) / 2;
    const spanLatKm = kmFromLatDiff(north.lat - south.lat);
    const spanLngKm = kmFromLngDiff(east.lng - west.lng, centerLat);
    const areaKm2 = Math.max(1, spanLatKm * spanLngKm);
    const density = Math.max(0, Math.round((places.length / areaKm2) * 1000));
    return { north, south, east, west, centerLat, centerLng, spanLatKm, spanLngKm, areaKm2, density };
  }, [places]);

  return (
    <div className="map-panel rounded-3xl p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="panel-title">بوصلة الخريطة</div>
        <div className="text-xs text-white/70">{filtersActive ? "حسب الفلاتر" : "كل المعالم"}</div>
      </div>

      {!bounds ? (
        <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          لا توجد معالم معروضة الآن. جرّب تفعيل بعض الفلاتر.
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="text-xs text-white/70">امتداد شمال-جنوب</div>
              <div className="text-lg font-extrabold mt-1">{bounds.spanLatKm} كم</div>
              <div className="text-[11px] text-white/60">بين {bounds.south.title} و {bounds.north.title}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="text-xs text-white/70">امتداد شرق-غرب</div>
              <div className="text-lg font-extrabold mt-1">{bounds.spanLngKm} كم</div>
              <div className="text-[11px] text-white/60">بين {bounds.west.title} و {bounds.east.title}</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="text-xs text-white/70">مركز المعالم</div>
              <div className="text-sm font-extrabold mt-1">{bounds.centerLat.toFixed(2)}, {bounds.centerLng.toFixed(2)}</div>
              <div className="text-[11px] text-white/60">نقطة توازن تقريبية</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="text-xs text-white/70">كثافة تقريبية</div>
              <div className="text-lg font-extrabold mt-1">{bounds.density}</div>
              <div className="text-[11px] text-white/60">معلم لكل 1000 كم²</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-bold text-white/80 mb-2">أقصى الاتجاهات</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>شمالًا</span>
                  <span className="badge">{bounds.north.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>جنوبًا</span>
                  <span className="badge">{bounds.south.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>شرقًا</span>
                  <span className="badge">{bounds.east.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>غربًا</span>
                  <span className="badge">{bounds.west.title}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs font-bold text-white/80 mb-2">نطاق الانتشار</div>
              <div className="space-y-2 text-sm text-white/80">
                <div className="flex items-center justify-between">
                  <span>إجمالي المساحة</span>
                  <span className="badge">{bounds.areaKm2} كم²</span>
                </div>
                <div className="text-[11px] text-white/60">مبني على حدود المعالم المعروضة.</div>
                <div className="text-[11px] text-white/60">غيّر الفلاتر لرؤية تغير الانتشار.</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
