# Developing LeviLamina mods: general questions

## Difference Between Server Commands and Client Commands

- Server commands are registered by the server. Both the server itself and any players connected to it can execute them.
- Client commands are handled entirely by the client. Only the client that registered them can execute them; neither the server nor other players know they exist.

When LeviLamina runs on **Bedrock Dedicated Server** (BDS), mods can only register server commands.  
When Minecraft runs a **local world**, it runs an internal BDS instance, so mods can register both server and client commands.  
When Minecraft is in **multiplayer mode**, mods can only register client commands.  

You can get the server-side and client-side `CommandRegistrar` instances to register commands like this:

```cpp
ll::command::CommandRegistrar::getInstance(false); // Server
ll::command::CommandRegistrar::getInstance(true);  // Client
```

## Commands Registered in the Mod's `enable()` Method Work on the Server (BDS) but Fail on the Client

This happens because the server (BDS) and the client enable mods at different points in the startup lifecycle:

* The server enables all mods after server initialization finishes (when the world is already loaded).
* The client enables all mods after game startup finishes (when the main menu window appears).

As a result, registering commands in `enable()` on the client always fails, whether they are client or server commands.

Instead, listen for `ServerCommandRegisterEvent` to register server commands, and `ClientCommandRegisterEvent` to register client commands.

## ACCESS VIOLATION Exception When a Mod Calls MCAPI (e.g. `Player::disconnect()`)

Check whether the code calling MCAPI is running on the `MC_SERVER` thread. Because of how Minecraft is designed, most server-side MCAPIs can only be called from the `MC_SERVER` thread.

## Does LeviLamina have C++ API documentation like the Bukkit Javadoc? Do Minecraft's own classes have documentation?

Yes. A Doxygen C++ reference generated automatically from the headers is available at <https://levimc.org/LeviLamina/api/>, and the LeviLamina API reference with explanations and examples is at <https://levimc.org/LeviLamina/api_reference/>. Vanilla Minecraft classes (the headers under `mc/`) have no official documentation, so you must read the headers yourself. The LSE script API documentation is hand-written and follows a different format.

## Can a LeviLamina native mod register custom items, blocks and entities/mobs? Does LL have a ready-made interface?

Yes, though LeviLamina provides no high-level wrappers for registering items, blocks, or mobs. Because it mainly exposes Minecraft's own functions, you must follow the vanilla registration flow yourself. For example, you can construct and register an item manually:

```cpp
SharedPtr<Item> item = SharedPtr<Item>::make("my_mod:managed_item", ++registry->mMaxItemID);
registry->registerItem(item);
```

(`ItemRegistry::registerItem` and the `Item(std::string const&, short)` constructor are both `MCAPI`; a user confirmed this works on 1.9.2.) For blocks, see `BlockDefinitionGroup::registerDataDrivenBlock`, which LL already implements. As long as registration is done correctly, the client generally handles it without issue. Omitting a resource pack causes no errors (the item simply has no texture); to display a texture, pair it with a resource pack.

To add mobs or entities, use a vanilla addon (behavior pack + resource pack), which works on the server alone. You only need to reverse-engineer the vanilla implementation and use hooks or Minecraft function calls for functionality that an addon cannot provide.

*Applies to: LeviLamina current version (26.60.x), server*

## Does the PDB that BDS officially ships contain struct information and RTTI?

No. A typical PDB contains the symbol table, structs, RTTI, and more, but the official BDS PDB strips structs and RTTI, leaving only the symbol table. Struct layouts must therefore be recovered through reverse engineering. This is why the LeviLamina headers contain so many `mUnkxxxx` (`::ll::UntypedStorage<alignment, size>`) members: their layouts were reverse-engineered, and their original member names are unknown.

*Applies to: Current BDS release. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is OEOTYAN/BedrockServerClientInterface on GitHub for?

It is the bsci library, which lets a server draw geometry (such as lines, boxes, circles, and spheres) on the client, replacing the old ParticleAPI. Usage:

1. In `xmake.lua`, add `add_repositories("OTOTYAN https://github.com/OEOTYAN/xmake-repo.git")` and `add_requires("bsci")`.
2. `#include <bsci/GeometryGroup.h>`.
3. Create a group with `bsci::GeometryGroup::createDefault()`, draw shapes with `line`/`box`/`circle`/`sphere`, and remove them with `remove`.

