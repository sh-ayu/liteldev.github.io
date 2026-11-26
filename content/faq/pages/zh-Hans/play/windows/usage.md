# Windows 版 LeviLauncher 的功能与设置

## PC 版 LeviLauncher 怎么切换微软/Xbox 账号？点“切换账户”后一直回到原来的账号怎么办？

PC 版启动器没有单独的账户页面。点击顶部栏的用户头像，未登录时点击“登录微软账户”，已登录时在弹出卡片底部点击“切换账户”。在普通权限下，这会弹出 Windows 账户选择器，供你选择其他微软账户。对应的命令是 `LeviLauncher.exe account login`（登录或切换）和 `account logout`。如果启动器以管理员权限运行，登录会直接走 Windows 身份验证而不弹出账户选择器，看起来就像一直切回原账号。遇到这种情况，请以普通权限重新启动启动器。你也可以在 Xbox App 里切换账号，或进入游戏后退出重登。PC 版启动器同一时间只能使用一个账户，不支持多个 Xbox 账户同时在线或一键切换；Android 版则可以在启动器内管理多个 Xbox 账号。

*适用版本：LeviLauncher 1.0.3 及以上（Windows 版）*

## 原来微软商店版（GDK）MC 的存档、资源包、行为包能迁移或继承到 LeviLauncher 的实例里吗？

可以，有三种方式：

1. 新建或安装实例时开启“实例隔离”，并在“继承来源”里选择“从共用的游戏数据继承”，即可将系统中共用的 Minecraft 数据（世界、资源包、设置等）复制到新实例。你也可以选择同类型的其他隔离实例作为来源。数据较多时复制会比较慢，耐心等待即可。
2. 未开启隔离的实例本身就与系统中的 Minecraft 共用数据，打开后直接就能看到原来的世界。
3. 手动迁移：将原来的 `worlds`、`resource_packs`、`behavior_packs` 等文件夹复制到该实例的游戏数据目录（可在启动器里点击“打开文件夹”找到），或者将 `.mcworld` / `.mcpack` / `.mcaddon` 文件拖入启动器的内容页导入。

注意：“导入”已安装的游戏只会导入游戏本体，不会自动带上存档。

*适用版本：LeviLauncher 1.x（Windows 版，GDK 及支持隔离的 UWP 实例）*

## GDK 版 Minecraft 能多开吗？

GDK 实例可以多开。实例运行时，在命令行执行 `LeviLauncher.exe launch <实例> --force`（或 `play <实例> --force`）即可再启动一个副本。UWP 实例无法多开，因为 Windows 只允许运行一个 UWP 游戏副本。注意：游戏没有存档锁，多个副本可以进入同一个世界，后退出的副本会覆盖先退出的存档，因此多开主要适合开发者测试。

*适用版本：LeviLauncher 1.x（Windows 版），仅 GDK 实例*

## GitHub 上已经发布了 LeviLauncher 新版本，为什么启动器内“检查更新”检测不到？

GitHub 上标记为 Pre-release（测试版）的版本（如 `1.1.0-beta.x`），需要在启动器“设置 → 软件更新”中开启“接收测试版更新”后才会推送。正式版（当前最新为 v1.1.0）则会直接推送。你也可以前往 <https://github.com/LiteLDev/LeviLauncher/releases> 手动下载。

*适用版本：LeviLauncher 1.x（Windows 版）*

## LeviLamina 的客户端 mod（如小地图、回放、投影）以及其他客户端 mod 怎么安装？

在 LeviLauncher（Windows 版）中，先为 GDK 游戏实例安装 LeviLamina（在实例页面操作，或使用命令 `LeviLauncher.exe loader install`），再安装客户端 mod。安装方式有两种：一是直接在启动器的“LeviMC 模组”页面安装（该页面读取 levimc.org/mods 目录，由内置的 lip 兼容包管理器安装，无需另装 lip），对应命令 `LeviLauncher.exe mod search` / `mod install`；二是导入外部下载的 mod，除 `.mcmod` 外，在文件选择框中选择“所有文件 (*.*)”还可以导入 `.zip` 和单独的 `.dll` 文件，BetterRenderDragon、BetterRPM 等 DLL 类 mod 均通过此方式导入。UWP x64 实例可以加载兼容当前游戏版本的 preload-native DLL mod，但 LeviLamina 自动安装仅支持受支持的 GDK 版本。不支持热注入类客户端，且较老的 DLL 可能不兼容新版游戏。建议在干净的隔离实例中逐个测试。

