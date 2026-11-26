# LegacyScriptEngine 的安装、配置与版本

## 安装

### LSE 的 Node.js 引擎（`legacy-script-engine-nodejs`）加载失败，报 `C++ Exception: std::system_error ... [0x0000007E:system] 找不到指定的模块`，依赖诊断显示 `missing module: libnode.dll`（或提示缺少 node 运行库），怎么解决？

原因：Node.js 引擎依赖 LiteLDev 自行预编译的 Node 运行库（`libnode.dll` 及配套文件）。该运行库不由系统安装的 Node.js 提供，因此在系统中安装 Node.js 无济于事。此外，LSE 的 GitHub Release 压缩包也不包含该运行库，手动解压安装 LSE、使用面板服或使用网上的整合包时最容易遗漏。

推荐做法：用 lip 安装 Node.js 引擎，lip 会自动下载 libnode 等全部依赖：

```shell
lip install github.com/LiteLDev/LegacyScriptEngine#nodejs
```

README 中也写作 `lip install LegacyScriptEngine#nodejs`。如果不加 `#nodejs`，默认只安装 QuickJS 和 Lua 引擎，不会安装 Node.js 引擎。下载过程需要良好的网络环境，必要时请配置代理或镜像；建议将 lip 更新到最新版，以获得更清晰的错误提示。

手动安装（例如面板服无法运行 lip 时）：下载 <https://github.com/LiteLDev/node/releases/download/v22.12.0/node-prebuilt.zip>，将压缩包内的文件直接解压到 `mods/legacy-script-engine-nodejs/` 目录下（不要多套一层文件夹）。依赖的确切下载地址和存放位置以 LSE 包中的 `lip.toml`（旧版本为 `tooth.json`）为准。你也可以先在本地电脑上用 lip 装好整个服务端，再打包上传到面板。如果此前放过旧版 libnode，请先删掉服务端各处残留的旧 `libnode.dll`，以免加载到错误版本。

另外注意：各 LSE 引擎（quickjs、nodejs 等）的版本必须保持一致；新版 LSE 已不再依赖归档的 LegacyParticleAPI。

*适用版本：LegacyScriptEngine 当前版本（v0.23.1，LeviLamina 26.60.x）*

### LSE 的 Python 引擎（`legacy-script-engine-python`）启动时报红：找不到 `python312.dll` / `python3.dll`、缺少模块或直接加载失败，装了 Python 3.13 也不行，该怎么处理？

自 LSE 0.9.0 起，Python 引擎不再自带 Python 运行环境，需要在运行服务器的机器上自行安装对应版本的 Python：

- LSE >=0.16.2（含当前 0.23.x）需要 Python 3.12.10；
- 0.9.0~0.16.1 为 3.12.8；
- \<0.9.0 为 3.10.11。

版本必须严格匹配，安装 3.13 或 3.14 无效（引擎查找的是 `python312.dll`）。安装后，请确保已将 Python 3.12 所在目录加入 `PATH` 环境变量（多个 Python 版本可以共存，关键是能通过 `PATH` 找到 3.12 的 dll）；也可以将 `python312.dll` 等文件直接放到 `bedrock_server.exe` 所在目录。如果直接双击 exe 启动正常，用面板启动却报错，多半是因为面板修改了 `PATH`。

如果服务器上没有 Python 插件（Python 插件极少），最简单的做法是不安装或卸载 Python 引擎：执行 `lip uninstall LegacyScriptEngine#python`，或手动删除 `mods/legacy-script-engine-python` 目录，这不会影响 QuickJS、Lua 和 NodeJS 引擎。LSE 的各个引擎是独立的 lip 包变体（`#quickjs`、`#lua`、`#nodejs`、`#python`），只安装插件实际需要的引擎即可，装得越多负载越大；不带变体执行 `lip install LegacyScriptEngine` 只会安装 QuickJS 和 Lua。另外，如果 Lua 等其他引擎同时报错且怀疑下载文件损坏，可以执行 `lip cache clean` 后重装。

*适用版本：LSE 0.9.0 及以上（当前 0.23.1 需 Python 3.12.10）；Windows 服务端*

### 在 LeviLamina 服务器上怎么运行旧的 LLSE（LiteLoaderBDS 时期）JS/Lua 等脚本插件？把单个 `.js` 文件丢进 `plugins` 目录后为什么没有加载？

1. LeviLamina 本体不内置脚本引擎，只加载原生 mod。要运行 LLSE 脚本插件，必须先安装 LegacyScriptEngine（LSE，它本身是 LeviLamina 的一个 mod），且版本需与当前 LeviLamina 匹配（LeviLamina 刚发布新版本时，需等待对应的 LSE 版本更新）。推荐用 lip 安装以自动处理依赖：执行 `lip install LegacyScriptEngine#quickjs`（JS），或将变体换为 `#lua`、`#nodejs`、`#python`；不指定变体（`lip install LegacyScriptEngine`）则会同时安装 QuickJS 和 Lua 引擎。也可以从 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 手动下载构建好的成品（不要下载源码）。可通过 `ll list` 查看已加载的 mod，确认 LSE 是否加载成功。使用 Python 引擎需在本机安装版本匹配的 Python（LSE >=0.16.2 对应 Python 3.12.10）。
2. 安装插件：将单文件插件（`.js` / `.lua` / `.py`，Node.js 插件为 `.llplugin` 包）直接放入服务端的 `plugins/` 根目录即可。首次启动时，LSE 会将其迁移到 `plugins/<插件名>/` 文件夹并自动生成 `manifest.json`，同时输出警告 `Legacy plugins have been migrated, please restart the server to load them!`。此时插件尚未加载，需要再重启一次服务器（或在控制台执行 `ll load <插件名>`）。迁移后如需修改代码，请直接编辑 `plugins/<插件名>/` 中的文件。如果下载的插件文件夹已包含 `manifest.json`，直接把整个文件夹放入 `plugins/` 并重启一次即可。
3. 如果装好引擎后个别插件仍无法工作，多半是因为插件本身与新版本不兼容，或缺少其他前置依赖（如 GMLIB 等），请改用作者适配新版的版本；插件内部写死的旧路径也可能需要修改。LL2 时代的 `.dll` 原生插件与 LeviLamina 不兼容，无法加载。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本（LSE 0.23.x / LeviLamina 26.60.x）*

