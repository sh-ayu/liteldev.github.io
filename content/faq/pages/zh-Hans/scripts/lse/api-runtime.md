# LegacyScriptEngine API：引擎、模块与定时器

## LSE（LegacyScriptEngine）脚本插件还需要调用 `ll.registerPlugin` 注册插件吗？文档里搜不到，插件名称、版本等信息在哪里设置？完整 API 定义在哪找？

不需要。LSE 插件的信息（`name`、`version`、`author`、`description`、`entry`、`type` 等）写在插件目录的 `manifest.json` 中，加载时会自动注册。`ll.registerPlugin` 已弃用并从 LSE 文档中删除，保留下来只是为了兼容旧的 LLSE 插件：它只负责检查参数类型，并在传入的版本与 manifest 不一致时把参数写回 `manifest.json`，没有其他作用。若参数类型不对，该函数会抛出异常；如果未捕获，插件后续代码将不再执行。此外，插件加载阶段抛出的异常可能不会在控制台输出任何报错（见仍未关闭的 <https://github.com/LiteLDev/LegacyScriptEngine/issues/240>），因此建议直接删掉该调用。

完整的 API 类型定义（包括 `File` 等类）见 <https://github.com/LiteLDev/legacy-script-engine-api>。

*适用版本：LSE 当前所有版本（LeviLamina 下）*

## LSE 中如何获取服务器当前 TPS？用 `onTick` 计算为什么会大于 20？

LSE 本身没有获取 TPS 的 API，可用 `mc.listen("onTick", ...)` 自行统计：每次 tick 将计数器加一，每秒读取并清零即为 TPS（正常为 20）；也可以统计执行 20 个 tick 的耗时再做除法。偶尔算出 21 这类大于 20 的值是正常的——BDS 若在一秒内没跑完 20 个 tick，会在下一秒补跑，而且计时误差也会造成偏差。实现方式可参考 MineBBS 上的 ShowTPS 插件：<https://minebbs.com/resources/showtps-tps.8950/>。MSPT 是每 tick 耗时，可由此推算出 TPS。

此外，也可以安装第三方前置 GMLIB 及其 LegacyRemoteCallApi（LRCA），在 JS 中导入后直接调用 `Minecraft.getServerCurrentTps()`，省去执行命令并解析输出的步骤。如果要在 TPS 过低时清理实体，在脚本中遍历 `mc.getAllEntities()` 性能一般，直接调用 `mc.runcmd("kill @e[type=!player,...]")` 往往开销更小。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本；GMLIB/LRCA 方案需安装对应第三方前置*

## LSE 的 JS 插件（QuickJS 引擎）里使用 `console.log` / `console.error` 报错，应该用什么输出日志？

QuickJS 引擎环境没有 `console` 对象，只有 Node.js 引擎的插件能用 `console.log`。QuickJS 插件请改用 LSE 提供的 `log()` 或 `logger` API（如 `logger.info`、`logger.warn`、`logger.error`），详见 <https://levimc.org/zh-Hans/LegacyScriptEngine/> 的 ScriptAPI → Logger 页面。

*适用版本：LSE QuickJS 引擎当前所有版本*

## LSE 的 JS 插件能否把“子插件/扩展”放在自己的子文件夹里，由主插件去加载？

子文件夹里的脚本无法作为独立的 LSE 插件注册（每个插件都必须放在 `plugins` 下的独立目录中，并配有自己的 manifest）。要实现“插件的插件”，只能在主插件里自行实现加载器：通过 CommonJS（`require`）或 ES Module 将扩展作为模块引入。模块内仍可直接使用 LSE 的全局 API，扩展则通过导出函数或对象来共享功能。关于扩展的加载、卸载与重载实现，可参考 UMenu（<https://github.com/engsr6982/lse-workspace/tree/main/projects/UMenu>）。

注意避免循环依赖（被加载的文件不要反过来 `require` 主文件），必要时可改用 ESM。如果不做自定义加载器，就将各个插件分别放到 `plugins` 目录下作为独立插件运行。

*适用版本：LeviLamina + LSE 当前版本*

## 编写 LSE 的 JS/TS/Node.js 插件时，`mc`、`logger`、`PermType`、`ParamType`、`Player` 等需要从什么模块 import？类型定义怎么引入，Player 类能在运行时访问或继承吗？

