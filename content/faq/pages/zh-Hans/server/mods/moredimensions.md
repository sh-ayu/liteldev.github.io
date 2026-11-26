# MoreDimensions

## MoreDimensions 创建的自定义维度能删除/卸载吗？想把某个维度当资源世界定期重置该怎么做？维度什么时候注册？

MoreDimensions 不提供删除或卸载维度的接口（维护者明确表示不提供存档层面的维度数据删除接口，交由存档编辑工具处理），LSE 脚本更无法做到。维度的注册信息记录在存档目录下的 `dimension_config.json` 中，区块等数据则存放在存档的 LevelDB（`db`）内。仅从代码中移除注册或删除配置文件，都不会清除已生成的数据；即便在运行时删除 key，保存后也会被重新写回。

维度注册时机：`CustomDimensionManager::addDimension` 和 `addSimpleDimension` 要求 Level 已经存在（否则会抛出 `std::runtime_error`）。官方测试代码是在 `ll::event::ServerStartedEvent` 中注册的，请勿放在 mod 的 load 阶段。

若要重置某个维度，只能离线操作：先停服并备份存档，再用支持 Bedrock LevelDB 的工具删除该维度的区块数据。注意，MC 的 LevelDB 是 Mojang 修改版（支持 zlib 压缩），值为 NBT，不能直接用原版 Google leveldb 读写。区块 key 格式为：4 字节 x（int32 LE）+ 4 字节 z +（非主世界时）4 字节维度 id + 1 字节记录类型 + 可选 1 字节子区块索引。可以借助 Amulet（`amulet.load_level`）等第三方存档工具，或自行编写 native 插件来处理。

此外，多维度的额外开销主要来自向玩家发送维度数据，维度越多，服务器越卡。生成器可选用原版的主世界、下界、末地、超平坦或虚空，也可以自行编写 C++ 生成器，但无法直接加载 addon 定义的自定义群系维度。

*适用版本：MoreDimensions 当前所有版本*

## MoreDimensions 有没有导出接口给 LSE（JS）脚本调用来注册/创建维度？文档在哪？

没有。MoreDimensions 仅提供 C++ API（`more_dimensions::CustomDimensionManager`），没有通过 RemoteCall 导出接口，LSE 也没有内置注册维度的接口，因此必须编写 C++ native mod 来调用。文档见 <https://github.com/LiteLDev/MoreDimensions/wiki>。就算导出接口，也只能方便地创建原版生成器类型的维度（虚空、超平坦、主世界、下界、末地）。如果不会写 C++，可以使用社区基于它开发的 JSON 配置型辅助 mod（如 `more-dimension-helper-json`）。

*适用版本：MoreDimensions 当前所有版本*

## LeviLamina 的多维度（MoreDimensions）怎么用？装上后能直接用指令创建新维度吗？有没有参考实现/现成的维度 mod？进入新维度和传送门怎么做？

MoreDimensions（<https://github.com/LiteLDev/MoreDimensions>）是一个前置库，本身不会添加维度，也没有提供创建维度的指令，需要由其他 mod 调用其 API。安装命令：`lip install github.com/LiteLDev/MoreDimensions`（当前版本要求 LeviLamina 26.60.7 及以上、26.61.0 以下，服务端和客户端均有构建）。

开发者用法：在自己的 native mod 中依赖 `more-dimensions`，待 Level 可用后（例如在 `ServerStartedEvent` 中）调用：

```cpp
more_dimensions::CustomDimensionManager::getInstance()
    .addSimpleDimension("myns:my_flat", 345, GeneratorType::Flat);
```

