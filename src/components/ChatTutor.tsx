import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lesson, Place } from "../types";
import { normalizeArabic } from "../utils/text";
import Typewriter from "./Typewriter";

type Intent = { action?: "flyTo"; id?: string };
type Msg = { role: "user" | "bot"; text: string; intent?: Intent };

type Reply = { text: string; intent?: Intent };

const labelByCat: Record<string, string> = {
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

function summarizePlace(place: Place) {
  const details = place.details?.slice(0, 3) ?? [];
  const importance = place.metrics?.importance;
  const lines = [
    `تمام! ده ${place.title}.`,
    place.summary,
    details.length ? `معلومات سريعة: ${details.join(" • ")}` : null,
    typeof importance === "number" ? `الأهمية: ${importance}/100.` : null,
    "لو عايز صورة/فيديو قولي (ورّيني فيديو)، ولو عايز شرح بصوت قولي (اسمع الشرح).",
  ].filter(Boolean);
  return lines.join(" ");
}

function findPlace(lesson: Lesson, q: string): Place | null {
  const nq = normalizeArabic(q);
  for (const p of lesson.places) {
    const name = normalizeArabic(p.title);
    if (name && nq.includes(name)) return p;
    for (const a of p.aliases ?? []) {
      const na = normalizeArabic(a);
      if (na && nq.includes(na)) return p;
    }
  }
  const tokens = nq.split(/\s+/).filter(Boolean).filter((t) => t.length >= 3);
  if (!tokens.length) return null;
  let best: { p: Place; score: number } | null = null;
  for (const p of lesson.places) {
    const hay = normalizeArabic(`${p.title} ${(p.aliases ?? []).join(" ")}`);
    const score = tokens.slice(0, 6).reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
    if (score >= 2 && (!best || score > best.score)) best = { p, score };
  }
  return best?.p ?? null;
}

function replyForLesson(lesson: Lesson, q: string): Reply | null {
  const nq = normalizeArabic(q);
  const placeCount = lesson.places.length;
  const categories = new Map<string, number>();
  for (const p of lesson.places) categories.set(p.category, (categories.get(p.category) ?? 0) + 1);
  const topCats = [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const catSummary = topCats.length
    ? `أكثر الفئات ظهورًا: ${topCats.map(([k, v]) => `${labelByCat[k] ?? k} (${v})`).join(" • ")}.`
    : "";

  const wantsExplain = nq.includes("اشرح") || nq.includes("شرح") || nq.includes("تفصيل") || nq.includes("ملخص") || nq.includes("فكرة") || nq.includes("ببساطة");

  if (nq.includes("نسب") || nq.includes("ارقام") || nq.includes("أرقام") || nq.includes("شارت") || nq.includes("chart") || nq.includes("رسوم") || nq.includes("بيانات")) {
    return {
      text:
        "تمام! عندك لوحة (مؤشرات & رسومات) أسفل الخريطة: Pie لتوزيع الفئات، Bar لأكثر الفئات، و Line لتغيّر البيانات. الأرقام مرتبطة بالمعالم الظاهرة على الخريطة. إجمالي المعالم الآن: " +
        placeCount +
        ". " +
        catSummary +
        " غيّر الفلاتر وشوف الأرقام والرسوم تتغير فورًا.",
    };
  }

  if (wantsExplain && !nq.includes("اسمع") && !nq.includes("صوت")) {
    if (lesson.id === "water") {
      return {
        text:
          "أنا الخريطة الذكية وبشرحلك الدرس ببساطة: هو عن مصادر المياه في مصر (عذبة ومالحة) واستخداماتها. هتلاقي على الخريطة نهر النيل، بحيرة ناصر، والبحار. اختار أي مكان وأنا أوصلّك فوراً!",
      };
    }
    if (lesson.id === "minerals") {
      return {
        text:
          "الدرس ده عن كنوز مصر من المعادن (ذهب، فوسفات وحجر جيري) ومصادر الطاقة زي الشمس والرياح. اختار اسم أي منجم أو محطة طاقة وأنا هجري بيك هناك على الخريطة!",
      };
    }
    if (lesson.id === "projects") {
      return {
        text:
          "الدرس ده عن معجزات مصر الجديدة: العاصمة الإدارية، الدلتا الجديدة، وقناة السويس. كل دي مشاريع قومية بتبني مستقبلنا. قول اسم المشروع وأنا هوريك مكانه حالاً.",
      };
    }
    return {
      text:
        "أنا جاهز أشرحلك أي حاجة على الخريطة. جرّب تسألني (فين؟) أو (ليه مهم؟) لأي مكان.",
    };
  }

  if (nq.includes("صوت") || nq.includes("اتكلم") || nq.includes("تكلم")) {
    return {
      text:
        "أكيد! افتح بطاقة أي معلم وهتلاقي زر (اسمع الشرح 🔊). هقرأ لك كل المعلومات بصوتي العربي.",
    };
  }

  if (nq.includes("فيديو") || nq.includes("video") || nq.includes("يوتيوب")) {
    return {
      text:
        "طبعاً. لو المكان فيه فيديو هتلاقيه جوه البطاقة بتاعته. قولّي بس أي مكان وأنا هفتحلك بطاقته فوراً.",
    };
  }

  if (lesson.id === "water") {
    if (nq.includes("فرق") && (nq.includes("عذبه") || nq.includes("عذبة") || nq.includes("مالحه") || nq.includes("مالحة"))) {
      return {
        text:
          "الفرق بسيط: المياه العذبة للشرب والزراعة (زي النيل)، والمالحة للصيد والأملاح (زي البحار). تحب نروح للنيل دلوقتي؟",
        intent: { action: "flyTo", id: "nile" },
      };
    }
  }

  // Heuristic: pull bullets from concept cards
  const hits: string[] = [];
  for (const c of lesson.conceptCards) {
    for (const b of c.bullets) {
      const nb = normalizeArabic(b);
      const tokens = nq.split(/\s+/).filter(Boolean).slice(0, 6);
      const score = tokens.reduce((acc, t) => acc + (t.length >= 3 && nb.includes(t) ? 1 : 0), 0);
      if (score >= 2) hits.push(b);
    }
  }
  if (hits.length) return { text: "أقرب معلومة ليك: " + hits.slice(0, 2).join(" | ") };

  return null;
}

export default function ChatTutor(props: {
  lesson: Lesson;
  onNavigate: (placeId: string) => void;
  onEarnBadge: (badge: string) => void;
  onToast?: (title: string, body?: string) => void;
}) {
  const { lesson, onNavigate, onEarnBadge, onToast } = props;

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text:
        "أهلاً بك! أنا الخريطة الذكية والداشبورد التعليمي. 🌍✨ أنا هنا لأجيبك على أي تساؤل يدور في ذهنك حول الجغرافيا والمشاريع في مصر. اسألني (فين؟ ليه مهم؟ أرقام ونِسَب؟) وسأقوم بالرد عليك وإرشادك على الخريطة فوراً!",
    },
  ]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const quickChips = useMemo(() => {
    if (lesson.id === "projects")
      return [
        "اشرحلي الدرس ببساطة 📖",
        "يعني إيه تنمية مستدامة؟ 🌱",
        "إيه أثر المشروعات القومية؟ 🚀",
        "فين قناة السويس؟ 🚢",
        "ليه قناة السويس مهمة؟ 💰",
        "رؤية مصر 2030 🔮",
        "العاصمة الإدارية الجديدة 🏙️",
        "البرج الأيقوني 🗼",
        "مدينة العلمين الجديدة 🌊",
        "مشروع الدلتا الجديدة 🌾",
        "مستقبل الزراعة في مصر 🚜",
        "فين المونوريل؟ 🚆",
        "فين القطار الكهربائي؟ ⚡",
        "شبكة الطرق الجديدة 🛣️",
        "محطة الضبعة النووية ⚛️",
        "مشروع حياة كريمة ❤️",
        "تطوير القرى المصرية 🏡",
        "ورّيني بنبان ☀️",
        "أكبر محطة طاقة شمسية 🔋",
        "مشروع توشكى الخير 🌊",
        "مدينة الروبيكي للجلود 👞",
        "مدينة الأثاث بدمياط 🪑",
        "حقل ظهر للغاز 🔥",
        "فين مجمع الجلالة؟ ⛰️",
        "إزاي المشاريع بتوفر شغل؟ 👷",
        "أهمية الموانئ الجديدة 🏗️",
        "تصدير الغاز لأوروبا 🇪🇺",
        "الرقمنة والمدن الذكية 💻",
        "مستقبل النقل الأخضر 🍃",
        "عايز أرقام ونِسَب 📊",
        "ورّيني فيديو 🎬",
        "اسمع الشرح 🔊",
        "أهمية القطار السريع 🚄",
        "إنجازات مصر في الطاقة 💡",
        "فين مجمع الفيروز؟ 🐟",
        "مشروعات الاستزراع السمكي 🦐",
        "الهيدروجين الأخضر 🌱",
        "مستقبل الصناعة 🏭",
        "ليه بنبني مدن جديدة؟ 🏘️",
        "إزاي نحمي البيئة؟ 🌳",
      ];
    if (lesson.id === "minerals")
      return [
        "اشرحلي الموارد المعدنية ⛏️",
        "فرق فلزية ولافلزية؟ 💎",
        "طاقة متجددة في مصر؟ ☀️",
        "فين بنبان؟ 🔋",
        "فين الزعفرانة؟ 🎐",
        "طاقة الرياح في جبل الزيت 🌬️",
        "فين منجم السكري؟ 🟡",
        "قصة الذهب في مصر 🏺",
        "فين أبو طرطور؟ ⚪",
        "أهمية الفوسفات للزراعة 🌾",
        "فين واحات البحرية؟ ⛰️",
        "خام الحديد وأهميته 🏗️",
        "فين أبو زنيمة؟ 🪨",
        "معدن المنجنيز 🔩",
        "فين حقل ظهر؟ 🔥",
        "الغاز الطبيعي في المتوسط 🌊",
        "حقل بلاعيم للبترول ⛽",
        "البترول في خليج السويس 🛢️",
        "أهمية المعادن للاقتصاد 📈",
        "إزاي بنستخرج المعادن؟ 🚜",
        "فين الحديد والصلب؟ 🏭",
        "مناجم النحاس القديمة 🧱",
        "ثروات الصحراء الشرقية 🏜️",
        "ثروات شبه جزيرة سيناء 🏔️",
        "استخدامات الحجر الجيري ⚪",
        "الرخام والجرانيت المصري 🗿",
        "مستقبل الهيدروجين الأخضر 🧪",
        "تحويل مصر لمركز طاقة ⚡",
        "عايز أرقام ونِسَب 📊",
        "ورّيني فيديو 🎬",
        "اسمع الشرح 🔊",
        "أغنى منطقة بالمعادن 🗺️",
        "دور التكنولوجيا في التعدين 🦾",
        "ليه الطاقة مهمة؟ 💡",
        "ترشيد استهلاك الطاقة 📉",
        "المعادن والصناعات الثقيلة 🔨",
        "كنوز باطن الأرض 🌍",
        "حماية الثروة المعدنية 🛡️",
      ];
    return [
      "اشرحلي مصادر المياه 💧",
      "الفرق عذبة ومالحة؟ 🌊",
      "إيه استخدامات المياه؟ 🥛",
      "إيه مشاكل المياه؟ ⚠️",
      "إزاي نحافظ على المياه؟ 🛡️",
      "فين نهر النيل؟ 🛶",
      "عظمة النيل للمصريين 🇪🇬",
      "فين بحيرة ناصر؟ 🐊",
      "تخزين المياه خلف السد 🧱",
      "فين السد العالي؟ ⚡",
      "توليد الكهرباء من المياه 💡",
      "فين البحر المتوسط؟ 🏖️",
      "ثروات البحر المتوسط 🐟",
      "فين البحر الأحمر؟ 🐠",
      "الشعاب المرجانية 🪸",
      "فين بحيرة قارون؟ 🦆",
      "فين وادي الريان؟ 🛶",
      "شلالات وادي الريان 🌊",
      "فين ترعة السلام؟ 💦",
      "زراعة سيناء بالماء 🌱",
      "فين محطة بحر البقر؟ 🏭",
      "أكبر محطة معالجة مياه 🏆",
      "فين محطة الحمام؟ 🏗️",
      "محطات تحلية المياه 💧",
      "مشروع تبطين الترع 🧱",
      "توفير مياه الري 🌾",
      "المياه الجوفية 🏜️",
      "خزان الحجر الرملي النوبي 🚰",
      "الآبار والعيون في سيناء ⛰️",
      "واحة سيوة وعيونها 🌴",
      "خطر تلوث المياه ☣️",
      "إزاي نحمي النيل؟ 🧼",
      "ندرة المياه وتغير المناخ 🌡️",
      "عايز أرقام ونِسَب 📊",
      "ورّيني فيديو 🎬",
      "اسمع الشرح 🔊",
      "المياه ومستقبل مصر 🔝",
      "إعادة تدوير المياه ♻️",
      "الري بالرش والتنقيط ⛲",
      "أهمية محطات المعالجة 🛡️",
    ];
  }, [lesson.id]);
  // Riverside
  const botReply = (payload: Reply) => {
    setTyping(true);
    const id = window.setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: payload.text, intent: payload.intent }]);
      setTyping(false);
    }, 240);
    return () => window.clearTimeout(id);
  };

  const send = (q?: string) => {
    const msg = (q ?? text).trim();
    if (!msg) return;

    setMessages((m) => [...m, { role: "user", text: msg }]);
    setText("");

    const place = findPlace(lesson, msg);
    if (place) {
      onNavigate(place.id);
      onToast?.("انتقال للخريطة", `روّحتك لـ ${place.title}`);
      onEarnBadge("✨ معلومة: مستكشف الخرائط");
      botReply({ text: summarizePlace(place), intent: { action: "flyTo", id: place.id } });
      return;
    }

    const ans = replyForLesson(lesson, msg);
    if (ans) {
      if (ans.intent?.action === "flyTo" && ans.intent.id) onNavigate(ans.intent.id);
      onEarnBadge("💡 معلومة: سأل واتعلم");
      botReply(ans);
      return;
    }

    botReply({
      text:
        "مش فاهم قصدك بالكامل لسه. جرّب تكتب سؤالك بجملة كاملة أو اختار سؤال جاهز من فوق. ولو كتبت اسم مكان (زي بنبان/نهر النيل) هوديك له فوراً بسألتي الذكي.",
    });
  };

  const runIntent = (intent?: Intent) => {
    if (!intent?.action) return;
    if (intent.action === "flyTo" && intent.id) {
      onNavigate(intent.id);
      onToast?.("تم!", "نفذت الحركة على الخريطة");
    }
  };

  return (
    <div className="glass-deep rounded-[32px] p-5 shadow-2xl relative overflow-hidden h-full flex flex-col border border-white/10">
      <div className="glow-ring opacity-40" />

      <div className="flex items-center justify-between mb-2">
        <div className="zone-title !mb-0 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow animate-pulse" />
          المساعد الذكي (صوت الخريطة)
        </div>
        <div className="badge !px-3">FlyTo • AI</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[140px] pr-1 custom-scrollbar">
        {quickChips.map((c) => (
          <button key={c} className="btn text-[9px] px-2 py-1.5 leading-tight text-right hover:bg-white/5 transition-colors border-white/5" onClick={() => send(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 flex-1 overflow-auto rounded-2xl border border-white/5 bg-black/40 p-4 custom-scrollbar">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div className={m.role === "user" ? "inline-block rounded-2xl bg-white/10 px-4 py-2 text-sm border border-white/5" : "inline-block rounded-2xl bg-cyan-500/10 px-4 py-2 text-sm border border-cyan-500/20 text-cyan-50 shadow-sm"}>
                <Typewriter text={m.text} speed={m.role === "bot" ? 8 : 0} />
              </div>
              {m.role === "bot" && m.intent?.action === "flyTo" ? (
                <div className="mt-2">
                  <button className="btn-strong !text-[11px] !px-4 !py-1.5" onClick={() => runIntent(m.intent)}>
                    روح للمكان على الخريطة ➜
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          <AnimatePresence>
            {typing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-left">
                <div className="inline-block rounded-2xl bg-black/30 px-4 py-2 text-sm text-white/50 animate-pulse">… بكتب لك رد</div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <input
            className="input !rounded-2xl flex-1 bg-white/5 border-white/10 focus:bg-white/10 transition-all text-sm"
            placeholder="اسألني أي حاجة... (مثال: بنبان فين؟)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button className="btn-strong !rounded-2xl !px-6" onClick={() => send()}>
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
