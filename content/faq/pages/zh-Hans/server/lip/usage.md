# lip 的使用与配置

## 配置

### 模组已被目录收录，之后修改了仓库里的包描述文件（`tooth.json` / `lip.toml`），为什么目录上的信息一直不更新？

目录读取的是每个版本标签（`v<版本>`）对应的包文件（优先读 `lip.toml`，没有时才读 `tooth.json`），列表中的名称、描述、标签等信息都取自最新版本的包文件，而不是默认分支上的最新文件。只修改仓库内容而不发布新标签，目录不会更新。

正确做法是先修改 `lip.toml`（调高 `version`），再打上新标签（如 `v0.2.0`）发布新版本。目录每小时构建一次，新标签会在下一次构建中生效。

详情页的 README 同样取自该版本标签下的仓库文件（`raw.githubusercontent.com/<作者>/<仓库>/v<版本>/README.md`），仅修改默认分支上的 README 也不会更新；只有 Gallery（默认分支上的 `docs/showcase/showcase.json`）会在下一次构建中直接生效。

*适用版本：当前 LeviMC 模组目录（levimc.org/mods）*

### 发布给 lip 的插件需要把编译好的二进制提交到源码仓库或单独开仓库存放吗？

不需要。在 `lip.toml` 的变体条目中添加一个 `type = "mcmod"`（LeviLamina 模组 ZIP）或 `type = "zip"` 的资源，将 `urls` 指向 GitHub Release 的附件即可，例如 `https://github.com/<you>/my-mod/releases/download/v{{version}}/my-mod-server-windows-x64.zip`。

- `zip` 资源需再用 `place` 指定把 ZIP 中的哪些文件放到哪里，例如 `place = [{ src = "my-mod/", dest = "mods/my-mod/" }]`。
- `mcmod` 则要求 ZIP 根目录下有 `manifest.json`，解压后会整体放入 `mods/<模组名>/`。
- LeviLamina、LSE 及 levilamina-mod-template 都采用 `zip` 配合 Release 附件的方式，模板的发布工作流会自动构建并上传 `<仓库名>-server-windows-x64.zip` 等 ZIP。

国内用户访问 GitHub 较慢时，可执行 `lip config set github_proxy <URL>` 设置 GitHub 代理，或使用 `HTTPS_PROXY` 等系统代理环境变量。

*适用版本：lip 0.40 及以上（lip.toml）*

### 新版 lip 的配置文件和缓存存放在哪里？能放到当前目录吗？

lip 的用户级配置和缓存存放在各平台的标准用户目录中，不支持放到当前目录：

- 配置（`config.toml`）：Windows 为 `%APPDATA%\lip`，Linux/macOS 为 `$XDG_CONFIG_HOME/lip`（默认 `~/.config/lip`）
- 缓存：Windows 为 `%LOCALAPPDATA%\lip\Cache`，Linux/macOS 为 `$XDG_CACHE_HOME/lip`（默认 `~/.cache/lip`）
- 数据（如 Wine）：Windows 为 `%LOCALAPPDATA%\lip\Data`，Linux/macOS 默认 `~/.local/share/lip`
- 状态（界面的工作区列表）：Windows 为 `%LOCALAPPDATA%\lip\State`，Linux/macOS 默认 `~/.local/state/lip`

此外，每个服务器目录（工作区）下还有一个 `.lip/` 目录，用于存放 `state.json`、工作区配置 `.lip/config.toml` 和日志等。旧版的 `liprc.json` 会自动转换为 `config.toml`，`tooth_lock.json` 会转换为 `.lip/state.json`。如果下载的文件疑似损坏，导致同一个安装反复失败，可以执行 `lip cache clean` 清理缓存后重试，这不会丢失任何数据。

*适用版本：lip 0.40 及以上（当前 0.41.1）*

### 用 lip 安装新的服务端（BDS）时无论输入什么版本号都报错，怎么解决？

这多半是网络或代理配置问题。请执行 `lip config list` 检查 lip 的 GitHub 代理设置 `github_proxy`：如果代理不可用或不支持 git 仓库，可执行 `lip config delete github_proxy` 将其删除（或执行 `lip config set github_proxy ""` 改为直连），也可以换用其他可用代理：`lip config set github_proxy https://代理地址/`。

