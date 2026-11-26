# LegacyScriptEngine 的报错与崩溃

## 在 LegacyScriptEngine（Lua 引擎）上运行 iLand（`iland-core.lua`）等 Lua 插件时加载失败，报 `module 'dkjson' not found` / 缺少 `dkjson.lua`，怎么解决？

`dkjson` 是 iLand 等 Lua 插件自带的第三方依赖库，与 LeviLamina、PreLoader 无关。请按以下步骤解决：

1. 从插件原发布页下载完整插件包，将其中 `lib` 目录下的依赖（如 `dkjson.lua`）放入模组根目录下的 `lib` 文件夹，即 `mods/lib/dkjson.lua`。自 LSE 0.23.0 起，启动时会自动创建 `plugins` → `mods` 的目录链接，因此放到 `plugins/lib/` 效果相同。LSE 的 `BaseLib.lua` 会将 `<模组根目录>/lib/?.lua` 加入 Lua 的 `package.path`，插件即可直接 `require "dkjson"`；报错信息中列出的其他搜索路径也同样可用。
2. 将主脚本（如 `iland-core.lua`）直接放入 `plugins/`（即 `mods/`）。启动服务器后，LSE 会自动将其迁移到同名文件夹并生成 `manifest.json`，无需手动编写 manifest；迁移后需重启服务器才能加载插件。
3. 确认已安装并加载 Lua 引擎：在控制台执行 `ll list` 查看是否有 `legacy-script-engine-lua`，用 `ll show <模组名>` 查看详情；若未安装，可执行 `lip install LegacyScriptEngine#lua` 安装。
4. 检查是否存在重复的插件文件（例如同时有两份 `iland_core.lua`），并排查同目录下其他插件的报错是否造成干扰。建议使用 iLand 的修复版，且服务器路径中应避免包含中文。

*适用版本：LeviLamina + LegacyScriptEngine Lua 引擎当前所有版本；`plugins` 链接到 `mods` 的行为自 LSE 0.23.0 起*

## 旧 LLSE 插件在 LSE 0.9 及之后版本加载时在 `ll.registerPlugin` 处报错（旧版本正常），怎么办？

在 LSE 0.9 之前，`registerPlugin` 并未真正实现（直接 return），因此参数随便填写都不会报错。从 0.9.0 起，LSE 实现了该函数的参数处理与类型检查：第 1 个参数（名称）和第 2 个参数（介绍）必须是字符串；第 3 个参数（版本）必须是数组 `[major, minor, patch, status?]` 或对象 `{major, minor, revision, status}`；第 4 个参数 `otherInformation` 必须是仅包含“字符串: 字符串”键值对的对象。常见错误是将第 4 个参数写成了 `null`，将其改为 `{}` 即可。更简单的做法是直接删除或注释掉 `ll.registerPlugin` 调用，将插件信息写在 `manifest.json` 中（该调用在 LSE 中已弃用，并非必需）。另外，LSE 0.9.0 中 `registerPlugin` 的实现缺陷曾导致部分插件报错甚至崩服，该问题已在 0.9.1 中修复，使用当前版本不会再遇到。

*适用版本：LSE 0.9.1 及以上（当前 0.23.1）*

## 手动安装 LSE 或脚本插件后启动提示缺少依赖项（如 `legacy-script-engine-quickjs`、`LegacyMoney`、`LegacyRemoteCall`），插件不加载，需要装哪些组件？

1. 提示缺少 `legacy-script-engine-quickjs`（或 `-lua`/`-nodejs`/`-python`）：说明插件依赖对应的 LSE 引擎但尚未安装。可执行 `lip install LegacyScriptEngine#quickjs`（替换为所需的引擎变体）安装，或从 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 下载对应的 zip 包手动安装。
2. 提示缺少 `LegacyMoney` / `LegacyRemoteCall` / `iListenAttentively`：这些是 LSE 引擎自身依赖的独立模组，不包含在 LSE 压缩包内。手动安装时，必须前往 LiteLDev 组织的对应仓库 Releases 页面，下载与 LSE 匹配的版本（如 LSE 0.23.x 对应 LegacyRemoteCall 0.23.x、LegacyMoney 0.23.x、iListenAttentively 0.18.x）。使用 lip 安装 LSE 会自动装好这些依赖，最为省事。自 LSE 0.15.0 起已不再需要 LegacyParticleAPI。若插件还依赖其他前置（如 GMLIB 等第三方库），也需一并安装。
3. 目录结构错误：解压时应将压缩包内的模组文件夹（如 `legacy-script-engine-quickjs/`）直接放入 `mods/`，不要多套一层外层文件夹，否则无法识别。

