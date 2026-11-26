# 配置 LeviLamina

## BDS 26.x 改用 NetherNet 网络协议后，用 frp（如樱花 frp）等内网穿透/端口转发时玩家连不上服务器（只看到 TCP 19132、UDP 端口随机或只看到 7551），装了 LeviLamina 的服务端该怎么配置？

基岩版服务器仍然使用 UDP，只是新版默认传输协议改为了 NetherNet（底层类似 WebRTC）。在当前版本（BDS 26.60.6 起 / LeviLamina 26.60.x）中，NetherNet 默认仅使用 `server.properties` 中 `server-udp-ports` 指定的单个 UDP 端口，不再需要 LeviLamina 的 `singlePort` 选项（该选项已删除）。配置要点如下：

1. `server.properties` 中的 `server-port`（TCP+UDP，默认 19132）与 `server-udp-ports`（UDP，默认 19132）决定了需要开放的端口。做内网穿透或端口映射时，TCP 和 UDP 都必须转发，且内外网端口需保持一致。
2. 使用 frp 等内网穿透时，将公网地址按 `<公网IP>:<外部端口>:<本机端口>` 格式直接填入 `server-udp-ports`，例如：

   ```text
   server-port=11451
   server-udp-ports=203.0.113.4:11451:11451
   ```

3. 同时在 `mods/LeviLamina/config/Config.json` 的 `targeted.netherNetPatch` 中将 `"enable"` 设为 `false`（关闭 LL 的 STUN 补丁）。若 STUN 获取公网 IP 失败，客户端会报错并显示错误代码 `Door`。
4. 7551 是局域网（LAN）发现端口，与外网连接无关。

此外，仍可在 `server.properties` 中将 `transport` 切回 RakNet，此时仅使用 `server-port`，但 Mojang 将来可能会移除 RakNet。官方教程：<https://levimc.org/zh-Hans/tutorials/server/let-friends-join/>

*适用版本：BDS 26.60.6+；LeviLamina 26.60.1 及以上*

## NetherNet 协议下端口 TCP/UDP 都开放、控制台无报错，玩家仍进不了服务器，浏览器访问 IP:端口 出现备案拦截页面；NetherNet 用于信令的 HTTP 服务能否与游戏 UDP 不在同一台机器，用海外节点/内网穿透反代来规避未备案拦截？

出现备案拦截页面，说明云服务商拦截了未备案的 HTTP 流量。NetherNet 在 `server-port` 上的 TCP（HTTP）流量仅用于广播 MOTD 及向客户端下发服务器的 IP 与端口，而游戏数据走 UDP，二者可以不在同一台机器上。你可以为服务器或域名备案，也可以用海外服务器、内网穿透的海外 HTTP/HTTPS 隧道（或 easytier 等组网工具）反向代理 HTTP 部分，让游戏 UDP 流量继续直连国内服务器。注意，服务器对外地址需通过 `server.properties` 的 `server-udp-ports=<公网IP>:<外部端口>:<本机端口>` 指定（填写数字 IP）。该问题与云服务商的策略有关。

*适用版本：BDS 26.51 及以上（NetherNet 传输）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 的 mod/插件加载顺序怎么决定？前置插件总在依赖它的插件之后加载导致加载失败，怎么调整？

LeviLamina 没有手动调整加载顺序的选项，加载顺序由各 mod 目录下 `manifest.json` 声明的依赖关系决定（采用拓扑排序；无依赖关系的 mod 按名称排序，但不要依赖这一点）。正确做法是由插件作者在 manifest 中声明依赖；若自行处理，可在后加载的 mod 的 `manifest.json` 中将前置写入 `dependencies`：

```json
"dependencies": [ { "name": "前置mod名" } ]
```

字段名为小写的 `dependencies`，可附带 `"version": "^1.2.3"` 等版本要求。

- `dependencies` 列表内的顺序不影响结果，被依赖的 mod 会优先加载。若依赖缺失、版本不匹配或加载失败，依赖方将不会加载。
- 新版 LeviLamina 还支持 `optionalDependencies`（可选依赖：若存在且版本匹配则优先加载，缺失也不会阻止当前 mod 加载）和 `loadBefore`（声明当前 mod 需在某 mod 之前加载，但不建立依赖关系）。
- 为其他加载器（如 .NET 加载器、LSE）编写的插件必须依赖对应的加载器，否则先于加载器加载会导致失败或崩溃。
- 加载器类、库类 mod 通常会设置 `"passive": true`，仅在被其他 mod 依赖时才加载。

