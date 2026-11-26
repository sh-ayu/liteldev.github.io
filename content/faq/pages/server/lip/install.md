# Installing lip and setting up a server

## How do I uninstall a plugin/mod installed with lip? Why does simply deleting the plugin folder not work?

Run `lip uninstall <package>` in the server directory. You can specify the package by the identity shown in `lip list` (such as `lip uninstall github.com/LiteLDev/LegacyScriptEngine#lua`) or by the source you installed it from (such as `./package.zip`); pass `--dry-run` first to preview what would be deleted. lip runs the uninstall hooks, deletes the files the package owns, and automatically removes dependencies that are no longer needed. Do not delete folders manually: lip tracks installed packages in `.lip/state.json`, so if you delete a folder by hand, lip still considers the package installed and running `lip install` for the same version will not reinstall it. If that happens, run `lip uninstall` first and then `lip install`. If something is still wrong after reinstalling, perform a clean install of a LeviLamina server with lip in a new empty directory to determine whether the server or the plugin is at fault. For more subcommands, run `lip --help` or open the interface by running `lip` directly.

*Applies to: all current lip versions (the state file path `.lip/state.json` applies to lip v0.40+)*

## How do I update installed plugins with lip? Can I update all packages in one go? Are dependencies updated too? How do I update LeviLamina itself?

Use `lip update` (the old `lip install --upgrade` / `-U` no longer exists). Run it in the server directory:

- `lip update` without arguments re-requests all explicitly installed packages from the source they were installed from (packages installed by `<repo>` are updated to the highest version tag, while those pinned with `@version` remain unchanged);
- `lip update github.com/user/repo` updates just that package;
- `lip update github.com/user/repo@1.2.0` switches to the specified version (upgrade or downgrade).

Add `--dry-run` first to preview the changes. Dependencies are updated only when the new version requires it, and whether they can change is governed by the version ranges in `deps` in the plugin's `lip.toml`. `lip update` does not touch the game (BDS) or the loader (LeviLamina) and does not accept them as arguments; to change the LeviLamina or game version, use `lip setup`. Run the command in the server (workspace) directory (open the server directory in File Explorer, type `cmd` or `powershell` in the address bar, and press Enter), or run `lip` directly and update from the "Mods" page of the interface.

*Applies to: lip v0.40 and later*

## After installing a plugin with lip, it reports a missing dependency (prerequisite). Why did lip not install it automatically?

lip automatically installs the dependencies a package declares in the `deps` section of its `lip.toml` (`<package ID>` or `<package ID>#<variant>` = version range). There are usually two reasons it did not:

