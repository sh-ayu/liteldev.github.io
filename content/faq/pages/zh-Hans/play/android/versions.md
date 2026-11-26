# Android 版 LeviLauncher 的版本与兼容性

## 鸿蒙系统能用 LeviLauncher 安卓版吗？没有 GMS/Google Play 时启动器识别不到 MC 有办法吗？

LeviLauncher 安卓版要求设备上的 Minecraft 必须通过 Google Play 商店安装（启动器会检查 MC 的安装来源是否为 `com.android.vending`），因此设备需要能运行 Google Play 商店并从中安装正版 MC。有用户反馈，兼容安卓应用且能使用 Google Play 的鸿蒙设备（如鸿蒙 6）可以正常使用。如果设备无法使用 GMS/Google Play，MC 就无法以 Google Play 来源安装，也就无法通过启动器的正版验证，目前对此没有官方解决方案。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）；具体鸿蒙版本兼容性依赖设备环境。未能从源码或文档中直接证实，仅供参考。*

## 为什么 Windows 版的 .dll mod（LeviLamina 模组）无法导入安卓版 LeviLauncher？

`.dll` 是 Windows 平台的 mod（供 PC 上的 LeviLamina / Windows 版 LeviLauncher 使用），与安卓不通用。安卓版 LeviLauncher 只支持为 Android 编译的原生模组（`.so` 文件，或 `.levipack` / `.mcmod` / `.zip` 模组包），并由内置的 Preloader（`preloader-android`）而非 LeviLamina 加载。要使用 `.dll` mod，需在电脑上使用 PC 版 LeviLauncher + LeviLamina；在安卓设备上则需要使用专门的 Android 版 mod。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓 LeviLauncher 上 MC 1.26.60.x 能进游戏但加载不了光影，是什么原因？

请按顺序排查以下几项：MC 版本；是否安装了最新版渲染龙加载器（mtbinloader2，或启动器“外部模组”里的 MaterialBinLoader）；光影包版本是否与 MC 版本匹配；MC 安装包是否来自官方正版渠道。常见原因是游戏版本与光影或加载器不兼容，或使用了非官方渠道的安装包。建议在启动器的“下载”页面登录已购买 Minecraft 的 Google 账号，直接从 Google Play 下载对应版本，再加载适配该版本的光影。

*适用版本：LeviLauncher-Android v1.7.0 及以上（Google Play 下载功能），MC 26.60*

## LeviLauncher 安卓端装了旧的 libfusembl2.so 光影加载模组后游戏（26.5x）启动不了，该用什么替代？

请停用旧的 `libfusembl2.so`，改用最新版 mtbinloader2：<https://github.com/mcbegamerxx954/mtbinloader2/releases>（26.51 推荐使用 0.1.17，目前最新 v0.1.18 已适配 26.60），或直接在启动器的“外部模组”页面下载 MaterialBinLoader（`libmbl2.so`）。其他模组可在启动器的外部模组页面或 LeviLauncher 的 Discord 获取。

*适用版本：LeviLauncher-Android 当前版本，MC 26.5x~26.60*

## LeviLauncher 安卓版能否运行旧版 MC，例如 1.18.203？

不能。安卓版 LeviLauncher 支持的最低 MC 版本为 1.21.80。启动更早的版本时会提示“此启动器不支持早于 1.21.80 的 Minecraft 版本”，Google Play 下载列表中也不会显示更早的版本。

*适用版本：LeviLauncher-Android 当前版本（v1.7.1）*

## 安卓版 LeviLauncher 导入某个 MC 版本（如 26.10）后崩溃，或提示要求 64 位，是什么原因？

LeviLauncher 安卓版仅支持 ARM64（`arm64-v8a` / armv8，64 位）设备和 64 位 Minecraft。armv7（32 位）的安装包导入后无法使用，必须换成 64 位安装包。建议使用 Google Play 正版（自 v1.7.0 起，也可在启动器内登录 Google 账号直接下载）。此外，导入的版本通常需要启用版本隔离才能启动。

*适用版本：LeviLauncher-Android 当前所有版本*

