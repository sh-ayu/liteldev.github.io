import { useState } from "react";
import { PixelIcon, Pagination } from "../kit-ui";
import { SIDE_BY_ID } from "../data/sides";
import { useI18n } from "../i18n";
import {
  buildModUrl,
  deepLink,
  getReleaseUrl,
  getSortedVariants,
  getVersionsForVariant,
  installAppsFor,
  installCommand,
  isPrerelease,
  type ModSelection,
} from "../lib/mods";
import type { RawModEntry, ReleaseInfo, VersionTarget } from "../types";
import { CopyButton } from "./copy-button";
import { HotbarRadio } from "./hotbar-radio";
import { APP_NAMES, latestVersionOf } from "./install-actions";
import { RelativeDate } from "./local-date";
import { RouterLink } from "./router-link";
import { Sprite } from "./sprite";

const PER_PAGE = 20;

interface VersionsTableProps {
  modId: string;
  mod: RawModEntry;
  repository: string;
  selection: ModSelection;
  releases: Record<string, ReleaseInfo>;
  /** What each version runs on, per variant. */
  targets: Record<string, Record<string, VersionTarget>>;
  /** Makes another variant or version the page's selection. */
  onSelect: (selection: ModSelection) => void;
}

/**
 * Every version of the selected variant, newest first: channel, version (its
 * permalink, with the variant's latest marked), the sides and platforms its
 * entries run on, the LeviLamina range they need, when it was published, and
 * what to do with it right there: make it the page's selection, install it
 * with the app for its sides (the deep links), copy its `lip install` command
 * (a version with a server entry) or open its release. The selected version's
 * row is highlighted; the variant switch changes the page's selection too.
 */
