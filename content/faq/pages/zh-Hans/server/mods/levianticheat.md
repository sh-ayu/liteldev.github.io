# LeviAntiCheat

## 能否不用 LeviAntiCheat（LAC）自带的处罚，而由自己的插件监听作弊事件并自定义处罚？LeviPenalizeCheat 怎么用，有 LSE 版本吗？拦截（cancel）事件会怎样？

可以。LAC 会通过 LeviLamina 的 EventBus 发布 `lac::punish::PlayerCheatEvent`（检测到作弊，包含 `mCheatType`、`mExtraData`、`mDuration`、`mType`）、`lac::punish::PlayerBanWaveEvent`（BanWave 踢出/封禁）和 `lac::punish::SusClientEvent`（可疑客户端），这些均为可取消事件。

官方提供的 <https://github.com/LiteLDev/LeviPenalizeCheat> 是一个 LeviLamina C++ mod 模板，内置了上述事件的头文件。你可以按照编写 C++ mod 的方式，使用 `ll::event::EventBus::getInstance().emplaceListener<lac::punish::PlayerCheatEvent>(...)` 订阅事件并实现自定义处罚逻辑。官方没有提供 LSE 版本；如果需要在脚本中使用，只能自行编写 C++ mod 转发事件（例如通过 RemoteCall 导出给 LSE）。

LAC 会在记录内置日志和执行处罚前发布 `PlayerCheatEvent`。如果拦截（cancel）该事件，本次作弊既不会输出日志，也不会触发内置处罚或计入 BanWave 违规值。如果只想监听事件而不干扰内置处罚，请勿在处理函数中拦截事件；如果想完全接管处罚，也可以直接在 `config.json` 中将 `punish.enable` 设为 `false`。

*适用版本：LeviAntiCheat 0.1.2 起（当前 v0.18.0 仍适用）*

## 玩家移动时频繁被拉回、TPS 下降，是 LeviAntiCheat（LAC）造成的吗？用了 LAC 后 server.properties 里的服务端权威移动（server-authoritative-movement）需要怎么设置？

拉回是 BDS 自带的服务端权威移动校验导致的，与 LAC 无关。当前版本的 LAC 已不再包含移动（非法移动）检测：旧版 LAC 的 `IllegalMovementCheck` 原本也只是启用 BDS 自带的服务端移动校验，且该功能已在 v0.15.0 中移除。因此，使用 LAC 时无需调整 `server.properties` 中的权威移动配置，保持默认即可。

有用户反馈，新版 BDS（约 1.21.70 起）强制开启了权威移动，无法再通过 `server.properties` 关闭。当服务器 TPS 过低（约低于 10）时，玩家更容易被频繁拉回。遇到此问题应先排查卡顿原因；如果确实需要关闭权威移动，只能借助专门的 mod hook。

*适用版本：LeviAntiCheat 0.15.0 及以上（当前 v0.18.0）；BDS 行为部分取决于原版版本。未能从源码或文档中直接证实，仅供参考。*

## BDS 设置 online-mode=false（关闭正版验证）后玩家数据/背包一直丢失，进服像新玩家一样，怎么解决？

关闭正版验证后，服务端可能无法按原方式读取玩家数据，从而导致“丢档”。LeviAntiCheat（LAC）自带离线模式背包保护功能（修复离线模式玩家背包丢失问题）：在 `mods/LeviAntiCheat/config/config.json` 中将 `worldSafety.offlineInventoryProtection` 设为 `true`（默认为 `false`），然后重启服务器或执行 `/lac reload` 即可。此外，你也可以自行编写插件来保存玩家数据。

*适用版本：当前 LeviAntiCheat（v0.18.0）*

## LeviAntiCheat（LAC）提示检测到使用 NoPacket 是什么意思？

这表示停止发包检测发现该玩家超过一定时间没有发送数据包。判定阈值由 `config.json` 中的 `movement.noPacketCheck.maxNoPacketTime` 控制（默认 12 秒）。如果出现误报，可以调大该值，或将 `movement.noPacketCheck.enable` 设为 `false` 关闭检测。在开发调试期间，你也可以关闭该检测，或订阅 `PlayerCheatEvent` 自行处理（详见 LeviPenalizeCheat）。

*适用版本：当前 LeviAntiCheat（v0.18.0）*

## LeviAntiCheat 的禁言命令怎么用？直接输入 mute 无法运行。

禁言功能没有独立的 `mute` 命令，而是作为 LAC 主命令 `lac` 的子命令运行：使用 `/lac mute <玩家> [时长(分钟)]` 禁言，`/lac unmute <玩家>` 解除禁言，`/lac query <玩家>` 查询玩家的封禁/禁言状态。

*适用版本：LeviAntiCheat 0.4.4 及以上*