*适用版本：LeviLauncher 1.x（Windows 版）*

## LeviLauncher 下载游戏版本时看不到进度、长时间没反应，是卡死了吗？

点击“下载”页面右上角的云形下载图标即可打开“下载管理”页，查看和管理当前的下载任务。下载进行时，该图标会高亮并带有红点。只要没有报错，一般说明仍在下载，只是速度较慢。如果下载过慢或反复失败，可以在下载时测速并切换镜像源，或在设置中开启“使用镜像源”；也可以稍后重试，或改用本地安装包导入。

*适用版本：LeviLauncher 1.x（Windows 版）*

## 新版 LeviLauncher 里找不到原来的“启用渲染龙光影加载”（内置 BetterRenderDragon）开关了，现在怎么加载渲染龙光影？

因每个游戏版本都需要重新适配、维护成本高且曾导致闪退，该内置功能已在 LeviLauncher 1.0.0 中移除，同时移除的还有 Ctrl+R 资源热重载设置。现在的加载方式如下：

- PC：从 <https://github.com/QYCottage/BetterRenderDragon/releases> 下载对应游戏版本的 BetterRenderDragon `.dll`，在启动器的模组页导入（在文件选择框中选择“所有文件 (*.*)”即可选择单独的 `.dll`）并启用，效果与以前相同；光影或材质包本身则在资源包页导入。
- 安卓：使用 MaterialBinLoader2（mbl2）等加载器。

此外，你也可以直接替换游戏材质文件。不建议为此退回 0.3.x 旧版启动器。

*适用版本：LeviLauncher 1.0.0 及以上（当前 v1.1.0）*

## LeviLauncher 中对未开启版本隔离的版本点“删除实例/删除版本”，会不会把存档等游戏数据全部删掉？

不会。删除实例只会删除启动器实例目录中该实例的文件夹（1.1.0 默认路径为 `%LOCALAPPDATA%\LeviLauncher\Instances\<实例名>`，若设置了自定义数据目录则位于该目录下，旧版为 `versions` 目录；UWP 实例还会先注销包；游戏运行时会拒绝删除），不会删除未隔离版本共享的默认游戏数据（存档、资源包等）。注意：开启了版本隔离的实例会将数据保存在自己的工作区中，删除实例会将其一并删除，请提前备份重要世界。

*适用版本：当前所有版本（LeviLauncher 1.1.0 起实例目录位于 `%LOCALAPPDATA%\LeviLauncher\Instances`）*

## LeviLauncher 中已下载的版本安装包如何删除？找不到删除按钮。

在“下载”页面中，已下载版本的右侧会显示“安装”按钮组。点击旁边的下拉箭头，选择“删除安装包”并确认即可，无需手动打开目录删除。

*适用版本：当前所有版本（LeviLauncher 1.1.0 已验证）*

## 使用 LeviLauncher 必须拥有正版 Minecraft 基岩版吗？能否离线/不买正版使用？

必须拥有正版。LeviLauncher 仅支持正版 Minecraft 基岩版，无法绕过正版验证，也不提供类似 Java 版的“离线模式”。

- Windows 版：下载和安装游戏时，启动器需要通过微软账号向微软获取游戏许可证。请在启动器中登录已购买游戏的账户（点击头像或运行 `LeviLauncher.exe account login`）。若该账户未购买游戏，会报错 `ERR_LICENSE_NOT_ENTITLED`；若只有试用许可证，则会报错 `ERR_LICENSE_FULL_REQUIRED`（无法安装正式版）；未取得正版授权时，游戏将以试玩模式运行。游戏内的 Xbox 登录仍在游戏内进行。
- Android 版：需要从 Google Play 购买并安装正版基岩版。

