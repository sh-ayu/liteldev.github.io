# 其他 LiteLDev 项目

## 旧版 LiteLoaderBDS（LL2，如 2.9.3、2.15.0、2.16.2）现在还能在哪里下载？各版本对应哪个 BDS 版本？

LL2 的历史版本可在 GitHub 已归档仓库 LiteLDev/LiteLoaderBDS 的 Releases 页面下载：<https://github.com/LiteLDev/LiteLoaderBDS/releases>（例如最终版 2.16.2：<https://github.com/LiteLDev/LiteLoaderBDS/releases/download/2.16.2/LiteLoaderBDS.zip>）。旧链接 <https://github.com/LiteLDev/LiteLoaderBDSv2> 会自动重定向到该仓库。每个版本的发布说明都标注了对应的 BDS 版本（较新的版本使用徽章，2.9.3 等旧版本则写在正文里，如 `Support BDS 1.19.50 & 1.19.51`），请务必选择与 BDS 版本严格匹配的 LL2。LL2 已停止维护，最高仅支持 BDS 1.20.31.01，更高版本的 BDS 请使用 LeviLamina。

*适用版本：LiteLoaderBDS 2.x（已归档），BDS ≤ 1.20.31.01*

## LiteLoaderBDS v2（LL2）最后支持的 BDS 版本是多少？有没有支持 BDS 1.20.40 及以后版本的 LL2？LL2 启动报找不到 LiteLoader/无法加载怎么办？

LL2 的最终版本是 2.16.2，对应 BDS 1.20.31.01，没有支持 BDS 1.20.40 及更高版本的 LL2。LL 必须与对应的 BDS 版本严格配套，版本不匹配（例如用 BDS 1.19.30.04 搭配新版 LL2）就会无法加载。LL2 已停止更新并归档，后续重构为 LeviLamina（<https://github.com/LiteLDev/LeviLamina>），新版本 BDS 请使用 LeviLamina。

*适用版本：LiteLoaderBDS 2.x（已归档）；新版 BDS 使用 LeviLamina*

## LeviLamina 服务器有没有存档热备份/自动备份插件？BackupHelper 有适配新版 LeviLamina 的版本吗，提示不兼容怎么办？

可以使用 BackupHelper（<https://github.com/ShrBox/BackupHelper>，由 LL2 版本移植而来的 LeviLamina mod），该项目仍在持续跟进 LeviLamina 版本（v0.20.0 适配 LeviLamina 26.60.*）。旧版 BackupHelper 与新版 LeviLamina 不兼容，请到 GitHub 下载与当前 LeviLamina 版本匹配的最新版本；MineBBS 等转载站不一定及时同步，请以 GitHub 为准。推荐使用 lip 安装：`lip install github.com/ShrBox/BackupHelper`。常用命令：`/backup` 立即备份、`/backup list` 列出备份、`/backup recover [编号]` 回档、`/backup reload` 重载配置；在配置文件 `config.ini` 中，`BackupInterval`（小时）用于设置定期自动备份间隔，`MaxStorageTime` 用于控制备份保留天数。此外，也可以自己编写 `.bat`、`.sh` 或 `.py` 脚本定时打包存档目录。

*适用版本：当前 LeviLamina（BackupHelper v0.20.0 对应 LeviLamina 26.60.\*）*

## 安装 BackupHelper 后执行 `backup` 失败、提示缺少 7z（已经下载了 7z 仍然不行）怎么办？

BackupHelper 调用的是 `7za.exe`（7-Zip 独立命令行版），而非 `7z.exe`。使用 lip 安装 `lip install github.com/ShrBox/BackupHelper` 时，会自动通过依赖 `github.com/LiteLDev/7-zip-tooth` 将 `7za.exe` 放到服务端根目录。如果该文件缺失，可以重新安装：

```shell
lip uninstall github.com/ShrBox/BackupHelper
lip cache clean
lip install github.com/ShrBox/BackupHelper
```

也可以手动将 `7za.exe` 放到服务端根目录。随后在控制台或游戏内（需 OP 权限）输入 `backup` 即可执行热备份，输入 `help backup` 可查看具体用法。

*适用版本：BackupHelper 0.1.6 及以上 + 当前 lip*

## LeviLamina 有 .NET（C#/F#）插件支持吗？

官方不提供支持：LL2 时代的官方 .NET 引擎 LiteLoader.NET 早已停止维护并归档。不过社区项目 Hosihikari（现组织地址：<https://github.com/HosihikariFramework>）提供了 .NET 插件框架：其中 HostingShim 在 BDS 进程中托管 CLR（提供 LeviLamina、Endstone 等 carrier），PluginManager 负责插件加载与生命周期管理，此外还有 CSharpLoader、FSharpLoader（支持源码编译加载）和 RpcLoader，可通过其包管理器 Seiko 安装（如 `sk add hosihikari-hosting-levilamina`）。需要注意，其公开契约目前仅涵盖日志、配置、调度、事件总线等宿主服务，世界、实体、命令等游戏 API 不在契约范围内。你也可以自行通过 C++/CLI 或 P/Invoke 调用 C++ 接口。

