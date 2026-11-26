# 在服务器上安装 LeviLamina

## LeviLamina

### LeviLamina 支持 Linux（或 macOS、ARM）吗？在 Linux 上怎么运行装有 LeviLamina 的服务器？

LeviLamina 没有原生 Linux 版，只能加载到 x64 的 Windows 版 BDS 中，官方 release 也只提供 `windows-x64` 包。据维护者说明：Linux 版 BDS 目前没有符号；线程、异常、hook 等机制与 Windows 不同，mod 需要重写；而且实测通过 Wine 运行 Windows 版 BDS 的性能比原生 Linux 版 BDS 更好。因此短期内没有推出原生 Linux 版的计划。

在 Linux 上，可以通过 Wine 运行 Windows 版 BDS + LeviLamina：

1. 直接使用 lip（推荐）：lip 现已提供 Linux x64 和 macOS 版。它自带 Wine（Linux 上来自 Kron4ek/Wine-Builds）并会自动安装 VC++ 运行库，无需自行安装 Wine。命令与 Windows 上相同：先执行 `lip setup --game <版本>`（会同时装好游戏和兼容的最新 LeviLamina，无需再单独 install LeviLamina；在脚本或容器中需加上 `--accept-eula`），再执行 `lip run`。
2. 使用官方 Docker 镜像：`docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine`（必须设置 `EULA=TRUE`，宿主机需为 x64）。教程见 <https://levimc.org/zh-Hans/tutorials/server/docker/>。如需使用 LeviStone（在 LeviLamina 上运行 Python 编写的 Endstone 插件），可使用 `ghcr.io/liteldev/levistone-server:latest-wine` 镜像。
3. 也可以先在 Windows 上装好服务端目录，再完整拷到 Linux 上用 Wine 运行；同一个服务端文件夹可以在不同系统之间直接迁移。如果自行安装 Wine，请使用较新的版本。

其他平台：

- x64 macOS：可通过 lip 自带的 Wine 运行。
- Apple 芯片的 macOS：需通过 lip 的 Wine 配合 Rosetta 2 运行；缺少 Rosetta 2 时 lip 会询问是否安装（加上 `--accept-rosetta-license` 可跳过询问）。
- arm64 Windows：可通过系统内置的 x64 模拟运行。
- arm64 Linux：官方不支持。box64、FEX、Hangover 等方案均无法稳定运行 LeviLamina 服务器，建议更换为 x64 机器。
- Android、iOS：不支持。
- 32 位：BDS 本身不支持。

商家的 Linux 面板服一般无法安装，需要有 Docker 权限或能自行运行 lip 的机器。如果必须在 Linux 上原生运行插件服，可以考虑 Endstone 等其他加载器，但它与 LeviLamina 生态不兼容（反过来，LeviStone 可以让 Endstone 插件运行在 LeviLamina 上，但仍需 Wine）。

*适用版本：当前所有版本（LeviLamina 26.x，lip 0.41.x，docker-levilamina-server latest-wine）*

### LeviLamina（LL3）服务端怎么安装 addon（行为包/资源包、`.mcpack`/`.mcaddon`）？LL2（LiteLoaderBDS）的 AddonsHelper 还有吗？

LeviLamina 已移除 LL2 的 AddonsHelper（`addonshelper` 文件夹），把文件放进去不会有任何反应。LeviLamina 服务端与原版 BDS 一样支持 addon，可通过以下方式安装：

1. 原版方式：将解压后的包放入 `./behavior_packs`、`./resource_packs`（或 `worlds/<存档>/behavior_packs`、`resource_packs`），再将包内 `manifest.json` 中 `header` 下的 `uuid`（pack_id）和 `version` 写入 `worlds/<存档>/world_behavior_packs.json` 或 `world_resource_packs.json`。区分资源包与行为包时，应查看 `manifest.json` 中 `modules` 的 `type`（`resources` 为资源包，`data`/`script` 为行为包），不要只看文件名。
2. 从 LeviLamina 1.9.6 起，服务端会从 mod 目录下的 `resource_packs/`、`behavior_packs/` 子目录（如 `plugins/<Mod名>/behavior_packs`，LeviLamina 自身为 `plugins/LeviLamina/behavior_packs`）加载已解压的包。其中的行为包会自动加入行为包栈，无需编辑存档的 json（主要供 mod 自带包使用）。
3. 如果想直接放入 `.mcaddon`/`.mcpack`/`.zip` 自动加载：安装社区 mod GMEssentials（`lip install github.com/GroupMountain/GMEssentials-Release`，依赖 GMLIB 等），在其配置 `features` 中将 `addon_loader` 的 `enable` 设为 `true`，然后把包放入服务端根目录的 `./addons`（可在 `addon_loader.directory` 中修改目录）。GMEssentials 的 `addon_loader` 默认关闭（`chat_formatter`、`dynamic_motd` 等部分功能默认开启），修改配置后需执行 `ll reactivate GMEssentials` 或重启服务端；该 mod 还带有清理未知方块（`cleaner_unknown_block`）功能。
4. 也可以使用独立的 CLI 工具 <https://github.com/harry-xi/addon-manager> 管理 BDS addon。

注意：`LiteLDev/LegacyAddonsManager` 和 `pingguo114514/AddonsManager` 均已归档，且所依赖的 7-zip 包已无法解析，当前 lip 无法正常安装，请勿再使用。

*适用版本：LeviLamina 当前版本（26.60.x）；第 2 种方式需 LeviLamina 1.9.6 及以上*

### 如何在 Minecraft 基岩版（Windows）客户端上安装 LeviLamina 客户端版？能手动安装吗？