坚持正版验证的原因之一，是 LeviLamina 的更新依赖 Mojang 提供的资料。非官方渠道的启动器或来路不明的安装包不受支持，官方社区也不受理盗版问题。官方下载渠道：<https://github.com/LiteLDev/LeviLauncher/releases> 或文档站 <https://levimc.org/zh-Hans/LeviLauncher/>。

*适用版本：当前所有版本（Windows v1.1.0、Android v1.7.1）*

## LeviLauncher 可以启动 BDS（基岩版专用服务器）吗？

不能。LeviLauncher 是客户端启动器，仅用于安装、管理和启动 Minecraft 基岩版客户端（Windows 平台的 GDK / UWP 版及 Android 版）并加载客户端模组，与开服无关。搭建 BDS 服务器请使用 LeviLamina 服务端方案（例如用 lip 安装 LeviLamina，或使用 docker-levilamina-server 镜像）。

## Windows 版 LeviLauncher 怎么导入 `.mcpack` / `.mcaddon` / `.mcworld` 资源包、材质包、皮肤包或地图？

- 方法一：在“启动”页进入“内容管理”（或对应的资源包/行为包/皮肤包/世界页面），将 `.mcpack` / `.mcaddon` / `.mcworld` 文件直接拖入窗口（界面提示“拖入 .mcworld/.mcpack/.mcaddon 以导入”），然后按提示选择目标实例；若导入的是世界或按玩家存储的皮肤包，还需选择玩家。
- 方法二：在内容页面点击右上角的“导入”按钮选择文件。
- 方法三：使用命令行 `LeviLauncher.exe pack import "D:\Downloads\xxx.mcpack"`（导入世界用 `world import`），可加 `-i <实例>` 指定实例。

包的类型（资源/行为/皮肤）由其 `manifest.json` 决定；手机上的 `.mcpack` 等通用格式同样可用，但需与游戏版本兼容。你也可以在内容页面点击“打开目录”，将文件手动放入对应文件夹。注意：模组（`.mcmod` / `.dll`）需在实例的“管理模组”中导入，不能直接拖入资源区。

*适用版本：LeviLauncher（Windows）当前版本*

## LeviLauncher 安装的 Minecraft 实例能否注册到系统、出现在开始菜单里直接启动，或者创建快捷方式？

可以。

1. 注册到系统：在启动页点击“注册到系统”（命令行 `LeviLauncher.exe instance register <实例>`），Windows 就会将该实例视为对应渠道（正式版/预览版）已安装的 Minecraft，开始菜单、`minecraft://` 链接和 Xbox 功能都会调用它。该操作需确认后执行，会替换当前占用该渠道的商店版或其他实例（数据会保留）。注册 GDK 或 UWP 实例均需开启 Windows 开发者模式；UWP 实例在启动时会自动注册。如需解除注册，请运行 `instance unregister`。
2. 桌面快捷方式：在“启动”按钮旁的菜单中选择“创建桌面快捷方式”（或运行 `instance shortcut <实例>`），即可生成 `Minecraft - <实例名>.lnk`，双击即可通过启动器启动对应实例。

*适用版本：LeviLauncher（Windows）当前版本（v1.x）*

## LeviLauncher 是否支持 Linux（或 macOS）？

不支持。LeviLauncher 仅提供 Windows 版（GDK / UWP）和 Android 版，没有 macOS 或 Linux 版本，目前也没有相关计划（维护者曾尝试过基于 Wine 的 GDK 适配，但已放弃）。Linux 用户目前常用基于 Android 版游戏的第三方方案（如 MCPelauncher，需在 Google Play 购买游戏），该方案不属于 LiteLDev 项目。

## LeviLauncher 是如何加载 mod 的？与 PreLoader / LeviLamina 的加载方式如何共存？

