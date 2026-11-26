# LegacyScriptEngine API：物品与容器

## LSE 中 `player.giveItem("minecraft:xxx", 数量)` 不起作用，怎样正确给玩家物品？想一次给超过一组怎么办？

`giveItem` 的第一个参数必须是物品对象（`Item`），不能直接传命名空间 ID 字符串。先用 `const item = mc.newItem("minecraft:snowball", 16)` 创建物品对象，再调用 `pl.giveItem(item)`。

当前版本支持可选的第二个参数 `amount`：当 `amount` 大于该物品的最大堆叠数时（如 `pl.giveItem(item, 100)`），会自动按最大堆叠数拆成多组给予，背包满时多余的物品会作为掉落物抛出。注意，按当前实现，当 `amount` 不超过最大堆叠数时，仍按物品自身的 `Count` 给予，此时应直接在 `mc.newItem` 中指定数量。

也可以用 `mc.spawnItem(item, pos)` 在指定位置生成掉落物，或用 `mc.runcmdEx` 执行 `give` 命令。

*适用版本：当前 LSE 版本（amount 参数为较新版本加入）*

## LSE 插件如何判断玩家是否空手？监听 `onAttackBlock` 时玩家空手会导致报错（物品参数为空）。

`onAttackBlock` 的回调函数为 `function(player, block, item)`。玩家空手时，传入的 `item` 为空值（`undefined`），使用前需先判空：`if (!item) { /* 空手 */ }`。也可以用 `player.getHand()` 获取主手物品，该方法总会返回一个 Item 对象，空手时可用 `it.isNull()` 判断（或检查其 `type` 是否为 `minecraft:air`）。

另一种方法是用 `mc.runcmdEx` 配合 `hasitem` 选择器（例如 `tag @a[hasitem={item=air,location=slot.weapon.mainhand}] add xx`），再检测玩家的 tag，但一般不推荐用命令实现。

## LSE 脚本里怎么读取物品的附魔等详细信息？文档里找不到 `getNbt`，`getData` 一定要先 `getNbt` 吗？

物品附魔等详细信息需要通过 NBT 读取。先用 `player.getHand()` 获取玩家手上的 Item 对象，再调用 `item.getNbt()` 得到 NbtCompound。`getData(key)` 是 NbtCompound 类的方法，而 `getNbt()` 恰好返回该类型，所以通常先调用 `getNbt` 再调用 `getData`。

`getNbt` 记载在各个对象类（Item、Entity、Block、Player 等）的文档页中，不在 NBT 页面下，可在文档中直接搜索 `getNbt`。NBT 中的 List 相当于 JSON 数组，Compound 相当于 JSON 对象。物品的 NBT 结构可参考 zh.minecraft.wiki 的“基岩版世界格式”等页面。

若要在商店等插件中完整保存物品（包括附魔、潜影盒内容等），可直接用 `nbt.toSNBT()` 将整个物品 NBT 存为 SNBT 字符串，需要时再用 `NBT.parseSNBT()` 还原，并通过 `mc.newItem(nbt)` 或 `it.setNbt(nbt)` 使用。

## LSE 中如何用 NBT 修改物品的 Lore 等显示信息？直接给 NbtList 传 JS 数组或写 `"1b"` 这类值为什么不生效？

Lore 标签位于物品 NBT 的 `tag.display` 下。NbtList 必须用 `new NbtList([new NbtString("文本")])` 构造，不能直接传 JS 数组 `[]`；修改后需调用 `item.setNbt(nbt)`，再调用 `player.refreshItems()` 刷新。更简单的方式是直接调用 `item.setLore([...])`，或用 `NBT.parseSNBT` 构造 NBT。

字节类型字段（如 Unbreakable）应写为 `new NbtByte(1)`，不要写字符串 `"1b"` 或 `true`；附魔等级则为 short 类型。物品根 NBT 一般只有 `Name`、`Count`、`Damage`、`WasPickedUp` 等字段，其余标签（如附魔 `ench`、`display`）都在 `tag` 下。对已存在的键再次调用 `setTag` 会直接覆盖原值；在 JS 中，NBT 的 `getData` 返回的是值而非引用。

