# LegacyScriptEngine API：事件

## LSE 能注销（取消监听）通过 `mc.listen` 注册的事件监听器吗？怎么实现取消监听？

LSE 的脚本 API 没有提供注销监听的接口：`mc.listen(event, callback)` 只返回一个表示是否注册成功的 Boolean，不返回可用于移除监听器的句柄。不过，卸载或重载插件时，LSE 会自动清除该插件注册的全部事件监听器。

如果需要在运行时取消监听，可以在脚本中自行封装一层：对每个事件只调用一次 `mc.listen`，在回调中将事件分发给自己维护的处理函数列表；需要取消监听时，从列表中移除对应的处理函数即可。

（LeviLamina 的 C++ EventBus 提供了 `removeListener`，因此 C++ mod 可以直接移除监听器。）

*适用版本：当前所有 LSE 版本*

## LSE 中 `onAttackEntity` 事件的回调还提供 `damage`（伤害值）参数吗？

不提供。LSE 中 `onAttackEntity` 的回调原型为 `function(player, entity)`，LL2 时代的 `damage` 参数已移除，请以 LSE 文档为准。回调返回 `false` 可拦截攻击。

*适用版本：LSE 所有版本（LeviLamina 时代）*

## LSE 中用 `onUseItem` 实现“手持物品右键打开菜单/释放技能”，为什么 PC（Win10）端右键一次会触发很多次？该监听哪个事件？

对空气使用物品应监听 `onUseItem`（对方块使用才是 `onUseItemOn`）。在 PC 端按住或点击右键时，`onUseItem` 会连续触发多次，因此需要自行实现防抖或冷却机制：按玩家记录上次触发时间（如 `Map<xuid, timestamp>`），直接忽略短时间内（如 200~500ms）的重复触发，具体可参考 CMenu 等菜单插件的实现。在移动端，右键对应长按操作。此外，也可以结合 `onAttackEntity`（左键攻击实体）等事件来实现技能。

*适用版本：LSE 当前版本*

## LSE 中如何禁止活塞推动指定方块（如箱子、漏斗），防止领地外活塞把方块推进/推出领地？

监听 `onPistonTryPush` 事件，并在回调 `function(pistonPos, block)` 中返回 `false` 即可拦截。例如：

```js
mc.listen('onPistonTryPush', (pistonPos, block) =>
  ["minecraft:chest", "minecraft:hopper"].includes(block.type) ? false : true);
```

领地插件可以通过 `block.pos` 判断被推方块是否在领地内。早期 LSE 曾存在该事件回调中方块坐标错误（始终为活塞自身坐标）的 bug（issue #137），导致领地插件失效，该问题已在 LSE 0.7.12 中修复。注意：当活塞受阻无法推动时，该事件会循环触发。

*适用版本：LSE 0.7.12 及以上*

## LSE 脚本插件如何实现耕地防踩？`onFarmLandDecay` 事件还能用吗？

可以。监听 `"onFarmLandDecay"`（耕地退化）事件，其回调原型为 `function(pos, entity)`：其中 `pos` 为退化耕地的坐标（`IntPos`），`entity` 为造成退化的实体（`Entity`）。回调返回 `false` 即可拦截该事件，使耕地不会变回泥土。例如：

```js
mc.listen("onFarmLandDecay", (pos, entity) => false);
```

注意：该事件可能会多次触发，请勿在回调中执行开销较大的操作。如果只想保护特定区域或针对特定实体，可根据 `pos` 和 `entity` 自行判断。

*适用版本：LegacyScriptEngine 0.23.x；旧 LiteLoaderBDS 2.x LLSE 同样适用*

## LSE 中 `mc.listen` 的回调参数是按名字还是按顺序传入的？例如 `mc.listen("onCmdBlockExecute",(pos,cmd)=>{log(cmd)})` 输出的却是指令而不是坐标。

按顺序传入。监听事件相当于让 LSE 调用插件中的函数，LSE 只会按照文档中事件监听函数原型的固定参数顺序传参，与自定义的参数名无关。`onCmdBlockExecute` 的原型是 `function(cmd, pos, isMinecart)`，因此第一个参数是指令字符串，第二个是坐标（FloatPos），第三个表示是否为命令方块矿车。参数名可以自行指定，但建议与文档原型保持一致：

```js
mc.listen("onCmdBlockExecute", (cmd, pos, isMinecart) => { log(cmd, pos); })
```

## LSE 中 `onBlockExploded` 事件是否包含凋灵破坏方块（`onWitherBossDestroy`）？

