# LeviLamina 模组 API：数据、配置与多语言

## LeviLamina 中 `CompoundTag` 旧的 `getInt`/`getString` 等取值函数不能用（曾被标记为 deprecated），现在应该怎么读取 NBT 值？

用下标或 `at()` 访问（如 `tag["key"]` 或 `tag.at("key")`），获取 `CompoundTagVariant` 后再取值。维护者更推荐 `operator[]`，支持链式访问嵌套结构（如 `nbt["a"]["b"]["c"]`）。具体取值方式如下：数值类型用 `tag["key"].get<int>()` 或直接转换 `int{tag["key"]}`；字符串可直接转换为 `std::string const&`（或调用 `get_ref<std::string&>()`）；获取具体 Tag 类型用 `tag["key"].get<IntTag>()`、`get<CompoundTag>()` 或 `get<ListTag>()`；判断键是否存在用 `tag.contains("key")` 或 `contains("key", Tag::Type)`。写入时直接赋值即可，例如 `nbt["key"] = 1;`、`nbt["list"] = ListTag{1.0, 2.0};`。更多用法请参考 LeviLamina 仓库的测试代码 `src-test/server/TestNbt.cpp`。

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## 使用 LeviLamina 的配置 API（`ll::config::loadConfig` / `saveConfig`）时，配置结构体有什么要求？

配置结构体必须支持反射（普通聚合结构体即可），且必须包含一个整数类型的 `version` 字段（如 `int version = 1;`），否则不满足 `IsConfig` 约束，无法通过编译。`loadConfig` 会比对文件中的 `version` 与结构体默认值：若两者不一致或文件中缺失该字段，就会调用 updater（默认为 `defaultConfigUpdater`，即以当前结构体为基准合并文件中的旧值）并返回 `false`，调用方可据此重新调用 `saveConfig` 写回升级后的配置。如果不想保留 `version` 字段，只能基于 `ll::reflection::serialize`/`deserialize` 自行编写读写逻辑。

*适用版本：LeviLamina 0.11 及以上至当前 v26.60.8*

## LeviLamina 中旧 LL2 的 PlayerInfoAPI / namedb（玩家名与 xuid/uuid 对应数据库）在哪？能查询离线玩家、遍历全部玩家吗？

对应功能为 `ll::service::PlayerInfo`（头文件 `ll/api/service/PlayerInfo.h`），底层基于 leveldb 存储已知玩家的 UUID、XUID 与名称。可通过 `PlayerInfo::getInstance()` 获取实例：用 `fromUuid`、`fromXuid` 或 `fromName` 查询单个玩家（返回 `optional_ref<PlayerInfoEntry const>`，支持查询离线玩家）；用 `entries()` 返回的生成器遍历全部记录；用 `erase(uuid)` 删除记录。

脚本侧 LSE 可调用 `data.getAllPlayerInfo()` 获取全部玩家信息。

*适用版本：LeviLamina 0.9 及以上至当前版本*

## LeviLamina C++ mod 要保存玩家数据，有没有内置数据库？LiteLoaderBDS 时代自带的 MySQL 库（`session.h`）还在吗？要用 MySQL 怎么办？

LeviLamina 不再内置旧版 LiteLoaderBDS 的 MySQL/数据库封装（`session.h`）。简单的本地存储可使用自带的 `ll::data::KeyValueDB`（头文件 `ll/api/data/KeyValueDB.h`，基于 LevelDB）。如需关系型数据库，可在 mod 中通过 xmake（`add_requires`）自行引入 SQLite 或 MySQL 客户端等第三方库，并将对应的动态库随 mod 一并分发。只有当网站、QQ 机器人等外部程序也需要访问数据时，才有必要使用 MySQL 这类服务端数据库。

脚本侧 LSE 则自带数据库 API（`DBSession`，支持 SQLite 和 MySQL）。

*适用版本：LeviLamina 0.x 至当前版本*

## LeviLamina C++ 插件开发中，有没有类似 LLSE 那样读写 JSON 的 API？

LeviLamina 提供了配置文件 API（`ll/api/Config.h` 中的 `ll::config::loadConfig` / `saveConfig`），基于反射自动序列化，要求配置结构体包含整数类型的 `version` 字段。如果只是常规的 JSON 读写或数据存储，可直接使用 LeviLamina 依赖中自带的 `nlohmann::json` 库（`Config.h` 本身已包含 `nlohmann/json.hpp`）。

## LeviLamina 中如何获取物品的 NBT，以及如何从 NBT 构造物品？

导出 NBT：`ItemStack::save` 现在需要传入 `SaveContext`，例如：

```cpp
auto tag = item.save(*SaveContextFactory::createCloneSaveContext());
```