不需要 import。LSE 会将 `mc`、`logger`、`ll`、`PermType`、`ParamType` 等 API 作为全局对象注入（Node.js 插件同样如此），直接使用即可；调用其他插件导出的函数则使用 `ll.imports`（远程调用）。类型提示同样应声明为全局，官方类型库见 <https://github.com/LiteLDev/legacy-script-engine-api>（含 JS/TS 与 Python）。

文档中的 `Player` 等类名在运行时并不存在，引擎实际注册的类名带有 `LLSE_` 前缀（如 `LLSE_Player`），直接访问 `Player` 会得到 `undefined`；这些类也没有可用的构造函数，因此无法继承。API 文档见 <https://levimc.org/zh-Hans/LegacyScriptEngine/apis/>。

*适用版本：LSE 当前版本*

## LSE Python/JS 插件里用 `time.sleep` 或 `while True` 死循环做倒计时/循环延迟执行命令，为什么会卡服？该怎么写？

脚本插件在 BDS 主线程中运行，在回调里调用 `time.sleep` 或跑不退出的死循环会阻塞整个服务器。周期性任务应改用 LSE 提供的跨语言定时器 `setTimeout` / `setInterval`（Python 中同样可用），结束时调用 `clearInterval`；显示标题可直接调用 `pl.setTitle`，不必执行 `title` 命令。JS 示例：

```js
let delay = 5000;
let task = setInterval(() => {
  player.setTitle(`${delay / 1000}`, 4, 1, 2, 1);
  if (delay <= 0) {
    player.setTitle('新年快乐', 4, 0, 1, 0);
    clearInterval(task);
  }
  delay -= 1000;
}, 1000);
```

*适用版本：LSE 当前所有版本*

## LSE 插件里能用 Script API（addon，`@minecraft/server`）的 `serverApi`、`world.getDimension()`、`origin.teleport()`、`server.on` 之类的写法吗？

不能。LSE 插件与 Minecraft 官方 Script API（SAPI，`@minecraft/server`）是两套完全不同的 API，不能混用，也不要直接照搬 AI 生成的 SAPI 代码。LSE 中没有 `serverApi`、`playerApi`、`worldApi`、`world.getDimension` 这类对象：监听事件用 `mc.listen(事件名, 回调)`，输出日志用 `logger.log`，传送玩家用 Player 对象的 `pl.teleport(...)` 或通过 `mc.runcmd` 执行 `tp` 命令。请对照 LSE 文档 <https://levimc.org/zh-Hans/LegacyScriptEngine/>（API 参考）编写代码，编辑器类型提示可使用 `legacy-script-engine-api`。

*适用版本：当前所有 LSE 版本*

## LSE 的 Python 插件中给事件回调参数写类型注解时，用 `player: Player` 不生效（报未定义），应该怎么写？

LSE 向脚本引擎注册的类名带有 `LLSE_` 前缀，Python 环境中的玩家类名为 `LLSE_Player`，不存在名为 `Player` 的类。因此类型注解应写成 `player: LLSE_Player`（其他类同理，如 `LLSE_Item`、`LLSE_Block` 等）。如需在 IDE 中启用代码补全，可使用 `LiteLDev/legacy-script-engine-api` 仓库下 `platforms/python` 提供的类型提示。

*适用版本：LegacyScriptEngine Python 后端（legacy-script-engine-python）当前版本*

## LSE 的 TypeScript 类型补全库里，`LLSE_Player` 这类带前缀的类名和 `Player` 这类无前缀的类名有什么区别，该用哪个？

在类型补全库中，带 `LLSE_` 前缀的类都继承自对应的无前缀类（如 `declare class LLSE_Player extends Player {}`）；保留无前缀类名是为了避免引入不兼容变更。TypeScript 采用结构化类型（按形状匹配），两者可以互换传递，按个人喜好选用即可。注意这只是类型声明层面的区别，运行时引擎实际注册的类名是 `LLSE_Player`。该补全库现为 `LiteLDev/legacy-script-engine-api`（`platforms/javascript`）。

*适用版本：legacy-script-engine-api（原 HelperLib）当前版本*

## LSE（脚本插件）里的 `setTimeout` 第二个参数是 tick 还是毫秒？怎么写？

