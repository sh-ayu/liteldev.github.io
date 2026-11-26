# 安装与更新 Windows 版 LeviLauncher

## LeviLamina 已发布新的客户端版本，但 LeviLauncher 里刷新后迟迟看不到，怎么办？

新版本发布后，必须等 CI 编译完成并写入版本库 `levilamina-client-version-db`，启动器才能看到。启动器从 GitHub（`raw.githubusercontent.com`）读取该版本库；开启“使用镜像源”时，则会先经过 `gh-proxy.org` / `gh.bibk.top` 代理。这些数据源都有缓存，因此新版本通常要过几分钟才会显示。请稍等片刻，再重启启动器或刷新。命令行 `LeviLauncher.exe loader versions` / `loader install` 读取的是同一个版本库，在版本库更新前同样无法安装新版本。

*适用版本：LeviLauncher 1.1.x（Windows 版）*

## 在 PC 版 LeviLauncher 里下载 Minecraft 版本很慢，必须挂代理吗？

不需要。下载时可以选择国内的 xboxlive.cn 下载源（启动器会把 xboxlive.cn 镜像排在前面，也可以让启动器自动测速选源）；如果还是慢，换一个下载源即可。中国大陆用户默认开启“使用镜像源”，启动器更新、软件包和版本列表也会自动走国内镜像或 GitHub 代理。

*适用版本：LeviLauncher (Windows) 1.0.x 及以上*

## 微软商店版 Minecraft 被强制/自动更新到新版本，想继续用旧版本（如与 LeviLamina 对应的版本）怎么办？

先关闭 Microsoft Store 的自动更新，然后用 LeviLauncher 下载、安装并启动指定版本的 Minecraft 基岩版（GDK/UWP 均可，可开启版本隔离）。安装页的“安装 LeviLamina”开关默认开启（仅对 LeviLamina 支持的游戏版本生效），会直接安装对应的 LeviLamina。

*适用版本：LeviLauncher（Windows）当前版本；需正版 Minecraft 基岩版*

## LeviLauncher 1.1.0-beta.3 等旧版本自动更新时无法下载更新包，是电脑问题还是启动器问题？

是启动器的问题。旧版启动器使用的更新地址（GoProxy 模块镜像）上没有新版更新包，请直接前往 GitHub Releases 手动下载最新版并安装。新版启动器已改为从 GitHub Release 的 `LeviLauncher.zip` 自更新（开启镜像源时会先尝试 `gh-proxy.org` 镜像），升级后自动更新即可恢复正常。

*适用版本：LeviLauncher v1.1.0-beta.4 之前的版本需手动更新；v1.1.0 正式版起自更新正常*

## LeviLauncher PC 版 GitHub Release 里有好几个文件，有什么区别、该下载哪个？

推荐下载 `LeviLauncher-amd64-installer.exe`（安装版）。运行后按界面提示安装，路径建议选择不含中文的独立目录（不要放进 Minecraft 游戏目录）。`LeviLauncher.exe` 是便携版，单独放进一个新建的英文路径文件夹即可直接运行；`LeviLauncher.zip` 是供启动器自更新使用的更新包，一般不需要手动下载。

*适用版本：LeviLauncher（Windows）v1.1.0*

## LeviLauncher（Windows）下载/安装游戏版本时提示“当前账户没有此版本的授权”（`ERR_LICENSE_NOT_ENTITLED`），怎么办？

LeviLauncher 需要正版 Minecraft 基岩版授权。在启动器中登录的微软账号必须拥有 PC 基岩版（如未购买，可前往 <https://www.xbox.com/en-US/games/store/minecraft/9nblggh537bl> 购买），仅在游戏里登录过 Xbox 但未购买 PC 基岩版是无法通过验证的。如果已购买但仍报错，可能是因为设备数量超限：一个微软账户最多只能在 10 台设备上登录微软商店，而启动器会被算作一台单独的设备。请前往 <https://account.microsoft.com/devices/content> 移除不需要的设备，并确认游戏购买在当前登录的账号下，然后重试。其他安装或启动问题请参考官方故障排查文档：<https://levimc.org/zh-Hans/LeviLauncher/guide/update-troubleshooting>。

*适用版本：LeviLauncher（Windows）1.0.0 及以上（启动器内微软账号登录）*

## LeviLauncher 下载游戏版本或其他内容一直失败（网络错误），换网络、开代理都不行，怎么排查？启动器日志在哪？

