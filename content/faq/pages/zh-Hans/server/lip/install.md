# 安装 lip 与部署服务器

## 用 lip 安装的插件/模组怎么卸载？直接删掉插件文件夹为什么不行？

在服务器目录执行 `lip uninstall <包>`。其中的包可以填写 `lip list` 显示的包标识（如 `lip uninstall github.com/LiteLDev/LegacyScriptEngine#lua`），也可以填写安装时的来源（如 `./package.zip`）；执行前可加上 `--dry-run` 预览将删除的内容。lip 会运行卸载钩子、删除该包所属的文件，并自动卸载不再需要的依赖。切勿直接手动删除文件夹：lip 在 `.lip/state.json` 中记录已安装的包，手动删除后 lip 仍认为该包已安装，此时再执行 `lip install` 安装同一版本也不会重装。如果已经手动删除，请先执行 `lip uninstall` 再执行 `lip install`。若重装后依然异常，可在新建的空目录中用 lip 纯净安装 LeviLamina 服务器，以此排查是服务端还是插件的问题。更多子命令可通过 `lip --help` 查看，或直接运行 `lip` 打开界面。

*适用版本：当前所有 lip 版本（状态文件路径为 lip v0.40+ 的 `.lip/state.json`）*

## 怎么用 lip 更新已安装的插件？能一键更新所有包吗？依赖会跟着更新吗？LeviLamina 本身怎么更新？

请使用 `lip update`（旧版的 `lip install --upgrade` / `-U` 已移除）。在服务器目录中执行：

- `lip update`：不带参数时，按安装时的来源重新请求所有显式安装的包（按 `<repo>` 安装的包会升至最高版本标签，固定了 `@版本` 的包保持不变）；
- `lip update github.com/user/repo`：只更新指定的单个包；
- `lip update github.com/user/repo@1.2.0`：切换到指定版本（可升级也可降级）。

执行前可加 `--dry-run` 预览。依赖仅在新版本需要时才会随之更新，具体能否变动取决于插件 `lip.toml` 中 `deps` 声明的版本范围。`lip update` 不会改动游戏（BDS）和加载器（LeviLamina），也不接受它们作为参数；如需更换 LeviLamina 或游戏版本，请使用 `lip setup`。上述命令需在服务器（工作区）目录中执行（在资源管理器中打开服务器目录，在地址栏输入 `cmd` 或 `powershell` 并回车即可），也可以直接运行 `lip`，在界面的“模组”页中更新。

*适用版本：lip v0.40 及以上*

## 用 lip 安装插件后提示缺少依赖（前置），为什么 lip 没自动装上？

lip 会自动安装包在 `lip.toml` 的 `deps` 中声明的依赖（格式为 `<包 ID>` 或 `<包 ID>#<变体>` = 版本范围）。未自动安装通常有以下两种原因：

1. 插件作者未在 `deps` 中声明该依赖。此时只能联系作者补上，或自行找到对应包并手动执行 `lip install`（报错信息通常包含缺失的包 ID 和版本范围，可在 <https://levimc.org/zh-Hans/mods/> 搜索）。
2. 缺少的是游戏或 LeviLamina 本身：`lip install` 绝不会安装、卸载或替换游戏和加载器。如果模组需要其他版本的 LeviLamina，命令会失败并提示使用 `lip setup`；此时需先用 `lip setup` 配置该模组支持的游戏和 LeviLamina 版本，再安装模组。

旧版 `tooth.json` 中的 `prerequisites` 字段已移除。对于手动安装的插件，请确认其依赖插件确实位于 `mods` 目录中。

*适用版本：lip v0.40 及以上；LeviLamina 1.x 及以上（模组目录为 `mods/`）*

## 如何用 lip 一次性装好 LeviLamina（含 BDS）以及 LSE、反作弊、优化、多维度等常用组件？

在新建的空文件夹中执行以下命令（可用一条命令安装多个包，作为单次操作完成）：

```shell
lip install LeviLamina github.com/LiteLDev/LegacyScriptEngine github.com/LiteLDev/LeviAntiCheat github.com/LiteLDev/LeviOptimize github.com/LiteLDev/MoreDimensions
```

安装 LeviLamina 时会自动安装与之适配的 BDS（期间需输入 `yes` 同意 Minecraft EULA，在脚本中可加 `--accept-eula` 跳过交互）。LSE 默认变体包含 QuickJS 与 Lua 引擎，其他引擎需通过变体安装：`github.com/LiteLDev/LegacyScriptEngine#nodejs`、`github.com/LiteLDev/LegacyScriptEngine#python`。后续在已有 BDS 的工作区中加装模组，只需执行 `lip install <包>`。第三方包（如 GMLIB 等）同样使用 `lip install github.com/<作者>/<仓库>` 安装，安装前需确认其支持当前 LL 版本。

*适用版本：当前 lip（v0.41.x）与 LeviLamina 26.60.x*

## lip 默认装的是最新 LeviLamina 和对应的最新 BDS，客户端/存档/插件只支持旧版本，怎么用 lip 安装指定版本的 LeviLamina 或 BDS（以及指定版本的其他包）？

`lip install` 不指定版本时会安装最新版本，安装 LeviLamina 会连带安装与之适配的 BDS（客户端版本必须与服务端匹配，可在 BDS 控制台输入 `version` 查看）。如需安装指定版本，请在新建的空文件夹中按以下方式执行：