第二个参数是毫秒。用法为 `setTimeout(func, msec)`，其中 `func` 可以是匿名函数、箭头函数或已定义的函数引用，调用后返回任务 ID（可用 `clearInterval` 取消）；也支持通过 `setTimeout(code, msec)` 传入代码字符串。需要周期性执行时，请使用 `setInterval(func, msec)`。

注意，`setTimeout` 只是延后执行，回调仍在服务器主线程中运行，耗时逻辑不会因此变成异步。

## LSE JS（QuickJS）插件中入口文件 `import` 子模块正常，但子模块再 `import` 其他文件（嵌套 `import`）就报错，路径该怎么写？

LSE 的 QuickJS 模块加载器在加载 `manifest.json` 指定的入口模块时，会将 base path 设为当前工作目录（即服务器程序所在目录），而非脚本所在目录。因此，入口文件里的导入路径必须从服务器根目录写起，并带上 `.js` 后缀，格式为 `./plugins/<你的插件>/xxx.js`，例如 `import { initCommand } from "./plugins/your_plugin/command/command.js"`。

这个问题只影响入口模块。被入口模块导入的其他模块之间相互 `import` 时，会按标准 ES Module 规则解析路径（即相对于当前模块自身的位置），因此子模块内应使用相对于自身的相对路径，不要再从 `./plugins` 写起。

*适用版本：LSE QuickJS 引擎 0.23.x*

## LSE 中 `ll.getPluginInfo()` 返回 `undefined`，导致依赖它做安全检查的旧插件（如 TMEssential）失败，为什么？

在 LSE 中，插件信息以插件目录下的 `manifest.json` 为准。`ll.getPluginInfo(name)` 按插件（mod）名称查找，该名称即 `manifest.json` 中的 `name` 字段。旧版单文件插件迁移后，插件名是去掉 `.js` 后缀的文件名，因此调用时传入的名称不能带 `.js` 后缀。

`ll.registerPlugin` 仅为兼容旧插件而保留，不再作为插件信息的来源；它只会在版本号与 manifest 不一致时，将描述、版本和附加信息回写到 `manifest.json`。依赖 `registerPlugin`/`getPluginInfo` 做安全检查的旧插件需要按上述规则修改代码。

## LSE 中 `setTimeout`/`setInterval` 的参数是毫秒，但底层按游戏刻调度，会不会有精度问题？为什么不用系统时间/线程计时？

LSE 的 `setTimeout`/`setInterval` 通过 LeviLamina 协程（`ll::coro`）在 `ServerThreadExecutor` 上调度：传入的毫秒数会向上取整为游戏刻（1 tick = 50ms），并在服务器每次 Level tick 时执行到期任务。因此实际精度为一个游戏刻，且在服务器卡顿（TPS 下降）时会相应延后，这与 LL2 的行为一致。

之所以不用独立线程按系统时间计时，是因为 MC 接口只能在游戏主线程中调用，回调必须回到服务器线程执行。

## LSE 中用 `jsdebug` 进入 JS 调试模式后如何退出？以及如何获取玩家的 IP？

再次输入 `jsdebug` 即可退出调试模式（Lua 为 `luadebug`，Python 为 `pydebug`；Node.js 没有调试模式）。能否在游戏内使用该命令取决于 LSE 配置文件 `config.json` 中的 `debugCommandLevel` 项，默认为 GameDirectors（OP）。

获取玩家 IP 可使用 `pl.getDevice().ip`（返回 IP:端口），或直接读取 `pl.ip` 属性（返回不带端口的地址）。

## LSE 中对 player 对象做解构（`const {name, xuid, getExtraData} = player`）后调用 `getExtraData` 报错 `不可以将值转换为对象`，为什么？

对于 LSE 引擎提供的对象，`name`、`xuid` 等属性可以直接解构取值；但方法是绑定在实例上的原生 `instanceFunction`，解构后单独调用会丢失 `this` 上下文（不再指向 Player 实例），从而触发报错。请改用 `player.getExtraData(...)` 或 `getExtraData.call(player, ...)` 的方式调用。

*适用版本：LSE 当前所有版本*

## LSE 中导入其他插件导出函数应该用 `ll.import` 还是 `ll.imports`？文档写的是 `ll.imports`，但调用失败。

