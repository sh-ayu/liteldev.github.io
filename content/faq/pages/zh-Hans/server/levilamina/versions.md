# LeviLamina 的版本与兼容性

## Mojang 不再公开 BDS 的 PDB 后，LeviLamina 还能适配新版本吗？LeviLamina 提供的 bedrock runtime data（magic blob）是什么？

能。自 2024 年 6 月 BDS 1.21 预览版起，公开发布的 BDS 不再附带 PDB，当时一度以为 LeviLamina 只能停留在 1.20.81/1.21.0。后来经 LiteLDev 与 Mojang 协商，Mojang 改为将 PDB 等调试信息私下提供给 LiteLDev（期间跳过了 1.21.10，之后在内部从 1.21.20 继续适配；0.13.x 之后的下一个正式发布版本是 2025 年 1 月的 1.0.0-rc.1，适配 BDS 1.21.50）。

LiteLDev 将这些调试信息封装成 bedrock runtime data（俗称 magic blob，本质是经过哈希处理的符号数据）公开分发，用以替代原始 PDB。加载和开发 mod 都依赖它，但它不会暴露原始符号。对 LeviLamina 而言，PDB 的核心作用是自动生成符号表和头文件，因此每次新版本的适配时间取决于 Mojang 何时将调试信息交给团队。只安装 addon、运行原版 BDS 的服主不受影响。

目前 LeviLamina 持续跟进新版本（如 v26.60.8 对应 Minecraft 26.60.6 服务端），构建时会通过 xmake 包 `bedrockdata` 自动获取对应版本的 bedrock-runtime-data。

*适用版本：LeviLamina 1.0.0（BDS 1.21.50）起的所有版本；0.13.x 对应带公开 PDB 的 BDS 1.21.0x/1.21.3*

## LeviLamina 26.60 起原生 mod 目录从 `plugins` 改成 `mods` 了吗？LSE 脚本插件放哪里，现有 LSE 插件调用原生 mod 的接口是否需要改路径？

是的。从 26.60 起，服务端原生 mod 改放在 `mods` 目录下（与客户端统一），LeviLamina 自身的配置也位于 `mods/LeviLamina/` 下。只要 mod 通过 LL 接口获取路径、没有硬编码 `plugins`，即可无痛迁移。

LegacyScriptEngine 自 0.23.0 起，会在启动时把服务器目录下的 `plugins` 创建为指向 `mods` 的目录链接（junction），使 `plugins` 与 `mods` 指向同一个文件夹。但这要求服务器目录下原本没有 `plugins` 文件夹；如果已存在普通的 `plugins` 文件夹，LSE 不会建立链接，而是报错 `Failed to create a link at …: a file or directory with the same name already exists`。此时需先将其中的内容迁移到 `mods/`，再删除旧的 `plugins` 文件夹。

LSE 插件只需按“每个插件一个文件夹 + `manifest.json`”的结构放入 `mods/` 即可，写死 `plugins/` 路径的旧脚本仍能正常工作。对于直接放入的单个旧式脚本，LSE 会在下次启动时自动为其生成文件夹和清单，再重启一次即可加载。LSE 插件通过 `ll.import` 调用其他插件导出的接口则完全不需要修改。

*适用版本：LeviLamina 26.60 及以上；LegacyScriptEngine 0.23.0 及以上*

## GMLIB 等前置库（及依赖它的插件）加载失败/报错，提示不支持的 BDS 版本，或依赖诊断显示缺少 `LeviLamina.dll` 中的符号，怎么办？

这是因为前置库版本与当前的 LeviLamina/BDS 版本不匹配。原生 mod 是针对特定 LeviLamina 版本编译的，更换 LL 版本后，它调用的导出函数可能已不复存在。如果日志中“依赖诊断”（Dependency diagnostic）的 `missing content:` 小节下出现 `|- LeviLamina.dll`，并在下方的 `|---- ` 行列出缺失的函数符号，就属于这种情况（旧版输出为 `missing procedure:` / 缺少程序符号）。

解决方法：

