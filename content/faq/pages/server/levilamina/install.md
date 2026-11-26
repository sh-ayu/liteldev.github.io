# Installing LeviLamina on a server

## LeviLamina

### Does LeviLamina support Linux (or macOS, ARM)? How do I run a LeviLamina server on Linux?

LeviLamina has no native Linux build. It loads only into the x64 Windows build of BDS, and official releases provide only `windows-x64` packages. The maintainers cite several reasons: the Linux build of BDS currently lacks symbols; threads, exceptions, hooks, and similar mechanisms differ from Windows, so mods would have to be rewritten; and in testing, the Windows build of BDS under Wine actually performs better than the native Linux build. For these reasons, there are no short-term plans for a native Linux build.

On Linux, run the Windows build of BDS + LeviLamina under Wine:

1. Use lip directly (recommended): lip now offers Linux x64 and macOS builds. It bundles its own Wine (from Kron4ek/Wine-Builds on Linux) and installs the VC++ runtime automatically, so you do not need to install Wine yourself. Use the same commands as on Windows: `lip setup --game <version>` (this installs the game along with the latest compatible LeviLamina, so you do not need to install LeviLamina separately; pass `--accept-eula` in scripts or containers), then `lip run`.
2. Use the official Docker image: `docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine` (you must set `EULA=TRUE`, and the host must be x64). See the tutorial at <https://levimc.org/tutorials/server/docker/>. If you want LeviStone (which runs Endstone plugins written in Python on top of LeviLamina), use the `ghcr.io/liteldev/levistone-server:latest-wine` image.
3. Set up the server directory on Windows first, then copy the entire folder to Linux and run it with Wine; the same server folder can be moved between operating systems. If you install Wine yourself, use a recent version.

Other platforms:

- x64 macOS: runs through lip's bundled Wine.
- Apple silicon macOS: uses lip's Wine with Rosetta 2; lip prompts you to install Rosetta 2 if it is missing (`--accept-rosetta-license` skips the prompt).
- arm64 Windows: works through the system's x64 emulation.
- arm64 Linux: not officially supported. Tools such as box64, FEX, and Hangover cannot run a LeviLamina server reliably; use an x64 machine instead.
- Android, iOS: not supported.
- 32-bit: not supported by BDS itself.

Linux panel servers from hosting providers generally cannot run LeviLamina; you need a machine where you have Docker access or can run lip yourself. If you must run a plugin server natively on Linux, consider another loader such as Endstone, though it is incompatible with the LeviLamina ecosystem (conversely, LeviStone lets Endstone plugins run on LeviLamina, but it still requires Wine).

*Applies to: all current versions (LeviLamina 26.x, lip 0.41.x, docker-levilamina-server latest-wine)*

### How do I install addons (behavior packs/resource packs, `.mcpack`/`.mcaddon`) on a LeviLamina (LL3) server? Does LL2's (LiteLoaderBDS) AddonsHelper still exist?

LL2's AddonsHelper (the `addonshelper` folder) no longer exists in LeviLamina; putting files there does nothing. A LeviLamina server supports addons just like vanilla BDS. You have four options:

1. Use the vanilla method: put the extracted pack in `./behavior_packs` or `./resource_packs` (or `worlds/<world>/behavior_packs`, `resource_packs`), then copy the `uuid` (pack_id) and `version` from `header` in the pack's `manifest.json` into `worlds/<world>/world_behavior_packs.json` or `world_resource_packs.json`. To tell a resource pack from a behavior pack, check the `type` under `modules` in `manifest.json` (`resources` is a resource pack; `data`/`script` is a behavior pack) rather than the file name.
2. Since LeviLamina 1.9.6, the server loads extracted packs from the `resource_packs/` and `behavior_packs/` subdirectories of a mod directory (such as `plugins/<mod name>/behavior_packs`, and `plugins/LeviLamina/behavior_packs` for LeviLamina itself). Behavior packs in these directories are added to the behavior pack stack automatically, so you do not need to edit the world's JSON files (this is mainly intended for packs bundled with a mod).
3. To load `.mcaddon`/`.mcpack`/`.zip` files automatically by dropping them into a folder, install the community mod GMEssentials (`lip install github.com/GroupMountain/GMEssentials-Release`, which depends on GMLIB and others), set `enable` of `addon_loader` to `true` under `features` in its config, and put the packs in `./addons` in the server root (you can change this path in `addon_loader.directory`). GMEssentials' `addon_loader` is disabled by default, though some other features, such as `chat_formatter` and `dynamic_motd`, are enabled by default. After editing the config, run `ll reactivate GMEssentials` or restart the server. GMEssentials also includes a feature for cleaning up unknown blocks (`cleaner_unknown_block`).
4. Use the standalone CLI tool <https://github.com/harry-xi/addon-manager> to manage BDS addons.

Note: `LiteLDev/LegacyAddonsManager` and `pingguo114514/AddonsManager` are both archived, and the 7-zip package they depend on can no longer be resolved, so current versions of lip cannot install them. Do not use them.

*Applies to: LeviLamina current version (26.60.x); method 2 needs LeviLamina 1.9.6 or later*

### How do I install the LeviLamina client build on the Minecraft Bedrock (Windows) client? Can I install it manually?

