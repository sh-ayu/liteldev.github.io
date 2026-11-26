# Android 版 LeviLauncher 的功能与设置

## 安卓版 LeviLauncher 需要正版吗？在微软商店/PC（Java+基岩套装）、iOS 上买的正版能用吗？盗版或网上的“去验证版”启动器能用吗？

需要。LeviLauncher 启动器本身免费且开源，但安卓版会验证正版：设备上必须安装来自 Google Play 的官方 Minecraft（包名 `com.mojang.minecraftpe`，1.21.80 或更高版本）。启动器启动时会检查其安装来源是否为 Google Play 商店，否则会提示“非正版MC，请确保设备上MC来自于谷歌商店”并拒绝启动。基岩版在各平台单独售卖，微软商店/PC 版（包括 Java+基岩 PC 套装）和 iOS 版的购买记录均不包含安卓版，你需要在 Google Play 另行购买（可通过 Google Play 礼品卡等方式支付）；购买并从 Google Play 安装后，建议先直接启动一次游戏。从论坛、网盘、mcapks 等渠道下载的破解版或改包 MC 无法通过验证。LiteLDev 不提供任何跳过正版验证的功能，第三方流传的“去验证/破解版”启动器不受官方支持，相关问题也不予处理，请仅从 <https://github.com/LiteLDev/LeviLauncher-Android/releases> 下载官方版本。此外，启动器仅支持 ARM64 设备（32 位手机无法使用）。PC 版 LeviLauncher 同样要求微软商店正版。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## LeviLauncher 安卓版是否依赖手机上已安装的 Minecraft？对游戏有什么要求？

依赖。设备上必须安装来自 Google Play 的官方 Minecraft 基岩版（1.21.80 或更高版本）。启动器会检查其安装来源是否为 Google Play，改包、破解版或从其他渠道安装的 MC 均无法通过启动器启动。在此基础上，启动器还支持导入官方 Minecraft APK，无需逐一安装到系统即可在启动器内运行其他游戏版本（导入的版本通常需要开启版本隔离），但设备上仍必须保留 Google Play 版本。项目地址：<https://github.com/LiteLDev/LeviLauncher-Android>。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓版 LeviLauncher 打开后原来 MC 里的存档和模组都不见了，怎么把存档、addon、资源包和 `.so` 模组导入到启动器里？

安卓版 LeviLauncher 使用独立的数据目录，与直接启动 Google Play 版 Minecraft 本体时的数据相互隔离，因此在启动器内看不到原有存档。导入方法：将存档打包或改后缀为 `.mcworld`，addon 改为 `.mcaddon`，资源包或皮肤包改为 `.mcpack`，然后在系统“打开方式”中选择 LeviLauncher 即可导入；也可以在启动器内的内容管理（世界、资源包）中导入、导出和备份。`.so` 原生模组（以及 `.levipack` 模组包）同样可以在“打开方式”中选择 LeviLauncher 导入，或在“模组”页面添加。如果开启了版本隔离，不同版本之间的数据也相互独立，导入时请注意选对版本。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓 LeviLauncher 里导入的“模组”是什么格式？和 LeviLamina 模组有什么区别？网盘里的 apk 是模组吗？

安卓版 LeviLauncher 的模组是 Android 原生模组，格式为单个 `.so` 库，或打包好的 `.levipack`（内含 `manifest.json`、`lib<名称>.so` 和 `config` 的 ZIP 包）、`.mcmod`、`.zip` 模组包。这类模组直接通过启动器导入即可使用，由启动器内置的 Preloader（preloader-android）加载，使用独立的 `pl::` API，既不需要也无法使用 LeviLamina（LeviLamina 模组是 Windows 的 `.dll`，无法在安卓上运行），同时它们也不是 addon。网上流传的 apk 通常是已内置模组的改包游戏安装包，并非可单独导入的模组，且改包 MC 无法通过启动器的 Google Play 正版验证；启动器的“导入 APK”功能仅用于导入官方 Minecraft APK 作为额外游戏版本。如果网盘里混有其他安卓启动器的模组，请认准专为 LeviLauncher 制作且匹配当前游戏版本的 `.so` 或 `.levipack` 文件，再通过启动器导入。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓版 LeviLauncher（原 LeviLaunchroid）的 API 和 LeviLamina 有多大区别？能用 LeviLamina 的头文件开发吗？