## LeviAntiCheat 日志出现 `"xxx" 已被检测到使用: Reach, current reach distance: 5.517 cheat level: 6` 并把玩家 BanWave 踢出，是什么意思？能否关闭？记录在哪看？

Reach 表示攻击距离过远（长臂猿）。其中 `current reach distance` 是本次检测到的攻击距离；`cheat level` 是该玩家累计的超距命中次数（每次超距 +1，正常攻击 -1），超过 `detectLevel`（默认 7）时才会判定为 Reach 并输出该日志。触发原因可能是玩家开启了长臂外挂，也可能是高延迟导致的误判。

相关配置位于 `mods/LeviAntiCheat/config/config.json` 的 `combat.reachDistanceCheck` 下：

- `enable`：开关；
- `reachDistance`：非创造模式最大攻击距离，默认约 3.2；
- `reachDistanceCreative`：创造模式最大攻击距离，默认约 5.3；
- `detectLevel`：判定阈值。

每次触发 Reach 计入的违规值由 `punish.checkTypeViolationMap.Reach` 控制（默认 20）。违规值累计达到 `punish.kickVL`（默认 100）时，玩家会被 BanWave 踢出；你可以通过 `punish.enableBanWave` 关闭 BanWave。LAC 的所有检测项均可在配置中单独开关。

LAC 的专用日志文件为 `./logs/LeviAntiCheat.log`，控制台输出由 `consoleLog` 控制；旧版曾出现日志文件不记录的问题，已在 0.8.1 中修复。

*适用版本：当前 LeviAntiCheat（v0.18.0）；reachDistance 配置项自 0.4.4 起*

## LeviAntiCheat 的 GitHub 地址是什么？LLAC 和 LAC 有什么区别？

GitHub 地址为 <https://github.com/LiteLDev/LeviAntiCheat>，可通过 `lip install github.com/LiteLDev/LeviAntiCheat` 安装。LLAC（LLAntiCheat）是 LiteLoaderBDS（LL2）时代的旧版反作弊，仓库现已归档；LAC（LeviAntiCheat）则是面向 LeviLamina 的反作弊，目前仍在维护。

## LeviAntiCheat（LAC）开源吗？它的反矿透对矿透材质包/作弊客户端有效吗？

LAC 是闭源项目（公开仓库仅提供 README、配置说明、语言文件和发布包），不接受直接代码贡献。

反矿透功能参考了 PaperMC 的 Anti-Xray，由服务端在发送子区块数据时直接改写方块，因此无论客户端使用材质包还是作弊端都无法绕过。该功能在 `cheatPrevention.antiXray` 中配置，每个维度可设置以下 `engineMode`：

- `0`：隐藏模式，将被完全包裹的矿物替换为石头/深板岩等；
- `1`：假矿模式，将被隐藏的实心方块随机替换为 `obfuscateBlocks` 中的假矿；
- `2`：与 `1` 类似，但按 Y 层统一替换。

注意：暴露在空气/水中的矿物、高于 `maxHeight` 的矿物仍可能被看到；此外请保持 `worldSafety.fakeSeed` 开启，防止玩家通过种子反推矿物位置。

*适用版本：LeviAntiCheat 当前版本（反矿透在 0.16.0/0.17.2 重写，现行 engineMode 0/1/2）*

## LeviAntiCheat（LAC）能防区块边界刷物（区块物品复制）等复制物品漏洞吗？

LAC 目前没有针对区块边界刷物的修复，也不拦截傀儡刷物。它在 `bugFixes` 中提供了以下刷物漏洞修复：

- `uiItemDuplicateFix`：UI 槽位刷物；
- `fallingBlockCopyFix`：重力方块/刷沙机类，例如垂滴叶刷沙；
- `bundleContainerIdentityFix`：存储容器身份变化导致的刷物，与收纳袋相关；
- `blockActorContainerMoveFix`：活塞推动容器方块刷物。

针对区块刷物，可以先通过行为日志排查刷物玩家，或另行安装专门的修复插件。

*适用版本：LeviAntiCheat 0.17.5 及以上（当前 0.18.0）*

## 想用 LeviAntiCheat 修复利用工作台/UI 槽位无限复制物品的 bug，但不想开启 LAC 的全部功能，怎么办？

LAC 自带 UI 槽位刷物修复，对应配置项为 `bugFixes.uiItemDuplicateFix`（默认 `true`）。LAC 的各项功能均可在 `mods/LeviAntiCheat/config/config.json` 中单独关闭：保留 `bugFixes.uiItemDuplicateFix` 为 `true`，将不需要的检测项的 `enable` 或布尔值改为 `false` 即可（例如 `cheatPrevention.antiXray.enable`、`movement.timerCheck.enable`、`combat.autoClickCheck.enable` 等；如不想让玩家被踢出，也可将 `punish.enable` 设为 `false`）。建议直接修改值，不要删除配置项。修改后执行 `/lac reload` 或重启服务器生效。安装命令：`lip install github.com/LiteLDev/LeviAntiCheat`

