/**
 * Glyphs that are NOT in @field-ds/icons.
 *
 * `local-dirham` — the new UAE dirham mark the Figma frames use for prices.
 * It ships inside noon's private font, so there is no Unicode codepoint that
 * renders reliably on the web; drawn here instead of faking it with "Ð".
 */
export const localIcons = {
  "local-dirham": {
    viewBox: "0 0 24 24",
    body: `<g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none">
      <path d="M9.4 4.5 V19.5" />
      <path d="M9.4 4.5 H12.6 C17 4.5 19.7 7.9 19.7 12 C19.7 16.1 17 19.5 12.6 19.5 H9.4" />
      <path d="M4.3 9.6 H13.2" />
      <path d="M4.3 14.6 H13.2" />
    </g>`,
  },
} as const;

export type LocalIconName = keyof typeof localIcons;
