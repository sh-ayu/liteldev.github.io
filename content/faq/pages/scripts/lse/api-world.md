# LegacyScriptEngine API: world and blocks

## An LSE plugin gets/creates a scoreboard objective in the global scope (such as `mc.getScoreObjective`, `mc.newScoreObjective`). It works after `ll reload`, but after a server restart it errors or returns null. Why?

When the plugin loads, the server (world) has not finished starting, so you cannot interact with vanilla content such as scoreboards, and the returned object is null. Declare the variable globally with `let`, assign it inside the `mc.listen("onServerStarted", () => { /* get/create the scoreboard here */ })` callback, and check for null before using it. During a hot reload (`ll reload`), the server is already running, so you get the object immediately. Because LSE also fires `onServerStarted` for plugins loaded after the server has started, placing the code in that event works in both cases.

*Applies to: all current LSE versions*

## How do I check whether a chunk is loaded in an LSE script? What if a while/for loop that waits for a chunk to load freezes the server?

Read the block at that position with `mc.getBlock(x, y, z, dimid)`. If the chunk is not loaded, it returns `null` without throwing an error; if it returns a block object, the chunk is loaded. Check for `null` before accessing its properties.

Do not poll in a synchronous loop (`while`/`for`). All LSE logic runs on the server's main thread (the tick thread), so busy-waiting blocks the main thread: the chunk can never load, the server freezes, and players hang in the air. Use a timer instead. Poll periodically with `setInterval` (save the timer ID, and on success call `clearInterval` and run your callback), or retry with `setTimeout`. Chunk loading is asynchronous and takes an unpredictable amount of time.

For random teleports or simulated players, first teleport the player or simulated player high above the target x/z coordinates. Then use a timer to check until `mc.getBlock` no longer returns `null` or the y coordinate begins to change (a player hovers in an unloaded chunk and falls only once it loads), and then determine the landing spot or perform the operation. In a C++ mod, you can check directly whether the chunk is fully loaded before operating on it.

*Applies to: all current versions of LegacyScriptEngine on LeviLamina*

## Can LSE's `mc.setBlock` set a block in an unloaded chunk?

No. The target chunk must be loaded (`mc.setBlock` returns `false` if it is not). As a workaround, load the chunk first—for example, by spawning a simulated player there with `mc.spawnSimulatedPlayer`—place the block once the chunk loads, and then remove the simulated player. A C++ mod can force-load the chunk before operating on it.

*Applies to: all current versions of LegacyScriptEngine on LeviLamina*

## In LSE, `mob.pos` prints as a string like "主世界(x,x,x)" (Overworld), and calling `replace` on it throws `cannot read ... from 'undefined'`. How do I get the coordinate values to spawn particles?

`pos` is not a string, but a `FloatPos` or `IntPos` object; the readable format printed to the console is the output of its `toString` method. Do not use string manipulation. Instead, read the `pos.x`, `pos.y`, `pos.z`, and `pos.dimid` properties directly. You can also pass `pos` straight to APIs (for example, `ps.spawnParticle(pos, name)`). Read the basic types section of the documentation first; using TypeScript type declarations also helps prevent this kind of error.

*Applies to: all current versions of LegacyScriptEngine (formerly LLSE)*

## In LSE, passing an NBT object as the block parameter of `mc.setBlock` gives a parameter error. What is wrong?

When passing an NbtCompound (or a Block object), do not pass the `tileData` parameter. These use different overloads:

- `mc.setBlock(pos, blockObject)` / `mc.setBlock(x, y, z, dimId, blockObject)` accept a Block or NbtCompound.
- `mc.setBlock(pos, blockString, tileData)` / `mc.setBlock(x, y, z, dimId, blockString, tileData)` accept `tileData` only when the block parameter is a block type name string.

When `tileData` is provided, LSE requires the block parameter to be a string; otherwise, it reports a parameter type error. The TypeScript declaration library legacy-script-engine-api fixed the corresponding overload declarations in JavaScript@v2.17.0 (2025-06-20).

*Applies to: current version; declaration library legacy-script-engine-api JavaScript@v2.17.0 and later*

## In LSE, after changing a block's state NBT with `block.setNbt`, the server-side NBT has changed but the client does not refresh the block state (it only takes effect after rejoining the server). How do I make the client refresh immediately?

The simplest way is to set the position to air (`mc.setBlock(pos, "minecraft:air")`) and then call `mc.setBlock` again to place the block with the new NBT. This forces the client to refresh.

You can also send packets yourself. The BlockActorData packet (`0x38`) updates block entity NBT: on a `BinaryStream`, call `writeVarInt(x)`, `writeUnsignedVarInt(y)`, `writeVarInt(z)`, and `writeCompoundTag(nbt)` in order, then `bs.createPacket(0x38)`, and finally `player.sendPacket(pkt)`. The UpdateBlock packet (`0x15`) requires the block's runtimeId, which is harder to get. Simply refreshing the chunk does not help.