lip 的版本列表获取自 `https://levimc.org/api/v4/mc/versions/`，服务端本体从 `www.minecraft.net` 下载，这两处同样需要正常访问。装服命令为 `lip setup --game <版本>`（如 `1.26.60`）。安装失败时，可查看 `.lip/logs/` 下的失败报告来定位原因。

*适用版本：lip 0.38+（C# 重写后，配置键为 `github_proxy`；已在 0.41.1 核对）*

### 给 lip 配置了 GitHub 镜像/代理后报错，地址写成了 `https:/xxx`，问题在哪？

URL 协议头少写了一个斜杠，应为 `https://xxx/` 这样完整的 URL 前缀。当前版本的 lip 使用 `github_proxy` 配置项设置 GitHub 代理，修正方法如下：

```shell
lip config set github_proxy https://xxx/
```

你也可以直接编辑 `%APPDATA%\lip\config.toml` 中的 `github_proxy`，或在 lip 界面的「设置」页面填写 GitHub 代理。设为空字符串（`lip config set github_proxy ""`）表示直连 GitHub，执行 `lip config delete github_proxy` 则恢复为未配置状态。

*适用版本：lip 0.40 及以上（`config.toml` / `github_proxy`）；旧版 lip 对应 `liprc.json` 中的镜像配置*

### lip 安装包时下载超时（多次重试、换电脑都不行），怎么办？lip 如何指定安装到哪个文件夹？

当 GitHub 访问缓慢或被屏蔽时，可设置 GitHub 代理：`lip config set github_proxy <代理地址>`（0.41.1 之后的 lip 会将请求发往“该地址 + `/` + 完整的 GitHub 地址”，因此填代理服务本身的地址即可；0.41.1 及更早版本的 lip 只会在地址后拼接 `<所有者>/<仓库>/…`，对于 gh-proxy 这类服务，地址必须以 `https://github.com/` 结尾）。你也可以在终端设置 `HTTPS_PROXY` 等环境变量来使用普通网络代理，然后重试。可用 `curl "<代理地址>/https://github.com/LiteLDev/lip.git/info/refs?service=git-upload-pack"` 测试代理是否返回 200。

lip 直接以当前工作目录作为工作区，没有指定其他目录的选项：要安装到哪个文件夹，就先 `cd` 到该目录，再执行 lip 命令。

*适用版本：lip 0.40 及以上*

### lip 设置过 GitHub 代理等配置后，怎么删除（remove）该配置？

执行 `lip config delete <KEY>` 即可删除配置并恢复默认值，例如 `lip config delete github_proxy`（不走代理，界面连不上 GitHub 时会重新询问）。如果想明确指定“直接连接、不再询问”，可将其设为空值：`lip config set github_proxy ""`（在 PowerShell 中需写为 `lip config set github_proxy --% ""`）。

*适用版本：lip 0.40 及以上（“界面重新询问”的区别自 0.41.0 界面起才有意义）*

### lip/启动器通过 GitHub 镜像克隆 LeviLamina 时失败（如 `fatal: unable to access 'https://github.bibk.top/LiteLDev/LeviLamina.git/': Recv failure: Connection was reset`），如何更换 GitHub 镜像（代理）？

旧的默认自建镜像 `github.bibk.top` 受网络干扰严重，可换用其他 GitHub 代理：

1. 独立版 lip：执行 `lip config set github_proxy https://v4.gh-proxy.org/https://github.com/`（gh-proxy 这类服务需要在地址后带上完整的 `https://github.com/` 前缀）。可用 `curl.exe -s -o NUL -w "%{http_code}" "<代理>/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"` 测试代理，返回 200 即表示可用；不想使用代理时，执行 `lip config delete github_proxy`。也可以在 lip 终端界面的设置页中配置，保存前会自动测试连接。
2. LeviLauncher：在设置的「Package Management（包管理）」页找到 GitHub 代理一栏，选择预设或手动填写（1.1.0 起默认已改为 <https://gh-proxy.org/https://github.com>，预设中还有 `v4.gh-proxy.org`、`gh.bibk.top` 等），修改后无需重装启动器。
3. 直接使用普通代理：lip 会读取 `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` 环境变量，未设置时则使用系统代理。

此外，当 lip 通过 `github_proxy` 请求失败时，会自动回退为直连 GitHub。

*适用版本：lip 0.40+（独立版）；LeviLauncher 1.1.0 及以上（内置包管理器）*