维度名必须采用 `namespace:name` 格式，且不能使用 `minecraft` 命名空间。原版生成器支持 Overworld、Flat、Nether、TheEnd 和 Void；自定义生成器则需继承 `Dimension` 并调用 `addDimension<D>(name, args...)`。文档见 [wiki](https://github.com/LiteLDev/MoreDimensions/wiki)，示例见仓库的 `src/test/TestCustomDimension.cpp`；Actions 中以 `-tests` 结尾的构建会创建 7 个测试维度，仅供测试。社区参考实现有 [more-dimension-helper](https://github.com/ye111566/more-dimension-helper) 及其 JSON 版（MineBBS 上的 `more-dimension-helper-json`，通过 JSON 配置创建维度，不支持热创建）。

进入维度：使用 LeviLamina 内置的 `tpdim` 命令，例如 `tpdim ~ ~ ~ <维度名>`。无法直接实现原版那样的传送门，但可以用 addon 注册传送门样式的方块，在玩家触发时执行传送命令。

*适用版本：MoreDimensions v0.14.0 及以上（addSimpleDimension）；当前 v0.16.0 / LeviLamina 26.60.x*

## LeviLamina 下能否在一个 BDS 里有多个世界（资源世界+生存世界、大厅+小游戏等）？有什么限制？

BDS 本身不支持多世界。在 LeviLamina 下，可以使用 MoreDimensions 在同一存档内添加自定义维度来近似实现（安装命令：`lip install github.com/LiteLDev/MoreDimensions`；它只是 API，需配合调用它的 mod 使用，如社区的 `more-dimension-helper-json`）。新维度可按主世界、下界、末地、超平坦或虚空生成。主要限制如下：

1. 无法删除已创建的维度；
2. 所有维度共用同一个存档、同一组行为包与资源包，无法为不同维度加载不同的材质包；
3. 所有维度都在同一服务器进程和主线程中运行，维度越多，性能压力越大。

如果需要隔离资源包或分担负载，更建议开启多个 BDS 实例（需配置不同端口，包括 IPv6 端口），并配合跨服传送与数据同步插件使用。

*适用版本：MoreDimensions 当前版本（v0.16.0）*

## 进入 MoreDimensions 自定义维度后怎么传送回主世界/在维度间传送？`tpdim` 还能用吗？

LeviLamina 内置了 `teleportdim` 命令（别名为 `tpdim`），可在任意维度（包括自定义维度）之间传送：

```text
tpdim <x y z> <维度> [convert]
tpdim <目标选择器> <x y z> <维度> [convert]
```

第一种形式用于传送自己，第二种用于传送指定目标。维度参数可填 `overworld`、`nether`、`the_end` 或自定义维度名；`convert`（默认为 `true`）会按照下界比例换算坐标。可在 LeviLamina 配置文件的 `modules.command.tpdimCommand` 项中开关该命令并设置权限（默认启用，权限为 `GameDirectors`）。返回主世界也可以使用原版命令 `execute in overworld run tp @s ~ ~ ~`。

*适用版本：LeviLamina 当前版本（26.60.x）*

## 在事件或数据中序列化维度信息时，应该存维度 id 还是维度名字？要考虑 MoreDimensions 的自定义维度。

应当存储维度名字。自定义维度的 id 并非由开发者指定，而是由 MoreDimensions 或游戏在注册时分配（当前版本虽会优先复用存档中已持久化的名字与 id 映射，但不保证在切换存档、调整注册顺序或修改配置后仍保持一致）。因此，持久化时应保存维度名字，使用时再通过 `VanillaDimensions::fromString(name)` 转换为 DimensionType，或用 `VanillaDimensions::toString(dimId)` 反查名字（MoreDimensions 的 `getDimensionIdFromName` 已弃用）。原版维度的 id 是固定的：0 为主世界、1 为下界、2 为末地。

*适用版本：MoreDimensions 当前版本（v0.16.0）*

## MoreDimensions 创建新维度时，地形生成器只能用 Mojang 内置的那几种吗？有没有预设模板？

MoreDimensions 只是前置库，不提供预设的维度模板或玩法。简单接口 `addSimpleDimension` 仅支持原版生成器类型（Overworld、Flat、Nether、TheEnd、Void）。若需自定义地形，必须自行编写 C++ 生成器（继承 `Dimension` 并通过 `addDimension<D>()` 注册），可参考仓库 `src/test/generator` 目录下的示例（如超平坦生成村庄的 `flat-gen-village`、自定义地形 `NxnBorderTerrain` 的 `generator-terrain`），或第三方地皮插件 PlotCraft 的 `DefaultGenerator`。至于自定义群系、山体等复杂地形，则需要自行研究噪声生成。

*适用版本：MoreDimensions 当前版本（v0.16.0）*

## MoreDimensions（多维度）能创建超平坦维度吗？

可以，超平坦是最容易实现的维度类型：

```cpp
CustomDimensionManager::getInstance().addSimpleDimension("myns:flat", 345, GeneratorType::Flat);
```

测试构建中的 `custom_dim:new_flat_type` 就是超平坦维度。注意，维度越多，服务器负担越大。

*适用版本：MoreDimensions v0.14.0 及以上*

## 用 MoreDimensions 创建的自定义维度能否自定义天空盒、或者让不同维度有不同的时间？

无法通过服务端实现。客户端会根据维度类型来渲染天空，服务端并不会下发天空材质，因此只能通过资源包修改天空。游戏时间则是全局统一的（`time` 命令没有维度选项）；理论上虽然可以向客户端伪造时间数据包，但服务端的刷怪等逻辑依然遵循真实时间，实际并不可行。

*未能从源码或文档中直接证实，仅供参考。*

## 在 MoreDimensions 创建的自定义维度中使用 `/locate` 会导致服务器假死（卡住），怎么解决？

自定义维度中没有对应的结构，而 BDS 的 `locate` 实现未处理这种情况，从而陷入死循环。解决方法是：禁止在非原版维度中使用 `/locate`（例如拦截该命令），或者自行实现结构查找逻辑。

*适用版本：LeviLamina 1.0.x（BDS 1.21.50 时报告，之后版本未确认）。未能从源码或文档中直接证实，仅供参考。*

## 按照 MoreDimensions wiki 的 SimpleExample 教程编写自定义维度 mod，xmake 构建失败，怎么办？

wiki 中的 SimpleExample 示例代码使用了 `EventBus`，却未包含对应的头文件，需补充 `#include "ll/api/event/EventBus.h"`。此外，MoreDimensions 从 0.14.0 版本起不再导出 `SimpleCustomDimension`，需要将 wiki 中的 `addDimension<more_dimensions::SimpleCustomDimension>("name", 345, GeneratorType::Flat)` 改为 `more_dimensions::CustomDimensionManager::getInstance().addSimpleDimension("name", 345, GeneratorType::Flat);`（可参考仓库中的 `src/test/TestCustomDimension.cpp`）。文档见 <https://github.com/LiteLDev/MoreDimensions/wiki>。

*适用版本：MoreDimensions 当前版本（0.16.0）及 wiki SimpleExample 现状*

## MoreDimensions（更多维度）暂未适配新版本，先停用插件等更新，已建造在额外维度里的建筑会丢失吗？需要注意什么？

不会丢失。维度数据保存在存档中，可以先停用插件，等更新后再重新安装。但请务必保留存档目录中的 MoreDimensions 维度配置文件 `worlds/<存档名>/dimension_config.json`（客户端为对应世界目录下的 `dimension_config.json`）。该文件记录了维度名与 ID 的对应关系，一旦丢失，重新启用插件时将无法对应原有维度。

*适用版本：当前所有版本（MoreDimensions 0.16.0）*