*适用版本：LSE 0.21.2 及以上（含 iListenAttentively 依赖）；当前最新 LSE 0.23.1*

## LSE 升级到 0.17.11 及以后版本（如 0.17.13）或重载插件后，很多甚至全部 LSE 插件的命令变成“未知命令”、表单打不开，但插件其他功能正常，降回 0.17.10 就恢复，是什么原因？怎么解决？

原因：为兼容 LeviStone，LSE 0.17.11 将原本基于事件实现的“假命令”（CommandCompatibleAPI）替换为了真正注册到命令系统的命令（LegacyCommandAPI）。此改动后，插件不能再覆盖已存在的命令。如果某个 LSE 插件注册的命令与其他插件或已有命令同名（例如与 LegacyMoney 的 `/money` 同名），或者命令枚举（`cmd.setEnum`）的名称与其他插件重复，就会发生注册冲突，导致大量插件的命令失效。发生重复注册时，控制台还会提示 `Runtime command xxx already exists`。

排查：逐个移除插件，找出引发冲突的插件。

解决：修改冲突插件源码中注册的命令名或枚举名（查找 `mc.regPlayerCmd` / `mc.newCommand` / `cmd.setEnum` 的位置，例如将 `/money` 改为 `/moneys`）。如果是与 LegacyMoney 冲突，也可以在 LegacyMoney 的配置文件中将 `enable_commands` 设为 `false`，关闭其自带命令。

*适用版本：LSE 0.17.11 及以上（含当前 0.23.x）*

## 装了某些 LSE 插件后，插件命令提示 `no permission` 或无法使用，甚至所有指令都失效，控制台执行 `stop` 也提示“未知的指令”、关不了服，是什么原因？

为兼容 LeviStone，LSE 从 0.17.11 起将原来的“假指令”改为了真正注册的指令。如果某个插件注册的指令不符合原版命令规则，就可能破坏整个命令系统，导致包括 `stop` 在内的原版指令全部失效。常见的不合规写法包括：试图覆盖原版指令（如注册同名的 `stop`）、指令名包含大写字母或非英文字符，以及指令名或参数不合法。

解决：逐个移除插件，找出注册了不合规指令的插件，将其指令修改为全小写、合法且不与原版或其他插件冲突的名称，或联系插件作者修复。

*适用版本：LSE 0.17.11 及以上（含当前 0.23.x）*

## LeviLamina 服务器一有苦力怕爆炸就崩服（生成 trace 日志），可能是什么原因？

这通常是由 JS 编写的防爆类 LSE 插件（如 anticreeper）引起的：不少防爆插件会在爆炸事件回调（`onExplode`/`onEntityExplode`）中先拦截爆炸，再调用 `mc.explode` 重新生成爆炸，这种做法在新版 LSE 下极易导致崩服。解决方法：卸载或更换防爆插件，或联系作者修改代码，避免在爆炸回调中再次创建爆炸。此外，苦力怕防爆也可以直接通过修改行为包来实现，无需使用 LSE 插件。

*适用版本：LeviLamina + LSE（第三方防爆插件）。未能从源码或文档中直接证实，仅供参考。*

## 2022 年左右的老 LLSE JS 插件（如 `lljs-ban`）在新版 LSE 上报错无法运行，是什么原因，能修吗？

新版脚本引擎（QuickJS 后端）优先以 ES Module 方式加载 JS 插件的入口文件，而模块代码强制运行在严格模式下（仅当入口顶层执行抛出异常时，才会回退为普通脚本 eval）。许多旧插件编写时未考虑严格模式，存在变量未声明就直接赋值使用的情况，执行到事件或命令回调等运行时代码时便会报 `xxx is not defined` 等错误。如果熟悉 JS，只需为这些未声明的变量补上 `let`/`const`/`var` 声明即可继续使用；否则建议更换为仍在维护的同类插件。

*适用版本：LegacyScriptEngine（QuickJS 后端）当前版本*

## BDS 服务器崩溃，trace 日志显示疑似死循环/栈溢出，与背包插件有关，是什么原因？

这通常是因为某个 LSE 插件在 `onInventoryChange` 事件回调中修改了背包物品，而修改物品又会再次触发 `onInventoryChange`，从而形成递归死循环，最终导致栈溢出崩溃。请排查并修改在 `onInventoryChange` 回调中改动背包物品的插件（例如添加重入保护标志，或使用 `setTimeout` 延后修改以避免重复触发）。

