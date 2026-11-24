import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { HotbarTabs, LINKS, PixelButton, PixelIcon, PlatformPicker, PROJECTS, localizeNetworkUrl, usePlatformChoice, type PixelIconName } from '../../kit/components';
import { detectPlatform, platformName, type DevicePlatform, type PlatformTarget } from '../../kit/docs/shared/platform';
import { useLeviLaminaStats, useLipVersion } from '../hooks/useExternalData';
import { useI18n, type Locale } from '../i18n';
import CodeCard from './CodeCard';

// The hero's "I want to…" tabs: who opened the page decides what it offers first. Players get LeviLauncher for
// their device, server owners LeviLamina through lip, developers the APIs. The choice is kept in the URL hash
// (#play, #host, #develop: shareable links) and remembered for the next visit.

export const ROLES = ['play', 'host', 'develop'] as const;
export type Role = (typeof ROLES)[number];
const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

const ROLE_ICONS: Record<Role, PixelIconName> = { play: 'diamond', host: 'monitor', develop: 'pickaxe' };
const STORAGE_KEY = 'levimc-home-role';

/**
 * The selected role. The page is prerendered with `play`; after hydration the URL hash, else the visitor's last
 * choice, takes over, and in-page links to #play / #host / #develop switch it.
 */
export function useRole(): [Role, (role: Role) => void] {
  const [role, setRoleState] = useState<Role>('play');
  useEffect(() => {
    const fromHash = () => {
      const h = location.hash.slice(1);
      return isRole(h) ? h : undefined;
    };
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked: the default stays
    }
    const initial = fromHash() ?? (isRole(stored) ? stored : undefined);
    if (initial) setRoleState(initial);
    const onHash = () => {
      const r = fromHash();
      if (r) setRoleState(r);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(STORAGE_KEY, r);
    } catch {
      // not remembered, still shown
    }
    history.replaceState(history.state, '', `#${r}`);
  }, []);
  return [role, setRole];
}

/** The visitor's device, known only after hydration (the prerendered page offers the Windows download first). */
function usePlatform(): DevicePlatform | undefined {
  const [platform, setPlatform] = useState<DevicePlatform>();
  useEffect(() => setPlatform(detectPlatform()), []);
  return platform;
}

// Docs and tutorial URLs in the visitor's language: the language is the first segment of every levimc.org URL
// (/zh-Hans/LeviLamina/…, /zh-Hant/tutorials/…; kit localizeNetworkUrl).
const docs = (project: 'LeviLamina' | 'LegacyScriptEngine' | 'lip' | 'LeviLauncher', locale: Locale, path = '') =>
  localizeNetworkUrl(`${PROJECTS.find((p) => p.id === project)!.docs}${path}`, locale);
const tutorial = (locale: Locale, path: string) => localizeNetworkUrl(`${LINKS.tutorials}${path}`, locale);

// both open the latest release's page, which lists its files, rather than one starting a download and the other not
const DOWNLOADS = {
  windows: 'https://github.com/LiteLDev/LeviLauncher/releases/latest',
  android: 'https://github.com/LiteLDev/LeviLauncher-Android/releases/latest',
} as const;
const PLATFORM_NAMES = { windows: 'Windows', android: 'Android' } as const;

function PlayPanel() {
  const { t, locale, href } = useI18n();
  const r = t.roles;
  const platform = usePlatform();
  const first = platform === 'android' ? 'android' : 'windows';
  const second = first === 'android' ? 'windows' : 'android';
  const elsewhere = platform === 'ios' || platform === 'macos' || platform === 'linux';
  return (
    <>
      <p className="lm-role-desc">{r.playDesc}</p>
      <div className="kit-hero-actions">
        <PixelButton href={DOWNLOADS[first]} variant="primary" size="lg">
          {r.downloadFor(PLATFORM_NAMES[first])}
        </PixelButton>{' '}
        <PixelButton href={DOWNLOADS[second]} size="lg">
          {r.otherVersion(PLATFORM_NAMES[second])}
        </PixelButton>
      </div>
      <p className="lm-role-meta">
        {elsewhere ? <strong>{r.noVersionHere} </strong> : null}
        {first === 'android' ? r.reqAndroid : r.reqWindows}
      </p>
      <RoleLinks
        links={[
          { href: docs('LeviLauncher', locale, 'download'), label: r.allDownloads },
          { href: href(LINKS.mods), label: r.browseMods, internal: true },
        ]}
      />
    </>
  );
}