Manual installation is not recommended, as the process is far more complicated than you might expect. Instead, install it using LeviLauncher: on the "Download" page, pick a GDK version where the "Loader" column shows LeviLamina as supported, leave "Install LeviLamina" enabled when installing the instance, and select the latest LeviLamina version. For an existing instance, you can install, update, or remove LeviLamina on the "Loader" tab under "Instance settings". After that, you can install client mods under "LeviMC Mods" (or import `.mcmod` files under "Manage mods"). LeviLauncher installs LeviLamina automatically only for supported GDK versions. Note that lip currently manages servers only (as the lip documentation FAQ states: "Can lip install client mods? No. lip manages servers only."); client builds of LeviLamina and client mods are managed by launchers such as LeviLauncher. Since LeviLamina 26.60.8, packages no longer have a `#client` variant: the default variant contains both the server and client builds, and LeviLauncher resolves any `#client` dependency declared in an older package's `tooth.json` to the default variant. A server mod may need to be recompiled to work on the client.

*Applies to: LeviLamina 1.8.0 and later (client support); LeviLauncher for Windows*

### When migrating a LeviLamina server, is copying only the world (`worlds`) enough? Where are the player data of LeviLamina and of mods such as economy and land claims stored?

No. LeviLamina stores its own data—such as the player info database `playerinfo`, a LevelDB-based KeyValueDB that maps UUID, XUID, and player name—in `mods/LeviLamina/data/` (`plugins/LeviLamina/data/` in older versions), which you must also copy when migrating. Each mod stores its data in its own directory. For example, LegacyMoney keeps its economy data in `mods/LegacyMoney/economy.db`; for other mods such as land claims, copy the data files from each mod's directory along with the rest of your server. The player info database loads on demand by default (only when a mod uses it); to keep it always enabled, set `targeted.playerInfo.alwaysLaunch` to `true` in `mods/LeviLamina/config/Config.json`. The mod directory is `mods/`; early 0.x versions used `plugins/`.

*Applies to: LeviLamina current version*

### Can I only install LeviLamina with lip? Can I manually extract the GitHub Release zip into the BDS directory? What if a manual install from an online tutorial gives errors or missing DLLs?

Installing with lip is the officially recommended method and the only one covered in the official documentation. Manually extracting and assembling files is not recommended.

Recommended approach: download and install `lip-<version>-win-x64.msi` from <https://github.com/LiteLDev/lip/releases/latest>. Create an empty folder and run `lip` in it (which opens a graphical terminal interface; select "Create server"), or run `lip setup --game 1.26.60` (or `lip install LeviLamina` / `lip install github.com/LiteLDev/LeviLamina@<version>`) from the command line. lip automatically downloads the matching BDS version and all dependencies, and generates `bedrock_server_mod.exe`. Start the server with `lip run` or `bedrock_server_mod.exe`, not the vanilla `bedrock_server.exe`. If you cannot reach GitHub, configure a proxy or mirror in lip.