1. 按 LeviLamina 版本安装：执行 `lip install LeviLamina@<版本号>`（即 `github.com/LiteLDev/LeviLamina@<版本号>`），这会安装该 LL 支持的最新 BDS。版本号可在 LeviLamina 的 GitHub Releases 页面查询。
2. 按 BDS 版本安装：执行 `lip setup --game <BDS版本>`（如 `--game 1.21.60`，会自动选择适配的最新 LeviLamina，也可加上 `--loader levilamina@<版本号>` 指定 LL 版本）；或者将两者写在同一条命令中：`lip install github.com/LiteLDev/bds@<BDS版本> LeviLamina`。注意，不要分两条命令先装 bds 再装 LeviLamina，否则后一条命令会按 LL 重新选择游戏版本。
3. 为已有服务器更换版本：在服务器文件夹中再次运行 `lip setup --game <版本>`，`worlds`、`server.properties` 等文件会保留，其他模组则会替换为兼容的版本。降级前务必备份存档，高版本存档降级可能会损坏。
4. 安装指定版本的其他包：同样在包名后加上 `@版本号`（可包含变体），例如 `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@0.22.4`，请注意选择与已安装的 LL 兼容的版本。

如果访问 GitHub 较慢，可先执行 `lip config set github_proxy <代理URL>`；执行 `lip cache clean` 可清理下载缓存。

*适用版本：当前 lip（v0.41.x）；版本号以 LeviLamina/LSE Releases 为准*

## 国内网络（或云服务器、校园网）下用 lip 安装 LeviLamina、LegacyScriptEngine 等包时下载很慢、卡住或报网络错误，怎么配置镜像/代理？

这是访问 GitHub 不畅导致的网络问题。lip 的绝大多数包都从 GitHub 下载，可以为 lip 配置 GitHub 代理（即 URL 前缀式的 GitHub 镜像）：

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

你可以将镜像地址替换为其他可用且受信任的 GitHub 前缀代理。使用 0.41.1 及更早版本的 lip 时，部分代理服务要求在地址末尾附上完整的 `https://github.com/`（0.41.1 之后的 lip 会自动补全，手动附上同样有效）。

注意事项：

1. 当前版本的 lip 仅保留 `github_proxy` 这一项网络配置。旧版的 `GoModuleProxyURL` / `GitHubMirrorURL` / `ProxyURL`、`go_module_proxy` / `go_module_proxies` / `github_proxies` 均已移除，也不再使用 `goproxy.cn` 等 Go 模块代理，配置这些选项没有任何效果。
2. 只有发往 GitHub 的请求会走 `github_proxy`（涵盖 `github.com`；0.41.1 之后的 lip 还包括 `*.github.com`、`*.githubusercontent.com` 以及 `lip self-update`）；BDS 本体从 minecraft.net 下载，不受此配置影响。
3. 代理请求失败时，lip 会自动回退为直连 GitHub，因此命令执行成功并不代表代理有效。可用以下命令测试代理：`curl.exe -s -o NUL -w "%{http_code}" "<代理地址>LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"`，返回 `200` 即说明代理可用。若镜像失效（被墙）或报错提示代理不支持 git 仓库，请更换其他镜像。
4. 如果已有常规 HTTP 代理（如 Clash 本地端口 `http://127.0.0.1:7890`，请确认端口号正确），则无需设置 `github_proxy`。在运行 lip 的终端中设置环境变量 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` / `NO_PROXY` 即可（PowerShell 中执行：`$env:HTTPS_PROXY = "http://127.0.0.1:7890"`）；未设置这些环境变量时，lip 会使用系统代理。此外，也可以直接开启代理软件的 TUN 模式。
5. 移除代理可执行 `lip config delete github_proxy`；强制直连可执行 `lip config set github_proxy ""`（PowerShell 中需写为 `lip config set github_proxy --% ""`）。使用 `lip config list` 可查看当前配置。
6. 如果此前的失败下载留下了损坏的缓存，请执行 `lip cache clean` 后重试。同时建议先将 lip 更新至最新版本。
7. 如果以上方法均不奏效，可以在网络良好的机器上完成安装，再打包上传至服务器。

*适用版本：lip v0.41.x（当前最新）；旧版配置键仅适用于早期 Go 版 lip*

## Windows 上安装 lip 后，命令行提示找不到 lip 命令（或提示缺少 .NET 运行时），怎么办？

推荐从 <https://github.com/LiteLDev/lip/releases/latest> 下载 `lip-<版本>-win-x64.msi`（ARM 设备请下载 `win-arm64`）进行安装，安装程序会自动将安装目录添加至系统 PATH。安装完成后，必须关闭原有的 cmd/PowerShell 窗口并重新打开，新的 PATH 才会生效。如果使用的是 zip 便携版，则需手动将 `lip.exe` 所在的目录路径（不含文件名）添加到“编辑系统环境变量 → 环境变量 → Path”中，同样需要重开终端，之后可用 `echo %PATH%` 检查是否生效。如果不配置 PATH，也可以直接输入 `lip.exe` 的完整路径运行（路径含空格时需加引号），或将 `lip.exe` 放在当前工作目录下运行（cmd 中直接输入 `lip`，PowerShell 中需输入 `.\lip`）。当前版本的 lip 是独立自包含的可执行文件，无需额外安装 .NET 运行时。

*适用版本：当前 lip（v0.41.x），Windows*

## lip 的 Release 页面有很多文件（x64/arm64、msi/zip 等），Intel/AMD 的 Windows 电脑或 Windows Server、面板服应该下载哪个？

x64/amd64 与 arm64 指的是 CPU 架构，而非处理器品牌。普通 Intel 和 AMD 电脑以及 Windows Server 2022 等系统都属于 x64 架构；arm64 仅适用于 ARM 设备，下错架构会提示与系统不匹配。当前 lip 发布页（<https://github.com/LiteLDev/lip/releases/latest>）提供以下文件：`lip-<版本>-win-x64.msi` / `win-x64.zip`（Windows x64）、`win-arm64.msi` / `win-arm64.zip`（Windows ARM）、`linux-x64.tar.xz`（x64 Linux）、`osx-x64.zip` / `osx-arm64.zip`（macOS）。Windows 环境一般下载 `win-x64.msi` 安装即可（会自动写入 PATH）；面板服或无法运行 msi 的环境可下载 `win-x64.zip` 解压使用。macOS 和 Linux 无需手动选择，运行 `curl -fsSL https://levimc.org/lip/install.sh | sh` 即可自动匹配并下载对应的压缩包。所有版本均为自包含的单文件程序，无需额外安装 .NET。lip 本身支持跨平台，在 Linux/macOS 上会通过自动下载的 Wine 来运行带 LeviLamina 的 Windows 服务器；目前没有 arm64 Linux 版。