*Applies to: Current version (project still maintained)*

## What is the difference between LeviLamina native mods, LSE plugins and addons? What should I learn to start developing?

A native mod is written in C++ on top of LeviLamina and hooks BDS directly. It is called a "mod" because its capabilities are close to those of a Fabric mod for Java Edition. Code written in JS, Lua, or Python through LegacyScriptEngine (LSE) is called a "plugin": it is easy to get started with, but its features are limited to the API that LSE provides. An addon (a behavior pack or resource pack, along with the Script API) is Minecraft's official built-in extension mechanism, and vanilla BDS supports only addons and SAPI. Because poorly written C++ can easily crash the server, beginners can start with JS on LSE.

## If I install a LeviLamina mod only on my own client, can I still use it when joining someone else's server?

It depends on how the mod is built and which functions it uses. LeviLamina's MC headers are split into server-only, client-only, and shared parts. A purely client-side mod—one that does not rely on server-only functions during online play—works when you join a server. For example, some replay-style client mods also hook server functions, but because that code is never reached when joining a server, they still work on servers. Note that a mod "installed only on the client" is not necessarily a purely client-side mod.

*Applies to: LeviLamina client edition (loaded through LeviLauncher)*

## Can a dll compiled from any compiled language (such as Kotlin/Native or Easy Language) be used directly as a LeviLamina plugin?

No. LeviLamina's API is written in C++ and makes heavy use of templates, so other languages would have to interoperate through a C FFI and rely on a compatibility layer like LegacyScriptEngine to expose the API and events. LL's template code is difficult to wrap in C; at most, only the MC part could be wrapped. There is currently no convenient native solution for languages other than C++. To develop in another language, use LSE (JS/Lua/Python/NodeJS).

## Can I add custom enchantments (new enchantment effects) on BDS (LeviLamina)? Can a behavior pack or changing the enchantment id in NBT do it?

Enchantments are hard-coded: behavior packs cannot add them, and changing an enchantment ID in NBT to a non-vanilla number is not recognized. You can only add them with a native (C++) mod. Even then, the client will not accept a new enchantment registered only on the server; you must also handle sending and receiving packets and implement the anvil and enchanting table GUIs yourself. The function with an "allow non-vanilla" option in the third-party library GMLib only applies vanilla enchantments to items and allows exceeding the maximum enchantment level; it does not add custom enchantments.

*Applies to: All current versions (depends on the vanilla BDS implementation). Not confirmed against the source code or the documentation: treat it as a pointer.*

## In which language can I develop client mods used through LeviLauncher? Does the LeviLamina client have headers for client classes such as the camera?

Client mods are written in C++ on top of LeviLamina (client). LeviLamina now includes headers for most commonly used client classes, such as `src/mc/client/camera/`, `src-client/mc/client/game/ClientInstance.h`, and `src-client/mc/client/gui/controls/renderers/HudCameraRenderer.h`.

*Applies to: LeviLamina client edition (versions after March 2026)*

## A Minecraft function I want to use in a LeviLamina mod is marked `MCNAPI` (not public/not exported) in the header, and compiling or linking reports a missing symbol or deprecated. What should I do?

To meet Mojang's security requirements, LeviLamina uses a symbol whitelist and exposes only the symbols used by existing mods. (Since 26.60, this whitelist is narrower still: each symbol must be listed individually, and whole classes are no longer whitelisted, though member variables have not been removed.) Functions marked `MCNAPI` in the headers display the message "`This API is not available. Open an issue if you need it.`". To request access, open an issue at <https://github.com/LiteLDev/mcapi-requests>, paste the list of functions (symbols) reported missing during compilation or linking, and include a link to your mod repository or download to show that you are developing a genuine LL mod (this mainly screens out cheat developers); legitimate requests are approved. Keep the request short and do not use AI to generate long text. Until a new version exports the symbols, you will have to locate them yourself using signature scanning, pointer offsets, hard-coded RVAs, or similar techniques; virtual functions can be obtained from the vtable. Also note that `BlockSource` must not be copied; use a reference instead, such as `auto& region = ...getDimensionBlockSource();`.

*Applies to: LeviLamina 1.4 and later, especially 26.60.x*