*适用版本：LeviAntiCheat 当前版本（0.18.0，LeviLamina 26.60.\*）*

## LeviAntiCheat 的反矿透（AntiXray）功能原理是什么？

LAC 的反矿透基于混淆（参考了 PaperMC 的实现）。服务端会改写发送给客户端的区块数据，将被实心方块完全包裹、玩家原本看不到的矿石替换为假方块。由于客户端拿不到真实方块，矿透材质包也就随之失效。该功能提供三种模式：

- `engineMode` 0：将 `obfuscateBlocks` 中的矿石替换为 `mainBlock`（默认 stone/deepslate）；
- `engineMode` 1：将被隐藏的实心方块随机替换为 `obfuscateBlocks` 中的方块；
- `engineMode` 2：按 y 层统一替换。

相关配置位于 `config.json` 的 `cheatPrevention.antiXray` 下，可在 `dimensions` 中按维度设置，详见仓库的 `anti_x_ray.zh.md`。暴露在空气中的矿石不会被隐藏；此外请保持 `worldSafety.fakeSeed` 开启，否则玩家可以通过种子反推矿物位置。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat 会把 OP/管理员也判定并踢出，有 OP 豁免吗？怎么让 LAC 忽略管理员？

LAC 不区分玩家是否为 OP，对所有玩家一视同仁。这是正常设计，配置文件中也没有 OP 豁免选项。处理办法：

1. 在 `config.json` 中单独关闭导致误判的检测项（例如 `movement.timerCheck`、`noPacketCheck` 或 `combat` 下的检测）；
2. 基于官方模板 LeviPenalizeCheat（<https://github.com/LiteLDev/LeviPenalizeCheat>）自定义处罚逻辑，直接跳过管理员；也可以调整 `punish` 下的 `kickVL` 等阈值。

旧的第三方插件 Lac-IgnoreOperator 已归档（最后发布于 2025-01），不建议在新版本中使用。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat 的反矿透高度设得过高（如下界设成 256）后，玩家进下界一直卡在生成地形/加载界面；这个『高度』配置能改地狱高度吗？

不能。该配置项为 `cheatPrevention.antiXray.dimensions.<维度>.maxHeight`，仅用于指定反矿透生效的最大高度（即只混淆该 y 坐标以下的方块）。反作弊插件不会修改游戏本身，该配置与维度实际高度无关。`maxHeight` 必须在该维度的高度范围内（下界默认为 128），且必须是 16 的倍数，否则日志会报错并禁用该维度的反矿透。

据维护者说明，若混淆高度超出了维度自身高度，客户端将无法识别服务端发出的区块，从而卡在加载界面。将其调回 128 即可解决。如需修改地狱高度，请另外安装专门的插件。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviLamina 服务器怎样对玩家隐藏或伪造世界种子？还需要单独装 FakeSeed 插件吗？

不需要。LeviAntiCheat 自带假种子功能（`worldSafety.fakeSeed`，默认开启），会直接改写服务端发往客户端的种子。可通过命令安装：`lip install github.com/LiteLDev/LeviAntiCheat`。

Addon 无法做到这一点；使用资源包隐藏设置界面的种子只是不在界面上显示，客户端依然能获取真实种子。此外，也可以利用行为包的 feature rule 和自定义群系修改世界生成，这样即便玩家知道种子，也无法反推出结构位置。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat 配置文件中的 fakeSeed 项（enable、randomSeed、seed）分别是什么意思？

`fakeSeed` 位于 `config.json` 的 `worldSafety` 下，用于向客户端发送假种子。

- `enable`：是否启用假种子；
- `randomSeed`：设为 `true` 时使用随机假种子，此时 `seed` 不生效；
- `seed`：`randomSeed` 为 `false` 时发送的固定假种子数值。

默认值：

```json
"worldSafety": { "fakeSeed": { "enable": true, "randomSeed": false, "seed": 0 } }
```

启用假种子后，LAC 会自动处理客户端区块生成（ClientSideChunkGen），无需手动关闭。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviLamina 服务器有什么反作弊插件可用？旧的 LLAC 有 LeviLamina 版本吗？

有，即 LiteLDev 官方推出的 LeviAntiCheat（LAC），仓库地址为 <https://github.com/LiteLDev/LeviAntiCheat>。可通过 lip 安装：`lip install github.com/LiteLDev/LeviAntiCheat`，也可直接从 GitHub Releases 下载。请注意选择与当前 LeviLamina 版本匹配的 LAC 版本（例如 LAC 0.18.0 依赖 LeviLamina 26.60.*）。

