# LeviLamina mod API: events

## How do I define and publish a custom event in a LeviLamina C++ mod so that other mods' listeners receive it? (Also: which header do I use to read and write config files?)

Define a `final` class that inherits from `ll::event::Event` (`EventBus::publish` has a `static_assert` requiring a final class), for example: `class MyCustomEvent final : public ll::event::Event { ... };`. To broadcast the event, construct the event object and publish it with `ll::event::EventBus::getInstance().publish(ev);` (or `publish(modName, ev)` to send it only to a specific mod). Other mods can subscribe using `EventBus::getInstance().emplaceListener<MyCustomEvent>(callback)` or `addListener`. If you only want to install a hook when an event is first listened to, combine it with `Emitter` from `ll/api/event/Emitter.h` to implement a lazily activated emitter. To read and write config files, use `ll::config::loadConfig` and `saveConfig` from `ll/api/Config.h`.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## Is there a LeviLamina event for a player "pre-join" (connecting to the server, before entering the world and before `PlayerJoinEvent`)?

Yes, use `PlayerConnectEvent` (`ll::event::PlayerConnectEvent`). It fires before `PlayerJoinEvent`, can be cancelled, and provides `networkIdentifier()` and `connectionRequest()`. Add `#include "ll/api/event/player/PlayerConnectEvent.h"`, then subscribe with `ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerConnectEvent>(...)`.

*Applies to: LeviLamina 0.4 and later, up to the current version (server)*

## Which class's `tick` function is the BDS main game loop? I can't find `tick()` in `GameSession`.

The world tick is on `Level`/`ServerLevel` (`Level::tick` is a virtual function, so a hook must use `$tick`). A simpler approach is to listen to LeviLamina's built-in `ll::event::ServerLevelTickEvent` (in `ll/api/event/world/ServerLevelTickEvent.h`), which the current version implements by hooking `ServerLevel::$_subTick`. You can also use LeviLamina's scheduler/`GameChrono` for per-tick timed tasks.

*Applies to: LeviLamina 26.x*

## Listening to the server started event in a C++ mod gives errors (clangd reports them too), and the docs don't say what to include. What should I do?

Include both the `EventBus` header and the event's header:

```cpp
#include "ll/api/event/EventBus.h"
#include "ll/api/event/server/ServerStartedEvent.h"
```

Then subscribe in a method such as `load` or `enable` on your main mod class with `ll::event::EventBus::getInstance().emplaceListener<ll::event::ServerStartedEvent>(...)` (save the returned listener so you can remove it in `disable`). Other event headers are in subdirectories of `ll/api/event/`, grouped by category (`server`, `player`, `entity`, `world`, `command`, and so on).

*Applies to: LeviLamina 1.x and later*

## How do I intercept (cancel) an event in a LeviLamina C++ mod?

For cancellable events (those that inherit from `ll::event::Cancellable<...>`, such as `PlayerChatEvent` and `ExecutingCommandEvent`), call `event.cancel()` (equivalent to `setCancelled(true)`) inside the listener callback. Events that cannot be cancelled do not have this method.

## In a LeviLamina C++ mod I want to listen for players running commands. The listener written like in LLSE never fires. Which event should I listen to?

You are listening to the wrong event type. For commands, listen to `ll::event::ExecutingCommandEvent` (fires before execution; call `cancel` to intercept it) or `ExecutedCommandEvent` (fires after execution). Both are defined in `ll/api/event/command/ExecuteCommandEvent.h` and registered with `ll::event::EventBus::getInstance().emplaceListener<...>(...)`. See the event API and the event guide in the official documentation for details.

## How do I listen for the player fishing event in a LeviLamina C++ plugin?

