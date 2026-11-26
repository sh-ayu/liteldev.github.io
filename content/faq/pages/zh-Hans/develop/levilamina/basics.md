# 开发 LeviLamina 模组：综合问题

## 服务端命令和客户端命令的区别

- 服务端命令由服务端注册，可由服务端自身以及同一服务端内的其他玩家执行。
- 客户端命令完全由客户端自行处理，只能由客户端自身执行，其他玩家和服务端不知道该命令的存在。

当 LeviLamina 运行在 **Bedrock Dedicated Server**（下文简称 BDS）上时，模组只能注册服务端命令。  
当 Minecraft 处于**本地世界**时，本质上是在客户端内部运行了一个 BDS，因此既可以注册服务端命令，也可以注册客户端命令。  
当 Minecraft 处于**多人游戏**中时，模组只能注册客户端命令。  
可以通过以下代码获取服务端和客户端的 CommandRegistrar 来注册命令：
```cpp
ll::command::CommandRegistrar::getInstance(false); // 服务端
ll::command::CommandRegistrar::getInstance(true); // 客户端
```

## 在模组的`enable()`方法中注册命令，服务端（BDS）成功客户端失败

这是因为服务端（BDS）和客户端启用模组的时机不同：  
- 服务端会在服务器初始化完成（世界已加载完成）时启用所有模组。
- 客户端会在游戏启动完成（主界面窗口出现）时启用所有模组。
因此在客户端的 enable() 方法中注册命令（无论是客户端命令还是服务端命令）都会失败。  
解决方法是：监听 `ServerCommandRegisterEvent` 再注册服务端命令，监听 `ClientCommandRegisterEvent` 再注册客户端命令。

## 模组调用MCAPI（比如`Player::disconnect()`）时，出现ACCESS VIOLATION异常

请检查调用 MCAPI 的代码是否运行在 `MC_SERVER` 线程上。受 Minecraft 游戏设计限制，绝大多数服务端侧的 MCAPI 只能在 `MC_SERVER` 线程中调用。

## LeviLamina 有没有类似 Bukkit Javadoc 那样的 C++ API 文档？Minecraft 本身的类有文档吗？

有。由头文件自动生成的 Doxygen C++ 参考位于 <https://levimc.org/LeviLamina/api/>；带说明和示例的 LeviLamina API 参考位于 <https://levimc.org/zh-Hans/LeviLamina/api_reference/>。Minecraft 原版类（`mc/` 下的头文件）没有官方文档，需要自行阅读头文件。LSE 的脚本 API 文档是手写的，形式有所不同。

## 能否用 LeviLamina native mod 注册自定义物品、方块、实体/生物？LL 有现成接口吗？

可以，但 LeviLamina 没有提供高层的物品、方块或生物注册封装。它主要将 MC 自身的函数暴露出来，开发者需要按原版流程自行注册。物品可手动构造并注册，例如：

```cpp
SharedPtr<Item> item = SharedPtr<Item>::make("my_mod:managed_item", ++registry->mMaxItemID);
registry->registerItem(item);
```

（`ItemRegistry::registerItem` 与 `Item(std::string const&, short)` 构造函数均为 `MCAPI`，有用户在 1.9.2 实测可行。）方块可参考 LL 已实现的 `BlockDefinitionGroup::registerDataDrivenBlock`。只要注册正确，客户端一般不会出问题；不提供资源包也不会报错（只是没有材质），需要显示纹理时再配合资源包即可。

添加生物/实体建议直接使用原版 addon（行为包+资源包），纯服务端即可实现；只有 addon 无法实现的功能，才需要自行逆向原版实现并通过 hook 或调用 MC 函数来完成。

*适用版本：LeviLamina 当前版本（26.60.x），服务端*

## BDS 官方提供的 PDB 里有结构体信息和 RTTI 吗？

没有。一般的 PDB 包含符号表、结构体和 RTTI 等信息，但 BDS 发布的 PDB 剔除了结构体和 RTTI，只保留了符号表，因此结构体布局需要通过逆向获得。LeviLamina 头文件中有大量 `mUnkxxxx`（`::ll::UntypedStorage<对齐, 大小>`）成员，正是因为其布局靠逆向得出、成员名未知。