If you insist on installing manually (which is error-prone and not officially supported), you must manually perform every step that lip automates. Read `lip.toml` in the package root (`tooth.json` in older versions), download the matching versions of all dependencies listed under `deps` (bds, CrashLogger, levilamina-loc, PeEditor, PreLoader, bedrock-runtime-data), place the files according to the `place` field (put `LeviLamina/` from LeviLamina's `levilamina-v<version>-server-release-windows-x64.zip` into `mods/LeviLamina/`), and finally run `PeEditor.exe -mb` in the server directory to generate `bedrock_server_mod.exe`. Regular users should download the release build; the debug build is only for development and debugging. For manual installation details, follow each package's `lip.toml`.

Note: Online tutorials that mention `LiteLoader.dll`, `LLMoney.dll`, `.lib` files, or dropping a DLL straight into `plugins` are from the archived LiteLoaderBDS (LL2) era. They are outdated and incompatible with LeviLamina (the economy plugin is now LegacyMoney). Follow the official tutorial at <https://levimc.org/tutorials/server/first-server/>.

*Applies to: LeviLamina current version (26.60.x); lip v0.4x*

### Which directory should LeviLamina mods/plugins go in? I extracted one manually, and it does not load and there is no error. How do I troubleshoot?

Install mods with lip: `lip install <mod address>` (for example, `lip install github.com/LiteLDev/LeviOptimize`; packages from LiteLDev can use a short name like `lip install LeviOptimize`; for LSE, use `lip install LegacyScriptEngine#lua`, and so on). lip handles the directory structure and dependencies automatically.

If you install mods manually, keep the following in mind:

1. Directory: Place mods under `mods/` in the server root, with one folder per mod (`mods/<mod name>/manifest.json`). When LegacyScriptEngine is installed, LSE links `plugins/` to `mods/` on startup, so the `plugins` directory mentioned in older tutorials actually points to `mods`.
2. From the archive, extract the entire folder containing `manifest.json` without an extra directory level (opening the mod folder should show `manifest.json` right away). Any folder without a `manifest.json` is silently skipped with no error.
3. The folder name must match the `name` field in `manifest.json` (for example, do not keep or add a "[MineBBS]-" prefix); otherwise, you will get the error `Mod name ... do not match folder ...`.
4. Only mods built for LeviLamina can be loaded. A standalone `.dll` is usually a LiteLoaderBDS (LL2) plugin, which LeviLamina cannot use; discontinued LL2-era plugins do not work either. If you drop a single old-style `.js`/`.lua`/`.py` script into `plugins/` (with the matching LSE engine installed), LSE generates a folder and manifest for it on the next startup, and the script loads on the following restart.
5. Verify that all prerequisite dependencies are installed and loaded (check the console or `logs` for dependency errors). Run `ll list` to see the currently loaded mods.
6. If `"passive": true` is set in `manifest.json`, the mod does not load automatically at startup (it loads only when another mod depends on it). Load it manually with `ll load <mod name>`.
7. Load errors can also be caused by an outdated VC runtime. Install the latest Visual C++ Redistributable x64: <https://aka.ms/vc14/vc_redist.x64.exe>.

Also, addons (behavior packs and resource packs) are not the same as server mods; do not put mods in the behavior pack or resource pack directories.

*Applies to: LeviLamina 1.x and later (currently 26.60.x); the `plugins` link requires LegacyScriptEngine*

### What is LL3 (LeviLamina), and where do I download and install it? How does it relate to LiteLoaderBDS (LL1/LL2)? Can new BDS versions still use LL2? How do I choose a version?

LL1 and LL2 are both called LiteLoaderBDS. They have long been unmaintained and do not work with new BDS versions. LL3 is LeviLamina, the mod loader from the LiteLDev (LeviMC) team, which many mods (such as CoralFans) require. Repository and releases: <https://github.com/LiteLDev/LeviLamina>.

We recommend installing with lip: install lip from <https://github.com/LiteLDev/lip/releases/latest>, then in an empty folder run `lip` (choose "Create server" in the interface) or run `lip setup --game <game version>` (for example, `lip setup --game 1.26.60`). lip installs the matching BDS and a compatible LeviLamina. Running `lip install LeviLamina` installs the latest LeviLamina along with the latest game version it supports.

LeviLamina versions map one-to-one to game versions, so you cannot mix and match them freely: for example, LeviLamina 26.60.x is for 1.26.60, 26.10.x is for 1.26.10, and 1.9.x is for 1.21.132. See the "Supported versions" page in the official documentation for the full table.

Documentation: tutorial <https://levimc.org/tutorials/server/first-server/>, LeviLamina documentation <https://levimc.org/LeviLamina/> (the install pages at the old addresses `levilamina.liteldev.com` and `lamina.levimc.org` have moved to the levimc.org tutorial).

*Applies to: all current versions (LeviLamina 26.60.8; lip 0.41.x)*

### How do I upgrade a server running LeviLamina (and LSE) to a new BDS/LeviLamina version? Do I have to reinstall everything?

Before upgrading, back up the entire server directory and make sure the mods you use have versions that support the new release.

Method 1 (lip workspace, recommended): stop the server, then run `lip setup --game <new game version>` in the server directory (add `--dry-run` first to preview the plan), or choose "Change game or loader version…" from the workspace menu in the lip interface. lip uninstalls the old BDS, installs the new BDS and a compatible LeviLamina, and preserves `server.properties`, `allowlist.json`, `permissions.json`, `worlds/`, and `mods/`. It lists any mods that lack a compatible version and asks whether to uninstall them. Note that `lip update` only updates mods; it does not change the game or LeviLamina version. Any packs you added yourself to `behavior_packs/` and `resource_packs/` will be deleted, so back them up outside the workspace first.

Method 2 (fresh install): create an empty folder and install the new server with lip (`lip setup --game <version>`, then `lip install` the mods you need, such as `lip install LegacyScriptEngine#quickjs`). Next, copy `worlds/`, `server.properties`, `allowlist.json`, and `permissions.json` from the old server over the new ones, and copy each mod's configuration and data from the old `mods/` directory (without overwriting the newly installed mod files). Also copy over any server-level resource packs and behavior packs.

LSE script plugins can usually be used as-is, whereas native (C++) mods must be replaced with versions built for the new release. If the server crashes or logs errors after upgrading, check the startup log to identify the incompatible mod.

*Applies to: LeviLamina current version; lip 0.41 and later (`lip setup`); the fresh-install migration method applies to all versions*

### Can I add LeviLamina to an already running vanilla BDS server? Do I need to reinstall?

Yes, and you do not need to recreate the world. However, LeviLamina is strictly tied to the BDS version: each LeviLamina release supports only specific BDS versions (for example, LeviLamina 26.60.8 depends on BDS 1.26.60). If your vanilla BDS version does not match, you must switch to a version that LeviLamina supports.

Recommended approach: create an empty folder, install lip, and run `lip install LeviLamina` inside it. This automatically downloads a compatible BDS, LeviLamina, and its dependencies (such as PreLoader, PeEditor, and bedrock-runtime-data), and PeEditor generates `bedrock_server_mod.exe`. Alternatively, specify the game version with `lip setup --game <BDS version>`, and lip will pick the latest LeviLamina that supports that version. Then copy `worlds/`, `server.properties`, `allowlist.json`, `permissions.json`, and other files from the old server into the new folder, and start the server with `lip run` or by double-clicking `bedrock_server_mod.exe`.

Setting up the files manually (placing `bedrock_runtime_data`, PeEditor, and LeviLamina yourself and then running PeEditor) is not recommended, as it is easy to miss a dependency.

*Applies to: all current LeviLamina versions (install/setup semantics of lip 0.41.x)*

### After installing lip, how do I install a LeviLamina server (and LegacyScriptEngine) from scratch?

1. Install lip, create an empty folder for the server, and open a terminal (cmd or PowerShell) in it.
2. Run `lip install LeviLamina` (equivalent to `lip install github.com/LiteLDev/LeviLamina`). lip automatically downloads the latest BDS version that LeviLamina supports and sets everything up. You must type yes to accept the Minecraft EULA (in scripts, pass `--accept-eula`). You can also specify the game version with `lip setup --game <version>`.
3. If you need script plugins, install LSE with `lip install github.com/LiteLDev/LegacyScriptEngine` (the default variant includes the QuickJS and Lua engines), or install a single engine as needed, such as `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` or `#python`.
4. Start the server with `lip run` or by double-clicking `bedrock_server_mod.exe`.

If your connection is slow, configure a GitHub proxy: `lip config set github_proxy <URL>`. Assembling the server manually is not recommended because dependencies such as language packs and CrashLogger are easy to miss. When reinstalling, always start in a new empty folder. Official tutorial: <https://levimc.org/tutorials/server/first-server/>.

*Applies to: LeviLamina 26.60.x; lip 0.41.x*

### When installing a LeviLamina server with lip on Windows, the command fails or errors midway (for example, a `PeEditor.exe` error). How do I troubleshoot it, and which program do I start afterwards?

1. Make sure lip is installed and the command is typed correctly. In cmd, you cannot use the `./` prefix; use `.\` or run the command without a prefix.
2. Run `lip install LeviLamina` in a new empty folder and wait for it to finish completely. Mid-installation network errors are usually caused by an interrupted download or problems reaching GitHub; retry, or configure a proxy with `lip config set github_proxy <URL>`. If the command fails, check the error message and the full report under `.lip/logs/`.
3. VC++ runtime: during setup, recent versions of lip automatically install a missing Microsoft Visual C++ Redistributable (an administrator permission prompt appears; choosing "No" causes the installation to fail). If an outdated runtime causes a `PeEditor.exe` error or error code 1114, manually install the latest version from <https://aka.ms/vc14/vc_redist.x64.exe>.
4. LeviLamina is tied to specific BDS versions, so do not specify a game version that does not match.

After installation, start the server with `lip run` or by double-clicking `bedrock_server_mod.exe`.

*Applies to: all current LeviLamina versions (Windows); lip 0.41.x*

### Can a rented panel server (game panel or cloud provider) run LeviLamina? What if it runs on my machine but fails to start after I upload it to the panel?

1. System requirements: LeviLamina can only be loaded into the Windows build of BDS. A Windows panel can run it directly. An x64 Linux panel must either be able to run lip (which bundles Wine to run the Windows server) or use the official Docker image `ghcr.io/liteldev/levilamina-server:latest-wine`. A panel that can only start the vanilla Linux `bedrock_server` cannot run it directly. You can tell which OS the panel uses by whether it starts an `.exe`/`.cmd` file or a `.sh` file.
2. Runs locally, fails on the panel (for example, a missing runtime message or error code 1114): the server usually lacks the Microsoft Visual C++ runtime or has an outdated version. Install the latest version from <https://aka.ms/vc14/vc_redist.x64.exe>. If your provider does not allow installing it, copy the VC++ runtime DLLs that the server depends on (such as `msvcp140.dll`, `vcruntime140.dll`, and `vcruntime140_1.dll`) into the server root directory (where `bedrock_server_mod.exe` is located). You can check the exact dependencies with `ldd bedrock_server_mod.exe` in an MSYS2 MINGW64 terminal, or with tools such as Visual Studio's dumpbin.
3. Alternatively, install the entire server locally with lip and upload it, or ask your provider to install it for you. The community also offers third-party panel installation scripts (such as LeviBox on MineBBS), which are not officially maintained.

*Applies to: all current LeviLamina versions*

### Can LeviLamina run on old systems such as Windows 7 / Windows Server 2016 / 2012 R2? It crashes on startup there, or PreLoader reports `Can't load ./plugins/LeviLamina\LeviLamina.dll, Error code: 127` (the specified procedure could not be found). Which system should I choose to run a server?

No. LeviLamina uses newer Windows APIs and a recent VC++ runtime, and supports only Windows 10, Windows 11, or Windows Server 2019 and later. Windows 7/XP, Windows Server 2012 R2, and Windows Server 2016 cannot run it (vanilla BDS runs on old systems, but not once LeviLamina is installed). Error code 127 ("the specified procedure could not be found") when loading `LeviLamina.dll` on an old system is usually caused by a missing system API. Installing a runtime does not fix it; you must upgrade or reinstall the OS. (If error 127 appears on a supported system, it is most likely a dependency version mismatch between LeviLamina and a mod; check the `Dependency diagnostic` in the log.)

Also, in current versions LeviLamina lives under `mods/LeviLamina/`; the `plugins/LeviLamina` path in the error belongs to the old layout.

For running a server, Windows Server 2022 (or 2019 and later) is recommended—the newer, the better. You can also use lip on x64 Linux or macOS (lip bundles Wine to run the Windows server). When you install with lip, it automatically installs the components the server needs, including the VC++ runtime.

*Applies to: all current LeviLamina versions (including 26.60.x)*

### After BDS starts, only PreLoader is running (`LeviLamina not found, PreLoader is running as DLL Loader...`) and neither LeviLamina nor mods are loaded. What is the cause?

PreLoader did not find LeviLamina itself in the mods directory (the loading chain is `bedrock_server_mod.exe` -> `PreLoader.dll` -> LeviLamina -> other mods). Placing only `PreLoader.dll` is not enough; you must also install LeviLamina. Do not download the GitHub repository source code; use the compiled files from a Release. The best way is to install with lip (`lip install github.com/LiteLDev/LeviLamina`), which installs PreLoader, PeEditor, CrashLogger, bedrock-runtime-data, and other dependencies together and generates `bedrock_server_mod.exe`.

In current versions, LeviLamina must be in the server's `mods/LeviLamina/` directory (the folder name is case-sensitive), not in the old root directory or `plugins/`. For manual installs, note that if a `plugins/` directory exists, PreLoader uses it as the mods root first; you can set a different path via `modsPath` in `PreLoaderConfig.json`. If the files are in a mess, the easiest fix is to delete the old files and reinstall with lip.

*Applies to: LeviLamina 1.x and later (currently 26.60.x), server*

### My LeviLamina server is in a directory with Chinese (non-ASCII) characters, and startup or mod loading fails, log paths are garbled, dependencies are reported missing, or it crashes. What should I do?

Move the entire server to a pure English (ASCII-only) path and start it again. Some mods and script engines (for example, GMLIB's past zip extraction logic and the old LSE NodeJS engine) do not handle Chinese paths correctly, which causes these problems. We also recommend using only English for `level-name` in `server.properties`. If you want the world to show a Chinese name in the game, export the map, rename it in the client, and import it again; editing `levelname.txt` directly has no effect.

*Applies to: all current versions (whether it breaks depends on the installed mods). Not confirmed against the source code or the documentation: treat it as a pointer.*

### What is the `.pdb` file that comes with a mod? Where should I put it, and can I delete it?

A `.pdb` file is a debug symbol file. It is not the mod itself and is optional. To use it, put it in the same directory as the mod's `.dll` (under `mods/<mod name>/`, next to the DLL), not in the server root directory. With it in place, the crash stack traces generated by CrashLogger show readable function symbols, which helps developers analyze crashes. If you do not need readable crash logs, you can leave it out or delete it; doing so does not affect operation.

To install the mod itself, lip is recommended (`lip install <package name>`); for a manual install, extract the mod folder from the archive into `mods/`.

*Applies to: all current LeviLamina versions (the mod directory is `mods/`)*

### What is `runtimedata` (`bedrock_runtime_data`) in the LeviLamina server directory? Do I need to install it, and where does it go?

It is the bedrock-runtime-data package (`github.com/LiteLDev/bedrock-runtime-data`), a required dependency of LeviLamina. Think of it as a new form of encrypted and obfuscated PDB/symbol data that must be installed alongside LeviLamina. When you install LeviLamina with lip, lip automatically installs this package as a dependency and extracts it to `bedrock_runtime_data` in the server root directory (at the same level as `bedrock_server.exe`), not in `plugins` or `mods`.

Server and client runtime data are released separately (versions carry a `-server` or `-client` suffix, such as `26.60.6-server.16` and `26.60.5-client.16`). They cannot be mixed; lip automatically selects the right one for the side you install.

*Applies to: LeviLamina versions that use bedrock-runtime-data (including current 26.60.x)*

### There is no loader in my BDS server directory, and JS plugins for LegacyScriptEngine (LLSE) are not loaded when I drop them in. How do I install LeviLamina and LegacyScriptEngine?

Plugins require a loader to run. We recommend using lip: after installing it, run `lip` in the server folder (its built-in terminal UI can install BDS + LeviLamina directly), or follow the official tutorial to set up a server from the command line. Next, install LSE by running `lip install LegacyScriptEngine#quickjs` for JS plugins (other variants are `#lua`, `#nodejs`, and `#python`; omitting the variant installs both the QuickJS and Lua engines). lip automatically installs dependencies such as LegacyRemoteCall, LegacyMoney, and iListenAttentively.

Place plugins in `mods/` (since LSE 0.23.0, `plugins/` is linked to `mods/` at startup). If you drop in a single old-style script directly, LSE generates a folder and manifest for it on the next startup, and loads it only after you restart the server once more.

*Applies to: LeviLamina 26.x; LegacyScriptEngine 0.23.x; lip 0.41.x*

### On Windows, after importing a client mod (dll) such as a minimap with LeviLauncher, nothing happens in the game and the mod list does not show it. What is the cause?

Client mods of this kind depend on the LeviLamina client build. First, install LeviLamina for the instance: enable "Install LeviLamina" when creating the instance in LeviLauncher, or for an existing instance, click the gear icon next to the instance selector on the "Launch" page → "Instance settings" → the "Loader" tab (this corresponds to `levilamina-v<version>-client-release-windows-x64.zip` in the release).

LeviLamina supports only specific GDK game versions. The "Loader" column on the download page shows the supported LeviLamina version, while unsupported versions display "This game version does not support LeviLamina". The mod itself must also be the client variant and match the instance's game and LeviLamina versions. It is best to install mods from "LeviMC Mods" on the launch page, which lists only mods compatible with the instance's LeviLamina. To import a mod manually, go to "Manage mods" → "Import .mcmod" (select "All files" for `.zip`/`.dll`).

*Applies to: LeviLauncher (Windows) current version; LeviLamina client*

### I deployed LeviLamina on a panel server (a hosted server where lip cannot run directly), and PreLoader reports errors or the server crashes frequently on startup. Is PreLoader broken?

This usually happens because the server files are incomplete. A common cause is a missing bedrock-runtime-data (`github.com/LiteLDev/bedrock-runtime-data`), a required LeviLamina dependency that must match the LeviLamina version. Instead of assembling the files manually, install the server locally on your computer with lip (`lip setup --game <version>` or `lip install LeviLamina`). lip installs BDS, PreLoader, bedrock-runtime-data, CrashLogger, levilamina-loc, and other dependencies, and runs PeEditor on the exe. Once you confirm that the server starts normally on your machine, package the entire server directory and upload it to the panel server.

*Applies to: LeviLamina 1.x up to the current version*

### I want to install plugins (such as CoralFans) on a Bedrock BDS server. Do I need LeviLamina or Endstone?

It depends on which platform the plugin is built for. For LeviLamina mods, install LeviLamina. For Endstone plugins, either install Endstone, or install LeviStone on LeviLamina to run them (LeviStone supports only Endstone plugins written in Python; to install it, run `pip install levistone --target mods/EndstoneRuntime` in the directory of a server that already has LL installed).

CoralFans is a LeviLamina mod, so you need LeviLamina with an LL version that CoralFans supports. Installation docs: <https://coralfans-dev.github.io/CoralFans-doc/#/InstallDoc>.

### When installing LeviLamina manually, what does `-server.1` mean in a bedrock-runtime-data dependency version such as `26.10.4-server.1`? Is it related to the `bedrock_server` version?

`-server` indicates runtime data for the server (BDS); the client uses `-client.N`. The number N is the data package's release sequence number, which increments on every re-release and is unrelated to the `bedrock_server` version. The leading version matches the game build: for example, `26.60.6-server.N` is for BDS 1.26.60.6, and `26.60.5-client.N` is for client 1.26.60.5 (see the LeviLamina supported versions table).

When installing manually, do not pick a version arbitrarily. Use the exact version listed under `deps` in LeviLamina's `lip.toml`. For example, the LeviLamina 26.60.8 server depends on `"github.com/LiteLDev/bedrock-runtime-data" = "26.60.6-server.16"`. This is usually the highest sequence number released alongside that LL version. We recommend installing with lip, which installs the right version automatically.

*Applies to: LeviLamina 26.x current version*

### When I manually extract several plugin/mod archives into the server directory, the `README.md`, `CHANGELOG.md` and `LICENSE` files conflict by name. What should I do?

`README.md` (description), `CHANGELOG.md` (changelog), and `LICENSE` (open-source license) are not needed at runtime, so you can skip or delete them and keep only the plugin's own files. Each LeviLamina mod belongs in its own `mods/<mod name>/` subdirectory (with its `manifest.json`), which usually prevents conflicts between mods. LLSE script plugins can go in `plugins/` (since LSE 0.23.0 this is a link to `mods/`, and at startup the plugins are migrated automatically with a generated manifest). We recommend installing with lip so you don't have to extract archives manually.

*Applies to: all current versions (manual installation)*

### Which components do I need to install to run a plugin server with LeviLamina?

We recommend installing with lip (docs: <https://levimc.org/lip/>). In the server directory:

1. `lip install LeviLamina` (or `lip setup --game <version>`) installs BDS + LeviLamina.
2. To run LLSE script plugins, install LegacyScriptEngine: `lip install LegacyScriptEngine` (without a variant, this installs both the QuickJS and Lua engines), which covers most uses.
3. Run `lip install LegacyScriptEngine#nodejs` only if you use NodeJS plugins; for Python plugins, use the `#python` variant. Install them only as needed.

Then start the server with `lip run`.

*Applies to: lip 0.40 and later; LegacyScriptEngine current version*

### When running LeviLamina on Linux with wine, the console terminal is misaligned, typed commands display incorrectly, or there are encoding problems. What should I do?

When running manually under wine, you can pipe stdin/stdout through a small wrapper program (such as the community-written Go tool pts): `pts env WINEDEBUG=-all wine cmd /c bedrock_server_mod.exe`. This fixes terminal misalignment and some encoding issues, while `WINEDEBUG=-all` suppresses wine's debug output. Running LL requires only the 64-bit VC++ runtime (vcrun2022), not the 32-bit one.

lip also now officially supports x64 Linux and macOS (a Mac with Apple silicon requires Rosetta 2): run `lip setup --game <version>` and then `lip run`. lip bundles Wine, installs the VC++ runtime automatically, and sets `WINEDEBUG=-all` by default (note that lip requires glibc 2.27+ and does not support Alpine).

*Applies to: running a LeviLamina server through Wine on Linux. Not confirmed against the source code or the documentation: treat it as a pointer.*

### When running `bdsdown.exe`, it stops at the Minecraft EULA / privacy policy prompt, typing y has no effect, and LeviLamina reports a BDS protocol version mismatch. How do I download a specific BDS version?

Pass the agreement flag and the version on the command line: `bdsdown.exe -y --source version://windows/x.x.x.x`, replacing `x.x.x.x` with the full four-part BDS build number that your LeviLamina version supports (look it up at <https://levimc.org/LeviLamina/versions/>; for example, LeviLamina 26.60.x uses 1.26.60.6, whereas the `github.com/LiteLDev/bds` dependency in LeviLamina's `lip.toml` lists only the three-part 1.26.60).

However, we now recommend using lip directly: `lip setup --game <game version>` (add `--accept-eula` in scripts) downloads the matching BDS and LeviLamina automatically.

*Applies to: bdsdown v1.x (currently v1.2.1)*

### LeviLamina cannot load after installing with lip or manually (it works only once after a computer restart). What could be the cause?

The most common cause is a mismatch between the BDS version and LeviLamina. Installing with lip automatically installs a matching BDS version based on the dependencies. If the version matches and LeviLamina still fails to load, check whether antivirus software (such as 360) deleted or blocked related files—such as PreLoader, the `bedrock_server_mod.exe` generated by PeEditor, or DLL files in the `mods` directory. Disable the antivirus or add the server directory to its allowlist, then reinstall.

*Applies to: all current versions (Windows server). Not confirmed against the source code or the documentation: treat it as a pointer.*

### Two seemingly identical LeviLamina servers: on one, a mod loads but its commands do not work, while the other works fine. What is the cause?

Non-ASCII characters (such as Chinese) in the server path can cause various odd problems, such as a mod loading without its commands working. Try moving the server to an ASCII-only (English) path without spaces.

*Applies to: general troubleshooting advice. Not confirmed against the source code or the documentation: treat it as a pointer.*

### A tutorial says to edit `plugins\LeviLamina\config\Config.json` (`simpleServerLogger`, `playerInfo` and so on), but the LeviLamina I downloaded has no such config file. Why?

The config file is generated automatically only after you start the server once and LL loads normally. (If the file is missing or unreadable, LL rewrites it with default values.) Also, manual installation tutorials are mostly outdated. Follow the official tutorial and install with lip instead—for example, by running `lip install github.com/LiteLDev/LeviLamina` (or `lip setup --game <version>`) in an empty directory to install BDS and LeviLamina together. Note that in newer versions, these two options are under `targeted.simpleServerLogger` and `targeted.playerInfo`.

*Applies to: LeviLamina 1.x and later; lip syntax follows the current lip 0.41*

### To see server errors (for example an addon model that fails to load), is it useful to open the CrashLogger program? How should I start the server?

No. CrashLogger is just a tool that LeviLamina starts automatically after the server starts to record crash information when a crash occurs. You do not need to open it, and you should not open it manually. To run the server, start `bedrock_server_mod.exe` (or use `lip run`). Addon errors generally do not crash the server; instead, they are printed to the console and to the logs in the `logs` directory, so check there.

*Applies to: LeviLamina, all current versions*

## PreLoader and PeEditor

### `bedrock_server_mod.exe` was not generated after installing LeviLamina (or double-clicking `PeEditor.exe` closes immediately / only prints `No work to do, exiting...`). How do I generate it manually with PeEditor?

Normally, you do not need to run PeEditor manually: installing LeviLamina with lip runs `.\PeEditor.exe -mb` automatically. If `bedrock_server_mod.exe` was not generated (or if you installed manually or use a hosting panel), open cmd or PowerShell in the server root directory (where `bedrock_server.exe` is located) and run:

```powershell
.\PeEditor.exe -mb
```

(Use `-m` to generate the file without making a backup.)

Note: Run without arguments, PeEditor does nothing and prints only `No work to do, exiting...`; double-clicking it simply makes the window flash and close. You must pass the `-m` argument on the command line.

- `-m` generates `bedrock_server_mod.exe`.
- `-b` renames the original to `bedrock_server.exe.bak`.
- `--exe` specifies the source executable (default `./bedrock_server.exe`).
- `-o` specifies the output directory.
- `--verbose` prints detailed logs.

Then start the server with `bedrock_server_mod.exe` (run it from the command line so you can see any errors).

Errors when running PeEditor itself are usually caused by an outdated VC++ runtime; install <https://aka.ms/vc14/vc_redist.x64.exe> and try again. For manual installations, the PeEditor and PreLoader versions must match the LeviLamina version (check the dependency versions in `lip.toml` or `tooth.json` in the LeviLamina package), which is why installing with lip is officially recommended.

*Applies to: LeviLamina 1.x and later (PeEditor 3.8+, currently 3.9.3)*

### An error occurs in the PeEditor step when installing LeviLamina, or `PeEditor.exe` won't open or run when started manually. How do I fix it?

This is usually caused by a missing or outdated Microsoft Visual C++ runtime (for example, right after reinstalling the OS). Install the latest VC++ 2015-2022 x64 runtime from <https://aka.ms/vc14/vc_redist.x64.exe>, then reinstall LeviLamina, or run `.\PeEditor.exe -mb` manually from the command line in the BDS directory (the argument is required; double-clicking the executable does not work).

Note: if LeviLamina did not actually install successfully earlier, installing packages that depend on it—such as LSE—will also fail. Reinstall LeviLamina first (use `lip list` to check the installed packages).

*Applies to: all current LeviLamina versions*

### All the LeviLamina files are in place, but LL is not loaded when I start BDS (or it crashes right at startup). What is wrong?

For a manual installation, run `PeEditor.exe -m` once from the command line in the BDS directory (a lip installation runs `PeEditor.exe -mb`, which also renames the original file to `bedrock_server.exe.bak`). This generates `bedrock_server_mod.exe` from `bedrock_server.exe`. After that, you must start `bedrock_server_mod.exe` instead of the original `bedrock_server.exe`; only then is LeviLamina loaded through PreLoader.

We recommend installing LeviLamina directly with lip (`lip setup` / `lip install LeviLamina`): it installs dependencies such as PreLoader and PeEditor and applies the patch automatically. Then start the server with `lip run`.

*Applies to: all current LeviLamina server versions*

### The bundled `PeEditor.bat` fails to patch when I use a LeviLamina+LSE server pack from a third-party forum (such as MineBBS). What should I do?

Do not use `PeEditor.bat` from a third-party server pack. Install LeviLamina with lip instead (`lip setup`, or `lip install LeviLamina` followed by `lip install LegacyScriptEngine`); it installs the dependencies automatically and runs `PeEditor.exe -mb` to generate `bedrock_server_mod.exe`. Alternatively, install it manually by following the official tutorial (run `PeEditor.exe -m` in the BDS directory, then start `bedrock_server_mod.exe`).

*Applies to: current LeviLamina server version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### When running LeviLamina on a Linux server with wine, PeEditor fails to generate `bedrock_server_mod.exe`. What should I do?

The recommended approach is now the Linux build of lip: on x64 Linux, `lip setup` downloads and configures Wine and the Visual C++ runtime on its own, and runs PeEditor automatically when installing LeviLamina. You can then start the server with `lip run` without having to install wine or winetricks yourself. You can also use the official Docker image `ghcr.io/liteldev/levilamina-server:latest-wine`.

If you still want to install manually with your own wine setup, generate the file with `wine PeEditor.exe -m`, make sure the wine prefix is 64-bit (`WINEARCH=win64`), and install the VC runtime with winetricks:

```shell
sudo wget -O /usr/local/bin/winetricks https://raw.githubusercontent.com/Winetricks/winetricks/master/src/winetricks
sudo chmod +x /usr/local/bin/winetricks
winetricks dlls vcrun2022
```

To hide wine's error output, use `export WINEDEBUG=-all`. Also make sure the BDS version matches the installed LeviLamina version.

*Applies to: LeviLamina server, current version, x64 Linux (lip 0.41.x)*

### My manual LeviLamina installation did not finish (or I switched to manual after a lip installation failed). What do I do next? After starting, it reports that `CrashLogger.exe` is missing. What should I do?

For a manual installation, run the patcher `PeEditor.exe` (`PeEditor.exe -m`) once in the BDS directory and start the server with the generated `bedrock_server_mod.exe` to complete the LL installation.

If the server reports after startup that `CrashLogger.exe` cannot be found, place `CrashLogger.exe` in the LeviLamina mod directory (`mods/LeviLamina/CrashLogger.exe` by default). This path is configured by `modules.crashLogger.externalpath` in `mods/LeviLamina/config/Config.json`; it is relative to the LeviLamina mod directory and defaults to `CrashLogger.exe`. If you do not need external crash logs, you can instead set `crashLogger.enabled` to `false`.

We recommend installing with lip whenever possible: it sets up dependencies such as CrashLogger automatically. Otherwise, you will also have to track down dependencies such as LSE NodeJS by hand.

*Applies to: LeviLamina server, current version (CrashLogger 1.4.x)*

### After upgrading LeviLamina I also upgraded/overwrote BDS separately, and now the server won't start and shows no error. How do I fix it?

PeEditor generates `bedrock_server_mod.exe` from `bedrock_server.exe`. After overwriting or upgrading the BDS files, you must run `PeEditor.exe -m` again to regenerate `bedrock_server_mod.exe`, as the old one is not updated automatically.

Also, each LeviLamina version supports only a specific BDS version (the `bds` dependency in its `lip.toml` is pinned to an exact version; for example, LL 26.60.8 corresponds to 1.26.60), so do not upgrade BDS on its own. Upgrade everything together with `lip update LeviLamina`; lip installs the matching BDS and runs `PeEditor.exe -mb` automatically.

*Applies to: all current LeviLamina server versions*

### I installed PeEditor on its own with lip but there is no PreLoader. Aren't PeEditor and PreLoader together?

PeEditor is not PreLoader. PeEditor is the patching tool that injects PreLoader into the game executable (it generates `bedrock_server_mod.exe` or patches `Minecraft.Windows.exe` in place), while PreLoader is the library (`PreLoader.dll`) that loads LeviLamina at runtime. They are separate lip packages (`github.com/LiteLDev/PeEditor` and `github.com/LiteLDev/PreLoader`).

Do not install these dependencies individually. Instead, install LeviLamina itself with lip; this automatically pulls in all dependencies—such as PreLoader, PeEditor, and CrashLogger—and applies the patch.

*Applies to: all current LeviLamina versions*