*适用版本：LegacyScriptEngine 当前版本*

## LL1 时代的老 JS 插件（如在线时长统计 `/onlinetime rank`）在 LSE 上运行时报错 `i is not defined`，排行榜打不开，怎么修？

新版脚本引擎以 ES Module 方式加载 JS（强制严格模式），变量未声明就使用会直接报错。请根据报错行号打开插件文件，将 `for (i = 0; ...)` 改为 `for (let i = 0; ...)`，并检查整个文件中的其他循环变量及普通变量是否都已使用 `let`/`const`/`var` 声明。

*适用版本：LegacyScriptEngine（QuickJS 后端）当前版本*

## LSE JS 插件中 `const db = new KVDatabase('plugins/mydb/db');` 之后的代码都不执行，`try/catch` 得到 `ReferenceError: can't create class KVDatabase`，是 bug 吗？

`can't create class KVDatabase` 表示构造 `KVDatabase` 时底层 LevelDB 数据库打开失败（构造函数返回空）。常见原因有两种：一是服务器放在了需要管理员权限才能写入的目录（如 Program Files），导致无法创建或写入数据库目录（见 LegacyScriptEngine#228）；二是同一路径的数据库已被其他插件或实例占用。请将服务器移至普通用户可写的目录，并检查数据库路径及占用情况。脚本顶层抛出未捕获的异常会导致后续代码中止执行，可用 `try/catch` 捕获并查看具体错误；自 LSE 0.10.2 起，插件加载出错时也会直接在控制台显示错误信息（#240）。

*适用版本：LSE 当前所有版本（0.10.2 起加载错误会显示）*

## LSE NodeJS 中 `async` 函数里 `throw` 的错误在控制台不显示，和普通 Node.js 行为不一致，怎么处理？

LSE NodeJS 嵌入环境对未处理的 Promise 拒绝（unhandled rejection）的输出与独立 Node.js 不一定一致。建议在调用 `async` 函数处配合 `await` 使用 `try/catch` 或调用 `.catch()`，并用 `logger.error` 输出错误。

*适用版本：LSE NodeJS 引擎。未能从源码或文档中直接证实，仅供参考。*

## LSE NodeJS 引擎下更新到最新版 npm 后，npm 相关功能无法使用，怎么办？

LSE 的 `npm`/`npx` 控制台命令是在内嵌 Node 环境中直接执行引擎目录下的 `node_modules/npm/bin/npm-cli.js`（或 `npx-cli.js`）。如果把 npm 升级到与内嵌 Node 版本不兼容的版本，命令就会失效。恢复使用随 LSE 附带的（或兼容的旧版）npm 即可；也可以改用外部的 `node.exe` 来执行 npm。

*适用版本：LSE NodeJS 引擎。未能从源码或文档中直接证实，仅供参考。*

## LSE nodejs 插件中写了无限递归/占用大量内存后出现崩溃报错，这是 Script API 还是 LSE 的问题？

这是 Node.js（V8）的报错，表示 V8 栈溢出或内存耗尽，来自 LSE 的 nodejs 引擎，而非 BDS 的 Script API。另外，在 quickjs 引擎中，无限递归可能会直接导致 BDS 崩溃。请排查插件中的无限递归或内存占用过大的逻辑。

*适用版本：LSE nodejs / quickjs 引擎。未能从源码或文档中直接证实，仅供参考。*

## LSE quickjs 插件报错 `C++ Exception: script::Exception ... not a function ... In callback for sendForm` 是什么原因？

这表示表单回调里调用的目标不是函数（函数不存在或对象为空），属于插件代码问题，需检查插件代码。常见于菜单类插件注册的命令由 `runcmd` 或控制台执行时：例如回调中对非玩家实体调用 `en.toPlayer()` 会返回空，而不是玩家对象，后续再调用玩家方法就会报错。可改为通过 `mc.getPlayer(en.name)` 获取玩家对象，并在调用前先判空。

## LSE 启动时报错 `ERROR [legacy-script-engine-quickjs] failed to load: Failed to migrate legacy plugin at plugins/XXX.js: plugins/XXX already exists` 怎么解决？

LSE 启动时会把 `plugins/`（0.23.0 起为指向 `mods/` 的链接）根目录下的单文件旧插件（如 `XXX.js`）迁移到 `mods/XXX/XXX.js`，并生成 `manifest.json`。如果目标位置 `mods/XXX/XXX.js` 已经存在（例如插件之前已迁移过，之后又在根目录放了一份同名文件），迁移时就会报此错误。处理方法：直接删除根目录下重复的 `XXX.js`；如果要用新文件替换旧插件，请先删掉或清空旧的 `mods/XXX` 目录，再重启服务器。迁移完成后需再重启一次，插件才会加载。

