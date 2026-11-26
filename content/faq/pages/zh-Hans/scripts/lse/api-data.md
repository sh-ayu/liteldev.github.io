# LegacyScriptEngine API：数据与文件

## LSE 中修改方块/方块实体 NBT 后调用 `setNbt` 没有效果（如箱子内容、展示框里地图的 `map_uuid`、讲台的 `powered_bit`），怎么正确修改？

1. 箱子、物品展示框等容器或方块实体的数据存放在方块实体（BlockEntity）中，与方块自身的 NBT 分离。应先通过 `bl.getBlockEntity()` 获取方块实体，用 `be.getNbt()` 修改后在方块实体上调用 `be.setNbt(nbt)`，而非 `block.setNbt`。示例：

    ```js
    let bl = mc.getBlock(x, y, z, 0);
    let be = bl.getBlockEntity();
    let a = be.getNbt();
    let b = a.getTag("Item");
    let c = b.getTag("tag");
    c.setLong("map_uuid", -14246406442712);
    b.setTag("tag", c);
    a.setTag("Item", b);
    be.setNbt(a);
    ```

2. 修改方块状态时需注意类型：`powered_bit` 等布尔类状态在 NBT 中为 Byte（`0b`/`1b`），应使用 `setByte('powered_bit', 1)` 而非 `setInt`，随后再调用 `mc.getBlock(pos).setNbt(nbt)`。

调试时可用 `nbt.toSNBT()` 打印并查看结构和类型。

*适用版本：当前所有 LSE 版本*

## LSE 中如何创建/处理 ByteArray 类型 NBT（如烟花的 `"FireworkFade":[B;...]`）？`new NbtByteArray(Uint8Array.from([15,7,8,...]))` 打印出来变成 ASCII 码（`[B;49b,53b,44b,...]`）怎么办？

这是 LSE 的实现问题：`NbtByteArray` 构造函数（以及 `set`）会将传入的缓冲区当作字符串（`describeUtf8`）逐字符写入，导致数组 `[15,7,8]` 被视为文本 `"15,7,8"` 并转为 ASCII 码。可改用 SNBT 在 C++ 层解析：通过 `NBT.parseSNBT("{FireworkFade:[B;15b,7b,8b]}")` 解析出 compound，再取出其中的字节数组写回。当前版本的 `parseSNBT` 基于 `CompoundTagVariant::parse`，也可直接解析 `"[B;15b,7b,8b]"` 并返回 `NbtByteArray`（旧版本仅支持 compound，需在外层包裹一层）。处理已有数据时，同样可以先用 `toSNBT()` 转为文本，修改后再用 `parseSNBT` 写回。

*适用版本：当前 LSE 版本（NbtByteArray 构造问题在 0.23.1 源码中仍存在）*

## LSE 中 `new JsonConfigFile("/plugins/xxx/config.json")` 这种以 `/` 开头的路径为什么找不到/写错位置？

LSE 不会对路径做特殊处理，而是原样交给文件系统。以 `/` 开头的是绝对路径，在 Windows 上代表当前盘符根目录（如 `C:\plugins\...`），而非 BDS 目录下的 `plugins`。因此应使用相对于 BDS 根目录（工作目录）的路径，如 `new JsonConfigFile("./plugins/xxx/config.json")`。

## LSE 中如何在玩家名和 UUID 之间互相查询？

由玩家名查 UUID 可用 `data.name2uuid(name)`。由 UUID 查玩家名时，LSE 没有提供 `data.uuid2name`，可用 `data.fromUuid(uuid)` 获取玩家信息对象 `{xuid, name, uuid}`，再读取其 `name` 属性（返回 `null` 表示查询失败）。同类接口还有 `data.name2xuid`、`data.xuid2name`、`data.xuid2uuid`、`data.fromName`、`data.fromXuid` 和 `data.getAllPlayerInfo`（`fromUuid` 等接口自 0.8.13 起新增）。

*适用版本：LSE 0.8.13 及以上*

## LSE 中如何构造表示整型数组的 NbtList？

使用 NbtInt 元素构造 NbtList，例如 `new NbtList([new NbtInt(1), new NbtInt(2)])`。数组中的元素必须是同一种 NBT 类型的对象，不能直接传入 JS 数字。

## LSE 中如何统计服务器所有玩家的 UUID 数量？

LSE 自带 `data.getAllPlayerInfo()`，会返回所有已记录玩家的 `{name, xuid, uuid}` 数组。可在控制台执行 `jsdebug` 进入调试模式，再运行 `data.getAllPlayerInfo().length`（仅包含服务器安装 LeviLamina 后进入过的玩家）。

若已安装 GMLib 及 GMLib-LegacyRemoteCallApi，也可调用第三方插件接口 `ll.imports("GMLIB_API", "getAllPlayerUuids")().length`（需安装对应的第三方插件）。

## LSE 中如何读取箱子等方块的 NBT（例如是否为大箱子、配对坐标）？用方块 NBT 读不到相关数据怎么办？NBT 能当 JSON 用吗？