不要每次靠在后台手动执行 `ll load <mod>` 来补救，也不建议放开 `ll` 命令的权限（默认需要 Admin 权限）。

*适用版本：LeviLamina 0.x 至 26.60.x（`optionalDependencies`/`loadBefore` 仅较新版本提供）*

## GMLIB、LRCA（GMLIB-LegacyRemoteCallApi）、iListenAttentively 等前置库 mod 装了却没有加载、也没有日志，或某个 mod 不会自动加载了，是什么原因？manifest 里的 `"passive": true` 是什么意思？

`manifest.json` 中的 `"passive": true` 表示被动加载：若没有其他 mod 在 manifest 中声明依赖它，它就不会加载。库和前置类 mod 通常都这样设置，因此单独安装且没有任何依赖方时不加载属于正常现象，并非不兼容。

- 安装一个在 manifest 中声明依赖它的 mod 后，它就会自动加载。
- 如果实际调用它的插件（例如某些 LSE 脚本插件，或漏写依赖的库）未在 manifest 中声明依赖，它就不会加载，或者因加载顺序不对导致依赖方加载失败（装了其他声明该依赖的插件后又能正常运行，只是巧合）。根本解决办法是在调用方的 `manifest.json` 的 `dependencies` 中声明该前置。
- 临时办法：将该前置 mod 的 `manifest.json` 中的 `passive` 改为 `false` 或删除该字段，使其独立加载。
- 注意，`passive` 与插件自身的加载报错（如未适配新版 BDS）无关；删除 `passive` 无法解决这类报错，需等待作者更新。

*适用版本：LeviLamina 0.x 至 26.60.x*

## 安装 LeviLamina 后服务器控制台不显示玩家聊天和玩家执行的命令，需要装插件吗？怎么开启？

不需要额外安装插件。原版 BDS 默认不在控制台记录玩家聊天，LeviLamina 内置了 `simpleServerLogger` 功能但默认关闭。打开 `mods/LeviLamina/config/Config.json`（旧版路径为 `plugins/LeviLamina/config/Config.json`；首次安装时该文件不存在，需先启动一次服务器生成），在 `targeted` 下找到 `simpleServerLogger`，将 `"enabled"` 改为 `true`，并将所需的子项设为 `true`：

- `"playerChat"`：玩家聊天，输出格式如 `[PlayerChat] <玩家> 消息`
- `"playerCommand"`：玩家执行的命令，输出 `[PlayerCmd]`
- `"playerPermission"`：玩家权限变更

保存并重启服务器后生效。当前 v26.60.8 的配置文件路径为 `mods/LeviLamina/config/Config.json`，配置项位于 `targeted.simpleServerLogger`。

*适用版本：LeviLamina 0.11 及以上*

## LeviLamina 服务器上玩家被踢出或退出后仍残留在服务器里（“幽灵玩家”，别人看到它一动不动、显示在线，kick 也踢不掉，本人也无法重新进服），怎么解决？

这是 LeviLamina 漏洞修复功能中“断开连接时强制关闭连接”（`DisconnectClientHook`）引起的副作用。可在 LeviLamina 的配置文件 `Config.json` 中关闭该项：

```json
"targeted": {
  "vulnerabilityFixes": {
    "enable": true,
    "disconnectClient": false
  }
}
```

配置文件位于 `<服务端模组目录>/LeviLamina/config/Config.json`（新版通过 lip 安装的路径为 `mods/LeviLamina/config/Config.json`；若服务端存在 `plugins/` 目录，则为 `plugins/LeviLamina/config/Config.json`）。只需关闭 `disconnectClient`，无需关闭整个 `vulnerabilityFixes.enable`（否则会一并关闭其他漏洞修复）。LeviLamina 1.9.5 及更早版本没有独立的 `disconnectClient` 开关（该开关在 1.9.6 拆分 `vulnerabilityFixes` 配置时加入），需先升级。已经卡在服内的玩家需重启服务器才能清除。

*适用版本：LeviLamina 1.9.6 及之后（含 26.60.x）*

