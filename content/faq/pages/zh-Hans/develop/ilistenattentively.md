# iListenAttentively

## iListenAttentively-LseExport（ila-lseexport）是什么？是 iListenAttentively 的扩展吗？提供哪些功能、支持哪些版本？

iListenAttentively-LseExport（<https://github.com/MiracleForest/iListenAttentively-LseExport>）是将 LeviLamina 事件系统导出供 LSE（LegacyScriptEngine）脚本插件使用的模组。它不仅服务于 iListenAttentively：凡是注册到 LeviLamina 事件总线上的事件（包括 LeviLamina 自带事件、iListenAttentively 事件以及其他模组的自定义事件），都可以在 LSE 中监听；如果事件实现了序列化和反序列化，还能拦截事件或修改事件参数（例如数据包发送事件），LSE 插件无需自己编写 Hook。

除事件外，它还提供：

- NativeAPI 类功能（通过 `getAddressFromSymbol` / `getAddressFromSignature` 获取地址、`hook` / `unhook` 原生函数、读写内存等，用于替代 LSE 已移除的 NativeAPI）
- 基于 Proxy 的 NBT 便捷封装
- `registerEvent` / `publish` 自定义事件
- `getAllEvent` 等查询接口

它的硬依赖只有 LeviLamina 和 LegacyRemoteCall，不强制依赖 iListenAttentively。当前最新版本 v0.5.0（2026-09-09）采用多版本内嵌二进制，内置了对 LeviLamina 1.0.0-rc.1、1.2.0-rc.1、1.9.7、26.10.5、26.20.0、26.32.0 的适配，运行时会根据当前 LeviLamina 版本选择不高于它的最接近版本。该项目基本没有文档，请参考仓库 README 和 `lib/iListenAttentively.d.ts` 类型声明。

*适用版本：iListenAttentively-LseExport v0.5.0（支持 LeviLamina 1.0.0-rc.1 及以上；官方声明适配至 26.20.x/26.30.x，更新的 LeviLamina 26.60.x 会回退使用 26.32.0 的适配，兼容性需自测）*

## LSE 脚本插件能否使用 iListenAttentively（ila）提供的事件（如玩家关闭容器、红石更新、方块被烧毁等 LSE 原生没有的事件）？需要依赖什么、事件名怎么写、能拿到参数吗、有文档吗？

