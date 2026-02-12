import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { Lesson, Place } from "../types";
import Activities from "./Activities";

export default function LessonPanel(props: {
  lesson: Lesson;
  activePlaceId: string | null;
  onSelectPlace: (id: string) => void;
  onEarnBadge: (badge: string) => void;
  onCompleteActivity: (id: string) => void;
}) {
  const { lesson, activePlaceId, onSelectPlace, onEarnBadge, onCompleteActivity } = props;

  const activePlace: Place | null = useMemo(
    () => lesson.places.find((p) => p.id === activePlaceId) ?? null,
    [lesson.places, activePlaceId]
  );

  const [tab, setTab] = useState<"story" | "activities">("story");

  const missionDetails = useMemo(() => {
    const placeMap = new Map(lesson.places.map((p) => [p.id, p.title]));
    return (lesson.missions ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      steps: (m.steps ?? []).map((id) => placeMap.get(id) ?? id),
      activityTitle: m.activity ? lesson.activities.find((a) => a.id === m.activity)?.title ?? m.activity : null,
    }));
  }, [lesson.missions, lesson.places, lesson.activities]);

  const jumpFromConcept = (placeId?: string) => {
    if (placeId) onSelectPlace(placeId);
    else if (lesson.places[0]) onSelectPlace(lesson.places[0].id);
  };

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      <div className="glass rounded-[28px] p-4 shadow-soft relative overflow-hidden scanline">
        <div className="glow-ring animate-pulseGlow" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xl font-extrabold">{lesson.title}</div>
            {lesson.ageHint ? <div className="text-xs text-white/70 mt-1">{lesson.ageHint}</div> : null}
          </div>
          <div className="flex gap-2">
            <button className={clsx("btn text-xs", tab === "story" && "border-white/35 bg-white/10")} onClick={() => setTab("story")}>
              الشرح
            </button>
            <button className={clsx("btn text-xs", tab === "activities" && "border-white/35 bg-white/10")} onClick={() => setTab("activities")}>
              التحديات
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="panel-title mb-2">أهداف الدرس</div>
          <ul className="text-sm text-white/85 space-y-1 list-disc pr-5">
            {lesson.objectives.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </div>

        {lesson.funFacts?.length ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-blue-500/10 p-3 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">💡</span>
              <div className="panel-title !mb-0">هل تعلم؟</div>
            </div>
            <div className="text-sm text-white/90 italic leading-relaxed">
              {lesson.funFacts[Math.floor((Date.now() / 10000) % lesson.funFacts.length)]}
            </div>
          </div>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {tab === "story" ? (
          <motion.div
            key="story"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass rounded-[28px] p-4 shadow-soft relative overflow-hidden scanline min-h-0"
          >
            <div className="glow-ring" />
            <div className="panel-title mb-3">كروت الشرح (اضغط = يوديك للخريطة)</div>

            <div className="grid gap-3">
              {lesson.conceptCards.map((c) => (
                <motion.button
                  key={c.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => jumpFromConcept(c.placeId)}
                  className="text-right rounded-3xl border border-white/10 bg-black/20 p-4 focus-ring"
                >
                  <div className="font-extrabold">{c.title}</div>
                  <ul className="text-sm text-white/85 space-y-1 list-disc pr-5 mt-2">
                    {c.bullets.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                  {c.miniTip ? (
                    <div className="mt-3 text-xs text-white/70">
                      <span className="badge">Tip</span> {c.miniTip}
                    </div>
                  ) : null}
                  <div className="mt-3 text-xs text-white/70">اضغط علشان نروح على الخريطة ونشوف مثال.</div>
                </motion.button>
              ))}
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="panel-title mb-2">المعالم (كل زر يوديك للخريطة)</div>
              <div className="flex flex-wrap gap-2 max-h-[130px] overflow-auto pr-1">
                {lesson.places.map((p) => (
                  <button
                    key={p.id}
                    className={clsx("btn text-xs", p.id === activePlaceId && "border-white/35 bg-white/10")}
                    onClick={() => onSelectPlace(p.id)}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {activePlace ? (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-3 glass rounded-2xl p-3">
                    <div className="font-extrabold">{activePlace.title}</div>
                    <div className="text-sm text-white/85 mt-1">{activePlace.summary}</div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {missionDetails.length ? (
              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="panel-title mb-2">مهمات الدرس</div>
                <div className="space-y-3 text-sm text-white/85">
                  {missionDetails.map((m) => (
                    <div key={m.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="font-extrabold">{m.title}</div>
                      {m.steps.length ? (
                        <ul className="mt-2 list-disc pr-5 space-y-1 text-sm text-white/80">
                          {m.steps.map((s) => <li key={s}>{s}</li>)}
                        </ul>
                      ) : null}
                      {m.activityTitle ? (
                        <div className="mt-2 text-xs text-white/70">نشاط مرتبط: {m.activityTitle}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="min-h-0"
          >
            <Activities lesson={lesson} onEarnBadge={onEarnBadge} onCompleteActivity={onCompleteActivity} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