不包含。凋灵本体破坏方块属于独立事件，需要监听 `onWitherBossDestroy`（原型为 `function(witherBoss, AAbb, aaBB)`，可拦截）；而 `onBlockExploded`（原型为 `function(block, source)`）仅针对爆炸破坏的方块。

*未能从源码或文档中直接证实，仅供参考。*

## LSE 中 `onDestroyBlock` 无法监听挖掘基岩等不可破坏方块，如何监听玩家对这类方块的挖掘/攻击？

`onDestroyBlock`（玩家破坏方块完成）仅在方块真正被破坏时触发，挖掘基岩、末地门框架等不可破坏方块不会触发该事件。要监听玩家敲击这类方块的行为，可以使用 `onAttackBlock`（原型为 `function(player, block, item)`）或 `onStartDestroyBlock`（原型为 `function(player, block)`）。在当前版本中，这两个事件均基于玩家攻击方块事件，返回 `false` 即可拦截；你可以在回调中自行实现“可破坏”逻辑（例如调用 `mc.setBlock` 将方块设为空气并生成掉落物）。

如果遇到事件不触发的问题，请在 GitHub issue 中附上可复现的文本代码。

*适用版本：当前版本（0.23.x）*

## LSE 中 `onPlayerDie` 事件如何判断伤害来源是否为玩家，并给击杀者在计分板上加分？

`onPlayerDie` 的原型是 `function(player, source)`，其中 `source` 是伤害来源实体（Entity，可能为 `null`）。由于 Entity 对象没有 `addScore` 等计分板方法，需要先判断 `source` 存在且为玩家，再调用 `toPlayer()` 将其转换为 Player 对象来操作计分板。示例：

```js
mc.listen("onPlayerDie", (pl, src) => { if (src && src.isPlayer()) { src.toPlayer().addScore("kills", 1); } });
```

注意：对应的计分项必须事先存在。

## LSE 中事件回调（如 `onPreJoin`）能否异步执行？在事件里执行异步代码有问题怎么处理？

LSE 会同步调用事件回调，因此只有回调同步返回 `false` 时才能拦截事件。你可以在回调中使用 Promise/`then` 或将回调定义为 `async` 函数来执行异步操作（Node.js 后端每 tick 都会驱动事件循环和微任务），但 `async` 函数返回的是 Promise 而非 `false`，在 `await` 之后再 `return false` 无法拦截事件——需要拦截的判断必须在同步阶段完成。

如果需要在 `onPreJoin` 中为玩家附加数据，也可以自行维护一个按玩家名或 xuid 索引的对象来存储，不一定非要使用 `setExtraData`。

## LSE 中如何拦截事件？为什么用 `mc.listen("onPlayerPullFishingHook", (player,entity,item) => { fishingHookEvent(player,entity,item) })` 并在 `fishingHookEvent` 里 `return false` 拦截不生效？

在 LSE 中，事件回调返回 `false` 即可拦截事件（并非所有事件都支持拦截，请以文档中标注的“拦截事件：函数返回false”为准；`onPlayerPullFishingHook` 支持拦截）。上述写法中，外层箭头函数使用了花括号却没有 `return`，导致内层函数的返回值没有向外传递。应改为：

```js
mc.listen("onPlayerPullFishingHook", (player,entity,item) => { return fishingHookEvent(player,entity,item); });
```

或者直接传入函数：

```js
mc.listen("onPlayerPullFishingHook", (player,entity,item) => false);
```

## LSE 中如何拦截凋灵生成时的大爆炸？`onBlockExploded` / 爆炸事件 `return false` 拦截不了。

`onBlockExploded`（方块被爆炸破坏）仅作为方块被炸毁时的通知，文档中已标注“不可以拦截”，因此 `return false` 无效。要拦截爆炸本身，应监听 `onEntityExplode`（由实体引起的爆炸，凋灵生成爆炸的来源即为凋灵实体）或 `onBlockExplode`（由方块引起的爆炸），并在回调中返回 `false`。

从 LSE 0.21.2 起，这两个事件改由 iListenAttentively 提供，底层 hook 了 `Explosion::explode`，所有爆炸都会经过此处且均可取消。如果需要更细粒度的控制，也可以在原生（C++）插件中直接使用 iListenAttentively 的 `ila::mc::ExplosionBeforeEvent`。

*适用版本：LSE 0.21.2 及以上（依赖 iListenAttentively）*

## LSE 中对玩家调用 `player.kick()` 会触发 `onLeft` 事件吗？

会。`player.kick()` / `disconnect()` 内部会调用 `Player::disconnect` 断开连接，而 `onLeft` 基于 LeviLamina 的 `PlayerDisconnectEvent`（hook 了 `ServerPlayer::disconnect`），因此踢出玩家也会触发一次 `onLeft`。如果在 `onLeft` 中清理玩家的临时数据，需要注意这一点（服务器关闭过程中不会触发 `onLeft`）。

