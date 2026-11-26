# LeviLamina mod API: hooks and memory

## Do I need to unhook manually in a LeviLamina mod's disable/unload? Are hooks registered with the `AUTO` macros unloaded automatically?

The `AUTO` macros (`LL_AUTO_TYPE_INSTANCE_HOOK` and so on) generate a global `HookRegistrar` object that hooks on construction and unhooks on destruction. When the mod is unloaded (the DLL is released and static objects are destroyed), these hooks are removed automatically, so you do not need to unhook in unload. Merely disabling the mod does not release the DLL, so the hooks stay active. If you want hooks to stop working after disable (to support hot reload or disabling and re-enabling at runtime), call `DEF_TYPE::unhook()` in disable and `DEF_TYPE::hook()` in enable (or use non-`AUTO` hooks and manage them manually). If you do not plan to support hot reload, you can omit this code. All hooks are also removed automatically when the game exits.

*Applies to: LeviLamina 0.13 and later*

## How do I hook game (BDS) functions in LeviLamina? Is there a tutorial?

Use the hook macros in `ll/api/memory/Hook.h`: `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK` (instance functions), `LL_TYPE_STATIC_HOOK` / `LL_AUTO_STATIC_HOOK` (static functions), and so on, along with their `_EX` variants. Macros with `AUTO` register automatically; those without it must be registered manually by calling `XXXHook::hook()` (and `unhook()` on unload). See the official tutorial at <https://levimc.org/LeviLamina/developer_guides/how_to_guides/hook_guide/> (old `lamina.levimc.org` links redirect). For examples, check the source code of official mods such as LegacyScriptEngine.

*Applies to: LeviLamina current version*

## What information do I need to write a LeviLamina hook? Where do I find the BDS function declarations/symbols to hook?

A hook needs a hook name (`DEF_TYPE`), a priority, the owning type (`TYPE`), the target function identifier (`IDENTIFIER`, usually a member function pointer such as `&ScreenView::render` or a symbol string), the return type, and the parameter list.