### 在 LeviLamina 服务器上怎么安装 LegacyScriptEngine（LSE）及各语言引擎？旧命令（`gitea.litebds.com/LiteLDev/legacy-script-engine-xxx`、不带变体的 `lip install github.com/LiteLDev/LegacyScriptEngine` 等）装不上怎么办？能否手动安装？

推荐在服务器根目录下用 lip 安装。LSE 是同一个包，每种语言引擎都是它的一个变体：

```shell
lip install LegacyScriptEngine#quickjs
lip install LegacyScriptEngine#lua
lip install LegacyScriptEngine#nodejs
lip install LegacyScriptEngine#python
```

`LegacyScriptEngine` 等价于 `github.com/LiteLDev/LegacyScriptEngine`；不指定变体时，lip 会同时安装 QuickJS 和 Lua 两个引擎。使用哪种语言的插件就安装对应的引擎，无需全部安装。

安装前提是服务器已用 lip 装好 LeviLamina（通过 `lip setup` 或 `lip install LeviLamina`）：`lip install` 不会安装或替换游戏本体和 LeviLamina，若 LSE 所需的 LeviLamina 版本与当前已安装的版本不符，命令会直接失败并提示使用 `lip setup`。其余依赖（LegacyRemoteCall、LegacyMoney、iListenAttentively；nodejs 引擎还会安装 Node 运行时 `node-prebuilt` 和 `7-zip-tooth`）均由 lip 自动安装。旧的 `gitea.litebds.com/LiteLDev/legacy-script-engine-xxx` 包名已废弃。

LSE 版本必须与 LeviLamina 版本匹配。如需安装旧版，可用 `@<版本号>` 指定（变体写在 `@` 之前，如 `LegacyScriptEngine#quickjs@0.23.1`）。

手动安装：前往 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 下载 `LegacyScriptEngine-server-<引擎>-windows-x64.zip`，将其中的 `legacy-script-engine-<引擎>/` 文件夹放入服务端的 `mods/` 目录，并手动安装版本匹配的 LegacyRemoteCall、LegacyMoney、iListenAttentively 等依赖；nodejs 引擎还需将 `node-prebuilt.zip` 额外解压到同一目录，因此 nodejs 和 python 引擎更建议用 lip 安装。具体需要放置哪些文件、依赖哪些包，可参考对应版本仓库中的 `lip.toml`（旧版本为 `tooth.json`）。请勿使用 GitHub Actions 的构建产物，容易缺失组件。

将 LLSE 脚本插件放入 `plugins/` 目录（自 0.23.0 起，该目录是启动时自动创建的指向 `mods/` 的链接）即可，无需手动新建文件夹；服务端启动后会自动迁移插件并生成 `manifest.json`，再次重启即可加载。

详细文档见 <https://levimc.org/zh-Hans/LegacyScriptEngine/> 和教程「给服务器安装模组」。

*适用版本：LSE 0.10.0 及以上（变体式包名）；当前最新 LSE 0.23.1 / LeviLamina 26.60.x / lip 0.41.x*

### LSE 的 quickjs、nodejs、lua、python 四个引擎都要装吗？怎么判断一个插件需要哪个引擎？

不需要全部安装，用到哪种插件就安装对应的引擎（`lip install LegacyScriptEngine#quickjs` / `#lua` / `#nodejs` / `#python`；不指定变体时默认安装 quickjs 和 lua）。

判断方法：

1. 查看插件文件后缀（`.js` / `.lua` / `.py`）。
2. JS 插件分为 QuickJS 和 Node.js 两种：带有 `package.json`（使用 npm 包）的一般是 Node.js 插件，否则大概率是 QuickJS 插件。
3. 最准确的方法是查看插件 `manifest.json` 中的 `type` 字段（`lse-quickjs`、`lse-nodejs`、`lse-lua`、`lse-python`），以及 `dependencies` 中列出的依赖引擎（如 `legacy-script-engine-quickjs`）。

如果装错或漏装，启动日志也会提示缺少哪个依赖。

注意：使用 Python 引擎需要本机安装对应版本的 Python（LSE >=0.16.2 为 3.12.10）。

*适用版本：当前所有版本（LSE 0.10.0 起为变体式包名；最新 0.23.1）*

### LSE 加载 Node.js 插件时自动执行 npm 安装依赖卡住/失败，插件因缺少 `node_modules` 无法加载，怎么办？另外为什么插件里 `require`/`import` 相对插件目录，而 `fs`、`path.resolve` 却从 BDS 根目录开始？

