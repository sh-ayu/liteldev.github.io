# LeviLamina 模组 API：玩家与实体

## LeviLamina C++ mod 中按玩家存储数据/唯一标识玩家，用 uuid、xuid 还是 realName 作为键？为什么 LegacyMoney 用 xuid？

推荐使用 UUID（`Player::getUuid()` 返回 `mce::UUID`）。开启正版验证（`online-mode`）时，UUID 固定不变且跨存档一致；关闭正版验证时，UUID 会随机生成，但此时 xuid 本身也不可靠（离线时可能为空）。`mce::UUID` 由两个 `uint64` 组成，比较和哈希都比 xuid 字符串更快，可直接用作 `unordered_map` 的键。不要使用 `realName`（玩家可改名）。LegacyMoney 使用 xuid 是出于历史遗留原因（legacy 兼容）；已用 xuid 存储数据的插件在开启 `online-mode` 时可以不用修改。需要在 uuid 与 xuid 之间互查（如读取 LegacyMoney 数据库）时，可使用 `ll::service::PlayerInfo` 的 `fromUuid()`、`fromXuid()` 或 `fromName()`。

## 原生 mod 如何实现虚拟容器/自定义箱子 GUI（如 Invsee 查看背包、快捷打开潜影盒）？LeviLamina 有现成接口吗？

LeviLamina 没有封装虚拟容器接口，需要自行实现，常见思路如下：

1. 最简单：在玩家附近真实放置容器方块并打开，关闭后移除。
2. 全发包：用 `UpdateSubChunkBlocksPacket` 发送假箱子方块，用 `BlockActorDataPacket` 更新其方块实体 NBT，再用 `ContainerOpenPacket` 让玩家打开界面，然后自行处理容器内容更新与所有物品请求（`ItemStackRequest`）；针对离线玩家还需自行读写 NBT。
3. 半发包：在服务端构造一个容器对象（`Container` 是抽象类，需选用合适的派生类）并让服务端认为玩家打开了它，同时向客户端发包伪造方块并打开。物品的显示和移动交由原版逻辑处理，mod 只需负责打开和保存（需深入理解 MC 容器机制）。

受原版客户端限制，除非客户端也安装模组，否则客户端一定会看到一个“假方块”。此外，也可以使用第三方前置（如 GMLIB）提供的虚拟容器 API。

*适用版本：当前所有 LeviLamina 版本（服务端）*

## C++ mod 中如何获取 `ServerPlayer`？`Player` 怎么转 `ServerPlayer`（`dynamic_cast` 不可用），`ServerNetworkHandler::getServerPlayer` 没了怎么办？

如果只考虑服务端，可直接对 `Player` 执行 `static_cast<ServerPlayer&>(player)`。如果 mod 也会在客户端运行（`target_type=client`），则需要先判断（如调用 `player.isClientSide()`）再转换。

在 `ServerNetworkHandler` 中按 `NetworkIdentifier` 获取玩家时，请使用 `_getServerPlayer(source, subId)`（自 BDS 1.21.60 起已移除 `getServerPlayer` 封装）。

在 hook `ServerNetworkHandler` 继承自 `NetEventCallback` 的虚函数（如各 `handle(NetworkIdentifier const&, XxxPacket const&)`）时，hook 内的 `this` 实际指向 `NetEventCallback` 子对象，而非 `ServerNetworkHandler` 的起始地址。此时不要手动计算偏移，应使用 hook 提供的 `thisFor<NetEventCallback>()` 获取正确的 `ServerNetworkHandler*`，再调用 `_getServerPlayer`（LeviLamina 自身的 `PlayerJoinEvent` / `PlayerChatEvent` 正是调用了 `thisFor<NetEventCallback>()->_getServerPlayer(identifier, packet.mSenderSubId)`）。

*适用版本：BDS 1.21.60 及以上 / 当前 LeviLamina*

## C++ mod 中想修改玩家血量/最大生命值，但参考旧写法调用的原版函数（如 `AttributeHelper::setMaxValue` 等）在新版 LeviLamina 中被标成 `MCNAPI`，编译报警告/错误，怎么办？

`MCNAPI` 表示该原版函数在当前 BDS 中没有可链接的符号（通常已被内联），LeviLamina 头文件将其标记为 `[[deprecated("This API is not available. Open an issue if you need it.")]]`，无法直接调用。解决方法如下：