*适用版本：LSE 0.x 至当前（0.23.x）；0.23.0 起 `plugins/` 是指向 `mods/` 的链接*

## LSE 加载旧插件时报错，提示事件 `onEnderDragonDestroy` 不存在（旧版为 `Event "onEnderDragonDestroy" No Found!`，新版为 `Event onEnderDragonDestroy not found!`），怎么办？

LSE 已移除 `onEnderDragonDestroy` 事件，出现此报错是因为插件作者尚未跟进更新。该报错仅表示此事件监听未生效，不影响其他功能，可以忽略。如果不想看到报错，可以把插件代码中监听该事件的 `mc.listen("onEnderDragonDestroy", ...)` 注释掉。

*适用版本：LSE 0.6.x 至当前（0.23.x）*

## LSE 控制台出现 `WARN [legacy-script-engine-quickjs] Could not find menu in registered commands.` 是什么原因？

这条警告来自 LSE 的命令执行回调：执行命令时，LSE 会进入最后一次对该命令调用 `setCallback` 的插件所在的引擎，并在该插件自身的 `registeredCommands` 中查找该命令的参数注册信息（由 `mandatory`、`optional`、`setEnum`、`overload` 等调用记录）。如果找不到，就会输出 `Could not find menu in registered commands.`，且不执行命令。常见原因包括命令冲突（例如两个插件都注册了 `menu`，此时注册阶段控制台通常会有 `Runtime command menu already exists...` 警告），或某个插件只对该命令调用了 `setCallback` 而未注册参数或重载。请检查并移除重复注册该命令的插件，或确认插件在调用 `setCallback` 前已调用 `overload` 等注册函数。

*适用版本：当前所有 LSE 版本（至 0.23.x）。未能从源码或文档中直接证实，仅供参考。*

## LSE 插件用 `pl.setSidebar` 设置的侧边栏中，出现了玩家 ID/名字而不是配置的内容，怎么解决？

一个可能的原因是计分板 ID 冲突：LSE 的 `setSidebar` 在发送 `SetScorePacket` 时，会直接把每一行的计分值用作 `mScoreboardId`。这可能会与客户端中已有的真实计分板条目（例如玩家的计分 ID）冲突，从而显示为玩家名。可尝试删除存档中的所有计分板，或调整各行的计分值来验证；若确认是此问题，可向 LSE 提交 issue。

*适用版本：当前 LSE 版本（至 0.23.x）。未能从源码或文档中直接证实，仅供参考。*

## LSE 插件热重载（如 `ll reload`）后，数据库查询和插入正常，但更新和删除失效，怎么办？

不建议热重载 LSE 插件。热重载后，插件持有的数据库连接（`DBSession`）等资源状态可能出现异常。直接重启服务器即可。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 服务器在玩家重生等涉及 NBT 的操作时崩服（崩溃与 CompoundTag/NBT 有关），原因是什么？

LSE 的 `NbtCompound` 内部要么通过 `unique_ptr` 持有 `CompoundTag`（拥有所有权），要么仅持有裸指针（借用）。如果某个 tag 通过 RemoteCall 导出给其他插件后，被对方销毁或转移了所有权，LSE 再次访问时就会崩溃。因此，外部插件不应销毁 LSE 导出的任何对象。实际案例中，旧插件 `StillHungry.lls`（用于在玩家死亡后保持饥饿值，直接修改 NBT）会在玩家重生时触发崩服，卸载该插件即可解决。若自行重写该功能，请注意饥饿值（hunger）和饱和度（saturation）是两个不同的属性。

*适用版本：LeviLamina + LSE 当前版本*

## LSE 的 QuickJS 插件使用 `import` 语法时报错（如 `Failed to load plugin xxx: expecting '('` 之类的语法错误），而插件路径和代码看起来都没问题，可能是什么原因？

已知当 BDS（服务端）路径中含有中文时，QuickJS 引擎（`legacy-script-engine-quickjs`）的 `import` 会出错。将 BDS 和插件放到纯英文路径下即可。无论出于什么原因，都建议服务端和插件路径不要包含中文。

*适用版本：LegacyScriptEngine QuickJS 引擎，当前所有版本（相关 issue 仍未关闭）*

## LSE 的 Node.js 插件中使用 `node-fetch` 报 `fetch` 未定义/导入失败，但同样代码直接用 node 运行没问题，怎么办？