*适用版本：当前 lip（v0.41.x）*

## lip 包管理器在哪里下载、怎么安装？有没有 winget 安装方式？能否自更新？有没有 Linux 版？

lip 的仓库现已迁移至 <https://github.com/LiteLDev/lip>（原为 `futrime/lip`），文档位于 <https://levimc.org/zh-Hans/lip/>。lip 支持 Windows（x64 和 arm64）、macOS（Apple 芯片和 Intel）以及 x64 Linux。请根据你的系统选择安装方式：


::: tabs

== Windows

前往 <https://github.com/LiteLDev/lip/releases/latest> 下载 `lip-<版本>-win-x64.msi`（ARM 设备请下载 `lip-<版本>-win-arm64.msi`）并运行安装，安装程序会自动将其加入 PATH；也可以下载同名的 `.zip` 压缩包，解压后手动将目录加入 PATH。

== macOS / Linux

在终端中运行 `curl -fsSL https://levimc.org/lip/install.sh | sh`。脚本会自动匹配当前系统，校验 SHA-256，并将 lip 安装到 `~/.local/bin`（无需管理员密码或 root 权限），最后询问是否将该目录加入 PATH。在搭载 Apple 芯片的 Mac 上，lip 首次需要 Rosetta 2 时会询问是否安装。目前没有 arm64 Linux 版的 lip。

:::

