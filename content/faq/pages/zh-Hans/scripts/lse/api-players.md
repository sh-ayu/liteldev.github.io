# LegacyScriptEngine API：玩家

## LSE 中 Player 对象的 `player.name` 和 `player.realName` 有什么区别？该用哪个？

`player.realName` 是玩家的真实名字（取自登录身份中的 Xbox Live 名称，不受插件改名影响）；`player.name` 是玩家对象当前的名字字段，可能被插件或改名相关 API 修改。做身份识别或显示真实玩家名时应使用 `realName`；但若要作为存储玩家数据的键，更推荐使用 `player.uuid`，因为玩家在 Xbox 改名后 `realName` 也会随之改变。

*适用版本：当前所有 LSE 版本*

## LSE 中玩家下线后，之前保存的 Player 对象还能调用吗？插件抛出的异常会让服务器退出吗？

不能继续使用旧对象。LSE 的 Player 对象内部只持有玩家实体的弱引用，玩家下线后实体即被销毁，此时访问旧对象的属性或方法会因找不到玩家而返回 null/undefined（玩家重新进服后会生成新实体，旧对象也不会恢复）。正确做法是保存玩家的 uuid 或 xuid，需要时再用 `mc.getPlayer(...)` 重新获取，并在定时任务等场景中先判空再操作。另外，插件回调中未捕获的异常会被 LSE 捕获并打印错误日志，不会导致服务器退出。

*适用版本：当前 LSE 版本*

## LSE 脚本插件如何给玩家播放声音？

LSE 没有专门的播放声音 API，可通过以下两种方式实现：

1. 执行原版 `playsound` 命令，例如 ``mc.runcmd(`playsound random.levelup "${pl.realName}"`)`` 或 `mc.runcmdEx(...)`；
2. 用 `BinaryStream` 构造 `PlaySoundPacket`，调用 `createPacket` 后通过 `pl.sendPacket(packet)` 发送，具体可参考 NBSPlayer 的实现：<https://github.com/lgc-LLDev/NBSPlayer/blob/master/src/player.ts#L52-L73>。

两种方式都可行：使用命令更简单，直接发包则更灵活（不会刷命令输出）。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本*

## LSE 中传送/构造坐标时的维度参数填什么？文档写的 `[dimid]` 是要传数组吗？

文档中的方括号表示可选参数，而非数组。维度 ID 直接填数字即可：0 = 主世界，1 = 下界，2 = 末地。`IntPos`/`FloatPos` 由 x、y、z、`dimid` 组成，如 `new IntPos(0, 64, 0, 0)` / `new FloatPos(0.5, 64, 0.5, 0)`，构造后即可调用 `pl.teleport(pos)` 或 `pl.teleport(x, y, z, dimid)` 传送。

*适用版本：当前所有 LSE 版本*

## LSE 中如何让玩家在生存模式下飞行？用 `pl.getNbt()` 改 `abilities.mayfly` 再 `pl.setNbt()` 写回为什么不生效？

直接修改玩家 NBT 中的 `abilities` 不会生效。请改用 Player 的 `setAbility` 接口：`pl.setAbility(AbilityID, value)`，其中 `AbilityID` 为 Integer，`value` 为 Boolean（表示是否开启）。允许飞行（mayfly）对应的 ID 为 10（`AbilitiesIndex::MayFly`），调用 `pl.setAbility(10, true)` 后会将能力数据同步给客户端并立即生效。

*适用版本：当前所有 LSE 版本*

## LSE JS 插件里调用 `player.sendToast` 报参数错误或没效果，且字符串里的 `${变量}` 没有被替换，怎么写？

