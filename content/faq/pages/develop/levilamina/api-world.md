# LeviLamina mod API: world, blocks and items

## How do I get a `BlockSource` in a LeviLamina C++ mod (replacing LL2's `block.getBlockSource()`), and get a block or block entity by dimension ID + `BlockPos`?

Each dimension has one `BlockSource`. If you already have a player or entity, get it from the `Actor`: `actor.getDimensionBlockSource()` (or `actor.getDimension().getBlockSourceFromMainChunkSource()`; `getDimension()` returns a reference, so call it with `.`). If you only have a dimension ID, get the dimension from `Level`. `Level::getDimension(dimId)` returns a `WeakRef<Dimension>`, which is empty when the dimension is not loaded, so you must `lock()` it first and check for null:

```cpp
if (auto dim = ll::service::getLevel()->getDimension(dimId).lock()) {
    auto& bs = dim->getBlockSourceFromMainChunkSource();
    Block const& block = bs.getBlock(pos);
    BlockActor* be = bs.getBlockEntity(pos);
}
```

To skip the null check, use `Level::getOrCreateDimension(dimId)` instead (it also returns a `WeakRef` that needs `lock()`). After getting a `BlockActor`, check it for null, use `getType()` to determine its type, and downcast with `static_cast` rather than `reinterpret_cast`. Prefer obtaining objects through vanilla paths rather than the global `ll::service` interfaces, and avoid copying legacy patterns from LSE.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## A Bedrock lodestone compass item stores only a tracking ID (`trackingId`) and no coordinates. How do I get the lodestone position it points to in a C++ mod?

Unlike Java Edition, which writes the coordinates directly into the compass NBT, Bedrock stores a `PositionTrackingId` and manages the coordinates in the `PositionTrackingDB` position tracking database. On the server, get `PositionTrackingDB::PositionTrackingDBServer` via `level.getPositionTrackerDBServer()`, then query it with `findTracker(id, &record)`. In the resulting `PositionTrackingDB::TrackingRecord`, `mPosition` (`BlockPos`) and `mDimensionType` hold the lodestone's position and dimension. The related headers are under `src/mc/world/level/position_trackingdb/` in LeviLamina. Note that `LodestoneCompassItem::getPositionTrackingId` is currently `MCNAPI` (unavailable), so you must read the tracking ID from the item NBT yourself or request an export in mcapi-requests.

*Applies to: LeviLamina current version (server side)*

## `Block::isSolid` is gone in new BDS versions (inlined). How do I check whether a block is solid in a C++ mod?

Read the block's cached component data directly via `block.mCachedComponentData->mIsSolid` (as LegacyScriptEngine does), or read `block.getBlockType().mSolid` on the block type. In the current version of LeviLamina, `Block::_isSolid()` is exported again as `MCAPI`, so you can also call it directly.

Because Mojang changes compiler options in every version, functions are constantly being inlined or restored. When you run into an inlined function, check the LSE source first for an existing implementation to use as a reference.

*Applies to: LeviLamina 26.60.x*

## Since BDS 1.21.100 / LeviLamina 1.5 the `BlockLegacy` class can no longer be found. What was it renamed to?

Mojang renamed `BlockLegacy` to `BlockType`; use `BlockType` in your code (header `mc/world/level/block/BlockType.h`). Be careful not to confuse it with the `SharedTypes::v1_21_20::JigsawStructure::ProcessorRule::BlockType` enum (`mc/deps/shared_types/v1_21_20/structure/BlockType.h`).

*Applies to: LeviLamina 1.5 (BDS 1.21.100) and later*

## The `updateFlags` parameter of `BlockSource::setBlock` is now just an `int`. Where is the old `enum BlockUpdateFlags` fully defined?

Current LeviLamina BDS headers do not contain a `BlockUpdateFlag(s)` enum. The `updateFlags` parameter of `setBlock` and similar functions is simply an `int`, with no complete official definition. Community code commonly passes `3`, which is equivalent to the old `BlockUpdateFlag::All` (notify neighbors and sync to the network).

*Applies to: LeviLamina 26.x*

## In a C++ mod, to check whether an entity is a monster (including custom addon mobs), should I use `hasCategory` or `hasFamily`?