## Before a new LeviLamina version (adapted to a new BDS) is officially released, how can C++ mod developers adapt early?

In the mod project's `xmake.lua`, set the `levilamina` dependency version to the latest full 40-character commit hash of LeviLamina's main branch (`main`)—for example, `add_requires("levilamina <40-char-commit-hash>", {configs = {target_type = get_config("target_type")}})`. Do not use a short hash: xmake treats it as a branch name and fails to fetch. Alternatively, specify the branch name directly (`levilamina main`) to start adapting against the in-development headers. When you do this, xmake prints `Unknown version` and uses the dependency configuration from the `main` branch; this is normal, though you may need to handle dependencies such as `bdslibrary` yourself. Note that `levilamina develop` in the template comments no longer works because the LeviLamina repository no longer has a `develop` branch. If symbols are missing at compile or link time before the official release, you can report them to the maintainers.

## After upgrading BDS/LeviLamina, a C++ native mod that used to work reports memory access errors. What should I do?

C++ native mods are tightly coupled to specific BDS and LeviLamina versions. Running a mod on a different version without adapting it can cause memory access errors or crashes. Before you can use the mod, it must be recompiled against the matching LeviLamina SDK. Wait for the author to release an adapted version, or recompile the source against the new version yourself.

## Are LeviLamina client (LLC) mods compatible across game versions? What is the advantage over writing hooks myself?

Mojang changes code in every version, so unless none of the classes a mod uses have changed, the mod generally needs to be adapted and recompiled for the new version (though a well-written mod is cheap to migrate). LL's advantage is that it provides addresses for a large number of symbols, complete headers with class members (the MC headers under `src/mc`), and various wrapper tools (hooks, events, configuration, and so on), saving you from having to reverse-engineer all of that yourself.

## Can LeviLamina C++ (DLL) native plugins be used across BDS versions? Why do native plugins almost always need an update whenever BDS updates?

LeviLamina native mods call or hook BDS internal functions directly. Because function addresses, signatures, and struct layouts often change between BDS versions, a mod usually must be recompiled for each new version. A DLL continues to work across versions only if none of the BDS functions it calls have changed. Plugins that do not depend on Minecraft content remain usable much longer, and plugins that rely on a library with a stable interface (such as GMLib) hold up better across versions. For small features, writing a script (such as JS with LegacyScriptEngine) is recommended: it works more smoothly across versions and generally keeps working even if the author stops updating it.

## The UI of a PC Bedrock client mod does not show on some users' computers. What is the cause?

PC Bedrock does not always use DX12; some devices run on DX11. If a mod's UI overlay (such as ImGui) is implemented only for DX12, DX11 users will see no mod UI. The mod must support both DX11 and DX12.

*Applies to: PC Bedrock client mods. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can a native mod compiled for a newer LeviLamina run on an older LeviLamina?

Native plugins are generally adapted without regard for older versions. A mod may be compatible with an older version as long as it uses no `MCAPI` exposed only by the newer LL and no API that exists only in the newer Minecraft; otherwise, it must be recompiled for the older version. Updating the server or client to the latest LeviLamina is recommended.

## Debug logs written with `getLogger().debug(...)` in a LeviLamina mod are not shown. How do I change the log level? What levels are there?

A Logger gets its default level from the PreLoader configuration: raise `logLevel` in `PreLoaderConfig.json`. LeviLamina's default Logger level is `logLevel` - 1 (clamped to 0~5), so setting `logLevel` to 5 corresponds to Debug and 6 corresponds to Trace. You can also call `setLevel` on an individual Logger in code—for example, `getSelf().getLogger().setLevel(ll::io::LogLevel::Debug)`. The level enum (`ll/api/io/LogLevel.h`):

```cpp
enum class LogLevel : int { Off = -1, Fatal, Error, Warn, Info, Debug, Trace };
```

*Applies to: LeviLamina 1.x and later (currently v26.60.8)*

## How can a native C++ mod author integrate Sentry, as LeviLamina does, so that crashes of their own mod are reported to their own account?

Register a Sentry account, create a project, and add the DSN to `extraInfo` in the mod's `manifest.json`:

```json
"extraInfo": {
  "sentryDsn": "https://<key>@<host>/<projectId>",
  "sentryUploadType": "all"
}
```