`sendToast` 必须同时传入标题和内容两个字符串参数，即 `player.sendToast(title, message)`，少传会报参数错误。另外 JS 中只有反引号 `` ` `` 包起来的模板字符串才会解析 `${}`，用单/双引号时 `${}` 会被当作普通文本，应写成例如 ``player.sendToast("提示", `欢迎 ${player.realName}`)``。

*适用版本：LegacyScriptEngine 当前所有版本*

## LSE JS 插件中如何给所有在线玩家定时刷新侧边栏？

侧边栏是 Player 对象的方法（`player.setSidebar`），而非全局方法，要为所有玩家设置就必须遍历在线玩家。定时刷新内容不必放在 `onTick` 中，使用 `setInterval` 即可，例如：

```js
setInterval(() => {
  for (const player of mc.getOnlinePlayers()) {
    player.setSidebar(title, data);
  }
}, 毫秒);
```

也可以使用 `mc.getOnlinePlayers().forEach(...)`。另外，建议在玩家进服时先初始化一次侧边栏。

*适用版本：LegacyScriptEngine 当前所有版本（原为 LLSE）*

## LSE 插件中如何获取某玩家周围一定半径内的玩家？用 `execute` 命令 + 正则解析输出的方式经常报错。

尽量不要用命令实现，直接遍历在线玩家并按距离过滤即可：

```js
let plnames = mc.getOnlinePlayers().filter(player => player.distanceTo(pl) < R).map(player => player.realName);
```

其中 `pl` 为中心玩家，`R` 为半径（方块）。`distanceTo` 可接受 Entity/Player/IntPos/FloatPos；若目标不在同一维度，该方法会返回整数最大值，从而将其自然过滤掉。如果不想包含中心玩家本人，可再加 `player.xuid !== pl.xuid` 之类的判断条件。

## LSE JS 中想维护一个在线玩家列表，玩家退出后用 `list.filter` 删除却删不掉，怎么写？

`Array.prototype.filter` 不会修改原数组，必须将返回的新数组重新赋值：

```js
let list = [];
mc.listen("onJoin", player => { list.push(player.realName); });
mc.listen("onLeft", player => { list = list.filter(name => name !== player.realName); });
```

也可以不自行维护列表，直接调用 `mc.getOnlinePlayers()` 获取当前在线玩家。例如在 `onLeft` 触发时写入 JsonConfigFile：`config.set("players", mc.getOnlinePlayers().map(p => p.realName).filter(n => n !== player.realName))`（注意：`onLeft` 触发时离开的玩家可能仍在在线列表中，需要手动过滤掉）。

*适用版本：当前版本（JS 引擎）*

## LSE JS 插件中如何获取当前所有在线玩家的名字列表（例如存进 json）？

调用 `mc.getOnlinePlayers().map(player => player.realName)` 即可得到在线玩家的真实名字数组，随后可将其写入 json（例如使用 JsonConfigFile 的 `set` 方法）。若需向数组添加元素，请使用 `push`。

*适用版本：当前版本（JS 引擎）*

## LSE JS 插件里想把玩家坐标用 `pl.tell` 发给玩家，直接传 `pl.pos` 报错/获取不到坐标，该怎么写？

`pl.pos` 返回的是坐标对象（FloatPos），而 `pl.tell` 的第一个参数要求为字符串，直接传入对象会因参数类型检查失败而报错。发送前用 `pl.pos.toString()` 转成字符串（或用模板字符串 `` `${pl.pos}` ``），也可以自己拼接 `pl.pos.x` / `pl.pos.y` / `pl.pos.z` / `pl.pos.dimid`。

## LSE 中 `pl.addEffect()` 如何给玩家添加无限时长的效果？

将 `pl.addEffect(id, tick, level, showParticles)` 的持续时间参数设为 `-1`，即可添加无限时长的效果（与原版 `/effect ... infinite` 相同）。该行为取决于 BDS 原版对 `-1` 时长的处理。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 中 `pl.getScore()` 在计分板项不存在时会报错，有什么处理办法？

这是预期设计，文档中也明确指出“使用前必须保证对应的计分项已经存在”，官方无意修改。你可以自行封装处理逻辑：先用 `mc.getScoreObjective(name)` 检查计分项是否存在，若不存在则调用 `mc.newScoreObjective(name, displayName)` 创建或直接返回 0；也可以用 `try/catch` 捕获 `pl.getScore()` 的异常，或改用第三方前置（如 GMLIB）提供的计分板接口。

## LSE 中 `pl.isOp()` 报错不存在，判断玩家是否为 OP 的 API 是什么？

LSE 中的 API 名称为 `pl.isOP()`（OP 全大写）。JS 区分大小写，写成 `isOp` 会报错。

## LSE 中 `player.isSurvival` 对冒险模式的玩家也返回 true，如何准确判断玩家游戏模式？

`pl.isSurvival` 直接调用 BDS 的 `Actor::isSurvival()`，其语义由原版决定，不宜用来区分生存模式和冒险模式。如需精确判断，请使用 `pl.gameMode`（数值，对应 GameType：0 生存、1 创造、2 冒险、6 旁观），例如 `if (pl.gameMode === 2) { /* 冒险 */ }`；也可以直接用 `pl.isAdventure` 判断是否为冒险模式。

## LSE 中 `setBossBar` 的颜色参数有哪些取值？

`pl.setBossBar(uid, title, percent, colour)` 中的 `colour` 为整数，会直接转换为 BDS 的 BossBarColor 枚举：0 粉色（Pink）、1 蓝色（Blue）、2 红色（Red）、3 绿色（Green）、4 黄色（Yellow）、5 紫色（Purple）、6 深紫色（RebeccaPurple）、7 白色（White）。例如，`pl.setBossBar(1145141919, "Hello", 80, 2)` 会显示红色血条。

## LSE 中如何可靠地获取玩家召唤的假人或指定名字的玩家？`mc.getPlayer(name)` 有什么坑？

`mc.getPlayer(name)` 按名字查找时采用不区分大小写的前缀匹配：优先返回名字完全相等的玩家，若无完全匹配，则返回名字以该字符串开头且最短的玩家，因此可能误拿到其他玩家。获取后应检查返回对象的 `name` 是否与目标名字完全一致。更可靠的做法是保存并使用 UUID 或 XUID 查找（`mc.getPlayer` 同样接受 UUID/XUID/UniqueId/RuntimeId）。此外，给假人名称加上普通玩家无法使用的前缀或标记，也能有效防止冲突。

## LSE 中想让 Boss 血条（bossbar）持续刷新，写成 `setInterval(player.setBossBar(...), 500)` 却只执行一次或提示 player 未定义，正确写法是什么？

`setInterval` 的第一个参数必须是函数。如果写成 `setInterval(player.setBossBar(...))`，JS 只会立即执行一次 `setBossBar` 并把它的返回值当作参数传入。正确做法是传入匿名函数，同时保存 `setInterval` 返回的定时器 id，以便在 Boss 死亡时调用 `clearInterval` 停止刷新。

另外，切勿长期持有 player、entity 等 mc 对象，而应保存 xuid，在定时器回调中通过 `mc.getPlayer(xuid)` 重新获取并判空。示例：

```js
let players = [];
mc.listen("onAttackEntity", (pl, en) => {
  if (!en.hasTag("boss")) return;
  if (!players.includes(pl.xuid)) players.push(pl.xuid);
});
const timer = setInterval(() => {
  for (const xuid of players) {
    const p = mc.getPlayer(xuid);
    if (!p) continue;
    p.setBossBar(bossId, "名称", Math.floor(boss.health / boss.maxHealth * 100), 2);
  }
}, 500);
```

Boss 死亡后，调用 `clearInterval(timer)` 并对玩家调用 `removeBossBar(bossId)`。`setBossBar` 的参数依次为 `(uid, title, percent 0~100, colour)`。若要向附近所有玩家显示血条，可遍历 `mc.getOnlinePlayers()` 并按距离筛选。

*适用版本：LSE 当前所有版本*

## 在 LSE 脚本中注册玩家 PAPI（PlaceholderAPI）变量时，怎样接收额外参数？文档只有服务器 PAPI 的示例，回调参数里只有玩家对象。

在注册玩家变量的回调中，在玩家对象后面再加一个参数即可接收额外参数，写为 `(pl, param) => {...}`。补全和类型声明可能尚未同步，请以 PAPI 插件实际传入的内容为准。不确定时，可以先用 `log` 打印 `param` 查看结构。

此功能需要安装第三方 PlaceholderAPI 插件（提供 `registerPlayerPlaceholder` 的 LSE 绑定）。

*适用版本：安装了第三方 PlaceholderAPI 插件的环境。未能从源码或文档中直接证实，仅供参考。*

## 在 LSE 中，玩家切换维度时怎样判断玩家已经加载完毕？

可以读取玩家对象的 `pl.isLoading` 属性（表示玩家是否正在加载）。在 `onChangeDim` 事件中用 `setInterval` / `setTimeout` 轮询，待该属性变为 `false` 后再执行后续操作。切换维度期间，读取到的许多玩家属性可能是 `undefined`，需要做空值判断。

注意，从末地返回传送门回到主世界时不会触发 `onChangeDim`。

*适用版本：LSE 0.23.x。未能从源码或文档中直接证实，仅供参考。*

## 在 LSE 中用 `pl.rename(newName)` 改了玩家头顶名字后，`pl.name` 拿到的仍然是真名。有没有办法获取玩家头顶显示的名字（nametag）？

`pl.rename` 实际修改的是玩家的 NameTag，而 `pl.name` / `pl.realName` 返回的是玩家原名，不会改变。LSE 0.19.1 起新增了 `en.getCustomName()`，用于返回实体的 NameTag，因此可以用 `pl.toEntity().getCustomName()` 获取头顶显示的名字。

如果还需要维护“真名到假名”的映射或检查重名，仍建议在调用 `rename` 时将 uid、真名和假名的对应关系自行记录到文件或数据库中，需要时再用 `data.getAllPlayerInfo()` 获取所有玩家信息进行比对。

0.19.1 之前的版本只能自行记录。

*适用版本：LSE 0.19.1 及以上*

## 在 LSE 中用 `pl.setBossBar` 给玩家设置 BossBar 时，要传的 uid 应该填什么？

BossBar 的原理是先向该玩家发送一个假实体（AddActor），再发送 BossEvent 包。uid 就是这个假实体的 ID，随便填一个不冲突的数字即可（负数也可以）。同一个 uid 对应一行 BossBar，调用 `removeBossBar(uid)` 时传入相同的值即可。

切勿填写已有实体的 `uniqueId`：LSE 不会对此做校验，这会导致该实体在客户端被假实体替换而消失。

*适用版本：LSE 0.23.x*

## 在 LSE 插件中怎样向全服玩家发送广播或通报消息？

可以用 `mc.broadcast(msg[,type])`（`type` 默认为 `0` 普通消息，`1` 为聊天，`5` 为物品栏上方的 Tip，`9` 为 JSON），也可以遍历在线玩家逐一发送：`mc.getOnlinePlayers().forEach(pl => pl.tell(msg))`。此外，还可以用 ``mc.runcmd(`say ...`)`` 或 `tellraw` 命令。

注意，使用 `say` 时消息会带有 `[服务器]` 之类的前缀（具体随 `server.properties` 中的 `language` 而变）。

*适用版本：LSE 0.23.x*

## LSE 插件中给玩家显示标题、向全服广播消息时，用执行 `title` / `say` 命令的方式合适吗？

不建议用 `mc.runcmd` 执行 `title` / `say` 命令。LSE 提供了现成接口：给玩家显示标题用 `pl.setTitle(content[, type[, fadeInTime, stayTime, fadeOutTime]])`，发送全服消息用 `mc.broadcast(msg[, type])`。有原生接口时应优先使用接口。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 有没有判断玩家是否处于爬行 / 游泳状态的 API？

有。LSE 自 0.19.1 起提供了 `player.isSwimming` 和 `player.isCrawling` 属性。

*适用版本：LSE 0.19.1 及以上*

## LSE 的 TypeScript 类型定义里，`mc.getPlayer` 拿到的玩家对象没有模拟玩家（`SimulatedPlayer`）的方法，怎么调用模拟玩家 API？

在类型定义中，`mc.getPlayer` 返回 `Player`，而 `SimulatedPlayer` 继承自 `Player`（`declare class SimulatedPlayer extends Player`）。运行时，模拟玩家的 `simulateXxx` 方法本就挂载在玩家对象上，只是类型不匹配。可以先用 `player.isSimulatedPlayer()` 判断，确认后手动断言为 `(player as SimulatedPlayer)` 再调用；也可以用 `// @ts-ignore` 绕过类型检查。通过 `mc.spawnSimulatedPlayer` 创建时，直接返回的就是 `SimulatedPlayer` 类型。

