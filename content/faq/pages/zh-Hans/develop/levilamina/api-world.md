# LeviLamina 模组 API：世界、方块与物品

## LeviLamina C++ mod 中如何获取 `BlockSource`（替代 LL2 的 `block.getBlockSource()`），并按维度 ID + `BlockPos` 获取方块/方块实体？

每个维度对应一个 `BlockSource`。已有玩家或实体时，直接从 `Actor` 获取：调用 `actor.getDimensionBlockSource()` 或 `actor.getDimension().getBlockSourceFromMainChunkSource()`（`getDimension()` 返回引用，直接用 `.` 调用）。如果只有维度 ID，则从 `Level` 获取维度：`Level::getDimension(dimId)` 返回 `WeakRef<Dimension>`，需要先调用 `lock()` 并判空（维度未加载时为空）：

```cpp
if (auto dim = ll::service::getLevel()->getDimension(dimId).lock()) {
    auto& bs = dim->getBlockSourceFromMainChunkSource();
    Block const& block = bs.getBlock(pos);
    BlockActor* be = bs.getBlockEntity(pos);
}
```

若不想处理未加载维度的空值，可改用 `Level::getOrCreateDimension(dimId)`（同样返回 `WeakRef`，仍需调用 `lock()`）。获取到 `BlockActor` 后应先判空，再用 `getType()` 判断类型，向下转型时使用 `static_cast` 而非 `reinterpret_cast`。建议尽量通过原版途径获取对象，少依赖 `ll::service` 的全局接口，也不要照搬 LSE 中的历史遗留写法。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## 基岩版磁石指针（lodestone compass）物品中只存了追踪 ID（`trackingId`），没有坐标，C++ mod 中如何获取它指向的磁石坐标？

与直接把坐标写进指针 NBT 的 Java 版不同，基岩版只在物品中保存 `PositionTrackingId`，实际坐标由位置追踪数据库 `PositionTrackingDB` 管理。服务端可通过 `level.getPositionTrackerDBServer()` 获取 `PositionTrackingDB::PositionTrackingDBServer`，再调用 `findTracker(id, &record)` 查询；返回的 `PositionTrackingDB::TrackingRecord` 中，`mPosition`（`BlockPos`）和 `mDimensionType` 即为磁石的坐标与维度。相关头文件位于 LeviLamina 的 `src/mc/world/level/position_trackingdb/` 目录下。注意：`LodestoneCompassItem::getPositionTrackingId` 当前标记为 `MCNAPI`（不可用），你需要自行从物品 NBT 读取追踪 ID，或前往 mcapi-requests 申请导出。

*适用版本：LeviLamina 当前版本（服务端）*

## 新版 BDS 中 `Block::isSolid` 没了（被内联），C++ mod 里该怎么判断方块是否为实心（solid）？

可以直接读取方块缓存的组件数据 `block.mCachedComponentData->mIsSolid`（LegacyScriptEngine 也采用这种做法），或者读取方块类型上的 `block.getBlockType().mSolid`。此外，当前 LeviLamina 已将 `Block::_isSolid()` 重新导出为 `MCAPI`，也可以直接调用。

由于 Mojang 每个版本都会调整编译选项，常有函数被内联或恢复导出；遇到函数被内联时，可以先去 LSE 源码中搜索是否有现成实现可供参考。

*适用版本：LeviLamina 26.60.x*

## BDS 1.21.100 / LeviLamina 1.5 起 `BlockLegacy` 类找不到了，改成什么了？

Mojang 已将 `BlockLegacy` 更名为 `BlockType`，在代码中改用 `BlockType`（头文件为 `mc/world/level/block/BlockType.h`）即可。注意不要与枚举 `SharedTypes::v1_21_20::JigsawStructure::ProcessorRule::BlockType`（位于 `mc/deps/shared_types/v1_21_20/structure/BlockType.h`）混淆。

*适用版本：LeviLamina 1.5（BDS 1.21.100）及以上*

## `BlockSource::setBlock` 的 `updateFlags` 参数现在只是 `int`，以前的 `enum BlockUpdateFlags` 完整定义在哪？

当前 LeviLamina 的 BDS 头文件中没有 `BlockUpdateFlag(s)` 枚举，`setBlock` 等函数的 `updateFlags` 参数类型仅为 `int`，没有官方完整定义。社区代码中通常传入 `3`（相当于旧版的 `BlockUpdateFlag::All`，即同时通知相邻方块并同步网络）。

*适用版本：LeviLamina 26.x*

## C++ mod 中判断一个实体是否为怪物（希望对 addon 自定义生物也生效），应该用 `hasCategory` 还是 `hasFamily`？