## 安卓 LeviLauncher 下载 Minecraft 安装包或模组时有 aarch64 / armv7 / x86 等多个架构版本，应该选哪个？

选择 arm64（`aarch64` / armv8 / `arm64-v8a`）。LeviLauncher 安卓版本身仅构建 `arm64-v8a` 版本，也仅支持 ARM64 设备上的 64 位 Minecraft，其他架构的 MC 安装包均无法启动。`.so` 模组同样要选 arm64 版本，且模组版本必须与所用的 MC 版本对应。启动器内置的模组目录已按 `android-arm64` 平台筛选，可直接安装。

*适用版本：LeviLauncher-Android 当前所有版本*

## 安卓 LeviLauncher 把 Minecraft 升级到新版本（例如 26.40）后启动崩溃（`tombstone ... org.levimc.launcher...xcrash`），或原来的 .so 模组（小地图、光影/渲染类、mtbinloader 等）不能用了，为什么？怎么办？

原生 `.so` 模组依赖游戏内函数的特征码（signature）/符号。MC 大版本更新后，这些特征码或符号通常会发生变化，需要模组作者重新适配；未适配前加载就可能失效或直接导致崩溃。少数模组用到的符号未发生变化，因此仍能继续使用。处理方法：先在启动器中禁用最近添加或尚未适配新版本的模组，确认无模组时游戏能正常启动，再逐一启用以排查问题模组；待模组作者发布对应的新版本后再使用。如需继续使用旧模组，可保留一个旧版本 MC 的隔离实例。

*适用版本：LeviLauncher-Android 当前所有版本；任何 MC 版本更新后均适用*

## 安卓小地图 mod levimap 对游戏和启动器版本有什么要求？在哪下载？有 PC 版吗？开源吗？

levimap 要求 MC 26.30 及以上版本，安卓 LeviLauncher 也必须为 1.5.4 及以上版本（启动器版本过旧会出现无法输入等问题）。该模组不支持 26.10/26.20，目前也没有适配低版本的计划。请前往 LeviLauncher Discord 服务器的 levimap 子频道下载（下载链接带有广告，可为作者带来收益，请勿直接转发文件）。该模组仅有安卓版，没有 PC 版，且不开源。

*适用版本：MC 26.30+；安卓 LeviLauncher 1.5.4+。未能从源码或文档中直接证实，仅供参考。*

## GitHub 上的 Stipuleroo 等 mod 在安卓 LeviLauncher 中导入失败，为什么？

这些是 Windows 版 LeviLamina 客户端 mod（文件名标有 Windows，内容为 `.dll`），未适配安卓平台，因此无法在安卓启动器中使用。安卓版只能导入 arm64 原生模组：`.so` 文件、包含 `manifest.json` 与 `.so` 的 `.zip`，或 `.levipack`/`.mcmod` 模组包。

*适用版本：LeviLauncher-Android 当前所有版本*

## MC 26.30 和 26.33 只是小版本差别，为 26.30 做的 mod 一定能在 26.33 上用吗？能互相联机吗？

小版本（如 26.30 与 26.33）之间的网络协议通常相同，一般可以互相联机。但协议相同不代表 mod 兼容：mod 依赖的 hook 点或符号在小版本间可能发生变化，能否使用取决于作者是否适配了对应版本（例如有的 mod 仅声明支持 26.30）。安装前请先查看 mod 标注的支持游戏版本。

*适用版本：LeviLauncher-Android 上运行的原生 mod，当前所有版本（具体兼容性取决于各 mod）。未能从源码或文档中直接证实，仅供参考。*

## MC 基岩版 1.26.40.22 在安卓上对系统版本有什么要求？

自 1.26.40.22（26.40 系列测试版）起，Minecraft 基岩版安卓端最低要求 Android 12，更低版本的安卓系统无法运行该版本及后续版本的游戏（这是游戏本身的要求，与启动器无关）。

*适用版本：Minecraft 基岩版 26.40（1.26.40.22）及以后版本。未能从源码或文档中直接证实，仅供参考。*
