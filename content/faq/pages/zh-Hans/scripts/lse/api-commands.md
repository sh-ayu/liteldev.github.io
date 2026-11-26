# LegacyScriptEngine API：命令

## LSE JS 插件用 `mc.newCommand` 注册命令报错或不生效（旧 LLSE 插件迁移过来也一样），正确写法是什么？必须放在 `onServerStarted` 里吗？

现在不需要把命令注册放进 `onServerStarted`。LSE 自 0.6.0 起支持延迟注册命令：在服务器启动过程中调用 `mc.newCommand` 或 `mc.regPlayerCmd`，LSE 会自动推迟到可注册时再执行。因此，直接写在插件顶层或放在 `onServerStarted` 回调里都可以。早期 LSE（0.6.0 之前）强制要求在 `onServerStarted` 之后注册，这一限制现已取消。

正确写法请参考文档 <https://lse.levimc.org/zh/apis/GameAPI/Command/>：先创建命令对象，再添加重载、设置回调，最后调用 `setup()`。以下写法适用于当前 LSE 0.23.x：

```js
const cmd = mc.newCommand("ping", "网络诊断", PermType.Any);
cmd.overload([]);
cmd.setCallback((_cmd, ori, out, res) => {
  const p = ori.player;
  if (!p) return;
  const d = p.getDevice();
  p.tell(`延迟: ${d.lastPing}ms 丢包: ${d.lastPacketLoss.toFixed(1)}%`);
});
cmd.setup();
```

注意事项：

- 每条命令至少要添加一条重载。无参数命令写 `cmd.overload([])`（在当前实现中，不带参数的 `cmd.overload()` 效果相同）。
- 按文档要求在最后调用 `cmd.setup()`（在当前实现中，实际注册已在调用 `overload` 时完成，`setup()` 主要为兼容而保留，但仍建议按文档书写）。
- 命令名不能包含大写字母或非英文字符：除 String、RawText、Message 等可变参数外，命令中只能使用英文小写字母。
- flag 参数可省略，默认值就是 `0x80`（按文档要求填写即可）；不要照搬 AI 生成的其他写法。

*适用版本：LSE 0.6.0 及以上*

## 基岩版玩家名可以带空格，LSE 插件用 `mc.runcmd` 拼接命令时出错，怎么处理？如何阻止名字带空格的玩家进服？

根本解决办法是在拼接命令时用双引号把玩家名括起来，例如 ``mc.runcmd("say \"" + player.name + "\" test")`` 或模板字符串 ``mc.runcmd(`say "${player.name}" test`)``（`mc.runcmdEx` 同理）。如果是第三方插件出现此问题，应联系作者修复。若需临时拒绝名字带空格的玩家进服，可编写一个 JS 插件：

```js
mc.listen("onPreJoin", (pl) => {
  if (pl.realName.includes(" ")) pl.kick();
});
```

*适用版本：当前所有 LSE 版本*

## LSE 中用 `mc.newCommand` 注册命令后，在 `setCallback` 回调里如何拿到执行命令的玩家对象？直接用 `player.name` 会报错。

命令回调的签名是 `(cmd, origin, output, results)`，参数里没有直接提供 Player，执行者信息存放在 `origin`（CommandOrigin）中。可通过 `origin.player` 获取执行命令的玩家对象，例如 `origin.player.name`。注意 `origin.player` 可能为空（例如由控制台或命令方块执行时），使用前应先判空。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 中不同插件注册命令时使用了同名的枚举（`cmd.setEnum`），会冲突吗？例如插件更新后子命令枚举值被别的插件覆盖（`rank give` 变成 `rank add`）。

会冲突。LSE 的 `cmd.setEnum` 注册的是 BDS 全局运行时枚举，名称不按插件或命令划分命名空间。两个插件使用同名但取值不同的枚举时会互相覆盖，导致命令解析错乱。解决办法是给枚举起全局唯一的名字（如在枚举名前加上插件名前缀）。维护者表示，在 LSE 层面修复此问题需要重做命令注册 API，会导致不兼容旧插件，因此不会修改；原生 C++ mod 的命令带有命名空间，不存在此问题。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE 中 `mc.runcmd` 会每个 tick 自动执行一次吗？想每 tick 执行命令该怎么写？

