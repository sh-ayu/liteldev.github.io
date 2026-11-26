# LeviOptimize

## LeviLamina 服务器 TPS 低，LeviOptimize 有没有类似 timings/spark 的性能分析命令？怎么排查卡顿？

自 0.17.1 起，LeviOptimize 提供 `/lo profile` 命令（需 GameDirectors 权限，也可在控制台执行），可查看由 `full_frame_timing` 统计的最近 20 个采样的当前与平均整帧 MSPT/TPS。注意，该命令只给出整体 MSPT/TPS，不再像旧版 `timing` 命令那样按系统或插件拆分耗时。如需按插件细分耗时，可考虑 CoralFans 等第三方插件。同一命令还提供 `/lo list`、`/lo reload`、`/lo enable <feature>`、`/lo disable <feature>` 等子命令，可单独开关某项优化以对比效果。排查卡顿时，常见原因包括：大量加载新区块（例如玩家用鞘翅或船高速跑图，可将玩家传回主城，待区块卸载后即可恢复）、实体过多、高频红石、性能较差的 Addon 或卡服机器。你也可以将存档备份到本地，进入可疑区块查看，必要时用 Amulet 等工具删除或重置区块，或更换新存档进行对比，以排除插件、Addon 或存档本身的问题。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*

## LeviOptimize（0.17.1 起移植了 Endstone 的优化）能优化客户端渲染卡顿吗？

不能。LeviOptimize 仅优化服务端逻辑（如区块发布、实体广播、红石、随机刻等），不涉及客户端渲染。目前所有优化功能在源码中均标记为服务端功能（`FeatureSide::server`）；客户端的 `/clilo` 命令只能管理客户端侧功能，对这些服务端优化项会提示 `not available on this side`。

*适用版本：LeviOptimize 0.17.1 及以上*

## 玩家离开后区块仍被加载（区块泄漏），LeviLamina 服务器需要装 ChunkLeakFix 吗？

不需要。ChunkLeakFix（`dreamguxiang/ChunkLeakFix`、`ES-ChunkLeakFix`）是供 Endstone 使用的；LeviOptimize 已内置该修复，对应配置键为 `chunk_leak_fix`（默认开启），会在玩家断线时移除其地图 tracker 等残留状态。你可以用刷沙机等依赖区块卸载的机器验证修复是否生效。

*适用版本：LeviOptimize 0.18.0；LeviLamina 26.60.x*

## 用 lip 安装/更新 LeviOptimize 后启动仍提示版本不对或加载出错，或 lip 下载直接报错，怎么办？

这通常是因为 lip 未能成功下载或更新包（例如访问 GitHub 受阻）。此时可改为手动安装：前往 <https://github.com/LiteLDev/LeviOptimize/releases> 下载对应版本，服务端解压 `LeviOptimize-server-windows-x64.zip`（客户端解压 `LeviOptimize-client-windows-x64.zip`），将其中的 `LeviOptimize` 文件夹复制到 `mods/` 目录下。注意，LeviOptimize 版本必须与 LeviLamina 匹配（当前 0.18.0 需要 LeviLamina 26.60.x）。

## 生电玩家建大型猪人塔、骨粉机等机器导致 BDS TPS 很低，有什么优化方案？

可以采取以下优化措施：安装 LeviOptimize，启用 `push_entity_opt` 限制实体推挤（默认仅丢弃零向量推挤，需将 `max_push_times` 从默认的 `-1` 即不限制改为正数，才会限制每 tick 的推挤次数）；使用 RedstoneLimiter 等插件为红石降频（检测高频红石本身也消耗性能，因此直接降频比检测后破坏更合适）；限制实体数量（引导玩家少建或共用机器）；修改实体定义，关闭村民等生物的碰撞以降低开销。第三方插件与原版行为未经核实。

*未能从源码或文档中直接证实，仅供参考。*

## BDS 装了大型 Addon（如 AlylicasDungeons、Better on Bedrock）后越来越卡，换高性能 CPU 或装 LeviOptimize 能解决吗？

不能。卡顿主要源于 Addon（脚本 API）自身性能不佳，升级硬件作用有限。LeviOptimize 仅优化区块、实体广播、红石、随机刻等部分原生逻辑，Mojang 的 Addon/脚本 API 不在其优化范围内，因此安装 LeviOptimize 也无法解决，只能减少所装的 Addon。

## LeviLamina 服务器人多卡顿，如何安装和配置优化插件 LeviOptimize？