推荐使用 `Actor::hasFamily(HashedString const&)` 按实体族（family）判断：怪物为 `"monster"`，动物为 `"animal"`，非生物为 `"inanimate"`。family 数据来自实体定义中的 `minecraft:type_family` 组件，因此只要 addon 作者在自定义生物的 `type_family` 中添加了 `monster` 等标签，就能被识别；如果作者未添加，则无法通过这种方式拦截。LSE 插件则可借助 LRCA 等方式判断。

## C++ mod 中如何判断某个区块是否已加载？

调用 `ChunkSource` 的 `std::shared_ptr<LevelChunk> getAvailableChunk(ChunkPos const& cp)`（由 LeviLamina 以 LLAPI 导出），若返回 `nullptr`，则说明该区块未加载或尚未加载完成（状态未达到 `ChunkState::Loaded`）。`ChunkSource` 没有提供 `getAvailableChunkAt`，按方块坐标查询时需先转换坐标：`region.getChunkSource().getAvailableChunk(ChunkPos{blockPos})`。此外，也可以用 `BlockSource::hasChunk(ChunkPos const&, bool serverSideOnly)` 或 `BlockSource::getChunkAt(BlockPos const&)`（返回 `LevelChunk*`）来判断。

*适用版本：LeviLamina 26.60.x*

## C++ mod 开发中如何判断一个箱子能否被打开？在哪个类里找对应函数？

相关函数位于 `ChestBlockActor` 类（`mc/world/level/block/actor/ChestBlockActor.h`）中。当前头文件里的对应函数为 `virtual bool _canOpenThis(BlockSource& region) const;`（例如箱子顶部有遮挡时会返回 `false`）。查找此类接口时，可在头文件中直接搜索英文函数名，注意确认所属的类名无误。

*适用版本：LeviLamina 26.60.x*

## C++ mod 里怎么从 `Explosion` 类拿到爆炸源实体？`mSourceID` 每次爆炸都不一样。

`Explosion::mSourceID` 存的就是爆炸源实体的 `ActorUniqueID`，不同爆炸源对应的值本来就不同。该成员的类型为 `ll::TypedStorage<8, 8, ActorUniqueID>`，可通过 `*explosion.mSourceID` 或 `.get()` 取出 ID，再传给 `Level::fetchEntity` 获取实体指针：`Actor* src = level.fetchEntity(*explosion.mSourceID, false);`（第二个参数 `getRemoved` 控制是否同时返回已移除的实体）。若返回 `nullptr`，说明此次爆炸没有源实体，或该源实体已不存在。

*适用版本：LeviLamina 26.60.x*

## C++ 中 `Vec3` 坐标是单精度还是双精度？

单精度。LeviLamina 中的 `Vec3` 继承自 `ll::math::floatN3<Vec3>`，各分量均为 `float`。由于基岩版采用 `float` 存储坐标，在距离原点极远（如百万格以外）的位置会出现精度丢失；Java 版则使用 `double`。

## LeviLamina C++ 中如何获取世界重生点（world spawn）？获取到的 Y 值为 `32767` 或 X/Z 为 `-2147483648` 是怎么回事？

世界重生点全局唯一且位于主世界，不属于 `Dimension`，而是保存在 `level.dat`（`LevelData`）中。在当前版本的头文件中，可通过 `ll::service::getLevel()->getSharedSpawnPos()` 获取（返回 `BlockPos const&`，LSE 创建模拟玩家时也用它来获取出生点）。

如果存档从未执行过 `/setworldspawn`，获取到的 Y 值通常为 `32767`；若在存档尚未加载完成时调用，X 和 Z 值可能会是 `-2147483648`（即 `INT_MIN`）。BDS 内部使用该坐标时会自动向下寻找安全的地面高度，因此 Y 值异常不会影响原版出生逻辑；但如果你要将该坐标用于传送等自定义功能，则需要自行计算地面高度。注意：`DimensionConversionData` 中的 spawnpoint 是供末地传送门使用的，并非世界出生点。

*适用版本：当前版本（服务端）*

## LeviLamina C++ 插件能否获取未加载区块中某坐标的方块类型？

区块未加载时无法直接获取，必须先加载区块。你可以调用 `ChunkSource` 的 `getOrLoadChunk(ChunkPos const&, ChunkSource::LoadMode, bool readOnly)` 手动加载，但据用户实测，若手动加载的区块尚未生成地形，读取到的方块会全部是 `air`。如果需要读取已生成地形的方块数据，建议设置常加载区（`tickingarea`），或派玩家/假人前往对应位置触发区块加载后再读取。

*适用版本：当前版本（服务端）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina C++ 模组中如何获取所有已加载实体？MC API 里实体类叫什么，继承关系是怎样的？

可参考 LSE 的实现：`ll::service::getLevel()->getEntities()` 返回 `std::vector<OwnerPtr<EntityContext>> const&`，遍历时先检查 `i.has_value() && i.tryUnwrap().has_value()`，再调用 `i.tryUnwrap().get()` 即可取得 `Actor&`。

