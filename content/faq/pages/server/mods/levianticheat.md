# LeviAntiCheat

## Can I skip LeviAntiCheat's (LAC) built-in punishments and have my own plugin listen for cheat events and apply custom punishments? How do I use LeviPenalizeCheat, and is there an LSE version? What happens if I cancel the event?

Yes. Through LeviLamina's EventBus, LAC publishes `lac::punish::PlayerCheatEvent` (a cheat was detected; contains `mCheatType`, `mExtraData`, `mDuration`, and `mType`), `lac::punish::PlayerBanWaveEvent` (BanWave kick/ban), and `lac::punish::SusClientEvent` (suspicious client). All three events are cancellable.

The official template, <https://github.com/LiteLDev/LeviPenalizeCheat>, is a LeviLamina C++ mod template that ships the headers for these events. Use it like any C++ mod: subscribe with `ll::event::EventBus::getInstance().emplaceListener<lac::punish::PlayerCheatEvent>(...)` and implement your own punishment logic. There is no official LSE version; to use these events from a script, you have to write a C++ mod that forwards them (for example, by exporting them to LSE through RemoteCall).

LAC publishes `PlayerCheatEvent` before writing the built-in log and applying the built-in punishment. If you cancel the event, that cheat produces no log output, triggers no built-in punishment, and adds nothing to the BanWave violation value. If you only want to listen without affecting the built-in punishment, do not cancel the event in your handler. To take over punishment completely, you can also set `punish.enable` to `false` in `config.json`.

*Applies to: LeviAntiCheat 0.1.2 and later (still applies to the current v0.18.0)*

## Players are frequently rubber-banded and TPS drops while they move. Is LeviAntiCheat (LAC) the cause? How should I set server-authoritative-movement in server.properties when using LAC?

The rubber-banding comes from BDS's built-in server-authoritative movement validation, not from LAC. Current versions of LAC have no illegal-movement detection: in older versions, `IllegalMovementCheck` only enabled BDS's built-in server movement validation, and it was removed in v0.15.0. LAC therefore does not require you to change any authoritative-movement setting in `server.properties`; leave it at the default.

Some users report that newer BDS versions (from about 1.21.70) force authoritative movement on so that it can no longer be turned off in `server.properties`. Rubber-banding happens more often when server TPS is very low (below about 10), so investigate the cause of the lag first. If you really need to turn authoritative movement off, the only way is with a dedicated mod hook.

*Applies to: LeviAntiCheat 0.15.0 and later (current v0.18.0); the BDS behavior depends on the vanilla version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## After setting online-mode=false in BDS (disabling licensed-account verification), player data and inventories keep getting lost and players join like new players. How do I fix this?

With licensed-account verification disabled, player data may no longer be read the way it was before, making it look as if it was lost. LeviAntiCheat (LAC) includes built-in offline-mode inventory protection that fixes inventory loss for offline-mode players. In `mods/LeviAntiCheat/config/config.json`, set `worldSafety.offlineInventoryProtection` to `true` (default `false`), then restart the server or run `/lac reload`. You can also write your own plugin to save player data.

*Applies to: Current LeviAntiCheat (v0.18.0)*

## What does it mean when LeviAntiCheat (LAC) reports that NoPacket was detected?

It means the player has not sent any packets for longer than a configured time (packet-stop detection). This threshold is controlled by `movement.noPacketCheck.maxNoPacketTime` in `config.json` (default 12 seconds). If you get false positives, increase that value or disable the check by setting `movement.noPacketCheck.enable` to `false`. For development and debugging, you can also disable the check or handle it yourself by subscribing to `PlayerCheatEvent` (see LeviPenalizeCheat).

*Applies to: Current LeviAntiCheat (v0.18.0)*

## How do I use LeviAntiCheat's mute command? Typing mute directly doesn't work.

Muting is a subcommand of LAC's main `lac` command, not a standalone `mute` command. Use `/lac mute <player> [duration (minutes)]` to mute a player, `/lac unmute <player>` to unmute them, and `/lac query <player>` to check their ban/mute status.

*Applies to: LeviAntiCheat 0.4.4 and later*

## The LeviAntiCheat log shows `"xxx" 已被检测到使用: Reach, current reach distance: 5.517 cheat level: 6` (meaning: detected using Reach) and the player is kicked by BanWave. What does it mean? Can I turn it off? Where are the records?