*适用版本：当前 LeviLamina（社区项目，非官方）*

## Endstone 和 LeviLamina 有什么区别？

两者的区别类似于“插件”和“模组（mod）”：Endstone 是基于 BDS 的插件服务端（提供类似 Paper 的插件 API），API 相对有限，但不依赖 Mojang 提供的数据，能更快跟进最新版 BDS；LeviLamina 则是 mod 加载器，功能上限更高，但适配新版本需要等待相关数据。如果想在 LeviLamina 上运行 Endstone 插件，可以使用官方提供的 LeviStone（在装有 LeviLamina 的 BDS 目录下执行 `pip install levistone --target mods/EndstoneRuntime`；0.11.14 及更早版本需安装到 `plugins/EndstoneRuntime`）。注意，LeviStone 仅支持用 Python 编写的 Endstone 插件，不支持 Endstone 原生（C++）插件。

*适用版本：当前版本（LeviStone 0.11.15 及以上安装到 mods/EndstoneRuntime）*

## LeviLamina 客户端光影模组 Arke 支持哪些游戏版本、怎么用？装了之后没效果或看不到光影设置界面怎么办？

Arke 可在基岩版的 Direct3D 12 渲染器上运行专为 Iris/OptiFine 编写的 Java 版光影包。它需要客户端版 LeviLamina 26.60.*（对应 26.60 版本客户端），不支持 26.51 等旧版本。通过 LeviLauncher 安装好 LeviLamina 与 Arke（安装路径为 `mods/arke/`）后进入游戏，在画面左上角（或存档暂停界面左上角）打开光影设置（目前采用 imgui 界面），导入光影包并选中应用即可，切换着色器可能需要几秒钟。如果看不到左上角的设置按钮，已知原因是运行了插帧（frame generator）等后处理软件，这会导致按钮不显示甚至游戏崩溃；请先关闭这类软件，并确认游戏运行在 DX12 模式下。如果光影没有效果，请在模组管理界面或控制台确认 mod 已加载，并检查日志文件 `mods\arke\logs\arke.log`；光影包加载失败时，也可以查看设置窗口中的 Messages。

*适用版本：Arke 0.1.x，Minecraft 客户端 26.60 + LeviLamina#client 26.60.\**

## 使用 Arke 光影时方块选择线框不显示，换多个光影都一样，怎么办？

这是 Arke 的兼容性问题，已在 Arke v0.1.5 中修复（`Fixed an issue where some wireframes would not render`）。更新到 v0.1.5 或更高版本即可解决（例如执行 `lip install github.com/LiteLDev/Arke#client`，Arke 仅有 client 变体；也可直接从 GitHub Releases 下载）。

*适用版本：Arke v0.1.4 及更早版本出现；v0.1.5 起已修复*

## iLand 已不维护，有什么替代？如何把 iLand 数据迁移到 PLand？命令提示“未找到 relationship.json 文件”怎么办？

可以改用第三方领地 mod PLand（`IceBlcokMC/PLand`）。在控制台执行以下命令即可导入 iLand 数据：`/pland import true "C:/path/relationship.json" "C:/path/data.json"`，其中第一个参数表示是否清空数据库。路径中的反斜杠 `\` 必须替换为正斜杠 `/`，否则会报错“未找到 relationship.json 文件”。注意：该导入命令已在 PLand v0.18.0 中移除，你需要先用 PLand v0.17.x 完成导入，再升级到最新版本。

*适用版本：PLand v0.17.x 及以下可直接导入；v0.18.0 及以上需先用 v0.17.x 转换后再升级*

## 领地插件用 iLand 性能怎么样？要不要换成 PLand？换了以后数据会不会导不出来？

iLand 是 LL1 时代的 Lua 脚本插件，在 LeviLamina 上运行需要安装 LSE 的 Lua 引擎（`lip install LegacyScriptEngine#lua`）；而 PLand 是 C++ 原生 mod，通常性能更好，换用后还可以省去 Lua 引擎。不过并非必须更换，如果 iLand 用得顺手也可以继续用。PLand 的数据存储在 LevelDB 中，可以直接读取：PLand 0.21.x 及更早版本可用 QLevelDBViewer 查看，更高版本则可使用 PLand 自带的 DevTool 工具查看原始数据。

*适用版本：LeviLamina + LSE 当前版本；PLand 当前版本*

## CoralMap 小地图在服务器里，已扫描过的区块边缘一圈经常变黑/出现透视的空层，是什么原因？

边缘变黑：地形扫描半径 `terrain.scanRadius` 默认为 128 格（8 个区块）。如果服务器视距小于扫描半径，客户端超出视距的区块只是占位符，扫描出来就是黑色。解决方法是将服务器视距设为至少 8，或在 `config.json` 中调小 `terrain.scanRadius`。透视空层：该 mod 依赖游戏缓存的高度表（heightmap）来查找最上层方块，但部分方块不计入高度表，若其下方隔着空气就会产生“透视”现象。这是为了优化性能所做的妥协（否则需要从 y320 向下逐格遍历，性能开销大得多）；作者表示后续会添加配置开关，但目前配置文件中还没有此选项。