1. 改用其他可用的 API。修改属性值可以使用 LeviLamina 自行实现的 `BaseAttributeMap` 辅助函数，例如 `actor.getAttributes()->setMaxValue(SharedAttributes::HEALTH(), value);`、`setCurrentValue(...)`、`setDefaultValue(...)`（其中 `SharedAttributes::HEALTH()` 是返回血量 `Attribute` 的静态函数）；也可以通过 `actor.getMutableAttribute(SharedAttributes::HEALTH())` 获取属性实例后直接修改其成员。
2. 如果确实需要该原版函数，可到 LeviLamina 仓库提 issue 请求实现（不提通常不会添加）。
3. 自行通过特征码或偏移量处理。

*适用版本：LeviLamina 1.2.0 及以上（当前 v26.60.x 仍适用）*

## 26.40 起 `AddPlayerPacket` 里的 `actorUniqueId` 字段没了，做假玩家/灵魂出窍（freecam）的 mod 该怎么设置玩家的 `ActorUniqueID`？

`AddPlayerPacket` 中原有的 AUID 本就是冗余字段，客户端实际使用的是能力数据中的字段：设置 `AddPlayerPacketPayload::mAbilitiesData`（`SerializedAbilitiesData`）里的 `::ll::TypedStorage<8, 8, ::ActorUniqueID> mTargetPlayer` 即可（参见 LeviLamina 的 `src/mc/world/actor/SerializedAbilitiesData.h`）。自 LeviLamina 26.40.5 起，`AddPlayerPacket` 也提供了可直接使用的构造函数。

*适用版本：BDS 26.40 及以上 / LeviLamina 26.40 及以上（当前 26.60 仍适用）*

## BDS 1.21.132 起 `ConnectionRequest` 的 `mLegacyMultiplayerToken` 没了，mod 如何获取玩家 xuid、名称等身份信息？

可从 `ServerNetworkHandler` 获取：其 `mClients` 中的每个 `Client` 都保存了 `mPrimaryPlayerInfo`（`PlayerAuthenticationInfo`）和 `mSubClientPlayerInfo`；也可以调用 `ServerNetworkHandler` 中带 `PlayerAuthenticationInfo` 参数或返回值的函数。BDS 已经解析过 login chain，无需自行从头解析。`ConnectionRequest` 的验证相关逻辑同样位于 `ServerNetworkHandler` 中。

*适用版本：BDS 1.21.132 及以后对应的 LeviLamina（当前 v26.60.8 仍适用）*

## BDS 中玩家在打开工作台等 UI 放入物品后强退会导致刷物品，原因是什么？用 LeviLamina mod 如何修复？

原因：读取玩家数据（`Player::readAdditionalSaveData`）时，服务端会尝试将 UI 槽位（`UIItems`）中的物品 add 回背包；若失败则不会回溯，而是转而尝试 drop 物品。但此时玩家所在的区块尚未加载，drop 也会失败，导致清除 UI 物品的代码未触发，从而复制出物品。

修复思路：

1. Hook `Player::add`（虚函数需用 `$add`），但不要全局改写，仅在 `readAdditionalSaveData` 的调用上下文中修改其行为。
2. 在执行 `readAdditionalSaveData` 时先加载玩家所在的区块（例如调用 `ChunkSource::getOrLoadChunk`），使 drop 能正常执行。

*适用版本：依赖 BDS 原版行为，未确认当前 BDS 是否已修复。未能从源码或文档中直接证实，仅供参考。*

## BDS 中玩家相关类（`SimulatedPlayer`、`ServerPlayer`、`Player` 等）的继承关系是怎样的？

继承链为 `SimulatedPlayer` → `ServerPlayer` → `Player` → `Mob` → `Actor`（`Player` 和 `Actor` 之间还有一层 `Mob`，`Mob` 是带 AI 逻辑的生物，例如 `aiStep`）。客户端对应的类是 `LocalPlayer`（`LocalPlayer` → `Player`）。

## C++ mod 中 `ContainerID` 是枚举吗？为什么背包等容器的 ID 不固定？

`ContainerID` 的定义是 `enum class ContainerID : schar`，但只为部分容器定义了固定值：`None=-1`、`Inventory=0`、`Offhand=119`、`Armor=120`、`SelectionSlots=122`、`PlayerOnlyUi=124`、`Registry=125`。其余打开的容器界面（如箱子、工作台等）会在 `First(1)` ~ `Last(100)` 范围内自增分配 ID，因此并不固定。