When a crash occurs, LeviLamina's CrashLogger reports information about the suspected mod to its `sentryDsn`; if `sentryUploadType` is set to `"all"`, the crash is reported even when the mod is not the suspect. To get readable stack traces, upload debug symbols with `sentry-cli` in your GitHub Actions release workflow (see the `upload-to-sentry` job in LeviLamina's `.github/workflows/release.yml`: `sentry-cli debug-files upload --include-sources`). Also remember to give your mod a version number (a git tag) so you can tell which version a user is running. JS plugins generally need no configuration.

*Applies to: LeviLamina 1.0.0 and later*

## After a mod that uses LeviLamina's `ll::config::loadConfig` is updated with new config options, the old config file fails to load or part of it is reset. What is the mechanism?

`ll::config::loadConfig` checks the `version` field of the config struct to decide whether an update is needed. If the file has no `version` or its value differs from the one in the code, it runs the updater (by default `defaultConfigUpdater`, which starts from the current defaults and applies the existing file contents on top with `merge_patch`), deserializes the merged result, and returns `false` to signal that the caller should write it back with `saveConfig` (both the template and LL itself call `saveConfig` when `loadConfig` returns `false`). If a developer adds a new field without changing `version`, the config is treated as up to date and deserialized directly; missing fields or mismatched types then cause deserialization to throw. The caller usually catches this and overwrites the config with defaults, losing or resetting part of the file.

For users: change `version` in the config file to a different number to trigger the automatic merge update (keeping your existing settings), or delete the config file to have it regenerated.

For developers: always increment `version` when you add or change config options.

*Applies to: LeviLamina 1.x and later (still applies to the current version)*

## After getting a `PlayerInfoEntry` by uuid, the name field is empty. Does PlayerInfo need `alwaysLaunch` enabled to record player names and uuids?

Yes. The PlayerInfo service is initialized only on first use. Enable `targeted.playerInfo.alwaysLaunch` (default `false`) in the LeviLamina config so that PlayerInfo is initialized at server startup and continuously records the mapping between player names and uuid/xuid.

*Applies to: LeviLamina server, current version*

## When using LeviLamina's config read/write API (based on struct reflection), how do I define multi-level nested JSON? What if a JSON key contains a colon (such as `minecraft:stone`)?

LL provides built-in `ll::config::loadConfig` / `saveConfig` (in `ll/api/Config.h`), which map JSON automatically through struct reflection. The struct must have an integer `version` member (when versions differ, the updater is called and the file is rewritten). Do not hard-code the config path; use the mod's own config directory (for example, `getSelf().getConfigDir()`). For nested objects, nest structs directly. For dynamic keys or keys that contain colons, use `std::unordered_map<std::string, T>` / `std::map`, for example:

```cpp
struct Item {
    std::string dropitem;
    int count;
};
struct Config {
    int version = 1;
    bool instant_destruction = false;
    std::unordered_map<std::string, std::unordered_map<std::string, Item>> destroy;
};
```

Reflection also supports enums. Specify default values in the member initializers (the type must be an aggregate, so do not define constructors).

*Applies to: LeviLamina 0.13 and later, up to the current version*

## After adding Sentry crash reporting to my LeviLamina mod, why do I receive a large number of reports whenever any server with my mod installed crashes, even when the crash is unrelated to my mod? How do I configure this?

Once `sentryDsn` is set in `extraInfo` of the mod's `manifest.json`, LL's crash logger reports crashes. `sentryUploadType` in `extraInfo` controls the scope: when set to `"all"`, every crash on any server with your mod installed is reported. If it is omitted or set to anything other than `"all"`, a crash is reported only when your mod is identified as a suspect module (that is, the crash stack involves the mod). Server owners can also disable reporting with the LL config option `modules.crashLogger.uploadToSentry`.

*Applies to: LeviLamina, current version*

## What is the best-performing way to iterate over a large range of blocks in a C++ mod (for example to clear wrong or unknown blocks)?

