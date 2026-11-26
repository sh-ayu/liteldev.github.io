# LeviLamina mod API: players and entities

## In a LeviLamina C++ mod, should I key per-player data and identify players by uuid, xuid or realName? Why does LegacyMoney use xuid?

Use the UUID (`Player::getUuid()` returns `mce::UUID`). When licensed-account verification (`online-mode`) is enabled, the UUID is fixed and consistent across worlds. When it is disabled, the UUID is random, but the xuid is unreliable then as well (it may be empty in offline mode). Because `mce::UUID` consists of two `uint64` values, it is faster to compare and hash than an xuid string and can be used directly as an `unordered_map` key. Do not use `realName`, as players can change it. LegacyMoney uses xuid for historical reasons (legacy compatibility), and plugins that already store data by xuid can remain unchanged when `online-mode` is on. To convert between uuid and xuid (for example, when reading the LegacyMoney database), use `fromUuid()`, `fromXuid()`, or `fromName()` in `ll::service::PlayerInfo`.

## How can a native mod implement a virtual container/custom chest GUI (such as Invsee for viewing inventories, or quickly opening shulker boxes)? Does LeviLamina have a ready-made interface?

LeviLamina does not provide a wrapper for virtual containers, so you have to implement one yourself. Common approaches include:

1. Simplest: place a real container block near the player, open it, and remove it once closed.
2. Fully packet-based: send a fake chest block with `UpdateSubChunkBlocksPacket`, update its block entity NBT with `BlockActorDataPacket`, and open the screen for the player with `ContainerOpenPacket`. You must then handle container content updates and all item requests (`ItemStackRequest`) yourself. For offline players, you must also read and write the NBT yourself.
3. Half packet-based: construct a container object on the server (`Container` is an abstract class, so use a suitable derived class) and make the server treat it as opened by the player, while sending packets to the client to fake and open the block. Vanilla logic handles item display and movement, leaving you to handle only opening and saving (this requires a deep understanding of MC's container mechanics).

The client will always see a "fake block"; this is a limitation of the vanilla client unless client mods are also installed. Alternatively, you can use the virtual container API provided by a third-party dependency mod such as GMLIB.

*Applies to: all current LeviLamina versions (server)*

## How do I get a `ServerPlayer` in a C++ mod? How do I convert `Player` to `ServerPlayer` (`dynamic_cast` is unavailable), and what if `ServerNetworkHandler::getServerPlayer` is gone?

If you only target the server, you can use `static_cast<ServerPlayer&>(player)` directly. If the mod may also run on the client (`target_type=client`), check the side first (for example, with `player.isClientSide()`) before converting.

To get a player by `NetworkIdentifier` inside `ServerNetworkHandler`, use `_getServerPlayer(source, subId)` (the `getServerPlayer` wrapper was removed in BDS 1.21.60).

When hooking virtual functions that `ServerNetworkHandler` inherits from `NetEventCallback` (such as the various `handle(NetworkIdentifier const&, XxxPacket const&)` overloads), `this` inside the hook points to the `NetEventCallback` subobject rather than the base address of `ServerNetworkHandler`. Do not calculate the offset manually; instead, use the hook's `thisFor<NetEventCallback>()` helper to get the correct `ServerNetworkHandler*`, and then call `_getServerPlayer` (LeviLamina's own `PlayerJoinEvent` and `PlayerChatEvent` do this: `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)`).

*Applies to: BDS 1.21.60 and later / current LeviLamina*

## In a C++ mod I want to change a player's health/max health, but the vanilla functions the old code called (such as `AttributeHelper::setMaxValue`) are marked `MCNAPI` in new LeviLamina and cause compile warnings/errors. What do I do?

`MCNAPI` indicates that the vanilla function has no linkable symbol in the current BDS (usually because it was inlined). LeviLamina's headers mark it as `[[deprecated("This API is not available. Open an issue if you need it.")]]`, so it cannot be called. Instead, you can:

1. Use an alternative API. To change attribute values, use LeviLamina's own `BaseAttributeMap` helper functions—such as `actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);`, `setCurrentValue(...)`, and `setDefaultValue(...)` (where `SharedAttributes::HEALTH()` is a static function returning the health `Attribute`)—or retrieve the attribute instance with `actor.getMutableAttribute(SharedAttributes::HEALTH())` and modify its members directly.
2. Open an issue in LeviLamina to request the vanilla function if you truly need it (functions are usually not added unless requested).
3. Resolve and call it yourself using signatures or offsets.

*Applies to: LeviLamina 1.2.0 and later (still applies to the current v26.60.x)*

## Since 26.40 the `actorUniqueId` field in `AddPlayerPacket` is gone. How should a simulated-player or out-of-body (freecam) mod set the player's `ActorUniqueID`?

The original AUID in `AddPlayerPacket` was redundant; the client actually reads the one in the abilities data. Set `::ll::TypedStorage<8, 8, ::ActorUniqueID> mTargetPlayer` in `AddPlayerPacketPayload::mAbilitiesData` (`SerializedAbilitiesData`) (see LeviLamina `src/mc/world/actor/SerializedAbilitiesData.h`). Starting with LeviLamina 26.40.5, you can also use the `AddPlayerPacket` constructor directly.

*Applies to: BDS 26.40 and later / LeviLamina 26.40 and later (still applies to the current 26.60)*

## Since BDS 1.21.132 `ConnectionRequest::mLegacyMultiplayerToken` is gone. How can a mod get a player's identity such as xuid and name?

Get it from `ServerNetworkHandler`. Each `Client` in `mClients` holds `mPrimaryPlayerInfo` (`PlayerAuthenticationInfo`) and `mSubClientPlayerInfo`; you can also call the `ServerNetworkHandler` functions that take or return a `PlayerAuthenticationInfo`. Because BDS has already parsed the login chain, you do not need to parse it from scratch. `ServerNetworkHandler` also contains the validation logic for `ConnectionRequest`.

*Applies to: LeviLamina for BDS 1.21.132 and later (still applies to the current v26.60.8)*

## In BDS, a player who puts items into a UI such as a crafting table and then force-quits can duplicate items. What causes it, and how can a LeviLamina mod fix it?

Cause: When loading player data (`Player::readAdditionalSaveData`), the game tries to return the items in the UI slots (`UIItems`) to the inventory. If that fails, it does not roll back; instead, it tries to drop the items. Because the player's chunk has not been loaded yet, the drop fails, the code that clears the UI items never runs, and the items are duplicated.

Fix:

1. Hook `Player::add` (use `$add` because it is a virtual function), but do not override it globally—change its behavior only when called from `readAdditionalSaveData`.
2. During `readAdditionalSaveData`, load the player's chunk first (for example, with `ChunkSource::getOrLoadChunk`) so the drop succeeds.

*Applies to: depends on vanilla BDS behavior; not confirmed whether the current BDS has fixed it. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What is the inheritance hierarchy of the player classes in BDS (`SimulatedPlayer`, `ServerPlayer`, `Player`, and so on)?

The hierarchy is `SimulatedPlayer` → `ServerPlayer` → `Player` → `Mob` → `Actor`. Note the `Mob` layer between `Player` and `Actor`; `Mob` represents a creature with AI logic (such as `aiStep`). On the client, the counterpart is `LocalPlayer` (`LocalPlayer` → `Player`).

## Is `ContainerID` an enum in C++ mods? Why are the IDs of containers such as the inventory not fixed?

`ContainerID` is defined as `enum class ContainerID : schar`, but only certain containers have fixed values: `None=-1`, `Inventory=0`, `Offhand=119`, `Armor=120`, `SelectionSlots=122`, `PlayerOnlyUi=124`, and `Registry=125`. Other opened container screens (such as chests and crafting tables) are assigned incremental IDs from `First(1)` to `Last(100)`, so their IDs are not fixed.

## `player.getOrCreateUniqueID()` in C++ returns an `ActorUniqueID`. Where is this API documented?