## C++ 代码 `player.getOrCreateUniqueID()` 返回 `ActorUniqueID`，这个 API 在哪里有文档？

这是 MC 原生的 C++ API，没有官方文档，需要在 LeviLamina 提供的头文件中查找：该函数声明于 `mc/world/actor/Actor.h`（`ActorUniqueID const& getOrCreateUniqueID() const;`），而 `Player` 继承自 `Actor`。平时可以直接在头文件中搜索，或借助 IDE 的自动补全功能查找。

## LeviLamina / LSE 中有没有让玩家丢弃（丢出）物品的方法？

C++ mod 可以直接调用 `Player::drop(ItemStack const& item, bool randomly)`。LSE 脚本没有原生的丢出物品接口，只能变通实现：先清除背包中的对应物品，再在玩家位置生成掉落物；或者使用第三方的 GMLIB-LegacyRemoteCallApi（通过 RemoteCall 导出了相关接口）。一般建议用 C++ mod 实现所需功能，再通过 LegacyRemoteCall 暴露给 JS 插件调用。

## LeviLamina C++ 插件中如何获取玩家 UUID 的字符串形式？

调用 `player.getUuid().asString()`。其中 `getUuid()` 返回 `mce::UUID const&`，再调用 `asString()` 即可转为字符串（`mce::UUID` 也支持显式转换 `std::string(uuid)`）。

## LeviLamina 中如何通过 xuid 获取玩家对象？直接调用 `Level::getPlayerByXuid` 报错/内存错误。

`getPlayerByXuid` 是 `Level` 的成员（虚）函数，而非静态函数，不能自行声明或构造 `Level`。应通过 LL 服务获取全局 `Level`：`ll::service::getLevel()` 返回 `optional_ref<Level>`，使用时需判空，例如：

```cpp
if (auto level = ll::service::getLevel()) {
    Player* p = level->getPlayerByXuid(xuid);
    if (p) {
        // ...
    }
}
```

*适用版本：所有版本*

## LeviLamina 插件中如何实现生存模式下的飞行（类似生存飞行插件）？

调用 LeviLamina 提供的 `Player::setAbility(AbilitiesIndex::MayFly, true)`（关闭时传入 `false`）。在当前实现中，`setAbility` 内部会自动同步 `Canfly` 标志，并向该玩家发送 `UpdateAbilitiesPacket` 和 `UpdateAdventureSettingsPacket`，无需手动发包。如果直接修改 `LayeredAbilities`，则需要自行发送 `UpdateAbilitiesPacket` 才能在客户端生效。LSE 中也有对应的封装。

## LeviLamina 里有没有类似 LL2 的 `giveItem` 给玩家物品的接口？用 `Player::add` 加物品后背包会不会自动刷新？

LeviLamina 不提供类似 LL2 的 `giveItem` 封装，直接使用 Mojang 自带的 API 即可。`Player::add(ItemStack&)` 虽然可用，但不会刷新客户端背包，添加后需要调用 `refreshInventory()`（`Mob` 上的 LL 扩展方法）来同步客户端。

更简单的做法是直接调用 LeviLamina 扩展的 `Player::addAndRefresh(ItemStack& item)`。该方法内部会在 `add` 后自动调用 `refreshInventory`，返回值表示物品是否全部给出（不反映刷新是否成功）。不建议照搬 LL2 的实现。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8 仍适用）*

## 写 native 隐身（vanish）mod 时，只拦截 `AddActor` 包为什么已经看见该玩家的人仍然能看到他？

拦截 `AddActor`（玩家对应 `AddPlayer`）包只能阻止后续的生成，已经加载了该玩家的客户端不会自动移除该实体。需要主动向这些玩家发送 `RemoveActorPacket` 才能立即将其隐藏。可以借助 iListenAttentively 提供的事件来减少手写 hook。

*未能从源码或文档中直接证实，仅供参考。*

## 在 LeviLamina mod 中如何获取实体的主手和副手物品？只找到了获取护甲的函数。

在当前版本的 LeviLamina 头文件中，获取主手物品使用虚函数 `Actor::getCarriedItem()`，获取副手物品使用 `Actor::getOffhandSlot()`，二者与 `getArmor` 一样定义在 `Actor` 类中；此外，`Mob` 类还提供了 `getAllHandEquipment()`，可一次性获取所有手持装备。查找时可在 `Actor.h` / `Mob.h` 中不区分大小写地搜索 `carried` / `offhand`。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 中如何给玩家播放声音？找不到能直接用的播放声音数据包怎么办？

