import { icons, type IconName as DsIconName } from "./icons";
import { localIcons, type LocalIconName } from "./local";

const all: Record<string, { viewBox: string; body: string }> = { ...icons, ...localIcons };

export type IconName = DsIconName | LocalIconName;

type Props = { name: IconName; size?: number; color?: string; className?: string };

/** Field DS icon (plus a couple of local glyphs), inlined so it inherits `currentColor`. */
export function Icon({ name, size = 24, color, className }: Props) {
  const icon = all[name];
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="none"
      aria-hidden="true"
      style={color ? { color } : undefined}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}
