# What LeviLamina does on a server

## How do I load, unload or reload a single plugin/mod (including LSE script plugins) on a LeviLamina server without shutting it down? Does `/reload` work?

`/reload` is a vanilla command that reloads only behavior packs and addon scripts; it does not manage LeviLamina mods. To manage mods, run LeviLamina's built-in `ll` command in the server console:

- `ll list`: lists the loaded mods so you can check their names
- `ll load <mod name>`: hot-loads a mod newly placed in the `mods` directory
- `ll unload <mod name>`: unloads the mod
- `ll reload <mod name>`: reloads the mod
- `ll enable|disable|reactivate <mod name>` are also available; all of these commands accept an optional trailing `cascade` argument to process dependent mods as well.

`<mod name>` is the `name` field in `manifest.json` and must match the mod's folder name in the `mods` directory. Do not pass a `.js`/`.dll` file name, a file path, or an engine name such as `legacy-script-engine-quickjs`.

The `ll` command is enabled by default with Admin permission, controlled by the `modules.command.modManageCommand` option in the LeviLamina configuration.

Notes:

1. There is no command to reload all mods at once; you must specify a mod name.
2. Whether a mod can be unloaded or reloaded depends on the mod itself. To be unloadable, a C++ mod must export or register an unload function (`ll_mod_unload`; with `LL_REGISTER_MOD`, implement `unload()` in the class); otherwise, you get `"The mod does not register an unload function"`. If the unload function returns `false`, you get `"The mod cannot be unloaded"`. Some mods must load before the server starts and cannot be hot-loaded; with others, commands registered after a reload stop working, or the server may even crash.
3. Because a LeviLamina server starts quickly, restarting the server remains the safest option. If you only need to reload a configuration file, many plugins provide their own `reload` subcommand.

*Applies to: LeviLamina 0.8.4 and later (still applies to the current v26.60.8)*

## How do I see which plugins/mods are actually loaded on a LeviLamina server console, and details such as a mod's version?

Run `ll list` in the server console. It prints `"There are N mods: a, b, c"`, which lets you verify that plugins installed with lip are actually loaded. To inspect a single mod, run `ll show <mod name>`, which displays its name, author, description, type, version, entry, and extra information; appending `cascade` also prints its dependency tree and the tree of mods that depend on it. `ll show` requires a mod name and cannot display all mods at once. In an LSE script, you can get the list of loaded plugins by calling `ll.listPlugins()`.

The `ll` command requires Admin permission by default; you can disable or adjust it with `modules.command.modManageCommand` in the LeviLamina configuration.

*Applies to: LeviLamina 0.8.4 and later (still applies to the current v26.60.8)*

## What is the difference between Endstone and LeviLamina? Can Endstone run LeviLamina dll plugins? Why can Endstone quickly adapt to new BDS versions without full PDBs?

Both inject into and hook BDS, but they serve different roles. Endstone is a plugin loader, similar to Bukkit: it wraps BDS in a stable API without exposing BDS internals directly, and supports plugins written in C++ or Python. LeviLamina is a mod loader, similar to Forge or Fabric, and aims to expose all of BDS's internal interfaces. Under the hood, Endstone needs only a handful of symbols (roughly a dozen), maintains its symbols and headers by hand, and can obtain those few symbols through manual reverse engineering. LeviLamina requires more than 200,000 symbols and generates its symbol table and headers automatically from the debug information released by Mojang. This gives LeviLamina much broader API and header coverage, but updating for a new BDS version requires waiting for Mojang's debug information and running the code generator. Because the two projects have completely different APIs and ABIs, Endstone cannot run LeviLamina dll plugins (just as Fabric cannot run Forge jars).