可以。安装 iListenAttentively（`lip install github.com/LiteLDev/iListenAttentively`）和 iListenAttentively-LseExport（<https://github.com/MiracleForest/iListenAttentively-LseExport/releases>），在插件的 manifest 中声明依赖 `iListenAttentively-LseExport`，然后按如下方式调用：

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("事件名", event => { ... }, 优先级可选);
```

要点：

1. LseExport 本身只依赖 LeviLamina 和 LegacyRemoteCall（其 manifest 仅声明了 LegacyRemoteCall，`tooth.json` 中也不含 iListenAttentively），并不依赖 iListenAttentively，因此需自行确保已安装 iListenAttentively 本体（当前版本的 LSE 自身已依赖 iListenAttentively，使用 lip 安装 LSE 时会一并安装）。
2. 能否读取或修改事件参数，取决于提供该事件的模组是否实现了 `serialize`/`deserialize`：LeviLamina 和 iListenAttentively 的事件均已实现，因此可以读取并修改参数（修改后的字段会写回），`Cancellable` 事件还可以通过设置 `cancelled` 来拦截；未实现的事件则只能监听和拦截。此外，支持设置监听优先级。
3. 事件名为 C++ 类型名（LeviLamina 的事件 ID 取自去掉 inline 命名空间后的类型名），例如 `ila::mc::ExplosionBeforeEvent`、`ll::event::PlayerJoinEvent`。不确定时，可先调用 `iListenAttentively.getAllEvent()` 列出当前所有事件名进行确认。
4. 没有专门文档，请参考 `lib/iListenAttentively.d.ts` 类型声明和 iListenAttentively 源码头文件（<https://github.com/LiteLDev/iListenAttentively>）。

此外，LseExport 还提供了获取地址、hook 等函数，用于替代 LSE 已删除的 NativeAPI。

*适用版本：iListenAttentively 0.14.0 及以上；iListenAttentively-LseExport v0.5.0*

## LSE 中在 `onMobHurt` 里修改 `damage` 参数想削减 TNT 伤害但没效果，`source.id === "tnt"` 也判断不到，正确做法是什么？

1. LSE 的 `onMobHurt` 回调只能通过 `return false` 拦截事件，修改回调参数不会生效；如需修改伤害等参数，需借助 iListenAttentively（ila）的事件。
2. 判断实体类型应使用 `entity.type`（命名空间 ID，如 `"minecraft:tnt"`），而 `entity.id` 是实体类型的枚举数字。
3. 安装 iListenAttentively（<https://github.com/LiteLDev/iListenAttentively>）和 iListenAttentively-LseExport（<https://github.com/MiracleForest/iListenAttentively-LseExport>），在插件 manifest 中声明依赖 `iListenAttentively-LseExport`，然后按如下方式处理：

```js
/** @type {import("iListenAttentively")} */
const iListenAttentively = require("./iListenAttentively-LseExport/lib/iListenAttentively.js");
iListenAttentively.emplaceListener("ila::mc::ExplosionBeforeEvent", event => {
  if (mc.getEntity(event.sourceId)?.type == "minecraft:tnt") {
    event.damageScaling = event.damageScaling * 0.25;
  }
});
```

`mc.getEntity` 需要传入数字类型的 ID。ila 没有文档，具体字段可查看 ila 源码 `ExplosionEvent.cpp` 中的 `serialize` 实现，或在 VSCode 中打开 `lib` 目录下的 `.d.ts` 声明文件以获取代码补全。

*适用版本：iListenAttentively 0.14.0 及以上（配合 iListenAttentively-LseExport）；LSE 当前版本*

## LSE 中怎么让模拟玩家被创建时不显示“XXX 加入了游戏”？

LSE 原生 API 无法实现，解决思路是拦截服务器发出的加入消息 `TextPacket`。可以让插件依赖 iListenAttentively 和 iListenAttentively-LseExport，利用 ila 的发包事件（`SendPacketBeforeEvent`，支持拦截）在发送前判断并拦截对应的 `TextPacket`。

除了通用的发包事件外，ila 还会按包类型分别发布事件，事件名形如 `ila::mc::SendPacketBeforeEvent<class TextPacket>`，因此可以只监听 `TextPacket`；实际事件名请调用 `iListenAttentively.getAllEvent()` 确认。

注意，该事件在脚本侧仅将 packet 作为原生对象指针暴露，若要判断包内容（例如是否为某玩家的加入消息），需借助 LseExport 的内存读写或原生调用接口。

*适用版本：LeviLamina + iListenAttentively + iListenAttentively-LseExport；LiteLoaderBDS 旧版做法已不适用。未能从源码或文档中直接证实，仅供参考。*

## LSE 中玩家编辑告示牌对应哪个事件？`onBlockInteracted` 能用吗？

`onBlockInteracted` 是方块交互事件，不是告示牌编辑事件。LSE 目前没有专门的告示牌编辑事件；iListenAttentively 提供了 `PlayerEditSignBeforeEvent` / `PlayerEditSignAfterEvent`（C++ 中为 `ila::mc::PlayerEditSignBeforeEvent`，Before 事件可拦截，支持读取和修改 `pos`、`text`，`side` 表示正反面），源码见 <https://github.com/LiteLDev/iListenAttentively/blob/main/src/ila/event/world/actor/player/PlayerEditSignEvent.cpp>。LSE 脚本可通过 iListenAttentively-LseExport 使用该事件。关于新游戏内容的事件，也欢迎向 LSE 提交 PR。

*适用版本：iListenAttentively 0.14.0 及以上（LiteLDev 仓库）；LSE 当前版本*

## LSE 插件中如何拦截末影人搬运方块？C++ mod 如何使用 iListenAttentively（ila）事件库？

LSE：现已提供原生事件 `onEndermanTakeBlock`（回调签名为 `function(entity, block, pos)`，返回 `false` 即可拦截；自 LSE 0.11.3 起提供，当前版本内部基于 ila 的 `MobTakeBlockBeforeEvent` 实现），直接使用即可。

C++ mod：使用 iListenAttentively 的 `ila::mc::MobTakeBlockBeforeEvent`（可拦截）。在 `xmake.lua` 中添加：

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*")
```