`node-fetch` 3.x 仅提供 ES Module，在 CommonJS 插件中通过 `require` 引入会失败。可选方案：

1. 将依赖改为 `node-fetch ^2.6.7`（CommonJS 版本）。
2. 在插件的 `package.json` 中添加 `"type": "module"`，让插件以 ESM 方式加载，再用 `import` 引入 `node-fetch` 3.x（LSE 自 0.10.6 起支持 Node.js ESM 插件）。
3. LSE 目前内置 Node.js v22.12.0，可直接使用全局 `fetch`，或使用内置的 `http`/`https` 模块。
4. 使用 LSE 自带的网络接口（如 `network.httpGet`）。

此外，在插件目录的 `package.json` 中声明 `dependencies` 后，若插件目录下没有 `node_modules`，LSE 加载插件时会自动执行 `npm install --omit=dev` 安装依赖。

*适用版本：LegacyScriptEngine Node.js 引擎；ESM 方案需 LSE 0.10.6 及以上*

## LSE 的 Node.js 插件加载报错（读取 JSON 失败 / 缺少 `libnode.dll` / npm 执行失败等）怎么排查？

若报错提示读取 JSON 文件失败，通常是某个 Node.js 插件目录下的 `package.json` 等 JSON 文件格式有误，需逐一检查各 nodejs 插件的 JSON 文件。若提示缺少 `libnode.dll`，说明 Node.js 运行时未安装完整：`libnode.dll` 等文件应位于 `mods/legacy-script-engine-nodejs/` 目录下。建议使用 lip 安装 Node.js 引擎（`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`），lip 会同时下载引擎本体和 `node-prebuilt` 运行时，确保文件完整。若问题依旧，可能是服务端文件本身损坏，可新建一个干净的服务端重新安装。

*适用版本：LegacyScriptEngine Node.js 引擎，LeviLamina 1.x（`mods` 目录）及以后*

## LSE 适配 LeviLamina 26.60 后，调用 `logger.setConsole` 的脚本插件导致服务器崩溃，且 `latest` 日志来不及写入，怎么处理？

这是 LSE 0.23.0 中 `logger.setConsole` 实现的 bug（向需要 `string_view` 的参数传入了 0，导致空指针崩溃），已在 LSE 0.23.1 中修复，升级到 0.23.1 或更高版本即可。若暂时无法升级，可在插件目录中搜索并注释掉所有 `setConsole` 调用。崩溃时 `latest` 日志为空，是因为崩溃发生得太早，日志来不及写入。另外请注意：`logger.setTitle` 会重新获取或创建一个新的 logger，因此应先调用 `setTitle`，再调用 `setConsole`、`setFile`、`setPlayer`、`setLogLevel`，否则之前的设置会失效。

*适用版本：LegacyScriptEngine 0.23.0（崩溃）；`setTitle` 调用顺序注意事项适用于当前版本*

## LSE JS 插件导致服务器崩溃（生成 minidump/trace 日志），最后排查出与注册命令有关，原因是什么？

原因是插件在注册命令（如调用 `mc.newCommand`）时，命令名中包含了大写字母。LSE 要求命令名（以及除 `String`、`RawText`、`Message` 等可变参数外的命令内容）全部使用英文小写字母，改为全小写即可解决。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE（QuickJS）插件导致崩溃但日志没有任何有用信息，如何调试定位？

LSE 的 release 压缩包已自带各引擎的 pdb 调试符号（如 `legacy-script-engine-quickjs.pdb`），安装后与 dll 同在 `mods/legacy-script-engine-quickjs/` 目录下。先确认 pdb 与所用 dll 版本一致，若不一致，请从 <https://github.com/LiteLDev/LegacyScriptEngine/releases> 下载对应版本的压缩包提取 pdb。随后用 Visual Studio 调试器附加到 `bedrock_server.exe` 进程，复现崩溃即可看到带符号的调用栈。在示例案例中，最终定位到问题出在通过 LegacyRemoteCall 传入的 `CompoundTag`（NBT）对象被提前销毁。

*适用版本：LegacyScriptEngine 当前版本（pdb 随 release 压缩包分发）*

## LeviLamina + LSE 开服正常，但玩家一进服服务器就崩溃，崩溃日志在哪？之前装过多维度插件会有影响吗？

