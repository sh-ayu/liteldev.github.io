# LeviLamina performance and other questions

## With only one or two players online, my LeviLamina server's TPS is still low (high MSPT, stuttering while flying). How do I find which plugin is responsible?

Use a control-variable or bisection approach: first move every mod except LeviLamina and its required components out of the `mods` directory, then test MSPT in-game. If plain LeviLamina runs smoothly, a mod is the cause. Add the mods back in batches (bisecting) to narrow down the culprit one by one, or start by checking the most recently installed mod. Known high-overhead plugins include playerlogger (which records signs by listening to block changes) and CustomMap (map art); removing them restored normal TPS. Redstone or piston machines and entity buildup are also common causes (you can limit redstone frequency and check entity counts), and you should also rule out poor performance from an oversold cloud server.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## My LeviLamina server's memory keeps growing (from hours up to more than ten GB) until it crashes, or it crashes randomly and often. How do I troubleshoot it?

Steadily growing memory is almost certainly a memory leak in a mod or plugin (native C++ mods are the likelier suspects). Follow these steps:

1. Back up the world first, then run plain LeviLamina with no mods—or even vanilla BDS—to see if it still leaks.
2. If the clean environment is fine, use elimination: first uninstall the LSE script plugins and monitor the server, then add mods back one at a time (installing each mod's prerequisites first), watching memory usage for a while after each addition to find the leaking mod.
3. If it still leaks with all mods uninstalled, the issue may lie in BDS itself or the world (for example, a world whose End was heavily damaged by many withers).

LeviLamina has no command to view the memory usage of an individual mod. The CrashLogger crash log prints `Memory Info` (process working set, commit size, and so on), which shows memory usage at the time of the crash; update it to the latest version with `lip update github.com/LiteLDev/CrashLogger`. An unstable Intel 13th/14th generation (Raptor Lake) CPU can also cause frequent, varied random crashes (with AVX-related functions often appearing in the stack); check your CPU microcode and voltage stability.

*Applies to: all current LeviLamina versions*

## Startup takes noticeably longer when a LeviLamina server loads certain plugins (such as a land-claim plugin). Why does one plugin cost several hundred extra milliseconds?

This is mainly caused by event listening. LeviLamina loads its event emitters (the corresponding hooks) lazily: a hook is created and installed only the first time an event is listened to, which takes time. If a plugin listens to many events that no earlier plugin has used, the cost of installing all those hooks is counted toward that plugin's load time. Once an event has a listener, subsequent plugins can subscribe to it very quickly. As a result, the plugin itself is not entirely responsible for this load time.

*Applies to: all current LeviLamina versions (including 26.60.x)*

## My LeviLamina server starts very slowly. What can I do?

Antivirus software such as Windows Defender may be scanning the server files; try adding the server directory to the Defender exclusions. If that does not help, the slowdown may be due to your environment's performance (such as a PVE virtual machine or an older CPU). Startup also takes longer when plugins listen to many events for the first time, because the corresponding hooks have to be installed.

*Applies to: all current versions, Windows. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Does LeviLamina deliver better TPS than LiteLoaderBDS (LL2)?

They are about the same. TPS depends mainly on BDS itself, so a loader does not bring a noticeable improvement. However, LiteLDev provides a performance optimization mod, LeviOptimize, which optimizes chunk sending, entity broadcasting, redstone updates, random ticks, async task scheduling, and more (each feature can be toggled individually with `/lo`). Install it as needed with `lip install github.com/LiteLDev/LeviOptimize`.

*Applies to: LeviLamina current version; LeviOptimize current version (requires LeviLamina 26.60.x)*

## After installing LeviLamina, BDS memory usage is abnormally high (10 GB right at startup). How do I troubleshoot it?

First, start a plain `bedrock_server.exe` to compare. Next, back up the world, leave only LeviLamina and its prerequisites in the mods directory (usually `plugins/` on the server, or `mods/` if that does not exist), and move the other mods back one by one to isolate the culprit—most likely a native mod with a memory leak. You can record memory usage with Windows Performance Recorder; tools such as Mem Reduct provide only temporary relief.

In one case, the issue was traced to the CustomSkin plugin (which changes player skins by sending packets) combined with a resource pack containing dozens of 4D skins; removing that skin resource pack brought memory usage back to normal.

*Applies to: LeviLamina 1.x and later (the server mod directory is `plugins/`)*

## After upgrading LeviLamina, the server starts noticeably slower and stalls at `[PreLoader] Loading records from data...`. Why?

According to the maintainers, starting in LeviLamina 1.2.0 / BDS 1.21.70, the symbol/record data used by PreLoader is encrypted and must be decrypted on load, which makes the `Loading records from data...` stage slower than before. On most machines it takes only about two seconds. This is normal—just wait.

*Applies to: LeviLamina 1.2.0-rc.1 and later (PreLoader 1.13+). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where can I see LeviLamina's network-wide usage statistics (number of servers, players, and so on)? Do I need to install bStats separately?

LeviLamina includes built-in bStats reporting (added in 0.9.1), so you do not need to install bStats separately. View the statistics at <https://bstats.org/plugin/server-implementation/LeviLamina/21245> (or search for LeviLamina on bstats.org). To opt out, set `targeted.enableStatistics` to `false` in LeviLamina's `Config.json`.

*Applies to: LeviLamina 0.9.1 and later (server)*

## What options are there for linking a LeviLamina server with a QQ group (relaying messages between the group and the server)?

LiteLDev does not provide an official group-server relay plugin, so you will need a community solution—for example, HuHoBot (a group-server relay bot) or the WebSocket-based CoordinationWSS (ws/wsserver), available at <https://www.minebbs.com/resources/coordinationwss-ws-wsserver.9637/>. Before using one, make sure it supports your current LeviLamina/BDS version.

*Applies to: LeviLamina 1.x and later (depends on third-party plugin support). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why can't I shut down a hung LeviLamina server with Ctrl+C?

LeviLamina intercepts console Ctrl+C and close events via `SetConsoleCtrlHandler` (along with SIGINT/SIGTERM signal handlers) and calls `DedicatedServer`'s `stop()` to request a normal shutdown. In the current version, once the server has entered the shutdown process (`GamingStatus::Stopping`, meaning it has reached `ServerInstance::leaveGameSync`), pressing Ctrl+C again calls `std::terminate` to force the process to exit. So if the server hangs during shutdown, press Ctrl+C a second time to force it closed. However, if the server hangs before entering the shutdown process (for example, because of a main-thread deadlock), the `stop()` request is never handled and the state never reaches `Stopping`. In that case, pressing Ctrl+C repeatedly has no effect, and you must kill the process by other means, such as Task Manager.

*Applies to: LeviLamina 26.60.x (server)*

## Can the LeviLamina documentation be downloaded for offline use?

Yes. The LeviLamina documentation sources are in the `content/LeviLamina/` directory of the `LiteLDev/liteldev.github.io` repository (in Markdown, in both Chinese and English). Clone that repository to read the docs offline, or run `npm ci && node scripts/docs-sites.mjs build LeviLamina` in the repository to build the site locally. The `docs/` directory in the main LeviLamina repository now contains only `contributing` (build and code-style guides). The online documentation is at <https://levimc.org/LeviLamina/>.

*Applies to: current version (docs moved to liteldev.github.io on 2026-11-16)*

## I want to open a PR to fix errors in the LeviLamina developer docs or tutorials. Where are the documentation sources?

The documentation sources are in the `content/LeviLamina/` directory of the `LiteLDev/liteldev.github.io` repository; submit your PR there. Tutorials are in the `content/tutorials/` directory of the same repository. The documentation site is at <https://levimc.org/LeviLamina/>. The `docs/contributing/` directory of the main LeviLamina repository contains only the guides for developing LeviLamina itself (building and code style).

*Applies to: current version (since 2026-11-16)*

## What is the official website / documentation address of LeviLamina?

Documentation: <https://levimc.org/LeviLamina/>; source repository: <https://github.com/LiteLDev/LeviLamina>
