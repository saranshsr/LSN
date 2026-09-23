import { StatusBar } from "../components/chrome";

/**
 * What the app shows while it comes back up in Arabic.
 *
 * Built to the same geometry as the real PLP — search bar 351 × 44 at y53,
 * chips at y115, grid from y163 with 171.5 × 421.33 cards on an 8px gutter —
 * so the content lands exactly where its placeholder was, with nothing
 * shifting. Fills are `colour/surface/muted`; the sweep runs right to left on
 * a 1.27s period, both measured off the real app's recording.
 */
export function SkeletonScreen() {
  return (
    <div className="screen screen--skeleton">
      <StatusBar />

      <div className="sk-body">
        <div className="sk sk-searchbar" />

        <div className="sk-chips">
          {[75, 71, 97, 99, 108].map((w, i) => <div className="sk sk-chip" key={i} style={{ width: w }} />)}
        </div>

        <div className="sk-grid">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>

        {/* One band over everything: on white it is invisible, on the
            placeholders it lifts #eaecf0 toward #f2f3f7. One GPU transform
            instead of a gradient animating on thirty elements. */}
        <div className="sk-shimmer" aria-hidden="true" />
      </div>

      <div className="sk-nav">
        <div className="sk-nav-row">
          {[0, 1, 2, 3, 4].map((i) => (
            <div className="sk-nav-item" key={i}>
              <div className="sk sk-nav-icon" />
              <div className="sk sk-nav-label" />
            </div>
          ))}
        </div>
        <div className="homebar" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="sk-card">
      <div className="sk sk-card-image" />
      <div className="sk sk-card-strip" />
      <div className="sk-card-body">
        <div className="sk sk-line" style={{ width: 155.5, height: 12 }} />
        <div className="sk sk-line" style={{ width: 109, height: 12, marginTop: 8 }} />
        <div className="sk sk-line" style={{ width: 56, height: 16, marginTop: 10, borderRadius: 8 }} />
        <div className="sk sk-line" style={{ width: 88, height: 16, marginTop: 10 }} />
        <div className="sk sk-line" style={{ width: 130, height: 12, marginTop: 10 }} />
        <div className="sk sk-line" style={{ width: 110, height: 16, marginTop: 10 }} />
        <div className="sk sk-line" style={{ width: 96, height: 14, marginTop: 10 }} />
      </div>
    </div>
  );
}