The current version still provides the `setNbt` and `BinaryStream` APIs.

*Applies to: LeviLamina + LSE current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Does LSE have an API to regenerate the terrain of an area?

LSE itself does not. You can use the chunk-deletion API from the third-party prerequisite GMLib; once deleted, the chunk regenerates. Note that for structures (such as villages) to regenerate, you must delete the chunk containing the structure's starting point.

*Applies to: current version; requires GMLib. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How can an LSE JS plugin parse and use `.mcstructure` structure files (for example, structure files saved by players and uploaded to the server)?

You do not need an external library; plain LSE is enough. A `.mcstructure` file is little-endian binary NBT. Read it as binary with `File.readFrom(path, true)` to get a `ByteBuffer`, convert it to an `NbtCompound` with `NBT.parseBinaryNBT(buf)`, and place the structure with `mc.setStructure(nbt, pos[, mirror, rotation])` (use `mc.getStructure` to export in the opposite direction). For the file format, see <https://wiki.bedrock.dev/nbt/mcstructure#file-format>.

*Applies to: LSE 0.19.1 and later (binary reading with `File.readFrom`)*

## When LSE's `mc.setBlock` receives a block type string, is the `minecraft:` prefix required?

Not necessarily. When `mc.setBlock` receives a string, it looks up the name in the vanilla block registry (`BlockTypeRegistry::lookupByName`) via `Block::tryGetFromRegistry`, returning `false` if the name is not found. Whether a name without a namespace works depends on Mojang's implementation. Users report that omitting the prefix (for example, `diamond_ore`) usually places the block successfully, but the standard type names in the documentation include the prefix, so write `minecraft:diamond_ore` for compatibility.

*Applies to: current version (behavior depends on the BDS vanilla registry). Not confirmed against the source code or the documentation: treat it as a pointer.*

## An LSE chain-mining plugin can break blocks inside an iLand land claim without permission. How can a JS plugin check whether a block is inside an iLand claim?

This happens because the plugin breaks blocks directly with `Block.destroy()`, which bypasses the player break event that land protection listens for. To check the claim, import a function exported by iLand using LSE's cross-plugin calls:

```js
const posGetLand = ll.imports("ILAPI_PosGetLand"); // the old form ll.import is still an alias of ll.imports
if (posGetLand(targetBlock.pos) == -1) { /* this position is not in a land claim */ }
```

Alternatively, you can use interfaces like `Block.playerWillDestroy` from the third-party LRCA to simulate a player breaking the block and trigger the related events.

*Applies to: current version; iLand must be installed. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Can LSE set a block through block states instead of `tileData`, or only with the `setblock` command?

You can set a block using NBT. Block NBT contains the `name` and `states` fields (in SNBT, `{"name":"minecraft:xxx","states":{...}}`). Call `block.getNbt().toSNBT()` on any block to inspect its structure, then build a matching `NbtCompound` (for example, with `NBT.parseSNBT(...)`) and pass it to `mc.setBlock(pos, nbt)`.

## In LSE scripts, `mc.getBlock(pos).isAir` often throws an error (for example when a player teleports or joins). How do I fix it?

`mc.getBlock` returns `null` if the dimension does not exist, the height is out of range, or the chunk is unloaded. Check for `null` before accessing properties:

```js
let block = mc.getBlock(packetPos.add(0, 1, 0));
if (block && block.isAir) break;
```

Or use optional chaining: `mc.getBlock(...)?.isAir`.

## When building a position in an LSE JS plugin, is passing only x, y, z enough, as with C++ `Vec3`? Why does setting a block have no effect?

No. Unlike C++ `Vec3`, which has no dimension, LSE's `IntPos` and `FloatPos` require a dimension ID: `new IntPos(x, y, z, dimid)` (0 for Overworld, 1 for Nether, 2 for End). Without it, the position is incomplete, and operations like `mc.setBlock` that use it will fail.

## In an LSE JS plugin, how do I make a specific block drop no items when it is broken?

Intercept the break event, then break the block manually with the block object's `destroy` method, passing `false` so no drops are generated: `bl.destroy(false)`. The `drop` parameter controls whether drops are generated, and the method returns whether the block was broken successfully.

## How do I get the world name? Does LSE (JS) have an API for it?

LSE has no API that returns the world name directly. In JS, you can read `level-name` from `server.properties`:

```js
let levelname = /level-name=(.*)/.exec(File.readFrom('./server.properties'))[1];
```

This returns the name of the world folder under `worlds` (the path), which is not necessarily the name shown inside the world. This is enough when you only need the path, such as for backups. A native C++ mod can get the world name from the Level's `LevelData`.