这类情况基本都是网络问题。请先重试几次；或在「下载」页测速并切换镜像，也可以改用本地安装包导入；中国大陆用户可在设置中开启「使用镜像源」。如果使用代理，启动器会读取 Windows 系统代理（包括 PAC/自动配置脚本），因此需要在代理软件中开启系统代理；若仍无效，可开启代理软件的 TUN（虚拟网卡）模式来接管全部流量（有用户通过此方法解决）。启动器日志位于 `%LOCALAPPDATA%\LeviLauncher\Logs`（启动阶段的 `startup.log` 也在此处），报错弹窗里也有“打开日志文件夹”按钮；反馈问题时请附上日志。

*适用版本：LeviLauncher（Windows）1.1.0 及以上（日志路径）；网络建议适用当前所有版本*

## 在 LeviLauncher 中给实例安装 LeviLamina 一直失败或卡在 Resolving，报 `ERR_LIP_INSTALL_FAILED`（`context deadline exceeded`、HTTP 404/500/504、连接 `127.0.0.1:443` 失败等），怎么解决？

这类报错基本都是访问 GitHub 时的网络问题所致。

1. 在启动器设置的「包管理」中开启「使用镜像源」，并在「GitHub 代理」里选择一个预设（默认为 <https://gh-proxy.org/https://github.com>，另有 v4/v6/cdn/axisnow.gh-proxy.org、ghproxy.vip、gh.bibk.top 等，格式均为 `https://<主机>/https://github.com`），或选择「自定义」填写其他镜像。自定义此类镜像时，建议填写完整前缀（如 <https://v6.gh-proxy.org/https://github.com>）；若只填主机名，启动器会自动补上 `/https://github.com`。不同镜像在不同地区的速度差异较大，失败时可多换几个尝试。留空即可恢复默认值。
2. 修改设置后，点击「清理缓存」删除已下载的软件包文件再重试。安装过程大约需要一分钟，并非立即完成。
3. 关闭镜像源时，启动器会直连 GitHub 并走系统代理。若未开代理，日志却显示正在连接 `127.0.0.1:xxx`，说明系统中残留了代理设置，请到 Windows 设置中搜索“代理”将其关闭，或将代理软件打开后再关闭一次；反之，若确实需要使用代理，请开启代理软件的系统代理功能。
4. 也可以多尝试几次，或更换 DNS（如阿里 DoH）。
5. 如果只想先安装游戏，可以在安装页关闭「安装 LeviLamina」开关，等游戏装好后再安装。

*适用版本：LeviLauncher（Windows）1.1.0 及以上*

## LeviLauncher（Windows）安装或启动版本时提示缺少组件或无法启动，是环境问题吗？

多数是环境问题。LeviLauncher 和 LeviLamina 都需要正版基岩版授权，此外还依赖以下环境组件：

- Microsoft Edge WebView2 Runtime；
- GDK 版需要 Microsoft Gaming Services 与 Microsoft GameInput；
- UWP 版需要开启 Windows 开发者模式；
- 使用 LeviLamina 或原生模组需要 Visual C++ 运行库 x64（<https://aka.ms/vs/17/release/vc_redist.x64.exe>）。

启动器会自动检查并提示安装缺失的组件。你也可以在命令行运行 `LeviLauncher.exe doctor` 进行检查，并运行 `LeviLauncher.exe doctor --fix` 自动修复（支持修复 `vcruntime`、`gameinput`、`developer-mode` 等）。

*适用版本：LeviLauncher（Windows）1.1.0 及以上*

## 拿到 `.levipack` 格式的模组文件怎么装？PC 版 LeviLauncher 能用安卓的 `.levipack` 吗？

`.levipack` 是 LeviLauncher-Android（安卓版）专用的模组包格式，只能在安卓版中导入（直接用安卓版打开或分享给它即可）。PC 和安卓的模组互不通用：安卓模组是 arm64 架构的 `.so` 文件（文件名通常带有 `android-arm64`），无法在 PC 上使用。

PC 版（Windows）LeviLauncher 使用 `.mcmod` 模组包，同时也兼容带有 `manifest.json` 的 `.zip` 压缩包和单独的 `.dll` 文件。在实例的模组页面中，将文件直接拖入启动器窗口，或点击导入并在文件选择框中选择“所有文件 (*.*)”即可；也可以使用命令行 `LeviLauncher.exe mod import <文件>` 导入。

*适用版本：LeviLauncher（Windows）1.1.0；LeviLauncher-Android 1.7.x 及当前版本*