LSE 的 Node.js 引擎加载插件时，如果 `package.json` 声明了 `dependencies` 且插件目录下没有 `node_modules`，会自动调用 `legacy-script-engine-nodejs` 目录下随 lip 安装的 `node_modules`/npm，执行 `npm install --omit=dev --no-fund`。

如果 `legacy-script-engine-nodejs` 不是用 lip 安装的（缺少 npm），或者因网络原因安装失败，可以按以下方式处理：

1. 自行安装 Node.js（从 <https://nodejs.org/> 下载或执行 `winget install OpenJS.NodeJS.LTS`），进入出问题的插件目录（`mods/<插件名>/`，即 `package.json` 所在目录；新版 LSE 会在 BDS 根目录创建指向 `mods` 的 `plugins` 链接），手动执行 `npm i`。网络不佳时可切换 npm 镜像源或使用代理。
2. 如果上次失败留下了不完整的 `node_modules`，将其删除后重启服务端，LSE 会重新自动安装。
3. 重新安装该插件。

关于路径问题：CommonJS 下 `__dirname` 指向插件目录，模块解析也会查找插件目录及其 `node_modules`。但进程的工作目录（cwd）是 BDS 根目录，因此 `fs` 读写、`path.resolve` 等基于 cwd 的操作均相对于 BDS 根目录。访问插件内的文件时，请基于 `__dirname`（ESM 下使用 `import.meta.url`）拼接绝对路径。

*适用版本：LSE nodejs 引擎当前版本（0.23.x）*

### LSE 文档里说的插件目录 `/path/to/bedrock_dedicated_server/plugins` 指的是哪里？

指 BDS 服务端根目录（即 `bedrock_server_mod.exe` 所在目录）下的 `plugins` 文件夹。当前 LeviLamina 的模组目录是根目录下的 `mods/`，而 LSE 从 0.23.0 起会在启动时自动创建指向 `mods/` 的 `plugins` 目录联接（junction）。因此，将 LLSE 插件放入 `plugins/` 或 `mods/` 均可；服务端启动后会自动将其迁移到 `mods/<插件名>/` 并生成 `manifest.json`，重启后即可加载。

注意：如果服务器根目录下已经存在真实的 `plugins` 文件夹（例如旧版本遗留），LSE 无法创建链接，并会报错 `a file or directory with the same name already exists`。此时需要将里面的插件移至 `mods/`，然后删除该 `plugins` 文件夹。

*适用版本：LSE 0.23.0 及以上（当前 0.23.x）*

### LeviLamina + LegacyScriptEngine 服务器的 `plugins` 目录里应该放哪些文件？下载到的 .jar、.pdb、.dll、.js/.py/.lua、压缩包分别怎么处理？

请按文件类型分别处理：

1. `.jar`：Java 版插件，无法使用。
2. `.pdb`：调试符号文件，普通用户不需要。
3. 单独的 `.dll`：不能直接安装。LeviLamina 原生模组需要作者提供包含 `manifest.json` 的完整文件夹或压缩包，或者通过 lip 安装。
4. 单文件的 `.js` / `.lua` / `.py`：直接放入 `plugins/`（LSE 0.23.0 起该目录是指向 `mods/` 的链接，因此也可直接放入 `mods/`）。首次启动时，文件会自动迁移到 `mods/<插件名>/` 并生成 `manifest.json`，重启后才会加载（需提前安装对应语言的引擎）。
5. 压缩包：检查包内是否有含 `manifest.json` 的文件夹，若有，将该文件夹整体解压到 `mods/`；如果是 `.llplugin` 格式的 Node.js 插件包，直接放入目录即可自动解压。
6. LegacyMoney（原 LLMoney）：LSE 的依赖项，使用 lip 安装 LSE 时会自动一并安装。
7. 插件文件名建议去掉 `[minebbs]-` 等前缀，因为文件名会直接作为模组名。

*适用版本：LeviLamina 当前版本；LSE 0.23.x*

### LeviLamina 下如何安装 LSE 的 Python 引擎？

在服务器根目录下使用 lip 安装 LSE 的 python 变体：`lip install github.com/LiteLDev/LegacyScriptEngine#python`（客户端请使用 LeviLauncher 安装）。此外，Python 引擎要求本机安装对应版本的 Python（LSE >=0.16.2 需要 Python 3.12.10）。由于 Python 插件较少，非必要可以不安装。

*适用版本：LSE 0.16.2 及以上（当前 0.23.x）*

### 为 LSE 写的 Node.js 插件应该怎么打包发布？打包后安装/`npm install` 后加载报错怎么办？

打包发布有两种方式：

1. 官方 `.llplugin` 方式：将 `package.json` 和所有源码打包为 zip（不要包含 `node_modules`），将后缀改为 `.llplugin`。安装时放入 `plugins/` 目录（`plugins` 是指向 `mods` 的链接）；LSE 启动时会自动将其解压到 `mods/<插件名>/` 并执行 `npm install --omit=dev`，若目录中没有 `manifest.json`，则会根据 `package.json` 的入口自动生成，重启后即可加载。
2. 作为模组目录或 lip 包发布：在 `mods/<插件名>/` 下放置源码和 `manifest.json`（其中 `entry` 指向入口 js 文件，`name` 与目录名一致，`type` 设为 `lse-nodejs`，`dependencies` 中填写 `legacy-script-engine-nodejs`）。为避免用户因网络问题连不上 npm，可以将 `node_modules` 一并打包，并编写 `lip.toml` 供用户通过 lip 安装。

如果加载报错，请先检查 `manifest.json` 中的 `entry` 是否指向了正确的入口文件。

