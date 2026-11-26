# MoreDimensions

## Can a custom dimension created by MoreDimensions be deleted or unloaded? How do I reset a dimension periodically to use it as a resource world? When is a dimension registered?

MoreDimensions provides no interface to delete or unload a dimension—its maintainers have stated explicitly that they will not provide a world-level deletion API and instead leave that task to world-editing tools—nor can LSE scripts do so. Dimension registrations are recorded in `dimension_config.json` in the world directory, while chunk and other data are stored in the world's LevelDB (`db`). Removing the registration from your code or deleting the config file alone will not remove data that has already been generated, and any keys deleted at runtime are written back when the world saves.

Dimension registration: `CustomDimensionManager::addDimension` and `addSimpleDimension` require the Level to exist; otherwise, they throw `std::runtime_error`. The official test code registers dimensions in `ll::event::ServerStartedEvent`. Do not register them during the mod's load phase.

You can only reset a dimension while the server is offline: stop the server, back up the world, and delete the dimension's chunk data using a tool that supports Bedrock LevelDB. Because Minecraft uses a Mojang-modified version of LevelDB with zlib compression support, you cannot read or write it with standard Google leveldb; values are stored as NBT. The chunk key format is: 4-byte x (int32 LE) + 4-byte z + (for non-overworld dimensions) 4-byte dimension ID + 1-byte record type + optional 1-byte subchunk index. You can use third-party world tools such as Amulet (`amulet.load_level`) or write your own native plugin.

In addition, the overhead of running multiple dimensions comes mainly from sending dimension data to players, so adding more dimensions increases server lag. You can use a vanilla generator (overworld, nether, end, flat, or void) or write a custom C++ generator, but you cannot directly load custom biome dimensions defined by an addon.

*Applies to: MoreDimensions, all current versions*

## Does MoreDimensions export an interface that LSE (JS) scripts can call to register or create dimensions? Where is the documentation?

No. MoreDimensions provides only a C++ API (`more_dimensions::CustomDimensionManager`). It exports nothing via RemoteCall, and LSE has no built-in interface for registering dimensions, so you must write a native C++ mod to call it. Documentation is available at <https://github.com/LiteLDev/MoreDimensions/wiki>. Even if the API were exported, you could only easily create dimensions that use vanilla generator types (void, flat, overworld, nether, the end). If you do not write C++, you can use a community helper mod built on MoreDimensions that configures dimensions via JSON, such as `more-dimension-helper-json`.

*Applies to: MoreDimensions, all current versions*

## How do I use LeviLamina's multi-dimension support (MoreDimensions)? Can I create a new dimension with a command right after installing it? Is there a reference implementation or a ready-made dimension mod? How do I enter a new dimension, and how do portals work?