不会，`mc.runcmd` 调用时只会立即执行一次。若要每 tick 执行，可监听 `onTick` 事件：`mc.listen("onTick", () => { mc.runcmd("...") })`；若需要按固定时间间隔执行，可使用 `setInterval(fn, 毫秒)`。

*适用版本：LegacyScriptEngine 当前所有版本（原为 LLSE）*

## LSE 插件中 `mc.runcmdEx` 执行的命令如果语法错误，会影响插件运行吗？

不会导致插件出错或崩溃。命令编译失败时，`runcmdEx` 仍会正常返回结果对象，其中 `success` 为 `false`，`output` 为错误信息，可据此判断：

```js
const res = mc.runcmdEx(cmd);
if (!res.success) logger.warn(res.output);
```

*适用版本：LegacyScriptEngine 当前版本*

## LSE 脚本插件里执行命令时，如何隐藏控制台输出的命令执行反馈？

使用 `mc.runcmdEx` 代替 `mc.runcmd`。`runcmdEx` 带有隐藏输出机制，执行结果不会打印到控制台，而是作为返回值 `{success, output}` 返回；如有需要，可自行使用 `log` 或 `logger` 输出 `res.output`。

*适用版本：LegacyScriptEngine 当前版本*

## LSE 插件执行命令时，怎么用 OP/控制台权限执行？怎么拿到命令输出？

`mc.runcmd(cmd)` 以服务器控制台身份（ServerCommandOrigin，权限等级为 Owner，高于 OP）执行命令，不受玩家权限限制，仅返回是否执行成功（Boolean）。`mc.runcmdEx(cmd)` 同样以控制台身份执行，但会返回 `{success, output}` 对象，既不会把输出打印到控制台，又方便把 `output` 存入变量进行分析。

## LSE 中 `mc.runcmd` 和 `mc.runcmdEx` 有什么区别？

`mc.runcmd(cmd)` 执行一条后台命令，仅返回是否成功（Boolean），命令输出会正常打印到控制台；`mc.runcmdEx(cmd)` 执行命令并返回结果对象 `{ success: Boolean, output: String }`，同时隐藏输出，不显示在控制台上，需要时可自行调用 `log(result.output)`。

注意：不要在 `onConsoleCmd` 监听器中调用 `runcmd` 或 `runcmdEx`，否则可能导致死循环。

## LSE 中 `mc.runcmdEx` 执行命令的权限等级是多少？

与控制台相同。`mc.runcmd` 和 `mc.runcmdEx` 都以名为 `"Server"` 的 ServerCommandOrigin 身份执行，权限等级为 `CommandPermissionLevel::Owner`（最高级），因此可以执行控制台能执行的所有命令。

## LSE 中写跨服传送，用 `mc.listen("onPlayerCmd")` 监听玩家输入（假命令）好，还是注册真命令？怎么注册？

建议注册真命令，这样客户端会有命令提示，在命令方块等处也能使用。示例：

```js
mc.listen('onServerStarted', () => {
  const cmd = mc.newCommand('trans', '跨服命令', PermType.Any);
  cmd.mandatory('ip', ParamType.String);
  cmd.optional('port', ParamType.Int);
  cmd.optional('player', ParamType.Player);
  cmd.overload(['ip', 'port', 'player']);
  cmd.setCallback((_, origin, output, result) => {
    const players = result.player ?? (origin.player ? [origin.player] : []);
    players.forEach(p => p.transServer(result.ip, result.port ?? 19132));
  });
  if (!cmd.setup()) logger.error('命令安装失败！');
});
```

注意：`setup()` 成功时返回 `true`，判断失败需要取反；从控制台执行且未指定 `player` 时，`origin.player` 为空。

## LSE 中如何触发/调用数据包（行为包）里的 mcfunction 函数，而不用把它重写一遍？

直接执行原版 `function` 命令即可：用 `mc.runcmdEx("function 函数名")` 以控制台身份执行（返回 `{success, output}`），或用 `pl.runcmd("function 函数名")` 以玩家身份执行。

## 在 LSE 中用 `mc.newCommand` 注册命令，调用 `cmd.optional(...)` 加了可选参数后，游戏里有命令提示，执行时却提示 `未知的命令`，为什么？另外文档里 `pl.tell(msg[,type])` 的中括号是什么意思？