*适用版本：当前 BDS 发布版。未能从源码或文档中直接证实，仅供参考。*

## GitHub 上的 OEOTYAN/BedrockServerClientInterface 是做什么的？

它是 bsci 库，用于从服务端在客户端上绘制几何图形（如线、盒子、圆、球等），可替代旧的 ParticleAPI。用法如下：

1. 在 `xmake.lua` 中添加 `add_repositories("OTOTYAN https://github.com/OEOTYAN/xmake-repo.git")` 和 `add_requires("bsci")`。
2. `#include <bsci/GeometryGroup.h>`。
3. 使用 `bsci::GeometryGroup::createDefault()` 创建实例后，调用 `line`/`box`/`circle`/`sphere` 进行绘制，调用 `remove` 移除图形。

*适用版本：当前版本（项目仍在维护）*

## LeviLamina 的 native（原生）模组、LSE 插件和 addon 有什么区别？想开发应该学什么？

native 模组基于 LeviLamina 用 C++ 编写，直接 hook BDS，能力接近 Java 版的 Fabric 模组，因此称为“模组”；通过 LegacyScriptEngine（LSE）用 JS/Lua/Python 编写的称为“插件”，入门简单，但功能受限于 LSE 提供的 API；addon（行为包/资源包及 Script API）是 Minecraft 官方自带的扩展方式，原版 BDS 只能使用 addon/SAPI。C++ 代码写不好容易导致崩服，新手可以先从 LSE 的 JS 入手。

## 只在自己客户端装了 LeviLamina 模组，进入别人的服务器还能用吗？

这取决于模组的实现方式和调用的函数。LeviLamina 的 MC 头文件分为服务端专用、客户端专用和双端共用三部分。只要模组在联机时不依赖服务端专用函数（即纯客户端模组），就可以在进入服务器时使用。例如，某些回放类客户端模组虽然也 hook 了服务端函数，但进服时不会执行这些代码，因此仍可在服务器中使用。请注意，“仅安装在客户端”的模组不等于“纯客户端”模组。

*适用版本：LeviLamina 客户端版（经 LeviLauncher 加载）*

## 是否任何编译型语言（如 Kotlin/Native、易语言）编译出的 dll 都可以直接作为 LeviLamina 插件？

不行。LeviLamina 的 API 是包含大量模板的 C++ 接口。其他语言需要通过 C FFI 互操作，并借助一层类似 LegacyScriptEngine 的兼容层来获取 API 和事件；而 LL 的模板代码很难用 C 封装，最多只能封装 MC 部分。目前没有便捷的非 C++ native 方案。若想用非 C++ 语言开发，建议使用 LSE（JS/Lua/Python/NodeJS）。

## 能否在 BDS（LeviLamina）上添加自定义附魔（新的附魔效果）？行为包或修改 NBT 附魔 id 能实现吗？

附魔是硬编码的，不支持通过行为包添加；将 NBT 中的附魔 id 改为非原版编号也无法被识别。自定义附魔只能通过 native（C++ mod）实现，而且仅在服务端注册新附魔客户端并不会识别，还需要自行处理收发包，并自行实现铁砧和附魔台的 GUI。第三方库 GMLib 中带“允许非原版”选项的接口，只是为物品添加原版附魔并允许突破最大附魔等级，并非添加自定义附魔。

*适用版本：当前所有版本（取决于 BDS 原版实现）。未能从源码或文档中直接证实，仅供参考。*

## 通过 LeviLauncher 使用的客户端 mod 能用什么语言开发？LeviLamina 客户端有相机等客户端类的头文件吗？

客户端 mod 基于 LeviLamina（client）使用 C++ 开发。当前 LeviLamina 已包含大量客户端相关类，如 `src/mc/client/camera/`、`src-client/mc/client/game/ClientInstance.h`、`src-client/mc/client/gui/controls/renderers/HudCameraRenderer.h` 等，基本已覆盖常用的客户端类。

*适用版本：LeviLamina 客户端版（2026 年 3 月之后的版本）*