并在 target 中添加 `add_packages("ilistenattentively")`，然后通过 `ll::event::EventBus::getInstance().emplaceListener<ila::mc::MobTakeBlockBeforeEvent>(...)` 监听。服务端需安装 iListenAttentively（`lip install github.com/LiteLDev/iListenAttentively`），版本号请根据当前 LeviLamina 版本选择对应的 ila 版本。

*适用版本：LSE 0.11.3 及以上（`onEndermanTakeBlock`）；iListenAttentively 0.14.0 及以上，当前为 0.18.0（对应 LeviLamina 26.60.\*）*

## LSE 插件用 `onDestroyBlock` 拦截破坏箱子时，大箱子会被拆成两半，放置时也无法拦截大箱子合并，有没有对应事件？

iListenAttentively 提供了箱子合并事件 `ChestPairWithBeforeEvent` / `ChestPairWithAfterEvent`（C++ 中为 `ila::mc::ChestPairWithBeforeEvent`，中间的 `world`/`level`/`block`/`actor` 均为 inline 命名空间，可省略），可在 Before 事件中拦截箱子合并。LSE 侧可通过 iListenAttentively-LseExport 监听；如果不确定事件名，可先调用 `iListenAttentively.getAllEvent()` 查看实际名称。

*适用版本：iListenAttentively 0.14.0 及以上（LiteLDev 仓库）*

## LSE 无法直接拦截实体死亡事件，怎么实现阻止实体死亡？

LSE 的 `onMobDie` 不可拦截。可以改用 iListenAttentively 的血量变化事件 `MobHealthChangeBeforeEvent`（`ila::mc::MobHealthChangeBeforeEvent`，配合 iListenAttentively-LseExport 在脚本中使用）：当 `newValue` 小于等于 0 时，设置 `cancelled` 拦截，或将 `newValue` 改为 0.1 等正数（该事件实现了反序列化，修改会写回）。

*适用版本：iListenAttentively 0.14.0 及以上（配合 iListenAttentively-LseExport）*

## LSE（LegacyScriptEngine）插件有没有办法监听玩家发送的数据包？

LSE 本身没有数据包监听接口，但可以借助 iListenAttentively（ila）和 iListenAttentively-LseExport 实现。ila 提供了收发包事件（如 `ila::mc::ReceivePacketBeforeEvent` / `ReceivePacketAfterEvent`、`SendPacketBeforeEvent` / `SendPacketAfterEvent` 等，ila 的许多事件本身就是基于数据包实现的），并通过 LseExport 导出给 LSE 使用。

此外，ila 还按包类型分别发布事件（事件名形如 `ila::mc::ReceivePacketBeforeEvent<class TextPacket>`），支持只监听特定类型的包，具体名称可通过 `iListenAttentively.getAllEvent()` 查看。注意，脚本侧拿到的 packet 是原生对象指针。

ila 没有单独的文档，“头文件即文档”。仓库地址：<https://github.com/LiteLDev/iListenAttentively>（0.14.0 之前的旧版本位于 <https://github.com/MiracleForest/iListenAttentively-Release/releases>）。

*适用版本：iListenAttentively 0.14.0 及以上（配合 iListenAttentively-LseExport）*

## LeviLamina C++ mod 如何监听玩家丢弃物品事件？LeviLamina 的 API 和源码里都找不到，需要自己 hook 吗？

LeviLamina 本体没有该事件，但无需自己 hook，直接使用 iListenAttentively（ila，LiteLDev 官方事件扩展库，<https://github.com/LiteLDev/iListenAttentively>）提供的 `ila::mc::PlayerDropItemBeforeEvent`（可拦截）和 `PlayerDropItemAfterEvent` 即可。在 xmake 中添加 levimc-repo 后，加入 `add_requires("ilistenattentively")`（版本需与 LeviLamina 对应，当前为 `0.18.*`）。

*适用版本：iListenAttentively 0.14.0 及以上；当前 0.18.0 对应 LeviLamina 26.60.\**

## iListenAttentively 的 JS 封装里，给 NBT 赋值能不能直接写 `nbt[key] = 值`，而不用 `nbt.setString` 之类的方法？数字会被转成哪种 NBT 类型？