## LeviLamina 下如何让某个 mod 开服时不加载但不删除它的文件？（例如某个 mod 与当前版本不匹配导致每次启动都崩溃）

在该 mod 目录（`mods/<模组名>/`）的 `manifest.json` 中添加 `"passive": true`，它就不会主动加载，仅在被其他 mod 依赖时才加载。也可以重命名该 mod 的 `manifest.json` 或整个 mod 文件夹，使 LeviLamina 无法识别它（启动时可能会有提示）。如果崩溃是由某个 mod（如 trace 日志中出现的某个 dll）与当前 LeviLamina 版本不匹配引起的，直接删除或替换为匹配版本即可。

## LeviLamina 的 STUN 功能是做什么的？关闭它或使用 frp 等穿透后插件获取到的玩家 IP 变成 127.0.0.1 与之有关吗？

STUN 是 LeviLamina 的 NetherNet 补丁（配置项为 `targeted.netherNetPatch`，包含 `enable` 与 `stunServers`，默认值为 `["stun:stun.l.google.com:19302", "stun:stun.miwifi.com:3478"]`），用于帮助服务端获取自身的公网地址（有多个公网 IP 时会一并监听），与获取玩家 IP 无关。玩家 IP 变成 127.0.0.1 是因为使用了 frp 等转发或穿透工具，服务端只能看到转发端的地址，无法获取玩家的真实 IP。

*适用版本：LeviLamina 26.60.x（带 `netherNetPatch`）*

## 同一台机器上运行两个 LeviLamina 服务端，开了 A 端后再开 B 端，B 端加载完就闪退，怎么解决？

这是端口冲突导致的。请先停止服务器，在两个服务端的 `server.properties` 中将 `enable-lan-visibility` 设为 `false`（当 `transport=raknet` 时，即使修改了端口，该选项仍会让服务器强制绑定默认端口 19132/19133），并将各自的端口改为互不相同的值：`server-port`、`server-portv6`，以及 `transport=nethernet` 时使用的 `server-udp-ports`。完成上述设置后（例如用 lip 部署到两个独立的服务端文件夹），即可同时运行。

## `server.properties` 已配置 `transport=nethernet`，但 LeviLamina 服务器启动仍提示正在使用 raknet，为什么？

这是 Glacie 插件导致的：当时版本的 Glacie 会强制开启 raknet。卸载 Glacie 即可使用 NetherNet，也可等待或更新到同时支持 raknet 与 nethernet 的 Glacie 版本。

*适用版本：BDS 26.51 起；取决于 Glacie 版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 的配置里没有 `resourcePackEncryptionMap`（资源包加密）配置项，怎么给资源包加密？

LeviLamina 本体不包含资源包加密功能（早期配置中的 `resourcePackEncryptionMap` 是从 LL2 沿用下来的遗留项，并未实现）。该功能由独立插件 ResourcePackEncryption 提供（<https://github.com/ShrBox/ResourcePackEncryption>），可执行 `lip install github.com/ShrBox/ResourcePackEncryption` 安装。先用 PackCrypt 等工具加密资源包，再在插件配置的 `"ResourcePacks"` 中按 `"uuid": "contentkey"` 格式填入密钥；该插件还支持通过 `"ResourcePacksCDN"` 配置 CDN 下载地址。

*适用版本：LeviLamina 0.8 至当前版本*

## LeviLamina 在不支持颜色输出的控制台环境下会输出乱码颜色符号吗？

不会。LL 的日志格式化器会根据彩色日志开关（`ColorLog`，由 PreLoader 提供）决定输出方式：关闭彩色日志后，LL 会在输出前自动剥离消息和标题中的所有颜色及转义符号。

## LeviLamina 怎么切换成中文（安装中文语言包）？

通过 lip 安装 LeviLamina 时，会自动将语言包 `levilamina-loc` 作为依赖安装到 `mods/LeviLamina/lang/`（包含 `zh_CN.json`、`zh_TW.json` 等），无需手动删除语言目录。LeviLamina 配置文件 `mods/LeviLamina/config/Config.json` 中的 `"language": "system"` 表示跟随系统语言，若需强制使用中文，可将其改为 `"zh_CN"`。如果缺失语言包，可单独安装：

```shell
lip install github.com/LiteLDev/levilamina-loc
```

