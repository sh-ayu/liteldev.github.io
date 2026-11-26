# LegacyScriptEngine: general questions

## What is the purpose of this project?

This project allows you to run LLSE plugins on LeviLamina.

## Does this project support all LLSE plugins?

Almost all LLSE plugins are supported, though some may not work properly due to differences in event trigger timing and other factors.

## How long will this project be maintained?

We will maintain this project as long as we have the time and ability to do so.

## Does the LSE Node.js plugin support hot reload? After `ll reload` it reports success, then prints `NodeJs plugin XXX exited`. Did the reload fail?

Yes. In early versions (2024), the Node.js engine did not support reloading and threw an error. However, plugin reloading (including nodejs/qjs/lua) has been fixed since LSE 0.9.0, and unloading stops the plugin's Node.js environment. To reload a plugin, run `ll reload <plugin name>` in the console, or run `ll unload <plugin name>` followed by `ll load <plugin name>`.

The `[legacy-script-engine-nodejs] NodeJs plugin XXX exited with code 0.` message that appears after the reload-success message does not indicate a failure. In reality, the old instance exits first and the reload succeeds afterward. However, the "reload succeeded" message is command output and appears immediately, whereas the "exited" message is printed asynchronously through the logger with a slight delay, making the order appear reversed. In the current version, this message is logged at the Debug level when the exit code is 0, so you usually will not see it at the default log level. If it appears at the Error level with a non-zero exit code, the plugin exited abnormally and you should check the preceding errors.

Note: Because the LSE architecture dates back to early LL, reloading is not 100% reliable. After you reload a plugin that registered commands with `mc.newCommand`, the old commands remain in the game without their callbacks (running them shows `is the plugin unloaded?`). If anything goes wrong after a reload, restart the server directly, and keep LeviLamina and LSE up to date.

*Applies to: LegacyScriptEngine 0.9.0 and later (Node.js engine); LeviLamina 1.x and later*

## Can LSE JS plugins (QuickJS / Node.js engine) use ES Module `import`/`export` syntax? Loading with `import { xxx } from "./xxx"` fails with `Failed to load plugin ...: Unexpected token '{'`. What is going on?

Both engines now support ESM:

