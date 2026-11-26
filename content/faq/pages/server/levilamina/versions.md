# LeviLamina versions and compatibility

## Can LeviLamina still support new versions now that Mojang no longer publishes the BDS PDB? What is the bedrock runtime data (magic blob) that LeviLamina provides?

Yes. Starting with the BDS 1.21 preview in June 2024, public BDS builds no longer ship with a PDB, and for a while it looked like LeviLamina would be stuck at 1.20.81/1.21.0. LiteLDev then reached an agreement with Mojang, which now provides the PDB and other debug information to LiteLDev privately. As a result, 1.21.10 was skipped, and internal work resumed with 1.21.20. After 0.13.x, the next official release was 1.0.0-rc.1 in January 2025, supporting BDS 1.21.50.

LiteLDev packages this debug information as bedrock runtime data (commonly called the magic blob; essentially hashed symbol data) and distributes it publicly in place of the raw PDB. Both loading and developing mods depend on it, though the raw symbols themselves are not published. Because LeviLamina uses the PDB mainly to generate the symbol table and headers automatically, support for each new version depends on when Mojang delivers the debug information to the team. Server owners who only install addons and run vanilla BDS are not affected.

LeviLamina currently keeps up with new versions (for example, v26.60.8 matches the Minecraft 26.60.6 server). At build time, the xmake package `bedrockdata` fetches the matching bedrock-runtime-data automatically.

*Applies to: LeviLamina 1.0.0 (BDS 1.21.50) and later; 0.13.x matches BDS 1.21.0x/1.21.3, which had a public PDB*

## Did the native mod directory change from `plugins` to `mods` in LeviLamina 26.60? Where do LSE script plugins go, and do existing LSE plugins that call native mod interfaces need to change paths?

Yes. Starting with 26.60, native server mods go in the `mods` directory (matching the client), and LeviLamina's own configuration lives under `mods/LeviLamina/`. A mod will migrate cleanly as long as it gets paths through the LL API instead of hardcoding `plugins`.

Starting with 0.23.0, LegacyScriptEngine creates the server's `plugins` folder at startup as a directory link (junction) to `mods`, making `plugins` and `mods` effectively the same folder. This only works if the server directory does not already have a `plugins` folder. If a regular `plugins` folder already exists, LSE skips creating the link and logs the error `Failed to create a link at …: a file or directory with the same name already exists`. If that happens, move its contents into `mods/` and delete the old `plugins` folder.

Place LSE plugins under `mods/`, with one folder and a `manifest.json` per plugin. Old scripts that hardcode `plugins/` paths still work. If you drop in a single old-style script, LSE generates a folder and manifest for it on the next startup; restart once more to load it. LSE plugins that call interfaces exported by other plugins through `ll.import` need no changes at all.

*Applies to: LeviLamina 26.60 and later; LegacyScriptEngine 0.23.0 and later*

## A dependency library such as GMLIB (or a plugin that depends on it) fails to load or reports an unsupported BDS version, or the dependency diagnostic shows missing symbols in `LeviLamina.dll`. What should I do?

This happens when the library version does not match your current LeviLamina/BDS version. Because a native mod is compiled against a specific LeviLamina version, changing the LL version can remove exported functions that the mod calls. You can spot this in the log when the dependency diagnostic lists `|- LeviLamina.dll` under `missing content:`, with the missing function symbols listed under `|---- ` (older versions print `missing procedure:` and missing procedure symbols).

To fix it:

1. Install with lip (for example, `lip install github.com/GroupMountain/GMLIB`). Without a version specified, lip picks the highest version tag in the repository. `lip install` does not change your installed game or loader; if that version requires a different LL version, the command fails and prints the required game/loader version along with a `lip setup` hint. You can then either install a version that matches your LL with `lip install github.com/GroupMountain/GMLIB@<version>`, or use `lip setup` to switch to a game/loader version the mod supports.
2. For a manual install, download the release that matches your LL version from GMLIB's GitHub Releases (<https://github.com/GroupMountain/GMLIB/releases>). Re-uploads on forums are often out of date.
3. Switch any plugins that depend on GMLIB to matching versions as well. Avoid downgrading LL casually; instead, upgrade the dependency to match your current LL, or upgrade LL/BDS together and then install the new dependency version.