翻译在 Crowdin（<https://crowdin.com/project/levilamina>）上维护，欢迎参与贡献。注意：部分 mod 输出的文本硬编码在代码中，不受语言包控制。

*适用版本：LeviLamina 26.x；levilamina-loc 1.7.x*

## LeviLamina 服务器（未用内网穿透，直接 IP+端口）客户端无法正常连接，怎么处理？

这可能是服务器无法连接 STUN 服务器所致（新版 BDS 使用 NetherNet，LL 的 NetherNetPatch 会借助 STUN 服务器，让处于 NAT 后的服务器向客户端告知公网地址）。请打开 `plugins/LeviLamina/config/Config.json`，清空 `targeted.netherNetPatch.stunServers`（默认包含 `"stun:stun.l.google.com:19302"` 和 `"stun:stun.miwifi.com:3478"` 两项，仅支持 `stun:`/`stuns:` 开头的 URI）；随后在 `server.properties` 中通过 `server-udp-ports=公网IP:公网端口:本地端口`（例如 `server-udp-ports=203.0.113.4:19489:19489`）手动指定服务器的公网地址。

在 26.51 至 26.60.0 版本中，公网地址通过 LL 配置中的 `netherNetPatch.serverIP` 设置。

*适用版本：LeviLamina 26.60.1 及以上*

## LeviLamina 的控制台日志时间戳精确到毫秒，能否通过配置改成只显示到秒？

没有现成的配置项。LeviLamina 将控制台时间格式硬编码为 `"{3:.3%T.} {2} {1} {0}"`（保留 3 位毫秒）。只能自行编写 mod，调用日志 API（`Logger`/`Sink` 的 `setFormatter` 配合 `PatternFormatter`）替换格式，或者修改 LeviLamina 源码重新编译。

## LeviLamina 的漏洞修复功能误伤导致玩家被断开等异常时，如何关闭？

在 `plugins/LeviLamina/config/Config.json` 中，将 `targeted.vulnerabilityFixes` 下对应的子项设为 `false`（例如与断开连接相关的 `disconnectClient`）。支持单独关闭的子项包括 `subChunkRequest`、`itemReadUserData`、`disconnectClient`、`limitIPFrequency` 和 `simulatedPlayerChunkLoading`；也可将 `targeted.vulnerabilityFixes.enable` 设为 `false` 全部关闭。修改后重启服务器生效。更早的版本只能整体关闭 `vulnerabilityFixes`。

*适用版本：LeviLamina 2026-02 之后（拆分配置后）至 26.60.x*

## LeviLamina 配置文件中 `commands` 下的 `crashCommand` 选项是做什么的？

开启 `modules.command.crashCommand`（设为 `enabled: true`）后会注册 `crash` 命令（客户端为 `clicrash`）。执行该命令会让服务器主动抛出异常并崩溃，用于测试崩溃处理或 CrashLogger，可通过可选参数 `exceptionCode` 指定异常码。`enabled` 默认为 `false`，正常运行的服务器无需开启；`permission` 字段用于控制执行权限（默认为 `GameDirectors`）。

*适用版本：LeviLamina 0.11 至 26.60.x*

## Windows 上运行 LeviLamina/BDS 时控制台中文显示乱码，怎么解决？

依次打开：设置 → 时间和语言 → 语言 → 管理语言设置 → 更改系统区域设置，勾选“Beta 版: 使用 Unicode UTF-8 提供全球语言支持(U)”，然后重启电脑。

*适用版本：当前版本（Windows）。未能从源码或文档中直接证实，仅供参考。*

## `ll show` 展示的插件信息（作者、版本）在哪里设置？在 manifest json 里写 `Author` 和 `Version` 没生效。

在 mod 的 `manifest.json` 中设置。键名必须全部小写，例如 `"author"`、`"version"`（以及 `"description"` 等），首字母大写无法识别。设置后执行 `ll show <mod名>` 即可查看。

*适用版本：LeviLamina 0.9 至 26.60.x*

## 修改 mod/插件的配置文件后不生效怎么办？

修改后请先保存配置文件（建议使用 VS Code 等编辑器而非记事本，以免引发编码或格式问题），然后重启服务器，或在控制台执行 `ll reload <mod名>` 重载该 mod 使配置生效。部分 mod 直接重载可能会出错，可改用 `ll disable <mod名>` 后再执行 `ll enable <mod名>`，或执行 `ll reactivate <mod名>`；若仍不生效，请重启服务器。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*

