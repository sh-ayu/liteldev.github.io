import { useId, useState } from "react";
import { BrandIcon, PixelIcon } from "../kit-ui";
import { formatNumber, useI18n } from "../i18n";
import {
  buildModUrl,
  deepLink,
  getAllVersions,
  getReleaseUrl,
  getSortedVariants,
  getVersionsForVariant,
  installAppsFor,
  isPrerelease,
  type InstallApp,
  type ModSelection,
  type ModTab,
} from "../lib/mods";
import type { RawModEntry, ReleaseInfo, VersionTarget } from "../types";
import { HotbarRadio } from "./hotbar-radio";
import { InstallCommand } from "./install-commands";
import { RouterLink } from "./router-link";

/** The apps' names, as their projects write them. */
export const APP_NAMES: Record<InstallApp, string> = { lip: "lip", levilauncher: "LeviLauncher" };

/**
 * The version a variant is installed at by default, for the "Latest" mark: its
 * newest release, else (only pre-releases) its newest version.
 */
export function latestVersionOf(mod: RawModEntry, variant: string): string | undefined {
  const versions = getVersionsForVariant(mod, variant);
  return versions.filter((v) => !isPrerelease(v)).at(-1) ?? versions.at(-1);
}

/**
 * After a deep link was followed, where to get the app: a page cannot tell
 * whether a protocol handler is installed, so it never blocks or guesses — it
 * only says what to do when nothing opened. A live region, so it is announced.
 */
function DeepLinkHint({ app }: { app: InstallApp | null }) {
  const { t } = useI18n();
  return (
    <p className="mods-deeplink-hint" role="status">
      {app ? (
        <>
          {t.deepLinkMissing}{" "}
          <a href={app === "lip" ? t.getLipUrl : t.getLeviLauncherUrl} target="_blank" rel="noopener noreferrer">
            {app === "lip" ? t.getLip : t.getLeviLauncher}
          </a>
        </>
      ) : null}
    </p>
  );
}

interface InstallButtonsProps {
  modId: string;
  selection: ModSelection;
  /** The sides the selected version runs on (`undefined`: unknown, both apps are offered). */
  side: readonly string[] | undefined;
  /** The header's large buttons, or the install panel's full-width ones. */
  layout: "header" | "panel";
}

/**
 * "Install with LeviLauncher" (client) and/or "Install with lip" (server) for
 * the page's selection: plain links to the deep links, so they work before
 * the page hydrates; both look the same, as neither is the lesser way. Followed, they show
 * {@link DeepLinkHint}.
 */
export function InstallButtons({ modId, selection, side, layout }: InstallButtonsProps) {
  const { t } = useI18n();
  const [followed, setFollowed] = useState<InstallApp | null>(null);
  const apps = installAppsFor(side);
  return (
    <div className={`mods-install-actions mods-install-actions-${layout}`}>
      <div className="mods-install-links">
        {apps.map((app) => (
          <a
            key={app}
            className={`mc-btn mc-btn-primary${layout === "header" ? " mc-btn-lg" : ""} mods-install-btn`}
            href={deepLink(app, modId, selection.variant, selection.version)}
            data-app={app}
            onClick={() => setFollowed(app)}
          >
            <PixelIcon name="pickaxe" />
            {t.installWith(APP_NAMES[app])}
          </a>
        ))}
      </div>
      <DeepLinkHint app={followed} />
    </div>
  );
}

interface InstallPanelProps {
  modId: string;
  mod: RawModEntry;
  repository: string;
  selection: ModSelection;
  tab: ModTab;
  releases: Record<string, ReleaseInfo>;
  targets: Record<string, Record<string, VersionTarget>>;
  /** Makes another variant or version the page's selection (its URL). */
  onSelect: (selection: ModSelection) => void;
}

/**
 * The one place the page's selection is picked: the variant and version (the
 * URL's `?variant=&version=`), then everything that installs it — the deep
 * links, the `lip install` command (a version with a server entry) and its
 * GitHub release. The header's buttons and the Versions tab act on the same
 * selection.
 */
export function InstallPanel({ modId, mod, repository, selection, tab, releases, targets, onSelect }: InstallPanelProps) {
  const { t, locale } = useI18n();
  const versionId = useId();
  const variants = getSortedVariants(mod);
  const versions = getVersionsForVariant(mod, selection.variant).slice().reverse();
  const latest = latestVersionOf(mod, selection.variant);
  const target = targets[selection.variant]?.[selection.version];
  const server = installAppsFor(target?.side).includes("lip");
  const label = (v: string) => (v === "" ? t.defaultVariant : v);
  const optionLabel = (v: string) => `${v}${v === latest ? ` (${t.latest})` : isPrerelease(v) ? ` (${t.prerelease})` : ""}`;
  return (
    // the old page's Install heading id, so #mods-install-title links still land here
    <section className="px-card mods-panel mods-side-panel mods-install-panel" aria-labelledby="mods-install-title">
      <h2 id="mods-install-title" className="mods-panel-title">
        <PixelIcon name="pickaxe" />
        {t.install}
      </h2>
      {variants.length > 1 ? (
        <div className="mods-install-field">
          {/* ids of the old sidebar's Variants and Versions panels, for their #links */}
          <span id="mods-variants-title" className="mods-install-label" aria-hidden="true">
            {t.variant}
          </span>
          <HotbarRadio
            label={t.variant}
            className="mods-install-variants"
            options={variants.map((v) => ({ value: v, label: label(v) }))}
            value={selection.variant}
            onChange={(variant) => {
              const own = getVersionsForVariant(mod, variant);
              onSelect({ variant, version: own.includes(selection.version) ? selection.version : (latestVersionOf(mod, variant) ?? "") });
            }}
          />
        </div>
      ) : null}
      <div className="mods-install-field">
        <label id="mods-versions-title" className="mods-install-label" htmlFor={versionId}>
          {t.version}
        </label>
        <select
          id={versionId}
          className="mc-input mods-install-select"
          value={selection.version}
          onChange={(e) => onSelect({ variant: selection.variant, version: e.target.value })}
        >
          {versions.map((v) => (
            <option key={v} value={v}>
              {optionLabel(v)}
            </option>
          ))}
        </select>
      </div>
      <InstallButtons modId={modId} selection={selection} side={target?.side} layout="panel" />
      {server ? (
        <div className="mods-install-field">
          <span className="mods-install-label">{t.installHint}</span>
          <InstallCommand modId={modId} variant={selection.variant} version={selection.version} />
        </div>
      ) : null}
      <a className="mc-btn mc-btn-sm mods-install-download" href={getReleaseUrl(repository, releases[selection.version])} target="_blank" rel="noopener noreferrer">
        <BrandIcon name="github" size={16} />
        {t.downloadFromGitHub}
        <PixelIcon name="external" />
      </a>
      {tab !== "versions" ? (
        <RouterLink href={buildModUrl(modId, mod, selection, "versions")} className="mods-side-link mods-side-all">
          {t.allVersions(formatNumber(getAllVersions(mod).length, locale))}
        </RouterLink>
      ) : null}
    </section>
  );
}