不建议手动安装（步骤远比想象中繁琐）。目前推荐使用 LeviLauncher 安装：在“下载”页选择“加载器”一栏显示支持 LeviLamina 的 GDK 版本，安装实例时保持“安装 LeviLamina”开启并选择最新 LeviLamina 版本即可；已有实例可在“实例设置”→“加载器”标签页中安装、更新或移除 LeviLamina；之后可在“LeviMC 模组”中安装客户端模组（或在“管理模组”中导入 `.mcmod`）。LeviLauncher 仅支持为受支持的 GDK 版本自动安装 LeviLamina。注意，当前的 lip 仅用于管理服务器（lip 文档 FAQ：“Can lip install client mods? No. lip manages servers only.”），客户端的 LeviLamina 和模组由 LeviLauncher 这类启动器管理。从 LeviLamina 26.60.8 起，软件包已移除 `#client` 变体，默认变体同时包含服务端和客户端构建；旧包在 `tooth.json` 中声明的 `#client` 依赖会由 LeviLauncher 解析到默认变体。服务端 mod 可能需要重新编译并适配客户端后才能使用。

*适用版本：LeviLamina 1.8.0 及以上（客户端支持）；LeviLauncher Windows 版*

### 迁移 LeviLamina 服务器时只拷贝存档（`worlds`）够吗？LeviLamina 及经济、领地等 mod 的玩家数据存在哪里？

不够。LeviLamina 自身的数据（如玩家信息库 `playerinfo`，这是一个基于 LevelDB 的 KeyValueDB，用于记录 UUID/XUID/玩家名的对应关系）存放在 `mods/LeviLamina/data/` 目录下（旧版为 `plugins/LeviLamina/data/`），迁移时需一并复制。各 mod 的数据存放在各自目录下，例如 LegacyMoney 的经济数据位于 `mods/LegacyMoney/economy.db`，领地等其他 mod 的数据只需将对应 mod 目录下的数据文件一起打包迁移即可。玩家信息库默认按需启动（有 mod 调用时才加载），如需始终启用，可在 `mods/LeviLamina/config/Config.json` 中将 `targeted.playerInfo.alwaysLaunch` 设为 `true`。mod 目录现为 `mods/`，早期 0.x 版本为 `plugins/`。

*适用版本：LeviLamina 当前版本*

### 安装 LeviLamina 只能用 lip 吗？能不能手动把 GitHub Release 的 zip 解压到 BDS 目录？网上教程手动安装后报错/缺 DLL 怎么办？

官方推荐用 lip 安装，这也是官方文档唯一给出的方式，不建议手动解压拼装。

推荐做法：从 <https://github.com/LiteLDev/lip/releases/latest> 下载 `lip-<version>-win-x64.msi` 并安装。新建一个空文件夹，在其中运行 `lip`（在图形化终端界面中选「创建服务器」），或执行命令 `lip setup --game 1.26.60`（也可执行 `lip install LeviLamina` 或 `lip install github.com/LiteLDev/LeviLamina@<版本>`）。lip 会自动下载对应版本的 BDS 及全部依赖，并生成 `bedrock_server_mod.exe`。启动时请使用 `lip run` 或 `bedrock_server_mod.exe`，不要使用原版 `bedrock_server.exe`。连不上 GitHub 时，可在 lip 中配置代理或镜像。

若坚持手动安装（不受官方支持，且容易出错），需要把 lip 自动完成的步骤全部手动做一遍：阅读包根目录的 `lip.toml`（旧版为 `tooth.json`），按其中的 `deps` 下载对应版本的依赖（bds、CrashLogger、levilamina-loc、PeEditor、PreLoader、bedrock-runtime-data），再按 `place` 字段放置文件（将 LeviLamina 的 `levilamina-v<版本>-server-release-windows-x64.zip` 中的 `LeviLamina/` 放到 `mods/LeviLamina/`），最后在服务器目录执行 `PeEditor.exe -mb` 生成 `bedrock_server_mod.exe`。普通用户请下载 release 版，debug 版仅供开发调试。手动安装的具体细节以各包的 `lip.toml` 为准。

注意：网上凡是提到 `LiteLoader.dll`、`LLMoney.dll`、`.lib` 文件，或让直接把 dll 丢进 `plugins` 的教程，都属于已归档的 LiteLoaderBDS（LL2）时代，均已过时，与 LeviLamina 不兼容（经济插件现为 LegacyMoney）。请以官方教程 <https://levimc.org/zh-Hans/tutorials/server/first-server/> 为准。

*适用版本：LeviLamina 当前版本（26.60.x）；lip v0.4x*

### LeviLamina 的模组/插件应该放在哪个目录？手动解压放进去后不加载、也没有报错，怎么排查？

推荐用 lip 安装模组：`lip install <模组地址>`（如 `lip install github.com/LiteLDev/LeviOptimize`，LiteLDev 的包可用短名 `lip install LeviOptimize`；LSE 用 `lip install LegacyScriptEngine#lua` 等）。lip 会自动处理目录结构和依赖。

手动安装时请注意以下事项：

1. 目录：模组放在服务器根目录的 `mods/` 下，每个模组占一个独立文件夹，即 `mods/<模组名>/manifest.json`。安装 LegacyScriptEngine 后，LSE 启动时会把 `plugins/` 创建为指向 `mods/` 的链接，因此旧教程中的 `plugins` 实际就是 `mods`。
2. 解压时要把压缩包里“含 `manifest.json` 的文件夹”整体放进去，不能多套一层目录（打开模组文件夹应直接看到 `manifest.json`）。没有 `manifest.json` 的文件夹会被静默跳过，不会报错。
3. 文件夹名必须与 `manifest.json` 里的 `name` 一致（例如不要保留或添加“[MineBBS]-”前缀），否则会报错 `Mod name ... do not match folder ...`。
4. 只有为 LeviLamina 开发的模组才能加载。单独一个 `.dll` 通常是 LiteLoaderBDS（LL2）插件，已停更的 LL2 时代插件也一样，LeviLamina 均无法使用。单个旧式 `.js`/`.lua`/`.py` 脚本（需已安装对应的 LSE 引擎）丢进 `plugins/` 后，LSE 会在下次启动时为它生成文件夹和清单，再重启一次才会加载。
5. 检查前置依赖是否已安装并成功加载（查看控制台或 `logs` 中的依赖报错），可用 `ll list` 查看已加载的模组。
6. 若 `manifest.json` 中设置了 `"passive": true`，该模组只在被依赖时加载，不会在启动时自动加载，可用 `ll load <模组名>` 手动加载。
7. 加载报错也可能是 VC 运行库过旧所致，请安装最新的 Visual C++ 可再发行程序包 x64：<https://aka.ms/vc14/vc_redist.x64.exe>。