Reach means that a player's attack distance is too long (reach hacks). `current reach distance` is the attack distance detected on that hit, and `cheat level` is the player's accumulated count of over-distance hits (+1 for each over-distance hit, -1 for each normal attack). LAC flags the player for Reach and prints this log entry only when that count exceeds `detectLevel` (default 7). The player may be using a reach cheat, or high latency may have caused a false positive.

The related settings are under `combat.reachDistanceCheck` in `mods/LeviAntiCheat/config/config.json`:

- `enable`: turns the check on or off;
- `reachDistance`: the maximum attack distance outside creative mode, about 3.2 by default;
- `reachDistanceCreative`: the maximum attack distance in creative mode, about 5.3 by default;
- `detectLevel`: the detection threshold.

`punish.checkTypeViolationMap.Reach` sets the violation value added for each Reach detection (default 20). When the total reaches `punish.kickVL` (default 100), BanWave kicks the player; `punish.enableBanWave` turns BanWave off. Every LAC check can be turned on or off individually in the configuration.

LAC writes its dedicated log to `./logs/LeviAntiCheat.log`, and `consoleLog` controls console output. In older versions, the log file recorded nothing; this bug was fixed in 0.8.1.

*Applies to: Current LeviAntiCheat (v0.18.0); the reachDistance option has existed since 0.4.4*

## What is LeviAntiCheat's GitHub address? What is the difference between LLAC and LAC?

Repository: <https://github.com/LiteLDev/LeviAntiCheat>. Install it with `lip install github.com/LiteLDev/LeviAntiCheat`. LLAC (LLAntiCheat) is the legacy anti-cheat from the LiteLoaderBDS (LL2) era, and its repository is archived. LAC (LeviAntiCheat) is the actively maintained anti-cheat for LeviLamina.

## Is LeviAntiCheat (LAC) open source? Does its anti-X-ray work against X-ray resource packs and cheat clients?

LAC is closed source (the public repository contains only the README, configuration docs, language files, and release packages) and does not accept direct code contributions.

