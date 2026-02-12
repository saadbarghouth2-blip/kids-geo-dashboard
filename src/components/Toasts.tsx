import { AnimatePresence, motion } from "framer-motion";

export type Toast = { id: string; title: string; body?: string };

export default function Toasts(props: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-20 z-[9999] w-[320px] space-y-2">
      <AnimatePresence>
        {props.toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="glass rounded-3xl p-3 shadow-soft relative overflow-hidden scanline"
          >
            <div className="glow-ring" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-extrabold text-sm">{t.title}</div>
                {t.body ? <div className="text-xs text-white/75 mt-1">{t.body}</div> : null}
              </div>
              <button className="btn text-xs" onClick={() => props.onDismiss(t.id)}>إغلاق</button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