另外，addon（行为包/资源包）与服务端模组是两回事，不要把模组放进行为包或资源包目录。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）；`plugins` 链接需安装 LegacyScriptEngine*

### LL3（LeviLamina）是什么、去哪里下载和安装？和 LiteLoaderBDS（LL1/LL2）什么关系？新版 BDS 还能用 LL2 吗？版本怎么选？

LL1、LL2 都叫 LiteLoaderBDS，早已停止维护，无法在新版 BDS 上使用。LL3 即 LeviLamina，是 LiteLDev（LeviMC）团队开发的模组加载器，很多模组（如 CoralFans）都以它为前置。仓库与发布页：<https://github.com/LiteLDev/LeviLamina>。

推荐用 lip 安装：从 <https://github.com/LiteLDev/lip/releases/latest> 安装 lip，在空文件夹中运行 `lip`（界面中选“创建服务器”）或执行命令 `lip setup --game <游戏版本>`（如 `lip setup --game 1.26.60`），lip 会自动安装对应版本的 BDS 和适配的 LeviLamina；执行 `lip install LeviLamina` 则会安装最新版本的 LeviLamina 及其支持的最新游戏版本。

LeviLamina 版本与游戏版本一一对应，不能随意混用：例如 LeviLamina 26.60.x 对应 1.26.60，26.10.x 对应 1.26.10，1.9.x 对应 1.21.132。具体对照表见官方文档“支持的版本”页。

相关文档：教程 <https://levimc.org/zh-Hans/tutorials/server/first-server/>，LeviLamina 文档 <https://levimc.org/zh-Hans/LeviLamina/>（旧地址 `levilamina.liteldev.com`、`lamina.levimc.org` 的安装页已迁移至 levimc.org 教程）。

*适用版本：当前所有版本（LeviLamina 26.60.8；lip 0.41.x）*

### 装了 LeviLamina（及 LSE）的服务器怎么升级到新的 BDS/LeviLamina 版本？必须全部重装吗？

升级前请先备份整个服务器目录，并确认所用模组已有适配新版本的版本。

方式一（lip 工作区，推荐）：停服后，在服务器目录运行 `lip setup --game <新游戏版本>`（可先加 `--dry-run` 查看执行计划），或在 lip 界面的工作区菜单中选择“更改游戏或加载器版本…”。lip 会卸载旧版 BDS、安装新版 BDS 和适配的 LeviLamina，并保留 `server.properties`、`allowlist.json`、`permissions.json`、`worlds/` 和 `mods/`；尚无适配版本的模组会被列出，并询问是否卸载。注意，`lip update` 只会更新模组，不会更改游戏和 LeviLamina 版本。放入 `behavior_packs/`、`resource_packs/` 的自定义包会被删除，需提前在工作区外备份。

方式二（全新安装）：新建空文件夹，用 lip 安装新版服务端（执行 `lip setup --game <版本>`，再用 `lip install` 安装所需模组，如 `lip install LegacyScriptEngine#quickjs`）。随后将旧服的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 复制过去并覆盖，再将旧 `mods/` 下各模组的配置和数据复制过去（不要覆盖新安装的模组文件），服务器层的资源包和行为包也一并复制。

LSE 脚本插件一般可直接沿用；原生（C++）模组则必须替换为适配新版本的版本。升级后若出现报错或崩溃，请查看启动日志以定位不兼容的模组。

*适用版本：LeviLamina 当前版本；lip 0.41 及以上（`lip setup`）；全新安装迁移方式适用于所有版本*

### 已经在运行的原版 BDS 服务器能否直接加装 LeviLamina？需要重装吗？

可以加装，存档无需重做，但 LeviLamina 与 BDS 版本严格绑定：每个 LeviLamina 版本只适配特定的 BDS 版本（例如 LeviLamina 26.60.8 依赖 BDS 1.26.60）。如果原版 BDS 版本不匹配，必须先换成 LeviLamina 支持的版本。

推荐做法：新建一个空文件夹，安装 lip 后在其中执行 `lip install LeviLamina`（会自动下载适配的 BDS、LeviLamina 以及 PreLoader、PeEditor、bedrock-runtime-data 等依赖，并由 PeEditor 生成 `bedrock_server_mod.exe`），或执行 `lip setup --game <BDS版本>` 指定游戏版本（会自动选择适配该版本的最新 LeviLamina）。接着将旧服务器的 `worlds/`、`server.properties`、`allowlist.json`、`permissions.json` 等文件复制过去，最后用 `lip run` 或双击 `bedrock_server_mod.exe` 启动。

不建议手动拼装（即手动放入 `bedrock_runtime_data`、PeEditor、LeviLamina 本体后再运行 PeEditor），这样容易遗漏依赖。

*适用版本：当前所有 LeviLamina 版本（lip 0.41.x 的 install/setup 语义）*

### 装好 lip 后，如何从零安装 LeviLamina 服务端（以及 LegacyScriptEngine）？

