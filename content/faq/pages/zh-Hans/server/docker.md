# 在 Docker 中运行 LeviLamina

## 用 LeviLamina 官方 docker 镜像部署后，怎么查看日志、进入服务器控制台输入命令（能用 `docker exec` 吗）、以及找到服务器数据？`attach` 后没有任何输出正常吗？

用 `docker ps`（或 `podman ps`）查看容器名或 ID；用 `docker logs -f <容器名>` 查看日志；用 `docker attach <容器名>` 接入服务器控制台输入命令（不要加开头的 `/`），按 `Ctrl+P` 再按 `Ctrl+Q` 即可脱离控制台而不停止服务器。为此，容器需以 `-d -it` 启动（在 compose 中对应 `stdin_open: true`、`tty: true`）。`attach` 后不会回显之前的日志，看起来没反应是正常的，输入一条命令（如 `list`）即可看到输出。`docker exec` 进入的是容器里的新 shell，看不到 BDS 控制台，也无法向其输入命令（但可用 `docker exec` 在容器里执行 `lip` 等命令）。服务器数据保存在 volume 中（容器内路径为 `/data`），可用 `docker volume inspect levilamina-server-data` 查看宿主机上的存储位置；切勿在宿主机上直接启动 volume 里的 `bedrock_server_mod.exe`。另外，LeviLamina 注册的命令默认无需开启作弊即可使用。

*适用版本：docker-levilamina-server 0.9.x（wine 与 windows 镜像）*

## 用 LeviLamina docker 镜像拉到/装上的是很旧的版本（镜像本身很旧，或 `VERSION=LATEST` 仍装旧版 LL），怎么办？

1. 如果拉下来的镜像本身很旧（例如是很早期的版本），多半是使用了国内 Docker 镜像加速站，拉到了缓存的旧镜像。请直接从官方源 `ghcr.io/liteldev/levilamina-server:latest-wine`（或 `latest-windows`）拉取，或换一个同步正常的镜像站，必要时先执行 `docker pull` 更新镜像。
2. 环境变量 `VERSION`（默认为 `LATEST`，也可指定为 `26.60.7` 等，不带 `v` 前缀）仅在首次启动、且卷里还没有 `bedrock_server_mod.exe` 时生效；如果卷里已经安装过服务器，修改 `VERSION` 或更换新镜像都不会重新安装 LL。要升级现有服务器中的 LeviLamina，请在容器内用 `lip setup` 同时指定游戏版本和 LL 版本，例如 `docker exec -it <容器名> lip setup --game <该 LL 版本支持的游戏版本> --loader levilamina@<LL 版本> --accept-eula`（可先加 `--dry-run` 预览变更），然后重启容器（先 `docker stop -t 60` 再 `docker start`）。注意，`lip update` 无法更新游戏本体和 LeviLamina，执行后会拒绝并提示改用 `lip setup`。此外，也可以新建一个卷重新部署。
3. LL 本体位于 `mods/LeviLamina`。迁移旧服务器时，不要把旧的 LeviLamina 目录覆盖回去，只需拷贝 `worlds`、`allowlist.json`、`server.properties` 等数据文件和其他模组。

教程：<https://levimc.org/zh-Hans/tutorials/server/docker/>

*适用版本：docker-levilamina-server 0.9.x（lip v0.41+）*

## LeviLamina 服务器有 docker 部署方式吗？能挂载数据吗？镜像里没有 Python 运行环境怎么办？

官方提供了 `ghcr.io/liteldev/levilamina-server:latest-wine`（Linux 容器）和 `:latest-windows`（Windows 容器）镜像。服务器、存档和配置文件都在 `/data`（Windows 容器为 `C:\data`）下，可通过命名卷或 bind mount 挂载。官方 LeviLamina 镜像不含 Python。如果是为了运行 LeviStone/Endstone Python 插件，请直接使用已内置 Python 和 LeviStone 的官方镜像 `ghcr.io/liteldev/levistone-server`。若是其他需求，可基于官方镜像通过 `docker build` 二次打包：Windows 镜像可在 servercore 中自行安装 Python；Linux（Wine）镜像中的 BDS 运行在 lip 安装的 Wine 里，因此 Python 也必须装进该 Wine 前缀（`/data/.lip/wine`），而不是直接执行 `apt install python3`，具体可参考 docker-levistone-server 的实现。