## 开发 LeviLamina mod 时想用的 MC 函数在头文件里被标记为 `MCNAPI`（not public/未导出），编译链接时报缺符号或 deprecated，怎么办？

出于 Mojang 方面的安全要求，LeviLamina 采用了符号白名单机制，只开放已有 mod 用到的符号（自 26.60 起白名单进一步缩减，必须精确到每个符号，不再整类加白；成员变量未删）。头文件中标记为 `MCNAPI` 的函数会提示“`This API is not available. Open an issue if you need it.`”。解决办法：前往 <https://github.com/LiteLDev/mcapi-requests> 提交 issue，直接贴出编译或链接阶段缺失的函数（符号）列表，并附上 mod 仓库或下载链接，以证明确实在编写 LL mod（主要用于拦截外挂开发者）。正当用途的申请都会通过；申请内容简短即可，请勿使用 AI 生成长篇文案。在新版本导出符号之前，只能自行通过特征码（signature scan）、指针偏移、写死 RVA 等方式定位，虚函数则可从虚表获取。此外请注意，`BlockSource` 不可拷贝，应使用引用，例如 `auto& region = ...getDimensionBlockSource();`。

*适用版本：LeviLamina 1.4 及以上，尤其 26.60.x*

## LeviLamina 新版本（适配新 BDS）还没正式发布时，C++ mod 开发者怎样提前适配？

将 mod 项目 `xmake.lua` 中 `levilamina` 依赖的版本号改为 LeviLamina 主分支（`main`）最新的完整 40 位 commit hash（短 hash 会被 xmake 当作分支名而导致拉取失败），例如 `add_requires("levilamina <40位commit-hash>", {configs = {target_type = get_config("target_type")}})`，也可以直接写分支名 `levilamina main`，即可基于开发中的头文件开始适配。此时 xmake 会提示 `Unknown version` 并使用 `main` 分支的依赖配置，这属于正常现象，`bdslibrary` 等依赖可能需要自行处理。注意模板注释中的 `levilamina develop` 已不可用（LeviLamina 仓库现已无 `develop` 分支）。正式发布前，若在编译或链接时遇到符号缺失，可向维护者反馈。

## BDS/LeviLamina 升级后，原本能用的 C++ 原生 mod 报内存访问错误，怎么办？

C++ 原生 mod 与 BDS、LeviLamina 版本强绑定，升级版本后若未适配，就可能出现内存访问错误或崩溃。必须使用对应版本的 LeviLamina SDK 重新编译后才能使用；你可以等待作者发布适配版本，或自行获取源码针对新版本重新编译。

## LeviLamina 客户端（LLC）的 mod 能跨游戏版本兼容吗？相比自己写 hook 的优势在哪？

Mojang 每个版本都会改动代码，除非 mod 用到的类均未变动，否则一般都需要针对新版本适配并重新编译（设计良好的 mod 迁移成本较低）。LL 的优势在于提供了大量符号对应的地址、完整的类成员头文件（`src/mc` 下的 MC 头文件）以及各类封装工具（Hook、事件、配置等），省去了自行逆向补齐这些内容的工作。

## LeviLamina 的 C++（DLL）原生插件能跨 BDS 版本使用吗？为什么每次 BDS 更新原生插件基本都要更新？

LeviLamina 原生 mod 会直接调用或 Hook BDS 内部函数。BDS 更新后，函数地址、签名和结构体布局经常改变，因此插件通常需要针对新版本重新编译。只有当插件调用的 BDS 函数在新版本中未发生变化时，DLL 才可能跨版本继续使用。不依赖任何 MC 内容的插件可以较长期通用；依赖提供稳定接口的前置库（如 GMLib）时，跨版本兼容性也更好。小功能建议用脚本（如 LegacyScriptEngine 的 JS）编写，不仅跨版本更方便，即使作者停更也基本能继续使用。

## PC 基岩版客户端模组的 UI 在部分用户电脑上不显示，是什么原因？

PC 基岩版并非都使用 DX12，部分设备会以 DX11 运行。如果模组的 UI 覆盖层（如 ImGui）仅针对 DX12 实现，DX11 用户就会遇到模组没有 UI 的问题，因此需要同时兼容 DX11 和 DX12。