1. 安装 lip，新建一个空文件夹作为服务器目录，并在该目录下打开终端（cmd 或 PowerShell）。
2. 执行 `lip install LeviLamina`（等同于 `lip install github.com/LiteLDev/LeviLamina`）。lip 会自动下载 LeviLamina 支持的最新 BDS 并完成配置，期间需输入 yes 同意 Minecraft EULA（在脚本中可加上 `--accept-eula`）。也可以使用 `lip setup --game <版本>` 指定游戏版本。
3. 如需运行脚本插件，再安装 LSE：执行 `lip install github.com/LiteLDev/LegacyScriptEngine`（默认变体包含 QuickJS 和 Lua 引擎），或按需安装单个引擎，例如 `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` / `#python`。
4. 执行 `lip run` 或双击 `bedrock_server_mod.exe` 启动服务端。

网络较慢时，可执行 `lip config set github_proxy <URL>` 设置 GitHub 代理。不建议手动拼装服务端，以免遗漏语言包、CrashLogger 等依赖；重装时建议直接使用新的空文件夹。官方教程：<https://levimc.org/zh-Hans/tutorials/server/first-server/>。

*适用版本：LeviLamina 26.60.x；lip 0.41.x*

### 在 Windows 上用 lip 安装 LeviLamina 服务端时命令失败/中途报错（如 `PeEditor.exe` 报错），如何排查？装好后启动哪个程序？

1. 确认已安装 lip 且命令格式正确：在 cmd 中不能使用 `./` 前缀（请改用 `.\` 或直接输入命令）。
2. 在新的空文件夹中执行 `lip install LeviLamina`，等待进度完全结束。中途报网络错误大多是因为下载中断或 GitHub 访问受阻，可重试或执行 `lip config set github_proxy <URL>` 设置代理；若安装失败，请查看终端提示及 `.lip/logs/` 下的完整报告。
3. 检查 VC++ 运行库：新版 lip 在 setup 时会自动安装缺失的 Microsoft Visual C++ Redistributable（此时会弹出管理员权限请求，选择“否”会导致安装失败）；若因运行库过旧导致 `PeEditor.exe` 报错或出现错误码 1114，请手动安装最新版：<https://aka.ms/vc14/vc_redist.x64.exe>。
4. 注意版本匹配：每个 LeviLamina 版本都绑定了特定的 BDS 版本，请勿自行指定不匹配的游戏版本。

安装完成后，执行 `lip run` 或双击 `bedrock_server_mod.exe` 即可启动。

*适用版本：当前所有 LeviLamina 版本（Windows）；lip 0.41.x*

### 租用的面板服（游戏面板/云服务商）能运行 LeviLamina 吗？本机能运行、上传到面板服后启动失败怎么办？

1. 系统要求：LeviLamina 只能加载到 Windows 版 BDS 中。Windows 面板可直接运行；x64 Linux 面板则需要能够运行 lip（lip 自带 Wine 以运行 Windows 版服务端），或使用官方 Docker 镜像 `ghcr.io/liteldev/levilamina-server:latest-wine`。只能启动原版 Linux `bedrock_server` 的普通面板无法直接使用。可以通过面板启动脚本的后缀（是 `.exe`/`.cmd` 还是 `.sh`）来判断底层系统。
2. 本机能运行，上传到面板后启动失败（如提示缺少运行库、错误码 1114）：通常是因为服务器缺少 Microsoft Visual C++ 运行库或版本过旧，安装最新版 <https://aka.ms/vc14/vc_redist.x64.exe> 即可解决。若服务商不允许安装运行库，可将服务端依赖的 VC++ 运行库 DLL（如 `msvcp140.dll`、`vcruntime140.dll`、`vcruntime140_1.dll` 等）直接放入服务端根目录（即 `bedrock_server_mod.exe` 所在目录）；具体依赖项可通过 MSYS2 MINGW64 终端中的 `ldd bedrock_server_mod.exe` 命令或 VS 自带的 dumpbin 等工具查看。
3. 也可以先在本地用 lip 装好整个服务端再上传，或请服务商代为安装。此外，社区也有第三方面板安装脚本（如 MineBBS 上的 LeviBox），但非官方维护。

*适用版本：当前所有 LeviLamina 版本*

### LeviLamina 能在 Windows 7 / Windows Server 2016 / 2012 R2 等老系统上运行吗？在这些系统上启动闪退，或 PreLoader 报 `Can't load ./plugins/LeviLamina\LeviLamina.dll, Error code: 127`（找不到指定的程序），开服应该选什么系统？

不能。LeviLamina 使用了较新的 Windows API 和新版 VC++ 运行库，仅支持 Windows 10、Windows 11 或 Windows Server 2019 及更高版本；Windows 7/XP、Windows Server 2012 R2、Windows Server 2016 均无法运行（原版 BDS 可以在老系统上运行，但安装 LeviLamina 后则不行）。在老系统上加载 `LeviLamina.dll` 时报错误码 127“找不到指定的程序”，通常就是系统缺少所需 API 所致，安装运行库也无法解决，只能升级或重装系统。（若在受支持的系统上出现错误码 127，则多半是 LeviLamina 与模组的依赖版本不匹配，可查看日志中的依赖诊断 `Dependency diagnostic`。）

此外，当前版本的 LeviLamina 位于 `mods/LeviLamina/` 下，报错信息中的 `plugins/LeviLamina` 路径属于旧版目录结构。

开服推荐使用 Windows Server 2022（或 2019 及以上），系统版本越新越好；也可以在 x64 Linux 或 macOS 上使用 lip（lip 自带 Wine 以运行 Windows 版服务端）。使用 lip 安装时，服务端所需的组件（含 VC++ 运行库）会由 lip 自动安装。

*适用版本：当前所有 LeviLamina 版本（含 26.60.x）*

### BDS 启动后只有 PreLoader 在运行（提示 `LeviLamina not found, PreLoader is running as DLL Loader...`），LeviLamina 和模组都没加载，是什么原因？