官方 API 是 `ll.imports(namespace, name)`（返回一个可调用函数），配合 `ll.exports` 使用。LSE 在 JS 和 Lua 的 baselib 中定义了兼容别名 `ll.import = ll.imports`，两者完全等价（Python 中 `import` 是关键字，只能用 `ll.imports`）。

调用失败通常不是写法问题，而是因为目标插件尚未加载、未导出该函数，或者 `namespace`、`name` 拼写有误。可用 `ll.hasExported(namespace, name)` 进行检查。

*适用版本：LSE 当前所有版本*

## 在 LSE 中用 `system.cmd` 执行外部命令（例如 7z 压缩）时回调不触发或拿不到返回值，怎样判断是否成功？

`system.cmd(cmd, callback[, timeLimit])` 的回调必须等 shell 进程结束后才会执行；如果命令中用 `start` 另起了进程，就无法判断它何时结束。

可以改用 `system.newProcess(process, callback[, timeLimit])` 直接运行外部程序，在回调 `function(exitcode, output)` 中根据 `exitcode` 和输出判断是否成功。注意回调必须传入函数（例如匿名函数 `(exitcode, output) => {...}`），不要写成函数调用。

*适用版本：LSE 0.23.x*

## LSE 插件能否获取 / 拦截 BDS 控制台输出的所有信息？

不能。LSE 早期版本的控制台输出事件已被移除，而 `system.cmd` 只能获取所执行系统命令的输出，无法捕获 BDS 控制台日志。如需捕获控制台输出，需要编写原生（C++）mod 来 hook 输出函数。

## LSE 的 JS 插件里可以用 `require` / `module.exports` 这种 CommonJS 写法吗？还是要用 `import` / `export`？

这取决于所使用的引擎：

- Node.js 引擎（`#nodejs` 变体）：默认按 CommonJS 加载，支持 `require` / `module.exports` 以及 `require` npm 依赖；如果在插件的 `package.json` 中设置 `"type": "module"`，则会按 ES 模块加载，需使用 `import` / `export`。
- QuickJS 引擎：原生支持 ESModule，入口文件以 ES 模块方式加载，应使用 `import` / `export`。QuickJS 不提供 CommonJS 的 `require` / `module.exports`，也不支持 npm 包管理。注意，QuickJS 入口模块中的相对 `import` 路径是以服务器工作目录（BDS 所在目录）为基准解析的，例如需写成 `import { x } from "./plugins/your_plugin/command/command.js"`；入口之后其他模块之间的 `import` 行为则符合标准。

*适用版本：LSE 0.10.6 及以上（Node.js ESM 支持自 0.10.6 起）；当前 0.23.x*

## LSE 的 Lua 插件怎么输出日志？和 JS 一样吗？

一样。LSE 各语言共用同一套 API，Lua 中同样可以使用全局函数 `log(...)`、`colorLog(...)` 以及 `logger` 对象（`logger.info` / `logger.warn` / `logger.error` / `logger.debug` / `logger.log` 等），用法与 JS 相同。文档地址：<https://levimc.org/zh-Hans/LegacyScriptEngine/>（日志 API 见其 `apis/ScriptAPI/Logger` 页面）。

## LSE 脚本插件中 `setTimeout` 无法给回调传参，怎么让延时执行的函数带参数？

LSE 提供的 `setTimeout(func|code, ms)` 只接受回调（函数或代码字符串）和延时两个参数，不会将额外参数转发给回调。可以用闭包封装一层，写成 `setTimeout(() => fn(arg1, arg2), ms)`；或者编写一个返回无参函数的包装函数，在内部调用带参函数。

*适用版本：当前版本（QuickJS 等引擎的 LSE 内置 `setTimeout`）*

## LSE（包括 Node.js 引擎）中暴露的类（如表单类）能否被继承或重载？

不能。表单（`LLSE_SimpleForm`、`LLSE_CustomForm`）、玩家、实体、方块、命令等由 C++ 创建的对象类没有向脚本暴露构造函数，因此无法继承，只能自行编写包装（wrapper）。只有少数类暴露了构造函数，如 `IntPos`、`FloatPos`、`DirectionAngle`、各 NBT 类、`JsonConfigFile`、`IniConfigFile`、`KVDatabase` 等。表单方面可参考社区封装，例如 <https://github.com/lgc-LLDev/FormAPIEx>。