*适用版本：当前版本（使用 `legacy-script-engine-api` 类型定义的 LSE TS 插件）*

## LSE 脚本中 `pl.xuid` 返回空值是什么原因？

请检查 `server.properties` 中的 `online-mode`：离线模式下玩家未经过 Xbox 验证，没有 XUID，`pl.xuid` 会返回空字符串。此外，如果通过远程调用（`ll.exports` / `ll.imports`）在插件间传递玩家，需确认传入的确实是 `Player` 对象，而非普通 `object`。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 脚本插件中玩家死亡复活后无法移动（手机端摇杆消失），控制台也没有报错，可能是什么原因？

这类问题通常是插件自身的逻辑错误导致的，引擎不会报错。常见原因有两个：一是玩家死亡后，插件仍在持续设置玩家血量（如 `setHealth`），导致玩家状态异常；二是在 `onMobHurt` 事件回调中又对玩家造成了伤害（如 `hurt`），该伤害再次触发 `onMobHurt`，从而陷入无限递归或死循环。排查并修正这些逻辑即可，例如在回调中先判断玩家是否已死亡、避免在 `onMobHurt` 内直接再次造成伤害，或添加重入标记。

*适用版本：当前版本（属于脚本逻辑问题）。未能从源码或文档中直接证实，仅供参考。*