1. 推荐用 lip 安装（例如 `lip install github.com/GroupMountain/GMLIB`）。不指定版本时，lip 会拉取该仓库最高的版本标签；`lip install` 不会改动已安装的游戏和加载器，若该版本要求其他 LL 版本，命令会失败并提示所需的游戏/加载器版本及 `lip setup` 用法。此时可用 `lip install github.com/GroupMountain/GMLIB@<版本>` 指定与当前 LL 匹配的版本，或先用 `lip setup` 切换到该 mod 支持的游戏/加载器版本。
2. 手动安装时，请前往 GMLIB 的 GitHub Releases（<https://github.com/GroupMountain/GMLIB/releases>）下载与当前 LL 版本对应的版本；论坛转载往往更新不及时。
3. 依赖 GMLIB 的插件也要同步更换为对应版本。不要随意降级 LL，应优先将前置库升级到匹配当前 LL 的版本，或者整体升级 LL/BDS 后再使用新版前置库。

“运行在不支持的 BDS 版本”警告意味着部分接口可能失效；若要避免崩溃或假死，请使用受支持的版本。

## 启动 LeviLamina 服务端时报 FATAL `Couldn't find: MolangVariable::~MolangVariable(void)` / `Couldn't find: MolangDataDrivenGeometry::~MolangDataDrivenGeometry(void)` 并跟着 `In module: BedrockServerClientInterface`，模组无法加载，怎么办？

`Couldn't find: <符号> / In module: <模组名>` 表示该模组（此处为 BedrockServerClientInterface，简称 BSCI，是假人/客户端接口相关模组常用的前置）引用的函数符号在当前 BDS 中不存在，说明模组版本与当前 LeviLamina/BDS 版本不匹配（通常是因为模组版本过旧）。

将 BSCI 更新到与当前 LeviLamina/BDS 对应的版本即可。BSCI 现在的版本号跟随游戏版本（如 v26.60.0 对应 BDS 1.26.60），可前往 <https://github.com/OEOTYAN/BedrockServerClientInterface/releases> 下载对应版本，或通过 lip 安装/升级。反之，如果必须使用某个旧版模组，就必须搭配它编译时所对应的 BDS/LeviLamina 版本。

## 客户端版本与 LeviLamina 服务器版本不一致（提示“客户端过期”或“主机版本过低”），或 LeviLamina 还没适配新版本时，怎么让不同版本的客户端进入同一个服务器（跨版本/多版本互通）？

LeviLamina 的每个版本只对应一个 BDS 版本，本身不提供跨版本功能；客户端的协议号必须与服务端一致（协议号相同的小版本可以直接互通，例如 1.21.60 与 1.21.62）。如需跨版本互通，可以使用第三方协议转换方案：

1. Glacie（GlacieTeam 开发，同时支持 LeviLamina 和 Endstone，官方推荐搭配 LeviLamina）：依赖 ProtocolLib，两者均需安装。可通过 `lip install github.com/GlacieTeam/Glacie` 安装，或从 <https://github.com/GlacieTeam/Glacie/releases> 下载 `Glacie-levilamina-windows-x86_64.zip`；ProtocolLib 从 <https://github.com/GlacieTeam/ProtocolLib/releases> 获取。GitHub Release 是唯一的官方下载源，MineBBS 等渠道搬运的版本可能过旧。Glacie 版本必须与服务端的 BDS/LeviLamina 版本严格对应（如 v3.10.3 对应 BDS 1.26.60.x + LeviLamina 26.60.x），用错版本会导致崩溃；支持的客户端版本范围见 ProtocolLib README 中的协议表。
2. Endweave（EndstoneMC/endweave，Endstone 插件）：在 LeviLamina 上需先通过 LeviStone 运行 Endstone 插件（`pip install levistone --target mods/EndstoneRuntime`），再安装 Endweave。它可以在其支持列表内的协议版本之间互相转换（目前为 26.40~26.60）。
3. 也可以将客户端降级到服务器对应的版本，或等待 LeviLamina 发布新版本后再升级服务端。

## LeviLamina 有没有对应 BDS 26.0 的版本？该如何选择 BDS 版本？

没有。LeviLamina 从 1.9.x（BDS 1.21.132）直接跳到了 26.10.0（适配 26.10），并未适配 26.0。LL 只支持特定的 BDS 版本，并非每个 BDS 版本都会适配（适配需要 Mojang 提供数据，进度取决于 Mojang）。