## LegacyScriptEngine 的 Node.js 引擎（`legacy-script-engine-nodejs`）写插件时如何添加 npm 第三方依赖？

在插件目录（`mods/<插件名>/`，即 LeviLamina 的模组根目录下）执行 `npm init` 生成 `package.json`，将依赖写入 `dependencies`，并在 `manifest.json` 中将 `"type"` 设为 `"lse-nodejs"`。加载插件时，如果 `package.json` 中声明了依赖且插件目录下尚无 `node_modules`，LSE 会在插件目录下自动执行 `npm install --omit=dev --no-fund`，因此无需打包分发 `node_modules`。旧版做法（将 `package.json` 和源码打包成 zip，改后缀为 `.llplugin` 后放入 `mods` 目录）依然兼容：引擎会将其解压到 `mods/<插件名>/` 并自动生成 `manifest.json`。此外，也可以使用社区脚手架 <https://github.com/leoweyr/legacy-script-engine-scaffold>。

*适用版本：LSE Node.js 引擎（`lip install LegacyScriptEngine#nodejs`）；当前 0.23.x*

## 依赖 `legacy-script-engine-quickjs` 的 JS 插件如何调用 `ffi-napi` 或其他 DLL 库？

QuickJS 引擎不支持 npm 原生模块。可改用 Node.js 引擎（`legacy-script-engine-nodejs`）运行插件，即可使用 `ffi-napi` 等 Node 原生模块。基于 QuickJS 的插件理论上可直接移植到 Node.js 引擎（将 manifest 的 `type` 改为 `lse-nodejs`，并将依赖写入 `package.json`）。Node.js 引擎依赖 `libnode.dll`，现在执行 `lip install LegacyScriptEngine#nodejs` 安装时会自动下载 LiteLDev/node 的预编译包，无需再从官方 QQ 群的群文件中手动获取。

*适用版本：LSE Node.js 引擎；当前 0.23.x*

## 在 LSE JS 插件中能否用 `instanceof` 判断一个参数是否是 `IntPos`？

可以，直接使用 `obj instanceof IntPos` 即可。LSE 文档中称为“类”的对象一般都可以这样判断，只是实际注册的类名不一定与文档中的名称完全一致。

## 在 LSE JS 插件里用 `ll.imports("BEPlaceholderAPI", "registerPlayerPlaceholder")` 直接把回调函数传进去注册 PAPI 变量，结果插件加载失败/报错，正确写法是什么？

跨插件远程调用（RemoteCall）不支持传递函数类型的参数。应先用 `ll.exports`（别名 `ll.export`）导出回调函数，再把命名空间和导出名传给 `registerPlayerPlaceholder`：

```js
const registerPlayerPlaceholderAPI = (papiName, callback, pluginName = "your plugin name") => {
  ll.exports(callback, pluginName, `Placeholder_${papiName}`);
  ll.imports("BEPlaceholderAPI", "registerPlayerPlaceholder")(pluginName, `Placeholder_${papiName}`, papiName);
};
registerPlayerPlaceholderAPI("player_temp", (pl) => `${getTemp(pl)}°C`);
```

该 PAPI 接口由第三方库 GMLIB 提供，其作者更推荐使用新版 PAPI 接口，文档见 <https://github.com/GroupMountain/GMLIB-Release/blob/release/PlaceholderDocs.md>。

*适用版本：LeviLamina；LegacyScriptEngine；LegacyRemoteCall（PAPI 部分取决于第三方 GMLIB 版本）*

## 在 LSE 插件中用 `ll.imports` 导入其他插件导出的函数时报错 `Fail to import! Function [...] has not been exported!`，怎么解决？

通常是调用时机过早，对方插件还没执行 `ll.exports` 导出该接口（也可能是命名空间或函数名写错）。应在服务器启动完成后（例如在 `mc.listen("onServerStarted", ...)` 回调中）再导入和调用，也可以先用 `ll.hasExported(namespace, name)` 检查函数是否已导出。

## 在 LSE 的 Python 插件里用 `open('a.txt','a')` 写文件，没有报错但在插件目录找不到生成的文件，文件写到哪里了？