## 卸载了修改最大血量的模组/插件后，玩家最大血量仍不是默认值，怎么在服务器后台直接把某玩家最大血量改回 20？

在服务端控制台用 LSE 的脚本调试命令执行：

```shell
jsdebug mc.getPlayer('玩家名').setMaxHealth(20)
```

即可将该玩家的最大血量恢复为 20。注意，不同后端的调试命令有所不同：QuickJS 后端为 `jsdebug`，Lua 为 `luadebug`，Python 为 `pydebug`；Node.js 后端没有调试命令。

*适用版本：LeviLamina + LSE（对应脚本后端已安装）*

## 在 LSE 中读取玩家背包等物品数据，玩家 NBT 里有哪些相关的键？

相关键均位于玩家 NBT 的根目录下：`Armor`（盔甲栏）、`Inventory`（背包栏）、`Offhand`（副手栏）、`PlayerUIItems`（光标处与合成栏等 UI 物品）。对于在线玩家，更推荐直接调用 `pl.getInventory()`/`pl.getArmor()` 等容器接口；对于离线玩家，可用 `mc.getPlayerNbt(uuid)` 读取 NBT 后再获取这些键。

*适用版本：LeviLamina + LegacyScriptEngine（键名取决于 BDS 原版存档格式）。未能从源码或文档中直接证实，仅供参考。*

