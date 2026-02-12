import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

import GlowBackground from "./components/GlowBackground";
import Home from "./components/Home";
import MapView from "./components/MapView";
import LessonPanel from "./components/LessonPanel";
import QuickQuestions from "./components/QuickQuestions";
import TopBar from "./components/TopBar";
import StatsStrip from "./components/StatsStrip";
import Toasts, { Toast } from "./components/Toasts";
import LayerControls, { Layers } from "./components/LayerControls";
import FilterControls, { CategoryFilter } from "./components/FilterControls";
import BaseMapControls, { BaseMapId } from "./components/BaseMapControls";
import PlaceDrawer from "./components/PlaceDrawer";
import MapGalleryPanel from "./components/MapGalleryPanel";
import InsightsPanel from "./components/InsightsPanel";

import type { Lesson, PlaceCategory } from "./types";
import { BUILTIN_GIS_SERVICES } from "./gis/catalog";
import type { GisState } from "./gis/types";
import water from "./data/lessons/water.json";
import minerals from "./data/lessons/minerals.json";
import projects from "./data/lessons/projects.json";

type View = "home" | "lesson";

function radiusFromImportance(importance: number) {
  return 12000 + importance * 260;
}

function allCategories(): CategoryFilter {
  const cats: PlaceCategory[] = [
    "fresh",
    "salty",
    "mineral",
    "energy",
    "renewable",
    "problem",
    "project",
    "agri",
    "transport",
    "urban",
    "aquaculture",
    "waterway",
    "mega",
  ];
  return cats.reduce((acc, c) => ({ ...acc, [c]: true }), {} as CategoryFilter);
}

const DEFAULT_LAYERS: Layers = {
  showPlaces: true,
  showLabels: false,
  showEgypt: true,
  showNile: true,
  showDelta: true,
  showHeat: false,
  showCoords: false,
};

function defaultGisState(): GisState {
  const byServiceId: GisState["byServiceId"] = {};
  for (const s of BUILTIN_GIS_SERVICES) {
    const isRoot = s.kind === "arcgis-root";
    const defaultArcgis = s.kind === "arcgis" ? (s.defaultLayerIds ?? []) : [];
    const defaultWms = s.kind === "wms" ? (s.defaultLayers ?? []) : [];
    byServiceId[s.id] = {
      enabled: s.enabledByDefault ?? false,
      opacity: typeof s.defaultOpacity === "number" ? Math.min(1, Math.max(0, s.defaultOpacity)) : (s.kind === "wms" ? 0.45 : 0.72),
      selectedArcgisLayerIds: defaultArcgis,
      selectedWmsLayers: defaultWms,
      whereByArcgisLayerId: s.kind === "arcgis" ? (s.defaultWhereByLayerId ?? {}) : {},
    };
  }
  return { byServiceId, customServices: [] };
}