*适用版本：PC 基岩版客户端模组。未能从源码或文档中直接证实，仅供参考。*

## 为新版 LeviLamina 编译的原生 mod 能在旧版 LeviLamina 上运行吗？

原生插件的适配一般不考虑旧版本。只要 mod 没有用到新版 LL 才开放的 `MCAPI` 或新版 MC 才有的 API，就有可能兼容旧版；否则需要针对旧版本重新编译。建议直接将服务端或客户端更新到最新版 LeviLamina。

## LeviLamina mod 用 `getLogger().debug(...)` 输出的调试日志不显示，怎么调整日志等级？有哪些等级？

Logger 的默认等级来自 PreLoader 配置。调高 `PreLoaderConfig.json` 中的 `logLevel` 即可：LeviLamina 的 Logger 默认等级 = `logLevel` - 1（限制在 0~5），因此将 `logLevel` 设为 5 对应 Debug，设为 6 对应 Trace。也可以在代码里对单个 Logger 调用 `setLevel`，例如 `getSelf().getLogger().setLevel(ll::io::LogLevel::Debug)`。等级枚举如下（`ll/api/io/LogLevel.h`）：

```cpp
enum class LogLevel : int { Off = -1, Fatal, Error, Warn, Info, Debug, Trace };
```

*适用版本：LeviLamina 1.x 及以上（当前 v26.60.8）*

## 原生 C++ mod 作者如何像 LeviLamina 一样接入 Sentry，让自己 mod 的崩溃上报到自己的账号？

自行注册 Sentry 账号并创建项目，然后将 DSN 写入 mod 的 `manifest.json` 的 `extraInfo` 中：

```json
"extraInfo": {
  "sentryDsn": "https://<key>@<host>/<projectId>",
  "sentryUploadType": "all"
}
```

发生崩溃时，LeviLamina 的 CrashLogger 会将嫌疑 mod 的信息上报到其 `sentryDsn`；若 `sentryUploadType` 设为 `"all"`，则即使不是嫌疑 mod 也会上报。为了获取可读的堆栈，可以在 GitHub Actions 发布流程中使用 `sentry-cli` 上传调试符号（参考 LeviLamina 的 `.github/workflows/release.yml` 中的 `upload-to-sentry` 任务：`sentry-cli debug-files upload --include-sources`）。此外，请记得为 mod 设置版本号（git tag），以便判断用户版本。JS 插件一般不需要配置。

*适用版本：LeviLamina 1.0.0 及以上*

## 使用 LeviLamina 的 `ll::config::loadConfig` 的 mod 更新后新增了配置项，旧配置文件却加载失败或部分配置被重置，是什么机制？

`ll::config::loadConfig` 会根据配置结构体中的 `version` 字段判断是否需要更新配置。当文件中缺少 `version` 或与代码中的 `version` 不一致时，它会调用 updater（默认为 `defaultConfigUpdater`，即以当前默认值为底，将文件中已有的内容 `merge_patch` 进去）补全配置后再反序列化，并返回 `false`，提示调用方调用 `saveConfig` 写回文件（模板和 LL 自身都是在 `loadConfig` 返回 `false` 时调用 `saveConfig`）。如果开发者新增了字段却未修改 `version`，配置就会被视为无需更新而直接反序列化；一旦缺少字段或类型不符，反序列化就会抛出异常。调用方捕获异常后通常会用默认值重写配置，从而导致部分配置丢失或被重置。

用户侧：将配置文件里的 `version` 改为其他数字以触发自动合并更新（保留原有配置），或删除配置文件让其重新生成。

开发者侧：新增或修改配置项时，务必递增 `version`。

*适用版本：LeviLamina 1.x 及以上（当前版本仍适用）*

## 通过 uuid 获取 `PlayerInfoEntry` 后 name 字段全是空的，PlayerInfo 是否需要开启 `alwaysLaunch` 才会记录玩家名和 uuid？