## 如何修改玩家的飞行速度（LSE 插件）？

LSE 没有直接设置飞行速度的 API（`player.setAbility` 只能设置布尔型能力）。可以通过 `player.getNbt()` 获取玩家 NBT，修改 `abilities` 下的 `flySpeed` 字段（默认 `0.05f`），再用 `player.setNbt(nbt)` 写回。有用户反馈，修改后玩家可能需要重新进入游戏才会生效。

*适用版本：LSE（LeviLamina）当前版本（`flySpeed` 字段属于 BDS 原版玩家 NBT 结构）。未能从源码或文档中直接证实，仅供参考。*

## 如何在服务器控制台快速查看某个在线玩家的 UUID（用于查找该玩家的数据文件）？

在控制台执行 LSE 的调试命令（QuickJS 引擎）：`jsdebug mc.getPlayer('玩家名字').uuid`。注意，玩家必须在线才能通过 `mc.getPlayer` 获取。

*适用版本：当前版本（需 QuickJS 引擎）*

## 插件开发中有没有获取玩家在线时长/游玩时长的 API？

LSE/LeviLamina 没有直接提供游玩时长 API，基岩版 BDS 本身也不存储玩家的游玩时长（玩家 NBT 中的 `Age` 并非游玩时长）。插件需要在玩家进服（`onJoin`）和退服（`onLeft`）时自行记录时间并累计保存；也可以直接安装现成的在线时长插件。

