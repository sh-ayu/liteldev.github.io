import { useEffect, useState } from 'react';
import {
  choosePlatform,
  currentPlatformChoice,
  devicePlatformChoice,
  matchPlatform,
  onPlatformChoice,
  platformName,
  type PlatformChoice,
} from '../docs/shared/platform';

// The platform picker of an app: buttons for the platforms (or operating system + architecture targets) that some
// content differs for, the visitor's choice selected — the same choice as the docs' platform tabs (?platform=, then
// the choice remembered in `levimc_platform`, then the device: docs/shared/platform.ts). Every picker,
// usePlatformChoice() and platform tab set on the page follows the latest pick.

export { choosePlatform };

/**
 * The option of `options` to show for the visitor: undefined until hydrated (the prerendered page shows the
 * author's default), then their platform (with the architecture the browser reports, where it does), and whatever
 * they pick afterwards. `fallback` when none of the options fits.
 */
export function usePlatformChoice<T extends PlatformChoice>(options: readonly T[], fallback?: T): [T | undefined, (p: T) => void] {
  const [choice, setChoice] = useState<PlatformChoice | null>(); // undefined: not hydrated yet; null: unknown device
  useEffect(() => {
    let alive = true;
    setChoice(currentPlatformChoice() ?? null);
    const off = onPlatformChoice((p) => setChoice(p));
    void devicePlatformChoice().then(() => {
      if (alive) setChoice(currentPlatformChoice() ?? null);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);
  const n = choice ? matchPlatform(options, choice) : -1;
  const selected = choice === undefined ? undefined : n >= 0 ? options[n] : fallback;
  return [selected, choosePlatform];
}

export interface PlatformPickerProps<T extends PlatformChoice> {
  /** The platforms or targets to offer, in order. */
  options: readonly T[];
  /** The selected one (usePlatformChoice); none selected while undefined. */
  value: T | undefined;
  onChange: (p: T) => void;
  /** Accessible name of the group ("Your system"). */
  label: string;
  /** Language of the button labels (platformName): `en`, `zh-Hans`, `zh-Hant`. */
  lang?: string;
  /** Button labels instead of platformName(option, lang). */
  names?: Partial<Record<T, string>>;
  className?: string;
}

/** A hotbar of toggle buttons, one per platform (aria-pressed on the selected one). */
export function PlatformPicker<T extends PlatformChoice>({ options, value, onChange, label, lang = 'en', names, className }: PlatformPickerProps<T>) {
  return (
    <div className={className ? `hotbar kit-platform-picker ${className}` : 'hotbar kit-platform-picker'} role="group" aria-label={label}>
      {options.map((p) => (
        <button key={p} type="button" aria-pressed={p === value} data-platform={p} onClick={() => onChange(p)}>
          {names?.[p] ?? platformName(p, lang)}
        </button>
      ))}
    </div>
  );
}