export default function App() {
  const lessons = useMemo(() => [water as Lesson, minerals as Lesson, projects as Lesson], []);

  const [view, setView] = useState<View>("home");
  const [lessonId, setLessonId] = useState<string>(lessons[0].id);
  const lesson = useMemo(() => lessons.find((l) => l.id === lessonId)!, [lessons, lessonId]);

  const [activePlaceId, setActivePlaceId] = useState<string | null>(lesson.places[0]?.id ?? null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set<string>());
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set<string>());
  const [, setBadges] = useState<string[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [filters, setFilters] = useState<CategoryFilter>(allCategories());
  const [baseMap, setBaseMap] = useState<BaseMapId>("kids");
  const [gis, setGis] = useState<GisState>(() => defaultGisState());
  const [dashboardTab, setDashboardTab] = useState<"stats" | "gallery">("stats");
  const [focusToken, setFocusToken] = useState(0);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [mapResetToken, setMapResetToken] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [timeline, setTimeline] = useState<{ t: number; visible: number; highlights: number }[]>([]);

  const filtersActive = useMemo(() => Object.values(filters).some((v) => !v), [filters]);
  const visiblePlaces = useMemo(
    () => lesson.places.filter((p) => filters[p.category] ?? true),
    [lesson.places, filters]
  );

  const mapMetrics = useMemo(() => {
    const categoryCount = new Set(visiblePlaces.map((p) => p.category)).size;
    const importanceValues = visiblePlaces
      .map((p) => p.metrics?.importance)
      .filter((v): v is number => typeof v === "number");
    const avgImportance = importanceValues.length
      ? Math.round(importanceValues.reduce((acc, v) => acc + v, 0) / importanceValues.length)
      : 0;
    const highlightCount = visiblePlaces.filter((p) => (p.metrics?.importance ?? 0) >= 80).length;
    const areaSum = visiblePlaces.reduce((acc, p) => {
      const importance = p.metrics?.importance ?? 55;
      const r = radiusFromImportance(importance);
      return acc + Math.PI * r * r;
    }, 0);
    const totalAreaKm2 = Math.round(areaSum / 1_000_000);
    const hiddenCount = Math.max(0, lesson.places.length - visiblePlaces.length);
    return { categoryCount, avgImportance, highlightCount, totalAreaKm2, hiddenCount };
  }, [visiblePlaces, lesson.places.length]);

  useEffect(() => {
    const point = {
      t: Date.now(),
      visible: visiblePlaces.length,
      highlights: mapMetrics.highlightCount,
    };
    setTimeline((prev) => [...prev.slice(-19), point]);
  }, [visiblePlaces.length, mapMetrics.highlightCount]);

  const toast = (title: string, body?: string) => {
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const t = { id, title, body };
    setToasts((p) => [t, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const earnBadge = (b: string) => {
    setBadges((prev) => (prev.includes(b) ? prev : [b, ...prev].slice(0, 10)));
    toast("تحديث", b);
  };

  const completeActivity = (id: string) => {
    setCompletedActivities((prev) => new Set([...Array.from(prev), id]));
  };

  const openLesson = (id: string) => {
    setLessonId(id);
    const l = lessons.find((x) => x.id === id)!;
    setActivePlaceId(l.places[0]?.id ?? null);
    setFocusToken((t) => t + 1);
    setDiscovered(new Set<string>());
    setCompletedActivities(new Set<string>());
    setBadges([]);
    setFilters(allCategories());
    setLayers(DEFAULT_LAYERS);
    setBaseMap("kids");
    setDrawerOpen(true);
    setView("lesson");
    toast("بدأنا!", `أنت داخل درس: ${l.title}`);
  };

  const navigateToPlace = (placeId: string) => {
    const p = lesson.places.find((x) => x.id === placeId);
    if (!p) return;
    setFilters((prev) => (prev[p.category] ? prev : { ...prev, [p.category]: true }));
    setActivePlaceId(placeId);
    setDrawerOpen(true);
    setFocusToken((t) => t + 1);
    setDiscovered((s) => new Set([...Array.from(s), placeId]));
  };

  const resetFilters = () => {
    setFilters(allCategories());
    toast("تم", "رجّعنا الفلاتر للوضع الافتراضي");
  };

  const resetMapView = () => {
    setLayers(DEFAULT_LAYERS);
    setFilters(allCategories());
    setBaseMap("kids");
    setMapResetToken((t) => t + 1);
    if (lesson.places[0]?.id) setActivePlaceId(lesson.places[0].id);
    setDrawerOpen(true);
    setFocusToken((t) => t + 1);
    toast("تم", "إعادة ضبط الخريطة واللوحات");
  };

  const activePlace = useMemo(
    () => lesson.places.find((p) => p.id === activePlaceId) ?? null,
    [lesson.places, activePlaceId]
  );

  const nextPlace = () => {
    if (!activePlaceId) return;
    const idx = lesson.places.findIndex((p) => p.id === activePlaceId);
    const next = lesson.places[(idx + 1) % lesson.places.length];
    navigateToPlace(next.id);
    toast("استكشاف", `روّحتك لـ ${next.title}`);
  };

  const stats = useMemo(() => {
    return [
      {
        label: "المعالم المعروضة",
        value: `${visiblePlaces.length}`,
        hint: filtersActive ? `مخفي ${mapMetrics.hiddenCount}` : "كل المعالم",
      },
      { label: "الفئات النشطة", value: `${mapMetrics.categoryCount}`, hint: "أنواع ظاهرة على الخريطة" },
      { label: "متوسط الأهمية", value: `${mapMetrics.avgImportance}`, hint: "من 100" },
      { label: "مساحة التأثير", value: `${mapMetrics.totalAreaKm2} كم²`, hint: "تقريبية حسب الأهمية" },
    ];
  }, [visiblePlaces.length, filtersActive, mapMetrics.hiddenCount, mapMetrics.categoryCount, mapMetrics.avgImportance, mapMetrics.totalAreaKm2]);

  const topSummary = useMemo(() => {
    const suffix = filtersActive ? " (فلتر)" : "";
    return [
      { label: `المعالم${suffix}`, value: `${visiblePlaces.length}` },
      { label: "الفئات", value: `${mapMetrics.categoryCount}` },
      { label: "مميزة", value: `${mapMetrics.highlightCount}` },
    ];
  }, [filtersActive, visiblePlaces.length, mapMetrics.categoryCount, mapMetrics.highlightCount]);

  return (
    <div className="relative min-h-screen w-screen overflow-x-hidden font-display">
      <GlowBackground />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <div className="relative z-10 p-4 md:p-6 flex flex-col gap-6">
        <TopBar
          lesson={view === "lesson" ? lesson : null}
          view={view}
          lessons={lessons}
          onSwitchLesson={(id) => openLesson(id)}
          onGoHome={() => setView("home")}
          summary={view === "lesson" ? topSummary : []}
        />

        <AnimatePresence mode="wait">
          {view === "home" ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1"
            >
              <Home lessons={lessons} onOpen={openLesson} />
            </motion.div>
          ) : (
            <motion.div
              key="lesson"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 grid grid-cols-1 xl:grid-cols-12 items-start gap-5 2xl:gap-8"
            >
              {/* [ZONE 1: NAVIGATION & CONTROLS] */}
              <div className="xl:col-span-2 flex flex-col gap-4 glass-deep rounded-[32px] p-4 border border-white/10 h-fit xl:sticky xl:top-24 shadow-2xl">
                <div className="zone-title">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-glow" />
                  التحكم والملاحة
                </div>

                {/* Lesson Info Card */}
                <div className="glass-dense rounded-[24px] p-4 shadow-soft border border-white/5">
                  <div className="panel-title mb-2">معلومات الدرس</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">إجمالي المعالم</span>
                      <span className="badge !px-2 !py-0.5">{lesson.places.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">تم اكتشافه</span>
                      <span className="badge !px-2 !py-0.5 bg-green-500/20 border-green-500/30">{discovered.size}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">الأنشطة المكتملة</span>
                      <span className="badge !px-2 !py-0.5 bg-blue-500/20 border-blue-500/30">{completedActivities.size}/{lesson.activities.length}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-white/50 text-[10px] mb-1">نسبة الإنجاز</div>
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${Math.round((discovered.size / lesson.places.length) * 100)}%` }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-white/60 mt-1">
                        {Math.round((discovered.size / lesson.places.length) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-dense rounded-[24px] p-4 shadow-soft">
                  <div className="panel-title mb-3">الخريطة الأساسية</div>
                  <BaseMapControls baseMap={baseMap} setBaseMap={setBaseMap} />
                  <div className="mt-4">
                    <LayerControls layers={layers} setLayers={setLayers} />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <FilterControls filters={filters} setFilters={setFilters} />

                  <div className="glass rounded-[24px] p-4 shadow-soft relative overflow-hidden scanline">
                    <div className="glow-ring opacity-40" />
                    <div className="panel-title mb-3">أدوات سريعة</div>
                    <div className="space-y-3 text-sm text-white/85">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">أسماء المعالم</span>
                        <button className="btn text-xs px-4" onClick={() => setLayers((prev) => ({ ...prev, showLabels: !prev.showLabels }))}>
                          {layers.showLabels ? "مفعّل" : "مغلق"}
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">صوت الخريطة</span>
                        <button className="btn text-xs px-4" onClick={() => setAutoSpeak((v) => !v)}>
                          {autoSpeak ? "مفعّل" : "مغلق"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <button className="btn w-full text-xs py-2 shadow-inner border-white/10 hover:border-white/20" onClick={resetMapView}>
                        إعادة ضبط الخريطة 🗺️
                      </button>
                      <button className="btn w-full text-xs py-2 shadow-inner border-white/10 hover:border-white/20" onClick={resetFilters}>
                        إعادة ضبط الفلاتر 🔄
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats Card */}
                  <div className="glass rounded-[24px] p-4 shadow-soft border border-white/5">
                    <div className="panel-title mb-3">إحصائيات سريعة</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                        <span className="text-white/70">🎯 الأهمية المتوسطة</span>
                        <span className="font-bold text-cyan-400">{mapMetrics.avgImportance}/100</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                        <span className="text-white/70">⭐ معالم مميزة</span>
                        <span className="font-bold text-yellow-400">{mapMetrics.highlightCount}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-xl bg-white/5">
                        <span className="text-white/70">📊 الفئات النشطة</span>
                        <span className="font-bold text-green-400">{mapMetrics.categoryCount}</span>
                      </div>
                      {filtersActive && (
                        <div className="flex justify-between items-center p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                          <span className="text-orange-300">🔍 مخفي</span>
                          <span className="font-bold text-orange-400">{mapMetrics.hiddenCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lesson Objectives Card */}
                  <div className="glass rounded-[24px] p-4 shadow-soft border border-white/5 relative overflow-hidden">
                    <div className="glow-ring opacity-30" />
                    <div className="panel-title mb-3">أهداف الدرس 🎯</div>
                    <ul className="space-y-2 text-xs">
                      {lesson.objectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <span className="text-cyan-400 mt-0.5">✓</span>
                          <span className="text-white/80 leading-relaxed">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Fun Facts Card */}
                  {lesson.funFacts?.length ? (
                    <div className="glass rounded-[24px] p-4 shadow-soft border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
                      <div className="panel-title mb-3">💡 هل تعلم؟</div>
                      <div className="text-xs text-white/90 leading-relaxed italic p-3 rounded-xl bg-white/10 border border-white/10">
                        {lesson.funFacts[Math.floor((Date.now() / 8000) % lesson.funFacts.length)]}
                      </div>
                      <div className="mt-2 text-[10px] text-white/50 text-center">
                        ({Math.floor((Date.now() / 8000) % lesson.funFacts.length) + 1} من {lesson.funFacts.length})
                      </div>
                    </div>
                  ) : null}

                  {/* Missions Card */}
                  {lesson.missions?.length ? (
                    <div className="glass rounded-[24px] p-4 shadow-soft border border-purple-500/20">
                      <div className="panel-title mb-3">🏆 المهمات</div>
                      <div className="space-y-2">
                        {lesson.missions.map((mission) => {
                          const steps = mission.steps || [];
                          const completedSteps = steps.filter(step => discovered.has(step)).length;
                          const progress = steps.length ? Math.round((completedSteps / steps.length) * 100) : 0;
                          return (
                            <div key={mission.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                              <div className="text-xs font-bold text-white/90 mb-2">{mission.title}</div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-white/60">{completedSteps}/{steps.length}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* [ZONE 2: DISCOVERY & EXPLORATION] */}
              <div className="xl:col-span-10 flex flex-col gap-6 2xl:gap-8">
                <div className="glass-deep rounded-[32px] p-3 flex flex-col gap-2 shadow-2xl border border-white/10">
                  <StatsStrip stats={stats} />
                </div>

                <div className="flex flex-col xl:flex-row gap-6 h-fit xl:h-[750px] 2xl:h-[900px]">
                  <div className="flex-[8] relative rounded-[40px] overflow-hidden border-2 border-white/10 shadow-2xl group flex bg-slate-900/40">
                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 relative">
                      <MapView
                        lesson={lesson}
                        activePlaceId={activePlaceId}
                        onSelectPlace={(id) => {
                          navigateToPlace(id);
                          toast("انتقال", "روّحتك للمكان");
                        }}
                        focusToken={focusToken}
                        resetToken={mapResetToken}
                        layers={layers}
                        filters={filters}
                        baseMap={baseMap}
                        gis={gis}
                      />
                    </div>

                    {drawerOpen ? (
                      <PlaceDrawer
                        lesson={lesson}
                        place={activePlace}
                        discovered={discovered}
                        autoSpeak={autoSpeak}
                        focusToken={focusToken}
                        onClose={() => setDrawerOpen(false)}
                        onNavigateNext={nextPlace}
                      />
                    ) : null}

                    {!drawerOpen && activePlace ? (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-6 top-6 z-[999] map-panel rounded-2xl px-5 py-2.5 text-sm font-black shadow-2xl border border-white/20 hover:scale-105 transition-transform"
                        onClick={() => setDrawerOpen(true)}
                      >
                        فتح بطاقة المعلومات 📖
                      </motion.button>
                    ) : null}
                  </div>

                  <div className="flex-[3] h-full min-h-[500px]">
                    <QuickQuestions
                      lesson={lesson}
                      onNavigate={navigateToPlace}
                      onToast={toast}
                    />
                  </div>
                </div>
                <div className="flex flex-col bg-black/20 rounded-[32px] p-6 border border-white/5 shadow-xl">
                  <div className="flex items-center justify-between gap-2 px-1 mb-5">
                    <div className="zone-title !mb-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow animate-pulse" />
                      التحليلات والمعرض الشامل
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                      <button
                        className={clsx("px-5 py-1.5 rounded-xl text-xs font-bold transition-all", dashboardTab === "stats" ? "bg-white/10 text-white shadow-inner border border-white/10" : "text-white/40 hover:text-white")}
                        onClick={() => setDashboardTab("stats")}
                      >
                        الإحصائيات
                      </button>
                      <button
                        className={clsx("px-5 py-1.5 rounded-xl text-xs font-bold transition-all", dashboardTab === "gallery" ? "bg-white/10 text-white shadow-inner border border-white/10" : "text-white/40 hover:text-white")}
                        onClick={() => setDashboardTab("gallery")}
                      >
                        المعرض
                      </button>
                    </div>
                  </div>

                  <div className="w-full">
                    <AnimatePresence mode="wait">
                      {dashboardTab === "stats" ? (
                        <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <InsightsPanel
                            lesson={lesson}
                            places={visiblePlaces}
                            timeline={timeline}
                            filtersActive={filtersActive}
                          />
                        </motion.div>
                      ) : (
                        <motion.div key="gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <MapGalleryPanel
                            places={visiblePlaces}
                            activePlaceId={activePlaceId}
                            filtersActive={filtersActive}
                            onSelectPlace={(id) => {
                              navigateToPlace(id);
                              toast("انتقال", "روّحتك للمكان");
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GUIDED LEARNING ZONE (FULL WIDTH BELOW) */}
        {view === "lesson" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-8"
          >
            <div className="xl:col-span-12 glass-deep rounded-[40px] p-6 border border-white/10 shadow-2xl">
              <div className="zone-title !mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-glow" />
                منصة التعلم التفاعلي
              </div>
              <LessonPanel
                lesson={lesson}
                activePlaceId={activePlaceId}
                onSelectPlace={navigateToPlace}
                onEarnBadge={earnBadge}
                onCompleteActivity={completeActivity}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