Do not call `BlockSource`'s `getBlock` or `setBlock` one block at a time. Instead, get the chunk first and work per chunk with `LevelChunk::getBlock(ChunkBlockPos)` and `LevelChunk::setBlock` to skip the chunk lookup on every call. The data hierarchy is `BlockSource -> LevelChunk -> SubChunk -> Block`; for the best performance, fetch all SubChunks directly (`LevelChunk::mSubChunks`) and read the underlying storage. If you get serialized data, get the index from the block palette and then look up the block indices. Because calling `setBlock` directly from multiple threads causes a crash, perform all modifications on the server's main thread.

*Applies to: LeviLamina server, current version*

## On LeviLamina 1.21.70, calling BDS functions at high frequency from a mod (such as `getBlock`/`setBlock` of `LevelChunk`) is more than ten times slower. What is the cause and how can I speed it up?

According to one user's analysis, PreLoader resolves the addresses of MC API (`MCAPI`) functions called directly from a mod and wraps them for protection, which slows down high-frequency calls. To work around this, either call the virtual functions `getBlock` and `setBlock` on `BlockSource` (which go through the vtable and have been measured to be faster than the wrapped `LevelChunk` functions), or use a signature scan to get the function's real address directly. Note that when calling through `BlockSource`, any lookup failure returns an air block by default.

*Applies to: At the time LeviLamina 1.2.0 / BDS 1.21.70; unknown whether newer versions are still affected. Not confirmed against the source code or the documentation: treat it as a pointer.*

## In LeviLamina mod development, which has lower overhead, listening to events or hooking directly? Why can a plugin with many hooks freeze or crash on hot unload?

Prefer events. Hooks carry their own overhead: even an empty hook function adds a few extra jumps. In addition, installing or removing a hook while the game is running pauses all other threads for safety (`GlobalThreadPauser`, which prevents the CPU from executing memory while it is being modified) and resumes them afterward. Frequent hooking and unhooking is therefore costly, and a deadlock during the pause can freeze the server. By contrast, subscribing to or unsubscribing from an event only inserts into or erases from a hash-table container in the `EventBus`. A common cause of crashes on unload is registering callbacks (such as listeners or scheduled tasks) without cancelling them on unload, so a callback is invoked after the DLL has already been unloaded.

*Applies to: LeviLamina 1.x and later*

## When developing a land-claim plugin, how do I efficiently determine which claim a block coordinate belongs to (without iterating over all claims and comparing xyz ranges every time)?