1. The plugin author did not declare the dependency in `deps`. You will need to ask the author to add it, or find the package yourself and `lip install` it manually (the error usually states the missing package ID and version range, which you can search for at <https://levimc.org/mods/>).
2. The missing dependency is the game or LeviLamina itself: `lip install` never installs, uninstalls, or replaces the game or the loader. If a mod requires a different LeviLamina version, the command fails and directs you to `lip setup`; run `lip setup` first to set the game and LeviLamina versions the mod supports, and then install the mod.

The `prerequisites` field from the old `tooth.json` no longer exists. For manually installed plugins, make sure the required dependency plugin is actually in the `mods` directory.

*Applies to: lip v0.40 and later; LeviLamina 1.x and later (mod directory `mods/`)*

## How do I install LeviLamina (with BDS) and common components such as LSE, anti-cheat, optimization and multi-dimension support in one go with lip?

Run the following in a newly created empty folder (a single command can install multiple packages as one operation):

```shell
lip install LeviLamina github.com/LiteLDev/LegacyScriptEngine github.com/LiteLDev/LeviAntiCheat github.com/LiteLDev/LeviOptimize github.com/LiteLDev/MoreDimensions
```

Installing LeviLamina automatically installs the compatible BDS version (you must type `yes` to accept the Minecraft EULA, or pass `--accept-eula` in scripts). The default variant of LSE includes the QuickJS and Lua engines; to install other engines, specify their variants: `github.com/LiteLDev/LegacyScriptEngine#nodejs`, `github.com/LiteLDev/LegacyScriptEngine#python`. Afterward, to add mods to a workspace that already has BDS, simply run `lip install <package>`. Third-party packages (such as GMLIB) are installed the same way with `lip install github.com/<author>/<repo>`; just make sure they support your current LL version.

*Applies to: current lip (v0.41.x) and LeviLamina 26.60.x*

## By default lip installs the latest LeviLamina and the matching latest BDS, but my client/world/plugins only support an older version. How do I install a specific version of LeviLamina or BDS (and specific versions of other packages) with lip?

If you omit the version, `lip install` installs the latest release, and installing LeviLamina also installs a compatible BDS (the client and server versions must match; type `version` in the BDS console to check). To pin a version, run one of the following in a newly created empty folder:

1. By LeviLamina version: `lip install LeviLamina@<version number>` (short for `github.com/LiteLDev/LeviLamina@<version number>`), which installs the latest BDS that LL supports. Check the LeviLamina GitHub Releases for available version numbers.
2. By BDS version: `lip setup --game <BDS version>` (for example, `--game 1.21.60`, which automatically selects the latest compatible LeviLamina; add `--loader levilamina@<version number>` to pin LL as well), or specify both in a single command: `lip install github.com/LiteLDev/bds@<BDS version> LeviLamina`. Do not install bds and LeviLamina in two separate commands, because the second command re-selects the game version based on LL.
3. To change the version of an existing server: run `lip setup --game <version>` again in that folder. `worlds`, `server.properties`, and similar files are kept, while other mods are replaced with compatible versions. Back up your world before downgrading; downgrading a world from a newer version may corrupt it.
4. For other packages, append `@version number` to the package name in the same way, optionally with a variant—for example, `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@0.22.4`—and choose a version compatible with your installed LL version.

If GitHub is slow to reach, run `lip config set github_proxy <proxy URL>` first; `lip cache clean` clears the download cache.

*Applies to: current lip (v0.41.x); version numbers as listed in the LeviLamina/LSE Releases*

## On a network in mainland China (or a cloud server or campus network), installing LeviLamina, LegacyScriptEngine and other packages with lip is very slow, hangs or fails with network errors. How do I configure a mirror/proxy?

This happens when your network cannot reliably reach GitHub. Because most lip packages are downloaded from GitHub, you can configure a GitHub proxy (a URL-prefix GitHub mirror) for lip:

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

You can replace the mirror address with any working GitHub prefix proxy that you trust. In lip 0.41.1 and earlier, some services require the full `https://github.com/` suffix after the address (versions after 0.41.1 append it automatically and also accept it if already present).

Key points:

1. The current version of lip supports only `github_proxy` as a network setting. The old `GoModuleProxyURL` / `GitHubMirrorURL` / `ProxyURL`, `go_module_proxy` / `go_module_proxies` / `github_proxies` keys no longer exist, and Go module proxies such as `goproxy.cn` are no longer used, so setting them has no effect.
2. Only requests to GitHub go through `github_proxy` (`github.com`; in versions after 0.41.1, also `*.github.com`, `*.githubusercontent.com`, and `lip self-update`). BDS itself is downloaded from minecraft.net and is not affected.
3. If a request through the proxy fails, lip falls back to connecting to GitHub directly, so a successful command does not guarantee that the proxy is working. You can test a proxy with: `curl.exe -s -o NUL -w "%{http_code}" "<proxy address>LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"`; a response of `200` means the proxy works. If a mirror stops working (for example, if it is blocked), switch to another; if an error reports that the proxy does not support git repositories, replace it as well.
4. If you have a standard HTTP proxy (such as a local Clash port at `http://127.0.0.1:7890`; verify the port number), you do not need to set `github_proxy`. Instead, set `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` / `NO_PROXY` in the terminal where you run lip (in PowerShell: `$env:HTTPS_PROXY = "http://127.0.0.1:7890"`). If these environment variables are not set, lip uses the system proxy. You can also enable TUN mode in your proxy software.
5. To remove the proxy, run `lip config delete github_proxy`. To explicitly force a direct connection, run `lip config set github_proxy ""` (in PowerShell, use `lip config set github_proxy --% ""`). Run `lip config list` to view the current configuration.
6. If a previously failed download left an incomplete cache, run `lip cache clean` and try again. Updating lip to the latest version first is also recommended.
7. If nothing else works, run the installation on a machine with a good network connection, then archive the result and upload it to the server.

*Applies to: lip v0.41.x (current latest); the old configuration keys apply only to the early Go version of lip*

## After installing lip on Windows, the command line says the lip command cannot be found (or that the .NET runtime is missing). What should I do?

We recommend downloading `lip-<version>-win-x64.msi` (`win-arm64` for ARM devices) from <https://github.com/LiteLDev/lip/releases/latest> and running the installer, which adds the install directory to the system PATH automatically. After installing, close any open cmd or PowerShell windows and open new ones for the updated PATH to take effect. If you use the portable zip, add the directory containing `lip.exe` (without the file name) to "Edit the system environment variables → Environment Variables → Path" yourself, then reopen the terminal; you can verify the change with `echo %PATH%`. Alternatively, skip PATH and run `lip.exe` by its full path (in quotes if it contains spaces), or place `lip.exe` in the current directory and run it there (`lip` in cmd, or `.\lip` in PowerShell). Current versions of lip are single self-contained executables and do not require a separate .NET runtime.

*Applies to: current lip (v0.41.x), Windows*

## The lip Release page has many files (x64/arm64, msi/zip and so on). Which one should I download for an Intel/AMD Windows PC, Windows Server or a panel-hosted server?

x64/amd64 and arm64 refer to the CPU architecture, not the brand: standard Intel and AMD PCs, Windows Server 2022, and similar systems are all x64. arm64 is only for ARM devices, and downloading the wrong build produces an error saying that it does not match your system. The current lip release page (<https://github.com/LiteLDev/lip/releases/latest>) provides: `lip-<version>-win-x64.msi` / `win-x64.zip` (Windows x64), `win-arm64.msi` / `win-arm64.zip` (Windows ARM), `linux-x64.tar.xz` (x64 Linux), and `osx-x64.zip` / `osx-arm64.zip` (macOS). On Windows, use `win-x64.msi` in most cases, as it adds itself to PATH; for panel-hosted servers or environments that cannot run an msi installer, download and extract `win-x64.zip`. On macOS and Linux, you do not need to choose a file manually: `curl -fsSL https://levimc.org/lip/install.sh | sh` automatically selects the right archive for your system. All builds are self-contained single-file executables and require no extra .NET runtime. lip itself is cross-platform: on Linux and macOS, it runs the Windows server with LeviLamina using a copy of Wine that it downloads automatically. There is no arm64 Linux build.

*Applies to: current lip (v0.41.x)*

## Where do I download the lip package manager and how do I install it? Is there a winget option? Can it update itself? Is there a Linux version?

The lip repository is at <https://github.com/LiteLDev/lip> (formerly `futrime/lip`), and the documentation is at <https://levimc.org/lip/>. lip is available for Windows (x64 and arm64), macOS (Apple silicon and Intel), and Linux (x64). Choose your operating system:


::: tabs

== Windows

Download `lip-<version>-win-x64.msi` (`lip-<version>-win-arm64.msi` on ARM) from <https://github.com/LiteLDev/lip/releases/latest> and run it; the installer adds lip to PATH. Alternatively, download the `.zip` archive of the same name, extract it, and add the directory to PATH yourself.

== macOS / Linux

Run `curl -fsSL https://levimc.org/lip/install.sh | sh` in a terminal. The script selects the right build for your system, installs it to `~/.local/bin` without requiring root or an administrator password, verifies its SHA-256 checksum, and offers to add the directory to PATH. On Apple silicon Macs, lip prompts you to install Rosetta 2 the first time it is needed. There is no Linux build for arm64.

:::

For all installation methods, including archives for manual installation, see [Install lip](https://levimc.org/lip/install.html). lip is a single executable and does not require a separate .NET runtime, git, or Wine. The official documentation no longer includes a winget installation method (the old `futrime.lip` winget package is no longer available); to update lip, run `lip self-update` (or `lip self-update --check` to check for updates without installing). After installing, open a terminal in your server folder and run `lip` to launch the interactive interface, or run commands directly, such as `lip install LeviLamina`.

*Applies to: current lip (v0.41.x)*

## The lip I downloaded does not run on x64 Windows (Win10/Win11/Windows Server). What is the cause?

The most common cause is downloading a build for the wrong architecture: on an x64 machine, download the `win-x64` build from the Release page (`lip-<version>-win-x64.zip` or `lip-<version>-win-x64.msi`), not `win-arm64`. Older versions of lip used `amd64`/`arm64` in their file names, whereas current versions use `win-x64`/`win-arm64`. If you have the right architecture and it still fails to start on a stripped-down or modified copy of Windows 10, the cause may be a compatibility issue with CET (Control-flow Enforcement Technology), which is enabled by default starting in .NET 9 (see <https://learn.microsoft.com/zh-cn/dotnet/core/compatibility/interop/9.0/cet-support>). We recommend switching to a standard, unmodified official Windows image.

*Applies to: current lip (v0.41.x; the win-x64/win-arm64 naming has been used since v0.33 of the C# version)*

## On Windows Server (such as 2022 Datacenter), the lip installer reports `lip Setup Wizard ended prematurely because of an error` or lip does not work. What should I do?

Windows Server itself is supported. First confirm that you downloaded the `win-x64` build (do not download `win-arm64` unless the server is ARM). If the MSI installer fails, you can skip it: download `lip-<version>-win-x64.zip`, extract `lip.exe`, and add its directory to the PATH environment variable (all the MSI installer really does is put lip in `Program Files\lip` and add that directory to PATH). Current versions of lip are self-contained and do not need a separate .NET runtime, and the portable version can still be upgraded later with `lip self-update`.

*Applies to: current lip (v0.41.x, self-contained, no .NET needed)*

## Installing a package with lip fails (even with a different version number, as if the package was not fully uploaded, or dependencies cannot be satisfied). What is the cause?

A common cause is that your local lip is too old to read packages in the new format (new packages use `lip.toml`, while older lip versions only understand `tooth.json`). Run `lip self-update` to update lip to the latest version, then try installing again. If the dependencies genuinely cannot be satisfied (because the author has not published a matching version of a dependency or wrote the wrong version number), the current lip has no option to skip dependency checks. Your only options are to install a different version of the package, run `lip setup` to switch to a matching game/LeviLamina version, or wait for the author to fix it.

*Applies to: current lip (v0.41.x; `lip self-update` is available)*

## LeviLamina/BDS was installed manually (or with an exe), and when I later install mods that depend on LeviLamina, such as LegacyScriptEngine or LeviAntiCheat, with lip, it reports missing dependencies and cannot detect LeviLamina. What should I do? Where should lip commands be run?

lip only tracks packages that it installed itself and recorded in the server folder's `.lip/` state file; to lip, a manually extracted BDS/LeviLamina does not exist. Do not mix the two methods—either manage everything with lip or install everything manually. If you try to install a mod in a folder with no recorded game installation, lip will fail and tell you to run `lip setup` first. The recommended approach is to create a new empty folder, run `lip install LeviLamina` in it (or install it together with your mods, such as `lip install LeviLamina LegacyScriptEngine`), install any remaining mods with `lip install <mod>`, and then copy `worlds/`, `server.properties`, `allowlist.json`, `permissions.json`, and your mod configs over from the old server. Always run lip commands in the server root directory (the workspace); after an MSI install, lip is already on PATH, so just `cd` to the server directory and run it. If you prefer a fully manual install, check the `lip.toml` file in each package's repository (`tooth.json` for older packages), which lists its dependencies, download URLs, and where to place each file.

*Applies to: lip v0.40+ (currently v0.41.1), current LeviLamina version*

## Typing `lip install ...` (for example to update LeviLamina) in the BDS console says Unknown command / does nothing. Where should lip commands be run? Does LeviLamina update automatically?

lip is a standalone command-line program, not a BDS console command. Open a system terminal (cmd or PowerShell), switch to the server root directory (`drive letter:` then `cd path`, or open the server directory in File Explorer, type `cmd` in the address bar, and press Enter), and run lip there. Running `lip` with no arguments opens its terminal interface, where you can create a server, install mods, and start the server. LeviLamina does not update automatically: to change the LeviLamina or game version, run `lip setup --game <game version> --loader levilamina@<version>` (or click **Change versions…** on the Server page of the interface), and update other mods with `lip update`. If your server runs on a hosting panel that gives you no terminal access, you will have to replace the files manually or contact the provider.

*Applies to: lip v0.40+ (currently v0.41.1)*

## When I upgrade LeviLamina or an installed package with `lip install`, lip says it is "already installed" or the version does not change. How do I upgrade correctly or install a specific version?

1. `lip install` is only for packages that are not installed yet. If you run install on an already installed package, lip refuses and tells you to use `lip update` instead.
2. Regular mods: `lip update` updates everything, `lip update <package>` updates one package, and `lip update <package>@<version>` switches to a specific version (upgrade or downgrade).
3. LeviLamina and BDS cannot be changed with install/update. Use `lip setup --game <game version> --loader levilamina@<version>`, which keeps your worlds and configuration and switches mods to compatible versions. To install a specific version in a fresh folder, use `lip install LeviLamina@<version>`.
4. Run every lip command in the server root directory. Do not run it in the default directory opened by Win+R (such as `C:\Windows\System32`).
5. If `lip -v` shows a very old version, install the latest release from <https://github.com/LiteLDev/lip/releases>. After that, you can update lip itself with `lip self-update`.

*Applies to: lip 0.40 and later*

## When I install LeviLamina or a server with lip, the files end up somewhere else (such as the user directory) or mixed with other files. Where does lip install the server, and how do I choose the location?

lip installs the server and packages into the command's current working directory (which lip calls its "workspace"). Create an empty folder, enter it with `cd <folder path>` (or type `cmd` in the File Explorer address bar to open a command prompt there), and then run `lip install LeviLamina`, `lip setup ...`, `lip install <package>`, and so on. Run all later lip commands for this server in that same folder.

## There is no lip on my panel server or cloud server, lip cannot run there, or the online installation fails. How do I install LeviLamina and its mods?

lip is a single executable that needs no other runtime. You can place it on the server (in any directory or in PATH) and run it directly. The Linux build is x64 only, requires glibc 2.27 or later, and does not support Alpine. On Linux/macOS, lip automatically downloads and configures Wine to run the Windows build of the server. Wine also requires GnuTLS on the system (and Fontconfig if FreeType is installed); if either is missing, lip tells you its name and the command to install it.

If the panel server cannot run lip at all, install the whole server (or a mod) with lip on your local computer, then upload the files to the panel server. When moving a whole server, upload the `.lip` folder with it. You can also check the package's manifest file (`lip.toml` in the repository root for new packages, `tooth.json` for old ones), which lists the download links for each asset (`urls` of the assets) and where to place them (`place` / `placements`). Download the files manually and place them at those paths.

If only GitHub is unreachable, set a GitHub proxy with `lip config set github_proxy <proxy address>`.

*Applies to: lip 0.40 and later*

## Installing GMLIB with lip fails with 404 or cannot download. What should I do?

GMLIB has moved to a new repository. The old address `github.com/GroupMountain/GMLIB` no longer exists; use the new one instead: `lip install github.com/GroupMountain/GMLIB-Release`. Because the GMLIB package declares a dependency on LeviLamina, lip automatically picks a version compatible with your installed LeviLamina. To pin an older version, run `lip install github.com/GroupMountain/GMLIB-Release@<version>`.

## What is the difference between the lip msi installer and the downloadable lip executable (zip)? How do I use lip after installing?

There is no functional difference. The msi is a standard installer: it automatically adds lip to the PATH environment variable so you can run `lip` in a command prompt right after installing, and you can uninstall it from "Programs and Features". It is best for users who do not know how to edit environment variables. The zip is a portable build that you extract yourself and place in a directory in PATH. Both can be updated with `lip self-update` (an msi installation updates silently through msiexec). After installing, run `lip` in the server folder to open the interface.

*Applies to: lip 0.41.x (Windows)*

## GitHub is not reachable. How do I download and install lip?

The lip installers are on GitHub Releases: <https://github.com/LiteLDev/lip/releases/latest> (the old `futrime/lip` address redirects automatically). On Windows, download `lip-<version>-win-x64.msi` (or `-win-arm64.msi`; a portable `.zip` is also available), for example <https://github.com/LiteLDev/lip/releases/download/v0.41.1/lip-0.41.1-win-x64.msi>. On Linux and macOS, the install script also downloads from GitHub; pass your GitHub proxy in `LIP_GITHUB_PROXY` (which works the same as lip's `github_proxy`): `curl -fsSL https://levimc.org/lip/install.sh | LIP_GITHUB_PROXY=<proxy URI> sh`. You can also download the matching `.tar.xz` or `.zip` archive manually.

If you cannot reach GitHub, download through a third-party GitHub mirror (prepend the mirror's prefix to the URL, or replace `github.com` with the mirror's domain). After installation, run `lip config set github_proxy <proxy URI>` so lip uses the proxy for future GitHub downloads.

## After LeviLamina was updated for a new game version, installing LL and BDS with lip works, but installing the quickjs/nodejs/lua variants of LegacyScriptEngine keeps failing. What should I do?

Run `lip cache clean` to clear lip's cache, then run the install command again, such as `lip install LegacyScriptEngine#lua`. Clearing the cache does not lose any data; lip simply redownloads the files it needs. Do not run other lip commands while the cache is being cleared. If the installation still fails, check the failure report in `.lip/logs/`. If it reports an incompatible game or loader version, that LSE version does not yet support the current LeviLamina: wait for an LSE update, or use `lip setup` to switch to a supported version.

*Applies to: lip 0.41.x*

## What is the official address of lip? Does `github.com/lippkg/lip` still work?

The lip repository is now at <https://github.com/LiteLDev/lip>, and the documentation is at <https://levimc.org/lip/>. GitHub currently redirects the old `github.com/lippkg/lip` and `github.com/futrime/lip` addresses to LiteLDev/lip, and old documentation domains such as `lip.levimc.org` simply point to the new documentation. Use the new addresses directly. We recommend installing plugins through lip itself.

## The lipd version in the winget repository stays at an old version (such as 0.33.1) and is never updated. Why?

lipd is deprecated and no longer released separately. Its background daemon functionality is now built into lip, so you only need to install or update lip. The first lip command you run starts the daemon automatically; you can check and stop it with `lip daemon status` and `lip daemon stop`. Note that the winget mirror only mirrors the package manifest—the installer itself is still downloaded from GitHub Releases.

*Applies to: lip 0.34 and later*

## I ran a lip install in the plugins (or mods) directory by mistake, and it downloaded a lot of files (even another server). What should I do?

lip treats the current working directory as the workspace (the server folder), so you must run all lip commands in the server root directory, not in subdirectories such as mods or plugins. Running a command like `lip install LeviLamina` in a subdirectory sets up another server there. To fix this, delete the mistakenly installed files in the subdirectory (including its `.lip` folder), or run `lip uninstall` there, and then rerun the command in the server root directory.

## Where can I download an older official BDS? The official website only has the latest one.

Use lip: in an empty folder, run `lip setup --game <version> --no-loader` (for example, `--game 1.21.80`, or `1.21.80-patch.3` for a specific build) to download the vanilla server for that version. If you omit `--no-loader`, lip also installs the matching LeviLamina version. lip downloads the server from the official minecraft.net address using the build list at `https://levimc.org/api/v4/mc/versions/`. You can also search for the version number on the Minecraft Wiki to find the official direct link.

## After installing LeviLamina 26.60.x and LSE 0.23.x with lip in a new empty directory, startup reports an incompatible resource pack version (the BDS version differs from the 1.26.60 that LeviLamina requires). What is the cause, and in what order should I install?

This happens because LSE was installed first: in older versions of lip, dependency resolution pulled in only the BDS component and downloaded the latest BDS instead of version 1.26.60 required by LeviLamina. Instead, set up the game and the loader first, then install plugins:

```shell
lip install LeviLamina          # install the latest LeviLamina and the latest BDS it supports (equivalent to one lip setup)
lip install LegacyScriptEngine  # then install LSE (QuickJS and Lua engines by default)
```

Or specify the versions explicitly: run `lip setup --game 1.26.60 --loader levilamina`, then `lip install LegacyScriptEngine#lua`, and so on. Update to the latest lip first with `lip self-update`: if you try to install a mod directly in an empty workspace with no game installed, newer versions of lip report an error and prompt you to run `lip setup` first, preventing a mismatched BDS installation. The BDS version required by LeviLamina is specified in the `github.com/LiteLDev/bds` dependency in its `lip.toml` (or `tooth.json` for older packages).

*Applies to: lip 0.41.x; LeviLamina 26.60.x; LegacyScriptEngine 0.23.x*

## How do I install the LSE Lua / QuickJS engines with lip? What if the installation fails?

Each language engine is now a variant of the LegacyScriptEngine package, selected with `#`:

```shell
lip install LegacyScriptEngine#lua
lip install LegacyScriptEngine#quickjs
# #nodejs and #python also exist
```

If you do not specify a variant (`lip install LegacyScriptEngine`), lip installs both the QuickJS and Lua engines. `LegacyScriptEngine` is shorthand for `github.com/LiteLDev/LegacyScriptEngine`. Before installing, the workspace must already contain a server and LeviLamina (`lip install LeviLamina` or `lip setup --game <version>`). If the installation fails, first update to the latest lip with `lip self-update`, then run `lip cache clean` and try again, and check the error or hint that lip prints along with the failure report under `.lip/logs/`.

*Applies to: lip 0.41.x; LegacyScriptEngine 0.23.x*

## A manually downloaded LeviLamina mod reports missing dependencies or fails to load on startup. How do I install the matching mod version on older versions such as BDS 1.21.70?

Manually downloaded files may be incomplete or missing dependencies, so install mods with lip instead, which resolves dependencies automatically. To use an older BDS version: in the server folder, first set up the game and loader with `lip setup --game 1.21.70` (which also installs the latest LeviLamina that supports that version), and then run `lip install <package>`; lip automatically selects the latest version compatible with the current workspace. Alternatively, look up the release that supports your BDS version in the mod's GitHub Releases and pin it with `lip install <package address>@<version>` (for example, `lip install github.com/user/repo@1.2.0`); add `--dry-run` first to preview what will be installed. The mod must have a release that supports the target BDS version.

*Applies to: lip 0.41.x*

## When I run the lip install commands from the LeviLamina/LSE installation docs, the commands with `@version` fail. How should I write them?

In `<repo>@<version>` in the documentation, version is just a placeholder—do not copy it literally. To install the latest version, omit `@version` entirely, for example `lip install github.com/LiteLDev/LegacyScriptEngine` (LiteLDev repositories can also be shortened to `lip install LegacyScriptEngine`). To install a specific version, replace the placeholder with the actual version number, for example `lip install github.com/LiteLDev/LegacyScriptEngine@0.23.1` (corresponding to the repository's `v0.23.1` tag). When specifying a variant, put `#variant` before the `@`, such as `LegacyScriptEngine#lua@0.23.1`.

Note: in current versions of lip, `lip install LeviLamina` and `lip install LeviLamina@<version>` also install the matching BDS just like `lip setup` does (you must accept the EULA). To change the version of an existing LeviLamina installation, use `lip setup`.

## When I install with `lip install github.com/LiteLDev/LegacyScriptEngine@<version>`, are all four LSE language engines installed? Do I need to add `#` after the version?

No `#` is needed. Running `lip install github.com/LiteLDev/LegacyScriptEngine@<version>` without a variant installs only the QuickJS and Lua engines. To install the Node.js or Python engine, install its variant separately with the variant name placed before the `@`: `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@<version>` and `lip install github.com/LiteLDev/LegacyScriptEngine#python@<version>` (omit `@<version>` to install the latest version).

*Applies to: LegacyScriptEngine 0.17.x and later*

## After installing LeviLamina with lip there is no LegacyScriptEngine, and old JS/Lua plugins do not work. Why?

LeviLamina is modular and does not install LSE automatically; you must install it separately. In the server root directory, run `lip install github.com/LiteLDev/LegacyScriptEngine` (or the short form `lip install LegacyScriptEngine`). Without a variant, this installs both the QuickJS and Lua engines; to install just one, append `#quickjs` or `#lua`, or use `#nodejs` or `#python` for Node.js or Python.

Alternatively, you can download the matching `LegacyScriptEngine-server-<engine>-windows-x64.zip` from <https://github.com/LiteLDev/LegacyScriptEngine/releases> and extract it into the server directory manually (placing the engine in `mods/legacy-script-engine-<engine>/`), but you will have to manage dependencies such as LegacyRemoteCall, LegacyMoney, and iListenAttentively yourself (the Node.js engine also requires the node runtime `node-prebuilt.zip` and `7-zip-tooth`). Using lip is recommended. After installation, place your script plugins in `plugins/` and restart the server.

*Applies to: LeviLamina 0.10 and later*

## Downloading or installing the LSE NodeJS engine with lip fails. What should I do?

1. First, update lip to the latest version: `lip self-update`.
2. Clear the cache and try again: `lip cache clean`.
3. If GitHub is slow or blocked, set a GitHub proxy with `lip config set github_proxy <proxy address>`, or set the system HTTP proxy environment variable in your terminal (for example, in PowerShell: `$env:HTTPS_PROXY = "http://127.0.0.1:port"`), which lip uses automatically.
4. Reinstall using the current package name: `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` (or the short form `lip install LegacyScriptEngine#nodejs`). Note that you must first set up the game and LeviLamina with `lip setup --game <version>`. If the package was already explicitly installed, `lip install` will refuse; use `lip update` instead, or run `lip uninstall` before installing again.

If it still fails, check the terminal hint and the failure report under `.lip/logs/` to find the cause.

*Applies to: lip 0.41.x and later*

## Does installing BDS/LeviLamina with lip stop at a step that requires accepting the Minecraft EULA? Is there a parameter to skip the acceptance in a one-click install script?

Yes, it prompts for acceptance. When installing the game (BDS), current versions of lip display links to the Minecraft EULA and Microsoft privacy statement and require you to type `yes` to continue. In a non-interactive terminal such as a script, it fails immediately without the parameter. In a script, pass `--accept-eula` to skip the prompt, for example:

```shell
lip setup --game 1.21.0 --loader levilamina@1.0.0 --accept-eula
```

or `lip install LeviLamina github.com/user/repo --accept-eula` (this takes effect when install runs as a setup). lip prompts again every time the game is installed; your acceptance is not saved.

*Applies to: lip 0.41.x and later*

## After installing LeviLamina with lip, starting BDS shows an error about a missing runtime library (it looks like vcredist is needed), but installing vcredist did not help. What should I do?

This is usually caused by an incomplete BDS download. The install hook of the `github.com/LiteLDev/bds` lip package calls bdsdown to download BDS from the official website, and you can specify a download mirror through the `BDSDOWN_MIRROR_URL` environment variable. In PowerShell, set the mirror first and then reinstall in an empty folder:

```powershell
$env:BDSDOWN_MIRROR_URL="<mirror address>"
lip setup --game <version>
```

(or `lip install LeviLamina`). lip passes the current terminal's environment variables to the installation process. One user successfully downloaded BDS using <https://mcdl.bibk.top> as the mirror.

## Installing LeviLamina or plugins with lip fails. In which directory should lip run? Do I need to install the LSE dependencies one by one?

lip uses the current working directory as its workspace, so you must run it in the server root directory (the directory containing `bedrock_server.exe`); there is no option to specify another directory. The lip executable itself can be placed in your PATH. To create a new server, run `lip setup --game <version>` (or `lip install LeviLamina`) in an empty folder.

To install LegacyScriptEngine, you only need to install the package itself (for example, `lip install LegacyScriptEngine#lua`); its other dependencies, such as LegacyRemoteCall, are resolved and installed automatically. However, `lip install` does not install or modify the game or LeviLamina. You must first run `lip setup` to install a LeviLamina version that satisfies the LSE version constraint; otherwise, the command fails and directs you to `lip setup`. Installing LeviLamina automatically runs PeEditor to generate `bedrock_server_mod.exe`. For non-interactive scripts, use `--accept-eula` (newer versions of lip no longer have the `-y` option).

*Applies to: lip 0.41.x and later*

## What is the package name when installing LeviLamina with lip? Where can I look up lip packages?

The package name for LeviLamina is `github.com/LiteLDev/LeviLamina`. Repositories under the LiteLDev organization can be shortened, such as `lip install LeviLamina` (this is equivalent to the full form; for a new server, `lip setup --game <version>` is recommended, as it automatically selects a suitable LeviLamina version). lip has no central repository: a package name is simply the address of a public git repository. To find mods, run `lip` to open the Marketplace page in the interactive interface, or browse levimc.org.

*Applies to: lip 0.41.x and later*

## Installing or upgrading LeviLamina with lip was interrupted (`bdsdown.exe` and other files remain in the directory), or the server cannot start after installing in a directory that already has old server files. How do I install and upgrade correctly?

New server: in an empty folder, run `lip setup --game <version>` (or `lip install LeviLamina`), install the mods you need with `lip install`, and then copy over the old server's `worlds/`, `server.properties`, `allowlist.json`, `permissions.json`, and the configuration of each mod. You do not need to keep the old `bedrock_server_mod.exe`; installing LeviLamina regenerates it.

Upgrade: for a server already managed by lip, run `lip setup --game <new version>` in that directory. This keeps the worlds and configuration files listed above; mods incompatible with the new version are listed as left-out, and lip asks whether to uninstall them.

Interruption: installation in current lip is atomic. After an interruption, the next `lip setup/install/update/uninstall/run` automatically rolls back or completes the previous operation, so you do not need to delete leftover files manually (do not delete `.lip/journal` or `.*.bak`).

If the server does not start, first check the server output and `logs\latest.log` (typical causes are a port already in use or a mod failing to load).

*Applies to: lip 0.41.x; LeviLamina 26.x*

## After installing LeviLamina with lip, which file do I use to start the server?

A server with LeviLamina must run `bedrock_server_mod.exe` (which PeEditor generates from `bedrock_server.exe` during installation); do not run the vanilla `bedrock_server.exe`. In newer versions of lip, you can also run `lip run` directly in the server directory (or click start on the server page of the lip interface); when a loader is installed, this runs `bedrock_server_mod.exe`.

## When I install a plugin with lip, it finishes immediately without any download, but the mods (plugins in older versions) directory has no such plugin (for example GMLIB) and reports missing dependencies. What should I do?

lip has a download cache, so it can finish without downloading. It also records installed packages in `.lip/state.json` in the workspace. If you manually deleted an installed package's files earlier, lip still considers the package installed and does not reinstall the same version, leaving files missing. To fix this, run `lip uninstall <the package you explicitly installed>` and then `lip install <that package>` again (dependencies are uninstalled and installed along with it automatically). Note that `lip uninstall` accepts only explicitly installed packages: you cannot directly uninstall a package installed as a dependency, such as GMLIB; instead, uninstall the mod that depends on it. If you suspect a corrupted cache, run `lip cache clean` to empty it (on Windows, the cache is in `%LOCALAPPDATA%\lip\Cache`). Do not manually delete files installed by lip; use `lip uninstall` instead.

*Applies to: lip 0.41.x*

## Can lip update only the BDS itself?

Yes. In lip, BDS is the package `github.com/LiteLDev/bds` (the "game" of the workspace). Run `lip setup --game <version>` in the server directory (for example, `lip setup --game 1.26.60`) to switch to a specific BDS version. lip also selects the latest LeviLamina that supports that version (you can specify one with `--loader levilamina@<version>`, or install only the vanilla server with `--no-loader`) and switches the other mods to compatible versions. Worlds, `server.properties`, `allowlist.json`, and `permissions.json` are kept. Add `-n` (`--dry-run`) to preview the changes first. Note that `lip install` and `lip update` cannot update BDS directly and tell you to use `lip setup` instead.

*Applies to: lip 0.41.x*

## Can I use lip to update LeviLamina to the latest commit of the development branch?

You cannot get unreleased development builds with lip. lip installs or switches LeviLamina (the loader) with `lip setup --loader levilamina@<released version>` (or with `lip install` without a ref or with a version number, which installs it as the loader). Although `lip install` supports `@branch:<name>` and `@rev:<commit>` references, the resource URLs in LeviLamina's `lip.toml` point to release packages on GitHub Releases, so specifying a branch still installs a released version. To use a build from the latest commit, the only option is to download the artifacts from GitHub Actions (the build workflow) in the LeviLamina repository and replace the files manually. Note that LeviLamina's default branch is now `main` (there is no `develop` branch anymore).

*Applies to: LeviLamina 26.x; lip 0.41.x*

## lip says its version is too old (shows 0.31 or so) although I have installed a new one. Why?

You have two lip installations at the same time, and the PATH environment variable still lists the old lip's directory first. Run `lip --version` (or `lip -v`) to check which version is actually running, and run `Get-Command lip` in PowerShell or `where lip` in cmd to find its path. Delete the old installation, or update PATH to point to the new lip's installation path (reopen your terminal afterward). From then on, you can update lip itself with `lip self-update`.

*Applies to: current version (Windows)*

## lip fails when I install the server directly in the root of a drive (such as `F:\`). What should I do?

Do not use the root of a drive as the server directory (workspace). Create a subfolder (such as `F:\server`) as the workspace, and then run `lip setup` / `lip install` inside it.

*Applies to: older lip (current version unconfirmed). Not confirmed against the source code or the documentation: treat it as a pointer.*

## A download or installation with lip is interrupted and says it was blocked by 360 Safe Guard. What should I do?

Your antivirus software (360) blocked lip from downloading or writing files. Right-click the 360 icon in the system tray and exit it, or add lip and the server directory to the trusted whitelist, and then run the installation command again.

*Not confirmed against the source code or the documentation: treat it as a pointer.*
