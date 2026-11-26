# LeviOptimize

## My LeviLamina server has low TPS. Does LeviOptimize have a profiling command like timings/spark? How do I track down lag?

Since 0.17.1, LeviOptimize provides `/lo profile` (requires the GameDirectors permission and also works from the console). It shows the current and average full-frame MSPT and TPS (over the last 20 samples) from the `full_frame_timing` diagnostics. Note that it only reports overall MSPT and TPS—unlike the old `timing` command, it no longer breaks down time by system or plugin. You can also use `/lo list`, `/lo reload`, `/lo enable <feature>`, `/lo disable <feature>`, and other subcommands to toggle individual optimizations and compare their effects. Common causes of lag include loading many new chunks (for example, players traveling fast with elytra or boats; this recovers once the chunks unload, and you can teleport the players back to the main town), too many entities, high-frequency redstone, poorly performing addons, and lag machines. To track down the source, back up the world locally and open the suspect chunks to inspect them, use a tool such as Amulet to delete or reset chunks if necessary, or compare against a fresh world to rule out plugin, addon, or world issues. If you need a per-plugin time breakdown, consider a third-party plugin such as CoralFans.

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*

## Can LeviOptimize (which has ported Endstone optimizations since 0.17.1) fix client-side rendering lag?

No. LeviOptimize only optimizes server-side logic (chunk publishing, entity broadcasting, redstone, random ticks, and so on) and does not touch client rendering. All current optimizations are marked as server features in the source (`FeatureSide::server`). The client build's `/clilo` command only manages client-side features and reports `not available on this side` for these server-side optimizations.

*Applies to: LeviOptimize 0.17.1 and later*

## Chunks stay loaded after players leave (chunk leak). Do I need ChunkLeakFix on a LeviLamina server?

No. ChunkLeakFix (`dreamguxiang/ChunkLeakFix`, `ES-ChunkLeakFix`) is for Endstone; LeviOptimize already includes this fix. It is controlled by the `chunk_leak_fix` config key (enabled by default) and cleans up leftover state, such as a player's map tracker, when the player disconnects. You can verify that it works with contraptions that depend on chunk unloading, such as sand farms.

*Applies to: LeviOptimize 0.18.0; LeviLamina 26.60.x*

## After installing or updating LeviOptimize with lip, the server still reports a wrong version or a loading error, or lip fails to download it. What do I do?

This usually happens because lip did not actually download or update the package (for example, when the network blocks GitHub). Install it manually instead: download the matching version from <https://github.com/LiteLDev/LeviOptimize/releases>, extract `LeviOptimize-server-windows-x64.zip` for a server (or `LeviOptimize-client-windows-x64.zip` for a client), and copy the `LeviOptimize` folder into `mods/`. Make sure the version matches LeviLamina (0.18.0 requires LeviLamina 26.60.x).

## Technical-Minecraft players build large piglin farms, bone meal machines and similar machines, and the BDS TPS is very low. How can I optimize this?

Install LeviOptimize and use `push_entity_opt` to limit entity pushing. By default it only discards zero-vector pushes, so you must change `max_push_times` from `-1` (unlimited) to a positive number to cap the number of pushes per tick. You can also throttle redstone with a plugin such as RedstoneLimiter, reduce entity counts (by having players build fewer machines or share them), and edit entity definitions to disable collisions for mobs such as villagers. Detecting high-frequency redstone costs performance on its own, so throttling it works better than detecting and breaking it. Third-party plugins and vanilla behavior have not been verified.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

## BDS gets slower and slower after installing large addons (such as AlylicasDungeons or Better on Bedrock). Would a faster CPU or LeviOptimize fix it?

This lag mainly comes from the poor performance of the addons (the script API) themselves, so faster hardware helps very little. LeviOptimize only optimizes certain native systems—such as chunks, entity broadcasting, redstone, and random ticks. Mojang's addons and script API are outside its scope, so installing LeviOptimize will not fix the problem; the only solution is to use fewer addons.

## My LeviLamina server lags when many players are online. How do I install and configure the optimization plugin LeviOptimize?