这说明 PreLoader 未在模组目录中找到 LeviLamina 本体（完整的加载链为 `bedrock_server_mod.exe` -> `PreLoader.dll` -> LeviLamina -> 其他模组）。仅放入 `PreLoader.dll` 是不够的，还必须安装 LeviLamina 本体。注意不要下载 GitHub 仓库源码，而应使用 Release 中编译好的文件；最推荐直接使用 lip 安装（`lip install github.com/LiteLDev/LeviLamina`），lip 会将 PreLoader、PeEditor、CrashLogger、bedrock-runtime-data 等依赖一并装好，并生成 `bedrock_server_mod.exe`。

当前版本的 LeviLamina 本体应位于服务端的 `mods/LeviLamina/` 目录下（文件夹名区分大小写），而非旧版的根目录或 `plugins/` 目录。手动安装时需注意：如果存在 `plugins/` 目录，PreLoader 会优先将其作为模组根目录；也可在 `PreLoaderConfig.json` 的 `modsPath` 中手动指定路径。若文件位置已混乱，最省事的做法是删除旧文件后用 lip 重新安装。

*适用版本：LeviLamina 1.x 及以后（当前 26.60.x），服务端*

### LeviLamina 服务端放在含中文（非 ASCII）字符的目录下，启动或加载 mod 时报错、日志路径乱码、提示缺依赖或崩溃，怎么办？

请将服务端整体移至纯英文（仅含 ASCII 字符）路径下再启动。部分 mod 或脚本引擎（例如早期的 GMLIB zip 解压逻辑、旧版 LSE NodeJS 引擎）未能正确处理中文路径，从而引发上述问题。`server.properties` 中的 `level-name` 也建议仅使用英文；如果希望存档在游戏内显示中文名称，可以将地图导出后在客户端重命名再导回，直接修改 `levelname.txt` 是无效的。

*适用版本：当前所有版本（是否出问题取决于所装的 mod）。未能从源码或文档中直接证实，仅供参考。*

### mod 附带的 `.pdb` 文件是什么？应该放在哪里，可以删掉吗？

`.pdb` 是调试符号文件，并非 mod 本体，属于可选文件。如需使用，请将其放在对应 mod 的 `.dll` 同级目录下（即 `mods/<模组名>/` 下，与 dll 同级），不要放在服务器根目录。这样 CrashLogger 生成崩溃堆栈时就能显示可读的函数符号，便于开发者排查崩溃原因。如果不介意崩溃日志的可读性，可以不放或直接删除，不会影响运行。

安装 mod 本身推荐使用 lip（`lip install <包名>`）；若手动安装，只需将压缩包内的 mod 文件夹解压到 `mods/` 目录下即可。

*适用版本：当前所有 LeviLamina 版本（mod 目录为 `mods/`）*

### LeviLamina 服务器目录里的 `runtimedata`（`bedrock_runtime_data`）是什么？需要安装吗，放在哪里？

它是 LeviLamina 的必需依赖 bedrock-runtime-data（`github.com/LiteLDev/bedrock-runtime-data`），可以理解为经过加密混淆的新形式 PDB/符号数据，必须与 LeviLamina 一同安装。使用 lip 安装 LeviLamina 时，它作为依赖项会自动安装并解压到服务器根目录下的 `bedrock_runtime_data`（与 `bedrock_server.exe` 同级），而不是 `plugins` 或 `mods` 目录。

服务端和客户端使用的运行时数据是分开发布的，版本号分别带有 `-server` 和 `-client` 后缀（例如 `26.60.6-server.16` 与 `26.60.5-client.16`）。lip 会根据安装端自动选择对应版本，两者不能混用。

*适用版本：使用 bedrock-runtime-data 的 LeviLamina 版本（含当前 26.60.x）*

### BDS 服务端目录里没有加载器，LegacyScriptEngine（LLSE）的 JS 插件丢进去也不加载，应该怎么安装 LeviLamina 和 LegacyScriptEngine？

插件必须依赖加载器才能运行。推荐使用 lip 安装：装好 lip 后，在服务器文件夹中运行 `lip`（自带图形化终端界面，可直接装好 BDS 和 LeviLamina），或参照官方教程通过命令行开服。接着运行 `lip install LegacyScriptEngine#quickjs` 安装 LSE（用于加载 JS 插件；其他变体还有 `#lua`、`#nodejs` 和 `#python`，不指定变体则会同时安装 QuickJS 和 Lua 引擎），lip 会自动装好 LegacyRemoteCall、LegacyMoney、iListenAttentively 等依赖。

插件需放入 `mods/` 目录（自 LSE 0.23.0 起，启动时会将 `plugins/` 创建为指向 `mods/` 的链接）。若直接放入单个旧式脚本，下次启动服务器时会自动生成对应的文件夹和 manifest，再重启一次服务器即可加载。

*适用版本：LeviLamina 26.x；LegacyScriptEngine 0.23.x；lip 0.41.x*

### Windows 上用 LeviLauncher 导入小地图等客户端 mod（dll）后进游戏没有效果、mod 列表也不显示，是什么原因？

这类客户端模组依赖 LeviLamina 客户端版，需要先为对应实例安装 LeviLamina：可在 LeviLauncher 安装实例时开启「安装 LeviLamina」；若是已有实例，可在「启动」页点击实例选择器旁的齿轮图标，依次进入「实例设置」→「加载器」标签页进行安装（对应 release 中的 `levilamina-v<版本>-client-release-windows-x64.zip`）。

LeviLamina 仅支持特定的 GDK 游戏版本（下载页「加载器」一栏标有 LeviLamina 的版本），不支持的版本会提示「该游戏版本不支持 LeviLamina」。此外，模组必须是 client 变体，且与实例的游戏版本及 LeviLamina 版本相匹配。建议优先从启动页的「LeviMC 模组」中安装，该列表仅展示适用于当前实例 LeviLamina 的模组；如需手动导入，可在「管理模组」中点击「导入 .mcmod」（导入 `.zip` 或 `.dll` 时文件类型需选「所有文件」）。

