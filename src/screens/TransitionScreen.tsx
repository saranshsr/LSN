import { useEffect, useRef } from "react";

import { StatusBar } from "../components/chrome";

/** Safety net: if autoplay is blocked, don't strand the flow on a still frame. */
const CLIP_MS = 2350;

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
export function TransitionScreen({ onDone }: { onDone: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onDone();
    };
    video.current?.play().catch(() => {});
    const t = setTimeout(finish, CLIP_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="screen screen--transition">
      <video
        ref={video}
        className="transition-video"
        src="/media/hala-morph.mp4"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <StatusBar />
    </div>
  );
}