Anti-X-ray works by having the server rewrite blocks when sending sub-chunk data (modeled on PaperMC's Anti-Xray), so clients cannot bypass it regardless of whether they use a resource pack or a cheat client. Configure it under `cheatPrevention.antiXray`, where each dimension can use one `engineMode`:

- `0`: replaces fully enclosed ores with stone/deepslate and similar blocks (hide mode);
- `1`: randomly replaces hidden solid blocks with fake ores from `obfuscateBlocks` (fake-ore mode);
- `2`: like `1`, but replaces blocks uniformly per Y layer.

Note: ores exposed to air/water and ores above `maxHeight` may still be visible. Also keep `worldSafety.fakeSeed` enabled so players cannot derive ore positions from the seed.

*Applies to: LeviAntiCheat current version (anti-X-ray was rewritten in 0.16.0/0.17.2; current engineMode 0/1/2)*

## Can LeviAntiCheat (LAC) prevent item duplication exploits such as chunk-border duplication (chunk item duping)?

LAC currently has no fix for chunk-border duplication and does not block donkey duplication either. Under `bugFixes`, it provides the following duplication fixes:

- `uiItemDuplicateFix`: UI slot duplication;
- `fallingBlockCopyFix`: gravity block / sand duplicators, such as pointed-dripstone sand duplication;
- `bundleContainerIdentityFix`: bundle-related duplication caused by a storage container's identity changing;
- `blockActorContainerMoveFix`: duplication caused by pushing container blocks with pistons.

To deal with chunk duplication, track down the offending players through behavior logs, or install a dedicated fix plugin.

*Applies to: LeviAntiCheat 0.17.5 and later (current 0.18.0)*

## I want to use LeviAntiCheat to fix the item duplication bug that uses the crafting table / UI slots, but I don't want to enable all of LAC's features. What should I do?

LAC includes a built-in fix for UI slot duplication, controlled by `bugFixes.uiItemDuplicateFix` (default `true`). You can turn off every LAC feature individually in `mods/LeviAntiCheat/config/config.json`: leave `bugFixes.uiItemDuplicateFix` set to `true` and set the `enable` or boolean value of the checks you don't need to `false` (for example, `cheatPrevention.antiXray.enable`, `movement.timerCheck.enable`, `combat.autoClickCheck.enable`, and so on; to prevent players from being kicked as well, set `punish.enable` to `false`). Change the values rather than deleting the options. Afterward, run `/lac reload` or restart the server. Install with: `lip install github.com/LiteLDev/LeviAntiCheat`

*Applies to: LeviAntiCheat current version (0.18.0, LeviLamina 26.60.\*)*

## How does LeviAntiCheat's anti-X-ray (AntiXray) work?

LAC's anti-X-ray uses obfuscation modeled on PaperMC's implementation. The server rewrites the chunk data it sends to the client, replacing ores that are completely enclosed by solid blocks—and therefore invisible to the player anyway—with fake blocks. Because the client never receives the real blocks, X-ray resource packs stop working. It offers three modes:

- `engineMode` 0: replaces the ores in `obfuscateBlocks` with `mainBlock` (stone or deepslate by default);
- `engineMode` 1: randomly replaces hidden solid blocks with blocks from `obfuscateBlocks`;
- `engineMode` 2: replaces blocks uniformly by y layer.

Anti-X-ray is configured per dimension under `cheatPrevention.antiXray` (`dimensions`) in `config.json`; see `anti_x_ray.zh.md` in the repository for details. Ores exposed to air are not hidden. Keep `worldSafety.fakeSeed` enabled as well, or players can derive ore positions from the seed.

*Applies to: LeviAntiCheat current version (0.18.0)*

## LeviAntiCheat flags and kicks OPs/admins too. Is there an OP exemption? How do I make LAC ignore admins?

LAC does not distinguish OPs from regular players and treats everyone the same. This is normal behavior, and the configuration has no OP exemption option. Instead, you can:

1. Disable the specific check that causes false positives in `config.json` (for example, `movement.timerCheck`, `noPacketCheck`, or a check under `combat`);
2. Use the official LeviPenalizeCheat template (<https://github.com/LiteLDev/LeviPenalizeCheat>) to write custom punishment logic that skips admins. You can also adjust thresholds such as `kickVL` under `punish`.

The old third-party plugin Lac-IgnoreOperator is archived (last released in 2025-01) and is not recommended for newer versions.

*Applies to: LeviAntiCheat current version (0.18.0)*

## After setting LeviAntiCheat's anti-X-ray height too high (for example 256 for the Nether), players get stuck on terrain generation / the loading screen when entering the Nether. Can this "height" setting change the Nether's height?

No. The `cheatPrevention.antiXray.dimensions.<dimension>.maxHeight` setting only controls the maximum height at which anti-X-ray applies—only blocks below that y coordinate are obfuscated. It has nothing to do with the dimension's actual height, as an anti-cheat plugin does not modify the game itself. `maxHeight` should stay within the dimension's height range (128 by default for the Nether) and must be a multiple of 16; otherwise, LAC logs an error and disables anti-X-ray for that dimension.

According to the maintainers, setting the obfuscation height above the dimension's height causes the client to reject the chunks sent by the server and get stuck on the loading screen. Set it back to 128. Changing the Nether's height requires a separate dedicated plugin.

*Applies to: LeviAntiCheat current version (0.18.0)*

## How do I hide or fake the world seed from players on a LeviLamina server? Do I still need a separate FakeSeed plugin?

You do not need a separate plugin. LeviAntiCheat includes a built-in fake seed feature (`worldSafety.fakeSeed`, enabled by default) that rewrites the seed the server sends to the client. Install it with `lip install github.com/LiteLDev/LeviAntiCheat`.

An addon cannot do this. Using a resource pack to hide the seed on the settings screen only hides it visually; the client still receives the real seed. You can also modify world generation using a behavior pack's feature rules and custom biomes so that structure positions cannot be derived even if players know the seed.

*Applies to: LeviAntiCheat current version (0.18.0)*

## What do the fakeSeed options (enable, randomSeed, seed) in LeviAntiCheat's configuration file mean?

`fakeSeed` is located under `worldSafety` in `config.json` and sends a fake seed to the client.

- `enable`: whether the fake seed is enabled;
- `randomSeed`: when `true`, LAC uses a random fake seed and ignores `seed`;
- `seed`: the fixed fake seed value sent when `randomSeed` is `false`.

Default values:

```json
"worldSafety": { "fakeSeed": { "enable": true, "randomSeed": false, "seed": 0 } }
```

With the fake seed enabled, you do not need to manually disable client-side chunk generation (ClientSideChunkGen); LAC handles it automatically.

*Applies to: LeviAntiCheat current version (0.18.0)*

## Which anti-cheat plugins can I use on a LeviLamina server? Is there a LeviLamina version of the old LLAC?

Yes: LiteLDev's official LeviAntiCheat (LAC), available at <https://github.com/LiteLDev/LeviAntiCheat>. Install it with lip (`lip install github.com/LiteLDev/LeviAntiCheat`) or download it from GitHub Releases. Make sure to choose the LAC version that matches your LeviLamina version (for example, LAC 0.18.0 depends on LeviLamina 26.60.*).

*Applies to: LeviLamina current version*

## Can I directly use an anti-cheat dll plugin written for LiteLoaderBDS (LL2) on a LeviLamina server?

No. Native LiteLoaderBDS (LL2) plugins cannot run on LeviLamina. Instead, use the official anti-cheat plugin, LeviAntiCheat (LAC): <https://github.com/LiteLDev/LeviAntiCheat>. Install it with `lip install github.com/LiteLDev/LeviAntiCheat`, or download it from the Releases page (<https://github.com/LiteLDev/LeviAntiCheat/releases>). Make sure the LAC version matches your LeviLamina version (for example, LAC v0.18.0 depends on LeviLamina 26.60.*).

*Applies to: All current LeviLamina versions*

## Why does Windows Defender / Windows Security / 360 flag LeviAntiCheat (LAC) as a virus or trojan and delete it? What should I do?

This is a false positive. LAC is a closed-source plugin. According to the maintainers, it is packed/code-protected (VMProtect) and its DLL has no digital signature, so antivirus software often mistakes it for a trojan. Download LAC only from the official GitHub Releases or through lip, add the server directory (or the `mods/LeviAntiCheat` directory) to the exclusion or trusted list in Windows Defender or your antivirus software, and then extract or install it again.

*Applies to: All current LeviAntiCheat versions (Windows). Not confirmed against the source code or the documentation: treat it as a pointer.*

## After enabling LeviAntiCheat's anti-X-ray, players report that the diamonds and other ores they mined turned into stone. Is this a bug?

This is not a bug. With `engineMode: 1` or `2` (the default is 1), anti-X-ray misleads X-ray users by replacing solid blocks that are completely surrounded by other solid blocks with fake ores from `obfuscateBlocks` before sending them to the client. When a block changes (for example, when mining starts or an explosion occurs), the server resends the actual surrounding blocks, turning the fake ore back into real stone.

If players see ores changing right in front of them, increase `cheatPrevention.antiXray.dimensions.<dimension>.updateRadius` for that dimension (the default is 2). Note that a larger radius increases the area a client can see through.

*Applies to: LeviAntiCheat current version (configuration structure after the anti-X-ray rewrite in v0.17.2)*

## LeviAntiCheat's anti-X-ray (anti x-ray) seems to have no effect when enabled, or causes rubber-banding. How do I tune the parameters?

Tune the parameters according to the official documentation: <https://github.com/LiteLDev/LeviAntiCheat/blob/release/anti_x_ray.zh.md>. It explains each option under `cheatPrevention.antiXray` (`enable`, `maxThreads`, `autoSolidCheck`, `dimensions.<dimension>.engineMode`/`maxHeight`/`updateRadius`/`obfuscateBlocks`/`mainBlock`, and so on), provides recommended Overworld and Nether configurations for `engineMode` 0/1/2, and covers troubleshooting for common issues such as "ores are still visible" and "it does not work below y=0".

*Applies to: LeviAntiCheat current version*

## Is there a plugin that can detect banned items such as 32k items (illegal enchantments, bedrock, portal blocks, spawners, spawn eggs, blocks with special values, and so on)?

Use LiteLDev's official anti-cheat plugin, LeviAntiCheat (LAC). In `mods/LeviAntiCheat/config/config.json`, add the namespaced IDs of the items you want to ban (such as `"minecraft:bedrock"`) to `inventoryManagement.banItem.blacklist`. To detect over-leveled enchantments, enable `inventoryManagement.enchantCheck` (disabled by default) and set the maximum level for each enchantment in `maxEnchantLevel`. LAC also provides checks such as `anvilEnchantLimits` (anvil enchantment check), `invalidItemDetection`, `invalidStackDetection`, and `antiInvalidNbtItem`.

*Applies to: LeviAntiCheat current version (config version 21)*

## Why does LeviAntiCheat's banned/illegal item detection not report end portal frames a player already has? How do I ban certain items?

Once LAC is installed, it blocks players from obtaining these items and logs a message in the console. Unreported items are usually leftovers obtained before LAC was installed.

To ban items, add their namespaced IDs to `inventoryManagement.banItem.blacklist` (a string array) in `mods/LeviAntiCheat/config/config.json`—for example, `"blacklist": ["minecraft:bedrock", "minecraft:end_portal_frame"]`—and keep `banItem.enable` set to `true`. A match triggers the BanItem check and adds a violation value defined in `punish.checkTypeViolationMap.BanItem`. By design, LAC does not remove items; to remove them, listen for `lac::punish::PlayerCheatEvent` (see the LeviPenalizeCheat template) and handle the removal yourself.

*Applies to: LeviAntiCheat current version (config version 21)*

## Does the banItem (banned item list) in LeviAntiCheat's (LAC) configuration support regular expressions?

No. `inventoryManagement.banItem.blacklist` accepts only exact namespaced item IDs (such as `"minecraft:bedrock"`). Regular expressions and wildcards are not supported.

*Applies to: LeviAntiCheat current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

## LeviAntiCheat's enchantment check kicks players by mistake (for example, the anvil enchantment check triggers when taking off armor) or cannot be turned off. What should I do?

LAC has two independent enchantment checks: `inventoryManagement.enchantCheck` (enchantment level check, off by default) and `inventoryManagement.anvilEnchantLimits` (anvil enchantment check, on by default). Turning off only `enchantCheck.enable` is not enough; you must also set `"anvilEnchantLimits": false` to disable all enchantment-related checks completely. After making the change, run `/lac reload` or restart the server. Alternatively, you can lower the violation values for `InvalidAnvilEnchant` / `InvalidEnchantLevel` in `punish.checkTypeViolationMap` to prevent kicks. False positives when taking off armor in early versions such as 0.4.0-rc6 were fixed in rc.6 through rc.8, so update to the latest version.

*Applies to: LeviAntiCheat current version (config version 21)*

## I downloaded LeviAntiCheat (LAC, with anti-X-ray) and put it in the server, but it does not load, shows no message, and I cannot find a config file. How should I install it?

We recommend installing it with lip: `lip install github.com/LiteLDev/LeviAntiCheat`. lip places the files in the right location and matches your LeviLamina version automatically.

To install it manually, download `LeviAntiCheat-windows-x64.zip` from GitHub Releases and extract the entire `LeviAntiCheat/` folder (which contains `manifest.json` and the DLL) into the server's `mods/` directory, resulting in `mods/LeviAntiCheat/`. Do not copy only the DLL, and do not nest it inside an extra folder. If you only see metadata files like the manifest and no config file, the plugin did not load; once it loads properly, it generates `mods/LeviAntiCheat/config/config.json`.

Also make sure the LAC version you downloaded matches your LeviLamina version (for example, LAC 0.18.0 requires LeviLamina 26.60.*). Older versions (such as 0.2.x, built for LiteLoaderBDS or old LL) will not load. You can configure the anti-X-ray feature under `cheatPrevention.antiXray` in the configuration file.

*Applies to: LeviLamina current version (LAC 0.18.0 / LeviLamina 26.60.\*)*

## I installed LeviAntiCheat but cannot find its configuration file. Where is it?

The configuration file is generated at `mods/LeviAntiCheat/config/config.json` only after you start the server once and the plugin loads successfully. After editing the file, restart the server or run `/lac reload` to apply your changes.

*Applies to: LeviAntiCheat current version (0.18.0)*

## Uninstalling LeviAntiCheat with lip inside a docker container fails. How do I uninstall it?

`lip uninstall` is a command-line operation and is not blocked simply because the server is running. However, if a file to be deleted is locked by the running server (such as `LeviAntiCheat.dll` loaded by BDS on Windows), the uninstall fails and rolls back completely. In that case, stop the server first and then run `lip uninstall github.com/LiteLDev/LeviAntiCheat` (note that the lip GUI refuses to uninstall outright while the server is running).

In the current official Docker images, the container's main process is `lip run`. Stopping the server causes the container to exit, so you cannot "stop the server and then enter the container". Instead, run the following command while the container is running:

```shell
docker exec -it <container-name> lip uninstall github.com/LiteLDev/LeviAntiCheat
```

This works the same way the official tutorial installs mods using `docker exec ... lip install`. Afterward, run `docker stop` and start the container again for the change to take effect.

In the Wine image, lip runs natively on Linux and usually does not run into file locks. If the uninstall fails due to a file lock in a Windows container image, stop the container, start a temporary container mounted to the same data volume, and override the entrypoint to run the lip uninstall command. Also, if you installed the package using the `PACKAGES` environment variable, note that this variable only runs on the first startup; removing a package from it does not uninstall packages that are already installed.

*Applies to: lip current version (v0.41.x), docker-levilamina-server current images (latest-wine / latest-windows)*

## LeviAntiCheat worked at first (or was installed with lip), but later startup reports a load error and LeviAntiCheat.dll is gone. What is the cause?

This is usually not an issue with lip or the plugin itself. Instead, Windows Defender (Windows Security) likely quarantined or deleted `LeviAntiCheat.dll` as a threat (because LAC is closed-source and packed with protection, it often triggers false positives). Restore the file from "Protection history" in Windows Security, add the server directory to your exclusions, and reinstall the plugin (for example, by running `lip install github.com/LiteLDev/LeviAntiCheat`).

*Applies to: LeviLamina servers running on Windows, all current versions. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What value should LeviAntiCheat's anti-X-ray (`antiXray`) `engineMode` use? How do the modes differ, which is cheapest, and does it modify the world?

The current values are `0`/`1`/`2` (not the old `1`/`2`/`3`; PaperMC modes 1/2/3 in older documentation and images correspond to 0/1/2 here). Configure this per dimension in `cheatPrevention.antiXray.dimensions.<dimension>.engineMode`:

- `engineMode: 0`: replaces ores listed in `obfuscateBlocks` with a fake block (`mainBlock`, default `minecraft:stone`; below y=0 it uses `mainBlockMinus`, default `minecraft:deepslate`). It only hides ores completely enclosed by solid blocks; ores exposed to air or water are not hidden. This mode has the lowest computational cost.
- `engineMode: 1`: randomly replaces enclosed solid blocks with blocks from `obfuscateBlocks`. This is more effective against X-ray, but sends more data.
- `engineMode: 2`: similar to 1, except every block in the same y layer is replaced with the same fake block, making subchunks more uniform so they compress better in packets.

Chunk rewriting runs on worker threads (`maxThreads`; 0 uses the number of CPU threads), so the main thread is barely affected. Anti-X-ray only rewrites packets sent to clients and does not modify the world. Only blocks below `maxHeight` (which must be a multiple of 16) are obfuscated, and real blocks are resent within `updateRadius` when blocks change. Keep `worldSafety.fakeSeed` enabled as well to prevent seed reverse-engineering. You can also disable LAC's anti-X-ray and use the standalone GlacieTeam/AntiXray instead. Their options mostly correspond (AntiXray uses snake_case, while LAC uses camelCase), though you will need to check whether its version supports your current LeviLamina version.

*Applies to: LeviAntiCheat 0.16.0 and later (current 0.18.0)*

## The server crashes after installing LeviAntiCheat (LAC) on a LeviLamina server (crash on startup or while running). What is the cause, and how do I fix it?

First, confirm that your LAC version matches your LeviLamina version: each LAC release supports only specific LeviLamina versions (for example, installing a LAC build for LeviLamina 1.2 on 1.1 caused the server to crash on startup). Download the LAC version that matches your LeviLamina version, or upgrade LeviLamina to the version LAC requires. Installing via `lip install github.com/LiteLDev/LeviAntiCheat` is recommended because lip checks version dependencies automatically.

If the server still crashes while running even with matching versions, set `cheatPrevention.antiXray.enable` to `false` in `mods/LeviAntiCheat/config/config.json` to isolate the problem (anti-X-ray has historically been a common source of LAC crashes), and open an issue with the maintainers. If you do not need features like anti-X-ray, you can also skip LAC entirely; LeviLamina's built-in vulnerability fixes (`vulnerabilityFixes`) do not depend on LAC.

*Applies to: All current versions (latest LAC v0.18.0 corresponds to LeviLamina 26.60.\*)*

## After installing LeviAntiCheat (LAC), blocks in the overworld display incorrectly. How do I fix it?

This is usually caused by LAC's anti-X-ray feature, which obfuscates blocks fully enclosed by solid blocks (with the default `engineMode` of 1, these hidden solid blocks are randomly replaced with ores from `obfuscateBlocks` before being sent to the client). In `mods/LeviAntiCheat/config/config.json`, set `cheatPrevention.antiXray.dimensions.overworld.enable` to `false` to disable anti-X-ray in the overworld (or set `cheatPrevention.antiXray.enable` to `false` to disable it everywhere), then run `/lac reload` or restart the server. If the display issue affects addon blocks, also check settings such as `treatAddonBlocksAsNonSolid` and `nonSolidBlocks`.

*Applies to: All current versions (config keys as of LAC 0.17.x/0.18.0)*

## After installing LeviAntiCheat (LAC), startup reports a version-related error and it cannot load. What should I do?

LAC is compiled against specific LeviLamina versions, so the two versions must match. Install the LAC release that matches your current LeviLamina version (or upgrade both to matching versions). Installing with lip is recommended so dependencies are resolved automatically: `lip install github.com/LiteLDev/LeviAntiCheat`. For example, the latest LAC 0.18.0 requires LeviLamina 26.60.*; check the CHANGELOG to see which LL version each LAC release supports.

*Applies to: All current versions (LAC 0.18.0 corresponds to LeviLamina 26.60.\*)*

## Can LeviAntiCheat (LAC) be installed together with the Fishing anti-cheat (FAC)?

At the time, the maintainers stated that the two are incompatible: FAC breaks one of LeviLamina's APIs, so you can only use one or the other.

*Applies to: April 2024, LeviLamina 0.x era; current version unknown. Not confirmed against the source code or the documentation: treat it as a pointer.*

## What does the ban duration (`duration`) field in LeviAntiCheat (LAC) punishment settings mean?

It specifies the ban duration, not a count of cheating incidents. In the current config, this corresponds to `punish.banDuration`, measured in seconds (`0` means a permanent ban). `punish.banVL` determines whether a player is banned (`-1` disables banning), while `kickVL` sets the violation level for kicking. Note that the manual command `/lac ban <player> [reason] [duration (minutes)]` takes its duration in minutes.

*Applies to: current version (LeviAntiCheat 0.18.0, config version 21)*

## LeviAntiCheat reports 「已被检测到使用: InvalidFilterString, string size: ...」 (detected using: InvalidFilterString, string size: ...) and kicks a player through BanWave, but the player only renamed an item with an anvil and a name tag using vanilla `§` color codes. What is going on?

This is triggered by LAC's item name length check (violation type `InvalidFilterString`) when the item name string exceeds the configured limit. The `string size` in the log reflects the UTF-8 byte count of the name. Because `§` format codes and Chinese characters each take several bytes, a name that looks short can still exceed the limit. In `mods/LeviAntiCheat/config/config.json`, increase `playerInteractions.itemNameLengthCheck.maxStringLength` (default 90), or set `itemNameLengthCheck.enable` to `false` to disable the check. You can also lower the violation value of `punish.checkTypeViolationMap.InvalidFilterString` (default 50); `punish.enableBanWave` controls ban waves. Run `/lac reload` after changing the config.

*Applies to: current version (LeviAntiCheat 0.18.0)*

## After editing LeviAntiCheat's `config.json`, the log shows errors (such as AntiXray block configuration errors). What should I do?

A required entry was likely deleted, a block name is incorrect, or the JSON is malformed. Back up and delete `mods/LeviAntiCheat/config/config.json`, restart the server to generate a fresh default config, and reapply your edits. Also note that if AntiXray's dimension name, `engineMode`, or `maxHeight` (which must be a multiple of 16) is invalid, the log reports an error and anti-X-ray will not be enabled for that dimension.

*Applies to: current version (config path `mods/LeviAntiCheat/config/config.json`). Not confirmed against the source code or the documentation: treat it as a pointer.*

## LeviAntiCheat's Timer (packet rate) check falsely flags normal players and kicks them even when standing still, with `rate` around 25-30 in the log. What should I do?

A normal client sends movement input packets at the tick rate—about 20 per second (fluctuating around 18-22)—while LAC's default threshold is 24. Network jitter can cause false positives. In the config, raise `movement.timerCheck.maxPacketSpeed` to around 30 (you can also adjust `detectLevel`, default 15, or lower the `punish.checkTypeViolationMap.Timer` violation value), and then run `/lac reload`.

*Applies to: current version (LeviAntiCheat 0.18.0)*

## Does LeviAntiCheat's anti-X-ray support custom dimensions created by MoreDimensions?

Anti-X-ray is configured per dimension, keyed by dimension name under `cheatPrevention.antiXray.dimensions` (which includes only `overworld` and `nether` by default). According to the maintainers, you must manually add an entry there using the custom dimension's name. If the dimension name is not recognized, the log reports an error and anti-X-ray is disabled for that dimension, so check the log to verify.

*Applies to: current version (AntiXray was rewritten in 0.16.0/0.17.2). Not confirmed against the source code or the documentation: treat it as a pointer.*

## Is there Chinese documentation or a tutorial for LeviAntiCheat's configuration file?

Yes. The repository's Chinese README (<https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md>) provides the full default configuration with Chinese comments (the config file is located at `mods/LeviAntiCheat/config/config.json`). The anti-X-ray submodule also has its own documentation, `anti_x_ray.zh.md`. Note that the `"version"` field in the config file indicates the config version number (currently 21); do not edit it manually.

*Applies to: LeviAntiCheat current version (0.18.0)*

## LeviAntiCheat (LAC) often wrongly bans or kicks normal players. How do I reduce false positives or turn off some checks (for example, keep only anti-X-ray)?

Edit `mods/LeviAntiCheat/config/config.json` (run `/lac reload` or restart the server afterward), and either set `enable` to `false` for checks that produce false positives or loosen their thresholds:

- Speed hack (timer) check, a common source of wrongful bans: `movement.timerCheck.enable`, or raise `maxPacketSpeed` (maximum movement input packets per second, default 24);
- No-packet check: `movement.noPacketCheck.enable`, or raise `maxNoPacketTime`;
- Auto-clicker and attack reach: `combat.autoClickCheck`, `combat.reachDistanceCheck`;
- Item-related checks: `invalidItemDetection`, `invalidStackDetection`, `antiInvalidNbtItem`, `anvilEnchantLimits`, `banItem`, and others under `inventoryManagement`;
- Punishment: `punish.enable` (master switch), `punish.enableBanWave` (ban waves), `kickVL` / `banVL` (violation levels for kicking or banning), and the violation value each check adds per detection in `punish.checkTypeViolationMap`; lower a check's value to reduce wrongful kicks.

If you want only anti-X-ray, keep `cheatPrevention.antiXray.enable=true` and turn off the other checks. See <https://github.com/LiteLDev/LeviAntiCheat/blob/release/README.zh.md> for a description of each option.

Note: LAC removed `IllegalMovementCheck` in 0.15.0. Movement validation—such as being pulled back while walking—comes from vanilla BDS server-authoritative movement and can no longer be adjusted through LAC.

*Applies to: LeviAntiCheat 0.15.0 and later (current 0.18.0)*

## After installing LeviAntiCheat (LAC), players take fall damage when jumping or running on flat ground (TPS and latency are normal). How do I fix it?

This is caused by LAC's "remove client authority over player actions" feature. In `mods/LeviAntiCheat/config/config.json`, set `movement.disablePlayerActionsAuthority` to `false` (it defaults to `false` since 0.17.4; in 0.17.3 the feature is named `PlayerActionsAuthority` and is enabled by default, so upgrading to the latest version is recommended).

*Applies to: LeviAntiCheat 0.17.3 and later (in current 0.18.0 the key is `disablePlayerActionsAuthority`)*

## After installing LeviAntiCheat (LAC), the server console keeps kicking players, even all players, so nobody can join. How do I fix it?

This is usually a false positive from LAC's no-packet check (NoPacket). That check detects players who stop sending packets to the server for an extended time; turning it off does not make cheaters "invincible". In `mods/LeviAntiCheat/config/config.json`, set `movement.noPacketCheck.enable` to `false`, or raise `movement.noPacketCheck.maxNoPacketTime` (default 12 seconds). Also, version 0.4.5 fixed NoPacket false positives when the server's main thread lags, so first make sure you are running the latest LAC.

*Applies to: LeviAntiCheat current version (0.18.0)*

## Some plugins that change player name display by sending packets conflict with LeviAntiCheat's fake-name check. What should I do?

In `mods/LeviAntiCheat/config/config.json`, set `cheatPrevention.antiFakeName` to `false` (it is `false` by default in the current version).

*Applies to: LeviAntiCheat current version (0.18.0)*

## After installing LeviAntiCheat, players get kicked for typing commands like `shop` repeatedly. What should I do?

This is triggered by the command spam check (`CommandSpam`, which stops cheats such as Horion that send many commands per second). In `mods/LeviAntiCheat/config/config.json`, raise `playerInteractions.antiSpam.maxCmdRate` (maximum commands per second, default 2), or lower `punish.checkTypeViolationMap.CommandSpam` (violation value added per trigger, default 50).

*Applies to: LeviAntiCheat current version (0.18.0)*

## After installing LeviAntiCheat (LAC), some players can still spam and I cannot stop them. What should I do?

Adjust the `playerInteractions.antiSpam` settings in `mods/LeviAntiCheat/config/config.json`: make sure `enable` is `true`, lower `maxChatRate` (maximum chat messages within `chatRateDuration` seconds; default is 5 messages in 10 seconds), `maxCmdRate` (maximum commands per second), and `maxChatLength` (maximum chat length), and enable `disableSelector` to forbid target selectors in commands. You can also raise the violation values for `Spam` / `CommandSpam` / `MessageTooLong` in `punish.checkTypeViolationMap` to kick spammers sooner.

*Applies to: LeviAntiCheat current version (0.18.0)*