可通过 lip 安装：`lip install github.com/LiteLDev/LeviOptimize`（当前版本为 0.18.0，需搭配 LeviLamina 26.60.x）。首次启动后会生成配置文件 `mods/LeviOptimize/config/config.json`，各项优化默认均已开启。你可以在 `features` 中按需关闭或调整（如 `push_entity_opt` 的子选项），修改后执行 `/lo reload` 即可免重启生效；也可以直接用 `/lo enable <feature>` 或 `/lo disable <feature>` 开关功能并保存配置。

*适用版本：LeviOptimize 0.17.1 及以上*

## 有什么办法优化 BDS 服务器的性能？

可以安装 LiteLDev 的性能模组 LeviOptimize（GitHub：`LiteLDev/LeviOptimize`）。你可以通过 lip 安装：`lip install github.com/LiteLDev/LeviOptimize`，或从 Releases 下载 `LeviOptimize-server-windows-x64.zip` 并解压到 `mods/` 目录。该模组针对区块发送、实体广播、红石更新、定位栏、随机刻、异步 worker 调度等性能热点进行了优化。各项功能可在 `mods/LeviOptimize/config/config.json` 中单独开关，也可在运行时用 `/lo enable|disable <feature>` 切换。注意，LeviOptimize 版本需与 LeviLamina 匹配（当前 v0.18.0 对应 LeviLamina 26.60.x）。此外，BDS 主要依赖单核性能，选购服务器时应优先选择高主频、强单核的 CPU，单纯增加核心数帮助不大。

*适用版本：LeviOptimize v0.18.0；LeviLamina 26.60.x*

## 有没有能提高 LeviLamina 服务器 TPS 的插件？LeviOptimize 和 levilamina-loc 有什么区别？

可以使用 LeviOptimize（简称 LO，<https://github.com/LiteLDev/LeviOptimize>）。它是基于 LeviLamina 的性能模组，专门针对拉低 TPS 的原版性能热点进行优化，安装命令为：`lip install github.com/LiteLDev/LeviOptimize`。而 levilamina-loc（<https://github.com/LiteLDev/levilamina-loc>）是 LeviLamina 的本地化语言包，通过 lip 安装 LeviLamina 时会作为依赖自动安装，与性能优化无关，切勿混淆。

## 玩家离开后区块/实体不卸载（实体数量暴涨导致卡顿），在 26.x 版本上还能用 LeviOptimize 修复吗？

可以。LeviOptimize 仍在维护（未归档），最新的 v0.18.0 已适配 LeviLamina 26.60.x。其中的 `chunk_leak_fix` 功能（源码位于 `src/lo/features/ChunkLeakFix.cpp`）会在玩家断开连接时调用原版清理逻辑，移除其地图追踪器、装饰和脏状态，避免地图数据持续追踪并驻留离线玩家的实体（源码注释：`so the map does not keep the player's entities alive`）。自 v0.17.1 起，LeviOptimize 重写为新框架并移植了一批 Endstone 的优化，配置位于 `mods/LeviOptimize/config/config.json` 的 `features` 字段下，键名采用 snake_case 格式（如 `"chunk_leak_fix": true`），所有功能默认开启。如果遇到崩服，可用 `/lo list` 查看功能状态，再用 `/lo disable <feature>` 逐一关闭其他功能、仅保留 `chunk_leak_fix` 进行排查；修改配置后，执行 `/lo reload` 即可免重启生效。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*

## LeviLamina 服务器（LSE 没有 TPS API）怎么查看服务器 TPS？

安装 LeviOptimize（`lip install github.com/LiteLDev/LeviOptimize`）后，执行 `/lo profile`，即可输出由 `full_frame_timing` 统计的最近 20 个采样的当前与平均整帧 MSPT 及对应 TPS。该命令需要 GameDirectors（OP）权限，也可在服务端控制台直接执行。使用前请确保 `config.json` 中的 `diagnostics.full_frame_timing` 与 `commands.server_feature_manage_command` 均设为 `true`（默认开启）。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*

## LeviLamina 服务器如何直观查看/测试性能？LeviLamina 本身带优化吗？

LeviLamina 本身只是加载器与模组框架，不包含性能优化。你可以安装 LeviOptimize 来查看和测试性能：用 `/lo profile` 查看当前与平均整帧 MSPT 及 TPS；用 `/lo list` 查看各优化功能的状态；用 `/lo enable <feature>` 或 `/lo disable <feature>` 在运行时开关单项优化（更改会写回 `mods/LeviOptimize/config/config.json`）。对比开关前后的 `/lo profile` 数据，即可直观评估优化效果。注意，新版不再提供按模块（如 `LevelChunkTicking`）细分的耗时统计。

*适用版本：LeviOptimize 0.17.1 及以上；LeviLamina 26.60.x*