*适用版本：LSE 当前版本*

## LSE 插件中如何实现玩家对黑曜石使用物品（如桶）时把黑曜石变成岩浆？

监听 `onUseItemOn` 事件（回调原型为 `function(player, item, block, side, pos)`），判断方块类型后调用 `mc.setBlock` 替换方块：

```js
mc.listen('onUseItemOn', (player, item, block) => {
  if (block.type === 'minecraft:obsidian' && item.type === 'minecraft:bucket') {
    mc.setBlock(block.pos, 'minecraft:lava', 0);
  }
});
```

你可以根据需要去掉对手持物品（桶）的判断。注意：Win10 客户端点击右键时，可能会在服务端连续触发多次该事件。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件中如何拦截玩家使用烟花等物品对方块使用的行为？

监听 `onUseItemOn` 事件（`mc.listen("onUseItemOn", (player, item, block, side, pos) => {...})`），在回调中判断 `item.type`（如 `"minecraft:firework_rocket"`）并返回 `false` 即可拦截。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件中想阻止苦力怕爆炸破坏方块，写 `mc.listen("onEntityExplode", (entity)=>{ if(entity === creeper) return false; })` 不生效，应该怎么写？

`onEntityExplode` 的回调原型为 `function(source, pos, radius, maxResistance, isDestroy, isFire)`。第一个参数是实体对象，不能直接与名称比较，需通过 `source.type` 获取命名空间 ID：`if (source.type == "minecraft:creeper") return false;`。不过，在 `onEntityExplode` 中 `return false` 会拦截整个爆炸（既不造成伤害，也不破坏方块）。

如果只想阻止爆炸破坏方块，可以采用以下方法：

- 在服务器行为包中覆盖苦力怕的实体定义（将 `creeper.json` 中 `minecraft:explode` 组件的 `breaks_blocks` 设为 `false`）；
- 关闭游戏规则 `mobGriefing`（这会影响所有生物的破坏行为）；
- 使用现成的防爆插件。

此外，`onBlockExploded` 事件不可拦截，不能用它来阻止方块被炸毁。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件在 `onChat` 中 `return false` 拦截了聊天，但聊天消息仍会输出两遍 / 仍能发出原版样式消息，是什么原因？

LSE 的事件拦截只会取消原版行为，不会阻止其他插件监听同一事件。此外，LSE 事件没有优先级，也不支持修改事件参数（`onChat` 回调只提供 `player` 和 `msg` 字符串）。由于很多聊天插件会先拦截消息，再按自己的格式重新发送，多个聊天插件并用时就容易冲突。遇到这种情况，通常是因为另一个聊天插件监听到事件后，又按原版样式重发了一遍。

解决方法：排查并卸载冲突的聊天插件。如果确实需要多个插件依次修改聊天内容，可以考虑使用基于 iListenAttentively 的第三方 LSE 扩展（如 ila-lse，其事件参数通过 NBT 传递，支持修改）。

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件里通过发包创建的假容器（假箱子 GUI），玩家关闭时不会触发 `onCloseContainer` 事件，怎么监听关闭？

`onCloseContainer` 只在玩家关闭真实存在的容器方块时触发。发包生成的假容器在服务端没有对应的容器方块，因此不会触发该事件。

要监听关闭事件，需要 hook 服务端处理客户端 ContainerClosePacket 的函数（`ServerNetworkHandler::handle(NetworkIdentifier const&, ContainerClosePacket const&)`）。可以通过编写原生（C++）mod 实现，或使用提供数据包事件的第三方前置（如 GMLib）。LegacyRemoteCallApi 本身不提供事件。

## LSE 的 `onBlockChanged`（方块变化）事件能否通过 `return false` 拦截？LeviLamina C++ 中呢？

不能。LSE 的 `onBlockChanged` 在方块改变之后才会触发，因此不可拦截（文档中也标注了“拦截事件：不可以拦截”）。LeviLamina 的 `ll::event::BlockChangedEvent` 同样不是可取消事件，C++ 中也没有直接的拦截方式。你只能在方块变化后将其还原，或者自行 hook 具体的方块修改来源（例如玩家放置或破坏方块时，改用对应的可拦截事件 `onPlaceBlock`、`onDestroyBlock`）。

*适用版本：当前版本（LSE / LeviLamina）*

## LSE 的 `onHopperPushOut` 事件监听不到漏斗之间的物品传递，有没有能监听漏斗间传递的事件？

