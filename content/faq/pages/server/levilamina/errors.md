# LeviLamina errors and crashes

## Error codes

### What does error code 126 mean?

LeviLamina or a mod is missing dependencies. Make sure LeviLamina or the mod is fully installed. The dependency diagnostic in the log lists the missing dependencies.

### What does error code 127 mean?

A dependency of LeviLamina or a mod has the wrong version. The dependency diagnostic in the log lists the dependencies with mismatched versions.

### What does error code 1114 mean?

The Visual C++ Redistributable is outdated. Update [vcredist](https://aka.ms/vc14/vc_redist.x64.exe).

## Server errors

### LeviLamina reports `Failed to load Runtime Data` / `bedrock_runtime_data` is missing on startup. Where does this file come from? What if the server reaches GitHub slowly and lip cannot download?

`bedrock_runtime_data` is not generated at runtime. It comes from LeviLamina's dependency package, bedrock-runtime-data, which lip downloads automatically when you install LeviLamina. This error usually means the installation is incomplete. To fix it, run `lip cache clean` to clear the cache, then reinstall in a new, empty directory. If the server has a slow connection to GitHub or the download stalls, set a GitHub proxy or mirror with `lip config set github_proxy <proxy address>` and try again. If you use a panel server, contact your provider.

*Applies to: LeviLamina 1.x up to current 26.60.x (installed with lip)*

### What should I do when installing or starting LeviLamina (BDS) reports a missing VC runtime / DLL (such as `MSVCP140.dll` or `VCRUNTIME140.dll`), error code 1114, an outdated vcredist, or when `PeEditor.exe` fails during a lip install and LeviLamina does not load?

The Microsoft Visual C++ runtime (vcredist) is missing or outdated. Install or update to the latest x64 version of the Microsoft Visual C++ Redistributable: <https://aka.ms/vc14/vc_redist.x64.exe> (this is the link currently used in the official documentation; the older link <https://aka.ms/vs/17/release/vc_redist.x64.exe> belongs to the same series). Notes:

1. You must install the latest x64 version. Installing just the latest version is enough; you do not need every older version since 2005. Runtimes bundled with utilities like the DirectX repair tool are often outdated and may still cause the error. If the runtime is already installed, run the installer, choose "Repair", restart your computer, and try again.
2. You need the VC++ runtime, not Visual Studio (VS is only needed for developing mods), and installing the .NET runtime will not fix this problem.
3. After installing the runtime, rerun the lip install command (or rerun `PeEditor.exe` in the BDS directory to generate `bedrock_server_mod.exe`). If an earlier installation failed partway through and left conflicting files behind, reinstall in an empty folder or delete the conflicting files as prompted, and run `lip cache clean` to clear the lip cache if necessary.
4. If the runtime is already up to date and the error persists (for example, error code 126/127), LeviLamina or the mod is most likely not fully installed, or the mod does not match your LeviLamina/BDS version. Follow the Dependency diagnostic output; we recommend installing with lip so that versions are matched automatically.
5. When installing a server on Windows, newer versions of lip check for the VC++ runtime automatically (registry key `HKLM\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64`, `Installed=1`). If it is missing, lip downloads `vc_redist.x64.exe` and installs it silently as administrator, which triggers a User Account Control (UAC) prompt; choose "Yes". If you choose "No", lip reports `The Microsoft Visual C++ Redistributable was not installed: Windows did not allow its installer to run as an administrator.` Rerun the command and allow it, or install the runtime manually from the link above.

See "Troubleshooting" in the official documentation: <https://levilamina.liteldev.com/zh/user_guides/troubleshooting/>

*Applies to: All current LeviLamina versions (Windows server, including 26.60.x)*

### When I double-click `bedrock_server_mod.exe` to start a LeviLamina server, the window flashes and closes (no output, no CrashLogger crash log, same with plugins removed). How do I troubleshoot?

A LeviLamina server starts with `bedrock_server_mod.exe`, which PeEditor generates from `bedrock_server.exe`. If the window closes immediately, do not double-click the executable. Instead, run it from a terminal in the server directory so the window stays open and shows the error before exiting: type `cmd` in the File Explorer address bar and press Enter, or select "File -> Open Windows PowerShell", then run `bedrock_server_mod.exe` (in PowerShell, run `.\bedrock_server_mod.exe`; you can type `bed` and press Tab to autocomplete). If you manage the server with lip, you can also run `lip run` in the server directory to print the server log to the console. Common causes include:

1. The VC++ runtime is missing or outdated (for example, an error about a missing `VCRUNTIME140_1.dll` or `CONCRT140.dll`, or error 1114): install the latest x64 runtime from <https://aka.ms/vc14/vc_redist.x64.exe>. This is usually the cause when a setup works on your own computer but crashes on a server.
2. A typo in a configuration file (for example, `true` misspelled as `ture` in `server.properties` or a JSON config): fix the file as indicated by the error.
3. An outdated LeviLamina configuration file: back up and delete the `mods/LeviLamina/config` folder (or `plugins/LeviLamina/config` on older installations that use the `plugins/` directory), then restart the server so LL generates a fresh configuration.
4. Improperly extracted files or an incomplete installation: extract the files again or reinstall with lip, and make sure the LeviLamina and BDS versions match. Do not use outdated versions.

*Applies to: All current LeviLamina versions (Windows server)*

### After BDS starts, the console only prints something like `NO LOG FILE` and I do not see the LeviLamina startup logo or loading log (for example after upgrading with lip). How do I troubleshoot?

The "NO LOG FILE" line comes from vanilla BDS and is not the cause of the problem. The real issue is the missing LeviLamina startup logo and loading log, which indicates that LeviLamina did not load at all. Make sure you are running `bedrock_server_mod.exe`, that the `mods/LeviLamina` directory exists and contains both `manifest.json` and `LeviLamina.dll`, and that `PreLoader.dll` is in the root directory. Newer versions of LeviLamina changed file locations, so files left over from older versions in the root directory or in `plugins/` can prevent it from loading (see the changelog). The most reliable fix is to perform a fresh LeviLamina installation with lip in a clean server directory, rather than copying files manually or upgrading inside a cluttered old directory.

*Applies to: LeviLamina 1.x and later (currently 26.60.x), server*

### Loading a mod such as GMLIB-LegacyRemoteCallApi fails with `Failed to load mod ... Missing dependency ModAPI`, and installing GMLIB does not help. What should I install?

ModAPI is a base library that GroupMountain (the GMLIB family) split into a separate package. It is not included in GMLIB and must be installed on its own. The easiest method is to use lip to install the mod that depends on it (for example, `lip install github.com/GroupMountain/GMLIB-LegacyRemoteCallApi`); lip automatically pulls in declared dependencies such as GMLIB-Release, ModAPI-Release, and iListenAttentively. To install it manually, download the ModAPI version that matches your LeviLamina/GMLIB version from GroupMountain's GitHub (the ModAPI-Release repository).

*Applies to: Versions after ModAPI was split out of GMLIB (GMLIB-LegacyRemoteCallApi 1.13.0 requires LeviLamina >=26.51.0)*

### Starting a LeviLamina server reports that the port is in use (or the crash log shows the port in use), but the configured port should not be used by any other program. How do I fix it?

A BDS process started earlier from the same path is most likely still running in the background. On startup, LeviLamina detects that "another BDS process with the same path exists, which may cause the network ports and world to be occupied" and asks whether to terminate the process with that PID (y=Yes, n=No, e=Exit); enter `y`. You can also end `bedrock_server_mod.exe` or `bedrock_server.exe` in Task Manager. If you intend to run a second server on the same machine, change both `server-port` and `server-portv6` in `server.properties` and set `enable-lan-visibility` to `false`; otherwise, the servers may still conflict.

*Applies to: All current LeviLamina versions*

### A LeviLamina server freezes (unresponsive but the process does not exit, no crash log) and unloading plugins does not reveal the cause. How do I find where it is stuck?

1. First, make sure LeviLamina, LSE, and all mods are up to date and match each other.
2. Unload mods and plugins by bisection (including addons and world factors) to narrow down the cause.
3. Capture the call stack with a debugger: install WinDbg or x64dbg, attach to the `bedrock_server_mod.exe` process while the server is stuck, break, and check the Call Stack. Check which module or function the `MC_SERVER` main thread is stuck in; this tells you which mod (or LSE script in an infinite loop) is blocking it. To see function names, you need the matching PDB (LeviLamina releases include a debug package).
4. Send a screenshot or text of the call stack to the mod developer or the LeviLamina developers for analysis.

*Applies to: All current LeviLamina versions*

### LeviLamina reports a missing symbol when loading a plugin/mod (`Could not find symbol`, missing API, missing `LeviLamina.dll` export), and updating the dll does not help. How do I fix it?

The symbols do not match: the mod or its prerequisite was compiled for a different LeviLamina or BDS version, and the symbol it needs does not exist in your current version (the dependency diagnostic in the startup log lists the missing content, and the error code is usually 127, "dependency version incorrect"). To fix this, update the mod and prerequisites such as GMLIB to versions that support your LeviLamina version (download them from their GitHub Releases or levimc.org/mods), or switch LL and BDS to a version the mod supports. If BDS or LL itself is incompletely installed or the versions do not match, reinstall matching BDS and LeviLamina versions with lip (for example, `lip install github.com/LiteLDev/bds@<version> LeviLamina`).

*Applies to: All current LeviLamina versions*

### LeviLamina reports `Failed to load manifest for XXX-1.1.0` / `Mod name XXX do not match folder XXX-1.1.0` when loading a mod, and after renaming it cannot find the entry file. How do I fix it?

1. LeviLamina requires the mod folder name to match the `name` field in `manifest.json` exactly. For example, rename `mods/LLBlackBEEx-1.1.0` to `mods/LLBlackBEEx` (remove the version number).
2. If the entry file fails to load after renaming, extraction usually created an extra directory level (`mods/LLBlackBEEx/LLBlackBEEx/...`), so the file referenced by `entry` in the manifest cannot be found. Move all files from the innermost folder into `mods/LLBlackBEEx/` (`manifest.json` must sit directly inside `mods/<mod name>/`), delete the extra inner folder, and restart the server.

Installing mods with lip avoids this directory issue.

*Applies to: All current LeviLamina versions (mod directory is `mods/`)*

### On a 26.40 server, using a Nether portal takes a very long time to teleport and entering an End portal gets stuck on the loading screen. What is the cause?

This is caused by the third-party plugin FuckMovementAuthority, which bypasses server-side movement validation. Uninstall it, and teleporting will work normally. The author has fixed this issue and re-released the plugin as FuckPlayerActionsAuthority; update to the new plugin.

*Applies to: BDS 26.40 + old versions of this third-party plugin. Not confirmed against the source code or the documentation: treat it as a pointer.*

### After setting `language=zh_CN` in `server.properties`, block and item names in the console and in plugins show as translation keys (translation fails), or the translation system misbehaves when Education Edition is enabled or mod items exist. What is the cause?

This is an issue with the third-party prerequisite library GMLIB: interfaces in some GMLIB versions break the translation system. If no plugin depends on GMLIB, deleting it restores normal behavior; otherwise, update GMLIB or report the issue to its author. Removing the `language` setting itself does not help.

*Applies to: GMLIB versions from the BDS 26.40.x + LeviLamina 26.40.x period. Not confirmed against the source code or the documentation: treat it as a pointer.*

### After installing LeviLamina on BDS, the response of the `list` command is abnormal, while vanilla BDS is fine. What is the cause?

This is caused by the third-party prerequisite library GMLIB. Deleting GMLIB restores normal behavior, and the issue is unrelated to LeviLamina itself. The GMLIB maintainers state that it has been fixed; update to a newer GMLIB version or open an issue with them.

*Applies to: GMLIB versions around October 2026. Not confirmed against the source code or the documentation: treat it as a pointer.*

### BDS (with LeviLamina/LSE) reports an error and crashes on startup, and the log shows a memory allocation failure (`bad_alloc`). What is the cause?

Both the error and the crash are caused by a memory allocation failure—that is, insufficient physical memory (RAM, not disk space). In the reported case, the machine had only about 1.5GB of free memory. Close other memory-intensive programs or add more RAM to the server.

*Applies to: All current versions (depends on the environment). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server starts normally, but crashes when a player joins (stack overflow, the trace shows a crash inside BDS internal logic such as a random swim target fetching a chunk). How do I troubleshoot?

This kind of trace only shows that the crash happened inside BDS internal logic. It is usually caused by interference from a mod or plugin, while the world itself is generally fine. Remove plugins one at a time to find the culprit. In the reported case, the cause was the third-party plugin FixCopyItem (a general item duplication fix), and removing it solved the problem. Note that even a plugin advertised as "works on all versions" can break on a new version. Also, when you upgrade LeviLamina, you must upgrade to the corresponding BDS version at the same time.

*Applies to: All current versions (troubleshooting approach). Not confirmed against the source code or the documentation: treat it as a pointer.*

### LeviLamina prints an error related to `bedrock-runtime-data` at startup (everything else works). What is the cause?

The `bedrock-runtime-data` version is too old and does not match the current LeviLamina. Each LeviLamina version depends on a specific version of `bedrock-runtime-data` (which differs between server and client), so update it as well when installing manually. Installing or updating LeviLamina with lip installs the matching version automatically.

### A mod under LeviLamina (such as GMLIB) installed with lip fails to load and reports that the manifest may be wrong. What should I check?

A load failure is usually caused by missing mod files or an issue in `manifest.json`. In `manifest.json`, `entry` must match the actual DLL file name, and the mod's folder name under `mods` must match `name` in `manifest.json`; otherwise, the mod cannot be loaded. To troubleshoot, keep only that prerequisite and a single mod that depends on it, and load them one by one to rule out conflicts with other mods (in the reported case, another plugin turned out to be the conflict).

### LeviLamina reports at startup that its own player information database (LevelDB) cannot be opened. How do I fix it?

Leftover data or an abnormal shutdown has usually left the `CURRENT` file in the LevelDB directory pointing to a MANIFEST that does not exist. In current versions, the database is at `mods/LeviLamina/data/playerinfo` (or `plugins/LeviLamina/data/playerdata` in old versions). To fix it, open `CURRENT` in that directory with Notepad and change its content to the name of a `MANIFEST-xxxxxx` file that actually exists in the directory. Alternatively, delete the database directory (you will lose the player UUID/XUID/name mappings that LeviLamina recorded, which are recorded again while the server runs).

*Applies to: LeviLamina 1.x and later (path is `mods/LeviLamina/data/playerinfo`)*

### LeviLamina reports an error at startup because the `bedrock-runtime-data` version is too old. How do I fix it, and do I need to upgrade BDS?

The `bedrock_runtime_data` data in the server root directory does not match the current LeviLamina. This is not a problem with BDS itself (the BDS version only needs to match what LeviLamina requires). `bedrock-runtime-data` is a lip dependency of LeviLamina with an exact pinned version. Set up the game and loader again with lip to install the matching version automatically—for example, `lip setup --game 1.26.60 --loader levilamina@26.60.8` (note that in current lip versions, `lip update` refuses to operate on LeviLamina/BDS and tells you to use `lip setup` instead). You can also download the version required by LeviLamina's `lip.toml` from the releases at <https://github.com/LiteLDev/bedrock-runtime-data> and replace the `bedrock_runtime_data` folder in the root directory.

*Applies to: All current versions (LeviLamina 26.60.8 depends on bedrock-runtime-data 26.60.6-server.16)*

### A mod cannot load when LeviLamina starts and reports a missing dependency (`... is missing` / `missing module`). What does it mean?

It means what it says: either a dependency mod declared by the mod is not installed (`xxx will not be loaded because dependency yyy is missing`), or a DLL or symbol that the mod's DLL depends on does not exist (`missing module` / `missing content`). Install the mod with lip to pull in dependencies automatically (`lip install <package>`), or manually install the missing dependency mod or runtime. For missing content (missing symbols), the mod usually does not match the current LeviLamina or BDS version.

### What does the LeviLamina log message `LOG FILE SINK: failed to archive ./logs/latest.log as ./logs\2026-10-28.log: The process cannot access the file because it is being used by another process., continuing in the new file` mean?

When archiving the log by date (renaming `latest.log` to a dated file), another process was using the file, so the rename failed. LeviLamina continues writing to a new log file instead, and the server is not affected. Check whether another program (such as a log viewer, a panel, or another server instance) has `logs/latest.log` open.

*Applies to: Current LeviLamina 26.x versions*

### A LeviLamina server crashes as soon as a player joins (with a trace log and minidump). What is the cause?

In this case, the crash log pointed to the third-party plugin GMSidebar. Removing it restored normal operation; a permanent fix requires contacting the plugin author. In general, check the faulting module in the trace log generated by CrashLogger to identify the offending plugin, then remove or update it.

*Applies to: Servers with GMSidebar installed (versions around July 2026). Not confirmed against the source code or the documentation: treat it as a pointer.*

### On a LeviLamina server, players cannot place blocks continuously, blocks are "swallowed" and walking rubber-bands, while vanilla BDS has no problem. What could be the cause?

A plugin is most likely the cause; remove your plugins one at a time to find the culprit. In this case, deleting the third-party plugin bcbk solved the problem. Also check `server.properties` to see whether any settings related to server-authoritative movement (such as `server-authoritative-movement`) have been changed.

*Applies to: All current versions (troubleshooting approach). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server crashes after loading FAC (a native dll injected directly, not loaded through LL). What is the cause and how do I fix it?

LeviLamina replaces the global memory allocator (memory operator) of BDS with mimalloc. A native DLL injected directly rather than loaded through LeviLamina will crash the server if it allocates and frees memory shared with BDS/LL without using LL's memory operator. To fix this, use a version that loads as a LeviLamina mod, or ask the author to adapt it. The maintainers have noted that you can use a special build that does not replace the memory allocator, though doing so lowers overall performance.

*Applies to: LeviLamina 0.13.x to present (the allocator replacement is still in place). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server has both TickGuard and GMLib installed, and the server "crashes" without any log (it freezes). What is the cause?

This freeze is caused by a conflict between TickGuard and GMLib. When the server lags, TickGuard clears expired scheduled ticks (pt), but GMLib still assumes they exist, triggering an access violation. To fix it, uninstall TickGuard and wait for the author to release a compatibility fix.

*Applies to: Servers with both TickGuard and GMLib installed (versions around September 2026). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server fails to start with `Could not load server.properties file`, although `server.properties` clearly exists. What is going on?

This usually happens when you start the server through a panel or third-party "launcher" whose working directory (start directory) is not the BDS root directory, preventing BDS from finding `server.properties`. Check your start script (such as `start.cmd`) or panel configuration and make sure `bedrock_server_mod.exe` runs with the server folder as its working directory. Alternatively, run `lip run` from inside the server folder.

*Applies to: All current versions (depends on how and where the server is started). Not confirmed against the source code or the documentation: treat it as a pointer.*

### After a LeviLamina server is updated to the latest version, players cannot join (connection fails). What could be the cause?

Newer versions of Bedrock Edition use the NetherNet transport, which uses `server-udp-ports` (default 19132, UDP) in addition to `server-port` (default 19132, TCP and UDP). If the server is behind NAT (using port mapping, a provider-assigned port, or tunneling), follow the official tutorial to configure it: open both TCP and UDP ports; if STUN fails to detect the public IP (causing the client to report the error code `Door`), specify the public address manually in the format `<public IP>:<external port>:<local port>`; if the port is assigned by your provider or you use a tunneling tool such as frp, disable LeviLamina's NetherNet patch in the `targeted` section of `mods/LeviLamina/config/Config.json`. Tutorial: <https://levimc.org/tutorials/server/let-friends-join/>

*Applies to: LeviLamina 26.x (BDS 1.26.60 and other versions that use NetherNet)*

### On a LeviLamina server, after a player clicks "Download required resource packs and join" it stays stuck on locating the server and finally times out; the console also warns that addon data "exceeds the threshold". What should I do?

The "exceeds the threshold" message is just a warning that the addon stores too much data; it does not cause crashes and can be ignored. To fix the stuck resource pack download, either install GMEssentials (gme) and set `resource_pack_download_fix` to `true` in its configuration, or install the CoResourcePack plugin (<https://www.minebbs.com/resources/coresourcepack.16185/>).

*Applies to: LeviLamina 26.x, GMEssentials v26.60.0, and other versions compatible with the current release*

### A LeviLamina server crashes while running and the trace log shows the world (`world/db`) is in use. What is the cause?

The world files are already in use. This commonly happens when the same server (using the same world directory) is started twice, or when the previous process did not exit completely and still holds the world. Check for a leftover `bedrock_server_mod.exe` process, end it, and restart the server.

*Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server crashes frequently and the crash log shows the crash happens while handling `ItemStackRequestPacket`. Is an addon the cause?

This crash happens in the network layer while handling `ItemStackRequestPacket` and is unrelated to addons. It first appeared in June 2026 and reports increased in August; it is suspected to be a crash exploit in which a cheat client sends malicious packets.

*Applies to: LeviLamina/BDS versions from mid-2026 onward. Not confirmed against the source code or the documentation: treat it as a pointer.*

### The console of a LeviLamina server does not display Chinese and shows no LeviLamina or mod loading logs, yet the server can be joined and responds to motd queries. What is going on?

LeviLamina did not load properly, so the server is actually running vanilla BDS (which is why you can join and query the motd, but see no LL or mod loading logs). First, make sure you started the `bedrock_server_mod.exe` generated by PeEditor during installation (PreLoader loads LeviLamina into it), not the vanilla `bedrock_server.exe`. Then scroll to the top of the console log, look for errors during the PreLoader/LeviLamina loading stage (such as error codes 126/127/1114), and fix them accordingly.

*Applies to: All current LeviLamina server versions*

### A dimension of a LeviLamina server has a huge number of entities piled up (for example hundreds of thousands of wither skulls or sand duper drops), so the server freezes or runs out of memory as soon as the chunks load and you cannot get in to run `kill`. How do I clean them up?

Instead of waiting for the chunks to load to run `kill`, clean up the entities offline. You can use a third-party plugin that supports offline entity cleanup, such as Cleaner; download a version that matches your LeviLamina/BDS version from the GitHub release (since MineBBS may host an outdated version). Alternatively, write a one-off mod that walks the world at server startup, deletes the specified entities by dimension or coordinate range, and can be uninstalled afterward. If you can still enter the world, you can also run a command such as `execute in the_end run kill @e[...]` in a looping command block.

*Applies to: General approach; third-party plugins must match the current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### When starting a LeviLamina server, the console says another BDS process with the same path was detected (showing a PID) and asks whether to terminate it. What does this mean and what should I choose?

LeviLamina detected that another BDS process (`bedrock_server.exe` / `bedrock_server_mod.exe`) from the same path is already running, holding the port and the world. The prompt reads `Do you want to terminate the process with PID xxx? (y=Yes, n=No, e=Exit)`: enter `y` to end the old process and continue starting, `n` to leave it running and continue starting, or `e` to abort startup. Usually you should choose `y`, or close the other BDS window manually first. You can disable this check with `checkRunningBDS` in the LeviLamina configuration (enabled by default); it is skipped automatically when there is no console input (for example, when running as a service).

*Applies to: Current LeviLamina server versions*

### After installing LeviLamina on the client (with no mods), an error pops up as soon as the game starts, and the game runs normally after removing LeviLamina. How do I fix it?

Most likely your VC++ runtime (vcredist) is outdated: LeviLamina uses modern C++ features and requires a recent runtime (typically failing with error code 1114). Download and install the latest version from Microsoft: <https://aka.ms/vc14/vc_redist.x64.exe> (avoid third-party runtime bundles, which may be outdated). If the installer says it is already installed, choose Repair, or uninstall the existing version first and then install the new one. If you use LeviLauncher, it checks the desktop VC++ runtime (x64) for the native mod loader and prompts you to install it.

*Applies to: All current LeviLamina versions (client and server)*

### A LeviLamina server prints a yellow warning `AuthHelper could not find cert` at startup. Do I need to do anything?

This message comes from Mojang/vanilla BDS itself. It does not affect the server and can be ignored.

*Applies to: Vanilla BDS behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### The server crashes and the trace shows `LeviLamina.dll -> ll::event::player::PlayerInteractBlockEventHook::detour [PlayerInteractBlockEvent.cpp]`. Is it a LeviLamina problem?

This hook is placed on `GameMode::$useItemOn`: it publishes `PlayerInteractBlockEvent` first, then calls the original function if the event is not canceled. When the stack stops here, the crash usually happened during event dispatch (in a callback from a mod or plugin subscribed to `PlayerInteractBlockEvent`) or in the original function chain called afterward (another mod's hook on the same function, or the game itself). It is generally not a problem in LL itself. Provide the full trace log and minidump, and check each plugin that listens to the player-interact-block event or hooks item use and interaction logic.

*Applies to: LeviLamina 1.x and later*

### After the server steps on a "wrong block" (an unknown block left by a removed mod/addon), it freezes within seconds and the log says BDS crashed. How do I remove these unknown blocks?

Unknown blocks can freeze or crash the server. You can install CleanerUnknownBlock, a native LeviLamina mod from a community developer; add it and restart the server to remove unknown blocks automatically. Alternatively, use an offline world editor such as Chunker to replace the invalid blocks with air, or delete the affected chunks so they regenerate (back up the world first).

*Applies to: Depends on the third-party mod CleanerUnknownBlock supporting the current version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### The server shows no errors, but the client reports a corrupted packet/disconnects, and the server and client versions are the same. How do I troubleshoot?

Remove all plugins, then re-enable them one by one to find the faulty plugin (in the reported case, the AntiXray fake-ore plugin was the cause). Common causes of corrupted packets include a plugin sending packets from a non-main thread or across multiple threads, a protocol conversion plugin such as Glacie converting the packet format incorrectly, or a plugin writing a `BinaryStream` in the wrong format.

*Applies to: All current versions (third-party plugin problem). Not confirmed against the source code or the documentation: treat it as a pointer.*

### A licensed client connecting to my LeviLamina server on my own computer (through frp) says "You must be authenticated with Microsoft services", and turning off `online-mode` does not help. How do I fix it?

Check the server machine's system time. In the reported case, the server clock was 6 minutes off from standard time, causing Xbox Live/Microsoft authentication to fail. Synchronize the server's system time to fix the connection (if the client then gets stuck on "locating server", waiting a bit longer usually lets you in).

*Applies to: Vanilla BDS authentication behavior, independent of the LeviLamina version. Not confirmed against the source code or the documentation: treat it as a pointer.*

### A LeviLamina server fails to start with an error (after updating plugins or manually mixing components). What could be the cause?

This startup error occurs when the PreLoader version, the `bedrock-runtime-data` version, or the BDS version does not match the current LeviLamina version; manually mixing components from different versions can also cause it. Make sure all three versions match, and use lip to install or update them together: run `lip install LeviLamina` (equivalent to `lip install github.com/LiteLDev/LeviLamina`, which runs as a setup and installs the latest LeviLamina along with the latest BDS it supports) or `lip setup --game <BDS version>` (which automatically selects the latest LeviLamina that supports that BDS version). lip installs matching versions of PreLoader, `bedrock-runtime-data`, and other components based on the dependencies declared in LeviLamina's `lip.toml`.

*Applies to: All current LeviLamina versions (server)*

## Crash logs (CrashLogger)

### LeviLamina reports `ERROR [CrashLogger] Couldn't Create CrashLogger Daemon Process` at startup and throws `std::system_error` `[0x00000002:system] 系统找不到指定的文件` (The system cannot find the file specified) (or says CrashLogger / `crashlogger.exe` is missing). What does it mean, and how do I install CrashLogger?

LeviLamina cannot find the external CrashLogger daemon (`CrashLogger.exe`). This commonly happens with manual installs, incomplete files, or pre-built server packs and bundles (where antivirus software deleted the exe during extraction). The error does not stop the server: if LeviLamina fails to start the daemon, it automatically falls back to the built-in CrashLogger. Because the built-in mode captures crashes in-process, it is less reliable and provides less information than the external version. To fix this:

1. Ideally, install or reinstall LeviLamina with lip (run `lip install github.com/LiteLDev/LeviLamina` in an existing server workspace; for a new server, run `lip setup --game <BDS version>`, which includes LeviLamina by default on Windows). CrashLogger is a dependency of LeviLamina and installs automatically. The official documentation no longer covers manual installation.
2. Add the file manually: download `CrashLogger-windows-x64.zip` from <https://github.com/LiteLDev/CrashLogger/releases> and place `CrashLogger.exe` at `mods/LeviLamina/CrashLogger.exe` in the server directory (older versions used `plugins/LeviLamina`, which is now `mods`). You can also set its relative path in `modules.crashLogger.externalpath` in `mods/LeviLamina/config/Config.json`.
3. To skip the external version and use the built-in CrashLogger directly, set `modules.crashLogger.builtin` to `true` in the same config file. Setting `modules.crashLogger.enabled` to `false` disables CrashLogger completely, so no crash log is generated on a crash.

*Applies to: LeviLamina 26.60.x (mods directory layout); CrashLogger 1.4.x*

### After a LeviLamina server crashes (the console just closes or shows nothing), where are the crash log and the dmp file? What should I send when asking for help?

CrashLogger saves them to `./logs/crash/` under the server root directory (the directory containing `bedrock_server_mod.exe`). The file names include the crash timestamp, such as `trace_2026-11-13_23-30-29.log` and `minidump_2026-11-13_23-30-29.dmp`. When asking for help, send both files—the trace log is the more useful of the two, as it contains the call stack, module list, registers, and memory information. Vanilla BDS does not have this feature. Note that no crash log is generated if the process is killed (for example, from Task Manager or by a power loss), or if the crash occurs before CrashLogger initializes or while it is disabled. A common cause of crashes is a plugin version that does not match the LeviLamina or BDS version; switch to a plugin version that matches your server.

*Applies to: LeviLamina, all current versions (external and built-in CrashLogger both write to logs/crash)*

### How do I read the `trace_xxx.log` and `minidump_xxx.dmp` that a crash generates? How can I tell which plugin caused it?

Check the Stacktrace call stack in the trace log first and look for modules that are neither BDS itself (`bedrock_server_mod.exe`) nor system DLLs. For example, if the stack contains `vanish.dll -> PlayerInteractBlockHook::detour+0xA4 [Hook.cpp:846L]`, the crash occurred inside a hook in the vanish plugin; contact that plugin's author or remove the plugin. For deeper analysis, open `minidump_xxx.dmp` in WinDbg and run `!analyze -v` to inspect the exception and crash stack (this works best if you configure the PDB symbol path for the relevant modules).

*Applies to: LeviLamina + CrashLogger, all current versions*

### The minidump `.dmp` file that CrashLogger generates after a BDS crash is 0 B and cannot be analyzed. What can I do?

A 0 B file means the dump could not be written during the crash, which is common with severe crashes such as running out of memory. First, check whether the `trace_*.log` file in the same directory contains a call stack and Memory Info. If you need a full dump, attach Sysinternals procdump to the `bedrock_server_mod.exe` process (for example, `procdump -e -ma <pid>`) to capture and analyze a full dmp. Note that if the external CrashLogger is already attached to the process as a debugger, procdump's exception monitoring may fail to attach. If that happens, disable CrashLogger first (`modules.crashLogger.enabled=false`) or terminate the CrashLogger process.

*Applies to: LeviLamina, current version (procdump is a third-party tool). Not confirmed against the source code or the documentation: treat it as a pointer.*

### My LeviLamina server crashed and there is no CrashLogger crash log. Is the built-in crash capture enough on its own?

Install the external CrashLogger (<https://github.com/LiteLDev/CrashLogger>). When you install LeviLamina with lip, it is installed automatically as a dependency at `mods/LeviLamina/CrashLogger.exe`. Manual installs and server packs often omit this component, which is one reason lip is officially recommended (its modular design makes missing components less likely). LeviLamina's built-in CrashLogger now also writes `trace_*.log` and `minidump_*.dmp` under `logs/crash`, but because it runs inside the crashing process, a severe crash (such as a stack overflow or heap corruption) may prevent it from writing the files or leave them incomplete. The external version attaches from a separate process as a debugger, making it more reliable and its output more complete.

*Applies to: LeviLamina, current version*

### My LeviLamina server crashes frequently. The CrashLogger log only shows `Code: 0xC0000409` and `Module: ucrtbase.dll`, and the stack is all hexadecimal addresses. How do I find the cause?

`0xC0000409` in `ucrtbase.dll` usually means a mod triggered an abort or fast-fail (for example, an uncaught exception or `std::terminate`), not a bug in ucrtbase itself. Place the `.pdb` symbol files for the relevant mods next to their DLLs (any subdirectory of the server directory works). The external CrashLogger recursively scans the server directory and loads these PDB files, resolving the stack trace to function names and source line numbers so you can identify the faulty mod. You can also remove mods one by one to isolate the crash by elimination.

*Applies to: LeviLamina, all current versions (external CrashLogger 1.x)*

### When a LeviLamina server running under wine (a panel host) crashes, CrashLogger cannot output a valid stack (it cannot read the pdb / a module is missing). What should I do?

A Wine bug may prevent the external CrashLogger from reading the PDB, or the Wine environment may be incomplete and missing the DLLs that CrashLogger needs (`dbghelp.dll` / `symsrv.dll`). In the LeviLamina config file `mods/LeviLamina/config/Config.json` (`plugins/LeviLamina/config/Config.json` on older installs), set `modules.crashLogger.builtin` to `true` to switch to the built-in CrashLogger, then wait for the crash to happen again:

```json
"modules": {
  "crashLogger": {
    "enabled": true,
    "builtin": true
  }
}
```

Also, a crash about a minute after joining the server is usually caused by a mod that is incompatible with the current version. If a fresh install without mods does not crash, a mod is the cause; find and remove the incompatible mods.

*Applies to: LeviLamina, current version (wine/Linux panel environments)*

## PreLoader and PeEditor

### When starting BDS, PreLoader reports `Can't load ./plugins/LeviLamina\LeviLamina.dll`, `Error code: 127` and "找不到指定的程序" (the specified procedure could not be found). How do I fix it?

Error code 127 means a function or version required by LeviLamina or a mod does not match (the specified procedure entry point could not be found). Check the following in order:

1. Make sure the LeviLamina version strictly matches the BDS version (installing or switching with lip is recommended: `lip setup --game <BDS version>` automatically selects the matching LeviLamina, PreLoader, and PeEditor), and check the dependency diagnostic (`Dependency diagnostic`) printed by PreLoader to see which dependency has the wrong version.
2. Download and install the latest VC++ runtime from Microsoft (<https://aka.ms/vc14/vc_redist.x64.exe>), not from a third-party server pack, then restart.
3. Check the operating system version. The maintainers explicitly state that LeviLamina does not support Windows Server 2016; it requires at least Windows Server 2019 (or a recent Windows 10/11). An older OS lacks the required system functions and fails with error 127. On a cloud server, you can reinstall Server 2019/2022 from the control panel; if reinstalling is not practical, use a virtual machine, or switch to Linux and let lip run the Windows build of BDS under Wine.

*Applies to: all current LeviLamina versions (BDS for Windows)*

### When starting `bedrock_server_mod.exe`, PreLoader reports `Can't load LeviLamina.dll, Error code: 126` and then crashes. What is the cause?

Error code 126 means a DLL required by LeviLamina or a mod is missing (the specified module cannot be found). After reporting the error, PreLoader prints a dependency diagnostic (`Dependency diagnostic` / `Analyzing dependency`). Wait for this output and check which file is actually missing.

Common causes: LeviLamina or its dependencies are not completely installed (for example, PreLoader, PeEditor, CrashLogger, or bedrock-runtime-data do not match the LeviLamina version or are missing), or the VC++ runtime is missing.

Solution: Reinstall LeviLamina using lip on a clean BDS (lip automatically fetches matching dependency versions), then re-add your other mods and copy your worlds over. Also, install the latest VC++ runtime from <https://aka.ms/vc14/vc_redist.x64.exe>. If the error occurs only occasionally and a restart fixes it, the cause is most likely environmental, such as locked files or antivirus interference.

*Applies to: all current LeviLamina versions (BDS for Windows)*

### My LeviLamina server suddenly won't start, and I found that `PreLoader.dll` was deleted by Windows Defender as a virus. What should I do?

This is an antivirus false positive (which the project has reported to Microsoft). Restore the file from quarantine or reinstall `PreLoader.dll` (for example, by running `lip install github.com/LiteLDev/LeviLamina` or `lip install github.com/LiteLDev/PreLoader` again), and add the server directory to your Windows Defender exclusions.

On Windows Server, Windows Defender is a server feature that you can remove in Server Manager. (Note that installing another antivirus on Windows Server does not automatically disable Defender by default.)

*Applies to: all current versions (Windows)*

### After updating vcredist, a game/server with LeviLamina installed still fails to start. How can I debug it further?

Download x64dbg, set the `PL_DEBUG=1` environment variable, and start the game or server. After loading the Runtime Data, PreLoader prints `PL_DEBUG is set to 1, waiting for debugger to attach...` and pauses. At that point, open x64dbg, click "File -> Attach", and double-click the MC (or `bedrock_server_mod`) process to debug it.

Do not launch the process directly from the debugger, as this can cause the Runtime Data to fail to load. If PreLoader cannot start at all (meaning the process does not appear), the issue may be with your operating system (such as a stripped-down or unofficial Windows build); check your Windows version.

*Applies to: current PreLoader (1.16.x)*
