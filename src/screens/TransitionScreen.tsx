import { useEffect, useRef } from "react";

import { StatusBar } from "../components/chrome";
import type { Locale } from "../data/copy";


/**
 * The beat that covers the relaunch: the splash (25 Sep, "Hala to Arabic" and
 * "Arabic to Hala", 1080 × 2338). Each starts on white, grows its wordmark in,
 * morphs Hala ⇄ هلا with two sparkles, holds, and fades back to white by
 * 2.95 s — so it opens out of the fading results and hands over to the
 * skeleton on white, with nothing to cross-fade.
 */
const CLIPS: Record<Locale, { src: string; ms: number }> = {
  ar: { src: "/media/splash-to-ar.mp4", ms: 2950 },
  en: { src: "/media/splash-to-en.mp4", ms: 2950 },
};

export function TransitionScreen({ to, onDone }: { to: Locale; onDone: () => void }) {
  const clip = CLIPS[to];
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);

  // Latest callback in a ref, so a re-render can never restart the clip timer.
  const cb = useRef(onDone);
  cb.current = onDone;

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      cb.current();
    };
    video.current?.play().catch(() => {});
    const t = setTimeout(finish, clip.ms);
    return () => clearTimeout(t);
  }, [clip.ms]);

  return (
    <div className="screen screen--transition screen--rebrand">
      <video
        ref={video}
        className="transition-video"
        key={clip.src}
        src={clip.src}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <StatusBar />
    </div>
  );
}