## 在 LSE 中用 `mc.newItem()` 创建 addon 自定义物品失败（参数确认无误），是什么原因？

插件加载时服务器尚未启动完毕，世界和物品注册表（包括 addon 自定义物品）还没准备好。把创建物品的代码放进 `mc.listen("onServerStarted", () => { ... })` 回调中执行即可。

新版 LSE 在这种情况下会直接抛出异常（如 `ll::service::getLevel() returns nullptr` 或 `Item not found`），可据此排查。

*适用版本：LSE 0.23.x*

## LSE 插件中如何在玩家死亡的位置生成一个掉落物？

监听玩家死亡事件 `onPlayerDie`（回调原型为 `function(player, source)`），在回调中仍可读取 `player.pos`。先用 `mc.newItem("minecraft:xxx", 数量)` 创建物品，再用 `mc.spawnItem(item, pos)` 在该位置生成掉落物。例如：

```js
mc.listen("onPlayerDie", (pl, src) => {
  const it = mc.newItem("minecraft:diamond", 1);
  mc.spawnItem(it, pl.pos);
});
```

*适用版本：LSE 当前所有版本（含 v0.23.1）*

## LSE 插件中如何把玩家某个物品减少指定数量（例如 64 个草方块减到 32 个）？

直接调用 `pl.clearItem(type, count)`，例如 `pl.clearItem("minecraft:grass_block", 32)`，该方法会返回实际清除的数量。当前实现会按格子逐个扣减，当某一格的数量多于剩余待清除数量时，只会扣掉所需数量，不会整组删除。注意物品 ID 必须写完整的命名空间（`minecraft:...`）。

也可以用 `mc.runcmdEx` 执行原版命令 `clear 玩家名 minecraft:grass_block 0 32`，或者自行从物品栏取出 Item 修改后调用 `pl.refreshItems()` 刷新客户端显示。

`clearItem` 的部分扣减问题已在 0.9.3 中修复。

*适用版本：LSE 0.9.3 及以上*

## LSE 插件中如何获取某物品在当前服务器中的最大堆叠数（addon 可能修改原版物品堆叠数或添加自定义物品），且不依赖 LegacyRemoteCall 等插件？

LSE 的物品对象直接提供了该属性：用 `mc.newItem(type, 1)` 创建物品后，读取 `it.maxStackSize`（或 0.16.1 加入的 `it.maxCount`），获取到的就是服务器物品注册表中的实际值，包含 addon 的修改和自定义物品。当前版本同时保留了 `maxStackSize`。

旧版本没有该属性时，可改用 `mc.newItem(type, 一个很大的数)` 创建物品，再读取其 `count` 作为变通方案。

*适用版本：LSE 0.16.1 及以上*

## LSE 插件在 `onUseItem` 事件里对回调参数 item 做 `item.count--` 或修改 NBT 后调用 `player.refreshItems()`，玩家手中物品数量都不变，如何让玩家使用物品后手持物品数量减 1？

事件回调传入的物品对象是副本（底层 hook 的函数会逐层 clone），修改它不会影响玩家背包；而且 `item.count` 是只读属性。应在回调中通过 `player.getHand()` 获取玩家主手物品后再修改：

```js
mc.listen("onUseItem", player => {
  const item = player.getHand();
  if (item.count > 1) {
    item.setCount(item.count - 1); // LSE 0.19.1+；旧版可改 NBT：nbt.setByte("Count", item.count - 1) 后 item.setNbt(nbt)
  } else {
    item.setNull();
  }
  player.refreshItems();
  return false;
});
```

NBT 对象不能像普通 JS 对象那样直接读写 `nbt.Count`，需要使用 `getTag` / `setByte` 等方法。若想像普通 object 一样操作，可使用第三方 iListenAttentively 的 LSE 导出封装（ila-lseexport，<https://github.com/MiracleForest/iListenAttentively-LseExport>）。

*适用版本：LSE 当前所有版本；`it.setCount` 需 0.19.1 及以上*

## LSE 新增的修改玩家物品的 API，修改完之后需要手动刷新玩家背包吗？