LSE 只提供 `onHopperSearchItem`（漏斗/漏斗矿车吸取物品）和 `onHopperPushOut`（漏斗输出物品）两个漏斗事件，iListenAttentively 也没有漏斗相关事件，因此没有专门的“漏斗间物品传递”事件。如有需要，可以编写 C++ mod 自行 hook。LSE 本身 hook 了 `Hopper::_tryPullInItemsFromAboveContainer`（从上方容器吸入）、`Hopper::_pushOutItems`（向外推送）和 `Hopper::_tryMoveInItem`（实际移动物品），你可以参考这些函数；如果涉及漏斗矿车，还需特殊处理其碰撞箱。

*适用版本：LSE 0.23.x；iListenAttentively 当前版本*

## LSE 的 `onMobHurt` 回调里的 `damage` 不是实体实际受到的伤害（无敌帧内的攻击也被计入）？

是的。`onMobHurt` 在 `Mob::_hurt` 执行原逻辑之前触发，传入的是未经护甲、附魔、药水抗性、无敌帧等计算的原始伤害值，所以无敌帧内的攻击也会触发该事件并带有伤害值。而 `onAttackEntity` 回调只有 `(player, entity)` 两个参数，不提供伤害值。如需获取实际伤害，需要编写 C++ mod，自行 hook 伤害结算后的位置。

## LSE 的 `onMobHurt` 事件中，被骷髅/玩家用弓射出的箭击中时，`source` 参数是射手还是箭？能拿到射手吗？

在 `onMobHurt(mob, source, damage, cause)` 中，当实体被箭等投射物击中时，`cause` 为 `ActorDamageCause.Projectile`，`source` 是投射物实体（箭）而非射手。LSE 目前没有获取投射物所有者（owner）的 API，因此无法直接通过该事件拿到射手，需要另辟蹊径（例如借助其他插件、前置库或 C++ mod 提供的接口）。

*适用版本：LSE 0.23.x*

## LSE 脚本插件中，手机触屏玩家“点击屏幕”会触发什么事件？如何监听？

触屏操作对应的事件如下：长按屏幕会触发 `onUseItem`；点击空气相当于攻击（左键），没有对应的使用物品事件；点击方块相当于交互（右键方块），会触发 `onUseItemOn`。如果想实现手持物品打开菜单，可以改用长按操作，并通过 `mc.listen("onUseItem", ...)` 监听，这样也能避免误触。

*适用版本：当前版本（具体触发行为取决于 BDS/客户端触屏操作方式）。未能从源码或文档中直接证实，仅供参考。*

## LSE 脚本插件卸载时，C++ 侧通过 `executeOnModUnload` 注册的回调不触发，LSE 插件有 `onUnload` 回调吗？

旧版 LSE 在卸载脚本插件时会直接销毁引擎，不会调用 `ll::mod::Mod` 的 `onUnload`，导致 `executeOnModUnload` 无法监听。该问题已在 LSE PR #256（`fix: fix plugin executeOnModUnload`，2025-03-17 合并）中修复。在脚本侧，可以使用 `ll.onUnload(func)` 注册插件卸载时执行的清理函数。

*适用版本：包含 PR #256 的 LSE 版本（2025-03 之后发布的版本）及当前最新版*

## LSE JS 插件中有没有服务器关闭时的事件监听？

该功能不在 `mc.listen` 的事件列表中，而是在“加载相关 API”（`ll` 对象）下：调用 `ll.onUnload(func)` 注册插件卸载回调，服务器关闭（即插件卸载）时便会触发。该函数要求 LSE 0.9.6 及以上版本。

*适用版本：LSE 0.9.6 及以上*

## 如何用 LSE 禁止玩家使用某个物品？

监听 `onUseItem` 事件（回调参数为 `player, item`），判断 `item.type` 为目标物品后，在回调中 `return false` 即可拦截：

```js
mc.listen('onUseItem', (player, item) => { if (item.type === 'minecraft:xxx') return false; });
```

如果是对方块使用物品（右键方块），还需要同时拦截 `onUseItemOn`。

## 如何用 LSE 脚本插件禁止玩家与某些方块交互（例如领地内禁止打开唱片机、潜影盒）？为什么提示消息会刷屏？

监听 `onUseItemOn` 事件（回调参数为 `player, item, block, side, pos`），当 `block.type` 为目标方块时 `return false` 即可拦截交互。需要注意，Win10/PC 客户端玩家右键一次，在服务端会连续多次触发该事件（文档中有说明）。如果每次触发都调用 `player.tell`，就会导致聊天栏刷屏。解决方法是给发送消息加上防抖（debounce，建议实现为与 player 解耦的通用防抖函数），或者改在物品栏上方（actionbar）显示提示。

