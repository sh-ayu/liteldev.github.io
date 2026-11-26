# LeviLamina mod API: commands

## How do I unregister commands registered by a LeviLamina mod when it is unloaded or disabled?

You neither need to nor can unregister them manually. BDS commands cannot truly be deleted, and LeviLamina provides no API to unregister them. When a mod is disabled, LeviLamina automatically disables the command overloads that the mod registered and restores them when the mod is re-enabled. While the mod is disabled, running the command on a client shows `Command version mismatch`, which is expected. In theory, you could filter `AvailableCommandsPacket` so clients do not display the command, but LeviLamina itself does not modify packets.

*Applies to: LeviLamina 0.12 and later*

## How do I run a vanilla command (such as `tag`) in the background from a LeviLamina C++ mod, as the server or as a player, and optionally get the command output?

Option 1 (LeviLamina wrapper, returns output): `#include "ll/api/command/CommandRegistrar.h"`, construct a `CommandOrigin` (such as `ServerCommandOrigin` or `PlayerCommandOrigin`), and call `CommandOutput out = ll::command::CommandRegistrar::getServerInstance().executeCommand("tag @a add foo", origin);`. Internally, this runs `compileCommand` followed by `run`, and returns the result in `CommandOutput`.

Option 2 (call BDS directly, following LSE's `mc.runcmd` implementation):

```cpp
CommandContext context(cmd, std::make_unique<ServerCommandOrigin>("Server", ll::service::getLevel()->asServer(), CommandPermissionLevel::Owner, 0), static_cast<int>(CurrentCmdVersion::Latest));
ll::service::getMinecraft()->mCommands->executeCommand(context, false);  // the second argument is suppressOutput
```

To run as a player, pass `std::make_unique<PlayerCommandOrigin>(level, player.getOrCreateUniqueID())` as the origin. The command string does not need a leading `/`. To capture the output, see LSE's `runcmdEx` (`compileCommand` + `command->run(origin, output)`). Related headers: `mc/world/Minecraft.h`, `mc/server/commands/MinecraftCommands.h`, `CommandContext.h`, `ServerCommandOrigin.h`, `PlayerCommandOrigin.h`, `CurrentCmdVersion.h`. Commands must run on the main thread.

*Applies to: LeviLamina 1.x and later (current v26.60.8)*

## When registering a LeviLamina command, how do I declare optional parameters (such as coordinates `CommandPosition` / `CommandPositionFloat`, or strings), and how do I tell whether the player supplied one?

Wrap the field in the parameter struct with LeviLamina's `ll::command::Optional<T>` (from `ll/api/command/Optional.h`) and declare it in the overload with `.optional("fieldName")`. At execution time, use `params.xxx.has_value()` (or `if (params.xxx)`) to check whether it was supplied, and `.value()` or `.get()` to read it. For example:

```cpp
struct Params { std::string name; ll::command::Optional<CommandPositionFloat> pos; };
cmd.overload<Params>().required("name").optional("pos").execute(...);
```

Do not use `BlockPos` for coordinate parameters; use `CommandPosition` or `CommandPositionFloat`. To get the position, extract the value from the `Optional` first and call `origin.getExecutePosition(version, params.pos.value())` (where `version` is the command version) or `CommandPosition::getBlockPos(version, origin, offset)`. Do not read the raw coordinates directly, or the coordinates will be wrong under `/execute`. If you need completely different parameter combinations, you can also register multiple overloads for the command (one with the parameter and one without).

*Applies to: LeviLamina 26.60.x*

## When developing a LeviLamina client mod, registering commands in `onEnable` as the documentation shows does not work. How do I register client and server commands?

Commands are either client commands or server commands. Register server commands through `ll::command::CommandRegistrar::getInstance(false)` (or `getServerInstance()`), and client commands through `getInstance(true)` (or `getClientInstance()`, which exists only in client builds).

The client enables all mods as soon as the game finishes starting (when the main menu appears). Because no command registry exists yet at that point, registering any command in `enable()` fails. Instead:

1. Listen for `ll::event::ServerCommandRegisterEvent` and register server commands in the callback.
2. Listen for `ll::event::ClientCommandRegisterEvent` and register client commands in the callback.

On a dedicated server (BDS), mods are enabled after the world loads, so you can register commands directly in `enable()`. Only server commands can be registered on BDS. In a local world, you can register both kinds; in multiplayer, you can register only client commands.

*Applies to: LeviLamina client edition 26.60.x*

## Can a LeviLamina mod block/remove certain registered commands (such as vanilla `/me`, `/tell`, `/w`, `/msg`)?

LeviLamina provides no API to delete commands. You can remove vanilla commands by hooking and intercepting their registration (`setup`), but do not try to remove commands registered by other mods—forcing this easily crashes the server.

If your only goal is to stop players from spamming or crashing the server with target selectors (such as `/me @e`), use LeviAntiCheat's `disableSelector` setting to block players from using target selectors in commands.

*Applies to: LeviLamina current version (the hook approach depends on the BDS implementation). Not confirmed against the source code or the documentation: treat it as a pointer.*

## I want to replace/extend vanilla commands with LeviLamina (such as adding parameters to `stop`, `effect` or `tp`). Do I need to disable the vanilla command first? Will they conflict? Can LSE do it?

No, do not disable the vanilla command; disabling its `setup` may break the command or even trigger `std::terminate`. Instead, use LeviLamina's C++ command API: look up the command by name with `ll::command::CommandRegistrar::getInstance(false).getOrCreateCommand("stop", ...)` (or `getServerInstance()`), and attach new overloads with `.overload<Params>()`. Your overloads will coexist with the vanilla ones without conflict. You can also register a separate command and assign aliases with `.alias(...)`. Do not access `StopCommand::mServer` directly, as it may be a null pointer.

For LSE (JS plugins): the old NativeAPI has been removed, but `mc.newCommand` in current LSE also calls `getOrCreateCommand` under the hood. When given an existing command name, it logs `Runtime command ... already exists, changes will not be applied except for setOverload!`. This means the command's description, permission level, and other metadata remain unchanged, but you can still add runtime overloads to it via `setOverload`.

*Applies to: LeviLamina current version*

## What command version should I use when registering/executing commands in a LeviLamina mod? What does `Command version not matched` mean?

When executing or compiling commands, use `CurrentCmdVersion::Latest` (defined in `mc/server/commands/CurrentCmdVersion.h`), which is already the default for the `version` parameter of `CommandRegistrar::executeCommand` and `compileCommand` (`getOrCreateCommand` itself does not take a version). If you need the version inside a command callback (for example, in `origin.getExecutePosition(version, pos)`), use the command instance's own `cmd.mVersion` field; see `src/ll/core/command/Teleport.cpp` in the LeviLamina source for an example.

Note that vanilla outputs `Command version not matched` both when the command version is wrong and when no overload matches. Seeing this message does not necessarily indicate a version mismatch; an overload match may simply have failed. Early in the BDS 26.32 port, some users encountered this error on overloads registered through LL; if you run into it, update to the latest LeviLamina before investigating further.

*Applies to: LeviLamina 26.60.x*

## Must command names registered in BDS/LeviLamina be lowercase?

Yes. Command names must consist solely of lowercase English letters—a limitation of the BDS command system. LeviLamina's `CommandRegistrar::getOrCreateCommand` passes the name straight to BDS's `CommandRegistry` without converting its case, whereas enum values are lowercased by LL automatically.

## When registering a command in C++, what do the `CommandPermissionLevel` levels (`Any`/`GameDirectors`/`Admin`/`Host`/`Owner`/`Internal`, 0 to 5) mean? What level is an OP player?

The enum names come from vanilla Mojang:

- 0 `Any`: regular players.
- 1 `GameDirectors`: the default OP level in BDS; command blocks also run at this level.
- 2 `Admin`: higher than level 1, though almost no vanilla command uses it.
- 3 `Host`: full OP, equivalent to the host of a single-player world (for example, `/kick` requires level 3).
- 4 `Owner`: the server console.
- 5 `Internal`: for internal use; in practice, essentially the same as level 4.

According to user reports, a deopped player cannot run `GameDirectors` commands even in Creative mode; an OP can run `GameDirectors` commands but not `Admin` or `Host` commands; and the console cannot run `Internal` commands. In practice, levels 0/1/3/4 are the ones you will use. Setting `op-permission-level=4` in `server.properties` (note that the key ends in `level`) raises the OP permission level so OPs can run commands like `/stop` in-game.

*Applies to: current version (permission behavior depends on BDS). Not verified against the source code or documentation; treat as a rough guide.*

## On the LL client, if a mod registers a command with the same name (such as `/fm`) on both the server and the client, which one wins when a player runs it? When should client commands be registered?

It depends on whether the command is registered on the client or the server: a client command (`CommandRegistrar::getClientInstance()` / `getInstance(true)`) takes precedence over a server command of the same name (`help` is a typical example).

In current versions of LeviLamina, command registration is event-driven: register client commands on `ll::event::command::ClientCommandRegisterEvent` and server commands on `ServerCommandRegisterEvent`. (LL's own `BuiltinCommands` works this way, calling `registrar.clear()` and re-registering whenever the event fires.) This ensures commands are rebuilt properly when a player leaves and re-enters a world or switches servers. Older workarounds—such as registering in `ClientJoinLevelEvent` or `onEnable`, or passing `false` for the client-side flag—are no longer necessary.

*Applies to: LeviLamina 26.10.0 and later (client build)*

## In a LeviLamina native command, how do I get the real coordinates from a position parameter? What is wrong with calling `CommandPosition::getPosition` directly?

Use `origin.getExecutePosition(cmd.mVersion, param.pos)` to get the `Vec3` coordinates directly (convert to `BlockPos` if you need integers). You do not need to handle relative-coordinate offsets yourself. `getExecutePosition` calls `CommandPosition::getPosition` internally, and the `/execute` context's `CommandOrigin` overrides that function, so calling `getPosition` directly returns incorrect coordinates under `/execute`. Pass `Command::mVersion` as the command version.

Because `getExecutePosition` currently takes a `CommandPositionFloat const&` parameter, declare the coordinate field in your parameter struct as `CommandPositionFloat`. For an example, see `src/ll/core/command/Teleport.cpp` in the LeviLamina source.

*Applies to: LeviLamina 0.11 and later*

## In a LeviLamina command overload, which type should a coordinate (`Vec3`) command parameter use?

Use `CommandPositionFloat` (or `CommandPosition`; `CommandPositionFloat` inherits from `CommandPosition`) in the parameter struct. Because `CommandOrigin::getExecutePosition` takes a `CommandPositionFloat`, `CommandPositionFloat` is recommended. Parameter type names follow Mojang's naming convention and have no common prefix; you can look up command parameter type names on the mcwiki or in LeviLamina's `src/ll/core/command/Teleport.cpp`.

*Applies to: LeviLamina 0.11 and later*

## What do `.text()` and `.postfix()` do in LeviLamina command registration (`CommandRegistrar` / `overload`), and how do I use them?

`text` adds a fixed literal (a keyword) to the command. For example, you can write `/aa bb cc` as `cmd.overload().text("bb").text("cc").execute(...)`. It is not the same as a `std::string` parameter.

`postfix` adds a suffix to the preceding parameter, turning it into a suffix parameter (vanilla supports only integer suffixes). For example, given `xp.overload<XP>().required("value")...` and `xp.overload<XP>().required("level").postfix("l")...`, `/xp 1` matches the first overload and `/xp 2l` matches the second.

*Applies to: LeviLamina 0.11 and later*

## In `command.overload().execute([](CommandOrigin const& origin, CommandOutput& output){...})` when registering a LeviLamina command, what are `origin` and `output`? Must the logger come from the entry class?

`origin` (`CommandOrigin`) is the source of the command execution; you can check who ran the command using methods such as `getEntity()`, `getName()`, and `getOriginType()`. `output` (`CommandOutput`) returns the command result—for example, `output.success("...")` or `output.error("...")` (fmt formatting is supported).

The logger does not have to come from the entry mod. Although `ll::io::Logger` cannot be constructed directly, you can call `ll::io::LoggerRegistry::getInstance().getOrCreate("name")` to get a `std::shared_ptr<Logger>` for global use. For logs needed only during development, use the `debug` level.

*Applies to: LeviLamina 1.x and later*

## When registering a LeviLamina command, do parameter enums have to be hard-coded one by one? How do I use enum values that can change dynamically (passing an array)?

Use a soft enum, whose values can be added and removed at runtime (a typical example is the `objectives` parameter of the vanilla `scoreboard` command). In LL, register one with `ll::command::CommandRegistrar::getInstance(false).tryRegisterSoftEnum("name", {values...})`, and update it dynamically with `addSoftEnumValues`, `removeSoftEnumValues`, or `setSoftEnumValues`. For the parameter type, use `ll::command::SoftEnum<T>` (`ll/api/command/SoftEnum.h`).

*Applies to: LeviLamina 1.x and later*

## Can a custom command registered with LeviLamina take different parameter types after the same command literal (such as a target selector or coordinates) and run different logic, like vanilla `/tp`?

Yes. After getting a `CommandHandle` through `CommandRegistrar::getOrCreateCommand`, call `overload<Params>()` multiple times to register several overloads. Each overload has its own parameter list and `execute` callback.

Watch the matching priority between overloads. For example, if an overload with a `<string>` parameter and an overload with an `<enum>` parameter are registered at the same position, the parser always chooses the string overload. Design your overloads so that a string parameter does not swallow other types.

*Applies to: LeviLamina 1.x and later*

## How do I make target selectors (`@a`, `@p` and so on) unable to select certain players (such as vanished players) in a LeviLamina mod?

Hook `CommandSelectorBase::newResults` (which returns `std::shared_ptr<std::vector<Actor*>>`) and filter the players you want to exclude (such as vanished players) out of the original result. Target selectors will then no longer select them.

*Applies to: LeviLamina 0.13.x and later (the function still exists in the current version)*

## Which types should I use for item, block, effect and similar parameters (the old LLSE `ParamType.Item/Block/Effect`) when registering a command in a native LeviLamina mod?

Don't follow the LL2 implementation. Check the LeviLamina source file `src/ll/api/command/runtime/ParamKind.h`. The `ParamKind::Kind` enum lists every parameter type that runtime commands support, including `Item`, `BlockName`, `BlockState`, `Effect`, `ActorType`, `Actor`, `Player`, `BlockPos`, `Vec3`, `JsonValue`, and `FilePath`. `ParamKindList` gives the matching C++ types (for example, `Effect` maps to `MobEffect const*`).

*Applies to: LeviLamina 0.11 and later*

## Using the mod's logger inside a LeviLamina command callback lambda fails to compile (`this` not captured / no matching overloaded function). How do I output messages from a command callback?

In a command callback, write to the command's executor through the `CommandOutput` parameter (`output.success(...)` / `output.error(...)`, which support fmt formatting) instead of using the logger. If you do need the logger, don't capture `this`; retrieve it inside the lambda through the mod singleton, for example `my_mod::MyMod::getInstance().getSelf().getLogger().info(...)`.

*Applies to: LeviLamina 0.11 and later*

## Where can I find example code for registering MC commands and other features when developing a LeviLamina mod?

Start with the developer guides in the official documentation. For command registration, see the "Command Guide" (`developer_guides/how_to_guides/command_guide`), which uses `CommandRegistrar::getInstance(false).getOrCreateCommand(...)` from `ll/api/command/CommandRegistrar.h`, followed by `command.overload<Params>().required(...).execute(...)`. You will also find guides for events, forms, hooks, i18n, and more, along with the test code under `src-test` in the LeviLamina repository (such as `src-test/server/testCommand.cpp`). In addition, most LeviLamina mods are published on the lip package index, so you can pick a similar mod and inspect its source repository as a reference.

*Applies to: LeviLamina 1.x and later*

## When a mod registers a command alias, it can take over an alias of another mod (or even of a built-in LeviLamina command). Is this a bug?

Aliases are registered through `CommandHandle::alias()`, which calls BDS's `CommandRegistry::registerAlias` under the hood. LeviLamina only calls `findCommand` to check whether the name is already a command: if it is, the alias is silently skipped and not registered. Conflicts between two aliases depend on how vanilla BDS's `registerAlias` behaves (a later registration may overwrite an earlier one), which is outside LeviLamina's control. When writing a mod, avoid names that duplicate existing commands or aliases.

*Applies to: current LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## How can a command registered by a mod be hidden from players without operator permissions (so it doesn't appear in command completion)?

Assign the command a higher permission level when registering it, for example `ll::command::CommandRegistrar::getInstance(false).getOrCreateCommand("mycmd", "description", CommandPermissionLevel::GameDirectors)` (or a higher level such as `Admin` or `Host`). Players without the required permission can neither see nor run the command. The default, `CommandPermissionLevel::Any`, makes the command visible to everyone.

*Applies to: current LeviLamina version*

## After registering a custom command named `whitelist` with LeviLamina C++, it doesn't work or conflicts. Why?

The vanilla BDS `whitelist` command (an alias of `allowlist`) still exists and hasn't been removed, so a custom command with the same name conflicts with it. Use a different command name. Note also that the vanilla whitelist command requires level 4 (console) permission.

*Applies to: LeviLamina server (BDS), depends on the vanilla BDS command table. Not confirmed against the source code or the documentation: treat it as a pointer.*

## Adding an overload to a vanilla command (such as `gamemode`) with LeviLamina crashes or errors out. How do I add an overload to a vanilla command correctly? Is a runtime overload an overload that can be added at any time?

The issue is registration timing: an overload must be added immediately after the command is registered (once command a is registered and command b is registered after it, a can no longer be modified), or the vanilla commands break. Instead, hook the target command's `setup` and add the overload right after the original overloads are registered (or, if `setup` is inlined, before the next command is registered). `runtimeOverload()` (`RuntimeOverload`) refers to an overload without compile-time parameter type checking, whose parameters are described dynamically at runtime—not an overload that can be added at any time.

*Applies to: LeviLamina 1.x and later*

## How do I set the execute callback of a LeviLamina command overload? Does the `execute<fn>()` form still work?

No. Starting in 0.12, `execute<fn>()` (passing the callback as a template argument) was replaced with `execute(fn)` (passing the callback as a regular argument). Everything else remains the same. For example:

```cpp
cmd.overload<Params>().required("name").execute([](CommandOrigin const& origin, CommandOutput& output, Params const& params) { ... });
```

*Applies to: LeviLamina 0.12 and later*
