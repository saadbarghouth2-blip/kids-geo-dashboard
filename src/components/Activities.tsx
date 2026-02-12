import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { Activity, DragMatchActivity, Lesson, QuizActivity } from "../types";

export default function Activities(props: {
  lesson: Lesson;
  onEarnBadge: (badge: string) => void;
  onCompleteActivity: (id: string) => void;
}) {
  const { lesson, onEarnBadge, onCompleteActivity } = props;
  const [active, setActive] = useState<string>(lesson.activities[0]?.id ?? "");

  const activity = useMemo(
    () => lesson.activities.find((a) => a.id === active) ?? null,
    [lesson.activities, active]
  );

  if (!activity) return null;

  return (
    <div className="glass rounded-[32px] p-5 shadow-soft relative overflow-hidden scanline">
      <div className="glow-ring animate-pulseGlow" />
      <div className="flex items-center justify-between gap-3">
        <div className="panel-title">أنشطة وتحديات</div>
        <div className="flex flex-wrap gap-2">
          {lesson.activities.map((a) => (
            <button
              key={a.id}
              className={clsx("btn text-xs", a.id === active && "border-white/35 bg-white/10")}
              onClick={() => setActive(a.id)}
            >
              {a.type === "quiz" ? "Quiz" : "Drag"} • {a.title}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-4"
        >
          {activity.type === "drag_match" ? (
            <DragMatch
              activity={activity}
              onWin={() => {
                onEarnBadge("🎖️ تفاعل: بطل التصنيف");
                onCompleteActivity(activity.id);
              }}
            />
          ) : (
            <Quiz
              activity={activity}
              onWin={() => {
                onEarnBadge("🏅 تفاعل: ذكي جدًا");
                onCompleteActivity(activity.id);
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DragMatch(props: { activity: DragMatchActivity; onWin: () => void }) {
  const { activity, onWin } = props;
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const remaining = activity.items.filter((i) => !placed[i.id]);

  const check = () => {
    const ok = activity.items.every((i) => placed[i.id] === i.answerGroup);
    setDone(true);
    if (ok) onWin();
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/85">{activity.prompt}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activity.groups.map((g) => (
          <DropZone
            key={g.id}
            title={g.title}
            onDrop={(itemId) => setPlaced((p) => ({ ...p, [itemId]: g.id }))}
            items={activity.items.filter((i) => placed[i.id] === g.id)}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-3">
        <div className="panel-title mb-2">البطاقات</div>
        <div className="flex flex-wrap gap-2">
          {remaining.map((i) => (
            <DraggableCard key={i.id} id={i.id} label={i.label} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn" onClick={check}>تحقق</button>
        <button className="btn" onClick={() => { setPlaced({}); setDone(false); }}>إعادة</button>
        <span className="text-xs text-white/70">اسحب البطاقة إلى الصندوق.</span>
      </div>

      <AnimatePresence>
        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass rounded-2xl p-3"
          >
            {activity.items.every((i) => placed[i.id] === i.answerGroup) ? (
              <div className="font-extrabold">ممتاز! كله صح.</div>
            ) : (
              <div className="font-extrabold">قريب! جرّب تاني.</div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DraggableCard(props: { id: string; label: string }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", props.id)}
      className="px-3 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition cursor-grab active:cursor-grabbing"
    >
      <span className="font-semibold text-sm">{props.label}</span>
    </div>
  );
}

function DropZone(props: { title: string; onDrop: (id: string) => void; items: { id: string; label: string }[] }) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        if (id) props.onDrop(id);
      }}
      className="glass rounded-3xl p-4 min-h-[120px] border border-white/10"
    >
      <div className="panel-title mb-2">{props.title}</div>
      <div className="flex flex-wrap gap-2">
        {props.items.map((i) => (
          <div key={i.id} className="px-3 py-2 rounded-2xl border border-white/10 bg-black/20">
            <span className="text-sm font-semibold">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Quiz(props: { activity: QuizActivity; onWin: () => void }) {
  const { activity, onWin } = props;
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = activity.questions[idx];

  const submit = () => {
    if (chosen == null) return;
    const ok = chosen === q.answerIndex;
    const newScore = score + (ok ? 1 : 0);
    setScore(newScore);

    if (idx === activity.questions.length - 1) {
      if (newScore === activity.questions.length) onWin();
      return;
    }
    setTimeout(() => {
      setIdx((i) => i + 1);
      setChosen(null);
    }, 400);
  };

  const finished = idx === activity.questions.length - 1 && chosen != null;

  return (
    <div className="space-y-3">
      <div className="panel-title">{activity.title}</div>
      <div className="text-sm text-white/90">{q.q}</div>

      <div className="grid gap-2">
        {q.choices.map((c, i) => {
          const selected = chosen === i;
          const correct = chosen != null && i === q.answerIndex;
          const wrongSel = chosen != null && selected && i !== q.answerIndex;

          return (
            <button
              key={c}
              className={clsx(
                "btn text-right",
                selected && "border-white/35 bg-white/10",
                correct && "border-white/35 bg-white/10",
                wrongSel && "border-white/20 bg-white/5 opacity-70"
              )}
              onClick={() => setChosen(i)}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button className="btn" onClick={submit}>تأكيد</button>
        <span className="text-xs text-white/70">
          النتيجة: <span className="font-extrabold">{score}</span> / {activity.questions.length}
        </span>
      </div>

      <AnimatePresence>
        {chosen != null ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="glass rounded-2xl p-3"
          >
            <div className="font-extrabold">
              {chosen === q.answerIndex ? "صح!" : "مش صح."}
            </div>
            <div className="text-sm text-white/85 mt-1">{q.explain}</div>
            {finished ? (
              <div className="text-xs text-white/70 mt-2">اختار نشاط تاني أو ارجع للشرح.</div>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
