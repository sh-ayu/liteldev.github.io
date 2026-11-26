# LegacyScriptEngine API：世界与方块

## LSE 插件在全局作用域获取/创建计分板对象（如 `mc.getScoreObjective`、`mc.newScoreObjective`），`ll reload` 后正常，但服务器重启后报错或得到 null，为什么？

插件加载时服务器（世界）尚未启动完成，此时还无法操作计分板等原版内容，因此获取到的对象为 null。建议在全局作用域用 `let` 声明变量，在 `mc.listen("onServerStarted", () => { /* 在这里获取/创建计分板 */ })` 回调中再为其赋值，并在使用前做非空判断。执行热重载（`ll reload`）时服务器早已启动，所以能直接拿到对象；此外，对于在服务器启动后才加载的插件，LSE 也会补发 `onServerStarted` 事件，因此将逻辑统一写在该事件回调中对两种情况都适用。

*适用版本：当前所有 LSE 版本*

## LSE 脚本中如何判断某个区块是否已加载？等待区块加载时用 while/for 循环检测导致服务器假死怎么办？

调用 `mc.getBlock(x, y, z, dimid)` 读取目标位置的方块：若区块未加载会返回 `null`（不会抛错），若返回方块对象则说明区块已加载；访问对象属性前需先判空。

切勿使用同步循环（`while`/`for`）反复检测。LSE 的所有逻辑都在服务器主线程（tick 线程）上执行，忙等会阻塞主线程，导致区块永远无法加载、服务器假死、玩家卡在空中。区块加载是异步的，耗时不确定，正确做法是使用定时器：用 `setInterval` 定期检测（保存 timer id，加载成功后调用 `clearInterval` 并执行后续回调），或用 `setTimeout` 延迟重试。

在随机传送或假人场景下，可以先将玩家或模拟玩家传送到目标 x/z 坐标的高空，再用定时器检测 `mc.getBlock` 的返回值是否不为 `null`，或者检测玩家的 y 坐标是否开始变化（玩家在未加载区块中会悬停，区块加载后才会下落），待区块加载后再确定落点或执行操作。在 C++ mod 中，则可以直接检查区块是否已完全加载，再执行后续操作。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本*

## LSE 的 `mc.setBlock` 能否在未加载的区块里设置方块？

不能。目标区块必须处于已加载状态，若未加载，`mc.setBlock` 会返回 `false`。变通方法是先触发区块加载：例如用 `mc.spawnSimulatedPlayer` 在目标位置生成模拟玩家（假人），待区块加载后再放置方块，完成后让假人退出。若是 C++ mod，则可以先强制加载区块再执行操作。

*适用版本：LeviLamina 上的 LegacyScriptEngine 当前所有版本*

## LSE 中 `mob.pos` 打印出来是“主世界(x,x,x)”这样的字符串，对它用 `replace` 报 `cannot read ... from 'undefined'`，如何获取坐标数值来生成粒子？

`pos` 不是字符串，而是 `FloatPos` 或 `IntPos` 对象，打印出的易读格式只是调用其 `toString` 方法的结果。不要对其做字符串处理，直接读取 `pos.x`、`pos.y`、`pos.z` 和 `pos.dimid` 属性即可；也可以直接把 `pos` 对象传给相关 API（例如 `ps.spawnParticle(pos, name)`）。建议先阅读文档中的基础类型说明，并配合使用 TypeScript 类型声明，即可避免此类错误。

*适用版本：LegacyScriptEngine 当前所有版本（原为 LLSE）*

## LSE 中 `mc.setBlock` 的 block 参数传入 NBT 对象时提示参数错误，怎么回事？

传入 NbtCompound（或 Block 对象）时不要再传 `tileData` 参数，这两者属于不同的函数重载：

- `mc.setBlock(pos, blockObject)` / `mc.setBlock(x, y, z, dimId, blockObject)`：接受 Block 或 NbtCompound 对象；
- `mc.setBlock(pos, blockString, tileData)` / `mc.setBlock(x, y, z, dimId, blockString, tileData)`：仅当 block 参数为方块类型名字符串时，才可传入 `tileData`。

一旦传入了 `tileData`，LSE 就会要求 block 参数必须是字符串，否则会报参数类型错误。TypeScript 声明库 legacy-script-engine-api 已在 JavaScript@v2.17.0（2025-06-20）中修正了对应的重载声明。

*适用版本：当前版本；声明库 legacy-script-engine-api JavaScript@v2.17.0 及以上*

## 在 LSE 中用 `block.setNbt` 改了方块状态 NBT 后，服务端 NBT 已经变了，客户端看到的方块状态却不刷新（重进服务器才生效）。怎样让客户端立即刷新？

最简单的办法是：先将该位置设为空气（`mc.setBlock(pos, "minecraft:air")`），再用 `mc.setBlock` 重新放置带有新 NBT 的方块，客户端便会立即刷新。

也可以手动发送数据包：BlockActorData 包（`0x38`）用于更新方块实体 NBT，可用 `BinaryStream` 依次调用 `writeVarInt(x)`、`writeUnsignedVarInt(y)`、`writeVarInt(z)`、`writeCompoundTag(nbt)`，接着调用 `bs.createPacket(0x38)` 创建数据包，最后通过 `player.sendPacket(pkt)` 发送给玩家。UpdateBlock 包（`0x15`）则需要方块的 runtimeId，获取起来比较麻烦。仅刷新区块是无效的。