*适用版本：LeviLamina 当前版本*

## LeviLamina 服务器上能否直接使用为 LiteLoaderBDS（LL2）编写的反作弊 dll 插件？

不能，LiteLoaderBDS（LL2）的原生插件无法在 LeviLamina 上运行。在 LeviLamina 下请使用官方反作弊插件 LeviAntiCheat（LAC）：<https://github.com/LiteLDev/LeviAntiCheat>。可通过 `lip install github.com/LiteLDev/LeviAntiCheat` 安装，或前往 Releases 页面（<https://github.com/LiteLDev/LeviAntiCheat/releases>）下载。注意 LAC 版本必须与 LeviLamina 版本对应（如 LAC v0.18.0 依赖 LeviLamina 26.60.*）。

*适用版本：当前所有 LeviLamina 版本*

## LeviAntiCheat（LAC）为什么会被 Windows Defender / Windows 安全中心 / 360 识别为病毒或木马并删除？怎么办？

这是误报。LAC 是闭源插件，据维护者说明，其 dll 文件经过了加壳与代码保护（VMProtect）且无数字签名，因此容易被杀毒软件误判为木马。请认准官方 GitHub Releases 或 lip 渠道下载，将服务器目录（或 `mods/LeviAntiCheat` 目录）添加到 Windows Defender 等杀毒软件的排除项或信任列表中，然后重新解压或安装即可。

*适用版本：当前所有 LeviAntiCheat 版本（Windows）。未能从源码或文档中直接证实，仅供参考。*

## 开启 LeviAntiCheat 反矿透后，玩家反馈挖到的钻石等矿石变成了石头，这是 bug 吗？

不是 bug。在 `engineMode: 1` / `2`（默认为 1）下，反矿透会把被实心方块完全包围的实心方块替换成 `obfuscateBlocks` 中的假矿发送给客户端，以此迷惑矿透玩家；当方块发生变化（如开始挖掘、爆炸等）时，服务端会重新发送周围的真实方块数据，假矿便会恢复显示为原本的石头。

如果玩家贴近时就能看到矿石变化，可以调大对应维度的 `cheatPrevention.antiXray.dimensions.<维度>.updateRadius`（默认为 2），但该值越大，客户端能透视的范围也越大。

*适用版本：LeviAntiCheat 当前版本（v0.17.2 重写反矿透后的配置结构）*

## LeviAntiCheat 的反矿透（anti x-ray）开了感觉没效果，或者导致回弹，参数怎么调？

请参考官方文档调整参数：<https://github.com/LiteLDev/LeviAntiCheat/blob/release/anti_x_ray.zh.md>。该文档详细说明了 `cheatPrevention.antiXray` 下各项配置（`enable`、`maxThreads`、`autoSolidCheck`、`dimensions.<维度>.engineMode`/`maxHeight`/`updateRadius`/`obfuscateBlocks`/`mainBlock` 等）的含义，提供了 `engineMode` 0/1/2 在主世界与下界的推荐配置，并附有“仍能看到矿物”“y=0 以下不起作用”等常见问题的排查方法。

*适用版本：LeviAntiCheat 当前版本*

## 有没有能检测 32k 等违禁物品（非法附魔、基岩、传送门方块、刷怪笼、刷怪蛋、特殊值方块等）的插件？

可以使用 LiteLDev 官方反作弊插件 LeviAntiCheat（LAC）。在 `mods/LeviAntiCheat/config/config.json` 的 `inventoryManagement.banItem.blacklist` 中填入要禁用的物品命名空间 ID（如 `"minecraft:bedrock"`）即可。针对超等级附魔，可开启 `inventoryManagement.enchantCheck`（默认关闭）并在 `maxEnchantLevel` 中设置各项附魔的最大等级；此外还提供 `anvilEnchantLimits`（铁砧附魔检查）、`invalidItemDetection`、`invalidStackDetection`、`antiInvalidNbtItem` 等检测功能。

*适用版本：LeviAntiCheat 当前版本（配置 version 21）*

## LeviAntiCheat 的违禁/非法物品检测为什么没报告玩家身上已有的末地传送门框架？如何禁用某些物品？

安装 LAC 后，玩家将无法再刷出这类物品，相关行为会被阻止并在控制台输出提示；未被报告的通常是安装插件前就已存在的残留物品。

如需禁用特定物品，请在 `mods/LeviAntiCheat/config/config.json` 的 `inventoryManagement.banItem.blacklist`（字符串数组）中填入物品的命名空间 ID（例如 `"blacklist": ["minecraft:bedrock", "minecraft:end_portal_frame"]`），并确保 `banItem.enable` 为 `true`。命中后会触发 BanItem 检测，并按 `punish.checkTypeViolationMap.BanItem` 累计违规值。LAC 在设计上不负责清除物品；如需自动清除，可参考 LeviPenalizeCheat 模板，监听 `lac::punish::PlayerCheatEvent` 事件自行处理。

