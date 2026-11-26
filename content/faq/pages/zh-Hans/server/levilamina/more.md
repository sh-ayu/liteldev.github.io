# LeviLamina 的性能与其他问题

## LeviLamina 服务器只有一两个人在线 TPS 也很低（MSPT 很高、飞行卡顿），如何排查是哪个插件导致的？

可用控制变量法（二分法）排查：先把 `mods` 目录中除 LeviLamina 及其必需组件外的 mod 全部移出，进服测试 MSPT。若纯 LeviLamina 不卡，说明问题出在 mod 上，可分批（二分）加回逐个排查，或优先检查最近新装的 mod。已知的高开销插件案例包括通过监听方块变化来记录告示牌的 playerlogger、CustomMap（地图画）等，移除后 TPS 明显恢复。此外，红石/活塞机器、实体堆积也是常见原因（可限制红石频率、检查实体数量），同时还需排除云服务器超售导致的性能不足。

*未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器内存持续上涨（几小时到十几 GB）直至崩溃，或频繁随机崩溃，怎么排查？

内存持续上涨基本可以断定是某个 mod 或插件内存泄漏（原生 C++ mod 嫌疑较大）。排查步骤如下：

1. 先备份存档，然后只启动纯 LeviLamina（不装 mod）或直接运行原版 BDS，确认是否仍然泄漏。
2. 若纯净环境正常，用排除法排查：先卸载 LSE 脚本插件观察，再逐个加回 mod（有前置的先装前置），每加一个观察一段时间的内存占用，定位泄漏源。
3. 若卸载所有 mod 后仍泄漏，再考虑 BDS 本身或存档问题（例如末地被大量凋零破坏后的存档）。

LeviLamina 没有查看单个 mod 内存占用的命令。CrashLogger 崩溃日志会输出 `Memory Info`（进程工作集/提交大小等），可用于判断崩溃时的内存状态；可执行 `lip update github.com/LiteLDev/CrashLogger` 将其更新到最新版本。此外，Intel 13/14 代（Raptor Lake）CPU 不稳定也会导致大量每次不同的随机崩溃（调用栈中常见 AVX 相关函数），需检查 CPU 微码与电压稳定性。

*适用版本：当前所有 LeviLamina 版本*

## LeviLamina 服务器加载某些插件（如领地插件）时启动时间明显变长，为什么一个插件会多花几百毫秒？

这主要是事件监听机制导致的。LeviLamina 的事件发射器（emitter，即对应的 hook）采用懒加载机制，某个事件在首次被监听时才会创建并安装 hook，这一过程需要耗时。如果某个插件监听了大量其他插件未曾监听的事件，这些 hook 的安装开销都会计入该插件的加载时间；而已被监听过的事件，后续插件再次监听时就会非常快。因此，这部分加载时间并不完全是该插件自身造成的。

*适用版本：LeviLamina 当前所有版本（含 26.60.x）*

## LeviLamina 服务端启动非常慢怎么办？

可能是 Windows Defender 等杀毒软件正在扫描服务端文件，可尝试将服务器目录加入 Defender 排除项。若无效，则可能受限于运行环境性能（如 PVE 虚拟机、老旧 CPU）。此外，插件首次监听大量事件时需安装 hook，也会拉长启动时间。

*适用版本：当前所有版本，Windows 环境。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 的 TPS 表现会比 LiteLoaderBDS（LL2）好吗？

两者表现相近。TPS 主要取决于 BDS 本身，加载器不会带来明显提升。LiteLDev 另外提供了性能优化模组 LeviOptimize（可优化区块发送、实体广播、红石更新、随机刻、异步任务调度等，各功能可通过 `/lo` 单独开关），可按需安装：`lip install github.com/LiteLDev/LeviOptimize`。

*适用版本：LeviLamina 当前版本；LeviOptimize 当前版本（要求 LeviLamina 26.60.x）*

## 装上 LeviLamina 后 BDS 内存占用异常高（启动瞬间就到 10GB），该怎么排查？

排查方法：先直接启动纯 `bedrock_server.exe` 进行对比；然后备份存档，在模组目录（服务端通常为 `plugins/`，不存在时为 `mods/`）中只保留 LeviLamina 及其前置，再逐个移回其他 mod 以定位问题（多半是某个原生 mod 内存泄漏）。可使用 Windows Performance Recorder 记录内存使用情况，Mem Reduct 等工具只能起到临时缓解作用。

曾有案例最终定位为 CustomSkin（发包修改玩家皮肤）插件配合含几十个 4D 皮肤的资源包所致，删除该皮肤资源包后即恢复正常。