文档里的 `[ ]` 只是用来表示“可选参数”的符号，并不是要你用数组把参数包起来。调用时按顺序直接传参即可，例如 `hub.optional("hub_num", ParamType.Int)`。

执行时提示未知命令，是因为没有调用 `overload`。添加完参数后，必须调用 `cmd.overload([...])` 声明重载（例如 `hub.overload(["hub_num"])`，无参重载可写 `hub.overload([])`），接着调用 `setCallback`，最后调用 `setup()`。

参考 <https://lse.levimc.org/zh/apis/> 和 <https://github.com/LiteLDev/legacy-script-engine-api>。

*适用版本：LSE 0.23.x*

## LSE 有没有获取服务器所有已注册命令列表的 API？

LSE 没有提供获取所有已注册命令列表的现成 API（命令相关接口只有 `mc.runcmd`、`mc.runcmdEx`、`mc.newCommand`、`mc.regPlayerCmd`、`mc.regConsoleCmd`、`mc.sendCmdOutput` 等）。

变通做法是调用 `mc.runcmdEx("help")` 执行 `help` 命令，再解析返回的 `output` 文本。如果确实需要完整列表，可以编写 C++ 模组，通过 LeviLamina / BDS 的 `CommandRegistry` 获取。

*适用版本：LSE 当前所有版本（0.23.1 仍无此 API）*

## LSE 有没有让某个实体执行一条命令的 API？实体对象上没有类似 `execute` 的方法。

LSE 的实体（Entity）对象没有执行命令的方法（只有玩家对象有 `pl.runcmd`）。可以借助原版 `execute` 命令来实现：调用 `mc.runcmdEx` 执行 `execute as @e[c=1,type=<实体类型>] at @s run <命令>`（可按需加上坐标、名称、标签等选择器条件来精确定位实体，例如先给目标实体加上 tag，再用 `@e[tag=xxx]` 选中）。

如果使用 C++，可参考 LSE 源码中与命令执行相关的实现。

*适用版本：LSE 当前所有版本*

## LSE 注册命令后，在回调里用 `out.success(...)` 输出信息，但玩家执行命令后客户端看不到任何结果，怎么办？

排查思路：

1. 先在回调里调用 `log(res.action)` 等，确认参数是否正确传入、回调是否已执行；
2. 检查 `switch` 的每个 `case` 末尾是否写了 `break`，漏写会导致代码继续往下执行，从而覆盖输出或引发错误；
3. 确认世界的 `sendcommandfeedback` 游戏规则未被关闭；
4. 作为变通方案，可以用 `ori.player.tell(...)` 直接给执行者发消息（注意由控制台执行时 `ori.player` 为空）。

此外，使用 KVDatabase 等数据库后记得调用 `close`，否则在其他地方再次打开时会报错。

*适用版本：LSE 当前所有版本。未能从源码或文档中直接证实，仅供参考。*

## LSE 注册命令时使用玩家选择器参数，回调里直接取 `res.pl.name` 得到 `undefined`，为什么？

`ParamType.Player`（以及 `ParamType.Actor`）参数返回的是对象数组（`Array<Player>` / `Array<Actor>`），而非单个对象。需要按下标取值（如 `res.pl[0].name`）或遍历数组处理（注意先判断数组长度，因为选择器可能未选中任何玩家）。

*适用版本：LSE 当前所有版本*

## LSE 注册命令时怎么给一个命令设置多个别名？

多次调用 `cmd.setAlias(alias)` 即可，每调用一次添加一个别名。C++ 侧对应 LeviLamina 的 `CommandHandle::alias()`，其内部调用 `CommandRegistry::registerAlias`。

*适用版本：LSE 当前所有版本*

## LSE 注册命令时，怎样实现像原版 `tag` 命令那样参数是字符串但能 Tab 补全已有值？把参数改成 `SoftEnum` 后游戏里没有提示怎么办？

使用可变枚举（软枚举）：先用 `cmd.setSoftEnum(name, values)` 定义可变枚举及其初始值，再用 `cmd.mandatory` / `cmd.optional`（参数名, `ParamType.SoftEnum`, name）声明参数并加入重载；之后可用 `cmd.addSoftEnumValues` / `removeSoftEnumValues` 动态增删可选值。只有可变枚举里有值时，游戏内才会出现补全提示。

