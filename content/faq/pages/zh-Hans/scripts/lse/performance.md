# LegacyScriptEngine 的性能与开发工具

## LSE 中的异步是真正的异步吗？做大量计算会不会卡主线程？

不是真正的多线程异步。LSE 的脚本引擎事件循环在 MC 服务器主线程上运行：QuickJS、Lua 等引擎的消息队列每 tick 轮询一次（`loopQueue` `kLoopOnce`），Promise、`setTimeout` 等只是把任务推迟到主线程后续执行；QuickJS 的微任务（Promise 回调）由 ScriptX 投递到引擎消息队列中执行；Node.js 引擎的 libuv 事件循环和微任务同样由 LSE 在主线程上约每 2 tick 驱动一次（`uv_run` NOWAIT）。此外，所有 MC API 都是同步调用。

因此，无论大量计算是否写成 `async`，都会卡住主线程并导致 TPS 下降。建议将计算拆分成小块，分摊到多个 tick 中执行。使用 Node.js 引擎时，也可以尝试把纯计算放到 `worker_threads` 的 worker 中（worker 内不能调用 MC API，且官方文档未说明此用法）。Python 引擎文档则明确要求暂时不要使用 `threading`、`asyncio` 等特性。

*适用版本：LSE 当前所有版本*

## LSE 的 quickjs 引擎和 nodejs 引擎有什么区别，用的是 V8 吗？性能如何比较？

QuickJS 引擎（`LegacyScriptEngine#quickjs`）使用 QuickJS 作为 JS 引擎，而非 V8；Node.js 引擎（`LegacyScriptEngine#nodejs`）才使用 V8，并支持 npm 包。QuickJS 与 Python 引擎的性能高下难分，而 V8 是知名的高性能（JIT）引擎，大型项目可以考虑使用 Node.js 引擎。

*适用版本：LSE 当前所有版本*

## LSE（原 LLSE）脚本插件能用多线程来提升穷举（如搜索附近矿石）的性能吗？

基本不能。LSE 的脚本 API 只能在服务器主线程上调用，QuickJS、Lua 等脚本引擎本身没有可用的多线程；即使 Node.js 的 `worker_threads` 或 Python 线程能运行纯计算，也无法在其中调用 LSE/BDS 接口，多进程同样无法与 BDS 交互。遇到大范围穷举方块等需要高性能计算的场景时，应改用 LeviLamina 原生 C++ mod，或降低计算频率、分批到多个 tick 中执行。

*适用版本：LegacyScriptEngine 当前所有版本（含 0.23.1）。未能从源码或文档中直接证实，仅供参考。*

## LSE JS 插件在 `mc.listen("onTick")` 中每 tick 读写文件，导致玩家进服变慢、服务器卡顿，如何排查和优化？

使用 VS 性能分析（火焰图）等工具可以看到大量文件读写操作。在插件代码中搜索 `File.readFrom` / `File.writeTo`，即可定位在 `onTick` 中读写文件的代码。每 tick 写一次文件相当于每秒进行 20 次磁盘 IO，频率比 BDS 存档写入还高，对性能影响极大。应改为每隔几秒写一次，或仅在数据变化时写入；许多场景其实不需要监听 `onTick`，可以用 `setInterval` 作为低频的 tick 定时器。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 插件需要大量修改方块（例如清空区块）时，用 `mc.setBlock` 逐个设置还是用 `fill` 命令更好？

在 LSE 中大量逐个调用 `mc.setBlock` 时，每次都要跨脚本与 C++ 边界调用并构造方块，开销比直接执行一次 `fill` 命令更大。大范围修改方块时，建议优先使用 `fill` 命令（注意 `fill` 要求目标区块已加载，且单次填充体积有上限），或考虑通过加载结构等方式实现。

*适用版本：LegacyScriptEngine 当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LSE 的 KVDB（`KVDatabase`）读取很快，但写入嵌套对象/字典时很卡，为什么？怎么优化？

`KVDatabase.set` 会通过 `ValueToJson` 将传入的值转换为 JSON。如果传入的是对象或数组，LSE 需要递归遍历每个键，逐个从脚本引擎中取值并转换，嵌套越深、数据越大就越慢；而直接传入字符串只需取值一次，速度要快得多。建议先自行将数据序列化为字符串（例如使用 `JSON.stringify`，或将 NBT 直接序列化为 SNBT/二进制字符串）再存入。LevelDB 内部本身已有读写缓存，性能瓶颈通常在于序列化，无需再自行实现一层读写缓存。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 自带的 BossBar 接口（`player.setBossBar`）有什么问题？为什么设置 bossbar 时指定的实体会消失？

