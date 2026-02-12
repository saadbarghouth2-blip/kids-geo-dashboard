import { motion } from "framer-motion";
import type { Lesson } from "../types";

export default function TopBar(props: {
  lesson: Lesson | null;
  view: "home" | "lesson";
  lessons: Lesson[];
  onSwitchLesson: (id: string) => void;
  onGoHome: () => void;
  summary?: { label: string; value: string }[];
}) {
  const { lesson, view, lessons, onSwitchLesson, onGoHome, summary } = props;
  const showSummary = view === "lesson" && (summary?.length ?? 0) > 0;

  return (
    <header className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-11 w-11 rounded-3xl glass shadow-soft grid place-items-center font-extrabold"
        >
          M
        </motion.div>
        <div className="leading-tight text-right" dir="rtl" lang="ar">
          <div className="font-extrabold" dir="ltr">
            <span aria-hidden="true">🌟</span>{" "}
            <span dir="rtl">رحلة التعلم التفاعلية</span>{" "}
            <span aria-hidden="true">🌟</span>
          </div>
          <div className="text-xs text-white/70">
            {view === "home" ? "اختر درسًا وابدأ الاستكشاف" : `أنت داخل: ${lesson?.title ?? ""}`}
          </div>
        </div>
      </div>

      {showSummary ? (
        <div className="hidden lg:flex items-center gap-2 glass rounded-3xl px-3 py-2 shadow-soft">
          {summary?.map((s, idx) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="text-xs text-white/70">{s.label}</div>
              <div className="font-extrabold">{s.value}</div>
              {idx < summary.length - 1 ? <div className="w-[1px] h-5 bg-white/10 mx-1" /> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        {view === "lesson" ? (
          <div className="glass rounded-2xl px-3 py-2 shadow-soft flex items-center gap-2">
            <span className="text-[11px] text-white/70">تبديل الدرس</span>
            <div className="relative">
              <select
                className="lesson-select text-right min-w-[200px]"
                dir="rtl"
                value={lesson?.id ?? ""}
                onChange={(e) => onSwitchLesson(e.target.value)}
              >
                {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/60">▾</span>
            </div>
          </div>
        ) : null}
        <button className="btn-strong" onClick={onGoHome}>الرئيسية</button>
      </div>
    </header>
  );
}