简单的做法是调用 `Level`（`ILevel`）上的 `playSound` 系列函数，例如 `playSound(LevelSoundEvent, Vec3 const&, float volume, float pitch)` 或 `playSound(PlaySoundOptions const&)`。

如果只需播放给特定玩家，可以直接构造数据包并发送，例如 `PlaySoundPacket(...).sendTo(player);`（Packet 自带 `sendTo(Player const&)` 方法）。Packet 临时对象会按 RAII 机制自动析构，无需手动释放。也可以参考原版 `playsound` 指令的实现。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina 原生 mod 中，如何从服务端控制玩家快捷栏当前选中的格子（例如点击第 9 格后切到第 1 格）？

BDS 的 `Player` 类提供了 `setSelectedSlot(int slot)` 函数（返回对应格子的 `ItemStack const&`），可用于设置玩家当前选中的快捷栏格子，其头文件为 `mc/world/actor/player/Player.h`。由于选中格由服务端发包同步给客户端，因此可以通过 mod 实现该功能。

*适用版本：LeviLamina 当前版本*

## 开发 LeviLamina mod 时，如何在玩家进服时异步执行检查（如查询云黑名单）且不阻塞服务器，检查通过后再放行？

BDS 本身提供了异步进服回调机制。在最新版本中，该机制位于 `AsyncJoinTaskManager`（`ServerNetworkHandler::mAsyncJoinTaskManager`）：调用 `registerAsyncJoinCallback(callback)` 注册回调，回调参数为 `(NetworkIdentifier const&, PlayerAuthenticationInfo const&, SubClientId, std::shared_ptr<AsyncVerdictPromise>)`，由 `handleAsyncJoinCallbacks` 汇总结果，判定结果类型为 `AsyncJoinAllow` / `AsyncJoinDeny`。这些函数属于 `MCNAPI`，需要自行定位或补全。Script API 中与之对应的是 `AsyncPlayerJoinBeforeEvent`。另一种做法是拦截数据包：暂缓向玩家发送 `StartGamePacket`，拿到检查结果后再发送，若未通过则发送踢出包。

*适用版本：LeviLamina 当前版本*

## 开发 mod 时如何判断玩家是触屏还是键鼠，以决定发表单还是容器 UI？

不要根据操作系统判断，而应根据玩家当前的输入方式判断：`PlayerAuthInputPacket` 的负载（`PlayerAuthInputPacketPayload`）包含 `mInputMode` 字段（枚举 `InputMode`：`Mouse`=1、`Touch`=2、`GamePad`=3），可以通过监听或 hook 该数据包获取；登录时的 `ConnectionRequest` 中也带有 `currentInputMode`。键鼠（`Mouse`）发送容器界面，触屏（`Touch`）发送表单。注意玩家可以中途切换输入方式，因此应以最近一次收到的值为准。

## 玩家在背包里拖动或点击物品是由哪个数据包控制的？怎么知道操作的是哪个物品？

由 `ItemStackRequestPacket`（内含 `ItemStackRequestBatch`）控制。具体操作存放在 `ItemStackRequestAction` 中（包含 take/place/swap/drop 等多种 `ItemStackRequestActionType`），物品堆栈通过唯一的 `networkId` 区分。PC 端点击物品即会发包（物品从背包槽移至 `CURSOR` 光标槽），而手机端仅点击不会发包。如果不想自行解析数据包，可以使用 iListenAttentively 提供的 `PlayerRequestItemActionBeforeEvent`。

*适用版本：当前 BDS / LeviLamina 版本*

## 用 C++（LeviLamina mod）怎么给背包里指定物品设置自定义 lore？

获取到 `ItemStack` 后，调用 `item.setCustomLore(std::vector<std::string>{...})` 设置 lore，调用 `item.clearCustomLore()` 清除，调用 `getCustomLore()` 读取。具体可参考 LSE 的实现：<https://github.com/LiteLDev/LegacyScriptEngine/blob/develop/src/legacy/api/ItemAPI.cpp> 中的 `ItemClass::setLore`。修改完成后，需调用 `player.refreshInventory()` 刷新玩家背包，客户端才会显示出来。

*适用版本：当前 LeviLamina 版本*