LeviLauncher（Windows）自带原生加载器 `LeviLauncher.dll`。安装或启动版本时，启动器会将它放入游戏目录，并在游戏 exe（`Minecraft.Windows.exe`，UWP 为清单中的 exe）的导入表中添加对它的引用，由它加载实例 `mods` 目录下的原生 DLL mod（仅支持 x64）。如果版本目录中存在 `preloader.dll`（例如安装了 LeviLamina），则由外部 PreLoader 接管所有 mod 加载，`LeviLauncher.dll` 会跳过原生 mod 加载。LeviLamina 客户端通过启动器内置的、兼容 lip 的包管理器安装，无需另行安装 lip 或 .NET。此外，PC 端的 PreLoader 与安卓端的 preloader 只是同名，并非同一组件。

*适用版本：LeviLauncher (Windows) 1.0.0 及以上；内置包管理器为 1.1.0 及以上*

## LeviLauncher 有类似按键放大视野（Zoom）的客户端 mod 吗？

可以使用第三方 mod <https://github.com/OpenMCBE/Zoom>（PC 用，按 C 键放大）：从其 Release 页面下载 `Zoom.dll`，在 LeviLauncher（GDK 版本实例）的“管理模组”中添加，然后通过启动器启动游戏。注意，其 README 仅写明支持 `1.26.20.04`，其他游戏版本可能不兼容。

*适用版本：LeviLauncher (Windows) GDK 实例；mod README 标注支持游戏版本 1.26.20.04。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 相比官方启动器有什么用？

官方启动器只能运行最新版本，而 LeviLauncher 可以同时安装和管理多个基岩版版本（正式版/预览版，GDK 和 UWP），并支持版本隔离，使各版本数据相互独立。此外，它还支持加载原生 mod、安装 LeviLamina 及客户端模组，以及管理世界和资源包等内容。

*适用版本：当前所有版本（Windows）；UWP 隔离需 x64 且 1.19.70.2 及以上*

## LeviLauncher 能不能像 Java 版的 PCL 启动器那样在游戏启动失败时显示错误原因？

游戏进程本身崩溃时无法显示，因为基岩版不输出错误日志，崩溃通常是静默的。但如果是启动器自身的环节（启动、注册、mod 安装/卸载等）出错，自 1.1.0 起，错误对话框会用通俗语言列出最可能的原因及技术细节，并提供复制按钮和打开启动器日志目录的按钮。若游戏无法启动，可按以下步骤排查：先不带 mod 启动、检查 Windows 组件、用干净的隔离版本复现。

*适用版本：LeviLauncher (Windows) 当前版本；启动器侧错误原因提示需 1.1.0 及以上*

## LeviLauncher（Windows）能否给每个游戏实例绑定不同的账号、方便多人联机测试？

目前不支持。Windows 版启动器中登录的微软账号仅用于正版验证和下载版本；游戏内使用的账号直接跟随系统的 Xbox 登录状态，系统 Xbox 登录了哪个账号，游戏内就是哪个。（启动器内切换多 Xbox 账号是 Android 版的功能。）

*适用版本：LeviLauncher (Windows) 当前版本（1.1.0）*

## 在 LeviLauncher 中如何显示 4D 皮肤？高版本（1.26.10+）导入 4D 皮肤包不生效怎么办？

在新版本中，Mojang 不再允许普通资源包加载带模型的皮肤。推荐使用社区作者制作的 4DSkin mod：将其作为 mod 加载后，直接导入 4D 皮肤 mcpack 即可，无需再依赖 BetterResourcePackManager（注意：与 BetterRenderDragon 同时启用可能会导致崩溃）。另外，GitHub 仓库 `QYCottage/4DSkin-Release` 目前仅发布了 `4DSkin.levipack`（v2.0.0/v2.0.1）。`.levipack` 是 Android 版 LeviLauncher 的模组包格式，而 Windows 版 LeviLauncher 的“管理模组”仅接受 `.mcmod` / `.zip` / `.dll`，因此 Windows 用户需从官方 QQ 群的群文件或 Discord 获取对应的 PC 构建。如果不想使用 mod，也可以将 `.mcpack` 解压，按类型（`persona` / `custom` / `vanilla`）将文件复制并覆盖到游戏皮肤包的对应文件夹中（有用户在 26.10/26.20 版本测试成功，但此后普通的市场皮肤可能会不可见）。

*适用版本：LeviLauncher (Windows / Android)；GitHub 上的 4DSkin v2.x 发布包为 Android `.levipack`；支持的游戏版本以 4DSkin mod 最新发布为准。未能从源码或文档中直接证实，仅供参考。*

