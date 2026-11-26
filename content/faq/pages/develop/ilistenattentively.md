# iListenAttentively

## What is iListenAttentively-LseExport (ila-lseexport)? Is it an extension of iListenAttentively? What does it provide and which versions does it support?

iListenAttentively-LseExport (<https://github.com/MiracleForest/iListenAttentively-LseExport>) is a mod that exports LeviLamina's event system to LSE (LegacyScriptEngine) script plugins. It is not limited to iListenAttentively: LSE plugins can listen to any event registered on the LeviLamina event bus—including LeviLamina's own events, iListenAttentively events, and custom events from other mods—and can intercept or modify event parameters (such as the packet send event) as long as the event implements serialization and deserialization. This saves LSE plugins from having to write their own hooks.

Beyond events, it also provides:

- NativeAPI-style features (`getAddressFromSymbol` / `getAddressFromSignature` for resolving addresses, `hook` / `unhook` for native functions, memory read and write, and more, replacing the NativeAPI that LSE removed)
- A convenient Proxy-based NBT wrapper
- `registerEvent` / `publish` for custom events
- Query interfaces such as `getAllEvent`

Its only hard dependencies are LeviLamina and LegacyRemoteCall; it does not require iListenAttentively. The latest release, v0.5.0 (2026-09-09), bundles binaries for multiple versions, with built-in support for LeviLamina 1.0.0-rc.1, 1.2.0-rc.1, 1.9.7, 26.10.5, 26.20.0, and 26.32.0. At runtime, it selects the closest version that does not exceed the current LeviLamina version. There is almost no documentation; refer to the repository README and the `lib/iListenAttentively.d.ts` type declarations.

*Applies to: iListenAttentively-LseExport v0.5.0 (LeviLamina 1.0.0-rc.1 onward; officially adapted up to 26.20.x/26.30.x; newer LeviLamina 26.60.x falls back to the 26.32.0 adaptation, so you must test compatibility yourself)*

## Can LSE script plugins use the events provided by iListenAttentively (ila), such as a player closing a container, redstone updates or blocks being burned, which LSE does not have natively? What do I need, how do I write the event name, can I get the parameters, and is there documentation?

Yes. Install iListenAttentively (`lip install github.com/LiteLDev/iListenAttentively`) and iListenAttentively-LseExport (<https://github.com/MiracleForest/iListenAttentively-LseExport/releases>), declare a dependency on `iListenAttentively-LseExport` in your plugin's manifest, and then write:

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("event name", event => { ... }, optionalPriority);
```

Key points:

1. LseExport itself depends only on LeviLamina and LegacyRemoteCall (its manifest declares only LegacyRemoteCall, and its `tooth.json` does not include iListenAttentively either). Because it does not depend on iListenAttentively, make sure iListenAttentively itself is installed (in the current version, LSE itself depends on iListenAttentively, so installing LSE with lip installs it automatically).
2. Whether you can read or modify event parameters depends on whether the mod providing the event implements `serialize`/`deserialize`. Events from LeviLamina and iListenAttentively implement both, so you can read and modify their parameters (modified fields are written back) and intercept `Cancellable` events by setting `cancelled`. Events that do not implement them can only be listened to and intercepted. You can also set the listener priority.
3. The event name is the C++ type name (a LeviLamina event ID is derived from the type name with inline namespaces removed), such as `ila::mc::ExplosionBeforeEvent` or `ll::event::PlayerJoinEvent`. If you are unsure of the name, call `iListenAttentively.getAllEvent()` to list all registered event names.
4. There is no dedicated documentation. Refer to the `lib/iListenAttentively.d.ts` type declarations and the iListenAttentively source headers (<https://github.com/LiteLDev/iListenAttentively>).

LseExport also provides functions for resolving addresses, hooking, and more, replacing the NativeAPI that LSE removed.

*Applies to: iListenAttentively 0.14.0 and later; iListenAttentively-LseExport v0.5.0*

## In LSE, modifying the `damage` parameter in `onMobHurt` to reduce TNT damage has no effect, and `source.id === "tnt"` never matches. What is the correct approach?

1. LSE's `onMobHurt` callback can only intercept the event via `return false`; modifying its callback parameters has no effect. To change parameters such as damage, you must use an iListenAttentively (ila) event.
2. To check the entity type, use `entity.type` (the namespaced ID, such as `"minecraft:tnt"`). `entity.id` is the numeric entity type enum.
3. Install iListenAttentively (<https://github.com/LiteLDev/iListenAttentively>) and iListenAttentively-LseExport (<https://github.com/MiracleForest/iListenAttentively-LseExport>), declare a dependency on `iListenAttentively-LseExport` in the plugin manifest, and then write:

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("ila::mc::ExplosionBeforeEvent", event => {
  if (mc.getEntity(event.sourceId)?.type == "minecraft:tnt") {
    event.damageScaling = event.damageScaling * 0.25;
  }
});
```

`mc.getEntity` takes the numeric type ID. Because ila has no documentation, check `serialize` in `ExplosionEvent.cpp` in the ila source to see the available fields, or open the `.d.ts` declaration files under `lib` in VSCode for autocompletion.

*Applies to: iListenAttentively 0.14.0 and later (with iListenAttentively-LseExport); current LSE version*

## How do I stop "XXX joined the game" from showing when a simulated player is created in LSE?

The native LSE API cannot do this. Instead, intercept the join message `TextPacket` that the server sends. Make your plugin depend on iListenAttentively and iListenAttentively-LseExport, and use ila's interceptable packet-send event (`SendPacketBeforeEvent`) to check and intercept the matching `TextPacket` before it is sent.

Besides the generic packet-send event, ila also publishes events for each packet type, named like `ila::mc::SendPacketBeforeEvent<class TextPacket>`, so you can listen for `TextPacket` only. Confirm the exact event name with `iListenAttentively.getAllEvent()`.

On the script side, this event exposes the packet only as a native object pointer. To inspect the packet content and check whether it is the join message for a given player, use the memory and native-call interfaces of LseExport.

*Applies to: LeviLamina + iListenAttentively + iListenAttentively-LseExport; the old LiteLoaderBDS approach no longer applies. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Which event corresponds to a player editing a sign in LSE? Can `onBlockInteracted` be used?

`onBlockInteracted` is a block interaction event, not a sign editing event, and LSE currently has no dedicated sign editing event. iListenAttentively provides `PlayerEditSignBeforeEvent` / `PlayerEditSignAfterEvent` (`ila::mc::PlayerEditSignBeforeEvent` in C++; the Before event can be intercepted, `pos` and `text` can be read and modified, and `side` indicates the front or back face). The source is at <https://github.com/LiteLDev/iListenAttentively/blob/main/src/ila/event/world/actor/player/PlayerEditSignEvent.cpp>. LSE scripts can use it through iListenAttentively-LseExport. PRs to LSE adding events for new game content are also welcome.

*Applies to: iListenAttentively 0.14.0 and later (LiteLDev repository); current LSE version*

## How do I intercept an Enderman picking up a block in an LSE plugin? How does a C++ mod use the iListenAttentively (ila) event library?

LSE: use the native `onEndermanTakeBlock` event (callback `function(entity, block, pos)`, return `false` to intercept). It has been available since LSE 0.11.3, and in the current version it is implemented internally on top of ila's `MobTakeBlockBeforeEvent`.

C++ mod: use iListenAttentively's `ila::mc::MobTakeBlockBeforeEvent` (interceptable). In `xmake.lua`:

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*")
```

Then call `add_packages("ilistenattentively")` in the target, and register a listener with `ll::event::EventBus::getInstance().emplaceListener<ila::mc::MobTakeBlockBeforeEvent>(...)`. The server must have iListenAttentively installed (`lip install github.com/LiteLDev/iListenAttentively`); choose the ila version that matches your LeviLamina version.

*Applies to: LSE 0.11.3 and later (`onEndermanTakeBlock`); iListenAttentively 0.14.0 and later, currently 0.18.0 (LeviLamina 26.60.\*)*

## When an LSE plugin intercepts chest breaking with `onDestroyBlock`, a double chest is split in half, and chest merging cannot be intercepted on placement either. Is there a matching event?

iListenAttentively provides the chest merge events `ChestPairWithBeforeEvent` / `ChestPairWithAfterEvent` (`ila::mc::ChestPairWithBeforeEvent` in C++; the intermediate `world`/`level`/`block`/`actor` namespaces are inline and can be omitted). You can intercept chest merging in the Before event. In LSE, listen for it through iListenAttentively-LseExport; if you are unsure of the event name, call `iListenAttentively.getAllEvent()` first to check the exact name.

*Applies to: iListenAttentively 0.14.0 and later (LiteLDev repository)*

## LSE cannot directly intercept the entity death event. How do I prevent an entity from dying?

LSE's `onMobDie` cannot be intercepted. Instead, use iListenAttentively's health change event `MobHealthChangeBeforeEvent` (`ila::mc::MobHealthChangeBeforeEvent`, used in scripts with iListenAttentively-LseExport): when `newValue` is less than or equal to 0, either set `cancelled` to intercept the event or change `newValue` to a positive number such as 0.1 (the event implements deserialization, so the modified value is written back).

*Applies to: iListenAttentively 0.14.0 and later (with iListenAttentively-LseExport)*

## Can an LSE (LegacyScriptEngine) plugin listen to the packets a player sends?

LSE itself has no packet-listening interface, but you can depend on iListenAttentively (ila) and iListenAttentively-LseExport. ila provides packet receive and send events (`ila::mc::ReceivePacketBeforeEvent` / `ReceivePacketAfterEvent`, `SendPacketBeforeEvent` / `SendPacketAfterEvent`, and so on; many ila events are themselves built on top of packets), and LseExport exports them to LSE.

ila also publishes events for each packet type (with names of the form `ila::mc::ReceivePacketBeforeEvent<class TextPacket>`), so you can listen for a single packet type. Call `iListenAttentively.getAllEvent()` to check the exact event name. Note that the packet passed to the script is a native object pointer.

ila has no separate documentation; the header files serve as the documentation. Repository: <https://github.com/LiteLDev/iListenAttentively> (versions earlier than 0.14.0 are at <https://github.com/MiracleForest/iListenAttentively-Release/releases>).

*Applies to: iListenAttentively 0.14.0 and later (with iListenAttentively-LseExport)*

## How does a LeviLamina C++ mod listen to the player item drop event? It is not in the LeviLamina API or source. Do I need to hook it myself?

LeviLamina does not provide this event, and you do not need to hook it yourself. Instead, use `ila::mc::PlayerDropItemBeforeEvent` (which can be intercepted) or `PlayerDropItemAfterEvent` from iListenAttentively (ila, the official LiteLDev event extension library: <https://github.com/LiteLDev/iListenAttentively>). In xmake, once you have added levimc-repo, simply add `add_requires("ilistenattentively")` (its version tracks LeviLamina and is currently `0.18.*`).

*Applies to: iListenAttentively 0.14.0 and later; current 0.18.0 matches LeviLamina 26.60.\**

## In the iListenAttentively JS wrapper, can I assign NBT values directly with `nbt[key] = value` instead of methods like `nbt.setString`? Which NBT type does a number become?

Yes. The iListenAttentively-LseExport JS wrapper (`lib/iListenAttentively.js`) wraps NBT in a Proxy, so you can write `nbt[key] = "string"` directly and it will be converted automatically. You can also assign an object (converted to `NbtCompound`) or an array (converted to `NbtList`), and index into a list with `nbt[numeric index]`.

Type conversion rules: an integer becomes Int, a number with a fractional part becomes Float, a boolean becomes Byte, a bigint becomes Long, and a string becomes String. For other types such as Short or Double, construct the value explicitly with the corresponding NBT class (since a JS number cannot distinguish between byte, short, and int).

*Applies to: iListenAttentively-LseExport current version (v0.5.0)*

## When listening to events through iListenAttentively (ILA) in LSE JS, printing `event` directly shows only `NbtClass`. How do I see which fields (NBT content) an event contains?

The `event` passed to the callback is an NBT object (`NbtCompound`, wrapped in a Proxy by the iListenAttentively-LseExport library). Call `toSNBT()` on it to serialize its contents to an SNBT string and print that instead, for example `logger.info(event.toSNBT())`.

*Applies to: all current versions (listening to ILA/LL events in LSE through iListenAttentively-LseExport)*

## When listening to events in LSE with iListenAttentively-LseExport, the event name in the `.d.ts` type declarations is just `string`. Where do I find the list of event names I can listen to?

The event name is typed as `string` because you can listen by name to any event that any native (C++) mod registers on the LeviLamina EventBus, so they cannot all be listed in the type definitions. In a script, call `iListenAttentively.getAllEvent()` to list all currently registered events (including `modName` and `eventName`), and use `getAllEventAlias()` / `getEventAlias()` / `getEventName()` to query aliases.

LseExport now generates aliases automatically at startup: ILA events can use the short form `ila::mc::<event class name>` (or include part of the namespace), and built-in LL events can use `ll::event::<event class name>`, such as `"ll::event::PlayerJoinEvent"`. The `lib/events` directory also includes `.d.ts` files for events from LeviLamina, LeviAntiCheat, and others.

LseExport itself depends only on LeviLamina and LegacyRemoteCall; it does not require ILA unless you want to use ILA events, in which case you must install ILA as well.

*Applies to: iListenAttentively-LseExport 0.5.0 and later*

## When listening to iListenAttentively (ILA) events in an LSE JS plugin, `return false` in the callback has no effect. How do I intercept an event? How do I know which events can be intercepted?

Returning `false` from the callback does not intercept ILA events. The `event` passed to the callback is an NBT object. A cancellable event has a `cancelled` field, and setting it to `true` intercepts the event: `event["cancelled"] = true;` (no `return` is needed).

Only events that inherit `Cancellable` on the C++ side (usually `xxxBeforeEvent`) can be intercepted. Setting it on an After event or on an event that does not support cancellation has no effect. To check whether an event is cancellable, look at its header in the ILA source to see if it inherits `ll::event::Cancellable`, or print `event.toSNBT()` to see if it has a `cancelled` field.

*Applies to: current version (using ILA events through iListenAttentively-LseExport)*

## Is there an event for blocks being burned by fire? Does iListenAttentively support it?

iListenAttentively provides the `FireTryBurnBlock` events: `FireTryBurnBlockBeforeEvent` (cancellable; cancelling it stops the fire from burning at that position) and `FireTryBurnBlockAfterEvent`, each with a `pos` field. Note that this event hooks `FireBlock::isValidFireLocation` and fires when the fire "tries to burn", so the block has not actually been burned yet when the event is received. You can use it instead of listening to `onBlockChanged`. In LSE, listen through LseExport with the alias `ila::mc::FireTryBurnBlockBeforeEvent`.

*Applies to: iListenAttentively current version (0.18.0)*

## How can other plugins (such as LSE plugins or a bot relay) read player death messages, including death messages modified by other plugins?

Use the death message events from iListenAttentively: `DeathMessageBeforeEvent` (cancellable, and `result` can be modified) and `DeathMessageAfterEvent`. The event NBT contains `sourceUniqueId`, `cause`, and `result{key, params}` (the translation key and parameters of the death message). If another plugin modifies only the returned death message without changing the vanilla death event, listen to the After event to read the final message. In LSE, listen through iListenAttentively-LseExport with the alias `ila::mc::DeathMessageAfterEvent`.

*Applies to: iListenAttentively current version (0.18.0)*

## An LSE script plugin that depends on iListenAttentively events (such as ShoppingMall or iLand) does not work after installation. What should I do?

For an LSE script plugin to use iListenAttentively events, you must install both iListenAttentively and its LSE export module, iListenAttentively-LseExport. Download LseExport from <https://github.com/MiracleForest/iListenAttentively-LseExport/releases> (use a mirror if you cannot reach GitHub) and extract it to `plugins/iListenAttentively-LseExport/`. It depends on LeviLamina and LegacyRemoteCall.

Make sure iListenAttentively matches your LeviLamina version (the current ILA 0.18.0 matches LeviLamina 26.60.*). You can install it with `lip install github.com/LiteLDev/iListenAttentively`. Since 0.21.2, LSE itself depends on ILA, but scripts that use ILA events directly still require LseExport.

## How do I add the iListenAttentively (ILA) event library as a dependency in a LeviLamina C++ mod (xmake project)?

The ILA package is included in LiteLDev's xmake-repo (the levimc-repo added by default in the template). In `xmake.lua`:

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*", {configs = {target_type = get_config("target_type")}})
```

Then add `add_packages("ilistenattentively")` to your target. The version must match your LeviLamina version (ILA `0.18.*` matches LeviLamina 26.60.*). Finally, run `xmake project -y -k compile_commands` to generate code completion data.

Also declare `{"name": "iListenAttentively"}` in `dependencies` in the mod's `manifest.json` to ensure the correct load order.

*Applies to: iListenAttentively 0.14.0 and later, current 0.18.0 / LeviLamina 26.60.\**

## The iListenAttentively LSE export plugin (iListenAttentively-LseExport) has not been updated for a long time. Can it still be used?

Yes. LseExport does not need to be updated for every LeviLamina release: it bundles internal binaries compiled for several LeviLamina versions, automatically selects and loads the best match for the current loader version at startup, and exports events dynamically by name through the EventBus. The latest version is v0.5.0 (the repository is still maintained, with commits in 2026-11).

*Applies to: iListenAttentively-LseExport 0.5.0 and later*

## Why does iListenAttentively (ILA) have no player permission change event (`PlayerChangePermissions`)? Can it be added back?

ILA removed the `PlayerChangePermissions` (player permission change) event in 0.3.0 (adapted for LeviLamina 1.1.0-rc.1 / BDS 1.21.60). BDS 1.21.60 inlined the underlying function, turning the former function call into a direct assignment with no function left to hook. As a result, the event cannot be added back, and the latest ILA still lacks it. In general, any BDS update may inline functions, forcing the removal of the events or APIs that depend on them.

If you only need to listen for changes to a player's command permission level (`CommandPermissionLevel`), use LeviLamina's built-in `ll::event::PlayerChangePermEvent` instead (it hooks `Player::setCommandPermissions`, is cancellable, and provides `newPerm()` to get the new level).

*Applies to: iListenAttentively 0.3.0 and later (including the latest 0.18.0, which still lacks this event)*