是的。PlayerInfo 服务默认只有在首次被使用时才会初始化。需要在 LeviLamina 配置中开启 `targeted.playerInfo.alwaysLaunch`（默认为 `false`），让服务器在启动时就初始化 PlayerInfo，才会持续记录玩家名与 uuid/xuid 的对应关系。

*适用版本：LeviLamina 服务端当前版本*

## 使用 LeviLamina 的配置读写接口（基于结构体反射）时，多层嵌套 JSON 怎么定义？JSON 的 key 含有冒号（如 `minecraft:stone`）怎么办？

LL 内置了 `ll::config::loadConfig` 和 `saveConfig`（头文件为 `ll/api/Config.h`），通过结构体反射自动映射。结构体必须包含整数成员 `version`（版本不一致时会调用 updater 并重写文件）。配置路径不要写死，应使用 mod 自身的配置目录（如 `getSelf().getConfigDir()`）。对于嵌套对象，直接在结构体里嵌套 struct 即可；当 key 不固定或含有冒号时，使用 `std::unordered_map<std::string, T>` 或 `std::map` 表示，例如：

```cpp
struct Item {
    std::string dropitem;
    int count;
};
struct Config {
    int version = 1;
    bool instant_destruction = false;
    std::unordered_map<std::string, std::unordered_map<std::string, Item>> destroy;
};
```

反射也支持 enum。默认值直接写在成员初始化中（需为聚合类型，不使用构造函数）。

*适用版本：LeviLamina 0.13 及以上至当前版本*

## 给 LeviLamina mod 接入 Sentry 崩溃上报后，为什么任何装了我 mod 的服务器崩溃（即使和我的 mod 无关）都会给我发大量报告？该怎么设置？

在 mod 的 `manifest.json` 的 `extraInfo` 中配置 `sentryDsn` 后，LL 的崩溃日志器就会上报崩溃。上报范围由 `extraInfo` 中的 `sentryUploadType` 控制：设为 `"all"` 时，只要安装了该 mod 的服务器发生任何崩溃都会上报；不写或设为 `"all"` 以外的任意值时，则仅在该 mod 被判定为可疑模块（崩溃栈涉及该 mod）时上报。此外，服务端可通过 LL 配置项 `modules.crashLogger.uploadToSentry` 关闭上报。

## C++ mod 中要遍历大范围方块（比如清除错误/未知方块），怎样做性能更好？

不要逐个调用 `BlockSource` 的 `getBlock`/`setBlock`。可以先获取区块，再使用 `LevelChunk::getBlock(ChunkBlockPos)` / `LevelChunk::setBlock` 按区块处理，这样能省去每次查找区块的步骤。数据层级为 `BlockSource -> LevelChunk -> SubChunk -> Block`，直接获取全部 SubChunk（`LevelChunk::mSubChunks`）来读取实际存储是最快的；如果获取到的是序列化数据，则需要先从 block palette 中取出 index，再去查 block indices。在多线程中直接调用 `setBlock` 会导致崩溃，修改操作必须放回服务器主线程执行。

*适用版本：LeviLamina 服务端，当前版本*

## LeviLamina 1.21.70 版本中，mod 里高频调用 BDS 函数（如 `LevelChunk` 的 `getBlock`/`setBlock`）性能下降十倍以上，原因是什么，如何提升？

据用户分析，mod 中直接调用的 MC API（`MCAPI`）函数地址由 PreLoader 解析，而 PreLoader 出于防护目的对函数做了包装，导致高频调用变慢。可选的解决方案：改用 `BlockSource` 的虚函数 `getBlock`/`setBlock`（经由虚表调用，实测比调用被包装的 `LevelChunk` 函数更快）；或者使用特征码（signature scan）直接获取函数的真实地址。注意，通过 `BlockSource` 调用时，各类获取失败的情况默认会返回空气方块。

*适用版本：当时为 LeviLamina 1.2.0 / BDS 1.21.70；新版本是否仍如此未知。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina mod 开发中，监听事件和直接 Hook 相比哪个开销更小？为什么大量 Hook 的插件热卸载时可能卡死或崩溃？