## 为什么有些 CurseForge 上的内容在官网能搜到，在 LeviLauncher 的内容下载里却搜不到？CurseForge 上有 LeviLamina mod 吗？

启动器的 CurseForge 页面搜索的是 Minecraft Bedrock（`gameId` 78022）的内容，支持按游戏版本和分类（class/category）筛选。如果在官网能搜到但启动器里搜不到，通常是因为该内容不支持当前所选的游戏版本，或不在当前所选分类下，可清空游戏版本筛选或切换分类后重试。目前 CurseForge 上只有 Addon 等内容，尚无 LL mod 分类（维护者称正在申请开设），请通过启动器的 LeviMC 模组页面安装 LL mod。

*适用版本：LeviLauncher (Windows) 当前版本。未能从源码或文档中直接证实，仅供参考。*

## 关闭通过 LeviLauncher 启动的 Minecraft 窗口后，进程/控制台很久才消失，正常吗？

正常。GDK 版 Minecraft 关闭窗口后，游戏 exe 进程仍会在后台运行一段时间才退出。这是 GDK 版游戏本身的行为，与启动器无关。

*适用版本：GDK 版 Minecraft 基岩版（Windows）。未能从源码或文档中直接证实，仅供参考。*

## 在 LeviLauncher 导入地图时让选择玩家，列表里显示的是旧名字，这些玩家是从哪来的？

这里列出的是该实例（GDK 版）在当前设备上登录过的玩家档案（即实例 `Users` 文件夹下的各个玩家目录），并非存档中联机过的玩家。显示的名字是启动器缓存的 Gamertag，因此可能是旧名字。世界会导入到所选玩家的档案下。

*适用版本：LeviLauncher（Windows）GDK 实例；UWP 实例没有玩家档案*

## 新版 LeviLauncher（v1，桌面端）如何更新到测试版/自动更新？

在启动器设置中开启“接收测试版更新”。此后启动器在启动时会自动检查更新，发现新的测试版时将弹窗提示，确认后即可原地更新，无需卸载旧版本。

*适用版本：LeviLauncher（Windows）v1.0.x 及以上*

## 有没有可以提高结构方块（结构文件）大小限制的 mod？

可以使用第三方模组 StructureLimitRemover：<https://github.com/fangkuaichaoge/StructureLimitRemover>。该模组在提问时适配 MC 26.4x，使用前请确认其发布版本与你的游戏版本匹配。

*适用版本：取决于该模组的版本适配（当时为 MC 26.4x）。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 中安装的 CoralFans 指令在游戏里没有补全、像没装一样，如何排查？

在 LeviLauncher 的实例设置中开启控制台（游戏调试控制台，v1.1.0 起也可使用命令行 `LeviLauncher.exe instance set <实例名> --console`），启动游戏并查看模组加载日志。此案例的原因是缺少依赖项 bsci（被误关或未安装），导致 CoralFans 未能加载，安装或启用 bsci 后即可恢复。此外，若与其他模组（如 Lamium）发生指令冲突，也会表现为指令失效；CoralFans 的所有指令均可在其 config 中重命名。

*适用版本：LeviLauncher（Windows）+ LeviLamina 客户端模组。未能从源码或文档中直接证实，仅供参考。*

## 往 LeviLauncher 导入某些 `.mcpack` / `.mcaddon` 资源包、行为包失败（其他包可以），是什么原因？

1. 后缀名错误：单个资源包、行为包或皮肤包应使用 `.mcpack` 后缀；`.mcaddon` 是将多个包打包在一起的格式，启动器导入 `.mcaddon` 时只识别其中的 `.mcpack` 或子文件夹内的 `manifest.json`。如果文件只包含单个包且 `manifest.json` 位于压缩包根目录，却使用了 `.mcaddon` 后缀，就会导入失败，将后缀改为 `.mcpack` 即可。
2. `manifest.json` 存在语法错误，不是合法的 JSON，导致启动器无法解析。对于 MC 允许的 JSON 注释，启动器现已支持；导入 `.mcaddon` 时忽略纯 Script API 行为包的问题也已修复（script 模块会导入到行为包目录）。
3. 遇到 UUID 重复的包时需选择覆盖；导入皮肤包前需先选择玩家。