全部安装方式（包括手动安装所用的压缩包）详见[安装 lip](https://levimc.org/zh-Hans/lip/install.html)。lip 是单个可执行文件，无需另外安装 .NET、git 或 Wine。官方文档已不再提供 winget 安装方式（旧的 `futrime.lip` winget 包已失效）；更新 lip 请运行 `lip self-update`（仅检查更新可使用 `lip self-update --check`）。安装完成后，在服务器文件夹中打开终端，输入 `lip` 即可进入终端界面，也可直接运行 `lip install LeviLamina` 等命令。

*适用版本：当前 lip（v0.41.x）*

## 在 x64 的 Windows（Win10/Win11/Windows Server）上下载的 lip 无法运行，是什么原因？

最常见的原因是下错了架构：x64 电脑应下载 Release 中的 `win-x64` 版本（`lip-<版本>-win-x64.zip` 或 `lip-<版本>-win-x64.msi`），而非 `win-arm64` 版本。旧版 lip 的文件名使用 `amd64`/`arm64`，现已改为 `win-x64`/`win-arm64`。如果架构无误但仍无法启动，且系统为精简版或魔改版 Windows 10，则可能是由 .NET 9 起默认启用的 CET（控制流强制技术）兼容性问题导致的（参考 <https://learn.microsoft.com/zh-cn/dotnet/core/compatibility/interop/9.0/cet-support>），建议换用官方原版系统镜像。

*适用版本：lip 当前版本（v0.41.x；win-x64/win-arm64 命名自 C# 版 v0.33 起沿用至今）*

## 在 Windows Server（如 2022 数据中心版）上 lip 安装器报错 `lip Setup Wizard ended prematurely because of an error` 或 lip 无法使用，怎么办？

lip 支持 Windows Server。请先确认下载的是 `win-x64` 版本（只要服务器不是 ARM 架构，就不要下载 `win-arm64`）。如果 msi 安装器报错，可以改用免安装版：下载 `lip-<版本>-win-x64.zip`，解压出 `lip.exe`，并将其所在目录加入 PATH 环境变量即可（msi 安装器的主要作用也是将 lip 释放到 `Program Files\lip` 并将该目录写入 PATH）。当前版本的 lip 为自包含程序，无需额外安装 .NET 运行时；解压即用的便携版后续同样支持通过 `lip self-update` 升级。

*适用版本：lip 当前版本（v0.41.x，自包含发布，无需 .NET）*

## 用 lip 安装某个包失败（换版本号也不行、像是包没上传完，或依赖无法满足），是什么原因？

常见原因是本地 lip 版本过旧，无法解析新格式的包（新包使用 `lip.toml`，而旧版 lip 仅识别 `tooth.json`）。请先执行 `lip self-update` 将 lip 更新到最新版，然后再试。如果确实无法满足依赖（例如作者尚未发布符合要求的依赖版本，或写错了版本号），由于当前 lip 没有跳过依赖检查的选项，只能改用该包的其他版本、通过 `lip setup` 切换到匹配的游戏/LeviLamina 版本，或等待作者修复。

*适用版本：lip 当前版本（v0.41.x；支持 `lip self-update`）*

## LeviLamina/BDS 是手动安装（或 exe 安装）的，之后用 lip 安装 LegacyScriptEngine、LeviAntiCheat 等依赖 LeviLamina 的模组时提示缺少依赖、识别不到 LeviLamina，怎么办？lip 命令应该在哪里执行？

lip 只识别由它自己安装并记录在服务器文件夹 `.lip/`（状态文件）中的包。手动解压的 BDS/LeviLamina 在 lip 看来并不存在，因此要么全程使用 lip，要么全部手动管理，切勿混用。在没有游戏安装记录的文件夹中安装模组时，lip 会报错并提示先运行 `lip setup`。推荐做法是：新建一个空文件夹，在其中执行 `lip install LeviLamina`（也可连同模组一起安装：`lip install LeviLamina LegacyScriptEngine`），装好后再用 `lip install <模组>` 安装其他模组，最后将旧服务器的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 以及模组配置文件复制过来。lip 命令必须在服务器根目录（即工作区）中执行；通过 MSI 安装的 lip 已自动写入 PATH，只需 `cd` 到服务器目录即可直接运行。如果坚持全程手动安装，可查阅各包仓库中的 `lip.toml`（旧包为 `tooth.json`），其中列出了依赖项、下载地址和文件放置路径。

*适用版本：lip v0.40+（当前 v0.41.1），LeviLamina 当前版本*

## 在 BDS 控制台里输入 `lip install ...`（如更新 LeviLamina）提示 Unknown command / 无效，lip 命令应该在哪里执行？LeviLamina 会自动更新吗？

lip 是独立的命令行程序，并非 BDS 控制台命令。请在系统终端（cmd 或 PowerShell）中先切换到服务器根目录（先输入 `盘符:`，再执行 `cd 路径`；也可以在资源管理器中打开服务器目录，在地址栏输入 `cmd` 并按回车），然后执行命令。直接输入不带参数的 `lip` 会打开终端界面，可在其中创建服务器、安装模组或启动服务器。LeviLamina 不会自动更新：更换 LeviLamina 或游戏版本请运行 `lip setup --game <游戏版本> --loader levilamina@<版本>`（或在终端界面的服务器页面中使用**更改版本…**），更新其他模组则使用 `lip update`。如果面板服不提供终端，就只能手动替换文件或联系服务商处理。

*适用版本：lip v0.40+（当前 v0.41.1）*

## 用 `lip install` 升级 LeviLamina 或已装的包时提示“已经安装”或版本没变，应该怎么正确升级/安装指定版本？

1. `lip install` 仅用于安装尚未安装的包；对已安装的包再次执行 install 会被拒绝，并提示改用 `lip update`。
2. 普通模组：运行 `lip update` 可更新全部模组，运行 `lip update <包>` 可更新指定模组，运行 `lip update <包>@<版本>` 可切换到指定版本（升级或降级均可）。
3. LeviLamina 和 BDS 不能通过 install/update 更换版本，而应运行 `lip setup --game <游戏版本> --loader levilamina@<版本>`，该命令会保留存档和配置，并将模组同步切换到兼容版本；若在空文件夹中全新安装指定版本，则可使用 `lip install LeviLamina@<版本>`。
4. 所有 lip 命令都必须在服务器根目录下执行，切勿在通过 Win+R 打开的默认目录（如 `C:\Windows\System32`）中运行。
5. 如果 `lip -v` 显示的版本过旧，请前往 <https://github.com/LiteLDev/lip/releases> 安装最新版；此后即可直接使用 `lip self-update` 更新 lip 本身。

*适用版本：lip 0.40 及以上*

## 用 lip 安装 LeviLamina/服务器时文件装到了别的地方（如用户目录）或和其他文件混在一起，lip 把服务器装在哪里？怎么指定安装位置？

lip 会将服务器和包安装到执行命令时的当前工作目录（即 lip 的“工作区”）。请先新建一个空文件夹，通过 `cd <该文件夹路径>` 进入该目录（或在资源管理器的地址栏中输入 `cmd` 打开命令行），然后再执行 `lip install LeviLamina`、`lip setup ...`、`lip install <包>` 等命令。后续针对该服务器的所有 lip 操作，也都要在这个文件夹中执行。

## 面板服/云服务器上没有 lip、无法运行 lip，或联网安装失败，怎么安装 LeviLamina 及其模组？

lip 是单个可执行文件，无需额外运行环境，直接放到服务器的任意目录或 PATH 中即可使用。Linux 版仅提供 x64，要求 glibc 2.27 及以上（不支持 Alpine）。在 Linux 和 macOS 上，lip 会自动下载并配置 Wine 来运行 Windows 版服务端；Wine 需要系统装有 GnuTLS（若已装 FreeType 则还需 Fontconfig），缺少时 lip 会提示所需的包名和安装命令。

如果面板服完全无法运行 lip，可以在本地电脑上用 lip 装好整个服务器（或单个模组），再把文件上传到面板服；迁移整个服务器时，请连同 `.lip` 文件夹一并上传。也可以查看对应包的清单文件（新包位于仓库根目录的 `lip.toml`，旧包为 `tooth.json`），其中列出了各资源的下载链接（assets 的 `urls`）和放置路径（`place` / `placements`），手动下载后按指定路径放置即可。

如果只是连不上 GitHub，可以用 `lip config set github_proxy <代理地址>` 设置 GitHub 代理。

*适用版本：lip 0.40 及以上*

## 用 lip 安装 GMLIB 报 404 / 下载不了，怎么办？

GMLIB 已迁移仓库，旧地址 `github.com/GroupMountain/GMLIB` 已废弃，请改用新仓库：`lip install github.com/GroupMountain/GMLIB-Release`。GMLIB 的包声明了对 LeviLamina 的依赖，lip 会自动选择与当前已安装的 LeviLamina 兼容的版本；如需指定旧版本，可执行 `lip install github.com/GroupMountain/GMLIB-Release@<版本>`。

## lip 的 msi 安装包和直接下载 lip 可执行文件（zip）有什么区别？安装后怎么用？

两者功能没有区别。msi 是标准安装包，会自动将 lip 加入 PATH 环境变量，装好后可直接在命令行运行 `lip`，也能在“程序和功能”中卸载，适合不熟悉环境变量配置的用户；zip 是便携版，需要手动解压并放到 PATH 中的目录。两者都支持通过 `lip self-update` 更新（msi 安装的会通过 msiexec 静默更新）。安装后，在服务器文件夹中运行 `lip` 即可打开界面。

*适用版本：lip 0.41.x（Windows）*

## GitHub 访问不了，如何下载安装 lip？

lip 的安装包发布在 GitHub Releases：<https://github.com/LiteLDev/lip/releases/latest>（旧地址 `futrime/lip` 会自动跳转）。Windows 用户可下载 `lip-<版本>-win-x64.msi`（或 `-win-arm64.msi`，也提供 `.zip` 便携版），例如 <https://github.com/LiteLDev/lip/releases/download/v0.41.1/lip-0.41.1-win-x64.msi>。Linux 和 macOS 的安装脚本同样从 GitHub 下载，可通过 `LIP_GITHUB_PROXY` 环境变量传入 GitHub 代理（用法与 lip 的 `github_proxy` 配置相同）：`curl -fsSL https://levimc.org/lip/install.sh | LIP_GITHUB_PROXY=<代理URI> sh`，也可以手动下载对应的 `.tar.xz` 或 `.zip` 压缩包。

如果无法直接访问 GitHub，可以借助第三方 GitHub 加速镜像下载（在链接前加上镜像前缀，或将 `github.com` 替换为镜像域名）。安装完成后，可执行 `lip config set github_proxy <代理URI>`，让 lip 后续从 GitHub 下载时都走代理。

## LeviLamina 更新支持新版游戏后，用 lip 安装 LL 本体和 BDS 正常，但安装 LegacyScriptEngine 的 quickjs/nodejs/lua 等版本一再失败，怎么办？

先执行 `lip cache clean` 清理缓存，再重新安装，例如 `lip install LegacyScriptEngine#lua`。清理缓存不会丢失已安装的内容，lip 会重新下载所需文件；清理时请勿同时运行其他 lip 命令。如果仍然失败，请查看 `.lip/logs/` 下的失败报告；若提示游戏或加载器版本不兼容，说明该版本的 LSE 尚未适配当前的 LeviLamina，需等待 LSE 更新，或用 `lip setup` 切换到其支持的版本。

*适用版本：lip 0.41.x*

## lip 的官方地址是什么？`github.com/lippkg/lip` 还能用吗？

lip 目前的仓库地址是 <https://github.com/LiteLDev/lip>，文档位于 <https://levimc.org/zh-Hans/lip/>（英文版为 <https://levimc.org/lip/>）。旧仓库地址 `github.com/lippkg/lip` 和 `github.com/futrime/lip` 会被 GitHub 自动重定向到 LiteLDev/lip，旧文档域名 `lip.levimc.org` 等也已指向新文档，建议直接使用新地址。插件建议通过 lip 自行安装。

## winget 仓库里的 lipd 版本一直停在旧版本（如 0.33.1）没有更新，是怎么回事？

lipd 已废弃且不再单独发布，其后台守护进程功能已内置于 lip 中，只需安装或更新 lip 即可（守护进程会在首次运行 lip 命令时自动启动，可通过 `lip daemon status` 和 `lip daemon stop` 查看状态或停止）。此外，winget 镜像源只同步包清单信息，实际安装包仍从 GitHub Release 下载。

*适用版本：lip 0.34 及以后*

## 不小心在 plugins（或 mods）目录里执行了 lip 安装，结果下载了一大堆东西（甚至又下了一个服务端），该怎么办？

lip 会将当前工作目录视为工作区（即服务器文件夹），因此所有 lip 命令都应在服务器根目录下执行，不要在 mods、plugins 等子目录中运行。在子目录中执行 `lip install LeviLamina` 等命令，会在该子目录下再建一个服务端。处理方法：删掉子目录中误装的文件（包括其中的 `.lip` 文件夹），或在该子目录中运行 `lip uninstall` 卸载，然后回到服务器根目录重新执行安装命令。

## 去哪里下载旧版本的官方 BDS 服务端？官网只有最新版。

可以用 lip 下载：在空文件夹中运行 `lip setup --game <版本> --no-loader`（例如 `--game 1.21.80`，如需特定构建可写 `1.21.80-patch.3`），即可下载该版本的原版服务端；去掉 `--no-loader` 则会同时安装配套的 LeviLamina。lip 会根据 `https://levimc.org/api/v4/mc/versions/` 的构建列表从 minecraft.net 官方地址下载。此外，也可以在 Minecraft Wiki 上搜索对应版本号来获取官方直链。

## 在新建空目录中用 lip 安装 LeviLamina 26.60.x 和 LSE 0.23.x 后，启动时提示资源包版本不兼容（BDS 版本与 LeviLamina 要求的 1.26.60 不一致），原因是什么？该按什么顺序安装？

这是因为先安装了 LSE，旧版 lip 解析依赖时只拉取了 BDS 组件并默认下载了最新版 BDS，而非 LeviLamina 要求的 1.26.60。正确的顺序是先装好游戏和加载器，再安装插件：

```shell
lip install LeviLamina          # 安装最新 LeviLamina 及其支持的最新 BDS（等同一次 lip setup）
lip install LegacyScriptEngine  # 再安装 LSE（默认同时装 QuickJS 和 Lua 引擎）
```

也可以显式指定版本：先执行 `lip setup --game 1.26.60 --loader levilamina`，再执行 `lip install LegacyScriptEngine#lua` 等。建议先运行 `lip self-update` 更新到最新版 lip：新版在未安装游戏的空工作区中直接安装 mod 时会报错，并提示先运行 `lip setup`，从而避免装错 BDS 版本。LeviLamina 所需的 BDS 版本记录在其 `lip.toml` 的 `github.com/LiteLDev/bds` 依赖项中（旧包为 `tooth.json`）。

*适用版本：lip 0.41.x；LeviLamina 26.60.x；LegacyScriptEngine 0.23.x*

## 如何用 lip 安装 LSE 的 Lua / QuickJS 等引擎？执行安装报错怎么办？

各语言引擎现在作为 LegacyScriptEngine 包的变体（variant）提供，安装时用 `#` 指定：

```shell
lip install LegacyScriptEngine#lua
lip install LegacyScriptEngine#quickjs
# 另有 #nodejs、#python
```

如果不指定变体（直接运行 `lip install LegacyScriptEngine`），则会同时安装 QuickJS 和 Lua 引擎。`LegacyScriptEngine` 是 `github.com/LiteLDev/LegacyScriptEngine` 的简写。安装前，工作区中需已装好服务端和 LeviLamina（可通过 `lip install LeviLamina` 或 `lip setup --game <版本>` 安装）。若遇到报错，请先运行 `lip self-update` 更新到最新版 lip，再执行 `lip cache clean` 清理缓存后重试，并查看 lip 输出的 error/hint 信息以及 `.lip/logs/` 下的失败报告。

*适用版本：lip 0.41.x；LegacyScriptEngine 0.23.x*

## 手动下载的 LeviLamina mod 启动时报缺少依赖/加载失败，以及在 BDS 1.21.70 等旧版本上如何安装对应版本的 mod？

手动下载的文件可能不完整或缺少依赖，建议改用 lip 安装，由其自动处理依赖。如需使用旧版 BDS，请先在服务器文件夹中运行 `lip setup --game 1.21.70` 搭好游戏和加载器（会自动安装适配该版本的最新 LeviLamina），再运行 `lip install <包>`，lip 会自动选择兼容当前工作区的最新版本。也可以去该 mod 的 GitHub Releases 页面查找适配目标 BDS 的版本号，用 `lip install <包地址>@<版本号>` 指定版本安装（例如 `lip install github.com/user/repo@1.2.0`）；执行前可加上 `--dry-run` 预览将要安装的内容。注意，前提是该 mod 发布过适配目标 BDS 的版本。

*适用版本：lip 0.41.x*

## 按 LeviLamina/LSE 安装文档执行 lip install 命令时，带 `@version` 的命令报错，该怎么写？

文档里 `<repo>@<version>` 中的 version 只是占位符，不能照抄。要安装最新版，直接把 `@version` 整个去掉，例如 `lip install github.com/LiteLDev/LegacyScriptEngine`（LiteLDev 的仓库也可简写为 `lip install LegacyScriptEngine`）。要安装指定版本，填写具体版本号，例如 `lip install github.com/LiteLDev/LegacyScriptEngine@0.23.1`（对应仓库的 `v0.23.1` 标签）。如需指定变体，把 `#变体` 写在 `@` 之前，如 `LegacyScriptEngine#lua@0.23.1`。

注意：在当前版本的 lip 中，`lip install LeviLamina` 或 `lip install LeviLamina@<版本>` 会按 `lip setup` 的方式一并装好匹配的 BDS（需同意 EULA）。如果已安装 LeviLamina 并想更换版本，请改用 `lip setup`。

## 用 `lip install github.com/LiteLDev/LegacyScriptEngine@版本号` 安装时，会不会把 LSE 的四个语言引擎都装上？版本号后需要带 `#` 吗？

版本号后不需要带 `#`。直接执行 `lip install github.com/LiteLDev/LegacyScriptEngine@版本号`（不指定变体）只会安装 QuickJS 和 Lua 两个引擎。Node.js 和 Python 引擎需单独指定变体安装，变体写在 `@` 之前：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs@版本号`、`lip install github.com/LiteLDev/LegacyScriptEngine#python@版本号`（不写 `@版本号` 则安装最新版）。

*适用版本：LegacyScriptEngine 0.17.x 及以后*

## 用 lip 安装 LeviLamina 后没有 LegacyScriptEngine，旧 JS/Lua 插件不能用，怎么回事？

LeviLamina 采用模块化设计，LSE 不会随 LL 自动安装，需要单独安装。请在服务端根目录下执行 `lip install github.com/LiteLDev/LegacyScriptEngine`（可简写为 `lip install LegacyScriptEngine`）。不带变体时会同时安装 QuickJS 和 Lua 引擎；若只需某一种，可加上 `#quickjs` 或 `#lua`，Node.js 和 Python 引擎则使用 `#nodejs` 和 `#python`。

也可以从 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 下载对应的 `LegacyScriptEngine-server-<引擎>-windows-x64.zip` 手动解压到服务端（引擎位于 `mods/legacy-script-engine-<引擎>/`），但手动安装需自行处理 LegacyRemoteCall、LegacyMoney、iListenAttentively 等依赖（Node.js 引擎还需另外安装 node 运行时 `node-prebuilt.zip` 与 `7-zip-tooth`），因此推荐使用 lip 安装。安装完成后，将脚本插件放入 `plugins/` 目录并重启服务器即可。

*适用版本：LeviLamina 0.10 及以上*

## 用 lip 下载/安装 LSE 的 NodeJS 引擎失败怎么办？

1. 将 lip 更新到最新版本：`lip self-update`。
2. 清理缓存后重试：`lip cache clean`。
3. 若 GitHub 访问慢或受阻，设置 GitHub 代理：`lip config set github_proxy <代理地址>`；或在终端设置系统 HTTP 代理环境变量（如在 PowerShell 中执行 `$env:HTTPS_PROXY = "http://127.0.0.1:端口"`），lip 会自动使用该代理。
4. 用当前包名重新安装：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`（可简写为 `lip install LegacyScriptEngine#nodejs`）。注意，安装前需先用 `lip setup --game <版本>` 装好游戏与 LeviLamina；若该包此前已被显式安装，`lip install` 会拒绝执行，此时应改用 `lip update`，或先执行 `lip uninstall` 再重新安装。

若仍然失败，可查看终端里的 hint 以及 `.lip/logs/` 下的失败报告来定位原因。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装 BDS/LeviLamina 时会卡在需要同意 Minecraft 用户协议（EULA）的步骤吗？写一键安装脚本时有没有跳过同意的参数？

会询问。当前 lip 在安装游戏（BDS）时，会列出 Minecraft EULA 和 Microsoft 隐私政策链接，并要求输入 `yes` 才继续；在脚本等非交互终端中，不加参数会直接失败。编写脚本时加上 `--accept-eula` 即可跳过询问，例如：

```shell
lip setup --game 1.21.0 --loader levilamina@1.0.0 --accept-eula
```

或执行 `lip install LeviLamina github.com/user/repo --accept-eula`（当 install 以 setup 方式执行时生效）。每次安装游戏都会重新询问，同意结果不会被记录。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装 LeviLamina 后启动 BDS 弹出缺少运行库类错误（看起来像要装 vcredist），但已经装了 vcredist 仍然不行，怎么办？

这通常是 BDS 本体未下载完整导致的。BDS 由 lip 包 `github.com/LiteLDev/bds` 的安装钩子调用 bdsdown 从官网下载，可通过环境变量 `BDSDOWN_MIRROR_URL` 指定下载镜像。在 PowerShell 中先设置镜像，再在空文件夹中重新安装：

```powershell
$env:BDSDOWN_MIRROR_URL="<镜像地址>"
lip setup --game <版本>
```

（或执行 `lip install LeviLamina`）。lip 会将当前终端的环境变量传递给安装过程。有用户使用 <https://mcdl.bibk.top> 作为镜像并成功下载。

## 用 lip 安装 LeviLamina 或插件失败，lip 应该在哪个目录运行？安装 LSE 需要逐个装依赖吗？

lip 以当前工作目录作为工作区，必须在服务端根目录（即 `bedrock_server.exe` 所在目录）下运行，且没有指定其他目录的选项；lip 程序本身可以放进 PATH。新建服务端时，请在空文件夹中执行 `lip setup --game <版本>`（或 `lip install LeviLamina`）。

安装 LegacyScriptEngine 只需安装本体（如 `lip install LegacyScriptEngine#lua`），LegacyRemoteCall 等其他依赖会自动解析并安装。但 `lip install` 不会安装或更换游戏与 LeviLamina，因此必须先用 `lip setup` 装好符合 LSE 版本约束的 LeviLamina，否则命令会失败并提示运行 `lip setup`。安装 LeviLamina 时会自动运行 PeEditor 生成 `bedrock_server_mod.exe`。在脚本中需要免交互执行时，请使用 `--accept-eula`（新版 lip 已移除 `-y` 参数）。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装 LeviLamina 时包名是什么？去哪里查 lip 包？

LeviLamina 的包名是 `github.com/LiteLDev/LeviLamina`。LiteLDev 组织下的仓库可以简写，如 `lip install LeviLamina`（等同于完整写法；新建服务端更推荐使用 `lip setup --game <版本>`，它会自动选配合适的 LeviLamina）。lip 没有中心化仓库，包名就是公开 git 仓库的地址。要查找 mod，可以运行 `lip` 打开交互界面的**市场**页面，或在 levimc.org 上浏览。

*适用版本：lip 0.41.x 及以上*

## 用 lip 安装/升级 LeviLamina 时中途中断（目录里残留 `bdsdown.exe` 等），或在已有旧服务端文件的目录安装后无法开服，应该怎么正确安装和升级？

新建服务端：在空文件夹中执行 `lip setup --game <版本>`（或 `lip install LeviLamina`），再用 `lip install` 安装所需的 mod，然后将旧服的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 以及各 mod 的配置文件复制过来。无需保留旧的 `bedrock_server_mod.exe`，安装 LeviLamina 时会重新生成。

升级：对于已由 lip 管理的服务端，直接在该目录下执行 `lip setup --game <新版本>`，世界存档与上述配置文件都会保留；与新版本不兼容的 mod 会被列为 left-out，并询问是否卸载。

中断恢复：当前 lip 的安装是原子操作，中途中断后，下一次执行 `lip setup/install/update/uninstall/run` 时会自动撤销或完成上次操作，无需手动删除残留文件（切勿删除 `.lip/journal` 和 `.*.bak`）。

若无法开服，请先查看服务端输出和 `logs\latest.log`（常见原因如端口被占用、mod 加载失败）。

*适用版本：lip 0.41.x；LeviLamina 26.x*

## 用 lip 安装完 LeviLamina 后，用哪个文件启动服务器？

安装了 LeviLamina 的服务器需要运行 `bedrock_server_mod.exe`（安装时由 PeEditor 从 `bedrock_server.exe` 生成），不要运行原版 `bedrock_server.exe`。使用新版 lip 时，也可以直接在服务器目录下执行 `lip run`（或在 lip 界面的服务器页面点击启动），安装了加载器时它会自动运行 `bedrock_server_mod.exe`。

## 用 lip 安装插件时没有下载过程直接显示完成，但 mods（旧版为 plugins）目录里却没有对应插件（例如 GMLIB），并提示缺少依赖，怎么办？

lip 带有下载缓存，因此可能跳过下载直接完成；同时，lip 会在工作区的 `.lip/state.json` 中记录已安装的包。如果此前手动删除过已安装包的文件，lip 仍会认为该包已安装，不会重新安装同一版本，从而导致文件缺失。

解决方法：先执行 `lip uninstall <你显式安装的包>`，再执行 `lip install <该包>` 重新安装（相关依赖会自动一并卸载和重装）。注意，`lip uninstall` 只接受显式安装的包，像 GMLIB 这类作为依赖自动装上的包不能直接卸载，必须卸载依赖它的那个模组。如果怀疑缓存损坏，可执行 `lip cache clean` 清空缓存（Windows 下缓存位于 `%LOCALAPPDATA%\lip\Cache`）。请勿手动删除 lip 安装的文件，卸载时请务必使用 `lip uninstall`。

*适用版本：lip 0.41.x*

## 能否用 lip 单独更新 BDS 本体？

可以。BDS 在 lip 中对应包 `github.com/LiteLDev/bds`（即工作区的“游戏”）。在服务器目录执行 `lip setup --game <版本>`（如 `lip setup --game 1.26.60`）即可切换到指定的 BDS 版本。lip 会同时选用适配该版本的最新 LeviLamina（也可加 `--loader levilamina@<版本>` 指定版本，或加 `--no-loader` 只装原版），并将其他模组一并切换到兼容版本；世界、`server.properties`、`allowlist.json` 和 `permissions.json` 均会保留。可加 `-n`（`--dry-run`）先预览将要发生的变更。注意，`lip install` 和 `lip update` 不能直接更新 BDS，执行后会提示改用 `lip setup`。

*适用版本：lip 0.41.x*

## 能用 lip 把 LeviLamina 更新到开发分支的最新 commit 吗？

不能以此获取未发布的开发构建。lip 通过 `lip setup --loader levilamina@<已发布版本>` 安装或切换 LeviLamina（加载器），或在 `lip install` 不带 ref 或带版本号时将其作为加载器安装。虽然 `lip install` 支持 `@branch:<名>` 和 `@rev:<commit>` 引用，但 LeviLamina 的 `lip.toml` 资源地址指向 GitHub Release 的发布包，从分支拉取到的仍是已发布版本的构建。若要使用最新提交的构建，只能从 LeviLamina 仓库的 GitHub Actions（build 工作流）下载产物并手动替换。注意，LeviLamina 的默认分支现为 `main`（已无 `develop` 分支）。

*适用版本：LeviLamina 26.x；lip 0.41.x*

## 运行 lip 提示版本太老（显示 0.31 之类），但明明已经装了新版，怎么回事？

系统中同时存在新旧两个 lip，且 PATH 环境变量仍优先指向旧版所在目录。先用 `lip --version`（或 `lip -v`）确认当前实际运行的版本，再查看其路径（PowerShell 中用 `Get-Command lip`，cmd 中用 `where lip`）。随后删除旧版，或将 PATH 改为新版 lip 的安装路径（修改后需重新打开终端）。之后可用 `lip self-update` 更新 lip 本身。

*适用版本：当前版本（Windows）*

## 把服务端直接装在磁盘根目录（如 `F:\`）时 lip 安装出错，怎么办？

不要把盘符根目录直接用作服务端目录（工作区）。请新建一个子文件夹（如 `F:\server`）作为工作区，再在其中运行 `lip setup` 或 `lip install` 进行安装。

*适用版本：旧版 lip（当前版本未确认）。未能从源码或文档中直接证实，仅供参考。*

## 用 lip 下载/安装包时下载被中断，提示被 360 安全卫士拦截，怎么办？

这是因为杀毒软件（360）拦截了 lip 的下载或文件写入。右键点击托盘中的 360 图标将其退出，或将 lip 及服务端目录加入信任白名单，然后重新执行安装命令即可。

*未能从源码或文档中直接证实，仅供参考。*