优先使用事件。Hook 本身存在开销：即使 hook 函数里什么都不做，也会多出几次跳转；而且在游戏运行中安装或卸载 hook 时，为了安全会暂停其他线程（`GlobalThreadPauser`，防止 CPU 正好执行到被修改的内存），待 hook 完成后再恢复。因此频繁 hook/unhook 是有代价的，暂停线程时还可能发生死锁导致卡死。相比之下，事件的订阅和取消只是在 `EventBus` 的哈希表容器中进行插入和擦除。至于卸载时崩溃，常见原因是注册了回调（如监听器、定时任务等）却未在卸载时取消，等到回调被调用时 dll 已经被卸载了。

*适用版本：LeviLamina 1.x 及以上*

## 开发领地插件时，如何高效地根据方块坐标判断其属于哪个领地（避免每次遍历所有领地比较 xyz 范围）？

将领地数据全部读入内存，并建立空间索引。例如，建立“维度 -> 区块 -> 领地 ID 列表”的映射表，即 `Map<dimid, Map<chunk, Vector<Id>>>`，允许一个区块对应多个领地；对于跨越多个区块的大领地，计算出它覆盖的所有区块，并将领地 ID 逐一插入对应区块的列表中；查询时，先根据坐标算出所在区块，再仅比对该区块下的领地，通过 ID 从缓存中取出领地数据。也可以使用 AABB 树（如 <https://github.com/lohedges/aabbcc>）来加速包含检测。

*适用版本：通用设计思路，与版本无关。未能从源码或文档中直接证实，仅供参考。*

## 有没有分析 LeviLamina 模组内存（排查内存泄漏）的工具？

可以使用 Visual Studio 的诊断工具，将其附加到 `bedrock_server_mod.exe` 进程后拍摄内存快照（Memory Snapshot）并进行对比，从而定位内存泄漏。

*适用版本：LeviLamina 服务端（Windows）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina C++ mod 开发有文档/入门教程吗？新手怎么开始写第一个 mod，怎么找需要的 API 和头文件？

有。入门教程“你的第一个 LeviLamina 模组”见 <https://levimc.org/zh-Hans/tutorials/develop/first-levilamina-mod/>（旧地址 `levilamina.liteldev.com/.../create_your_first_plugin`、`lamina.levimc.org/zh/developer_guides/tutorials/create_your_first_mod/` 等均已迁移）。LeviLamina 文档站在 <https://levimc.org/zh-Hans/LeviLamina/>，包含命令、事件、Hook、表单、物品、i18n、协程等 how-to 指南（`developer_guides/how_to_guides`）和 API 参考（`api_reference`，含配置 config 等）；由头文件生成的 Doxygen C++ 参考见 <https://levimc.org/LeviLamina/api/>。

Minecraft 原版类没有文档，主要靠阅读头文件（`mc/...`）并参考 LeviLamina 仓库的测试代码（`src-test/`，如 `src-test/server/testCommand.cpp`、`EventTest.cpp`）及其他开源 mod（如 LeviOptimize、LegacyMoney）。事件通过 `ll::event::EventBus` 监听，可取消事件在回调里调用 `event.cancel()`。脚本插件（LSE）的 API 文档是另一套，见 LSE 文档站。

新手可以用“万能头文件”一次性 include 全部头文件，但这会显著拖慢编译、让 clangd 卡顿，大项目甚至会内存不足，因此不推荐。

*适用版本：当前所有版本（LeviLamina 1.x 及以上，文档地址以 levimc.org 为准）*

## mod 开发中需要 LeviLamina 导出新的 MC API/符号/类成员/hook，应该在哪里申请？能不能申请 RVA？

统一到 LiteLDev 的 mcapi-requests 仓库（<https://github.com/LiteLDev/mcapi-requests/issues>）开 issue 申请，LeviLamina 主仓库不再受理此类 issue。选择 server 或 client 均可，维护者会统一归类处理；申请时需说明清楚 mod 用途。

没必要申请 RVA：已知符号名可以直接通过 LL 的符号解析获取地址，例如 `"符号名"_sym.resolve()`（需 `using namespace ll::literals;`，另有 `"符号名"_symp` 可直接得到缓存的地址）；若解析失败（返回 `nullptr`），说明该符号当前不可用，仍需提交申请。