export function VersionsTable({ modId, mod, repository, selection, releases, targets, onSelect }: VersionsTableProps) {
  const { t, locale } = useI18n();
  const variants = getSortedVariants(mod);
  const variant = selection.variant;
  const all = getVersionsForVariant(mod, variant).slice().reverse();
  const latest = latestVersionOf(mod, variant);
  const onlyPre = all.length > 0 && all.every(isPrerelease);
  const [showPre, setShowPre] = useState(true);
  // opens at the page that has the selected version
  const [page, setPage] = useState(() => Math.floor(Math.max(0, all.indexOf(selection.version)) / PER_PAGE) + 1);
  const versions = showPre || onlyPre ? all : all.filter((v) => !isPrerelease(v));
  const pageCount = Math.max(1, Math.ceil(versions.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const shown = versions.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const label = (v: string) => (v === "" ? t.defaultVariant : v);
  const targetsOf = targets[variant] ?? {};
  const hasRanges = Object.values(targetsOf).some((target) => target.leviLamina);
  const hasDates = Object.keys(releases).length > 0;

  return (
    <div className="mods-versions-tab">
      <div className="mods-versions-bar">
        {variants.length > 1 ? (
          <HotbarRadio
            label={t.variant}
            options={variants.map((v) => ({ value: v, label: label(v) }))}
            value={variant}
            onChange={(v) => {
              const own = getVersionsForVariant(mod, v);
              onSelect({ variant: v, version: own.includes(selection.version) ? selection.version : (latestVersionOf(mod, v) ?? "") });
              setPage(1);
            }}
          />
        ) : null}
        {!onlyPre && all.some(isPrerelease) ? (
          <button
            type="button"
            className="mc-btn mc-btn-sm mods-toggle"
            aria-pressed={showPre}
            onClick={() => {
              setShowPre(!showPre);
              setPage(1);
            }}
          >
            <PixelIcon name={showPre ? "check" : "close"} />
            {t.showPrereleases}
          </button>
        ) : null}
        <Pagination
          page={current}
          pageCount={pageCount}
          hrefFor={() => "#versions"}
          onNavigate={(p, e) => {
            e.preventDefault();
            setPage(p);
          }}
          label={t.pagination}
          previousLabel={t.previousPage}
          nextLabel={t.nextPage}
          className="mods-versions-pager"
        />
      </div>
      {shown.length ? (
        <table className="mods-versions-table">
          <thead>
            <tr>
              <th scope="col">
                <span className="kit-sr-only">{t.release}</span>
              </th>
              <th scope="col">{t.colVersion}</th>
              <th scope="col">{t.colSide}</th>
              <th scope="col">{t.colPlatform}</th>
              {hasRanges ? <th scope="col">{t.colLeviLamina}</th> : null}
              {hasDates ? <th scope="col">{t.colPublished}</th> : null}
              <th scope="col">
                <span className="kit-sr-only">{t.colActions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((version) => {
              const pre = releases[version]?.prerelease ?? isPrerelease(version);
              const isCurrent = version === selection.version;
              const target = targetsOf[version];
              const range = target?.leviLamina;
              const apps = installAppsFor(target?.side);
              return (
                <tr key={version} aria-current={isCurrent ? "true" : undefined}>
                  <td className="mods-vt-channel">
                    <span className={`px-dot mods-channel ${pre ? "is-pre" : "is-release"}`} title={pre ? t.prerelease : t.release} />
                    <span className="kit-sr-only">{pre ? t.prerelease : t.release}</span>
                  </td>
                  <td className="mods-vt-version">
                    <RouterLink href={buildModUrl(modId, mod, { variant, version })} aria-current={isCurrent ? "page" : undefined}>
                      {version}
                    </RouterLink>
                    {version === latest ? <span className="kit-badge kit-badge-grass mods-vt-latest">{t.latest}</span> : null}
                    {isCurrent ? <span className="kit-sr-only"> ({t.current})</span> : null}
                  </td>
                  <td className="mods-vt-sides">
                    {target?.side.map((id) => {
                      const side = SIDE_BY_ID.get(id)!;
                      return (
                        <span key={id} className="mods-chip" title={side.label[locale]}>
                          <Sprite name={side.icon} />
                          {side.label[locale]}
                        </span>
                      );
                    })}
                  </td>
                  <td className="mods-vt-platforms">
                    {target?.platform.map((id) => (
                      <span key={id} className="mods-chip mods-chip-mono">
                        {id}
                      </span>
                    ))}
                  </td>
                  {hasRanges ? <td className="mods-vt-range">{range ? <code>{range}</code> : null}</td> : null}
                  {hasDates ? (
                    <td className="mods-vt-date">{releases[version] ? <RelativeDate value={releases[version]!.date} /> : null}</td>
                  ) : null}
                  <td className="mods-vt-actions">
                    {/* lip installs into server folders, LeviLauncher into clients */}
                    {apps.map((app) => (
                      <a
                        key={app}
                        className="mc-btn mc-btn-sm mods-vt-install"
                        data-app={app}
                        href={deepLink(app, modId, variant, version)}
                        aria-label={t.installVersionWith(version, APP_NAMES[app])}
                        title={t.installWith(APP_NAMES[app])}
                      >
                        <PixelIcon name="pickaxe" />
                        {APP_NAMES[app]}
                      </a>
                    ))}
                    {apps.includes("lip") ? <CopyButton text={installCommand(modId, variant, version)} label={t.copyInstall(version)} /> : null}
                    <a
                      className="mc-icon-btn kit-tooltip-host"
                      data-placement="top"
                      href={getReleaseUrl(repository, releases[version])}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t.releaseOnGitHub(version)}
                    >
                      <PixelIcon name="external" />
                      <span className="mc-tooltip kit-tooltip" aria-hidden="true">
                        <span className="mc-tooltip-title">{t.downloadFromGitHub}</span>
                      </span>
                    </a>
                    {/* makes it the page's selection (the header, the install panel, the URL), staying here */}
                    {isCurrent ? (
                      <span className="mods-vt-selected">
                        <PixelIcon name="check" />
                        {t.selected}
                      </span>
                    ) : (
                      <button type="button" className="mc-btn mc-btn-sm mods-vt-select" aria-label={t.selectVersion(version)} onClick={() => onSelect({ variant, version })}>
                        {t.select}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="mods-empty-note">{t.noVersions(label(variant))}</p>
      )}
    </div>
  );
}
