# Other LiteLDev projects

## Where can I still download old LiteLoaderBDS (LL2, such as 2.9.3, 2.15.0, 2.16.2)? Which BDS version does each version match?

Historical LL2 versions are available on the Releases page of the archived LiteLDev/LiteLoaderBDS GitHub repository: <https://github.com/LiteLDev/LiteLoaderBDS/releases> (for example, the final version, 2.16.2: <https://github.com/LiteLDev/LiteLoaderBDS/releases/download/2.16.2/LiteLoaderBDS.zip>). The old link <https://github.com/LiteLDev/LiteLoaderBDSv2> redirects to this repository automatically. The release notes for each version list the matching BDS version (newer releases use a badge; older ones, such as 2.9.3, state it in the text, for example `Support BDS 1.19.50 & 1.19.51`). Be sure to choose the LL2 version that matches your BDS version exactly. LL2 is no longer maintained and supports BDS 1.20.31.01 at most; use LeviLamina for newer BDS versions.

*Applies to: LiteLoaderBDS 2.x (archived), BDS \<= 1.20.31.01*

## What is the last BDS version supported by LiteLoaderBDS v2 (LL2)? Is there an LL2 that supports BDS 1.20.40 or later? What if LL2 fails to start with LiteLoader not found or cannot be loaded?