正确的做法是先确定要使用的 LeviLamina 版本，再安装与之对应的 BDS 版本。使用 lip 安装 LeviLamina 时，会通过依赖 `github.com/LiteLDev/bds` 自动安装匹配的 BDS（如当前 LeviLamina 26.60.x 对应 BDS 1.26.60）。不建议盲目追新。

## 为什么 LeviLamina 不能在 BDS 发布当天就适配新版本？多久适配一次？

LeviLamina 的适配进度取决于 Mojang：Mojang 需要先向 LL 团队提供对应版本的符号数据（PDB 等，现已不再公开），团队才能据此生成 bedrock-runtime-data 和 PreLoader 所需的数据，进而适配 LeviLamina 本体。在拿到数据之前无法开始适配，催更也没有用。

此外，自 1.21.60 起 Mojang 提高了编译器的内联等级，导致大量函数被内联，增加了适配的难度和耗时（LeviLamina 已在 26.32.0、26.40.1 等版本中陆续补充实现或恢复了部分被内联的函数）。

*适用版本：LeviLamina 1.0 及以后。未能从源码或文档中直接证实，仅供参考。*

## 怎么查 LeviLamina 与 BDS（及 LSE 等）的版本对应关系？想在某个非最新的 BDS 版本上装 LeviLamina，该选哪个版本、怎么装？

LeviLamina 的每个版本系列只适配一个特定的 BDS 版本。可以通过以下途径查询版本对应关系：

1. 官方文档“支持的版本”页：<https://levimc.org/zh-Hans/LeviLamina/versions/>（例如 26.60.x 对应服务端 1.26.60.6 / 客户端 1.26.60.5，26.51.x 对应 1.26.51.1，1.9.x 对应 1.21.132.3，1.6.x 对应 1.21.111.1，1.5.x 对应 1.21.102.1，0.12.x 对应 1.20.8x）。
2. LeviLamina 的 CHANGELOG 或 GitHub Release 说明中的 `Adapted to Minecraft ...` 条目。
3. 包文件中的依赖声明：从 v26.60.8 起，包文件已由 `tooth.json` 改为 `lip.toml`，其中 `[variants."".deps]` 下的 `"github.com/LiteLDev/bds" = "1.26.60"` 即为所需的 BDS 版本；LSE 等模组的 `lip.toml` 中也写明了所依赖的 LeviLamina 版本范围（如 `"github.com/LiteLDev/LeviLamina" = "26.60.*"`）。

从 26.x 起，LeviLamina 版本号的前两段与 BDS 版本对应（如 26.60.x 对应 1.26.60）。注意，LiteLDev/bds 仓库中的 `versions.txt` 只是 BDS 完整版本号列表，并非 LL 版本对应表。

推荐使用 lip 安装，它会一并处理 BDS、PreLoader、PeEditor、bedrock-runtime-data 等依赖项的版本：

- `lip install github.com/LiteLDev/bds@1.26.60 LeviLamina`：安装指定版本的 BDS，并自动选择适配该版本的最新 LeviLamina；
- `lip install LeviLamina@<版本号>`：安装指定版本的 LL 及其支持的最新 BDS；
- 若已有服务器，需要更换游戏或 LL 版本，可执行 `lip setup --game <版本> --loader levilamina@<版本>`。

模组也需同步更换为适配目标 LL 版本的旧版本。LeviLamina 最低版本为 0.1.x（对应 BDS 1.20.4x），更早的 BDS 版本只能使用已归档的 LiteLoaderBDS。

## LeviLamina 适配的 BDS 版本号最后一位/小版本（如 1.26.10.x 的 x，或 1.21.0 与 1.21.2）也必须严格对应吗？

必须严格对应。LeviLamina 的每个版本系列只支持一个完整的 BDS 版本号（精确到最后一位）。例如，26.60.x 只支持服务端 1.26.60.6（客户端 1.26.60.5），26.10.x 只支持 1.26.10.4；即使是随后发布的 1.26.61、1.26.62 等小版本 BDS 也不能直接使用。版本不一致时，LL 无法正常工作，常见现象是加载后 BDS 直接退出或崩溃。

