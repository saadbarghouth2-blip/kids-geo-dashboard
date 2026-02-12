import { useEffect, useMemo, useState } from "react";

export default function Typewriter(props: { text: string; speed?: number; onDone?: () => void }) {
  const { text, speed = 14, onDone } = props;
  const [i, setI] = useState(0);

  const done = useMemo(() => i >= text.length, [i, text.length]);

  useEffect(() => { setI(0); }, [text]);

  useEffect(() => {
    if (done) { onDone?.(); return; }
    const t = window.setTimeout(() => setI((x) => x + 1), speed);
    return () => window.clearTimeout(t);
  }, [done, speed, onDone]);

  return <span>{text.slice(0, i)}</span>;
}