BDS class and function declarations are in the decompiled headers shipped with the LeviLamina repository: the server/common code is in `src/mc`, and the client-only code is in `src-client/mc` (<https://github.com/LiteLDev/LeviLamina/tree/main/src/mc>). Functions marked `MCNAPI` in the headers are currently unavailable (not exported) and cannot be referenced directly; request them at <https://github.com/LiteLDev/mcapi-requests> if you need them.

See also the official "Find Function" guide: <https://levimc.org/LeviLamina/developer_guides/how_to_guides/find_function_guide/>.

*Applies to: LeviLamina current version*

## Many class constructors in LeviLamina headers are declared but not implemented (compiling a mod reports a missing constructor symbol or says it is unavailable). How do I construct such a class in a mod? Can I fill the vtable with `nullptr`?

Constructors marked `// prevent constructor by default` in the headers are declared without an implementation to prevent accidental construction. Because the original constructor is often inlined, there is no way to tell whether it contains special logic, so it is disabled by default. If there is no constructor symbol at all, the compiler may also have optimized it out.

To construct such a class, you must inspect it manually and write the implementation yourself: either implement the constructor in your mod code, or copy the class declaration and define and implement the construction logic yourself. If you define the class yourself, implement its virtual functions as well; do not fill the vtable with `nullptr`, or the game will crash when other mods hook or directly call those virtual functions.

At Mojang's request, LeviLamina also uses an API whitelist. To request missing symbols (including constructors), open an issue at <https://github.com/LiteLDev/mcapi-requests>, and the maintainers will add them in a later version (the LL CHANGELOG often contains entries like "Added constructor for ...").

*Applies to: LeviLamina 26.60.x*

## LeviLamina does not provide some higher-level APIs (such as intercepting vanilla network packets or changing block rendering), and the event system has no network packet events. How can a native mod do this?

LeviLamina provides few high-level APIs, so when a feature is missing you need to hook the game functions yourself. The mc directories in the LeviLamina source (`src/mc`, `src-server/mc`, `src-client/mc`) contain MC's headers. Find the relevant classes and functions there, and hook them using LL's hook macros (such as `LL_TYPE_INSTANCE_HOOK` or `LL_AUTO_TYPE_INSTANCE_HOOK`).

To intercept vanilla packets received by the server, hook the `handle(NetworkIdentifier const&, XxxPacket const&)` overload for the corresponding packet type in `ServerNetworkHandler`. On the client side, packets are handled in `ClientNetworkHandler` / `LegacyClientNetworkHandler` (`src-client`). For rendering changes (such as connected textures), refer to the rendering logic of other open-source mods: hook at render time and replace the material.

*Applies to: LeviLamina current version (hook targets change with the BDS version; check the headers yourself)*

## In a C++ mod I used a hook macro with `AUTO` (such as `LL_AUTO_TYPE_INSTANCE_HOOK`) and then also called `hook()` manually. The callback runs twice and errors occur. Why?

A hook macro with `AUTO` generates an inline static `HookRegistrar` object that calls `hook()` once automatically when the DLL loads. Calling `Hook::hook()` manually as well hooks the function a second time, so the callback runs twice. Do not call `hook()` yourself when using an `AUTO` macro. If you need to control when the hook is installed, use a non-`AUTO` macro (such as `LL_TYPE_INSTANCE_HOOK`) and call `hook()`/`unhook()` manually, or manage your hooks with `ll::memory::HookRegistrar<Hook1, Hook2...>` (which is reference-counted and never hooks twice).

*Applies to: LeviLamina 1.x and later*

## In C++ mod development, how do I get the block a hopper points at when I only have the `HopperBlockActor` (I need a `BlockSource`)? For example, to build a hopper item counter.

You can use the same approach as for trapdoors: hook `tick(BlockSource& region)` on `HopperBlockActor`, take the `BlockSource` from the parameter, and save it temporarily. Because a hopper calls `setItem(int slot, ItemStack const& item)` during its tick, the call order guarantees that the `BlockSource` saved in the tick hook belongs to the hopper currently running `setItem`. From there, take `BlockActor::getPosition()` and add the hopper block's facing direction (from its block state) to get the position of the block it points at.

*Applies to: LeviLamina (depends on BDS's internal call order). Not confirmed against the source code or the documentation: treat it as a pointer.*

## In a LeviLamina C++ mod, a hook copied from the LL source (such as `LL_TYPE_INSTANCE_HOOK`) compiles but has no effect. Why? What is the difference between `AUTO` and non-`AUTO` hooks, and can they be unloaded?

The first macro parameter, `DEF_TYPE`, is the name of the generated struct. It must not collide with a built-in LeviLamina hook or another hook in the same namespace—if it does, rename it.

An `AUTO` macro (such as `LL_AUTO_TYPE_INSTANCE_HOOK`) calls `hook()` automatically on load to register the hook. A non-`AUTO` macro (such as `LL_TYPE_INSTANCE_HOOK`) does nothing until you call `DEF_TYPE::hook()` yourself. Either kind can be unloaded by calling `DEF_TYPE::unhook()` (all hooks are also unloaded automatically when Minecraft unloads). Omitting the call to `origin(...)` inside the hook body suppresses the original function (if the return type is not `void`, return a suitable value). See `src/ll/api/memory/Hook.h` and the official hook guide.

## I hooked a member function with `STATIC_HOOK` and got an error or crash in the log or at the call site. Which hook macro should I use?

Because a member function has a `this` pointer, use the `INSTANCE_HOOK` family (such as `LL_TYPE_INSTANCE_HOOK` / `LL_AUTO_TYPE_INSTANCE_HOOK`) instead of `STATIC_HOOK`. The `STATIC_HOOK` family is only for static or free functions. See the hook guide on the official LeviLamina documentation site (developer guide `how_to_guides/hook_guide`).

*Applies to: all versions*

## When writing a LeviLamina hook, what is the difference between a target function name with and without the `$` prefix?

A `$` prefix marks the implementation of a virtual function (such as `&Player::$attack`), and you must use the `$`-prefixed name when hooking a virtual function. For a non-virtual function, use the plain name (`&ClassName::method`). For example: `LL_TYPE_INSTANCE_HOOK(..., ServerNetworkHandler, &ServerNetworkHandler::$handle, ...)`.

*Applies to: all versions*

## Does LeviLamina support finding and hooking functions by signature? What other features are often overlooked in development?

Yes. `ll/api/memory/Signature.h` provides `SignatureView` and the `"..."_sig` / `"..."_sigp` literals (`SignatureView::resolve()` resolves the address). The function identifier in a hook macro (such as `LL_AUTO_TYPE_INSTANCE_HOOK`) can be a symbol, a member function pointer, or a `SignatureView` signature passed directly.

Other often-overlooked features include:

- `virtualCall` in `ll/api/memory/Memory.h` (calls a virtual function by vtable index)
- `ll/api/reflection` (reflection, which can serialize a struct directly into a config)
- `ll/api/Config.h` (`ll::config::loadConfig` / `saveConfig` read and write JSON configs through reflection, so you don't need to parse anything yourself)

These features have little documentation; read the source directly.

*Applies to: LeviLamina 1.x and later*

## LeviLamina hooks have priorities. If a high-priority hook returns directly without calling `origin`, are lower-priority hooks still triggered?

No. Multiple hooks on the same function form a call chain ordered by `HookPriority`. Higher-priority hooks run first (`Highest`=0 ... `Lowest`=400), and each hook advances to the next (lower-priority) hook only by calling `origin(...)`, until the original function is reached. If a high-priority hook returns without calling `origin`, the chain stops there, and neither the lower-priority hooks nor the original function run.

*Applies to: all versions*

## Why does a LeviLamina hook macro (such as `LL_AUTO_TYPE_INSTANCE_HOOK`) written inside a function produce an error (a red squiggle after the parenthesis)?

A hook macro expands to a struct (type) definition with `inline static` members, template specializations, and similar constructs, so it must be placed at namespace or global scope, not inside a function body. Define the macro outside the function. If you need manual registration, use the non-AUTO version (`LL_TYPE_INSTANCE_HOOK`) with `Hook::hook()` / `unhook()` or `ll::memory::HookRegistrar`.

*Applies to: all versions*

## When implementing fast leaf decay in a LeviLamina mod, hooking or calling the `randomTick` virtual function of `Block` has no effect on leaves. Why?

Leaf random ticks do not use the `randomTick` virtual function on `BlockType`. Instead, `LeavesBlock` defines its own non-virtual member function `randomTick(BlockEvents::BlockRandomTickEvent&)` (in newer versions, random ticks are event-based and the decay logic has been split out). Use `static_cast` to cast the `BlockType` to `LeavesBlock`, then call or hook this non-virtual `LeavesBlock::randomTick`.

*Applies to: LeviLamina current version*

## In LeviLamina, I hook a class constructor and write the return type as `void`, then get errors or a crash at runtime. How should a constructor hook be written?

A constructor hook must target the thunk function `&Type::$ctor` in the header. The return type must be a pointer (matching the `$ctor` declaration, currently `void*`), and you must return the result of the original function because the address of the constructed object is passed through the return value. Using `void` corrupts the return value and causes a crash. Example:

```cpp
LL_AUTO_TYPE_INSTANCE_HOOK(DedicatedServerCtorHook, ll::memory::HookPriority::Normal,
    DedicatedServer, &DedicatedServer::$ctor, void*) {
    return origin();
}
```

*Applies to: LeviLamina current version*

## In LeviLamina's hook macros (such as `LL_TYPE_INSTANCE_HOOK`), why does the `TYPE` parameter sometimes need a global-namespace qualifier (written as `::ClassName`)?

`TYPE` specifies the type that owns the hooked function. After macro expansion, it is used for `TYPE::*` member pointers, inheritance, and similar constructs. Writing it as `::ClassName` (with global-namespace qualification) prevents a name clash with a identically named type in the current namespace—for example, when your mod's namespace also defines a class with that name. You can usually omit `::` and add it only when you hit a name conflict or resolution error. To see the exact expansion, inspect the generated code from the hook macro (`src/ll/api/memory/Hook.h`). Example: <https://github.com/engsr6982/CustomWorldGenerator/blob/main/src/Hooks/structure.cpp>

*Applies to: LeviLamina current version*

## While developing an MCBE Windows client mod, I hooked `WeatherManagerProxy::$getRainLevel`, `LevelRendererCamera::calcRainState` and similar functions and wrote to `WeatherRenderObject.mDensityRain`, but I don't see any weather change. How do I show weather only locally on the client?

Hook `Weather::$levelEvent`, check whether the current world is a local world, and then decide whether to run the original logic. For example:

```cpp
if (auto client = ll::service::getClientInstance()) {
  if (auto info = client->getGameConnectionInfo(); info && info->mType == Social::ConnectionType::Local) {
    return origin(type, pos, data);
  }
}
```

Note: in the latest headers, `Weather::$levelEvent` is marked `MCNAPI` (no exported symbol), so you must locate it with a signature before hooking it.

*Applies to: LeviLamina client (src-client) mod. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What can I do when several LeviLamina client mods (such as replay, minimap and BetterRenderDragon) hook the same function and conflict?

Hooks installed through LeviLamina's hook macros (which call the original function through `origin`) can generally coexist on the same function. If a mod uses signature scanning or patches bytes directly, it may conflict because another hook has already modified the start of the function. To work around this, adjust the load order in the mod's `manifest.json` using `dependencies`, `optionalDependencies`, or `loadBefore` so that a specific mod loads first. You can also control the execution order of multiple hooks on the same function with `HookPriority`.

*Applies to: LeviLamina current version*

## How do I detect the title when a player signs a book in a LeviLamina plugin (for example, to run logic when the title has a specific value)?

When the client finishes editing or signing a book, it sends a `BookEditPacket` to the server. Hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, BookEditPacket const&)`. In the latest version, `BookEditPacket` inherits from `ll::PayloadPacket<BookEditPacketPayload>`, and the payload's `mOperation` is a `std::variant` (`ReplacePage`/`AddPage`/`DeletePage`/`SwapPages`/`Finalize`). Signing corresponds to `BookEditAction::Finalize`, where `mTitle`, `mAuthor`, and `mXuid` hold the book title, author name, and XUID. Relevant headers: `src/mc/network/packet/BookEditPacketPayload.h` and `src/mc/network/packet/book_edit_action/Finalize.h`.

*Applies to: LeviLamina 26.60.x*

## How do I stop players from building an iron golem with a pumpkin head?

Hook `BlockPatternMatcher::match(::BlockPos const& pos) const` and check whether `this->mData` (`BlockPatternData const&`, which contains `mPattern`) is the iron golem build pattern. If it is, set `mMatched` on the returned `BuildMatch` to `false`. In the latest headers, this function is marked `MCNAPI`, so you must locate it with a signature.

*Applies to: LeviLamina current version*

## When developing a LeviLamina mod, the function I need has been inlined or is `MCFOLD` (merged identical functions). How do I call or hook it?

For an inlined function, you need a lower-level way to get the same result. Getters such as `getXxx` are often inlined; some become direct member accesses, while others must be obtained through other methods. `MCFOLD` means the compiler applied identical code folding (Identical COMDAT Folding) to the function, so several functions share one implementation. When you hook it, you must check inside the hook where the call comes from. The recommended approach is to inspect the vtable pointer of `this` and run your logic only after confirming it belongs to the target class. To see what calls the function, analyze the binary in IDA.

*Applies to: LeviLamina current version*

## I want to hook Bedrock's log output function to intercept game logs, but the function I hooked outputs a lot of garbage. Which function should I hook?

You hooked the wrong function—most likely a formatting function such as `Util::format`/`formatWide`, which has a huge number of callers. Instead, hook `BedrockLogOut`, as LeviLamina does (declared in `mc/common/Globals.h` as `void BedrockLogOut(uint const _priority, char const* pszFormat, ...)`). See `BedrockLogOutHook` in the LeviLamina source at `src/ll/core/tweak/ModifyInfomation.cpp` (`LL_STATIC_HOOK(BedrockLogOutHook, HookPriority::Normal, BedrockLogOut, void, uint priority, char const* pszFormat, ...)`).

## Which function should I hook in a LeviLamina mod to stop pistons or moving blocks from pushing spectator-mode players? Why does a moving block still push the player after I block it on the server?

All server-side piston logic for pushing entities goes through `PistonBlockActor::moveEntityLastProgress` (`PistonBlockActor::_moveCollidedEntities` and `_moveCollidedEntitiesHelper` take the same path), so you can intercept it there. However, the client also decides on its own whether a moving block pushes an entity: even if you intercept the extra `MoveDeltaActor` packets and stop the server-side piston from pushing, the moving block can still push the player on the client. A complete fix must change what you send to the client (for example, by special-casing spectators and using something like a direct `setBlock` instead).

*Applies to: current LeviLamina version*

## I want to listen for or intercept player emotes with LeviLamina. I hooked the virtual function `playEmote` of `Player`, but it is called in a loop from server startup. Where should I hook?

Do not hook `Player::playEmote`. On the server, that virtual function slot is only a placeholder and does not handle emotes. Instead, hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, EmotePacket const&)`, and retrieve the player inside the hook with `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)` (the same approach used in LeviLamina's `PlayerChatEvent` implementation). To block the emote, return directly without calling `origin`. Since the server handles this packet mainly by forwarding it to other players, intercepting it means only the sender sees the emote locally.

*Applies to: current LeviLamina version*

## In the new BDS, the functions I used to hook in classes like `ScriptActorEventListener` can't be found. Where should I look?

Every few versions, Mojang moves functions from `Script****EventListener` into the corresponding `Script****GlobalEventListener`. For example, functions from `ScriptActorEventListener` were moved to `ScriptActorGlobalEventListener`. When you cannot find a function, check the corresponding `Global` class in `mc/scripting/modules/minecraft/events/`.

*Applies to: BDS 26.40 and later (LeviLamina 26.x)*

## In the new BDS (compiled with clang), `PortalBlock::trySpawnPigZombie`, the function that spawns piglins from portals, has been inlined. How can a mod intercept or modify this logic?

You can still hook `SpawnChecks::canSpawnPigZombieFromPortal` (`MCAPI`), though it does not receive the position; to get the position, also hook `PortalShape::evaluate`. As the maintainers suggest, call `origin` first in the hook and then run your own logic (do not `return` early), because the original logic runs immediately after this function. When a function is inlined, you generally need to hook two functions together to achieve the same result.

*Applies to: BDS 26.20+ (LeviLamina 26.x)*

## I can't find `LevelChunk::tick` in the headers of the new BDS. What should I use to hook the chunk tick?

This function was renamed to `LevelChunk::tickImpl(BlockSource& tickRegion, Tick const& tick, std::function<void()> spawnerCallback)` and now takes an additional spawning-related callback parameter. Hook `tickImpl` instead and update your parameters to match the new signature. If a function is inlined or renamed, you can also hook a caller higher up the call chain.

*Applies to: BDS 1.21.6x and later (current LeviLamina 26.x headers)*

## When I submit a PR to LeviLamina that restores an inlined function (implemented as LLAPI), what should I do if the function exists only on the server, not on the client (or the symbols differ between the two)?

The client and server do not share the exact same set of functions. Wrap a server-only restored implementation in a platform macro, such as `#ifdef LL_PLAT_S ... #endif` (or `LL_PLAT_C` for the client), so that it compiles only for the target platform. Place hand-written declarations outside the auto-generated blocks and mark them with `LLAPI`/`LLNDAPI`; place the definitions in the `.cpp` file in the same directory. Once you confirm the restored function works, delete the corresponding `MCAPI` declaration. Push further changes directly to the original PR branch—there is no need to close and reopen the PR.

*Applies to: LeviLamina current version (dual-platform builds)*

## Can I cancel only the critical-hit check of an attack (leaving the rest of the logic unchanged), for example to replace the vanilla critical hit with a purely random crit rate?

The LSE attack event can only intercept the entire attack, not the critical hit alone (though you can intercept the attack, calculate damage reduction yourself, and apply the damage with `hurt`). In C++, you can hook `Player::attack(Actor&, ActorDamageCause const&, Player::AttackParameters const&)` and set `mCanCrit` in `parameters` to `false` to prevent vanilla critical hits, then implement your own crit rate (you can also use the interface that `iListenAttentively` exports to LSE).

*Applies to: LeviLamina current version*