请严格按照 LL 版本要求使用对应的 BDS。最省事的方法是用 lip 安装（运行 `lip install github.com/LiteLDev/bds@<版本> LeviLamina` 或 `lip setup`），它会自动选配匹配的版本。

## 新版 LeviLamina（及 LSE）能装在旧版本 BDS 上吗？旧版 BDS 该用哪个 LL、去哪下载？

不能，LeviLamina 不向下或跨 BDS 版本兼容。每个 LL 版本只支持其发布说明或版本表中列出的那个 BDS 版本（例如 LL 1.7.7 对应 BDS 1.21.124，1.9.x 对应 1.21.132.3，适配 1.21.60 的 LL 不能用于 1.21.50）。LSE 等模组同样依赖特定的 LL 版本，因此若想获取新版 LL/LSE 的问题修复，就必须升级 BDS。若服务端使用旧版 BDS，则需回退到支持该 BDS 的旧版 LeviLamina（可查阅 <https://levimc.org/zh-Hans/LeviLamina/versions/>）。部分 BDS 版本（如 1.21.30）没有对应的 LL 版本，只能更换到有 LL 支持的 BDS 版本。

安装旧版 BDS 无需手动修改下载链接，可直接用 lip 安装：运行 `lip install github.com/LiteLDev/bds@<BDS版本> LeviLamina` 会安装指定 BDS 并自动选择适配它的最新 LL；运行 `lip install LeviLamina@<LL版本>` 则会安装指定 LL 及其对应的 BDS。lip 会通过 bdsdown 从官方渠道下载服务端。

## LeviLamina 支持 BDS 预览版（Preview/Beta）吗？能强制在预览版上运行吗？

不支持。LeviLamina 只适配特定的正式版 BDS，每个版本都是针对正式版重新生成头文件、符号与 bedrock-runtime-data 的。预览版没有对应的适配数据，即使放入 LeviLamina 也无法启动，或会在启动后很快崩溃。请下载与 LeviLamina 版本对应的正式版 BDS（建议用 lip 安装）。若只是想在预览版上做实验，只能自行用 PreLoader 加载自己的内容，LeviLamina 本身无法用于预览版。

## 升级 LeviLamina 后，原有插件/模组还能用吗？需要一起更新吗？

分两种情况：

1. 同一 LL 版本系列内的小版本升级（只变最后一位，如 1.7.3→1.7.4、1.9.5→1.9.9、26.60.1→26.60.8）：不跨游戏版本。LeviLamina 遵循语义化版本，插件一般无需更新即可继续使用。
2. 跨 BDS 版本的升级（如 1.21.50→1.21.60、1.4.x→1.5.x、1.9.x→26.10.x）：原生（native，dll）模组一般都不能直接使用，需要作者针对新版本重新适配编译并发布对应版本（如 GMLIB、iListenAttentively 等），且新版本发布时通常只有 LiteLDev 自己的模组会第一时间完成适配；而 LSE（LegacyScriptEngine）脚本插件（JS/Lua 等）通常只要将 LSE 本身更新到适配新版本的版本即可继续使用。升级前，请以各模组的更新日志为准，逐一确认所用模组已发布适配新 LL 版本的版本。

使用 lip 管理时，运行 `lip setup` 会更换游戏与 LL 版本并重新请求已安装的模组，PreLoader、bedrock-runtime-data 等依赖也会根据 LeviLamina 的 `lip.toml` 自动更新。原生模组可在 LeviMC 模组站 <https://levimc.org/mods/> 搜索下载；对于已停更且找不到新版的旧模组，若没有其他模组依赖它，可直接删除。

## Minecraft 改用 26 开头的版本号后，LeviLamina 的版本号怎么变？1.9.x 之后的下一个版本是什么？

从适配 BDS 1.26.10 开始，LeviLamina 的版本号改为跟随 MC 版本号：1.9.x（对应 BDS 1.21.132）之后的下一个版本是 26.10.0（随后是 26.10.1 等），中间没有 26.0。之后的系列依次为 26.20.x、26.32.x、26.40.x、26.51.x、26.60.x，主次版本号对应所适配的 MC 版本（例如 LeviLamina 26.60.x 对应 BDS 1.26.60.6）。