The "running on an unsupported BDS version" warning means some interfaces may not work. To avoid crashes or freezes, use a supported version.

## Starting a LeviLamina server fails with FATAL `Couldn't find: MolangVariable::~MolangVariable(void)` / `Couldn't find: MolangDataDrivenGeometry::~MolangDataDrivenGeometry(void)` followed by `In module: BedrockServerClientInterface`, and the mod does not load. What should I do?

`Couldn't find: <symbol> / In module: <mod name>` means that the current BDS is missing a function symbol referenced by the mod—in this case BedrockServerClientInterface (BSCI), a common dependency for mods that work with simulated players and client interfaces. The mod version does not match your LeviLamina/BDS version (usually because the mod is older).

Update BSCI to the version that matches your LeviLamina/BDS. BSCI version numbers now follow the game version (for example, v26.60.0 matches BDS 1.26.60). Download the matching version from <https://github.com/OEOTYAN/BedrockServerClientInterface/releases>, or install or upgrade it with lip. Conversely, if you must use an older mod, use the BDS/LeviLamina version it was compiled for.

## The client version does not match the LeviLamina server version (the message says the client is outdated or the host version is too low), or LeviLamina does not support the new version yet. How can clients of different versions join the same server (cross-version / multi-version play)?

Each LeviLamina version supports only one BDS version and has no built-in cross-version feature. The client's protocol number must match the server's (minor versions with the same protocol number, such as 1.21.60 and 1.21.62, can connect directly). For cross-version play, use a third-party protocol translator:

1. Glacie (by GlacieTeam; supports both LeviLamina and Endstone, with LeviLamina officially recommended): Glacie depends on ProtocolLib, so you must install both. Install Glacie with `lip install github.com/GlacieTeam/Glacie`, or download `Glacie-levilamina-windows-x86_64.zip` from <https://github.com/GlacieTeam/Glacie/releases>, and download ProtocolLib from <https://github.com/GlacieTeam/ProtocolLib/releases>. GitHub Releases is the only official download source; copies on MineBBS and similar sites may be outdated. The Glacie version must match the server's BDS/LeviLamina version (for example, v3.10.3 matches BDS 1.26.60.x + LeviLamina 26.60.x); a mismatched version will crash. For the range of supported client versions, see the protocol table in the ProtocolLib README.
2. Endweave (EndstoneMC/endweave, an Endstone plugin): on LeviLamina, first install LeviStone (`pip install levistone --target mods/EndstoneRuntime`) to run Endstone plugins, then install Endweave. It translates between the protocol versions in its support table (currently 26.40 to 26.60).
3. Alternatively, downgrade the client to match the server, or wait for LeviLamina to support the new version and then upgrade the server.

## Is there a LeviLamina version for BDS 26.0? How do I choose a BDS version?

No. LeviLamina jumped directly from 1.9.x (BDS 1.21.132) to 26.10.0 (supporting 26.10) and never supported 26.0. LL supports only specific BDS versions, not every release (support requires data from Mojang, so progress depends on Mojang).

Choose your LeviLamina version first, then install the matching BDS version. When you install LeviLamina with lip, it installs the matching BDS automatically through the `github.com/LiteLDev/bds` dependency (for example, the current LeviLamina 26.60.x matches BDS 1.26.60). Chasing the newest version is not recommended.

## Why can't LeviLamina support a new version on the day BDS is released? How long does it take?

LeviLamina's progress depends on Mojang: Mojang must provide the LL team with that version's symbol data (PDB and other files, which are no longer public). From that data, the team generates the data needed by bedrock-runtime-data and PreLoader, and then adapts LeviLamina itself. Work cannot start until the data arrives, and asking for updates will not speed it up.

In addition, starting with 1.21.60, Mojang raised the compiler inlining level, inlining many functions and making updates harder and slower (LeviLamina implemented or restored some inlined functions in versions such as 26.32.0 and 26.40.1).

*Applies to: LeviLamina 1.0 and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I look up which LeviLamina version matches which BDS (and LSE, etc.) version? If I want to install LeviLamina on a BDS version that is not the latest, which version do I choose and how do I install it?