## 如何让非 OP 玩家也能使用 `tpdim` 等 LeviLamina 内置命令？

修改 `plugins/LeviLamina/config/Config.json` 中 `modules.command` 下对应命令的 `permission` 字段，例如将 `tpdimCommand` 的 `"permission": "GameDirectors"` 改为 `"Any"`，然后重启服务器。

*适用版本：LeviLamina 1.x 至 26.60.x*

## 装了 MOTD 修复插件后，在 `server.properties` 里改了服务器名称（MOTD），客户端却始终显示其他内容，怎么回事？

这通常不是 MOTD 修复插件导致的。请在控制台执行 `ll list` 查看已安装的 mod，一般是其他带有动态 MOTD 功能的插件覆盖了 `server.properties` 中的 `server-name`。前往对应插件的配置文件修改或关闭动态 MOTD 即可。

*适用版本：LeviLamina 所有版本。未能从源码或文档中直接证实，仅供参考。*

## 服务器启动后再附加调试器（如 Visual Studio / .NET 托管调试）附加不上，怎么办？

外置 CrashLogger 会作为调试器附加到 BDS 进程上，而一个进程同一时间只能附加一个调试器，导致其他调试器附加失败。无需删除 CrashLogger，可在 `mods/LeviLamina/config/Config.json` 中将 `modules.crashLogger.enabled` 设为 `false`（或将 `builtin` 设为 `true`，改用进程内的内置模式），重启服务器后再附加调试器；也可以直接通过调试器启动服务器，此时 CrashLogger 会自动跳过启用。在该案例中，.NET 托管调试还受编译路径影响，程序集必须从调试构建输出目录加载才能正常附加。

*适用版本：LeviLamina 当前版本，使用外置 CrashLogger 时*

## LeviLamina 服务器崩溃时会把崩溃日志上传到 Sentry，如何关闭上传？

在 LeviLamina 配置文件 `mods/LeviLamina/config/Config.json`（旧版安装路径为 `plugins/LeviLamina/config/Config.json`）中，将 `modules.crashLogger.uploadToSentry` 设为 `false`：

```json
"modules": {
  "crashLogger": {
    "uploadToSentry": false
  }
}
```

内置和外置 CrashLogger 均受此项控制（外置模式下将不再传入 `--enablesentry` 参数）。另外请注意：如果服务器配置了自动重启，但存在端口占用或重复启动，就会反复崩溃并持续上传日志，此时应先排查端口冲突或重复启动问题。

*适用版本：LeviLamina 当前版本*

## LeviLamina 控制台日志没有颜色（全是白色），在 LeviLamina 配置里找不到 `colorLog`，怎么开启彩色日志？

彩色日志开关不在 LeviLamina 的配置中，而在 PreLoader 的配置文件里：打开服务端根目录下的 `PreLoaderConfig.json`，将 `"colorLog"` 改为 `true`，重启服务器即可恢复彩色输出。

*适用版本：LeviLamina 0.13.4 及以上至当前版本*

## 使用 MCSManager 面板运行 LeviLamina 时，PreLoader 输出后就看不到 BDS 的正常输出，面板输入命令也无效，怎么办？

需要启用虚拟 TTY，在 MCSManager 的实例设置中开启“仿真终端”选项即可。

*适用版本：LeviLamina 1.x 及以上，使用 MCSManager 面板时。未能从源码或文档中直接证实，仅供参考。*

## 非 LeviLamina 插件（例如要在 PreLoader 阶段加载的 DLL）应该怎么写 manifest？可以直接用 LL 插件的 manifest 吗？

不能直接使用。不要将类型设为 `"type": "native"`，因为那代表由 LeviLamina 原生模组管理器加载的普通 C++ 模组。对于需要由 PreLoader 在游戏启动前加载的 DLL，应在 manifest 中填写 `"type": "preload-native"`。这类 DLL 会在游戏启动前、加载 LeviLamina 模组之前由 PreLoader 加载（LeviLamina 本身也属于这种类型）。它们不属于 LeviLamina 模组，LeviLamina 的模组注册表会跳过这类清单。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*
