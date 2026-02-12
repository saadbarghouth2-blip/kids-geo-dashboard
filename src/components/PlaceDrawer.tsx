import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Lesson, Place, PlaceCategory } from "../types";
import { resolvePlaceMedia } from "../utils/placeMedia";

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

type MediaTab = "images" | "videos";

function looksNativeVideo(src: string) {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(src);
}

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices?.() ?? [];
    const ar = voices.find((v) => (v.lang || "").toLowerCase().startsWith("ar"));
    if (ar) u.voice = ar;
    u.lang = ar?.lang || "ar-EG";
    u.rate = 1.02;
    u.pitch = 1.05;
    synth.speak(u);
  } catch {
    // ignore
  }
}

export default function PlaceDrawer(props: {
  lesson: Lesson;
  place: Place | null;
  discovered: Set<string>;
  onClose: () => void;
  onNavigateNext: () => void;
  autoSpeak: boolean;
  focusToken: number;
}) {
  const { place, onClose, onNavigateNext, discovered, autoSpeak, focusToken } = props;
  const [speaking, setSpeaking] = useState(false);
  const [mediaTab, setMediaTab] = useState<MediaTab>("images");
  const [imageIdx, setImageIdx] = useState(0);
  const [videoIdx, setVideoIdx] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set<string>());
  const metrics = place?.metrics;

  const media = useMemo(() => (place ? resolvePlaceMedia(place) : null), [place]);

  const images = useMemo(() => {
    if (!media?.images?.length) return [];
    return media.images.filter((src) => !failedImages.has(src));
  }, [media?.images, failedImages]);

  const videos = media?.videos ?? [];
  const currentImage = images[imageIdx] ?? images[0] ?? "";
  const currentVideo = videos[videoIdx] ?? videos[0] ?? "";

  useEffect(() => {
    setMediaTab("images");
    setImageIdx(0);
    setVideoIdx(0);
    setFailedImages(new Set<string>());
  }, [place?.id]);

  useEffect(() => {
    if (imageIdx >= images.length) setImageIdx(0);
  }, [images.length, imageIdx]);

  useEffect(() => {
    if (videoIdx >= videos.length) setVideoIdx(0);
  }, [videos.length, videoIdx]);

  useEffect(() => {
    if (mediaTab === "images" && !images.length && videos.length) setMediaTab("videos");
    if (mediaTab === "videos" && !videos.length && images.length) setMediaTab("images");
  }, [mediaTab, images.length, videos.length]);

  const speakText = useMemo(() => {
    if (!place) return "";
    const lines: string[] = [];
    lines.push(`أهلاً! أنت الآن عند: ${place.title}.`);
    lines.push(place.summary);
    for (const d of place.details ?? []) lines.push(d);
    lines.push("شاهد الصور والفيديو للتعرف على المكان بطريقة ممتعة.");
    return lines.join(" ");
  }, [place]);

  const onSpeak = () => {
    if (!place) return;
    if (speaking) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    speak(speakText);
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), 9000);
  };

  useEffect(() => {
    if (!autoSpeak || !place) {
      window.speechSynthesis?.cancel();
      setSpeaking(false);
      return;
    }
    speak(speakText);
    setSpeaking(true);
    const id = window.setTimeout(() => setSpeaking(false), 9000);
    return () => window.clearTimeout(id);
  }, [place?.id, autoSpeak, speakText, focusToken]);

  return (
    <AnimatePresence>
      {place ? (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
          className="absolute right-4 top-4 z-[999] w-[360px] max-w-[90vw] map-panel rounded-[26px] p-3 shadow-glow overflow-hidden scanline"
          dir="rtl"
        >
          <div className="glow-ring animate-pulseGlow" />
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-lg font-extrabold">{place.title}</div>
              <div className="text-xs text-white/80 mt-1">
                {discovered.has(place.id) ? "تم اكتشافه ✓" : "جديد ✨"}
                {typeof metrics?.importance === "number" ? ` • أهمية ${metrics.importance}/100` : ""}
              </div>
            </div>
            <button className="btn text-xs" onClick={onClose}>إغلاق</button>
          </div>

          <div className="mt-3 rounded-3xl border border-white/20 bg-slate-950/65 p-2">
            <div className="flex items-center gap-2">
              <button
                className={clsx("btn text-xs flex-1", mediaTab === "images" && "border-white/35 bg-white/15")}
                onClick={() => setMediaTab("images")}
              >
                صور ({images.length})
              </button>
              <button
                className={clsx("btn text-xs flex-1", mediaTab === "videos" && "border-white/35 bg-white/15")}
                onClick={() => setMediaTab("videos")}
              >
                فيديو ({videos.length})
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mediaTab === "images" ? (
                <motion.div
                  key="images"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-2"
                >
                  {currentImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-slate-900/80">
                      <img
                        src={currentImage}
                        alt={place.title}
                        className="w-full h-[180px] object-cover"
                        loading="lazy"
                        onError={() => {
                          setFailedImages((prev) => {
                            const next = new Set(prev);
                            next.add(currentImage);
                            return next;
                          });
                        }}
                      />
                      {images.length > 1 ? (
                        <>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 btn !px-2 !py-1 text-xs"
                            onClick={() => setImageIdx((v) => (v - 1 + images.length) % images.length)}
                          >
                            ‹
                          </button>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 btn !px-2 !py-1 text-xs"
                            onClick={() => setImageIdx((v) => (v + 1) % images.length)}
                          >
                            ›
                          </button>
                        </>
                      ) : null}
                      <div className="absolute bottom-2 left-2 badge !text-[10px] !py-0.5">
                        صورة {Math.min(imageIdx + 1, images.length)} / {images.length}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-3 text-xs text-white/80">
                      لا توجد صور متاحة الآن لهذا المعلم.
                    </div>
                  )}

                  {images.length > 1 ? (
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          className={clsx(
                            "h-2.5 rounded-full transition-all",
                            i === imageIdx ? "w-6 bg-white/90" : "w-2.5 bg-white/35 hover:bg-white/60"
                          )}
                          onClick={() => setImageIdx(i)}
                          aria-label={`صورة ${i + 1}`}
                        />
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="videos"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-2"
                >
                  {currentVideo ? (
                    <div className="rounded-2xl overflow-hidden border border-white/15 bg-slate-900/80">
                      {looksNativeVideo(currentVideo) ? (
                        <video className="w-full h-[180px] object-cover" src={currentVideo} controls />
                      ) : (
                        <iframe
                          className="w-full h-[180px]"
                          src={currentVideo}
                          title={`${place.title} video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-3 text-xs text-white/80">
                      لا يوجد فيديو متاح الآن لهذا المعلم.
                    </div>
                  )}
                  {videos.length > 1 ? (
                    <div className="mt-2 flex items-center gap-2 overflow-auto pb-1">
                      {videos.map((_, i) => (
                        <button
                          key={i}
                          className={clsx("btn text-[11px] whitespace-nowrap", i === videoIdx && "border-white/35 bg-white/15")}
                          onClick={() => setVideoIdx(i)}
                        >
                          فيديو {i + 1}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 text-sm text-white/95 leading-relaxed">{place.summary}</div>

          {place.details?.length ? (
            <ul className="mt-2 text-sm text-white/90 list-disc pr-5 space-y-1">
              {place.details.slice(0, 5).map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="panel-title">إحداثيات</div>
              <div className="font-extrabold mt-1 text-sm">
                {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="panel-title">نوع</div>
              <div className="font-extrabold mt-1 text-sm">{labelByCat[place.category] ?? place.category}</div>
            </div>
          </div>

          {typeof metrics?.importance === "number" ? (
            <div className="mt-3 rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>الأهمية</span>
                <span>{metrics.importance} / 100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${metrics.importance}%` }} />
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2">
            <button className="btn flex-1" onClick={onSpeak}>{speaking ? "إيقاف الصوت" : "اسمع الشرح 🔊"}</button>
            <button className="btn-strong flex-1" onClick={onNavigateNext}>المعلم التالي ➜</button>
          </div>

          {media?.source ? (
            <div className="mt-2 text-[11px] text-white/70">
              مصدر الوسائط:{" "}
              <a
                className="underline decoration-white/30 hover:decoration-white/70"
                href={media.source}
                target="_blank"
                rel="noreferrer"
              >
                {media.attribution ?? "فتح المصدر"}
              </a>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