The final LL2 version is 2.16.2, which matches BDS 1.20.31.01; no LL2 version supports BDS 1.20.40 or later. LL must match your BDS version exactly, and a version mismatch (for example, BDS 1.19.30.04 with a newer LL2) causes loading to fail. LL2 is no longer updated and has been archived; it was later rebuilt as LeviLamina (<https://github.com/LiteLDev/LeviLamina>). Use LeviLamina for newer BDS versions.

*Applies to: LiteLoaderBDS 2.x (archived); use LeviLamina for newer BDS*

## Is there a hot backup or automatic backup plugin for a LeviLamina server? Is there a BackupHelper version for the new LeviLamina, and what do I do if it reports incompatibility?

You can use BackupHelper (<https://github.com/ShrBox/BackupHelper>, a LeviLamina mod ported from the LL2 version), which stays up to date with LeviLamina releases (v0.20.0 supports LeviLamina 26.60.*). Older versions are incompatible with newer LeviLamina releases, so download the latest version that matches your LeviLamina version from GitHub. Repost sites such as MineBBS may not stay in sync, so treat GitHub as the authoritative source. We recommend installing it with lip: `lip install github.com/ShrBox/BackupHelper`. Commands: `/backup` runs an immediate backup, `/backup list` lists backups, `/backup recover [number]` restores a backup, and `/backup reload` reloads the configuration. In `config.ini`, `BackupInterval` (in hours) sets the interval for automatic backups, and `MaxStorageTime` sets how many days backups are kept. You can also write your own `.bat`/`.sh`/`.py` script to archive the world directory on a schedule.

*Applies to: Current LeviLamina (BackupHelper v0.20.0 for LeviLamina 26.60.\*)*

## After installing BackupHelper, `backup` fails and says 7z is missing (even though I downloaded 7z). What should I do?

BackupHelper calls `7za.exe` (the standalone command-line version of 7-Zip), not `7z.exe`. When you install with lip, the `github.com/LiteLDev/7-zip-tooth` dependency automatically places `7za.exe` in the server root directory: `lip install github.com/ShrBox/BackupHelper`. If it is missing, reinstall it:

```shell
lip uninstall github.com/ShrBox/BackupHelper
lip cache clean
lip install github.com/ShrBox/BackupHelper
```

Alternatively, place `7za.exe` in the server root directory manually. Then run `backup` in the console or in-game (as an OP) to take a hot backup, or run `help backup` to see usage instructions.

*Applies to: BackupHelper 0.1.6 and later + current lip*

## Does LeviLamina support .NET (C#/F#) plugins?

Not officially: LiteLoader.NET, the official .NET engine from the LL2 era, has long been unmaintained and archived. However, the community project Hosihikari (now the <https://github.com/HosihikariFramework> organization) provides a .NET plugin framework. HostingShim hosts the CLR inside the BDS process (providing carriers for LeviLamina, Endstone, and others), and PluginManager handles plugin loading and lifecycle. It also includes CSharpLoader, FSharpLoader (which loads plugins compiled from source), and RpcLoader. You can install them with its package manager, Seiko (for example, `sk add hosihikari-hosting-levilamina`). Note that its public contract currently covers only host services—such as logging, configuration, scheduling, and the event bus—and does not include game APIs such as world, entities, and commands. You can also call the C++ interfaces directly using C++/CLI or P/Invoke.

*Applies to: Current LeviLamina (community project, unofficial)*

## What is the difference between Endstone and LeviLamina?

The difference is similar to that between a "plugin" and a "mod". Endstone is a BDS-based plugin server with a Paper-like plugin API. Its API is relatively limited, but because it does not depend on data provided by Mojang, it can update to the latest BDS quickly. LeviLamina is a mod loader that can do more, but supporting a new version requires waiting for the relevant data. To run Endstone plugins on LeviLamina, use the official LeviStone: in the BDS directory where LeviLamina is installed, run `pip install levistone --target mods/EndstoneRuntime` (for versions 0.11.14 and earlier, install to `plugins/EndstoneRuntime`). Note that LeviStone supports only Python Endstone plugins, not native (C++) ones.

*Applies to: current version (LeviStone 0.11.15 and later installs to mods/EndstoneRuntime)*

## Which game versions does Arke, the LeviLamina client shader mod, support, and how do I use it? What if it has no effect after installation or I cannot see the shader settings screen?

Arke runs Java Edition shader packs written for Iris/OptiFine on the Bedrock Direct3D 12 renderer. It requires the client build of LeviLamina 26.60.* (the 26.60 client) and does not support older versions such as 26.51. After installing LeviLamina and Arke (installed in `mods/arke/`) with LeviLauncher, launch the game and open the shader settings at the top left of the screen (or at the top left of the world pause page; the UI currently uses imgui). Import a shader pack and select it to apply it; switching shaders may take a few seconds. A known cause of the missing settings button is running frame generation (frame generator) or similar software, which hides the top-left button and may even crash the game. Turn off such post-processing first and confirm that the game is running on DX12. If the mod has no effect, check the mod management screen or console to confirm that it is loaded, and inspect `mods\arke\logs\arke.log`. If a shader pack fails to load, check Messages in the settings window.

*Applies to: Arke 0.1.x, Minecraft client 26.60 + LeviLamina#client 26.60.\**

## With the Arke shader mod, the block selection wireframe does not show, and it is the same with several shader packs. What should I do?

This is a compatibility issue in Arke that was fixed in Arke v0.1.5 (`Fixed an issue where some wireframes would not render`). Update to v0.1.5 or later—for example, run `lip install github.com/LiteLDev/Arke#client` (since Arke has only a client variant) or download it from GitHub Releases.

*Applies to: Occurs in Arke v0.1.4 and earlier; fixed since v0.1.5*

## iLand is no longer maintained. What are the alternatives? How do I migrate iLand data to PLand? What if the command says "relationship.json file not found" (未找到 relationship.json 文件)?

You can switch to the third-party land-claim mod PLand (`IceBlcokMC/PLand`). To import iLand data, run the following command in the console: `/pland import true "C:/path/relationship.json" "C:/path/data.json"`. The first argument specifies whether to clear the database. Replace any backslashes `\` in the paths with forward slashes `/`; otherwise, the command reports "relationship.json file not found" (未找到 relationship.json 文件). Note that this command was removed in PLand v0.18.0, so complete the import using PLand v0.17.x first, then upgrade to the latest version.

*Applies to: PLand v0.17.x and earlier can import directly; v0.18.0 and later need conversion with v0.17.x first, then upgrade*

## How does the land-claim plugin iLand perform? Should I switch to PLand? Will I be unable to export my data after switching?

iLand is a Lua script plugin from the LL1 era; on LeviLamina, it requires the LSE Lua engine (`lip install LegacyScriptEngine#lua`). PLand is a native C++ mod that generally performs better, and switching to it lets you drop the Lua engine. Switching is not mandatory—if iLand works well for you, you can keep using it. PLand stores its data in LevelDB, which you can read directly: use QLevelDBViewer for PLand 0.21.x and earlier, or the DevTool bundled with PLand for later versions to view the raw data.

*Applies to: LeviLamina + LSE current version; PLand current version*

## On a server, the CoralMap minimap often turns black or shows see-through empty layers around the edge of already scanned chunks. What causes this?

Black areas: the terrain scan radius `terrain.scanRadius` defaults to 128 blocks (8 chunks). If the server's view distance is smaller than the scan radius, chunks beyond the view distance exist only as placeholders on the client, so the scan returns black. Either set the server view distance to at least 8 or reduce `terrain.scanRadius` in `config.json`. See-through empty layers: the mod reads the topmost block from the game's cached heightmap. Some blocks are not included in the heightmap, so if there is air beneath them they are "seen through". This is the trade-off of a performance optimization (scanning downward block by block from y320 would be much slower). The author plans to add a config toggle for this later, but no such option exists yet.

*Applies to: CoralMap (LeviLamina client mod), current version*

## The client minimap mod CoralMap causes severe frame drops when enabled. How can I tune it?

Terrain scanning and shadow rendering run on separate threads, which compete with the game's render thread when CPU cores are scarce. In `config.json` in the mod's configuration directory, you can:

- Reduce the number of chunks scanned per frame, `terrain.scanMaxChunksPerFrame` (default 32; try 16).
- Lower the shadow mode `terrain.shadow.renderStyle` (0 = no shadows, 1 = simple heightmap gradient shadows, 2 = shadow map + edge bevel; default 2).
- Reduce `terrain.scanRadius`.

*Applies to: CoralMap current version*

## Is LeviLamina's official organization name LiteLDev or LeviMC? Why was the GitHub organization ID not changed?

The official name is LeviMC (official site <https://levimc.org>). The GitHub organization ID is still LiteLDev; according to the maintainers, renaming it would break old links or leave redirects incomplete, so they kept it.

## Is the LiteLDev forum `https://bbs.liteldev.com/` down?

That forum was closed long ago. The community page is now <https://levimc.org/community/>.

## Can I publish assist-feature mods such as AutoTotem on the LeviMC platform or channels?

No. Such features are treated as cheats and must not be published on LeviMC/LL platforms or channels, nor used in multiplayer where they affect other players; solo play is not regulated. If you develop client features, you should detect whether the player is on a server and disable the feature when they are.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to donate to LiteLDev (the LeviLamina development team). How can I do that?

You can donate through Afdian at <https://afdian.com/@liteldev>, or through Open Collective (LeviMC, <https://opencollective.com/levimc>; accepts bank cards or PayPal, settled in US dollars). The Sponsor button on the GitHub repository page links to both channels.

## Is LiteLDev's LegacyParticleAPI no longer maintained? What is the replacement?

Yes. LegacyParticleAPI (ParticleAPI ported from LiteLoaderBDS) is no longer maintained, its repository is archived, and no project uses it anymore. To draw particles or debug shapes on the server, use BedrockServerClientInterface (BSCI, <https://github.com/OEOTYAN/BedrockServerClientInterface>) instead.

*Applies to: LeviLamina, all current versions*

## Can a client mod prevent picking up items? If not, how can I do it on a server?

A client mod cannot do this: the server decides whether an item is picked up (at most, the client can pick it up and immediately drop it). On the server, you can use the LeviLamina mod CoralFans (`lip install github.com/CoralFans-Dev/CoralFans`). Have the server owner (an admin) enable the feature globally with `/func nopickup true`; each player can then toggle it for themselves with `/self nopickup true` (if the global switch is off, `/self` returns an error saying the feature is unavailable). Run `/coralfans` to verify that the plugin installed properly. Command names can be customized in the CoralFans configuration. See <https://coralfans-dev.github.io/CoralFans-doc/> for details.

*Applies to: LeviLamina server + CoralFans, current version*

## How do I conveniently download or upgrade the BDS server?

Use LiteLDev's command-line tool bdsdown (<https://github.com/LiteLDev/bdsdown>), which you can install with `lip install github.com/LiteLDev/bdsdown`. Usage:

```text
bdsdown.exe [--yes] [--source SOURCE] [--proc PROC] [--exclude EXCLUDE]
```

`--source` defaults to `version://windows/latest`, `--proc` sets the number of concurrent downloads (default 4), and `--exclude` skips specified files during installation (for example, to preserve configuration files). Set the `BDSDOWN_MIRROR_URL` environment variable to use a mirror for faster downloads. You can also use lip to install BDS on its own.

## How do I make the ping display in a GMLIB PAPI variable change color according to its value?

Use the GMLIB PAPI `scope` (range) function to map value ranges to color codes. For example:

```text
§${papi:scope,input=${papi:player_avg_ping},0..99=a,100..199=e,200..=c}${papi:player_avg_ping}
```

Here, 0 to 99 is green (`§a`), 100 to 199 is yellow (`§e`), and 200 and above is red (`§c`). An earlier commonly shared form, `0..=a,100..=e`, uses overlapping ranges; non-overlapping closed ranges are better. Ranges use the syntax `min..max`: `10..` means >= 10, `..10` means \<= 10, and you can set a default return value with `default=`. To display the current ping instead of the average, use `player_last_ping`. See the placeholder documentation at <https://github.com/GroupMountain/GMLIB-Release/blob/release/PlaceholderDocs.md>

*Applies to: Servers with GMLIB installed (current v26.60.1)*