This is an internal Minecraft C++ API with no official documentation. Check the headers provided by LeviLamina: the function is declared in `mc/world/actor/Actor.h` (`ActorUniqueID const& getOrCreateUniqueID() const;`), and `Player` inherits from `Actor`. In practice, search the headers directly or rely on IDE autocompletion.

## Is there a way in LeviLamina / LSE to make a player drop (throw out) an item?

In a C++ mod, call `Player::drop(ItemStack const& item, bool randomly)` directly. LSE scripts have no native API for dropping items, so you have two workarounds: remove the item from the inventory and spawn a dropped item at the player's position, or use the third-party GMLIB-LegacyRemoteCallApi, which exports the relevant functions through RemoteCall. In general, you can implement the feature in a C++ mod and expose it to JS plugins through LegacyRemoteCall.

## How do I get the string form of a player's UUID in a LeviLamina C++ plugin?

Call `player.getUuid().asString()`. `getUuid()` returns `mce::UUID const&`, and `asString()` converts it to a string (`mce::UUID` also supports explicit conversion via `std::string(uuid)`).

## How do I get a player object by xuid in LeviLamina? Calling `Level::getPlayerByXuid` directly gives an error or a memory fault.

`getPlayerByXuid` is a virtual member function of `Level`, not a static function, and you cannot instantiate a `Level` yourself. Instead, get the global `Level` through the LL service: `ll::service::getLevel()` returns an `optional_ref<Level>`, which you must check before use:

```cpp
if (auto level = ll::service::getLevel()) {
    Player* p = level->getPlayerByXuid(xuid);
    if (p) {
        // ...
    }
}
```

*Applies to: all versions*

## How do I implement flying in survival mode in a LeviLamina plugin (like a survival-fly plugin)?

Call LeviLamina's `Player::setAbility(AbilitiesIndex::MayFly, true)` (pass `false` to turn it off). In the current implementation, `setAbility` syncs the `Canfly` flag internally and sends `UpdateAbilitiesPacket` and `UpdateAdventureSettingsPacket` to the player, so you do not need to send packets manually. If you modify `LayeredAbilities` directly, you must send `UpdateAbilitiesPacket` yourself for the change to take effect on the client. LSE also provides a corresponding wrapper.

## Does LeviLamina have a `giveItem`-style API like LL2 for giving items to players? Does the inventory refresh automatically after `Player::add`?

LeviLamina does not provide the LL2-style `giveItem` wrapper; use Mojang's API directly. `Player::add(ItemStack&)` works, but it does not refresh the client's inventory. After adding the item, call `refreshInventory()` (an LL extension method on `Mob`) to sync the client.

A simpler option is LeviLamina's extension `Player::addAndRefresh(ItemStack& item)`, which calls `add` followed by `refreshInventory` internally. Its return value indicates whether the item was fully given (it does not reflect whether the refresh succeeded). Copying the LL2 implementation is not recommended.

*Applies to: LeviLamina 1.x and later (still applies to the current v26.60.8)*

## When writing a native vanish mod, why can players who have already seen the player still see them if I only intercept the `AddActor` packet?

Intercepting the `AddActor` packet (`AddPlayer` for players) only prevents future spawns. Clients that have already loaded the player do not remove the entity automatically, so you must send a `RemoveActorPacket` to those players to hide the vanished player immediately. Using the events provided by iListenAttentively can reduce the number of hand-written hooks you need.

*Not confirmed against the source code or the documentation: treat this as a pointer.*

## How do I get an entity's main-hand and off-hand items in a LeviLamina mod? I only found the function for armor.

In the current LeviLamina headers, use `Actor::getCarriedItem()` (a virtual function) for the main-hand item and `Actor::getOffhandSlot()` for the off-hand item. Like `getArmor`, both are defined in the `Actor` class. The `Mob` class also provides `getAllHandEquipment()` to get all hand-held equipment at once. When searching `Actor.h` or `Mob.h`, do a case-insensitive search for `carried` or `offhand`.

*Applies to: LeviLamina current version*