// How to get lip: one button per way of installing it, the visitor's selected. Windows has its installer (the file of
// the visitor's architecture: lip-<version>-<target>.msi); macOS and Linux share the install script, so they share a
// button. The prerendered page shows Windows.
const LIP_WAYS = ['windows', 'macos linux'] as const;
type LipWay = (typeof LIP_WAYS)[number];
const useLipWay = () => usePlatformChoice(LIP_WAYS, 'windows');
const LIP_WINDOWS = ['win-x64', 'win-arm64'] as const satisfies readonly PlatformTarget[];
type LipWindows = (typeof LIP_WINDOWS)[number];
const useLipWindows = () => usePlatformChoice(LIP_WINDOWS, 'win-x64');

function HostPanel() {
  const { t, locale, href, info } = useI18n();
  const r = t.roles;
  const { version } = useLeviLaminaStats();
  const [way, setWay] = useLipWay();
  return (
    <>
      <p className="lm-role-desc">{r.hostDesc}</p>
      <div className="lm-platforms">
        <p className="lm-platforms-label" aria-hidden="true">
          {r.platformLabel}
        </p>
        <PlatformPicker options={LIP_WAYS} value={way ?? 'windows'} onChange={setWay} label={r.platformLabel} lang={info.lang} />
      </div>
      <div className="kit-hero-actions">
        <PixelButton href={tutorial(locale, 'server/first-server/')} variant="primary" size="lg" iconRight="arrowRight">
          {r.setupGuide}
        </PixelButton>{' '}
        <PixelButton href={href(LINKS.mods)} size="lg" external={false}>
          {r.findMods}
        </PixelButton>
      </div>
      <p className="lm-role-meta">
        <a href="https://github.com/LiteLDev/LeviLamina/releases/latest" target="_blank" rel="noopener" className="lm-release">
          <span className="lm-release-dot" aria-hidden="true" />
          <span>
            {r.latest}{' '}
            {version ? <span className="lm-release-version">{version}</span> : <span className="lm-skeleton lm-skeleton-sm lm-release-skeleton" />}
          </span>
        </a>
      </p>
      <RoleLinks links={[{ href: docs('lip', locale), label: r.getLip }]} />
    </>
  );
}

function DevelopPanel() {
  const { t, locale } = useI18n();
  const r = t.roles;
  return (
    <>
      <p className="lm-role-desc">{r.developDesc}</p>
      <div className="kit-hero-actions">
        <PixelButton href={tutorial(locale, 'develop/first-levilamina-mod/')} variant="primary" size="lg" iconRight="arrowRight">
          {r.firstMod}
        </PixelButton>{' '}
        <PixelButton href={docs('LegacyScriptEngine', locale)} size="lg">
          {r.scripting}
        </PixelButton>
      </div>
      <RoleLinks
        links={[
          // the Doxygen reference is in English only
          { href: `${docs('LeviLamina', 'en')}api/`, label: r.apiReference },
          { href: tutorial(locale, 'develop/first-android-mod/'), label: r.androidMods },
        ]}
      />
    </>
  );
}

function RoleLinks({ links }: { links: { href: string; label: string; internal?: boolean }[] }) {
  return (
    <p className="lm-role-links">
      {links.map((l) => (
        <a key={l.href} href={l.href} {...(l.internal ? {} : { target: '_blank', rel: 'noopener' })}>
          {l.label}
          <PixelIcon name={l.internal ? 'arrowRight' : 'external'} />
        </a>
      ))}
    </p>
  );
}

/** The role tabs and the selected role's panel (in the hero's copy column). */
export function RoleTabs({ role, onChange }: { role: Role; onChange: (role: Role) => void }) {
  const { t } = useI18n();
  const panels: Record<Role, ReactNode> = { play: <PlayPanel />, host: <HostPanel />, develop: <DevelopPanel /> };
  return (
    <div className="lm-roles">
      <p className="lm-roles-label" aria-hidden="true">
        {t.roles.label}
      </p>
      <HotbarTabs
        className="lm-roles-tabs"
        label={t.roles.label}
        value={role}
        onChange={(id) => onChange(id as Role)}
        tabs={ROLES.map((id) => ({
          id,
          label: (
            <>
              <PixelIcon name={ROLE_ICONS[id]} size={16} />
              {t.roles[id]}
            </>
          ),
        }))}
      >
        <div className="lm-role-panel" data-role={role}>
          {panels[role]}
        </div>
      </HotbarTabs>
    </div>
  );
}

/** What the selected role gets beside the copy: LeviLauncher at a glance, a server set up in a terminal, code. */
export function RoleShowcase({ role }: { role: Role }) {
  const { t } = useI18n();
  if (role === 'host') return <TerminalCard />;
  if (role === 'develop') return <CodeCard label={t.hero.languages} />;
  return <LauncherCard />;
}