*适用版本：LeviAntiCheat 当前版本（配置 version 21）*

## LeviAntiCheat（LAC）配置中的 banItem（禁用物品列表）支持正则表达式吗？

不支持。`inventoryManagement.banItem.blacklist` 只能填写具体的物品命名空间 ID（如 `"minecraft:bedrock"`），不支持正则表达式或通配符。

*适用版本：LeviAntiCheat 当前版本。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 的附魔检测误踢人（如脱装备时触发铁砧附魔检测）或关不掉，怎么办？

LAC 包含两项独立的附魔检测：`inventoryManagement.enchantCheck`（附魔等级检查，默认关闭）和 `inventoryManagement.anvilEnchantLimits`（铁砧附魔检查，默认开启）。仅关闭 `enchantCheck.enable` 是不够的，还需设置 `"anvilEnchantLimits": false` 才能彻底关闭附魔相关检测；修改后请执行 `/lac reload` 或重启服务器。此外，也可以只调低 `punish.checkTypeViolationMap` 中 `InvalidAnvilEnchant` / `InvalidEnchantLevel` 的违规值，避免玩家被踢出。早期版本（如 0.4.0-rc6）在脱装备时触发误判的问题已在 rc.6~rc.8 中修复，请更新至最新版。

*适用版本：LeviAntiCheat 当前版本（配置 version 21）*

## 下载了 LeviAntiCheat（LAC，含反矿透功能）放进服务器后不加载、没有任何提示，也找不到配置文件，应该怎么装？

推荐直接用 lip 安装：`lip install github.com/LiteLDev/LeviAntiCheat`。lip 会自动将文件放到正确位置，并匹配对应的 LeviLamina 版本。

如果手动安装，请从 GitHub Release 下载 `LeviAntiCheat-windows-x64.zip`，将压缩包内的 `LeviAntiCheat/` 整个文件夹（含 `manifest.json` 和 dll）解压到服务端的 `mods/` 目录下（即 `mods/LeviAntiCheat/`），注意不要只放 dll，也不要多套一层文件夹。如果目录下只有 manifest 等描述文件而没有配置文件，说明插件未成功加载；插件成功加载后会自动生成 `mods/LeviAntiCheat/config/config.json`。

此外，请确认下载的 LAC 版本与当前 LeviLamina 版本匹配（例如 LAC 0.18.0 依赖 LeviLamina 26.60.*）。适配 LiteLoaderBDS 或旧版 LL 的旧版本（如 0.2.x）无法加载。反矿透功能可在配置文件的 `cheatPrevention.antiXray` 中调整。

*适用版本：LeviLamina 当前版本（LAC 0.18.0 / LeviLamina 26.60.\*）*

## 安装了 LeviAntiCheat 后找不到它的配置文件在哪？

配置文件要在开服一次且插件成功加载后才会自动生成，路径为 `mods/LeviAntiCheat/config/config.json`。修改后，重启服务器或执行 `/lac reload` 即可重载配置。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 在 docker 容器里用 lip 卸载 LeviAntiCheat 失败，怎么卸载？

`lip uninstall` 是命令行操作，不会因为服务器正在运行而直接拒绝执行（lip 图形界面则会在服务器运行时直接拒绝卸载）。但如果待删除的文件正被运行中的服务器占用（如 Windows 下被 BDS 加载的 `LeviAntiCheat.dll`），卸载就会失败并整体回滚。此时需要先停服，再执行 `lip uninstall github.com/LiteLDev/LeviAntiCheat`。

在当前的官方 docker 镜像中，容器主进程就是 `lip run`，停服即会导致容器退出，因此无法“停服后再进容器”。正确的做法是在容器运行时执行：

```shell
docker exec -it <容器名> lip uninstall github.com/LiteLDev/LeviAntiCheat
```

这与官方教程中用 `docker exec ... lip install` 安装模组的方式相同。执行完毕后，运行 `docker stop` 并重新启动容器，使改动生效。

在 Wine 镜像中，lip 原生运行于 Linux，一般不会遇到文件占用问题；如果在 Windows 容器镜像中因文件占用而卸载失败，可以先停止容器，然后挂载同一数据卷临时启动一个新容器，将入口改为 lip 来执行卸载。另外，如果插件是通过 `PACKAGES` 变量安装的，该变量仅在首次启动时生效，直接删除变量并不会卸载已安装的包。

*适用版本：lip 当前版本（v0.41.x），docker-levilamina-server 当前镜像（latest-wine / latest-windows）*