崩溃日志位于服务端目录的 `logs/crash` 下，包含 `minidump_<时间>.dmp` 和 `trace_<时间>.log` 两个文件，求助时请一并提供。本例的原因是：服务器此前装过自定义维度（多维度）插件，存档中保留了自定义维度数据；卸载插件后，玩家下线时所在的维度已不存在，再次进服时便会触发崩溃。将多维度插件装回即可恢复（或者先让玩家离开自定义维度，再卸载插件）。

*适用版本：LeviLamina 当前版本；多维度部分适用于使用过 MoreDimensions 等自定义维度插件的存档。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina + LSE 环境下服务器一启动就崩溃（删掉其他模组也无效），可能是什么原因？

常见原因是 LSE 的 Python 引擎（`legacy-script-engine-python`）与系统环境冲突：当系统中另行安装了 Python 且已加入 `PATH` 时，Python 引擎可能无法加载、报出一长串错误，甚至直接导致服务器崩溃。如果不使用 Python 插件，卸载 Python 引擎即可（删除 `mods/legacy-script-engine-python` 目录，或用 lip 卸载 `LegacyScriptEngine#python` 变体）；如果需要使用 Python 插件，请确保系统 Python 版本与引擎内置版本一致（当前为 3.12.10），或将系统 Python 从 `PATH` 中移除。排查时请查看 `logs/crash` 下的 trace 日志以确认崩溃点。

*适用版本：安装了 LSE Python 引擎的 LeviLamina 服务器（当前所有版本，具体是否冲突视用户环境而定）。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器每隔一两个小时随机崩服，崩溃日志每次都不一样，其中有堆栈指向 LeviLamina 的关卡 tick 事件 hook（旧版为 `ll::event::world::LevelTickEventHook::detour`），删插件、换新存档都还会崩，怎么排查？

实际案例中，罪魁祸首是一个老旧的 JS 自动备份插件：它在服务器运行期间直接读取存档目录并调用 7z 压缩，引发空指针崩溃，因此调用栈看起来像是 tick 事件出错，且每次报错位置都不相同。换用 BackupHelper 这类遵循 BDS 正常备份流程（`save hold`/`query`/`resume`）的备份插件后，服务器即恢复正常。经验总结：切勿在服务器运行时直接复制或压缩存档；定时任务建议通过插件而非命令方块实现。

*适用版本：LeviLamina 1.x 及以上，使用运行时直接复制存档的第三方备份插件的服务器。未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器崩溃，CrashLogger 的 trace 日志显示崩溃于 LSE 的 `data.toJson`（堆损坏），如何排查？

崩溃发生在 LSE 的 `data.toJson` 调用处且伴随堆损坏，说明有脚本插件向 `data.toJson` 传入了异常数据。请在插件目录中全局搜索 `data.toJson`，找出调用该接口的插件，禁用或修复后观察是否还会崩溃。求助时请附上 `logs/crash` 下的 `trace_*.log` 和 minidump。

*未能从源码或文档中直接证实，仅供参考。*

## LeviLamina 服务器运行中崩溃，崩溃文件在哪里？如果 trace 日志显示是死循环/栈溢出，与 JS 插件监听 `onExperienceAdd` 有关，应如何排查？

崩溃文件位于服务器目录的 `./logs/crash` 下，包含 `minidump_*.dmp` 和 `trace_*.log`，求助时请将两个文件一并发送。本例中 trace 日志显示发生了死循环：某个 JS 插件监听了 `onExperienceAdd` 事件，又在回调里再次给玩家增加经验（例如调用 `player.addExperience`），从而反复触发同一事件，无限递归直至栈溢出崩溃。排查方法：用 VSCode 等编辑器在插件目录（`plugins/`，即 `mods/`）中全局搜索文件内容（而非文件名）“onExperienceAdd”，找出监听该事件的插件（本例中是一个 VIP 经验翻倍脚本），将其卸载或修复逻辑（避免在回调中再次触发同一事件，例如加上防重入标记，或改为直接修改/拦截原事件）。

*适用版本：当前所有版本（LeviLamina + CrashLogger + LSE）*

## LeviLamina 服务端（如 Windows Server、或用机器人程序启动时）一启动就闪退/频繁崩溃，已装 VC++ 运行库，该看哪个日志、怎么排查？

求助时应提供 `logs\crash\` 下的 `trace_xxx.log` 和 `minidump_xxx.dmp`，而非 `LeviLamina-latest.log`。此类启动崩溃大多是因为 LSE 的 Python 引擎（`legacy-script-engine-python`）与系统已安装的 Python 环境冲突。若不使用 Python 插件，直接删除 `mods` 目录下的 `legacy-script-engine-python` 文件夹（或用 lip 卸载 `LegacyScriptEngine#python` 变体）；若需要使用 Python 插件，则将系统 Python 版本调整为与引擎一致（3.12.10），或将其移出 `PATH`，二者择一即可。