Each LeviLamina version series supports a single specific BDS version. You can look up the mapping in three places:

1. The official "Supported versions" documentation page: <https://levimc.org/LeviLamina/versions/> (for example, 26.60.x matches server 1.26.60.6 / client 1.26.60.5, 26.51.x matches 1.26.51.1, 1.9.x matches 1.21.132.3, 1.6.x matches 1.21.111.1, 1.5.x matches 1.21.102.1, and 0.12.x matches 1.20.8x).
2. The `Adapted to Minecraft ...` entries in the LeviLamina CHANGELOG and GitHub Release notes.
3. The dependency declarations in the package file. Since v26.60.8, the package file is `lip.toml` instead of `tooth.json`, and `"github.com/LiteLDev/bds" = "1.26.60"` under `[variants."".deps]` gives the required BDS version. The `lip.toml` of mods such as LSE also states the supported LeviLamina version range (for example, `"github.com/LiteLDev/LeviLamina" = "26.60.*"`).

Starting with 26.x, the first two segments of the LeviLamina version number match the BDS version (26.60.x ↔ 1.26.60). Note that `versions.txt` in the LiteLDev/bds repository is only a list of full BDS version numbers, not an LL mapping table.

We recommend installing with lip, which resolves the versions of dependencies such as BDS, PreLoader, PeEditor, and bedrock-runtime-data together:

- `lip install github.com/LiteLDev/bds@1.26.60 LeviLamina`: installs the specified BDS version and automatically selects the latest LeviLamina that supports it.
- `lip install LeviLamina@<version>`: installs the specified LL version and the latest BDS it supports.
- To change the game or LL version of an existing server, run `lip setup --game <version> --loader levilamina@<version>`.

You must also replace any mods from older versions with builds that match the target LL version. LeviLamina goes back to 0.1.x (BDS 1.20.4x); earlier BDS versions can only use the archived LiteLoaderBDS.

## Must the last segment of the BDS version that LeviLamina supports (such as the x in 1.26.10.x, or 1.21.0 versus 1.21.2) also match exactly?

Yes, it must match exactly. Each LeviLamina version series supports a single full BDS version number, including the last segment. For example, 26.60.x supports only server 1.26.60.6 (client 1.26.60.5), and 26.10.x supports only 1.26.10.4. Even minor BDS updates released afterward, such as 1.26.61 and 1.26.62, cannot be used directly. If the versions differ, LL will not work properly—BDS typically exits or crashes right after loading.

Always use the exact BDS version that your LL version requires. The easiest way is to install with lip (`lip install github.com/LiteLDev/bds@<version> LeviLamina` or `lip setup`), which selects matching versions automatically.

## Can a new LeviLamina (and LSE) be installed on an older BDS version? Which LL should I use for an older BDS, and where do I download it?