*适用版本：LeviLauncher（Windows）当前版本；LeviLamina 客户端版*

### 在面板服（无法直接运行 lip 的托管服务器）上部署 LeviLamina，启动时 PreLoader 报错/频繁崩服，是 PreLoader 坏了吗？

这通常是因为文件不完整，最常见的原因是缺少 LeviLamina 的必需依赖 bedrock-runtime-data（`github.com/LiteLDev/bedrock-runtime-data`），且该依赖的版本必须与 LeviLamina 对应。建议不要手动拼装文件，而是先在本地电脑上用 lip 安装（运行 `lip setup --game <版本>` 或 `lip install LeviLamina`），lip 会自动装齐 BDS、PreLoader、bedrock-runtime-data、CrashLogger、levilamina-loc 等依赖，并对 exe 执行 PeEditor。在本地确认服务端能正常启动后，再将整个服务端目录打包上传至面板服。

*适用版本：LeviLamina 1.x 起至当前版本*

### 想给基岩版 BDS 服务器装插件（如 CoralFans），需要装 LeviLamina 还是 Endstone？

这取决于插件所属的平台：使用 LeviLamina 模组就装 LeviLamina；使用 Endstone 插件则装 Endstone，也可以在 LeviLamina 上安装 LeviStone 来运行 Endstone 插件（LeviStone 仅支持用 Python 编写的 Endstone 插件，可在已装 LL 的服务器目录中运行 `pip install levistone --target mods/EndstoneRuntime` 安装）。

CoralFans 是 LeviLamina 模组，因此需要安装与其适配版本一致的 LeviLamina。安装文档见：<https://coralfans-dev.github.io/CoralFans-doc/#/InstallDoc>。

### 手动安装 LeviLamina 时，依赖 bedrock-runtime-data 的版本号如 `26.10.4-server.1` 中的 `-server.1` 是什么意思？和 `bedrock_server` 版本有关吗？

`-server` 表示这是服务端（BDS）专用的运行时数据（客户端为 `-client.N`）；后面的数字 N 是该数据包的发布序号，每次重新发布时递增，与 `bedrock_server` 的版本号无关。前面的主版本号则对应游戏构建版本，例如 `26.60.6-server.N` 对应 BDS 1.26.60.6，`26.60.5-client.N` 对应客户端 1.26.60.5（详见 LeviLamina 支持版本表）。

手动安装时切勿随意挑选版本，应严格按照 LeviLamina 的 `lip.toml` 中 `deps` 指定的确切版本进行安装。例如，LeviLamina 26.60.8 服务端依赖 `"github.com/LiteLDev/bedrock-runtime-data" = "26.60.6-server.16"`，通常就是与该 LL 版本同期发布的序号最大的版本。更推荐直接用 lip 安装，会自动匹配并装好正确版本。

*适用版本：LeviLamina 26.x 当前版本*

### 手动把多个插件/模组压缩包解压到服务器目录时，`README.md`、`CHANGELOG.md`、`LICENSE` 文件重名冲突，怎么处理？

`README.md`（说明）、`CHANGELOG.md`（更新日志）和 `LICENSE`（开源协议）都不是运行所需的文件，解压时可以忽略或直接删除，只保留插件本体文件即可。各个 LeviLamina 模组应分别放在独立的 `mods/<模组名>/` 子目录下（内含 `manifest.json`），这样一般不会发生冲突；LLSE 脚本插件则可放入 `plugins/` 目录（自 LSE 0.23.0 起该目录是指向 `mods/` 的链接，启动后会自动迁移插件并生成清单）。更推荐直接用 lip 安装，省去手动解压的麻烦。

*适用版本：当前所有版本（手动安装场景）*

### 用 LeviLamina 开插件服，需要安装哪些组件？

推荐使用 lip 安装（文档见 <https://levimc.org/zh-Hans/lip/>）。在服务器目录中按以下步骤操作：

1. 运行 `lip install LeviLamina`（或 `lip setup --game <版本>`）安装 BDS 和 LeviLamina；
2. 如需运行 LLSE 脚本插件，安装 LegacyScriptEngine：`lip install LegacyScriptEngine`（不指定变体时会同时安装 QuickJS 和 Lua 引擎），这已能满足绝大多数需求；
3. 如需使用 NodeJS 插件，再运行 `lip install LegacyScriptEngine#nodejs`；Python 插件则对应 `#python` 变体，按需安装即可。

安装完成后，运行 `lip run` 启动服务器。

*适用版本：lip 0.40 及以上；LegacyScriptEngine 当前版本*

### 用 wine 在 Linux 上运行 LeviLamina 时控制台终端错位、输入命令显示混乱或有编码问题，怎么处理？

手动用 wine 运行时，可以借助一个简单的中间层程序（如社区编写的 Go 程序 pts）来转发 stdin/stdout，例如运行 `pts env WINEDEBUG=-all wine cmd /c bedrock_server_mod.exe`，即可解决终端错位和部分编码错误；其中 `WINEDEBUG=-all` 用于屏蔽 wine 自身的调试输出。此外，运行 LL 只需安装 64 位 VC++ 运行库（vcrun2022），无需 32 位版本。

目前 lip 已官方支持在 x64 Linux 和 macOS（搭载 Apple 芯片的 Mac 需安装 Rosetta 2）上运行：先执行 `lip setup --game <版本>`，再执行 `lip run` 即可。lip 自带 Wine，会自动安装 VC++ 运行库并默认设置 `WINEDEBUG=-all`（注意：lip 要求 glibc 2.27+，不支持 Alpine）。

*适用版本：Linux 上通过 Wine 运行 LeviLamina 服务器。未能从源码或文档中直接证实，仅供参考。*

