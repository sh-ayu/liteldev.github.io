# Using and configuring lip

## Configuration

### My mod is already listed in the catalog, but after I changed the package description file (`tooth.json` / `lip.toml`) in the repository, the catalog information never updates. Why?

The catalog reads the package file (`lip.toml`, or `tooth.json` only if there is none) at each version tag (`v<version>`). The name, description, tags, and other details shown in the list come from the package file of the latest version, not from the latest file on the default branch. If you change the repository content without publishing a new tag, the catalog does not update.

Instead, update `lip.toml` first (bump `version`), then publish a new version with a new tag (such as `v0.2.0`). The catalog rebuilds every hour, and the new tag will appear in the next build.

The README on the detail page also comes from the repository file at that version tag (`raw.githubusercontent.com/<author>/<repo>/v<version>/README.md`), so changing only the README on the default branch will not update it either. Only the Gallery (`docs/showcase/showcase.json` on the default branch) takes effect directly in the next build.

*Applies to: current LeviMC mod catalog (levimc.org/mods)*

### Do I need to commit compiled binaries to the source repository, or keep them in a separate repository, for a plugin published for lip?

No. In `lip.toml`, add an asset with `type = "mcmod"` (a LeviLamina mod ZIP) or `type = "zip"` to the variant entry, and point `urls` to a GitHub Release attachment, for example `https://github.com/<you>/my-mod/releases/download/v{{version}}/my-mod-server-windows-x64.zip`.

- A `zip` asset also needs `place` to specify where each file in the ZIP goes, for example `place = [{ src = "my-mod/", dest = "mods/my-mod/" }]`.
- An `mcmod` asset requires a `manifest.json` at the root of the ZIP and is extracted as a whole into `mods/<mod-name>/`.
- LeviLamina, LSE, and levilamina-mod-template all use `zip` with Release attachments; the template's release workflow automatically builds and uploads ZIPs such as `<repository-name>-server-windows-x64.zip`.

If GitHub is slow in mainland China, set a GitHub proxy with `lip config set github_proxy <URL>`, or use a system proxy environment variable such as `HTTPS_PROXY`.

*Applies to: lip 0.40 and later (lip.toml)*

### Where are the configuration file and cache of new lip stored? Can they be placed in the current directory?

lip stores its user-level configuration and cache in the standard user directories for each platform, not in the current directory:

- Configuration (`config.toml`): Windows `%APPDATA%\lip`, Linux/macOS `$XDG_CONFIG_HOME/lip` (default `~/.config/lip`)
- Cache: Windows `%LOCALAPPDATA%\lip\Cache`, Linux/macOS `$XDG_CACHE_HOME/lip` (default `~/.cache/lip`)
- Data (such as Wine): Windows `%LOCALAPPDATA%\lip\Data`, Linux/macOS default `~/.local/share/lip`
- State (the workspace list of the interface): Windows `%LOCALAPPDATA%\lip\State`, Linux/macOS default `~/.local/state/lip`

Each server directory (workspace) also has a `.lip/` directory containing `state.json`, the workspace configuration `.lip/config.toml`, logs, and other files. An old `liprc.json` is automatically converted to `config.toml`, and `tooth_lock.json` is converted to `.lip/state.json`. If downloaded files appear corrupted or the same installation keeps failing, run `lip cache clean` and retry; you will not lose any data.

*Applies to: lip 0.40 and later (current 0.41.1)*

### Installing a new server (BDS) with lip fails no matter what version number I enter. How do I fix it?

This is most likely a network or proxy configuration problem. Check lip's GitHub proxy setting `github_proxy` with `lip config list`. If the proxy is unavailable or does not support git repositories, delete it with `lip config delete github_proxy` (or connect directly with `lip config set github_proxy ""`), or switch to a working proxy with `lip config set github_proxy https://<proxy-address>/`.

lip fetches its version list from `https://levimc.org/api/v4/mc/versions/` and downloads the server itself from `www.minecraft.net`, so both must be reachable as well. To create a server, run `lip setup --game <version>` (such as `1.26.60`). If it fails, check the failure report under `.lip/logs/` to find the cause.

