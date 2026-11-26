# 安装 Android 版 LeviLauncher

## LeviLauncher 有安卓版吗？官网只看到 exe，安卓 APK 去哪里下载？问题反馈到哪里？

有。官网和文档里的 exe 是 Windows 版（仓库 `LiteLDev/LeviLauncher`）。安卓版在单独的仓库 `LiteLDev/LeviLauncher-Android`（原名 LeviLaunchroid，旧链接会自动跳转），请在 GitHub Releases 下载 APK：<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>。两端共用同一份文档：<https://levimc.org/LeviLauncher/?platform=android>（在下载页选择 Android 标签）。安卓版的问题请提交到 <https://github.com/LiteLDev/LeviLauncher-Android/issues>，并附上 Android 版本、设备型号和启动日志。运行要求：Android 9.0+ 的 ARM64 设备，且已从 Google Play 安装正版 Minecraft 基岩版 1.21.80 或更高版本。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## 安卓 LeviLauncher 选择版本列表为空 / 提示需要正版验证、找不到游戏版本，怎么回事？

安卓版 LeviLauncher 需要正版验证：必须在 Google Play 购买并安装 Minecraft（1.21.80 或更高），在微软商店等其他平台购买的无效；安装后最好先启动一次游戏，再打开启动器。破解版 MC 或从网盘下载的修改版启动器均不受支持，请从 <https://github.com/LiteLDev/LeviLauncher-Android/releases> 下载官方版本。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## LeviLauncher Android 中如何导入 .so 模组？

有以下两种方式：

1. 在文件管理器中找到 `.so`（或 `.levipack` / `.mcmod` 模组包），用“打开方式”选择 LeviLauncher 导入；
2. 在启动器的“模组”页面点击“添加模组”，通过文件选择器选择文件（也可以先把文件放到手机 `Download` 文件夹，再点击“扫描”添加）。

注意：模组必须是为 Android（`arm64-v8a`）编译的原生模组，不能把 Windows 的 `.dll` 直接改后缀为 `.so`。

*适用版本：LeviLauncher-Android 当前所有版本（最新 v1.7.1）*

## LeviLauncher 安卓版能否通过系统“分享”导入 apk/apks 安装包？用第三方来源的 MC 时登录账号点“下一步”后直接返回启动器主页面，怎么办？

LeviLauncher 只支持从 Google Play 商店安装的正版 Minecraft，并会校验设备上 MC 的安装来源。使用非 Play 来源的安装包（破解包或重签名包）会提示“需要 Play 商店版本”，或出现无法登录、点击“下一步”后直接返回主页面等问题。apk/apks 不支持通过系统分享导入，请在启动器“下载”页面点击“导入APK”（支持 APK/APKS），或登录已购买 MC 的 Google 账号直接从 Google Play 下载。apks 是分包格式，自行合成为单个 apk 会改变签名，无法作为正版使用。同时，设备上仍需保留从 Play 商店安装的正版 MC。

*适用版本：LeviLauncher-Android 当前版本（v1.7.x）*

## 安卓上从网盘/QQ 群/论坛/版本库等非官方渠道下载的 LeviLauncher 或 MC 安装包，启动黑屏、闪退（如生成 `tombstone_xxx_org.levimc.launcher...xcrash`）、或导入安装包失败，怎么办？

1. 请只从官方 GitHub Release 下载启动器：<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>（下载 `LeviLauncher-vX.Y.Z-release.apk`；仓库原名 LeviLaunchroid，旧链接会自动跳转，安装后应用名为 LeviLauncher，包名为 `org.levimc.launcher`）。非官方渠道的启动器不保证可用，官方也不提供支持。
2. MC 必须是在 Google Play 购买并安装到设备上的正版 Minecraft 基岩版（1.21.80 或更高、`arm64-v8a` 64 位）。使用论坛、版本库、网盘的安装包，以及破解版或去验证版所产生的问题，官方均不提供支持。Google Play 版需单独购买，与其他平台不互通。
3. 从 v1.7.0 起，可以在启动器“下载”页面登录已购买该游戏的 Google 账号，直接从 Google Play 下载 Minecraft，无需自行寻找安装包。
4. 导入的游戏版本通常需要在实例设置中启用“版本隔离”才能启动。