带 `uid` 的 `player.setBossBar(uid, title, percent, color)` 的内部实现是：先发送 BossEvent Remove，接着发送一个 AddActor 数据包（ActorType 为 `"player"`，`uniqueId` 和 `runtimeId` 均使用传入的 `uid`，位置设在维度最低高度以下），最后发送 BossEvent Add。也就是说，每次更新都是先删除再重新添加，而非发送更新包。如果传入的 `uid` 对应一个真实存在的实体，客户端上的该实体就会被这个假实体覆盖，看起来就像消失了一样。此外，这种机制在频繁更新时开销较大，且有反馈称其构造 AddActor 的方式会与其他插件（如 LeviOptimize）的多线程发包产生冲突。

需要频繁更新 bossbar 时，可以改用 GMLIB 等库提供的发送与更新实现（建议直接调用其导出接口，而非照抄代码），或传入一个不存在的 `uid`。

*适用版本：LegacyScriptEngine 当前所有版本（0.23.1 实现未变）*

## LSE 中大量使用时，执行原版命令（`mc.runcmd` / `mc.runcmdEx`）和调用等价的脚本 API，哪个性能更好？

通常调用脚本 API 性能更好。API 与原版命令底层调用的游戏逻辑基本是同一套，但使用 API 可以省去命令字符串解析和命令执行流程的开销。

*适用版本：LegacyScriptEngine 当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器装了七八十个插件（大量 LSE 脚本插件 + addon），高端 CPU 十几个玩家 TPS 只有个位数，怎么优化？

LSE 插件装得越多，服务器就越卡：C++ 与脚本层之间的通信本身就很耗时，插件越多，累积开销越大。建议采取以下措施：

1. 删掉不必要的 LSE 插件，能用 LeviLamina 原生 C++ mod 替代的尽量替代（例如领地插件用 C++ 的 PLand 代替 Lua 的 iLand）。
2. 只安装所需的脚本引擎变体：使用 `lip install LegacyScriptEngine#quickjs`（或 `#lua`、`#nodejs`、`#python`）按需安装。不指定变体时会同时安装 QuickJS 和 Lua，用不上的引擎可以卸载。
3. 完全不装 LSE 时性能最佳，再配合 LeviOptimize 效果更好。
4. 记录玩家行为的日志类插件（如 BehaviorLog）对性能非常敏感，容易引发卡顿。
5. 大型生物 addon 以及大量村民、刷铁机也会显著拉低 TPS。

在实际案例中，删掉大量插件和高负载 addon 刷怪规则后，十多名玩家在线时 TPS 恢复到了 17+。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本*

## 为什么说 LL2 的脚本引擎会拖慢服务器？现在的 LSE 在这方面有何不同？

在 LL2（LiteLoaderBDS）中，只要装有脚本插件，就会一次性启动全部脚本引擎（JS/Lua/Node/Python），无法按需启动，这让性能本就一般的 BDS 更加卡顿。LeviLamina 下的 LSE 则将各引擎拆分为独立的变体，支持按需安装：`lip install LegacyScriptEngine#quickjs` / `#lua` / `#nodejs` / `#python`（不指定变体时默认同时安装 QuickJS 和 Lua）。不安装用不到的引擎，即可减少性能开销。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本（0.23.x）*

## 同样数量的循环调用下，LSE 脚本和原版 Script API（addon 脚本）哪个更快、更不容易掉刻？

两者都在服务器主线程上执行 JS，单纯的脚本运算性能相差不大，主要差异在于 C++ 与脚本之间互相调用的开销。无论使用哪种，都应尽量避免在单个 tick 中执行大量循环，建议将任务分批到多个 tick 处理或降低执行频率。此外，当原版 Script API 的 before 事件不允许修改世界状态时，可以使用 `system.run` 等计划任务将操作推迟到下一 tick 执行。

*适用版本：LegacyScriptEngine 当前版本；原版 Script API 行为取决于 BDS。未能从源码或文档中直接证实，仅供参考。*

## 在 LSE 中调用 GMLIB 的悬浮字 API 会很消耗性能吗？

这取决于具体的实现方式：通过生成真实实体实现的悬浮字比较消耗性能；而 GMLIB 的悬浮字是通过发包实现的（即客户端假实体），服务端开销较小。

*适用版本：使用 GMLIB（第三方库）的 LSE 插件。未能从源码或文档中直接证实，仅供参考。*

## 服务器 20 人左右 TPS 只有 10 左右，性能分析显示大量时间在漏斗和 LSE（QuickJS）插件上，是什么原因？

这是因为服务器安装了监听漏斗事件（`onHopperSearchItem` / `onHopperPushOut`）的 LSE 防刷物类插件，同时服内存在大量漏斗。每个漏斗每秒都会多次触发这些事件，而插件在每次事件回调中都会执行大量逻辑，从而导致严重卡服。解决办法是卸载或替换该防刷物插件，或者减少服内的漏斗数量。