两者完全不同，不能直接使用 LeviLamina 的头文件。安卓版 LeviLauncher 不提供 LeviLamina 那样的游戏类头文件和游戏 API（如事件、命令等）。安卓原生模组基于启动器内置的 Preloader SDK（LiteLDev/preloader-android），使用独立的 `pl::` API（涵盖生命周期、Hook、Signature 特征码查找、Patch、Config、Input、Mod Menu 等），游戏函数需要自行通过特征码或符号定位后再进行 hook。不过，模组的基本结构（`load`/`enable`/`disable`/`getSelf`，其中 `getSelf` 返回 `ll::mod::NativeMod`）与 LeviLamina 模组相似。API 文档见 <https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/mod/>，入门教程见 <https://levimc.org/zh-Hans/tutorials/develop/first-android-mod/>，源码见 <https://github.com/LiteLDev/LeviLauncher-Android>。

*适用版本：LeviLauncher-Android 当前版本（最新 v1.7.1）*

## 安卓版 LeviLauncher 如何加载渲染龙（RenderDragon）光影（如 Newb）？需要改包吗？启动器自带 MBL 吗？升级到 1.26.x 后材质变“滚木”/全白、开了光影没效果或闪退怎么办？

不需要修改 APK。安卓版 LeviLauncher 不内置光影加载器，需要自行添加 MaterialBin 加载器 mod（`.so`）：

1. mtbinloader2（MBL2）：从 <https://github.com/mcbegamerxx954/mtbinloader2/releases> 下载最新版的 `libmtbinloader2_aarch64-linux-android.so`（目前为 v0.1.18，已适配 26.60），在启动器的“模组”页面导入；
2. 或者在启动器的“外部模组”页面直接下载 MaterialBinLoader（`libmbl2.so`，适用于 MC >=1.26.45.1）。

随后通过资源包导入光影（也可以在启动器的 CurseForge 页面搜索并下载 newb 等光影），并在游戏内启用。

注意：旧版加载器不兼容新版 MC，会导致材质变成“滚木”、全白或闪退，因此务必使用最新版加载器并将启动器更新至最新版。自 26.10 起，mtbinloader2 移除了自动修复（autofix）功能，光影本身必须由作者适配对应的 MC 版本；如果开启光影后没有效果，通常是因为光影版本与游戏版本不匹配或未启用加载器，更新光影即可。Android 端无法使用 BetterRenderDragon 加载光影（该工具仅供 PC 端使用）。此外，PC 版 LeviLauncher 已移除“渲染龙光影”设置，PC 端请改用 BetterRenderDragon。

*适用版本：LeviLauncher-Android v1.7.1；MC 1.26.x（含 26.60）*

## 安卓 LeviLauncher 如何在不改包的情况下加载 4D 皮肤？4DSkin mod 从哪里下载？

不需要修改 APK。在启动器的“外部模组”页面直接下载 4DSkin（发布页为 <https://github.com/QYCottage/4DSkin-Release>，以 `4DSkin.levipack` 格式提供），注意选择与当前 MC 版本兼容的版本；随后将 4D 皮肤制作成皮肤包导入即可。

*适用版本：LeviLauncher-Android 当前版本*

## 安卓手机上的 Minecraft 自动更新了/想玩旧版本 MC，如何在 LeviLauncher 中使用旧版本？apk/apks 怎么装？

无需卸载从 Google Play 安装的 MC（启动器要求设备上保留 Play 商店版 MC），直接在 LeviLauncher 中添加旧版本即可：

1. 在“下载”页面登录已购买 Minecraft 的 Google 账号，直接从 Google Play 下载所需版本（可使用“按版本号下载”指定版本代码，例如 1.21.80.3 的版本代码为 `972108003`；仅能下载该账号仍可获取的构建）；
2. 或者自行获取官方的 apk/apks 安装包，在“下载”页面点击“导入APK”（支持 APK 和 APKS），无需借助额外的安装器。

导入的版本必须在实例设置中开启“版本隔离”才能启动。若导入失败或发生崩溃，请先将 LeviLauncher 更新至最新版。注意，启动器不支持早于 1.21.80 的游戏版本。

*适用版本：LeviLauncher-Android v1.7.0 及以上（Google Play 下载）；导入 APK 适用于当前版本*

## levimap 小地图怎么调整样式、位置、大小？怎么打开大地图？