## levilauncher.com 是 LeviLauncher / LeviMC 的官方网站吗？

不是。levilauncher.com 与 LeviMC 无关，是一个由 AI 生成的仿冒钓鱼网站，其提供的下载文件含有病毒。LeviMC 的唯一官方网站是 <https://levimc.org>（LeviLauncher 文档：<https://levimc.org/zh-Hans/LeviLauncher/>）。

请务必只从 GitHub Releases 下载 LeviLauncher（Windows 版：<https://github.com/LiteLDev/LeviLauncher/releases>，安卓版：<https://github.com/LiteLDev/LeviLauncher-Android/releases>）。

*未能从源码或文档中直接证实，仅供参考。*

## 之前用微软官方启动器或商店装好的基岩版，能直接用 LeviLauncher 启动吗？

不建议直接接管。LeviLauncher 管理的是它自己安装的“实例”，推荐在 LeviLauncher 的“下载”页面重新安装一个相同版本（也可使用命令行 `LeviLauncher.exe install <版本或本地安装包文件>`）。

要保留存档和设置，可以在安装时选择复制现有游戏数据，或在安装后运行 `LeviLauncher.exe instance copy-data <实例> --from system`，将系统中同一通道（正式版/预览版）的原版游戏数据合并到该实例中（同名文件会被覆盖，但不会删除已有文件）。该方法适用于启用了独立数据（版本隔离）的 GDK 版实例。操作前仍建议先备份全部存档。

*适用版本：LeviLauncher（Windows）1.1.0*

## 安装 LeviLauncher 时弹出 Windows 管理员权限（UAC）提示，要允许吗？

要允许。LeviLauncher 安装程序默认安装到 `Program Files` 目录，需要管理员权限，拒绝授权将无法完成安装。请确保安装包来自官方渠道（GitHub Releases）。

此外，启动器在自更新（当安装目录不可写时）或通过 `doctor --fix` 安装 VC 运行库、GameInput 等组件时，也可能会请求管理员权限，确认来源可信后允许即可。

*适用版本：LeviLauncher（Windows）1.x*

## 去哪里找 Windows 版基岩版的历史版本（例如 1.26.23）？

LeviLauncher 自带历史版本库。你可以在“下载”页面直接选择正式版或预览版的历史版本（包含 GDK 的 msixvc 与 UWP 的 appx）；也可以使用命令行，先运行 `LeviLauncher.exe installer search 1.26.2`（预览版需加上 `--channel preview`）查看版本，再运行 `LeviLauncher.exe install 1.26.23` 进行安装。

版本列表托管在 GitHub（`LiteLDev/minecraft-windows-gdk-version-db`）上，国内用户可开启“使用镜像源”。此外，第三方站点 mcappx.com 也提供 Windows 版历史安装包，下载后可作为本地包导入。

*适用版本：LeviLauncher（Windows）1.x*

## 用 LeviLauncher 下载的 Minecraft 安装包（msixvc）怎么安装？

不要手动安装 msixvc（`Add-AppxPackage` 等方式并不适用），请直接在 LeviLauncher 内安装：在“下载”页面选择对应版本并启动安装任务，启动器会自动复用已下载的安装包（未完成的下载则会继续传输）。

你也可以使用命令行安装：运行 `LeviLauncher.exe install <版本>`，或指定本地文件运行 `LeviLauncher.exe install D:\xxx.msixvc`（支持 `.msixvc`、`.appx`、`.msix`、`.appxbundle`、`.msixbundle` 格式）。运行 `LeviLauncher.exe installer list` 可查看已下载的安装包。获取版本列表需要访问 GitHub，国内用户可开启“使用镜像源”。

*适用版本：LeviLauncher（Windows）1.x*

## LeviLauncher 安装游戏报错、模组管理点击无效或下载完无法启动，路径或文件名中带中文，怎么解决？

请尝试去除相关路径（包括启动器数据目录、实例目录、实例名和文件名）中的中文等非 ASCII 字符，然后重试。已有用户通过该方法恢复正常。

注意，虽然 v1.1.0 已修复内置包管理器记录含 `%`、`#` 及非 ASCII 字符本地路径的问题，但开启版本隔离时，如果隔离目录包含当前系统代码页无法表示的字符，依然会出问题。因此，使用纯英文路径最为稳妥。

*适用版本：LeviLauncher（Windows）。未能从源码或文档中直接证实，仅供参考。*
