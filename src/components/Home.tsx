import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { Lesson } from "../types";

export default function Home(props: { lessons: Lesson[]; onOpen: (id: string) => void }) {
  const { lessons, onOpen } = props;
  const totalPlaces = useMemo(() => lessons.reduce((acc, l) => acc + l.places.length, 0), [lessons]);
  const totalActivities = useMemo(() => lessons.reduce((acc, l) => acc + l.activities.length, 0), [lessons]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // More floating emojis for extra fun
  const floatingEmojis = ["🗺️", "🌍", "⭐", "🎯", "🏆", "💎", "🌊", "⛰️", "🌴", "🏭", "🚀", "✨", "🎨", "🌟", "💫", "🔥", "⚡", "🎪", "🎭", "🎨"];

  return (
    <div className="h-full grid place-items-center relative overflow-hidden">
      {/* Multiple Layers of Animated Background Elements */}

      {/* Layer 1: Floating Emojis */}
      {floatingEmojis.map((emoji, idx) => (
        <motion.div
          key={`emoji-${idx}`}
          className="absolute text-4xl opacity-20 pointer-events-none"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
          }}
          animate={{
            y: [null, -100, 20, -60, 0],
            x: [null, 40, -20, 30, 0],
            rotate: [0, 360, -180, 180, 0],
            scale: [1, 1.3, 0.8, 1.2, 1],
          }}
          transition={{
            duration: 8 + idx * 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            delay: idx * 0.3,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Layer 2: Twinkling Stars */}
      {Array.from({ length: 30 }).map((_, idx) => (
        <motion.div
          key={`star-${idx}`}
          className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Layer 3: Moving Circles */}
      {Array.from({ length: 8 }).map((_, idx) => (
        <motion.div
          key={`circle-${idx}`}
          className="absolute rounded-full border-2 border-cyan-400/20 pointer-events-none"
          style={{
            width: `${100 + idx * 50}px`,
            height: `${100 + idx * 50}px`,
            left: `${20 + idx * 10}%`,
            top: `${10 + idx * 8}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 10 + idx * 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Layer 4: Floating Particles */}
      {Array.from({ length: 20 }).map((_, idx) => (
        <motion.div
          key={`particle-${idx}`}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -300, 0],
            x: [0, Math.random() * 100 - 50],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-6 px-4" dir="rtl">
        {/* Welcome Card with MEGA Animations */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            duration: 1,
            bounce: 0.4,
          }}
          className="lg:col-span-5 glass rounded-[34px] p-6 shadow-2xl relative overflow-hidden text-right border-2 border-white/20"
        >
          {/* Mega Animated Gradient Background */}
          <motion.div
            className="glow-ring opacity-40"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.6, 0.2],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          />

          {/* Additional rotating gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 pointer-events-none"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
            }}
          />

          {/* Super Bouncing Badge */}
          <motion.div
            className="badge mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 inline-block relative z-10"
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.span>
            {" ابدأ الرحلة "}
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.span>
          </motion.div>

          {/* Rainbow Animated Title with Waves */}
          <motion.div
            className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent relative z-10"
            animate={{
              backgroundPosition: ["0%", "200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{ backgroundSize: "200% auto" }}
          >
            {["🌟", " ", "ر", "ح", "ل", "ة", " ", "ا", "ل", "ت", "ع", "ل", "م", " ", "ا", "ل", "ت", "ف", "ا", "ع", "ل", "ي", "ة", " ", "🌟"].map((char, idx) => (
              <motion.span
                key={idx}
                className="inline-block"
                animate={{
                  y: [0, -8, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: idx * 0.05,
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>

          <motion.div
            className="mt-3 text-base text-white/90 leading-relaxed relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            اكتشف كنوز مصر من خلال خريطة تفاعلية مليانة مغامرات ومعلومات! 🚀
          </motion.div>

          {/* Super Animated Feature Cards */}
          <motion.div
            className="mt-5 rounded-3xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 relative z-10 overflow-hidden"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Wave effect background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            <div className="font-extrabold text-lg flex items-center gap-2 relative z-10">
              <motion.span
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚡
              </motion.span>
              مميزات رهيبة
              <motion.span
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ✨
              </motion.span>
            </div>
            <ul className="text-sm text-white/90 mt-3 space-y-2 relative z-10">
              {[
                { text: "🗺️ خريطة تفاعلية مع علامات متحركة", icon: "🗺️" },
                { text: "🎨 أدوات رسم وقياس المسافات", icon: "🎨" },
                { text: "🤖 مساعد ذكي يشرحلك ويوديك للمعالم", icon: "🤖" },
                { text: "🎮 ألعاب وأنشطة تعليمية ممتعة", icon: "🎮" }
              ].map((feature, idx) => (
                <motion.li
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/15 transition-colors"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + idx * 0.15 }}
                  whileHover={{ x: 10, scale: 1.05 }}
                >
                  <motion.span
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: idx * 0.2,
                    }}
                  >
                    {feature.icon}
                  </motion.span>
                  {feature.text.replace(feature.icon + " ", "")}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Super Animated Stats */}
          <motion.div
            className="grid grid-cols-3 gap-3 mt-5 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {[
              { label: "عدد الدروس", value: lessons.length, emoji: "📚", color: "from-pink-500 to-rose-500" },
              { label: "المعالم", value: totalPlaces, emoji: "🏛️", color: "from-cyan-500 to-blue-500" },
              { label: "الأنشطة", value: totalActivities, emoji: "🎯", color: "from-green-500 to-emerald-500" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className={`rounded-2xl border-2 border-white/20 bg-gradient-to-br ${stat.color} bg-opacity-20 p-3 text-center relative overflow-hidden`}
                whileHover={{
                  scale: 1.15,
                  rotate: [0, -8, 8, 0],
                }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: idx * 0.4,
                  }}
                />
                <motion.div
                  className="text-2xl relative z-10"
                  animate={{
                    scale: [1, 1.4, 1],
                    rotate: [0, 15, -15, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: idx * 0.4,
                  }}
                >
                  {stat.emoji}
                </motion.div>
                <div className="text-xs text-white/80 mt-1 relative z-10">{stat.label}</div>
                <motion.div
                  className="text-2xl font-extrabold mt-1 relative z-10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    delay: 1 + idx * 0.15,
                    bounce: 0.6,
                  }}
                >
                  {stat.value}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Lesson Cards with MEGA Enhanced Animations */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-5">
          {lessons.map((l, idx) => {
            const colors = [
              { from: "from-blue-500/20", to: "to-cyan-500/20", border: "border-blue-500/40", glow: "shadow-blue-500/50", accent: "blue" },
              { from: "from-purple-500/20", to: "to-pink-500/20", border: "border-purple-500/40", glow: "shadow-purple-500/50", accent: "purple" },
              { from: "from-green-500/20", to: "to-emerald-500/20", border: "border-green-500/40", glow: "shadow-green-500/50", accent: "green" },
            ];
            const colorScheme = colors[idx % colors.length];

            return (
              <motion.button
                key={l.id}
                initial={{ opacity: 0, y: 100, rotateX: -30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                transition={{
                  delay: idx * 0.25,
                  type: "spring",
                  stiffness: 80,
                  damping: 12,
                }}
                whileHover={{
                  y: -15,
                  scale: 1.05,
                  rotateY: 3,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onOpen(l.id)}
                onHoverStart={() => setHoveredCard(l.id)}
                onHoverEnd={() => setHoveredCard(null)}
                className={`text-right glass rounded-[34px] p-6 shadow-2xl relative overflow-hidden border-2 ${colorScheme.border} ${hoveredCard === l.id ? colorScheme.glow + ' shadow-2xl' : ''} focus-ring transition-all duration-300`}
              >
                {/* Mega Animated Background Gradient */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${colorScheme.from} ${colorScheme.to} opacity-0`}
                  animate={{
                    opacity: hoveredCard === l.id ? 0.8 : 0,
                  }}
                />

                {/* Ripple effect on hover */}
                {hoveredCard === l.id && (
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}

                <motion.div
                  className="glow-ring"
                  animate={{
                    scale: hoveredCard === l.id ? 1.5 : 1,
                    opacity: hoveredCard === l.id ? 0.8 : 0.3,
                    rotate: hoveredCard === l.id ? 360 : 0,
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: hoveredCard === l.id ? Infinity : 0, ease: "linear" }
                  }}
                />

                {/* Super Bouncing Badge */}
                <motion.div
                  className="badge mb-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-900 font-bold relative z-10"
                  animate={{
                    rotate: hoveredCard === l.id ? [0, -15, 15, -10, 10, 0] : 0,
                    scale: hoveredCard === l.id ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.6, repeat: hoveredCard === l.id ? Infinity : 0 }}
                >
                  <motion.span
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    ⭐
                  </motion.span>
                  {" الدرس " + (idx + 1)}
                </motion.div>

                <motion.div
                  className="text-2xl font-extrabold relative z-10"
                  animate={{
                    scale: hoveredCard === l.id ? 1.08 : 1,
                  }}
                >
                  {l.title}
                </motion.div>

                {l.ageHint ? (
                  <motion.div
                    className="text-xs text-white/80 mt-2 relative z-10"
                    animate={{
                      opacity: hoveredCard === l.id ? 1 : 0.7,
                    }}
                  >
                    {l.ageHint}
                  </motion.div>
                ) : null}

                <div className="mt-4 text-sm text-white/85 leading-relaxed relative z-10">
                  {l.objectives.slice(0, 2).map((o, oIdx) => (
                    <motion.div
                      key={o}
                      className="flex items-start gap-2 mb-1"
                      whileHover={{ x: 8 }}
                      animate={{
                        x: hoveredCard === l.id ? [0, 5, 0] : 0,
                      }}
                      transition={{
                        x: { duration: 1, delay: oIdx * 0.1, repeat: hoveredCard === l.id ? Infinity : 0 }
                      }}
                    >
                      <motion.span
                        className="text-cyan-400"
                        animate={{
                          scale: hoveredCard === l.id ? [1, 1.3, 1] : 1,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: oIdx * 0.2,
                          repeat: hoveredCard === l.id ? Infinity : 0,
                        }}
                      >
                        ✓
                      </motion.span>
                      <span>{o}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 relative z-10">
                  {[
                    { label: `${l.places.length} معلم`, emoji: "🗺️" },
                    { label: `${l.activities.length} نشاط`, emoji: "🎮" },
                    { label: "تفاعلي", emoji: "⚡" },
                  ].map((badge, badgeIdx) => (
                    <motion.span
                      key={badgeIdx}
                      className="badge bg-white/10 border border-white/20"
                      whileHover={{
                        scale: 1.15,
                        backgroundColor: "rgba(255,255,255,0.25)",
                      }}
                      animate={{
                        y: hoveredCard === l.id ? [0, -3, 0] : 0,
                      }}
                      transition={{
                        y: {
                          duration: 1.5,
                          delay: badgeIdx * 0.1,
                          repeat: hoveredCard === l.id ? Infinity : 0,
                        }
                      }}
                    >
                      <motion.span
                        animate={{
                          rotate: hoveredCard === l.id ? [0, 20, -20, 0] : 0,
                        }}
                        transition={{
                          duration: 1,
                          delay: badgeIdx * 0.15,
                          repeat: hoveredCard === l.id ? Infinity : 0,
                        }}
                      >
                        {badge.emoji}
                      </motion.span>
                      {" " + badge.label}
                    </motion.span>
                  ))}
                </div>

                <motion.div
                  className="mt-5 relative z-10"
                  animate={{
                    x: hoveredCard === l.id ? 12 : 0,
                  }}
                >
                  <span className="btn-strong inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-base relative overflow-hidden">
                    {hoveredCard === l.id && (
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    )}
                    <span className="relative z-10">ابدأ الآن</span>
                    <motion.span
                      className="relative z-10"
                      animate={{
                        x: hoveredCard === l.id ? [0, 8, 0] : 0,
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: hoveredCard === l.id ? Infinity : 0,
                      }}
                    >
                      ➜
                    </motion.span>
                  </span>
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