*适用版本：当前 LSE（0.23.x）nodejs 引擎*

### 为了使用 SimpleTPS 这类 LSE 插件安装 LSE 时，必须安装 Python 版 LSE（并要求特定 C++/Python 版本）吗？

不需要。LSE 按语言拆分为多个引擎变体（`#quickjs`、`#nodejs`、`#lua`、`#python`），只需安装插件实际用到的变体即可。例如运行 JS 插件只需执行 `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs`。如果不指定变体，直接执行 `lip install github.com/LiteLDev/LegacyScriptEngine`，则只会安装 QuickJS 和 Lua 引擎，不会安装 Python 引擎。只有 Python 引擎才要求本机安装特定版本的 Python（LSE >=0.16.2 要求 3.12.10）；用不到的 Python 版 LSE 可以通过 `lip uninstall` 卸载。

*适用版本：当前所有 LSE 版本（`lip.toml` 变体）*

### 为什么 `legacy-script-engine-quickjs` 加载不了？

常见原因是手动解压时目录结构有误，例如多嵌套了一层文件夹（`mods/legacy-script-engine-quickjs/legacy-script-engine-quickjs/...`），或者目录内缺少 `manifest.json` 甚至为空文件夹。发布包 zip 内自带顶层目录 `legacy-script-engine-quickjs/`，解压时应确保 `manifest.json` 直接位于 `mods/legacy-script-engine-quickjs/` 下。此外，手动安装还必须自行配齐所有依赖（LegacyRemoteCall、LegacyMoney、iListenAttentively 以及版本匹配的 LeviLamina）。推荐直接执行 `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs` 安装。

*适用版本：LeviLamina 1.x 及以上；当前 LSE*

### 使用 LegacyScriptEngine 的 nodejs 引擎需要单独安装 Node.js 吗？

仅运行插件时不需要。执行 `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` 会自动下载包含 libnode 的 `node-prebuilt.zip` 并解压到 `mods/legacy-script-engine-nodejs/`，同时自动安装 7-zip 等依赖。只有在本机开发 Node.js 插件（需要执行 `npm init` 等命令）时，才需要自行安装 Node.js。

*适用版本：当前 LSE nodejs 引擎*

### 想用 JS 写 LeviLamina 服务器插件，从零搭建环境的步骤是什么？需要 xmake/cmake/mingw 吗？

运行和编写 JS 插件不需要 xmake/cmake/mingw（这些工具仅用于 C++ 模组开发）。环境搭建步骤如下：

1. 从 <https://github.com/LiteLDev/lip/releases/latest> 下载并安装 lip（`lip-<version>-win-x64.msi`）。
2. 国内网络环境下，可配置 GitHub 代理：`lip config set github_proxy <代理地址>`。
3. 新建服务器目录并 `cd` 进入该目录，执行 `lip install LeviLamina --accept-eula`（会自动一并安装版本匹配的 BDS）。
4. 安装 JS 引擎：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`（或 `#quickjs`）。
5. 执行 `lip run` 或直接运行 `bedrock_server_mod.exe` 启动服务端。

编写的插件应放在 `mods/<插件名>/` 目录下（`plugins/` 是指向 `mods/` 的链接）。目录内需包含入口文件和 `manifest.json`（其中 `name` 与目录名一致，`entry` 为入口 js 文件，`type` 设为 `lse-nodejs` 或 `lse-quickjs`，`dependencies` 中填写 `legacy-script-engine-nodejs` / `legacy-script-engine-quickjs`）。在 Node.js 引擎下，在 `package.json` 中设置 `"type": "module"` 即可使用 ES 模块。API 文档详见：<https://levimc.org/zh-Hans/LegacyScriptEngine/>。

也可以手动下载安装，但需要自行补齐所有依赖（LegacyRemoteCall、LegacyMoney、iListenAttentively、7-zip、node-prebuilt 等）。

*适用版本：lip 0.41.x；LeviLamina 26.x；LSE 0.23.x*

### 跳过 lip、手动安装 LSE 的 NodeJS 引擎后，加载（`.llplugin`）插件时提示解码/解压失败，怎么办？

这是因为缺少 `7za.exe`。LSE nodejs 引擎需要调用 `7za.exe` 来解压 `.llplugin` 文件。使用 lip 安装 `#nodejs` 变体时，lip 会通过依赖 `github.com/LiteLDev/7-zip-tooth` 自动将 `7za.exe` 放到服务端根目录；手动安装时，则需自行从该仓库下载 `7za.exe` 并放到服务端根目录（无需运行）。此外，libnode（来自 `node-prebuilt.zip`）应放在 `mods/legacy-script-engine-nodejs/` 下，而不是服务端根目录。推荐直接使用 `lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` 安装。

*适用版本：当前 LSE nodejs 引擎（手动安装时）*

### LeviLamina 下安装 iLand 等 Lua 插件后完全不加载、控制台也没有任何报错，怎么解决？

这通常是因为未安装对应语言的脚本引擎或插件依赖库，或是插件文件不完整。请在服务器根目录下使用 lip 安装 Lua 引擎：`lip install LegacyScriptEngine#lua`（若不指定变体，直接运行 `lip install LegacyScriptEngine` 会同时安装 QuickJS 和 Lua 引擎），lip 会自动处理相关依赖。安装后，启动日志中应会显示已加载 Lua 引擎。如果插件本身安装不完整，可先运行 `lip cache clean` 清理缓存，再重新安装插件。

*适用版本：LSE 0.23.x / lip 0.41.x（当前版本）*