## LeviAntiCheat 一开始正常（或用 lip 装好后），后来启动时加载报错，发现 LeviAntiCheat.dll 不见了，是什么原因？

这通常不是 lip 或插件本身的问题，而是 Windows Defender（Windows 安全中心）将 `LeviAntiCheat.dll` 误判为威胁并隔离或删除了（LAC 闭源且做过保护处理，容易触发误报）。请前往 Windows 安全中心的“保护历史记录”恢复该文件，将服务器目录添加到排除项，然后重新安装插件（例如执行 `lip install github.com/LiteLDev/LeviAntiCheat`）。

*适用版本：Windows 上运行的 LeviLamina 服务器，当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 反矿透（`antiXray`）的 `engineMode` 应该填什么值？各模式有什么区别、哪个最省性能、会修改存档吗？

当前版本的取值为 `0`、`1`、`2`（不再是旧版的 `1`、`2`、`3`；旧文档或图片中 PaperMC 的模式 1/2/3 分别对应这里的 0/1/2），需按维度在 `cheatPrevention.antiXray.dimensions.<维度>.engineMode` 中配置：

- `engineMode: 0`：将 `obfuscateBlocks` 中的矿物替换为假方块（`mainBlock`，默认为 `minecraft:stone`；y\<0 时使用 `mainBlockMinus`，默认为 `minecraft:deepslate`）。仅隐藏被实心方块完全包裹的矿物，暴露在空气或水中的矿物不会隐藏。该模式计算开销最低。
- `engineMode: 1`：将被包裹的实心方块随机替换为 `obfuscateBlocks` 中的方块。防透视效果更强，但数据量更大。
- `engineMode: 2`：与 1 类似，但同一 y 层会替换为同一种假方块，使子区块更规整，更利于数据包压缩。

区块改写在工作线程中进行（由 `maxThreads` 控制，0 表示使用 CPU 线程数），对主线程影响较小；反矿透仅改写发往客户端的数据包，不会修改存档。系统只会混淆 `maxHeight`（须为 16 的倍数）以下的方块，当方块发生变化时，会按 `updateRadius` 重新发送真实方块。建议同时保持 `worldSafety.fakeSeed` 开启，以防种子被反推。此外，也可以关闭 LAC 的反矿透，改用独立的 GlacieTeam/AntiXray：二者的配置项基本对应（AntiXray 使用下划线命名，LAC 使用小驼峰命名），但需自行确认其版本是否支持当前的 LeviLamina。

*适用版本：LeviAntiCheat 0.16.0 及以上（当前 0.18.0）*

## 给 LeviLamina 服务器装上 LeviAntiCheat（LAC）后服务器崩溃（开服即崩或运行中崩溃），原因是什么？有解决办法吗？

首先请确认 LAC 与 LeviLamina 的版本是否匹配。每个版本的 LAC 仅适配特定版本的 LeviLamina（例如曾有用户将适配 LeviLamina 1.2 的 LAC 安装到 1.1 上，导致开服即崩）。请下载与当前 LeviLamina 匹配的 LAC 版本，或将 LeviLamina 升级到 LAC 所需的版本；推荐使用 `lip install github.com/LiteLDev/LeviAntiCheat` 安装，lip 会根据依赖关系自动检查版本。

如果版本匹配但在运行中仍然崩溃，可以在 `mods/LeviAntiCheat/config/config.json` 中将 `cheatPrevention.antiXray.enable` 设为 `false` 进行排查（反矿透是 LAC 历来引发崩服的常见原因），并向官方提交 issue。如果不需要反矿透等功能，也可以不安装 LAC，LeviLamina 自身的漏洞修复（`vulnerabilityFixes`）并不依赖 LAC。

*适用版本：当前所有版本（最新 LAC v0.18.0 对应 LeviLamina 26.60.\*）*

## 服务器安装 LeviAntiCheat（LAC）后主世界出现方块显示异常，如何解决？

这通常是 LAC 的反矿透（anti-xray）功能导致的。该功能会混淆被实心方块完全包围的方块；默认 `engineMode` 为 1，会将这些隐藏的实心方块随机替换为 `obfuscateBlocks` 中的矿物后再发往客户端。在 `mods/LeviAntiCheat/config/config.json` 中，将 `cheatPrevention.antiXray.dimensions.overworld.enable` 设为 `false` 即可关闭主世界的反矿透（或将 `cheatPrevention.antiXray.enable` 设为 `false` 彻底关闭），随后执行 `/lac reload` 或重启服务器。如果是附加包方块显示异常，也可以检查 `treatAddonBlocksAsNonSolid`、`nonSolidBlocks` 等配置项。

*适用版本：当前所有版本（配置键以 LAC 0.17.x/0.18.0 为准）*