*适用版本：CoralMap（LeviLamina 客户端 mod）当前版本*

## 客户端小地图 mod CoralMap 开启后掉帧严重，可以怎么调？

地形扫描与阴影渲染在独立线程中运行，当 CPU 核心数不足时，会与游戏渲染线程争抢资源。可以在 mod 配置目录的 `config.json` 中调整以下选项：

- 调小每帧扫描区块数 `terrain.scanMaxChunksPerFrame`（默认为 32，可改为 16）；
- 调低阴影模式 `terrain.shadow.renderStyle`（0=无阴影，1=简单高度图梯度阴影，2=阴影图+边缘 bevel，默认为 2）；
- 调小 `terrain.scanRadius`。

*适用版本：CoralMap 当前版本*

## LeviLamina 的官方组织名是 LiteLDev 还是 LeviMC？为何 GitHub 组织 ID 没改？

官方名称为 LeviMC（官网 <https://levimc.org>），GitHub 组织 ID 仍是 LiteLDev。据维护者说明，改名会导致旧链接失效或无法完整重定向，因此保留原 ID。

## LiteLDev 论坛 `https://bbs.liteldev.com/` 打不开了吗？

该论坛早已关闭，现在的社区入口为 <https://levimc.org/community/>。

## 可以在 LeviMC 平台/频道发布自动图腾（AutoTotem）之类的辅助功能模组吗？

不可以。这类功能属于外挂，请勿在 LeviMC/LL 的平台或频道发布，也不要在多人游戏中使用以免影响他人；单人游玩则不受限制。开发客户端功能时，建议检测当前是否处于服务器中，若是则自动禁用。

*未能从源码或文档中直接证实，仅供参考。*

## 想给 LiteLDev（LeviLamina 开发团队）捐款支持，有什么途径？

可通过爱发电（<https://afdian.com/@liteldev>）或 Open Collective（LeviMC，<https://opencollective.com/levimc>，支持银行卡或 PayPal，以美元结算）捐款。GitHub 仓库页的 Sponsor 按钮即指向这两个渠道。

## LiteLDev 的 LegacyParticleAPI 是否已停止维护？有什么替代？

是的。LegacyParticleAPI（从 LiteLoaderBDS 移植的 ParticleAPI）已停止维护并归档，目前不再有项目使用。如需在服务端绘制粒子或调试图形，可改用 BedrockServerClientInterface（BSCI，<https://github.com/OEOTYAN/BedrockServerClientInterface>）。

*适用版本：LeviLamina 当前所有版本*

## 客户端 mod 能否实现禁止拾取物品？如果不能，服务器上怎么做？

客户端无法实现，拾取物品的判定由服务端决定（客户端最多只能在拾取后将其丢弃）。服务端可安装 LeviLamina 模组 CoralFans（`lip install github.com/CoralFans-Dev/CoralFans`）：服主（管理员）先执行 `/func nopickup true` 全局启用该功能，玩家再执行 `/self nopickup true` 开启个人开关（未全局启用时执行 `/self` 会报错提示不可用）。可执行 `/coralfans` 检查插件是否安装成功，命令名称也可在 CoralFans 配置中修改。详细用法见 <https://coralfans-dev.github.io/CoralFans-doc/>。

*适用版本：LeviLamina 服务端 + CoralFans 当前版本*

## 如何方便地下载/升级 BDS 服务端？

推荐使用 LiteLDev 的命令行工具 bdsdown（<https://github.com/LiteLDev/bdsdown>），可通过 `lip install github.com/LiteLDev/bdsdown` 安装。用法如下：

```text
bdsdown.exe [--yes] [--source SOURCE] [--proc PROC] [--exclude EXCLUDE]
```

`--source` 默认为 `version://windows/latest`，`--proc` 为并发下载数（默认 4），`--exclude` 用于排除无需覆盖的文件（如保留配置文件）。可通过设置环境变量 `BDSDOWN_MIRROR_URL` 使用镜像加速，也可以直接用 lip 仅安装 BDS。

## GMLIB 的 PAPI 变量如何让延迟（ping）显示按数值变色？

可使用 GMLIB PAPI 的 `scope`（区间）函数，按数值区间映射颜色代码：

```text
§${papi:scope,input=${papi:player_avg_ping},0..99=a,100..199=e,200..=c}${papi:player_avg_ping}
```

0~99 为绿色 `§a`，100~199 为黄色 `§e`，200 及以上为红色 `§c`。早期流传的 `0..=a,100..=e` 写法存在区间重叠，建议改用互不重叠的闭区间。区间格式为 `min..max`，`10..` 表示 ≥10，`..10` 表示 ≤10，还可用 `default=` 指定默认返回值。若需显示当前延迟而非平均延迟，可改用 `player_last_ping`。占位符文档见 <https://github.com/GroupMountain/GMLIB-Release/blob/release/PlaceholderDocs.md>。

*适用版本：安装了 GMLIB（当前 v26.60.1）的服务器*