### 在较旧 BDS（如 1.21.70）的 LeviLamina 服务端上用 lip 安装 LSE nodejs 引擎报依赖冲突，怎么安装对应版本？

不指定版本号时，lip 默认安装最新版 LSE，其依赖的 LeviLamina 版本会与旧服务端冲突。安装时需指定与服务端匹配的 LSE 版本，语法为 `<repo>#<variant>@<version>`（变体写在 `@` 之前），例如 `lip install github.com/LiteLDev/LegacyScriptEngine#quickjs@0.11.3`（对应 BDS 1.21.70 / LeviLamina 1.2.x 时期）。可查阅 LSE CHANGELOG 中各版本支持的 LeviLamina 版本来选择对应版本。

自 LSE 0.10.0 起，变体统一使用 `#nodejs` 写法，旧文档中的 `legacy-script-engine-nodejs` 包名仅适用于 0.10.0 之前的版本。

注意：LSE 0.13.x 及更早版本的 `tooth.json` 中，nodejs 变体使用 `uncompressed` 类型的资源来下载 node。当前版本的 lip（自 v0.38 起读取 `tooth.json` 时不再支持 `uncompressed`）会认为该版本不含 nodejs 变体，从而无法安装。若需安装这类旧版 nodejs 引擎，请改用 lip v0.37.0 及更早版本，或从对应的 GitHub Release 手动下载 `legacy-script-engine-nodejs` 包，并将 `node-prebuilt.zip` 解压到其目录中。自 LSE 0.14.0 起，nodejs 变体已改用 zip 资源，可直接用当前版本的 lip 正常安装。

*适用版本：LSE 0.10.0 及以上；当前 lip 0.41.x*

### LSE 的 Python 引擎和 NodeJS 引擎安装时有什么需要注意的？

目前各引擎均作为 LegacyScriptEngine 包的变体提供，直接使用 lip 安装即可：`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs` / `#python`（`#quickjs`、`#lua` 同理）。lip 会自动处理依赖（其中 NodeJS 变体会一并下载 node 预编译运行时到 `legacy-script-engine-nodejs` 目录）。

Python 引擎要求在运行机器上安装对应版本的 Python：LSE >=0.16.2 需使用 3.12.10，>=0.9.0 \<0.16.2 需使用 3.12.8，\<0.9.0 需使用 3.10.11。由于引擎会从环境变量 `PATH` 中名称包含 Python 的目录里查找 `Lib`、`DLLs` 和 `site-packages`，安装 Python 时必须将其加入 `PATH`。

*适用版本：LSE 0.23.x（Python 版本对应表适用于所有版本）*

## 配置

### LeviLamina 下 LSE 脚本插件的 `manifest.json` 放在哪里、怎么写（`type` 填什么）？提示未知类型 / 插件不被识别怎么办？旧插件自带的自定义 `manifest.json` 冲突怎么办？如何用 `ll load` 手动加载？

每个 mod 或插件都必须在 `plugins/<插件文件夹>/manifest.json`（服务端模组根目录为 `plugins/`）下放置一个符合 LeviLamina 规范的清单文件。文件中至少要包含 `name`（与文件夹同名）、`entry`（入口文件）和 `type`；此外还可以使用 `dependencies`、`optionalDependencies` 和 `loadBefore` 来控制依赖关系与加载顺序。

`type` 取值：

- C++ 原生 mod 填 `native`
- QuickJS 插件填 `lse-quickjs`
- Lua 填 `lse-lua`
- Node.js 填 `lse-nodejs`
- Python 填 `lse-python`（`entry` 为 `__init__.py`）

同时必须安装对应的 LSE 引擎（如 `lip install LegacyScriptEngine#quickjs`），否则该 `type` 无人处理，插件将无法被识别。

清单文件不支持自定义格式。如果旧插件自带了同名的 `manifest.json` 文件，需要将其改名或修改为兼容格式。省事的做法是直接将单个 `.js` 等脚本文件放进 `plugins` 根目录并启动一次服务端，LSE 会自动完成迁移并生成清单文件，随后按提示重启即可。

如需手动加载插件，可使用控制台命令 `ll load <插件文件夹名>`。

清单格式文档：<https://levimc.org/zh-Hans/LeviLamina/api_reference/mod/>

*适用版本：LeviLamina 1.x 及以上，对应 LSE（含 LeviLamina 26.60.x / LSE 0.23.x）*

### LSE 中 `data.name2xuid` 等玩家信息查询接口返回空/没有返回值（尤其对之前进过服的玩家），是接口坏了吗？

不是接口坏了。这些接口（`data.name2xuid`、`data.xuid2name`、`data.name2uuid`、`data.getAllPlayerInfo`、`data.fromName` 等）依赖 LeviLamina 的 PlayerInfo 服务。该服务默认不随服务器启动，只有在插件调用时才会启用，因此在此之前进服的玩家不会被记录，查询时就会返回空值。

解决方法：在 LeviLamina 配置文件（`mods/LeviLamina/config/Config.json`）的 `targeted.playerInfo` 下，将 `alwaysLaunch` 设为 `true` 并重启服务器；此后进服的玩家都会被记录。

*适用版本：LeviLamina 服务端（当前 26.60.x 仍适用）；LSE*

### LSE 的 Node.js 插件 `manifest.json` 里 `entry` 写成了绝对路径（如指向 E 盘），换到别的服务器就无法加载，正确写法是什么？