可以。iListenAttentively-LseExport 的 JS 封装（`lib/iListenAttentively.js`）为 NBT 套了一层 Proxy，支持直接写 `nbt[key] = "字符串"` 并自动转换类型；也可以直接赋值为 object（转为 `NbtCompound`）或数组（转为 `NbtList`），列表则可通过 `nbt[数字下标]` 访问。

类型转换规则如下：整数 number 转为 Int，带小数的 number 转为 Float，boolean 转为 Byte，bigint 转为 Long，string 转为 String。由于 JS 的 number 无法区分 byte、short 和 int，若需要 Short、Double 等其他类型，必须使用对应的 NBT 类显式构造。

*适用版本：iListenAttentively-LseExport 当前版本（v0.5.0）*

## 在 LSE JS 里通过 iListenAttentively（ILA）监听事件时，直接打印 `event` 只显示 `NbtClass`，怎么查看一个事件里包含哪些字段（NBT 内容）？

回调收到的 `event` 是 NBT 对象（`NbtCompound`，由 iListenAttentively-LseExport 的 lib 封装了一层 Proxy）。调用其 `toSNBT()` 方法将内容转为 SNBT 字符串后再打印即可，例如 `logger.info(event.toSNBT())`。

*适用版本：当前所有版本（通过 iListenAttentively-LseExport 在 LSE 中监听 ILA/LL 事件）*

## 在 LSE 中用 iListenAttentively-LseExport 监听事件时，类型声明 `.d.ts` 里事件名只是 `string`，去哪里找可监听的事件名列表？

事件名之所以定义为 `string`，是因为任何 native（C++）mod 注册到 LeviLamina EventBus 的事件都能按名称监听，无法在类型声明中穷举。可以在脚本中调用 `iListenAttentively.getAllEvent()` 获取当前所有已注册的事件（包含 `modName` 与 `eventName`），并用 `getAllEventAlias()`、`getEventAlias()` 或 `getEventName()` 查询别名。

事件别名由 LseExport 在启动时自动生成：ILA 事件可使用 `ila::mc::<事件类名>`（或带部分命名空间）的简写，LL 自带事件可使用 `ll::event::<事件类名>`（如 `"ll::event::PlayerJoinEvent"`）。此外，`lib/events` 目录下也附带了 LeviLamina、LeviAntiCheat 等事件的 `.d.ts` 声明文件。

LseExport 本身只依赖 LeviLamina 和 LegacyRemoteCall，不强制依赖 ILA；如需使用 ILA 事件，则需同时安装 ILA。

*适用版本：iListenAttentively-LseExport 0.5.0 及以上*

## 在 LSE 的 JS 插件里监听 iListenAttentively（ILA）的事件，想拦截事件时在回调里 `return false` 没有效果，应该怎么拦截？怎么知道哪些事件能拦截？

ILA 事件不能通过在回调中返回 `false` 来拦截。回调收到的 `event` 本质上是 NBT 对象，可取消的事件带有 `cancelled` 字段，将其设为 `true` 即可拦截：`event["cancelled"] = true;`（无需 `return`）。

只有 C++ 侧继承了 `Cancellable` 的事件（通常是 `xxxBeforeEvent`）才能拦截，After 事件或未实现取消机制的事件即使设置了该字段也无效。要确认事件能否拦截，可以查看 ILA 源码中对应事件的头文件是否继承了 `ll::event::Cancellable`，或打印 `event.toSNBT()` 检查是否包含 `cancelled` 字段。

*适用版本：当前版本（通过 iListenAttentively-LseExport 使用 ILA 事件）*

## 有没有监听方块被火焰烧毁的事件？iListenAttentively 是否支持？

支持。iListenAttentively 提供了 `FireTryBurnBlock` 事件，包括 `FireTryBurnBlockBeforeEvent`（可取消，取消后火不会在该位置燃烧）和 `FireTryBurnBlockAfterEvent`，均带有 `pos` 字段。注意，该事件挂在 `FireBlock::isValidFireLocation` 上，在“尝试燃烧”时触发，此时方块尚未被实际烧毁。可用它替代监听 `onBlockChanged` 的做法。在 LSE 中通过 LseExport 可使用别名 `ila::mc::FireTryBurnBlockBeforeEvent` 监听。

*适用版本：iListenAttentively 当前版本（0.18.0）*

## 其他插件（如 LSE 插件、机器人转发）怎么读取玩家死亡消息，包括被别的插件修改过的死亡消息？