长按小地图即可进入设置菜单：在菜单中可以将地图设为圆形、拖动调整位置，用 `Zoom` 调整显示缩放，用 `Size` 调整小地图尺寸。新版 levimap 支持双击小地图展开大地图，也可以在菜单中点击 `Big Map`。如果双击没有反应，说明 mod 版本过旧，请前往 Discord 下载最新版（同时要求启动器版本为 1.5.4 及以上）。

*适用版本：安卓 LeviLauncher 1.5.4 及以上；第三方 mod levimap。未能从源码或文档中直接证实，仅供参考。*

## 新版安卓 LeviLauncher 的内置模组在哪里查看、开启？

进入游戏后，点击悬浮按钮打开“模组菜单”，按“内置”筛选或查看“内置功能”分组，即可找到内置模组（包括快速丢弃、快速切换视角、隐藏界面、自动疾跑、缩放、FPS/CPS 显示、陀螺仪、Pojav 控制等），按需开启即可。模组菜单可在实例设置中开启或关闭（默认开启）。

*适用版本：安卓 LeviLauncher 新版（带模组菜单的版本，至最新 v1.7.1）*

## 安卓 LeviLauncher 有没有能在游戏内强制切换资源包的 mod？

有，第三方 mod BetterResourcePackManager 就具备该功能，可在 qycottage 的 Discord 频道下载（目前已推出适配 26.40 的版本）。

*适用版本：安卓 LeviLauncher；第三方 mod BetterResourcePackManager（已有 MC 26.40 版本）。未能从源码或文档中直接证实，仅供参考。*

## 安卓上 libBetterResourcePackManager 有什么替代？

BetterResourcePackManager 主要有三个功能：加载 RenderDragon 光影、局内切换资源包、加载 4D 皮肤。替代方案如下：加载 4D 皮肤可用 4Dskin mod（在 qycottage 的 Discord 获取），加载光影可用 mtbinloader2（Windows 上用 BetterRenderDragon），局内切换资源包则没有替代方案。注意：截至 2026-08，BetterResourcePackManager 已有 26.40 版本，可以先去 qycottage 的 Discord 看看有没有适配你游戏版本的新版。

*适用版本：安卓 LeviLauncher；第三方 mod。未能从源码或文档中直接证实，仅供参考。*

## 安卓版 LeviLauncher 怎么导出结构？为什么找不到以前的结构？

在启动器的世界列表中，打开世界的操作菜单并点击“提取结构”。启动器只能读取存档中已保存的结构，未用结构方块保存进存档的结构是找不到的。请先通过启动器进入该世界，放置结构方块并设为保存模式，命名后点击保存；退出世界后回到启动器点击“提取结构”，即可单个导出或打包成 ZIP 导出。

*适用版本：安卓 LeviLauncher 当前版本*

## 用 LeviLauncher 怎么实现红石显示/区块显示（红显区显）？加了光影包为什么不显示？

这类效果属于材质（`material.bin`）类光影包，只加材质包而不装加载器是不会生效的。必须先安装材质加载 mod——安卓端安装 mtbinloader2（<https://github.com/mcbegamerxx954/mtbinloader2>），PC 端安装 BetterRenderDragon（BRD，<https://github.com/QYCottage/BetterRenderDragon>）——然后再添加红显区显材质包。

*适用版本：LeviLauncher（安卓/PC）；第三方材质加载 mod。未能从源码或文档中直接证实，仅供参考。*

## 能否把其他第三方客户端（如 Flarial 安卓客户端）的功能放到 LeviLauncher 安卓端里使用？

可以尝试从该客户端的安装包（APK）中提取 arm64 的 `.so` 文件，然后在 LeviLauncher 的“模组”页面导入（启动器支持导入 `.so`、含 `manifest.json` 与 `.so` 的 `.zip`，以及 `.levipack`/`.mcmod` 模组包），作为原生模组加载。能否正常工作取决于第三方客户端本身：有用户反馈 Flarial 1.139.3 提取的 `.so` 可用，但较新版本带有包名校验，导入后可能闪退，联机时也可能闪退。此类第三方 `.so` 不受 LeviLauncher 官方支持，请仅使用可信来源，并先在隔离版本中测试。

*适用版本：LeviLauncher-Android 当前版本（v1.7.1）；第三方客户端兼容性视其版本而定。未能从源码或文档中直接证实，仅供参考。*

## 用 LeviLauncher 安卓版启动游戏后帧率被锁在 60 帧，手机明明支持 120Hz，怎么办？