*适用版本：LegacyScriptEngine 当前所有版本*

## 用 LSE 做矿区刷新时，除了用 `for` 循环逐个 `setBlock`，有没有性能更好的方法？

可以预先将矿区保存为结构（NBT structure），刷新时调用 `mc.setStructure(nbt, pos, mirror = 0, rotation = 0)` 一次性放置整个结构。相比在脚本中用循环逐个调用 `mc.setBlock`，一次性放置结构的性能开销要小得多。

*适用版本：LegacyScriptEngine 当前版本（0.23.x）*

## 用 LSE 插件通过频繁 `rename` 玩家名，在名字下方显示延迟等信息后，玩家进服会卡几秒，原因是什么？

`pl.rename()` 不只是修改名字：每次调用时，它都会调用 `setNameTag` 并将实体的 ActorData（SetActorDataPacket）重新同步给所有玩家。如果每 tick 都对所有玩家调用 `rename`，就会产生海量数据包，可能挤占或延后正在进服玩家的区块数据包，导致进服加载卡顿；同时，`rename` 还会影响命令输出等处的玩家显示名。

更好的做法是：使用 LSE 的发包接口（用 `BinaryStream` 构造数据包后调用 `pl.sendPacket(packet)`）仅向需要的玩家发包，或在 C++ 中 hook 相关数据包来修改显示名，同时降低更新频率，避免频繁调用 `rename`。

*适用版本：LegacyScriptEngine 当前版本*

## 用性能分析工具（如 Visual Studio 诊断 `.diagsession`）分析 LeviLamina 服务器卡顿时，看不出是哪个插件占用高，怎么办？哪些 LSE 插件容易影响性能？

原生 DLL 插件需要配套的 `.pdb` 符号文件，才能在分析结果中显示函数名。请检查每个 dll 插件目录下是否有对应的 pdb；如果没有，前往插件下载页获取并放入插件文件夹。pdb 必须与插件的实际版本一致，否则仍无法解析。

对于 LSE 脚本插件，分析器（包括 windbg）只能看到 LSE 引擎本身，无法区分具体是哪个脚本插件。如果调用栈热点在 tick 中，说明问题与 `onTick` 有关。可以在插件目录的 `*.js` 文件中全局搜索 `onTick`（例如用 VSCode 或 Notepad++），找出调用 `mc.listen("onTick", ...)` 的插件。监听 `onTick` 的 LSE 插件（如 TMEssential）都会带来持续开销，LSE 本身的加载也有一定开销。

*适用版本：LeviLamina + LegacyScriptEngine 当前版本*

## LSE nodejs 引擎长时间运行（约 18 小时）后报 `JavaScript heap out of memory` 导致崩服，内存限制能调吗？

旧版 LSE nodejs 使用 Node 16，新版使用 Node 22。堆内存由 Node/V8 管理且设有上限，理论上可通过 Node 启动参数 `--max-old-space-size` 调大（LSE 本身未提供传入该参数的配置项，可尝试在启动 BDS 前设置环境变量 `NODE_OPTIONS=--max-old-space-size=<MB>`，但此方法未经官方确认）。不过，此类问题多半是因为插件随时间不断创建对象却未释放（内存泄漏），应优先排查插件；临时办法是定时重载插件。

*适用版本：LSE nodejs 引擎（Node 22）当前版本*

## 写 LSE（原 LLSE）JS/TS 插件时，有没有官方的类型定义（`.d.ts`）/代码补全库？HelperLib、LiteLoaderSE-Aids 还能用吗？

有。官方类型定义由 LiteLDev/legacy-script-engine-api 仓库维护（由原 HelperLib 仓库改名而来，访问旧链接 `github.com/LiteLDev/HelperLib` 会自动跳转），JS/TS 平台以 npm 包 `@levimc-lse/types` 发布：

1. 在插件项目中执行 `npm install -D @levimc-lse/types`。
2. 在 `tsconfig.json`（或 JS 项目的 `jsconfig.json`）中添加 `"compilerOptions": { "types": ["@levimc-lse/types"] }`，或在入口文件顶部添加 `/// <reference types="@levimc-lse/types" />`。

注意：截至 2026-11-18，npm 官方源 `registry.npmjs.org` 上的 `@levimc-lse/types` 返回 404（yarn 源和 jsDelivr 也无法获取），但国内镜像 npmmirror 仍保留 2.18.7 版本。如果从官方源安装失败，可运行 `npm install -D @levimc-lse/types --registry=https://registry.npmmirror.com`，或直接从 legacy-script-engine-api 仓库的 `platforms/javascript/src` 目录复制 `.d.ts` 文件，再用 `/// <reference path="本地路径/index.d.ts" />` 引用。