*适用版本：LeviLauncher（Windows）当前版本*

## LeviLauncher 安装的 GDK 版 Minecraft 能用 BetterRTX 吗？BetterRTX 安装器识别不到启动器的实例目录怎么办？

可以使用，但需要手动安装，因为 BetterRTX 自带的安装器无法识别 LeviLauncher 安装的实例。请按照 <https://bedrock.graphics/#setup> 的说明操作，或在 <https://bedrock.graphics/presets> 中选择一个预设。在新版 GDK 上，BetterRTX 已改为资源包形式：如果获取的是 `.mcpack` 文件，可在启动器“内容”页点击“导入”或直接拖入导入，随后在游戏中开启光线追踪即可；启动器的内容导入仅接受 `.mcworld` / `.mcpack` / `.mcaddon`，其他格式（如 `.rtpack`）请按 BetterRTX 官方说明处理。旧版安装方式则是将着色器文件手动替换到实例目录的 `renderer/materials` 中。注意，BetterRTX 是着色器文件，而非 DLL 模组；BetterRenderDragon（BRD）才是注入游戏的 DLL，用于从资源包加载渲染龙着色器，两者并非同一工具。

*适用版本：GDK 版 Minecraft + LeviLauncher；以 BetterRTX 官方说明为准。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 启动失败，`startup.log` 或调试输出显示 `config.Load failed: ERR_CONFIG_CORRUPTED: invalid character ... looking for beginning of value`（配置文件损坏）怎么办？

启动器的设置文件 `config.json` 已损坏（不是合法的 JSON）。请关闭启动器，删除 `%APPDATA%\LeviLauncher\config.json`（v1.1.0 之前的旧版路径为 `%APPDATA%\levilauncher.exe\config.json`），重新打开启动器后会自动生成默认配置。如需查看调试输出，可在快捷方式的“目标”末尾加上 ` /debug`（或在命令行运行 `LeviLauncher.exe --debug`）；启动日志位于 `%LOCALAPPDATA%\LeviLauncher\Logs\startup.log`。注意：删除该文件后，启动器设置会恢复默认；如果之前修改过数据目录（`base_root`），需要在设置中重新指定，否则该目录下的实例不会显示。

*适用版本：LeviLauncher 当前版本（Windows）；路径为 v1.1.0 起的新布局*

## Windows GDK 版基岩版的游戏数据（`com.mojang`，存档/资源等）在哪个路径？

未开启实例隔离时，GDK 版的数据根目录是 `%APPDATA%\Minecraft Bedrock`（预览版为 `%APPDATA%\Minecraft Bedrock Preview`）。其中，`Users\Shared\games\com.mojang` 存放共享内容（如资源包等），各账号的存档位于 `Users\<账号ID>\games\com.mojang\minecraftWorlds`。如果在 LeviLauncher 中开启了“实例隔离”，数据则会保存在该实例目录下的 `Minecraft Bedrock` 文件夹中（`<实例目录>\Minecraft Bedrock\Users\...`）。

*适用版本：Windows GDK 版基岩版；LeviLauncher v1.1.0*

## 新版 LeviLauncher 的设置里找不到教程视频中的 “Microsoft GDK” 选项，是不是缺了什么？

不缺。该选项在旧版本中用于注册游戏，新版本已不再需要，能正常启动游戏即可。在当前版本中，如需让实例显示在系统应用列表中，可在启动页启动按钮旁的菜单中选择“注册到系统”（可选）。

*适用版本：LeviLauncher 0.3.11 及以上*

## 用 LeviLauncher 安装游戏版本会不会覆盖/影响原来的存档？

不会覆盖。安装实例时若不勾选“实例隔离”，该实例会与系统中原有的 Minecraft 共用游戏数据（存档、设置等）；若勾选，数据会单独保存在实例目录中（可选择从共用数据继承一份）。启动器本身不会改动存档。如果要卸载原来的游戏，请先备份 `%APPDATA%\Minecraft Bedrock\Users` 下的存档，再进行删除。

