# LegacyScriptEngine: performance and tooling

## Is async in LSE truly asynchronous? Will heavy computation block the main thread?

It is not true multithreaded async. The LSE script engine event loop runs on the MC server main thread: the message queues of engines such as QuickJS and Lua are polled once per tick (`loopQueue` `kLoopOnce`), and Promise/`setTimeout` and the like are merely deferred to run later on the main thread. ScriptX posts QuickJS microtasks (Promise callbacks) to the engine message queue, where they run. LSE also drives the Node.js engine's libuv event loop and microtasks on the main thread roughly every 2 ticks (`uv_run` NOWAIT). All MC APIs are synchronous calls.

Because of this, heavy computation blocks the main thread (and lowers TPS) whether or not you mark it `async`. Split the computation into small chunks and spread them across ticks. With the Node.js engine, you can also try moving pure computation into a `worker_threads` worker (workers cannot call MC APIs, and the official documentation does not cover this approach). The Python engine documentation explicitly advises against using features such as `threading` and `asyncio` for now.

*Applies to: all current LSE versions*

## What is the difference between the LSE quickjs and nodejs engines? Do they use V8? How does their performance compare?

The QuickJS engine (`LegacyScriptEngine#quickjs`) uses QuickJS as its JS engine, not V8. Only the Node.js engine (`LegacyScriptEngine#nodejs`) uses V8 and supports npm packages. Whether QuickJS or the Python engine is faster is not clear-cut, whereas V8 is a well-known high-performance (JIT) engine; for large projects, consider the Node.js engine.

*Applies to: all current LSE versions*

## Can LSE (formerly LLSE) script plugins use multithreading to speed up brute-force searches (such as finding nearby ore)?

Essentially no. LSE script APIs can only be called on the server main thread, and the script engines themselves (QuickJS, Lua) have no usable multithreading. Even though Node.js `worker_threads` or Python threads can run pure computation, they cannot call LSE/BDS interfaces, and multiple processes cannot interact with BDS either. For high-performance computation (such as brute-forcing blocks over a large area), write a native LeviLamina C++ mod instead, or lower the frequency and spread the work across multiple ticks.

*Applies to: LegacyScriptEngine, all current versions (including 0.23.1). Not confirmed against the source code or the documentation: treat it as a pointer.*

## An LSE JS plugin reads and writes files every tick in `mc.listen("onTick")`, which makes joining slow and the server lag. How do I find and fix it?

Tools such as VS performance profiling (flame graphs) will show heavy file reading and writing. Search the plugin for `File.readFrom` / `File.writeTo` to find the code doing file I/O inside `onTick`. Writing a file every tick means 20 disk I/O operations per second—more often than BDS saves the world—which severely hurts performance. Write once every few seconds instead (or only when the data changes). In many cases you do not need to listen to `onTick` at all; use `setInterval` as a lower-frequency timer instead.

*Applies to: LegacyScriptEngine, all current versions*

## When an LSE plugin needs to modify many blocks (for example clearing a chunk), is it better to use `mc.setBlock` one by one or the `fill` command?

In LSE, calling `mc.setBlock` repeatedly costs more than running a single `fill` command, because each call crosses the script–C++ boundary and constructs a block. For large-area changes, prefer `fill` (note that `fill` requires the target chunks to be loaded, and a single call has a volume limit), or consider alternatives such as loading a structure.

*Applies to: LegacyScriptEngine, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## LSE's KVDB (`KVDatabase`) reads are fast, but writing nested objects/dictionaries is slow. Why, and how do I optimize it?

`KVDatabase.set` converts the value you pass to JSON through `ValueToJson`. If you pass an object or array, LSE has to walk every key recursively, fetching each value from the script engine and converting it—so the deeper and larger the structure, the slower it gets. Passing a string requires only a single value fetch and is much faster. Serialize the data to a string yourself before storing it (for example with `JSON.stringify`, or by serializing NBT directly to an SNBT/binary string). LevelDB already has its own internal read/write cache and the bottleneck is usually serialization, so you do not need to add another read/write cache of your own.

*Applies to: LegacyScriptEngine, all current versions*

## What is wrong with LSE's built-in BossBar interface (`player.setBossBar`)? Why does the specified entity disappear when I set a bossbar?