### lip 配置 GitHub 代理后下载 `bedrock-runtime-data` 报 HTTP 404（`Failed to download from https://gh-proxy.com/LiteLDev/bedrock-runtime-data/releases/download/...`），如何正确设置代理？

这是代理地址格式与当前 lip 版本不匹配导致的：gh-proxy 这类代理要求在地址后接上完整的 GitHub 地址，只写 `https://gh-proxy.com/` 或 `https://gh-proxy.org/` 会返回 404。0.41.1 及更早版本的 lip 会把 `<所有者>/<仓库>/...` 直接拼接在 `github_proxy` 后面，因此应按如下方式设置（0.41.1 之后的 lip 会自动接上完整的 GitHub 地址，只填代理服务本身的地址即可，但下面这种写法依然兼容）：

```shell
lip config set github_proxy https://v4.gh-proxy.org/https://github.com/
```

设置前可用以下命令测试，返回 200 说明代理可用：

```shell
curl.exe -s -o NUL -w "%{http_code}" "https://v4.gh-proxy.org/https://github.com/LiteLDev/LeviLamina.git/info/refs?service=git-upload-pack"
```

*适用版本：lip 0.40 及以上*

### mod 迁移到新的 GitHub 仓库后，要被 lip/模组列表收录需要改什么？

包 ID 必须与仓库路径一致。现在的包使用 `lip.toml`，需要将其中 `id` 字段改为新仓库路径。例如，仓库为 `https://github.com/user/repo` 时，应写为 `id = "github.com/user/repo"`；否则该提交不会被视为包，lip 不会安装（模组列表自然也无法正常安装它；收录方式见 levimc.org 的「用 lip 发布你的模组」教程）。

旧格式 `tooth.json` 中对应的字段是 `tooth`（可用 `lip pkg migrate` 迁移到 `lip.toml`，`tooth` 会变为 `id`）。改完后打上新的版本标签 `v<版本>` 发布，注意 `version` 必须等于标签版本。

*适用版本：lip.toml 格式 4（当前）；旧 tooth.json 包同理改 `tooth` 字段*

### 发布 LeviLamina mod 时，包文件中对 LeviLamina 的依赖版本能否锁定为一个具体版本？模组图标应写在哪里？

不建议锁死单一版本。不带运算符的完整版本（如 `"26.60.8"`）只匹配该版本；一旦 LeviLamina 发布新版本，你的 mod 就无法通过 lip 或启动器安装到新版本上，只能手动放入。建议填写版本范围，例如：

```toml
[variants."".deps]
"github.com/LiteLDev/LeviLamina" = "26.60.*"
```

或写为 `">=26.60.0 <26.70.0"` 之类（语法同 Semver for .NET 的 `SemVersionRange`，支持 `^`、`~`、`*`、`>=…<…`、`||`）。

此外，`id` 必须与实际仓库地址一致。模组图标写在 `[info]` 下的 `logo` 字段中（必须以 `https://` 开头），例如 `logo = "https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/main/.../pack_icon.png"`。旧 `tooth.json` 中对应的是 `dependencies` 和 `info.avatar_url`，迁移时 `avatar_url` 会变为 `info.logo`。

补充：客户端条目（`side = "client"`）依赖的同样是不带 `#client` 的 LeviLamina，官方模板写作 `">26.60.6 <26.61.0"`（因为 26.60.6 及以前的 `tooth.json` 版本默认变体是服务端构建）。

*适用版本：lip.toml 格式 4（当前）；LeviLauncher 1.1.0+ 内置包管理器；旧 tooth.json 包对应 `dependencies`/`avatar_url`*

## 功能与版本

### LeviLamina 的插件/模组去哪里找、去哪里发布？（旧论坛、lippkg、bedrinth 都打不开了）

LiteLDev 论坛早已关闭，`lippkg.com`、`bedrinth`、`pkg.levimc.org` 也均已弃用。现在的插件/模组目录是 LeviMC 模组（<https://levimc.org/zh-Hans/mods/>）。每个模组页面都提供了安装命令，可用 lip（运行 `lip install github.com/<作者>/<仓库>`，或在 lip 界面的「市场」页）安装；客户端模组也可直接在 LeviLauncher 中浏览和安装。作者发布模组只需在 GitHub 上用 `lip.toml` 打版本标签，目录便会自动或经 PR 收录。问题反馈请提交至各项目的 GitHub issue。