*未能从源码或文档中直接证实，仅供参考。*

## 有没有办法让基岩版服务器的最大玩家数动态变化：没人时 `maxplayers` 为 1，每进一个人就加一？

用 LSE 的 JS 插件只需几行代码即可实现：

```js
setInterval(() => mc.setMaxPlayers(mc.getOnlinePlayers().length + 1), 1000);
```

也可以使用现成的第三方插件 DynamicPlayerLim（<https://www.minebbs.com/resources/dynamicplayerlim-tps.5414/>）。该插件除了能将人数上限设为“在线人数 + 1”外，还能在 TPS 过低时阻止玩家进入（原为 LL2 插件，兼容性需自行测试）。

*适用版本：LegacyScriptEngine 当前版本*

## 服务器里如何隐藏玩家头顶的游戏 ID（名字），命令方块能做到吗？

命令方块无法实现，只能通过插件完成：最简单的方法是将玩家重命名为空字符串（LSE 的 `player.rename("")`）；也可以拦截发往客户端的数据包，将显示玩家名称的属性改为 `false`。

*适用版本：LegacyScriptEngine 当前版本*

## 服务器里突然有玩家莫名其妙获得 OP，如何快速查看 `permissions.json` 里有哪些 OP 玩家、排查是否有插件后门？

可以在后台用 LSE 的 `jsdebug` 执行以下命令，将 `permissions.json` 中的 xuid 转换为玩家名并输出：

```text
jsdebug JSON.parse(File.readFrom("permissions.json")).map(item => data.xuid2name(item.xuid)).join(", ")
```

如果列表正常，则需要排查插件是否存在后门：LSE 插件在执行设置权限等敏感操作（如 `setPermLevel`）时，会将操作记录到 `logs/LegacyScriptEngine/Sensitive_Operation_Records-<后端>.log`（例如 JS 后端为 `Sensitive_Operation_Records-Js.log`，此外还有 Lua/NodeJs/Python），格式为 `[操作]<插件名> 内容`，可在该日志中查找相关记录。

*适用版本：LegacyScriptEngine 当前版本*

## 能否在 LSE 中给玩家改名（不通过 Xbox 付费改名）？

可以。调用玩家对象的 `rename` 方法即可：JS 中为 `pl.rename("Steve")`，Lua 中为 `pl:rename("Steve")`，返回表示是否成功的 `Boolean` 值。若需临时改名，可在控制台用 QuickJS 引擎的调试命令 `/jsdebug` 执行 `mc.getPlayer("玩家原名").rename("新名字")`（Node.js 引擎没有调试命令）。这仅修改服务器内的显示名，不会修改玩家的 Xbox 账号名。

*适用版本：LSE 当前所有版本*

## 升级到新版后，玩家无法破坏方块、无法丢弃物品（但能打开箱子），是什么原因？

这是因为插件调用 `pl.setAbility(AbilityID, value)` 时传入的数字索引与当前 BDS 的 `AbilitiesIndex` 枚举不一致（LSE 直接把数字转换为 `AbilitiesIndex`）。旧插件沿用旧索引进行设置，结果误关了挖掘等能力。请按当前枚举修改插件，当前映射为：`Build=0`、`Mine=1`、`DoorsAndSwitches=2`、`OpenContainers=3`、`AttackPlayers=4`、`AttackMobs=5`、`OperatorCommands=6`、`Teleport=7`、`Invulnerable=8`、`Flying=9`、`MayFly=10`、`Instabuild=11`、`Lightning=12`、`FlySpeed=13`、`WalkSpeed=14`、`Muted=15`、`WorldBuilder=16`、`NoClip=17`、`PrivilegedBuilder=18`、`VerticalFlySpeed=19`。BDS 更新可能再次改变枚举。若能力已被写入且无法关闭，可将玩家切到其他游戏模式再切回生存来重置能力。
