import { useEffect, useRef } from "react";

import { StatusBar } from "../components/chrome";
import type { Locale } from "../data/copy";


/**
 * The beat that covers the relaunch — the shipped app's own Hala → هلا
 * wordmark morph, from a screen recording of the real thing (16 Sep).
 *
 * The clip is cut at 2.35s, the exact frame the wordmark finishes fading out.
 * The real recording then sits blank for another 580ms before its skeleton
 * appears; that dead air is trimmed and the prototype's own skeleton picks up
 * immediately instead.
 *
 * Our status bar is drawn over the recording's, which carries the capture's
 * own clock, Dynamic Island and battery.
 */
/** Each direction has its own recording of the shipped app's wordmark morph,
 *  both cut at the frame the wordmark finishes fading (2.35 s and 2.40 s). */
const CLIPS: Record<Locale, { src: string; ms: number }> = {
  ar: { src: "/media/hala-morph.mp4", ms: 2350 },
  en: { src: "/media/hala-morph-back.mp4", ms: 2400 },
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
    <div className="screen screen--transition">
      <video
        ref={video}
        className="transition-video"
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