## 如何让 LSE 脚本插件在服务器启动完成后自动执行一些命令？

监听 `onServerStarted` 事件，并在回调中调用 `mc.runcmd`：`mc.listen("onServerStarted", () => { mc.runcmd("你的命令"); });`。如需执行多条命令，多次调用 `mc.runcmd()` 即可。如果需要获取命令输出，可以使用 `mc.runcmdEx`。

## 怎么用插件阻止服务器里的液体流动？

监听 LSE 的 `onLiquidFlow` 事件（回调参数为 `from: Block, to: IntPos`），并返回 `false` 进行拦截：

```js
mc.listen('onLiquidFlow', (from, to) => false);
```

此外，也可以编写 native mod 去掉液体 tick。

*适用版本：当前版本（该事件依赖 iListenAttentively，随 LSE 一起安装）*

## 想做告示牌锁箱子功能，用 LSE 应该拦截哪些行为？

首先，监听玩家打开容器事件 `mc.listen("onOpenContainer", (player, block) => ...)`（或方块交互事件 `onUseItemOn`），当玩家不是箱子主人时 `return false` 拦截。同时，还必须监听 `onHopperSearchItem`（回调参数为 `pos, isMinecart, item`，`return false` 即可阻止吸取），以拦截漏斗和漏斗矿车从箱子中抽取物品，否则玩家可以利用漏斗绕过箱子锁。

*适用版本：LegacyScriptEngine 0.23.x*

## 生物受伤事件（LSE 的 `onMobHurt` / GMLIB-LRCA 的 `onMobHurted`）给出的伤害值是减免前还是减免后的最终伤害？

LSE 自带的 `onMobHurt`（回调为 `function(mob,source,damage,cause)`）通过 hook `Mob::_hurt` 实现，其 `damage` 是传入 `_hurt` 的原始伤害值，即未经护甲、保护附魔、抗性效果等减免的值。

第三方库 GMLIB-LRCA 的 `onMobHurted` 据其文档说明，给出的是经过护甲、魔咒、抗性减免后的伤害值，但仍非最终伤害：实体处于受击间隔（无敌帧）时，实际伤害会归零，但事件并未计入这一情况；攻击创造模式玩家同样会触发事件，但对方实际不会受伤。如果需要获取精确的实际伤害，可以在事件触发后（例如下一 tick）读取实体血量（或 NBT 中的 `Health`），通过前后差值来计算。

*适用版本：当前版本（`onMobHurt`）；GMLIB 部分为第三方插件行为。未能从源码或文档中直接证实，仅供参考。*

## 用 LSE 脚本如何禁止玩家修改告示牌？

LSE 没有专门的告示牌编辑事件。你可以监听 `onUseItemOn`（或 `onBlockInteracted`），当判断目标方块为告示牌（`block.type` 包含 `sign`）时 `return false` 拦截交互，从而阻止玩家打开编辑界面。如果想直接拦截客户端发来的告示牌编辑数据包，由于纯 LSE 没有收包拦截事件，需要借助 iListenAttentively 等扩展或编写 C++ mod 来实现。

*适用版本：LSE 当前版本。未能从源码或文档中直接证实，仅供参考。*

## 用 LSE 写插件时如何检测玩家在铁砧中重命名/输入的内容？`onOpenContainerScreen` 能触发但 `onContainerChange` 对铁砧无效。

纯 LSE API 无法实现这一需求，因为铁砧不属于普通容器，且 LSE 没有提供铁砧重命名事件。你需要依赖 iListenAttentively（ila）及其 LSE 导出插件 iListenAttentively-LseExport（ila-lseexport，<https://github.com/MiracleForest/iListenAttentively-LseExport>），通过监听它导出的底层事件来实现；或者直接使用 C++ 编写原生 mod。

*适用版本：LSE 当前版本*

## LSE JS 插件在 `onBlockExplode` 监听器里调用 `mc.explode`（或在获取经验事件里再加经验）导致服务器崩溃/卡死，原因是什么？

这是插件代码触发了死循环：在事件回调中调用对应的 API 会再次触发同一事件（调用 `mc.explode` 会再次触发 `onBlockExplode`，通过 API 增加经验也会再次触发玩家获取经验事件），从而陷入无限递归。LSE 不会区分事件是否由插件自身触发，文档中对此也有提示。要解决此问题，可以在插件中设置一个布尔标志，在插件主动发起爆炸或增加经验期间跳过回调处理，或者改用不会重复触发事件的实现方式。

*适用版本：LSE 当前所有版本*