该函数返回 `std::unique_ptr<CompoundTag>`，所需头文件为 `mc/world/item/SaveContextFactory.h`。

从 NBT 构造物品：调用静态函数 `ItemStack::fromTag(CompoundTag const&)`（或带 `ILevel&` 参数的重载）。

BDS 原版已具备完整的 NBT 读写接口，不再需要 LL2 那种层层封装的 NBT API。以上方法自 `save` 需要 `SaveContext` 的 BDS 版本起适用。

## LeviLamina 源码中的 `src/ll/api/reflection/Dispatcher.h` 是做什么用的？

`ll::reflection::Dispatcher<Storage, Listener, CallInit>` 是观察者模式的封装，主要用于配置文件。将配置字段包装为 `Dispatcher` 后，每次对该字段赋值（包括反序列化读取配置时）都会调用 `listener.call(storage)`，从而在配置变更时自动执行相应逻辑；当 `CallInit=true` 时，构造期间也会调用一次。反射的序列化与反序列化对 `Dispatcher` 提供了专门支持。LeviLamina 自身的配置中就有以下用例：

```cpp
ll::reflection::Dispatcher<bool, ForceEnableCheatCommands> forceEnableCheatCommands = true;
```

*适用版本：LeviLamina 1.x 及以上*

## LeviLamina 的 API 用的是哪个 JSON 库？

使用 nlohmann json（LL 的配置 API `ll/api/Config.h` 默认使用 `nlohmann::ordered_json`）。此外，BDS 内部还包含 rapidjson 和 jsoncpp。

*适用版本：所有版本*

## LeviLamina 的 `ll::config` 读取带注释的 JSON（jsonc）配置文件后，重启服务器发现配置里的注释全部消失了，是不支持注释吗？

`ll::config` 基于 `nlohmann::ordered_json`。`loadConfig` 解析时会忽略注释（即可以正常读取带注释的文件），但不会保留注释。常见写法是在 `loadConfig` 返回 `false`（版本不同或需更新）时调用 `saveConfig` 回写，或每次加载后都保存；此时由 nlohmann `dump` 生成的文件便不再包含注释。如需保留注释，需要自行换用支持保留注释的 JSON/jsonc 库或其他配置格式（如 TOML），或者避免自动回写。

*适用版本：所有版本*

## LeviLamina 的反射/配置序列化中，可组合的 flag 枚举（如 `A|B`）被序列化成空字符串，怎么处理？

当前版本的 LeviLamina 反射已内置 flags 枚举支持：序列化时，若 `magic_enum` 将其识别为 flags 枚举，则会调用 `magic_enum::enum_flags_name` 输出 `"A|B"`，若名称为空则回退输出底层整数；反序列化时会同时尝试 `enum_cast` 与 `enum_flags_cast`，支持解析 `"A|B|C"` 格式的字符串。

关键在于让 `magic_enum` 将该枚举识别为 flags：请按照 `magic_enum` 文档特化 `magic_enum::customize::enum_range<YourEnum>`，并设置 `static constexpr bool is_flags = true`。

旧版本则需要自行编写 `format_as`，调用 `enum_flags_name` 并回退到 `enum_integer`。

*适用版本：LeviLamina 26.60.x；旧版需自行实现 `format_as`*

## mod 中按数字物品 ID 判断物品（如收纳袋）可靠吗？

不可靠，加载 Addons 后物品的数字 ID 可能会发生变化。应通过物品类型名来判断，例如 `item.getTypeName() == "minecraft:bundle"`，不过字符串比较会比 `short` 比较稍慢。

## 使用 `ll::config::loadConfig` 加载含 `std::vector<int>` 或 `std::map` 的配置结构体，修改 json 后读到的值仍为空，是反射不支持吗？

反射支持 `std::vector` 等容器（在 `Deserialization.h` 中走 ArrayLike 分支），也支持 `std::map` 等关联容器（走 Associative 分支），其 key 可以是字符串、enum（序列化为字符串），或是特化了 `ll::reflection::Serializer<T>::to_string` / `from_string` 的类型。

读到空值的真正原因是将 config 定义成了头文件中的 `static` 全局变量：头文件里的 `static` 变量在每个包含它的编译单元中都有一份独立副本，导致 `loadConfig` 写入的对象与其余文件读取的对象并不是同一个。应在头文件中用 `extern` 声明，并在单个 `.cpp` 文件中定义（或直接使用 `inline` 变量）。

修改 config 结构后请记得递增 `version`。存储自定义键值时，请使用 `std::map<std::string, std::string>` 等容器，不要把 json 当作 map 使用。

*适用版本：LeviLamina 0.10 及以上*

## 原生 mod 中如何通过存档数据读取离线玩家的背包、末影箱、位置等信息，以及玩家名？