Use `Actor::hasFamily(HashedString const&)` to check the entity's family: `"monster"` for monsters, `"animal"` for animals, and `"inanimate"` for non-living entities. Because the family comes from `minecraft:type_family` in the entity definition, this method recognizes an addon mob only if its author included `monster` (or a similar value) in `type_family`. LSE plugins can use approaches such as LRCA.

## How do I check whether a chunk is loaded in a C++ mod?

Call `std::shared_ptr<LevelChunk> getAvailableChunk(ChunkPos const& cp)` on `ChunkSource` (implemented by LeviLamina as an LLAPI). It returns `nullptr` if the chunk is not loaded or has not finished loading (its state has not reached `ChunkState::Loaded`). `ChunkSource` has no `getAvailableChunkAt`; to query by block position, convert it first: `region.getChunkSource().getAvailableChunk(ChunkPos{blockPos})`. You can also use `BlockSource::hasChunk(ChunkPos const&, bool serverSideOnly)` or `BlockSource::getChunkAt(BlockPos const&)` (which returns `LevelChunk*`).

*Applies to: LeviLamina 26.60.x*

## How do I check whether a chest can be opened in C++ mod development? Which class has the function?

It is in the `ChestBlockActor` class (`mc/world/level/block/actor/ChestBlockActor.h`). In the current header, the function is `virtual bool _canOpenThis(BlockSource& region) const;`, which returns `false` when the top is blocked, for example. When searching the headers, search by the English function name and make sure you are looking in the right class.

*Applies to: LeviLamina 26.60.x*

## How do I get the source entity of an explosion from the `Explosion` class in a C++ mod? `mSourceID` is different for every explosion.

`Explosion::mSourceID` is the `ActorUniqueID` of the explosion's source entity, so it is normal for different sources to have different values. Its type is `ll::TypedStorage<8, 8, ActorUniqueID>`. Read the value with `*explosion.mSourceID` or `.get()`, then pass it to `Level::fetchEntity` to get the entity: `Actor* src = level.fetchEntity(*explosion.mSourceID, false);` (the second parameter, `getRemoved`, controls whether removed entities are also returned). A `nullptr` return value means there is no source entity or it no longer exists.

*Applies to: LeviLamina 26.60.x*

## Are `Vec3` coordinates single or double precision in C++?

Single precision. In LeviLamina, `Vec3` inherits from `ll::math::floatN3<Vec3>` and its components are `float`. Bedrock Edition uses `float` for coordinates, so precision is lost at very large coordinates (such as millions of blocks away), whereas Java Edition uses `double`.

## How do I get the world spawn in LeviLamina C++? Why is the Y value `32767`, or X/Z `-2147483648`?

There is only one world spawn, in the Overworld. It does not belong to a `Dimension` and is stored in `level.dat` (`LevelData`). In the current headers, you can get it with `ll::service::getLevel()->getSharedSpawnPos()`, which returns `BlockPos const&` (LSE also uses this to get the spawn point when creating a simulated player).

If `/setworldspawn` has never been used, Y is usually `32767`; before the world finishes loading, X and Z may be `-2147483648` (`INT_MIN`). BDS automatically finds safe ground when it uses the spawn, so Y does not affect vanilla spawning. If you use this value yourself (for example, to teleport a player), you must find the ground height yourself. Note that the spawn point in `DimensionConversionData` is for the End portal, not the world spawn.

*Applies to: current version (server)*

## Can a LeviLamina C++ plugin get the block type at a coordinate in an unloaded chunk?

Not while the chunk is unloaded; you must load the chunk first. You can load it manually with `ChunkSource`'s `getOrLoadChunk(ChunkPos const&, ChunkSource::LoadMode, bool readOnly)`, but users report that if a manually loaded chunk has not generated its terrain yet, every block you read will be `air`. If you need data from generated terrain, use a ticking area (`tickingarea`), or send a player or simulated player there to load the chunk before reading it.

*Applies to: current version (server). Not confirmed against the source code or the documentation: treat it as a pointer.*

## How do I get all loaded entities in a LeviLamina C++ mod? What is the entity class called in the MC API, and what is its inheritance hierarchy?

You can follow LSE's implementation: `ll::service::getLevel()->getEntities()` returns `std::vector<OwnerPtr<EntityContext>> const&`. When iterating over it, first check `i.has_value() && i.tryUnwrap().has_value()`, then call `i.tryUnwrap().get()` to get an `Actor&`.