*适用版本：LeviLauncher v1.1.0（GDK 版游戏）*

## 用 LeviLauncher（PC）每次启动游戏都会弹出一个控制台窗口，能去掉吗？

可以。打开对应实例的“实例设置”，在启动选项中关闭“启用控制台”，之后启动该实例时便不再弹出控制台窗口。该选项按实例保存，每个实例需单独设置。

*适用版本：LeviLauncher v1.1.0*

## LeviLauncher 运行时任务管理器显示资源占用很高（甚至跑在独显上导致游戏掉帧），怎么办？

启动器界面基于 WebView2 渲染，背景图片、磨砂材质等效果会增加资源占用。启动游戏后可以直接退出启动器，这不会影响游戏运行（注意：若开启了“关闭时隐藏到托盘”，点击关闭按钮只是隐藏窗口，需从托盘彻底退出或关闭该设置）。此外，也可以在“个性化 -> 材质与可读性”中改用“纯色”材质或关闭背景图片，以降低资源占用。

自 0.3.11 起，WebView2 已改用更安全的软件渲染 GPU 设置。

*适用版本：LeviLauncher（Windows）1.x。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 文档网站打不开了，新地址是什么？

各项目文档已统一迁移至 levimc.org，语言代码位于路径最前面。LeviLauncher 简体中文文档地址为 <https://levimc.org/zh-Hans/LeviLauncher/>，繁体中文为 <https://levimc.org/zh-Hant/LeviLauncher/>，英文为 <https://levimc.org/LeviLauncher/>；LeviLamina 文档地址为 <https://levimc.org/zh-Hans/LeviLamina/>。旧的 docs.levimc.org 地址（如 `/LeviLauncher/zh-HK/`、`/LeviLauncher/zh-CN/`）会自动跳转到新地址。

*适用版本：当前版本（2026-11 起）*

## LeviLauncher 被 Windows Defender、卡巴斯基、360 等杀毒软件报毒，是病毒吗？

这是误报。LeviLauncher 后端使用 Go（Wails 框架）编写，且没有代码签名。Go 这类静态编译的程序常被杀毒软件的启发式扫描误判——同一份代码由 GitHub Actions 编译可能会报毒，本地编译却不报，而加 UPX 壳反而会触发更多报毒。启动器自带的 vcruntime 相关 DLL（用于加载模组）从早期版本起就一直存在，删掉它依然会报毒，因此报毒并非由它引起。维护者已多次向微软提交误报申诉，并调整过编译参数以减少误报。请仅从官方渠道（GitHub Releases）下载；若被拦截，可将启动器目录加入杀毒软件的排除项。

*适用版本：当前所有版本（Windows 版）*

## 在 LeviLauncher 里下载的光影（渲染龙资源包）可以导出吗？

启动器没有资源包导出功能，但可以手动导出：在“内容 → 资源包”页面点击右上角的“打开”按钮（文件夹图标）进入该实例的资源包目录，或直接点击某个资源包旁的文件夹图标打开其所在文件夹；将该光影文件夹的内容压缩为 zip，再把后缀改为 `.mcpack` 即可（有用户实测可行）。如果只是想将资源包复制到启动器内的另一个隔离实例，可以使用内容页的“转移内容”功能，或运行命令行 `LeviLauncher.exe pack copy <资源包> --to <实例>`，无需手动打包。

*适用版本：当前版本（Windows 版）。未能从源码或文档中直接证实，仅供参考。*

## 通过 LeviLauncher 启动 UWP 版基岩版时，游戏内转动视角时鼠标会跑出窗口（窗口化和全屏都会），是 LeviLamina 的问题吗？

这不是 LeviLamina 或启动器的问题，而是 Windows / UWP 版 Minecraft 本身的鼠标锁定问题。可以搜索“MCBE 锁鼠标”，查找通过调整 Windows 设置来解决的方法；不建议使用需要额外安装外部工具的方案。

*适用版本：UWP 版 Minecraft。未能从源码或文档中直接证实，仅供参考。*