*适用版本：LeviLamina + CrashLogger，安装了 LSE Python 引擎的服务器（当前所有版本）。未能从源码或文档中直接证实，仅供参考。*

## 同一个版本的 LegacyScriptEngine（LSE），为什么有些插件加载成功、有些插件加载失败？

LSE 按语言拆分为多个引擎，需分别排查：

1. Node.js 引擎需通过 lip 安装（`lip install github.com/LiteLDev/LegacyScriptEngine#nodejs`），lip 会一并下载 Node 预编译运行库。若无法使用 lip，可从 <https://github.com/LiteLDev/node/releases> 手动下载对应版本的 `node-prebuilt.zip`（当前为 v22.12.0），解压后将内容放入 `mods/legacy-script-engine-nodejs/` 目录。
2. Python 引擎要求系统安装对应版本的 Python（LSE >=0.16.2 需 Python 3.12.10）。
3. 若报缺少符号（`missing symbol`），说明 LeviLamina 与 LSE 版本不匹配，需安装 LSE 所要求的 LeviLamina 版本（LSE 0.23.x 需搭配 LeviLamina 26.60.*）。

*适用版本：LSE 0.16.2 及以上（当前 0.23.x）*

## 装好 LeviLamina 和 LSE 后启动，控制台弹出一堆报错然后窗口直接消失，怎么办？

有用户排查发现是 LSE 的 Python 引擎（`legacy-script-engine-python`）所致，移除后服务器即可正常启动。Python 引擎依赖系统中安装的特定版本 Python（当前 LSE 要求 Python 3.12.10），环境不匹配便可能导致启动失败。如果不需要运行 Python 插件，直接卸载该引擎即可（删除 `mods/legacy-script-engine-python` 目录或用 lip 卸载）。

*适用版本：安装了 LSE Python 引擎的服务器。未能从源码或文档中直接证实，仅供参考。*

## 崩溃日志显示 BDS 内部读取 `ItemStack` 时出错（疑似 `ItemStack` 被提前释放），会是 LSE 的 JS 插件导致的吗？

通常不是。LSE 脚本中物品对象（`Item`）底层的 `ItemStack` 由 LSE 本体或 BDS 负责管理，脚本无法直接将其释放。遇到此类 `ItemStack` 生命周期问题，应优先排查原生（native/C++）mod。

*适用版本：LeviLamina + LSE 当前版本（经验判断）。未能从源码或文档中直接证实，仅供参考。*

## 开服时 LSE 报错 `Fail to import! Function [LLSEGlobal::LoginAPI] has not been exported!`，这是什么原因？

某个脚本插件通过远程调用 `ll.imports("LLSEGlobal", "LoginAPI")` 导入其他插件导出的函数，但负责导出该函数的前置插件（此处为登录类插件）未安装或未成功加载，也可能是因加载顺序问题导致导入时该函数尚未导出。

在 `plugins` 目录中全局搜索字符串 `LoginAPI`，找出导入或导出该函数的插件，然后安装或修复其依赖的前置插件即可。

## 开服时出现与 `config.reload()` 相关的 JSON 解析报错，但没指出是哪个 LSE 插件，如何排查？

这通常是因为某个插件的 json 配置文件为空或已损坏，导致 `JsonConfigFile` 调用 `reload()`（内部使用 JSON 解析器读取文件）时解析失败并抛出异常。

可以编写脚本扫描 `plugins` 目录下的所有 `.json` 文件，找出解析失败的文件（重点留意大小为 0 的空文件），修复或删除对应的配置文件（若是数据文件请先备份）后再重启服务器。

## 把 LeviLamina 服务端放在磁盘根目录运行时，LSE 插件用 `./` 相对路径写入文件失败，是什么原因？