旧写法 `/// <reference path="node_modules/helperlib/src/index.d.ts"/>` 已过时；`reference path` 只能指向本地文件，不能写 URL。该仓库也提供 Python 平台的提示库。

VSCode 扩展 LiteLoaderSE-Aids 本质上只是一键引入补全并支持选择 BDS 目录开服，官方仓库已归档，不再维护（社区有魔改版 LiteLoaderSE Aids Magic Revision，另有第三方扩展如 LLScriptHelper-MR、社区 npm 包 `levilamina` 等，均非官方维护）。

不使用扩展也能测试：在 VSCode 终端中 `cd` 到服务端目录，在 PowerShell/cmd 下运行 `.\bedrock_server_mod.exe`（Git Bash 下运行 `./bedrock_server_mod.exe`）即可。

LSE 的公共 API 与旧版 LLSE 基本一致，旧 LL v2 时代的类型声明大体可用，但建议以官方 `@levimc-lse/types` 为准。

*适用版本：当前版本；`@levimc-lse/types` 2.18.x*

## LSE 能直接加载 TypeScript 吗？用 TS 写 LSE 插件 `tsconfig` 怎么配，多文件项目怎么打包成一个插件 js？

LSE 不支持直接加载 `.ts` 文件，也不做即时编译，需要先编译或打包成 JS 再加载（可使用 `tsc --watch` 或打包器）。

类型定义使用官方包 `@levimc-lse/types`（截至 2026-11-18，npm 官方源返回 404，可加 `--registry=https://registry.npmmirror.com` 安装，或从 legacy-script-engine-api 仓库的 `platforms/javascript/src` 目录获取 `.d.ts`），并在 `tsconfig.json`（文件名必须是 `tsconfig.json`）中设置 `"types": ["@levimc-lse/types"]`。部分类型声明属于全局声明，没有默认导出，不要 `import` 它们，直接使用全局的 `mc`、`ll`、`log` 等即可。

多文件项目可用打包器合并为单个文件，例如使用社区模板 dmblock/lse-typescript-template（基于 rolldown）：

- `tsconfig` 关键配置：`"target": "es2024"`、`"module": "commonjs"`、`"moduleResolution": "node"`、`"esModuleInterop": true`、`"skipLibCheck": true`、`"types": ["@levimc-lse/types"]`、`"rootDir": "./src"`、`"outDir": "./dist"`。
- `rolldown.config.ts`：`defineConfig({ input: 'src/index.ts', output: { file: 'dist/bundle.js', format: 'cjs' }, external: ['ll', 'mc'], platform: 'node', tsconfig: './tsconfig.json' })`。
- 使用方法：执行 `git clone https://github.com/dmblock/lse-typescript-template` 后删除 `.git` 目录，运行 `pnpm install`；开发时用 `pnpm dev` 监听文件变化，构建时运行 `pnpm build`，最后将 `dist/bundle.js` 改名并放入插件目录（需配合 `manifest.json`）。

只 `import` 但未使用的模块会被 tree-shake 移除。

此外，QuickJS 引擎原生支持 ES Module 的 `import`/`export`（入口模块的相对路径解析有特殊行为，详见文档 LanguageSupport）；如果使用 Node.js 引擎，则按标准 npm 项目打包，将 `package.json` 的入口指向编译后的 js，且不要将 `node_modules` 打进压缩包。

## 如何在 Windows 上编译 LSE 所用的 `libnode.dll`（网上教程多是 `.so`）？

在 node 源码目录下执行 `.\vcbuild.bat dll`。如果要像 LSE 一样使用 v8 的内部组件（如 `v8_libplatform`），还需修改 `tools/v8_gypfiles/v8.gyp`，具体可参考 <https://github.com/LiteLDev/node/commit/80d31fc05ed413e3b29fbbdb0a4dc380eab2f5e3>。

LSE 实际使用的是 LiteLDev/node fork 提供的预编译包（当前为 v22.12.0），通常无需自行编译。

*适用版本：当前版本（LSE nodejs 后端，Node.js v22.12.0）*

## 用 TypeScript 写 LSE 插件时，LSE 提供的 `File` 类与 JS/DOM 内置的 `File` 冲突报错，怎么解决？

该冲突源于 TypeScript 默认 lib 中 DOM 自带的 `File` 类型。在 `tsconfig.json` 中显式设置 `"lib"`，只填写 ES 版本（如 `["ES2020"]`），不要包含 `"dom"`，LSE 的 `File` 声明即可生效；同时可配合设置 `"skipLibCheck": true`。

类型声明可通过 `npm install -D @levimc-lse/types` 安装，并在 `compilerOptions.types` 中加入 `"@levimc-lse/types"`。如果使用的是 Node.js 引擎，也可以直接用 Node 的 `fs` 模块。

*适用版本：当前版本（JS/TS 插件开发）*