In BDS, the base entity class is `Actor` (there is no `Entity` class). `Mob` (living creatures) inherits from `Actor`, `Player` inherits from `Mob`, and `ServerPlayer` inherits from `Player`.

## When implementing chain mining in a LeviLamina mod, I break blocks manually with `Block::playerDestroy` + `setBlock` + `neighborChanged`, and attached blocks such as torches and vines on the logs do not drop properly. How should I implement it?

Call the player's `GameMode::destroyBlock(BlockPos const& pos, uchar face)` directly to break the block (for example, `player.mGameMode->destroyBlock(pos, face)`). This is the function the game uses when a player mines a block, so it automatically handles attached-block drops, block updates, tool durability, and so on. There is no need to call `playerDestroy` / `setBlock` / `neighborChanged` manually.

## `Block` has no callable `getRuntimeId` in the LeviLamina headers. How do I get a block's RuntimeId?

Read the `Block` member variable `mNetworkId` (`ll::TypedStorage<4,4,uint>`, the block's network runtime ID) directly—for example, `block.mNetworkId`.

## How do I actively load chunks at a given position in a LeviLamina C++ mod (for example, to preload the target chunks before a random teleport)? What can JS plugins do?

In C++, create or reuse a `ChunkViewSource` and call `ChunkViewSource::move` to move the chunk source to the target range so it loads. Expand the range by 3 chunks outward from the target chunk (loading a 7x7 chunk area so that the center chunk is fully loaded and generated), then wait for loading to finish. This works the same way a player loads chunks.

In the current headers, only the overload `move(BlockPos const& blockMin, BlockPos const& blockMax, bool isCircle, ChunkSourceViewGenerateMode, std::function<void(gsl::span<std::shared_ptr<LevelChunk>>)> add, float const* serverBuildRatio)` is an available `MCAPI`. The other overloads are marked `MCNAPI` and cannot be called directly.

JS (LSE) has no direct API for this. You can temporarily add an always-loaded area with the `tickingarea` command, or use the functionality provided by the LSE export plugin of iListenAttentively (ila-lseexport).

*Applies to: LeviLamina 1.x and later (currently v26.60.x)*

## In a LeviLamina C++ mod, I cannot get a chunk by chunk coordinates with `getChunk` / `getChunkAt` (the chunk may not be loaded). Which API should I use?

`BlockSource::getChunk` returns only loaded chunks and returns null if the chunk is not loaded. Instead, call `getOrLoadChunk(ChunkPos const& cp, ChunkSource::LoadMode lm, bool readOnly)` on `ChunkSource` (`LoadMode` has `None` and `Deferred`), which loads the chunk when needed. To look up only chunks that already exist, use `getExistingChunk`. You can construct `ChunkPos` directly from coordinates. For the header, see `src/mc/world/level/chunk/ChunkSource.h` in the LeviLamina repository.

Note that chunk loading may be asynchronous. When you need a fully loaded chunk, use the `ChunkViewSource` approach instead.

*Applies to: LeviLamina 1.x and later*

## How do I remove or customize an entity's invulnerability frames after being hurt in a LeviLamina C++ plugin?

The `Actor` class has an `mInvulnerableTime` member (`TypedStorage<int>`). Set it to 0 after the entity is hurt to remove the invulnerability frames (or set a custom value)—for example, `actor.mInvulnerableTime = 0;` (`TypedStorage` is accessed through `get()` or assignment). For maximum performance, patch out the game code that sets this value.

*Applies to: LeviLamina 1.x and later (the field may change with the BDS version)*

## How do I tell whether a block/item belongs to a class (such as door, shulker box, sign) in a LeviLamina mod? Can I compare vftables?

Do not use the vtable for this: BDS has no RTTI, LeviLamina does not guarantee that vtable symbols are kept, and the vtable of a derived class you instantiate with `new` will not match BDS's. You cannot reliably identify anything from a vtable.

Check the block's own type or ID instead: see `VanillaBlockTypeIds` (`src/mc/world/level/block/VanillaBlockTypeIds.h`) and compare block type names, or check the base class. For blocks with block entities (such as shulker boxes and signs), call `BlockType::getBlockEntityType()` to check the `BlockActorType`. To stay compatible with custom blocks, check the name with `block.getTypeName()` (for example, whether it ends with `_door`) or inspect its components.

*Applies to: all LeviLamina versions*

## How do I get the BDS spawner in a LeviLamina mod, to count which mobs count toward the global spawn cap or to read spawn counts?

Get the `Spawner` via `ll::service::getLevel()->mMobSpawner` (or `Level::getSpawner()`), then `static_cast` it to `BedrockSpawner` to access its members. To understand the spawn-count logic, start by examining `ActorSpawnRuleGroup`. Note that the mob pool enum order obtained by reverse engineering may be wrong, so you will need to correct `pool_name` yourself.

*Applies to: LeviLamina current version*

## In a LeviLamina mod, can I call `getOrLoadChunk` to load chunks during world generation (chunk terrain generation/decoration)?

No. Calling `ChunkSource::getOrLoadChunk` during world generation (for example, inside functions such as `IFeature::place` and `BiomeDecorationSystem::decorateLargeFeature`) causes an infinite loop. Do not load chunks inside those hooks.

*Applies to: LeviLamina current version (vanilla BDS behavior). Not confirmed against the source code or the documentation: treat it as a pointer.*

## In a LeviLamina mod implementing linked double doors, using the door block I obtained as a `Block` (for example calling `getStates`) crashes. How do I correctly find the position of the other half of a double door?

`DoorBlock` extends `BlockType` (formerly `BlockLegacy`). It is a block type, not a `Block` instance, so using it as a `Block` causes a crash.

Read block states from the `Block` instance instead: use the lower half's facing state and the upper half's `door_hinge_bit` to find the position of the other door. You can also call `DoorBlock::getDir(region, pos)` and `DoorBlock::hasRightHinge(region, pos)` directly, which is cleaner than iterating over the four directions.

*Applies to: LeviLamina current version*

## I can't find chunk-related APIs in the LeviLamina headers. Which classes should I use? Does LSE (LegacyScriptEngine) have chunk APIs?

In C++, the main chunk classes are `ChunkSource` and `LevelChunk` (`mc/world/level/chunk/ChunkSource.h`, `LevelChunk.h`). LSE has no dedicated chunk API—only scattered interfaces such as `player.refreshChunks()`—so tasks like making chunks load for a simulated player require a native C++ mod.

*Applies to: LeviLamina current version; LegacyScriptEngine current version*

## In a mod, calling `getPosDelta()` on a minecart on a powered rail returns a vector of length 2.06 blocks/gt instead of the expected 0.4 or so. Why?

`getPosDelta()` does not return the position difference between the current tick and the previous tick. It returns the entity's current motion vector (`StateVectorComponent::mPosDelta`; adding to it moves the entity), while limits such as a minecart's maximum speed may be hard-coded in vanilla. For a working example, see <https://github.com/killcerr/MinecartSpeedPlus/blob/main/src/MinecartSpeedPlus.cpp>.

*Applies to: LeviLamina 26.x. Not confirmed against the source code or the documentation: treat it as a pointer.*

## When a native mod calls the low-level API to turn an image into a map (map art), how can I avoid the `parentMapId` check?

According to a map-art plugin developer, setting the scale (`mScale`) of the map data (`MapItemSavedData`) to its maximum value when generating a map through the low-level API bypasses the `parentMapId` (`mParentMapId`) check.

*Applies to: LeviLamina native mod, depends on BDS internal map logic. Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to change a mob's health, but modifying the health in `Attributes` through `setNbt` makes the process exit immediately. Is there a more direct way?

You don't need to modify NBT; modify the attributes directly. Get the `BaseAttributeMap` from the entity's `AttributesComponent` or `Actor::getAttributes()`, then call `setMaxValue` or `setCurrentValue`. For example:

```cpp
actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);
```

Or, following LSE:

```cpp
if (auto c = actor.getEntityContext().tryGetComponent<AttributesComponent>())
  c->mAttributes->setMaxValue(SharedAttributes::HEALTH(), value);
```

Use `setCurrentValue` to change the current health.

## Can I generate a void world (like a skyblock) with LeviLamina?

Use the MoreDimensions multi-dimension API to create a void dimension: `CustomDimensionManager::addSimpleDimension(name, seed, GeneratorType::Void)` (the MoreDimensions tests include a `custom_dim:new_void_type` example). If you want a void overworld that still generates structures, either implement structure generation on top of a void dimension or hook the terrain generation functions (vanilla provides `VoidGenerator`). You can also refer to an existing plugin: <https://github.com/ZGDD-BE/VoidWorldGenerator>

*Applies to: LeviLamina + MoreDimensions current version*