## 安装 LeviAntiCheat（LAC）后启动报版本相关错误、无法加载，怎么办？

LAC 是针对特定 LeviLamina 版本编译的，二者版本必须严格匹配。请安装与当前 LeviLamina 版本对应的 LAC，或将两者一同升级到对应版本。推荐使用 lip 安装，以便自动解析依赖：`lip install github.com/LiteLDev/LeviAntiCheat`。例如，当前最新的 LAC 0.18.0 要求 LeviLamina 26.60.*；各 LAC 版本对应的 LL 版本可查阅 CHANGELOG。

*适用版本：当前所有版本（LAC 0.18.0 对应 LeviLamina 26.60.\*）*

## LeviAntiCheat（LAC）能和 Fishing 反作弊（FAC）一起装吗？

当时维护者表示二者不兼容：FAC 会破坏 LeviLamina 的一个 API，因此只能二选一。

*适用版本：2024 年 4 月 LeviLamina 0.x 时期；当前版本未知。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat（LAC）惩罚配置中的封禁时长（`duration`）字段是什么意思？

该字段表示惩罚（封禁）的持续时间，而非作弊次数。在当前配置中对应 `punish.banDuration`，单位为秒，`0` 表示永久封禁；是否触发封禁由 `punish.banVL` 决定（`-1` 表示不封禁），`kickVL` 则为踢出玩家的违规值。此外，手动命令 `/lac ban <玩家> [原因] [时长(分钟)]` 中的时长单位为分钟。

*适用版本：当前版本（LeviAntiCheat 0.18.0，配置版本 21）*

## LeviAntiCheat 报「已被检测到使用: InvalidFilterString, string size: ...」并通过 BanWave 把玩家踢出，但玩家只是用命名牌加原版 `§` 颜色符号改了物品名，怎么回事？

这触发了 LAC 的物品名称长度检查（违规类型为 `InvalidFilterString`），即物品名称的字符串长度超过了配置上限。日志中的 `string size` 对应名称的 UTF-8 字节数；由于 `§` 格式代码和中文字符均占用多个字节，看似不长的名字也可能超限。可在 `mods/LeviAntiCheat/config/config.json` 中调大 `playerInteractions.itemNameLengthCheck.maxStringLength`（默认为 90），或将 `itemNameLengthCheck.enable` 设为 `false` 关闭该项检测；也可以调低 `punish.checkTypeViolationMap.InvalidFilterString`（默认为 50）的违规值（封禁潮由 `punish.enableBanWave` 控制）。修改后执行 `/lac reload` 即可。

*适用版本：当前版本（LeviAntiCheat 0.18.0）*

## 修改过 LeviAntiCheat 的 `config.json` 后日志报错（如与 AntiXray 方块相关的配置错误），怎么处理？

多半是改配置时删掉了必填项、写错了方块名或破坏了 JSON 格式。建议备份并删除 `mods/LeviAntiCheat/config/config.json`，重启服务器让它重新生成默认配置，再按需修改。如果写错了 AntiXray 的维度名、`engineMode` 或 `maxHeight`（须为 16 的倍数），日志就会报错，且该维度不会启用反矿透。

*适用版本：当前版本（配置路径 `mods/LeviAntiCheat/config/config.json`）。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 的 Timer（发包速率）检测误判正常玩家，站着不动也被踢，日志显示 `rate` 在 25~30 左右，怎么办？

正常客户端发送移动输入包的速率与 tick 一致，每秒约 20 个（在 18~22 之间波动），而 LAC 的默认阈值为 24。网络抖动时可能触发误判，可在配置中将 `movement.timerCheck.maxPacketSpeed` 调高到 30 左右（也可调整 `detectLevel`，默认为 15，或调低 `punish.checkTypeViolationMap.Timer` 的违规值），修改后执行 `/lac reload`。

*适用版本：当前版本（LeviAntiCheat 0.18.0）*

## LeviAntiCheat 的反矿透支持 MoreDimensions 创建的自定义维度吗？

反矿透按维度配置，在 `cheatPrevention.antiXray.dimensions` 下以维度名称为键（默认只有 `overworld` 和 `nether`）。维护者表示，自定义维度需要自行在该处添加对应维度名的配置。若维度名无法识别，日志会报错且该维度不启用反矿透，可根据日志检查配置是否正确。

*适用版本：当前版本（AntiXray 已在 0.16.0/0.17.2 重写）。未能从源码或文档中直接证实，仅供参考。*

## LeviAntiCheat 的配置文件有中文说明/教程吗？

