# LegacyScriptEngine API: items and containers

## `player.giveItem("minecraft:xxx", amount)` does nothing in LSE. How do I give a player an item correctly, and how do I give more than one stack at once?

The first parameter of `giveItem` must be an item object (`Item`), not a namespaced ID string. First create the item object with `const item = mc.newItem("minecraft:snowball", 16)`, and then call `pl.giveItem(item)`.

The current version supports an optional second parameter, `amount`. When `amount` exceeds the item's maximum stack size (for example, `pl.giveItem(item, 100)`), the items are automatically split into multiple full stacks, and any excess that does not fit in the inventory is thrown out (dropped). Note that in the current implementation, when `amount` does not exceed the maximum stack size, the item's own `Count` is still used, so specify the quantity in `mc.newItem` in that case.

You can also use `mc.spawnItem(item, pos)` to spawn a dropped item at a position, or run the `give` command with `mc.runcmdEx`.

*Applies to: current LSE version (the amount parameter was added in a recent version)*

## How do I check whether a player has an empty hand in an LSE plugin? Listening to `onAttackBlock` throws an error when the hand is empty (the item parameter is empty).

The `onAttackBlock` callback signature is `function(player, block, item)`. When the player's hand is empty, `item` is empty (`undefined`), so check it before use: `if (!item) { /* empty hand */ }`. You can also get the main-hand item with `player.getHand()`. This always returns an Item object; to check for an empty hand, call `it.isNull()` (or check whether its `type` is `minecraft:air`).

Alternatively, you can run a command using `mc.runcmdEx` with the `hasitem` selector—for example, `tag @a[hasitem={item=air,location=slot.weapon.mainhand}] add xx`—and then check the player's tag. However, using commands for this is generally not recommended.

## How do I read item details such as enchantments in an LSE script? I can't find `getNbt` in the docs. Must I call `getNbt` before `getData`?

Item details such as enchantments are stored in NBT. Get the player's held Item object with `player.getHand()`, then call `item.getNbt()` to get an NbtCompound. Because `getData(key)` is a method of the NbtCompound class and `getNbt()` returns an NbtCompound, you normally call `getNbt` before `getData`.

`getNbt` is documented on the pages for individual object classes (Item, Entity, Block, Player, and so on) rather than on the NBT page. Search the docs for `getNbt`. An NBT List corresponds to a JSON array, and a Compound corresponds to a JSON object. For details on the item NBT structure, see pages such as "Bedrock Edition level format" on zh.minecraft.wiki.

To save an item completely in a plugin such as a shop (including enchantments, shulker box contents, and so on), use `nbt.toSNBT()` to store the entire item NBT as an SNBT string. To restore it later, parse the string with `NBT.parseSNBT()` and pass the result to `mc.newItem(nbt)` or `it.setNbt(nbt)`.

## In LSE, how do I change an item's Lore and other display information with NBT? Why do passing a JS array directly to an NbtList or writing values like `"1b"` not work?

The Lore tag is located under `tag.display` in the item NBT. Build an NbtList with `new NbtList([new NbtString("文本")])`; you cannot pass a JS array `[]` directly. After modifying the NBT, call `item.setNbt(nbt)` and then `player.refreshItems()` to apply the changes. Simpler alternatives are to call `item.setLore([...])` directly or to build the NBT with `NBT.parseSNBT`.

For byte-type fields (such as Unbreakable), use `new NbtByte(1)`, not the string `"1b"` or `true`. Enchantment levels are shorts. The root item NBT generally contains only tags like `Name`, `Count`, `Damage`, and `WasPickedUp`, while other tags (such as `ench` for enchantments and `display`) are nested inside `tag`. Calling `setTag` on an existing key overwrites it. In JS, NBT's `getData` returns a value, not a reference.

## In LSE, creating an addon custom item with `mc.newItem()` fails (the parameters are correct). What is the cause?

When the plugin loads, the server has not finished starting, so the world and the item registry (including addon custom items) are not ready yet. Put the item-creation code inside an `mc.listen("onServerStarted", () => { ... })` callback.

In this situation, recent LSE versions throw an exception directly (such as `ll::service::getLevel() returns nullptr` or `Item not found`), which makes the issue easier to identify.

*Applies to: LSE 0.23.x*

## How do I spawn a dropped item at the position where a player died, from an LSE plugin?

Listen to the player death event `onPlayerDie` (callback prototype: `function(player, source)`). You can still read `player.pos` inside this callback. Create the item with `mc.newItem("minecraft:xxx", count)`, then spawn the dropped item at that position with `mc.spawnItem(item, pos)`. For example:

```js
mc.listen("onPlayerDie", (pl, src) => {
  const it = mc.newItem("minecraft:diamond", 1);
  mc.spawnItem(it, pl.pos);
});
```

*Applies to: all current LSE versions (including v0.23.1)*

## How do I reduce a player's item by a given amount (for example from 64 grass blocks to 32) from an LSE plugin?

Call `pl.clearItem(type, count)` directly—for example, `pl.clearItem("minecraft:grass_block", 32)`. It returns the number of items actually cleared. The current implementation deducts items slot by slot: if a slot holds more than the remaining amount to clear, only the needed amount is removed instead of deleting the entire stack. The item ID must include the full namespace (`minecraft:...`).

Alternatively, run the vanilla command `clear <player name> minecraft:grass_block 0 32` with `mc.runcmdEx`, or get the Item from the inventory yourself, modify it, and call `pl.refreshItems()` to update the client display.

The partial-deduction issue in `clearItem` was fixed in 0.9.3.

*Applies to: LSE 0.9.3 and later*