*适用版本：当前所有版本（lip 0.40 及以上、LeviLauncher）*

### 自己在 GitHub 发布了 LeviLamina 模组，怎样才能被 lip 的模组目录（LeviMC 模组 / LeviLauncher）收录？为什么一直搜不到？

现在的目录是 LeviMC 模组（<https://levimc.org/zh-Hans/mods/>），已替代原来的 lipr 和 bedrinth，lip 的「市场」页与 LeviLauncher 均读取该目录。它由 `LiteLDev/liteldev.github.io` 仓库中的 `content/mods/repos.txt` 仓库列表构建：

1. 自动发现：机器人每隔两小时会用 GitHub 代码搜索查找根目录带有 `lip.toml`（或旧的 `tooth.json`）且含 lip 可读版本标签的仓库，然后发 PR 将其加入 `repos.txt`；维护者合并后，会在下一次每小时构建中显示。fork 仓库不会被发现。由于该机制依赖 GitHub 代码搜索（其配额也常被用尽而跳过某次运行），新仓库在 GitHub 建好代码索引之前可能搜不到，此时直接走第 2 步自己发 PR 最快。
2. 想更快上架：自己发 PR 编辑 `content/mods/repos.txt`，添加一行 `<作者>/<仓库>`。
3. 收录条件：版本标签必须是 `v` 加完整语义化版本（如 `v1.0.0`，不能是 `1.0.0` 或 `v1.0`），且标签处 `lip.toml` 的 `version` 与之一致；最新版本直接或间接依赖 LeviLamina；将文件放入 `mods/`（或 `plugins/` 等）；仓库不是 GitHub 模板，且名称不以 `-template`、`-example`、`-demo`、`-sample`、`-test` 结尾。
4. 自查：在测试服务器上执行 `lip install github.com/<作者>/<仓库>@<版本> --dry-run`，应能找到你的版本，且不会改动任何文件。

如果不想被收录，直接关闭机器人发的 PR（关闭后不会再提议）或删除 `repos.txt` 中的那一行即可。此外，lip 本身不依赖目录，未被收录的仓库依然可以用 `lip install github.com/<作者>/<仓库>` 直接安装。

*适用版本：lip 0.40 及以上（发布 lip.toml 包需 lip 0.41 的 `lip pkg` 命令）；当前 LeviMC 模组目录*

### 一个仓库里放了多个 mod/插件，不想拆成多个仓库，能发布到 lip 吗？发布 lip 包必须发 GitHub Release 吗？

lip 的包 ID 即仓库路径（如 `github.com/user/repo`）。虽然一个仓库对应一个包，但一个包可以有多个变体（variant），用来在同一仓库中存放多个 mod：在 `lip.toml` 里为每个 mod 写一个 `[[variants."<名字>"]]` 条目（名字需匹配 `^[a-z0-9_]+(/[a-z0-9_]+)?$`），用户通过 `lip install github.com/user/repo#<名字>` 选择要安装的变体（LSE 的 `#lua`、`#nodejs` 等引擎正是这样做的）。注意，同一仓库的所有变体共用版本标签。版本即名为 `v<SemVer>` 的 git 标签（如 `v1.2.3`），且该标签处 `lip.toml` 的 `version` 必须与之一致。“发布”本质上是推送这个标签，GitHub Release 只是用来托管 assets 中 `urls` 指向的 ZIP 文件。如果确实想让各 mod 拥有独立版本，也可以为每个 mod 单独建一个只放 `lip.toml` 的仓库，让其 zip/mcmod 资源的 `urls` 指向大仓库 Release 里的文件。

*适用版本：lip v0.40 及以上（lip.toml 格式 4）；旧版 tooth.json 中以 label 区分变体*

### lipui（lip 的图形界面）还能用吗？不会用命令行有没有图形界面？想装指定版本的 BDS 怎么办？

lipui 已归档，不再可用。它的功能已并入 lip 本身：在终端中只输入 `lip`（不带参数）即可打开 lip 界面，首页会引导你创建服务器、安装模组和启动服务器，无需记忆命令。若要安装指定版本的 BDS，可以在界面中创建服务器时选择版本，也可以用命令 `lip setup --game <版本>`（如 `lip setup --game 1.21.0`，默认带有适配的最新 LeviLamina，可用 `--loader levilamina@<版本>` 或 `--no-loader` 调整），或执行 `lip install github.com/LiteLDev/bds@1.21.0 LeviLamina`（安装游戏 1.21.0 及适配它的最新 LeviLamina）。如果只需下载服务端文件，也可用 bdsdown（`lip install github.com/LiteLDev/bdsdown`）。