`entry` 应填写相对于插件（模组）目录的相对路径（通常直接写入口脚本文件名），不要使用绝对路径。LSE 加载插件时会按 `模组目录 / entry` 拼接出入口路径；如果填写了绝对路径，该路径会原样生效，换到其他机器上就会找不到文件。

示例：

```json
{
  "entry": "LLSE-FakePlayer.js",
  "name": "LLSE-FakePlayer",
  "type": "lse-nodejs",
  "dependencies": [ { "name": "legacy-script-engine-nodejs" } ]
}
```

注意：当 LSE 自动迁移 Node.js 插件包（`.llplugin`）时，所生成 `manifest.json` 中的 `entry` 是根据 `package.json` 的 `main` 字段解析出的规范化绝对路径（解析失败时则为空）。这正是 `entry` 变成当前机器绝对路径的常见原因；迁移后请务必检查并手动将其改为相对路径。

*适用版本：LeviLamina 1.x 及以上；LSE 0.23.x（当前版本）*

### LSE 的各个引擎（quickjs、nodejs、lua、python）版本不一致会有问题吗？

会有问题，LSE 各引擎的版本必须保持一致。目前各引擎均作为同一个 LegacyScriptEngine 包的变体（`#quickjs`、`#lua`、`#nodejs`、`#python`）提供，使用 lip 安装或升级时版本会自动保持一致，并且它们共同依赖相同版本范围的 LeviLamina、LegacyRemoteCall、LegacyMoney 和 iListenAttentively。

### LeviLamina 下 LSE 插件（如依赖 nodejs 引擎或 LegacyRemoteCall/GMLIB 的插件）不被识别/不加载，报“无法识别的模组类型：lse-nodejs”，怎么办？

该报错表示加载此插件时，对应的引擎（`legacy-script-engine-nodejs`）尚未加载或未安装。LeviLamina 会按照 `manifest.json` 中的依赖关系排序加载，因此需要在插件目录下的 `manifest.json` 中写明 `dependencies`。例如，依赖 `legacy-script-engine-nodejs` 或 LegacyRemoteCall 的插件必须声明相应依赖；若不声明，就只能靠默认顺序（按名称排序）碰运气。此外，`manifest.json` 还支持 `optionalDependencies`、`conflicts`、`loadBefore` 等字段。

同时，请确认已使用 lip 安装了对应的引擎变体。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*

### 在 LeviLamina 上用 LSE 插件时，还需要另外装 LL2 的 PAPI（PlaceholderAPI）吗？

不需要，LL2 的 PAPI 无法在 LeviLamina 上使用。第三方库 GMLIB 已内置 PAPI 功能，对于依赖 PAPI 的插件，只需安装 GMLIB 即可。

*适用版本：LeviLamina；第三方 GMLIB。未能从源码或文档中直接证实，仅供参考。*

### 在 LeviLamina + LSE 服务器上装了 OneTitle 称号插件，插件已加载，但玩家聊天消息里没有显示称号，怎么办？

OneTitle 本身只负责导出 API/PAPI，不会修改聊天格式，因此需要搭配聊天格式插件使用。例如安装 ChatFormatter（需配合 GMLIB），并在其聊天格式配置中加入 OneTitle 提供的 PAPI 占位符（如 `%onetitle%`）即可。

*适用版本：第三方插件 OneTitle / ChatFormatter / GMLIB。未能从源码或文档中直接证实，仅供参考。*

### 用不到 Lua/Python 引擎和 LegacyMoney（原 LLMoney），能否禁用这些组件以加快启动和节省资源？

不需要的脚本引擎可以移除。LSE 的每个引擎都是独立的 mod 目录（`mods/legacy-script-engine-quickjs`、`mods/legacy-script-engine-lua`、`mods/legacy-script-engine-python`、`mods/legacy-script-engine-nodejs`），直接删掉不用的目录即可。

如果使用 lip，单独安装的变体可以用 `lip uninstall` 卸载（例如 `lip uninstall LegacyScriptEngine#python`）。但默认安装（不带变体的 `lip install LegacyScriptEngine`）会同时安装 QuickJS 和 Lua；二者是默认变体的依赖，lip 不会单独卸载仍被依赖的包。如果只想保留一个引擎，请先卸载 LegacyScriptEngine，再单独安装所需变体（例如 `lip install LegacyScriptEngine#quickjs`）。

但 LegacyMoney 不能删除。在当前版本中，LegacyMoney 是 LSE 的必需依赖（`manifest.json` 的 `dependencies` 列出了 LegacyMoney、LegacyRemoteCall 和 iListenAttentively），删掉后 LeviLamina 会因为缺少依赖（`MissingDependency`）拒绝加载所有 LSE 引擎。

*适用版本：LegacyScriptEngine 0.23.x（LeviLamina 26.60.x）及当前版本*

### 装了 BehaviorLog（行为日志）LSE 插件后，后台一直刷命令方块执行的日志，怎么关掉？

打开 BehaviorLog 的配置文件 `./plugins/BehaviorLog/config.json`，找到 `onCmdBlockExecute` 项，将 `true` 改为 `false`（数值项则将 `1` 改为 `0`），保存后重启服务器或重载插件。插件说明见 <https://www.minebbs.com/threads/behaviorlog.7759/>。

*适用版本：第三方 LSE 插件 BehaviorLog，具体配置路径和键名以所用插件版本为准。未能从源码或文档中直接证实，仅供参考。*

## 版本与兼容性