Install it with lip: `lip install github.com/LiteLDev/LeviOptimize` (the current version is 0.18.0, which requires LeviLamina 26.60.x). The first launch generates `mods/LeviOptimize/config/config.json` with all optimizations enabled by default. You can disable or adjust them under `features` (such as the sub-options of `push_entity_opt`). After editing the file, run `/lo reload` to apply the changes without restarting, or use `/lo enable <feature>` and `/lo disable <feature>` to toggle a feature and save the change directly.

*Applies to: LeviOptimize 0.17.1 and later*

## How can I optimize the performance of a BDS server?

Install LiteLDev's performance mod LeviOptimize (GitHub: `LiteLDev/LeviOptimize`) with lip by running `lip install github.com/LiteLDev/LeviOptimize`, or download `LeviOptimize-server-windows-x64.zip` from Releases and extract it into `mods/`. It optimizes hot spots such as chunk sending, entity broadcasting, redstone updates, the locator bar, random ticks, and async worker scheduling. You can toggle each feature individually in `mods/LeviOptimize/config/config.json` or at runtime with `/lo enable|disable <feature>`. LeviOptimize must match your LeviLamina version (the current v0.18.0 is for LeviLamina 26.60.x). Also, because BDS mostly depends on single-core performance, choose a server CPU with a high clock speed and strong single-core performance; having many cores helps little.

*Applies to: LeviOptimize v0.18.0; LeviLamina 26.60.x*

## Is there a plugin that can raise the TPS of a LeviLamina server? What is the difference between LeviOptimize and levilamina-loc?

Use LeviOptimize (LO for short, <https://github.com/LiteLDev/LeviOptimize>), a performance mod for LeviLamina that optimizes the vanilla hot paths behind low TPS. Install it with `lip install github.com/LiteLDev/LeviOptimize`. By contrast, levilamina-loc (<https://github.com/LiteLDev/levilamina-loc>) is LeviLamina's language pack (localization). lip installs it automatically as a dependency of LeviLamina, and it has nothing to do with performance optimization, so don't confuse the two.

## Chunks and entities are not unloaded after players leave (the entity count balloons and causes lag). Can LeviOptimize still fix this on 26.x versions?

Yes. LeviOptimize is still actively maintained (not archived), and the latest v0.18.0 supports LeviLamina 26.60.x. Its `chunk_leak_fix` feature (source: `src/lo/features/ChunkLeakFix.cpp`) uses the vanilla cleanup logic to remove a player's map trackers, decorations, and dirty state on disconnect so that map data stops tracking and holding an offline player's entities (as the source comment puts it, `so the map does not keep the player's entities alive`). Since v0.17.1, LeviOptimize has been rewritten on a new framework and has ported a number of Endstone optimizations. Features are configured under `features` in `mods/LeviOptimize/config/config.json` using snake_case keys (such as `"chunk_leak_fix": true`), and all of them are enabled by default. If you run into crashes, run `/lo list` to check the status of each feature, then run `/lo disable <feature>` to turn off the other features one by one while keeping only `chunk_leak_fix` enabled to narrow down the cause. You can also run `/lo reload` to apply config changes without a restart.

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*

## How do I check the TPS of a LeviLamina server (LSE has no TPS API)?

Install LeviOptimize (`lip install github.com/LiteLDev/LeviOptimize`) and run `/lo profile`. It prints the current and average full-frame MSPT and the corresponding TPS from the `full_frame_timing` diagnostics (over the last 20 samples). The command requires the GameDirectors permission (OP) and can also be run from the server console. Make sure `diagnostics.full_frame_timing` and `commands.server_feature_manage_command` in `config.json` are set to `true` (the default).

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*

## How do I view or test the performance of a LeviLamina server in a straightforward way? Does LeviLamina itself include optimizations?

LeviLamina itself is only a loader and mod framework and does not include performance optimizations. To measure and tune performance, install LeviOptimize: run `/lo profile` to see the current and average full-frame MSPT and TPS, `/lo list` to check the status of each optimization feature, and `/lo enable <feature>` or `/lo disable <feature>` to toggle individual optimizations at runtime (changes are saved back to `mods/LeviOptimize/config/config.json`). Compare the `/lo profile` numbers before and after toggling a feature to evaluate its effect. Note that the new version no longer provides a per-module time breakdown (such as `LevelChunkTicking`).

*Applies to: LeviOptimize 0.17.1 and later; LeviLamina 26.60.x*