1. 通过 `ll::service::getDBStorage()` 读取键 `"player_<uuid>"`（类别为 `DBHelpers::Category::All`），获取 `CompoundTag` 并取出其中的 `"ServerId"` 字符串。
2. 以该 serverId 为 key、类别设为 `DBHelpers::Category::Player`，从存档数据库中读出玩家 NBT（`getCompoundTag`），再手动解析其中的背包、末影箱、位置等字段。

该 NBT 中不包含玩家名，可调用 `ll::service::PlayerInfo::getInstance().fromUuid(uuid)` 获取 name 和 xuid。具体实现可参考 LSE 中的 `getPlayerNbt` / `setPlayerNbt`。

*适用版本：LeviLamina 当前版本*

## 在 LeviLamina C++ mod 中如何获取 `DBStorage` 对象，而不必自己 hook 函数去拿？

通过 Level 获取 `LevelStorage`：`ll::service::getLevel()->getLevelStorage()`。它在服务端的实际类型就是 `DBStorage`（`class DBStorage : public LevelStorage`），经 `static_cast<DBStorage&>(level.getLevelStorage())` 转换即可使用。不推荐依赖第三方库（如 GMLIB）通过 hook 缓存的 `DBStorage*`。

*适用版本：LeviLamina 1.x 及以上*

## 在 LeviLamina C++ mod 中，用 `std::format` 拼接 SNBT 字符串（如 `{Findable:0b,Items:[],id:Chest,isMovable:1b,x:8,y:66,z:-41}`）后调用 `CompoundTag::fromSnbt`，结果返回空，为什么？

在 `std::format` / `fmt::format` 中，大括号是占位符，字面量 `{` 和 `}` 必须转义为 `{{` 和 `}}`。未转义会导致拼出的 SNBT 不合法，使 `fromSnbt` 解析失败并返回空（`fromSnbt` 返回 optional/Expected，应检查结果）。

建议直接用原始字符串字面量 `R"(...)"` 编写 SNBT，或直接用 `CompoundTag` 的 API 按键值构造 NBT，不要用 format 拼接 SNBT。NBT 用法可参考 LeviLamina 仓库的 `src-test/server/TestNbt.cpp`。`toSnbt` 支持多种 `SnbtFormat` 输出选项（如 `PrettyFilePrint`、`Jsonify` 等）。

*适用版本：当前所有 LeviLamina 版本*

## 在 LeviLamina C++ mod 里，`ItemStack` 指针怎么转成 `ItemStackBase`？需要 `dynamic_cast` 吗？

`ItemStack` 公有继承自 `ItemStackBase`，子类转父类无需 `dynamic_cast`（BDS 也没有开启 RTTI）。解引用后直接作为 `ItemStackBase&` 使用即可（隐式向上转换），也可以显式写为 `static_cast<ItemStackBase&>(*item)`。如需复制物品，可调用 `ItemStack::clone() const`。

*适用版本：当前所有 LeviLamina 版本*

## 在 LeviLamina C++ 中如何优雅地将 NBT（`CompoundTag`）与 JSON 互相转换？

两者无法无损互转：JSON 不区分 byte、short、int、float 等数值类型，且 NBT 字符串可包含任意二进制数据，而 JSON 字符串对此有限制。

若不在意这些差异，可用 `toSnbt(SnbtFormat::Jsonify)` 输出兼容 JSON 的格式（键名加引号，类型信息保留在注释中），再用 JSON 库解析；JSON 无法表示的二进制字符串会转为带 `/*BASE64*/` 标记的 base64。反向转换可用 `CompoundTag::fromSnbt` 解析。

更推荐直接存储 NBT，需要可视化时使用 SNBT。

*适用版本：当前所有 LeviLamina 版本*

## 想往 BDS 存档的 LevelDB 中写入自定义数据（如地图数字水印）并且不被 BDS 清理，直接用 Node.js 通用 leveldb 库写入后数据消失，应该怎么做？

BDS 使用 Mojang 修改版 LevelDB（带专有压缩格式），通用 leveldb 库默认不支持，因此外部写入不可靠；BDS 本身并不会主动清理未知 key 的数据。在 mod 中可通过 `LevelStorage` 接口（`mc/world/level/storage/LevelStorage.h`）读写自定义 key：写入用 `saveData(std::string const& key, std::string&& data, DBHelpers::Category category)` 或 `saveData(key, CompoundTag const&, category)`，读取用 `loadData` 或 `getCompoundTag`。`DBHelpers::Category` 参数基本不影响实际存储，真正起作用的是 key。若仅用于添加水印，更稳妥的原版做法是给隐蔽位置的容器方块或生物命名，名称会保存在 NBT 中。

*适用版本：当前 LeviLamina 版本*