普通用户在磁盘根目录（尤其是系统盘 `C:\`）下没有写入权限，因而导致写入失败。将服务端移至普通文件夹中运行即可。

*适用版本：Windows，当前版本。未能从源码或文档中直接证实，仅供参考。*

## 服务器一有玩家进入就刷屏“该指令引用了0x%P的内存,该内存不能为%s”，一段时间后崩服，怎么解决？

这本质上是内存访问越界（访问违规），原因可能有很多：加载了与当前版本不匹配的 mod、mod 之间不兼容、缺少前置、mod 本身的 bug 或 Mojang 的 bug 等。曾有案例是因为 LegacyScriptEngine 版本过旧，更新到与当前 BDS/LeviLamina 匹配的 LSE 版本后即得以解决。

排查方法：

1. 确认 BDS、LeviLamina、LSE 及各 mod 的版本相互对应。
2. 用二分法逐批移除 `plugins` 目录下的 mod 或脚本插件，定位问题来源（脚本插件可通过其 `manifest.json` 中的 `type` 是否为 `lse-*` 来区分）。

*适用版本：当前版本（通用排查思路）。未能从源码或文档中直接证实，仅供参考。*

## 服务器后台加载旧插件时报错（涉及 LegacyAddonsManager、CustomMap、BehaviorLog.lxl.js），怎么处理？

- LegacyAddonsManager 已停更归档，不再维护，请勿继续使用（可自行 fork 适配，或手动及使用其他工具管理 addon）。
- CustomMap 版本不匹配，需更换为与当前版本匹配的版本。
- BehaviorLog 插件已不兼容，请删除 `plugins/BehaviorLog.lxl.js`。

*适用版本：LeviLamina 当前版本*

## 服务器启动时一直卡在加载 Lua 引擎（LSE lua）不动，重试几次有时能过，怎么解决？

这通常是某个 mod 缺少依赖所致，请检查各 mod 的依赖是否齐全。

如果没有使用 Lua 插件，可以直接删除 LSE 的 Lua 引擎（`plugins/legacy-script-engine-lua`）。

*适用版本：LeviLamina 与 LSE 当前版本。未能从源码或文档中直接证实，仅供参考。*

## 服务器启动时多个 LSE 脚本插件报错 `[json.exception.parse_error.101] parse error at line 1, column 1: syntax error while parsing value - unexpected end of input`，同时出现 LevelDB `IO error: fwrite failed` / `database or disk is full`，而自己没有改过配置，怎么办？

这是因为插件的 JSON 配置文件或数据文件已损坏（如变成空文件、丢失顶层 `{}` 或 `[]`），通常由服务器意外关机、断电、磁盘写满或服务商迁移导致数据未写完。

请先清理磁盘空间，然后删除损坏的 JSON 配置文件，让插件重新生成默认配置后再启动；如需手动编辑，请确保文件保存为 UTF-8 编码且 JSON 语法正确。

注意：部分 JSON 文件是数据文件，直接删除会丢失数据，最好从备份恢复；存档（LevelDB）损坏也只能从备份恢复。该问题最早见于 LiteLoaderBDS，在 LSE 中同样适用。

## 服务器安装了 LSE Python 引擎后，部分玩家客户端进服就提示“破损的数据包”（`server sent broken packet`）/崩溃，原因是什么？

这是已知问题（LegacyScriptEngine issue #103，截至目前仍未关闭）：服务器启用“客户端区块生成”（BDS `server.properties` 中的 `client-side-chunk-generation-enabled`）时，会与 LSE Python 引擎（`legacy-script-engine-python`）冲突，导致玩家进服时提示 `server sent broken packet`（破损的数据包）；关闭该选项或不安装 Python 引擎即可正常进服。

规避方法：在 `server.properties` 中设置 `client-side-chunk-generation-enabled=false`，或暂时不使用 Python 引擎。

*适用版本：使用 LSE Python 引擎的服务器（issue 最初报告于 LSE 0.6.2 / BDS 1.20.72，最新版本未见修复记录）*

## 装了 GMLIB 和 iLand 等脚本插件后服务器崩溃，trace 日志显示在加载 JSON 配置文件时崩溃，怎么排查？

这是因为某个插件在加载 JSON 数据或配置文件时出错，通常是该插件的 JSON 数据文件已损坏（格式无效）。请检查各插件的 json 配置和数据文件，修复或删除损坏的文件即可。

若无法自行定位，可在 GitHub 提交 issue，并附上崩溃日志和 dmp 文件供开发者调试。

*适用版本：当前版本（涉及第三方插件）。未能从源码或文档中直接证实，仅供参考。*

## 服务器装了 LSE 引擎和领地插件 iLand 后，玩家一挖方块、一打动物控制台就报错，怎么解决？

报错来自与 iLand 配套的 iLandHelper 插件（与当时的 LSE 不兼容），删除 iLandHelper 即可。

通用排查原则：根据报错堆栈中的插件名称找到出错插件，将其移除或更换。

*适用版本：使用 iLand / iLandHelper 第三方插件的服务器。未能从源码或文档中直接证实，仅供参考。*