*适用版本：LeviLauncher-Android 当前版本（v1.7.x）；Google Play 下载功能需 v1.7.0+*

## LeviLauncher 安卓版在启动器内更新失败，或提示“签名不一致”无法安装，怎么办？

启动器内更新会通过 GitHub API 获取最新 Release，下载 APK 后交由系统安装。如果网络无法访问 GitHub，更新就会失败，此时请前往 GitHub Release（<https://github.com/LiteLDev/LeviLauncher-Android/releases/latest>）下载新版 APK，手动覆盖安装。若提示“签名不一致”，说明当前安装的不是官方构建（例如被他人修改并重新打包签名），系统不允许用官方签名的 APK 直接覆盖；请先备份数据（如导出世界），卸载旧版后再安装官方 Release 的 APK。

*适用版本：LeviLauncher-Android 当前所有版本*

## LeviLauncher 安卓版更新时，旧数据（包括游戏内数据）会保留吗？

会。不卸载旧版，直接覆盖安装新版本（或使用启动器内更新）即可保留数据。前提是新旧版本均为官方签名的构建；否则会提示签名不一致，只能卸载重装，而卸载会清除启动器数据。建议先用启动器的导出功能，将重要世界备份到应用存储之外。

*适用版本：LeviLauncher-Android 当前所有版本*

## 安卓版 LeviLauncher 去哪里下载 .so 客户端模组？

建议优先在启动器内下载：主页提供“LeviMC 模组”（来自 levimc.org 模组目录，仅列出作者已上传到该平台的 Android arm64 客户端构建）和“外部模组 / External Mods”（社区维护的 LeviModHub 目录，通过 GitHub 代理下载，默认使用 `gh-proxy.org`）。如果启动器内没有所需的模组，可以点击“外部模组”页面的 Discord 按钮加入社区 Discord，在插件分区获取；部分模组也会以 mcpack 形式发布在 CurseForge 上（包内含 `.so`）。请仅安装可信来源的模组，并确保选择与 MC 版本对应的 arm64 版本。

*适用版本：LeviLauncher-Android v1.7.0 及以上（内置模组目录）*

## 安卓 LeviLauncher 导入模组包后没有模组功能、下载页也看不到可下载的版本，以前可以用现在不行，怎么回事？

请先前往 <https://github.com/LiteLDev/LeviLauncher-Android/releases> 更新到最新版启动器（原仓库名 LeviLaunchroid 已更名为 LeviLauncher-Android）。问题的根源在于启动器只支持正版 Minecraft：系统中必须装有从 Google Play 安装的官方 Minecraft（`com.mojang.minecraftpe`），否则启动会被拒绝。自 v1.7.0 起，“下载”页面改为登录已购买 Minecraft 的 Google 账号后直接从 Google Play 下载；若未登录或账号未购买游戏，列表就会为空（页面上会说明原因）。以前能用通常是因为当时使用的是非正版。请勿使用来源不明的启动器或游戏安装包。

*适用版本：LeviLauncher-Android v1.7.0 及以上（下载页说明）；正版校验适用于当前所有版本*

## 安卓版 LeviLauncher 能不能把桌面上安装的 Minecraft 删掉，只保留在启动器里？删了之后启动失败怎么办？

不行。启动器要求系统中始终保留一份从 Google Play 安装的正版 Minecraft（包名 `com.mojang.minecraftpe`，1.21.80 或更高），并在启动时校验其安装来源。导入的其他版本 APK 可以直接在启动器内运行，无需逐个安装到系统，但它们不能替代系统中安装的这份正版游戏。如果因修改包名制作共存版而导致异常，请先卸载当前的 Minecraft，从 Google Play 重新安装正常包名的版本，再通过启动器启动；之后即可在启动器中导入其他版本的安装包。如需删除导入的版本，可在对应实例的设置中操作。

*适用版本：LeviLauncher-Android 当前所有版本（v1.7.1）*