## LSE 注册的命令（如 `/home`）执行时提示权限不足，怎么解决？

常见原因是命令没有设置重载。用 `mc.newCommand` 创建命令后，必须至少添加一条重载（例如无参命令调用 `cmd.overload([])`），再调用 `setCallback` 和 `setup`。另外要注意，`mc.newCommand` 的 permission 参数默认是 `PermType.Admin`；若希望普通玩家可用，需显式传入 `PermType.Any`，例如 `mc.newCommand("home", "回家", PermType.Any)`。

## LSE 的命令来源类型 `OriginType` 中为什么没有 `Server`，只有 `DedicatedServer` 等？

LSE 运行时的 `OriginType` 枚举直接由 BDS 原版的 `CommandOriginType` 生成，成员名与原版一致：`Player`、`CommandBlock`、`MinecartCommandBlock`、`DevConsole`、`Test`、`AutomationPlayer`、`ClientAutomation`、`DedicatedServer`(7)、`Entity`、`Virtual`、`GameArgument`、`EntityServer`、`Precompiled`、`GameDirectorEntityServer`、`Scripting`、`ExecuteContext`。控制台/服务端来源应使用 `OriginType.DedicatedServer`。`legacy-script-engine-api` 的 TS 声明沿用了 LL2 时代的命名（`Server`、`Block`、`Actor` 等，并将 `DedicatedServer` 作为 `Server` 的别名），因此编辑器补全会出现 `Server`，但运行时并不存在该成员。此外，也可以用 `ori.typeName` 获取类型名字符串。

## LSE 的命令注册 API 里有方块状态（block states）类型的命令参数吗？能取到值吗？

`ParamType` 枚举里保留了 `BlockState`（数值为 16），可用于 `mandatory` / `optional` 注册参数。但 LSE 在将命令解析结果转换成脚本值时未处理该类型，回调中拿到的参数值为空（`undefined`），因此实际上无法使用。需要方块状态时，可改用字符串或 JSON 等参数自行解析。

*适用版本：LSE v0.23.1*

## LSE 脚本中如何让玩家身份执行命令？`player.runcmd` 能否执行管理员（OP）命令？

LSE 提供 `player.runcmd(cmd)` 以玩家身份执行命令。其底层用该玩家构造 `PlayerCommandOrigin` 来执行，与玩家自己输入命令没有区别，因此能执行哪些命令取决于该玩家的权限，非 OP 玩家不能借此执行管理员命令。若需以高权限执行，可用控制台身份 `mc.runcmd` / `mc.runcmdEx`（`ServerCommandOrigin`，Owner 权限）配合 `/execute as "<玩家名>" run <命令>` 实现。

## LSE 菜单类插件（如 cmenu）点按钮执行命令时提示“未知的命令”，是什么原因？

这类插件通常调用 `pl.runcmd()`，以玩家身份和权限执行命令。如果玩家权限不足（如命令要求 OP），或者提供该命令的插件（如领地、商店、签到等）未安装、命令未注册，都会提示未知命令。解决方法：先安装提供对应命令的插件（例如领地用 iland，商店用 pshop 或 Tmessential），再在菜单的 JSON 配置中删掉不需要的条目。修改 JSON 时注意语法，最后一个元素后面不能有多余的逗号。

*适用版本：当前版本（具体取决于所用第三方菜单插件和命令插件）。未能从源码或文档中直接证实，仅供参考。*

## LSE/LLSE 中 `Command` 对象的 `setSoftEnum()` 和 `setEnum()` 有什么区别？

`setSoftEnum(name, values)` 注册的是可变枚举（soft enum），配合 `ParamType.SoftEnum` 参数使用，命令注册后仍可用 `addSoftEnumValues` / `removeSoftEnumValues` 等方法动态修改候选值。`setEnum(name, values)` 注册的是普通枚举，注册后无法修改。需要在运行时变动候选项（如玩家名、动态列表）时应使用软枚举。

## 修改了 LSE 插件中命令的权限等级后重载插件仍不生效，为什么？