有。仓库的中文 README（<https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md>）提供了带中文注释的完整默认配置（配置文件位于 `mods/LeviAntiCheat/config/config.json`）；反矿透子模块另有说明文档 `anti_x_ray.zh.md`。注意：配置文件中的 `"version"` 字段是配置版本号（当前为 21），请勿手动修改。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## LeviAntiCheat（LAC）经常误封/误踢正常玩家，怎么降低误判或关闭某些检测（比如只保留防矿透）？

编辑 `mods/LeviAntiCheat/config/config.json`（修改后执行 `/lac reload` 或重启服务器），将容易误判的检测项的 `enable` 设为 `false`，或放宽对应阈值：

- 变速齿轮检测（常见误封来源）：关闭 `movement.timerCheck.enable`，或调大 `maxPacketSpeed`（每秒最大移动输入包数，默认 24）；
- 停止发包检测：关闭 `movement.noPacketCheck.enable`，或调大 `maxNoPacketTime`；
- 连点器与攻击距离：`combat.autoClickCheck`、`combat.reachDistanceCheck`；
- 物品相关检测：`inventoryManagement` 下的 `invalidItemDetection`、`invalidStackDetection`、`antiInvalidNbtItem`、`anvilEnchantLimits`、`banItem` 等；
- 惩罚设置：`punish.enable`（总开关）、`punish.enableBanWave`（封禁潮）、`kickVL` / `banVL`（踢出/封禁违规值），以及 `punish.checkTypeViolationMap` 中各项检测单次累加的违规值（调低某项的违规值可减少误踢）。

如果只想保留防矿透，保持 `cheatPrevention.antiXray.enable=true` 并关闭其他检测即可。各配置项的详细说明见 <https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md>。

注意：LAC 自 0.15.0 起已移除 `IllegalMovementCheck`。走路被拉回等移动校验来自 BDS 原版的服务端权威移动，无法再通过 LAC 调整。

*适用版本：LeviAntiCheat 0.15.0 及以上（当前 0.18.0）*

## 装了 LeviAntiCheat（LAC）后，玩家在平地跳跃/跑动也会摔伤掉血（TPS、延迟都正常），怎么解决？

这是 LAC 的“移除客户端对玩家动作的权威”功能引起的。在 `mods/LeviAntiCheat/config/config.json` 中将 `movement.disablePlayerActionsAuthority` 设为 `false` 即可（0.17.4 起默认即为 `false`；0.17.3 中该项名为 `PlayerActionsAuthority` 且默认开启，建议直接升级到最新版）。

*适用版本：LeviAntiCheat 0.17.3 及以上（当前 0.18.0 键名为 `disablePlayerActionsAuthority`）*

## 装了 LeviAntiCheat（LAC）后，服务器后台一直踢人，甚至所有玩家都被踢、进不去服务器，怎么解决？

这通常是 LAC 的“停止发包检测”（NoPacket）误判所致。该检测用于检查玩家是否长时间停止向服务器发包，关闭它并不会让作弊者“无敌”。可在 `mods/LeviAntiCheat/config/config.json` 中将 `movement.noPacketCheck.enable` 设为 `false`，或调大 `movement.noPacketCheck.maxNoPacketTime`（默认 12 秒）。此外，0.4.5 已修复服务器主线程卡顿引发的 NoPacket 误判问题，请先确认已升级到最新版 LAC。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 某些通过发包修改玩家名字显示的插件和 LeviAntiCheat 的假名检测冲突，怎么处理？

在 `mods/LeviAntiCheat/config/config.json` 中将 `cheatPrevention.antiFakeName` 设为 `false` 即可（当前版本默认即为 `false`）。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 装了 LeviAntiCheat 后，玩家连续输入 `shop` 等命令会被踢出，怎么办？

这触发了防命令刷屏检测（`CommandSpam`，用于防范 Horion 等一秒发送大量命令的外挂）。可在 `mods/LeviAntiCheat/config/config.json` 中调大 `playerInteractions.antiSpam.maxCmdRate`（每秒最大命令数，默认 2），或调低 `punish.checkTypeViolationMap.CommandSpam`（每次触发累加的违规值，默认 50）。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*

## 装了 LeviAntiCheat（LAC）后仍有人刷屏拦不住怎么办？

调整 `mods/LeviAntiCheat/config/config.json` 中 `playerInteractions.antiSpam` 的设置：确认 `enable` 为 `true`，调小 `maxChatRate`（`chatRateDuration` 秒内允许的最大聊天条数，默认为 10 秒 5 条）、`maxCmdRate`（每秒最大命令数）和 `maxChatLength`（最大聊天长度），并可开启 `disableSelector` 以禁止在命令中使用目标选择器；同时可调高 `punish.checkTypeViolationMap` 中 `Spam`、`CommandSpam` 和 `MessageTooLong` 的违规值，让刷屏者更快被踢出。

*适用版本：LeviAntiCheat 当前版本（0.18.0）*
