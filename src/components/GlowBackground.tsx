import { motion } from "framer-motion";
import ParticlesCanvas from "./ParticlesCanvas";

export default function GlowBackground() {
  return (
    <div className="absolute inset-0 -z-10 bg-aurora animate-shimmer overflow-hidden">
      <div className="absolute inset-0 pattern-overlay" />
      <ParticlesCanvas />
      {/* floating glow blobs */}
      <motion.div
        className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.8), transparent 55%)",
        }}
        animate={{ x: [0, 40, -20, 0], y: [0, 20, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-24 -right-28 h-[520px] w-[520px] rounded-full blur-3xl opacity-35"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(34,197,94,0.75), transparent 55%)",
        }}
        animate={{ x: [0, -30, 10, 0], y: [0, 25, -10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 left-[25%] h-[520px] w-[520px] rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, rgba(236,72,153,0.8), transparent 55%)",
        }}
        animate={{ x: [0, 15, -25, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