LSE 的命令在首次调用 `mc.newCommand` 注册时就确定了名称、描述、权限等信息。重载插件时命令已存在，LSE 会输出警告 `Runtime command xxx already exists, changes will not beapplied except for setOverload!`（源码原文如此），此时只有重载和回调会更新，权限等改动需要重启服务器才能生效。另外注意权限枚举的大小关系：`PermType.Any`(0) \< `PermType.GameMasters`(1，OP) \< `PermType.Admin`(2，`mc.newCommand` 默认值) \< `PermType.HostPlayer`(3) \< `PermType.Console`(4)，其中 `Admin` 比 `GameMasters` 高一级。如果不想限制权限，可使用 `PermType.Any` 并在回调中自行判断（如 `origin.player?.isOP()`）。LSE 本身未提供注册后修改命令权限的接口。

*适用版本：LSE 0.9 及以上；当前 0.23.x*

## 在 LSE 插件里想限制某些玩家使用其他插件的指令，拦截指令后其他插件的表单仍然弹出，能否拦截其他插件的表单？

正常情况下，在 `onPlayerCmd` 中返回 `false` 拦截命令执行，就能阻止其他插件的命令及其后续表单，除非对方插件的“指令”是通过监听聊天等事件而非注册命令实现的。LSE 在技术上也能拦截表单，但不建议这样做；正确的做法是拦截命令执行，或让插件之间直接联动以禁止执行。

## 在 LSE 脚本插件中用 `mc.runcmdEx("list")` 获取在线玩家列表时，返回结果里带有 `§` 颜色代码，导致解析/显示异常，怎么处理？

`mc.runcmdEx` 返回 `{success, output}` 对象，命令输出位于 `.output` 字段中，需要自行去除颜色代码，例如：

```js
mc.runcmdEx("list").output.replace(/§./g, "")
```

如果只是想获取在线玩家，更推荐直接用 `mc.getOnlinePlayers()` 获取玩家对象数组再自行统计，以免解析本地化的命令输出文本。

## 如何用 LSE 写一个 `/back` 命令让玩家返回上次死亡点？需要自己记录死亡坐标吗？

不需要自己记录。LSE 的玩家对象提供 `pl.lastDeathPos` 属性（`IntPos`，包含维度 `dimid`）；当玩家没有死亡记录时，该属性为空（`undefined`）。示例：

```js
const cmd = mc.newCommand('back', '返回死亡点', PermType.Any);
cmd.overload([]);
cmd.setCallback((cmd, origin, output, result) => {
  const player = origin.player;
  if (!player) return output.error('指令执行者必须为玩家');
  const pos = player.lastDeathPos;
  if (!pos) return output.error('没有死亡记录');
  player.teleport(pos);
  output.success('传送成功');
});
cmd.setup();
```

注意：ScriptX 取不到值时返回 `undefined` 而非 `null`，判空应写 `!x`，不要写 `== null` 的严格比较。另一种做法是读取 `player.getNbt()` 中原版的死亡坐标字段，但该字段名属于 BDS 原版结构，不如直接用 `lastDeathPos` 可靠。

## 用 LSE 注册命令时（例如 `/pay <玩家> <金额>`），如何让某个参数可选，不填也不会被客户端标红报错？

命令语法检查在客户端完成。注册参数时，可以用 `cmd.optional(name, type, ...)` 代替 `cmd.mandatory(...)` 声明该参数，或者额外提供一个不含该参数的重载（即在 `cmd.overload([...])` 中不列出该参数），然后在回调里判断 `results` 中的该参数是否为空/`undefined`。

*适用版本：LSE 当前所有版本*

## 用 LSE 注册自定义命令（`mc.newCommand`）需要注意什么？

1. 命令名（以及除 `String`/`RawText`/`Message` 等可变参数外的内容）只能使用英文小写字母。
2. `RawText` 类型的参数只能放在最后一个参数位置。
3. 推荐在 `onServerStarted` 事件中注册命令（官方示例即如此）。
4. `overload` 的参数是数组，无参数时写 `cmd.overload([])`；最后必须调用 `cmd.setup()`。

示例（Python）：

```python
cmd = mc.newCommand(name, description, permission)
cmd.overload([])
def callback(cmd_, origin_, output_, results_): pass
cmd.setCallback(callback)
cmd.setup()
```

详见 LSE 文档 `GameAPI/Command`。

*适用版本：LSE 当前所有版本*