No. LeviLamina is not backward-compatible or cross-compatible across BDS versions. Each LL version supports only the BDS version listed in its release notes and version table (for example, LL 1.7.7 matches BDS 1.21.124, 1.9.x matches 1.21.132.3, and an LL built for 1.21.60 cannot run on 1.21.50). Mods such as LSE also depend on a specific LL version, so to get fixes from a newer LL or LSE, you must upgrade BDS as well. If your server runs an older BDS, use the older LeviLamina release that supports it (see <https://levimc.org/LeviLamina/versions/>). Some BDS versions, such as 1.21.30, have no matching LL release at all, so you will need to switch to a supported BDS version.

You do not need to edit download links by hand to get an older BDS—install it directly with lip. Running `lip install github.com/LiteLDev/bds@<BDS version> LeviLamina` installs that BDS and automatically selects the latest LL that supports it, while `lip install LeviLamina@<LL version>` installs the specified LL and its matching BDS. lip downloads the server from the official source through bdsdown.

## Does LeviLamina support BDS preview (Preview/Beta) versions? Can I force it to run on a preview?

No. LeviLamina supports only specific release builds of BDS. For each supported version, its headers, symbols, and bedrock-runtime-data are regenerated against the release build. Preview builds have no matching support data, so running LeviLamina on one will either fail to start or crash shortly afterward. Download the release BDS that matches your LeviLamina version (installing with lip is recommended). If you just want to experiment on a preview build, you can use PreLoader to load your own code, but LeviLamina itself cannot run on a preview.

## After upgrading LeviLamina, do my existing plugins/mods still work? Do I need to update them too?

It depends on two cases:

1. A minor upgrade within the same LL version series (where only the last segment changes, such as 1.7.3→1.7.4, 1.9.5→1.9.9, or 26.60.1→26.60.8) does not cross game versions. LeviLamina follows semantic versioning, so plugins generally keep working without updates.
2. An upgrade across BDS versions (such as 1.21.50→1.21.60, 1.4.x→1.5.x, or 1.9.x→26.10.x): native (dll) mods generally cannot be used as-is. Their authors must adapt, recompile, and release a matching build for the new version (for example, GMLIB and iListenAttentively). When a new version comes out, usually only LiteLDev's own mods are updated right away. LSE (LegacyScriptEngine) script plugins (JS/Lua, etc.) usually keep working as long as LSE itself is updated to support the new version. Before upgrading, check the changelog of each mod you use to confirm that it has a release for the new LL version.

If you manage the server with lip, `lip setup` changes the game and LL versions, re-resolves your installed mods, and automatically updates dependencies such as PreLoader and bedrock-runtime-data according to LeviLamina's `lip.toml`. You can search for and download native mods on the LeviMC mod site at <https://levimc.org/mods/>. If an old mod is no longer maintained and cannot be found, you can simply delete it as long as no other mod depends on it.

## After Minecraft switched to version numbers starting with 26, how did LeviLamina's version number change? What is the next version after 1.9.x?

Starting with support for BDS 1.26.10, LeviLamina's version number follows the MC version. The next version after 1.9.x (which matches BDS 1.21.132) is 26.10.0 (followed by 26.10.1 and so on); there is no 26.0. Subsequent versions are 26.20.x, 26.32.x, 26.40.x, 26.51.x, and 26.60.x, where the major and minor numbers match the supported MC version (for example, LeviLamina 26.60.x matches BDS 1.26.60.6).

*Applies to: LeviLamina 26.10.0 and later*

## Is LeviLamina no longer tied to a specific version of Bedrock BDS? How do I get the matching BDS version?

Each LeviLamina version still matches a specific BDS version (for example, LeviLamina 26.60.8 matches BDS 1.26.60). When you install LeviLamina with lip, it automatically downloads and installs the matching BDS (package `github.com/LiteLDev/bds`), so you do not need to match it manually. Run `lip install LeviLamina` to install the latest LeviLamina and its supported game version, or run `lip setup --game <version>` to specify a game version (lip selects the latest LeviLamina that supports it, or reports an error if there is no match).

## A third-party server pack (such as a LeviLamina+LSE pack on MineBBS) does not start (the PeEditor step and others fail). Must the BDS version match? Can I install without lip?

The BDS version must match LeviLamina exactly; even another version with the same protocol number will not work (for example, LeviLamina 1.3.x works only with BDS 1.21.80, and current LeviLamina 26.60.8 matches BDS 1.26.60). Installing with lip is recommended (`lip install LeviLamina` or `lip setup --game <version>`). It automatically downloads the matching BDS and sets up PreLoader, PeEditor, and the runtime data (bedrock-runtime-data). If lip fails to install or start, try disabling your antivirus software.

You can also install without lip, but you must manually download the matching BDS, PreLoader, PeEditor, and bedrock-runtime-data (using the versions listed under deps in LeviLamina's `lip.toml`), extract them into the same directory, and run `.\PeEditor.exe -mb` to patch BDS. After installation, start the server with `bedrock_server_mod.exe` (or `lip run`).

## Right after updating LeviLamina to a new major version, the log fills with fatal/error messages when loading plugins and the server then crashes. What is going on?

This happens because the plugins or their dependency libraries do not yet support the new LeviLamina/BDS version. If a fatal error appears during loading (such as `Couldn't find:` followed by a symbol), the server is almost guaranteed to crash once it starts running. These errors have two main causes: either an MC API or symbol used by a plugin no longer exists in the new version, or a required dependency (such as GMLIB, LegacyRemoteCallApi, or iListenAttentively) does not support the new version yet. To fix this, either wait for the plugins and dependencies to be updated, or stay on the older LeviLamina and matching BDS versions that they support.

## LeviLamina's startup log shows "Loading XXX (such as CustomMap) … ERROR [LeviLamina] Failed to load XXX". What should I do?

This usually means the mod version does not support your current LeviLamina/BDS version (the log normally gives the specific cause right after, such as a missing dependency or symbol). Wait for the mod author to release an update, or downgrade both BDS and LeviLamina to a version the mod supports. Because each LeviLamina version is tied to a specific BDS version, downgrading LeviLamina alone will not work; use `lip setup` to switch the game and loader versions together. When posting logs, always post the complete log file.

## The console says a mod does not support the current BDS version, but the mod still seems to run normally. Do I need to do anything?

Yes. The message means the mod does not match the current BDS version; it simply has not yet reached the code that breaks because of invalid symbols or offsets. Once that code runs, the server may crash outright. Switch to a mod version that matches your current BDS and LeviLamina versions.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## The server startup log stops after the PreLoader lines `Loading Reverse Lookup Table` / `Preloading: LeviLamina` / `LeviLamina Loaded.` and the server crashes immediately with an empty `latest.log`. What is the cause?

Usually, the BDS version does not match the LeviLamina version. Use the BDS version that matches LeviLamina, and check that the BDS files are complete. Install LeviLamina with lip to resolve matching dependencies automatically, and run the server directly in a console to see the full output instead of relying only on a control panel or `latest.log`.

*Applies to: LeviLamina 1.x and later (versions that use PreLoader). Not confirmed against the source code or the documentation: treat it as a pointer.*

## The server reports errors or crashes when loading a mod (for example, a mod compiled for LeviLamina on BDS 1.21.80 installed on BDS 1.21.60). What is the cause?

The mod does not match the server and LeviLamina versions. A mod must be compiled for the exact LeviLamina version you are running (and the BDS version it is tied to). Switch to a matching version of the mod, or upgrade the server and LeviLamina together to the versions the mod requires.

## After installing LeviLamina and mods such as iListenAttentively, the server crashes and the log says the LeviLamina version is too old or the data does not match. What is the cause?

The bedrock-runtime-data version does not match LeviLamina, or the LeviLamina version is too old and does not match BDS. LeviLamina, bedrock-runtime-data, and BDS must all match. Install or upgrade them together with lip (LeviLamina's `lip.toml` pins the exact bds and bedrock-runtime-data versions), and update your mods to matching versions as well.

## Injecting Onix Client together with the LeviLamina client causes problems (even a shutdown). Can this be fixed?

The two conflict over hooks, and the problem basically cannot be solved. Do not use the LeviLamina client alongside an injected third-party client such as Onix.

*Applies to: LeviLamina client 1.8.x and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can a LeviLamina client mod made for one version (such as 26.30) be used on a nearby version (such as 26.33)?

Not necessarily. Nearby versions that share a protocol can play together, but the function and symbol addresses that a mod hooks may still differ. Native mods must be built for the exact game version, and close version numbers do not guarantee compatibility (for example, some mods released a separate 26.33 build). Use the mod build that matches your game version.

## Why can't iOS players join a BDS server that uses NetherNet by IP, while Android/Windows players can?

With RakNet, players on all platforms can join. The iOS issue is specific to NetherNet: Mojang has not updated the iOS app policy to allow plaintext HTTP access by IP (which NetherNet signaling uses), so iOS clients cannot connect by IP to a NetherNet server. If iOS players need to join, switch to RakNet.

*Applies to: BDS 26.x with NetherNet. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After upgrading only LegacyScriptEngine (or only LeviLamina), all plugins report errors (the console is full of red). Why?

The versions of BDS, LeviLamina, LegacyScriptEngine, and native mods correspond one to one; a mismatch in any of them causes errors. When upgrading, update BDS, LeviLamina, LSE, and all native mods together to matching versions. Managing them with lip is recommended, as it resolves dependency versions automatically.

## How do I find out which BDS (game) version the current LeviLamina matches/runs on?

Run the `version` command in the server console. It prints `Game version <game version> with LeviLamina-<LL version>.`, which shows both the game (BDS) version and the LeviLamina version. This command is enabled by default; you can disable it or change its permission under `modules.command.versionCommand` in the LeviLamina configuration. BDS also prints the game version in its startup log. In addition, the `github.com/LiteLDev/bds` dependency in LeviLamina's `lip.toml` specifies the BDS version that a given LL version supports (for example, LeviLamina 26.60.8 depends on bds 1.26.60).

## Can a world from a game with a different minor version (such as 26.52.3) still be used on a LeviLamina server? Do I need to downgrade?

Place the world folder directly into the server's `worlds` directory and specify it in `level-name` in `server.properties`. Worlds from different minor versions within the same major version can generally load directly without downgrading. However, moving a world from a newer version to an older server still carries compatibility risks, so back it up first.

*Applies to: vanilla BDS world behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After upgrading the BDS version of a LeviLamina server (extracting the new version and copying the world over), all mods/plugins stopped working. Why?

Mods must match both the game (BDS) and LeviLamina versions; a C++ mod runs only on the LL version it was compiled for. After upgrading the server, you must also update all mods to versions that support the new version—you cannot upgrade only the server and keep the old mods.

We recommend managing your server with lip: `lip setup --game <game version> --loader levilamina` changes the game and LeviLamina versions (while keeping and re-resolving compatible packages), and `lip update` then updates the mods. `lip update` on its own does not change the game or the loader.

## The server starts normally with `bedrock_server.exe`, but with `bedrock_server_mod.exe` it crashes while loading the world with no log, and LeviLamina seems not to have loaded. What is the cause?

Usually, the BDS version does not match LeviLamina (an unsupported BDS version is installed), preventing LL from loading. Each LL version supports only a specific BDS version (see the bds dependency in LeviLamina's `lip.toml`). The simplest fix is to set up the server with lip in an empty directory by running `lip install LeviLamina` (or `lip setup --game <game version> --loader levilamina`). lip automatically installs the matching BDS and LeviLamina and generates `bedrock_server_mod.exe`.

## Can I downgrade LeviLamina manually? After replacing only the LeviLamina files, the server (on a hosting panel) no longer loads LeviLamina. What should I do?

Because the LeviLamina version is tied to the BDS version, downgrading LL requires switching to the matching BDS version at the same time; replacing only the LL files will not work. We recommend specifying the versions with lip in a server directory (or an empty directory) on your local computer: `lip setup --game <BDS version> --loader levilamina@<LL version>`. lip installs the matching BDS and LeviLamina together while keeping other compatible packages. Then, upload the entire server to the panel. Note that `lip install` and `lip update` do not change the game and loader versions; you must use `lip setup`.

## After the LeviLamina server starts, no plugins are loaded at all. What is the cause?

Usually, PreLoader does not match the LeviLamina/BDS version, or a data file required by PreLoader is missing, so LeviLamina and the plugins are never injected.

Each LeviLamina version pins an exact PreLoader and bedrock-runtime-data version (for example, LeviLamina 26.60.8 depends on PreLoader 1.16.8 and BDS 1.26.60), so do not mix component versions manually. Install with `lip install github.com/LiteLDev/LeviLamina`; lip installs the matching PreLoader, PeEditor, bedrock-runtime-data, and BDS based on the dependencies, and runs `PeEditor.exe -mb` to generate `bedrock_server_mod.exe`. Also make sure you start `bedrock_server_mod.exe` rather than the vanilla executable.

*Applies to: LeviLamina 1.x and later (currently 26.60.x)*

## Can every Bedrock launcher load `.so` mods on Android?

Not necessarily. Android native mods built with the Preloader SDK (`pl::` API, `LiteLDev/preloader-android`) are loaded by LeviLauncher for Android via `libpreloader.so`; other launchers cannot use them if they cannot load preloader. Some mods can only be loaded by LeviLauncher, and some ImGui mods also depend on touch/input support provided by a specific launcher.

As a workaround, you can extract `libpreloader.so` from the LeviLauncher package and load it alongside the mod, though whether this works depends on the launcher.

*Applies to: LeviLauncher-Android (currently v1.7.1). Not confirmed against the source code or the documentation: treat it as a pointer.*