*Applies to: all current versions (Endstone is a third-party project; refer to Endstone's own documentation for details). Not verified against the source code or documentation: treat this as a general pointer.*

## Can I shut down a LeviLamina server directly with Ctrl+C? What happens if I click the window's X button?

Yes, you can press Ctrl+C. LeviLamina captures Ctrl+C and runs the normal shutdown process, which has the same effect as typing `stop` and loses no data. (Pressing Ctrl+C again during shutdown forces the process to exit, so press it once and wait.) If you started the server from a `.bat` file, the command line asks whether to terminate the batch job after shutdown completes; close the window then. Clicking the window's X button is not recommended: although LeviLamina also tries to run `stop` on the window-close event, Windows gives that event very little time, so the process may be killed before the world finishes saving, rolling the world back to the last save.

*Applies to: all current versions (Windows server; SIGINT/SIGTERM on Linux/Wine)*

## What is the relationship between LeviLamina and the former LiteLoaderBDS? What does LL3 mean? Should I still use LiteLoaderBDS to run a server?

LiteLoaderBDS (abbreviated LL, with two major versions, LL1 and LL2) is no longer maintained and has been archived because its codebase was hard to maintain. LeviLamina is its successor: a completely rewritten new project (its planned name was LiteLoader3, which is why it is also called LL3). It shares no code with LiteLoaderBDS and is not compatible with old native plugins, so it is not simply a rename. To run a server today, use LeviLamina (<https://github.com/LiteLDev/LeviLamina>; installing with lip is recommended). Old LLSE script plugins now run on LeviLamina through LegacyScriptEngine.

## What is the relationship between the LeviLauncher launcher and the LeviLamina client edition (LL client)? How does it differ from the server-side LL?

They are not the same thing. LeviLauncher is a Minecraft Bedrock Edition launcher for downloading, installing, isolating, and launching game versions and managing mods, similar to PCL2 for Java Edition. The LeviLamina client edition is a mod loader, similar to Fabric for Java Edition: it was ported from the server edition, does not depend on BDS, and provides client interfaces such as input handling and custom rendering, so you can develop mods for it as well. When you install an instance with LeviLauncher, enabling "Install LeviLamina" installs LL; leaving it off installs the vanilla client (just like checking or unchecking Fabric when downloading in PCL). For a server mod to work on the client (for example, in LAN play), it must be adapted for the client and listen for the corresponding client events.

*Applies to: LeviLamina 1.8.0 (client support) up to the current version; LeviLauncher for Windows*

## Which languages can be used to develop LeviLamina plugins/mods? Is there a difference between a "plugin" and a "mod"? Will the official team support other languages such as Ruby, TypeScript or Go?

"Plugin" and "mod" are just different names; the Chinese documentation uses "模组" (mod). Both now go into the server's `mods` directory (older versions used the `plugins` directory). You can develop mods using:

- C++: native LeviLamina mods.
- LegacyScriptEngine (LSE): script plugins written in JavaScript (QuickJS or Node.js), Lua, or Python. The JS documentation is the most complete, so JavaScript is recommended. Install the matching engine with `lip install LegacyScriptEngine#quickjs` (or `#lua`, `#nodejs`, `#python`).
- LeviStone: another option for Python that runs Endstone Python plugins on LeviLamina.
- A community-maintained .NET loader (unofficial) for C# and other .NET languages.

Unlike with LL2, the official team will not maintain support for additional languages itself; it provides only the low-level interfaces, leaving other language bindings to the community.

## Why can cheat commands still be used after installing LeviLamina, even though cheats are not enabled on the server (or Xbox achievements are forced on by a plugin)?

LeviLamina enables "force-enable cheat commands" by default. When registering commands, it adds the `NotCheat` flag to every command, removes the "requires cheats" restriction on enum values, and allows selector expansion. This lets these commands work even when cheats are off in the world, while keeping achievements enabled. The drawback is that when cheats are off, the client may not be able to Tab-complete the command name (the first level), though arguments can still be completed. You can disable this feature with `targeted.forceEnableCheatCommands` in `mods/LeviLamina/config/Config.json` (default `true`).

*Applies to: LeviLamina from around 0.8 up to the current 26.60.x, enabled by default on server and client*

## How does LeviLamina's mod (formerly plugin) loading mechanism work? Can it support mods written in other languages?

LeviLamina loads mods and lets any mod register its own mod manager (`ModManager`) with `ModManagerRegistry`, making it possible to build runners for other languages (LegacyScriptEngine, for example, loads script mods this way). LL assigns each mod to a manager based on the `type` field in its `manifest.json`: when `type` is `native`, the built-in native DLL mod manager (`NativeModManager`) loads it; for any other `type`, LL uses the manager registered for that type, or reports `"Unrecognized mod type"` if none is registered. In the source code, `ll/api/mod` defines the public interface (`Mod`, `ModManager`, `ModManagerRegistry`, `Manifest`, `NativeMod`), and `ll/core/mod` implements the native mod manager `NativeModManager` and the loading process (`ModRegistrar`, `ModLoadPlanner`).

*Applies to: LeviLamina 1.x and later (including the current 26.60.x)*

## In dimensions such as the Nether, I can't use the `tp` command to teleport across dimensions to specific coordinates. What can I do?

LeviLamina includes a built-in cross-dimension teleport command, `teleportdim` (alias `tpdim`), which teleports to exact coordinates across dimensions and accepts an optional coordinate-conversion argument (Overworld/Nether scaling). You can enable or disable the command and set its permission level under `modules.command.tpdimCommand` in the LeviLamina config (enabled by default, with permission set to GameDirectors). In vanilla, you can also use `execute in <dimension> run tp ...`.

*Applies to: all current LeviLamina versions (including 26.60.x)*

## Can BDS's vanilla server-authoritative movement/block validation (being pulled back for moving too fast, or blocks rubber-banding or vanishing when placed/broken too fast) be turned off? Is there a LeviLamina mod that disables it?

Since 1.21.70, this vanilla mechanism can no longer be disabled through `server.properties` or similar settings (unlike in older versions). Instead, you can use the third-party LeviLamina mod FuckMovementAuthority (<https://github.com/kuangby/FuckMovementAuthority/releases>), which also handles the placement-related restrictions. The author warns that it may cause some odd bugs. Before installing, make sure the mod release matches your LeviLamina version. You can find LeviLamina mods at <https://levimc.org/mods/> (formerly pkg.levimc.org).

*Applies to: BDS 1.21.70+; FuckMovementAuthority latest release v26.51.5 (for LeviLamina 26.51). Not confirmed against the source code or the documentation: treat it as a pointer.*

## The GroupMountain server-side FreeCamera mod hasn't been updated for a long time. Does it still work? What are the alternatives?

The original FreeCamera mod no longer supports the current version (its latest release is from 2025). With GroupMountain's permission, its functionality has been ported into CoralFans (<https://github.com/CoralFans-Dev/CoralFans>). Install the CoralFans build that matches your server version to use the `freecamera` command.

*Applies to: LeviLamina 26.x; CoralFans v26.60.0 supports LeviLamina 26.60*

## Can LeviLamina mods create custom UIs like the NetEase edition, for example placing controls on the in-game HUD?

You cannot place permanent custom controls directly on the HUD like in the NetEase edition. However, alongside traditional forms (`SimpleForm`/`ModalForm`/`CustomForm` in `ll/api/form`), LeviLamina now provides the `ll::ui` interface built on Bedrock's Data-Driven UI (DDUI). `CustomForm` and `MessageBox` in `ll/api/ui/form` let you update text, visibility, values, and input values in real time while a form is open, and the underlying `ScreenSession`, `Property`, and `Binding<T>` can open custom DDUI screens from a resource pack and bind data to them. In short, custom interfaces require a resource pack and are limited to DDUI screens; arbitrary HUD controls are not possible.

*Applies to: LeviLamina 26.x (`ll::ui` corresponds to the stable features of `@minecraft/server-ui` 2.1.0)*

## Is there a good LeviLamina mod for running commands on a schedule?

You can use GroupMountain's GMEssentials (release repository: <https://github.com/GroupMountain/GMEssentials-Release>; or search for GMEssentials at <https://levimc.org/mods/>). Among its many features is `schedule_task`, which runs commands on a schedule using Cron expressions (configure `enable` and a `tasks` list, where each entry has a `cron` expression, a `commands` list, and `output`; `enable` defaults to `false` and must be turned on manually).

*Applies to: GMEssentials v26.60.0 for LeviLamina 26.60*

## When a LeviLamina mod needs a companion resource pack, can the pack be bundled inside the mod and loaded automatically?

Yes. Put the resource pack in the `resource_packs` folder of the mod directory (`mods/<mod name>/resource_packs/<resource pack>`). LeviLamina automatically registers it as a resource pack source and loads it (likewise, put behavior packs in `mods/<mod name>/behavior_packs`). When publishing, you can copy the resource pack into the mod archive during the `xmake.lua` packaging step, or configure lip's `tooth.json` to extract or place it into `mods/<mod name>/resource_packs`. If the resource pack modifies the main menu, you may still need to enable it in global resources.

*Applies to: LeviLamina server and client, current version (26.60.x)*

## Is the ImGui that LeviLamina used to bundle still there?

No. LeviLamina used to bundle ImGui, but it was removed in 2026-01 (commit `refactor: remove imgui`) because it crashed on 1.21.132. The current `xmake.lua` no longer depends on imgui either.

*Applies to: all versions after LeviLamina was updated for 1.21.132 (including the current 26.60.x)*

## Which shaders and game versions does the mod that loads Java Edition shaders (JE shaders) on the LeviLamina client support? How is the performance?

This mod is LiteLDev's official Arke (`github.com/LiteLDev/Arke`). Built on the LeviLamina client, it runs Java Edition shader packs written for Iris or OptiFine on Bedrock's Direct3D 12 renderer. The official README claims "zero performance loss". It currently supports only the Windows x64 client and requires LeviLamina client 26.60.* (MC 1.26.60); older versions such as 26.51 are not supported. Android support is planned. After installation, load shader packs using the settings button at the top left of the game screen. If software such as frame generation is running, this button may not appear or may even cause a crash.

*Applies to: Arke 0.1.x, LeviLamina client 26.60.\*, Windows x64*

## Does the LeviLamina client have a feature to remove or force-disable OreUI?

LeviLamina itself has no such feature, but you can use the third-party project ForceCloseOreUI (<https://github.com/QYCottage/ForceCloseOreUI>). It is a standalone DLL (Windows) or so (Android) that does not depend on LeviLamina. You can place it in the `mods` directory of `QYCottage/mc-w10-version-launcher`, or load it with another launcher or injector. In LeviLauncher, you can also add it to an instance as a `preload-native` mod via "Import .dll".

*Applies to: current LeviLamina client; ForceCloseOreUI is a third-party project, so check its releases for compatibility. Not confirmed against the source code or documentation: treat this as a pointer.*

## How do I start and stop recording with the LeviLamina client's replay mod (Playback/replay)?

Playback (a third-party mod at `github.com/wo55555/Playback`) is controlled with commands: `/record start` starts (or resumes) recording, `/record pause` pauses it, and `/record stop` stops recording and exports the replay. Additionally, `/record rate [20-120]` sets the sampling rate of the local player's view, and `/record indicator [on/off]` toggles the recording indicator. In newer versions, the icon row in the pause menu also includes start, pause, finish, and cancel buttons; finishing from the pause menu prompts you for a replay name. Exported replays are saved in Playback's `data/replays` directory.

*Applies to: Playback, current version (LeviLamina client, Windows x64)*

## Is there documentation for the `manifest.json` of LeviLamina plugins? Can I zip a script plugin together with `manifest.json` and drop it into `plugins` to have it loaded?

Yes. The `manifest.json` fields (`entry`, `name`, `type`, `platform`, `passive`, `version`, `author`, `description`, `extraInfo`, `dependencies`, `optionalDependencies`, `conflicts`, `loadBefore`) are documented on the mod page of the LeviLamina API reference in the official documentation, or you can read `src/ll/api/mod/Manifest.h` directly in the source code. For a script plugin, LSE generates the manifest automatically: place a loose `.js`, `.lua`, or `.py` file in the root of `mods` (`plugins` is a link to `mods`), and LSE will move it into `mods/<name>/` and generate `manifest.json`; the plugin then loads after a restart. Dropping in an arbitrary archive (plugin plus manifest) will not work: LeviLamina reads `manifest.json` only from subdirectories of `mods`, so you must extract the archive into a directory first. (The exception is the legacy `.llplugin` package for the Node.js backend, which LSE extracts and migrates automatically.) The manifest is meant to standardize dependency declarations and custom engines (`type`), not to unify the packaging format.

*Applies to: LeviLamina 1.x and later up to the current 26.60.x, current LSE*

## Is LeviLamina only for servers (BDS)? Can it be used in client single-player worlds?

No. LeviLamina is an unofficial mod loader for Minecraft Bedrock Edition. It loads into both the Bedrock Dedicated Server (BDS) and the Minecraft client on Windows. On the client, use LeviLauncher to install a game version, LeviLamina, and client mods, which you can then use in single-player worlds (see the official tutorial "Playing with mods on Windows"). LeviLauncher is only a launcher; the loader is LeviLamina.

*Applies to: LeviLamina current version (26.60.x), LeviLauncher 1.x*

## Does LeviLamina include the iInvalidNAKFix fix, or do I still need to install it separately?

No, it is not included. LeviLamina's built-in vulnerability fixes (`vulnerabilityFixes`: `itemReadUserData`, `disconnectClient`, `subChunkRequest`, `limitIPFrequency`, and so on) do not include a fix for invalid NAKs. If you need it, you must still install iInvalidNAKFix (`MiracleForest/iInvalidNAKFix`) separately.

*Applies to: LeviLamina server, current version (26.60.x)*

## How does LeviLamina let the Bedrock client load mods? Can a server make connecting players' clients enable certain mods automatically?

No, a server cannot push mods. Client mods require players to install the client build of LeviLamina on their own machines—usually through LeviLauncher, which adds its own loader (`LeviLauncher.dll`) to the game executable to load LeviLamina and the mods at launch. Because this works like client-side injection, players decide which mods to install, and the server cannot control it. A server can only send vanilla resource packs and behavior packs to clients.

## Is there a plugin for LeviLamina servers that raises the height limit of the Nether?

Use the FuckNetherHeight mod from GroupMountain, which works with LeviLamina: <https://github.com/GroupMountain/FuckNetherHeight>. Before using it, make sure its release supports your LeviLamina/BDS version.

*Applies to: third-party mod; compatibility depends on its releases. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What data does LeviLamina's telemetry collect, and which platform does it use?

LeviLamina uses bStats, submitting data to the `server-implementation` endpoint on bstats.org. It reports the server UUID, the system type (Windows or Linux(wine)), the architecture, the number of CPU cores, and these custom charts: LeviLamina version, Minecraft version, online player count, whether online-mode authentication (`online-mode`) is enabled, and the distribution of player device platforms. It does not report the list of other loaded mods. You can view the public data at <https://bstats.org/plugin/server-implementation/LeviLamina/21245>. bStats only infers region information from the request IP. To opt out, set `targeted.enableStatistics` to `false` in the LeviLamina config.

*Applies to: current LeviLamina server*

## What roles do LeviLamina, PreLoader and Endstone play compared with the Java Edition ecosystem?

Compared with Java Edition, PreLoader is like Fabric Loader (handling injection and loading), LeviLamina is like Fabric API (providing mod development interfaces), and Endstone is like Spigot (using a plugin API style). Both the server and the client now use PreLoader, and the LeviLamina client build depends on it as well.

## Can a LeviLamina mod access files outside the BDS directory? Do I need relative paths such as `../../..`?

Yes. A LeviLamina mod is a native DLL loaded into the BDS process, with no file system sandbox. You can navigate up with a `../`-style relative path (relative to the process working directory, which is the BDS root) or use an absolute path directly, as long as the system account running BDS has the necessary permissions.

*Applies to: all current LeviLamina versions*

## Is there a simulated-player plugin for LeviLamina? Is the incompatibility between simulated players and addons (the script API) fixed?

Yes. Use CFSP (CoralFans SimulatedPlayer), the simulated-player mod from the CoralFans team. Install it with `lip install github.com/CoralFans-Dev/CFSP`. Simulated players used to be incompatible with addons and the script API (SAPI/GameTest). LeviLamina has fixed this incrementally starting in 26.20.x (26.20.3 preserves GameTest source information, and 26.51.2 fixes compatibility between SAPI and SimulatedPlayer), so use the latest version of LeviLamina.

*Applies to: LeviLamina 26.51.2 and later*

## Can LeviLauncher host a server to play with friends and use server plugins?

No. LeviLauncher is a launcher for the Minecraft Bedrock Edition client (the Windows version supports GDK/UWP, and there is also an Android version), not a server. For regular multiplayer, use the game's built-in friends or LAN features. To run a server that can load mods/plugins, deploy BDS and install LeviLamina, the mod loader for BDS (install it with `lip install github.com/LiteLDev/LeviLamina`; see the tutorial at <https://levimc.org/tutorials/server/first-server/>). The launcher can also install LeviLamina for the client (supported GDK versions only), though few client mods are available.

*Applies to: LeviLauncher current version (v1.1.0); LeviLamina current version*

## Can I install LeviLamina on Minecraft Realms?

No. LeviLamina must run on a BDS (`bedrock_server`) that you deploy yourself or on your own Windows client. Realms is hosted by Microsoft and does not allow third-party loaders.

## Why did LeviLamina rename "plugin" to "mod"?

LeviLamina provides low-level native APIs and follows a model closer to mod loaders like Fabric and Forge, whereas Endstone and similar projects follow a Bukkit-like plugin model. Because of this, the term was changed to "mod". For the full discussion, see <https://github.com/LiteLDev/LeviLamina/issues/1551> (`[Proposal]: Rename Plugin to Mod`, closed). LeviLamina now refers to itself as a mod loader, and mods are placed in the `mods/` directory.

*Applies to: LeviLamina 0.13.x and later*

## Why does a LeviLamina marker appear at the end of the MOTD (pong) when I query a LeviLamina server? Can I change it?

LeviLamina hooks RakNet's `RakPeer::SetOfflinePingResponse` and appends `LeviLamina;` to the `MCPE;`-prefixed pong data to identify the server as running LeviLamina (added in 1.0.0-rc.1, where it also included the version number; since 1.0.0-rc.3, only the marker remains). LeviLamina provides no configuration option to disable this. To customize or spoof the MOTD/pong content (for example, to merge player counts), a mod can hook that function itself or modify the relevant data.

*Applies to: LeviLamina 1.0.0-rc.3 and later (server)*

## A fresh LeviLamina install shows 0 plugins (mods) loaded on startup, while LL2 used to come with a few plugins by default. Is this normal?

Yes. LiteLoaderBDS (LL2) installed all prerequisite plugins by default. LeviLamina installs mods on demand and bundles none with the core (dependencies such as CrashLogger live inside `mods/LeviLamina/` and do not count as mods), so it shows 0 on a fresh install. Install the mods you need with lip, for example `lip install <mod repository address>`.

*Applies to: all current LeviLamina versions*

## Does Bedrock have a feature to display structure outlines (Structure Outline)? Does it work on Android?

CoralFans, a third-party technical survival mod based on LeviLamina, provides HSA display and structure display through commands such as `/hsa show` and `/hsa structure show` (command names are configurable). Install it with `lip install github.com/CoralFans-Dev/CoralFans`, or install it through the PC version of LeviLauncher. Because CoralFans only has a Windows x64 build, it cannot run directly on Android, though Android players can join a server that has CoralFans installed. Source: <https://github.com/CoralFans-Dev/CoralFans/>, documentation: <https://coralfans-dev.github.io/CoralFans-doc/>

*Applies to: LeviLamina server/Windows client; CoralFans current version (v26.60.0)*

## Is there a Bedrock mod that unlocks the world build height limit (for importing terrain maps thousands of blocks tall)?

Use iHigherWorld (<https://github.com/MiracleForest/iHigherWorld>), a LeviLamina mod from MiracleForest that lets you adjust the minimum and maximum height of the Overworld, the Nether, and the End independently. Install it on the server with `lip install github.com/MiracleForest/iHigherWorld-Release` and on the client with `lip install github.com/MiracleForest/iHigherWorld-Release#client`. If the Overworld range exceeds -512~512 (or the Nether/End exceeds 0~256), clients must also install the client build (the server sends the configuration to the client). Users report an undocumented upper limit of roughly 4096, beyond which the game crashes. Addons cannot do this. Note that the mod's README specifies LeviLamina 26.51.x as the runtime environment, so make sure it matches your LeviLamina version.

*Applies to: iHigherWorld v1.4.0; LeviLamina 26.51.x (Windows x64)*

## How do I check which LeviLamina version a server has installed?

Run the `version` command in the server console. It prints output such as `Game version <game version> with LeviLamina-<version>`. The corresponding command on the LeviLamina client is `cliversion`. You can enable or disable this command and set its permission level under `modules.command.versionCommand` in the LeviLamina configuration; if disabled, the command is not registered.

*Applies to: all current LeviLamina versions*

## How can I make the client show a custom server logo/banner in the server list? Is there a mod that removes featured servers?

The LeviLamina repository has an experimental `feat/custom-server-readme` branch (<https://github.com/LiteLDev/LeviLamina/tree/feat/custom-server-readme>) that lets a server fully customize its display information. This branch will not be merged into LeviLamina mainline, so use its implementation as a reference to build your own mod. To remove featured servers, use the community mod NoAdServers: <https://github.com/MarmieQi/NoAdServers/releases/tag/v26.60.0>. Make sure any third-party mod matches your game version.

*Applies to: MC 26.60; LeviLamina 26.60.x*

## Which open-source mods are available for LeviLamina on the Windows client (technical survival, utilities, minimap, replay, schematic projection, and so on)?

Several are already available to install through LeviLauncher or lip: CoralFans for technical survival (similar to Java Edition carpet) <https://github.com/CoralFans-Dev/CoralFans>; Stipuleroo for client utilities (similar to tweakeroo) <https://github.com/FeixiangTMC/Stipuleroo>; ChiyanMap for a client minimap <https://github.com/qing85566/ChiyanMap>; Playback for replays <https://github.com/wo55555/Playback>; and LHolo for client schematic projection <https://github.com/MarmieQi/LHolo>. Before installing one, check that it supports your game version.

*Applies to: LeviLamina client (Windows); specific versions depend on each mod's releases*

## After a server sends an encrypted resource pack, the client cannot use Vibrant Visuals (VV). Can LeviLamina fix this?

This is vanilla client behavior. The client treats an encrypted resource pack as a Marketplace pack, and the Marketplace's current policy does not support VV, so the server cannot fix it. The only workaround is to modify the client—for example, by using a LeviLamina client mod to force VV on.

*Applies to: vanilla Minecraft Bedrock client behavior; depends on Mojang's current policy. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can LeviLamina send packets to players at high frequency with 1 ms precision (for example, PlaySound packets for a MIDI player)? I tried it and it crashed the server or the client.

No. This is a limitation of BDS and the game itself, not LeviLamina: the client has to synchronize packet handling to the main thread, network latency jitter alone exceeds 1 ms, and a flood of small packets can clog the player's network. To play music on a server, deliver the audio in a resource pack, or use a tick-precision approach such as an NBS player.

*Applies to: all current versions (BDS/network-level limit). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can BDS (LeviLamina) restart BDS from inside its own process?

A process cannot restart itself from the inside, and LeviLamina does not provide a restart API, so you need an external daemon or startup script. You can write an external program and call it from a mod (for example, with `std::system`) to stop BDS and start it again. If you run the server with lip, you can enable auto-restart by running `lip config set restart on-failure --workspace` (or turning on "Auto restart" on the "Server" page of the lip interface) and then starting the server with `lip run`. When the server exits with a non-zero exit code, lip waits 5 seconds and restarts it, up to 5 times within 10 minutes.

*Applies to: all current versions; lip auto-restart needs a recent lip (documented for v0.41)*

## Can I still join other people's servers with LeviLamina client mods installed? Can two people with the same launcher and mods play together?

Yes. A LeviLamina client can join other servers normally (for example, joining Hive with Playback enabled to record), and two players with the same mods installed can play together. Server-side LeviLamina mods do not need to be installed on the client. Whether a specific mod is allowed on a server depends on that server's rules, which you must follow.

*Applies to: LeviLamina client / LeviLauncher, current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Does LeviLamina itself support Data-Driven UI (DDUI)? Since which version? Can LSE script plugins use it?

Yes. LeviLamina has supported DDUI since 26.20.7 under the `ll::ui` namespace (with headers such as `ll/api/ui/form/CustomForm.h` and `ll/api/ui/form/MessageBox.h`), which is separate from the older `ll::form` interface. See the usage guide at <https://levimc.org/LeviLamina/developer_guides/how_to_guides/data_driven_ui_guide/> and the API reference under `api_reference/data_driven_ui`. Only the native C++ API is available for now, so you must write a C++ mod; LSE does not export these interfaces yet.

*Applies to: LeviLamina 26.20.7 and later*

## Why is adapting LeviLamina to new BDS versions (from 26.20) so difficult? Do old mods still work?

Mojang switched the BDS compiler from MSVC to clang-cl. LeviLamina and all native mods must be recompiled with clang-cl, or they will crash; old mods compiled with MSVC cannot be used directly. The mod template's `xmake.lua` already uses `set_toolchains("clang-cl")`. In addition, clang-cl itself crashed while compiling LSE during the adaptation, which slowed progress.

*Applies to: LeviLamina 26.20 and later*

## My server crashes often. How can I see BDS memory usage at the time of the crash in the crash log?

Since 1.2.1, CrashLogger writes memory information to the trace log: the system's total and available physical memory, plus a `Memory Info` section with the BDS process's peak and current workingset, pagefile, and private values. The built-in CrashLogger also shows available memory. The current version (CrashLogger 1.4.x, installed automatically with LeviLamina) already includes this, so you only need to keep it up to date. Run `lip update` (or `lip update github.com/LiteLDev/LeviLamina`) in the server directory, then check `logs/crash/trace_*.log`.

*Applies to: CrashLogger 1.2.1 and later (currently 1.4.0)*

## LeviLamina announced that it will encrypt PreLoader (and the symbol data it loads). How does this affect ordinary server owners and mod developers?

Background: since BDS 1.21.20, official BDS releases no longer include a PDB. Instead, LeviLamina publishes only headers (function signatures and structs) in the repository and keeps function addresses as a hashed symbol table in runtime data (formerly called the magic blob, now distributed as the `bedrock-runtime-data` package). PreLoader loads and resolves this data at runtime so mods can call or hook BDS functions. Because someone abused PreLoader dump data to generate and publicly distribute PDBs, the maintainers announced in 2025-03 that PreLoader would be encrypted to comply with Microsoft's requirements (only PreLoader is encrypted; LeviLamina itself and the rest remain unchanged). Impact: ordinary server owners, LSE script plugin developers, and mods built only on LeviLamina's public headers and interfaces are not affected. The only affected work is native development that relied on generating a fake PDB from PreLoader for reverse engineering in IDA; from now on, that can only be done with methods such as bindiff.

*Applies to: LeviLamina 1.1.x (BDS 1.21.60/1.21.70) and later. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I launch the LeviLamina client (client mod)? Is PreLoader still required?

Yes. The client uses the same mechanism: PeEditor patches the game executable, and PreLoader loads LeviLamina when the game starts. Installing the LeviLamina client runs `PeEditor.exe -mb --exe Minecraft.Windows.exe --inplace`, which patches `Minecraft.Windows.exe` in place (keeping the original as `Minecraft.Windows.exe.bak`) and installs the PreLoader dependency.

The recommended method is LeviLauncher:

1. Download a supported GDK release version in it.
2. Create an instance and open "Install LeviLamina".
3. Launch from LeviLauncher. You do not need to run lip manually.

Your Microsoft account must have purchased Bedrock Edition and installed it from the Microsoft Store at least once. The LeviLamina client supports only Windows x64 (Android uses a separate solution, LeviLauncher-Android).

*Applies to: LeviLamina client, current version (GDK edition of Minecraft for Windows)*

## Can a client native mod work without the LeviLamina API? How are PreLoader and LeviLamina related? Do I need to copy the whole game instance to run several clients at once?

PreLoader loads LeviLamina before the game starts and provides low-level services such as symbol resolution (mapping vanilla symbols for LeviLamina and mods). The rest of the infrastructure, such as hooks, events, and commands, comes from LeviLamina.

To avoid depending on LeviLamina, you must replace every LL API and symbol you use with signatures and implement the corresponding functionality yourself (after removing the LL dependency, check the import table to see which symbols are still needed).

Running several clients does not require copying the roughly 1 GB game itself: you can have the mod's entry use relative paths, or redirect the mod directory before loading via `modsPath` in `PreLoaderConfig.json`. You only need to copy the mod files separately to avoid file locking, and you must not open the same world in two clients at once. You can also manage multiple game instances directly using LeviLauncher instances (with instance isolation enabled).

*Applies to: LeviLamina client, current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Virtual functions of multiple-inheritance classes such as Level have no vIndex in the LL headers. When I see a virtual call in decompiled code and have no full PDB, how do I tell which function is called?

You can resolve it at runtime: read the function address from the corresponding slot in the object's vtable, then pass it to PreLoader's address-to-symbol lookup interface to get the function name. This interface is declared in `pl/SymbolProvider.h`. Calling `pl::symbol_provider::pl_lookup_symbol_disp(addr, &length, &disp)` returns an array of symbol names for the given address (`length` is the symbol count, and `disp` is the offset). When you are done, you must free the returned array with `pl::symbol_provider::pl_free_lookup_result`. LeviLamina's stack symbolization (`ll::utils::stacktrace_utils::getInfo`) uses this same mechanism internally.

*Applies to: LeviLamina current version (PreLoader 1.x)*