Load all claim data into memory and build a spatial index. For example, map each dimension to its chunks and each chunk to a list of claim IDs (`Map<dimid, Map<chunk, Vector<Id>>>`), where a single chunk can map to several claims. If a large claim spans multiple chunks, compute all the chunks it covers and add its ID to each chunk's list. To query a coordinate, compute its chunk, compare the coordinate only against the claims in that chunk's list, and fetch the claim data from the cache by ID. Alternatively, use an AABB tree (such as <https://github.com/lohedges/aabbcc>) to speed up containment checks.

*Applies to: General design approach, independent of version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is there a tool for profiling the memory of a LeviLamina mod (to track down memory leaks)?

Use the Visual Studio diagnostic tools: attach to the `bedrock_server_mod.exe` process, take memory snapshots (Memory Snapshot), and compare them to locate the leak.

*Applies to: LeviLamina server (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is there documentation or a getting-started tutorial for LeviLamina C++ mod development? How does a beginner write a first mod, and how do I find the APIs and headers I need?

Yes. The getting-started tutorial "Your first LeviLamina mod" is at <https://levimc.org/tutorials/develop/first-levilamina-mod/> (older URLs such as `levilamina.liteldev.com/.../create_your_first_plugin` and `lamina.levimc.org/zh/developer_guides/tutorials/create_your_first_mod/` have all moved). The LeviLamina documentation site is at <https://levimc.org/LeviLamina/>. It has how-to guides for commands, events, hooks, forms, items, i18n, coroutines, and more (`developer_guides/how_to_guides`), along with an API reference (`api_reference`, covering config and other topics). The Doxygen C++ reference generated from the headers is at <https://levimc.org/LeviLamina/api/>.

Vanilla Minecraft classes have no documentation. Instead, read the headers (`mc/...`), the test code in the LeviLamina repository (`src-test/`, such as `src-test/server/testCommand.cpp` and `EventTest.cpp`), and other open-source mods (such as LeviOptimize and LegacyMoney). Listen for events through `ll::event::EventBus`; to cancel a cancellable event, call `event.cancel()` in the callback. Script plugins (LSE) have separate API documentation on the LSE documentation site.

Beginners can include all headers at once with an "all-in-one header", but this is not recommended: it slows compilation significantly, makes clangd lag, and can even exhaust memory in large projects.

*Applies to: All current versions (LeviLamina 1.x and later; refer to levimc.org for the current documentation URLs)*

## Where do I request that LeviLamina export a new MC API, symbol, class member or hook for my mod? Can I request an RVA?

Open an issue in LiteLDev's mcapi-requests repository (<https://github.com/LiteLDev/mcapi-requests/issues>); the main LeviLamina repository no longer accepts these requests. You can choose either server or client, and the maintainers will sort them out. Explain clearly what your mod is for.

You do not need to request an RVA. If you know the symbol name, you can get its address directly through LL's symbol resolution—for example, `"symbol name"_sym.resolve()` (requires `using namespace ll::literals;`; `"symbol name"_symp` is also available and returns the cached address directly). If resolution fails (returns `nullptr`), the symbol is currently unavailable and you still need to submit a request.

*Applies to: LeviLamina 1.5 and later (currently 26.60.x)*

## Do I have to click through the LeviLamina API documentation on the website one page at a time? Is there an easier way to search it?

In the website's C++ Reference (generated from the headers by Doxygen), press `Ctrl+K` or `/` to search for classes, functions, and files by name. A more efficient approach is to clone the LeviLamina repository and search the headers globally in a local editor such as VS Code (`src/ll/api` contains LL's own API, `src/mc` holds the public BDS headers, and `src-server` / `src-client` hold the server-only and client-only headers).

## The LeviLamina API documentation lacks client-related content (such as `ClientInstance`), and finding headers is hard. What can I do?

Client-related headers are in the `src-client` directory of the LeviLamina repository; for example, `ClientInstance` is at `src-client/mc/client/game/ClientInstance.h`. Clone the repository and search within `src-client`. In addition, the Doxygen input for the current website C++ Reference already includes `src-client/ll/api` and `src-client/mc`, so you can also search for client classes directly in the documentation.

*Applies to: LeviLamina current version (including versions with client support)*

## Can I use a release version format such as `v[mod version]-mc[MC version]` (for example `v0.3.1-mc26.51`) to mark the MC version a mod supports?

This is not recommended. Under SemVer 2.0.0, a version containing "-" is parsed as a pre-release (testing) version, and tools such as lip also follow SemVer (treating pre-release versions differently during version selection and self-updates). To attach MC version information, use build metadata instead (a "+" suffix, for example `1.0.0+mc26.51`).

*Applies to: All current versions (lip uses lip.toml, and versions must follow SemVer 2.0.0)*

## A packet structure definition in the LeviLamina headers looks wrong. How do I report it?

Open an issue in the LeviLamina GitHub repository (LiteLDev/LeviLamina), preferably including how to fix it (the correct structure, offsets, and so on). You can also submit a PR with the fix directly (hand-written content must go outside the auto-generated blocks).

## In IDA a BDS function accesses a member offset such as `a1+416`. How do I find which member in the LeviLamina headers it corresponds to (for example a member starting with `mUnk`)?

Open the class header in the LeviLamina repository under `src/mc` (or `mc/` under `src-server`/`src-client`) and find the `// member variables` block. In the current headers, members are declared as `::ll::TypedStorage<alignment, size, type> mXxx;` or `::ll::UntypedStorage<alignment, size> mUnkxxxxxx;`. Because the headers do not include offset comments, you must calculate the offsets yourself: start from the size of the base class, add each member's size and alignment in order, and compare the result with the offset in IDA (for example, 416 = 0x1A0) to find the matching member. You can also verify the offset in your own code with `offsetof` or `static_assert`.

*Applies to: LeviLamina current version (v26.x, members use the TypedStorage/UntypedStorage layout)*

## What does the new template for requesting MCAPI/symbol exports (mcapi request) require? Can template classes be requested? How many items can one issue request?

Submit requests to the separate LiteLDev/mcapi-requests repository by opening an issue with the Request template (using a title such as `Request symbols for <your-mod-name>`). The template has the following fields:

- Mod: the public GitHub repository URL of the mod. Use the current URL, and make sure the mod name from the issue title appears in its `README.md`.
- Platform: Server for Windows / Client for Windows / Client for Android.
- Justification: what the mod does and why it needs these exports, in at most 200 tokens. Keep it brief and do not use AI to generate a long explanation.
- Classes: classes that need member variables, one per line.
- Symbols: unresolved symbols from the linker errors, one per line.

Members (Classes) and functions (Symbols) use the same template. Each issue can contain at most 64 lines of Classes and Symbols combined, but you can open as many issues as you need. Template classes with `< >` cannot be generated automatically; open a separate request for them so someone can handle them manually.

*Applies to: The current (2026-11) LiteLDev/mcapi-requests process*

## Which WebSocket library works well for LeviLamina C++ mod development?

LeviLamina does not provide a built-in WebSocket API, so you need a third-party library. Common choices include websocketpp (<https://github.com/zaphoyd/websocketpp>, based on C++11/asio) and uWebSockets (<https://github.com/uNetworking/uWebSockets>), or you can build your own on top of a TCP library. You can usually pull these libraries in with xmake's `add_requires`.

*Applies to: All current versions (third-party library, independent of the LL version). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Where can I find the Bedrock network protocol documentation when I need to send or capture packets for a LeviLamina mod?

Mojang's official protocol documentation repository is at <https://github.com/Mojang/bedrock-protocol-docs> (still actively updated). The Bedrock protocol pages from the former wiki.vg have been merged into the Minecraft Wiki (under the Bedrock Edition protocol pages on minecraft.wiki). LeviLamina provides headers for individual packets under `src/mc/network/packet/` (such as `CameraPacket.h` and `CameraInstructionPacket.h`), which you can construct and use directly.

*Applies to: LeviLamina current version*

## What conventions apply when I submit a PR to the LeviLamina headers (`src/mc`), for example to add a default constructor or a hand-written function to a class?

Most headers in `src/mc` are generated by a tool that merges new output with existing content. Hand-written code is preserved during regeneration as long as you follow these conventions:

1. Do not place hand-written code inside generated regions (`// auto generated inclusion list`, `// auto generated forward declare list`, between `// NOLINTBEGIN` and `// NOLINTEND`, `MCAPI`/`MCFOLD`/`MCTAPI`/`MCNAPI` declarations, or the `::ll::TypedStorage<...>` member layout), and do not add to or reorder the generated lists; doing so breaks future merges.
2. Put hand-written declarations in a separate `public:` block above `// member variables` and export them with `LLNDAPI`/`LLAPI`.
3. Put the implementation in a `.cpp` file in the same directory; do not inline it in the header.
4. For a default constructor, you can change the declaration in the `// prevent constructor by default` block to `= default` or `= delete`; this change is preserved on regeneration.

*Applies to: LeviLamina current version*

## Can I write a LeviLamina mod that detects a frozen BDS (hang), then kills the process and restarts it automatically?

Relying only on a mod inside BDS is not recommended. LL mods share the main thread with BDS, so when the main thread hangs, any mod logic that depends on the tick stops as well. The reliable approach is an external watchdog: send a periodic heartbeat from the game tick (for example, through a pipe), and have an external process (or a separate guard thread) treat the server as hung if no heartbeat arrives for a long time. Restarting the server and generating a dmp are also easier from an external program. Some server panels have this feature built in.

*Applies to: All current versions (general design advice). Not confirmed against the source code or the documentation: treat it as a pointer.*

## When reverse engineering Bedrock and restoring functions that the compiler inlined, is there a publicly available binary with symbols for reference?

You can use the macOS build of Minecraft Education. Its binary includes a large number of symbols (dual-architecture x86_64 and arm64, with over 1.1 million symbols in total) and shares its codebase with Bedrock, making it very valuable for reverse engineering. Download it from <https://aka.ms/meeclientmacos> or <https://education.minecraft.net/zh-hans/get-started/download> (as of 2026-09, the stable version was 1.26.32 and the beta was 1.26.30; versions continue to be updated). You can match functions against the Windows build with tools such as bindiff; using the x86_64 slice avoids the poor results of cross-architecture matching.

*Applies to: Minecraft Education macOS builds as of 2026-09; check yourself whether later versions still ship symbols. Not confirmed against the source code or the documentation: treat it as a pointer.*