当前版本仍提供 `setNbt` 与 `BinaryStream` 相关 API。

*适用版本：LeviLamina + LSE 当前版本。未能从源码或文档中直接证实，仅供参考。*

## LSE 有没有 API 可以让某块区域重新执行地形生成？

LSE 本身没有。但可以借助第三方前置 GMLib 提供的删除区块 API，区块被删除后会重新生成。需要注意，对于村庄等结构，必须删除结构起始点所在的区块，结构才会重新生成。

*适用版本：当前版本；需 GMLib。未能从源码或文档中直接证实，仅供参考。*

## LSE 的 JS 插件如何解析/使用 `.mcstructure` 结构文件（把玩家保存的结构文件传到服务端使用）？

无需外部库，仅用 LSE 内置 API 即可实现。`.mcstructure` 文件本质上是小端序二进制 NBT：先用 `File.readFrom(path, true)` 以二进制模式读取文件得到 `ByteBuffer`，再用 `NBT.parseBinaryNBT(buf)` 将其解析为 `NbtCompound`，最后调用 `mc.setStructure(nbt, pos[, mirror, rotation])` 即可放置结构（反之，可用 `mc.getStructure` 导出结构）。文件格式说明见 <https://wiki.bedrock.dev/nbt/mcstructure#file-format>。

*适用版本：LSE 0.19.1 及以上（`File.readFrom` 二进制读取）*

## LSE 的 `mc.setBlock` 传入方块类型字符串时，是否必须带 `minecraft:` 前缀？

不一定。向 `mc.setBlock` 传入字符串时，底层会调用 `Block::tryGetFromRegistry`，按名称在原版方块注册表（`BlockTypeRegistry::lookupByName`）中查找，若查不到则直接返回 `false`。是否允许省略命名空间取决于 Mojang 的底层实现。有用户反馈不加前缀（如 `diamond_ore`）通常也能成功放置，但文档中的标准类型名均带有前缀，建议写成 `minecraft:diamond_ore` 以确保兼容性。

*适用版本：当前版本（行为取决于 BDS 原版注册表）。未能从源码或文档中直接证实，仅供参考。*

## LSE 的连锁采集插件可以在 iLand 领地内无权限挖掉方块，如何在 JS 插件中判断方块是否在 iLand 领地中？

这是因为插件直接调用 `Block.destroy()` 破坏方块，绕过了领地保护插件所监听的玩家破坏方块事件。可以通过 LSE 的跨插件调用机制，导入 iLand 导出的函数来进行判断：

```js
const posGetLand = ll.imports("ILAPI_PosGetLand"); // 旧写法 ll.import 仍是 ll.imports 的别名
if (posGetLand(targetBlock.pos) == -1) { /* 该位置不是领地 */ }
```

此外，也可以借助第三方库 LRCA 提供的 `Block.playerWillDestroy` 等接口来模拟玩家破坏方块，从而正常触发相关事件。

*适用版本：当前版本；需安装 iLand。未能从源码或文档中直接证实，仅供参考。*

## LSE 能否通过方块状态（block states）而不是 `tileData` 来设置方块？还是只能用 `setblock` 命令？

可以通过 NBT 来设置方块。方块 NBT 包含 `name` 和 `states` 字段（SNBT 格式形如 `{"name":"minecraft:xxx","states":{...}}`）。可以先对任意方块调用 `block.getNbt().toSNBT()` 查看其结构，再构造对应的 `NbtCompound`（例如通过 `NBT.parseSNBT(...)`），最后传给 `mc.setBlock(pos, nbt)` 完成设置。

## LSE 脚本中 `mc.getBlock(pos).isAir` 经常报错（例如玩家传送/进服时），怎么修？

当维度不存在、高度越界或区块未加载时，`mc.getBlock` 会返回 `null`。因此在访问属性前需要先判空，例如：

```js
let block = mc.getBlock(packetPos.add(0, 1, 0));
if (block && block.isAir) break;
```

或者直接使用可选链：`mc.getBlock(...)?.isAir`。

## 在 LSE JS 插件中构造坐标时，和 C++ 的 `Vec3` 写法一样只传 x,y,z 就行吗？为什么设置方块没有效果？

不行。C++ 的 `Vec3` 不包含维度信息，但 LSE 的 `IntPos` 和 `FloatPos` 必须指定维度 ID，需写成 `new IntPos(x, y, z, dimid)`（0 为主世界、1 为下界、2 为末地）。如果不传维度 ID，构造出的坐标就不完整，将其传给 `mc.setBlock` 等接口就会失效。

## 在 LSE JS 插件里，如何让指定方块被破坏时不产生掉落物？

可以拦截方块破坏事件，然后调用方块对象的 `destroy` 方法手动破坏方块，并传入 `false` 表示不生成掉落物：`bl.destroy(false)`。该方法接收布尔参数 `drop`（是否生成掉落物），并返回方块是否被成功破坏。

## 如何获取存档名称？LSE（JS）有相关 API 吗？

LSE 没有直接提供获取存档名称的 API。在 JS 中，可以通过读取 `server.properties` 文件来获取 `level-name` 字段：

```js
let levelname = /level-name=(.*)/.exec(File.readFrom('./server.properties'))[1];
```

但需要注意，这样获取到的是 `worlds` 目录下的存档文件夹名称（路径），不一定与存档内部显示的名称一致；如果是做备份等只需用到路径的场景，这样获取就足够了。C++ 原生 mod 则可以通过 Level 的 `LevelData` 直接获取存档名。