BDS 中的实体基类名为 `Actor`（不存在 `Entity` 类），其继承关系为：`Mob`（生物）继承自 `Actor`，`Player` 继承自 `Mob`，`ServerPlayer` 继承自 `Player`。

## LeviLamina mod 实现连锁采集时，用 `Block::playerDestroy` + `setBlock` + `neighborChanged` 手动破坏方块，导致木头上的火把、藤蔓等附着方块不正常掉落，应如何实现？

直接调用玩家的 `GameMode::destroyBlock(BlockPos const& pos, uchar face)` 破坏方块（例如 `player.mGameMode->destroyBlock(pos, face)`）。玩家挖掘方块走的就是这个函数，附着方块掉落、方块更新、工具耐久等均由游戏自行处理，无需手动调用 `playerDestroy`、`setBlock` 和 `neighborChanged`。

## LeviLamina 头文件中 `Block` 没有可调用的 `getRuntimeId`，怎么获取方块的 RuntimeId？

直接读取 `Block` 的成员变量 `mNetworkId`（类型为 `ll::TypedStorage<4,4,uint>`，即方块的网络运行时 ID），例如 `block.mNetworkId`。

## 在 LeviLamina C++ mod 中如何主动加载指定位置的区块（例如做随机传送前预加载目标区块）？JS 插件有什么办法？

C++ 可创建或使用 `ChunkViewSource` 并调用 `ChunkViewSource::move`，将区块源移动到目标范围进行加载：以目标区块为中心向外扩展 3 个区块（实际需加载 7x7 个区块，中心区块才会完整加载或生成），然后等待加载完成。这一过程与玩家加载区块类似。

注意，当前头文件中只有 `move(BlockPos const& blockMin, BlockPos const& blockMax, bool isCircle, ChunkSourceViewGenerateMode, std::function<void(gsl::span<std::shared_ptr<LevelChunk>>)> add, float const* serverBuildRatio)` 这一重载是可用的 `MCAPI`，其余重载均标记为 `MCNAPI`，不可直接调用。

JS（LSE）侧没有直接的 API，可借助 `tickingarea` 命令临时添加常加载区域，或使用 iListenAttentively 的 LSE 导出插件（ila-lseexport）。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.x）*

## 在 LeviLamina C++ mod 中按区块坐标获取区块，用 `getChunk` / `getChunkAt` 拿不到（可能区块未加载），应该用什么 API？

`BlockSource::getChunk` 只返回已加载的区块，区块未加载时返回空。可改用 `ChunkSource` 的 `getOrLoadChunk(ChunkPos const& cp, ChunkSource::LoadMode lm, bool readOnly)`（`LoadMode` 可选 `None` 或 `Deferred`），它会在需要时加载区块；若只想查询已存在的区块，可用 `getExistingChunk`。`ChunkPos` 可直接用坐标构造。相关头文件见 LeviLamina 仓库的 `src/mc/world/level/chunk/ChunkSource.h`。

注意区块加载可能是异步的，若需完整加载，可参考 `ChunkViewSource` 的方式。

*适用版本：LeviLamina 1.x 及以上*

## 在 LeviLamina C++ 插件中如何移除/自定义实体受伤后的无敌帧？

`Actor` 类有成员变量 `mInvulnerableTime`（`TypedStorage<int>`），在实体受伤后将其设为 0 即可移除无敌帧（也可设为自定义值），例如 `actor.mInvulnerableTime = 0;`（`TypedStorage` 需通过 `get()` 或赋值访问）。若追求极致性能，可以直接 patch 掉游戏中设置该值的代码。

*适用版本：LeviLamina 1.x 及以上（字段名可能随 BDS 版本变化）*

## 在 LeviLamina mod 中如何判断某个方块/物品属于某个类（如门、潜影盒、告示牌）？能用虚函数表（vftable）比较吗？

不要用虚表判断：BDS 没有 RTTI，LeviLamina 也不保证保留 vtable 符号；自行 `new` 出的派生类虚表也并非 BDS 原生虚表，因此虚表不能用于任何类型判断。

应通过方块自身的类型或 ID 判断：参考 `VanillaBlockTypeIds`（`src/mc/world/level/block/VanillaBlockTypeIds.h`）比较方块类型名，或检查基类；对于带方块实体的方块（如潜影盒、告示牌），可用 `BlockType::getBlockEntityType()` 判断 `BlockActorType`；若需兼容自定义方块，可用 `block.getTypeName()` 检查名称（例如是否以 `_door` 结尾）或检查组件。

*适用版本：当前所有 LeviLamina 版本*