## How do I get an item's maximum stack size on the current server (an addon may change vanilla stack sizes or add custom items) from an LSE plugin, without depending on plugins such as LegacyRemoteCall?

LSE's item object provides this property directly. Create the item with `mc.newItem(type, 1)` and read `it.maxStackSize` (or `it.maxCount`, added in 0.16.1). Because this value comes from the server's item registry, it accounts for addon changes and custom items. The current version includes both `maxStackSize` and `maxCount`.

On older versions without this property, you can work around this by creating the item with `mc.newItem(type, a very large number)` and reading `count`.

*Applies to: LSE 0.16.1 and later*

## In an LSE plugin's `onUseItem` event, after doing `item.count--` on the callback's item parameter or modifying its NBT and then calling `player.refreshItems()`, the item count in the player's hand does not change. How do I reduce the held item count by 1 after the player uses the item?

The item object passed to the event callback is a copy (the hooked function clones it layer by layer), so modifying it does not affect the player's inventory. In addition, `item.count` is read-only. Inside the callback, get the player's main-hand item with `player.getHand()` and modify that instead:

```js
mc.listen("onUseItem", player => {
  const item = player.getHand();
  if (item.count > 1) {
    item.setCount(item.count - 1); // LSE 0.19.1+; on older versions, modify the NBT: nbt.setByte("Count", item.count - 1) and then item.setNbt(nbt)
  } else {
    item.setNull();
  }
  player.refreshItems();
  return false;
});
```

You cannot read or write an NBT object like a plain JS object (for example, `nbt.Count`); use methods such as `getTag` and `setByte` instead. To work with it like a plain object, use the third-party LSE export wrapper for iListenAttentively (ila-lseexport, <https://github.com/MiracleForest/iListenAttentively-LseExport>).

*Applies to: all current LSE versions; `it.setCount` requires 0.19.1 or later*

## After modifying a player's items with the newly added LSE APIs, do I need to refresh the player's inventory manually?

Yes. After modifying items, call `player.refreshItems()` to update the player's inventory and armor slots; otherwise, the client will not show the changes.

## Does LSE have container (Container) APIs? Where is the documentation?

Yes. See the documentation at <https://levimc.org/LegacyScriptEngine/apis/GameAPI/Container/>. Note that this API can only operate on existing containers (such as block containers and the player inventory); it cannot open a container UI for a player. To open a container UI proactively, use a native C++ mod or a third-party dependency.

## Can LSE add a custom NBT tag to the item a player is holding (or an item a plugin spawns) and read it later to identify the item? Does BDS strip NBT it does not recognize?

Yes, items support custom NBT tags ("BDS strips unrecognized NBT" does not apply here). Do it like this:

```js
const it = player.getHand();
const nbt = it.getNbt();
// after writing the custom tag into nbt
it.setNbt(nbt);
player.refreshItems(); // sync to the client
```

Later, read that tag from `getNbt()` to identify the item.

## How do I check in an LSE script whether a player's inventory is full (or has room for a given item)?

Use `player.getInventory().hasRoomFor(item)` to check whether the container can hold the item. You can also iterate through the slots:

```js
const hasEmpty = (pl) => pl.getInventory().getAllItems().some(it => it.isNull());
```

If you find an empty slot, the inventory is not full. The container also provides `addItemToFirstEmptySlot` and `addItem` to insert an item directly.

## Can LSE (JS plugin) read and modify a player's inventory, including UI slots (such as the items in a crafting table)?

Yes, through the player's NBT. Read the entire player NBT with `pl.getNbt()` (which includes the inventory, UI slot items, and so on), modify it, and write it back with `pl.setNbt(nbt)`. Inventory-inspection plugins (such as Invsee) work by copying the entire player NBT.

## When I modify an item's NBT in LSE by setting a whole new tag, the item loses its enchantments (or even crashes the server). How do I keep the enchantments?

Do not create a new tag that overwrites the existing NBT. Instead, get the original NBT with `item.getNbt()`, modify the fields you need, and then call `item.setNbt(nbt)`. Because no function builds NBT directly from a plain JS Object, and assembling it manually with constructors is error-prone, it is easier to convert the NBT to text with `nbt.toSNBT()`, modify it, parse it back with `NBT.parseSNBT(snbt)`, and write it back.

## In an LSE script I add a custom enchantment by modifying item NBT, but no matter what enchantment id and level I write, it shows "Protection 0". Why?

The NBT type is wrong. In the `ench` enchantment list of the item tag, `id` and `lvl` are Short values (in SNBT, the `s` suffix, as in `17s`, means short), not strings or ints. In LSE, construct them with `new NbtShort(value)`. In a C++ mod, you can use `EnchantUtils::applyEnchant` to add enchantments directly. Also, NBT has no bool type; the `b` suffix means byte.

*Applies to: LSE / LeviLamina current version (the enchantment NBT structure is vanilla BDS behavior)*

## In an LSE (LLSE JS) plugin, how do I get an item's NBT string, and how do I convert SNBT back to NBT to create an item?

Get the SNBT string with `itemObject.getNbt().toSNBT()`. Convert SNBT to an `NbtCompound` object with `NBT.parseSNBT(snbt)`, then create the item with `mc.newItem(nbt)`.

## Can an LSE plugin define custom crafting recipes?

LSE itself has no API for registering crafting recipes. You can call the recipe interface of the third-party dependency GMLIB (documentation: <https://groupmountain.github.io/Documentation/lse/api/Recipes/>), or add recipes directly through a behavior pack (server-side recipe JSON files).

*Applies to: LSE all current versions*