箱子这类数据存放在方块实体（BlockActor）而非方块（Block）本身中，因此应读取方块实体的 NBT：先判断 `block.hasBlockEntity()`，再调用 `block.getBlockEntity().getNbt()`。调试时可用 `.toSNBT()` 转为字符串打印。

NBT 不是 JSON。存取时应使用 `toSNBT()` 和 `NBT.parseSNBT()`，不要调用 `toObject()` 后再转为 JSON 存储，否则会丢失类型信息。仅读取不写入时，用 `toObject` 较为方便；若追求性能，可使用二进制 NBT 序列化（`toBinaryNBT` / `NBT.parseBinaryNBT`），速度比解析 SNBT 更快。

另：BlockActor 并不继承自 Actor。

*适用版本：LSE 当前所有版本*

## LSE 插件里把物品 NBT 转成字符串（SNBT）后用 `JSON.parse()` 解析报错，怎么办？

SNBT 不等于 JSON，不能用 `JSON.parse` 解析 `nbt.toSNBT()` 的返回值。应直接使用 LSE 的 NBT 对象 API（如 NbtCompound 的 `comp.getTag(key)`、`comp.getData(key)`）进行读写；若确实需要普通 JS 对象，可调用 `comp.toObject()`。

*适用版本：当前所有 LSE 版本*

## LSE 文档里找不到 `File.readFrom` 等 API（文件系统页面链接失效），这些 API 还存在吗？

这些 API 依然存在，只是文档站迁移过。文件相关 API 现位于 <https://levimc.org/zh-Hans/LegacyScriptEngine/apis/SystemAPI/File/>。`File.readFrom(path[,isBinary])` 仍可正常使用（自 0.19.1 起支持 `isBinary` 参数）。

如发现文档遗漏，可向 LiteLDev/liteldev.github.io 仓库（`content/LegacyScriptEngine/pages`）提交 PR。

## LSE 有没有统一的配置文件接口？LeviLamina 提供默认的配置目录吗？

LSE 中通常使用 `new JsonConfigFile(path[,default])`，其中 `path` 由开发者自行决定，可选的 `default` 参数用于指定文件不存在时写入的默认内容。

在 C++ 层面，LeviLamina 为 mod 提供了 `config`、`data`、`lang` 三个默认目录（通过 `Mod::getConfigDir` / `getDataDir` / `getLangDir` 获取），但并没有完全由加载器托管的统一配置机制。

## LSE/LLSE 的 KVDB（kvdb 数据库）能否被两个服务端同时访问？

不能。LSE 的 `KVDatabase` 是基于 LevelDB 的本地数据库，而 LevelDB 同一时间只允许一个进程打开同一个数据库目录，不支持多个服务端同时访问。如需多服共享数据，请使用 MySQL 等网络数据库（LSE 的 `DBSession` 支持 MySQL）。

## 在 LSE 脚本插件里，怎样根据 UUID / XUID 获取离线玩家的信息（名字、UUID 等）？离线玩家的 NBT 又该怎么读？

可使用 `data` 模块的离线玩家查询接口：`data.fromUuid("<uuid>")` 和 `data.fromXuid("<xuid>")` 会返回 `{xuid, name, uuid}` 对象（找不到时返回空），例如 `data.fromUuid(uuid).name`、`data.fromXuid(xuid).uuid`。LSE 自带 API 不便读写离线玩家 NBT，可考虑使用社区插件 LRCA（通过 LegacyRemoteCall 导出扩展 API）提供的离线 NBT 接口。

*适用版本：当前版本（LRCA 为第三方插件）*

## 用 LSE 插件实现“命令木牌/命令方块点击执行命令”时，把命令写进方块实体 NBT 里会被清掉，应该怎么存储？

BDS 会清除方块实体和物品上无法识别的自定义 NBT，因此直接写进方块实体 NBT 无法持久化。推荐做法是：监听 `onUseItemOn`（或 `onBlockInteracted`）事件，将“坐标+维度+方块类型 -> 命令”的映射存入配置文件或数据库（启动时读入 map，定时或发生变更时保存）。玩家点击时按坐标查找并执行命令；若该位置的方块类型已变，说明原方块已被破坏，删除该记录即可。现成的 LSE 插件可参考 cmdanyblock：<https://www.minebbs.com/resources/cmdanyblock.3755/>

*适用版本：LSE 当前版本。未能从源码或文档中直接证实，仅供参考。*

## LSE 中通过 `let b = a.getTag("xxx")` 取得子 NBT，然后在 `setTimeout` 等延迟回调里使用 `b` 时数据已被销毁/崩溃，是什么原因？

这是 LSE NBT 绑定的生命周期问题：`getTag` 返回的子 NBT 对象仅持有指向父 NBT 内部数据的裸指针，而不持有父（根）NBT 的引用。一旦父对象 `a` 被垃圾回收，子对象 `b` 指向的数据也会随之销毁。规避方法：在脚本中持久持有根 NBT 对象（如存入全局变量），或先用 `toSNBT()` / `toObject()` 转为其他形式保存，需要时再用 `NBT.parseSNBT` 等方法转回。

*适用版本：当前所有版本（截至 LSE 0.23.1）*