## 在 LeviLamina mod 中如何获取 BDS 的刷怪器（spawner），以统计哪些生物计入全局刷怪上限或读取刷怪计数？

通过 `ll::service::getLevel()->mMobSpawner`（或 `Level::getSpawner()`）获取 `Spawner`，再将其 `static_cast` 为 `BedrockSpawner` 即可访问其成员。刷怪计数相关逻辑可从 `ActorSpawnRuleGroup` 入手研究。注意逆向得到的生物池枚举顺序可能有误，`pool_name` 需自行校正。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina mod 中能否在世界生成阶段（区块地形生成/装饰时）调用 `getOrLoadChunk` 加载区块？

不能。在世界生成过程中（如 `IFeature::place`、`BiomeDecorationSystem::decorateLargeFeature` 等函数内部）调用 `ChunkSource::getOrLoadChunk` 会导致死循环，应避免在这些 hook 中加载区块。

*适用版本：LeviLamina 当前版本（BDS 原版行为）。未能从源码或文档中直接证实，仅供参考。*

## 在 LeviLamina mod 里实现双开门联动时，把获取到的门方块当 `Block` 调用（如 `getStates`）导致崩溃，怎么正确判断双开门另一半的位置？

`DoorBlock` 继承自 `BlockType`（旧称 `BlockLegacy`），表示方块类型而非方块实例 `Block`，当成 `Block` 调用会导致崩溃。

应通过方块实例（`Block`）读取方块状态：根据下半门的朝向状态和上半门的 `door_hinge_bit` 确定双开门另一半的位置；也可直接调用 `DoorBlock::getDir(region, pos)` 和 `DoorBlock::hasRightHinge(region, pos)`。这比遍历四个方向更可靠。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 头文件里找不到与区块（chunk）相关的 API，应该用哪些类？LSE（LegacyScriptEngine）有区块相关 API 吗？

C++ 侧与区块相关的类主要是 `ChunkSource` 和 `LevelChunk`（位于 `mc/world/level/chunk/ChunkSource.h` 和 `LevelChunk.h`）。LSE 没有专门的区块 API（仅有 `player.refreshChunks()` 等零散接口），像为假人补充区块加载这类需求，需要用 C++ 原生 mod 实现。

*适用版本：LeviLamina 当前版本；LegacyScriptEngine 当前版本*

## 在 mod 中对动力铁轨上的矿车调用 `getPosDelta()`，向量长度为 2.06 格/gt，而不是预期的约 0.4，为什么？

`getPosDelta()` 返回的不是当前 tick 与上一 tick 的位置差，而是实体当前的运动向量（`StateVectorComponent::mPosDelta`，修改该值会使实体随之移动），矿车速度上限等逻辑可能硬编码在原版代码中。具体实现可参考 <https://github.com/killcerr/MinecartSpeedPlus/blob/main/src/MinecartSpeedPlus.cpp>。

*适用版本：LeviLamina 26.x。未能从源码或文档中直接证实，仅供参考。*

## 在原生 mod 里调用底层 API 把图片生成为地图（地图画）时，怎样才能不受 `parentMapId` 判断的影响？

根据地图画插件的开发经验，调用底层 API 生成地图时，将地图数据（`MapItemSavedData`）的 scale（`mScale`）设为最大值，即可跳过对 `parentMapId`（`mParentMapId`）的判断。

*适用版本：LeviLamina 原生 mod，依赖 BDS 内部地图逻辑。未能从源码或文档中直接证实，仅供参考。*

## 想修改生物血量，通过 `setNbt` 修改 `Attributes` 里的血量会导致进程直接退出，有更直接的办法吗？

无需修改 NBT，直接操作属性即可。当前写法是通过实体的 `AttributesComponent` 或 `Actor::getAttributes()` 获取 `BaseAttributeMap`，再调用 `setMaxValue`/`setCurrentValue`，例如：

```cpp
actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);
```

也可参考 LSE 的实现：

```cpp
if (auto c = actor.getEntityContext().tryGetComponent<AttributesComponent>())
  c->mAttributes->setMaxValue(SharedAttributes::HEALTH(), value);
```

若要修改当前血量，调用 `setCurrentValue` 即可。

## 用 LeviLamina 能否把世界生成为虚空（类似空岛）？

可以使用 MoreDimensions 的多维度 API 创建虚空维度：`CustomDimensionManager::addSimpleDimension(name, seed, GeneratorType::Void)`（MoreDimensions 测试中有 `custom_dim:new_void_type` 示例）。若想让主世界变为虚空但保留结构，可在虚空维度的基础上自行实现结构生成，或 hook 地形生成相关函数（原版提供了 `VoidGenerator`）。也可参考现成插件：<https://github.com/ZGDD-BE/VoidWorldGenerator>

*适用版本：LeviLamina + MoreDimensions 当前版本*