可以使用 iListenAttentively 提供的死亡消息事件：`DeathMessageBeforeEvent`（可取消，并可修改 `result`）和 `DeathMessageAfterEvent`。事件的 NBT 中包含 `sourceUniqueId`、`cause` 以及 `result{key, params}`（死亡消息的翻译键和参数）。如果其他插件仅修改了死亡返回的消息而未改动原版死亡事件，要读取最终消息应监听 After 事件。在 LSE 中通过 iListenAttentively-LseExport 可使用别名 `ila::mc::DeathMessageAfterEvent` 监听。

*适用版本：iListenAttentively 当前版本（0.18.0）*

## 依赖 iListenAttentively 事件的 LSE 脚本插件（如 ShoppingMall、iLand）装上后不生效，该怎么办？

LSE 脚本插件要使用 iListenAttentively 的事件，除了安装 iListenAttentively 本体外，还必须安装 ILA 的 LSE 导出模块 iListenAttentively-LseExport。请从 <https://github.com/MiracleForest/iListenAttentively-LseExport/releases> 下载（无法访问 GitHub 时可使用镜像），解压到 `plugins/iListenAttentively-LseExport/`。该模块依赖 LeviLamina 与 LegacyRemoteCall。

注意，iListenAttentively 本体版本需与 LeviLamina 匹配（当前 ILA 0.18.0 对应 LeviLamina 26.60.*），可通过 `lip install github.com/LiteLDev/iListenAttentively` 安装。虽然 LSE 自 0.21.2 起自身依赖 ILA，但脚本若要直接使用 ILA 事件，仍需安装 LseExport。

## 如何在 LeviLamina C++ mod（xmake 项目）中引入 iListenAttentively（ILA）事件库作为依赖？

ILA 包现已收录于 LiteLDev 的 xmake-repo（即项目模板默认添加的 levimc-repo）。请在 `xmake.lua` 中添加依赖：

```lua
add_repositories("levimc-repo https://github.com/LiteLDev/xmake-repo.git")
add_requires("ilistenattentively 0.18.*", {configs = {target_type = get_config("target_type")}})
```

随后在 target 中调用 `add_packages("ilistenattentively")`。ILA 的版本必须与所用的 LeviLamina 匹配（例如 ILA `0.18.*` 对应 LeviLamina 26.60.*）。配置完成后，执行 `xmake project -y -k compile_commands` 生成代码补全信息。

此外，别忘了在 mod 的 `manifest.json` 的 `dependencies` 字段中声明 `{"name": "iListenAttentively"}`，以确保正确的加载顺序。

*适用版本：iListenAttentively 0.14.0 及以上，当前 0.18.0 / LeviLamina 26.60.\**

## iListenAttentively 的 LSE 导出插件（iListenAttentively-LseExport）很久没更新，还能用吗？

可以继续使用。LseExport 无需随 LeviLamina 版本频繁更新：它内置了针对多个 LeviLamina 版本编译的二进制文件，启动时会根据当前加载器版本自动选择最合适的一份，并通过 EventBus 按名称动态导出事件。当前最新版本为 v0.5.0（仓库仍在维护，2026-11 有提交）。

*适用版本：iListenAttentively-LseExport 0.5.0 及以上*

## iListenAttentively（ILA）为什么没有玩家权限变动事件（`PlayerChangePermissions`）？还能加回来吗？

ILA 在 0.3.0 版本（适配 LeviLamina 1.1.0-rc.1 / BDS 1.21.60）中移除了 `PlayerChangePermissions`（玩家权限变动）事件，且无法恢复，至今最新版 ILA 仍无此事件。原因是 BDS 1.21.60 内联了相关函数，原有的函数调用变成了直接赋值，导致没有可供 hook 的目标函数。一般来说，BDS 每次更新都可能因函数内联而丢失部分符号，依赖这些函数的事件或 API 也会随之移除。

如果只需监听玩家命令权限等级（`CommandPermissionLevel`）的变化，可以改用 LeviLamina 自带的 `ll::event::PlayerChangePermEvent`（底层 hook `Player::setCommandPermissions`，支持取消，可通过 `newPerm()` 获取新等级）。

*适用版本：iListenAttentively 0.3.0 及以上（当前最新 0.18.0 仍无此事件）*