1. QuickJS engine: Natively supports ES Modules (ES2020). However, ScriptX uses the quickjs-libc module loader, which sets the base path to the current working directory (the directory containing the BDS server program) rather than the plugin directory when loading the entry module specified in `manifest.json`. As a result, a relative `import` in the entry file (such as `import { initCommand } from "./command/command.js"`) fails to resolve and reports `Failed to load plugin xxx: Unexpected token '{'`. To fix this, use a path relative to the working directory in the entry file, such as `import { initCommand } from "./plugins/your_plugin/command/command.js"`. Alternatively, have the entry file `import` only the actual entry module, after which `import` statements between other modules will resolve according to standard ESM rules. You can also bundle everything into a single js file using a tool like esbuild.
2. Node.js engine: Supports ESM since LSE 0.10.6 (PR #268). Set `"type": "module"` in the plugin's `package.json` to load it as an ES module (CommonJS is the default). Note that files imported in ESM must include their file extension, and static `import` statements may only appear at the top level of a module (for example, not inside a `try` block).
3. Loading TypeScript directly is not supported. Compile it to JS first using `tsc` or a similar tool (using either ESM or CommonJS as the target module format).

See the "About the path resolution behavior of QuickJS ESModule" section in the documentation at <https://lse.levimc.org/zh/apis/LanguageSupport/>.

*Applies to: QuickJS ESM: LSE all versions; Node.js ESM: LSE 0.10.6 and later*

## What is the relationship between LegacyScriptEngine (LSE) and LeviLamina (LL)? What do abbreviations such as LXL/LLSE/LSE stand for?

LeviLamina (LL) is the mod loader itself and directly loads only native mods (C++ `.dll` files). LegacyScriptEngine (LSE) is a native LeviLamina mod that provides the LLSE API runtime, which script plugins depend on to run. LSE provides four language engines: QuickJS (JS, supports ES Module), Lua, Node.js (supports npm), and Python (CPython, supports pip). On a server, install the matching variant with lip, such as `lip install LegacyScriptEngine#quickjs` (`#lua`/`#nodejs`/`#python`); on the client, use LeviLauncher. In `manifest.json`, the `type` is `lse-quickjs`, `lse-lua`, `lse-nodejs`, or `lse-python` for a script plugin, and `native` for a native mod.

History: the script engine was called LXL (LiteXLoader) in the LL1 era -> LLSE in the LL2 (LiteLoaderBDS, LLBDS) era -> LSE on LL3 (LeviLamina), all maintained by LiteLDev/LeviMC. LSE can run most old LLSE plugins, though it is not 100% compatible. Other common abbreviations include LO = LeviOptimize (performance optimization) and LAC = LeviAntiCheat (anti-cheat). Documentation: <https://levimc.org/LegacyScriptEngine/> (this replaces the old addresses lse.levimc.org and docs.levimc.org/LegacyScriptEngine/).

*Applies to: LeviLamina current version; LegacyScriptEngine 0.23.x*

## When several LSE plugins listen to the same event (such as `onChat` or `onLeft`) and one plugin intercepts it with `return false`, do the other plugins still receive the event? What is the execution order? Does LSE have event priorities?

Yes, they still receive it. Current versions of LSE call all listeners for an event in registration order (generally the plugin load order). Returning `false` from a listener only marks the event as intercepted so that BDS (the LeviLamina event) does not process it further. For example, an intercepted chat message is hidden from everyone, but listeners in other LSE plugins still receive the event.

`mc.listen` in LSE has no priority parameter. To control the execution order, declare a dependency with `dependencies` in the plugin's `manifest.json`: the depended-on plugin loads first, so its listeners are registered and run first. If you need true event priorities (for example, a mute plugin that must intercept `TextPacket` or the chat event before other plugins), write a C++ mod and register the listener on LeviLamina's EventBus with a higher `EventPriority`. This has been the event dispatch behavior since after 0.4.12.

*Applies to: LSE current version*

## Can an LSE (LegacyScriptEngine) script plugin open a chest-like container screen (fake chest / virtual container / chest menu) for a player and handle the player's clicks?

LSE has no API to directly open a container screen or chest menu, and the old LLSE NativeAPI has been removed (hooking is not possible).

1. Display only (read-only viewing): you can do this in plain LSE by sending packets. Write the data with `BinaryStream`, call `createPacket`, and send it only to the target player with `packet.sendTo(player)` or `pl.sendPacket(packet)` in this order: `UpdateBlockPacket` (fake a chest block near the player, such as above their head; it does not exist on the server and other players cannot see it) -> `BlockActorDataPacket` (write the block entity NBT, where every item in the `Items` list needs a `Slot`) -> `ContainerOpenPacket` to open the container. You cannot open a container out of thin air; it must correspond to a container block. After the player finishes viewing, send packets to restore the original block. This is a client-side display only, so the player cannot actually take items. In practice, a chest works, but a hopper does not; also, the client will not show a container while the chat screen is open, so have the player trigger it with a command. For protocol details, see Mojang's official <https://github.com/Mojang/bedrock-protocol-docs> (the Bedrock protocol page on wiki.vg is outdated).
2. Interactive chest menu (click an item to perform an action): plain LSE cannot handle received packets or callbacks. You must either use a dependency library (such as the chest-menu/virtual-container interface wrapped by the third-party GMLIB) or write a native C++ mod directly (in C++, you can handle clicks using receive-packet events such as `ReceivePacketEvent` from the iListenAttentively C++ event library, which LSE scripts cannot listen to directly). For simple button interactions, use a form instead.

LSE v0.23.1 still has no container screen API.

*Applies to: LegacyScriptEngine all current versions*

## Are LSE `setTimeout` / `setInterval` timings affected by the server TPS / tick rate? How do I make scheduled tasks unaffected?

Yes. LSE `setTimeout` and `setInterval` run on the server main thread and convert the delay into game ticks for scheduling. When the tick rate changes or TPS drops, the actual trigger time shifts with it. Checking every tick in `onTick` (such as a home-made cron) occupies the main thread and hurts TPS. Instead, compute the time until the next trigger and schedule it with `setTimeout`, and move time-consuming work (such as world compression) to another thread or an external process.

In a native C++ mod, if you do not need to stay in sync with ticks, you can use `ll::coro` coroutines with a non-tick executor such as `ll::thread::ThreadPoolExecutor` to wait by system time, then switch back to `ll::thread::ServerThreadExecutor` when you need to operate on game objects.

*Applies to: LegacyScriptEngine all current versions; LeviLamina current version (C++ part)*

## Can a LeviLamina server run / can I write Python (and Node.js) plugins? Do the old LLSE Python plugins still work?

Yes. LegacyScriptEngine provides both Python and Node.js engines (early LSE versions briefly lacked support for them, which is no longer an issue). Install the matching variant with lip: `lip install LegacyScriptEngine#python` (or `#nodejs`, `#lua`, or `#quickjs`; without a variant, lip installs the QuickJS and Lua engines by default). Put LLSE-era Python plugins directly into `plugins/` (since 0.23.0, this directory is a link to `mods/` created at startup). When the server starts, it migrates them automatically by generating a `manifest.json`, and they load after you restart the server. Keep in mind that the Python plugin ecosystem is small.

As another option, you can write Endstone Python plugins and use LeviStone (EndstoneRuntime) to run them on LeviLamina.

*Applies to: LegacyScriptEngine 0.23.x*

## The new LSE reports `找不到事件 onConsoleOutput！In Plugin: xxx` (meaning "event onConsoleOutput not found"; for example some TMEssential features stop working after upgrading BDS/LSE). Was `onConsoleOutput` removed?

Yes. The `onConsoleOutput` event existed in the LLSE era, but the new LSE no longer provides it, and the maintainers have stated that it will not be added back because hooking the output stream for the script layer is bad design. This error means the plugin is outdated and uses a removed event. The plugin author needs to remove the listener for that event (`mc.listen("onConsoleOutput", ...)`), which generally does not affect the plugin's other features. If a plugin is no longer maintained, such as TMEssential, switch to an actively maintained alternative (for example, YEssential, whose tutorial explains how to migrate your home/warp JSON data).

*Applies to: LSE 0.10.0 and later*

## Can LSE run on the LeviLamina client? How do I install it? Can I use it to write client mods (key events, Screen, etc.)? Does it work in multiplayer?

It runs on the client, but it is essentially server-only:

- On the Windows client, LSE runs only when you open a local single-player world, which acts as a local server. In that mode, it works the same as on a dedicated server, and LSE plugins written for the server also run on the client.
- Scripts do not run when you join someone else's server for multiplayer, and many of LL's server-side APIs are unavailable on the client.
- The maintainers have stated that LSE will not target client mods and have no plans to add client APIs such as key events or Screen. Client scripting would only be considered as a separate engine in the future; for now, C++ remains the best choice for client mods.

Installation: on the client, install LeviLamina and LSE with LeviLauncher, which selects the correct client version automatically. In LSE 0.23.1 and earlier, the client variants are named `#client_lua`, `#client_quickjs`, `#client_nodejs`, and `#client_python`. Starting from the next version (CHANGELOG `[Unreleased]`, migrated to `lip.toml`), there are no `client*` variants: install `#lua`, `#quickjs`, `#nodejs`, or `#python` on both client and server, and lip/LeviLauncher will select the right files for each side.

Only the Windows client is supported; the Android client is not.

*Applies to: LeviLamina client (Windows) + LSE 0.17.0 or later; variant naming changes after LSE 0.23.1*

## Can I debug LSE script plugins with breakpoints? Do I have to add output and restart the server every time I want to inspect a data structure? How do I locate the error line when writing in TypeScript?

The official LSE release does not include a breakpoint debugger. Adding one requires modifying and recompiling the LSE source, and even then, the client times out and disconnects while the server is paused at a breakpoint.

- The usual approach is to add log output and reload the plugin with `ll reload <plugin name>`, which avoids restarting the whole server.
- LSE also provides interactive shells for simple testing. In the BDS console, enter `jsdebug` (QuickJS), `luadebug`, or `pydebug` (Node.js has none) to enter or exit the interactive environment for that engine.
- TypeScript must first be compiled to JS with `tsc`. Error locations point to the compiled JS, so you must map them back to the TS source manually using the sourcemap.
- For C++ mods, you can attach the Visual Studio debugger directly.

*Applies to: LegacyScriptEngine current version (v0.23.1)*

## Will LegacyScriptEngine be maintained long term? Will a new script engine (LeviScript) replace it?

In February 2024, the developers planned to stop maintaining LSE once a new script engine, LeviScript, was finished. That plan has been dropped: in October 2024, the developers stated that nobody is working on the new script engine, it will not be written, and LSE will continue to exist and be maintained.

Note that LSE's NativeAPI has been removed completely, so scripts can no longer call or hook native functions. If you need more power, the developers recommend writing a C++ mod directly. If you need a stable ABI or want to write plugins in another scripting language, consider the third-party Endstone.

## How do I show server data (such as a leaderboard) on a web page in real time?

Use a plugin to read the data and expose it to the web page over the network.

- Start an HTTP server using LSE's built-in HttpServer (also available in QuickJS and Lua) or the `http` module in the Node.js engine, and have the page poll it with JS.
- Push updates over WebSocket for real-time refreshing.
- Use an HTTP library in a C++ mod.

*Applies to: LSE current version*

## Can a BDS server plugin play music to players? Are there ready-made solutions?

Yes. There are two common approaches:

1. Play note-block music in NBS (Minecraft Note Block Studio) format using a ready-made plugin such as LLSE-NBSPlayer: <https://www.minebbs.com/resources/llse-nbsplayer-bds-nbs.4479/>
2. Pack the music files into a resource pack and play the sounds with a plugin or the `/playsound` command. The downside is a large resource pack.

*Applies to: current version (check third-party plugin compatibility yourself). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Do LL3 (LeviLamina + LSE) script plugins have a built-in database? Do I need to deploy something like MongoDB myself?

Yes. LegacyScriptEngine provides built-in database APIs: a LevelDB-based key-value database (`new KVDatabase(dir)`) and SQL database sessions via `new DBSession(type, params)`, where `type` supports `"sqlite3"` and `"mysql"`. You generally do not need to deploy MongoDB; just pick whichever option fits your needs (note that MySQL requires your own MySQL service).

*Applies to: LegacyScriptEngine current version*

## Can `setInterval` in LLSE/LSE run once every 1 millisecond?

No. LSE schedules timer tasks on the server's main-thread executor and rounds delays up to game ticks (1 tick = 50ms). Because precision is limited to the game tick, millisecond-level timing is not possible.

Also, if you only need to run commands periodically, command blocks or functions perform much better than a script calling `mc.runcmd`.

*Applies to: LeviLamina + LegacyScriptEngine current version*

## How do I view a player's IP on an LSE server and ban players (xuid/IP)? Which plugins can I use?

LSE provides an interface to get a player's IP: `player.getDevice().ip` (the `ip` property of the device info object).

Plugins:

- To view player IPs, use s-view.
- To ban players, use LLBlackBeEx (<https://www.minebbs.com/resources/llblackbeex-_.4405/>). It can also report malicious players to the BlackBe cloud blacklist, which blocks them across all servers running a cloud-blacklist plugin.
- Other ban plugins, such as gmblacklist, also work.

Note that IP bans have limited effect because players can bypass them by switching networks or hotspots.

*Applies to: LSE current version (check third-party plugin compatibility yourself). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is the documentation updated when the LSE API changes? Will LSE still get new APIs?

The documentation is updated alongside the API (<https://levimc.org/LegacyScriptEngine/>).

The maintainers no longer add new features to LSE on their own, and the existing API is largely stable. However, community PRs are welcome, and new APIs are now added mainly through community contributions (for example, 0.19.1 added a batch of community-contributed APIs including `Packet`, `BinaryStream`, `mc.getMotd`, and `mc.summonMob`).

*Applies to: LSE current version*

## How does the LSE Node.js engine handle a plugin's `package.json` dependencies (`npm install`) and load the plugin?

When loading a plugin whose `package.json` has a `dependencies` field and whose directory has no `node_modules` yet, LSE first runs `npm install --omit=dev --no-fund` automatically (using the npm bundled in the engine directory), then creates the engine and loads the plugin:

- CommonJS plugins run through a wrapper bootstrap that adds the plugin directory and its `node_modules` to the `require` lookup paths, and then calls `require` on the entry file.
- Plugins whose `package.json` has `"type": "module"` are loaded as ES modules via `import()`.

Because of this, startup does not work like a standard `node entry-file` launch.

*Applies to: LSE Node.js engine (`#nodejs` variant); ESM support since 0.10.6*

## What is the difference between LSE's `getAllPlayerInfo` and the all-player info provided by GMLIB's LegacyRemoteCallApi (GMLRA)?

LSE's `data.getAllPlayerInfo()` reads LeviLamina's PlayerInfo service. LL maintains this data itself and stores it in the `playerinfo` database under the LeviLamina data directory (outside the world). GMLRA calls GMLIB, which writes its data into the world data. As a loader, LL should not modify world data, so it uses external storage instead.

*Applies to: LSE 0.8.13 or later*

## What is the difference between LSE's Python engine and BDSpyRunner (pyr)? Can pyr plugins be used directly on the LSE Python engine?

They are different plugin loaders that both support writing plugins in Python. LSE's Python engine (`lip install LegacyScriptEngine#python`) shares the same API with the other LSE engines (Lua/QuickJS/Node.js). pyr plugins do not work directly and must be rewritten for the LSE API.

In addition, the LSE Python engine requires the matching Python version to be installed on the machine (3.12.10 for LSE >=0.16.2).

*Applies to: all current LSE versions*

## Can an LSE script plugin modify event data in an event listener, for example change 5 points of damage from a player attack to 10?

Not directly. In LSE, `mc.listen` event callbacks can only read the arguments or return `false` to cancel a cancellable event. They cannot modify data in the event (such as the `damage` value in `onMobHurt`). If you need to modify event data, write a LeviLamina mod in C++.

As a workaround in scripts, you can intercept the original event and re-apply the effect yourself through the relevant API (for example, cancel the original damage and call `hurt` on the entity to deal the new damage), though this is not the same as modifying the event itself.

*Applies to: LegacyScriptEngine all current versions (up to v0.23.1)*

## Can LSE (LLSE) plugins implement custom interfaces such as JSON UI / ORE UI, rather than only forms?

No. LSE's GuiAPI provides only server-side forms (SimpleForm / ModalForm / CustomForm, and FormBuilder), and it does not currently wrap newer UI APIs such as DDUI. Custom interfaces like JSON UI must be implemented in a client-side resource pack.

A practical workaround is to build the interface in a vanilla addon (resource pack / behavior pack) and connect it to the LSE plugin through an agreed-upon channel (such as a specific form title or content marker, `scriptevent`, or scoreboards).

*Applies to: LegacyScriptEngine current version (v0.23.1)*

## Does LegacyScriptEngine support MySQL? Can the old NativeApi (dyncall) still be used? Is SQLite available?

LSE restored MySQL support in 0.9.0 (now built on mariadb-connector-c). You can use it through `DBSession` by setting `type` to `"mysql"` or passing a connection string in the form `mysql://root:password@localhost:3306/db`. When 0.9.0 was released, the Node.js engine did not support MySQL; the source code no longer distinguishes between backends, but whether it works on the Node.js engine depends on the specific version.

SQLite (`"sqlite3"`) has always been available and was never removed.

NativeApi was completely removed in 0.8.19 and will not return, so old plugins that depend on dyncall/NativeApi cannot be used.

*Applies to: LSE 0.9.0 or later (current v0.23.1)*

## Does LegacyScriptEngine have a command to run JS/Lua code directly in the server console? Can an OP use it to "create a plugin" on the server?

Yes. The QuickJS engine provides `jsdebug` and the Lua engine provides `luadebug`. Running the command without arguments enters or leaves interactive debug mode, where you can run code line by line in the console (enter `stop` or run the command again to leave). You can also run a piece of code directly with `jsdebug <code>`. The Python engine uses `pydebug` (console only); the Node.js engine has no debug command.

Note: the permission for this command is controlled by `debugCommandLevel` in the LSE config file (`mods/legacy-script-engine-xxx/config/config.json`). It defaults to `GameDirectors`, which lets OPs run it in game. Running arbitrary code is equivalent to having backend access to the server and is very unsafe. Raise `debugCommandLevel` (for example to `Owner`/`Host`) so that only the console can use it. If in-game admins need specific functions, write your own plugin that registers dedicated commands.

*Applies to: LSE current version (v0.23.1); the `debugCommandLevel` option was added in a recent version*

## Are the QuickJS/NodeJS/Python/Lua engines of LegacyScriptEngine separate code bases? How does it support multiple languages?

LSE has a single code base (<https://github.com/LiteLDev/LegacyScriptEngine>). Through the xmake backend setting (`lua` / `quickjs` / `python` / `nodejs`), the same source compiles into four engines: `legacy-script-engine-lua`, `-quickjs`, `-python`, and `-nodejs`.

Multi-language support is built on ScriptX, a multi-engine scripting wrapper originally open-sourced by Tencent (LiteLDev maintains its own fork). The layers are LSE -> ScriptX -> QuickJS / Node.js (V8) / Python / Lua. LSE is a port of LLSE, and each plugin gets its own ScriptEngine instance.

*Applies to: LegacyScriptEngine all current versions*

## Does LegacyScriptEngine have a `nodejsdebug` command?

There is no usable `nodejsdebug` command. The source defines the name `nodejsdebug` for the Node.js backend, but the Node.js engine does not support a debug engine and never registers the command. The available debug commands are `jsdebug` for QuickJS, `luadebug` for Lua, and `pydebug` for Python (console only).

*Applies to: LSE current version (v0.23.1)*

## How do I set a land administrator in the iLand land plugin?

Run `land op <player name>` in the server console. The player must have joined the server at least once. iLand is an LLSE script plugin and requires LegacyScriptEngine to run.

*Applies to: servers using the iLand script plugin (third-party plugin). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Why can't I find a LeviLamina C++ event for some of the events LSE provides, and how can a C++ plugin listen for the same things?

LeviLamina keeps only a small set of core events; most events from the LL2 era were not carried over. To stay compatible with LLSE plugins, LSE supplies these events itself: some come from the iListenAttentively event library (an LSE dependency), and others are implemented with hooks inside LSE. As a result, LSE events do not map one-to-one to LeviLamina events.

To listen for the same events from a C++ mod, depend on iListenAttentively (`lip install github.com/LiteLDev/iListenAttentively`) and use its events, or write your own hooks.

*Applies to: LeviLamina 1.x or later / current LSE*

## In LegacyScriptEngine, can global variables or a Map defined in one JS plugin interfere with other script plugins on the server?

No. LSE creates a separate script engine instance for each script plugin, giving each plugin its own isolated global scope. To share data or call functions between plugins, use mechanisms such as remote calls via `ll.exports` / `ll.imports` (provided by LegacyRemoteCall).

## How do I check which version of LegacyScriptEngine (LSE) is installed?

In the console, run `ll show <mod name>` (for example, `ll show legacy-script-engine-quickjs`; the engine package names by language are `legacy-script-engine-quickjs` / `-lua` / `-nodejs` / `-python`) to view the mod's information and version. You can also run `ll list` to list all loaded mods and their versions.

*Applies to: LeviLamina 0.13 or later*

## How do I add support for a new scripting language (such as PHP) to LSE?

LSE's language support comes from ScriptX underneath. Adding a new language requires adding a backend for it to ScriptX first, and then adding a matching engine variant to LSE; you cannot add a language in LSE alone. LSE currently provides four engines: `lua`, `quickjs`, `nodejs`, and `python`.

## I suspect a backdoor plugin ran commands on my server, but the console shows no command record. How do I investigate?

LSE's `mc.runcmdEx` (and `mc.runcmd`) run commands as the server, capturing the output and returning it to the script instead of printing it to the console. That is why the console shows no record. Check your plugin list and search the plugin sources for keywords such as `runcmdEx`, `runcmd`, and `setInterval` to find suspicious scripts.

## I am a beginner and want to write a plugin loaded by LeviLamina. Where do I start? Do I need to download the LeviLamina source?

You do not need to modify the LeviLamina source. Beginners should start with a LegacyScriptEngine (LSE) script plugin:

- Project: <https://github.com/LiteLDev/LegacyScriptEngine>
- Documentation: <https://levimc.org/LegacyScriptEngine/>
- Getting-started tutorial, "Write your first script plugin": <https://levimc.org/tutorials/develop/first-script-plugin/>

Before writing code, set up the API type hints: run `npm install -D @levimc-lse/types` in your project and add `"@levimc-lse/types"` to `compilerOptions.types` in `tsconfig.json` (or add `/// <reference types="@levimc-lse/types" />` to the entry file). This also prevents absolute-path conflicts when collaborating with others.

To write a native mod, you need to learn C++ and set up a VS/xmake environment (see the LeviLamina documentation and levilamina-mod-template).

## The new LSE creates a `plugins` shortcut (directory link) every time the server starts, and recreates it after I delete it. What is it? What if it turns into an ordinary folder or a broken link after I copy the server to another machine?

This is expected behavior. Because most LSE plugins hard-code the `plugins` path, LSE 0.23.0 and later create a directory link (a junction on Windows) pointing to `mods/` at server start for compatibility.

Because the directory link uses an absolute path, copying the server folder to another machine breaks it. Delete the broken link and let LSE regenerate it automatically. Note that if an ordinary file or folder named `plugins` already exists and does not point to `mods`, LSE reports an error instead of overwriting it.

*Applies to: LSE 0.23.0 or later (LeviLamina 26.60)*

## Is there a plugin that can run LSE (LegacyScriptEngine) plugins on Endstone?

No. LSE is a native LeviLamina mod that depends on LeviLamina and prerequisites such as LegacyMoney, LegacyRemoteCall, and iListenAttentively. It runs only on LeviLamina (install it with lip on a server, or with LeviLauncher on a client). Online or AI-generated claims such as "Element Zero is compatible with LSE" are unreliable.

*Applies to: all current versions (LSE 0.23.x / LeviLamina 26.60.x)*

## Player death messages on my server read "被蓄意的游戏设计杀死" (Intentional Game Design) or similar. Is it a hack? What causes it?

It is usually not a hack. In vanilla, "Intentional Game Design" is the death message for a bed or respawn anchor explosion. Unusual death messages can also appear when a plugin deals damage through LSE interfaces such as `en.hurt(damage[,type[,source]])` without specifying a damage source. Check whether players are using beds or respawn anchors in the Nether or End, and check which plugin is damaging players.

The exact text of death messages depends on vanilla BDS behavior.

*Applies to: LSE current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Do I have to install Node.js / the `nodejs` engine to write JS plugins with LSE?

No. Standard JS plugins run on the QuickJS engine (`lip install github.com/LiteLDev/LegacyScriptEngine#quickjs`; if you omit the variant, both the QuickJS and Lua engines are installed by default). A standalone `.js` file is recognized as a quickjs plugin, and after migration its `type` in `manifest.json` is `lse-quickjs`.

You only need the `#nodejs` engine if your plugin uses the Node.js API or npm packages, in which case the manifest `type` is `lse-nodejs`.

*Applies to: LSE current version (0.23.x)*

## When writing an LSE (LLSE) JS plugin, the comment at the top of the file that references type definitions (`/// <reference ...>`) shows a red squiggle in the editor. Do I need to fix it? Does it affect the plugin?

It does not affect execution. That triple-slash comment only provides type information and code completion to your editor; the red squiggle simply means the editor cannot find the referenced type definitions.

To enable code completion, install `@levimc-lse/types` as described in legacy-script-engine-api, then add `/// <reference types="@levimc-lse/types" />` to the entry file or add it to `compilerOptions.types` in `tsconfig.json`. If you do not need code completion, you can ignore the warning.

If the plugin throws runtime errors in the console, this comment is not the cause. Look for other issues, such as a malformed JSON configuration file or a missing or corrupted prerequisite plugin (which you can fix by reinstalling it).

## Can I hook game functions from a script plugin with LSE (such as NativeCall/NativeAPI)?

No, and it is not recommended. LSE's NativeAPI was removed completely in 0.8.19, so script plugins cannot hook game functions. If you need hooks, write a LeviLamina mod directly in C++ (you can start from levilamina-mod-template).

*Applies to: LSE 0.8.19 or later (current 0.23.x)*

## Developing native LeviLamina mods in C++ has too high a barrier. Is there an easier way to develop?

Yes. With LegacyScriptEngine (LSE), you can write plugins in JavaScript (QuickJS/Node.js), Lua, or Python. They are relatively easy to develop and run on both servers and the Windows client.

- Documentation: <https://levimc.org/LegacyScriptEngine/>
- Getting-started tutorial: <https://levimc.org/tutorials/develop/first-script-plugin/>
- Type hints and scaffolding: <https://github.com/LiteLDev/legacy-script-engine-api>

## Why does the server crash on shutdown after hot-unloading a script plugin that registered commands in LSE?

The vanilla command system does not support unregistering commands. After a plugin is unloaded, its commands remain in the command registry, even though the plugin that owns the callback no longer exists. Current versions of LSE print the warning `Command xxx failed to execute, is the plugin unloaded?` when such a command is executed and no longer run the callback. Even so, you should not hot-unload or reload plugins that register commands; restarting the server to update them is safer.

*Applies to: LeviLamina + LSE, all current versions (whether the shutdown crash still occurs is unconfirmed). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where is the API documentation for writing plugins in JS/Lua and other scripting languages on LeviLamina (LegacyScriptEngine, formerly LLSE)? Why can't I find it in the main LeviLamina documentation? What if the old LiteLoaderBDS / lse.liteldev.com / lse.levimc.org docs do not open?

Script plugins are provided by LegacyScriptEngine (LSE), which is itself a mod for LeviLamina. Because of this, the main LeviLamina documentation covers only C++ mod development, while the script API is documented in LSE's own documentation. The current site is <https://levimc.org/LegacyScriptEngine/>, and the API index is at <https://levimc.org/LegacyScriptEngine/apis/> (for example, Logger: `/LegacyScriptEngine/apis/ScriptAPI/Logger/`, events: `/apis/EventAPI/Listen/`). To get started, see the official tutorial "Write your first script plugin": <https://levimc.org/tutorials/develop/first-script-plugin/>.

Addresses used in the past—`docs.litebds.com`, `lse.liteldev.com`, `legacy-script-engine.levimc.org`, `lse.levimc.org`, and `docs.levimc.org/LegacyScriptEngine`—are all obsolete; use the URLs on levimc.org instead. The old LiteLoaderBDS documentation is archived at <https://liteldev.github.io/liteloaderbds-documentation/> for reference only.

The new JS API is largely the same as the old LLSE API, though some steps shown in online tutorials from the LL v2 era are no longer needed: plugin information is now declared in `manifest.json` in the plugin directory (`ll.registerPlugin()` can still be called, but is no longer required). A simple example:

```js
mc.listen("onJoin", (player) => {
    log(`${player.name}已经加入服务器。`);
    player.sendToast('欢迎！', '感谢您游玩本服！');
});
```

*Applies to: LSE all current versions*

## After `ll reload`, an LSE plugin's commands stop working or keep raising errors (such as command registration failures). What should I do?

Fake commands—registered through the old interfaces such as `mc.regPlayerCmd` and `mc.regConsoleCmd`—are registered only once, when the server finishes starting (`onServerStarted`). Calling these interfaces again after a plugin reload does not re-register them, so the commands stop working. The documentation no longer recommends fake commands; use real commands with `mc.newCommand` instead. On reload, if the command already exists, LSE only logs `Runtime command ... already exists`, reapplies `setOverload` and `setCallback`, and the command keeps working. Hot-loading and hot-unloading are meant for debugging and carry risks and performance issues; in production, restarting the server is more reliable when problems occur.

*Applies to: LeviLamina current version; LegacyScriptEngine current version*

## Does LSE have documentation in Markdown format (for example, to feed to an AI)?

Yes. The LSE documentation site is built from Markdown sources in the `content/LegacyScriptEngine/pages` directory of the LiteLDev/liteldev.github.io GitHub repository (Chinese files end in `*.zh.md`, English files end in `*.md`, and the API documentation is under `apis/`). The LiteLDev/legacy-script-engine-api repository also provides API type hints for plugin development and can serve as a reference.

## The LSE Python engine plugins keep raising errors. Is there an alternative?

The developers recommend using LeviStone instead of the LSE Python engine (`LegacyScriptEngine#python`). LeviStone is a runtime that runs Endstone plugins on LeviLamina and gives you access to the Python ecosystem. To install it, run `pip install levistone --target mods/EndstoneRuntime` in the BDS directory where LeviLamina is installed (for versions before 0.11.15, the target directory is `plugins/EndstoneRuntime`).

*Applies to: LeviLamina current version; LeviStone 0.11.15 and later*

## After upgrading the server, the owner of a claim shows as "?" in the iLand land-claim plugin. What should I do?

This happens when LeviLamina's player information data (PlayerInfo, which maps xuids to player names and vice versa) is not copied over during an upgrade to a new server directory. Either copy the `mods/LeviLamina/data/playerinfo` directory from the old server to the new one, or wait for the players to log back in so the data updates automatically. This issue affects any plugin that relies on interfaces such as `data.xuid2name`.

*Applies to: LeviLamina current version; LegacyScriptEngine current version*

## Is it a problem to set a very large value such as `99999999999` as the time for `setTimeout`/`setInterval` in an LSE JS plugin?

Yes. LSE converts the timer duration to a 32-bit signed integer (`toInt32`). Any value above `2147483647` overflows, and if the result is ≤0, LSE treats it as 1 millisecond and runs the callback immediately. Unless you know the exact behavior to expect, keep integer arguments passed to LSE APIs below `2147483648` (2^31).

*Applies to: LegacyScriptEngine current version*

## Is there a plugin to show the server's live map on a web page?

Web-map plugins provide this feature. Search MineBBS for keywords such as "satellite map" and choose a plugin that supports your current LeviLamina and BDS versions. Because these are third-party plugins, you will need to verify version compatibility yourself.

*Applies to: current version (third-party plugin). Not confirmed against the source code or the documentation: treat it as a pointer.*