*适用版本：LeviLamina 26.10.0 及以上*

## LeviLamina 现在不再绑定基岩版 BDS 的具体版本了吗？怎么获得对应版本的 BDS？

每个 LeviLamina 版本仍然对应特定的 BDS 版本（例如 LeviLamina 26.60.8 对应 BDS 1.26.60）。用 lip 安装 LeviLamina 时，会自动下载并安装对应版本的 BDS（即 `github.com/LiteLDev/bds` 包），无需手动匹配：运行 `lip install LeviLamina` 可安装最新 LeviLamina 及其支持的游戏版本；运行 `lip setup --game <版本>` 则可指定游戏版本（lip 会自动选择支持该版本的最新 LeviLamina，若无匹配版本则会提示）。

## 用第三方整合包（如 MineBBS 上的 LeviLamina+LSE 整合包）无法启动（PeEditor 等步骤异常），BDS 版本必须对应吗？不用 lip 能安装吗？

BDS 版本必须与 LeviLamina 严格匹配，协议号相同的其他版本也不行（例如 LeviLamina 1.3.x 只能搭配 BDS 1.21.80，当前 LeviLamina 26.60.8 对应 BDS 1.26.60）。推荐使用 lip 安装（运行 `lip install LeviLamina` 或 `lip setup --game <版本>`），它会自动下载对应版本的 BDS，并完成 PreLoader、PeEditor、运行时数据（bedrock-runtime-data）等步骤；若 lip 安装或启动失败，可尝试关闭杀毒软件。

不用 lip 也可以安装，但需自行准备对应版本的 BDS、PreLoader、PeEditor 和 bedrock-runtime-data（具体版本以 LeviLamina 的 `lip.toml` 中的 deps 为准），将它们解压到同一目录后运行 `.\PeEditor.exe -mb` 修改 BDS。安装完成后，运行 `bedrock_server_mod.exe`（或 `lip run`）启动服务端。

## LeviLamina 刚更新到新大版本后，加载插件时日志满屏 fatal/error，服务器随即崩溃，是怎么回事？

这是因为插件或前置库尚未适配新版 LeviLamina/BDS。凡是在加载阶段报出 fatal（如 `Couldn't find:` 某符号）的，运行起来基本都会崩溃。报错原因分为两类：一是插件调用的 MC API 或符号在新版中已不存在；二是所依赖的前置库（如 GMLIB、LegacyRemoteCallApi、iListenAttentively 等）尚未适配。解决办法是等待插件和前置库更新，或继续使用它们所支持的旧版 LeviLamina 与对应的 BDS。

## LeviLamina 启动时日志显示“正在加载 XXX(如 CustomMap) … ERROR [LeviLamina] 无法加载 XXX”，怎么办？

一般是因为该模组的版本未适配当前的 LeviLamina/BDS 版本（日志后文通常会写出具体原因，如缺少依赖或符号）。可以等待模组作者更新，或者将 BDS 和 LeviLamina 一起降级到该模组支持的版本：由于每个 LeviLamina 版本都绑定特定的 BDS 版本，不能只单独降级 LeviLamina，可用 `lip setup` 一并切换游戏与加载器版本。求助时请附上完整的日志文件。

## 控制台提示某 mod 不支持当前 BDS 版本，但这个 mod 看起来还能正常运行，需要处理吗？

需要处理。该提示说明 mod 与当前 BDS 版本不匹配，目前能运行只是因为暂时还没执行到出问题的代码（如失效的符号或偏移），一旦执行到就可能直接导致崩溃。请将该 mod 更换为与当前 BDS/LeviLamina 版本匹配的版本。

*未能从源码或文档中直接证实，仅供参考。*

## 服务器启动日志停在 PreLoader 的 `Loading Reverse Lookup Table` / `Preloading: LeviLamina` / `LeviLamina Loaded.` 后直接闪退，`latest.log` 为空，是什么原因？