*适用版本：docker-levilamina-server 0.9.x；docker-levistone-server 0.3.x*

## 在 Windows 容器中运行 LeviLamina/BDS，能用 nanoserver 作基础镜像吗？nanoserver 装不上 VC 运行库怎么办？

nanoserver 缺少大量组件，既装不上 VC 运行库，也运行不了 BDS/LeviLamina。请改用 servercore 基础镜像（官方 Windows 镜像使用的就是 `mcr.microsoft.com/windows/servercore:ltsc2022`）。在 servercore 中可通过命令静默安装 VC 运行库：`vc_redist.x64.exe /install /quiet /norestart`。若想减小镜像体积，只能在 servercore 的基础上逐项裁剪。

*适用版本：Windows 容器，当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## 用 docker 部署 LeviLamina，服务端文件和配置文件（`server.properties` 等）在哪里？

这些文件都在容器的数据目录 `/data`（Windows 镜像为 `C:\data`）下，`bedrock_server_mod.exe`、`server.properties`、`worlds`、`mods` 等均在此处，对应挂载的数据卷（默认为 `levilamina-server-data`）。在宿主机上可执行 `docker volume inspect levilamina-server-data` 查看该卷的实际路径，也可改用 bind mount（`-v /宿主机目录:/data`）直接访问宿主机目录。

*适用版本：docker-levilamina-server 当前所有版本*

## Linux 面板服（如翼龙/Pterodactyl 面板）如何安装 LeviLamina？

这需要面板（或服务商）提供支持 Wine 运行 Windows 版 BDS 的环境。具体配置可参考官方 Docker 镜像的实现：<https://github.com/LiteLDev/docker-levilamina-server>（在 Linux 镜像中，由原生 lip 执行 `lip install --accept-eula github.com/LiteLDev/LeviLamina` 完成安装，再通过 `lip run` 调用 lip 自带的 Wine 启动服务端）。

*适用版本：当前所有版本，x64 Linux*

## 在 Linux 上用 LeviLamina docker 镜像运行服务器，执行 `pip install levistone --target ...` 报 `No matching distribution found for levistone`，如何在 docker 里用 LeviStone？

官方 LeviLamina 镜像（`levilamina-server`）不含 Python 环境，在 Linux 宿主机或容器内直接用 Linux 版 pip 也无法安装（LeviStone 必须安装在运行服务端的 Wine 环境内的 Windows 版 Python 中）。请直接改用官方的 LeviStone 镜像：

```shell
docker run -d -it --name levistone -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levistone-server-data:/data ghcr.io/liteldev/levistone-server:latest-wine
```

该镜像会将 Python 安装到 Wine 前缀中，并用 pip 将 LeviStone 安装至 `mods/EndstoneRuntime`；Endstone 插件则存放在数据卷的 `plugins/` 目录下。可通过环境变量 `LEVISTONE_VERSION` 指定版本（须与 LeviLamina 版本匹配），通过 `PYPI_MIRROR_URL` 指定 PyPI 镜像源。

*适用版本：docker-levistone-server 0.3.x 及以上*

## 面板服或 Wine 环境下无法安装 LeviStone，有其它在 Linux 上运行 LeviStone 的办法吗？

可以使用官方 LeviStone Docker 镜像：<https://github.com/LiteLDev/docker-levistone-server>（`ghcr.io/liteldev/levistone-server:latest-wine`）。容器首次启动时会自动安装 Wine、VC 运行库、游戏本体、LeviLamina、Python 和 LeviStone。国内用户可配合 `GITHUB_MIRROR_URL`、`PYPI_MIRROR_URL` 环境变量以及 `ghcr.nju.edu.cn` 镜像源进行加速。