*适用版本：lip v0.40 及以上（内置界面）*

### 用 lip 安装包必须写版本号吗？不写能自动装最新版吗？

不需要写。执行 `lip install github.com/user/repo` 会安装该仓库最高的版本标签（`v<SemVer>`）。需要指定版本时写为 `github.com/user/repo@1.0.0`（对应标签 `v1.0.0`），也可用 `@branch:<名>`、`@tag:<名>`、`@rev:<完整提交>`。LiteLDev 的仓库可省略前缀，例如 `lip install LeviLamina`。安装时不需要 `-y` 确认参数。具体用法见 <https://levimc.org/zh-Hans/lip/>。

*适用版本：lip 0.26 之后至今（当前 v0.41.1）*

### lip 能否像 npm 一样在当前目录维护依赖清单，lip install 时自动写入，从而通过分享清单实现“整合包”？

不能。`lip install` 只会将包安装进服务器文件夹并记录在 `.lip/state.json` 中，从不写入 `lip.toml`，lip 也没有类似 `package.json` 的工作区清单。若想一次安装一组包（整合包），可以自己制作一个包，在其 `lip.toml` 的 `deps` 里写上所需的所有包（类似 LegacyScriptEngine 默认变体依赖 quickjs 与 lua 两个引擎变体的做法）。发布后，别人只需运行 `lip install <你的包>` 即可一并装好。发布教程见 <https://levimc.org/tutorials/develop/publish-a-package/>。此外，lip 只管理服务端；`lip.toml` 的条目通过 `side = "server"`/`"client"` 区分两端，客户端模组由 LeviLauncher 等启动器读取同样的包来完成安装。

*适用版本：当前 lip（lip.toml 时代）*

### LeviLauncher 的 mod 下载和 lip 是什么关系？Lamium 等外国作者的 mod 也是走 lip 吗？

是的。LeviLauncher 内置了 lip 的包管理功能，下载、安装和更新 LeviLamina 模组实际都是在调用 lip，其模组目录来自 levimc.org 的 lip 模组索引。Lamium（`github.com/amatouhake/Lamium`）等模组同样通过 lip 分发，而非托管在 CurseForge 上。启动器模组页中的“包管理模组”是由 lip 管理的模组，“普通模组”则是 `mods` 目录中不由 lip 管理的模组（如手动导入的模组）。

*适用版本：LeviLauncher v1.1.0（当前版本）*

### lip 可以用来下载 BDS 吗？

可以。lip 的游戏包是 `github.com/LiteLDev/bds`。运行 `lip install github.com/LiteLDev/bds@<version>` 可安装不带加载器的 Windows 版服务器，加上 `#linux` 则为 Linux 版；也可以用 `lip setup --game <version> --no-loader`。如果要连同 LeviLamina 一起安装，直接运行 `lip install LeviLamina`，lip 会自动配好对应的 BDS。如果只需要下载 BDS 文件，也可以使用 bdsdown 工具（`lip install github.com/LiteLDev/bdsdown`）。

*适用版本：lip v0.41.0 及以上*

### lip 安装软件包时执行的钩子命令如果失败，lip 会怎么处理？

如果钩子命令以非零退出码退出，整个安装或卸载操作就会失败。lip 会撤销本次操作的文件改动，但不会撤销钩子命令自身执行的操作，因此钩子命令应当能够安全地重复执行。目前的包描述文件为 `lip.toml`，钩子写在条目的 `hooks` 中（`pre_install`、`post_install`、`pre_uninstall`、`post_uninstall`）。每个条目只对应一个运行端和平台；如需跨平台，要为每个平台分别编写条目和命令。Windows 平台的命令以 `cmd /s /c` 运行（在 Linux/macOS 上通过 Wine 执行），其他平台则以 `sh -c` 运行。

*适用版本：lip v0.40/v0.41（lip.toml）；旧 tooth.json 的 scripts 会被转换为 hooks*

### lip 能不能像 pacman 那样只输入包名（如 `lip -S levilamina`）就从模组列表搜索安装？