需要。修改物品后必须调用 `player.refreshItems()` 刷新玩家物品栏和盔甲栏，客户端才会显示更改。

## LSE 有没有容器（Container）相关的 API？文档在哪？

有，文档见 <https://levimc.org/zh-Hans/LegacyScriptEngine/apis/GameAPI/Container/>。但该 API 只能操作已有容器（如方块容器、玩家物品栏），不支持主动为玩家打开容器界面；若需主动打开容器 UI，建议通过原生 C++ mod 或第三方前置实现。

## LSE 能否给玩家手持物品（或插件生成的物品）添加自定义 NBT 标签，之后读取它来识别物品？BDS 会不会把不认识的 NBT 删掉？

可以，物品支持自定义 NBT 标签（“BDS 会去掉不认识的 NBT”并非指这种情况）。做法如下：

```js
const it = player.getHand();
const nbt = it.getNbt();
// 在 nbt 中写入自定义 tag 后
it.setNbt(nbt);
player.refreshItems(); // 同步给客户端
```

之后读取 `getNbt()` 中的该 tag 即可识别物品。

## LSE 脚本中如何判断玩家背包是否已满（或是否还有空位放入某物品）？

推荐用 `player.getInventory().hasRoomFor(item)` 判断容器能否放下该物品。也可以遍历物品栏：

```js
const hasEmpty = (pl) => pl.getInventory().getAllItems().some(it => it.isNull());
```

只要找到空的物品槽位，就说明背包未满。此外，容器还提供了 `addItemToFirstEmptySlot` 和 `addItem` 方法，可直接放入物品。

## LSE（JS 插件）能否读取/修改玩家的物品栏，包括 UI 槽位（如工作台中的物品）？

可以通过玩家 NBT 实现：用 `pl.getNbt()` 读取整个玩家 NBT（包含背包、UI 槽位物品等），修改后再用 `pl.setNbt(nbt)` 写回。查包类插件（如 Invsee）就是通过复制整个玩家 NBT 实现的。

## 在 LSE 中修改物品 NBT 时把整个 tag 重新设置，导致物品原有附魔丢失（甚至崩服），如何在修改时保留附魔？

不要新建整个 tag 去覆盖原有 NBT。应先用 `item.getNbt()` 取出原 NBT，在其基础上修改所需字段，再调用 `item.setNbt(nbt)` 写回。LSE 没有从普通 JS Object 直接生成 NBT 的函数，手动用构造函数拼接容易出错；更稳妥的做法是用 `nbt.toSNBT()` 转为文本，修改后再用 `NBT.parseSNBT(snbt)` 解析回 NBT 并写回。

## 在 LSE 脚本里修改物品 NBT 添加自定义附魔，不管写什么附魔 id 和等级，结果都显示为“保护 0”，为什么？

NBT 类型写错了。物品 tag 下附魔列表 `ench` 中的 `id` 和 `lvl` 均为 Short 类型（SNBT 中如 `17s` 的 `s` 后缀即表示 short），不是字符串或 int；在 LSE 中用 `new NbtShort(值)` 构造即可。C++ mod 中可直接调用 `EnchantUtils::applyEnchant` 添加附魔。另外，NBT 中没有 bool 类型，`b` 后缀表示 byte。

*适用版本：LSE / LeviLamina 当前版本（附魔 NBT 结构为 BDS 原版行为）*

## 在 LSE（LLSE JS）插件中如何获取物品的 NBT 字符串，以及如何把 SNBT 转回 NBT 来生成物品？

使用 `物品对象.getNbt().toSNBT()` 获取 SNBT 字符串。生成物品时，先用 `NBT.parseSNBT(snbt)` 将 SNBT 转为 `NbtCompound` 对象，再调用 `mc.newItem(nbt)` 创建物品。

## LSE 插件能否自定义合成配方？

LSE 本身未提供注册合成配方的 API。你可以调用第三方前置 GMLIB 的配方接口（文档：<https://groupmountain.github.io/Documentation/lse/api/Recipes/>），或通过行为包（服务端配方 JSON 文件）直接添加配方。

*适用版本：LSE 当前所有版本*