const LAUNCHER_ICONS: PixelIconName[] = ['history', 'chest', 'map', 'heart'];

function LauncherCard() {
  const { t } = useI18n();
  const launcher = PROJECTS.find((p) => p.id === 'LeviLauncher')!;
  return (
    <div className="lm-showcase">
      <div className="px-card lm-showcase-window lm-launcher">
        <div className="lm-launcher-head">
          <img className="lm-project-logo" src={launcher.logo} alt="" width={56} height={56} decoding="async" />
          <div>
            <p className="lm-launcher-name">LeviLauncher</p>
            <p className="lm-launcher-platforms">Windows · Android</p>
          </div>
        </div>
        <ul className="lm-launcher-features">
          {t.roles.launcherFeatures.map((f, i) => (
            <li key={f.title}>
              <PixelIcon name={LAUNCHER_ICONS[i]!} size={24} />
              <span>
                <strong>{f.title}</strong> {f.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// What a server owner types: lip's interface does the rest (its Home page: create a server, install mods, start it),
// so the terminal only gets lip and opens it in a folder for the servers.
const INSTALL_SCRIPT = 'curl -fsSL https://levimc.org/lip/install.sh | sh';
const WINDOWS_COMMANDS = ['mkdir servers; cd servers', 'lip'];
const UNIX_COMMANDS = [INSTALL_SCRIPT, 'mkdir servers && cd servers', 'lip'];

/** The installer of the latest lip for a Windows target: the file itself once the version is known, else the release. */
const msiUrl = (target: LipWindows, version: string | null) =>
  version
    ? `https://github.com/LiteLDev/lip/releases/download/v${version}/lip-${version}-${target}.msi`
    : 'https://github.com/LiteLDev/lip/releases/latest';

function TerminalCard() {
  const { t, info } = useI18n();
  const r = t.roles;
  const [copied, setCopied] = useState(false);
  const [way] = useLipWay();
  const [arch] = useLipWindows();
  const [unix] = usePlatformChoice(['macos', 'linux'] as const, 'macos');
  const msi: LipWindows = arch ?? 'win-x64';
  const otherMsi: LipWindows = msi === 'win-x64' ? 'win-arm64' : 'win-x64';
  const lipVersion = useLipVersion();
  const windows = (way ?? 'windows') === 'windows';
  const commands = windows ? WINDOWS_COMMANDS : UNIX_COMMANDS;
  const comments = windows ? [r.terminalFolder, r.terminalOpen] : [r.terminalGetLip, r.terminalFolderNew, r.terminalOpen];
  const shell = windows ? 'PowerShell' : unix === 'linux' ? 'bash' : 'zsh';
  const prompt = windows ? '> ' : '$ ';
  const copy = () => {
    // macOS and Linux: only the install line, since the rest needs the new terminal it asks for (and the script
    // reads its PATH question from the terminal, where pasted lines would answer it)
    void navigator.clipboard?.writeText(windows ? commands.join('\n') : INSTALL_SCRIPT).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  };
  return (
    <div className="lm-showcase">
      <div className="px-card lm-showcase-window" data-platform={windows ? msi : 'macos linux'}>
        {windows ? (
          <div className="lm-term-download">
            <PixelButton href={msiUrl(msi, lipVersion)} variant="primary" size="sm" external={false}>
              {r.msiDownload(platformName(msi, info.lang))}
            </PixelButton>
            <span>
              <code>lip-{lipVersion ?? '<version>'}-{msi}.msi</code> {r.msiNext}{' '}
              <a href={msiUrl(otherMsi, lipVersion)}>{r.msiOther(platformName(otherMsi, info.lang))}</a>
            </span>
          </div>
        ) : (
          <p className="lm-term-download">{r.scriptNote}</p>
        )}
        <div className="kit-code lm-code-block lm-terminal" data-lang={windows ? 'powershell' : 'shell'}>
          <div className="kit-code-head">
            <span className="kit-code-title">{shell}</span>
            <button type="button" className="kit-code-copy" aria-label={windows ? r.copy : r.copyInstall} onClick={copy} {...(copied ? { 'data-copied': r.copied } : {})}>
              <PixelIcon name="copy" className="kit-icon-copy" />
              <PixelIcon name="check" className="kit-icon-done" />
            </button>
          </div>
          <pre className="shiki kit-shiki" tabIndex={0}>
            <code>
              {commands.map((cmd, i) => (
                <span key={cmd}>
                  {i ? '\n\n' : null}
                  <span className="line lm-term-comment">{comments[i]}</span>
                  {'\n'}
                  <span className="line">
                    <span className="lm-term-prompt">{prompt}</span>
                    {cmd}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