LeviLamina has no built-in fishing event (there is none under `ll/api/event`). The `more-events` project mentioned earlier was never released as a LiteLDev project, and `iListenAttentively` does not provide a fishing event either. You must hook the underlying function yourself, following the approach used in LegacyScriptEngine: use `LL_TYPE_INSTANCE_HOOK` to hook `FishingHook::_pullCloser(Actor& inEntity, float inSpeed)`, get the fishing player via `this->getPlayerOwner()`, and check whether the pulled entity is an `ItemActor` to identify the caught item (this corresponds to LSE's `onPlayerPullFishingHook` event).

## When listening to two different events in a LeviLamina mod, do I need to define/get the `EventBus` twice?

No. `EventBus` is a singleton: call `emplaceListener<EventA>(...)` and `emplaceListener<EventB>(...)` on the same `ll::event::EventBus::getInstance()`, and keep the returned `ListenerPtr` values so you can pass them to `removeListener` in `disable`.

*Applies to: all versions*

## Is it a problem to destroy a `ListenerPtr` I hold without calling `removeListener` on the `EventBus` in LeviLamina?

No. `ListenerPtr` is a `std::shared_ptr<ListenerBase>` and the `EventBus` also holds an internal reference, so destroying your own `ListenerPtr` will not cause a crash or a dangling pointer. However, this does not unregister the listener—it keeps receiving events. To stop listening, call `EventBus::getInstance().removeListener(listener)`. When a mod is unloaded, the `EventBus` cleans up that mod's listeners through `removeModListeners` / `clearMod`.

*Applies to: LeviLamina 1.x and later*

## In the LeviLamina event system, if a high-priority listener cancels (`cancel`) an event, do lower-priority listeners still receive it?

No. In the early design, a cancelled event was still dispatched to subsequent listeners, and each listener had to check `isCancelled()` itself. The maintainers later changed this: once an event is `cancel()`led, the `EventBus` stops dispatching immediately, and no subsequent listener (including those after it at the same priority) receives the event. This ensures that only one listener is responsible for intercepting the event, so plugins do not have to compete for the highest priority.

*Applies to: LeviLamina 1.2 and later*

## I registered an event listener in a LeviLamina plugin but the event never fires. What could be the cause? Are event hooks installed automatically?

Check the following:

1. Registration timing: on the server, `ModRegistrar::enableAllMods()` runs the mod enable phase for all mods when the server thread starts (`ServerScriptManager::onServerThreadStarted`). Any events that occurred before that point (such as events from earlier startup phases) will not be received.
2. Event hooks are not installed automatically: each event's Emitter is created on demand, and its corresponding hook is installed only when a listener is registered for that event (`EventBus::getInstance().emplaceListener<T>(...)` / `addListener`).
3. Sub-namespaces such as `ll::event::player` and `ll::event::world` are inline namespaces, so you can write `ll::event::PlayerJoinEvent` directly without the `ll::event::player::` prefix.
4. To troubleshoot, log a message inside the callback to confirm whether it is firing.

*Applies to: LeviLamina 1.x and later*

## What action does LeviLamina's `PlayerSwingEvent` (the swing event) refer to? Is it elytra gliding?

No, it is not gliding. "Swing" refers to the player swinging their arm: the event fires when the server receives an `AnimatePacket` from the client with the `Swing` action. Interacting with containers, left-clicking, stripping bark with an axe, and attacking all trigger an arm swing. `PlayerSwingEvent` inherits from `PlayerLeftClickEvent`.

*Applies to: all versions*

## Can LeviLamina event listeners specify a priority? For example, how can a chat translation plugin avoid conflicting with other chat plugins?

Yes. When creating a Listener, you can pass an `ll::event::EventPriority` (`Highest`/`High`/`Normal`/`Low`/`Lowest`, default `Normal`)—for example, `EventBus::getInstance().emplaceListener<PlayerChatEvent>(callback, EventPriority::High)`. Higher-priority listeners handle the event first, allowing you to process or modify a message before standard chat plugins see it. Avoid using `Highest` unless necessary to prevent compatibility issues with other plugins.

*Applies to: all versions*

## `PlayerUseItemEvent` fires as soon as the player right-clicks to use an item (for example starts eating bread), even if they do not finish. How do I fire only after the item has actually been used (eaten)?

LeviLamina's `PlayerUseItemEvent` hooks `PlayerTransactionSubject::$baseUseItem`, which fires when the player begins using an item. To handle item use completion, use the events for `Player::completeUsingItem` instead: iListenAttentively (ila) provides `PlayerAteBeforeEvent` / `PlayerAteAfterEvent` (which hook `Player::completeUsingItem`, fire only for food, potions, milk buckets, and medicine, and allow cancelling the Before event).

To cover other items, hook `Player::completeUsingItem` yourself using `LL_TYPE_INSTANCE_HOOK`.

*Applies to: LeviLamina current version; iListenAttentively*

## In a LeviLamina mod, I want to change the chat message format (for example add a prefix before the player name). Can LL's chat event do it?

LL's `PlayerChatEvent` only provides `message()` to modify the message content; it cannot change the format. The resulting `TextPacket` has the type `Chat`, whose display format is hard-coded in the client. To add text before the player name, you must use a different packet type, such as `TextPacketType::Raw`.

Possible approaches: intercept the vanilla `TextPacket` handler and send your own packet (as LSE does), hook `TextPacket`'s `write`, or intercept and modify the `TextPacket` sent to clients. If different players need to see different messages (for example, for localization), intercept the packet and send a separate packet to each player.

*Applies to: LeviLamina current version*

## When handling `PlayerDieEvent` / `ActorHurtEvent` / `MobDieEvent` in a LeviLamina mod to get the damage source entity, using `getDimension().fetchEntity()` or `Level::getDimension()` crashes the server (I get `nullptr`). How should I write it?

Entity IDs (`ActorUniqueID`) are global, so you don't need to get the dimension first. Call `Level::fetchEntity(id, false)` directly to get the damage source entity (it returns `Actor*`, which you still need to null-check).

`Level::getDimension(dimId)` returns a `WeakRef<Dimension>` that may be empty; you must call `lock()` and check the result before using it, or the server will crash. Alternatively, use `getOrCreateDimension(dimId)`, which returns the dimension as long as the dimensionId is valid. If you only need the ID of the entity's dimension, call `actor.getDimensionId()` directly.

Do not model these event handlers on LSE; refer to LeviLamina itself or to projects such as LeviOptimize.

*Applies to: LeviLamina 0.12.x and later*

## In LeviLamina, I want to implement a "player edits sign" event that tells the front from the back. What data does the client send to the server after a sign is edited, and what approaches are there?

The server opens the sign editing screen by sending `OpenSignPacket` (`SignBlockActor::requestToSendOpenSignPacket(..., bool isFrontSide)`). When the player finishes editing, the client sends the block entity data packet `BlockActorDataPacket` (carrying the sign's NBT) back to the server.

Recommended approach: hook `ServerNetworkHandler::$handle(NetworkIdentifier const&, std::shared_ptr<BlockActorDataPacket>)` (marked `MCAPI`, so it can be hooked directly), retrieve the sending player from it, and parse the NBT to determine which side changed and what its new content is.

Alternatively, you can hook `BlockActor::onUpdatePacket(CompoundTag const&, BlockSource&, Player const* fromPlayer)` or `SignBlockActor::_onUpdatePacket`. In the current headers, however, both (`onUpdatePacket` and `$_onUpdatePacket`) are marked `MCNAPI` ("This API is not available") and cannot be hooked directly by symbol; you will need to work around this yourself or open an issue on LeviLamina.

The front/back members are already filled in in the current headers: `SignBlockActor` provides `mTextFront` / `mTextBack`, `getMessage(SignTextSide side)`, and `getSideFacingPlayer(Player const&)`, and the `SignTextSide` enum defines `Front=0` / `Back=1`.

*Applies to: LeviLamina current version (26.x)*

## When developing a LeviLamina plugin, how do I replace the drops of a mined block (for example, mining dirt or tuff so that it drops cobblestone)? What if the spawned drop doesn't pop upward?

Listen for and intercept the block destroy event (`ll::event::PlayerDestroyBlockEvent`, which is cancellable; `pos()` returns the block position). Cancel the original drop, then spawn the cobblestone item at that position yourself (for example, with `Spawner::spawnItem`). For a working example, see the "bedrock drop" feature in CoralFans. If the item doesn't pop out properly because it gets stuck inside the block, spawn the item first and remove the block afterward. Also make sure you target the right block type (grass blocks and dirt are separate blocks). Because vanilla drops are handled by dedicated classes, modifying `resourceDrops` directly won't necessarily work for vanilla blocks.

*Applies to: LeviLamina current version*

## I want players to keep their potion effects after death, so I add the effect in the player respawn event. The code runs but the effect doesn't take hold. Can't effects be added at the moment of respawn?

Vanilla logic clears effects on respawn, so any effect added directly in `PlayerRespawnEvent` is overwritten. To work around this, either add the effect after a 1-tick delay, hook `Player::$respawn` yourself to call `origin` first and then add the effect, or hook the function that clears effects and prevent it from clearing them on death/respawn.

*Applies to: current LeviLamina version*

## I followed the LeviLamina documentation to write a player join event listener, but the compiler can't find the event type. What should I do?

Each LeviLamina event has its own header, so you must `#include` the header for every event you use; including `EventBus` alone is not enough. For example:

```cpp
#include "ll/api/event/player/PlayerJoinEvent.h"

ll::event::EventBus::getInstance().emplaceListener<ll::event::PlayerJoinEvent>([](ll::event::PlayerJoinEvent& ev){ /* ... */ });
```

(`player` is an inline namespace, so both `ll::event::PlayerJoinEvent` and `ll::event::player::PlayerJoinEvent` work.) Also make sure you save your source files before compiling.

*Applies to: all LeviLamina versions*

## Can I use LeviLamina's reflection (`ll::reflection`) to serialize or register all event classes automatically (for example, so that a logging plugin records every event)?

No. LL's reflection supports only aggregate types, not classes with constructors. Because event classes have constructors, they cannot be reflected directly. The `serialize(CompoundTag&)` method on events is not designed for persistent logging either. You will need to write your own template and specialize it manually for each event.

*Applies to: LeviLamina 1.x and later*