命令行不能按包名搜索安装。lip 没有中央仓库，软件包由来源（仓库地址）唯一标识，如 `github.com/LiteLDev/LegacyScriptEngine`，因此第三方包必须填写完整的仓库路径。唯一例外是不含 `/` 的名字会被视为 `github.com/LiteLDev/` 下的仓库，所以 LiteLDev 官方包可以写简称，如 `lip install LeviLamina`、`lip install LeviOptimize`。如果想按名字搜索，可以在终端输入 `lip` 打开界面，在“市场”页搜索 levimc.org 上收录的模组，或者在 <https://levimc.org/mods/> 查找。

*适用版本：lip v0.41.0 及以上*

### lip 能否像 `npm -g` 那样把软件包安装到全局环境？

不能。lip 没有全局安装的概念。每条命令的工作区就是当前工作目录（服务器文件夹），软件包都安装到这个工作区中，也没有参数可以指定其他工作区，因此需要先 `cd` 到服务器目录再执行命令。

*适用版本：当前所有版本 lip*

### 用 lip 安装 LeviLamina 后多出一个名为 loc 的包（levilamina-loc），这是什么？需要手动安装吗？

这是 LeviLamina 的语言包（Localization）`github.com/LiteLDev/levilamina-loc`，内容会放到 `mods/LeviLamina/lang/`。它是 LeviLamina 声明的依赖，安装 LeviLamina 时 lip 会自动装上，不需要手动处理。

*适用版本：当前所有 LeviLamina 版本（服务端和客户端）*

### 新版 lip 还能安装使用旧格式 `tooth.json`（`format_version` 1/2/3）的包吗？包作者该怎么处理？

能。当前版本的 lip（v0.40.0 起的正式版，最新为 v0.41.1；v0.37.0 及更早版本使用 `tooth.json`）已将包描述文件改为 `lip.toml`（`format = 4`），但仍会读取 lip v0.x 时代的 `tooth.json`（format 1、2、3）：format 1/2 会先按 format 3 解读，再在本地转换成 `lip.toml` 的结构后安装，与普通包无异；旧工作区的 `tooth_lock.json` 和 `liprc.json` 也会在首次使用时自动迁移为 `.lip/state.json` 和 `config.toml`。

包作者应在新版本中改用 `lip.toml`。可以在仓库根目录执行 `lip pkg migrate` 把 `tooth.json` 转换为 `lip.toml`（该命令会删除 `tooth.json`，需检查警告后再提交），随后在界面的**开发工具**页用**编辑 lip.toml** 检查。至于旧格式文档，不必再去翻找旧 tag，lip 文档的 `lip.toml`「Earlier formats」一节已说明了 `tooth.json` 的读取规则。

注意：新版 lip 既没有中心仓库，也没有模块代理（不再走 goproxy/lipr），而是直接从 git 仓库获取包；GitHub 访问较慢时，可用 `lip config set github_proxy <URL>` 设置代理。

*适用版本：lip 0.40.0 及以上（lip.toml 时代，当前最新 0.41.1）*

### 用 lip 直接安装 Glacie（多版本互通模组）后报错/不工作，控制台显示装的版本与服务端不匹配，或指定版本安装失败，怎么办？

Glacie 的包清单没有声明对 LeviLamina 或游戏版本的依赖，因此用 lip 安装时如果不带版本号，就会安装最新版，未必与你的服务端版本匹配。你需要根据服务端版本选择对应的 Glacie 版本，并在安装时指定版本号：`lip install github.com/GlacieTeam/Glacie@<版本>`，或者到 GitHub Release 手动下载对应版本。版本对应关系请查阅 Glacie 的 README 和更新日志；遇到问题时，先看控制台输出的实际版本号是否匹配。

如果因 lip 无法读取新格式的包而导致安装失败，说明 lip 版本太旧，请先运行 `lip self-update` 或从 <https://github.com/LiteLDev/lip/releases> 更新 lip。

*适用版本：lip 0.40 及以上；Glacie 3.x（`tooth.json` `format_version` 3，无 LeviLamina 依赖声明）*

### 用 lip 安装插件/LeviLamina 后提示与当前 LeviLamina（或 BDS）版本不适配，是怎么回事？