When called with a `uid`, `player.setBossBar(uid, title, percent, color)` first sends a BossEvent Remove packet, then sends an AddActor packet (with ActorType `"player"`, the passed `uid` used for both `uniqueId` and `runtimeId`, and the position set below the dimension's minimum height), and finally sends a BossEvent Add packet. Every update removes and re-adds the bossbar instead of sending an update packet. If the `uid` belongs to a real entity, the client overwrites it with this fake entity, making the real entity appear to vanish. Frequent updates are also expensive, and the way it constructs AddActor has been reported to conflict with multithreaded packet sending in other plugins (such as LeviOptimize).

To update a bossbar frequently, use the send/update implementation from a library such as GMLIB (call its exported interface rather than copying the code), or pass a `uid` that does not belong to any existing entity.

*Applies to: LegacyScriptEngine, all current versions (implementation unchanged in 0.23.1)*

## In heavy LSE use, which performs better: running vanilla commands (`mc.runcmd` / `mc.runcmdEx`) or calling the equivalent script API?

Calling the script API is generally faster. Both run essentially the same underlying game logic, but the API avoids the overhead of parsing the command string and running the command pipeline.

*Applies to: LegacyScriptEngine, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## A LeviLamina server has seventy or eighty plugins (many LSE script plugins plus addons), and with a high-end CPU and a dozen or so players the TPS is in single digits. How do I optimize it?

The more LSE plugins you run, the more the server lags: calls between C++ and the script layer carry inherent overhead that compounds with every plugin. Recommendations:

1. Remove unnecessary LSE plugins and replace them with native LeviLamina C++ mods where possible (for example, use the C++ PLand instead of the Lua iLand for land claims).
2. Install only the script engine variants you need with `lip install LegacyScriptEngine#quickjs` (or `#lua`, `#nodejs`, `#python`). Installing without a variant installs both QuickJS and Lua; remove any engine you do not use.
3. Performance is best without LSE installed at all, and better still when combined with LeviOptimize.
4. Player-behavior logging plugins (such as BehaviorLog) are performance-sensitive and easily cause lag.
5. Large mob addons and high numbers of villagers or iron farms also lower TPS significantly.

In the reported case, removing many plugins along with the spawn rules of a high-load addon brought TPS with a dozen or so players back up to 17+.

*Applies to: LeviLamina + LegacyScriptEngine, current versions*

## Why is the LL2 script engine said to slow down the server? How is the current LSE different?

In LL2 (LiteLoaderBDS), having even a single script plugin starts all script engines (JS/Lua/Node/Python) rather than only the ones needed, which further degrades the already modest performance of BDS. On LeviLamina, LSE splits the engines into separate variants so you can install only what you need: `lip install LegacyScriptEngine#quickjs` / `#lua` / `#nodejs` / `#python` (installing without a variant installs QuickJS and Lua by default). Leaving out unused engines reduces overhead.

*Applies to: LeviLamina + LegacyScriptEngine, current versions (0.23.x)*

## With the same number of looped calls, which is faster and less likely to drop ticks: LSE scripts or the vanilla Script API (addon scripts)?

Both run JS on the server main thread, so raw script execution speed is similar; the main difference lies in the overhead of calls between C++ and the script layer. Either way, avoid heavy loops within a single tick—spread the work across multiple ticks or run it less often. Also, when the vanilla Script API forbids modifying world state in a before event, you can schedule the operation for the next tick with `system.run`.

*Applies to: LegacyScriptEngine, current versions; vanilla Script API behavior depends on BDS. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is calling the GMLIB floating text API from LSE expensive?

It depends on how the floating text is implemented. Floating text built from real entities is expensive, whereas GMLIB implements floating text with packets (client-side fake entities), keeping the server-side cost low.

*Applies to: LSE plugins that use GMLIB (third-party library). Not confirmed against the source code or the documentation: treat it as a pointer.*

## A server with about 20 players has a TPS of only about 10, and profiling shows a lot of time in hoppers and an LSE (QuickJS) plugin. What is the cause?

The cause is an LSE anti-item-duplication plugin that listens to hopper events (`onHopperSearchItem` / `onHopperPushOut`) on a server with many hoppers. Each hopper triggers these events several times per second, and the plugin runs heavy logic in every event callback, causing severe lag. To fix this, uninstall or replace the plugin, or reduce the number of hoppers.

*Applies to: LegacyScriptEngine, all current versions*

## When refreshing a mining area with LSE, is there a more efficient method than looping over `setBlock` with a `for` loop?

Save the mining area in advance as an NBT structure. When refreshing, place the whole structure at once with `mc.setStructure(nbt, pos, mirror = 0, rotation = 0)`. Placing a structure in a single call costs less than looping over `mc.setBlock` in a script.

*Applies to: LegacyScriptEngine, current version (0.23.x)*

## After an LSE plugin frequently uses `rename` on player names to show information such as ping below the name, players lag for a few seconds when joining. Why?

`pl.rename()` does more than change a name: each call invokes `setNameTag` and resynchronizes the entity's ActorData (SetActorDataPacket) to all players. Calling `rename` for every player on every tick generates a flood of packets that can crowd out or delay chunk packets for joining players, causing loading lag. `rename` also affects display names in places such as command output.

Instead of calling `rename` frequently, lower the update frequency and either use LSE's packet-sending interface (build a packet with `BinaryStream` and call `pl.sendPacket(packet)`) to send updates only to the players who need them, or hook the relevant packet in C++ to change the display name.

*Applies to: LegacyScriptEngine, current version*

## When profiling a laggy LeviLamina server with a tool such as Visual Studio diagnostics (`.diagsession`), I cannot tell which plugin uses the most. What can I do? Which LSE plugins tend to hurt performance?

Native DLL plugins need a matching `.pdb` symbol file for function names to appear in the profile. Make sure each DLL plugin directory contains its PDB; if not, download it from the plugin's release page and place it in the plugin folder. The PDB must match the exact plugin version, or symbols still will not resolve.

For LSE script plugins, profilers (including windbg) can see only the LSE engine itself, not which script plugin is responsible. If the call stack hotspot is in the tick, it involves `onTick`: search all `*.js` files in the plugin directory for `onTick` (for example, with VSCode or Notepad++) to find plugins that call `mc.listen("onTick", ...)`. Any LSE plugin that listens to `onTick` (such as TMEssential) adds continuous overhead, and loading LSE itself carries some overhead as well.

*Applies to: LeviLamina + LegacyScriptEngine, current versions*

## After running for a long time (about 18 hours), the LSE nodejs engine reports `JavaScript heap out of memory` and crashes the server. Can the memory limit be raised?

Older versions of the LSE nodejs engine use Node 16; newer versions use Node 22. Node/V8 manages heap memory and enforces an upper limit. In theory, you can raise this limit with the Node startup option `--max-old-space-size`. LSE has no configuration option to pass this flag directly, but you can try setting the environment variable `NODE_OPTIONS=--max-old-space-size=<MB>` before starting BDS (not officially confirmed). However, this error is usually caused by a memory leak in a plugin that keeps creating objects without releasing them, so check your plugins first. As a temporary workaround, reload the plugins periodically.

*Applies to: LSE nodejs engine (Node 22), current version*

## Is there an official type definition (`.d.ts`) / code completion library for writing LSE (formerly LLSE) JS/TS plugins? Do HelperLib and LiteLoaderSE-Aids still work?

Yes. The official type definitions are maintained in the LiteLDev/legacy-script-engine-api repository (renamed from HelperLib, so the old `github.com/LiteLDev/HelperLib` URL redirects there). The JS/TS definitions are published as the `@levimc-lse/types` npm package:

1. In your plugin project, run `npm install -D @levimc-lse/types`.
2. In `tsconfig.json` (or `jsconfig.json` for a JS project), add `"compilerOptions": { "types": ["@levimc-lse/types"] }`, or add `/// <reference types="@levimc-lse/types" />` at the top of your entry file.

Note: As of 2026-11-18, `@levimc-lse/types` returns a 404 on the official npm registry `registry.npmjs.org` (and cannot be served by the Yarn registry or jsDelivr either), though the npmmirror mirror in mainland China still hosts 2.18.7. If installing from the official registry fails, run `npm install -D @levimc-lse/types --registry=https://registry.npmmirror.com`, or copy the `.d.ts` files directly from `platforms/javascript/src` in the legacy-script-engine-api repository and reference them with `/// <reference path="local/path/index.d.ts" />`.

The old `/// <reference path="node_modules/helperlib/src/index.d.ts"/>` directive is outdated. Note that a `reference path` can only point to a local file, not a URL. The repository also provides a type stub library for Python.

The LiteLoaderSE-Aids VSCode extension is essentially just a one-click tool for importing completions and optionally launching a server from a BDS directory. Its official repository is archived and no longer maintained. (Community alternatives exist—such as the modified LiteLoaderSE Aids Magic Revision, third-party extensions like LLScriptHelper-MR, and the `levilamina` npm package—none of which are official.)

You can also test without an extension: in the VSCode terminal, `cd` into the server directory and run `.\bedrock_server_mod.exe` in PowerShell or cmd (`./bedrock_server_mod.exe` in Git Bash).

The LSE public API is largely the same as the old LLSE API, so declarations from the LL v2 era mostly still work, though the official `@levimc-lse/types` package is recommended.

*Applies to: current version; `@levimc-lse/types` 2.18.x*

## Can LSE load TypeScript directly? How do I configure `tsconfig` for an LSE plugin written in TS, and how do I bundle a multi-file project into a single plugin js?

LSE cannot load `.ts` files directly and does not compile them on the fly. You must compile or bundle your code to JS first (using `tsc --watch` or a bundler) before loading it.

For type definitions, use the official `@levimc-lse/types` package (as of 2026-11-18, the official npm registry returns a 404; install it with `--registry=https://registry.npmmirror.com`, or copy the `.d.ts` files from `platforms/javascript/src` in the legacy-script-engine-api repository). Set `"types": ["@levimc-lse/types"]` in `tsconfig.json` (the file must be named `tsconfig.json`). Because some type declarations are global and have no default export, do not `import` them—use globals such as `mc`, `ll`, and `log` directly.

You can merge a multi-file project into a single file using a bundler, such as the community template dmblock/lse-typescript-template (which uses rolldown):

- Key `tsconfig` options: `"target": "es2024"`, `"module": "commonjs"`, `"moduleResolution": "node"`, `"esModuleInterop": true`, `"skipLibCheck": true`, `"types": ["@levimc-lse/types"]`, `"rootDir": "./src"`, `"outDir": "./dist"`.
- `rolldown.config.ts`: `defineConfig({ input: 'src/index.ts', output: { file: 'dist/bundle.js', format: 'cjs' }, external: ['ll', 'mc'], platform: 'node', tsconfig: './tsconfig.json' })`.
- Usage: run `git clone https://github.com/dmblock/lse-typescript-template`, delete `.git`, and run `pnpm install`. Use `pnpm dev` for watch mode during development and `pnpm build` to build, then rename `dist/bundle.js` and place it in the plugin directory alongside a `manifest.json`.

Modules that are imported but never used are removed by tree-shaking.

Additionally, the QuickJS engine natively supports ES module `import`/`export` syntax (note that resolving relative paths from the entry module has special behavior; see LanguageSupport in the docs). For the Node.js engine, package your plugin as an npm project: point the entry field in `package.json` to the compiled JS file, and do not include `node_modules` in the archive.

## How do I build the `libnode.dll` used by LSE on Windows (most tutorials online are for `.so`)?

Run `.\vcbuild.bat dll` in the Node.js source directory. If you need V8 internals as LSE does (such as `v8_libplatform`), you must also modify `tools/v8_gypfiles/v8.gyp`; see <https://github.com/LiteLDev/node/commit/80d31fc05ed413e3b29fbbdb0a4dc380eab2f5e3>.

In practice, LSE uses the prebuilt package from the LiteLDev/node fork (currently v22.12.0), so you usually do not need to build it yourself.

*Applies to: current version (LSE nodejs backend, Node.js v22.12.0)*

## When writing an LSE plugin in TypeScript, the `File` class provided by LSE conflicts with the built-in JS/DOM `File` and causes an error. How do I fix it?

This conflict comes from the DOM `File` type included in TypeScript's default library. To use LSE's `File` declaration instead, explicitly set `"lib"` in `tsconfig.json` to only the ES version (for example, `["ES2020"]`) and omit `"dom"`. You can also combine this with `"skipLibCheck": true`.

For type declarations, run `npm install -D @levimc-lse/types` and add `"@levimc-lse/types"` to `compilerOptions.types`. If you use the Node.js engine, you can also use Node's `fs` module directly.

*Applies to: current version (JS/TS plugin development)*