LSE 不会将脚本的工作目录切换到插件目录，相对路径会相对于 BDS 根目录（即进程工作目录）解析，因此 `a.txt` 会生成在 BDS 根目录下。若要写入插件目录，需使用 `plugins/<插件名>/a.txt` 这样的路径，可借助 `os` 模块（`os.path.join`、`os.makedirs(..., exist_ok=True)`）拼接路径并确保目录存在。另外注意，`open()` 的模式参数必须是字符串（应写 `'a'` 而不是 `a`）。

*适用版本：LSE Python 后端（legacy-script-engine-python），当前版本*

## 在 LSE 插件里用 `logger` 输出到服务器后台（控制台）时，怎样让文字带颜色？用 `§` 颜色代码在后台没有效果。

`§` 格式代码只对游戏内文本有效，LSE 的 `logger` 不会将它转换为控制台颜色。控制台输出需要使用 ANSI 转义序列，直接将转义码拼接到输出字符串中即可：前景色为 `\x1b[30m` ~ `\x1b[37m`（黑/红/绿/黄/蓝/洋红/青/白），背景色为 `\x1b[40m` ~ `\x1b[47m`，`\x1b[0m` 重置样式，`\x1b[1m` 粗体，`\x1b[4m` 下划线等。示例：

```js
logger.info("\x1b[33m黄色文字\x1b[0m")
```

JS 严格模式下不支持八进制转义 `\033`，建议改用 `\x1b` 或 `\u001b`。

## 在 LSE 的 JS 插件里用 `log` 输出字符画（ASCII art），由于字符串中的反斜杠 `\` 被转义导致排版错乱，有什么办法避免转义？

使用 JS 的模板字符串标签 `String.raw`，例如：

```js
log(String.raw`  /\_/\  ...`)
```

这样字符串中的反斜杠就不会被转义（详见 MDN 的 `String.raw` 文档）。也可以将所有 `\` 替换为双反斜杠 `\\`，不过输出字符画时用 `String.raw` 更方便。

*适用版本：LSE JS 后端（QuickJS / Node.js），当前版本*

## 在 LegacyScriptEngine（ScriptX）中，JS 传入的 `undefined` 在 C++ 侧会变成什么？如何区分 `undefined` 和 `null`？

V8 本身区分 `undefined` 和 `null`，但 ScriptX 抽象层将二者统一视为 Null：`Local<Value>::isNull()` 对 `undefined` 和 `null` 均返回 `true`，而 C++ 侧的空 `Local<Value>()` 返回给 JS 时则是 `undefined`。ScriptX 本身没有提供区分二者的方法，若要真正向 JS 传递 `null`，需要直接调用 `v8::Null(isolate)`。因此在实现 API 时，对于可选参数（如 `setTitle` 的 `fadeInTime`、`stayTime`、`fadeOutTime`）应先检查 `isNull`，避免 JS 传入 `undefined` 时出错。

*适用版本：当前版本（ScriptX V8 后端）*

## 如何在服务器控制台快速打印所有已加载 LSE 插件的名称和版本（排查环境用）？

在控制台执行以下命令（需安装 QuickJS 引擎 legacy-script-engine-quickjs）：

```text
jsdebug ll.getAllPluginInfo().forEach(info => logger.warn(`${info.name}: ${info.versionStr}`))
```

注意：`ll.getAllPluginInfo()` 返回的是 LeviLamina 已加载的所有 mod（包括原生 C++ mod），每个元素包含 `name`、`versionStr`、`type` 等字段。

*适用版本：当前版本（QuickJS 后端提供 `jsdebug`；Node.js 后端不支持调试命令）*

## 怎样开始写 LSE 的 Node.js 插件？和 QuickJS 插件有什么区别？

Node.js 插件与 QuickJS 插件使用的 LSE API 相同，区别在于可以通过 npm 引入第三方库（在 `package.json` 中设置 `"type": "module"` 即可使用 ES 模块）。运行此类插件需安装 LSE 的 nodejs 引擎（lip 变体 `LegacyScriptEngine#nodejs`）。

开发：安装 Node.js，新建目录并执行 `npm init` 生成 `package.json`，然后在入口文件中编写代码。