*Applies to: lip 0.38+ (after the C# rewrite, the config key is `github_proxy`; verified on 0.41.1)*

### After configuring a GitHub mirror/proxy for lip it fails, and the address was written as `https:/xxx`. What is wrong?

The URL scheme is missing a slash; it must be a complete URL prefix such as `https://xxx/`. Current versions of lip set the GitHub proxy using the `github_proxy` option. To fix it:

```shell
lip config set github_proxy https://xxx/
```

You can also edit `github_proxy` in `%APPDATA%\lip\config.toml` directly, or enter the GitHub proxy on the Settings page of the lip interface. Setting it to an empty string (`lip config set github_proxy ""`) connects to GitHub directly, and `lip config delete github_proxy` resets it to the unconfigured state.

*Applies to: lip 0.40 and later (`config.toml` / `github_proxy`); older lip used the mirror setting in `liprc.json`*

### Downloads time out when lip installs a package (retrying many times and switching computers did not help). What should I do? How do I choose which folder lip installs into?

If GitHub is slow or blocked, set a GitHub proxy with `lip config set github_proxy <proxy-address>` or set an environment variable such as `HTTPS_PROXY` in the terminal to use a regular network proxy, and then retry. (Versions of lip after 0.41.1 append a `/` and the full GitHub URL to the proxy address, so the service's base URL alone is enough. In lip 0.41.1 and earlier, lip appends only `<owner>/<repo>/…`, so the proxy address must end with `https://github.com/` for services like gh-proxy.) You can test whether the proxy returns 200 with `curl "<proxy-address>/https://github.com/LiteLDev/lip.git/info/refs?service=git-upload-pack"`.

lip uses the current working directory as its workspace and has no option to specify another one. To install into a specific folder, `cd` to that directory first and then run the lip command.

*Applies to: lip 0.40 and later*

### After setting a GitHub proxy or another option for lip, how do I remove that setting?

Delete the setting with `lip config delete <KEY>` to restore the default—for example, `lip config delete github_proxy` (which uses no proxy and makes the interface ask again when it cannot reach GitHub). To explicitly specify "connect directly, do not ask again", set it to an empty value instead: `lip config set github_proxy ""` (in PowerShell, run `lip config set github_proxy --% ""`).

*Applies to: lip 0.40 and later (the "interface asks again" distinction only matters since the 0.41.0 interface)*

### Cloning LeviLamina through a GitHub mirror fails in lip/the launcher (for example `fatal: unable to access 'https://github.bibk.top/LiteLDev/LeviLamina.git/': Recv failure: Connection was reset`). How do I change the GitHub mirror (proxy)?

The former default self-hosted mirror `github.bibk.top` suffers from heavy network interference. Switch to another GitHub proxy:

1. Standalone lip: run `lip config set github_proxy https://v4.gh-proxy.org/https://github.com/` (services like gh-proxy require the full `https://github.com/` prefix after the address). You can test a proxy with `curl.exe -s -o NUL -w "%{http_code}" "<proxy>/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"`; 200 means it works. To remove the proxy, run `lip config delete github_proxy`. You can also set the proxy on the settings page of lip's terminal interface, which tests it first.
2. LeviLauncher: on the "Package Management" page in Settings, choose a preset or enter a URL manually in the GitHub proxy field (since 1.1.0, the default is <https://gh-proxy.org/https://github.com>, and presets also include `v4.gh-proxy.org`, `gh.bibk.top`, and others). You do not need to reinstall the launcher after changing this setting.
3. Regular proxy: lip reads the `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` environment variables and falls back to the system proxy if they are not set.

In addition, if a request through `github_proxy` fails, lip falls back to connecting to GitHub directly.

*Applies to: lip 0.40+ (standalone); LeviLauncher 1.1.0 and later (built-in package manager)*

### After configuring a GitHub proxy for lip, downloading `bedrock-runtime-data` fails with HTTP 404 (`Failed to download from https://gh-proxy.com/LiteLDev/bedrock-runtime-data/releases/download/...`). How do I set the proxy correctly?

The proxy address is formatted incorrectly for your version of lip. Proxies like gh-proxy require the full GitHub URL after their own address (entering only `https://gh-proxy.com/` or `https://gh-proxy.org/` returns a 404). Because lip 0.41.1 and earlier append `<owner>/<repo>/...` directly to `github_proxy`, set the proxy as follows (versions after 0.41.1 add the full GitHub URL automatically, so the service's base URL alone works there, though this full form still works too):

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

Before setting the proxy, you can test it with the following command (200 means the proxy works):

```shell
curl.exe -s -o NUL -w "%{http_code}" "https://v4.gh-proxy.org/https://github.com/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"
```

*Applies to: lip 0.40 and later*

### After a mod moves to a new GitHub repository, what must change for lip/the mod list to include it?

The package ID must match the repository path. Current packages use `lip.toml`; update its `id` field to the new repository path—for example, `id = "github.com/user/repo"` for `https://github.com/user/repo`. Otherwise, the commit is not recognized as a package and lip will not install it (meaning the mod list cannot install it properly either; to learn how a mod gets listed, see the "Publish your mod with lip" tutorial on levimc.org).

In the legacy `tooth.json` format, the corresponding field is `tooth` (you can migrate to `lip.toml` by running `lip pkg migrate`, which converts `tooth` to `id`). After making this change, publish a new release with a version tag `v<version>`, where `version` matches the tag's version.

*Applies to: lip.toml format 4 (current); for old tooth.json packages, change the `tooth` field likewise*

### When publishing a LeviLamina mod, can the LeviLamina dependency in the package file be pinned to one specific version? Where does the mod icon go?

Pinning a single version is not recommended: a full version without an operator (such as `"26.60.8"`) matches only that version, so as soon as LeviLamina releases a new version, your mod cannot be installed onto it through lip or the launcher and can only be added by hand. Use a version range instead, for example:

```toml
[variants."".deps]
"github.com/LiteLDev/LeviLamina" = "26.60.*"
```

or something like `">=26.60.0 <26.70.0"` (the syntax follows `SemVersionRange` from Semver for .NET, which supports `^`, `~`, `*`, `>=…<…`, and `||`).

Also, `id` must match the actual repository address. Set the mod icon in `logo` under `[info]` (the URL must start with `https://`), for example `logo = "https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/main/.../pack_icon.png"`. In the old `tooth.json` format, the equivalents are `dependencies` and `info.avatar_url`; when migrating, `avatar_url` becomes `info.logo`.

Note that a client entry (`side = "client"`) also depends on LeviLamina without `#client`; the official template uses `">26.60.6 <26.61.0"` (because in `tooth.json` versions up to 26.60.6, the default variant is the server build).

*Applies to: lip.toml format 4 (current); built-in package manager of LeviLauncher 1.1.0+; old tooth.json packages use `dependencies`/`avatar_url`*

## Features and versions

### Where do I find and publish plugins/mods for LeviLamina? (The old forum, lippkg and bedrinth no longer open)

The LiteLDev forum has been closed for a long time, and `lippkg.com`, `bedrinth`, and `pkg.levimc.org` are also deprecated. The current plugin and mod directory is LeviMC Mods: <https://levimc.org/mods/>. Every mod page shows its install command, and you can install mods with lip (`lip install github.com/<author>/<repo>`, or from the "Marketplace" page in the lip interface). You can also browse and install client mods in LeviLauncher. To publish a mod, an author only needs to tag a version on GitHub with a `lip.toml`; the directory picks it up automatically or through a PR. Report problems through each project's GitHub issues.

*Applies to: all current versions (lip 0.40 and later, LeviLauncher)*

### I published a LeviLamina mod on GitHub. How do I get it listed in lip's mod directory (LeviMC Mods / LeviLauncher)? Why can't it be found?

The current directory is LeviMC Mods (<https://levimc.org/mods/>), which replaces the former lipr / bedrinth. Both the "Marketplace" page of lip and LeviLauncher read from it. It is built from the repository list in `content/mods/repos.txt` in the `LiteLDev/liteldev.github.io` repository:

1. Automatic discovery: every two hours, a bot uses GitHub code search to find repositories with a `lip.toml` (or the old `tooth.json`) in the root and a version tag that lip can read, then opens a PR adding the repository to `repos.txt`. Once the maintainers merge it, the mod appears in the next hourly build. Forked repositories are not discovered. Because this relies on GitHub code search (whose quota is often exhausted, causing some runs to be skipped), a new repository may not be found until GitHub has indexed its code. In that case, opening a PR yourself (step 2) is the fastest way.
2. To get listed faster: open a PR that adds a `<author>/<repo>` line to `content/mods/repos.txt`.
3. Requirements: the version tag must be `v` followed by a full semantic version (such as `v1.0.0`, not `1.0.0` or `v1.0`), and the `version` in `lip.toml` at that tag must match it; the latest version must depend on LeviLamina (directly or indirectly); files must be placed in `mods/` (or `plugins/` and so on); the repository must not be a GitHub template, and its name must not end with `-template`, `-example`, `-demo`, `-sample`, or `-test`.
4. Self-check: on a test server, running `lip install github.com/<author>/<repo>@<version> --dry-run` should find your version without modifying any files.

If you do not want your mod listed, close the PR opened by the bot (it will not propose it again) or delete your line from `repos.txt`. Note that lip itself does not depend on the directory: an unlisted repository can still be installed directly with `lip install github.com/<author>/<repo>`.

*Applies to: lip 0.40 and later (publishing a lip.toml package requires the `lip pkg` command from lip 0.41); current LeviMC Mods directory*

### I keep several mods/plugins in one repository and do not want to split it. Can I publish it to lip? Do I have to publish a GitHub Release to publish a lip package?

In lip, a package ID is the repository path (such as `github.com/user/repo`), and one repository is one package. However, a package can have several variants, which lets you keep multiple mods in one repository. Write one `[[variants."<name>"]]` entry per mod in `lip.toml` (where the name matches `^[a-z0-9_]+(/[a-z0-9_]+)?$`), and users can choose which one to install with `lip install github.com/user/repo#<name>` (this is how LSE's `#lua` and `#nodejs` engines work). Note that all variants in a repository share the same version tags. A version is a git tag named `v<SemVer>` (such as `v1.2.3`), and the `version` in `lip.toml` at that tag must match it. "Publishing" simply means pushing that tag; a GitHub Release is only needed to host the ZIP files referenced by the `urls` in the assets. If you really want each mod to have its own version, you can create a separate repository for each mod containing only a `lip.toml`, with the `urls` of its zip/mcmod assets pointing to files in the Releases of the main repository.

*Applies to: lip v0.40 and later (lip.toml format 4); in the old tooth.json, variants are distinguished by label*

### Does lipui (the graphical interface of lip) still work? Is there a graphical interface if I cannot use the command line? What if I want a specific version of BDS?

lipui is archived and no longer available. Its features are now built into lip itself: run `lip` with no arguments in a terminal to open the lip interface. The home page guides you through creating a server, installing mods, and starting the server, so you do not need to remember any commands. To install a specific version of BDS, choose the version when creating the server in the interface, or run `lip setup --game <version>` (for example, `lip setup --game 1.21.0`; this includes the latest compatible LeviLamina by default, which you can change with `--loader levilamina@<version>` or `--no-loader`). You can also run `lip install github.com/LiteLDev/bds@1.21.0 LeviLamina` (which installs game version 1.21.0 along with the latest compatible LeviLamina). If you only need to download the server files, you can also use bdsdown (`lip install github.com/LiteLDev/bdsdown`).

*Applies to: lip v0.40 and later (built-in interface)*

### Do I have to write a version number when installing a package with lip? Does it install the latest version automatically if I leave it out?

No. Running `lip install github.com/user/repo` automatically installs the highest version tag (`v<SemVer>`) in the repository. To pin a version, specify `github.com/user/repo@1.0.0` (for the tag `v1.0.0`); `@branch:<name>`, `@tag:<name>`, and `@rev:<full commit>` also work. For LiteLDev repositories, you can omit the prefix, such as `lip install LeviLamina`. Installing does not require a `-y` confirmation argument. For usage details, see <https://levimc.org/lip/>.

*Applies to: lip 0.26 through the present (currently v0.41.1)*

### Can lip keep a dependency list in the current directory like npm, write to it on `lip install`, and so let people share a list as a "server pack"?

No. `lip install` only installs packages into the server folder and records them in `.lip/state.json`; it never writes to `lip.toml`, and lip has no workspace manifest like `package.json`. To install a set of packages at once (a server pack), you can create a package of your own and list all the required packages under `deps` in its `lip.toml` (similar to the default variant of LegacyScriptEngine, which depends on the quickjs and lua engine variants). Once you publish it, others can install everything with `lip install <your package>`. For the publishing tutorial, see <https://levimc.org/tutorials/develop/publish-a-package/>. Note that lip only manages the server; entries in `lip.toml` distinguish the two sides with `side = "server"`/`"client"`, and client mods are installed by launchers such as LeviLauncher reading the same packages.

*Applies to: current lip (the lip.toml era)*

### How does the mod download in LeviLauncher relate to lip? Are mods from overseas authors such as Lamium distributed through lip too?

Yes. LeviLauncher has lip's package management built in: downloading, installing, and updating LeviLamina mods is handled through lip, and the mod directory comes from the lip mod index on levimc.org. Mods such as Lamium (`github.com/amatouhake/Lamium`) are also distributed through lip rather than hosted on CurseForge. On the launcher's mods page, "package-managed mods" are mods managed by lip, while "regular mods" are mods in the `mods` directory that lip does not manage (for example, ones you imported manually).

*Applies to: LeviLauncher v1.1.0 (current version)*

### Can lip be used to download BDS?

Yes. lip's game package is `github.com/LiteLDev/bds`: `lip install github.com/LiteLDev/bds@<version>` installs the Windows server without a loader, and appending `#linux` installs the Linux version; you can also run `lip setup --game <version> --no-loader`. To install LeviLamina along with it, simply run `lip install LeviLamina`, which sets up the matching BDS automatically. If you only need to download the BDS files, you can also use the bdsdown tool (`lip install github.com/LiteLDev/bdsdown`).

*Applies to: lip v0.41.0 and later*

### What does lip do when a hook command run during package installation fails?

If a hook command exits with a non-zero exit code, the entire operation (install/uninstall) fails. lip rolls back the file changes made by that operation, but not the actions of the hook command itself, so hook commands should be idempotent (safe to run repeatedly). The package description file is now `lip.toml`, and hooks are defined under `hooks` within an entry (`pre_install`, `post_install`, `pre_uninstall`, `post_uninstall`). Each entry targets a single side and platform; to support multiple platforms, define a separate entry for each platform with its own commands. Commands for Windows run via `cmd /s /c` (through Wine on Linux/macOS), while commands for other platforms run via `sh -c`.

*Applies to: lip v0.40/v0.41 (lip.toml); scripts in the old tooth.json are converted to hooks*

### Can lip search the mod list and install from just a package name, like pacman (for example `lip -S levilamina`)?

The CLI cannot search for or install packages by name alone. Each lip package is uniquely identified by its source (the repository address), such as `github.com/LiteLDev/LegacyScriptEngine`. Because there is no central repository, third-party packages must be specified using their full repository path. The one exception is that a name without a `/` is resolved as a repository under `github.com/LiteLDev/`, so official LiteLDev packages can be installed using short names, such as `lip install LeviLamina` and `lip install LeviOptimize`. To search by name, run `lip` in a terminal to open the TUI and browse the mods from levimc.org on the "Marketplace" page, or search for them at <https://levimc.org/mods/>.

*Applies to: lip v0.41.0 and later*

### Can lip install packages globally, like `npm -g`?

No. lip has no concept of global installation. Every command uses the current working directory (the server folder) as its workspace and installs packages there. Because there is no option to specify a different workspace, you must `cd` into the server directory before running a command.

*Applies to: all current versions of lip*

### After installing LeviLamina with lip, an extra package named loc (levilamina-loc) appeared. What is it? Do I need to install it manually?

This is `github.com/LiteLDev/levilamina-loc`, LeviLamina's language pack (localization), which installs its files to `mods/LeviLamina/lang/`. Because LeviLamina declares it as a dependency, lip installs it automatically alongside LeviLamina; you do not need to manage it manually.

*Applies to: all current LeviLamina versions (server and client)*

### Can new lip still install packages that use the old `tooth.json` format (`format_version` 1/2/3)? What should package authors do?

Yes. Current versions of lip (stable releases since v0.40.0, latest v0.41.1; v0.37.0 and earlier used `tooth.json`) use `lip.toml` (`format = 4`) as the package description file, but still support `tooth.json` from the lip v0.x era (format 1, 2, 3): format 1/2 is first interpreted as format 3, then converted locally into the `lip.toml` structure and installed like any regular package. In older workspaces, `tooth_lock.json` and `liprc.json` are automatically migrated to `.lip/state.json` and `config.toml` on first use.

Package authors should migrate to `lip.toml` for new releases. Run `lip pkg migrate` in the repository root to convert `tooth.json` to `lip.toml` (this deletes `tooth.json`; review any warnings before committing), then verify the result using **Edit lip.toml** on the **Develop Tools** page of the TUI. There is no need to dig through old tags for legacy format documentation: the "Earlier formats" section of the `lip.toml` page in the lip documentation explains how `tooth.json` is parsed.

Note: modern lip has no central repository or module proxy (it no longer uses goproxy/lipr) and fetches packages directly from Git repositories. If GitHub access is slow, configure a proxy with `lip config set github_proxy <URL>`.

*Applies to: lip 0.40.0 and later (the lip.toml era, latest 0.41.1)*

### After installing Glacie (the multi-version compatibility mod) directly with lip, it errors out or does not work, the console shows that the installed version does not match the server, or installing a specific version fails. What should I do?

Glacie's package manifest does not declare a dependency on the LeviLamina or game version, so installing without a version number makes lip install the latest version, which may not match your server. Choose the Glacie version that matches your server version and specify it when installing: `lip install github.com/GlacieTeam/Glacie@<version>`, or download the matching version manually from GitHub Releases. See Glacie's README and changelog for the version mapping. When something goes wrong, first check whether the version number printed in the console matches.

If the installation fails because lip cannot read the new package format, your lip is too old. Update it with `lip self-update` or from <https://github.com/LiteLDev/lip/releases>.

*Applies to: lip 0.40 and later; Glacie 3.x (`tooth.json` `format_version` 3, no LeviLamina dependency declared)*

### After installing a plugin/LeviLamina with lip, I am told it is incompatible with the current LeviLamina (or BDS) version. What is going on?

Usually, the install command has an old version number hard-coded (such as `lip install <repository>@x.y.z` from a plugin's instructions), which installs an old version that does not match the current LeviLamina. Remove `@x.y.z` from the command, and lip will install the latest stable version compatible with the current workspace.

lip selects the game (BDS) and LeviLamina versions together: `lip install LeviLamina` installs the latest LeviLamina and the latest game version it supports. `lip install` does not replace an already installed game or loader; if a mod needs a newer LeviLamina, the command fails and tells you to switch the game and loader version with `lip setup` first (for example, `lip setup --game <version>`), and then install the mod. After starting the server, you can check the LeviLamina version with the `version` command.

Older versions of lip had an issue where a one-click install pulled the latest BDS even if LeviLamina did not support it; this no longer happens.

*Applies to: lip 0.41.x (current version)*

### Where is the lip source repository? Can the latest BDS downloaded from the official BDS site be used with LeviLamina directly?

The lip repository is at <https://github.com/LiteLDev/lip> (the old address, `futrime/lip`, redirects there). The latest BDS from the official site is often newer than the version LeviLamina supports and cannot be used directly; you must use the BDS version that matches LeviLamina. Using lip is recommended: run `lip install LeviLamina` to install the latest LeviLamina and the latest game version it supports, or run `lip setup --game <version> --loader levilamina` to specify a game version and let lip select the matching LeviLamina automatically.

### I want to deploy LeviLamina + LegacyScriptEngine on an old BDS version (such as 1.21.1). Is there a matching server pack?

There is no official server pack, but you can build one for a specific version with lip (v0.41.0 and later).

Game and loader: in an empty server directory, run `lip setup --game 1.21.1` (this automatically picks the latest LeviLamina that supports that game version, though you can also specify one with `--loader levilamina@<version>`), or run `lip install github.com/LiteLDev/bds@1.21.1 LeviLamina`.

LSE: starting with LSE v0.10.0, each engine is published as a variant, so you can install the version matching your LeviLamina with `lip install github.com/LiteLDev/LegacyScriptEngine#lua@<version>` (`#<variant>` goes before `@`).

However, for the 1.21.1 generation (LeviLamina 0.13.x, corresponding to LSE 0.8.x), the LSE repository does not have variants such as `#lua`; the engine packages are hosted on `gitea.litebds.com` and currently cannot be installed through lip. Instead, download the matching `legacy-script-engine-<engine>-windows-x64.zip` from LSE's GitHub Releases and install it manually (you must also manually install matching versions of dependencies such as LegacyMoney).

*Applies to: lip 0.41.0 and later (`lip setup` and the bare name `LeviLamina` were added in 0.41.0); installing LSE variants applies only to LSE 0.10.0+. Not confirmed against the source code or the documentation: treat this as a pointer.*

### What format must GitHub version tags have when publishing a package for lip? What if a tag without `v` cannot be installed and does not appear in the catalog?

lip only treats a tag as a version if its name is `v` followed by an exact SemVer 2.0.0 version, such as `v1.1.0-rc.1` or `v2.0.0`. Tags like `1.1.0-rc.1`, `2.0.0`, `v1.2`, and `v01.2.3` are ignored by lip, the LeviMC mod catalog, and LeviLauncher. Also, `version` in `lip.toml` at that tag must match the tag without the `v` (for example, `version = "2.0.0"`).

To fix this, publish a new tag or Release with the `v` prefix. Because lip now queries repository tags directly over the git protocol without using a Go module proxy or caching the tag list, new tags take effect immediately and you no longer need to change GOPROXY.

In `lip.toml`, you can reference the version with `{{version}}` (for example, in an asset URL) and the package ID with `{{id}}`. Run `lip install github.com/<author>/<repo>@<version> --dry-run` to confirm that lip recognizes the version.

*Applies to: lip 0.40 and later (lip.toml format 4); the same tag rules apply to old tooth.json packages*

### Can lip install a local package? Can I test my own package locally during development without publishing it?

Yes. Pass `lip install` the path to a ZIP file or a folder with a `lip.toml` at its root, such as `lip install ./my-mod.zip` or `lip install ../MyTool` (a ZIP at an `https://` URL also works). Because lip detects ZIP files by content rather than file extension, you no longer need to rename them to `.tth`. To build the ZIP, compress the folder so that `lip.toml` is at the archive root; run `lip install <folder> --dry-run` to verify that lip can read it.

You can also test a package before pushing a tag by running `lip install github.com/user/repo@branch:main` or `@rev:<40-char-commit>`.

Manage all packages with lip, including LeviLamina itself. Files you add manually are not recorded in lip's state, so lip cannot use them to resolve dependencies.

*Applies to: lip 0.40 and later (the `lip pkg` commands require lip 0.41+)*

### I copied LeviLamina's package files for my own lip package, but it cannot be installed. What are the common causes?

1. The version tag must be `v` followed by a full SemVer, such as `v1.2.3`; `v1.2`, `1.2.3`, and `v01.2.3` do not count as versions (though you can install any tag with `lip install github.com/user/repo@tag:1.2.3`).
2. lip reads `lip.toml` (or `tooth.json` if there is none) from the commit that the tag points to. After changing package files, commit and push a new tag, because an existing tag's content does not update.
3. In `lip.toml`, `id` must match the repository path (such as `github.com/user/repo`), `version` must match the tag's version, and the requested variant must have an entry matching the current environment (platform/side); otherwise, lip skips that version as a candidate.
4. The repository must be public.

Run `lip install <repository>@<version> --dry-run` to check whether lip can read the package, or open the local `lip.toml` with **Edit lip.toml** on the **Develop Tools** page of the interface.

*Applies to: lip 0.40 and later*

### The old lip documentation sites (`lip.futrime.com`, `futrime.github.io/lip`, `lip.levimc.org`, etc.) no longer open. Where can I read the lip documentation now?

The lip documentation is now on the LeviMC website at <https://levimc.org/lip/> (and in Traditional Chinese at <https://levimc.org/zh-Hant/lip/>). Its source files are in the `docs/lip/` directory of the `LiteLDev/liteldev.github.io` GitHub repository, and the lip repository itself has moved to <https://github.com/LiteLDev/lip>. In a terminal, run `lip --help` (or `lip -h`) for general help, or `lip <command> --help` for help with a specific command.

*Applies to: lip 0.40 and later*

### The lip package index sites (`lippkg.com` / `bedrinth.com` / `pkg.levimc.org`) don't open or have an expired certificate. Has lip been discontinued? Can I still install packages with lip?

lip has not been discontinued; the package directory has simply changed addresses several times (`lippkg.com` → `bedrinth.com` → `pkg.levimc.org`). Those old addresses are deprecated and should no longer be used. The current directory is LeviMC mods at <https://levimc.org/mods/>, which is the same directory shown on the "Marketplace" page in lip's interface and in LeviLauncher. Even if a directory site is down, you can still install packages: lip has no central repository and reads versions directly from each package's git repository, so `lip install github.com/<author>/<repository>` still works.

*Applies to: lip 0.40 and later*

### After packing a server configured with lip using Windows' built-in compression, the `.lip` folder is missing. Why?

The built-in compression in Windows 11 may skip hidden folders whose names start with `.`, which leaves `.lip` out of the archive. This compression behavior depends on the Windows version. Use a third-party tool such as 7-Zip instead, and make sure to include `.lip` whenever you pack or migrate a server: `.lip` is a hidden directory on Windows that records the installed packages, workspace settings, and so on.

*Not confirmed against the source code or the documentation: treat it as a pointer.*