帧率上限是游戏自身的设置，与启动器无关。请在游戏内“设置 → 视频”中调高帧率上限（部分机型还受系统或厂商的刷新率策略限制）。启动器内置的 FPS 显示模组只负责显示帧率，不会限制帧率。

*适用版本：当前所有版本（取决于 Minecraft 自身设置与设备）。未能从源码或文档中直接证实，仅供参考。*

## 新版 LeviLauncher 安卓端是否已经不能访问自身应用目录以外的文件？mod 配置文件放在 `/storage/emulated/0/games/` 下还能读到吗？

是的，无法再读取。自 v1.5.27 起，安卓端重构了存储访问与权限（维护者表示这是为了上架 Google Play），不再申请“所有文件访问”（`MANAGE_EXTERNAL_STORAGE`）及 `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` 等存储权限。除启动器自身目录（`/storage/emulated/0/Android/media/org.levimc.launcher/`、`Android/data/org.levimc.launcher/` 及应用私有目录）外，启动器无法直接访问其他位置，导入文件也改为通过系统文件选择器授权。原本把配置放在 `/storage/emulated/0/games/` 等公共目录的 mod，需要改为使用启动器可访问的目录（如对应实例的游戏数据目录）。

*适用版本：LeviLauncher-Android v1.5.27 及以上*

## 安卓 LeviLauncher 一定要开着模组菜单悬浮窗吗？关掉以后内置模组（切换视角、CPS 等）也不显示了？

是的。以前各 mod 各自用 imgui 绘制界面，现在内置模组和使用启动器统一 UI 接口的 mod 都挂载在模组菜单上。因此，在实例设置里关闭「模组菜单」后，内置模组的悬浮窗和 HUD 都不会再显示。如果不想遮挡画面，可以在模组菜单的常规设置中开启「仅暂停菜单显示」（仅在暂停界面显示），或者调整悬浮按钮的大小、透明度并锁定位置。

*适用版本：安卓 LeviLauncher 带模组菜单的版本（至最新 v1.7.1）*

## LeviLauncher Android 加了资源包，游戏里却看不到，怎么办？

通常是资源包导入到了错误的存储位置。请在启动器的内容管理（资源包页面）中点击「选择存储」，切换位置后重新导入：原先选「外部」就换成「内部」，原先选「内部」就换成「外部」。如果该实例开启了版本隔离，则应选择「版本隔离（内部）」或「版本隔离（外部）」。若仍看不到，可以再尝试开启或关闭版本隔离。

*适用版本：安卓 LeviLauncher 当前版本*

## LeviLauncher 安卓端 1.6.1 起“后台持续运行”选项不见了吗？切后台后回来要重新加载怎么办？

v1.6.1 移除了启动器的前台服务（即原“后台持续运行”选项），该功能现改由 BedrockTools 模组提供。请将 BedrockTools 更新到 v1.5.11 或更高版本（旧版 1.5.9 在 26.60 上不可用），并在其中开启 No Disconnect，即可让 Minecraft 在后台保持运行，切回时无需重新加载。

*适用版本：LeviLauncher-Android v1.6.1 及以上（当前 v1.7.1）；BedrockTools v1.5.11+*

## LeviLauncher Android 用的是什么 mod 加载器？有没有安卓 mod 开发文档或模板，从哪里入手？

安卓版 LeviLauncher 没有 LeviLamina 那样的加载器，而是内置了 Preloader SDK（<https://github.com/LiteLDev/preloader-android>），提供 `pl::` API，涵盖模组生命周期（`<pl/Mod.hpp>`、`PL_REGISTER_MOD`）、Hook、Signature、Patch、Config、Input、Mod Menu 等功能。官方 API 文档现已整合到 LeviLamina 文档的“Android Native Mods API”章节：<https://levimc.org/zh-Hans/LeviLamina/developer_guides/android/api/mod/>（含 Mod/Hook/Signature/Patch/Config/Input/Mod Menu 等页面）；入门教程见 <https://levimc.org/zh-Hans/tutorials/develop/first-android-mod/>。项目模板可使用 <https://github.com/QYCottage/levilauncher-android-mod-template>（点击 Use this template 创建仓库，通过 CMake+Ninja 构建出 `.levipack`，也可直接用 GitHub Actions 自动构建）；完整示例见 LiteLDev/LeviLauncher-Android 仓库中的 `examples/full-cpp-mod`。