常见原因是安装命令里写死了旧版本号（如插件说明中给出的 `lip install <仓库>@x.y.z`），导致装上了旧版本，与当前 LeviLamina 不匹配。去掉命令中的 `@x.y.z` 后，lip 就会安装能在当前工作区使用的最新正式版本。

游戏（BDS）与 LeviLamina 的版本由 lip 统一选择：运行 `lip install LeviLamina` 会安装最新的 LeviLamina 以及它支持的最新游戏版本。不过 `lip install` 不会替换已装的游戏或加载器；如果某个模组需要更新的 LeviLamina，命令就会失败，并提示你先用 `lip setup` 切换游戏和加载器版本（例如 `lip setup --game <version>`），然后再安装模组。开服后，可用 `version` 命令确认 LeviLamina 版本。

旧版 lip 一键安装时会拉取 LeviLamina 不支持的最新 BDS，这一问题已不再出现。

*适用版本：lip 0.41.x（当前版本）*

### lip 的源码仓库在哪？从 BDS 官网下载的最新 BDS 能直接配 LeviLamina 用吗？

lip 的仓库地址为 <https://github.com/LiteLDev/lip>（旧地址 `futrime/lip` 会重定向过去）。从官网下载的最新 BDS 往往比 LeviLamina 支持的版本要新，不能直接使用，必须使用与 LeviLamina 对应的 BDS 版本。推荐直接使用 lip：运行 `lip install LeviLamina` 会安装最新 LeviLamina 及其支持的最新游戏版本；也可以运行 `lip setup --game <版本> --loader levilamina`，指定游戏版本并自动选择匹配的 LeviLamina。

### 想在旧版本 BDS（如 1.21.1）上部署 LeviLamina + LegacyScriptEngine，有没有对应整合包？

没有官方整合包，但可以用 lip（v0.41.0 及以上）按版本搭建。

游戏和加载器：在空的服务器目录中运行 `lip setup --game 1.21.1`（会自动选择适配该游戏版本的最新 LeviLamina，也可用 `--loader levilamina@<版本号>` 指定），或者运行 `lip install github.com/LiteLDev/bds@1.21.1 LeviLamina`。

LSE：从 LSE v0.10.0 起，各引擎以变体形式发布，可运行 `lip install github.com/LiteLDev/LegacyScriptEngine#lua@<版本号>`（`#<变体>` 写在 `@` 之前）来安装与所用 LeviLamina 匹配的版本。

不过，1.21.1 这一代（LeviLamina 0.13.x，对应 LSE 0.8.x）的 LSE 仓库里没有 `#lua` 等变体，各引擎包托管在 `gitea.litebds.com` 上，目前无法通过 lip 安装。这种情况下，只能从 LSE 的 GitHub Releases 下载对应版本的 `legacy-script-engine-<引擎>-windows-x64.zip` 手动安装（LegacyMoney 等依赖也要自行安装匹配版本）。

*适用版本：lip 0.41.0 及以上（`lip setup` 与裸名 `LeviLamina` 自 0.41.0 起才有）；LSE 变体安装仅适用于 LSE 0.10.0+。未能从源码或文档中直接证实，仅供参考。*

### 发布供 lip 安装的包时，GitHub 版本标签有什么格式要求？标签没带 `v` 导致装不上、目录搜不到怎么办？

lip 只把名称恰好为 `v` 加 SemVer 2.0.0 版本号的标签当作版本，例如 `v1.1.0-rc.1`、`v2.0.0`。像 `1.1.0-rc.1`、`2.0.0`、`v1.2`、`v01.2.3` 等标签都会被忽略，lip、LeviMC 模组目录以及 LeviLauncher 都会跳过它们。此外，标签处 `lip.toml` 的 `version` 必须与标签一致（不带 `v`，如 `version = "2.0.0"`）。

修复方法：补发一个带 `v` 的标签或 Release。现在的 lip 直接通过 git 协议查询仓库标签，不经过 Go 模块代理，也不缓存标签列表，因此新标签会立刻生效，不需要再换 GOPROXY。

在 `lip.toml` 中，可以用 `{{version}}` 引用版本号（例如在资源 URL 里），用 `{{id}}` 引用包 ID。可运行 `lip install github.com/<作者>/<仓库>@<版本> --dry-run` 来确认版本是否被识别。

*适用版本：lip 0.40 及以上（lip.toml 格式 4）；旧 tooth.json 包的标签规则相同*