*适用版本：docker-levistone-server 当前版本*

## 在 Linux（如用 MCSManager）上运行 LeviLamina 服务端，启动后模组（插件）没有加载，怎么办？

LeviLamina 仅有 Windows 版本，在 Linux 上必须通过 Wine 运行 Windows 版服务端（`bedrock_server_mod.exe`）；直接运行 Linux 版 BDS 无法加载 LeviLamina 和模组。最简单的做法是用 Docker 运行官方镜像 `ghcr.io/liteldev/levilamina-server:latest-wine`（仓库地址：<https://github.com/LiteLDev/docker-levilamina-server>），例如：

```shell
docker run -d -it --name levilamina -e EULA=TRUE -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

容器首次启动时，lip 会自动安装 Wine、VC++ 运行库、游戏本体和 LeviLamina，宿主机无需安装 Wine。如果不用 Docker，在 x64 Linux 上也可以直接用 Linux 版 lip 开服，lip 会调用自带的 Wine 运行 Windows 服务端。国内环境若从 GitHub 下载缓慢或超时，可添加 `-e GITHUB_MIRROR_URL=<GitHub 镜像地址>`；拉取 ghcr.io 镜像本身可能也需要配置代理或镜像源。

*适用版本：当前所有版本（docker-levilamina-server 0.9.x / lip v0.41+）*

## 在官方 LeviLamina docker 容器里如何安装 LSE 等模组？为什么容器里 LeviLamina 显示的是英文？

官方镜像自带 lip。已部署的服务器可通过 `docker exec` 在运行中的容器里执行 lip，例如：

```shell
docker exec -it levilamina lip install github.com/LiteLDev/LegacyScriptEngine#quickjs
```

（可选变体有 `#lua`、`#quickjs`、`#nodejs`、`#python`）。安装后需重启容器（`docker stop -t 60 levilamina && docker start levilamina`）才会加载模组。新部署服务器时，也可以设置环境变量 `PACKAGES` 在首次启动时一并安装。

显示英文是因为 LeviLamina 配置文件 `mods/LeviLamina/config/Config.json` 中的 `"language"` 默认设为 `"system"`，会跟随容器的系统区域设置，而容器默认不是中文。使用 wine 镜像时，可以给容器传入 `-e LANG=zh_CN.UTF-8`（必要时同时设置 `LC_ALL`），或直接把 `Config.json` 里的 `language` 改为 `"zh_CN"`（写成 `"zh-CN"` 也可以）后重启容器。

*适用版本：docker-levilamina-server 0.9.x；LeviLamina 当前版本；LSE 当前版本*

## 用 Docker 部署 LeviLamina 服务器好用吗？Windows 容器能跑吗？

官方提供两种镜像：`ghcr.io/liteldev/levilamina-server:latest-wine`（Linux 容器，原生运行 lip 并通过内置 Wine 运行 Windows 服务端）和 `ghcr.io/liteldev/levilamina-server:latest-windows`（Windows 容器）。Windows 镜像基于 `mcr.microsoft.com/windows/servercore:ltsc2022`，可以运行 LeviLamina，数据卷需挂载到 `C:\data`；若自行构建 Windows 镜像，建议同样选用 servercore 作为基础镜像，nanoserver 一般不适合运行完整服务端。是否使用 Docker 取决于个人习惯：Windows 宿主机直接开服（配合面板与开机自启）通常更简单；Linux 宿主机则推荐使用官方 wine 镜像。注意，容器需以 `-it` 参数运行，并通过 `docker attach` 接入控制台。

*适用版本：docker-levilamina-server 0.9.x*

## 用 MCSManager 面板（Docker 镜像方式）搭建 LeviLamina 服务器，启动命令和容器应该怎么配置？