*适用版本：LeviLauncher-Android 当前版本（最新 v1.7.1）*

## 用 LeviLauncher 安卓版启动游戏，玩一段时间后帧率被锁到 10 帧左右（原版启动没这个问题），是什么原因？

这可能是因为启动器不在手机厂商的游戏/性能白名单内，被系统限频锁帧（启动器侧暂时无法解决），低性能 SoC 本身也会加剧这一问题。可以尝试：清理后台、在系统游戏助手/性能模式中手动添加 LeviLauncher、将游戏与启动器更新到最新版本，或使用调度类工具缓解。若问题依旧，请附上设备型号、Android 版本和启动日志，到 GitHub Issues 反馈。

*适用版本：当前所有版本（取决于设备厂商系统策略）。未能从源码或文档中直接证实，仅供参考。*

## LeviLauncher 安卓版用“导入 APK”创建的实例，启动时长时间卡在 51%（清后台后更慢），导入世界存档也失败，怎么办？

通过导入 APK 创建的实例在首次启动时需解压原生库，在性能较低的设备上可能会启动缓慢。建议先将启动器更新到最新版（v1.6.0/v1.6.1 针对性能和内容管理做了大量优化）。若问题依旧，可尝试在实例设置中切换“版本隔离”后重试，或改用从 Google Play 正常安装的版本。注意：官方文档指出，导入的版本通常需要启用版本隔离才能启动；如果关闭后无法启动，请重新开启。

*适用版本：LeviLauncher-Android，导入 APK 的实例。未能从源码或文档中直接证实，仅供参考。*

## 安卓版 LeviLauncher 导入资源包/模组非常慢，有什么办法？

资源包或模组越大，导入越慢。建议先更新到最新版启动器（v1.6.1 已优化导入速度）。如果仍然嫌慢，可以手动将压缩包解压到启动器的数据目录：

- 未开启版本隔离时为 `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/_shared/external/games/com.mojang/resource_packs/`；
- 开启版本隔离的实例则在 `/storage/emulated/0/Android/media/org.levimc.launcher/minecraft/<实例目录>/external/games/com.mojang/resource_packs/`。

解压后直接启动游戏即可。一般情况下，直接在启动器内导入就够用了（导入生成的文件夹名是随机的）。

*适用版本：LeviLauncher-Android 当前版本（使用新共享存储布局时）*

## 用安卓 LeviLauncher 玩 MC 一会卡一下，或 26.40 加载资源、进服务器生成世界异常慢，是什么原因？

常见原因：

1. 同时安装了大量 mod，或开启了灵动视效、连锁等功能，导致负载过高。建议精简 mod 并关闭灵动视效；游戏默认锁 60 帧，可用 BedrockTool 等 mod 解锁帧率。
2. 26.40 首发时，部分第三方版本库提供的安装包存在 APKS 与 APK 包体问题，导致加载资源或生成世界极慢。Google Play 正版没有该问题，换用正版安装包即可（自 v1.7.0 起，可在启动器“下载”页直接从 Google Play 下载）。

*适用版本：LeviLauncher-Android；第 2 点针对 MC 26.40 首发期的第三方安装包。未能从源码或文档中直接证实，仅供参考。*

## 开发安卓原生 mod 时，一般用什么工具分析 `libminecraftpe.so`？

常用的逆向分析工具有 IDA Pro、Ghidra、Binary Ninja、radare2/Cutter、Reko 等。由于 `libminecraftpe.so` 包含数百万个函数，用 IDA 等工具打开分析会非常缓慢且占用大量内存，甚至可能卡死或崩溃。定位到目标函数后，Android 原生 mod 通常在运行时通过特征码（signature）解析地址，例如使用 PreLoader 提供的 `pl::memory::resolveSignature("...", "libminecraftpe.so")`。

*适用版本：Android 原生 mod 开发（与启动器版本无关）。未能从源码或文档中直接证实，仅供参考。*

## 安卓 LeviLauncher 装了一个 300 多 MB 的 MC 安装包，占用却变成 700 多 MB，为什么？

启动器会在该版本的目录下保存一份导入安装包的副本（`base.apk.levi`，分包则保存为 `*.apk.levi`），运行前还会从中解压原生库，因此占用空间大约是安装包的两倍。这是正常现象。

*适用版本：安卓 LeviLauncher 导入/下载的版本*