### 旧版 LeviLamina 上装最新版 LSE 装不上或提示依赖缺失（如提示需要更新的 LeviLamina），LSE 和 LeviLamina 的版本怎么对应？怎么装旧版 LSE？

LSE 与 LeviLamina 的版本号并不相同，但每个 LSE 版本只兼容特定范围的 LeviLamina，新版 LSE 无法在旧版 LL 上运行（例如当前 LSE 0.23.x 要求 LeviLamina 26.60.*）。

要查询版本对应关系，可以查看 LSE 对应 release tag 提交中的 `lip.toml`（0.23.1 及更早版本为 `tooth.json`）里所依赖的 `github.com/LiteLDev/LeviLamina` 版本范围，或查阅 CHANGELOG 中“Adapted to LeviLamina xx”的记录。

在旧版 LL 上，需要用 lip 指定匹配的旧版 LSE，并将变体写在 `@` 之前，例如 `lip install LegacyScriptEngine#quickjs@0.13.2`。lip 会按该版本声明的依赖安装配套的 LegacyRemoteCall、LegacyMoney 等组件。你也可以从各项目的 GitHub Releases 下载对应的旧版本手动安装。GMLIB 等第三方 native 前置同样必须与当前 LeviLamina/BDS 版本对应。

历史示例：LeviLamina 0.13.x（BDS 1.21.2/1.21.3）对应 LSE 0.8.20（当时包名为 `gitea.litebds.com/LiteLDev/legacy-script-engine-*`）。

*适用版本：当前版本（LSE 0.10.0 及以上可用 `LegacyScriptEngine#<变体>@<版本>` 安装，更早版本使用旧 gitea 包名）*

### BDS 26.20（LeviLamina 26.20.x）上装了最新版 LSE 后不工作、LSE 插件不加载，该装哪个版本的 LSE？

LSE 的每个版本只对应一个 LeviLamina 小版本系列，不能跨版本使用。最新的 LSE 0.23.x 面向 LeviLamina 26.60.*（BDS 26.60），无法在 26.20 上运行。LeviLamina 26.20.x 对应 LSE 0.19.x，请安装该系列的最后一个版本 LSE 0.19.7。

版本对应关系：

- 0.19.x → LL 26.20.*
- 0.20.0 → LL 26.32.*
- 0.21.x → LL 26.40.*
- 0.22.x → LL 26.51.*
- 0.23.x → LL 26.60.*

查看 LSE CHANGELOG 中“Adapted to LeviLamina xx”的条目，即可确认各版本适配的 LL 版本。

*适用版本：LeviLamina 26.20.x；LSE 0.19.x～0.23.x（版本对应原则适用于当前版本）*

### LeviLamina 更新到新 BDS 版本后，LSE 报一堆 fatal 错误或提示 mod 版本太旧，JS 插件都跑不起来，怎么办？

这是因为 LSE 尚未适配新版 LeviLamina，旧版 LSE 无法加载。你可以等 LSE 发布正式适配版本后再一并升级，或先把 LeviLamina 保持在与当前 LSE 匹配的版本。

如果急用，可以登录 GitHub，前往 <https://github.com/LiteLDev/LegacyScriptEngine/actions> 下载最新的构建产物（artifact）临时使用。若插件还依赖 GMLIB 等第三方前置库，则需等这些前置库也完成适配。

*适用版本：当前版本（每次 LeviLamina 跟进新版 BDS 时都会出现）*

### 更新 GMLIB 后，LSE 插件通过 GMLIB-LegacyRemoteCallApi 调用 GMLIB 接口（如 `GMLIB_API::getServerAverageTps`）时报接口不存在/报错，之前版本正常，是什么原因？

新版 GMLIB-LegacyRemoteCallApi（LRCA）在清单中被设为 passive，如果没有任何插件在 manifest 中声明依赖它，就不会被加载（可用 `ll show GMLIB-LegacyRemoteCallApi` 确认）。

解决方法：在调用方插件的 `manifest.json` 中，将 `GMLIB-LegacyRemoteCallApi` 加入 `dependencies`（必选依赖）或 `optionalDependencies`（可选依赖，未安装时也能正常加载）。如果代码是供宿主插件引用的子模块、自身没有 manifest，则需将该依赖加到宿主插件上。

运行时可用 `ll.getAllPluginInfo().some(p => p.name === "GMLIB-LegacyRemoteCallApi")` 判断它是否已加载，未加载时提示用户安装 GMLIB 和 LRCA。部分接口在低版本 LRCA 中不存在，必要时还需检测版本。

如果报错来自 GMLIB 本身（如 `bad optional_ref access`），则属于 GMLIB 的 bug，与 LSE 无关，请更新到已修复的 GMLIB 版本或向其作者反馈。

*适用版本：LeviLamina 1.x 及以上；GMLIB / GMLIB-LegacyRemoteCallApi（第三方）。未能从源码或文档中直接证实，仅供参考。*

### LSE 插件用 `BinaryStream` 自己发包刷新告示牌，更新服务器版本后失效了，怎么改？

新协议修改了方块坐标 y 的写入方式：协议版本 >= 944 时，y 坐标需使用 `writeVarInt`（有符号），旧版本则使用 `writeUnsignedVarInt`。

示例：

```js
bs[mc.getServerProtocolVersion() >= 944 ? "writeVarInt" : "writeUnsignedVarInt"](pos.y);
```

*适用版本：BDS 协议版本 944 及以上（LSE 0.18.4 起观察到）。未能从源码或文档中直接证实，仅供参考。*