*适用版本：LeviLamina 1.5 及以上（当前 26.60.x）*

## LeviLamina 的 API 只能在官网文档一个个点开看吗？有没有方便搜索的方法？

官网 C++ Reference（由头文件经 Doxygen 生成）可按 `Ctrl+K` 或 `/` 按名称搜索类、函数和文件。更高效的做法是直接克隆 LeviLamina 仓库，在本地用 VS Code 等编辑器全局搜索头文件（`src/ll/api` 是 LL 自身 API，`src/mc` 是 BDS 公共头文件，`src-server` / `src-client` 分别是服务端/客户端专有头文件）。

## LeviLamina 的 API 文档缺少客户端相关内容（例如 `ClientInstance`），找头文件很费劲怎么办？

客户端相关头文件在 LeviLamina 仓库的 `src-client` 目录下，例如 `ClientInstance` 位于 `src-client/mc/client/game/ClientInstance.h`。建议直接 clone 仓库并在 `src-client` 中搜索。另外，当前官网 C++ Reference 的 Doxygen 输入已包含 `src-client/ll/api` 和 `src-client/mc`，也可以直接在文档中搜索客户端类。

*适用版本：LeviLamina 当前版本（含客户端支持的版本）*

## mod 发布版本号能否用 `v[mod版本号]-mc[MC版本号]`（如 `v0.3.1-mc26.51`）这种格式来标注适配的 MC 版本？

不建议。按 SemVer 2.0.0 规范，带“-”的版本号会被视为预发布（测试）版本，lip 等工具也按 SemVer 解析，在版本选择和自更新中会对预发布版本区别对待。如需附带 MC 版本信息，可使用 build metadata（“+”后缀，例如 `1.0.0+mc26.51`）。

*适用版本：当前所有版本（lip 使用 lip.toml，版本需为 SemVer 2.0.0）*

## 发现 LeviLamina 头文件里某个数据包（packet）的结构定义有问题，应该怎么反馈？

直接在 LeviLamina 的 GitHub 仓库（LiteLDev/LeviLamina）提 issue，最好附上修复方案（正确的结构、偏移等）；也可以直接提 PR 修复（手写内容需放在自动生成区块之外）。

## 在 IDA 中看到 BDS 函数访问 `a1+416` 这样的成员偏移，如何知道它对应 LeviLamina 头文件中哪个成员（如 `mUnk` 开头的成员）？

打开 LeviLamina 仓库 `src/mc`（或 `src-server`/`src-client` 下的 `mc/`）中对应类的头文件，查看 `// member variables` 区块。当前头文件的成员以 `::ll::TypedStorage<对齐, 大小, 类型> mXxx;` 或 `::ll::UntypedStorage<对齐, 大小> mUnkxxxxxx;` 形式声明，没有偏移注释。需要从基类大小开始，按每个成员的大小和对齐依次累加算出偏移，再与 IDA 里的偏移（如 416 = 0x1A0）比对，即可找到对应成员。也可以在自己的代码里用 `offsetof` 或 `static_assert` 验证。

*适用版本：LeviLamina 当前版本（v26.x，成员使用 TypedStorage/UntypedStorage 布局）*

## 申请导出 MCAPI/符号（mcapi request）时，新模板有什么要求？模板类可以申请吗？一个 issue 能申请多少个？

请在独立仓库 LiteLDev/mcapi-requests 中使用 Request 模板开 issue（标题如 `Request symbols for <your-mod-name>`），各字段要求如下：

- Mod：mod 的公开 GitHub 仓库地址，需使用当前 URL，且 `README.md` 中要出现 issue 标题里的 mod 名。
- Platform：Server for Windows / Client for Windows / Client for Android。
- Justification：说明 mod 的功能及需要这些符号的原因，最多 200 token，简明扼要即可，不要用 AI 生成长篇说明。
- Classes：需要成员变量的类，一行一个。
- Symbols：链接报错中未解析的符号，一行一个。

成员（Classes）和函数（Symbols）填在同一个模板里；单个 issue 中 Classes 和 Symbols 合计最多 64 行，但 issue 数量不限，按需创建即可。带 `< >` 的模板类无法自动生成，需单独开 issue 由人工处理。