## How do I play a sound to a player in LeviLamina? What if I cannot find a ready-to-use sound packet?

The simplest approach is to use the `playSound` family of functions on `Level` (`ILevel`), such as `playSound(LevelSoundEvent, Vec3 const&, float volume, float pitch)` or `playSound(PlaySoundOptions const&)`.

To send a sound to a single player only, construct the packet directly and send it—for example, `PlaySoundPacket(...).sendTo(player);` (Packet provides its own `sendTo(Player const&)` method). Because RAII destroys the temporary Packet object automatically, you do not need to free it manually. You can also refer to the implementation of the vanilla `playsound` command.

*Applies to: LeviLamina current version*

## In a native LeviLamina mod, how do I control the player's currently selected hotbar slot from the server (for example switch to slot 1 after the player clicks slot 9)?

The BDS `Player` class provides `setSelectedSlot(int slot)` (declared in `mc/world/actor/player/Player.h`), which sets the player's currently selected hotbar slot and returns the `ItemStack const&` in that slot. Because the server syncs the selected slot to the client via packets, a mod can control it from the server side.

*Applies to: LeviLamina current version*

## When developing a LeviLamina mod, how can I run a check asynchronously when a player joins (such as querying a cloud blacklist) without blocking the server, and let the player in only after the check passes?

BDS has a built-in asynchronous join callback mechanism. In the latest version, it lives in `AsyncJoinTaskManager` (`ServerNetworkHandler::mAsyncJoinTaskManager`): call `registerAsyncJoinCallback(callback)`, where the callback takes `(NetworkIdentifier const&, PlayerAuthenticationInfo const&, SubClientId, std::shared_ptr<AsyncVerdictPromise>)`. `handleAsyncJoinCallbacks` aggregates the results using the verdict types `AsyncJoinAllow` and `AsyncJoinDeny`. Because these functions are marked `MCNAPI`, you need to locate or implement them yourself. The Script API counterpart is `AsyncPlayerJoinBeforeEvent`. Alternatively, you can intercept packets: hold back `StartGamePacket` for the player, send it once the check passes, or send a kick packet if the check fails.

*Applies to: LeviLamina current version*

## How do I tell whether a player is using touch or keyboard and mouse, so I can decide between sending a form or a container UI?

Check the player's current input mode rather than their operating system. You can listen to or hook `PlayerAuthInputPacket` and read the `mInputMode` field from its payload (`PlayerAuthInputPacketPayload`). This field uses the `InputMode` enum (`Mouse`=1, `Touch`=2, `GamePad`=3). The `ConnectionRequest` sent at login also includes `currentInputMode`. Send a container UI for keyboard and mouse (`Mouse`) and a form for touch (`Touch`). Because players can switch input modes at any time, always use the most recently received value.

## Which packet controls dragging or clicking items in the inventory? How do I know which item was acted on?

`ItemStackRequestPacket` (which contains an `ItemStackRequestBatch`) handles these interactions. `ItemStackRequestAction` defines the specific operations using `ItemStackRequestActionType` values such as take, place, swap, and drop, and each item stack is identified by a unique `networkId`. On PC, clicking an item sends a packet as the item moves from the inventory slot to the `CURSOR` slot; on mobile, a plain tap does not send a packet. To avoid parsing packets yourself, use `PlayerRequestItemActionBeforeEvent` from iListenAttentively.

*Applies to: current BDS / LeviLamina version*

## How do I set a custom lore on a specific item in the inventory using C++ (a LeviLamina mod)?

Once you have the `ItemStack`, call `item.setCustomLore(std::vector<std::string>{...})` to set the lore, `item.clearCustomLore()` to clear it, and `getCustomLore()` to read it. For reference, see the LSE implementation of `ItemClass::setLore` in <https://github.com/LiteLDev/LegacyScriptEngine/blob/develop/src/legacy/api/ItemAPI.cpp>. After modifying the item, you must call `player.refreshInventory()` for the changes to appear on the client.

*Applies to: current LeviLamina version*