### 运行 `bdsdown.exe` 时停在 Minecraft EULA / 隐私政策同意提示，输入 y 无效，并且 LeviLamina 提示与 BDS 协议版本不匹配，如何下载指定版本的 BDS？

可以通过命令行参数直接同意协议并指定下载版本：`bdsdown.exe -y --source version://windows/x.x.x.x`。将命令中的 `x.x.x.x` 替换为当前 LeviLamina 所适配的 BDS 完整版本号（即四段式完整构建号，可在 <https://levimc.org/LeviLamina/versions/> 查询，例如 LeviLamina 26.60.x 对应 1.26.60.6；注意 LeviLamina 的 `lip.toml` 中 `github.com/LiteLDev/bds` 依赖只写到了 1.26.60 三段）。

不过目前更推荐直接使用 lip：运行 `lip setup --game <游戏版本>`（在脚本中使用时可加上 `--accept-eula`），即可自动下载相互匹配的 BDS 和 LeviLamina。

*适用版本：bdsdown v1.x（当前 v1.2.1）*

### LeviLamina 用 lip 或手动安装后无法加载（重启电脑后只能正常开一次），可能是什么原因？

LeviLamina 无法加载最常见的原因是 BDS 版本与 LeviLamina 不匹配；使用 lip 安装时，会根据依赖关系自动安装匹配版本的 BDS。如果版本正确但依然加载失败，请检查相关文件（如 PreLoader、PeEditor 生成的 `bedrock_server_mod.exe` 或 `mods` 目录下的 dll）是否被 360 等杀毒软件删除或拦截。请关闭杀毒软件，或将服务器目录加入白名单后重新安装。

*适用版本：当前所有版本（Windows 服务端）。未能从源码或文档中直接证实，仅供参考。*

### 两个看似相同的 LeviLamina 服务端，一个 mod 加载成功但指令用不了，另一个正常，是什么原因？

服务端路径中包含中文等非 ASCII 字符可能会引发各种异常（例如 mod 加载成功但命令无法使用）。建议将服务端移至纯英文且无空格的路径下重试。

*适用版本：通用排查建议。未能从源码或文档中直接证实，仅供参考。*

### 教程说修改 `plugins\LeviLamina\config\Config.json`（`simpleServerLogger`、`playerInfo` 等），但下载的 LeviLamina 里没有这个配置文件，为什么？

需要先启动一次服务器且 LL 正常加载，该配置文件才会自动生成（若找不到或读取失败，LL 会按默认值重写）。另外，手动安装教程大多针对旧版，推荐按官方教程用 lip 安装：例如在空目录执行 `lip install github.com/LiteLDev/LeviLamina`（或 `lip setup --game <版本>`），即可一并装好 BDS 与 LeviLamina。注意，新版中这两项位于 `targeted.simpleServerLogger` 和 `targeted.playerInfo` 下。

*适用版本：LeviLamina 1.x 及以上；lip 写法以当前 lip 0.41 为准*

### 想看服务器报错（如 addon 模型加载不出来）时，打开 CrashLogger 程序有用吗？应该怎么启动服务器？

没用。CrashLogger 只是在服务器启动后由 LeviLamina 自动拉起、用于在崩溃时记录崩溃信息的工具，不需要也不应该手动打开。启动服务器应运行 `bedrock_server_mod.exe`（或执行 `lip run`）。addon 报错一般不会导致崩服，相关错误信息会直接输出在控制台和 `logs` 目录的日志中，去那里查看即可。

*适用版本：LeviLamina 当前所有版本*

## PreLoader 与 PeEditor

### 安装 LeviLamina 后没有生成 `bedrock_server_mod.exe`（或双击 `PeEditor.exe` 闪退 / 只输出 `No work to do, exiting...`），怎么手动用 PeEditor 生成？

正常情况下不需要手动运行 PeEditor，用 lip 安装 LeviLamina 时会自动执行 `.\PeEditor.exe -mb`。若未生成 `bedrock_server_mod.exe`（或是手动安装 / 面板服），请在 `bedrock_server.exe` 所在的服务端根目录打开 cmd 或 PowerShell，执行：

```powershell
.\PeEditor.exe -mb
```

（若只需生成而不备份，可用 `-m`。）

说明：不带参数运行 PeEditor 不会执行任何操作，只会输出 `No work to do, exiting...`，双击运行也会一闪而过，因此必须在命令行中带上 `-m` 参数。

- `-m` 生成 `bedrock_server_mod.exe`。
- `-b` 将原版重命名为 `bedrock_server.exe.bak`。
- `--exe` 指定源 exe（默认 `./bedrock_server.exe`）。
- `-o` 指定输出目录。
- `--verbose` 输出详细日志。

生成后，用 `bedrock_server_mod.exe` 启动服务器（建议在命令行中启动，以便查看报错）。

PeEditor 本身运行报错多是因为 VC++ 运行库过旧，请安装 <https://aka.ms/vc14/vc_redist.x64.exe> 后重试。手动安装时，PeEditor/PreLoader 的版本必须与 LeviLamina 版本匹配（以 LeviLamina 包中 `lip.toml`/`tooth.json` 写明的依赖版本为准），因此官方更推荐用 lip 安装。

*适用版本：LeviLamina 1.x 及以上（PeEditor 3.8+，当前 3.9.3）*

### 安装 LeviLamina 时在 PeEditor 步骤报错，或手动运行 `PeEditor.exe` 打不开/无法运行，怎么解决？

这通常是因为系统缺少或安装了过旧的 Microsoft Visual C++ 运行库（例如刚重装过系统）。请先安装最新的 VC++ 2015-2022 x64 运行库 <https://aka.ms/vc14/vc_redist.x64.exe>，然后重新安装 LeviLamina，或在 BDS 目录下用命令行手动运行 `.\PeEditor.exe -mb`（必须带参数，双击无效）。