部署：将 `package.json` 和源码（不含 `node_modules`）打包为 zip，将后缀改为 `.llplugin` 后放入 `mods` 目录。开服时，LSE 会自动将其解压到 `mods/插件名`、生成 `manifest.json`，并执行 `npm install` 安装依赖。

类型提示可使用 <https://github.com/LiteLDev/legacy-script-engine-api>（内含 JS/TS 和 Python 的类型定义）。Node.js 后端不提供 `jsdebug` 这类控制台调试命令。

*适用版本：当前版本（LeviLamina，nodejs 引擎）*

## 用 LegacyScriptEngine 开发 JS 插件时如何做多文件（模块化）开发？

若使用 LSE 的 Node.js 引擎（通过 `lip install LegacyScriptEngine#nodejs` 安装的变体），可按标准 Node.js 方式组织多文件：用 `require` 引入模块（CJS），或在 `package.json` 中设置 `"type": "module"` 以 ES 模块方式加载（ESM）。QuickJS 引擎同样原生支持 ESModule 多文件开发，但需注意：`manifest.json` 指定的入口模块中，相对 `import` 路径是以服务器工作目录（BDS 所在目录）为基准解析的，因此必须写成 `"./plugins/你的插件/xxx.js"`；非入口模块之间的 `import` 则符合标准行为。详见 LSE 文档“语言支持”。

*适用版本：LSE 当前版本*

## LSE JS 插件在顶层直接写 `return` 想停止执行，编辑器不报错但加载时报错 `return not in a function`，如何提前结束？

LSE 的 QuickJS 引擎加载插件入口文件时，会先尝试按 ES 模块加载（`loadFile`，`JS_EVAL_TYPE_MODULE`），失败后再按全局脚本执行 eval。这两种方式的顶层都不是函数体，均不允许使用 `return`，否则就会报 `return not in a function`。应将业务代码封装在函数（或 IIFE）中，通过函数内的 `return` 提前结束执行。

*适用版本：LSE QuickJS 引擎，当前所有版本*

## LSE Node.js 插件（如 BetterSidebar）加载失败，日志中 `mkdir` 路径出现盘符重复（如 `E:\...E:\...`），或子插件加载路径变成 `xxx/src/plugins`，是什么原因？

这是因为插件代码使用了 `path.join(process.cwd(), __dirname, 'plugins')`。`__dirname` 本身已经是当前 JS 文件所在目录的绝对路径，再与 `cwd`（BDS 根目录）拼接就会导致盘符重复；而直接去掉 `process.cwd()` 又会使路径指向 `src/plugins`。需要修改插件代码，根据实际目录结构基于 `__dirname` 正确拼接路径（例如 `path.join(__dirname, '..', 'plugins')`）。

如果是缺少依赖：LSE 加载 Node.js 插件时，若 `package.json` 声明了依赖且插件目录下没有 `node_modules`，会自动在插件目录下执行 `npm install --omit=dev`；否则可在插件目录下手动执行 `npm i` 安装。注意，LSE 控制台提供的 `npm` 命令默认工作目录是引擎目录，而非插件目录。

*适用版本：LSE Node.js 引擎，当前所有版本*

## LSE 插件用 `ll.imports` 调用 GMLIB 的悬浮字 API 时报错 `Fail to import! Function [GMLIB_API::...FloatingText...] has not been exported!`（中文日志为“导入失败！函数[...]尚未被导出”），怎么解决？

原因是调用时，负责导出这些函数的前置（GMLIB 及其 LSE 导出模块 GMLIB_API）尚未注册导出——要么前置根本没有加载，要么你的插件在前置加载完成前就调用了导入的函数。LSE 是在实际调用导入函数时才查找导出的（`MakeRemoteCall` -> `RemoteCall::importFunc`），因此报错也发生在调用时。

1. 查看服务器启动日志中的 mod 列表，确认 GMLIB 及其 LSE 导出部分已成功加载。
2. 在插件 `manifest.json` 的 `dependencies` 中声明对 GMLIB（及其导出模块）的依赖，确保你的插件在它们之后加载。

安装好前置并补全依赖声明后，即可正常导入悬浮字 API。GMLIB 为第三方前置。

*适用版本：LeviLamina 当前版本；LSE 当前版本*