*适用版本：当前（2026-11）的 LiteLDev/mcapi-requests 流程*

## 开发 LeviLamina C++ mod 时有什么好用的 WebSocket 库？

LeviLamina 本身不提供 WebSocket API，需要使用第三方库。常见选择有 websocketpp（<https://github.com/zaphoyd/websocketpp>，基于 C++11/asio）和 uWebSockets（<https://github.com/uNetworking/uWebSockets>），也可以基于 TCP 库自行实现。这些库一般可通过 xmake 的 `add_requires` 引入。

*适用版本：当前所有版本（第三方库，与 LL 版本无关）。未能从源码或文档中直接证实，仅供参考。*

## 开发 LeviLamina mod 需要发包/抓包时，基岩版网络协议文档在哪里可以查到？

Mojang 官方协议文档仓库：<https://github.com/Mojang/bedrock-protocol-docs>（仍在更新）。原 wiki.vg 的基岩版协议页已并入 Minecraft Wiki（minecraft.wiki 上的 Bedrock Edition protocol 相关页面）。LeviLamina 在 `src/mc/network/packet/` 下提供了各数据包的头文件（如 `CameraPacket.h`、`CameraInstructionPacket.h`），可以直接构造使用。

*适用版本：LeviLamina 当前版本*

## 给 LeviLamina 头文件（`src/mc`）提 PR（如为类补充默认构造函数或手写函数）时有什么规范要注意？

`src/mc` 下的头文件大多由工具生成，生成器会与现有内容合并，手写内容只要符合约定就不会在重新生成时丢失。具体规范如下：

1. 不要把代码插在自动生成区域内（`// auto generated inclusion list`、`// auto generated forward declare list`、`// NOLINTBEGIN`~`// NOLINTEND` 之间、`MCAPI`/`MCFOLD`/`MCTAPI`/`MCNAPI` 声明、`::ll::TypedStorage<...>` 成员布局），也不要向生成列表中添加内容或调整顺序，否则会影响后续合并。
2. 手写声明单独放在一个 `public:` 区块中（置于 `// member variables` 之上），并用 `LLNDAPI`/`LLAPI` 导出。
3. 实现写在同目录的 `.cpp` 文件里，不要内联在头文件中。
4. 如需补充默认构造函数，可将 `// prevent constructor by default` 区块中的声明改为 `= default` 或 `= delete`，重新生成时会予以保留。

*适用版本：LeviLamina 当前版本*

## 能不能写一个 LeviLamina mod 检测 BDS 假死（卡死），然后自动结束进程并重启？

不建议只靠 BDS 内的 mod 实现：LL mod 与 BDS 共用主线程，主线程卡死时，依赖 tick 的 mod 逻辑也会随之停止。可靠的做法是使用外部看门狗：在游戏 tick 中定时发送心跳（例如通过 pipe），由外部进程（或独立的守护线程）在长时间收不到心跳时判定为卡死。用外部程序重启服务器、生成 dmp 也更方便。一些服务器面板已自带此功能。

*适用版本：当前所有版本（通用设计建议）。未能从源码或文档中直接证实，仅供参考。*

## 逆向基岩版、还原被编译器内联掉的函数时，有没有公开可用的带符号的二进制可以参考？

可以参考 macOS 版 Minecraft 教育版（Minecraft Education）。该版本与基岩版共用同一套代码库，其二进制文件包含 x86_64 和 arm64 双架构，合计带有 110 多万个符号，逆向参考价值很高。你可以配合 bindiff 等工具将其与 Windows 版进行函数匹配；使用其中的 x86_64 架构还能避免跨架构匹配效果不佳的问题。下载地址：<https://aka.ms/meeclientmacos> 或 <https://education.minecraft.net/zh-hans/get-started/download>（截至 2026-09，正式版为 1.26.32，beta 为 1.26.30，后续版本仍会继续更新）。

*适用版本：截至 2026-09 的 Minecraft Education macOS 版本；后续版本是否仍带符号需自行确认。未能从源码或文档中直接证实，仅供参考。*