这一般是 BDS 与 LeviLamina 版本不匹配所致，需使用与 LeviLamina 对应的 BDS 版本（同时也可检查 BDS 文件是否完整）。建议用 lip 安装 LeviLamina 以自动匹配依赖，并在控制台直接运行以查看完整输出，不要只看面板或 `latest.log`。

*适用版本：LeviLamina 1.x 及以上（使用 PreLoader 的版本）。未能从源码或文档中直接证实，仅供参考。*

## 服务端加载 mod 时报错/崩溃（例如在 BDS 1.21.60 上装了为 1.21.80 版 LeviLamina 编译的 mod），原因是什么？

mod 与服务端/LeviLamina 版本不匹配。mod 必须针对当前所用的 LeviLamina（及其绑定的 BDS 版本）编译。请换用对应版本的 mod，或将服务端和 LeviLamina 一并升级到 mod 所需的版本。

## 装了 LeviLamina 和 iListenAttentively 等 mod 后服务器崩溃，日志显示 LeviLamina 版本过老/数据不匹配，原因是什么？

bedrock-runtime-data 与 LeviLamina 版本不匹配（或 LeviLamina 版本过老，与 BDS 不对应）。LeviLamina、bedrock-runtime-data 和 BDS 的版本必须相互对应。建议用 lip 一并安装或升级（LeviLamina 的 `lip.toml` 精确锁定了 bds 与 bedrock-runtime-data 的版本），并将 mod 更新到对应版本。

## LeviLamina 客户端同时注入 Onix Client 会出问题（甚至导致关机），能解决吗？

两者的 hook 存在冲突，基本无法解决。请勿同时使用 LeviLamina 客户端和 Onix 等注入式第三方客户端。

*适用版本：LeviLamina 客户端 1.8.x 及以上。未能从源码或文档中直接证实，仅供参考。*

## 为某个版本（如 26.30）做的 LeviLamina 客户端模组能在相近版本（如 26.33）上用吗？

不一定。相近版本的协议相同，虽然可以互相联机，但模组 hook 的函数或符号地址可能已经改变。原生模组需要针对具体的游戏版本进行适配，版本号接近不代表模组兼容（例如有模组就单独发布了 26.33 版本）。请使用与游戏版本对应的模组构建。

## 为什么 iOS 玩家无法通过 IP 进入使用 NetherNet 的 BDS 服务器，而 Android/Windows 可以？

使用 RakNet 时，所有平台的玩家都能正常进入；iOS 无法进入是 NetherNet 导致的问题：Mojang 未修改 iOS 应用策略以允许通过 IP 访问明文 HTTP（NetherNet 信令），导致 iOS 无法连接通过 IP 提供的 NetherNet 服务器。如需让 iOS 玩家进入，可改用 RakNet。

*适用版本：BDS 26.x 使用 NetherNet 时。未能从源码或文档中直接证实，仅供参考。*

## 只升级了 LegacyScriptEngine（或 LeviLamina）后，插件全部报错（控制台一片红），为什么？

BDS、LeviLamina、LegacyScriptEngine 以及原生 mod 的版本必须一一对应，任何一个不匹配都会报错。升级时，应将 BDS、LeviLamina、LSE 和所有原生 mod 一并升级到相互对应的版本（推荐用 lip 管理，以自动解析依赖版本）。

## 如何知道当前 LeviLamina 对应/运行的是哪个 BDS（游戏）版本？

在服务器控制台输入 `version` 命令，输出格式为 `Game version <游戏版本> with LeviLamina-<LL版本>.`，可同时查看游戏（BDS）版本和 LeviLamina 版本（该命令默认开启，可在 LeviLamina 配置的 `modules.command.versionCommand` 中关闭或调整权限）。BDS 自身的启动日志也会打印游戏版本。此外，LeviLamina 的 `lip.toml` 中的 `github.com/LiteLDev/bds` 依赖也写明了该 LL 版本所适配的 BDS 版本（例如 LeviLamina 26.60.8 依赖 bds 1.26.60）。

## 存档来自小版本号不同（如 26.52.3）的游戏，还能在 LeviLamina 服务端上用吗？需要降级吗？