*适用版本：LeviLamina 1.x 及以上（服务端 mod 目录为 `plugins/`）*

## 升级 LeviLamina 后开服明显变慢，卡在 `[PreLoader] Loading records from data...`，是什么原因？

据维护者解释，自 LeviLamina 1.2.0 / BDS 1.21.70 起，PreLoader 使用的符号/记录数据经过了加密，加载时需要先解密，因此 `Loading records from data...` 阶段会比以前慢。在多数机器上该过程只需约两秒，属正常现象，耐心等待即可。

*适用版本：LeviLamina 1.2.0-rc.1 及以后（PreLoader 1.13+）。未能从源码或文档中直接证实，仅供参考。*

## 在哪里查看 LeviLamina 的全网使用统计（服务器数量、玩家数等）？需要另装 bStats 吗？

LeviLamina 自 0.9.1 起内置了 bStats 统计上报功能，无需另外安装 bStats。统计页面地址为 <https://bstats.org/plugin/server-implementation/LeviLamina/21245>（也可在 bstats.org 搜索 LeviLamina）。如不想上报，可在 LeviLamina 配置文件 `Config.json` 中将 `targeted.enableStatistics` 设为 `false`。

*适用版本：LeviLamina 0.9.1 及以上（服务端）*

## LeviLamina 服务器有什么 QQ 群服互通（QQ 群与服务器消息互通）方案？

LiteLDev 官方不提供群服互通插件，需使用社区方案，例如 HuHoBot（群服互通机器人），或基于 WebSocket 的 CoordinationWSS（ws/wsserver，下载地址：<https://www.minebbs.com/resources/coordinationwss-ws-wsserver.9637/>）。使用前请确认插件支持你当前的 LeviLamina/BDS 版本。

*适用版本：LeviLamina 1.x 及以上（取决于第三方插件的适配情况）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器卡死时，按 Ctrl+C 为什么关不掉服务器？

LeviLamina 通过 `SetConsoleCtrlHandler`（以及 SIGINT/SIGTERM 信号处理）拦截了控制台的 Ctrl+C 和关闭事件，改为调用 `DedicatedServer` 的 `stop()` 请求正常关服。在当前版本中，如果服务器已进入关服流程（`GamingStatus::Stopping`，即已执行到 `ServerInstance::leaveGameSync`），再次按 Ctrl+C 会直接调用 `std::terminate` 强制结束进程；因此若在“关服过程中卡住”，再按一次 Ctrl+C 即可强制退出。但如果服务器在进入关服流程之前就已卡死（例如主线程死锁），`stop()` 请求不会被处理，状态也不会变为 `Stopping`，此时多次按 Ctrl+C 均无效，只能通过任务管理器等方式强制结束进程。

*适用版本：LeviLamina 26.60.x（服务端）*

## LeviLamina 的文档能否离线下载？

可以。LeviLamina 文档的源文件目前位于 `LiteLDev/liteldev.github.io` 仓库的 `content/LeviLamina/` 目录下（Markdown 格式，含中英文），克隆该仓库即可离线查看；也可在仓库根目录执行 `npm ci && node scripts/docs-sites.mjs build LeviLamina` 在本地构建站点。LeviLamina 主仓库的 `docs/` 目录目前仅保留 `contributing`（构建与代码风格指南）。在线文档地址为 <https://levimc.org/LeviLamina/>（简体中文：<https://levimc.org/zh-Hans/LeviLamina/>）。

*适用版本：当前版本（2026-11-16 起文档统一迁移到 liteldev.github.io）*

## 想给 LeviLamina 的开发文档/教程提 PR 修改错误，文档源文件在哪里？

文档源文件位于 `LiteLDev/liteldev.github.io` 仓库的 `content/LeviLamina/` 目录，修改后向该仓库提交 PR 即可；教程位于同仓库的 `content/tutorials/` 目录。文档站点地址为 <https://levimc.org/LeviLamina/>（简体中文：<https://levimc.org/zh-Hans/LeviLamina/>）。LeviLamina 主仓库的 `docs/contributing/` 目录仅存放参与 LeviLamina 自身开发的指南（构建、代码风格）。

*适用版本：当前版本（2026-11-16 起）*

## LeviLamina 的官网/文档地址是什么？

文档：<https://levimc.org/LeviLamina/>（简体中文：<https://levimc.org/zh-Hans/LeviLamina/>）；源码仓库：<https://github.com/LiteLDev/LeviLamina>