### LegacyScriptEngine 的 NodeJS 引擎（`legacy-script-engine-nodejs`）内置的是哪个版本的 Node.js？

Node.js v22.12.0。通过 lip 安装 LSE 的 nodejs 变体时，会一并下载 LiteLDev/node 的 v22.12.0 预编译包（`node-prebuilt.zip`），ScriptX 的 V8 后端也是基于 node v22.12.0 构建的。

*适用版本：LSE 0.9.0 及以上（当前 v0.23.1）*

### LSE nodejs 引擎加载失败，报 `Raw Seh Exception: [0xC0000005:ntstatus]` 访问违例（如 `legacy-script-engine-nodejs` 加载失败），怎么解决？

LSE 各个引擎（quickjs、lua、nodejs、python）的版本必须一致，否则必然崩溃（例如 0.18.0 的 lua 搭配 0.18.2 的 nodejs 就会出错）。将所有已安装的引擎更新或重装到同一版本即可，例如运行 `lip install LegacyScriptEngine#nodejs`，使其与已安装的 `#quickjs`、`#lua` 保持版本一致；如果不需要 nodejs 插件，也可以直接卸载 nodejs 引擎。

同时，LeviLamina 也要更新到该 LSE 版本所要求的版本（例如 LSE 0.23.x 要求 LeviLamina 26.60.*）。

*适用版本：当前版本（LSE 0.23.x 对应 LeviLamina 26.60.\*）*

### LSE 中获取玩家延迟的 API（`player.getDevice().avgPing` / `lastPing`）在 26.20 正常，在 26.51 上获取不到，是什么原因？

可能是服务端使用了 NetherNet 协议，导致无法获取相关网络统计信息。可尝试将服务端切换为 RakNet 后再试。

*适用版本：BDS 26.51 及以上（推测性答案）。未能从源码或文档中直接证实，仅供参考。*

### LSE 的 Python 引擎还推荐使用吗？LSE 的 JS/Lua 引擎会停止维护吗？

JS（QuickJS、Node.js）和 Lua 引擎会继续维护。

Python 引擎目前仍作为 `LegacyScriptEngine#python` 变体提供（`lip install LegacyScriptEngine#python`），但需要先在机器上安装 Python（LSE >=0.16.2 需要 Python 3.12.10），且存在 threading/asyncio 不可用等已知问题。维护者建议需要 Python 插件生态的用户改用 LeviStone（在 LeviLamina 上运行 Endstone 的 Python 插件）。

*适用版本：当前版本（LSE 0.23.x）*

### 升级到新版 LeviLamina（如 26.10）后 LSE 加载报错，LSE 正式版还没适配新版本，怎么提前用上？

LSE 正式版发布前，可以登录 GitHub，在 GitHub Actions（<https://github.com/LiteLDev/LegacyScriptEngine/actions>）的 `build.yml` 工作流中找到一次成功（绿色）的运行记录，下载其中的构建产物。产物按 `<仓库>-<commit>-<server|client>-<引擎>-windows-x64` 格式命名，服务端请选择带 `server` 且对应所需引擎（nodejs/quickjs/lua/python）的包。

NodeJS 引擎还需要 node 运行时（下载 <https://github.com/LiteLDev/node/releases/download/v22.12.0/node-prebuilt.zip> 并解压到 `mods/legacy-script-engine-nodejs/`）；正式版的 nodejs 变体还额外依赖 7-zip-tooth。

依赖的 LegacyMoney、LegacyRemoteCall、iListenAttentively 可通过 lip 安装（如 `lip install github.com/LiteLDev/LegacyMoney` 等）。不过它们的正式版同样锁定某个 LeviLamina 小版本（目前为 26.60.*）；如果 lip 报错提示与新版 LeviLamina 冲突，也需要前往各自仓库的 Actions 下载适配新版的构建产物。

*适用版本：当前版本（LSE 正式版尚未适配最新 LeviLamina 的过渡期）*

### 把服务器从 BDS 1.21.93 升级到 1.21.124 后，LSE 加载时报一堆红字、BackupHelper 等插件无法正常工作，报错涉及 LegacyParticleAPI，怎么解决？

先确认插件已更新到适配新版本的版本（例如 BackupHelper 0.9.1 不兼容，需更新到 0.14.0）。LegacyParticleAPI 是旧版 LSE 的依赖，自 LSE 0.15.0 起已移除，直接卸载或删除 LegacyParticleAPI 即可。

如果加载地图时的红字是由低版本存档升级导致的，一般不影响使用。

*适用版本：LSE 0.15.0 及以上（从更旧版本升级时）*

### 老 LXL（LiteXLoader/LLSE）插件开发者回坑：现在还用 LXL 吗？支持多维度吗？旧插件写法还能用吗？

LXL/LiteLoaderBDS 已不再使用，现在的方案是 LeviLamina + LegacyScriptEngine（LSE，即 LLSE 脚本引擎的延续）。

LSE 沿用同一套 LLSE API，旧的 LLSE 插件几乎无需修改即可运行（部分插件可能因事件触发时机差异等原因无法正常工作）：把旧插件放进 `plugins/` 并启动服务器，LSE 会自动迁移并生成 `manifest.json`，重启后即可加载。

多维度方面，LeviLamina 生态中的 MoreDimensions 库（`lip install github.com/LiteLDev/MoreDimensions`）提供了自定义维度 API。它本身不添加维度，需要配合调用其 API 的模组一起使用。

*适用版本：LeviLamina 26.60.x；LSE 0.23.x（当前版本）*