直接将存档文件夹放入服务端的 `worlds` 目录（并在 `server.properties` 的 `level-name` 中指定）即可使用。同一大版本内不同小版本的存档一般可直接加载，无需降级。不过，将较新版本的存档放到较旧的服务端上仍存在兼容风险，建议先备份。

*适用版本：BDS 原版存档行为，与 LeviLamina 版本无关。未能从源码或文档中直接证实，仅供参考。*

## 升级 LeviLamina 服务端的 BDS 版本（解压新版并复制存档）后所有 mod/插件都失效了，为什么？

mod 必须与游戏（BDS）及 LeviLamina 版本对应；C++ mod 是针对特定 LL 版本编译的，只能在对应版本上运行。升级服务端后，必须同时将所有 mod 更新到适配新版本的版本，不能只升级服务端而沿用旧 mod。

推荐用 lip 管理：先执行 `lip setup --game <游戏版本> --loader levilamina` 更换游戏和 LeviLamina 版本（这会保留并重新解析可兼容的其他包），再执行 `lip update` 更新 mod。注意，`lip update` 本身不会更换游戏和加载器。

## 用 `bedrock_server.exe` 能正常开服，但用 `bedrock_server_mod.exe` 启动时读取存档就闪退且无日志，LeviLamina 似乎没加载，是什么原因？

这通常是 BDS 与 LeviLamina 版本不匹配（安装了该 LL 版本不支持的 BDS），导致 LL 无法加载。每个 LL 版本只适配特定的 BDS 版本（见 LeviLamina `lip.toml` 中的 bds 依赖）。最简单的方式是在空目录中用 lip 搭建：执行 `lip install LeviLamina`（或 `lip setup --game <游戏版本> --loader levilamina`），lip 会自动安装适配的 BDS 和 LeviLamina，并生成 `bedrock_server_mod.exe`。

## 能否手动降级 LeviLamina？只替换 LeviLamina 文件后服务器（面板服）不再加载 LeviLamina 了怎么办？

LeviLamina 版本与 BDS 版本绑定，降级 LL 必须同时换用对应版本的 BDS，仅替换 LL 文件是不可行的。推荐在本地电脑的服务器目录（或空目录）中用 lip 指定版本：执行 `lip setup --game <BDS版本> --loader levilamina@<LL版本>`，lip 会同时安装匹配的 BDS 和 LeviLamina，并保留其他仍兼容的包；完成后再将整个服务端上传到面板。注意，`lip install` 和 `lip update` 不会更改游戏和加载器版本，必须使用 `lip setup`。

## LeviLamina 服务器启动后插件完全不加载，原因是什么？

这通常是 PreLoader 与 LeviLamina/BDS 版本不配套，或 PreLoader 所需的数据文件缺失，导致 LeviLamina 和插件根本未被注入。

每个 LeviLamina 版本都锁定了确切的 PreLoader 和 bedrock-runtime-data 版本（例如 LeviLamina 26.60.8 依赖 PreLoader 1.16.8 和 BDS 1.26.60）。因此切勿手动混搭各组件版本，建议执行 `lip install github.com/LiteLDev/LeviLamina` 进行安装，lip 会按依赖自动安装匹配的 PreLoader、PeEditor、bedrock-runtime-data 和 BDS，并执行 `PeEditor.exe -mb` 生成 `bedrock_server_mod.exe`。另外，请确认启动的是 `bedrock_server_mod.exe` 而非原版 exe。

*适用版本：LeviLamina 1.x 及以上（当前 26.60.x）*

## 安卓上的 `.so` mod 是否所有基岩版启动器都能加载？

不一定。基于 Preloader SDK（`pl::` API，`LiteLDev/preloader-android`）开发的安卓原生 mod 由 Android 版 LeviLauncher 通过 `libpreloader.so` 加载，其他启动器若无法加载 preloader 就无法使用这类 mod。部分 mod 只能由 LeviLauncher 加载，还有一些 ImGui mod 依赖特定启动器提供的触控/输入支持。

变通做法是从 LeviLauncher 安装包中提取 `libpreloader.so`，与 mod 一起加载，但能否成功取决于具体启动器。

*适用版本：LeviLauncher-Android（当前 v1.7.1）。未能从源码或文档中直接证实，仅供参考。*