镜像填写 `ghcr.io/liteldev/levilamina-server:latest-wine`；启动命令留空（使用镜像自带的 entrypoint）；容器内挂载目录设为 `/data`；端口映射设为 `19132:19132/udp`（官方示例同时映射了 `19132:19132/tcp`）；开启可交互控制台（`-it`）。环境变量配置如下：

- `EULA=TRUE`（必须为大写 `TRUE`，entrypoint 区分大小写，写 `true` 会直接退出）
- `LANG=zh_CN.UTF-8`（可选，中文区域设置）
- `WINEDEBUG=-all`（可不填，未设置时 lip 运行服务端会默认设为 `-all`）
- 可选：`VERSION`、`PACKAGES`、`GITHUB_MIRROR_URL`、`TZ`

若启动时出现崩溃日志相关的报错，可在 `mods/LeviLamina/config/Config.json` 中将 `modules.crashLogger.enabled` 设为 `false` 进行排查。

*适用版本：docker-levilamina-server 0.9.x；LeviLamina 当前版本*

## 用 docker 运行 `ghcr.io/liteldev/levilamina-server:latest-wine` 后，客户端提示版本不匹配无法进入，需要什么版本的 MC？

镜像内的游戏（BDS）版本由所安装的 LeviLamina 版本决定（通过环境变量 `VERSION` 指定，默认为 `LATEST`，即最新版 LeviLamina）。由于 LeviLamina 适配新版 MC 需要时间，服务端版本往往低于最新客户端。客户端版本必须与当前 LeviLamina 支持的 BDS 版本一致（可在 LeviLamina 的 release 说明中查看对应的游戏版本），或者等待 LeviLamina 适配后再部署新版本。市面上也有支持高版本客户端进服的第三方模组，但不在 LiteLDev 官方支持范围内。

## 使用 LeviLamina 官方 docker 镜像运行服务端时，控制台（如 MCSManager 面板）里的中文显示为乱码，怎么解决？

首先给容器传入区域设置环境变量 `LANG=zh_CN.UTF-8`（必要时同时设置 `LC_ALL=zh_CN.UTF-8`）。wine 镜像已内置全部区域设置（`locales-all`），Wine 会根据该变量转换输出编码。接着检查面板（MCSM）实例的终端/输出编码是否设为 UTF-8。若依然乱码，可临时将 LeviLamina 的 `language` 改为英文来规避，但仅输出中文的模组仍可能出现乱码。

*适用版本：docker-levilamina-server wine 镜像（0.7.1 起含 locales-all）。未能从源码或文档中直接证实，仅供参考。*

## 使用 `ghcr.io/liteldev/levilamina-server` 镜像时，如何指定 LeviLamina 版本、使用镜像加速、预装模组？

可通过以下环境变量配置：

- `EULA=TRUE`（必填，需大写）
- `VERSION`：要安装的 LeviLamina 版本（如 `26.60.7`），默认为 `LATEST`（最新版），游戏版本由它决定
- `GITHUB_MIRROR_URL`：用于下载的 GitHub 镜像地址（即 lip 的 `github_proxy`），如 `https://v4.gh-proxy.org/https://github.com/`
- `PACKAGES`：首次启动时由 lip 自动安装的包，多个包之间用空格分隔
- 其他：`TZ`、`LANG`/`LC_ALL`、`WINEDEBUG`（仅限 wine 镜像，默认为 `-all`）

示例：

```shell
docker run -d -it --name levilamina -e EULA=TRUE -e VERSION=26.60.7 -e PACKAGES="github.com/LiteLDev/LeviOptimize" -p 19132:19132/udp -p 19132:19132/tcp -v levilamina-server-data:/data ghcr.io/liteldev/levilamina-server:latest-wine
```

注意，`VERSION` 和 `PACKAGES` 仅在首次安装（即挂载卷内尚无 `bedrock_server_mod.exe`）时生效；后续添加模组请执行 `docker exec -it levilamina lip install <包>`。

*适用版本：docker-levilamina-server 0.8.8 及以上（当前 0.9.1）*
