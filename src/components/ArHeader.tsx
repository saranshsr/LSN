import { SearchBar } from "./SearchBar";

/**
 * The Arabic results header with no nudge: the bar alone, full width, exactly
 * where the skeleton's bar was, so nothing jumps when the results land.
 */
export function ArHeader({ query }: { query: string }) {
  return (
    <header className="plp-header plp-header--plain plp-header--ar">
      <div className="plp-row plp-row--ar ar-row">
        <SearchBar query={query} back />
      </div>
    </header>
  );
}