### lip 能安装本地的包吗？开发时能否不发布就在本地测试自己的包？

可以。把根目录含有 `lip.toml` 的 ZIP 文件或文件夹路径传给 `lip install` 即可，例如 `lip install ./my-mod.zip` 或 `lip install ../MyTool`（也支持 `https://` 上的 ZIP）。ZIP 只按内容识别，扩展名无所谓，以前改名为 `.tth` 的做法已不再需要。打包时将文件夹压缩成 ZIP，确保 `lip.toml` 位于压缩包根目录即可。你可以用 `lip install <文件夹> --dry-run` 检查 lip 能否正常读取。

另外，在推送标签前，也可以用 `lip install github.com/user/repo@branch:main` 或 `@rev:<40位提交>` 来测试。

建议尽量都用 lip 管理（包括 LeviLamina 本身）。手动放入的文件不在 lip 的状态记录中，lip 无法据此解析依赖关系。

*适用版本：lip 0.40 及以上（`lip pkg` 系列命令需 lip 0.41+）*

### 自己发布 lip 包时，照抄 LeviLamina 的包文件却无法安装，常见原因是什么？

1. 版本 tag 必须严格采用 `v` + 完整 SemVer 格式，例如 `v1.2.3`。`v1.2`、`1.2.3`、`v01.2.3` 之类都不算有效版本（不过可以用 `lip install github.com/user/repo@tag:1.2.3` 安装任意 tag）。
2. lip 读取的是 tag 所指提交里的 `lip.toml`（没有时读取 `tooth.json`）。修改包文件后必须提交，并打上新 tag 推送，旧 tag 的内容不会改变。
3. `lip.toml` 中的 `id` 必须与仓库路径一致（如 `github.com/user/repo`），`version` 必须与 tag 版本一致，且所请求的 variant 要有适配当前环境（平台/side）的条目，否则该版本不会被列为候选。
4. 仓库必须是公开的。

可用 `lip install <仓库>@<版本> --dry-run` 检查 lip 能否读取，或在界面的**开发工具**页通过**编辑 lip.toml** 打开本地的 `lip.toml`。

*适用版本：lip 0.40 及以上*

### lip 的旧文档网站（`lip.futrime.com`、`futrime.github.io/lip`、`lip.levimc.org` 等）打不开了，现在去哪里看 lip 文档？

lip 文档现已迁移至 LeviMC 官网：<https://levimc.org/zh-Hans/lip/>（英文：<https://levimc.org/lip/>，繁体：<https://levimc.org/zh-Hant/lip/>）。文档源码位于 GitHub 仓库 `LiteLDev/liteldev.github.io` 的 `docs/lip/` 目录下，lip 仓库本身也已迁至 <https://github.com/LiteLDev/lip>。在终端里，可以用 `lip --help`（或 `lip -h`）查看总体帮助，用 `lip <命令> --help` 查看单个命令的帮助。

*适用版本：lip 0.40 及以上*

### lip 的包索引网站（`lippkg.com` / `bedrinth.com` / `pkg.levimc.org`）打不开或证书过期，lip 是不是停了？还能用 lip 安装包吗？

lip 没有停用，只是包目录网站多次更换了地址（`lippkg.com` → `bedrinth.com` → `pkg.levimc.org`），这些旧地址均已弃用，请勿再使用。现在的包目录位于 LeviMC 模组页面：<https://levimc.org/zh-Hans/mods/>（lip 界面里的「市场」页和 LeviLauncher 显示的也是这个目录）。此外，目录网站无法访问并不影响 lip 安装包：lip 没有中央仓库，而是直接从包的 git 仓库读取版本，因此用 `lip install github.com/<作者>/<仓库>` 照样可以安装。

*适用版本：lip 0.40 及以上*

### 用 lip 配置好的服务端，用 Windows 自带压缩打包后 `.lip` 文件夹丢失，为什么？

Windows 11 自带的压缩功能可能会跳过以 `.` 开头的（隐藏）文件夹，导致 `.lip` 丢失。压缩行为取决于具体的 Windows 版本。`.lip` 在 Windows 上是隐藏目录，记录了已安装的包、工作区设置等信息；请改用 7-Zip 等第三方压缩工具，在打包或迁移服务器时务必连同 `.lip` 一起复制。

*未能从源码或文档中直接证实，仅供参考。*
