import { useEffect, useRef } from "react";

import { StatusBar } from "../components/chrome";
import type { Locale } from "../data/copy";


/**
 * The beat that covers the relaunch: the rebrand wordmark morph ("morph
 * iteration - 7 (rebrand)", 24 Sep). Into Arabic, Hala grows in and curls into
 * هلا, two sparkles twinkle and go. Back to English, the same clip runs in
 * reverse — هلا uncurls into Hala — so both directions speak one motion
 * language (the shipped app's two recordings are retired here).
 *
 * The clip never fades its wordmark; the screen layer's relaunch fade carries
 * it out into the skeleton.
 */
const CLIPS: Record<Locale, { src: string; ms: number }> = {
  // Motion done by 2.02 s; leave at 2.5 s, a beat to read هلا.
  ar: { src: "/media/hala-morph-rebrand.mp4", ms: 2500 },
  // 0.28–2.10 s reversed (1.82 s), then Hala held; leave at 2.3 s.
  en: { src: "/media/hala-morph-rebrand-back.mp4", ms: 2300 },
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