注意：如果此前 LeviLamina 并未安装成功，后续安装 LSE 等依赖 LeviLamina 的包也会报错，必须先把 LeviLamina 重新装好（可用 `lip list` 检查已安装的包）。

*适用版本：LeviLamina 当前所有版本*

### LeviLamina 文件都放好了，但启动 BDS 时没有加载 LL（或启动就闪退），怎么回事？

手动安装时，需要在 BDS 目录下用命令行运行一次 `PeEditor.exe -m`（lip 安装时执行的是 `PeEditor.exe -mb`，会额外把原文件改名为 `bedrock_server.exe.bak`），从 `bedrock_server.exe` 生成 `bedrock_server_mod.exe`。之后必须启动 `bedrock_server_mod.exe` 而非原来的 `bedrock_server.exe`，才能经由 PreLoader 加载 LeviLamina。

更推荐直接用 lip 安装 LeviLamina（`lip setup` / `lip install LeviLamina`），它会自动安装 PreLoader、PeEditor 等依赖并完成修补，之后用 `lip run` 启动服务器即可。

*适用版本：LeviLamina 服务端当前所有版本*

### 使用第三方论坛（如 MineBBS）上的 LeviLamina+LSE 整合包时，自带的 `PeEditor.bat` 修补失败怎么办？

不要使用第三方整合包里的 `PeEditor.bat`。请改用 lip 安装 LeviLamina（执行 `lip setup`，或先执行 `lip install LeviLamina` 再执行 `lip install LegacyScriptEngine`），它会自动安装依赖并执行 `PeEditor.exe -mb` 生成 `bedrock_server_mod.exe`；也可以按官方教程手动安装（在 BDS 目录运行 `PeEditor.exe -m` 后启动 `bedrock_server_mod.exe`）。

*适用版本：LeviLamina 服务端当前版本。未能从源码或文档中直接证实，仅供参考。*

### 在 Linux 服务器上用 wine 运行 LeviLamina，PeEditor 生成 `bedrock_server_mod.exe` 失败，怎么处理？

目前推荐直接使用 Linux 版 lip：在 x64 Linux 上，`lip setup` 会自动下载并配置 Wine 与 Visual C++ 运行库，安装 LeviLamina 时也会自动执行 PeEditor，之后用 `lip run` 启动即可，无需自行安装 wine/winetricks；此外也可以使用官方 Docker 镜像 `ghcr.io/liteldev/levilamina-server:latest-wine`。

若仍需使用自己的 wine 手动安装，请执行 `wine PeEditor.exe -m` 生成文件。注意 wine 前缀必须为 64 位（`WINEARCH=win64`），并需用 winetricks 安装 VC 运行库：

```shell
sudo wget -O /usr/local/bin/winetricks https://raw.githubusercontent.com/Winetricks/winetricks/master/src/winetricks
sudo chmod +x /usr/local/bin/winetricks
winetricks dlls vcrun2022
```

不想看到 wine 报错可执行 `export WINEDEBUG=-all`。另外请确认 BDS 版本与所装的 LeviLamina 版本对应。

*适用版本：LeviLamina 服务端当前版本，x64 Linux（lip 0.41.x）*

### 手动安装 LeviLamina 时安装没完成（或 lip 安装失败后改手动），接下来该怎么做？启动后又提示缺少 `CrashLogger.exe` 怎么办？

手动安装时，需要在 BDS 目录运行一次修补程序 `PeEditor.exe`（`PeEditor.exe -m`），生成 `bedrock_server_mod.exe` 并用它启动，LL 才算装好。

启动后若提示找不到 `CrashLogger.exe`，需将 `CrashLogger.exe` 放到 LeviLamina 模组目录下（默认为 `mods/LeviLamina/CrashLogger.exe`）。该路径由 `mods/LeviLamina/config/Config.json` 中的 `modules.crashLogger.externalpath` 指定（相对于 LeviLamina 模组目录，默认值为 `CrashLogger.exe`）。若不需要外部崩溃日志，也可将 `crashLogger.enabled` 设为 `false`。

建议尽量用 lip 安装，它会自动装好 CrashLogger 等依赖；否则像 LSE NodeJS 这类依赖也得手动寻找。

*适用版本：LeviLamina 服务端当前版本（CrashLogger 1.4.x）*

### 升级 LeviLamina 后又单独升级/覆盖了 BDS，服务器无法启动且没有报错，怎么解决？

`bedrock_server_mod.exe` 是由 PeEditor 从 `bedrock_server.exe` 生成的，覆盖或升级 BDS 文件后，旧文件不会自动更新，必须重新运行一次 `PeEditor.exe -m` 来重新生成 `bedrock_server_mod.exe`。

另外，每个版本的 LeviLamina 只支持特定版本的 BDS（其 `lip.toml` 中的 `bds` 依赖精确到具体版本，例如 LL 26.60.8 对应 1.26.60），切勿单独升级 BDS。推荐执行 `lip update LeviLamina` 一并升级，lip 会安装匹配的 BDS 并自动执行 `PeEditor.exe -mb`。

*适用版本：LeviLamina 服务端当前所有版本*

### 用 lip 单独安装了 PeEditor，却没有 PreLoader，PeEditor 和 PreLoader 不是在一起的吗？

PeEditor 不等于 PreLoader：PeEditor 是把 PreLoader 注入游戏可执行文件的修补工具（用于生成 `bedrock_server_mod.exe` 或原地修补 `Minecraft.Windows.exe`），而 PreLoader 是运行时加载 LeviLamina 的库（`PreLoader.dll`）。二者是各自独立的 lip 包（`github.com/LiteLDev/PeEditor` 与 `github.com/LiteLDev/PreLoader`）。

请勿单独安装这些依赖，直接用 lip 安装 LeviLamina 本体即可，它会自动拉取 PreLoader、PeEditor、CrashLogger 等全部依赖并完成修补。

*适用版本：LeviLamina 当前所有版本*