MoreDimensions (<https://github.com/LiteLDev/MoreDimensions>) is a library and dependency. It does not add any dimensions on its own or provide a command to create them; other mods must call its API. Install it with `lip install github.com/LiteLDev/MoreDimensions` (the current version requires LeviLamina 26.60.7 or later and below 26.61.0, and provides both server and client builds).

For developers: add `more-dimensions` as a dependency in your native mod and, once the Level is available (for example, in `ServerStartedEvent`), call:

```cpp
more_dimensions::CustomDimensionManager::getInstance()
    .addSimpleDimension("myns:my_flat", 345, GeneratorType::Flat);
```

The dimension name must use the `namespace:name` format and cannot use the `minecraft` namespace. The supported vanilla generators are Overworld, Flat, Nether, TheEnd, and Void. A custom generator must derive from `Dimension` and be registered with `addDimension<D>(name, args...)`. See the [wiki](https://github.com/LiteLDev/MoreDimensions/wiki) for documentation and `src/test/TestCustomDimension.cpp` in the repository for an example. In GitHub Actions, builds whose names end in `-tests` create 7 test dimensions and are intended for testing only. For community reference implementations, see [more-dimension-helper](https://github.com/ye111566/more-dimension-helper) and its JSON variant (`more-dimension-helper-json` on MineBBS, which creates dimensions from a JSON configuration and does not support creating them at runtime).

To enter a dimension, use LeviLamina's built-in `tpdim` command, such as `tpdim ~ ~ ~ <dimension name>`. Vanilla-style portals cannot be implemented directly; instead, you can register a portal-styled block with an addon and run a teleport command when a player triggers it.

*Applies to: MoreDimensions v0.14.0 and later (addSimpleDimension); current v0.16.0 / LeviLamina 26.60.x*

## Can LeviLamina host multiple worlds in one BDS (resource world plus survival world, lobby plus minigames, and so on)? What are the limitations?

BDS itself does not support multiple worlds. On LeviLamina, you can approximate this by adding custom dimensions to the same world with MoreDimensions (`lip install github.com/LiteLDev/MoreDimensions`). Because MoreDimensions is only an API, you also need a mod that calls it, such as the community mod `more-dimension-helper-json`. You can generate new dimensions as overworld, nether, end, flat, or void. Limitations:

1. Once created, a dimension cannot be deleted.
2. All dimensions share the same world, behavior packs, and resource packs, so you cannot load different texture packs for different dimensions.
3. All dimensions run in the same server process and on the main thread, so adding more dimensions increases the server load.

If you need to isolate resource packs or reduce load, you are better off running multiple BDS instances (using different ports, including the IPv6 port) alongside cross-server teleport and data synchronization plugins.

*Applies to: MoreDimensions current version (v0.16.0)*

## After entering a MoreDimensions custom dimension, how do I teleport back to the overworld or between dimensions? Does `tpdim` still work?

LeviLamina includes a built-in `teleportdim` command (alias `tpdim`) that teleports players between any dimensions, including custom ones:

```text
tpdim <x y z> <dimension> [convert]
tpdim <target selector> <x y z> <dimension> [convert]
```

The first form teleports you; the second teleports the specified targets. The dimension can be `overworld`, `nether`, `the_end`, or a custom dimension name, and `convert` (default `true`) scales coordinates using the nether ratio. You can enable or disable the command and set its permission level under `modules.command.tpdimCommand` in the LeviLamina configuration (enabled by default, with permission set to `GameDirectors`). To return to the overworld, you can also run the vanilla command `execute in overworld run tp @s ~ ~ ~`.

*Applies to: LeviLamina current version (26.60.x)*

## When serializing dimension information in events or data, should I store the dimension ID or the dimension name? I need to account for MoreDimensions custom dimensions.

Store the dimension name. Developers do not choose custom dimension IDs; MoreDimensions or the game assigns them at registration. (The current version tries to reuse the name-to-ID mapping already saved in the world, but IDs are not guaranteed to stay the same across worlds or after changes to the registration order or configuration.) Always persist the name and convert it at runtime: `VanillaDimensions::fromString(name)` returns a DimensionType, and `VanillaDimensions::toString(dimId)` looks up the name from an ID (MoreDimensions' `getDimensionIdFromName` is deprecated). Vanilla dimension IDs are fixed: 0 for the overworld, 1 for the nether, and 2 for the end.

*Applies to: MoreDimensions current version (v0.16.0)*

## When MoreDimensions creates a new dimension, can I only use the terrain generators built into Mojang's game? Are there preset templates?

MoreDimensions is only a library and includes no preset dimension templates or gameplay features. The simple helper `addSimpleDimension` supports only vanilla generator types (Overworld/Flat/Nether/TheEnd/Void). For custom terrain, you must write your own C++ generator by deriving from `Dimension` and registering it with `addDimension<D>()`. See the examples under `src/test/generator` in the repository (`flat-gen-village` for a flat world that generates villages, and `generator-terrain` for custom terrain using `NxnBorderTerrain`), or check `DefaultGenerator` in the third-party land-claim plugin PlotCraft. Complex terrain, such as custom biomes and mountains, requires implementing your own noise generation.

*Applies to: MoreDimensions current version (v0.16.0)*

## Can MoreDimensions (multi-dimension) create a flat dimension?

Yes. A flat dimension is the easiest type to implement:

```cpp
CustomDimensionManager::getInstance().addSimpleDimension("myns:flat", 345, GeneratorType::Flat);
```

In the test build, `custom_dim:new_flat_type` is a flat dimension. Keep in mind that adding more dimensions increases the load on the server.

*Applies to: MoreDimensions v0.14.0 and later*

## Can a custom dimension created with MoreDimensions have a custom skybox, or can different dimensions have different times?

Not from the server side. The client renders the sky based on the dimension type, and the server does not send sky textures, so you can only change the sky with a resource pack. Time is also global (the `time` command has no dimension option). In theory, you could spoof the time packets sent to clients, but server-side logic such as mob spawning still follows the actual world time, making this approach impractical.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## Using `/locate` in a custom dimension created by MoreDimensions freezes the server. How do I fix it?

Custom dimensions have no matching structures, and BDS's `locate` implementation does not handle this case, falling into an infinite loop. To fix this, either forbid `/locate` in non-vanilla dimensions (for example, by intercepting the command) or implement structure lookup yourself.

*Applies to: LeviLamina 1.0.x (reported with BDS 1.21.50; later versions unconfirmed). Not confirmed against the source code or the documentation: treat it as a pointer.*

## I followed the SimpleExample tutorial in the MoreDimensions wiki to write a custom dimension mod, and the xmake build fails. What should I do?

The SimpleExample code in the wiki uses `EventBus` without including its header, so add `#include "ll/api/event/EventBus.h"`. Also, `SimpleCustomDimension` is no longer exported as of MoreDimensions 0.14.0, so replace `addDimension<more_dimensions::SimpleCustomDimension>("name", 345, GeneratorType::Flat)` from the wiki with `more_dimensions::CustomDimensionManager::getInstance().addSimpleDimension("name", 345, GeneratorType::Flat);` (see `src/test/TestCustomDimension.cpp` in the repository). Documentation: <https://github.com/LiteLDev/MoreDimensions/wiki>

*Applies to: MoreDimensions current version (0.16.0) and the current state of the wiki SimpleExample*

## MoreDimensions has not been updated for the new version yet, so I am disabling the plugin until it is. Will buildings in the extra dimensions be lost? What should I watch out for?

Dimension data is saved in the world, so you can safely disable the plugin and reinstall it once it is updated. However, make sure to keep MoreDimensions' dimension configuration file in the world directory: `worlds/<world name>/dimension_config.json` (or `dimension_config.json` in the corresponding world directory on the client). This file records the mapping between dimension names and IDs; if it is lost, the dimensions cannot be matched up when you re-enable the plugin.

*Applies to: All current versions (MoreDimensions 0.16.0)*
